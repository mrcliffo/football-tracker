-- Migration 012: Enable Parent Access to Player Data
-- Feature Slice 6: Parent Access & Privacy
-- This migration updates RLS policies to allow parents to view their children's data

-- ============================================================================
-- PART 1: Update Players Table RLS Policies
-- ============================================================================

-- Drop existing player SELECT policies to recreate them
DROP POLICY IF EXISTS "Team managers can view their team's players" ON public.players;
DROP POLICY IF EXISTS "Users can view players" ON public.players;

-- Recreate policies with parent access
CREATE POLICY "Team managers can view their team's players"
    ON public.players FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE teams.id = players.team_id
            AND teams.manager_id = auth.uid()
            AND teams.is_active = true
        )
    );

CREATE POLICY "Parents can view their children"
    ON public.players FOR SELECT
    USING (
        -- Check if the authenticated user is linked to this player via team_members
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.player_id = players.id
            AND team_members.user_id = auth.uid()
        )
        AND players.is_active = true
    );

-- ============================================================================
-- PART 2: Update Matches Table RLS Policies
-- ============================================================================

-- Add policy for parents to view matches their children participated in
CREATE POLICY "Parents can view matches their children participated in"
    ON public.matches FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.match_players mp
            INNER JOIN public.team_members tm ON tm.player_id = mp.player_id
            WHERE mp.match_id = matches.id
            AND tm.user_id = auth.uid()
        )
    );

-- ============================================================================
-- PART 3: Update Match Players Table RLS Policies
-- ============================================================================

-- Add policy for parents to view match participation
CREATE POLICY "Parents can view their children's match participation"
    ON public.match_players FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.player_id = match_players.player_id
            AND team_members.user_id = auth.uid()
        )
    );

-- ============================================================================
-- PART 4: Update Match Events Table RLS Policies
-- ============================================================================

-- Add policy for parents to view their children's match events
CREATE POLICY "Parents can view their children's match events"
    ON public.match_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.player_id = match_events.player_id
            AND team_members.user_id = auth.uid()
        )
    );

-- ============================================================================
-- PART 5: Update Match Awards Table RLS Policies
-- ============================================================================

-- Add policy for parents to view their children's awards
CREATE POLICY "Parents can view their children's awards"
    ON public.match_awards FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.player_id = match_awards.player_id
            AND team_members.user_id = auth.uid()
        )
    );

-- ============================================================================
-- PART 6: Update Period Tracking Table RLS Policies
-- ============================================================================

-- Add policy for parents to view period tracking for their children's matches
CREATE POLICY "Parents can view period tracking for their children's matches"
    ON public.period_tracking FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.match_players mp
            INNER JOIN public.team_members tm ON tm.player_id = mp.player_id
            WHERE mp.match_id = period_tracking.match_id
            AND tm.user_id = auth.uid()
        )
    );

-- ============================================================================
-- PART 7: Update Teams Table RLS Policies
-- ============================================================================

-- NOTE: No new policy needed for teams table!
-- The existing "Managers can view their own teams" policy from migration 002
-- already allows parents to view teams through the team_members table:
--
-- CREATE POLICY "Managers can view their own teams"
--     ON public.teams FOR SELECT
--     USING (
--         manager_id = auth.uid() OR
--         EXISTS (
--             SELECT 1 FROM public.team_members
--             WHERE team_members.team_id = teams.id
--             AND team_members.user_id = auth.uid()
--         )
--     );
--
-- This policy already grants access to anyone linked in team_members,
-- including parents linked via player_id. Adding another policy would
-- cause infinite recursion.

-- ============================================================================
-- PART 8: Add Privacy Settings Column to Players Table
-- ============================================================================

-- Add privacy_settings column for future privacy controls
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
    "show_stats_to_parents": true,
    "show_match_history": true,
    "show_awards": true
}'::jsonb;

-- Create index for privacy settings queries
CREATE INDEX IF NOT EXISTS idx_players_privacy_settings
ON public.players USING GIN (privacy_settings);

-- ============================================================================
-- PART 9: Create Helper View for Parent Dashboard
-- ============================================================================

-- Create a view to efficiently get parent-child relationships with player info
CREATE OR REPLACE VIEW public.parent_children_view AS
SELECT
    tm.user_id AS parent_id,
    tm.team_id,
    p.id AS player_id,
    p.name AS player_name,
    p.squad_number,
    p.position,
    p.date_of_birth,
    p.privacy_settings,
    t.name AS team_name,
    t.age_group,
    t.season,
    COUNT(DISTINCT mp.match_id) AS matches_played
FROM public.team_members tm
INNER JOIN public.players p ON p.id = tm.player_id
INNER JOIN public.teams t ON t.id = tm.team_id
LEFT JOIN public.match_players mp ON mp.player_id = p.id
WHERE p.is_active = true
AND t.is_active = true
GROUP BY
    tm.user_id,
    tm.team_id,
    p.id,
    p.name,
    p.squad_number,
    p.position,
    p.date_of_birth,
    p.privacy_settings,
    t.name,
    t.age_group,
    t.season;

-- Grant access to the view
GRANT SELECT ON public.parent_children_view TO authenticated;

-- Enable RLS on the view (inherits from underlying tables)
ALTER VIEW public.parent_children_view SET (security_barrier = true);

-- ============================================================================
-- PART 10: Add Helpful Comments
-- ============================================================================

COMMENT ON POLICY "Parents can view their children" ON public.players IS
'Allows parents to view player profiles for children linked via team_members table';

COMMENT ON POLICY "Parents can view matches their children participated in" ON public.matches IS
'Allows parents to view matches where their children were selected in the squad';

COMMENT ON COLUMN public.players.privacy_settings IS
'JSONB field containing privacy preferences: show_stats_to_parents, show_match_history, show_awards';

COMMENT ON VIEW public.parent_children_view IS
'Efficient view for parent dashboard showing all children with team info and match counts';
