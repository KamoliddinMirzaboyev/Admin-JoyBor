export const API_BASE_URL = 'https://api.joy-bor.uz/api';
export const link = API_BASE_URL.replace(/\/+$/, '');
export const API_ORIGIN = 'https://api.joy-bor.uz';

/** API ba'zan http:// media URL qaytaradi — mixed content oldini olish */
export function mediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('http://api.joy-bor.uz')) return url.replace('http://', 'https://');
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  return url;
}
