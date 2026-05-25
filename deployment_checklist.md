# TeamUp (Graduation Mate) Deployment Checklist

Before launching the application to a production environment (such as Vercel or Netlify) connected to your remote Supabase instance, ensure all items on this checklist are completed to guarantee security, stability, and proper data access.

## 1. Environment Variables

Ensure the following environment variables are securely set in your hosting provider's dashboard (e.g., Vercel Environment Variables):

- `NEXT_PUBLIC_SUPABASE_URL`: Your remote Supabase project URL (e.g., `https://wszkhamoeehgmdgvoird.supabase.co`).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous public key. **Never** put the `service_role` key in `NEXT_PUBLIC_` variables.

## 2. Storage Bucket Configuration

The application requires an `avatars` bucket for user profile pictures. Verify the following in the Supabase Storage dashboard:

- [ ] **Bucket Exists**: Ensure a bucket named exactly `avatars` exists.
- [ ] **Public Accessibility**: The `avatars` bucket **must** be set to "Public". If it's private, the `avatar_url` returned by `getPublicUrl` will not be visible to other users without signed URLs.
- [ ] **Upload Policies**: Ensure there are storage policies allowing authenticated users to upload (`INSERT`) and update (`UPDATE`) their own files. (e.g., `(bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])`).

## 3. Database Migrations & RLS Execution Order

Since the project uses a remote Supabase instance that is not fully managed by the local Supabase CLI, you must manually run the migration SQL scripts in the correct order via the Supabase SQL Editor.

Execute the following in order, ensuring no errors occur:

1. **Schema & Tables**: Run any base schema creation scripts first (`001`, `002`, etc.) to create `profiles`, `teams`, `team_members`, `swipes`, `matches`, etc.
2. **Database Functions/RPCs**: Execute the transactional RPCs (e.g., `020_team_consistency_rpcs.sql`). 
    - *Crucial Check*: Ensure these functions are created with `SECURITY DEFINER` so they can bypass client RLS rules to ensure atomic multi-table integrity, while still internally validating `auth.uid()`.
3. **Row Level Security (RLS) Policies**: Run all RLS policy definitions *after* the tables and functions exist.
    - *Crucial Check*: Verify that RLS is actually enabled on all tables (`ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`).
    - *Crucial Check*: Ensure policies strictly check `auth.uid() = id` (for profiles) or check team membership for team updates.

## 4. Feature Verifications

Once deployed, manually verify the critical flows on the live URL:

- [ ] **Authentication**: Users can sign up, log in, and log out.
- [ ] **Onboarding Recovery**: Refresh the page during onboarding Step 5. It should safely resume or allow re-submitting without throwing a "User already exists" error.
- [ ] **Link Normalization**: Edit a profile, enter a WhatsApp number with spaces/dashes (e.g., `+20 123 456-7890`) and a LinkedIn URL without `https://` (e.g., `linkedin.com/in/user`). Verify they save as strictly numbers/`+` and with `https://`.
- [ ] **Swipe Resiliency**: Mock a failed swipe network request (or use a duplicate swipe). Ensure the UI does not crash or break, and handles duplicates gracefully.

---
*Follow this document for every new environment to prevent unexpected UI states or data inconsistencies.*
