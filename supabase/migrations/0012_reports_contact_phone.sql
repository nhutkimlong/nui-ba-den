-- 0012: optional reporter phone shared via Zalo getPhoneNumber.
-- Only stored when reporter explicitly opts in on the form. Populated from
-- the encrypted token returned by zmp-sdk getPhoneNumber, decrypted via
-- Zalo Graph API on the backend.

alter table public.reports
  add column if not exists contact_phone text;

comment on column public.reports.contact_phone is
  'Optional contact phone shared by reporter via Zalo getPhoneNumber. Only stored when user explicitly opts in.';
