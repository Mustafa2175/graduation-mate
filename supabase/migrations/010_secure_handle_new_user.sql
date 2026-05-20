-- Prevent direct RPC invocation of handle_new_user (Supabase security advisor).
-- The auth.users trigger still runs as SECURITY DEFINER owned by the function owner.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
