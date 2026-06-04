import { useState } from 'react';
import { useCountdown } from '../../hooks/useCountdown';
import { useEscrowAlerts } from '../../hooks/useEscrowAlerts';
import { formatPrice } from '../../lib/trade';
import {
  DISPUTE_REASONS,
  ESCROW_STATUS,
  SETTLEMENT_TYPES,
  acceptSettlement,
  completeOrder,
  confirmReceipt,
  formatDeadline,
  fulfillOrder,
  openDispute,
  payOrder,
  proposeSettlement,
} from '../../lib/escrowApi';
import './Trade.css';

const STATUS_STEPS = [
  { key: ESCROW_STATUS.PENDING_PAYMENT, label: '결제' },
  { key: ESCROW_STATUS.PAID_HELD, label: '보관' },
  { key: ESCROW_STATUS.SELLER_FULFILLED, label: '이행' },
  { key: ESCROW_STATUS.BUYER_CONFIRMED, label: '검수' },
  { key: ESCROW_STATUS.RELEASED, label: '정산' },
];

const STATUS_LABEL = {
  [ESCROW_STATUS.PENDING_PAYMENT]: '결제 대기',
  [ESCROW_STATUS.PAID_HELD]: '결제 완료 · 보관 중',
  [ESCROW_STATUS.SELLER_FULFILLED]: '판매자 이행 완료',
  [ESCROW_STATUS.BUYER_CONFIRMED]: '수령 확인 · 검수 중',
  [ESCROW_STATUS.DISPUTED]: '분쟁 · 합의 진행',
  [ESCROW_STATUS.RELEASED]: '거래 완료 · 정산됨',
  [ESCROW_STATUS.REFUNDED]: '환불 완료',
  [ESCROW_STATUS.CANCELLED]: '주문 취소',
};

function stepIndex(status) {
  if (status === ESCROW_STATUS.DISPUTED) return 3;
  if (status === ESCROW_STATUS.REFUNDED || status === ESCROW_STATUS.CANCELLED) return -1;
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  if (status === ESCROW_STATUS.RELEASED) return STATUS_STEPS.length - 1;
  return idx;
}

function TradeEscrowPanel({
  order,
  currentUserId,
  sellerId,
  listingFree,
  onAction,
}) {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [disputeReason, setDisputeReason] = useState('damaged');
  const [disputeDetail, setDisputeDetail] = useState('');
  const [settlementType, setSettlementType] = useState('keep_full');
  const [refundAmount, setRefundAmount] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');

  const isBuyer = order && currentUserId === order.buyerId;
  const isSeller = order && currentUserId === sellerId;
  const status = order?.escrowStatus;

  const paymentCountdown = useCountdown(
    status === ESCROW_STATUS.PENDING_PAYMENT ? order?.paymentDeadlineAt : null,
  );
  const receiptCountdown = useCountdown(
    status === ESCROW_STATUS.SELLER_FULFILLED ? order?.receiptConfirmDeadlineAt : null,
  );
  const inspectionCountdown = useCountdown(
    status === ESCROW_STATUS.BUYER_CONFIRMED ? order?.inspectionDeadlineAt : null,
  );

  useEscrowAlerts(order, { isBuyer, isSeller });

  if (listingFree || !order) return null;

  const currentStep = stepIndex(status);

  const run = async (fn) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
      await onAction?.();
    } catch (err) {
      setError(err.message || '처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handlePay = () => run(() => payOrder(order.conversationId));
  const handleFulfill = () => run(() => fulfillOrder(order.conversationId));
  const handleConfirmReceipt = () => run(() => confirmReceipt(order.conversationId));
  const handleComplete = () => run(() => completeOrder(order.conversationId));
  const handleDispute = () =>
    run(async () => {
      await openDispute(order.conversationId, {
        reason: DISPUTE_REASONS.find((r) => r.id === disputeReason)?.label ?? disputeReason,
        detail: disputeDetail,
      });
      setShowDispute(false);
    });
  const handleProposeSettlement = () =>
    run(async () => {
      await proposeSettlement(order.conversationId, {
        type: settlementType,
        refundAmount: settlementType === 'partial_refund' ? Number(refundAmount) : null,
        notes: settlementNotes,
      });
      setShowSettlement(false);
    });
  const handleAcceptSettlement = () => run(() => acceptSettlement(order.conversationId));

  const canPay = isBuyer && status === ESCROW_STATUS.PENDING_PAYMENT;
  const canFulfill = isSeller && status === ESCROW_STATUS.PAID_HELD;
  const canConfirmReceipt = isBuyer && status === ESCROW_STATUS.SELLER_FULFILLED;
  const canComplete = isBuyer && status === ESCROW_STATUS.BUYER_CONFIRMED;
  const canDispute = isBuyer && status === ESCROW_STATUS.BUYER_CONFIRMED;
  const canProposeSettlement =
    (status === ESCROW_STATUS.DISPUTED || status === ESCROW_STATUS.BUYER_CONFIRMED) &&
    !order.pendingSettlementType;
  const canAcceptSettlement =
    order.pendingSettlementType &&
    order.pendingSettlementBy &&
    order.pendingSettlementBy !== currentUserId;

  return (
    <div className="trade-escrow">
      <p className="trade-escrow__badge">💳 에스크로 결제</p>
      <p className="trade-escrow__amount">{formatPrice(order.amount, false)}</p>
      <p className="trade-escrow__status">{STATUS_LABEL[status] ?? status}</p>

      {currentStep >= 0 && status !== ESCROW_STATUS.DISPUTED && (
        <ol className="trade-escrow__steps" aria-label="에스크로 진행 단계">
          {STATUS_STEPS.map((step, i) => (
            <li
              key={step.key}
              className={`trade-escrow__step${i <= currentStep ? ' trade-escrow__step--done' : ''}${i === currentStep ? ' trade-escrow__step--current' : ''}`}
            >
              {step.label}
            </li>
          ))}
        </ol>
      )}

      {status === ESCROW_STATUS.PENDING_PAYMENT && order.paymentDeadlineAt && (
        <p className="trade-escrow__deadline">
          {isBuyer ? (
            <>
              <strong>결제 기한</strong>{' '}
              <span className="trade-escrow__countdown">{paymentCountdown}</span>
              <br />
              <span className="trade-escrow__hint">
                ({formatDeadline(order.paymentDeadlineAt)}까지 · 미결제 시 주문 취소)
              </span>
            </>
          ) : (
            <>
              구매자 결제 대기 ·{' '}
              <span className="trade-escrow__countdown">{paymentCountdown}</span>
            </>
          )}
        </p>
      )}

      {status === ESCROW_STATUS.SELLER_FULFILLED && order.receiptConfirmDeadlineAt && (
        <p className="trade-escrow__deadline">
          {isBuyer ? (
            <>
              수령 확인 또는 자동 확정까지{' '}
              <span className="trade-escrow__countdown">{receiptCountdown}</span>
              <br />
              <span className="trade-escrow__hint">
                기한 후 검수 타이머가 자동으로 시작됩니다.
              </span>
            </>
          ) : (
            <>
              구매자 수령 확인 대기 · 자동 확정{' '}
              <span className="trade-escrow__countdown">{receiptCountdown}</span>
            </>
          )}
        </p>
      )}

      {status === ESCROW_STATUS.BUYER_CONFIRMED && order.inspectionDeadlineAt && (
        <p className="trade-escrow__deadline">
          검수 기간 · 자동 정산까지{' '}
          <span className="trade-escrow__countdown">{inspectionCountdown}</span>
          <br />
          <span className="trade-escrow__hint">
            ({formatDeadline(order.inspectionDeadlineAt)}까지) 문제 없으면 「거래 완료」,
            하자 있으면 「문제 신고」
          </span>
        </p>
      )}

      {status === ESCROW_STATUS.DISPUTED && (
        <p className="trade-escrow__deadline trade-escrow__deadline--warn">
          자동 정산이 중단되었습니다. 채팅으로 합의한 뒤 합의안을 제안·수락해 주세요.
          {order.disputeReason && (
            <>
              <br />
              신고 사유: {order.disputeReason}
            </>
          )}
        </p>
      )}

      {order.pendingSettlementType && (
        <div className="trade-escrow__pending">
          <p>
            {order.pendingSettlementByName}님의 합의안:{' '}
            {SETTLEMENT_TYPES.find((t) => t.id === order.pendingSettlementType)?.label ??
              order.pendingSettlementType}
            {order.pendingSettlementAmount != null &&
              order.pendingSettlementType === 'partial_refund' &&
              ` (${order.pendingSettlementAmount.toLocaleString()}원 환불)`}
          </p>
          {canAcceptSettlement && (
            <button
              type="button"
              className="trade-apt__btn trade-apt__btn--primary"
              disabled={busy}
              onClick={handleAcceptSettlement}
            >
              합의 수락
            </button>
          )}
          {!canAcceptSettlement && order.pendingSettlementBy === currentUserId && (
            <p className="trade-escrow__hint">상대방의 수락을 기다리는 중입니다.</p>
          )}
        </div>
      )}

      {error && (
        <p className="trade-apt__error" role="alert">
          {error}
        </p>
      )}

      <div className="trade-escrow__actions">
        {canPay && (
          <button
            type="button"
            className="trade-apt__btn trade-apt__btn--primary"
            disabled={busy}
            onClick={handlePay}
          >
            {order.amount.toLocaleString()}원 결제하기
          </button>
        )}
        {canFulfill && (
          <button
            type="button"
            className="trade-apt__btn trade-apt__btn--primary"
            disabled={busy}
            onClick={handleFulfill}
          >
            {order.tradeMethod === 'shipping' ? '발송 완료' : '문고리 배치 완료'}
          </button>
        )}
        {canConfirmReceipt && (
          <button
            type="button"
            className="trade-apt__btn trade-apt__btn--primary"
            disabled={busy}
            onClick={handleConfirmReceipt}
          >
            수령 확인
          </button>
        )}
        {canComplete && (
          <button
            type="button"
            className="trade-apt__btn trade-apt__btn--primary"
            disabled={busy}
            onClick={handleComplete}
          >
            거래 완료
          </button>
        )}
        {canDispute && !showDispute && (
          <button
            type="button"
            className="trade-apt__btn"
            disabled={busy}
            onClick={() => setShowDispute(true)}
          >
            문제 신고
          </button>
        )}
        {canProposeSettlement && !showSettlement && (
          <button
            type="button"
            className="trade-apt__btn"
            disabled={busy}
            onClick={() => setShowSettlement(true)}
          >
            합의안 제안
          </button>
        )}
      </div>

      {showDispute && (
        <form
          className="trade-escrow__form"
          onSubmit={(e) => {
            e.preventDefault();
            handleDispute();
          }}
        >
          <label className="trade-apt__legend" htmlFor="dispute-reason">
            신고 사유
          </label>
          <select
            id="dispute-reason"
            className="trade-apt__input"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
          >
            {DISPUTE_REASONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <label className="trade-apt__legend" htmlFor="dispute-detail">
            상세 설명 (선택)
          </label>
          <textarea
            id="dispute-detail"
            className="trade-apt__input trade-escrow__textarea"
            rows={3}
            maxLength={500}
            value={disputeDetail}
            onChange={(e) => setDisputeDetail(e.target.value)}
            placeholder="사진은 채팅으로 보내 주세요."
          />
          <div className="trade-apt__actions">
            <button type="submit" className="trade-apt__btn trade-apt__btn--primary" disabled={busy}>
              신고 접수
            </button>
            <button type="button" className="trade-apt__btn" onClick={() => setShowDispute(false)}>
              취소
            </button>
          </div>
        </form>
      )}

      {showSettlement && (
        <form
          className="trade-escrow__form"
          onSubmit={(e) => {
            e.preventDefault();
            handleProposeSettlement();
          }}
        >
          <label className="trade-apt__legend" htmlFor="settlement-type">
            합의 유형
          </label>
          <select
            id="settlement-type"
            className="trade-apt__input"
            value={settlementType}
            onChange={(e) => setSettlementType(e.target.value)}
          >
            {SETTLEMENT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          {settlementType === 'partial_refund' && (
            <>
              <label className="trade-apt__legend" htmlFor="refund-amount">
                환불 금액 (원)
              </label>
              <input
                id="refund-amount"
                className="trade-apt__input"
                type="number"
                min={1}
                max={order.amount - 1}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                required
              />
            </>
          )}
          <label className="trade-apt__legend" htmlFor="settlement-notes">
            메모 (선택)
          </label>
          <input
            id="settlement-notes"
            className="trade-apt__input"
            type="text"
            maxLength={300}
            value={settlementNotes}
            onChange={(e) => setSettlementNotes(e.target.value)}
          />
          <div className="trade-apt__actions">
            <button type="submit" className="trade-apt__btn trade-apt__btn--primary" disabled={busy}>
              제안하기
            </button>
            <button type="button" className="trade-apt__btn" onClick={() => setShowSettlement(false)}>
              취소
            </button>
          </div>
        </form>
      )}

      {(status === ESCROW_STATUS.RELEASED || status === ESCROW_STATUS.REFUNDED) && (
        <p className="trade-escrow__hint">
          {status === ESCROW_STATUS.RELEASED &&
            `판매자 정산: ${(order.settlementAmount ?? order.amount).toLocaleString()}원`}
          {status === ESCROW_STATUS.REFUNDED && '구매자에게 전액 환불되었습니다.'}
        </p>
      )}

      {order.paymentRef?.startsWith('mock-') && (
        <p className="trade-escrow__mock">개발 모드: mock 결제 (PG 미연동)</p>
      )}
    </div>
  );
}

export default TradeEscrowPanel;
