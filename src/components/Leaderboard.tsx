import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { LeaderboardEntry } from '../types';
import { Trophy, Medal, Crown, RefreshCw } from 'lucide-react';

export function Leaderboard() {
  const { user, profile } = useApp();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'week' | 'all'>('week');

  const load = async () => {
    setLoading(true);
    const col = tab === 'week' ? 'week_points' : 'total_points';
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, week_points, total_points')
      .order(col, { ascending: false })
      .limit(50);

    if (data) {
      setEntries(data.map((e, i) => ({ ...e, rank: i + 1 } as LeaderboardEntry)));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab]);

  const myRank = entries.findIndex(e => e.id === user?.id) + 1;

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={18} className="text-amber-400" />;
    if (rank === 2) return <Medal size={18} className="text-slate-300" />;
    if (rank === 3) return <Medal size={18} className="text-amber-600" />;
    return <span className="text-white/40 text-sm font-mono w-[18px] text-center">{rank}</span>;
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-bold text-xl">Leaderboard</h2>
          <p className="text-white/40 text-xs mt-0.5">Compete with users worldwide</p>
        </div>
        <button onClick={load} className="icon-btn text-sky-400">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* My position */}
      {myRank > 0 && profile && (
        <div className="glass-card p-4 mb-4 border border-sky-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
                <span className="text-sky-400 font-bold text-sm">#{myRank}</span>
              </div>
              <div>
                <p className="text-white font-semibold">{profile.display_name} <span className="text-sky-400 text-xs">(You)</span></p>
                <p className="text-white/40 text-xs">{tab === 'week' ? 'This week' : 'All time'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-bold">{tab === 'week' ? profile.week_points : profile.total_points}</p>
              <p className="text-amber-400 text-xs">pts</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 glass-card p-1">
        {(['week', 'all'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'text-white/50 hover:text-white/70'}`}
          >
            {t === 'week' ? 'This Week' : 'All Time'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {entries.map((entry, i) => {
            const isMe = entry.id === user?.id;
            const pts = tab === 'week' ? entry.week_points : entry.total_points;
            return (
              <div
                key={entry.id}
                className={`glass-card p-4 flex items-center gap-3 transition-all ${isMe ? 'border border-sky-500/40' : ''}`}
                style={{ animation: `fadeInUp ${0.05 * i}s ease both` }}
              >
                <div className="w-8 flex items-center justify-center">
                  {rankIcon(i + 1)}
                </div>

                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: isMe ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.08)',
                    border: isMe ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.1)',
                    color: isMe ? '#38bdf8' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {entry.display_name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${isMe ? 'text-sky-300' : 'text-white/80'}`}>
                    {entry.display_name}
                    {isMe && <span className="text-sky-400/60 text-xs ml-1">(you)</span>}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Trophy size={12} className="text-amber-400" />
                  <span className="text-white font-bold text-sm">{pts}</span>
                  <span className="text-white/30 text-xs">pts</span>
                </div>
              </div>
            );
          })}

          {entries.length === 0 && (
            <div className="text-center py-16 text-white/30">
              <Trophy size={40} className="mx-auto mb-3 opacity-30" />
              <p>No entries yet. Start planning!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
