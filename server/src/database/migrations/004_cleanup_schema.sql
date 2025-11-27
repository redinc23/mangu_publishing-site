-- ===================================================================
-- Migration 004: Schema Cleanup
-- Description: Clean up schema inconsistencies and add missing columns
-- ===================================================================

-- Drop genres table if it exists (we use categories instead)
DROP TABLE IF EXISTS genres CASCADE;

-- Ensure authors table has all needed columns
-- Add user_id column to link authors to user accounts
ALTER TABLE authors
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Ensure is_verified column exists (it should already exist from init.sql)
-- This is idempotent - safe to run multiple times
ALTER TABLE authors
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Ensure social_links column exists (it should already exist from init.sql)
-- This is idempotent - safe to run multiple times
ALTER TABLE authors
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Create index on user_id for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_authors_user_id ON authors(user_id);

-- Add comment to document the user_id column
COMMENT ON COLUMN authors.user_id IS 'Links author profile to a user account if the author is also a platform user';

-- Verify no duplicate table definitions exist
-- (This migration is idempotent - safe to run multiple times)

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 004 completed successfully: Schema cleanup done';
END $$;
