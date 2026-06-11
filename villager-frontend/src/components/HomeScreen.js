import { useState } from 'react';
import { signOut } from '../lib/auth';
import GrowthContributionScreen from './growth/GrowthContributionScreen';
import PayoutAccountScreen from './settings/PayoutAccountScreen';
import { usePayoutAccount } from '../hooks/usePayoutAccount';
import NeighborhoodTreeMapScreen from './growth/NeighborhoodTreeMapScreen';
import { useChatUnread } from '../hooks/useChatUnread';
import { useGrowthStats } from '../hooks/useGrowthStats';
import { useMemberProfile } from '../hooks/useMemberProfile';
import { useUserNeighborhoods } from '../hooks/useUserNeighborhoods';
import BottomTabBar from './main/BottomTabBar';
import ChatPage from './main/ChatPage';
import CommunityPage from './main/CommunityPage';
import JobsPage from './main/JobsPage';
import MemberPanel from './main/MemberPanel';
import TradePage from './main/TradePage';
import NeighborhoodBar from './neighborhood/NeighborhoodBar';
import NeighborhoodOnboardingModal from './neighborhood/NeighborhoodOnboardingModal';
import NeighborhoodSettingsModal from './neighborhood/NeighborhoodSettingsModal';
import './HomeScreen.css';

function HomeScreen({ user }) {
  const [activeTab, setActiveTab] = useState('trade');
  const [overlay, setOverlay] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [neighborhoodSettingsOpen, setNeighborhoodSettingsOpen] = useState(false);

  const { member, loading: profileLoading } = useMemberProfile(user);
  const {
    account: payoutAccount,
    loading: payoutLoading,
    error: payoutError,
    refresh: refreshPayout,
  } = usePayoutAccount(!!user);
  const {
    personal,
    neighborhoodTrees,
    loading: growthLoading,
    error: growthError,
  } = useGrowthStats(user?.id);
  const { unreadTotal, refreshChatUnread } = useChatUnread(!!user, user?.id);
  const neighborhoodState = useUserNeighborhoods(!!user);

  const openGrowth = () => setOverlay('growth');
  const openPayout = () => setOverlay('payout');
  const openTreeMap = () => setOverlay('treeMap');
  const closeGrowth = () => setOverlay(null);
  const closePayout = () => setOverlay(null);
  const closeTreeMap = () => setOverlay('growth');

  const renderTabPage = () => {
    if (activeTab === 'trade') {
      return (
        <TradePage
          user={user}
          member={member}
          neighborhoodState={neighborhoodState}
          onOpenPayoutAccount={openPayout}
        />
      );
    }
    if (activeTab === 'chat') {
      return (
        <ChatPage
          user={user}
          onUnreadChange={refreshChatUnread}
          onOpenPayoutAccount={openPayout}
        />
      );
    }
    if (activeTab === 'community') {
      return (
        <CommunityPage user={user} member={member} neighborhoodState={neighborhoodState} />
      );
    }
    if (activeTab === 'jobs') return <JobsPage />;
    return (
      <TradePage
        user={user}
        member={member}
        neighborhoodState={neighborhoodState}
        onOpenPayoutAccount={openPayout}
      />
    );
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await signOut();
    } catch (err) {
      console.error('[Villager] 로그아웃 실패', err);
      setLogoutLoading(false);
    }
  };

  return (
    <div className="home">
      <header className="home__header">
        <div className="home__header-start">
          <h1 className="home__brand">Villager</h1>
          <NeighborhoodBar
            neighborhoods={neighborhoodState.neighborhoods}
            activeSlot={neighborhoodState.activeSlot}
            onSelectSlot={neighborhoodState.setActiveSlot}
            onManage={() => setNeighborhoodSettingsOpen(true)}
          />
        </div>
        <MemberPanel
          member={member}
          loading={profileLoading}
          onViewGrowth={openGrowth}
          onViewPayout={openPayout}
          onLogout={handleLogout}
          logoutLoading={logoutLoading}
        />
      </header>

      <main className="home__main" hidden={overlay !== null}>
        {renderTabPage()}
      </main>

      {overlay === null && (
        <BottomTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          chatUnreadTotal={unreadTotal}
        />
      )}

      {overlay === 'payout' && (
        <PayoutAccountScreen
          account={payoutAccount}
          loading={payoutLoading}
          error={payoutError}
          onRefresh={refreshPayout}
          onClose={closePayout}
        />
      )}

      {overlay === 'growth' && (
        <GrowthContributionScreen
          member={member}
          personal={personal}
          loading={growthLoading}
          error={growthError}
          onClose={closeGrowth}
          onOpenTreeMap={openTreeMap}
        />
      )}

      {overlay === 'treeMap' && (
        <NeighborhoodTreeMapScreen
          neighborhoodTrees={neighborhoodTrees}
          loading={growthLoading}
          onClose={closeTreeMap}
        />
      )}

      <NeighborhoodOnboardingModal
        open={neighborhoodState.needsOnboarding}
        onRegister={neighborhoodState.register}
        onComplete={neighborhoodState.reload}
      />

      <NeighborhoodSettingsModal
        open={neighborhoodSettingsOpen}
        neighborhoods={neighborhoodState.neighborhoods}
        onClose={() => setNeighborhoodSettingsOpen(false)}
        onRegister={neighborhoodState.register}
        onVerify={neighborhoodState.verify}
      />
    </div>
  );
}

export default HomeScreen;
