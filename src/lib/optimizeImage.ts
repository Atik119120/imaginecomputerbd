/**
 * Optimize image URLs for Cloudinary, Unsplash, and pass-through for others.
 * Adds format auto, quality auto, and width-based resizing where supported.
 */
export function optimizeImage(
  url: string | null | undefined,
  width: number = 600
): string {
  if (!url) return '/placeholder.svg';

  // Cloudinary: insert transformation segment after /upload/
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (/\/upload\/(f_auto|q_auto|w_)/.test(url)) return url;
    return url.replace(
      '/upload/',
      `/upload/f_auto,q_auto,w_${width},c_limit/`
    );
  }

  // Unsplash: append/override w & q params
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', '75');
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      return u.toString();
    } catch {
      return url;
    }
  }

  return url;
}
