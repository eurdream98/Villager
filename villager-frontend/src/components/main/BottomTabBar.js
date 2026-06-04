import ChatUnreadBadge from './ChatUnreadBadge';
import './BottomTabBar.css';

const TABS = [
  { id: 'trade', label: '거래' },
  { id: 'chat', label: '채팅' },
  { id: 'community', label: '커뮤니티' },
  { id: 'jobs', label: '알바' },
];

function BottomTabBar({ activeTab, onTabChange, chatUnreadTotal = 0 }) {
  return (
    <nav className="bottom-tab-bar" aria-label="메인 메뉴">
      <ul className="bottom-tab-bar__list">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <li key={tab.id} className="bottom-tab-bar__item">
              <button
                type="button"
                className={`bottom-tab-bar__btn${isActive ? ' bottom-tab-bar__btn--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onTabChange(tab.id)}
              >
                <span className="bottom-tab-bar__icon-wrap" aria-hidden="true">
                  <span className="bottom-tab-bar__icon">
                    {tab.id === 'trade' && '↔'}
                    {tab.id === 'chat' && '💭'}
                    {tab.id === 'community' && '🏘'}
                    {tab.id === 'jobs' && '💼'}
                  </span>
                  {tab.id === 'chat' && (
                    <ChatUnreadBadge count={chatUnreadTotal} className="chat-unread-badge--tab" />
                  )}
                </span>
                <span className="bottom-tab-bar__label">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default BottomTabBar;
