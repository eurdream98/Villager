import './MemberBadge.css';

function MemberBadge({ member, loading }) {
  const initial = member.displayName?.charAt(0) || '?';

  return (
    <div
      className="member-badge"
      aria-label={loading ? '회원 정보 불러오는 중' : `${member.displayName} 회원`}
    >
      {loading ? (
        <span className="member-badge__skeleton" aria-hidden="true" />
      ) : (
        <>
          {member.avatarUrl ? (
            <img
              className="member-badge__avatar"
              src={member.avatarUrl}
              alt=""
              width={36}
              height={36}
            />
          ) : (
            <span className="member-badge__avatar member-badge__avatar--fallback">
              {initial}
            </span>
          )}
          <span className="member-badge__info">
            <span className="member-badge__name">{member.displayName}</span>
            {member.providerLabel && (
              <span className="member-badge__provider">{member.providerLabel}</span>
            )}
          </span>
        </>
      )}
    </div>
  );
}

export default MemberBadge;
