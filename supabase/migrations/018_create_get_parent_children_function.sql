-- Migration 018: Create Security Definer Function for Parent Children
-- The parent_children_view may have RLS complications
-- This function bypasses RLS to get parent's children data efficiently

CREATE OR REPLACE FUNCTION public.get_parent_children(parent_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    parent_id UUID,
    team_id UUID,
    player_id UUID,
    player_name TEXT,
    squad_number INTEGER,
    "position" TEXT,
    date_of_birth DATE,
    privacy_settings JSONB,
    team_name TEXT,
    age_group TEXT,
    season TEXT,
    matches_played BIGINT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
AS $$
    SELECT
        tm.user_id AS parent_id,
        tm.team_id,
        p.id AS player_id,
        p.name AS player_name,
        p.squad_number,
        p."position",
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
    WHERE tm.user_id = COALESCE(parent_user_id, auth.uid())
    AND p.is_active = true
    AND t.is_active = true
    GROUP BY
        tm.user_id,
        tm.team_id,
        p.id,
        p.name,
        p.squad_number,
        p."position",
        p.date_of_birth,
        p.privacy_settings,
        t.name,
        t.age_group,
        t.season
    ORDER BY t.name, p.name;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_parent_children(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_parent_children IS
'Returns all children (players) linked to a parent user via team_members. Defaults to current user if no parent_user_id provided. Bypasses RLS for efficient querying.';
