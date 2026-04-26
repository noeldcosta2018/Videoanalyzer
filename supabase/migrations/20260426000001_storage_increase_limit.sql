-- Raise the videos bucket file size limit to 2 GB to match Gemini Files API maximum
UPDATE storage.buckets
SET file_size_limit = 2147483648
WHERE id = 'videos';
