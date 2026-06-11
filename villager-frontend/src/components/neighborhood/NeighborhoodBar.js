import { isNeighborhoodVerified } from '../../lib/neighborhoodApi';
import './Neighborhood.css';

function NeighborhoodBar({
  neighborhoods,
  activeSlot,
  onSelectSlot,
  onManage,
}) {
  if (!neighborhoods?.length) return null;

  return (
    <div className="neighborhood-bar" aria-label="내 동네">
      <span className="neighborhood-bar__label">내 동네</span>
      {neighborhoods.map((n) => {
        const active = n.slot === activeSlot;
        const verified = isNeighborhoodVerified(n);
        return (
          <button
            key={n.id}
            type="button"
            className={[
              'neighborhood-bar__chip',
              active ? 'neighborhood-bar__chip--active' : '',
              !verified ? 'neighborhood-bar__chip--unverified' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onSelectSlot(n.slot)}
          >
            {n.neighborhoodName}
            {!verified && <span className="neighborhood-bar__badge">미인증</span>}
          </button>
        );
      })}
      <button type="button" className="neighborhood-bar__settings" onClick={onManage}>
        동네 설정
      </button>
    </div>
  );
}

export default NeighborhoodBar;
