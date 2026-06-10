import { usableListingImageUrls } from '../../lib/listingImages';
import { formatListingLocation, hasListingMapPoint } from '../../lib/listingLocation';
import { formatPrice } from '../../lib/trade';
import LocationPicker from './LocationPicker';
import TradeChatScreen from './TradeChatScreen';
import TradeDetailBuyerStarter from './TradeDetailBuyerStarter';
import TradeDetailChats from './TradeDetailChats';
import TradeDetailGallery from './TradeDetailGallery';
import './Trade.css';

function TradeDetailScreen({
  listing,
  user,
  onBack,
  hasConfirmedAppointment,
  onOpenExistingChat,
  listingConversations,
  listingConversationsLoading,
  onOpenListingChat,
  buyerConversationId,
  buyerPeerName,
  buyerChatLoading,
  onBuyerFirstMessage,
}) {
  const isOwnListing =
    user?.id && listing.sellerId && user.id === listing.sellerId;
  const imageUrls = usableListingImageUrls(listing.imageUrls);

  const buyerTradeInfo = {
    listingTitle: listing.title,
    listingImageUrl: imageUrls[0] ?? '',
    listingPrice: listing.price,
    listingFree: listing.isFree,
    neighborhood: listing.neighborhood,
    listingLatitude: listing.latitude,
    listingLongitude: listing.longitude,
    listingAddress: listing.address,
    role: 'buyer',
  };

  const listingLocationLabel = formatListingLocation(listing);

  return (
    <div className="trade-detail">
      <header className="trade-detail__header">
        <button type="button" className="trade-detail__back" onClick={onBack}>
          ← 목록
        </button>
      </header>

      {hasConfirmedAppointment && (
        <div className="trade-detail__apt-banner" role="status">
          <span className="trade-detail__apt-badge">약속 완료</span>
          <p className="trade-detail__apt-text">
            이 물건에 대해 약속이 완료되었습니다. 채팅에서 일정·장소를 확인하세요.
          </p>
          {onOpenExistingChat && (
            <button
              type="button"
              className="trade-detail__apt-chat-link"
              onClick={onOpenExistingChat}
            >
              채팅방 열기
            </button>
          )}
        </div>
      )}

      <div
        className={`trade-detail__body${!isOwnListing ? ' trade-detail__body--buyer-chat' : ''}`}
      >
        <div className="trade-detail__split">
          <TradeDetailGallery imageUrls={imageUrls} title={listing.title} />

          <section
            className={`trade-detail__chats-panel${!isOwnListing ? ' trade-detail__chats-panel--buyer' : ''}`}
            aria-labelledby="trade-detail-chats-title"
          >
            {isOwnListing ? (
              <>
                <TradeDetailChats
                  conversations={listingConversations}
                  loading={listingConversationsLoading}
                  isOwnListing
                  onOpenChat={onOpenListingChat}
                />
              </>
            ) : buyerChatLoading ? (
              <p className="trade-detail__chats-loading">판매자와 채팅 불러오는 중…</p>
            ) : !user ? (
              <div className="trade-detail__chats-empty-wrap" role="status">
                <p className="trade-detail__chats-empty">
                  <span className="trade-detail__chats-empty-emoji" aria-hidden>
                    💬
                  </span>
                  로그인 후 채팅할 수 있습니다.
                </p>
              </div>
            ) : buyerConversationId ? (
              <TradeChatScreen
                embedded
                tradeInfo={buyerTradeInfo}
                listingTitle={listing.title}
                peerName={buyerPeerName}
                conversationId={buyerConversationId}
                user={user}
                sellerId={listing.sellerId}
              />
            ) : (
              <TradeDetailBuyerStarter
                peerName={buyerPeerName || listing.sellerName || '판매자'}
                onSendFirstMessage={onBuyerFirstMessage}
                disabled={!onBuyerFirstMessage}
              />
            )}
          </section>
        </div>

        <div className="trade-detail__info">
          <p className="trade-detail__price">
            {formatPrice(listing.price, listing.isFree)}
          </p>
          <h1 className="trade-detail__title">{listing.title}</h1>
          <p className="trade-detail__meta">
            {listingLocationLabel || '동네 미정'} · {listing.createdAt}
            {listing.sellerName && ` · ${listing.sellerName}`}
          </p>

          {listingLocationLabel && (
            <section className="trade-detail__section">
              <h2 className="trade-detail__section-title">거래 희망 위치</h2>
              {hasListingMapPoint(listing) ? (
                <LocationPicker
                  readOnly
                  compact
                  value={{
                    latitude: listing.latitude,
                    longitude: listing.longitude,
                    address: listing.address || listing.neighborhood,
                  }}
                />
              ) : (
                <p className="trade-detail__location-text">{listingLocationLabel}</p>
              )}
            </section>
          )}

          {listing.description && (
            <section className="trade-detail__section">
              <h2 className="trade-detail__section-title">상품 설명</h2>
              <p className="trade-detail__desc">{listing.description}</p>
            </section>
          )}

          <p className="trade-detail__chat-hint">
            거래 방법·시간·장소는 채팅에서 약속 잡기로 정합니다.
          </p>
        </div>
      </div>

      {isOwnListing && (
        <footer className="trade-detail__footer">
          {hasConfirmedAppointment && onOpenExistingChat ? (
            <button
              type="button"
              className="trade-detail__chat-btn"
              onClick={onOpenExistingChat}
            >
              거래 채팅 열기
            </button>
          ) : (
            <p className="trade-detail__own-hint">내가 올린 상품입니다</p>
          )}
        </footer>
      )}
    </div>
  );
}

export default TradeDetailScreen;
