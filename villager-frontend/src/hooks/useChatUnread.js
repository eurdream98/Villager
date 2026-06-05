import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchConversations, sumUnreadMessages } from '../lib/chatApi';
import {
  connectChatStomp,
  getFocusedConversationId,
  onConversationMessage,
} from '../lib/chatStomp';
import { isApiEnabled } from '../lib/api';

export function useChatUnread(enabled = true, userId = null) {
  const [unreadTotal, setUnreadTotal] = useState(0);
  const listenerUnsubsRef = useRef(new Map());

  const clearListeners = useCallback(() => {
    listenerUnsubsRef.current.forEach((unsub) => unsub());
    listenerUnsubsRef.current.clear();
  }, []);

  const syncListeners = useCallback(
    (conversationIds) => {
      const ids = conversationIds ?? [];
      const current = listenerUnsubsRef.current;

      current.forEach((unsub, id) => {
        if (!ids.includes(id)) {
          unsub();
          current.delete(id);
        }
      });

      if (!userId) return;

      ids.forEach((id) => {
        if (current.has(id)) return;
        const unsub = onConversationMessage(id, (msg) => {
          if (msg.userId === userId) return;
          if (getFocusedConversationId() === id) return;
          setUnreadTotal((total) => total + 1);
        });
        current.set(id, unsub);
      });
    },
    [userId],
  );

  const refresh = useCallback(() => {
    if (!isApiEnabled()) {
      setUnreadTotal(0);
      clearListeners();
      return Promise.resolve();
    }
    return fetchConversations()
      .then((convs) => {
        setUnreadTotal(sumUnreadMessages(convs));
        syncListeners(convs.map((c) => c.id));
      })
      .catch(() => {});
  }, [clearListeners, syncListeners]);

  useEffect(() => {
    if (!enabled || !userId) {
      setUnreadTotal(0);
      clearListeners();
      return undefined;
    }

    refresh();
    connectChatStomp().catch(() => {});

    return () => {
      clearListeners();
    };
  }, [enabled, userId, refresh, clearListeners]);

  return { unreadTotal, refreshChatUnread: refresh };
}
