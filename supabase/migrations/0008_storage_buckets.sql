-- 0008_storage_buckets.sql
-- Storage buckets for POI media (public) and report attachments (private).
-- File size limits and MIME allow-lists chosen for MVP; can be relaxed later.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('poi-media',
   'poi-media',
   true,
   10485760,  -- 10 MB
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('report-attachments',
   'report-attachments',
   false,
   25165824,  -- 24 MB
   array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'video/mp4', 'video/quicktime', 'application/pdf'])
on conflict (id) do nothing;

-- ============================================================
-- poi-media: public read; writes via service role only.
-- ============================================================

drop policy if exists "poi_media_public_read" on storage.objects;
create policy "poi_media_public_read"
on storage.objects for select
to public
using (bucket_id = 'poi-media');

-- ============================================================
-- report-attachments: reporter can upload to their own folder
-- and read their own attachments. Folder convention: <user_id>/...
-- ============================================================

drop policy if exists "report_attachments_self_read" on storage.objects;
create policy "report_attachments_self_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'report-attachments'
  and exists (
    select 1
    from public.app_users u
    where u.auth_user_id = (select auth.uid())
      and (storage.foldername(name))[1] = u.id::text
  )
);

drop policy if exists "report_attachments_self_insert" on storage.objects;
create policy "report_attachments_self_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'report-attachments'
  and exists (
    select 1
    from public.app_users u
    where u.auth_user_id = (select auth.uid())
      and (storage.foldername(name))[1] = u.id::text
  )
);
