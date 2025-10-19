-- Debug Parent View Access
-- Run these queries in Supabase SQL Editor when logged in as the parent user

-- Step 1: Check if parent can see team_members records
SELECT
    tm.id,
    tm.user_id,
    tm.player_id,
    tm.team_id,
    tm.created_at
FROM public.team_members tm
WHERE tm.user_id = auth.uid();

-- Step 2: Check if parent can see their linked players
SELECT
    p.id,
    p.name,
    p.squad_number,
    p.position,
    p.team_id
FROM public.players p
WHERE EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.player_id = p.id
    AND tm.user_id = auth.uid()
);

-- Step 3: Check if parent can see teams
SELECT
    t.id,
    t.name,
    t.age_group,
    t.season
FROM public.teams t
WHERE EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = t.id
    AND tm.user_id = auth.uid()
);

-- Step 4: Try to query the view
SELECT * FROM public.parent_children_view
WHERE parent_id = auth.uid();

-- Step 5: Check current user
SELECT auth.uid() as my_user_id;

-- Step 6: Manual reconstruction of view query
SELECT
    tm.user_id AS parent_id,
    tm.team_id,
    p.id AS player_id,
    p.name AS player_name,
    p.squad_number,
    p.position,
    t.name AS team_name,
    t.age_group,
    t.season,
    COUNT(DISTINCT mp.match_id) AS matches_played
FROM public.team_members tm
INNER JOIN public.players p ON p.id = tm.player_id
INNER JOIN public.teams t ON t.id = tm.team_id
LEFT JOIN public.match_players mp ON mp.player_id = p.id
WHERE tm.user_id = auth.uid()
AND p.is_active = true
AND t.is_active = true
GROUP BY
    tm.user_id,
    tm.team_id,
    p.id,
    p.name,
    p.squad_number,
    p.position,
    t.name,
    t.age_group,
    t.season;
