import { supabase } from './supabase';

/** OAuth 로그인 후 돌아올 URL (Supabase → URL Configuration에 등록) */
function getRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

async function signInWithOAuthProvider(provider, extraOptions = {}) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getRedirectUrl(),
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
