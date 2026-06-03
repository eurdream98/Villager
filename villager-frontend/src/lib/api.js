import { supabase } from './supabase';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

/** 백엔드 직접 URL 또는 CRA dev proxy(/api → 8080) */
export function isApiEnabled() {
  return Boolean(API_BASE) || process.env.NODE_ENV === 'development';
}

function buildUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiFetch(path, options = {}) {
  if (!isApiEnabled()) {
    throw new Error('백엔드 API가 설정되지 않았습니다. .env에 REACT_APP_API_URL을 넣거나 npm start(개발)를 사용하세요.');
  }

  const token = await getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `요청 실패 (${response.status})`;
    try {
      const body = await response.json();
      if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}
