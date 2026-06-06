import { useEffect, useRef, useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import HomeScreen from './components/HomeScreen';
import { clearOAuthParamsFromUrl, readOAuthErrorFromUrl } from './lib/oauthErrors';
import { confirmPayment } from './lib/escrowApi';
import {
  clearPendingTossPayment,
  clearTossPaymentParamsFromUrl,
  isTossPaymentReturn,
  readTossPaymentReturn,
} from './lib/tossPayments';
import { supabase } from './lib/supabase';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [oauthError, setOauthError] = useState(null);
  const [paymentNotice, setPaymentNotice] = useState(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const paymentHandledRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const urlError = readOAuthErrorFromUrl();
      if (urlError) {
        if (mounted) setOauthError(urlError);
        clearOAuthParamsFromUrl();
      }

      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError && mounted && !urlError) {
        setOauthError(sessionError.message);
      }

      if (mounted) {
        setSession(currentSession);
        setLoading(false);
        if (currentSession) clearOAuthParamsFromUrl();
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      setLoading(false);
      if (event === 'SIGNED_IN' && currentSession) {
        setOauthError(null);
        clearOAuthParamsFromUrl();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 토스 결제 리다이렉트 처리 — 세션 준비 후 1회만 실행 (Strict Mode·세션 갱신 취소 방지)
  useEffect(() => {
    if (loading) return undefined;
    if (!isTossPaymentReturn()) return undefined;
    if (paymentHandledRef.current) return undefined;

    const ret = readTossPaymentReturn();
    if (!ret) return undefined;

    paymentHandledRef.current = true;
    setPaymentBusy(true);

    const finish = (notice) => {
      if (notice) setPaymentNotice(notice);
      setPaymentBusy(false);
      clearTossPaymentParamsFromUrl();
      clearPendingTossPayment();
    };

    const runConfirm = async (activeSession) => {
      if (ret.toss === 'fail') {
        finish(ret.message || '결제가 취소되었습니다.');
        return;
      }

      if (!activeSession) {
        finish('로그인이 필요합니다. 다시 로그인한 뒤 채팅에서 주문 상태를 확인해 주세요.');
        return;
      }

      if (!ret.conversationId || !ret.paymentKey || !ret.orderId || ret.amount == null) {
        finish(
          `결제 정보가 부족합니다. (conversationId=${ret.conversationId ? 'OK' : '없음'}, paymentKey=${ret.paymentKey ? 'OK' : '없음'})`,
        );
        return;
      }

      try {
        await confirmPayment(ret.conversationId, {
          paymentKey: ret.paymentKey,
          orderId: ret.orderId,
          amount: ret.amount,
        });
        finish('결제가 완료되었습니다. 채팅 탭에서 거래를 이어가 주세요.');
      } catch (err) {
        finish(err.message || '결제 승인에 실패했습니다.');
      }
    };

    if (session) {
      runConfirm(session);
    } else {
      // QR·외부 브라우저 복귀 시 세션이 한 박자 늦게 복원되는 경우 대기
      supabase.auth.getSession().then(({ data: { session: lateSession } }) => {
        runConfirm(lateSession);
      });
    }

    return undefined;
  }, [loading, session]);

  if (loading) {
    return <div className="App App--loading">불러오는 중…</div>;
  }

  return (
    <div className="App">
      {paymentBusy && (
        <div className="App__payment-overlay" role="status" aria-live="polite">
          결제 확인 중…
        </div>
      )}
      {paymentNotice && (
        <div className="App__payment-notice" role="status">
          {paymentNotice}
          <button type="button" onClick={() => setPaymentNotice(null)}>
            닫기
          </button>
        </div>
      )}
      {session ? (
        <HomeScreen user={session.user} />
      ) : (
        <WelcomeScreen
          oauthError={oauthError}
          onClearOAuthError={() => setOauthError(null)}
        />
      )}
    </div>
  );
}

export default App;
