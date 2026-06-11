import { getTradeMethod } from './trade';

export const LOCATION_MODES = {
  ADDRESS: 'address',
  MAP: 'map',
  LABEL: 'label',
}

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
    latitude: appointment.latitude ?? null,
    longitude: appointment.longitude ?? null,
    address: appointment.address ?? '',
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

export function seedAppointmentLocationFromListing(listingLocation) {
  if (!listingLocation) {
    return {
      location: '',
      latitude: null,
      longitude: null,
      address: '',
    };
  }
  const text =
    listingLocation.address?.trim() || listingLocation.neighborhood?.trim() || '';
  return {
    location: text,
    latitude: listingLocation.latitude ?? null,
    longitude: listingLocation.longitude ?? null,
    address: listingLocation.address?.trim() || '',
  };
}

export function validateAppointmentDraft({
  tradeMethod,
  scheduledAt,
  location,
  locationMode,
  mapLocation,
}) {
  if (!tradeMethod) return '거래 방법을 선택해 주세요.';
  if (!scheduledAt) return '거래 시간을 선택해 주세요.';
  const at = new Date(scheduledAt);
  if (Number.isNaN(at.getTime())) return '올바른 거래 시간을 입력해 주세요.';
  if (at.getTime() < Date.now() - 60000) return '거래 시간은 현재 이후로 설정해 주세요.';

  if (locationMode === LOCATION_MODES.MAP) {
    if (mapLocation?.latitude == null || mapLocation?.longitude == null) {
      return '지도에서 거래 장소를 선택해 주세요.';
    }
    const label = mapLocation.address?.trim() || location?.trim();
    if (!label) return '거래 장소 주소를 확인해 주세요.';
    return null;
  }

  if (locationMode === LOCATION_MODES.ADDRESS) {
    // 도로명 검색: 좌표 필수 (mapLocation에 검색 결과를 넣을 예정)
    if (mapLocation?.latitude == null || mapLocation?.longitude == null) {
      return '주소를 검색해서 선택해 주세요.';
    }
    if (!mapLocation.address?.trim()) return '검색한 주소를 선택해 주세요.';
    return null;
  }
  if (locationMode === LOCATION_MODES.LABEL) {
    // 장소 이름: 텍스트만, 좌표 검사 안 함
    if (!location?.trim()) return '만남 장소 이름을 입력해 주세요.';
    return null;
  }

  if (!location?.trim()) return '거래 장소를 입력해 주세요.';
  return null;
}
