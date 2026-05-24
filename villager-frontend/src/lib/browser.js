/** 카카오톡 인앱 브라우저 */
export function isKakaoTalkInApp() {
  return /KAKAOTALK/i.test(navigator.userAgent);
}

/**
 * Google OAuth가 차단되는 인앱/WebView 환경
 * @see https://developers.google.com/identity/protocols/oauth2/policies#secure-browser-environment
 */
export function isGoogleOAuthBlockedBrowser() {
  const ua = navigator.userAgent;
  if (/KAKAOTALK|Instagram|FBAN|FBAV|FB_IAB|Line\/|NAVER(inapp|Whale)|DaumApps/i.test(ua)) {
    return true;
  }
  // Android WebView
  if (/wv\)|WebView/i.test(ua)) return true;
  // iOS in-app (Safari 문자열 없는 WebKit)
  if (/(iPhone|iPod|iPad).*AppleWebKit/i.test(ua) && !/Safari/i.test(ua)) {
    return true;
  }
  return false;
}

export function getInAppBrowserLabel() {
  if (isKakaoTalkInApp()) return '카카오톡';
  if (/Instagram/i.test(navigator.userAgent)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB/i.test(navigator.userAgent)) return 'Facebook';
  if (/Line\//i.test(navigator.userAgent)) return 'LINE';
  return '인앱 브라우저';
}

export async function copyCurrentPageUrl() {
  const url = window.location.href;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return url;
  }
  const textarea = document.createElement('textarea');
  textarea.value = url;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  return url;
}
