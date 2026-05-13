export type Theme = 'light' | 'dark';
export type IntervalSize = 15 | 30;
export type Category = 'study' | 'work' | 'exercise' | 'cleaning' | 'sleep' | 'meal' | 'other';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  week_points: number;
  week_start: string;
  interval_preference: string;
  theme: Theme;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlannerDay {
  id: string;
  user_id: string;
  date: string;
  interval_size: IntervalSize;
  created_at: string;
}

export interface TimeBlock {
  id: string;
  day_id: string;
  user_id: string;
  start_slot: number;
  end_slot: number;
  title: string;
  category: Category;
  color: string;
  is_important: boolean;
  notes: string | null;
  block_apps: boolean;
  blocked_apps: string[];
  is_completed: boolean;
  countdown_started_at: string | null;
  created_at: string;
  updated_at: string;
  tasks?: TimeBlockTask[];
}

export interface TimeBlockTask {
  id: string;
  block_id: string;
  user_id: string;
  content: string;
  is_done: boolean;
  position: number;
  created_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  block_id: string | null;
  points: number;
  reason: string;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  display_name: string;
  week_points: number;
  total_points: number;
  rank?: number;
}

export const CATEGORY_META: Record<Category, { label: string; icon: string; defaultColor: string }> = {
  study: { label: 'Study', icon: '📚', defaultColor: '#2563eb' },
  work: { label: 'Work', icon: '💼', defaultColor: '#0891b2' },
  exercise: { label: 'Exercise', icon: '🏃', defaultColor: '#16a34a' },
  cleaning: { label: 'Cleaning', icon: '🧹', defaultColor: '#ca8a04' },
  sleep: { label: 'Sleep', icon: '😴', defaultColor: '#7c3aed' },
  meal: { label: 'Meal', icon: '🍽️', defaultColor: '#ea580c' },
  other: { label: 'Other', icon: '✏️', defaultColor: '#64748b' },
};

export const SOCIAL_APPS = [
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'twitter', name: 'Twitter / X', icon: '🐦' },
  { id: 'facebook', name: 'Facebook', icon: '👥' },
  { id: 'snapchat', name: 'Snapchat', icon: '👻' },
  { id: 'youtube', name: 'YouTube', icon: '▶️' },
  { id: 'reddit', name: 'Reddit', icon: '🤖' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
  { id: 'telegram', name: 'Telegram', icon: '✈️' },
  { id: 'discord', name: 'Discord', icon: '🎮' },
];

export const MOTIVATIONAL_QUOTES = [
  "The secret of getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going.",
  "It always seems impossible until it's done.",
  "Focus on being productive instead of busy.",
  "You don't have to be great to start, but you have to start to be great.",
  "The future depends on what you do today.",
  "Small daily improvements are the key to staggering long-term results.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Believe you can and you're halfway there.",
  "Action is the foundational key to all success.",
  "Your limitation—it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Stay focused and never give up.",
];
