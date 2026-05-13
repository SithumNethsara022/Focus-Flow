import { useEffect, useState } from 'react';

const MESSAGES = [
  "Plan your day. Own your life.",
  "Every minute counts.",
  "Your goals deserve structure.",
  "Start strong. Finish stronger.",
  "Time is your most valuable asset.",
  "Make today count.",
];

export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1500);
    const t4 = setTimeout(() => setPhase(4), 2200);
    const t5 = setTimeout(() => onDone(), 3200);

    const msgInterval = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length);
    }, 2000);

    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(progressInterval); return 100; }
        return p + 2;
      });
    }, 55);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(t4); clearTimeout(t5);
      clearInterval(msgInterval); clearInterval(progressInterval);
    };
  }, [onDone]);

  return (
    <div className="loading-screen fixed inset-0 flex flex-col items-center justify-center overflow-hidden">
      {/* Animated background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Grid overlay */}
      <div className="grid-overlay absolute inset-0" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        {/* Logo */}
        <div
          className="logo-container"
          style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.8)', transition: 'all 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}
        >
          <div className="logo-ring">
            <div className="logo-inner">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="20" stroke="url(#lg1)" strokeWidth="2.5" />
                <path d="M24 12 L24 24 L32 28" stroke="url(#lg2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="24" cy="24" r="3" fill="url(#lg1)" />
                <defs>
                  <linearGradient id="lg1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </linearGradient>
                  <linearGradient id="lg2" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* App name */}
        <div
          style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.7s ease' }}
        >
          <h1 className="app-title text-5xl font-bold tracking-tight text-white mb-2">
            FocusFlow
          </h1>
          <p className="text-sky-300/70 text-sm tracking-[0.3em] uppercase">Day Planner</p>
        </div>

        {/* Motivational message */}
        <div
          className="glass-card px-8 py-4 max-w-sm"
          style={{ opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.7s ease 0.1s' }}
        >
          <p
            key={msgIndex}
            className="text-white/90 text-base font-light italic"
            style={{ animation: 'fadeInUp 0.5s ease' }}
          >
            "{MESSAGES[msgIndex]}"
          </p>
        </div>

        {/* Progress bar */}
        <div
          className="w-64"
          style={{ opacity: phase >= 3 ? 1 : 0, transition: 'opacity 0.5s ease 0.2s' }}
        >
          <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
                transition: 'width 0.1s linear',
                boxShadow: '0 0 8px rgba(56,189,248,0.8)',
              }}
            />
          </div>
        </div>

        {/* Signature */}
        <div
          style={{ opacity: phase >= 4 ? 1 : 0, transform: phase >= 4 ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.5s ease' }}
        >
          <p className="signature-text text-white/30 text-sm">by SN ICT Services</p>
        </div>
      </div>
    </div>
  );
}
