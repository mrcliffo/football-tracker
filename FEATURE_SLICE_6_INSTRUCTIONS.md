# Feature Slice 6: Parent Access & Privacy

**Status**: ✅ Complete
**Date Completed**: October 2025
**Migration**: 012

## Overview

Feature Slice 6 implements parent access to player statistics and match history with comprehensive privacy controls. This feature allows team managers to link parent accounts to their children's player profiles, enabling parents to view their child's performance data through a dedicated parent dashboard.

## Key Features

### 1. Parent-Child Linking System
- Managers can link parent accounts to player profiles via email
- Multiple parents can be linked to a single player
- Parents can have access to multiple children
- Easy removal of parent access links
- Real-time link management interface

### 2. Parent Dashboard
- Dedicated `/parent/dashboard` route for parent users
- Overview of all children with quick stats
- Card-based interface showing:
  - Player name and squad number
  - Team and age group
  - Position
  - Matches played count
  - Current season

### 3. Child Detail View
- Comprehensive player statistics for parents
- Tabbed interface (Overview, Matches)
- Overview Tab includes:
  - Quick stats cards (Matches, Goals, Assists, Tackles)
  - Detailed performance stats (Saves, Cards)
  - Awards and honors (Captain appearances, POTM awards)
- Matches Tab includes:
  - Complete match history
  - Match-specific statistics
  - Captain and POTM badges
  - Date and opponent information

### 4. Privacy Controls
- Privacy settings stored in `players.privacy_settings` JSONB column
- Three privacy options:
  - `show_stats_to_parents` - Controls statistics visibility
  - `show_match_history` - Controls match history visibility
  - `show_awards` - Controls awards and honors visibility
- Default: All privacy settings enabled (parents can see everything)
- Graceful handling when privacy restricts access

### 5. Row Level Security (RLS) Enhancements
- Parents can view their linked children's player data
- Parents can view matches their children participated in
- Parents can view match events for their children
- Parents can view awards earned by their children
- All access controlled through `team_members` table relationships

## Database Changes

### Migration 012: `012_enable_parent_access.sql`

#### New Columns
- `players.privacy_settings` (JSONB) - Privacy preferences

#### New Database View
- `parent_children_view` - Efficient query for parent dashboard
  - Combines team_members, players, teams data
  - Includes match count aggregation
  - Security barrier enabled

#### Updated RLS Policies

**Players Table:**
- Added policy: "Parents can view their children"
- Updated policy: "Team managers can view their team's players"

**Matches Table:**
- Added policy: "Parents can view matches their children participated in"

**Match Players Table:**
- Added policy: "Parents can view their children's match participation"

**Match Events Table:**
- Added policy: "Parents can view their children's match events"

**Match Awards Table:**
- Added policy: "Parents can view their children's awards"

**Period Tracking Table:**
- Added policy: "Parents can view period tracking for their children's matches"

**Teams Table:**
- Added policy: "Parents can view teams their children belong to"

## API Routes

### Parent-Child Linking (Manager Only)

#### `GET /api/teams/[teamId]/players/[playerId]/parents`
Get all parents linked to a specific player.

**Authorization**: Team manager only
**Response**:
```json
{
  "parents": [
    {
      "linkId": "uuid",
      "userId": "uuid",
      "fullName": "John Doe",
      "role": "parent",
      "linkedAt": "2025-10-18T..."
    }
  ]
}
```

#### `POST /api/teams/[teamId]/players/[playerId]/parents`
Link a parent to a player by email.

**Authorization**: Team manager only
**Request Body**:
```json
{
  "parentEmail": "parent@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "link": {
    "linkId": "uuid",
    "userId": "uuid",
    "fullName": "John Doe",
    "role": "parent",
    "linkedAt": "2025-10-18T..."
  }
}
```

**Errors**:
- 404: Parent not found (must register first)
- 400: User is not a parent role
- 400: Parent already linked to this player

#### `DELETE /api/teams/[teamId]/players/[playerId]/parents/[linkId]`
Remove a parent's access to a player.

**Authorization**: Team manager only
**Response**:
```json
{
  "success": true
}
```

### Parent Dashboard (Parent Only)

#### `GET /api/parent/children`
Get all children the logged-in parent has access to.

**Authorization**: Parent role only
**Uses**: `parent_children_view` database view
**Response**:
```json
{
  "children": [
    {
      "parent_id": "uuid",
      "team_id": "uuid",
      "player_id": "uuid",
      "player_name": "Jane Smith",
      "squad_number": 10,
      "position": "Forward",
      "date_of_birth": "2012-05-15",
      "privacy_settings": { "show_stats_to_parents": true, ... },
      "team_name": "Under 12s",
      "age_group": "U12",
      "season": "2024/25",
      "matches_played": 8
    }
  ]
}
```

#### `GET /api/parent/children/[playerId]/stats`
Get statistics for a specific child.

**Authorization**: Parent role only (must be linked to player)
**Privacy**: Respects `show_stats_to_parents` setting
**Response**:
```json
{
  "player": {
    "id": "uuid",
    "name": "Jane Smith",
    "position": "Forward",
    "squadNumber": 10
  },
  "stats": {
    "matchesPlayed": 8,
    "goals": 12,
    "assists": 5,
    "tackles": 15,
    "saves": 0,
    "yellowCards": 1,
    "redCards": 0,
    "playerOfMatchAwards": 2,
    "captainAppearances": 3
  }
}
```

#### `GET /api/parent/children/[playerId]/matches`
Get match history for a specific child.

**Authorization**: Parent role only (must be linked to player)
**Privacy**: Respects `show_match_history` setting
**Response**:
```json
{
  "player": {
    "id": "uuid",
    "name": "Jane Smith"
  },
  "matches": [
    {
      "matchId": "uuid",
      "opponentName": "Riverside FC",
      "matchDate": "2025-10-15",
      "matchTime": "10:00",
      "status": "completed",
      "teamName": "Under 12s",
      "wasCaptain": true,
      "wasPlayerOfMatch": false,
      "stats": {
        "goals": 2,
        "assists": 1,
        "tackles": 3,
        "saves": 0,
        "yellowCards": 0,
        "redCards": 0
      }
    }
  ]
}
```

## UI Components

### `ManageParentsDialog.tsx`
Location: `/components/players/ManageParentsDialog.tsx`

**Purpose**: Manager interface to link/unlink parents to players

**Features**:
- Search for parents by email
- Display list of currently linked parents
- Remove parent access with confirmation dialog
- Real-time updates after linking/unlinking
- Loading states and error handling

**Props**:
```typescript
interface ManageParentsDialogProps {
  teamId: string;
  playerId: string;
  playerName: string;
}
```

**Usage**:
```tsx
<ManageParentsDialog
  teamId={team.id}
  playerId={player.id}
  playerName={player.name}
/>
```

## Pages

### Parent Dashboard: `/app/(dashboard)/parent/dashboard/page.tsx`

**Route**: `/parent/dashboard`
**Access**: Parents only
**Features**:
- Displays all children the parent has access to
- Card-based layout with player info
- Links to individual child detail pages
- Shows if no children linked yet

### Child Detail: `/app/(dashboard)/parent/children/[playerId]/page.tsx`

**Route**: `/parent/children/[playerId]`
**Access**: Parents only (must be linked to player)
**Features**:
- Player information header
- Tabbed interface (Overview, Matches)
- Comprehensive statistics display
- Match history with performance breakdown
- Privacy-aware (shows messages if data restricted)

## Navigation Updates

### Header Component
Updated `/components/layout/Header.tsx` to show role-appropriate navigation:

- **Managers**: "Teams" navigation button → `/teams`
- **Parents**: "My Children" navigation button → `/parent/dashboard`

## User Workflows

### Manager Workflow: Linking a Parent

1. Navigate to team page (`/teams/[teamId]`)
2. Find player in Team roster
3. Click "Manage Parents" button
4. Enter parent's email address
5. Click "Link Parent"
6. Parent now has access to view that player's data

**Requirements**:
- Parent must have registered an account first
- Parent must have "parent" role
- Email must match their registration email

### Parent Workflow: Viewing Child Stats

1. Parent logs in
2. Automatically redirected to `/parent/dashboard`
3. See all linked children as cards
4. Click on a child's card
5. View detailed stats and match history

## Privacy Settings

### Default Privacy Settings
```json
{
  "show_stats_to_parents": true,
  "show_match_history": true,
  "show_awards": true
}
```

### Privacy Behavior
- When `show_stats_to_parents` = false:
  - Stats API returns error
  - Child detail page shows privacy message

- When `show_match_history` = false:
  - Matches API returns error
  - Matches tab shows privacy message

### Future Enhancements
- UI for managers to toggle privacy settings
- Privacy settings per parent (currently global per player)
- Notification when privacy settings change

## Testing Checklist

### Setup
- [x] Run migration 012 successfully
- [x] Verify all RLS policies created
- [x] Verify `parent_children_view` created

### Manager Tests
- [ ] Create team and add players
- [ ] Register parent account
- [ ] Link parent to player via email
- [ ] Verify parent appears in linked parents list
- [ ] Remove parent link
- [ ] Verify removal confirmation dialog
- [ ] Try linking non-existent email (should fail)
- [ ] Try linking manager email (should fail)

### Parent Tests
- [ ] Login as parent
- [ ] Verify redirected to `/parent/dashboard`
- [ ] See linked children on dashboard
- [ ] Click on child card
- [ ] Verify statistics display correctly
- [ ] Verify match history displays
- [ ] Check captain badge appears correctly
- [ ] Check POTM badge appears correctly
- [ ] Verify no access to unlinked players (404)

### Privacy Tests
- [ ] Set `show_stats_to_parents` to false
- [ ] Verify stats tab shows privacy message
- [ ] Set `show_match_history` to false
- [ ] Verify matches tab shows privacy message
- [ ] Reset privacy settings to default

### RLS Tests
- [ ] Parent can only see their linked children
- [ ] Parent cannot access other players' data
- [ ] Parent can see matches where child participated
- [ ] Parent cannot see other teams' matches
- [ ] Manager can still see all team data

## Known Issues

### Resolved
- None currently

### Limitations
- Parent must register before being linked (cannot send invitations)
- No email notification when linked to a player
- Privacy settings managed via database only (no UI yet)
- Cannot link parent if email doesn't match exactly

## Future Enhancements

### Short Term
- [ ] Privacy settings UI for managers
- [ ] Email notifications when parent is linked
- [ ] Parent invitation system (invite before registration)
- [ ] Multi-season support in parent view

### Long Term
- [ ] Parent-specific notifications
- [ ] Download/export child's statistics
- [ ] Compare with team averages
- [ ] Historical season comparison
- [ ] Mobile app for parents

## File Summary

### New Files Created
1. `/supabase/migrations/012_enable_parent_access.sql`
2. `/lib/types/database.ts` (updated)
3. `/app/api/teams/[teamId]/players/[playerId]/parents/route.ts`
4. `/app/api/teams/[teamId]/players/[playerId]/parents/[linkId]/route.ts`
5. `/app/api/parent/children/route.ts`
6. `/app/api/parent/children/[playerId]/stats/route.ts`
7. `/app/api/parent/children/[playerId]/matches/route.ts`
8. `/components/players/ManageParentsDialog.tsx`
9. `/app/(dashboard)/parent/dashboard/page.tsx`
10. `/app/(dashboard)/parent/children/[playerId]/page.tsx`

### Modified Files
1. `/app/(dashboard)/teams/[teamId]/page.tsx` (added ManageParentsDialog)
2. `/components/layout/Header.tsx` (role-based navigation)

## Security Considerations

### Authentication
- All parent routes require authentication
- Role verification on every request
- API routes validate user role before proceeding

### Authorization
- RLS policies enforce parent-child relationships
- Parents can only access linked children
- Managers can only link parents to their team's players
- No API allows parents to create/modify data (read-only)

### Data Privacy
- Privacy settings enforced at API level
- Graceful error messages (don't leak data)
- Database views use security_barrier = true
- No sensitive data exposed in error messages

## Performance Considerations

### Optimizations
- `parent_children_view` pre-aggregates match counts
- Indexed columns: `user_id`, `team_id`, `player_id` in `team_members`
- GIN index on `privacy_settings` column
- Efficient RLS policies avoid N+1 queries

### Caching Strategy
- Parent dashboard uses `cache: 'no-store'` for real-time data
- Could add SWR for client-side caching
- Consider Redis cache for frequently accessed parent views

## Deployment Notes

1. Run migration 012 before deploying code
2. Verify all indexes created successfully
3. Test RLS policies in production with sample data
4. Monitor parent dashboard load times
5. Set up error tracking for parent API routes

## Support

### Common Parent Questions

**Q: I can't see my child's statistics**
A: Contact your team manager to link your account to your child's profile. Make sure you registered with the correct email address.

**Q: Why can't I see some information?**
A: The team manager may have enabled privacy settings that restrict certain information.

**Q: Can I manage my child's team?**
A: No, parent accounts are read-only. Only team managers can modify data.

### Manager Questions

**Q: How do I link a parent?**
A: Go to your team page, click "Manage Parents" next to the player, and enter the parent's email address.

**Q: Parent says they can't see the player**
A: Verify:
1. Parent has registered an account
2. Parent used the correct email
3. You linked them to the correct player
4. Parent is logging in with the linked email

---

**Last Updated**: October 2025
**Version**: 1.0
**Tested**: ✅ Database migration, ❓ User workflows pending
