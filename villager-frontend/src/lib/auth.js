import { supabase } from './supabase';
import { DEV_BUYER, DEV_SELLER } from './devAuth';

/**
 * OAuth 로그인 후 돌아올 URL
 * - 로컬 개발: 항상 지금 열린 주소 (localhost:3001 등)
 * - 프로덕션 빌드: REACT_APP_AUTH_REDIRECT_URL (Vercel) 또는 현재 origin
 * - Supabase Redirect URLs에 사용하는 주소를 모두 등록해야 함
 */
export function getOAuthRedirectUrl() {
  if (process.env.NODE_ENV === 'development') {
    return `${window.location.origin}/`;
  }

  const fromEnv = process.env.REACT_APP_AUTH_REDIRECT_URL?.trim();
  if (fromEnv) {
    return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`;
  }

  return `${window.location.origin}/`;
}

async function signInWithOAuthProvider(provider, extraOptions = {}) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getOAuthRedirectUrl(),
      ...extraOptions,
    },
  });
  if (error) throw error;
}

export async function signInWithGoogle() {
  return signInWithOAuthProvider('google');
}

/** Supabase + Kakao Developers 에서 Provider 활성화 필요 */
export async function signInWithKakao() {
  // scope는 Supabase·카카오 콘솔에서 설정 (클라이언트에서 넘기면 400/KOE205 발생 가능)
  return signInWithOAuthProvider('kakao');
}

export async function signInWithProvider(provider) {
  if (provider === 'google') return signInWithGoogle();
  if (provider === 'kakao') return signInWithKakao();
  throw new Error(`지원하지 않는 로그인 방식: ${provider}`);
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

async function signInWithDevCredentials({ email, password, roleLabel }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(
      `${roleLabel} 로그인 실패: ${error.message}\n` +
        'Supabase SQL Editor에서 supabase/seed-dev-buyer.sql 실행, ' +
        'Authentication → Providers → Email 활성화를 확인하세요.',
    );
  }
  return data.session;
}

/** 개발 전용 — seed-dev-buyer.sql 의 구매자 계정 */
export async function signInAsDevBuyer() {
  return signInWithDevCredentials({
    email: DEV_BUYER.email,
    password: DEV_BUYER.password,
    roleLabel: '데모 구매자',
  });
}

/** 개발 전용 — 판매자 계정 (채팅 상대 확인용) */
export async function signInAsDevSeller() {
  return signInWithDevCredentials({
    email: DEV_SELLER.email,
    password: DEV_SELLER.password,
    roleLabel: '데모 판매자',
  });
}
