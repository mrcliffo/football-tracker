# Feature Slice 6 - Deployment Notes

## ✅ Issues Fixed

### 1. Parent Dashboard Server-Side Fetch Issue
**Problem**: The parent dashboard was trying to use `fetch()` in a server component, which caused issues.

**Solution**: Changed to query the database directly using the Supabase client:
```typescript
// Before (problematic):
const childrenResponse = await fetch('/api/parent/children', {...});

// After (fixed):
const { data: children } = await supabase
  .from('parent_children_view')
  .select('*')
  .eq('parent_id', user.id);
```

**File**: `app/(dashboard)/parent/dashboard/page.tsx`

### 2. Missing RPC Function for Email Lookup
**Problem**: The parent linking API was trying to call a non-existent `get_user_by_email` RPC function.

**Solution**: Created Migration 013 with a secure RPC function `find_user_by_email` that:
- Only allows managers to call it (security definer with role check)
- Searches for users by email in the auth.users table
- Returns only parent role users
- Returns user_id, user_role, and user_full_name

**Files**:
- `/supabase/migrations/013_create_user_lookup_function.sql` (NEW)
- `/app/api/teams/[teamId]/players/[playerId]/parents/route.ts` (FIXED)

## 🚀 Required Deployment Steps

### Step 1: Run Migration 012 (Parent Access RLS)
```sql
-- In Supabase SQL Editor, run:
-- /supabase/migrations/012_enable_parent_access.sql
```

This migration:
- Adds `privacy_settings` column to `players` table
- Creates `parent_children_view` database view
- Updates RLS policies for parent access (7 new policies)

### Step 2: Run Migration 013 (Email Lookup Function)
```sql
-- In Supabase SQL Editor, run:
-- /supabase/migrations/013_create_user_lookup_function.sql
```

This migration:
- Creates `find_user_by_email()` RPC function
- Grants execute permission to authenticated users
- Adds security checks (manager-only access)

### Step 3: Run Migration 014 (Fix RLS Recursion)
```sql
-- In Supabase SQL Editor, run:
-- /supabase/migrations/014_fix_teams_rls_recursion.sql
```

This migration:
- Fixes infinite recursion error in teams table RLS
- Removes redundant policy that conflicts with existing policy
- **IMPORTANT**: Run this if you already ran migration 012 and have the recursion error

**Note**: If you haven't run migration 012 yet, it has been updated to NOT create the problematic policy, so you won't need migration 014.

### Step 4: Verify Database Changes

Check that these exist:
```sql
-- Verify column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'players'
AND column_name = 'privacy_settings';

-- Verify view exists
SELECT * FROM parent_children_view LIMIT 1;

-- Verify function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'find_user_by_email';
```

### Step 4: Test the Application

#### Test as Manager:
1. Login as a manager
2. Navigate to a team
3. Click "Manage Parents" on a player
4. Try to link a parent (need parent email)
5. Verify parent appears in the list
6. Try to remove a parent link

#### Test as Parent:
1. Register a new account with role = 'parent'
2. Have manager link you to a player
3. Login as parent
4. Verify you see "My Children" in navigation
5. Click on the parent dashboard
6. Verify you see your linked child(ren)
7. Click on a child
8. Verify stats and matches display

## 📋 Database Schema Updates

### New Columns
- `players.privacy_settings` (JSONB)
  - Default: `{"show_stats_to_parents": true, "show_match_history": true, "show_awards": true}`

### New Database Views
- `parent_children_view`
  - Efficient query for parent dashboard
  - Combines team_members, players, teams
  - Includes match count aggregation

### New RPC Functions
- `find_user_by_email(search_email TEXT)`
  - Security definer function
  - Manager-only access
  - Returns user_id, user_role, user_full_name

### New RLS Policies (Migration 012)
1. "Parents can view their children" (players table)
2. "Parents can view matches their children participated in" (matches table)
3. "Parents can view their children's match participation" (match_players table)
4. "Parents can view their children's match events" (match_events table)
5. "Parents can view their children's awards" (match_awards table)
6. "Parents can view period tracking for their children's matches" (period_tracking table)

**Note**: No new policy needed for teams table - existing policy already handles parent access through team_members.

## 🔧 Configuration

### Environment Variables
No new environment variables required.

### Supabase Dashboard Settings
Ensure RLS is enabled on all tables (should already be enabled from previous slices).

## ⚠️ Known Limitations

### Current State
- ✅ App loads correctly
- ✅ Parent dashboard works
- ✅ Parent linking API fixed
- ⚠️ **Migrations NOT yet run** - Need to run in Supabase

### Until Migrations Are Run:
- Managers cannot link parents (will get RPC function not found error)
- Parents cannot view dashboard (view doesn't exist)
- Privacy settings column doesn't exist

### Future Enhancements Needed:
- [ ] Email notifications when parent is linked
- [ ] Invitation system (invite before registration)
- [ ] Privacy settings UI for managers
- [ ] Better error messages
- [ ] Parent account management

## 🐛 Troubleshooting

### Error: "infinite recursion detected in policy for relation 'teams'"
**Solution**: Run Migration 014 to remove the redundant policy
- If you haven't run migration 012 yet, use the updated version (it won't create the problematic policy)
- If you already ran migration 012, run migration 014 to fix it

### Error: "relation 'parent_children_view' does not exist"
**Solution**: Run Migration 012

### Error: "function find_user_by_email(text) does not exist"
**Solution**: Run Migration 013

### Error: "column 'privacy_settings' does not exist"
**Solution**: Run Migration 012

### Parent can't see any children
**Checklist**:
1. Verify parent is logged in
2. Verify parent role is 'parent' (check profiles table)
3. Verify team_members entry exists linking user_id to player_id
4. Verify Migration 012 RLS policies are active
5. Check browser console for errors

### Manager can't link parent
**Checklist**:
1. Verify Migration 013 is run (RPC function exists)
2. Verify parent has registered with correct email
3. Verify parent role is 'parent' (not 'manager')
4. Check API response in Network tab
5. Verify manager has permission on the team

## 📝 Testing Checklist

Before marking Slice 6 as production-ready:

### Database Tests
- [ ] Migration 012 runs successfully
- [ ] Migration 013 runs successfully
- [ ] All RLS policies created
- [ ] parent_children_view returns data
- [ ] find_user_by_email function works

### Manager Workflow Tests
- [ ] Can open Manage Parents dialog
- [ ] Can search for parent by email
- [ ] Can link parent to player
- [ ] Can see list of linked parents
- [ ] Can remove parent link
- [ ] Cannot link non-existent email
- [ ] Cannot link non-parent role

### Parent Workflow Tests
- [ ] Parent sees "My Children" navigation
- [ ] Parent dashboard loads
- [ ] Children cards display correctly
- [ ] Can click through to child detail
- [ ] Stats display correctly
- [ ] Match history displays correctly
- [ ] Captain badges show
- [ ] POTM badges show
- [ ] Cannot access unlinked players (404)

### Security Tests
- [ ] Parent can only see their children
- [ ] Parent cannot modify data (read-only)
- [ ] Manager can only link to their team's players
- [ ] RLS policies prevent unauthorized access
- [ ] Privacy settings are respected

## 📊 Performance Considerations

### Database Query Optimization
- `parent_children_view` uses indexed columns (user_id, team_id, player_id)
- GIN index on `privacy_settings` column for efficient JSON queries
- RLS policies use indexed foreign keys

### Recommended Monitoring
- Monitor `find_user_by_email` function execution time
- Monitor `parent_children_view` query performance
- Watch for N+1 queries in match history fetching

## 🎯 Next Steps

1. **Immediate**: Run both migrations in Supabase
2. **Testing**: Complete testing checklist above
3. **Documentation**: Update user guide for parents and managers
4. **Optional**: Add privacy settings UI
5. **Optional**: Implement invitation system
6. **Optional**: Add email notifications

## 📞 Support

If you encounter issues:
1. Check the error in browser console
2. Check Supabase logs
3. Verify migrations are run
4. Check RLS policies are active
5. Review API responses in Network tab

---

**Status**: ✅ Code Complete, ⚠️ Migrations Pending
**Last Updated**: October 2025
**Version**: Feature Slice 6
