-- Migration 015: Fix Matches Table RLS Infinite Recursion
-- The "Parents can view matches their children participated in" policy
-- creates infinite recursion because it joins match_players table,
-- which may have policies that reference matches.

-- Solution: Use a simpler approach that doesn't create circular dependencies

-- Drop the problematic policy
DROP POLICY IF EXISTS "Parents can view matches their children participated in" ON public.matches;

-- Create a new policy that avoids recursion by checking team_members directly
-- through a subquery that doesn't trigger other RLS policies
CREATE POLICY "Parents can view matches their children participated in"
    ON public.matches FOR SELECT
    USING (
        -- Parents can view matches if they have children in this team
        EXISTS (
            SELECT 1
            FROM public.team_members tm
            INNER JOIN public.players p ON p.id = tm.player_id
            WHERE p.team_id = matches.team_id
            AND tm.user_id = auth.uid()
            AND p.is_active = true
        )
    );

-- Alternative approach: Parents can view all matches for teams they're members of
-- This is simpler and doesn't create recursion
-- If the above still causes issues, uncomment this instead:

-- DROP POLICY IF EXISTS "Parents can view matches their children participated in" ON public.matches;
--
-- CREATE POLICY "Parents can view team matches if they have children in team"
--     ON public.matches FOR SELECT
--     USING (
--         team_id IN (
--             SELECT DISTINCT t.id
--             FROM public.teams t
--             INNER JOIN public.players p ON p.team_id = t.id
--             INNER JOIN public.team_members tm ON tm.player_id = p.id
--             WHERE tm.user_id = auth.uid()
--             AND p.is_active = true
--             AND t.is_active = true
--         )
--     );

COMMENT ON POLICY "Parents can view matches their children participated in" ON public.matches IS
'Allows parents to view matches for teams where their children play. Avoids recursion by not joining match_players.';
