import { useState } from 'react';
import {
  APPOINTMENT_STATUS,
  formatAppointmentSummary,
  getLocationPlaceholder,
  validateAppointmentDraft,
} from '../../lib/appointment';
import { TRADE_METHODS } from '../../lib/trade';
import './Trade.css';

function TradeAppointmentPanel({
  appointment,
  currentUserId,
  sellerId,
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
        <button type="button" className="trade-apt__link" onClick={onReset}>
          약속 다시 잡기
        </button>
      </div>
    );
  }

  if (appointment?.status === APPOINTMENT_STATUS.PENDING) {
    const summary = formatAppointmentSummary(appointment);
    const isProposer = appointment.proposedBy === currentUserId;
    const canConfirm = !isProposer;

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
          {appointment.proposedByName}님이 제안 ·{' '}
          {isProposer
            ? '상대방의 확정을 기다리는 중입니다.'
            : `${roleLabel}님, 내용을 확인하고 약속을 수락해 주세요.`}
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
            다시 제안
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
