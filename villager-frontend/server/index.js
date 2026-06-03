const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const PORT = process.env.CHAT_PORT || 3001;
const app = express();

app.use(cors({ origin: true }));
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, methods: ['GET', 'POST'] },
});

/** @type {Map<string, object[]>} */
const roomHistory = new Map();
/** @type {Map<string, object|null>} */
const roomAppointments = new Map();
const MAX_HISTORY = 200;

function formatAppointmentMessage(apt, kind) {
  const methodLabels = {
    meet: '만나서 직접 거래',
    shipping: '택배 거래',
    door: '문고리 거래',
  };
  const method = methodLabels[apt.tradeMethod] || apt.tradeMethod;
  const time = new Date(apt.scheduledAt).toLocaleString('ko-KR');
  if (kind === 'confirmed') {
    return `✅ 거래 약속이 확정되었습니다.\n${method} · ${time}\n장소: ${apt.location}`;
  }
  return `📅 거래 약속이 제안되었습니다.\n${method} · ${time}\n장소: ${apt.location}`;
}

function pushSystemMessage(roomId, userId, userName, text) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    roomId,
    userId,
    userName,
    text,
    createdAt: new Date().toISOString(),
    system: true,
  };
  const list = roomHistory.get(roomId) || [];
  list.push(entry);
  if (list.length > MAX_HISTORY) list.splice(0, list.length - MAX_HISTORY);
  roomHistory.set(roomId, list);
  io.to(roomId).emit('message', entry);
}

io.on('connection', (socket) => {
  socket.on('join', ({ roomId, userId, userName }) => {
    if (!roomId || !userId) return;
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userId = userId;
    socket.data.userName = userName || '이웃';

    const history = roomHistory.get(roomId) || [];
    socket.emit('history', history);

    const appointment = roomAppointments.get(roomId) ?? null;
    socket.emit('appointment', appointment);
  });

  socket.on('message', ({ text }) => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;
    if (!roomId || !userId || !text?.trim()) return;

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      roomId,
      userId,
      userName: socket.data.userName || '이웃',
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    const list = roomHistory.get(roomId) || [];
    list.push(entry);
    if (list.length > MAX_HISTORY) list.splice(0, list.length - MAX_HISTORY);
    roomHistory.set(roomId, list);

    io.to(roomId).emit('message', entry);
  });

  socket.on('appointment:propose', ({ tradeMethod, scheduledAt, location }) => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;
    if (!roomId || !userId || !tradeMethod || !scheduledAt || !location?.trim()) {
      return;
    }

    const appointment = {
      roomId,
      tradeMethod,
      scheduledAt,
      location: location.trim(),
      proposedBy: userId,
      proposedByName: socket.data.userName,
      status: 'pending',
      confirmedBy: null,
      confirmedAt: null,
      updatedAt: new Date().toISOString(),
    };

    roomAppointments.set(roomId, appointment);
    io.to(roomId).emit('appointment', appointment);
    pushSystemMessage(
      roomId,
      userId,
      socket.data.userName,
      formatAppointmentMessage(appointment, 'proposed'),
    );
  });

  socket.on('appointment:confirm', () => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;
    const apt = roomAppointments.get(roomId);
    if (!roomId || !userId || !apt || apt.status !== 'pending') return;
    if (apt.proposedBy === userId) return;

    const confirmed = {
      ...apt,
      status: 'confirmed',
      confirmedBy: userId,
      confirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    roomAppointments.set(roomId, confirmed);
    io.to(roomId).emit('appointment', confirmed);
    pushSystemMessage(
      roomId,
      userId,
      socket.data.userName,
      formatAppointmentMessage(confirmed, 'confirmed'),
    );
  });

  socket.on('appointment:reset', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    roomAppointments.delete(roomId);
    io.to(roomId).emit('appointment', null);
  });

  socket.on('disconnect', () => {});
});

server.listen(PORT, () => {
  console.log(`[Villager Chat] Socket.IO server http://localhost:${PORT}`);
});
