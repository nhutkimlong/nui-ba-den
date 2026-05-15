import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { Request } from 'express';
import { AdminAuthGuard, AdminRequest } from './admin-auth.guard';
import { writeAuditLog } from './audit';
import { getSupabase } from './supabase';

interface CreateAdminBody {
  email: string;
  password: string;
  displayName?: string;
  roleCodes: string[];
}
interface UpdateAdminBody {
  isActive?: boolean;
  displayName?: string;
  password?: string;
  roleCodes?: string[];
}

@UseGuards(AdminAuthGuard)
@Controller('admin/users')
export class AdminUsersController {
  @Get()
  async list() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('admin_users')
      .select(
        'id, email, display_name, is_active, last_login_at, created_at, admin_role_bindings(admin_roles:role_id(code, name))',
      )
      .order('created_at', { ascending: false });
    if (error) return { items: [], error: error.message };
    return { items: data ?? [] };
  }

  @Get('roles')
  async listRoles() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('admin_roles')
      .select('id, code, name, description')
      .order('code');
    if (error) return { items: [], error: error.message };
    return { items: data ?? [] };
  }

  @Post()
  async create(@Body() body: CreateAdminBody, @Req() req: AdminRequest) {
    const sb = getSupabase();
    const password_hash = await bcrypt.hash(body.password, 12);
    const { data, error } = await sb
      .from('admin_users')
      .insert({
        email: body.email.toLowerCase().trim(),
        display_name: body.displayName ?? body.email,
        password_hash,
        is_active: true,
      })
      .select('id, email')
      .single();
    if (error || !data) return { error: error?.message ?? 'create_failed' };

    await applyRoles(sb, data.id, body.roleCodes ?? []);
    await writeAuditLog({
      actor: req.admin,
      entityType: 'admin_users',
      entityId: data.id,
      action: 'create',
      after: { email: data.email, roles: body.roleCodes },
      ip: clientIp(req),
      userAgent: (req.headers['user-agent'] as string) ?? null,
    });
    return { ok: true, id: data.id };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateAdminBody,
    @Req() req: AdminRequest,
  ) {
    const sb = getSupabase();
    const update: Record<string, any> = {};
    if (body.isActive !== undefined) update.is_active = body.isActive;
    if (body.displayName !== undefined) update.display_name = body.displayName;
    if (body.password) update.password_hash = await bcrypt.hash(body.password, 12);

    if (Object.keys(update).length > 0) {
      const { error } = await sb.from('admin_users').update(update).eq('id', id);
      if (error) return { error: error.message };
    }

    if (body.roleCodes) {
      await sb.from('admin_role_bindings').delete().eq('admin_user_id', id);
      await applyRoles(sb, id, body.roleCodes);
    }

    if (body.password) {
      // Revoke existing sessions when password changes.
      await sb
        .from('admin_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('admin_user_id', id)
        .is('revoked_at', null);
    }

    await writeAuditLog({
      actor: req.admin,
      entityType: 'admin_users',
      entityId: id,
      action: 'update',
      after: {
        ...update,
        roleCodes: body.roleCodes,
        passwordChanged: !!body.password,
      },
      ip: clientIp(req),
      userAgent: (req.headers['user-agent'] as string) ?? null,
    });
    return { ok: true };
  }

  @Delete(':id')
  async deactivate(@Param('id') id: string, @Req() req: AdminRequest) {
    if (id === req.admin?.adminUserId) {
      return { error: 'cannot_disable_self' };
    }
    const sb = getSupabase();
    const { error } = await sb
      .from('admin_users')
      .update({ is_active: false })
      .eq('id', id);
    if (error) return { error: error.message };
    await sb
      .from('admin_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('admin_user_id', id)
      .is('revoked_at', null);
    await writeAuditLog({
      actor: req.admin,
      entityType: 'admin_users',
      entityId: id,
      action: 'delete',
      ip: clientIp(req),
      userAgent: (req.headers['user-agent'] as string) ?? null,
    });
    return { ok: true };
  }
}

async function applyRoles(sb: ReturnType<typeof getSupabase>, adminId: string, codes: string[]) {
  if (codes.length === 0) return;
  const { data: roles } = await sb
    .from('admin_roles')
    .select('id, code')
    .in('code', codes);
  if (!roles?.length) return;
  await sb.from('admin_role_bindings').upsert(
    roles.map((r) => ({ admin_user_id: adminId, role_id: r.id })),
    { onConflict: 'admin_user_id,role_id' },
  );
}

function clientIp(req: Request): string | null {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string') return xf.split(',')[0]!.trim();
  return req.socket?.remoteAddress ?? null;
}
