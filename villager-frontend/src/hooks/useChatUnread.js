import { useCallback, useEffect, useState } from 'react';
import { fetchConversations, sumUnreadMessages } from '../lib/chatApi';
import { isApiEnabled } from '../lib/api';

const POLL_MS = 10000;

export function useChatUnread(enabled = true) {
  const [unreadTotal, setUnreadTotal] = useState(0);

  const refresh = useCallback(() => {
    if (!isApiEnabled()) {
      setUnreadTotal(0);
      return Promise.resolve();
    }
    return fetchConversations()
      .then((convs) => {
        setUnreadTotal(sumUnreadMessages(convs));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  return { unreadTotal, refreshChatUnread: refresh };
}
