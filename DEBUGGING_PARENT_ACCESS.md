# Debugging Parent Access Issue

## Problem
Parent account shows "Unknown" for linked parent names, and parent dashboard shows no children assigned.

## Current Status
- ✅ team_members record exists with correct data
- ✅ All RLS policies created
- ❓ View or query not returning data correctly for parent user

## Diagnostic Steps

### Step 1: Run Migrations
Make sure all migrations are applied in Supabase:

```bash
# In Supabase SQL Editor, run these migrations in order:
1. 012_enable_parent_access_FIXED.sql
2. 013_create_user_lookup_function.sql
3. 014_fix_teams_rls_recursion.sql
4. 015_fix_matches_rls_recursion.sql
5. 016_allow_managers_to_view_parent_profiles.sql
6. 017_fix_parent_children_view.sql (optional)
```

### Step 2: Access Debug Page
1. Log in as the **parent user** (not the manager)
2. Visit: `http://localhost:3001/parent/debug`
3. Review all 7 test sections to see which queries succeed/fail

### Step 3: Interpret Results

**Test 3 (Team Members)**: Should show at least 1 record
- ✅ If data shows: Parent can query team_members ✓
- ❌ If no data: RLS policy on team_members is broken

**Test 4 (Players)**: Should show the linked player(s)
- ✅ If data shows: Parent can see players via RLS policy ✓
- ❌ If no data: "Parents can view their children" policy not working

**Test 5 (Teams)**: Should show the team(s)
- ✅ If data shows: Parent can see teams ✓
- ❌ If no data: Team RLS policy not allowing parent access

**Test 6 (Parent Children View)**: Should show children with full data
- ✅ If data shows: Everything works! ✓
- ❌ If no data: View is being blocked by underlying RLS

**Test 7 (Raw Query with Joins)**: Alternative approach
- This tests if Supabase's join syntax works with RLS

### Step 4: Fix Based on Results

#### If Test 3 fails (no team_members)
The policy "Users can view their own team memberships" is not working.
Check that RLS is enabled and policy exists.

#### If Test 4 fails (no players)
The policy "Parents can view their children" is not working.
Run this query in SQL Editor while logged as parent:
```sql
SELECT * FROM players
WHERE EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.player_id = players.id
    AND team_members.user_id = auth.uid()
);
```

#### If Test 6 fails (view returns no data)
The view might need to be a SECURITY DEFINER function instead.
We may need to create an RPC function that bypasses RLS.

## Alternative Solution: RPC Function

If the view doesn't work due to RLS complications, we can create a security definer function:

```sql
CREATE OR REPLACE FUNCTION get_parent_children(parent_user_id UUID)
RETURNS TABLE (
    parent_id UUID,
    team_id UUID,
    player_id UUID,
    player_name TEXT,
    squad_number INTEGER,
    position TEXT,
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
    WHERE tm.user_id = parent_user_id
    AND p.is_active = true
    AND t.is_active = true
    GROUP BY
        tm.user_id, tm.team_id, p.id, p.name,
        p.squad_number, p.position, p.date_of_birth,
        p.privacy_settings, t.name, t.age_group, t.season;
$$;
```

Then update parent dashboard to use:
```typescript
const { data: children } = await supabase
  .rpc('get_parent_children', { parent_user_id: user.id });
```

## Files Created for Debugging
- `/app/(dashboard)/parent/debug/page.tsx` - Debug UI page
- `/DEBUG_PARENT_VIEW.sql` - SQL queries to run manually
- `/DIAGNOSTIC_QUERY.sql` - General RLS diagnostics

## Expected Outcome
After running all migrations and testing, the parent dashboard should show linked children with their team info and match counts.
