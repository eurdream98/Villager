import { useCallback, useEffect, useState } from 'react';
import { isApiEnabled } from '../lib/api';
import { fetchPayoutAccount, mapPayoutAccount, PAYOUT_STATUS } from '../lib/payoutApi';

export function usePayoutAccount(enabled = true) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!enabled || !isApiEnabled()) {
      setAccount(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPayoutAccount();
      const mapped = mapPayoutAccount(data);
      setAccount(mapped);
      return mapped;
    } catch (err) {
      if (err.status === 404) {
        setAccount(null);
        return null;
      }
      setError(err.message || '정산 계좌를 불러오지 못했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isVerified = account?.status === PAYOUT_STATUS.VERIFIED;

  return { account, loading, error, isVerified, refresh, setAccount };
}
