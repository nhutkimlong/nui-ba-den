/**
 * One-off bootstrap: create initial super_admin user with bcrypt password.
 * Usage: pnpm --filter api bootstrap:admin -- <email> <password>
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as bcrypt from 'bcryptjs';
import { getSupabase } from './supabase';

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const full = resolve(process.cwd(), file);
    if (existsSync(full)) {
      try {
        process.loadEnvFile(full);
      } catch {
        // ignore
      }
    }
  }
}

async function main() {
  loadEnv();
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error('usage: bootstrap-admin <email> <password>');
    process.exit(1);
  }

  const sb = getSupabase();
  const password_hash = await bcrypt.hash(password, 12);

  const { data: existing } = await sb
    .from('admin_users')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  let adminId: string;
  if (existing) {
    const { error } = await sb
      .from('admin_users')
      .update({ password_hash, is_active: true })
      .eq('id', existing.id);
    if (error) throw error;
    adminId = existing.id;
    console.log(`updated admin ${email}`);
  } else {
    const { data, error } = await sb
      .from('admin_users')
      .insert({ email: email.toLowerCase(), password_hash, display_name: email })
      .select('id')
      .single();
    if (error) throw error;
    adminId = data.id;
    console.log(`created admin ${email}`);
  }

  const { data: role } = await sb
    .from('admin_roles')
    .select('id')
    .eq('code', 'super_admin')
    .maybeSingle();
  if (role) {
    await sb
      .from('admin_role_bindings')
      .upsert({ admin_user_id: adminId, role_id: role.id });
    console.log('granted super_admin');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
