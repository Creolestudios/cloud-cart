-- ============================================================
-- PostgreSQL Init Script
-- Creates required extensions and initial schema
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Create schema
CREATE SCHEMA IF NOT EXISTS cloudcart;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA cloudcart TO cloudcart;

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'CloudCart PostgreSQL database initialized successfully';
END $$;
