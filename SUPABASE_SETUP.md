# Supabase Setup Instructions

## Step 1: Get Your Credentials

After creating your Supabase project, get these values from the Supabase dashboard:

1. Go to **Project Settings** (gear icon)
2. Click **API** in the left menu
3. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`

## Step 2: Update Environment Variables

Update the `.env.local` file with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Run Database Migrations

You have two options to run the migrations:

### Option A: Using Supabase SQL Editor (Easiest)

1. Go to your Supabase dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste the contents of each migration file in order:
   - `supabase/migrations/001_create_profiles_table.sql`
   - `supabase/migrations/002_create_teams_table.sql`
   - `supabase/migrations/003_create_players_table.sql`
   - `supabase/migrations/004_create_team_members_table.sql`
   - `supabase/migrations/005_create_matches_table.sql`
   - `supabase/migrations/006_create_match_players_table.sql`
   - `supabase/migrations/007_create_period_tracking_table.sql`
   - `supabase/migrations/008_create_match_events_table.sql`
   - `supabase/migrations/009_fix_rls_infinite_recursion.sql`
   - `supabase/migrations/010_create_match_awards_table.sql`
   - `supabase/migrations/011_create_player_stats_view.sql`
5. Click **Run** for each migration

### Option B: Using Supabase CLI (Advanced)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Run migrations:
   ```bash
   supabase db push
   ```

## Step 4: Verify Setup

After running migrations, verify in Supabase dashboard:

1. Go to **Table Editor**
2. You should see 9 tables:
   - `profiles` - User profiles with roles
   - `teams` - Team information
   - `players` - Player rosters
   - `team_members` - Parent-player relationships
   - `matches` - Match schedules
   - `match_players` - Match participation
   - `period_tracking` - Match period timings
   - `match_events` - Match events (goals, assists, etc.)
   - `match_awards` - Player of the Match awards

3. Go to **Database** → **Views**
4. You should see 1 view:
   - `player_stats_view` - Aggregated player statistics

5. Go to **Authentication** → **Policies**
6. Verify RLS policies are active for all tables

## Step 5: Test Connection

Start the development server:

```bash
npm run dev
```

Visit http://localhost:3000 - the app should load without errors.

## Troubleshooting

### "Invalid API key" error
- Double-check your `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- Make sure there are no extra spaces or quotes
- Restart the dev server after changing `.env.local`

### "relation does not exist" error
- Migrations didn't run successfully
- Go back to Step 3 and run migrations again
- Check Supabase logs for errors

### RLS policy errors
- Make sure you ran ALL 4 migration files
- Policies are created at the end of each migration file
- Check **Authentication** → **Policies** in Supabase dashboard

## Next Steps

Once setup is complete, you can:
1. Register a new user (will auto-create profile)
2. Create teams (if you registered as Manager)
3. Add players to teams
4. Schedule matches
5. Log live match events
6. View statistics on the Stats tab

## Database Schema Overview

```
auth.users (Supabase managed)
    ↓
profiles (role: manager/parent, full_name, phone)
    ↓
teams (manager_id → profiles.id)
    ↓
players (team_id → teams.id)
    ↓
matches (team_id → teams.id, captain_id → players.id)
    ↓
├── match_players (match_id, player_id, is_captain)
├── period_tracking (match_id, period_number, timings)
├── match_events (match_id, player_id, event_type, time)
└── match_awards (match_id, player_id, award_type)

team_members (for parent access - Feature Slice 6)
    - user_id → profiles.id
    - team_id → teams.id
    - player_id → players.id (optional)

Views:
player_stats_view (aggregates from match_events)
    - Calculates goals, assists, tackles, saves
    - Player of the Match awards count
    - Captain appearances
```

## Feature Slices Completed

- ✅ **Slice 1**: Team & Player Management
- ✅ **Slice 2**: Match Setup & Scheduling
- ✅ **Slice 3**: Live Match Event Logging
- ✅ **Slice 4**: Match Completion & Rewards
- ✅ **Slice 5**: Player Statistics & Reports
- 🚧 **Slice 6**: Parent Access & Privacy (Coming Soon)
