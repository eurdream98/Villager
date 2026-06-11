import { useState } from 'react';
import { createPortal } from 'react-dom';
import './Neighborhood.css';

function NeighborhoodVerifyModal({ open, neighborhood, onClose, onVerify }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!open || !neighborhood) return null;

  const canVerify = Boolean(neighborhood.id);

  const handleVerify = async () => {
    if (!canVerify) {
      setError('동네를 먼저 등록해 주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onVerify();
    } catch (err) {
      setError(err.message || '동네 인증에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="neighborhood-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="neighborhood-modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="neighborhood-verify__icon" aria-hidden="true">
          📍
        </div>
        <h2 className="neighborhood-modal__title">동네 인증</h2>
        <p className="neighborhood-modal__desc">
          <strong>{neighborhood.neighborhoodName}</strong> 동네의 글을 보거나
          거래하려면 현재 위치 인증이 필요해요.
          <br />
          해당 동네 근처에서 GPS 인증을 진행해 주세요.
        </p>

        {error && (
          <p className="neighborhood-modal__error" role="alert">
            {error}
          </p>
        )}

        <div className="neighborhood-modal__actions">
          <button
            type="button"
            className="neighborhood-modal__primary"
            onClick={handleVerify}
            disabled={busy || !canVerify}
          >
            {busy ? '위치 확인 중…' : '현재 위치로 인증하기'}
          </button>
          <button
            type="button"
            className="neighborhood-modal__secondary"
            onClick={onClose}
            disabled={busy}
          >
            나중에
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default NeighborhoodVerifyModal;
