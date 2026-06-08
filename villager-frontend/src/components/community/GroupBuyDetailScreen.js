import { useCallback, useEffect, useState } from 'react';
import { usableListingImageUrls, resolveListingImageUrl } from '../../lib/listingImages';
import {
  cancelGroupBuyParticipation,
  commitGroupBuy,
  completeGroupBuyDistribution,
  confirmGroupBuyPickup,
  expressInterest,
  fetchGroupBuy,
  formatGroupBuyDeadline,
  formatGroupBuyPrice,
  formatPickupWindow,
  GROUP_BUY_STATUS,
  simulateGroupBuy,
} from '../../lib/groupBuyApi';
import './GroupBuy.css';

const FLOW_STEPS = [
  { key: 'interest', label: '관심' },
  { key: 'commit', label: '확정' },
  { key: 'success', label: '성사' },
  { key: 'pickup', label: '픽업' },
  { key: 'done', label: '완료' },
];

function flowStepIndex(item) {
  if (!item) return 0;
  if (item.status === GROUP_BUY_STATUS.COMPLETED) return 4;
  if (item.status === GROUP_BUY_STATUS.PICKUP || item.status === GROUP_BUY_STATUS.SUCCEEDED) {
    return 3;
  }
  if (item.committedCount >= item.minCommitted) return 2;
  if (item.myTier === 'committed') return 1;
  if (item.myTier === 'interested') return 0;
  return 0;
}

function GroupBuyDetailScreen({ id, user, onBack }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGroupBuy(id);
      setItem(data);
      if (data.myQuantity) setQuantity(data.myQuantity);
    } catch (err) {
      setError(err.message || '불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await fn();
      setItem(updated);
    } catch (err) {
      setError(err.message || '처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !item) {
    return <div className="group-buy-empty">불러오는 중…</div>;
  }
  if (!item) {
    return (
      <div className="group-buy-screen">
        <button type="button" className="group-buy-screen__back" onClick={onBack}>
          ← 목록
        </button>
        <div className="group-buy-alert group-buy-alert--error">{error || '글을 찾을 수 없습니다.'}</div>
      </div>
    );
  }

  const images = usableListingImageUrls(item.imageUrls);
  const isOrganizer = user?.id && user.id === item.organizerId;
  const isRecruiting = item.status === GROUP_BUY_STATUS.RECRUITING;
  const isPickup =
    item.status === GROUP_BUY_STATUS.PICKUP || item.status === GROUP_BUY_STATUS.SUCCEEDED;
  const progress = Math.min(100, Math.round((item.committedCount / item.minCommitted) * 100));
  const currentFlow = flowStepIndex(item);

  return (
    <div className="group-buy-screen">
      <button type="button" className="group-buy-screen__back" onClick={onBack}>
        ← 목록
      </button>

      {images.length > 0 && (
        <div className="group-buy-gallery">
          {images.length === 1 ? (
            <img className="group-buy-gallery__img" src={resolveListingImageUrl(images[0])} alt="" />
          ) : (
            images.map((url) => (
              <img
                key={url}
                className="group-buy-gallery__thumb"
                src={resolveListingImageUrl(url)}
                alt=""
              />
            ))
          )}
        </div>
      )}

      <h2 className="group-buy-detail__title">{item.title}</h2>
      <p className="group-buy-detail__price">{formatGroupBuyPrice(item.pricePerUnit)} / 1인</p>
      <p className="group-buy-detail__desc">{item.description}</p>

      {item.externalUrl && (
        <a
          className="group-buy-link"
          href={item.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          🔗 구매 링크 열기
        </a>
      )}

      <div className="group-buy-panel">
        <p className="group-buy-panel__title">모집 현황</p>
        <div className="group-buy-progress" aria-hidden>
          <div className="group-buy-progress__bar" style={{ width: `${progress}%` }} />
        </div>
        <p className="group-buy-panel__text">
          관심 <strong>{item.interestedCount}</strong>명 · 확정{' '}
          <strong>
            {item.committedCount}/{item.minCommitted}
          </strong>
          명
          {isRecruiting && (
            <>
              <br />
              마감: {formatGroupBuyDeadline(item.deadlineAt)}
            </>
          )}
        </p>
        <ol className="group-buy-steps" aria-label="참여 단계">
          {FLOW_STEPS.map((step, i) => (
            <li
              key={step.key}
              className={`${i <= currentFlow ? 'is-done' : ''}${i === currentFlow ? ' is-current' : ''}`}
            >
              {step.label}
            </li>
          ))}
        </ol>
      </div>

      <div className="group-buy-panel">
        <p className="group-buy-panel__title">픽업 타임 (개별 약속 없음)</p>
        <p className="group-buy-panel__text">
          <strong>{item.pickupLocation}</strong>
          <br />
          {formatPickupWindow(item.pickupStartAt, item.pickupEndAt)}
          {item.pickupNotes && (
            <>
              <br />
              {item.pickupNotes}
            </>
          )}
        </p>
        <p className="group-buy-field__hint" style={{ marginTop: '0.5rem' }}>
          참여자는 위 시간대에 방문해 수령합니다. 등록자 {item.organizerName}님이 현장에서 배분합니다.
        </p>
      </div>

      {item.status === GROUP_BUY_STATUS.PICKUP && (
        <div className="group-buy-alert group-buy-alert--info" role="status">
          🎉 공동구매가 성사되었습니다!
          {isOrganizer
            ? ' 외부에서 구매 후 픽업 타임에 배분해 주세요.'
            : ' 픽업 시간에 방문해 「수령 완료」를 눌러 주세요.'}
        </div>
      )}

      {error && (
        <div className="group-buy-alert group-buy-alert--error" role="alert">
          {error}
        </div>
      )}

      {user && isRecruiting && !isOrganizer && (
        <div className="group-buy-actions">
          {item.myTier !== 'committed' && (
            <button
              type="button"
              className="group-buy-btn"
              disabled={busy || item.myTier === 'interested'}
              onClick={() => run(() => expressInterest(item.id))}
            >
              {item.myTier === 'interested' ? '✓ 관심 표시함' : '① 관심 있어요'}
            </button>
          )}
          {item.myTier !== 'committed' ? (
            <>
              <label className="group-buy-field" style={{ flex: '1 1 80px', minWidth: 80 }}>
                <span className="group-buy-field__hint">수량</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                />
              </label>
              <button
                type="button"
                className="group-buy-btn group-buy-btn--primary"
                disabled={busy}
                onClick={() => run(() => commitGroupBuy(item.id, quantity))}
              >
                ② 확정 참여 (mock 결제)
              </button>
            </>
          ) : (
            <button
              type="button"
              className="group-buy-btn group-buy-btn--secondary"
              disabled={busy}
              onClick={() => run(() => cancelGroupBuyParticipation(item.id))}
            >
              참여 취소
            </button>
          )}
        </div>
      )}

      {user && isPickup && !isOrganizer && item.myTier === 'committed' && !item.myPickedUp && (
        <div className="group-buy-actions">
          <button
            type="button"
            className="group-buy-btn group-buy-btn--primary"
            disabled={busy}
            onClick={() => run(() => confirmGroupBuyPickup(item.id))}
          >
            수령 완료
          </button>
        </div>
      )}

      {user && isPickup && isOrganizer && (
        <div className="group-buy-actions">
          <button
            type="button"
            className="group-buy-btn group-buy-btn--primary"
            disabled={busy}
            onClick={() => run(() => completeGroupBuyDistribution(item.id))}
          >
            배분 완료 처리
          </button>
          <p className="group-buy-field__hint">
            수령 확인 {item.pickedUpCount}/{item.committedCount}명
          </p>
        </div>
      )}

      {item.status === GROUP_BUY_STATUS.COMPLETED && (
        <div className="group-buy-alert group-buy-alert--info" role="status">
          공동구매가 완료되었습니다.
        </div>
      )}

      {process.env.NODE_ENV === 'development' && isRecruiting && (
        <div className="group-buy-dev">
          <p className="group-buy-dev__title">🧪 테스트: 가짜 참여자 추가</p>
          <div className="group-buy-actions">
            <button
              type="button"
              className="group-buy-btn group-buy-btn--dev"
              disabled={busy}
              onClick={() => run(() => simulateGroupBuy(item.id, { interested: 3, committed: 0 }))}
            >
              관심 +3
            </button>
            <button
              type="button"
              className="group-buy-btn group-buy-btn--dev"
              disabled={busy}
              onClick={() => run(() => simulateGroupBuy(item.id, { interested: 0, committed: 2 }))}
            >
              확정 +2
            </button>
            <button
              type="button"
              className="group-buy-btn group-buy-btn--dev"
              disabled={busy}
              onClick={() =>
                run(() => simulateGroupBuy(item.id, { interested: 5, committed: 5 }))
              }
            >
              관심+5 확정+5
            </button>
          </div>
          {item.devSimulated && (
            <p className="group-buy-field__hint">시뮬레이션 인원이 카운트에 포함되어 있습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default GroupBuyDetailScreen;
