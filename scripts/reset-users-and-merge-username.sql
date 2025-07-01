-- First, delete all existing data
DELETE FROM public.scores;
DELETE FROM public.users;

-- Drop existing indexes
DROP INDEX IF EXISTS users_username_unique_idx;
DROP INDEX IF EXISTS users_username_idx;
DROP INDEX IF EXISTS users_email_idx;

-- Drop and recreate the users table with the correct schema
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table with merged username (no separate name field)
CREATE TABLE public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Recreate scores table to ensure foreign key works
DROP TABLE IF EXISTS public.scores CASCADE;

CREATE TABLE public.scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  song_name TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('EZ', 'HD', 'IN', 'AT')),
  difficulty_rating DECIMAL(4,1),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 1000000),
  accuracy DECIMAL(5,2) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
  goods INTEGER CHECK (goods >= 0),
  bads_misses INTEGER CHECK (bads_misses >= 0),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for simplicity)
CREATE POLICY "Allow all operations on users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all operations on scores" ON public.scores FOR ALL USING (true);

-- Create indexes for better performance
CREATE UNIQUE INDEX users_email_idx ON public.users(email);
CREATE UNIQUE INDEX users_username_unique_idx ON public.users (LOWER(username));
CREATE INDEX users_username_idx ON public.users(username);
CREATE INDEX scores_user_id_idx ON public.scores(user_id);
CREATE INDEX scores_created_at_idx ON public.scores(created_at DESC);
CREATE INDEX scores_song_difficulty_idx ON public.scores(song_name, difficulty);
