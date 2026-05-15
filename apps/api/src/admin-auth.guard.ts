import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { hashToken, parseBearer } from './auth-utils';
import { getSupabase } from './supabase';

export { parseBearer };

export interface AdminContext {
  adminUserId: string;
  email: string;
  roles: string[];
}

export type AdminRequest = Request & { admin?: AdminContext };

@Injectable()
export class AdminAuthGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AdminRequest>();
    const token = parseBearer(req.headers.authorization);
    if (!token) throw new UnauthorizedException('missing_bearer');

    const sb = getSupabase();
    const { data, error } = await sb
      .from('admin_sessions')
      .select(
        'admin_user_id, expires_at, revoked_at, admin_users:admin_user_id(id, email, is_active)',
      )
      .eq('token_hash', hashToken(token))
      .maybeSingle();

    if (error || !data) throw new UnauthorizedException('invalid_token');
    if (data.revoked_at) throw new UnauthorizedException('revoked');
    if (new Date(data.expires_at) < new Date()) throw new UnauthorizedException('expired');

    const admin = (data as any).admin_users;
    if (!admin?.is_active) throw new UnauthorizedException('inactive');

    const { data: roles } = await sb
      .from('admin_role_bindings')
      .select('admin_roles:role_id(code)')
      .eq('admin_user_id', admin.id);

    req.admin = {
      adminUserId: admin.id,
      email: admin.email,
      roles: (roles ?? []).map((r: any) => r.admin_roles?.code).filter(Boolean),
    };
    return true;
  }
}
