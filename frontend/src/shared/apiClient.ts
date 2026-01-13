import axios from 'axios';

function sanitizeBaseUrl(raw?: string) {
  const cleaned = (raw || '')
    // remove zero-width and BOM characters that can sneak in from copy/paste
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
    .trim();
  // strip trailing slash to avoid double slashes in requests
  return cleaned.replace(/\/$/, '');
}

const baseURL = sanitizeBaseUrl(import.meta.env.VITE_API_URL) || 'http://localhost:8000';

export const api = axios.create({
  baseURL,
  withCredentials: false,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Attach Bearer token from localStorage if present
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any)['Authorization'] = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

export function setAuthToken(token: string) {
  try { localStorage.setItem('auth_token', token); } catch {}
}

export function clearAuthToken() {
  try { localStorage.removeItem('auth_token'); } catch {}
}
