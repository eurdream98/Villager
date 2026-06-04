import { apiFetch } from './api';

export async function fetchConversations() {
  const data = await apiFetch('/api/v1/conversations');
  return (data ?? []).map(mapConversationSummary);
}

export async function fetchConversation(conversationId) {
  const data = await apiFetch(`/api/v1/conversations/${conversationId}`);
  return mapConversation(data);
}

export async function fetchListingConversations(listingId) {
  const data = await apiFetch(`/api/v1/listings/${listingId}/conversations`);
  return (data ?? []).map(mapConversationSummary);
}

export async function fetchListingTradeStatus(listingId) {
  const data = await apiFetch(`/api/v1/me/listings/${listingId}/trade-status`);
  return {
    hasConfirmedAppointment: Boolean(data?.hasConfirmedAppointment),
    appointmentStatus: data?.appointmentStatus ?? 'none',
    conversationId: data?.conversationId ?? null,
  };
}

export async function startConversation(listingId) {
  const data = await apiFetch(`/api/v1/listings/${listingId}/conversations`, {
    method: 'POST',
  });
  return mapConversation(data);
}

export async function fetchMessages(conversationId) {
  const data = await apiFetch(`/api/v1/conversations/${conversationId}/messages`);
  return (data ?? []).map(mapMessage);
}

export async function sendMessage(conversationId, text) {
  const data = await apiFetch(`/api/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return mapMessage(data);
}

export async function fetchAppointment(conversationId) {
  const data = await apiFetch(`/api/v1/conversations/${conversationId}/appointment`);
  return data ? mapAppointment(data) : null;
}

export async function proposeAppointment(conversationId, draft) {
  const data = await apiFetch(
    `/api/v1/conversations/${conversationId}/appointment/propose`,
    {
      method: 'POST',
      body: JSON.stringify({
        tradeMethod: draft.tradeMethod,
        scheduledAt: new Date(draft.scheduledAt).toISOString(),
        location: draft.location,
      }),
    },
  );
  return mapAppointment(data);
}

export async function confirmAppointment(conversationId) {
  const data = await apiFetch(
    `/api/v1/conversations/${conversationId}/appointment/confirm`,
    { method: 'POST' },
  );
  return mapAppointment(data);
}

export async function resetAppointment(conversationId) {
  await apiFetch(`/api/v1/conversations/${conversationId}/appointment`, {
    method: 'DELETE',
  });
}

function mapConversationSummary(c) {
  return {
    id: c.id,
    listingId: c.listingId,
    listingTitle: c.listingTitle,
    listingImageUrl: c.listingImageUrl ?? '',
    listingPrice: c.listingPrice ?? 0,
    listingFree: c.listingFree,
    neighborhood: c.neighborhood ?? '',
    buyerId: c.buyerId,
    sellerId: c.sellerId,
    role: c.role,
    peerName: c.peerName,
    peerId: c.peerId,
    appointmentStatus: c.appointmentStatus ?? 'none',
    lastMessagePreview: c.lastMessagePreview ?? '',
    updatedAt: c.updatedAt ?? '',
    unreadCount: c.unreadCount ?? 0,
  };
}

export async function markConversationRead(conversationId) {
  return apiFetch(`/api/v1/conversations/${conversationId}/read`, {
    method: 'POST',
  });
}

/** 탭 배지용: 읽지 않은 메시지 합계 */
export function sumUnreadMessages(conversations) {
  return (conversations ?? []).reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
}

function mapConversation(c) {
  return {
    id: c.id,
    listingId: c.listingId,
    listingTitle: c.listingTitle,
    buyerId: c.buyerId,
    sellerId: c.sellerId,
    peerName: c.peerName,
    peerId: c.peerId,
  };
}

function mapMessage(msg) {
  return {
    id: msg.id,
    userId: msg.userId,
    userName: msg.userName,
    text: msg.text,
    system: msg.system,
    createdAt: msg.createdAt,
  };
}

function mapAppointment(apt) {
  return {
    id: apt.id,
    roomId: apt.conversationId,
    tradeMethod: apt.tradeMethod,
    scheduledAt: apt.scheduledAt,
    location: apt.location,
    status: apt.status,
    proposedBy: apt.proposedBy,
    proposedByName: apt.proposedByName,
    confirmedBy: apt.confirmedBy,
    confirmedAt: apt.confirmedAt,
  };
}
