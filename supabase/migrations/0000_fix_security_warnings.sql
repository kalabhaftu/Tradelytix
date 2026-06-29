-- Fix function search_path and execution permissions
ALTER FUNCTION public.handle_auth_user_deleted_cleanup() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_auth_user_deleted_cleanup() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_auth_user_deleted_cleanup() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_auth_user_deleted_cleanup() FROM authenticated;
-- Optional: if it's currently SECURITY DEFINER, we can leave it as such since we revoked public execution, 
-- or change it to SECURITY INVOKER. Since it's likely a trigger function called by postgres role, DEFINER is okay as long as anon can't execute it.

-- Fix public bucket listing issues by removing the broad SELECT policies.
-- Assuming the policies are exactly named as in the warnings:
DROP POLICY IF EXISTS "feedback_attachments_select" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from trade-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
