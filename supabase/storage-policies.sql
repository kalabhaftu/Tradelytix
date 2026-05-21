-- Supabase Storage hardening policy draft for Tradelytix.
--
-- IMPORTANT:
-- The application currently stores public Supabase URLs for trade images and
-- feedback attachments. Do not make these buckets private in production until
-- the application has migrated reads to owner-checked signed URLs or object
-- references. This file documents the target RLS posture to apply alongside
-- that migration.
--
-- Assumption for these policies:
-- storage object paths begin with the authenticated Supabase user id:
--   <auth.uid()>/<optional folders>/<file>
-- If paths continue to use the Prisma/internal User.id instead, add a mapping
-- table from auth.uid() to internal user id and adjust the path predicate.

alter table storage.objects enable row level security;

-- Users may read their own trade images only.
create policy "Users can read own trade images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'trade-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users may upload trade images only under their own prefix.
create policy "Users can upload own trade images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'trade-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users may update/delete only their own trade images.
create policy "Users can update own trade images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'trade-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'trade-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own trade images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'trade-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Feedback attachments should follow the same owner-prefix model unless they
-- are intentionally support/admin-only. Service-role clients bypass RLS for
-- admin review and cleanup.
create policy "Users can read own feedback attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'feedback-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can upload own feedback attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'feedback-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own feedback attachments"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'feedback-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'feedback-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own feedback attachments"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'feedback-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);
