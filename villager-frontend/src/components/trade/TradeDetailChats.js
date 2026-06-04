import ChatUnreadBadge from '../main/ChatUnreadBadge';
import './Trade.css';

const APT_BADGE = {
  confirmed: '약속 완료',
  pending: '약속 제안',
  none: '',
};

function TradeDetailChats({ conversations, loading, isOwnListing, onOpenChat }) {
  if (loading) {
    return <p className="trade-detail__chats-loading">채팅 목록 불러오는 중…</p>;
  }

  if (!conversations?.length) {
    const message = isOwnListing
      ? '아직 이 물건에 대한 채팅이 없습니다.'
      : '채팅을 시작하면 여기에 표시됩니다.';
    return (
      <div className="trade-detail__chats-empty-wrap" role="status">
        <p className="trade-detail__chats-empty">
          <span className="trade-detail__chats-empty-emoji" aria-hidden>
            💬
          </span>
          {message}
        </p>
      </div>
    );
  }

  return (
    <ul className="trade-detail__chats-list" aria-label="이 물건 거래 채팅">
      {conversations.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            className="trade-detail__chat-item"
            onClick={() => onOpenChat(c)}
          >
            <span className="trade-detail__chat-peer">{c.peerName}</span>
            {isOwnListing && (
              <span className="trade-detail__chat-role">
                {c.role === 'buyer' ? '구매 문의' : '판매'}
              </span>
            )}
            {APT_BADGE[c.appointmentStatus] && (
              <span className="trade-detail__chat-apt">{APT_BADGE[c.appointmentStatus]}</span>
            )}
            {c.lastMessagePreview && (
              <span className="trade-detail__chat-preview">{c.lastMessagePreview}</span>
            )}
            <span className="trade-detail__chat-time">{c.updatedAt}</span>
            <ChatUnreadBadge
              count={c.unreadCount}
              className="chat-unread-badge--detail"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}

export default TradeDetailChats;
