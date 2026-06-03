import { useEffect, useState } from 'react';
import { fetchNeighborhoodTrees, fetchPersonalGrowth } from '../lib/growthApi';

export function useGrowthStats(userId) {
  const [personal, setPersonal] = useState(null);
  const [neighborhoodTrees, setNeighborhoodTrees] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setPersonal(null);
      setNeighborhoodTrees([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    setLoading(true);
    setError(null);
    Promise.all([fetchPersonalGrowth(userId), fetchNeighborhoodTrees()])
      .then(([personalData, trees]) => {
        if (!cancelled) {
          setPersonal(personalData);
          setNeighborhoodTrees(trees);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { personal, neighborhoodTrees, loading, error };
}
