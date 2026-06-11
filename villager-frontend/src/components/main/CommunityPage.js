import { useCallback, useEffect, useState } from 'react';
import GroupBuyCreateScreen from '../community/GroupBuyCreateScreen';
import GroupBuyDetailScreen from '../community/GroupBuyDetailScreen';
import GroupBuyFeed from '../community/GroupBuyFeed';
import { fetchGroupBuys } from '../../lib/groupBuyApi';
import '../community/GroupBuy.css';
import './TabPages.css';

function CommunityPage({ user, member, neighborhoodState }) {
  const [view, setView] = useState('feed');
  const [selectedId, setSelectedId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGroupBuys();
      setItems(data);
    } catch (err) {
      setError(err.message || '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'feed') {
      loadFeed();
    }
  }, [view, loadFeed]);

  if (view === 'create') {
    return (
      <GroupBuyCreateScreen
        user={user}
        member={member}
        onBack={() => setView('feed')}
        onCreated={(id) => {
          setSelectedId(id);
          setView('detail');
        }}
      />
    );
  }

  if (view === 'detail' && selectedId) {
    return (
      <GroupBuyDetailScreen
        id={selectedId}
        user={user}
        onBack={() => {
          setView('feed');
          setSelectedId(null);
        }}
      />
    );
  }

  return (
    <section className="tab-page" aria-labelledby="tab-community-title">
      <div className="group-buy-header">
        <div>
          <h2 id="tab-community-title" className="tab-page__title">
            커뮤니티
          </h2>
          <p className="tab-page__desc">동네 공동구매를 모집하고 참여해 보세요.</p>
        </div>
        {user && (
          <button
            type="button"
            className="group-buy-create-btn"
            onClick={() => {
              const active = neighborhoodState?.activeNeighborhood;
              if (!active || !neighborhoodState?.isNeighborhoodVerified(active)) {
                window.alert('공동구매 등록은 동네 인증 후 가능합니다. 상단 「동네 설정」에서 인증해 주세요.');
                return;
              }
              setView('create');
            }}
          >
            + 공동구매
          </button>
        )}
      </div>

      {error && (
        <div className="group-buy-alert group-buy-alert--error" role="alert">
          {error}
        </div>
      )}

      <GroupBuyFeed
        items={items}
        loading={loading}
        onSelect={(id) => {
          setSelectedId(id);
          setView('detail');
        }}
      />
    </section>
  );
}

export default CommunityPage;
