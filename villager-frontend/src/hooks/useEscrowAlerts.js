import { useEffect, useRef } from 'react';
import { ESCROW_STATUS } from '../lib/escrowApi';

function alertOnce(conversationId, phase, message) {
  const key = `escrow-alert-${conversationId}-${phase}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  window.alert(message);
}

/**
 * 에스크로 상태 전환·타이머 시작·정산/환불 시 1회성 안내 (채팅방 단위)
 */
export function useEscrowAlerts(order, { isBuyer, isSeller }) {
  const prevStatus = useRef(null);
  const prevInspectionDeadline = useRef(null);

  useEffect(() => {
    if (!order?.conversationId) return;

    const status = order.escrowStatus;
    const convId = order.conversationId;
    const was = prevStatus.current;

    if (status === ESCROW_STATUS.PENDING_PAYMENT && order.paymentDeadlineAt) {
      if (was !== ESCROW_STATUS.PENDING_PAYMENT) {
        const msg = isBuyer
          ? `결제 기한이 시작되었습니다.\n${order.paymentDeadlineHours}시간 이내에 결제해 주세요.`
          : `구매자 결제 대기가 시작되었습니다.\n${order.paymentDeadlineHours}시간 이내 미결제 시 주문이 취소됩니다.`;
        alertOnce(convId, 'payment-start', msg);
      }
    }

    if (status === ESCROW_STATUS.SELLER_FULFILLED && order.receiptConfirmDeadlineAt) {
      if (was !== ESCROW_STATUS.SELLER_FULFILLED) {
        const msg = isBuyer
          ? `판매자가 발송/배치를 완료했습니다.\n물건을 받으면 「수령 확인」을 눌러 주세요.\n${order.autoReceiptConfirmHours}시간 내 미확인 시 자동 수령 확정 후 검수 기간이 시작됩니다.`
          : `이행 완료 처리되었습니다.\n구매자 수령 확인 또는 ${order.autoReceiptConfirmHours}시간 후 자동 수령 확정 시 검수 타이머가 시작됩니다.`;
        alertOnce(convId, 'receipt-wait-start', msg);
      }
    }

    if (
      status === ESCROW_STATUS.BUYER_CONFIRMED &&
      order.inspectionDeadlineAt &&
      order.inspectionDeadlineAt !== prevInspectionDeadline.current
    ) {
      const msg = isBuyer
        ? `검수 기간이 시작되었습니다.\n기한 내 「거래 완료」 또는 「문제 신고」를 선택해 주세요.\n미처리 시 자동으로 판매자에게 정산됩니다.`
        : `구매자 수령(확정)이 완료되어 검수 기간이 시작되었습니다.\n기한 내 구매자 조치가 없으면 자동 정산됩니다.`;
      alertOnce(convId, `inspection-${order.inspectionDeadlineAt}`, msg);
      prevInspectionDeadline.current = order.inspectionDeadlineAt;
    }

    if (was && was !== status) {
      if (status === ESCROW_STATUS.RELEASED) {
        const amt = (order.settlementAmount ?? order.amount).toLocaleString();
        const msg = isSeller
          ? `판매자에게 ${amt}원이 정산되었습니다.`
          : `거래가 완료되어 판매자에게 정산되었습니다.`;
        alertOnce(convId, `released-${order.releasedAt ?? 'x'}`, msg);
      }
      if (status === ESCROW_STATUS.REFUNDED) {
        const msg = isBuyer
          ? `구매 금액 ${order.amount.toLocaleString()}원이 환불되었습니다.`
          : `합의에 따라 구매자에게 전액 환불되었습니다.`;
        alertOnce(convId, `refunded-${order.refundedAt ?? 'x'}`, msg);
      }
      if (status === ESCROW_STATUS.PAID_HELD && was === ESCROW_STATUS.PENDING_PAYMENT) {
        const msg = isBuyer
          ? `결제가 완료되었습니다. 금액은 에스크로에 보관됩니다.`
          : `구매자 결제가 완료되었습니다. 발송/배치 후 「이행 완료」를 눌러 주세요.`;
        alertOnce(convId, 'paid-held', msg);
      }
    }

    prevStatus.current = status;
  }, [order, isBuyer, isSeller]);
}
