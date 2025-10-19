# Fix RLS Infinite Recursion Error

## Problem Identified

The infinite recursion error occurs due to a circular dependency between RLS policies:

1. **teams** table SELECT policy checks **team_members** table
2. **team_members** table SELECT policy checks **teams** table
3. This creates: teams → team_members → teams → team_members → ∞

## Solution

Apply the migration file `supabase/migrations/009_fix_rls_infinite_recursion.sql` to your Supabase database.

## How to Apply the Fix

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/009_fix_rls_infinite_recursion.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute the migration

### Option 2: Install Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

## What the Fix Does

1. **Drops problematic policies** that create circular dependencies
2. **Recreates teams SELECT policy** - simplified to only check direct ownership (manager_id = auth.uid())
3. **Recreates team_members SELECT policy** - uses a subquery that doesn't create circular dependency

## After Applying the Fix

1. Restart your Next.js dev server (if needed):
   ```bash
   npm run dev
   ```

2. Test the following operations:
   - View teams list
   - Create a new team
   - View team details
   - The infinite recursion error should be gone

## Notes

- The simplified policy means parents won't automatically see teams through team_members in this version
- This is intentional to break the circular dependency
- Parent access to teams can be implemented later in Feature Slice 6 using a different approach (e.g., database functions or separate views)
- For now, managers have full access to their teams, which is sufficient for Feature Slices 1-4

## Verification

After applying the fix, you should no longer see this error in your console:
```
Error: infinite recursion detected in policy for relation "teams"
```
