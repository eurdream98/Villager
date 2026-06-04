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
    neighborhood: row.neighborhood ?? '',
    sellerId: row.sellerId,
    sellerName: row.sellerName ?? '판매자',
    createdAt: row.createdAt ?? '',
    myAppointmentStatus: row.myAppointmentStatus ?? 'none',
  };
}

export async function fetchTradeListingsFromApi() {
  const data = await apiFetch('/api/v1/listings');
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
    neighborhood: form.neighborhood ?? '',
    imageUrls: form.imageUrls ?? [],
  };
  const data = await apiFetch('/api/v1/listings', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return mapListing(data);
}

export async function fetchTradeListings() {
  if (isApiEnabled()) {
    return fetchTradeListingsFromApi();
  }
  return fetchTradeListingsSupabase();
}
