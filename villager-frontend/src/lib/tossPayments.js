import { confirmPayment, payOrder, preparePayment } from './escrowApi';

const PENDING_STORAGE_KEY = 'villager_toss_pending';
const RETURN_STORAGE_KEY = 'villager_toss_return';

let tossModulePromise;

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

async function loadTossSdk() {
  if (!tossModulePromise) {
    tossModulePromise = import('@tosspayments/tosspayments-sdk');
  }
  return tossModulePromise;
}

export function savePendingTossPayment(pending) {
  try {
    sessionStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(pending));
  } catch {
    /* ignore */
  }
}

export function readPendingTossPayment() {
  try {
    const raw = sessionStorage.getItem(PENDING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingTossPayment() {
  try {
    sessionStorage.removeItem(PENDING_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function readStoredReturn() {
  try {
    const raw = sessionStorage.getItem(RETURN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearStoredReturn() {
  try {
    sessionStorage.removeItem(RETURN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * 결제 준비 → mock | promise(데스크�p·iframe) | redirect(모바일)
 * @returns {'mock'|'confirmed'|'redirect'}
 */
export async function startEscrowPayment(conversationId) {
  const prep = await preparePayment(conversationId);

  if (prep.mode === 'mock') {
    await payOrder(conversationId);
    return 'mock';
  }

  savePendingTossPayment({
    conversationId: prep.conversationId,
    orderId: prep.orderId,
    amount: prep.amount,
  });

  const { loadTossPayments, ANONYMOUS } = await loadTossSdk();
  const tossPayments = await loadTossPayments(prep.clientKey);
  const customerKey = prep.customerKey ? String(prep.customerKey) : ANONYMOUS;
  const payment = tossPayments.payment({ customerKey });

  const paymentRequest = {
    method: 'CARD',
    amount: {
      currency: 'KRW',
      value: prep.amount,
    },
    orderId: prep.orderId,
    orderName: prep.orderName,
    card: {
      useEscrow: false,
      flowMode: 'DEFAULT',
    },
  };

  // 데스크톱: 리다이렉트 없이 iframe → paymentKey 받아서 바로 서버 승인
  const forceRedirect = process.env.REACT_APP_TOSS_FORCE_REDIRECT === 'true';
  if (!forceRedirect && !isMobileDevice()) {
    const result = await payment.requestPayment({
      ...paymentRequest,
      windowTarget: 'iframe',
    });
    await confirmPayment(conversationId, {
      paymentKey: result.paymentKey,
      orderId: result.orderId,
      amount: result.amount?.value ?? prep.amount,
    });
    clearPendingTossPayment();
    return 'confirmed';
  }

  // 모바일·QR: payment-success.html 로 리다이렉트 (쿼리 보존 후 / 로 이동)
  await payment.requestPayment({
    ...paymentRequest,
    successUrl: prep.successUrl,
    failUrl: prep.failUrl,
  });

  return 'redirect';
}

export function isTossPaymentReturn() {
  if (readStoredReturn()) return true;

  const params = new URLSearchParams(window.location.search);
  if (params.get('toss') === 'success' || params.get('toss') === 'fail') {
    return true;
  }
  return Boolean(params.get('paymentKey') && readPendingTossPayment());
}

export function readTossPaymentReturn() {
  const stored = readStoredReturn();
  if (stored) return stored;

  const params = new URLSearchParams(window.location.search);
  const pending = readPendingTossPayment();

  let toss = params.get('toss');
  if (!toss && params.get('paymentKey')) {
    toss = 'success';
  }
  if (toss !== 'success' && toss !== 'fail') {
    return null;
  }

  const conversationId = params.get('conversationId') || pending?.conversationId || null;
  const orderId = params.get('orderId') || pending?.orderId || null;
  const amountRaw = params.get('amount') ?? (pending?.amount != null ? String(pending.amount) : null);
  const amount = amountRaw != null ? Number(amountRaw) : null;

  return {
    toss,
    conversationId,
    paymentKey: params.get('paymentKey'),
    orderId,
    amount: Number.isFinite(amount) ? amount : null,
    code: params.get('code'),
    message: params.get('message'),
  };
}

export function clearTossPaymentParamsFromUrl() {
  clearStoredReturn();
  const url = new URL(window.location.href);
  [
    'toss',
    'conversationId',
    'paymentKey',
    'orderId',
    'amount',
    'code',
    'message',
  ].forEach((key) => url.searchParams.delete(key));
  const next = url.pathname + url.search + url.hash;
  window.history.replaceState({}, '', next || '/');
}
