-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create scores table
CREATE TABLE IF NOT EXISTS public.scores (
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for scores table
CREATE POLICY "Users can view own scores" ON public.scores
  FOR SELECT USING (auth.uid()::text = user_id::text);
  
CREATE POLICY "Users can insert own scores" ON public.scores
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
  
CREATE POLICY "Users can update own scores" ON public.scores
  FOR UPDATE USING (auth.uid()::text = user_id::text);
  
CREATE POLICY "Users can delete own scores" ON public.scores
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS scores_user_id_idx ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS scores_created_at_idx ON public.scores(created_at DESC);
CREATE INDEX IF NOT EXISTS scores_song_difficulty_idx ON public.scores(song_name, difficulty);
