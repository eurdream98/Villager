import { apiFetch } from './api';

export async function fetchOrder(conversationId) {
  const data = await apiFetch(`/api/v1/conversations/${conversationId}/order`);
  return data ? mapOrder(data) : null;
}

export async function payOrder(conversationId) {
  const data = await apiFetch(`/api/v1/conversations/${conversationId}/order/pay`, {
    method: 'POST',
  });
  return mapOrder(data);
}

export async function fulfillOrder(conversationId) {
  const data = await apiFetch(`/api/v1/conversations/${conversationId}/order/fulfill`, {
    method: 'POST',
  });
  return mapOrder(data);
}

export async function confirmReceipt(conversationId) {
  const data = await apiFetch(
    `/api/v1/conversations/${conversationId}/order/confirm-receipt`,
    { method: 'POST' },
  );
  return mapOrder(data);
}

export async function completeOrder(conversationId) {
  const data = await apiFetch(`/api/v1/conversations/${conversationId}/order/complete`, {
    method: 'POST',
  });
  return mapOrder(data);
}

export async function openDispute(conversationId, { reason, detail }) {
  const data = await apiFetch(`/api/v1/conversations/${conversationId}/order/dispute`, {
    method: 'POST',
    body: JSON.stringify({ reason, detail }),
  });
  return mapOrder(data);
}

export async function proposeSettlement(conversationId, { type, refundAmount, notes }) {
  const data = await apiFetch(
    `/api/v1/conversations/${conversationId}/order/propose-settlement`,
    {
      method: 'POST',
      body: JSON.stringify({ type, refundAmount, notes }),
    },
  );
  return mapOrder(data);
}

export async function acceptSettlement(conversationId) {
  const data = await apiFetch(
    `/api/v1/conversations/${conversationId}/order/accept-settlement`,
    { method: 'POST' },
  );
  return mapOrder(data);
}

export const ESCROW_STATUS = {
  NONE: 'none',
  PENDING_PAYMENT: 'pending_payment',
  PAID_HELD: 'paid_held',
  SELLER_FULFILLED: 'seller_fulfilled',
  BUYER_CONFIRMED: 'buyer_confirmed',
  DISPUTED: 'disputed',
  RELEASED: 'released',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

export const DISPUTE_REASONS = [
  { id: 'not_received', label: '미수령' },
  { id: 'damaged', label: '파손·하자' },
  { id: 'not_as_described', label: '설명과 다름' },
  { id: 'other', label: '기타' },
];

export const SETTLEMENT_TYPES = [
  { id: 'keep_full', label: '그대로 구매 (전액 정산)' },
  { id: 'return_refund', label: '반품 후 전액 환불' },
  { id: 'partial_refund', label: '부분 환불 (할인)' },
];

export function formatDeadline(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRemaining(iso) {
  return formatCountdown(iso, { expiredLabel: '기한 만료' });
}

/** 남은 시간 카운트다운 (예: 6일 23:59:59, 23:59:59) */
export function formatCountdown(iso, { expiredLabel = '00:00:00' } = {}) {
  if (!iso) return '';
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return expiredLabel;

  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  const clock = `${pad(h)}:${pad(m)}:${pad(s)}`;
  if (days > 0) return `${days}일 ${clock}`;
  return clock;
}

function mapOrder(row) {
  return {
    id: row.id,
    conversationId: row.conversationId,
    listingId: row.listingId,
    buyerId: row.buyerId,
    sellerId: row.sellerId,
    appointmentId: row.appointmentId,
    tradeMethod: row.tradeMethod,
    amount: row.amount ?? 0,
    escrowStatus: row.escrowStatus,
    paidAt: row.paidAt,
    fulfilledAt: row.fulfilledAt,
    confirmedAt: row.confirmedAt,
    releasedAt: row.releasedAt,
    refundedAt: row.refundedAt,
    paymentDeadlineAt: row.paymentDeadlineAt,
    inspectionDeadlineAt: row.inspectionDeadlineAt,
    receiptConfirmDeadlineAt: row.receiptConfirmDeadlineAt,
    disputedAt: row.disputedAt,
    disputeReason: row.disputeReason,
    disputeDetail: row.disputeDetail,
    settlementAmount: row.settlementAmount,
    pendingSettlementType: row.pendingSettlementType,
    pendingSettlementAmount: row.pendingSettlementAmount,
    pendingSettlementBy: row.pendingSettlementBy,
    pendingSettlementByName: row.pendingSettlementByName,
    pendingSettlementAt: row.pendingSettlementAt,
    paymentRef: row.paymentRef,
    escrowEnabled: row.escrowEnabled ?? true,
    paymentDeadlineHours: row.paymentDeadlineHours ?? 24,
    inspectionDeadlineHours: row.inspectionDeadlineHours ?? 168,
    autoReceiptConfirmHours: row.autoReceiptConfirmHours ?? 168,
  };
}
