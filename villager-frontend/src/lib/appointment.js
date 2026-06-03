import { getTradeMethod } from './trade';

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
};

export function formatAppointmentDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getLocationPlaceholder(methodId) {
  if (methodId === 'shipping') return '택배 수령 주소 (동·호수 등)';
  if (methodId === 'door') return '문고리 거래 장소 (예: ○○아파트 101동 현관)';
  return '만남 장소 (예: ○○역 2번 출구)';
}

export function formatAppointmentSummary(appointment) {
  const method = getTradeMethod(appointment.tradeMethod);
  return {
    methodLabel: method?.label ?? appointment.tradeMethod,
    time: formatAppointmentDateTime(appointment.scheduledAt),
    location: appointment.location,
  };
}

export function buildAppointmentSystemMessage(appointment, type) {
  const { methodLabel, time, location } = formatAppointmentSummary(appointment);
  if (type === 'proposed') {
    return `📅 거래 약속이 제안되었습니다.\n${methodLabel} · ${time}\n장소: ${location}`;
  }
  if (type === 'confirmed') {
    return `✅ 약속 완료\n${methodLabel} · ${time}\n장소: ${location}`;
  }
  return '';
}

export function validateAppointmentDraft({ tradeMethod, scheduledAt, location }) {
  if (!tradeMethod) return '거래 방법을 선택해 주세요.';
  if (!scheduledAt) return '거래 시간을 선택해 주세요.';
  const at = new Date(scheduledAt);
  if (Number.isNaN(at.getTime())) return '올바른 거래 시간을 입력해 주세요.';
  if (at.getTime() < Date.now() - 60000) return '거래 시간은 현재 이후로 설정해 주세요.';
  if (!location?.trim()) return '거래 장소를 입력해 주세요.';
  return null;
}
