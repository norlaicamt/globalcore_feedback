-- =========================================================================
-- SCHEMA ALIGNMENT MIGRATION SCRIPT
-- Target: global_user (maps to Day 1 'users' architecture)
-- Compatibility: PostgreSQL / pgAdmin 4
-- Constraints: ONLY ALTER TABLE, ADD COLUMN, RENAME COLUMN, CREATE INDEX
-- Safety: Non-destructive. No DROP TABLE. No data loss.
-- =========================================================================

-- 1. Rename existing 'name' column to 'display_name' (Day 1 alignment)
-- Note: Existing index ix_global_user_name will automatically index the renamed column
-- but we will recreate a cleanly named index for consistency.
ALTER TABLE global_user RENAME COLUMN name TO display_name;

-- 2. Add missing architectural columns from the Day 1 schema
ALTER TABLE global_user ADD COLUMN IF NOT EXISTS global_id UUID;
ALTER TABLE global_user ADD COLUMN IF NOT EXISTS external_id VARCHAR;
ALTER TABLE global_user ADD COLUMN IF NOT EXISTS source VARCHAR;
ALTER TABLE global_user ADD COLUMN IF NOT EXISTS role_context VARCHAR;
ALTER TABLE global_user ADD COLUMN IF NOT EXISTS attributes JSONB;

-- 3. Create indexes for new columns to ensure lookup efficiency
CREATE INDEX IF NOT EXISTS ix_global_user_display_name ON global_user (display_name);
CREATE INDEX IF NOT EXISTS ix_global_user_global_id ON global_user (global_id);
CREATE INDEX IF NOT EXISTS ix_global_user_external_id ON global_user (external_id);
