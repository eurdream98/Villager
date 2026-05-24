import { useState } from 'react';
import { copyCurrentPageUrl, getInAppBrowserLabel } from '../lib/browser';
import './GoogleInAppNotice.css';

function GoogleInAppNotice({ onClose }) {
  const [copied, setCopied] = useState(false);
  const browserLabel = getInAppBrowserLabel();

  const handleCopy = async () => {
    try {
      await copyCurrentPageUrl();
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="inapp-notice" role="dialog" aria-modal="true" aria-labelledby="inapp-notice-title">
      <div className="inapp-notice__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="inapp-notice__panel">
        <h2 id="inapp-notice-title" className="inapp-notice__title">
          Google 로그인 안내
        </h2>
        <p className="inapp-notice__text">
          Google은 <strong>{browserLabel}</strong> 같은 인앱 브라우저에서 로그인을
          허용하지 않습니다. (403 오류 — Google 정책)
        </p>
        <p className="inapp-notice__text">
          <strong>Safari</strong> 또는 <strong>Chrome</strong>에서 아래 주소를 열어
          Google 로그인을 이용해 주세요.
        </p>
        <p className="inapp-notice__url">{window.location.href}</p>
        <div className="inapp-notice__actions">
          <button type="button" className="inapp-notice__btn inapp-notice__btn--primary" onClick={handleCopy}>
            {copied ? '주소 복사됨' : '주소 복사'}
          </button>
          <button type="button" className="inapp-notice__btn" onClick={onClose}>
            닫기
          </button>
        </div>
        <p className="inapp-notice__hint">
          {browserLabel === '카카오톡' ? (
            <>
              카카오톡에서는 <strong>카카오로 계속하기</strong>를 사용할 수 있습니다.
              <br />
              (우측 상단 ⋮ → 다른 브라우저로 열기)
            </>
          ) : (
            <>이 환경에서는 카카오 로그인을 이용해 주세요.</>
          )}
        </p>
      </div>
    </div>
  );
}

export default GoogleInAppNotice;
