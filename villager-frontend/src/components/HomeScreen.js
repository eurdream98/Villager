import { signOut } from '../lib/auth';
import {
  getAuthProvider,
  getAvatarUrl,
  getDisplayName,
  getProviderLabel,
} from '../lib/user';
import './HomeScreen.css';

function HomeScreen({ user }) {
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('[Villager] 로그아웃 실패', err);
    }
  };

  const displayName = getDisplayName(user);
  const provider = getAuthProvider(user);
  const providerLabel = getProviderLabel(provider);
  const avatarUrl = getAvatarUrl(user);

  return (
    <div className="home">
      <main className="home__content">
        {avatarUrl && (
          <img
            className="home__avatar"
            src={avatarUrl}
            alt=""
            width={64}
            height={64}
          />
        )}
        <p className="home__greeting">안녕하세요, {displayName}님</p>
        {providerLabel && (
          <p className="home__provider">{providerLabel} 계정으로 로그인됨</p>
        )}
        <p className="home__hint">로그인에 성공했습니다. 다음 화면은 준비 중입니다.</p>
        <button type="button" className="home__logout" onClick={handleSignOut}>
          로그아웃
        </button>
      </main>
    </div>
  );
}

export default HomeScreen;
