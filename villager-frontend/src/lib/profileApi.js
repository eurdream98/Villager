import { apiFetch, isApiEnabled } from './api';
import { fetchMemberProfile as fetchMemberProfileSupabase } from './profile';
import { getAuthProvider, getAvatarUrl, getDisplayName, getProviderLabel } from './user';

export async function fetchMemberProfileFromApi() {
  return apiFetch('/api/v1/profiles/me');
}

export async function fetchMemberProfile(userId) {
  if (isApiEnabled()) {
    try {
      return await fetchMemberProfileFromApi();
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  }
  return fetchMemberProfileSupabase(userId);
}

export function resolveMemberDisplay(profile, authUser) {
  const provider =
    profile?.provider || getAuthProvider(authUser);

  return {
    displayName:
      profile?.displayName ||
      profile?.display_name ||
      profile?.nickname ||
      getDisplayName(authUser),
    avatarUrl:
      profile?.avatarUrl ||
      profile?.avatar_url ||
      getAvatarUrl(authUser),
    email: profile?.email || authUser?.email || null,
    provider,
    providerLabel: getProviderLabel(provider),
  };
}
