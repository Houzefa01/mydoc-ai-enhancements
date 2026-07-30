CREATE POLICY "avatars_own_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_own_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_own_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_own_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "sources_own_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'sources' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "sources_own_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'sources' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "sources_own_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'sources' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "exports_own_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "exports_own_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "exports_own_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "exports_own_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text);