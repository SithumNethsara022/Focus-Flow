import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { TimeBlock, TimeBlockTask, Category, CATEGORY_META, SOCIAL_APPS, IntervalSize } from '../types';
import { X, Plus, Trash2, Bell, Shield, ChevronDown, ChevronUp, Check } from 'lucide-react';

const COLORS = [
  '#2563eb', '#0891b2', '#0d9488', '#16a34a', '#ca8a04',
  '#dc2626', '#db2777', '#7c3aed', '#ea580c', '#64748b',
];

interface Props {
  dayId: string;
  slots: number[];
  startSlot: number;
  endSlot: number;
  intervalSize: IntervalSize;
  existingBlock: TimeBlock | null;
  slotTime: (slot: number) => string;
  onSaved: () => void;
  onClose: () => void;
}

export function BlockModal({ dayId, startSlot, endSlot, intervalSize, existingBlock, slotTime, onSaved, onClose }: Props) {
  const { user } = useApp();
  const [category, setCategory] = useState<Category>(existingBlock?.category ?? 'study');
  const [title, setTitle] = useState(existingBlock?.title ?? '');
  const [color, setColor] = useState(existingBlock?.color ?? COLORS[0]);
  const [isImportant, setIsImportant] = useState(existingBlock?.is_important ?? false);
  const [notes, setNotes] = useState(existingBlock?.notes ?? '');
  const [blockApps, setBlockApps] = useState(existingBlock?.block_apps ?? false);
  const [blockedApps, setBlockedApps] = useState<string[]>(existingBlock?.blocked_apps ?? []);
  const [tasks, setTasks] = useState<Omit<TimeBlockTask, 'id' | 'block_id' | 'user_id' | 'created_at'>[]>([]);
  const [newTask, setNewTask] = useState('');
  const [saving, setSaving] = useState(false);
  const [showApps, setShowApps] = useState(false);
  const [mergeEnd, setMergeEnd] = useState(endSlot);

  useEffect(() => {
    if (existingBlock?.tasks) {
      setTasks(existingBlock.tasks.map(t => ({ content: t.content, is_done: t.is_done, position: t.position })));
    }
  }, [existingBlock]);

  useEffect(() => {
    if (category !== 'other') {
      setTitle(CATEGORY_META[category].label);
      setColor(CATEGORY_META[category].defaultColor);
    } else {
      setTitle('');
    }
  }, [category]);

  const totalSlots = mergeEnd - startSlot + 1;
  const duration = totalSlots * intervalSize;

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks(prev => [...prev, { content: newTask.trim(), is_done: false, position: prev.length }]);
    setNewTask('');
  };

  const toggleAppBlock = (appId: string) => {
    setBlockedApps(prev => prev.includes(appId) ? prev.filter(a => a !== appId) : [...prev, appId]);
  };

  const handleSave = async () => {
    if (!user || !title.trim()) return;
    setSaving(true);

    const payload = {
      day_id: dayId,
      user_id: user.id,
      start_slot: startSlot,
      end_slot: mergeEnd,
      title: title.trim(),
      category,
      color,
      is_important: isImportant,
      notes: notes || null,
      block_apps: blockApps,
      blocked_apps: blockedApps,
    };

    let blockId = existingBlock?.id;
    if (existingBlock) {
      await supabase.from('time_blocks').update(payload).eq('id', existingBlock.id);
      // Delete old tasks
      await supabase.from('time_block_tasks').delete().eq('block_id', existingBlock.id);
    } else {
      const { data } = await supabase.from('time_blocks').insert(payload).select().single();
      blockId = data?.id;
    }

    if (blockId && tasks.length) {
      await supabase.from('time_block_tasks').insert(
        tasks.map((t, i) => ({ ...t, block_id: blockId!, user_id: user.id, position: i }))
      );
    }

    if (isImportant && 'Notification' in window && Notification.permission === 'granted') {
      // Schedule notification (best effort)
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const slotTime = startSlot * intervalSize;
      const h = Math.floor(slotTime / 60);
      const m = slotTime % 60;
      const blockTime = new Date(`${todayStr}T${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:00`);
      const delay = blockTime.getTime() - Date.now();
      if (delay > 0) {
        setTimeout(() => {
          new Notification(`⏰ Time for: ${title}`, { body: 'Your important task is starting now!', icon: '/vite.svg' });
        }, delay);
      }
    }

    setSaving(false);
    onSaved();
  };

  const handleDelete = async () => {
    if (!existingBlock) return;
    await supabase.from('time_blocks').delete().eq('id', existingBlock.id);
    onSaved();
  };

  const slotsPerHour = 60 / intervalSize;
  const maxSlot = 24 * slotsPerHour - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' }}>
      <div className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-white font-semibold">{existingBlock ? 'Edit Block' : 'New Block'}</h2>
            <p className="text-white/40 text-xs mt-0.5">
              {slotTime(startSlot)} – {slotTime(mergeEnd + 1)} · {duration} min
            </p>
          </div>
          <div className="flex gap-2">
            {existingBlock && (
              <button onClick={handleDelete} className="icon-btn text-red-400 hover:text-red-300">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="icon-btn"><X size={20} /></button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Duration extend */}
          <div>
            <label className="field-label">Duration</label>
            <div className="flex items-center gap-3 mt-2">
              <button
                disabled={mergeEnd <= startSlot}
                onClick={() => setMergeEnd(e => Math.max(startSlot, e - 1))}
                className="icon-btn disabled:opacity-30"
              >
                <ChevronDown size={16} />
              </button>
              <span className="text-white text-sm font-mono w-20 text-center">{(mergeEnd - startSlot + 1) * intervalSize} min</span>
              <button
                disabled={mergeEnd >= maxSlot}
                onClick={() => setMergeEnd(e => Math.min(maxSlot, e + 1))}
                className="icon-btn disabled:opacity-30"
              >
                <ChevronUp size={16} />
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="field-label">Category</label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${category === key ? 'border-sky-500/70 bg-sky-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >
                  <span className="text-lg">{meta.icon}</span>
                  <span className="text-white/70 text-[10px]">{meta.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="field-label">Title</label>
            <input
              className="glass-input mt-2"
              placeholder={category === 'other' ? 'Enter task title...' : 'Edit title...'}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Color */}
          <div>
            <label className="field-label">Color</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-all hover:scale-110"
                  style={{ background: c, boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none' }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="field-label">Notes / Description</label>
            <textarea
              className="glass-input mt-2 min-h-[80px] resize-none"
              placeholder="Add notes or description..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Tasks */}
          <div>
            <label className="field-label">Task List</label>
            <div className="space-y-2 mt-2">
              {tasks.map((task, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <button
                    onClick={() => setTasks(prev => prev.map((t, j) => j === i ? { ...t, is_done: !t.is_done } : t))}
                    className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${task.is_done ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'}`}
                  >
                    {task.is_done && <Check size={12} className="text-white" />}
                  </button>
                  <span className={`text-sm flex-1 ${task.is_done ? 'line-through text-white/40' : 'text-white/80'}`}>{task.content}</span>
                  <button
                    onClick={() => setTasks(prev => prev.filter((_, j) => j !== i))}
                    className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  className="glass-input flex-1 text-sm py-2"
                  placeholder="Add a task..."
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                />
                <button onClick={addTask} className="icon-btn text-sky-400 hover:text-sky-300">
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Important toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} className={isImportant ? 'text-amber-400' : 'text-white/40'} />
              <div>
                <p className="text-white/80 text-sm">Mark as Important</p>
                <p className="text-white/30 text-xs">Sound alarm when it's time</p>
              </div>
            </div>
            <button
              onClick={() => setIsImportant(!isImportant)}
              className={`w-12 h-6 rounded-full transition-all relative ${isImportant ? 'bg-amber-500' : 'bg-white/20'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isImportant ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* App blocking */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className={blockApps ? 'text-emerald-400' : 'text-white/40'} />
                <div>
                  <p className="text-white/80 text-sm">Block Distracting Apps</p>
                  <p className="text-white/30 text-xs">Earn 5 pts per 15 min you stay focused</p>
                </div>
              </div>
              <button
                onClick={() => { setBlockApps(!blockApps); setShowApps(!blockApps); }}
                className={`w-12 h-6 rounded-full transition-all relative ${blockApps ? 'bg-emerald-500' : 'bg-white/20'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${blockApps ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {blockApps && (
              <div className="mt-3">
                <button
                  onClick={() => setShowApps(!showApps)}
                  className="text-sky-400 text-xs flex items-center gap-1 hover:text-sky-300"
                >
                  {showApps ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showApps ? 'Hide app list' : `Select apps to block (${blockedApps.length} selected)`}
                </button>
                {showApps && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {SOCIAL_APPS.map(app => (
                      <button
                        key={app.id}
                        onClick={() => toggleAppBlock(app.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-sm transition-all ${blockedApps.includes(app.id) ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'}`}
                      >
                        <span>{app.icon}</span>
                        <span className="text-xs">{app.name}</span>
                        {blockedApps.includes(app.id) && <Check size={12} className="ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : existingBlock ? 'Update' : 'Save Block'}
          </button>
        </div>
      </div>
    </div>
  );
}
