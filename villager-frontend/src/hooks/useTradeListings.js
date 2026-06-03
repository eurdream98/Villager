import { useCallback, useEffect, useState } from 'react';
import { createTradeListingFromApi, fetchTradeListings } from '../lib/tradeApi';
import { isApiEnabled } from '../lib/api';

export function useTradeListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchTradeListings()
      .then((data) => {
        setListings(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addListing = useCallback(async (form) => {
    if (!isApiEnabled()) {
      throw new Error('백엔드 API가 설정되지 않았습니다.');
    }
    const listing = await createTradeListingFromApi(form);
    setListings((prev) => [listing, ...prev]);
    return listing;
  }, []);

  return { listings, loading, error, addListing, reload };
}
