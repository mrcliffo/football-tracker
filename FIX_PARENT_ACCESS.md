# Fix Parent Access - Action Plan

## Problem Summary
Parent dashboard shows no children, and parent names appear as "Unknown" in the manager's view.

## Root Cause
The `parent_children_view` database view is subject to RLS policies on its underlying tables. When a parent user queries the view, the RLS policies may be preventing access even though the policies look correct on paper.

## Solution
Created a **SECURITY DEFINER** RPC function `get_parent_children()` that bypasses RLS to efficiently retrieve parent-child relationships.

## Steps to Fix

### 1. Run These Migrations in Supabase SQL Editor

Run in this exact order:

```sql
-- Migration 016: Allow managers to see parent profiles
-- (Fixes "Unknown" parent names in manager view)
-- File: supabase/migrations/016_allow_managers_to_view_parent_profiles.sql
```

```sql
-- Migration 018: Create RPC function for parent children
-- (Fixes parent dashboard showing no children)
-- File: supabase/migrations/018_create_get_parent_children_function.sql
```

### 2. Test the Fix

#### As Manager:
1. Go to your team page
2. Click "Manage Parents" on a player
3. The parent name should now display correctly (not "Unknown")

#### As Parent:
1. Log in with the parent account
2. Go to `/parent/dashboard`
3. You should see your linked children

#### Debug Page:
1. Log in as parent
2. Visit `/parent/debug`
3. Check Test #8 (RPC Function) - should show children data

### 3. Verify the Data

Run this query in Supabase SQL Editor while logged in as the parent:

```sql
SELECT * FROM get_parent_children();
```

Should return rows with player data.

## Files Changed

### Migrations Created:
- `016_allow_managers_to_view_parent_profiles.sql` - Fixes "Unknown" parent names
- `017_fix_parent_children_view.sql` - Recreates view (optional)
- `018_create_get_parent_children_function.sql` - **Main fix** - RPC function

### Code Updated:
- `app/(dashboard)/parent/dashboard/page.tsx` - Changed from view query to RPC call
- `app/(dashboard)/parent/debug/page.tsx` - Added RPC function test

### Documentation:
- `DEBUGGING_PARENT_ACCESS.md` - Full debugging guide
- `DEBUG_PARENT_VIEW.sql` - SQL debugging queries
- `FIX_PARENT_ACCESS.md` - This file

## Technical Details

### The RPC Function

```sql
CREATE OR REPLACE FUNCTION public.get_parent_children(parent_user_id UUID DEFAULT NULL)
RETURNS TABLE (...)
SECURITY DEFINER  -- This bypasses RLS
```

Key points:
- **SECURITY DEFINER**: Executes with function owner's privileges, bypassing RLS
- **Defaults to current user**: If no `parent_user_id` provided, uses `auth.uid()`
- **Efficient**: Single query with LEFT JOIN for match counts
- **Secure**: Still filters by `team_members.user_id` to ensure parents only see their own children

### Why the View Didn't Work

The `parent_children_view` uses `security_barrier = true`, which enforces RLS on all underlying tables:
- `team_members` ✓ (has policy for parents)
- `players` ✓ (has policy for parents)
- `teams` ✓ (has policy for parents)
- `match_players` ✓ (has policy for parents)

However, when combining all these policies in a single view with GROUP BY and aggregations, PostgreSQL's RLS can become overly restrictive or create performance issues.

The SECURITY DEFINER function solves this by:
1. Executing with elevated privileges
2. Still validating access via `team_members.user_id = parent_user_id`
3. Returning only the data the parent is authorized to see

## Expected Result

After running migrations 016 and 018:

✅ **Manager View**: Parent names display correctly in "Linked Parents" list
✅ **Parent Dashboard**: Shows all linked children with team info and match counts
✅ **Parent Child Detail**: Full statistics and match history visible
✅ **Security**: Parents can only see their own linked children

## Rollback Plan

If issues arise, you can revert to the view approach:

```typescript
// In parent/dashboard/page.tsx, change back to:
const { data: children } = await supabase
  .from('parent_children_view')
  .select('*')
  .eq('parent_id', user.id);
```

But this is unlikely to be necessary.
