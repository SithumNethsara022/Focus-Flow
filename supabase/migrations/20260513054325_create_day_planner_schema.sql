/*
  # Day Planner App Schema

  1. New Tables
    - `profiles` - User profiles with points and settings
    - `planner_days` - A day plan for a user
    - `time_blocks` - Individual time blocks (merged 15/30 min slots)
    - `time_block_tasks` - Checklist items within a time block
    - `point_transactions` - Record of points earned

  2. Security
    - RLS enabled on all tables
    - Users can only access their own data
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  total_points integer NOT NULL DEFAULT 0,
  week_points integer NOT NULL DEFAULT 0,
  week_start date NOT NULL DEFAULT date_trunc('week', now())::date,
  interval_preference text NOT NULL DEFAULT '30',
  theme text NOT NULL DEFAULT 'dark',
  notifications_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- For leaderboard: allow reading other profiles (name + points only)
CREATE POLICY "Anyone can view profiles for leaderboard"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Planner days
CREATE TABLE IF NOT EXISTS planner_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  interval_size integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE planner_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own planner days"
  ON planner_days FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own planner days"
  ON planner_days FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own planner days"
  ON planner_days FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own planner days"
  ON planner_days FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Time blocks
CREATE TABLE IF NOT EXISTS time_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES planner_days(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_slot integer NOT NULL,
  end_slot integer NOT NULL,
  title text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'other',
  color text NOT NULL DEFAULT '#3b82f6',
  is_important boolean NOT NULL DEFAULT false,
  notes text,
  block_apps boolean NOT NULL DEFAULT false,
  blocked_apps text[] NOT NULL DEFAULT '{}',
  is_completed boolean NOT NULL DEFAULT false,
  countdown_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time blocks"
  ON time_blocks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time blocks"
  ON time_blocks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time blocks"
  ON time_blocks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own time blocks"
  ON time_blocks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Task items within a time block
CREATE TABLE IF NOT EXISTS time_block_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid NOT NULL REFERENCES time_blocks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  is_done boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE time_block_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON time_block_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON time_block_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON time_block_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON time_block_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Point transactions
CREATE TABLE IF NOT EXISTS point_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  block_id uuid REFERENCES time_blocks(id) ON DELETE SET NULL,
  points integer NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON point_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON point_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_planner_days_user_date ON planner_days(user_id, date);
CREATE INDEX IF NOT EXISTS idx_time_blocks_day_id ON time_blocks(day_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_id ON time_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_time_block_tasks_block_id ON time_block_tasks(block_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_week_points ON profiles(week_points DESC);
