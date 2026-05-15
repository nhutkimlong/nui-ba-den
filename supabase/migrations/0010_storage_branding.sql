-- 0010_storage_branding.sql
-- Public bucket for branding assets (logo, hero, banner) — admin-uploaded.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('branding', 'branding', true, 10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'])
on conflict (id) do nothing;

drop policy if exists "branding_public_read" on storage.objects;
create policy "branding_public_read"
on storage.objects for select
to public
using (bucket_id = 'branding');
