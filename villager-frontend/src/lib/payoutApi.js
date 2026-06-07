import { apiFetch } from './api';

export async function fetchPayoutAccount() {
  return apiFetch('/api/v1/profiles/me/payout-account');
}

export async function fetchPayoutBanks() {
  return apiFetch('/api/v1/profiles/me/payout-account/banks');
}

export async function registerPayoutAccount({ bankCode, accountNumber, accountHolder }) {
  return apiFetch('/api/v1/profiles/me/payout-account', {
    method: 'PUT',
    body: JSON.stringify({ bankCode, accountNumber, accountHolder }),
  });
}

export async function sendPayoutVerification() {
  return apiFetch('/api/v1/profiles/me/payout-account/send-verification', {
    method: 'POST',
  });
}

export async function verifyPayoutAccount(code) {
  return apiFetch('/api/v1/profiles/me/payout-account/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function mapPayoutAccount(row) {
  if (!row) return null;
  return {
    bankCode: row.bankCode,
    bankName: row.bankName,
    accountNumberMasked: row.accountNumberMasked,
    accountHolder: row.accountHolder,
    status: row.status,
    verifiedAt: row.verifiedAt,
    verificationSent: row.verificationSent ?? false,
  };
}

export function mapVerificationSend(row) {
  return {
    depositorName: row.depositorName,
    depositAmount: row.depositAmount ?? 1,
    message: row.message,
    mockVerificationCode: row.mockVerificationCode ?? null,
  };
}

export const PAYOUT_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
};
