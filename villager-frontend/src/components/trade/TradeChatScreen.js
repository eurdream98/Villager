import { useEffect, useRef, useState } from 'react';
import { useTradeChat } from '../../hooks/useTradeChat';
import { formatPrice } from '../../lib/trade';
import TradeAppointmentPanel from './TradeAppointmentPanel';
import './Trade.css';

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_LABEL = {
  connecting: '불러오는 중…',
  connected: '연결됨',
  disconnected: '연결 끊김',
  error: '연결 실패',
  idle: '',
};

const ROLE_LABEL = {
  buyer: '구매 거래',
  seller: '판매 거래',
};

function TradeChatScreen({
  tradeInfo,
  listingTitle,
  peerName,
  conversationId,
  user,
  sellerId,
  onBack,
}) {
  const [draft, setDraft] = useState('');
  const listEndRef = useRef(null);
  const {
    messages,
    appointment,
    status,
    sendMessage,
    proposeAppointment,
    confirmAppointment,
    resetAppointment,
  } = useTradeChat(conversationId);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, appointment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await sendMessage(draft);
    if (ok) setDraft('');
  };

  const title = tradeInfo?.listingTitle ?? listingTitle;
  const roleLabel = tradeInfo?.role ? ROLE_LABEL[tradeInfo.role] : null;

  return (
    <div className="trade-chat">
      <header className="trade-chat__header">
        <button type="button" className="trade-chat__back" onClick={onBack}>
          ← 목록
        </button>
        <div className="trade-chat__header-info">
          <h2 className="trade-chat__title">{title}</h2>
          <p className="trade-chat__peer">{peerName}와 대화</p>
        </div>
        <span
          className={`trade-chat__status trade-chat__status--${status}`}
          title={STATUS_LABEL[status]}
        >
          {STATUS_LABEL[status]}
        </span>
      </header>

      <div className="trade-chat__trade-banner" aria-label="거래 정보">
        {tradeInfo?.listingImageUrl ? (
          <img
            className="trade-chat__trade-thumb"
            src={tradeInfo.listingImageUrl}
            alt=""
          />
        ) : (
          <div className="trade-chat__trade-thumb trade-chat__trade-thumb--empty">
            사진 없음
          </div>
        )}
        <div className="trade-chat__trade-meta">
          {roleLabel && (
            <span className="trade-chat__trade-role">{roleLabel}</span>
          )}
          <p className="trade-chat__trade-title">{title}</p>
          <p className="trade-chat__trade-price">
            {formatPrice(
              tradeInfo?.listingPrice ?? 0,
              tradeInfo?.listingFree ?? false,
            )}
            {tradeInfo?.neighborhood && ` · ${tradeInfo.neighborhood}`}
          </p>
          <p className="trade-chat__trade-peer">상대: {peerName}</p>
        </div>
      </div>

      <TradeAppointmentPanel
        appointment={appointment}
        currentUserId={user.id}
        sellerId={sellerId}
        onPropose={proposeAppointment}
        onConfirm={confirmAppointment}
        onReset={resetAppointment}
      />

      <ul className="trade-chat__messages" aria-live="polite">
        {messages.length === 0 && (
          <li className="trade-chat__empty">첫 메시지를 보내 보세요.</li>
        )}
        {messages.map((msg) => {
          const isMine = msg.userId === user.id;
          const isSystem = msg.system;
          return (
            <li
              key={msg.id}
              className={`trade-chat__msg${isMine ? ' trade-chat__msg--mine' : ''}${isSystem ? ' trade-chat__msg--system' : ''}`}
            >
              {!isMine && !isSystem && (
                <span className="trade-chat__msg-name">{msg.userName}</span>
              )}
              <p className="trade-chat__msg-text">{msg.text}</p>
              <time className="trade-chat__msg-time" dateTime={msg.createdAt}>
                {formatTime(msg.createdAt)}
              </time>
            </li>
          );
        })}
        <li ref={listEndRef} />
      </ul>

      <form className="trade-chat__composer" onSubmit={handleSubmit}>
        <input
          type="text"
          className="trade-chat__input"
          placeholder="메시지 입력…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          autoComplete="off"
        />
        <button
          type="submit"
          className="trade-chat__send"
          disabled={!draft.trim() || status === 'connecting'}
        >
          전송
        </button>
      </form>
    </div>
  );
}

export default TradeChatScreen;
