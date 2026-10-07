export const API_ORIGIN = 'https://joyborv1.pythonanywhere.com';
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const link = API_BASE_URL.replace(/\/+$/, '');

/** API ba'zan http:// media URL qaytaradi — mixed content oldini olish */
export function mediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('http://joyborv1.pythonanywhere.com')) {
    return url.replace('http://', 'https://');
  }
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  return url;
}
