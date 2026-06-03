import { useEffect, useMemo, useState } from 'react';
import { fetchMemberProfile, resolveMemberDisplay } from '../lib/profileApi';

export function useMemberProfile(authUser) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(authUser?.id));

  useEffect(() => {
    let cancelled = false;

    if (!authUser?.id) {
      setProfile(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    fetchMemberProfile(authUser.id).then((data) => {
      if (!cancelled) {
        setProfile(data);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  const member = useMemo(
    () => resolveMemberDisplay(profile, authUser),
    [profile, authUser],
  );

  return { profile, member, loading };
}
