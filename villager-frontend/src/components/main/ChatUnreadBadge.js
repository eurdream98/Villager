import './ChatUnreadBadge.css';

function ChatUnreadBadge({ count, className = '' }) {
  if (!count || count <= 0) return null;
  const label = count > 99 ? '99+' : String(count);

  return (
    <span
      className={`chat-unread-badge${className ? ` ${className}` : ''}`}
      aria-label={`읽지 않은 메시지 ${label}개`}
    >
      {label}
    </span>
  );
}

export default ChatUnreadBadge;
