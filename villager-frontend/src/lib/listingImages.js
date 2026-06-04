import { getAccessToken, isApiEnabled } from './api';
import { supabase } from './supabase';

const BUCKET = 'trade-listings';
const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

function buildApiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}

/** blob: URL 등 저장·표시에 쓸 수 없는 주소 제외 */
export function usableListingImageUrls(urls) {
  return (urls ?? [])
    .map(resolveListingImageUrl)
    .filter((u) => typeof u === 'string' && u.trim() && !u.startsWith('blob:'));
}

/**
 * Supabase 공개 URL은 그대로, 예전 로컬 /uploads URL만 API 베이스로 보정
 */
export function resolveListingImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('blob:')) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/uploads/')) {
    return buildApiUrl(trimmed);
  }
  return trimmed;
}

async function uploadViaBackend(files) {
  const token = await getAccessToken();
  const form = new FormData();
  files.forEach((file) => form.append('files', file));

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(buildApiUrl('/api/v1/listings/images'), {
    method: 'POST',
    headers,
    body: form,
  });

  if (!response.ok) {
    let message = `사진 업로드 실패 (${response.status})`;
    try {
      const body = await response.json();
      if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('업로드된 사진 URL을 받지 못했습니다.');
  }
  return data;
}

async function uploadViaSupabaseClient(files, userId) {
  const urls = [];
  for (const file of files) {
    const ext = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) {
      throw new Error(
        error.message?.includes('Bucket not found')
          ? 'Storage 버킷 trade-listings 가 없습니다. supabase/listing-images-storage.sql 을 실행하세요.'
          : error.message || '사진 업로드에 실패했습니다.',
      );
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

/**
 * 판매 사진 업로드 — API 사용 시 백엔드가 Supabase Storage에 저장
 */
export async function uploadListingImages(files, userId) {
  if (!userId) {
    throw new Error('로그인 후 사진을 등록할 수 있습니다.');
  }
  if (!files?.length) {
    throw new Error('업로드할 사진이 없습니다.');
  }

  if (isApiEnabled()) {
    return uploadViaBackend(files);
  }
  return uploadViaSupabaseClient(files, userId);
}
