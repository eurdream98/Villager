import { supabase } from './supabase';

/** 레벨당 필요 누적 XP (향후 Supabase 규칙과 맞추기 쉽게 분리) */
export function xpRequiredForLevel(level) {
  return level * 120;
}

export function getLevelFromXp(totalXp) {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpRequiredForLevel(level)) {
    remaining -= xpRequiredForLevel(level);
    level += 1;
  }
  return { level, xpInLevel: remaining, xpToNext: xpRequiredForLevel(level) };
}

export function getLevelProgress(totalXp) {
  const { level, xpInLevel, xpToNext } = getLevelFromXp(totalXp);
  return {
    level,
    xpInLevel,
    xpToNext,
    percent: Math.min(100, Math.round((xpInLevel / xpToNext) * 100)),
  };
}

/** 개인 성장 기여도 — Supabase 연동 전 데모 데이터 */
export const DEMO_PERSONAL = {
  totalXp: 340,
  recentActivities: [
    { id: '1', label: '거래 글 등록', xp: 15, at: '오늘' },
    { id: '2', label: '커뮤니티 댓글 작성', xp: 8, at: '어제' },
    { id: '3', label: '알바 지원 완료', xp: 20, at: '3일 전' },
  ],
};

/** 동네별 공동 나무 — 지도 좌표는 0~100% (향후 lat/lng로 교체) */
export const DEMO_NEIGHBORHOOD_TREES = [
  {
    id: 'yeoksam',
    name: '역삼동',
    totalXp: 12400,
    mapX: 58,
    mapY: 42,
    residentCount: 128,
  },
  {
    id: 'nonhyeon',
    name: '논현동',
    totalXp: 9800,
    mapX: 42,
    mapY: 55,
    residentCount: 96,
  },
  {
    id: 'cheongdam',
    name: '청담동',
    totalXp: 15200,
    mapX: 72,
    mapY: 28,
    residentCount: 74,
  },
  {
    id: 'sinsa',
    name: '신사동',
    totalXp: 7600,
    mapX: 35,
    mapY: 38,
    residentCount: 112,
  },
  {
    id: 'apgujeong',
    name: '압구정동',
    totalXp: 11100,
    mapX: 65,
    mapY: 62,
    residentCount: 88,
  },
];

export function getTreeStage(totalXp) {
  if (totalXp >= 15000) return 5;
  if (totalXp >= 10000) return 4;
  if (totalXp >= 6000) return 3;
  if (totalXp >= 2500) return 2;
  return 1;
}

export function getTreeStageLabel(stage) {
  const labels = ['새싹', '묘목', '어린 나무', '무성한 나무', '동네 대표 나무'];
  return labels[stage - 1] ?? labels[0];
}

export async function fetchPersonalGrowth(userId) {
  if (!userId) return DEMO_PERSONAL;

  const { data, error } = await supabase
    .from('member_growth')
    .select('total_xp, recent_activities')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return DEMO_PERSONAL;
  }

  return {
    totalXp: data.total_xp ?? 0,
    recentActivities: data.recent_activities ?? [],
  };
}

export async function fetchNeighborhoodTrees() {
  const { data, error } = await supabase
    .from('neighborhood_trees')
    .select('id, name, total_xp, map_x, map_y, resident_count')
    .order('total_xp', { ascending: false });

  if (error || !data?.length) {
    return DEMO_NEIGHBORHOOD_TREES;
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    totalXp: row.total_xp ?? 0,
    mapX: row.map_x ?? 50,
    mapY: row.map_y ?? 50,
    residentCount: row.resident_count ?? 0,
  }));
}
