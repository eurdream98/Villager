import { usableListingImageUrls, resolveListingImageUrl } from '../../lib/listingImages';
import {
  formatGroupBuyDeadline,
  formatGroupBuyPrice,
  GROUP_BUY_STATUS,
} from '../../lib/groupBuyApi';
import './GroupBuy.css';

function statusBadge(status) {
  if (status === GROUP_BUY_STATUS.PICKUP || status === GROUP_BUY_STATUS.SUCCEEDED) {
    return <span className="group-buy-badge group-buy-badge--pickup">픽업 진행</span>;
  }
  if (status === GROUP_BUY_STATUS.COMPLETED) {
    return <span className="group-buy-badge group-buy-badge--done">완료</span>;
  }
  if (status === GROUP_BUY_STATUS.FAILED) {
    return <span className="group-buy-badge group-buy-badge--done">미성사</span>;
  }
  return <span className="group-buy-badge">모집 중</span>;
}

function GroupBuyCard({ item, onSelect }) {
  const images = usableListingImageUrls(item.imageUrls);
  const thumb = images[0] ? resolveListingImageUrl(images[0]) : null;
  const progress =
    item.minCommitted > 0
      ? Math.min(100, Math.round((item.committedCount / item.minCommitted) * 100))
      : 0;

  return (
    <button type="button" className="group-buy-card" onClick={() => onSelect(item.id)}>
      {thumb ? (
        <img className="group-buy-card__thumb" src={thumb} alt="" />
      ) : (
        <div className="group-buy-card__thumb group-buy-card__thumb--empty" aria-hidden>
          🛒
        </div>
      )}
      <div className="group-buy-card__body">
        <p className="group-buy-card__title">{item.title}</p>
        <p className="group-buy-card__price">{formatGroupBuyPrice(item.pricePerUnit)} / 1인</p>
        <div className="group-buy-progress" aria-hidden>
          <div className="group-buy-progress__bar" style={{ width: `${progress}%` }} />
        </div>
        <p className="group-buy-card__meta">
          관심 {item.interestedCount} · 확정 {item.committedCount}/{item.minCommitted}명
          {item.status === GROUP_BUY_STATUS.RECRUITING && item.deadlineAt && (
            <> · 마감 {formatGroupBuyDeadline(item.deadlineAt)}</>
          )}
        </p>
        <div style={{ marginTop: '0.35rem' }}>{statusBadge(item.status)}</div>
      </div>
    </button>
  );
}

function GroupBuyFeed({ items, loading, onSelect }) {
  if (loading) {
    return <div className="group-buy-empty">공동구매 목록을 불러오는 중…</div>;
  }
  if (!items.length) {
    return (
      <div className="group-buy-empty">
        아직 열린 공동구매가 없습니다.
        <br />
        「공동구매 열기」로 외부 상품 모집을 시작해 보세요.
      </div>
    );
  }
  return (
    <div className="group-buy-feed">
      {items.map((item) => (
        <GroupBuyCard key={item.id} item={item} onSelect={onSelect} />
      ))}
    </div>
  );
}

export default GroupBuyFeed;
