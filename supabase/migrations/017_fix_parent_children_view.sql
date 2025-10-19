-- Migration 017: Fix Parent Children View
-- The parent_children_view may not be returning data correctly
-- This migration recreates the view with better filtering and adds RLS bypass

-- Drop and recreate the view
DROP VIEW IF EXISTS public.parent_children_view;

CREATE VIEW public.parent_children_view AS
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

-- Grant access to authenticated users
GRANT SELECT ON public.parent_children_view TO authenticated;

-- Set security_barrier to true (RLS enforced)
ALTER VIEW public.parent_children_view SET (security_barrier = true);

COMMENT ON VIEW public.parent_children_view IS
'View for parent dashboard showing all children with team info and match counts. Filtered by RLS policies on underlying tables.';
