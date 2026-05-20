-- supabase/migrations/007_storage_rls.sql
-- Restrict storage policies for the avatars bucket to only allow users to manage their own folders

DROP POLICY IF EXISTS "Public upload access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public update access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access for avatars" ON storage.objects;

-- Allow authenticated users to upload avatars only to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
