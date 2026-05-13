import { CalendarDays, Trophy, Settings } from 'lucide-react';

type Tab = 'planner' | 'leaderboard' | 'settings';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; icon: typeof CalendarDays; label: string }[] = [
  { id: 'planner', icon: CalendarDays, label: 'Planner' },
  { id: 'leaderboard', icon: Trophy, label: 'Ranks' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav flex items-center px-2 pb-safe">
      {TABS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl mx-1 transition-all duration-300 ${
            active === id ? 'text-sky-400' : 'text-white/30 hover:text-white/50'
          }`}
        >
          <div className="relative">
            <Icon
              size={22}
              className={`transition-all duration-300 ${active === id ? 'drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]' : ''}`}
            />
            {active === id && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-sky-400 rounded-full" />
            )}
          </div>
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
