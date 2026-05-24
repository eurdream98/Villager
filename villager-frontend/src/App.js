import { useEffect, useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import HomeScreen from './components/HomeScreen';
import { supabase } from './lib/supabase';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="App App--loading">불러오는 중…</div>;
  }

  return (
    <div className="App">
      {session ? (
        <HomeScreen user={session.user} />
      ) : (
        <WelcomeScreen />
      )}
    </div>
  );
}

export default App;
