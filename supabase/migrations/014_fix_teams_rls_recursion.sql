-- Migration 014: Fix Teams Table RLS Infinite Recursion
-- The "Parents can view teams their children belong to" policy from migration 012
-- conflicts with the existing "Managers can view their own teams" policy
-- because both reference team_members, causing infinite recursion.

-- The original policy already allows parents to view teams through team_members,
-- so the new policy is redundant and causes the conflict.

-- Drop the redundant policy added in migration 012
DROP POLICY IF EXISTS "Parents can view teams their children belong to" ON public.teams;

-- The existing "Managers can view their own teams" policy already handles parent access:
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
-- This policy already allows anyone in team_members to view the team,
-- including parents linked via player_id.

COMMENT ON TABLE public.teams IS
'Teams table with RLS. Managers can view their own teams. Parents can view teams they are linked to via team_members (handled by existing SELECT policy).';
