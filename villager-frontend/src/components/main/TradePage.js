import { useEffect, useState } from 'react';
import { resolveListingImageUrl } from '../../lib/listingImages';
import { isApiEnabled } from '../../lib/api';
import {
  fetchConversation,
  fetchListingConversations,
  fetchListingTradeStatus,
  sendMessage,
  startConversation,
} from '../../lib/chatApi';
import { useTradeListings } from '../../hooks/useTradeListings';
import ChatOverlay from '../trade/ChatOverlay';
import TradeDetailScreen from '../trade/TradeDetailScreen';
import TradeListingCard from '../trade/TradeListingCard';
import TradeSellScreen from '../trade/TradeSellScreen';
import '../trade/Trade.css';

function TradePage({ user, member, onOpenPayoutAccount }) {
  const [view, setView] = useState('list');
  const [selectedListing, setSelectedListing] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [chatPeerName, setChatPeerName] = useState('판매자');
  const [chatError, setChatError] = useState(null);
  const [tradeStatus, setTradeStatus] = useState(null);
  const [tradeStatusLoading, setTradeStatusLoading] = useState(false);
  const [listingConversations, setListingConversations] = useState([]);
  const [listingConversationsLoading, setListingConversationsLoading] =
    useState(false);
  const [buyerConversationId, setBuyerConversationId] = useState(null);
  const [buyerPeerName, setBuyerPeerName] = useState('판매자');
  const [buyerChatLoading, setBuyerChatLoading] = useState(false);
  const { listings, loading, error, addListing, reload } = useTradeListings();

  useEffect(() => {
    if (view !== 'detail' || !selectedListing?.id || !isApiEnabled()) {
      setTradeStatus(null);
      return;
    }
    let cancelled = false;
    setTradeStatusLoading(true);
    fetchListingTradeStatus(selectedListing.id)
      .then((status) => {
        if (!cancelled) setTradeStatus(status);
      })
      .catch(() => {
        if (!cancelled) setTradeStatus(null);
      })
      .finally(() => {
        if (!cancelled) setTradeStatusLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [view, selectedListing?.id]);

  useEffect(() => {
    if (view !== 'detail' || !selectedListing?.id || !isApiEnabled()) {
      setListingConversations([]);
      setBuyerConversationId(null);
      setBuyerChatLoading(false);
      return;
    }

    const isOwnListing =
      user?.id && selectedListing.sellerId && user.id === selectedListing.sellerId;
    let cancelled = false;
    setListingConversationsLoading(true);
    if (!isOwnListing) setBuyerChatLoading(true);

    const load = async () => {
      try {
        const convs = await fetchListingConversations(selectedListing.id);
        if (cancelled) return;

        if (isOwnListing) {
          setListingConversations(convs);
          setBuyerConversationId(null);
          return;
        }

        setListingConversations([]);
        const mine =
          convs.find((c) => c.role === 'buyer') ??
          convs.find((c) => c.buyerId === user?.id);

        if (mine?.lastMessagePreview) {
          setBuyerConversationId(mine.id);
          setBuyerPeerName(mine.peerName || selectedListing.sellerName || '판매자');
        } else {
          setBuyerConversationId(null);
          setBuyerPeerName(selectedListing.sellerName || '판매자');
        }
      } catch {
        if (!cancelled) {
          setListingConversations([]);
          setBuyerConversationId(null);
        }
      } finally {
        if (!cancelled) {
          setListingConversationsLoading(false);
          setBuyerChatLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [view, selectedListing?.id, selectedListing?.sellerId, user?.id]);

  const handleSellSubmit = async (form) => {
    await addListing(form);
  };

  const openChatWithConversation = (conv) => {
    setConversationId(conv.id);
    setChatPeerName(conv.peerName || '판매자');
    setView('chat');
  };

  const handleOpenListingChat = async (convSummary) => {
    setChatError(null);
    try {
      const conv = await fetchConversation(convSummary.id);
      openChatWithConversation(conv);
    } catch (err) {
      setChatError(err.message || '채팅을 열 수 없습니다.');
    }
  };

  const handleBuyerFirstMessage = async (text) => {
    if (!selectedListing?.id || !isApiEnabled()) {
      throw new Error('백엔드 API가 설정되지 않았습니다.');
    }
    setChatError(null);
    const conv = await startConversation(selectedListing.id);
    await sendMessage(conv.id, text);
    setBuyerConversationId(conv.id);
    setBuyerPeerName(conv.peerName || selectedListing.sellerName || '판매자');
  };

  const handleOpenExistingChat = async () => {
    setChatError(null);
    if (!isApiEnabled()) {
      setChatError('백엔드 API(REACT_APP_API_URL)가 설정되지 않았습니다.');
      return;
    }
    try {
      const conv = tradeStatus?.conversationId
        ? await fetchConversation(tradeStatus.conversationId)
        : await startConversation(selectedListing.id);
      openChatWithConversation(conv);
    } catch (err) {
      setChatError(err.message || '채팅을 열 수 없습니다.');
    }
  };

  if (view === 'sell') {
    return (
      <TradeSellScreen
        user={user}
        onClose={() => setView('list')}
        onSubmit={handleSellSubmit}
      />
    );
  }

  if (view === 'chat' && selectedListing && user && conversationId) {
    const isSeller = user.id === selectedListing.sellerId;
    const tradeInfo = {
      listingTitle: selectedListing.title,
      listingImageUrl: resolveListingImageUrl(selectedListing.imageUrls?.[0] ?? ''),
      listingPrice: selectedListing.price,
      listingFree: selectedListing.isFree,
      neighborhood: selectedListing.neighborhood,
      listingLatitude: selectedListing.latitude,
      listingLongitude: selectedListing.longitude,
      listingAddress: selectedListing.address,
      role: isSeller ? 'seller' : 'buyer',
    };
    return (
      <ChatOverlay
        tradeInfo={tradeInfo}
        listingTitle={selectedListing.title}
        peerName={chatPeerName}
        conversationId={conversationId}
        user={user}
        sellerId={selectedListing.sellerId}
        onBack={() => setView('detail')}
        onOpenPayoutAccount={onOpenPayoutAccount}
      />
    );
  }

  if (view === 'detail' && selectedListing) {
    return (
      <>
        {chatError && (
          <p className="trade-detail__error" role="alert">
            {chatError}
          </p>
        )}
        <TradeDetailScreen
          listing={selectedListing}
          user={user}
          hasConfirmedAppointment={
            !tradeStatusLoading && tradeStatus?.hasConfirmedAppointment
          }
          onOpenExistingChat={
            tradeStatus?.conversationId ? handleOpenExistingChat : null
          }
          listingConversations={listingConversations}
          listingConversationsLoading={listingConversationsLoading}
          onOpenListingChat={handleOpenListingChat}
          buyerConversationId={buyerConversationId}
          buyerPeerName={buyerPeerName}
          buyerChatLoading={buyerChatLoading}
          onBuyerFirstMessage={handleBuyerFirstMessage}
          onBack={() => {
            setView('list');
            setSelectedListing(null);
            setConversationId(null);
            setChatError(null);
            setTradeStatus(null);
            setListingConversations([]);
            setBuyerConversationId(null);
          }}
        />
      </>
    );
  }

  return (
    <div className="trade-page">
      <header className="trade-page__header">
        <h2 className="trade-page__title">거래</h2>
        <p className="trade-page__desc">동네 물건을 스크롤하며 구경해 보세요.</p>
      </header>

      {error && (
        <div className="trade-page__error" role="alert">
          <p>{error}</p>
          <button type="button" className="trade-page__retry" onClick={reload}>
            다시 시도
          </button>
        </div>
      )}

      {loading ? (
        <p className="trade-feed__loading">물건 목록 불러오는 중…</p>
      ) : (
        <ul className="trade-feed" aria-label="거래 물건 목록">
          {listings.length === 0 ? (
            <li className="trade-feed__empty">등록된 물건이 없습니다.</li>
          ) : (
            listings.map((listing) => (
              <li key={listing.id}>
                <TradeListingCard
                  listing={listing}
                  onClick={() => {
                    setSelectedListing(listing);
                    setConversationId(null);
                    setChatError(null);
                    setListingConversations([]);
                    setBuyerConversationId(null);
                    setView('detail');
                  }}
                />
              </li>
            ))
          )}
        </ul>
      )}

      <button
        type="button"
        className="trade-fab"
        onClick={() => setView('sell')}
      >
        물건 판매
      </button>
    </div>
  );
}

export default TradePage;
