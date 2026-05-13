import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { TimeBlock, PlannerDay, IntervalSize } from '../types';
import { TimeSlot } from './TimeSlot';
import { BlockModal } from './BlockModal';
import { CountdownOverlay } from './CountdownOverlay';
import { ChevronLeft, ChevronRight, Grid3x3 as Grid3X3, AlignJustify } from 'lucide-react';

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function Planner() {
  const { user, profile } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [plannerDay, setPlannerDay] = useState<PlannerDay | null>(null);
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [intervalSize, setIntervalSize] = useState<IntervalSize>(
    (parseInt(profile?.interval_preference ?? '30') as IntervalSize) || 30
  );
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [mergeMode, setMergeMode] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [newBlockSlots, setNewBlockSlots] = useState<number[] | null>(null);
  const [countdownBlock, setCountdownBlock] = useState<TimeBlock | null>(null);
  const [loading, setLoading] = useState(false);

  const slotsPerHour = 60 / intervalSize;
  const totalSlots = 24 * slotsPerHour;

  const loadDay = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const dateStr = formatDate(selectedDate);

    let { data: day } = await supabase
      .from('planner_days')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateStr)
      .maybeSingle();

    if (!day) {
      const { data: newDay } = await supabase
        .from('planner_days')
        .insert({ user_id: user.id, date: dateStr, interval_size: intervalSize })
        .select()
        .single();
      day = newDay;
    } else {
      setIntervalSize(day.interval_size as IntervalSize);
    }

    if (day) {
      setPlannerDay(day as PlannerDay);
      const { data: blks } = await supabase
        .from('time_blocks')
        .select('*, tasks:time_block_tasks(*)')
        .eq('day_id', day.id)
        .order('start_slot');
      setBlocks((blks as TimeBlock[]) ?? []);
    }
    setLoading(false);
  }, [user, selectedDate, intervalSize]);

  useEffect(() => { loadDay(); }, [loadDay]);

  const handleSlotClick = (slot: number) => {
    const occupied = blocks.find(b => slot >= b.start_slot && slot <= b.end_slot);
    if (occupied) {
      setEditingBlock(occupied);
      return;
    }
    if (mergeMode) {
      setSelectedSlots(prev => {
        if (prev.includes(slot)) return prev.filter(s => s !== slot);
        return [...prev, slot].sort((a, b) => a - b);
      });
    } else {
      setNewBlockSlots([slot]);
    }
  };

  const handleMergeConfirm = () => {
    if (selectedSlots.length < 2) return;
    setNewBlockSlots(selectedSlots);
    setSelectedSlots([]);
    setMergeMode(false);
  };

  const handleBlockSaved = () => {
    setNewBlockSlots(null);
    setEditingBlock(null);
    loadDay();
  };

  const handleIntervalChange = async (size: IntervalSize) => {
    setIntervalSize(size);
    if (plannerDay) {
      await supabase.from('planner_days').update({ interval_size: size }).eq('id', plannerDay.id);
    }
    loadDay();
  };

  const slotTime = (slot: number) => {
    const totalMins = slot * intervalSize;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const isToday = formatDate(selectedDate) === formatDate(new Date());

  return (
    <div className="flex flex-col h-full">
      {/* Date nav */}
      <div className="flex items-center justify-between px-4 py-3 glass-card mx-4 mt-4 mb-3">
        <button onClick={() => setSelectedDate(d => addDays(d, -1))} className="icon-btn">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-white font-semibold">
            {isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
          <p className="text-white/50 text-xs">
            {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => setSelectedDate(d => addDays(d, 1))} className="icon-btn">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-4 mb-3">
        <div className="flex items-center gap-1 glass-card p-1 flex-1">
          <button
            onClick={() => handleIntervalChange(15)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${intervalSize === 15 ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'text-white/50 hover:text-white/70'}`}
          >
            <Grid3X3 size={14} /> 15 min
          </button>
          <button
            onClick={() => handleIntervalChange(30)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${intervalSize === 30 ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'text-white/50 hover:text-white/70'}`}
          >
            <AlignJustify size={14} /> 30 min
          </button>
        </div>
        <button
          onClick={() => { setMergeMode(m => !m); setSelectedSlots([]); }}
          className={`glass-card px-4 py-2 text-xs font-medium transition-all ${mergeMode ? 'bg-amber-500/30 text-amber-300 border-amber-500/50' : 'text-white/50 hover:text-white/70'}`}
        >
          {mergeMode ? 'Merging...' : 'Merge'}
        </button>
        {mergeMode && selectedSlots.length >= 2 && (
          <button onClick={handleMergeConfirm} className="btn-primary text-xs px-4 py-2">
            Confirm
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-0.5">
            {Array.from({ length: totalSlots }, (_, i) => {
              const block = blocks.find(b => b.start_slot === i);
              const covered = blocks.find(b => i > b.start_slot && i <= b.end_slot);
              if (covered) return null;

              return (
                <TimeSlot
                  key={i}
                  slot={i}
                  slotTime={slotTime(i)}
                  intervalSize={intervalSize}
                  block={block}
                  isSelected={selectedSlots.includes(i)}
                  mergeMode={mergeMode}
                  onClick={() => handleSlotClick(i)}
                  onStartCountdown={() => block && setCountdownBlock(block)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Block modal */}
      {(newBlockSlots || editingBlock) && plannerDay && (
        <BlockModal
          dayId={plannerDay.id}
          slots={newBlockSlots ?? (editingBlock ? [editingBlock.start_slot] : [])}
          startSlot={editingBlock?.start_slot ?? (newBlockSlots?.[0] ?? 0)}
          endSlot={editingBlock?.end_slot ?? (newBlockSlots?.[newBlockSlots!.length - 1] ?? 0)}
          intervalSize={intervalSize}
          existingBlock={editingBlock}
          slotTime={slotTime}
          onSaved={handleBlockSaved}
          onClose={() => { setNewBlockSlots(null); setEditingBlock(null); }}
        />
      )}

      {/* Countdown overlay */}
      {countdownBlock && (
        <CountdownOverlay
          block={countdownBlock}
          intervalSize={intervalSize}
          onClose={() => setCountdownBlock(null)}
          onPointsEarned={loadDay}
        />
      )}
    </div>
  );
}
