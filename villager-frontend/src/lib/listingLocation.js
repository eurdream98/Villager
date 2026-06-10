export function formatListingLocation(listing) {
  if (!listing) return '';
  if (listing.address?.trim()) return listing.address.trim();
  if (listing.neighborhood?.trim()) return listing.neighborhood.trim();
  return '';
}

export function hasListingMapPoint(listing) {
  return listing?.latitude != null && listing?.longitude != null;
}

export function buildKakaoMapLink({ label, latitude, longitude }) {
  if (latitude == null || longitude == null) return null;
  const name = encodeURIComponent(label || '거래 장소');
  return `https://map.kakao.com/link/map/${name},${latitude},${longitude}`;
}

export function listingLocationFromTradeInfo(tradeInfo) {
  if (!tradeInfo) return null;
  return {
    neighborhood: tradeInfo.neighborhood ?? tradeInfo.listingNeighborhood ?? '',
    latitude: tradeInfo.listingLatitude ?? tradeInfo.latitude ?? null,
    longitude: tradeInfo.listingLongitude ?? tradeInfo.longitude ?? null,
    address: tradeInfo.listingAddress ?? tradeInfo.address ?? '',
  };
}
