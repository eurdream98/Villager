import { formatPrice } from '../../lib/trade';
import './Trade.css';

function TradeListingCard({ listing, onClick }) {
  const thumb = listing.imageUrls[0];

  return (
    <article className="trade-card">
      <button type="button" className="trade-card__inner" onClick={onClick}>
        <div className="trade-card__thumb">
          {thumb ? (
            <img src={thumb} alt="" loading="lazy" />
          ) : (
            <span className="trade-card__thumb-placeholder">사진 없음</span>
          )}
          <div className="trade-card__badges">
            {listing.isFree && (
              <span className="trade-card__badge trade-card__badge--free">나눔</span>
            )}
            {listing.myAppointmentStatus === 'confirmed' && (
              <span className="trade-card__badge trade-card__badge--apt-done">
                약속 완료
              </span>
            )}
            {listing.myAppointmentStatus === 'pending' && (
              <span className="trade-card__badge trade-card__badge--apt-pending">
                약속 제안
              </span>
            )}
          </div>
        </div>
        <div className="trade-card__body">
          <h3 className="trade-card__title">{listing.title}</h3>
          <p className="trade-card__price">
            {formatPrice(listing.price, listing.isFree)}
          </p>
          <p className="trade-card__meta">
            {listing.neighborhood} · {listing.createdAt}
          </p>
        </div>
      </button>
    </article>
  );
}

export default TradeListingCard;
