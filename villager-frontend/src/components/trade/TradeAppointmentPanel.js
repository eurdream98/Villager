import { useState } from 'react';
import {
  APPOINTMENT_STATUS,
  formatAppointmentSummary,
  getLocationPlaceholder,
  validateAppointmentDraft,
} from '../../lib/appointment';
import { TRADE_METHODS } from '../../lib/trade';
import { isSameUser } from '../../lib/userId';
import './Trade.css';

function TradeAppointmentPanel({
  appointment,
  order,
  currentUserId,
  sellerId,
  listingFree,
  onPropose,
  onConfirm,
  onReset,
}) {
  const [expanded, setExpanded] = useState(false);
  const [tradeMethod, setTradeMethod] = useState('meet');
  const [scheduledAt, setScheduledAt] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState(null);

  const isSeller = currentUserId === sellerId;
  const roleLabel = isSeller ? '판매자' : '구매자';

  const handlePropose = (e) => {
    e.preventDefault();
    setError(null);
    const validationError = validateAppointmentDraft({
      tradeMethod,
      scheduledAt,
      location,
    });
    if (validationError) {
      setError(validationError);
      return;
    }
    onPropose({ tradeMethod, scheduledAt, location });
    setExpanded(false);
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message || '약속 수락에 실패했습니다.');
    }
  };

  if (appointment?.status === APPOINTMENT_STATUS.CONFIRMED) {
    const summary = formatAppointmentSummary(appointment);
    const isMeet = appointment.tradeMethod === 'meet';
    const isEscrowMethod =
      !listingFree && (appointment.tradeMethod === 'shipping' || appointment.tradeMethod === 'door');
    const isBuyer = currentUserId !== sellerId;
    return (
      <div className="trade-apt trade-apt--confirmed">
        <p className="trade-apt__badge">✅ 약속 완료</p>
        <dl className="trade-apt__summary">
          <div>
            <dt>거래 방법</dt>
            <dd>{summary.methodLabel}</dd>
          </div>
          <div>
            <dt>거래 시간</dt>
            <dd>{summary.time}</dd>
          </div>
          <div>
            <dt>거래 장소</dt>
            <dd>{summary.location}</dd>
          </div>
        </dl>
        {isMeet && (
          <p className="trade-apt__hint trade-apt__hint--meet">
            만나서 거래는 현장에서 물건을 확인한 뒤 직접 결제해 주세요. 에스크로 결제는
            사용하지 않습니다.
          </p>
        )}
        {isEscrowMethod && isBuyer && order?.escrowStatus === 'pending_payment' && (
          <p className="trade-apt__hint trade-apt__hint--pay">
            <strong>{order.paymentDeadlineHours}시간 이내</strong> 아래 「결제하기」로
            {summary.methodLabel} 금액을 입금해 주세요.
          </p>
        )}
        {isEscrowMethod && !isBuyer && order?.escrowStatus === 'pending_payment' && (
          <p className="trade-apt__hint trade-apt__hint--pay">
            구매자가 {order.paymentDeadlineHours}시간 이내에 에스크로 결제를 완료해야
            거래가 진행됩니다.
          </p>
        )}
        <button type="button" className="trade-apt__link" onClick={onReset}>
          약속 다시 잡기
        </button>
      </div>
    );
  }

  if (appointment?.status === APPOINTMENT_STATUS.PENDING) {
    const summary = formatAppointmentSummary(appointment);
    const isProposer = isSameUser(appointment.proposedBy, currentUserId);
    const canConfirm = !isProposer;
    const peerRole = isSeller ? '구매자' : '판매자';

    return (
      <div className="trade-apt trade-apt--pending">
        <p className="trade-apt__badge">📅 약속 제안</p>
        <dl className="trade-apt__summary">
          <div>
            <dt>거래 방법</dt>
            <dd>{summary.methodLabel}</dd>
          </div>
          <div>
            <dt>거래 시간</dt>
            <dd>{summary.time}</dd>
          </div>
          <div>
            <dt>거래 장소</dt>
            <dd>{summary.location}</dd>
          </div>
        </dl>
        <p className="trade-apt__hint">
          {isProposer ? (
            <>
              내가 제안한 약속입니다. <strong>{peerRole}</strong>가 「약속 수락」을 누르면
              확정됩니다. (본인은 수락할 수 없습니다.)
            </>
          ) : (
            <>
              {appointment.proposedByName}님이 제안 · {roleLabel}님, 내용을 확인하고
              「약속 수락」을 눌러 주세요.
            </>
          )}
        </p>
        {error && (
          <p className="trade-apt__error" role="alert">
            {error}
          </p>
        )}
        <div className="trade-apt__actions">
          {canConfirm && (
            <button
              type="button"
              className="trade-apt__btn trade-apt__btn--primary"
              onClick={handleConfirm}
            >
              약속 수락
            </button>
          )}
          <button type="button" className="trade-apt__btn" onClick={onReset}>
            {isProposer ? '제안 취소하고 다시 잡기' : '거절하고 다시 제안'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trade-apt">
      <button
        type="button"
        className="trade-apt__toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        📅 약속 잡기 {expanded ? '▲' : '▼'}
      </button>

      {expanded && (
        <form className="trade-apt__form" onSubmit={handlePropose}>
          <fieldset className="trade-apt__fieldset">
            <legend className="trade-apt__legend">거래 방법</legend>
            <ul className="trade-apt__methods">
              {TRADE_METHODS.map((m) => (
                <li key={m.id}>
                  <label className="trade-apt__method-label">
                    <input
                      type="radio"
                      name="apt-method"
                      value={m.id}
                      checked={tradeMethod === m.id}
                      onChange={() => setTradeMethod(m.id)}
                    />
                    <span>{m.label}</span>
                    {m.id === 'meet' && (
                      <span className="trade-apt__method-note">현장 결제</span>
                    )}
                    {(m.id === 'shipping' || m.id === 'door') && (
                      <span className="trade-apt__method-note trade-apt__method-note--escrow">
                        에스크로
                      </span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <label className="trade-apt__legend" htmlFor="apt-time">
            거래 시간
          </label>
          <input
            id="apt-time"
            className="trade-apt__input"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
          />

          <label className="trade-apt__legend" htmlFor="apt-location">
            거래 장소
          </label>
          <input
            id="apt-location"
            className="trade-apt__input"
            type="text"
            placeholder={getLocationPlaceholder(tradeMethod)}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={200}
            required
          />

          {error && (
            <p className="trade-apt__error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="trade-apt__btn trade-apt__btn--primary">
            약속 제안하기
          </button>
          <p className="trade-apt__hint">
            제안 후 상대방({isSeller ? '구매자' : '판매자'})이 확정하면 약속이 확정됩니다.
          </p>
        </form>
      )}
    </div>
  );
}

export default TradeAppointmentPanel;
