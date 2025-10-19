# Feature Slice 5: Player Statistics & Reports

## Overview

Feature Slice 5 adds comprehensive player and team statistics tracking with:
- **Team Statistics Dashboard**: View aggregated team performance metrics
- **Player Statistics Table**: Detailed stats for all players in the team
- **Top Performers Highlights**: Identify leading players in goals, assists, tackles, and saves
- **Tabbed Navigation**: Clean organization with Team, Matches, and Stats tabs

## Database Migration Required

You need to apply migration `011_create_player_stats_view.sql` to your Supabase database.

### How to Apply the Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/011_create_player_stats_view.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute the migration

## What's New

### 1. Database View for Statistics

**player_stats_view**
- Aggregates statistics from `match_events` table
- Calculates totals for goals, assists, tackles, saves, cards
- Includes Player of the Match awards count
- Tracks captain appearances
- Counts matches played per player
- Auto-calculates from existing match event data (no new tables!)

### 2. API Endpoint

**GET /api/teams/[teamId]/stats**
- Fetches aggregated team and player statistics
- Returns:
  - `teamTotals`: Overall team statistics
  - `playerStats`: Individual player statistics array
  - `topPerformers`: Top scorer, assister, tackler, and saver
- Access control: Team managers and team members (parents)

### 3. UI Components

**TeamStats Component** (`components/stats/TeamStats.tsx`)
- Main statistics dashboard component
- Displays team totals with stats cards
- Shows top performers in each category
- Integrates PlayerStatsList component
- Client-side component with data fetching

**PlayerStatsList Component** (`components/stats/PlayerStatsList.tsx`)
- Table view of all player statistics
- Color-coded statistics (goals in blue, assists in green, etc.)
- Shows captain appearances with badge
- Displays Player of the Match awards
- Filters out players with no match participation

**Tabs Component** (Added via shadcn)
- Organizes team page into three tabs: Team, Matches, Stats
- Clean navigation between different views
- Icons for each tab

### 4. Team Page Updates

**app/(dashboard)/teams/[teamId]/page.tsx**
- Reorganized with Tabs component
- Three tabs:
  - **Team**: Player roster management (existing functionality)
  - **Matches**: Match schedule and creation (existing functionality)
  - **Stats**: New statistics dashboard
- Better organization and user experience

## Features Breakdown

### Team Statistics
- Total matches played (completed matches only)
- Total goals with average per match
- Total assists with average per match
- Total tackles with average per match
- Total saves with average per match
- Yellow and red cards totals

### Player Statistics
For each player who has participated in matches:
- Matches played (MP)
- Goals (G)
- Assists (A)
- Tackles (T)
- Saves (S)
- Yellow cards (YC)
- Red cards (RC)
- Player of the Match awards
- Captain appearances

### Top Performers
Automatically identifies and highlights:
- **Top Scorer**: Player with most goals
- **Top Assister**: Player with most assists
- **Most Tackles**: Player with most tackles
- **Most Saves**: Player with most saves (typically goalkeeper)

## User Workflow

1. **Navigate to Team Page**: Manager or parent accesses team detail page

2. **Click Stats Tab**: View the new statistics dashboard

3. **View Team Totals**: See overall team performance metrics

4. **Review Top Performers**: Identify standout players in each category

5. **Analyze Player Stats**: Review detailed statistics table for all players

## Technical Implementation

### Database View Benefits
- **No Additional Storage**: Calculates stats from existing `match_events` table
- **Always Up-to-Date**: Automatically reflects latest match data
- **Efficient Queries**: PostgreSQL optimizes view queries
- **Simple Maintenance**: No sync issues between tables

### API Design
- RESTful endpoint structure
- Proper access control (manager or team member)
- Efficient single query with joins
- Returns calculated team totals and top performers
- Client-side caching via React state

### UI/UX Features
- **Responsive Design**: Works on mobile and desktop
- **Loading States**: Shows loading indicator while fetching
- **Empty States**: Helpful messages when no stats available
- **Color Coding**: Visual distinction for different stat types
- **Table Layout**: Easy-to-read statistics table
- **Card-Based Design**: Consistent with existing UI patterns

## Statistics Legend

| Abbreviation | Meaning |
|--------------|---------|
| MP | Matches Played |
| G | Goals |
| A | Assists |
| T | Tackles |
| S | Saves |
| YC | Yellow Cards |
| RC | Red Cards |

## Testing Checklist

After applying the migration, test the following:

1. ✅ Navigate to team page
2. ✅ Click on "Stats" tab
3. ✅ Verify team totals display correctly
4. ✅ Check top performers section shows correct players
5. ✅ Review player statistics table
6. ✅ Verify players with no matches don't appear in stats
7. ✅ Test empty state (team with no completed matches)
8. ✅ Verify stats update after completing a new match
9. ✅ Check access control (only team managers and parents can view)
10. ✅ Test responsive layout on mobile devices

## Feature Completion Status

**Feature Slice 5**: Complete ✅

- Database view: ✅
- API endpoint: ✅
- UI components: ✅
- Team page integration: ✅
- Tabbed navigation: ✅
- Top performers: ✅
- Player statistics table: ✅

## Next Steps (Future Slices)

**Feature Slice 6: Parent Access & Privacy**
- Parent portal to view child player stats
- Privacy controls for player data
- Multi-child management for parents
- Parent-specific dashboard
- Access control refinements

## Performance Considerations

- Database view uses efficient aggregation
- Statistics only calculated for active players and matches
- Client-side caching reduces API calls
- Responsive design optimized for mobile

## Future Enhancements (Not in Scope)

Potential future improvements:
- **Performance Trends**: Charts showing player improvement over time
- **Match-by-Match Breakdown**: Detailed per-match statistics
- **Season Comparisons**: Compare current vs previous seasons
- **Export Statistics**: Download stats as CSV or PDF
- **Team Rankings**: Compare with other teams in the league
