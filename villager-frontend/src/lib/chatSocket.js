import { io } from 'socket.io-client';
import { buildAppointmentSystemMessage } from './appointment';

const CHANNEL_PREFIX = 'villager-chat-';

export function createChatConnection(roomId, user, handlers) {
  const wsUrl = process.env.REACT_APP_CHAT_WS_URL;

  if (wsUrl) {
    return createSocketIoConnection(wsUrl, roomId, user, handlers);
  }

  return createBroadcastConnection(roomId, user, handlers);
}

function createSocketIoConnection(wsUrl, roomId, user, handlers) {
  const { onHistory, onMessage, onStatus, onAppointment } = handlers;
  const socket = io(wsUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
  });

  socket.on('connect', () => {
    onStatus('connected');
    socket.emit('join', {
      roomId,
      userId: user.id,
      userName: user.name,
    });
  });

  socket.on('disconnect', () => onStatus('disconnected'));
  socket.on('connect_error', () => onStatus('error'));

  socket.on('history', (messages) => {
    onHistory(Array.isArray(messages) ? messages : []);
  });

  socket.on('message', (msg) => {
    if (msg?.text) onMessage(msg);
  });

  socket.on('appointment', (apt) => {
    if (apt?.roomId) onAppointment?.(apt);
  });

  return {
    send(text) {
      if (socket.connected) socket.emit('message', { text });
    },
    proposeAppointment(draft) {
      if (socket.connected) socket.emit('appointment:propose', draft);
    },
    confirmAppointment() {
      if (socket.connected) socket.emit('appointment:confirm');
    },
    resetAppointment() {
      if (socket.connected) socket.emit('appointment:reset');
    },
    disconnect() {
      socket.disconnect();
    },
  };
}

function createBroadcastConnection(roomId, user, handlers) {
  const { onHistory, onMessage, onStatus, onAppointment } = handlers;
  const channelName = `${CHANNEL_PREFIX}${roomId}`;
  let channel;

  try {
    channel = new BroadcastChannel(channelName);
    onStatus('connected');
  } catch {
    onStatus('error');
    return stubConnection();
  }

  const msgKey = `villager-chat-${roomId}`;
  const aptKey = `villager-apt-${roomId}`;

  const loadMessages = () => {
    try {
      return JSON.parse(localStorage.getItem(msgKey) || '[]');
    } catch {
      return [];
    }
  };

  const saveMessages = (messages) => {
    try {
      localStorage.setItem(msgKey, JSON.stringify(messages.slice(-200)));
    } catch {
      /* ignore */
    }
  };

  const loadAppointment = () => {
    try {
      const raw = localStorage.getItem(aptKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const saveAppointment = (apt) => {
    try {
      if (apt) localStorage.setItem(aptKey, JSON.stringify(apt));
      else localStorage.removeItem(aptKey);
    } catch {
      /* ignore */
    }
  };

  const pushMessage = (entry) => {
    const list = [...loadMessages(), entry];
    saveMessages(list);
    channel.postMessage({ type: 'message', payload: entry });
    onMessage(entry);
  };

  onHistory(loadMessages());
  const existingApt = loadAppointment();
  if (existingApt) onAppointment?.(existingApt);

  channel.onmessage = (event) => {
    const { type, payload } = event.data ?? {};
    if (type === 'message' && payload?.text) onMessage(payload);
    if (type === 'history' && Array.isArray(payload)) onHistory(payload);
    if (type === 'appointment') onAppointment?.(payload ?? null);
  };

  const broadcastAppointment = (apt) => {
    saveAppointment(apt);
    channel.postMessage({ type: 'appointment', payload: apt });
    onAppointment?.(apt);
  };

  return {
    send(text) {
      pushMessage({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        roomId,
        userId: user.id,
        userName: user.name,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      });
    },
    proposeAppointment(draft) {
      const appointment = {
        roomId,
        tradeMethod: draft.tradeMethod,
        scheduledAt: draft.scheduledAt,
        location: draft.location.trim(),
        proposedBy: user.id,
        proposedByName: user.name,
        status: 'pending',
        confirmedBy: null,
        confirmedAt: null,
        updatedAt: new Date().toISOString(),
      };
      broadcastAppointment(appointment);
      pushMessage({
        id: `apt-propose-${Date.now()}`,
        roomId,
        userId: user.id,
        userName: user.name,
        text: buildAppointmentSystemMessage(appointment, 'proposed'),
        createdAt: new Date().toISOString(),
        system: true,
      });
    },
    confirmAppointment() {
      const apt = loadAppointment();
      if (!apt || apt.status !== 'pending' || apt.proposedBy === user.id) return;
      const confirmed = {
        ...apt,
        status: 'confirmed',
        confirmedBy: user.id,
        confirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      broadcastAppointment(confirmed);
      pushMessage({
        id: `apt-confirm-${Date.now()}`,
        roomId,
        userId: user.id,
        userName: user.name,
        text: buildAppointmentSystemMessage(confirmed, 'confirmed'),
        createdAt: new Date().toISOString(),
        system: true,
      });
    },
    resetAppointment() {
      saveAppointment(null);
      channel.postMessage({ type: 'appointment', payload: null });
      onAppointment?.(null);
    },
    disconnect() {
      channel.close();
    },
  };
}

function stubConnection() {
  return {
    send() {},
    proposeAppointment() {},
    confirmAppointment() {},
    resetAppointment() {},
    disconnect() {},
  };
}
