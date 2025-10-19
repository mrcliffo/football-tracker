-- Migration 016: Allow Managers to View Parent Profiles
-- Managers need to see parent profiles when they link parents to players
-- This is necessary for the ManageParentsDialog to show parent names

-- Add policy for managers to view parent profiles for their teams
DROP POLICY IF EXISTS "Managers can view parent profiles in their teams" ON public.profiles;

CREATE POLICY "Managers can view parent profiles in their teams"
    ON public.profiles FOR SELECT
    USING (
        -- Allow if viewing a parent who is linked to a team the manager manages
        role = 'parent' AND
        EXISTS (
            SELECT 1
            FROM public.team_members tm
            INNER JOIN public.teams t ON t.id = tm.team_id
            WHERE tm.user_id = profiles.id
            AND t.manager_id = auth.uid()
        )
    );

COMMENT ON POLICY "Managers can view parent profiles in their teams" ON public.profiles IS
'Allows managers to view the profiles of parents who are linked to players in their teams. This enables the ManageParentsDialog to display parent names correctly.';
