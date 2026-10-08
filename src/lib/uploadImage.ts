import { supabase } from '@/integrations/supabase/client';

/** Buckets that already exist in the project. */
const BANNER_FOLDERS = ['banners', 'site', 'showcase', 'lifestyle', 'brands', 'categories'];

function resolveTarget(folder: string, fileName: string) {
  const ext = (fileName.split('.').pop() || 'jpg').toLowerCase();
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  if (folder.startsWith('avatars/')) {
    // avatars/<userId> -> bucket "avatars", path "<userId>/<file>"
    const userId = folder.split('/')[1] || 'unknown';
    return { bucket: 'avatars', path: `${userId}/${unique}` };
  }

  const root = folder.split('/')[0];
  if (BANNER_FOLDERS.includes(root)) {
    return { bucket: 'banners', path: `${folder}/${unique}` };
  }
  return { bucket: 'products', path: `${folder}/${unique}` };
}

/**
 * Uploads an image to Lovable Cloud storage and returns a public URL.
 *
 * @param file - The image file to upload
 * @param folder - Logical folder name (e.g. 'products', 'banners', 'showcase', 'lifestyle', 'brands', 'avatars/<userId>')
 */
export async function uploadImage(file: File, folder: string = 'products'): Promise<string> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File too large (max 10MB)');
  }

  const { bucket, path } = resolveTarget(folder, file.name);

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    throw new Error(error.message || 'Upload failed');
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Could not get image URL');
  return data.publicUrl;
}
