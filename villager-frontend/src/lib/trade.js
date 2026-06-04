import { supabase } from './supabase';

/**
 * 거래 방식별 에스크로 적용 수준
 * - full: 결제 → 보관 → 배송/인수 확인 → 정산 (표준 에스크로)
 * - partial: 보증금·분쟁 시에만 개입 (만나서 등)
 * - none: 직접 결제, 앱은 거래 기록만
 */
export const ESCROW_LEVEL = {
  FULL: 'full',
  PARTIAL: 'partial',
  NONE: 'none',
};

export const TRADE_METHODS = [
  {
    id: 'shipping',
    label: '택배 거래',
    description: '택배로 보내고 받는 방식',
    escrowLevel: ESCROW_LEVEL.FULL,
    escrowLabel: '에스크로 권장',
    escrowDetail:
      '구매자 결제 → 플랫폼 보관 → 배송·수령 확인 후 판매자에게 정산. 분쟁·미배송에 가장 적합합니다.',
    supportsPaid: true,
    supportsFree: true,
  },
  {
    id: 'door',
    label: '문고리 거래',
    description: '문 앞 등 지정 장소에 두고 가져가는 비대면 거래',
    escrowLevel: ESCROW_LEVEL.FULL,
    escrowLabel: '에스크로 가능',
    escrowDetail:
      '결제 후 보관 → 물건 배치·인수 사진 확인 → 구매 확정 시 정산. 대면 없이도 안전 결제가 가능합니다.',
    supportsPaid: true,
    supportsFree: true,
  },
  {
    id: 'meet',
    label: '만나서 직접 거래',
    description: '직접 만나서 물건을 전달하는 방식',
    escrowLevel: ESCROW_LEVEL.NONE,
    escrowLabel: '현장 결제',
    escrowDetail:
      '만나서 물건을 확인한 뒤 현장에서 직접 결제합니다. 에스크로는 택배·문고리 거래에만 제공됩니다.',
    supportsPaid: true,
    supportsFree: true,
  },
];

export function getTradeMethod(id) {
  return TRADE_METHODS.find((m) => m.id === id);
}

export function getEscrowSummary(selectedMethodIds, isFree) {
  const methods = selectedMethodIds
    .map(getTradeMethod)
    .filter(Boolean);

  if (!methods.length) return null;

  if (isFree) {
    return '무료 나눔은 결제·정산이 없어 에스크로 대신 인수 확인·채팅 기록으로 거래를 남깁니다. 택배·문고리는 배송비만 별도 정산할 수 있습니다.';
  }

  const hasFull = methods.some((m) => m.escrowLevel === ESCROW_LEVEL.FULL);
  const hasPartial = methods.some((m) => m.escrowLevel === ESCROW_LEVEL.PARTIAL);

  if (hasFull && !hasPartial) {
    return '택배·문고리는 전액 에스크로(결제 보관 → 인수 확인 → 정산)를 사용할 수 있습니다.';
  }
  if (hasPartial && !hasFull) {
    return '만나서 거래만 선택 시 에스크로는 선택 사항이며, 현장 현금 거래는 에스크로 없이 진행됩니다.';
  }
  return '택배·문고리는 전액 에스크로, 만나서 거래는 선택적 에스크로(사전 결제)를 지원합니다.';
}

const DEMO_LISTINGS = [
  {
    id: 'demo-1',
    title: '아이패드 케이스 (거의 새것)',
    description: '1년 미만 사용, 스크래치 거의 없어요. 택배·직거래 모두 가능합니다.',
    price: 8000,
    isFree: false,
    imageUrls: ['https://picsum.photos/seed/villager1/400/400'],
    tradeMethods: [],
    neighborhood: '역삼동',
    sellerId: 'demo-seller-1',
    sellerName: '역삼이웃',
    createdAt: '2시간 전',
  },
  {
    id: 'demo-2',
    title: '원목 수납함 나눔',
    description: '이사로 나눔합니다. 문고리 거래 환영해요.',
    price: 0,
    isFree: true,
    imageUrls: ['https://picsum.photos/seed/villager2/400/400'],
    tradeMethods: [],
    neighborhood: '논현동',
    sellerId: 'demo-seller-2',
    sellerName: '논현주민',
    createdAt: '어제',
  },
  {
    id: 'demo-3',
    title: '캠핑 의자 2개',
    description: '접이식 2개 세트, 택배비는 구매자 부담 부탁드려요.',
    price: 35000,
    isFree: false,
    imageUrls: ['https://picsum.photos/seed/villager3/400/400'],
    tradeMethods: [],
    neighborhood: '청담동',
    sellerId: 'demo-seller-3',
    sellerName: '캠핑좋아',
    createdAt: '3일 전',
  },
  {
    id: 'demo-4',
    title: '유아용 책 10권 세트',
    description: '연령 3~5세용 그림책입니다. 나눔이에요.',
    price: 0,
    isFree: true,
    imageUrls: ['https://picsum.photos/seed/villager4/400/400'],
    tradeMethods: [],
    neighborhood: '신사동',
    sellerId: 'demo-seller-4',
    sellerName: '책나눔',
    createdAt: '5일 전',
  },
];

export async function fetchTradeListings() {
  const { data, error } = await supabase
    .from('trade_listings')
    .select(
      'id, title, description, price, is_free, image_urls, trade_methods, neighborhood, seller_id, seller_name, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data?.length) {
    return DEMO_LISTINGS;
  }

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    price: row.is_free ? 0 : row.price,
    isFree: row.is_free,
    imageUrls: row.image_urls ?? [],
    tradeMethods: row.trade_methods ?? [],
    neighborhood: row.neighborhood ?? '',
    sellerId: row.seller_id,
    sellerName: row.seller_name ?? '판매자',
    createdAt: formatRelativeTime(row.created_at),
  }));
}

function formatRelativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return '방금 전';
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}

export function formatPrice(price, isFree) {
  if (isFree || price === 0) return '나눔';
  return `${price.toLocaleString()}원`;
}

export function createLocalListing(form, seller) {
  return {
    id: `local-${Date.now()}`,
    title: form.title.trim(),
    description: form.description?.trim() || '',
    price: form.isFree ? 0 : Number(form.price),
    isFree: form.isFree,
    imageUrls: form.imageUrls,
    tradeMethods: [],
    neighborhood: form.neighborhood || '내 동네',
    sellerId: seller?.id ?? 'me',
    sellerName: seller?.name ?? '나',
    createdAt: '방금 전',
  };
}
