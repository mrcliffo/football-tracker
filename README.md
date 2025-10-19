# Football Tracker - Junior Sports Event Tracking App

A comprehensive event tracking and player statistics application for UK junior football teams, built with Next.js 15, TypeScript, and Supabase.

## Overview

Football Tracker helps team managers track live match events, manage player rosters, and generate performance statistics for junior football teams. Parents can view their children's stats while managers have full control over team management and match logging.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Form Validation**: React Hook Form + Zod
- **Date Handling**: date-fns

## Features Implemented

### ✅ Feature Slice 1: Team & Player Management
- **Team Management**: Create, edit, and delete teams with age groups and seasons
- **Player Management**: Add, edit, and delete players with squad numbers, positions, and dates of birth
- **Role-Based Access**: Manager and parent roles with appropriate permissions
- **Manager-Only Team Operations**: Only managers can edit or delete teams they own
- **Soft Deletes**: Data preservation with is_active flags

### ✅ Feature Slice 2: Match Setup & Scheduling
- **Match Creation**: Schedule matches with opponents, date, time, and number of periods
- **Player Selection**: Choose which players participate in each match
- **Captain Assignment**: Designate match captain from selected players
- **Match Status Tracking**: Scheduled → In Progress → Completed workflow

### ✅ Feature Slice 3: Live Match Event Logging
- **Period Management**: Start, pause, resume, and end match periods
- **Cumulative Clock**: Real-time cumulative time tracking across all periods
- **Event Logging**: Log goals, assists, tackles, saves, yellow/red cards, substitutions
- **Event History**: View all events with timestamps and period numbers
- **Undo Functionality**: Delete events logged by mistake
- **Auto Status Transitions**: Matches automatically progress through status stages

### ✅ Feature Slice 4: Match Completion & Rewards
- **End-of-Match Summary**: Team and player statistics display
- **Player of the Match**: Award system with notes
- **Match Statistics**: Goals, assists, tackles, saves, cards tracking

### ✅ Feature Slice 5: Player Statistics & Reports
- **Team Statistics Dashboard**: Aggregated team performance metrics
- **Player Statistics Table**: Season-long stats for all players
- **Top Performers**: Identify leading players in each category
- **Tabbed Navigation**: Organized Team, Matches, and Stats views

### ✅ Feature Slice 6: Parent Access & Privacy
- **Parent-Child Linking**: Managers can link parent accounts to players via email
- **Team-Based Navigation**: Parents access players through team cards
- **Parent Teams Dashboard** (`/parent/teams`): View all teams children belong to
- **Team Detail View**: See all linked players within each team
- **Player Detail View**: Comprehensive statistics and match history for each child
- **Profile Page**: User profile information with role-specific details
- **Privacy Controls**: JSONB-based privacy settings for player data
- **Role-Based Navigation**: Automatic routing based on user role (manager/parent)
- **Auto-Redirect on Login**: Parents automatically directed to teams view
- **Read-Only Parent Access**: Parents can view but not modify data
- **RLS Security**: 6 policies ensuring proper data access control

## Database Schema

### Core Tables
- **profiles** - User profiles with role (manager/parent)
- **teams** - Team information managed by team managers
- **players** - Player rosters linked to teams
- **team_members** - Junction table for parent-player relationships
- **matches** - Match schedules and metadata
- **match_players** - Junction table for match rosters with captain flag
- **period_tracking** - Period start/end times with cumulative time
- **match_events** - All match events with timestamps and player references
- **match_awards** - Player of the Match awards for completed matches

### Database Views
- **player_stats_view** - Aggregated player statistics (goals, assists, tackles, saves, awards)
- **parent_children_view** - Parent-child relationships with team and match data

### RPC Functions
- **find_user_by_email(text)** - Secure email lookup for parent linking (SECURITY DEFINER)
- **get_parent_children(uuid)** - Efficient parent dashboard data retrieval (SECURITY DEFINER)

### Security
- Row Level Security (RLS) policies on all tables
- Manager-only access for team/match management
- Parent read-only access to linked children's data
- 6 parent-specific RLS policies for data access control

## Getting Started

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd football-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations in Supabase:
- Execute all SQL files in `supabase/migrations/` in order (001 → 018)
- See SUPABASE_SETUP.md for detailed instructions

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
football-tracker/
├── app/
│   ├── (auth)/          # Authentication pages (login, register)
│   ├── (dashboard)/     # Protected dashboard routes
│   │   └── teams/       # Team and match management
│   └── api/             # API routes for CRUD operations
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── players/         # Player management components
│   └── matches/         # Match and event logging components
├── lib/
│   ├── schemas/         # Zod validation schemas
│   ├── types/           # TypeScript type definitions
│   └── supabase/        # Supabase client configuration
└── supabase/
    └── migrations/      # Database migration files
```

## Key Workflows

### For Managers

#### Creating and Managing Teams
1. Navigate to `/teams`
2. Click "Create Team"
3. Enter team name, age group, and season
4. To edit: Click "Edit" button on team detail page
5. To delete: Click "Delete" button and confirm (soft delete)
6. Add players with squad numbers and positions

#### Scheduling a Match
1. Navigate to team detail page
2. Click "Create Match"
3. Enter opponent and match details
4. Select participating players
5. Choose match captain

#### Logging Live Match Events
1. Navigate to match detail page
2. Start Period 1
3. Log events as they happen (goals, assists, tackles, etc.)
4. Pause/resume as needed
5. End period when complete
6. Repeat for remaining periods
7. Match automatically completes after final period

#### Linking Parents to Players
1. Navigate to player detail page
2. Click "Manage Parents"
3. Enter parent's email address
4. Parent can now view that player's stats

### For Parents

#### Viewing Your Children's Teams
1. Login automatically redirects to `/parent/teams`
2. View cards for all teams your children are part of
3. See how many children you have on each team

#### Viewing Player Statistics
1. Click on a team card
2. See all your children on that team
3. Click on a player to view detailed stats
4. View matches, awards, and performance metrics

#### Accessing Your Profile
1. Click on your avatar in the header
2. Select "Profile" from dropdown
3. View your account information and role

## API Routes

### Teams
- `GET /api/teams` - List all teams (manager-only)
- `POST /api/teams` - Create new team (manager-only)
- `GET /api/teams/[teamId]` - Get team details
- `PATCH /api/teams/[teamId]` - Update team (manager-only, own teams only)
- `DELETE /api/teams/[teamId]` - Soft delete team (manager-only, own teams only)

### Players
- `GET/POST /api/teams/[teamId]/players` - List/create players
- `GET/PATCH/DELETE /api/teams/[teamId]/players/[playerId]` - Player operations

### Matches
- `GET/POST /api/teams/[teamId]/matches` - List/create matches
- `GET/PATCH/DELETE /api/teams/[teamId]/matches/[matchId]` - Match operations

### Periods
- `GET/POST /api/teams/[teamId]/matches/[matchId]/periods` - List/start periods
- `PATCH /api/teams/[teamId]/matches/[matchId]/periods/[periodId]` - End/pause/resume

### Events
- `GET/POST /api/teams/[teamId]/matches/[matchId]/events` - List/log events
- `DELETE /api/teams/[teamId]/matches/[matchId]/events/[eventId]` - Undo event

### Statistics
- `GET /api/teams/[teamId]/stats` - Team and player statistics

### Parent Access
- `GET /api/parent/teams` - Get teams with linked players for parent
- `GET /api/parent/children` - List all linked children
- `GET /api/parent/children/[playerId]/stats` - Player statistics
- `GET /api/parent/children/[playerId]/matches` - Player match history

## Development Status

**Current Version**: Feature Slice 6 Complete + Enhancements
**Status**: Active Development
**Last Updated**: October 2025

### Completed ✅
- Authentication & user profiles with role-based routing
- Team & player management
- Match scheduling with player selection
- Live match event logging with cumulative time tracking
- Period management (start/pause/resume/end)
- Event undo functionality
- Match completion with statistics summary
- Player of the Match award system
- Team statistics dashboard
- Player statistics table
- Top performers tracking
- Tabbed team page navigation
- Parent-child linking system
- Team-based parent navigation
- Parent teams dashboard
- Player detail views for parents
- User profile page
- Privacy controls for player data
- Automatic role-based redirects

### Planned 📋
- Performance visualizations and trends
- Export statistics to PDF/CSV
- Team communication features
- Season comparison tools

## Contributing

This is a private project for junior football team management. For issues or feature requests, please contact the development team.

## License

Private - All Rights Reserved
