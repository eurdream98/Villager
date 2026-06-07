import { useEffect, useState } from 'react';
import {
  fetchPayoutBanks,
  mapPayoutAccount,
  mapVerificationSend,
  PAYOUT_STATUS,
  registerPayoutAccount,
  sendPayoutVerification,
  verifyPayoutAccount,
} from '../../lib/payoutApi';
import '../growth/GrowthScreens.css';
import './PayoutAccountScreen.css';

function PayoutAccountScreen({ account, loading, error, onRefresh, onClose }) {
  const [banks, setBanks] = useState([]);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [depositNotice, setDepositNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchPayoutBanks()
      .then((list) => {
        setBanks(list);
        if (list.length > 0 && !bankCode) {
          setBankCode(list[0].code);
        }
      })
      .catch(() => setBanks([]));
  }, [bankCode]);

  useEffect(() => {
    if (account?.status === PAYOUT_STATUS.PENDING) {
      setAccountHolder(account.accountHolder || '');
    }
  }, [account]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    setDepositNotice(null);
    setBusy(true);
    try {
      await registerPayoutAccount({
        bankCode,
        accountNumber: accountNumber.replace(/\D/g, ''),
        accountHolder: accountHolder.trim(),
      });
      setVerifyCode('');
      await onRefresh();
      setSuccess('계좌가 등록되었습니다. 아래 「1원 인증 보내기」를 눌러 주세요.');
    } catch (err) {
      setFormError(err.message || '계좌 등록에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleSendVerification = async () => {
    setFormError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const data = mapVerificationSend(await sendPayoutVerification());
      setDepositNotice(data);
      setVerifyCode('');
      await onRefresh();
      setSuccess(data.message);
    } catch (err) {
      setFormError(err.message || '1원 인증 요청에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await verifyPayoutAccount(verifyCode.trim());
      setDepositNotice(null);
      setVerifyCode('');
      setEditing(false);
      await onRefresh();
      setSuccess('정산 계좌 인증이 완료되었습니다. 택배·문고리 에스크로 판매가 가능합니다.');
    } catch (err) {
      setFormError(err.message || '인증에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const isVerified = account?.status === PAYOUT_STATUS.VERIFIED && !editing;
  const isPending = account?.status === PAYOUT_STATUS.PENDING || editing;
  const canSendVerification = isPending && account && !account.verificationSent && !depositNotice;
  const canEnterCode =
    isPending && (account?.verificationSent || depositNotice);

  return (
    <div className="growth-screen payout-screen" role="dialog" aria-labelledby="payout-title">
      <header className="growth-screen__header">
        <button type="button" className="growth-screen__back" onClick={onClose}>
          ← 닫기
        </button>
        <h2 id="payout-title" className="growth-screen__title">
          정산 계좌
        </h2>
      </header>

      <div className="growth-screen__body">
        <section className="growth-card">
          <p className="growth-card__label">에스크로 정산</p>
          <p className="growth-card__sub">
            ① 계좌 등록 → ② 1원 인증(시뮬레이션) → ③ 택배·문고리 판매 가능.
            거래 완료 시 이 계좌로 정산됩니다 (현재 mock 송금).
          </p>
        </section>

        {error && (
          <p className="payout-screen__alert payout-screen__alert--error" role="alert">
            {error}
          </p>
        )}
        {formError && (
          <p className="payout-screen__alert payout-screen__alert--error" role="alert">
            {formError}
          </p>
        )}
        {success && (
          <p className="payout-screen__alert payout-screen__alert--ok" role="status">
            {success}
          </p>
        )}

        {loading && !account ? (
          <p className="growth-screen__loading">불러오는 중…</p>
        ) : isVerified ? (
          <section className="growth-card">
            <p className="growth-card__label">등록된 계좌</p>
            <p className="payout-screen__verified-badge">✅ 인증 완료</p>
            <dl className="payout-screen__details">
              <div>
                <dt>은행</dt>
                <dd>{account.bankName}</dd>
              </div>
              <div>
                <dt>계좌번호</dt>
                <dd>{account.accountNumberMasked}</dd>
              </div>
              <div>
                <dt>예금주</dt>
                <dd>{account.accountHolder}</dd>
              </div>
            </dl>
            <div className="payout-screen__actions">
              <button
                type="button"
                className="payout-screen__btn payout-screen__btn--secondary"
                disabled={busy}
                onClick={() => {
                  setEditing(true);
                  setDepositNotice(null);
                  setSuccess(null);
                  setFormError(null);
                }}
              >
                계좌 변경
              </button>
            </div>
          </section>
        ) : (
          <>
            <form className="growth-card payout-screen__form" onSubmit={handleRegister}>
              <p className="growth-card__label">{account ? '계좌 정보' : '1. 계좌 등록'}</p>
              <label className="payout-screen__field">
                <span>은행</span>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  required
                >
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="payout-screen__field">
                <span>계좌번호</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="숫자만 입력"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </label>
              <label className="payout-screen__field">
                <span>예금주</span>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="통장에 표시된 이름"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  required
                />
              </label>
              <button type="submit" className="payout-screen__btn" disabled={busy}>
                {busy ? '처리 중…' : account ? '계좌 저장' : '계좌 등록'}
              </button>
            </form>

            {account && (
              <section className="growth-card">
                <p className="growth-card__label">2. 1원 계좌 인증</p>
                {account.bankName && (
                  <p className="growth-card__sub">
                    {account.bankName} {account.accountNumberMasked} · {account.accountHolder}
                  </p>
                )}

                {canSendVerification && (
                  <button
                    type="button"
                    className="payout-screen__btn"
                    disabled={busy}
                    onClick={handleSendVerification}
                  >
                    {busy ? '요청 중…' : '1원 인증 보내기'}
                  </button>
                )}

                {depositNotice && (
                  <div className="payout-screen__bank-push" role="note">
                    <p className="payout-screen__bank-push-title">모의 입금 알림</p>
                    <p>
                      <strong>Villager</strong>에서{' '}
                      <strong>{depositNotice.depositAmount}원</strong> 입금
                    </p>
                    <p>
                      입금자명: <strong>{depositNotice.depositorName}</strong>
                    </p>
                    {depositNotice.mockVerificationCode && (
                      <p className="payout-screen__mock-code">
                        개발용 인증번호: <strong>{depositNotice.mockVerificationCode}</strong>
                      </p>
                    )}
                  </div>
                )}

                {canEnterCode && (
                  <form className="payout-screen__form" onSubmit={handleVerify}>
                    <label className="payout-screen__field">
                      <span>입금자명 끝 4자리</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="0000"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                    </label>
                    <button type="submit" className="payout-screen__btn" disabled={busy}>
                      {busy ? '확인 중…' : '인증 완료'}
                    </button>
                  </form>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PayoutAccountScreen;
