# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack
npm start            # Start production server
npm run lint         # Run ESLint
```

### Testing
No test suite is currently configured.

## Project Overview

Football Tracker is a Next.js 15 (App Router) application for managing UK junior football teams. It provides live match event tracking, player statistics, and role-based access for team managers and parents.

**Key Technologies:**
- Next.js 15.5+ (App Router, React 19, Turbopack)
- TypeScript (strict mode disabled in production builds)
- Supabase (PostgreSQL + Auth with SSR)
- Tailwind CSS v4 + shadcn/ui
- Zustand for client state
- React Hook Form + Zod validation
- OpenAI API for AI-generated match reports

## Architecture

### Authentication & Authorization

**Dual Supabase Client Pattern:**
- `lib/supabase/client.ts` - Browser client for client components
- `lib/supabase/server.ts` - SSR client for Server Components and API routes
- `lib/supabase/middleware.ts` - Session management in Next.js middleware

**Role-Based Access:**
- `manager` role: Full CRUD on teams, players, matches, events
- `parent` role: Read-only access to linked children's data via team-based navigation

**Middleware** (`middleware.ts`):
- Protects routes: `/teams`, `/profile`, `/admin`
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from auth pages
- Does NOT protect API routes (they handle auth internally)

### Database Architecture

**Core Tables:**
- `profiles` - User accounts with roles
- `teams` - Manager-owned teams
- `players` - Roster linked to teams
- `team_members` - Junction for parent-player links
- `matches` - Match metadata with status workflow
- `match_players` - Match rosters with captain designation
- `period_tracking` - Period timing with cumulative clock
- `match_events` - All match events with timestamps
- `match_awards` - Player of the Match awards
- `rewards` - Reward catalog (badges/achievements)
- `player_rewards` - Player reward assignments
- `event_types` - Admin-managed event type catalog

**Database Views:**
- `player_stats_view` - Aggregated player statistics
- `parent_children_view` - Parent access to linked players with team context

**RPC Functions:**
- `find_user_by_email(text)` - Email lookup for parent linking (SECURITY DEFINER)
- `get_parent_children(uuid)` - Parent dashboard data (SECURITY DEFINER)

**RLS Security:**
- All tables protected with Row Level Security
- Manager-only policies for write operations
- Parent read-only policies for linked children
- Careful to avoid infinite recursion in policies

### API Routes Structure

RESTful API with nested resource routes:

```
/api/teams
  GET - List manager's teams
  POST - Create team

/api/teams/[teamId]
  GET - Team details
  PATCH - Update team (manager only)
  DELETE - Soft delete (manager only)

/api/teams/[teamId]/players
  GET - List players
  POST - Add player

/api/teams/[teamId]/players/[playerId]
  GET/PATCH/DELETE - Player operations

  /parents - Parent linking
    POST - Link parent by email
    DELETE /[linkId] - Remove link

/api/teams/[teamId]/matches
  GET - List matches
  POST - Create match

/api/teams/[teamId]/matches/[matchId]
  GET/PATCH/DELETE - Match operations

  /periods - Period management
    GET - List periods
    POST - Start new period
    PATCH /[periodId] - End/pause/resume

  /events - Match events
    GET - List events
    POST - Log event
    DELETE /[eventId] - Delete event

  /award - Player of the Match
    POST - Award POTM

  /evaluate-rewards - Reward evaluation
    POST - Evaluate rewards after match completion

  /report - AI match report
    GET - Fetch existing report
    POST - Generate or regenerate AI summary (manager-only)

/api/parent/teams
  GET - Parent's team cards

/api/parent/children
  GET - All linked children

/api/parent/children/[playerId]
  /stats - Player statistics
  /matches - Match history

/api/admin
  /events - Event type management
    GET - List all event types
    POST - Create event type
    PUT /[eventId] - Update event type
    DELETE /[eventId] - Delete event type

  /rewards - Reward management
    GET - List all rewards
    POST - Create reward
    PUT /[rewardId] - Update reward
    DELETE /[rewardId] - Delete reward (prevented if players have earned it)
```

**API Route Patterns:**
- All routes use `async/await` with Next.js 15 async params
- Authentication checked via `supabase.auth.getUser()`
- Manager ownership verified for write operations
- Return JSON with `NextResponse.json()`
- Schema validation via Zod schemas in `lib/schemas/`

### Frontend Architecture

**Route Groups:**
- `(auth)` - Login/register pages (unauthenticated)
- `(dashboard)` - Protected manager/parent routes
- `admin` - Admin panel for event type and reward management (manager-only)

**Admin Panel Structure:**
- Tab-based navigation (mobile-first design)
- `/admin` - Redirects to `/admin/events` by default
- `/admin/events` - Event type management (create, edit, delete event types)
- `/admin/rewards` - Reward management (create, edit, delete rewards)
- `components/admin/AdminTabs.tsx` - Client component for tab navigation

**Component Structure:**
```
components/
  ui/           # shadcn/ui primitives
  auth/         # Login/Register forms
  teams/        # Team CRUD dialogs
  players/      # Player CRUD + parent linking
  matches/      # Match creation, period manager, event logger
  stats/        # Statistics displays
  rewards/      # Reward badges and galleries
  admin/        # Admin panel components (tabs, etc.)
  layout/       # Header with user menu
```

**Event Logger UX:**
- Two-stage selection: Event type grid → Player grid
- Player selection uses 2-column grid layout (no scrolling required on mobile)
- PlayerButton displays vertically: squad number (top) → name (middle) → position (bottom)
- Optimized for rapid event logging during live matches
- 85px minimum tap target height for mobile accessibility

**State Management:**
- Zustand stores in `lib/stores/`:
  - `authStore.ts` - User + profile state (persisted to localStorage)
  - `teamStore.ts` - Team data caching
- Auth state persisted across page reloads using Zustand persist middleware
- Server state via SWR for data fetching
- URL params for routing state

**Form Handling:**
- React Hook Form for all forms
- Zod schemas in `lib/schemas/` for validation
- `@hookform/resolvers` for Zod integration

### Key Business Logic

**Match Status Workflow:**
1. `scheduled` - Initial state
2. `in_progress` - First period started
3. `completed` - Final period ended

**Period Tracking:**
- Cumulative clock across all periods
- Pause/resume support within periods
- Event timestamps use cumulative seconds

**Reward System** (`lib/services/rewardEvaluator.ts`):
- Automatically evaluated after match completion
- Match-based rewards (e.g., Hat Trick = 3 goals in one match)
- Season-based rewards (e.g., Striker = 30 goals total)
- Special rewards with multi-criteria (e.g., All Rounder = 1 goal + 1 assist + 1 tackle)
- Leadership rewards (Captain milestones, POTM + Captain combo)

**AI Match Reports:**
- Uses OpenAI API to generate match summaries
- Manager-triggered via button (not automatic on match completion)
- Includes player stats, key events, Player of the Match award
- Can be regenerated multiple times to refresh content
- Stored in `match_reports` table

**Parent Access Model:**
- Parents linked to players via email
- Team-based navigation: Parents see team cards → players in team → player details
- Privacy settings in player records (JSONB)

## Type System

**Database Types** (`lib/types/database.ts`):
- Auto-generated TypeScript interfaces for all tables
- Helper types: `Profile`, `Team`, `Player`, `Match`, etc.
- Special types: `PlayerPrivacySettings`, `ParentChildView`, `RewardMetadata`

**Type Patterns:**
- Use `Database['public']['Tables']['table_name']['Row']` for queries
- Use `Insert` and `Update` variants for mutations

## Important Conventions

### Authentication State Persistence
- Auth store (`authStore.ts`) uses Zustand persist middleware
- User and profile data stored in localStorage with key `'auth-storage'`
- Ensures manager role/admin access persists across page reloads
- Loading state is NOT persisted (always starts fresh)

### Soft Deletes
All entities use `is_active` boolean flags. Never hard delete records.

### Timestamps
All tables have `created_at` and `updated_at` (except junction tables).

### Metadata Fields
Many tables have JSONB `metadata` fields for extensibility.

### Error Handling in API Routes
```typescript
try {
  // Verify auth
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership for mutations
  const { data: team } = await supabase
    .from('teams')
    .select('manager_id')
    .eq('id', teamId)
    .single();

  if (team.manager_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ... operation

  return NextResponse.json({ data });
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

### Database Query Patterns
```typescript
// Relations
.select('*, team:teams(id, name), player:players(id, name)')

// Filtering
.eq('team_id', teamId)
.eq('is_active', true)

// Single record
.single() // Throws if not found
.maybeSingle() // Returns null if not found

// Ordering
.order('created_at', { ascending: false })

// Counting
.select('id', { count: 'exact', head: true })
```

## Common Tasks

### Accessing the Admin Panel
1. Log in as a manager
2. Navigate to `/admin` (redirects to `/admin/events`)
3. Use tabs to switch between Events and Rewards management
4. All changes are reflected immediately across parent and manager views

### Adding a New Match Event Type
1. Go to Admin Panel → Events tab (`/admin/events`)
2. Click "Add Event Type"
3. Fill in the form:
   - **Name (Internal)**: Lowercase identifier with underscores (e.g., `corner_kick`, `free_kick`)
   - **Display Name**: User-friendly name shown in UI (e.g., "Corner Kick", "Free Kick")
   - **Description**: Optional explanation of the event
   - **Icon**: Select from Lucide icon dropdown (e.g., trophy, target, shield)
4. Event will be available in event logger immediately

**Icon System:**
- Uses Lucide React icons (https://lucide.dev/icons)
- Icons stored as text names (e.g., "trophy", "shield-check", "alert-triangle")
- Dropdown shows 30+ common event icons with live preview
- Icons dynamically rendered via `getIconComponent()` utility in `lib/utils/iconMapper.tsx`
- To use any Lucide icon not in dropdown, manually enter the icon name from lucide.dev

### Adding a New Reward
1. Go to Admin Panel → Rewards tab (`/admin/rewards`)
2. Click "Add Reward"
3. Configure:
   - **Name & Description**: Display information
   - **Reward Type**: Match-based, Season-based, or Leadership
   - **Criteria Scope**: Single match, Season, Career, or Special
   - **Event Type**: Goal, Assist, Tackle, Save (or None for special rewards)
   - **Threshold**: Number of events required
   - **Icon**: Emoji to display
4. Reward will be auto-evaluated via `rewardEvaluator.ts` after match completion
5. For special criteria (multi-event requirements), use scope "Special" and extend `RewardMetadata` in evaluation logic

### Generating Match Reports
1. Complete the match (all periods ended)
2. Award Player of the Match (optional but recommended)
3. Navigate to the match summary page
4. Click "Generate Match Report" button
5. To regenerate with updated POTM or events, click "Regenerate" button
6. Report includes POTM award, player stats, and key events

**Note:** Reports are manually triggered by managers, not auto-generated on match completion. This ensures the Player of the Match award is correctly included.

### Debugging Parent Access Issues
- Check `team_members` table for parent-player links
- Verify RLS policies with `EXPLAIN` on queries
- Use `parent_children_view` for debugging parent visibility
- Check player `privacy_settings` JSONB field

### Database Migrations
Migrations are in `supabase/migrations/` numbered sequentially. Run them in order in Supabase SQL Editor.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key  # Optional, for AI reports
```

## Production Build Notes

- ESLint and TypeScript checks are disabled in production builds (`next.config.ts`)
- This is intentional for rapid iteration; re-enable before production deployment
- Turbopack is used for faster builds
