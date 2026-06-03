/** 상품별 1:1 채팅방 ID (구매자·판매자 ID 정렬) */
export function buildChatRoomId(listingId, buyerId, sellerId) {
  const [a, b] = [buyerId, sellerId].sort();
  return `trade:${listingId}:${a}:${b}`;
}

export function getChatPeer(listing, currentUserId) {
  const isSeller = listing.sellerId === currentUserId;
  return {
    peerId: isSeller ? null : listing.sellerId,
    peerName: isSeller ? '구매 문의' : listing.sellerName || '판매자',
    isSeller,
  };
}
