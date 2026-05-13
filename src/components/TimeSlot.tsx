import { TimeBlock, CATEGORY_META, IntervalSize } from '../types';
import { Bell, Zap, Play } from 'lucide-react';

interface Props {
  slot: number;
  slotTime: string;
  intervalSize: IntervalSize;
  block?: TimeBlock;
  isSelected: boolean;
  mergeMode: boolean;
  onClick: () => void;
  onStartCountdown: () => void;
}

export function TimeSlot({ slot, slotTime, intervalSize, block, isSelected, mergeMode, onClick, onStartCountdown }: Props) {
  const showHour = (slot * intervalSize) % 60 === 0;
  const spanSlots = block ? (block.end_slot - block.start_slot + 1) : 1;
  const height = spanSlots * (intervalSize === 15 ? 36 : 48);

  if (block) {
    const cat = CATEGORY_META[block.category];
    return (
      <div
        className="relative flex cursor-pointer group"
        style={{ height: `${height}px` }}
        onClick={onClick}
      >
        {/* Time label */}
        <div className="w-16 shrink-0 flex items-start pt-1.5">
          <span className="text-white/40 text-xs font-mono">{slotTime}</span>
        </div>

        {/* Block */}
        <div
          className="flex-1 rounded-xl ml-2 p-2.5 flex flex-col justify-between overflow-hidden relative transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
          style={{
            background: `linear-gradient(135deg, ${block.color}33, ${block.color}22)`,
            borderLeft: `3px solid ${block.color}`,
            border: `1px solid ${block.color}44`,
          }}
        >
          {/* Glass shimmer */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl" />

          <div className="relative flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base leading-none">{cat.icon}</span>
              <span className="text-white font-semibold text-sm truncate">{block.title}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {block.is_important && <Bell size={12} className="text-amber-400" />}
              {block.block_apps && <Zap size={12} className="text-emerald-400" />}
              {block.is_completed && (
                <span className="w-4 h-4 rounded-full bg-emerald-500/40 border border-emerald-500/60 flex items-center justify-center">
                  <span className="text-emerald-300 text-[8px]">✓</span>
                </span>
              )}
            </div>
          </div>

          {spanSlots > 2 && (
            <div className="relative flex items-center justify-between">
              <span className="text-white/40 text-xs capitalize">{block.category} · {spanSlots * intervalSize} min</span>
              <button
                onClick={e => { e.stopPropagation(); onStartCountdown(); }}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 rounded-lg px-2 py-1 text-white/70 hover:text-white text-xs transition-all"
              >
                <Play size={10} />
                Start
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex cursor-pointer group ${isSelected ? 'selected-slot' : ''}`}
      style={{ height: intervalSize === 15 ? '36px' : '48px' }}
      onClick={onClick}
    >
      <div className="w-16 shrink-0 flex items-start pt-1">
        {showHour && <span className="text-white/40 text-xs font-mono">{slotTime}</span>}
      </div>
      <div
        className={`flex-1 rounded-lg ml-2 transition-all duration-150 border ${
          isSelected
            ? 'bg-sky-500/20 border-sky-500/50'
            : mergeMode
            ? 'border-dashed border-white/20 hover:bg-white/5 hover:border-sky-500/40'
            : 'border-transparent hover:bg-white/5 hover:border-white/10'
        }`}
      />
    </div>
  );
}
