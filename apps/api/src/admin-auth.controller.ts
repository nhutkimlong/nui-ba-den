import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  InternalServerErrorException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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
    try {
      if (!body?.email || !body?.password) {
        throw new BadRequestException('missing_credentials');
      }

      const sb = getSupabase();
      const { data: admin, error: adminError } = await sb
        .from('admin_users')
        .select('id, email, password_hash, is_active')
        .eq('email', body.email.toLowerCase().trim())
        .maybeSingle();

      if (adminError) throw adminError;
      if (!admin || !admin.is_active || !admin.password_hash) {
        return { error: 'invalid_credentials' };
      }
      const ok = await bcrypt.compare(body.password, admin.password_hash);
      if (!ok) return { error: 'invalid_credentials' };

      const session = issueSession();
      const { error: sessionError } = await sb.from('admin_sessions').insert({
        admin_user_id: admin.id,
        token_hash: session.hash,
        expires_at: session.expiresAt.toISOString(),
        user_agent: (req.headers['user-agent'] as string) ?? null,
      });
      if (sessionError) throw sessionError;

      const { error: updateError } = await sb
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', admin.id);
      if (updateError) throw updateError;

      return {
        token: session.token,
        expiresAt: session.expiresAt.toISOString(),
        admin: { id: admin.id, email: admin.email },
      };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      console.error('admin_login_failed', err);
      throw new InternalServerErrorException('admin_login_failed');
    }
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
