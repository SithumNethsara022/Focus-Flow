import { SOCIAL_APPS } from '../types';

interface Props {
  appId: string;
  onDismiss: () => void;
}

export function AppBlockerScreen({ appId, onDismiss }: Props) {
  const app = SOCIAL_APPS.find(a => a.id === appId);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-8 text-center"
      style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
      <div className="orb orb-1" style={{ opacity: 0.3 }} />
      <div className="orb orb-2" style={{ opacity: 0.2 }} />

      <div className="relative z-10 max-w-sm">
        <div className="text-6xl mb-6">🎯</div>
        <h1 className="text-white text-3xl font-bold mb-4 leading-tight">
          Focus on your goals, not distractions
        </h1>
        <p className="text-white/50 text-base mb-2">
          {app ? `${app.icon} ${app.name}` : 'This app'} is blocked during your focus time.
        </p>
        <p className="text-white/30 text-sm mb-10">
          Stay on track and earn points for every 15 minutes you stay focused.
        </p>

        <button
          onClick={onDismiss}
          className="btn-ghost text-white/40 hover:text-white/60 text-sm border border-white/10"
        >
          Dismiss & continue anyway
        </button>
      </div>
    </div>
  );
}
