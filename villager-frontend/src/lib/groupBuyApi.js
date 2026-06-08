import { apiFetch } from './api';

export const GROUP_BUY_STATUS = {
  RECRUITING: 'recruiting',
  SUCCEEDED: 'succeeded',
  PICKUP: 'pickup',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export function mapGroupBuy(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    pricePerUnit: row.pricePerUnit,
    externalUrl: row.externalUrl,
    minCommitted: row.minCommitted,
    maxCommitted: row.maxCommitted,
    deadlineAt: row.deadlineAt,
    pickupLocation: row.pickupLocation,
    pickupStartAt: row.pickupStartAt,
    pickupEndAt: row.pickupEndAt,
    pickupNotes: row.pickupNotes ?? '',
    neighborhood: row.neighborhood,
    status: row.status,
    interestedCount: row.interestedCount ?? 0,
    committedCount: row.committedCount ?? 0,
    committedQuantity: row.committedQuantity ?? 0,
    pickedUpCount: row.pickedUpCount ?? 0,
    devSimulated: row.devSimulated ?? false,
    organizerId: row.organizerId,
    organizerName: row.organizerName,
    imageUrls: row.imageUrls ?? [],
    myTier: row.myTier,
    myQuantity: row.myQuantity,
    myPickedUp: row.myPickedUp ?? false,
    createdAt: row.createdAt,
    succeededAt: row.succeededAt,
  };
}

export async function fetchGroupBuys() {
  const data = await apiFetch('/api/v1/group-buys');
  return (data ?? []).map(mapGroupBuy);
}

export async function fetchGroupBuy(id) {
  const data = await apiFetch(`/api/v1/group-buys/${id}`);
  return mapGroupBuy(data);
}

export async function createGroupBuy(payload) {
  const data = await apiFetch('/api/v1/group-buys', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapGroupBuy(data);
}

export async function expressInterest(id) {
  const data = await apiFetch(`/api/v1/group-buys/${id}/interest`, { method: 'POST' });
  return mapGroupBuy(data);
}

export async function commitGroupBuy(id, quantity = 1) {
  const data = await apiFetch(`/api/v1/group-buys/${id}/commit`, {
    method: 'POST',
    body: JSON.stringify({ quantity }),
  });
  return mapGroupBuy(data);
}

export async function cancelGroupBuyParticipation(id) {
  const data = await apiFetch(`/api/v1/group-buys/${id}/cancel`, { method: 'POST' });
  return mapGroupBuy(data);
}

export async function confirmGroupBuyPickup(id) {
  const data = await apiFetch(`/api/v1/group-buys/${id}/pickup`, { method: 'POST' });
  return mapGroupBuy(data);
}

export async function completeGroupBuyDistribution(id) {
  const data = await apiFetch(`/api/v1/group-buys/${id}/complete-distribution`, {
    method: 'POST',
  });
  return mapGroupBuy(data);
}

export async function simulateGroupBuy(id, { interested = 0, committed = 0 } = {}) {
  const data = await apiFetch(`/api/v1/group-buys/${id}/dev/simulate`, {
    method: 'POST',
    body: JSON.stringify({ interested, committed }),
  });
  return mapGroupBuy(data);
}

export function formatGroupBuyPrice(amount) {
  return `${Number(amount).toLocaleString('ko-KR')}원`;
}

export function formatGroupBuyDeadline(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatPickupWindow(startIso, endIso) {
  if (!startIso || !endIso) return '';
  try {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const date = start.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
    const t1 = start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const t2 = end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${t1} ~ ${t2}`;
  } catch {
    return `${startIso} ~ ${endIso}`;
  }
}

/** datetime-local input → ISO UTC */
export function localDateTimeToIso(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}
