import { useEffect, useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import HomeScreen from './components/HomeScreen';
import { clearOAuthParamsFromUrl, readOAuthErrorFromUrl } from './lib/oauthErrors';
import { supabase } from './lib/supabase';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [oauthError, setOauthError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const urlError = readOAuthErrorFromUrl();
      if (urlError) {
        if (mounted) setOauthError(urlError);
        clearOAuthParamsFromUrl();
      }

      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError && mounted && !urlError) {
        setOauthError(sessionError.message);
      }

      if (mounted) {
        setSession(currentSession);
        setLoading(false);
        if (currentSession) clearOAuthParamsFromUrl();
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      setLoading(false);
      if (event === 'SIGNED_IN' && currentSession) {
        setOauthError(null);
        clearOAuthParamsFromUrl();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="App App--loading">불러오는 중…</div>;
  }

  return (
    <div className="App">
      {session ? (
        <HomeScreen user={session.user} />
      ) : (
        <WelcomeScreen
          oauthError={oauthError}
          onClearOAuthError={() => setOauthError(null)}
        />
      )}
    </div>
  );
}

export default App;
