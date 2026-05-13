import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Sun, Moon, Bell, BellOff, LogOut, Save, User, Trophy } from 'lucide-react';

export function Settings() {
  const { user, profile, theme, setTheme, refreshProfile } = useApp();
  const [name, setName] = useState(profile?.display_name ?? '');
  const [interval, setInterval] = useState(profile?.interval_preference ?? '30');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | null>(
    'Notification' in window ? Notification.permission : null
  );

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({
      display_name: name,
      interval_preference: interval,
    }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setNotifStatus(result);
    await supabase.from('profiles').update({ notifications_enabled: result === 'granted' }).eq('id', user?.id ?? '');
  };

  const handleSignOut = () => supabase.auth.signOut();

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      <h2 className="text-white font-bold text-xl mb-6">Settings</h2>

      {/* Profile */}
      <section className="glass-card p-5 mb-4">
        <h3 className="text-white/60 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
          <User size={12} /> Profile
        </h3>

        <div className="space-y-3">
          <div>
            <label className="field-label">Display Name</label>
            <input
              className="glass-input mt-2"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input className="glass-input mt-2 opacity-50 cursor-not-allowed" value={user?.email ?? ''} readOnly />
          </div>
        </div>
      </section>

      {/* Points */}
      {profile && (
        <section className="glass-card p-5 mb-4">
          <h3 className="text-white/60 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
            <Trophy size={12} /> Points
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
              <p className="text-amber-400 text-2xl font-bold">{profile.week_points}</p>
              <p className="text-white/40 text-xs mt-1">This Week</p>
            </div>
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-center">
              <p className="text-sky-400 text-2xl font-bold">{profile.total_points}</p>
              <p className="text-white/40 text-xs mt-1">All Time</p>
            </div>
          </div>
          <p className="text-white/30 text-xs mt-3 text-center">Earn 5 pts per 15 min of focused work</p>
        </section>
      )}

      {/* Planner */}
      <section className="glass-card p-5 mb-4">
        <h3 className="text-white/60 text-xs uppercase tracking-widest mb-4">Planner</h3>
        <div>
          <label className="field-label">Default Interval</label>
          <div className="flex gap-2 mt-2">
            {[15, 30].map(v => (
              <button
                key={v}
                onClick={() => setInterval(String(v))}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${interval === String(v) ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/30' : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'}`}
              >
                {v} minutes
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="glass-card p-5 mb-4">
        <h3 className="text-white/60 text-xs uppercase tracking-widest mb-4">Appearance</h3>
        <div>
          <label className="field-label">Theme</label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${theme === 'dark' ? 'bg-slate-700 border-slate-500 text-white' : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'}`}
            >
              <Moon size={16} /> Dark
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${theme === 'light' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'}`}
            >
              <Sun size={16} /> Light
            </button>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="glass-card p-5 mb-4">
        <h3 className="text-white/60 text-xs uppercase tracking-widest mb-4">Notifications</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {notifStatus === 'granted' ? (
              <Bell size={18} className="text-sky-400" />
            ) : (
              <BellOff size={18} className="text-white/40" />
            )}
            <div>
              <p className="text-white/80 text-sm">Push Notifications</p>
              <p className="text-white/30 text-xs">
                {notifStatus === 'granted' ? 'Enabled' : notifStatus === 'denied' ? 'Blocked by browser' : 'Not enabled'}
              </p>
            </div>
          </div>
          {notifStatus !== 'granted' && notifStatus !== 'denied' && (
            <button onClick={requestNotifications} className="btn-primary text-xs px-4 py-2">
              Enable
            </button>
          )}
          {notifStatus === 'granted' && (
            <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
          )}
        </div>
      </section>

      {/* Save */}
      <button onClick={handleSave} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
        {saving ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : saved ? (
          <><span className="text-emerald-300">✓</span> Saved!</>
        ) : (
          <><Save size={16} /> Save Changes</>
        )}
      </button>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium"
      >
        <LogOut size={16} /> Sign Out
      </button>

      <p className="text-center text-white/20 text-xs mt-6">
        <span className="signature-text">by SN ICT Services</span>
      </p>
    </div>
  );
}
