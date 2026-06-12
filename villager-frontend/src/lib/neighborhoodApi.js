import { apiFetch } from './api';
import { reverseGeocode } from './kakaoMap';

export function mapUserNeighborhood(row) {
  return {
    id: row.id,
    neighborhoodId: row.neighborhoodId,
    neighborhoodName: row.neighborhoodName ?? '',
    slot: row.slot,
    verified: Boolean(row.verified),
    verifiedAt: row.verifiedAt ?? null,
    verifiedExpiresAt: row.verifiedExpiresAt ?? null,
  };
}

export function mapNeighborhood(row){
  return{
    id:row.id,
    name:row.name??'',
    slug:row.slug??'',
    centerLat:row.centerLat??null,
    centerLng:row.centerLng??null,
  }
}

export async function fetchUserNeighborhoods() {
  const data = await apiFetch('/api/v1/me/neighborhoods');
  return (data ?? []).map(mapUserNeighborhood);
}

export async function registerUserNeighborhood({ slot, name, latitude, longitude }) {
  const data = await apiFetch('/api/v1/me/neighborhoods', {
    method: 'POST',
    body: JSON.stringify({ slot, name, latitude, longitude }),
  });
  return mapUserNeighborhood(data);
}

export async function verifyUserNeighborhood(id, { latitude, longitude, detectedNeighborhoodName }) {
  const data = await apiFetch(`/api/v1/me/neighborhoods/${id}/verify`, {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude, detectedNeighborhoodName }),
  });
  return mapUserNeighborhood(data);
}

export async function resolveNeighborhood({name,latitude,longitude}){
  const data = await apiFetch('/api/v1/neighborhoods/resolve',{
    method:'POST',
    body:JSON.stringify({name,latitude,logitude}),
  });
  return mapNeighborhood(data);
}

/** GPS + 역지오코딩으로 동네 인증 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저는 위치 정보를 지원하지 않습니다.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }),
      () => reject(new Error('현재 위치를 가져오지 못했습니다. 위치 권한을 확인해 주세요.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

export async function verifyNeighborhoodWithGps(userNeighborhoodId) {
  const { latitude, longitude } = await getCurrentPosition();
  let detectedNeighborhoodName = '';
  try {
    const geo = await reverseGeocode(latitude, longitude);
    detectedNeighborhoodName = geo.neighborhood || '';
  } catch {
    /* 역지오코딩 실패 시 거리 검증만 사용 */
  }
  return verifyUserNeighborhood(userNeighborhoodId, {
    latitude,
    longitude,
    detectedNeighborhoodName,
  });
}

export function findNeighborhoodForListing(neighborhoods, listing) {
  if (!listing?.neighborhoodId) return null;
  return neighborhoods.find((n) => n.neighborhoodId === listing.neighborhoodId) ?? null;
}

export function isNeighborhoodVerified(neighborhood) {
  if (!neighborhood?.verified) return false;
  if (!neighborhood.verifiedExpiresAt) return true;
  return new Date(neighborhood.verifiedExpiresAt) > new Date();
}

export function registeredNeighborhoodIds(neighborhoods) {
  return neighborhoods.map((n) => n.neighborhoodId).filter(Boolean);
}
