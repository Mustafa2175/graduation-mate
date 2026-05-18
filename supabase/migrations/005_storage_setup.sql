-- Create the 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop policies if they already exist to avoid name conflicts
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public update access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access for avatars" ON storage.objects;

-- Allow public read access to avatars
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow anyone to upload an avatar
CREATE POLICY "Public upload access for avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- Allow anyone to update/replace avatar files (requires both USING and WITH CHECK)
CREATE POLICY "Public update access for avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Allow anyone to delete avatar files
CREATE POLICY "Public delete access for avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');
