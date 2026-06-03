import MemberBadge from './MemberBadge';
import './MemberPanel.css';

function MemberPanel({ member, loading, onViewGrowth, onLogout, logoutLoading }) {
  return (
    <div className="member-panel">
      <MemberBadge member={member} loading={loading} />
      {!loading && (
        <div className="member-panel__actions">
          <button
            type="button"
            className="member-panel__btn member-panel__btn--growth"
            onClick={onViewGrowth}
          >
            성장 기여도 보기
          </button>
          <button
            type="button"
            className="member-panel__btn member-panel__btn--logout"
            onClick={onLogout}
            disabled={logoutLoading}
          >
            {logoutLoading ? '로그아웃 중…' : '로그아웃'}
          </button>
        </div>
      )}
    </div>
  );
}

export default MemberPanel;
