import { Body, Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { Request } from 'express';
import { hashToken, issueSession } from './auth-utils';
import { AdminAuthGuard, AdminRequest, parseBearer } from './admin-auth.guard';
import { getSupabase } from './supabase';

interface LoginBody {
  email: string;
  password: string;
}

@Controller('admin/auth')
export class AdminAuthController {
  @Post('login')
  async login(@Body() body: LoginBody, @Req() req: Request) {
    const sb = getSupabase();
    const { data: admin } = await sb
      .from('admin_users')
      .select('id, email, password_hash, is_active')
      .eq('email', body.email.toLowerCase().trim())
      .maybeSingle();

    if (!admin || !admin.is_active || !admin.password_hash) {
      return { error: 'invalid_credentials' };
    }
    const ok = await bcrypt.compare(body.password, admin.password_hash);
    if (!ok) return { error: 'invalid_credentials' };

    const session = issueSession();
    await sb.from('admin_sessions').insert({
      admin_user_id: admin.id,
      token_hash: session.hash,
      expires_at: session.expiresAt.toISOString(),
      user_agent: (req.headers['user-agent'] as string) ?? null,
    });
    await sb
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', admin.id);

    return {
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      admin: { id: admin.id, email: admin.email },
    };
  }

  @UseGuards(AdminAuthGuard)
  @Get('me')
  me(@Req() req: AdminRequest) {
    return { admin: req.admin };
  }

  @Post('logout')
  async logout(@Headers('authorization') auth?: string) {
    const token = parseBearer(auth);
    if (!token) return { ok: true };
    const sb = getSupabase();
    await sb
      .from('admin_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', hashToken(token));
    return { ok: true };
  }
}
