import { Body, Controller, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminAuthGuard, AdminRequest } from './admin-auth.guard';
import { writeAuditLog } from './audit';
import { getSupabase } from './supabase';

interface ModerationDecisionBody {
  decision: 'approved' | 'rejected' | 'escalated';
  notes?: string;
}

@UseGuards(AdminAuthGuard)
@Controller('admin')
export class AdminGovernanceController {
  // ---------- Audit logs ----------
  @Get('audit-logs')
  async listAudit(
    @Query('entityType') entityType?: string,
    @Query('actorId') actorId?: string,
    @Query('limit') limitParam?: string,
  ) {
    const sb = getSupabase();
    const limit = Math.min(Math.max(Number(limitParam) || 100, 1), 500);
    let q = sb
      .from('audit_logs')
      .select(
        'id, actor_admin_id, actor_role, entity_type, entity_id, action, before_snapshot, after_snapshot, ip, user_agent, created_at, admin_users:actor_admin_id(email, display_name)',
      )
      .order('created_at', { ascending: false })
      .limit(limit);
    if (entityType) q = q.eq('entity_type', entityType);
    if (actorId) q = q.eq('actor_admin_id', actorId);
    const { data, error } = await q;
    if (error) return { items: [], error: error.message };
    return { items: data ?? [] };
  }

  // ---------- Moderation queue ----------
  @Get('moderation')
  async listModeration(@Query('decision') decision?: string) {
    const sb = getSupabase();
    let q = sb
      .from('moderation_queue')
      .select(
        'id, target_type, target_id, flag_reason, severity, decision, reviewer_admin_id, decided_at, notes, created_at, updated_at',
      )
      .order('created_at', { ascending: false })
      .limit(200);
    if (decision) q = q.eq('decision', decision);
    else q = q.eq('decision', 'pending');
    const { data, error } = await q;
    if (error) return { items: [], error: error.message };
    return { items: data ?? [] };
  }

  @Put('moderation/:id')
  async decideModeration(
    @Param('id') id: string,
    @Body() body: ModerationDecisionBody,
    @Req() req: AdminRequest,
  ) {
    const sb = getSupabase();
    const { data: before } = await sb
      .from('moderation_queue')
      .select('decision, notes')
      .eq('id', id)
      .maybeSingle();
    const { data, error } = await sb
      .from('moderation_queue')
      .update({
        decision: body.decision,
        notes: body.notes ?? null,
        reviewer_admin_id: req.admin?.adminUserId ?? null,
        decided_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, target_type, target_id, decision')
      .maybeSingle();
    if (error || !data) return { error: error?.message ?? 'not_found' };

    await writeAuditLog({
      actor: req.admin,
      entityType: 'moderation_queue',
      entityId: id,
      action: 'status_change',
      before,
      after: data,
      ip: clientIp(req),
      userAgent: (req.headers['user-agent'] as string) ?? null,
    });

    return { ok: true, ...data };
  }

  // ---------- Retention policies (read/update is admin-only operational config) ----------
  @Get('retention')
  async listRetention() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('retention_policies')
      .select('id, scope, retention_days, is_active, notes, updated_at')
      .order('scope');
    if (error) return { items: [], error: error.message };
    return { items: data ?? [] };
  }

  @Put('retention/:scope')
  async updateRetention(
    @Param('scope') scope: string,
    @Body() body: { retentionDays: number | null; isActive: boolean; notes?: string },
    @Req() req: AdminRequest,
  ) {
    const sb = getSupabase();
    const { data: before } = await sb
      .from('retention_policies')
      .select('retention_days, is_active, notes')
      .eq('scope', scope)
      .maybeSingle();
    const { data, error } = await sb
      .from('retention_policies')
      .update({
        retention_days: body.retentionDays ?? null,
        is_active: body.isActive,
        notes: body.notes ?? null,
      })
      .eq('scope', scope)
      .select('scope, retention_days, is_active, notes')
      .maybeSingle();
    if (error || !data) return { error: error?.message ?? 'not_found' };

    await writeAuditLog({
      actor: req.admin,
      entityType: 'retention_policies',
      entityId: scope,
      action: 'update',
      before,
      after: data,
      ip: clientIp(req),
      userAgent: (req.headers['user-agent'] as string) ?? null,
    });
    return { ok: true, ...data };
  }
}

function clientIp(req: Request): string | null {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string') return xf.split(',')[0]!.trim();
  return req.socket?.remoteAddress ?? null;
}
