import { supabase } from './supabase';
import {
  getAuthProvider,
  getAvatarUrl,
  getDisplayName,
  getProviderLabel,
} from './user';

/**
 * Supabase `profiles` 테이블 (id = auth.users.id).
 * 컬럼이 없으면 select에서 제외해도 되며, 없을 때는 auth 메타데이터로 표시합니다.
 */
export async function fetchMemberProfile(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, nickname, avatar_url, email, provider')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Villager] 프로필 조회 실패', error.message);
    return null;
  }

  return data;
}

export function resolveMemberDisplay(profile, authUser) {
  const provider = profile?.provider || getAuthProvider(authUser);

  return {
    displayName:
      profile?.display_name ||
      profile?.nickname ||
      getDisplayName(authUser),
    avatarUrl: profile?.avatar_url || getAvatarUrl(authUser),
    email: profile?.email || authUser?.email || null,
    provider,
    providerLabel: getProviderLabel(provider),
  };
}
