/** 로그인 제공자 (google | kakao 등) */
export function getAuthProvider(user) {
  const fromMeta = user?.app_metadata?.provider;
  if (fromMeta) return fromMeta;

  const identity = user?.identities?.find((i) => i.provider);
  return identity?.provider ?? null;
}

/** Google / Kakao 등 메타데이터에서 표시 이름 */
export function getDisplayName(user) {
  const meta = user?.user_metadata ?? {};
  return (
    meta.nickname ||
    meta.name ||
    meta.full_name ||
    user?.email ||
    '이웃'
  );
}

export function getAvatarUrl(user) {
  const meta = user?.user_metadata ?? {};
  return meta.avatar_url || meta.picture || null;
}

export function getProviderLabel(provider) {
  if (provider === 'kakao') return '카카오';
  if (provider === 'google') return 'Google';
  return provider ?? '';
}
