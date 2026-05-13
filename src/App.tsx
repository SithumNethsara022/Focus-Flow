import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoadingScreen } from './components/LoadingScreen';
import { Auth } from './components/Auth';
import { Planner } from './components/Planner';
import { Leaderboard } from './components/Leaderboard';
import { Settings } from './components/Settings';
import { BottomNav } from './components/BottomNav';
import { Trophy } from 'lucide-react';

type Tab = 'planner' | 'leaderboard' | 'settings';

function AppShell() {
  const { user, profile, theme, loading } = useApp();
  const [appLoaded, setAppLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>('planner');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (!appLoaded) return <LoadingScreen onDone={() => setAppLoaded(true)} />;
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center app-bg">
      <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Auth />;

  return (
    <div className="app-root flex flex-col min-h-screen max-w-md mx-auto relative">
      {/* Header */}
      <header className="app-header flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-white font-bold text-lg leading-none">FocusFlow</h1>
          <p className="text-white/40 text-xs mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        {profile && (
          <div className="flex items-center gap-2 glass-card px-3 py-2">
            <Trophy size={14} className="text-amber-400" />
            <span className="text-amber-400 font-bold text-sm">{profile.week_points}</span>
            <span className="text-white/30 text-xs">pts</span>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {tab === 'planner' && <Planner />}
        {tab === 'leaderboard' && <Leaderboard />}
        {tab === 'settings' && <Settings />}
      </main>

      {/* Bottom Nav */}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
