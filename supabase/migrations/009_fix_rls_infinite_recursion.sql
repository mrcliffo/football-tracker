-- Fix infinite recursion in RLS policies
-- The issue: teams SELECT policy checks team_members, and team_members SELECT policy checks teams
-- This creates a circular dependency causing infinite recursion

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Managers can view their own teams" ON public.teams;
DROP POLICY IF EXISTS "Team managers can view team members" ON public.team_members;

-- Step 2: Create simplified teams SELECT policy (no circular dependency)
-- Managers can view their own teams OR parents can view teams they're members of
CREATE POLICY "Managers can view their own teams"
    ON public.teams FOR SELECT
    USING (manager_id = auth.uid());

-- Step 3: Create a separate policy for parent access to teams (if needed later)
-- For now, we'll keep it simple and only allow managers to see their teams
-- Parents will access team data through the team_members relationship directly

-- Step 4: Recreate team_members SELECT policies without circular dependency
CREATE POLICY "Team managers can view team members"
    ON public.team_members FOR SELECT
    USING (
        -- Check if user is the manager by querying teams directly
        -- This is safe because the teams policy above doesn't reference team_members
        team_id IN (
            SELECT id FROM public.teams
            WHERE manager_id = auth.uid()
        )
    );

-- Step 5: Add policy for parents to view their own memberships (already exists, but ensure it's there)
-- This policy is already in place from migration 004, so we don't need to recreate it

-- Optional: If we want parents to see teams they're members of, we can add this later
-- after the circular dependency is resolved. For now, keeping it simple.

COMMENT ON POLICY "Managers can view their own teams" ON public.teams
IS 'Allows managers to view only the teams they manage. No circular dependency with team_members.';

COMMENT ON POLICY "Team managers can view team members" ON public.team_members
IS 'Allows team managers to view members of their teams. Uses subquery to avoid circular dependency.';
