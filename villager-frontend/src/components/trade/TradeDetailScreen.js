import { formatPrice } from '../../lib/trade';
import './Trade.css';

function TradeDetailScreen({
  listing,
  user,
  onBack,
  onChat,
  hasConfirmedAppointment,
  onOpenExistingChat,
}) {
  const isOwnListing =
    user?.id && listing.sellerId && user.id === listing.sellerId;

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

      <div className="trade-detail__body">
        <div className="trade-detail__gallery">
          {listing.imageUrls.length > 0 ? (
            listing.imageUrls.map((url, i) => (
              <img
                key={url}
                src={url}
                alt={i === 0 ? listing.title : ''}
                className="trade-detail__image"
              />
            ))
          ) : (
            <div className="trade-detail__image trade-detail__image--empty">
              사진 없음
            </div>
          )}
        </div>

        <div className="trade-detail__info">
          <p className="trade-detail__price">
            {formatPrice(listing.price, listing.isFree)}
          </p>
          <h1 className="trade-detail__title">{listing.title}</h1>
          <p className="trade-detail__meta">
            {listing.neighborhood} · {listing.createdAt}
            {listing.sellerName && ` · ${listing.sellerName}`}
          </p>

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

      <footer className="trade-detail__footer">
        {isOwnListing ? (
          hasConfirmedAppointment && onOpenExistingChat ? (
            <button
              type="button"
              className="trade-detail__chat-btn"
              onClick={onOpenExistingChat}
            >
              거래 채팅 열기
            </button>
          ) : (
            <p className="trade-detail__own-hint">내가 올린 상품입니다</p>
          )
        ) : (
          <button type="button" className="trade-detail__chat-btn" onClick={onChat}>
            채팅하기
          </button>
        )}
      </footer>
    </div>
  );
}

export default TradeDetailScreen;
