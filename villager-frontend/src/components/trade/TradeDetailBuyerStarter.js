import { useState } from 'react';
import './Trade.css';

function TradeDetailBuyerStarter({ peerName, onSendFirstMessage, disabled }) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending || disabled) return;

    setError(null);
    setSending(true);
    try {
      await onSendFirstMessage(text);
      setDraft('');
    } catch (err) {
      setError(err.message || '메시지를 보낼 수 없습니다.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="trade-chat trade-chat--embedded trade-chat--starter">
      <header className="trade-chat__embedded-header">
        <h2 className="trade-chat__embedded-title">{peerName}</h2>
      </header>

      <div className="trade-chat__starter-body">
        <p className="trade-chat__starter-hint">
          판매자에게 궁금한 점을 메시지를 내면 거래 채팅이 시작됩니다.
        </p>
        {error && (
          <p className="trade-detail__error" role="alert">
            {error}
          </p>
        )}
      </div>

      <form
        className="trade-chat__composer trade-chat__composer--embedded"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          className="trade-chat__input"
          placeholder="첫 메시지 입력…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          autoComplete="off"
          disabled={sending || disabled}
        />
        <button
          type="submit"
          className="trade-chat__send"
          disabled={!draft.trim() || sending || disabled}
        >
          전송
        </button>
      </form>
    </div>
  );
}

export default TradeDetailBuyerStarter;
