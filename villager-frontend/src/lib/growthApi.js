import { apiFetch, isApiEnabled } from './api';
import {
  DEMO_PERSONAL,
  fetchNeighborhoodTrees as fetchTreesSupabase,
  fetchPersonalGrowth as fetchPersonalSupabase,
  getLevelProgress,
} from './growth';

export async function fetchPersonalGrowthFromApi() {
  const data = await apiFetch('/api/v1/growth/me');
  return {
    totalXp: data.totalXp ?? 0,
    level: data.level,
    xpInLevel: data.xpInLevel,
    xpToNext: data.xpToNext,
    percent: data.percent,
    recentActivities: [],
  };
}

export async function fetchNeighborhoodTreesFromApi() {
  const data = await apiFetch('/api/v1/neighborhoods/trees');
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    totalXp: row.totalXp ?? 0,
    mapX: row.mapX ?? 50,
    mapY: row.mapY ?? 50,
    residentCount: row.residentCount ?? 0,
  }));
}

export async function fetchPersonalGrowth(userId) {
  if (isApiEnabled()) {
    return fetchPersonalGrowthFromApi();
  }
  if (!userId) return DEMO_PERSONAL;
  return fetchPersonalSupabase(userId);
}

export async function fetchNeighborhoodTrees() {
  if (isApiEnabled()) {
    return fetchNeighborhoodTreesFromApi();
  }
  return fetchTreesSupabase();
}

export function getPersonalProgress(personal) {
  if (personal?.level != null) {
    return {
      level: personal.level,
      xpInLevel: personal.xpInLevel,
      xpToNext: personal.xpToNext,
      percent: personal.percent,
    };
  }
  return getLevelProgress(personal?.totalXp ?? 0);
}
