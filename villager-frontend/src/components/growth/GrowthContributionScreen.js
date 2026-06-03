import { getPersonalProgress } from '../../lib/growthApi';
import './GrowthScreens.css';

function GrowthContributionScreen({
  member,
  personal,
  loading,
  error,
  onClose,
  onOpenTreeMap,
}) {
  const progress = personal ? getPersonalProgress(personal) : null;

  return (
    <div className="growth-screen" role="dialog" aria-labelledby="growth-title">
      <header className="growth-screen__header">
        <button type="button" className="growth-screen__back" onClick={onClose}>
          ← 닫기
        </button>
        <h2 id="growth-title" className="growth-screen__title">
          성장 기여도
        </h2>
      </header>

      <div className="growth-screen__body">
        {error ? (
          <p className="growth-screen__loading" role="alert">{error}</p>
        ) : loading || !personal ? (
          <p className="growth-screen__loading">불러오는 중…</p>
        ) : (
          <>
            <section className="growth-card" aria-labelledby="personal-growth">
              <p className="growth-card__label" id="personal-growth">
                나의 성장 기여도
              </p>
              <p className="growth-card__value">Lv. {progress.level}</p>
              <p className="growth-card__sub">
                {member.displayName}님 · 활동으로 쌓인 경험치
              </p>
              <div className="growth-xp-bar" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="growth-xp-bar__fill"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <div className="growth-xp-bar__text">
                <span>
                  {progress.xpInLevel} / {progress.xpToNext} XP
                </span>
                <span>총 {personal.totalXp.toLocaleString()} XP</span>
              </div>
            </section>

            <section className="growth-card" aria-labelledby="recent-activity">
              <p className="growth-card__label" id="recent-activity">
                최근 활동
              </p>
              {personal.recentActivities.length > 0 ? (
                <ul className="growth-activity-list">
                  {personal.recentActivities.map((item) => (
                    <li key={item.id} className="growth-activity-list__item">
                      <div>
                        <p className="growth-activity-list__label">{item.label}</p>
                        <p className="growth-activity-list__meta">{item.at}</p>
                      </div>
                      <span className="growth-activity-list__xp">+{item.xp} XP</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="growth-card__sub">아직 기록된 활동이 없습니다.</p>
              )}
            </section>

            <section className="growth-card">
              <p className="growth-card__label">동네 공동 나무</p>
              <p className="growth-card__sub">
                같은 동네 주민들의 활동이 모이면 지도 위 나무가 함께 자라요.
              </p>
              <button
                type="button"
                className="growth-screen__cta"
                onClick={onOpenTreeMap}
              >
                동네 나무 지도 보기
              </button>
            </section>

            <p className="growth-screen__hint">
              거래·커뮤니티·알바 등 앱 활동을 할 때마다 개인 XP와 동네 나무 XP가
              함께 쌓입니다.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default GrowthContributionScreen;
