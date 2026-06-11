import { apiFetch, isApiEnabled } from './api';
import { usableListingImageUrls } from './listingImages';
import { fetchTradeListings as fetchTradeListingsSupabase } from './trade';

function mapListing(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    price: row.isFree ? 0 : row.price,
    isFree: row.isFree,
    imageUrls: usableListingImageUrls(row.imageUrls),
    tradeMethods: row.tradeMethods ?? [],
    neighborhoodId: row.neighborhoodId ?? null,
    neighborhood: row.neighborhood ?? '',
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    address: row.address ?? '',
    sellerId: row.sellerId,
    sellerName: row.sellerName ?? '판매자',
    createdAt: row.createdAt ?? '',
    myAppointmentStatus: row.myAppointmentStatus ?? 'none',
  };
}

export async function fetchTradeListingsFromApi(neighborhoodIds) {
  const params = new URLSearchParams();
  (neighborhoodIds ?? []).forEach((id) => {
    if (id) params.append('neighborhoodIds', id);
  });
  const qs = params.toString();
  const path = qs ? `/api/v1/listings?${qs}` : '/api/v1/listings';
  const data = await apiFetch(path);
  return (data ?? []).map(mapListing);
}

export async function fetchTradeListingFromApi(id) {
  const data = await apiFetch(`/api/v1/listings/${id}`);
  return mapListing(data);
}

export async function createTradeListingFromApi(form) {
  const body = {
    title: form.title,
    description: form.description ?? '',
    isFree: form.isFree,
    price: form.isFree ? 0 : Number(form.price),
    neighborhoodId: form.neighborhoodId,
    neighborhood: form.neighborhood ?? '',
    latitude: form.latitude ?? null,
    longitude: form.longitude ?? null,
    address: form.address ?? '',
    imageUrls: form.imageUrls ?? [],
  };
  const data = await apiFetch('/api/v1/listings', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return mapListing(data);
}

export async function fetchTradeListings(neighborhoodIds) {
  if (isApiEnabled()) {
    return fetchTradeListingsFromApi(neighborhoodIds);
  }
  return fetchTradeListingsSupabase();
}
