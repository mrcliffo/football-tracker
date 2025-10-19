-- Create event_types table for managing event types (with IF NOT EXISTS checks)
CREATE TABLE IF NOT EXISTS event_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_event_types_name') THEN
    CREATE INDEX idx_event_types_name ON event_types(name);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_event_types_active') THEN
    CREATE INDEX idx_event_types_active ON event_types(is_active);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Anyone can view event types" ON event_types;
DROP POLICY IF EXISTS "Only managers can create event types" ON event_types;
DROP POLICY IF EXISTS "Only managers can update event types" ON event_types;
DROP POLICY IF EXISTS "Only managers can delete event types" ON event_types;

-- Allow all authenticated users to read event types
CREATE POLICY "Anyone can view event types"
  ON event_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Only managers can insert event types
CREATE POLICY "Only managers can create event types"
  ON event_types
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Only managers can update event types
CREATE POLICY "Only managers can update event types"
  ON event_types
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Only managers can delete event types
CREATE POLICY "Only managers can delete event types"
  ON event_types
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_event_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS event_types_updated_at ON event_types;

-- Create trigger
CREATE TRIGGER event_types_updated_at
  BEFORE UPDATE ON event_types
  FOR EACH ROW
  EXECUTE FUNCTION update_event_types_updated_at();

-- Insert default event types (only if they don't exist)
INSERT INTO event_types (name, display_name, description, icon, is_active) VALUES
  ('goal', 'Goal', 'A goal scored by the player', '⚽', true),
  ('assist', 'Assist', 'An assist made by the player', '🎯', true),
  ('tackle', 'Tackle', 'A successful tackle made by the player', '🛡️', true),
  ('save', 'Save', 'A save made by the goalkeeper', '🧤', true),
  ('yellow_card', 'Yellow Card', 'A yellow card received by the player', '🟨', true),
  ('red_card', 'Red Card', 'A red card received by the player', '🟥', true),
  ('substitution_on', 'Substitution On', 'Player enters the game', '🔼', true),
  ('substitution_off', 'Substitution Off', 'Player leaves the game', '🔽', true)
ON CONFLICT (name) DO NOTHING;

-- Add comment
COMMENT ON TABLE event_types IS 'Configurable event types that can be logged during matches';
