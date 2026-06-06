import { useState } from 'react';
import { useConversations } from '../../hooks/useConversations';
import { markConversationRead } from '../../lib/chatApi';
import { resolveListingImageUrl } from '../../lib/listingImages';
import { formatPrice } from '../../lib/trade';
import ChatOverlay from '../trade/ChatOverlay';
import ChatUnreadBadge from './ChatUnreadBadge';
import '../trade/Trade.css';
import './ChatPage.css';

const ROLE_LABEL = {
  buyer: '구매',
  seller: '판매',
};

const APPOINTMENT_BADGE = {
  confirmed: '약속 완료',
  pending: '약속 제안',
};

function ChatPage({ user, onUnreadChange }) {
  const { conversations, loading, error, reload } = useConversations();
  const [activeChat, setActiveChat] = useState(null);

  const handleCloseChat = () => {
    setActiveChat(null);
    reload({ silent: true });
    onUnreadChange?.();
  };

  const handleOpenChat = (conv) => {
    setActiveChat(conv);
    markConversationRead(conv.id)
      .then(() => {
        reload({ silent: true });
        onUnreadChange?.();
      })
      .catch(() => {});
  };

  if (activeChat && user) {
    return (
      <ChatOverlay
        tradeInfo={activeChat}
        listingTitle={activeChat.listingTitle}
        peerName={activeChat.peerName}
        conversationId={activeChat.id}
        user={user}
        sellerId={activeChat.sellerId}
        onBack={handleCloseChat}
        onMarkedRead={() => {
          reload({ silent: true });
          onUnreadChange?.();
        }}
      />
    );
  }

  return (
    <div className="chat-page">
      <header className="chat-page__header">
        <h2 className="chat-page__title">채팅</h2>
        <p className="chat-page__desc">구매·판매 거래 대화를 한곳에서 확인합니다.</p>
      </header>

      {error && (
        <div className="chat-page__error" role="alert">
          <p>{error}</p>
          <button type="button" className="chat-page__retry" onClick={reload}>
            다시 시도
          </button>
        </div>
      )}

      {loading ? (
        <p className="chat-page__loading">채팅 목록 불러오는 중…</p>
      ) : (
        <ul className="chat-page__list" aria-label="거래 채팅 목록">
          {conversations.length === 0 ? (
            <li className="chat-page__empty">
              아직 거래 채팅이 없습니다.
              <br />
              거래 탭에서 상품을 눌러 채팅을 시작해 보세요.
            </li>
          ) : (
            conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  type="button"
                  className="chat-room-card"
                  onClick={() => handleOpenChat(conv)}
                >
                  <div className="chat-room-card__thumb">
                    {conv.listingImageUrl ? (
                      <img src={resolveListingImageUrl(conv.listingImageUrl)} alt="" />
                    ) : (
                      <span className="chat-room-card__no-img">사진 없음</span>
                    )}
                  </div>
                  <div className="chat-room-card__body">
                    <div className="chat-room-card__top">
                      <span className="chat-room-card__role">
                        {ROLE_LABEL[conv.role] ?? conv.role}
                      </span>
                      {conv.appointmentStatus !== 'none' && (
                        <span
                          className={`chat-room-card__apt chat-room-card__apt--${conv.appointmentStatus}`}
                        >
                          {APPOINTMENT_BADGE[conv.appointmentStatus] ??
                            conv.appointmentStatus}
                        </span>
                      )}
                      <time className="chat-room-card__time">{conv.updatedAt}</time>
                      <ChatUnreadBadge
                        count={conv.unreadCount}
                        className="chat-unread-badge--room"
                      />
                    </div>
                    <p className="chat-room-card__title">{conv.listingTitle}</p>
                    <p className="chat-room-card__price">
                      {formatPrice(conv.listingPrice, conv.listingFree)}
                      {conv.neighborhood && ` · ${conv.neighborhood}`}
                    </p>
                    <p className="chat-room-card__peer">{conv.peerName}님</p>
                    {conv.lastMessagePreview && (
                      <p className="chat-room-card__preview">
                        {conv.lastMessagePreview}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default ChatPage;
