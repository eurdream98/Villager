import { useCallback, useEffect, useState } from 'react';
import {
  confirmAppointment as confirmAppointmentApi,
  fetchAppointment,
  fetchMessages,
  proposeAppointment as proposeAppointmentApi,
  resetAppointment as resetAppointmentApi,
  sendMessage as sendMessageApi,
} from '../lib/chatApi';
import { fetchOrder } from '../lib/escrowApi';
import { isApiEnabled } from '../lib/api';

const POLL_MS = 2500;

export function useTradeChat(conversationId) {
  const [messages, setMessages] = useState([]);
  const [appointment, setAppointment] = useState(null);
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('idle');

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
    if (!conversationId) {
      setMessages([]);
      setAppointment(null);
      setOrder(null);
      setStatus('idle');
      return undefined;
    }

    if (!isApiEnabled()) {
      setStatus('error');
      return undefined;
    }

    setStatus('connecting');
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [conversationId, refresh]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text?.trim();
      if (!trimmed || !conversationId) return false;
      try {
        await sendMessageApi(conversationId, trimmed);
        await refresh();
        return true;
      } catch {
        return false;
      }
    },
    [conversationId, refresh],
  );

  const proposeAppointment = useCallback(
    async (draft) => {
      if (!conversationId) return;
      await proposeAppointmentApi(conversationId, draft);
      await refresh();
    },
    [conversationId, refresh],
  );

  const confirmAppointment = useCallback(async () => {
    if (!conversationId) return;
    await confirmAppointmentApi(conversationId);
    await refresh();
  }, [conversationId, refresh]);

  const resetAppointment = useCallback(async () => {
    if (!conversationId) return;
    await resetAppointmentApi(conversationId);
    await refresh();
  }, [conversationId, refresh]);

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
