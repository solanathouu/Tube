-- Tube App - Initial Schema Migration
-- This migration creates the database structure to replace Firebase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geo data (coordinates)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,

  -- Stats
  total_reports INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  total_thanks_received INTEGER DEFAULT 0,
  total_work_sessions INTEGER DEFAULT 0,
  total_work_minutes INTEGER DEFAULT 0,

  -- Preferences
  favorite_lines TEXT[] DEFAULT '{}',
  profile_picture TEXT,

  -- Badges
  badges TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster username lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_xp ON users(xp DESC);

-- ============================================
-- REPORTS TABLE
-- ============================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Report details
  type TEXT NOT NULL,
  station_id TEXT NOT NULL,
  station_name TEXT NOT NULL,
  line TEXT NOT NULL,
  coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
  comment TEXT,

  -- Author
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_username TEXT NOT NULL,
  author_level INTEGER NOT NULL,
  author_xp INTEGER NOT NULL,

  -- Votes (arrays of user IDs)
  votes_present UUID[] DEFAULT '{}',
  votes_absent UUID[] DEFAULT '{}',

  -- Thanks (array of user IDs)
  thanks UUID[] DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_expires_at ON reports(expires_at);
CREATE INDEX idx_reports_author_id ON reports(author_id);
CREATE INDEX idx_reports_line ON reports(line);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_coordinates ON reports USING GIST(coordinates);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can read all user profiles
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (for registration)
CREATE POLICY "Users can create own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Reports table policies
-- Anyone authenticated can read all reports
CREATE POLICY "Anyone can view reports"
  ON reports FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Authenticated users can create reports
CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

-- Users can update any report (for voting and thanks)
CREATE POLICY "Users can update reports for voting"
  ON reports FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Users can only delete their own reports
CREATE POLICY "Users can delete own reports"
  ON reports FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for reports table
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire old reports
CREATE OR REPLACE FUNCTION expire_old_reports()
RETURNS void AS $$
BEGIN
  UPDATE reports
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL DATA (Optional)
-- ============================================

-- You can add initial data here if needed
-- For example, default badges configuration, etc.

COMMENT ON TABLE users IS 'Stores user profiles and statistics';
COMMENT ON TABLE reports IS 'Stores metro incident reports with geolocation';
COMMENT ON COLUMN reports.coordinates IS 'Stored as PostGIS GEOGRAPHY for accurate distance calculations';
COMMENT ON COLUMN reports.votes_present IS 'Array of user IDs who voted "present" (incident still there)';
COMMENT ON COLUMN reports.votes_absent IS 'Array of user IDs who voted "absent" (incident resolved)';
