-- Add username column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;

-- Create unique index on username (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx ON public.users (username);

-- Update existing users to have usernames based on their names (temporary)
UPDATE public.users 
SET username = REPLACE(name, ' ', '_') 
WHERE username IS NULL;

-- Make username NOT NULL after setting values
ALTER TABLE public.users ALTER COLUMN username SET NOT NULL;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS users_username_idx ON public.users(username);
