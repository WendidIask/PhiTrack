-- Add password_hash column to existing users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Update the column to be NOT NULL after adding it
-- First, set a default value for existing users (if any)
UPDATE public.users SET password_hash = 'temp_hash_needs_reset' WHERE password_hash IS NULL;

-- Now make it NOT NULL
ALTER TABLE public.users ALTER COLUMN password_hash SET NOT NULL;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
