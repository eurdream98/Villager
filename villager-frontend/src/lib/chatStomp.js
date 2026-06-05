import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { mapAppointment, mapMessage } from './chatApi';
import { mapOrder } from './escrowApi';
import { isApiEnabled } from './api';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

/** @type {Client | null} */
let client = null;
/** @type {Promise<void> | null} */
let connectPromise = null;

/** @type {Map<string, Set<Function>>} */
const messageListeners = new Map();
/** @type {Map<string, Set<Function>>} */
const appointmentListeners = new Map();
/** @type {Map<string, Set<Function>>} */
const orderListeners = new Map();
/** @type {Map<string, import('@stomp/stompjs').StompSubscription>} */
const stompSubscriptions = new Map();

let focusedConversationId = null;

export function getWsUrl() {
  if (!isApiEnabled()) return null;
  return API_BASE ? `${API_BASE}/ws` : `${window.location.origin}/ws`;
}

export function setFocusedConversationId(conversationId) {
  focusedConversationId = conversationId ?? null;
}

export function getFocusedConversationId() {
  return focusedConversationId;
}

function topicKey(conversationId, kind) {
  return `${conversationId}:${kind}`;
}

function destinationFor(conversationId, kind) {
  if (kind === 'message') return `/topic/conversations.${conversationId}`;
  if (kind === 'appointment') return `/topic/conversations.${conversationId}.appointment`;
  return `/topic/conversations.${conversationId}.order`;
}

function parseBody(message) {
  try {
    const raw = message.body;
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function notifyListeners(map, conversationId, payload) {
  const set = map.get(conversationId);
  if (!set) return;
  set.forEach((fn) => {
    try {
      fn(payload);
    } catch {
      /* ignore listener errors */
    }
  });
}

function ensureTopicSubscribed(conversationId, kind) {
  const key = topicKey(conversationId, kind);
  if (stompSubscriptions.has(key)) return;
  if (!client?.connected) return;

  const destination = destinationFor(conversationId, kind);
  const subscription = client.subscribe(destination, (frame) => {
    const body = parseBody(frame);
    if (kind === 'message') {
      if (!body?.text) return;
      notifyListeners(messageListeners, conversationId, mapMessage(body));
      return;
    }
    if (kind === 'appointment') {
      notifyListeners(
        appointmentListeners,
        conversationId,
        body ? mapAppointment(body) : null,
      );
      return;
    }
    if (body) {
      notifyListeners(orderListeners, conversationId, mapOrder(body));
    }
  });
  stompSubscriptions.set(key, subscription);
}

function removeTopicSubscriptionIfUnused(conversationId, kind) {
  const listenerMap =
    kind === 'message'
      ? messageListeners
      : kind === 'appointment'
        ? appointmentListeners
        : orderListeners;
  if (listenerMap.get(conversationId)?.size) return;

  const key = topicKey(conversationId, kind);
  const sub = stompSubscriptions.get(key);
  if (sub) {
    sub.unsubscribe();
    stompSubscriptions.delete(key);
  }
}

function addListener(listenerMap, kind, conversationId, callback) {
  if (!conversationId || !callback) return () => {};

  if (!listenerMap.has(conversationId)) {
    listenerMap.set(conversationId, new Set());
  }
  listenerMap.get(conversationId).add(callback);

  connectChatStomp()
    .then(() => ensureTopicSubscribed(conversationId, kind))
    .catch(() => {});

  return () => {
    listenerMap.get(conversationId)?.delete(callback);
    if (listenerMap.get(conversationId)?.size === 0) {
      listenerMap.delete(conversationId);
      if (client?.connected) {
        removeTopicSubscriptionIfUnused(conversationId, kind);
      }
    }
  };
}

function resubscribeAllTopics() {
  messageListeners.forEach((_, conversationId) =>
    ensureTopicSubscribed(conversationId, 'message'),
  );
  appointmentListeners.forEach((_, conversationId) =>
    ensureTopicSubscribed(conversationId, 'appointment'),
  );
  orderListeners.forEach((_, conversationId) =>
    ensureTopicSubscribed(conversationId, 'order'),
  );
}

function createClient(wsUrl) {
  return new Client({
    webSocketFactory: () => new SockJS(wsUrl),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      stompSubscriptions.clear();
      resubscribeAllTopics();
    },
    onDisconnect: () => {
      stompSubscriptions.clear();
    },
  });
}

export function connectChatStomp() {
  const wsUrl = getWsUrl();
  if (!wsUrl) return Promise.reject(new Error('WebSocket URL unavailable'));

  if (client?.connected) return Promise.resolve();
  if (connectPromise) return connectPromise;

  if (!client) {
    client = createClient(wsUrl);
  }

  connectPromise = new Promise((resolve, reject) => {
    const settleResolve = () => {
      connectPromise = null;
      resolve();
    };
    const settleReject = (err) => {
      connectPromise = null;
      reject(err);
    };

    client.onConnect = () => {
      stompSubscriptions.clear();
      resubscribeAllTopics();
      settleResolve();
    };

    client.onStompError = () => {
      if (connectPromise) settleReject(new Error('STOMP connection failed'));
    };

    client.onWebSocketError = () => {
      if (connectPromise) settleReject(new Error('WebSocket connection failed'));
    };

    client.activate();
  });

  return connectPromise;
}

export function disconnectChatStomp() {
  stompSubscriptions.forEach((sub) => sub.unsubscribe());
  stompSubscriptions.clear();
  if (client) {
    client.deactivate();
    client = null;
  }
  connectPromise = null;
}

export function onConversationMessage(conversationId, callback) {
  return addListener(messageListeners, 'message', conversationId, callback);
}

export function onConversationAppointment(conversationId, callback) {
  return addListener(appointmentListeners, 'appointment', conversationId, callback);
}

export function onConversationOrder(conversationId, callback) {
  return addListener(orderListeners, 'order', conversationId, callback);
}

export function subscribeConversation(conversationId, handlers = {}) {
  const unsubs = [];
  if (handlers.onMessage) {
    unsubs.push(onConversationMessage(conversationId, handlers.onMessage));
  }
  if (handlers.onAppointment) {
    unsubs.push(onConversationAppointment(conversationId, handlers.onAppointment));
  }
  if (handlers.onOrder) {
    unsubs.push(onConversationOrder(conversationId, handlers.onOrder));
  }
  return () => unsubs.forEach((fn) => fn());
}
