-- Migration: Update event type icons from emojis to Lucide icon names
-- This updates the existing event types to use Lucide icon identifiers
-- instead of emojis for better design consistency

-- Update existing event type icons to Lucide names
UPDATE event_types SET icon = 'volleyball' WHERE name = 'goal';
UPDATE event_types SET icon = 'target' WHERE name = 'assist';
UPDATE event_types SET icon = 'shield' WHERE name = 'tackle';
UPDATE event_types SET icon = 'save' WHERE name = 'save';
UPDATE event_types SET icon = 'square' WHERE name = 'yellow_card';
UPDATE event_types SET icon = 'octagon' WHERE name = 'red_card';
UPDATE event_types SET icon = 'circle-arrow-up' WHERE name = 'substitution_on';
UPDATE event_types SET icon = 'circle-arrow-down' WHERE name = 'substitution_off';

-- Add comment to explain the icon field
COMMENT ON COLUMN event_types.icon IS 'Lucide icon name (e.g., trophy, target, shield). Visit https://lucide.dev/icons for available icons.';
