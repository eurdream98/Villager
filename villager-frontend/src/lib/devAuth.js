/** 로컬 개발용 고정 구매자 (supabase/seed-dev-buyer.sql) */
export const DEV_BUYER = {
  id: 'd1111111-1111-1111-1111-111111111111',
  email: process.env.REACT_APP_DEV_BUYER_EMAIL || 'buyer@villager.dev',
  password: process.env.REACT_APP_DEV_BUYER_PASSWORD || 'villager-dev-buyer',
  displayName: '데모 구매자',
};

export const DEV_SELLER = {
  id: 'd2222222-2222-2222-2222-222222222222',
  email: process.env.REACT_APP_DEV_SELLER_EMAIL || 'seller@villager.dev',
  password: process.env.REACT_APP_DEV_SELLER_PASSWORD || 'villager-dev-seller',
  displayName: '데모 판매자',
};

export function isDevLoginEnabled() {
  return process.env.NODE_ENV === 'development';
}
