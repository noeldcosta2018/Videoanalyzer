-- Create the videos bucket for uploaded video files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  false,
  524288000, -- 500MB max per file
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg', 'video/x-matroska']
)
ON CONFLICT (id) DO NOTHING;

-- Users can upload to their own folder (path: {user_id}/...)
CREATE POLICY "users can upload own videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own uploaded videos
CREATE POLICY "users can read own videos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own uploaded videos
CREATE POLICY "users can delete own videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service role can access everything (for server-side download before Gemini upload)
CREATE POLICY "service role full access" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'videos');
