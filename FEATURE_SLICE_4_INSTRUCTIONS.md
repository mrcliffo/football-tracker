# Feature Slice 4: Match Completion & Rewards

## Overview

Feature Slice 4 adds match completion functionality with:
- **Match Summary**: Displays team and player statistics after a match is completed
- **Player of the Match**: Award system to recognize outstanding player performance

## Database Migration Required

You need to apply migration `010_create_match_awards_table.sql` to your Supabase database.

### How to Apply the Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/010_create_match_awards_table.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute the migration

## What's New

### 1. Match Summary (Completed Matches Only)

When a match status is "completed", managers will see:

- **Player of the Match Award**
  - Select which player deserves the award
  - Add optional notes about why they were chosen
  - Update or remove the award anytime

- **Team Summary**
  - Total goals, assists, tackles, and saves
  - Yellow and red cards count
  - Visual statistics display

- **Player Statistics**
  - Individual breakdown of each player's contributions
  - Shows only players who participated (logged events)
  - Sorted by total contributions (goals + assists)

### 2. API Endpoints

New endpoints added:

- `GET /api/teams/[teamId]/matches/[matchId]/award`
  - Fetch the Player of the Match award for a completed match

- `POST /api/teams/[teamId]/matches/[matchId]/award`
  - Create or update the Player of the Match award
  - Body: `{ playerId: string, notes?: string }`

- `DELETE /api/teams/[teamId]/matches/[matchId]/award`
  - Remove the Player of the Match award

### 3. Components

New components created:

- **MatchSummary** (`components/matches/MatchSummary.tsx`)
  - Main component that displays all match statistics
  - Automatically shown for completed matches
  - Fetches and displays Player of the Match award

- **PlayerOfMatchDialog** (`components/matches/PlayerOfMatchDialog.tsx`)
  - Dialog for selecting Player of the Match
  - Radio button selection from participating players
  - Optional notes field
  - Update or remove existing awards

### 4. Database Schema

New table: `match_awards`

```sql
- id (UUID, primary key)
- match_id (UUID, references matches)
- player_id (UUID, references players)
- award_type (TEXT, always 'player_of_match')
- notes (TEXT, optional)
- created_at (TIMESTAMPTZ)
```

**Important**: Only one Player of the Match award per match (enforced by unique constraint)

## User Workflow

1. **During Match**: Manager logs events as usual (goals, assists, etc.)

2. **After Final Period Ends**: Match automatically transitions to "completed" status

3. **View Summary**: Manager sees the Match Summary with:
   - Team statistics
   - Individual player stats
   - Option to select Player of the Match

4. **Select Player of the Match**:
   - Click "Select" button
   - Choose player from participating players
   - Add optional notes
   - Save award

5. **Update or Remove**:
   - Awards can be changed anytime
   - Click "Change" to select different player
   - Click "Remove Award" to delete

## Testing Checklist

After applying the migration, test the following:

1. ✅ Complete an existing match (end all periods)
2. ✅ Verify Match Summary appears for completed matches
3. ✅ View team and player statistics
4. ✅ Select a Player of the Match
5. ✅ Update the Player of the Match
6. ✅ Remove the Player of the Match award
7. ✅ Check that awards persist after page refresh
8. ✅ Verify only participating players can be selected

## Feature Completion Status

**Feature Slice 4**: Complete ✅

- Database schema: ✅
- API endpoints: ✅
- UI components: ✅
- Integration with match detail page: ✅

## Next Steps (Future Slices)

- **Feature Slice 5**: Player Statistics & Reports
  - Season-long player statistics
  - Team analytics and trends
  - Performance visualizations

- **Feature Slice 6**: Parent Access & Privacy
  - Parent portal to view child stats
  - Privacy controls
  - Multi-child management
