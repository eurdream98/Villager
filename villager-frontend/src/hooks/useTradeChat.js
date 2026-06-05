import { useCallback, useEffect, useRef, useState } from 'react';
import {
  confirmAppointment as confirmAppointmentApi,
  fetchAppointment,
  fetchMessages,
  proposeAppointment as proposeAppointmentApi,
  resetAppointment as resetAppointmentApi,
  sendMessage as sendMessageApi,
} from '../lib/chatApi';
import {
  connectChatStomp,
  setFocusedConversationId,
  subscribeConversation,
} from '../lib/chatStomp';
import { fetchOrder } from '../lib/escrowApi';
import { isApiEnabled } from '../lib/api';

function appendMessage(messages, msg) {
  if (!msg?.id) return messages;
  if (messages.some((m) => m.id === msg.id)) return messages;
  return [...messages, msg];
}

export function useTradeChat(conversationId) {
  const [messages, setMessages] = useState([]);
  const [appointment, setAppointment] = useState(null);
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('idle');
  const conversationIdRef = useRef(conversationId);

  const refresh = useCallback(async () => {
    if (!conversationId || !isApiEnabled()) return;
    try {
      const [msgs, apt, ord] = await Promise.all([
        fetchMessages(conversationId),
        fetchAppointment(conversationId),
        fetchOrder(conversationId),
      ]);
      setMessages(msgs);
      setAppointment(apt);
      setOrder(ord);
      setStatus('connected');
    } catch {
      setStatus('error');
    }
  }, [conversationId]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setAppointment(null);
      setOrder(null);
      setStatus('idle');
      setFocusedConversationId(null);
      return undefined;
    }

    if (!isApiEnabled()) {
      setStatus('error');
      return undefined;
    }

    setFocusedConversationId(conversationId);
    setStatus('connecting');
    refresh();

    connectChatStomp().catch(() => {});

    const unsubscribe = subscribeConversation(conversationId, {
      onMessage: (msg) => {
        if (conversationIdRef.current !== conversationId) return;
        setMessages((prev) => appendMessage(prev, msg));
      },
      onAppointment: (apt) => {
        if (conversationIdRef.current !== conversationId) return;
        setAppointment(apt);
      },
      onOrder: (ord) => {
        if (conversationIdRef.current !== conversationId) return;
        setOrder(ord);
      },
    });

    return () => {
      unsubscribe();
      if (conversationIdRef.current === conversationId) {
        setFocusedConversationId(null);
      }
    };
  }, [conversationId, refresh]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text?.trim();
      if (!trimmed || !conversationId) return false;
      try {
        const saved = await sendMessageApi(conversationId, trimmed);
        setMessages((prev) => appendMessage(prev, saved));
        return true;
      } catch {
        return false;
      }
    },
    [conversationId],
  );

  const proposeAppointment = useCallback(
    async (draft) => {
      if (!conversationId) return;
      await proposeAppointmentApi(conversationId, draft);
    },
    [conversationId],
  );

  const confirmAppointment = useCallback(async () => {
    if (!conversationId) return;
    await confirmAppointmentApi(conversationId);
  }, [conversationId]);

  const resetAppointment = useCallback(async () => {
    if (!conversationId) return;
    await resetAppointmentApi(conversationId);
  }, [conversationId]);

  return {
    messages,
    appointment,
    order,
    status,
    sendMessage,
    proposeAppointment,
    confirmAppointment,
    resetAppointment,
    refresh,
  };
}
