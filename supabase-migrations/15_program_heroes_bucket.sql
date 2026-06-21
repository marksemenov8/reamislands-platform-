-- ============================================================
-- DIT — public storage bucket for program hero images
-- Uploaded from /admin/programs/[id]/edit via service-role API.
-- Public reads (anyone can view URLs). Writes through service-role only.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'program-heroes',
  'program-heroes',
  true,
  5242880,                        -- 5 MB
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
