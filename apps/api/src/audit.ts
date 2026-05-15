import { getSupabase } from './supabase';
import type { AdminContext } from './admin-auth.guard';

export interface AuditEvent {
  actor: AdminContext | undefined;
  entityType: string;
  entityId?: string | null;
  action: 'create' | 'update' | 'delete' | 'status_change' | string;
  before?: any;
  after?: any;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Best-effort audit log writer. Errors are swallowed so failures here never break
 * the originating admin action. Service-role writes via getSupabase().
 */
export async function writeAuditLog(evt: AuditEvent): Promise<void> {
  try {
    const sb = getSupabase();
    await sb.from('audit_logs').insert({
      actor_admin_id: evt.actor?.adminUserId ?? null,
      actor_role: evt.actor?.roles?.[0] ?? null,
      entity_type: evt.entityType,
      entity_id: evt.entityId ?? null,
      action: evt.action,
      before_snapshot: evt.before ?? null,
      after_snapshot: evt.after ?? null,
      ip: evt.ip ?? null,
      user_agent: evt.userAgent ?? null,
    });
  } catch {
    // intentional swallow
  }
}
