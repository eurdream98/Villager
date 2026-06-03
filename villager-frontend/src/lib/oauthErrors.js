/** URL 쿼리의 OAuth 오류를 사용자 메시지로 변환 */
export function formatOAuthCallbackError(errorCode, errorDescription) {
  if (errorCode === 'bad_oauth_state') {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : '앱 주소';
    return (
      '로그인 연결이 끊어졌습니다. 카카오톡·인스타 인앱 브라우저 대신 Safari·Chrome에서 ' +
      `${origin} 을 열고, 같은 탭에서 로그인을 처음부터 다시 시도해 주세요.`
    );
  }
  if (errorDescription) {
    return decodeURIComponent(errorDescription.replace(/\+/g, ' '));
  }
  return '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

export function readOAuthErrorFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (!params.get('error')) return null;
  return formatOAuthCallbackError(
    params.get('error_code'),
    params.get('error_description'),
  );
}

export function clearOAuthParamsFromUrl() {
  const path = window.location.pathname || '/';
  window.history.replaceState({}, document.title, path);
}
