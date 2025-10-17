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
2. You should see 4 tables:
   - `profiles`
   - `teams`
   - `players`
   - `team_members`

3. Go to **Authentication** → **Policies**
4. Verify RLS policies are active for all tables

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

## Database Schema Overview

```
auth.users (Supabase managed)
    ↓
profiles (your data: role, full_name, phone)
    ↓
teams (manager_id → profiles.id)
    ↓
players (team_id → teams.id)

team_members (for parent access)
    - user_id → profiles.id
    - team_id → teams.id
    - player_id → players.id (optional)
```
