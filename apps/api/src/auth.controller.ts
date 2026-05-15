import { Body, Controller, Get, Headers, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { generateOauthState, hashToken, issueSession, parseBearer } from './auth-utils';
import { getSupabase } from './supabase';

interface ZaloUserInfo {
  id: string;
  name?: string;
  picture?: { data?: { url?: string } };
}

interface MiniAppLoginBody {
  accessToken: string;
  preferredLocale?: 'vi' | 'en';
  // Optional client-side ZMP getUserInfo() fallback when Graph API doesn't return picture/name
  zmpUser?: { id?: string; name?: string; avatar?: string | null };
}

@Controller('auth/zalo')
export class AuthController {
  // Step 1: miniapp redirects user here. We mint state+verifier, save, then redirect to Zalo.
  @Get('start')
  async start(
    @Query('redirect_uri') redirectUri: string | undefined,
    @Res() res: Response,
  ) {
    const appId = process.env.ZALO_APP_ID;
    const callback = process.env.ZALO_REDIRECT_URI;
    if (!appId || !callback) {
      return res.status(500).json({ error: 'zalo_not_configured' });
    }
    const finalRedirect = redirectUri ?? '/';

    const { state, verifier, challenge } = generateOauthState();
    const sb = getSupabase();
    await sb.from('zalo_oauth_states').insert({
      state,
      code_verifier: verifier,
      redirect_uri: finalRedirect,
    });

    const url = new URL('https://oauth.zaloapp.com/v4/permission');
    url.searchParams.set('app_id', appId);
    url.searchParams.set('redirect_uri', callback);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('state', state);
    return res.redirect(url.toString());
  }

  // Step 2: Zalo redirects back with code+state. We exchange code → access_token → userinfo.
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!code || !state) return res.status(400).json({ error: 'missing_code_state' });
    const sb = getSupabase();

    const { data: stored } = await sb
      .from('zalo_oauth_states')
      .select('code_verifier, redirect_uri, expires_at')
      .eq('state', state)
      .maybeSingle();
    if (!stored) return res.status(400).json({ error: 'invalid_state' });
    await sb.from('zalo_oauth_states').delete().eq('state', state);
    if (new Date(stored.expires_at) < new Date()) {
      return res.status(400).json({ error: 'state_expired' });
    }

    const appId = process.env.ZALO_APP_ID!;
    const secret = process.env.ZALO_APP_SECRET!;
    const tokenRes = await fetch('https://oauth.zaloapp.com/v4/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        secret_key: secret,
      },
      body: new URLSearchParams({
        app_id: appId,
        code,
        grant_type: 'authorization_code',
        code_verifier: stored.code_verifier,
      }).toString(),
    });
    const tokenJson = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!tokenJson.access_token) {
      return res
        .status(400)
        .json({ error: 'token_exchange_failed', detail: tokenJson.error_description });
    }

    const userRes = await fetch(
      'https://graph.zalo.me/v2.0/me?fields=id,name,picture',
      { headers: { access_token: tokenJson.access_token } },
    );
    const profile = (await userRes.json()) as ZaloUserInfo;
    if (!profile.id) return res.status(502).json({ error: 'zalo_profile_failed' });

    const { data: user } = await sb
      .from('app_users')
      .upsert(
        {
          zalo_user_id: profile.id,
          display_name: profile.name ?? null,
          avatar_url: profile.picture?.data?.url ?? null,
          last_login_at: new Date().toISOString(),
        },
        { onConflict: 'zalo_user_id' },
      )
      .select('id')
      .maybeSingle();
    if (!user) return res.status(500).json({ error: 'user_upsert_failed' });

    const session = issueSession();
    await sb.from('app_sessions').insert({
      user_id: user.id,
      token_hash: session.hash,
      expires_at: session.expiresAt.toISOString(),
      user_agent: req.headers['user-agent'] ?? null,
    });

    const target = new URL(stored.redirect_uri, getMiniappBase(req));
    target.searchParams.set('token', session.token);
    return res.redirect(target.toString());
  }

  @Post('logout')
  async logout(@Headers('authorization') auth?: string) {
    const token = parseBearer(auth);
    if (!token) return { ok: true };
    const sb = getSupabase();
    await sb
      .from('app_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', hashToken(token));
    return { ok: true };
  }

  // Used by ZMP miniapp: client calls zmp-sdk getAccessToken() and posts here.
  // We verify the token against Zalo Graph API, upsert app_users, return our session bearer.
  @Post('miniapp-login')
  async miniappLogin(@Body() body: MiniAppLoginBody, @Req() req: Request) {
    if (!body.accessToken) return { error: 'missing_access_token' };

    const userRes = await fetch(
      'https://graph.zalo.me/v2.0/me?fields=id,name,picture',
      { headers: { access_token: body.accessToken } },
    );
    const profile = (await userRes.json()) as ZaloUserInfo;
    const zaloId = profile.id ?? body.zmpUser?.id;
    if (!zaloId) return { error: 'invalid_access_token' };

    // Prefer Graph API; fall back to ZMP getUserInfo() values posted from client.
    const displayName = profile.name ?? body.zmpUser?.name ?? null;
    const avatarUrl =
      profile.picture?.data?.url ?? body.zmpUser?.avatar ?? null;

    const sb = getSupabase();
    const { data: user } = await sb
      .from('app_users')
      .upsert(
        {
          zalo_user_id: zaloId,
          display_name: displayName,
          avatar_url: avatarUrl,
          preferred_locale: body.preferredLocale ?? 'vi',
          last_login_at: new Date().toISOString(),
        },
        { onConflict: 'zalo_user_id' },
      )
      .select('id, display_name, avatar_url, preferred_locale, zalo_user_id')
      .maybeSingle();
    if (!user) return { error: 'user_upsert_failed' };

    const session = issueSession();
    await sb.from('app_sessions').insert({
      user_id: user.id,
      token_hash: session.hash,
      expires_at: session.expiresAt.toISOString(),
      user_agent: (req.headers['user-agent'] as string) ?? null,
    });

    return {
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      user,
    };
  }

  @Get('me')
  async me(@Headers('authorization') auth?: string) {
    const token = parseBearer(auth);
    if (!token) return { error: 'unauthenticated' };
    const sb = getSupabase();
    const { data } = await sb
      .from('app_sessions')
      .select('user_id, expires_at, revoked_at, app_users:user_id(id, display_name, avatar_url, preferred_locale, zalo_user_id)')
      .eq('token_hash', hashToken(token))
      .maybeSingle();
    if (!data || data.revoked_at || new Date(data.expires_at) < new Date()) {
      return { error: 'unauthenticated' };
    }
    return { user: data.app_users };
  }
}

function getMiniappBase(req: Request): string {
  const origin = process.env.MINIAPP_BASE_URL?.trim();
  if (origin) return origin;
  const host = (req.headers['x-forwarded-host'] ?? req.headers.host ?? '') as string;
  const proto = (req.headers['x-forwarded-proto'] ?? 'https') as string;
  return `${proto}://${host}`;
}
