/**
 * Supabase 세션 저장소.
 * - localStorage: 같은 origin 탭·창이 로그인 상태를 공유 (기본, 배포용)
 * - sessionStorage: 탭마다 독립 — 로컬에서 판매자/구매자 동시 테스트용
 */
export function isTabIsolatedAuth() {
  if (process.env.REACT_APP_AUTH_TAB_SESSION === 'true') return true;
  if (process.env.REACT_APP_AUTH_TAB_SESSION === 'false') return false;
  return process.env.NODE_ENV === 'development';
}

export function getAuthStorage() {
  if (typeof window === 'undefined') return undefined;
  return isTabIsolatedAuth() ? window.sessionStorage : window.localStorage;
}
