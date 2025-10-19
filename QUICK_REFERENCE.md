# Football Tracker - Quick Reference Guide

Quick reference for common tasks and workflows.

## Table of Contents
- [Database Migrations](#database-migrations)
- [User Workflows](#user-workflows)
- [API Endpoints](#api-endpoints-quick-reference)
- [Component Usage](#component-usage)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## Database Migrations

### Apply All Migrations (New Setup)
```sql
-- Run in Supabase SQL Editor in order:
001_create_profiles_table.sql
002_create_teams_table.sql
003_create_players_table.sql
004_create_team_members_table.sql
005_create_matches_table.sql
006_create_match_players_table.sql
007_create_period_tracking_table.sql
008_create_match_events_table.sql
009_fix_rls_infinite_recursion.sql
010_create_match_awards_table.sql
011_create_player_stats_view.sql
012_enable_parent_access_FIXED.sql
013_create_user_lookup_function.sql
014_fix_teams_rls_recursion.sql
015_fix_matches_rls_recursion.sql
016_allow_managers_to_view_parent_profiles.sql
017_fix_parent_children_view.sql (optional)
018_create_get_parent_children_function.sql
```

### Verify Migrations
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check view exists
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

---

## User Workflows

### Manager Workflow

#### 1. Create a Team
1. Navigate to `/teams`
2. Click "Create Team"
3. Enter team name, age group, season
4. Submit

#### 2. Edit a Team
1. Navigate to team detail page
2. Click "Edit" button (next to team name)
3. Update team name, age group, or season
4. Submit changes

#### 3. Delete a Team
1. Navigate to team detail page
2. Click "Delete" button (next to Edit button)
3. Confirm deletion in dialog
4. Team is soft-deleted (marked as inactive)

#### 4. Add Players
1. Navigate to team detail page
2. Click "Add Player" on Team tab
3. Enter player name, squad number, position, DOB
4. Submit
5. Repeat for all players

#### 5. Schedule a Match
1. On team detail page, click Matches tab
2. Click "Create Match"
3. Enter opponent name, date, time, number of periods
4. Select participating players
5. Choose captain from selected players
6. Submit

#### 6. Log Match Events
1. Navigate to match detail page
2. Click "Start Period 1"
3. Log events as they happen:
   - Goals, assists, tackles, saves
   - Yellow/red cards
   - Substitutions
4. Pause/resume as needed
5. Click "End Period" when period complete
6. Repeat for remaining periods
7. Match auto-completes after final period

#### 7. Select Player of the Match
1. After match completion, view Match Summary
2. Click "Select" under Player of the Match
3. Choose player
4. Add optional notes
5. Submit

#### 8. View Statistics
1. On team detail page, click Stats tab
2. Review team totals, top performers, player stats
3. Statistics auto-update after each match

---

### Parent Workflow

#### 1. Login & Auto-Redirect
1. Log in with parent account
2. **Automatically redirected to `/parent/teams`**
3. View team cards for all teams your children belong to
4. Each card shows number of children on that team

#### 2. View Team Detail
1. Click on a team card
2. See all your linked children on that team
3. View quick stats for each player (matches, goals, assists, tackles)
4. See captain appearances and POTM awards

#### 3. View Player Statistics
1. Click on a player card
2. Navigate to `/parent/children/[playerId]`
3. View Overview tab for season stats
4. View Matches tab for match history
5. View Rewards tab for achievements
6. See detailed performance metrics

#### 4. Access Profile
1. Click avatar in header
2. Select "Profile" from dropdown
3. View account information, role, and member since date

**Navigation Flow**:
- `/parent/teams` → Team cards
- `/parent/teams/[teamId]` → Your children on that team
- `/parent/children/[playerId]` → Individual player details

**Note**: Parents have read-only access. Only managers can link parents to players.

---

## API Endpoints Quick Reference

### Teams
```typescript
// List all teams
GET /api/teams

// Create team
POST /api/teams
Body: { name, ageGroup?, season? }

// Get team details
GET /api/teams/[teamId]

// Update team
PATCH /api/teams/[teamId]
Body: { name?, ageGroup?, season? }

// Delete team (soft delete)
DELETE /api/teams/[teamId]
```

### Players
```typescript
// List team players
GET /api/teams/[teamId]/players

// Add player
POST /api/teams/[teamId]/players
Body: { name, squadNumber?, position?, dateOfBirth? }

// Get player details
GET /api/teams/[teamId]/players/[playerId]

// Update player
PATCH /api/teams/[teamId]/players/[playerId]
Body: { name?, squadNumber?, position?, dateOfBirth? }

// Delete player (soft delete)
DELETE /api/teams/[teamId]/players/[playerId]
```

### Matches
```typescript
// List team matches
GET /api/teams/[teamId]/matches

// Create match
POST /api/teams/[teamId]/matches
Body: {
  opponentName,
  matchDate,
  matchTime?,
  numberOfPeriods,
  selectedPlayerIds,
  captainId
}

// Get match details
GET /api/teams/[teamId]/matches/[matchId]

// Update match
PATCH /api/teams/[teamId]/matches/[matchId]
Body: { status?, ... }

// Delete match (soft delete)
DELETE /api/teams/[teamId]/matches/[matchId]
```

### Periods
```typescript
// List periods
GET /api/teams/[teamId]/matches/[matchId]/periods

// Start period
POST /api/teams/[teamId]/matches/[matchId]/periods
Body: { periodNumber }

// Update period (pause/resume/end)
PATCH /api/teams/[teamId]/matches/[matchId]/periods/[periodId]
Body: { action: 'pause' | 'resume' | 'end' }
```

### Events
```typescript
// List match events
GET /api/teams/[teamId]/matches/[matchId]/events

// Log event
POST /api/teams/[teamId]/matches/[matchId]/events
Body: {
  playerId,
  eventType: 'goal' | 'assist' | 'tackle' | 'save' |
            'yellow_card' | 'red_card' | 'substitution_on' | 'substitution_off',
  cumulativeTimeSeconds,
  periodNumber
}

// Delete event (undo)
DELETE /api/teams/[teamId]/matches/[matchId]/events/[eventId]
```

### Awards
```typescript
// Get Player of the Match award
GET /api/teams/[teamId]/matches/[matchId]/award

// Set Player of the Match
POST /api/teams/[teamId]/matches/[matchId]/award
Body: { playerId, notes? }

// Remove award
DELETE /api/teams/[teamId]/matches/[matchId]/award
```

### Statistics
```typescript
// Get team and player stats
GET /api/teams/[teamId]/stats

// Returns:
{
  teamTotals: {
    totalMatches,
    totalGoals,
    totalAssists,
    totalTackles,
    totalSaves,
    totalYellowCards,
    totalRedCards
  },
  playerStats: [ /* player stats array */ ],
  topPerformers: {
    topScorer,
    topAssister,
    mostTackles,
    mostSaves
  }
}
```

### Parent Routes
```typescript
// Get teams with linked players
GET /api/parent/teams
// Returns: { teams: [ { id, name, age_group, season, players: [...] } ] }

// Get all linked children
GET /api/parent/children
// Returns: { children: [ { player_id, player_name, team_name, ... } ] }

// Get player stats
GET /api/parent/children/[playerId]/stats
// Returns: { stats: { ... } }

// Get player match history
GET /api/parent/children/[playerId]/matches
// Returns: { matches: [ ... ] }
```

---

## Component Usage

### Dialogs

```typescript
// Create Team
import { CreateTeamDialog } from '@/components/teams/CreateTeamDialog';
<CreateTeamDialog />

// Edit Team
import { EditTeamDialog } from '@/components/teams/EditTeamDialog';
<EditTeamDialog team={team} />

// Delete Team
import { DeleteTeamDialog } from '@/components/teams/DeleteTeamDialog';
<DeleteTeamDialog team={team} />

// Add Player
import { AddPlayerDialog } from '@/components/players/AddPlayerDialog';
<AddPlayerDialog teamId={teamId} />

// Edit Player
import { EditPlayerDialog } from '@/components/players/EditPlayerDialog';
<EditPlayerDialog teamId={teamId} player={player} />

// Delete Player
import { DeletePlayerDialog } from '@/components/players/DeletePlayerDialog';
<DeletePlayerDialog teamId={teamId} player={player} />

// Create Match
import { CreateMatchDialog } from '@/components/matches/CreateMatchDialog';
<CreateMatchDialog teamId={teamId} players={players} />

// Player of the Match
import { PlayerOfMatchDialog } from '@/components/matches/PlayerOfMatchDialog';
<PlayerOfMatchDialog
  open={open}
  onOpenChange={setOpen}
  teamId={teamId}
  matchId={matchId}
  players={players}
  onAwardSet={handleAwardSet}
  currentAward={award}
/>
```

### Match Components

```typescript
// Period Manager
import { PeriodManager } from '@/components/matches/PeriodManager';
<PeriodManager
  teamId={teamId}
  matchId={matchId}
  totalPeriods={numberOfPeriods}
  initialPeriods={periods}
  matchStatus={status}
/>

// Event Logger
import { EventLogger } from '@/components/matches/EventLogger';
<EventLogger
  teamId={teamId}
  matchId={matchId}
  players={players}
  initialEvents={events}
  periods={periods}
  matchStatus={status}
/>

// Match Summary
import { MatchSummary } from '@/components/matches/MatchSummary';
<MatchSummary
  teamId={teamId}
  matchId={matchId}
  players={players}
  events={events}
/>
```

### Statistics Components

```typescript
// Team Stats Dashboard
import { TeamStats } from '@/components/stats/TeamStats';
<TeamStats teamId={teamId} />

// Player Stats List (used within TeamStats)
import { PlayerStatsList } from '@/components/stats/PlayerStatsList';
<PlayerStatsList playerStats={playerStats} />
```

---

## Common Tasks

### Check Current User Role
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

const isManager = profile?.role === 'manager';
```

### Fetch Team with Players
```typescript
const { data: team } = await supabase
  .from('teams')
  .select(`
    *,
    players(*)
  `)
  .eq('id', teamId)
  .eq('is_active', true)
  .single();
```

### Fetch Match with Full Details
```typescript
const { data: match } = await supabase
  .from('matches')
  .select(`
    *,
    captain:players!captain_id(id, name, squad_number),
    match_players(
      player:players(id, name, squad_number, position)
    )
  `)
  .eq('id', matchId)
  .single();
```

### Calculate Current Period Time
```typescript
const calculateCurrentTime = (period: Period) => {
  if (!period.started_at) return 0;

  const now = Date.now();
  const startTime = new Date(period.started_at).getTime();

  if (period.paused_at) {
    const pauseTime = new Date(period.paused_at).getTime();
    return Math.floor((pauseTime - startTime) / 1000);
  }

  return Math.floor((now - startTime) / 1000);
};
```

### Format Time Display
```typescript
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

---

## Troubleshooting

### Database Connection Issues

**Symptom**: "Invalid API key" error
```
Solution:
1. Check NEXT_PUBLIC_SUPABASE_URL in .env.local
2. Check NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
3. Restart dev server: npm run dev
```

**Symptom**: "relation does not exist" error
```
Solution:
1. Verify all migrations ran successfully in Supabase
2. Check Table Editor in Supabase dashboard
3. Re-run missing migrations
```

### RLS Policy Issues

**Symptom**: "infinite recursion detected" error
```
Solution:
Apply migration 009_fix_rls_infinite_recursion.sql
See FIX_RLS_INSTRUCTIONS.md
```

**Symptom**: Can't access data despite being logged in
```
Solution:
1. Check user role in profiles table
2. Verify RLS policies exist (Auth → Policies)
3. Ensure user_id matches auth.uid()
```

### Component Issues

**Symptom**: "Module not found" for UI components
```
Solution:
1. Install missing component: npx shadcn@latest add [component]
2. Restart dev server
3. Check components/ui/ folder
```

**Symptom**: Styles not applying
```
Solution:
1. Check Tailwind config
2. Verify @tailwindcss/postcss is in package.json
3. Clear .next folder: rm -rf .next
4. Restart dev server
```

### Match Event Logging Issues

**Symptom**: Can't log events
```
Checklist:
1. Is period started?
2. Is player in match_players table?
3. Check browser console for errors
4. Verify match status is 'in_progress'
```

**Symptom**: Time not tracking correctly
```
Solution:
1. Check period_tracking table for accurate timestamps
2. Verify cumulative_seconds calculation
3. Ensure no timezone issues (all UTC)
```

### Statistics Not Showing

**Symptom**: Stats tab empty
```
Checklist:
1. Are there completed matches?
2. Is migration 011 applied? (player_stats_view)
3. Check /api/teams/[teamId]/stats returns data
4. Check browser console for errors
```

**Symptom**: Player stats missing
```
Solution:
1. Player must have logged events in at least one match
2. Verify match_events table has records
3. Check player_stats_view in Supabase
```

---

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Optional:
```env
NODE_ENV=development
```

---

## Useful SQL Queries

### Check User Profiles
```sql
SELECT id, role, full_name, created_at
FROM profiles
ORDER BY created_at DESC;
```

### View All Teams with Managers
```sql
SELECT t.name, p.full_name as manager_name, t.age_group, t.season
FROM teams t
JOIN profiles p ON t.manager_id = p.id
WHERE t.is_active = true;
```

### Count Events by Type
```sql
SELECT event_type, COUNT(*) as count
FROM match_events
WHERE match_id = 'your-match-id'
GROUP BY event_type
ORDER BY count DESC;
```

### Check Player Statistics
```sql
SELECT * FROM player_stats_view
WHERE team_id = 'your-team-id'
ORDER BY total_goals DESC;
```

### Find Top Scorers Across All Teams
```sql
SELECT name, position, total_goals, total_assists
FROM player_stats_view
WHERE total_goals > 0
ORDER BY total_goals DESC, total_assists DESC
LIMIT 10;
```

---

## Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Next.js Docs**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## Version History

- **v0.6.1** - Enhanced Parent Features: Team-based navigation, profile page, auto-redirect (Current)
- **v0.6** - Feature Slice 6: Parent Access & Privacy
- **v0.5** - Feature Slice 5: Player Statistics & Reports
- **v0.4** - Feature Slice 4: Match Completion & Rewards
- **v0.3** - Feature Slice 3: Live Match Event Logging
- **v0.2** - Feature Slice 2: Match Setup & Scheduling
- **v0.1** - Feature Slice 1: Team & Player Management
