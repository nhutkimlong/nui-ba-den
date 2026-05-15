-- 0013: revoke public execute on rls_auto_enable.
-- Was flagged by Supabase advisor: SECURITY DEFINER function should not be
-- callable by anon/authenticated. We only call it via service-role.

revoke execute on function public.rls_auto_enable() from anon, authenticated;
