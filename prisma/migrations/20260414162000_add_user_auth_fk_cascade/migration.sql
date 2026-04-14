CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted_cleanup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
BEGIN
  DELETE FROM "public"."User" WHERE auth_user_id = OLD.id::text;
  RETURN OLD;
END;
$fn$;

DROP TRIGGER IF EXISTS on_auth_user_deleted_cleanup ON auth.users;

CREATE TRIGGER on_auth_user_deleted_cleanup
AFTER DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_deleted_cleanup();
