/**
 * API configuration for Hybrid and standalone deployments
 *
 * In standalone / local dev: VITE_API_URL is empty -> calls use relative '/api/...'
 * In Vercel + Render (Option 3):
 *  - Option A: Vercel rewrite in vercel.json proxies '/api/*' to Render -> VITE_API_URL not needed
 *  - Option B: Set VITE_API_URL=https://<your-render-app>.onrender.com in Vercel env -> frontend calls Render directly
 */

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

export function apiUrl(endpoint: string): string {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!API_BASE_URL) {
    return normalized;
  }
  return `${API_BASE_URL}${normalized}`;
}

export function resolveMediaUrl(urlOrPath: string | undefined | null): string {
  if (!urlOrPath) return '';
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://') || urlOrPath.startsWith('data:') || urlOrPath.startsWith('blob:')) {
    return urlOrPath;
  }
  if (urlOrPath.startsWith('/api/') && API_BASE_URL) {
    return `${API_BASE_URL}${urlOrPath}`;
  }
  return urlOrPath;
}
