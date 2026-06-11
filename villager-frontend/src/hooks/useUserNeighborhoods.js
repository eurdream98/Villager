import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchUserNeighborhoods,
  isNeighborhoodVerified,
  registerUserNeighborhood,
  verifyNeighborhoodWithGps,
} from '../lib/neighborhoodApi';
import { isApiEnabled } from '../lib/api';

const ACTIVE_SLOT_KEY = 'villager_active_neighborhood_slot';

function readActiveSlot() {
  const raw = localStorage.getItem(ACTIVE_SLOT_KEY);
  const slot = Number(raw);
  return slot === 2 ? 2 : 1;
}

export function useUserNeighborhoods(enabled) {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);
  const [activeSlot, setActiveSlotState] = useState(readActiveSlot);

  const reload = useCallback(async () => {
    if (!enabled || !isApiEnabled()) {
      setNeighborhoods([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserNeighborhoods();
      setNeighborhoods(data);
    } catch (err) {
      setError(err.message || '동네 정보를 불러오지 못했습니다.');
      setNeighborhoods([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const setActiveSlot = useCallback((slot) => {
    const next = slot === 2 ? 2 : 1;
    setActiveSlotState(next);
    localStorage.setItem(ACTIVE_SLOT_KEY, String(next));
  }, []);

  const activeNeighborhood = useMemo(() => {
    const bySlot = neighborhoods.find((n) => n.slot === activeSlot);
    return bySlot ?? neighborhoods[0] ?? null;
  }, [neighborhoods, activeSlot]);

  const hasRegistration = neighborhoods.length > 0;

  const needsOnboarding = !loading && enabled && isApiEnabled() && neighborhoods.length === 0;

  const register = useCallback(async ({ slot, name, latitude, longitude }) => {
    const row = await registerUserNeighborhood({ slot, name, latitude, longitude });
    setNeighborhoods((prev) => {
      const filtered = prev.filter((n) => n.slot !== row.slot && n.neighborhoodId !== row.neighborhoodId);
      return [...filtered, row].sort((a, b) => a.slot - b.slot);
    });
    setActiveSlot(row.slot);
    return row;
  }, [setActiveSlot]);

  const verify = useCallback(async (userNeighborhoodId) => {
    const row = await verifyNeighborhoodWithGps(userNeighborhoodId);
    setNeighborhoods((prev) =>
      prev.map((n) => (n.id === row.id ? row : n)),
    );
    return row;
  }, []);

  const isVerified = useCallback(
    (neighborhoodId) => {
      const row = neighborhoods.find((n) => n.neighborhoodId === neighborhoodId);
      return isNeighborhoodVerified(row);
    },
    [neighborhoods],
  );

  const feedNeighborhoodIds = useMemo(
    () => neighborhoods.map((n) => n.neighborhoodId).filter(Boolean),
    [neighborhoods],
  );

  return {
    neighborhoods,
    activeNeighborhood,
    activeSlot,
    setActiveSlot,
    feedNeighborhoodIds,
    hasRegistration,
    needsOnboarding,
    loading,
    error,
    reload,
    register,
    verify,
    isVerified,
    isNeighborhoodVerified,
  };
}
