-- Refresh the schema cache by recreating the foreign key relationship
ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_user_id_fkey;
ALTER TABLE public.scores ADD CONSTRAINT scores_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Refresh RLS policies
DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;
DROP POLICY IF EXISTS "Allow all operations on scores" ON public.scores;

CREATE POLICY "Allow all operations on users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all operations on scores" ON public.scores FOR ALL USING (true);

-- Analyze tables to update statistics
ANALYZE public.users;
ANALYZE public.scores;
