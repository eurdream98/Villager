import { useState } from 'react';
import { signInWithProvider } from '../lib/auth';
import { isGoogleOAuthBlockedBrowser, isKakaoTalkInApp } from '../lib/browser';
import GoogleInAppNotice from './GoogleInAppNotice';
import './WelcomeScreen.css';

function GoogleIcon() {
  return (
    <svg className="social-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg className="social-btn__icon social-btn__icon--kakao" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.87 5.35 4.68 6.84-.15.55-.97 3.54-1.01 3.7 0 .06.01.13.07.17.06.04.13.04.19.01 2.49-1.64 4.36-2.68 5.07-3.13.75.11 1.52.17 2.3.17 5.52 0 10-3.58 10-8S17.52 3 12 3z"
      />
    </svg>
  );
}

function VillagerAppIcon() {
  return (
    <div className="welcome__app-icon" aria-hidden="true">
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="120" rx="28" fill="url(#skyGrad)" />
        <circle cx="92" cy="28" r="14" fill="#FFE8A3" opacity="0.95" />
        <ellipse cx="28" cy="32" rx="18" ry="8" fill="white" opacity="0.85" />
        <ellipse cx="42" cy="30" rx="12" ry="6" fill="white" opacity="0.7" />
        <path
          d="M0 78C20 68 40 72 60 70C80 68 100 74 120 76V120H0V78Z"
          fill="url(#hillGrad)"
        />
        <path
          d="M38 95H82C82 95 72 82 60 82C48 82 38 95 38 95Z"
          fill="#C4A574"
          opacity="0.6"
        />
        {/* 왼쪽 집 */}
        <rect x="18" y="62" width="22" height="20" rx="2" fill="#F4E4C8" />
        <path d="M15 62L29 48L43 62H15Z" fill="#D4A373" />
        <rect x="26" y="70" width="6" height="12" rx="1" fill="#8B5E3C" />
        {/* 가운데 집 (마을 회관 느낌) */}
        <rect x="44" y="52" width="32" height="30" rx="2" fill="#FFF8EE" />
        <path d="M40 52L60 32L80 52H40Z" fill="#E76F51" />
        <rect x="54" y="62" width="8" height="20" rx="1" fill="#6B4423" />
        <rect x="48" y="58" width="6" height="6" rx="1" fill="#87CEEB" opacity="0.9" />
        <rect x="66" y="58" width="6" height="6" rx="1" fill="#87CEEB" opacity="0.9" />
        {/* 오른쪽 집 */}
        <rect x="82" y="64" width="20" height="18" rx="2" fill="#F4E4C8" />
        <path d="M79 64L92 52L105 64H79Z" fill="#2A9D8F" />
        <rect x="89" y="72" width="5" height="10" rx="1" fill="#8B5E3C" />
        {/* 나무 */}
        <ellipse cx="14" cy="76" rx="8" ry="10" fill="#52B788" />
        <rect x="12" y="82" width="4" height="10" fill="#6B4423" />
        <ellipse cx="106" cy="78" rx="7" ry="9" fill="#40916C" />
        <rect x="104" y="84" width="4" height="8" fill="#6B4423" />
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#B8E0F0" />
            <stop offset="1" stopColor="#D8EFE3" />
          </linearGradient>
          <linearGradient id="hillGrad" x1="60" y1="68" x2="60" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#74C69D" />
            <stop offset="1" stopColor="#40916C" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function WelcomeScreen() {
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [showGoogleInAppNotice, setShowGoogleInAppNotice] = useState(false);
  const googleBlockedInApp = isGoogleOAuthBlockedBrowser();

  const handleOAuth = async (provider) => {
    setAuthError(null);

    if (provider === 'google' && googleBlockedInApp) {
      setShowGoogleInAppNotice(true);
      return;
    }

    setLoadingProvider(provider);
    try {
      await signInWithProvider(provider);
      // 성공 시 카카오/Google 로그인 페이지로 이동 후 다시 앱으로 돌아옴
    } catch (err) {
      const label = provider === 'kakao' ? '카카오' : 'Google';
      setAuthError(err.message || `${label} 로그인에 실패했습니다.`);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="welcome">
      {showGoogleInAppNotice && (
        <GoogleInAppNotice onClose={() => setShowGoogleInAppNotice(false)} />
      )}
      <div className="welcome__bg" aria-hidden="true" />

      <main className="welcome__content">
        <VillagerAppIcon />

        <h1 className="welcome__title">Villager</h1>
        <p className="welcome__tagline">
          동네 사람들과 함께하는
          <br />
          <strong>친목 · 거래 · 서로 돕기</strong>
        </p>

        <div className="welcome__auth">

          {authError && (
            <p className="welcome__auth-error" role="alert">
              {authError}
            </p>
          )}

          {googleBlockedInApp && isKakaoTalkInApp() && (
            <p className="welcome__inapp-hint">
              카카오톡에서는 Google 로그인이 제한됩니다. Safari·Chrome에서 열거나 카카오
              로그인을 이용해 주세요.
            </p>
          )}

          <button
            type="button"
            className="social-btn social-btn--google"
            onClick={() => handleOAuth('google')}
            disabled={!!loadingProvider}
          >
            <GoogleIcon />
            <span>
              {loadingProvider === 'google' ? '연결 중…' : 'Google로 계속하기'}
            </span>
          </button>

          <button
            type="button"
            className="social-btn social-btn--kakao"
            onClick={() => handleOAuth('kakao')}
            disabled={!!loadingProvider}
          >
            <KakaoIcon />
            <span>
              {loadingProvider === 'kakao' ? '연결 중…' : '카카오로 계속하기'}
            </span>
          </button>
        </div>

        <p className="welcome__terms">
          로그인 시{' '}
          <button type="button" className="welcome__link">
            이용약관
          </button>
          및{' '}
          <button type="button" className="welcome__link">
            개인정보처리방침
          </button>
          에 동의하게 됩니다.
        </p>
      </main>
    </div>
  );
}

export default WelcomeScreen;
