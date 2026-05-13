import { useState, useEffect, useRef } from 'react';
import { TimeBlock, IntervalSize, CATEGORY_META, MOTIVATIONAL_QUOTES } from '../types';
import { X, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

interface Props {
  block: TimeBlock;
  intervalSize: IntervalSize;
  onClose: () => void;
  onPointsEarned: () => void;
}

export function CountdownOverlay({ block, intervalSize, onClose, onPointsEarned }: Props) {
  const { user, refreshProfile } = useApp();
  const totalSeconds = (block.end_slot - block.start_slot + 1) * intervalSize * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [quoteIndex, setQuoteIndex] = useState(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  const [isDimmed, setIsDimmed] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showPoints, setShowPoints] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const lastPointSlotRef = useRef(0);
  const dimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(interval);
          handleComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    const quoteInterval = setInterval(() => {
      setQuoteIndex(i => (i + 1) % MOTIVATIONAL_QUOTES.length);
    }, 8000);

    return () => { clearInterval(interval); clearInterval(quoteInterval); };
  }, []);

  // Points per 15 min = 5
  useEffect(() => {
    const elapsed = totalSeconds - secondsLeft;
    const slot15 = Math.floor(elapsed / (15 * 60));
    if (slot15 > lastPointSlotRef.current) {
      const newSlots = slot15 - lastPointSlotRef.current;
      lastPointSlotRef.current = slot15;
      const pts = newSlots * 5;
      awardPoints(pts, 'countdown_active');
      setPointsEarned(p => p + pts);
      setShowPoints(true);
      setTimeout(() => setShowPoints(false), 2000);
    }
  }, [secondsLeft]);

  // Dim after 5 min inactivity
  useEffect(() => {
    const resetDim = () => {
      lastActivityRef.current = Date.now();
      setIsDimmed(false);
      if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
      dimTimerRef.current = setTimeout(() => setIsDimmed(true), 5 * 60 * 1000);
    };

    resetDim();
    window.addEventListener('touchstart', resetDim);
    window.addEventListener('mousemove', resetDim);
    window.addEventListener('keydown', resetDim);
    return () => {
      window.removeEventListener('touchstart', resetDim);
      window.removeEventListener('mousemove', resetDim);
      window.removeEventListener('keydown', resetDim);
      if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
    };
  }, []);

  const awardPoints = async (pts: number, reason: string) => {
    if (!user) return;
    await supabase.from('point_transactions').insert({
      user_id: user.id,
      block_id: block.id,
      points: pts,
      reason,
    });
    const { data: pData } = await supabase
      .from('profiles')
      .select('total_points, week_points')
      .eq('id', user.id)
      .single();
    if (pData) {
      await supabase.from('profiles').update({
        total_points: (pData.total_points || 0) + pts,
        week_points: (pData.week_points || 0) + pts,
      }).eq('id', user.id);
    }
    await refreshProfile();
    onPointsEarned();
  };

  const handleComplete = async () => {
    await awardPoints(5, 'countdown_complete');
    await supabase.from('time_blocks').update({ is_completed: true }).eq('id', block.id);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = (totalSeconds - secondsLeft) / totalSeconds;
  const cat = CATEGORY_META[block.category];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center transition-all duration-1000"
      style={{ background: isDimmed ? '#000' : 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)' }}
      onClick={() => setIsDimmed(false)}
    >
      {!isDimmed && (
        <>
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 icon-btn text-white/40 hover:text-white/70"
          >
            <X size={24} />
          </button>

          {/* Points pop */}
          {showPoints && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 rounded-full px-4 py-2"
              style={{ animation: 'fadeInUp 0.4s ease' }}>
              <Trophy size={16} className="text-amber-400" />
              <span className="text-amber-300 font-semibold text-sm">+5 points earned!</span>
            </div>
          )}

          <div className="flex flex-col items-center gap-8 px-6 text-center max-w-sm w-full">
            {/* Category icon */}
            <div className="text-5xl">{cat.icon}</div>

            {/* Title */}
            <div>
              <h2 className="text-white text-2xl font-bold">{block.title}</h2>
              <p className="text-white/40 text-sm mt-1 capitalize">{block.category}</p>
            </div>

            {/* Circular progress */}
            <div className="relative w-52 h-52">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke={block.color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
                  style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 8px ${block.color})` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white text-4xl font-bold font-mono tabular-nums">
                  {mins.toString().padStart(2,'0')}:{secs.toString().padStart(2,'0')}
                </span>
                <span className="text-white/40 text-xs mt-1">remaining</span>
              </div>
            </div>

            {/* Quote */}
            <div className="glass-card px-6 py-4 w-full">
              <p
                key={quoteIndex}
                className="text-white/80 text-sm italic leading-relaxed"
                style={{ animation: 'fadeInUp 0.5s ease' }}
              >
                "{MOTIVATIONAL_QUOTES[quoteIndex]}"
              </p>
            </div>

            {/* Points earned */}
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Trophy size={14} className="text-amber-400" />
              <span><span className="text-amber-400 font-semibold">{pointsEarned}</span> points earned this session</span>
            </div>
          </div>
        </>
      )}

      {isDimmed && (
        <div className="text-white/20 text-sm text-center animate-pulse">
          <p>Tap to wake</p>
          <p className="font-mono text-2xl mt-2 text-white/40">
            {mins.toString().padStart(2,'0')}:{secs.toString().padStart(2,'0')}
          </p>
        </div>
      )}
    </div>
  );
}
