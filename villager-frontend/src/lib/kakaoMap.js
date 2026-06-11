const SDK_URL = 'https://dapi.kakao.com/v2/maps/sdk.js';

let loadPromise = null;

export function getKakaoMapJsKey() {
  return (process.env.REACT_APP_KAKAO_MAP_JS_KEY || '').trim();
}

/** 카카오맵 SDK 한 번만 로드 */
export function loadKakaoMapSdk() {
  const key = getKakaoMapJsKey();
  if (!key) {
    return Promise.reject(new Error('REACT_APP_KAKAO_MAP_JS_KEY 가 설정되지 않았습니다.'));
  }

  if (window.kakao?.maps?.LatLng) {
    return Promise.resolve(window.kakao);
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${SDK_URL}?appkey=${encodeURIComponent(key)}&libraries=services&autoload=false`;
      script.async = true;
      script.onload = () => {
        if (!window.kakao?.maps) {
          reject(new Error('카카오맵 SDK를 불러오지 못했습니다.'));
          return;
        }
        window.kakao.maps.load(() => resolve(window.kakao));
      };
      script.onerror = () => reject(new Error('카카오맵 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}

/** 좌표 → 주소 (역지오코딩) */
export function reverseGeocode(latitude, longitude) {
  return loadKakaoMapSdk().then(
    (kakao) =>
      new Promise((resolve, reject) => {
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.coord2Address(longitude, latitude, (result, status) => {
          if (status !== kakao.maps.services.Status.OK || !result?.[0]) {
            reject(new Error('주소를 찾지 못했습니다.'));
            return;
          }
          const row = result[0];
          const road = row.road_address?.address_name;
          const jibun = row.address?.address_name;
          resolve({
            address: road || jibun || '',
            neighborhood: row.address?.region_3depth_name || '',
          });
        });
      }),
  );
}

/** 주소/장소 검색 → 좌표 (지오코딩) */
export function searchAddress(query) {
  const keyword = (query || '').trim();
  if (!keyword) {
    return Promise.resolve([]);
  }

  return loadKakaoMapSdk().then(
    (kakao) =>
      new Promise((resolve, reject) => {
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.addressSearch(keyword, (result, status) => {
          if (status === kakao.maps.services.Status.ZERO_RESULT) {
            resolve([]);
            return;
          }
          if (status !== kakao.maps.services.Status.OK || !result?.length) {
            reject(new Error('주소 검색에 실패했습니다.'));
            return;
          }
          resolve(
            result.map((row) => ({
              address: row.road_address?.address_name || row.address_name || '',
              latitude: parseFloat(row.y),
              longitude: parseFloat(row.x),
              kind: 'address',
            })),
          );
        });
      }),
  );
}

function formatPlaceLabel(place) {
  const addr = place.road_address_name || place.address_name || '';
  return addr ? `${place.place_name} (${addr})` : place.place_name;
}

/** 상호·장소명 검색 → 좌표 (카카오 키워드 검색) */
export function searchPlace(query) {
  const keyword = (query || '').trim();
  if (!keyword) {
    return Promise.resolve([]);
  }

  return loadKakaoMapSdk().then(
    (kakao) =>
      new Promise((resolve, reject) => {
        if (!kakao.maps.services.Places) {
          resolve([]);
          return;
        }
        const places = new kakao.maps.services.Places();
        places.keywordSearch(
          keyword,
          (result, status) => {
            if (status === kakao.maps.services.Status.ZERO_RESULT) {
              resolve([]);
              return;
            }
            if (status !== kakao.maps.services.Status.OK || !result?.length) {
              reject(new Error('장소 검색에 실패했습니다.'));
              return;
            }
            resolve(
              result.map((place) => ({
                address: formatPlaceLabel(place),
                latitude: parseFloat(place.y),
                longitude: parseFloat(place.x),
                kind: 'place',
                placeName: place.place_name,
              })),
            );
          },
          { size: 10 },
        );
      }),
  );
}

/** 주소 + 상호명 통합 검색 */
export async function searchLocations(query) {
  const [places, addresses] = await Promise.all([
    searchPlace(query).catch(() => []),
    searchAddress(query).catch(() => []),
  ]);

  const seen = new Set();
  const merged = [];
  for (const item of [...places, ...addresses]) {
    const key = `${item.latitude.toFixed(5)},${item.longitude.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.slice(0, 15);
}