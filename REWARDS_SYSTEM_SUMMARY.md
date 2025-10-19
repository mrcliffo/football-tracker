# Football Tracker - Rewards System Implementation

## 🎉 Complete Implementation Summary

### Overview
A comprehensive gamification system that automatically awards players with achievements based on their match performance, season statistics, and leadership roles.

---

## 📁 File Structure

### Database
- **`supabase/migrations/019_create_rewards_tables.sql`**
  - ✅ Already applied to database
  - Creates `rewards` and `player_rewards` tables
  - Includes 17 pre-seeded rewards
  - RLS policies for security

### Backend

#### Types (`lib/types/database.ts`)
- `Reward` - Reward definition type
- `PlayerReward` - Earned reward record type
- `RewardWithProgress` - Extended type with progress tracking
- `PlayerRewardWithDetails` - Includes related player/reward/match data
- `RewardMetadata` - Typed metadata for complex criteria

#### Validation (`lib/schemas/reward.ts`)
- Zod schemas for all reward operations
- Type-safe validation for API requests

#### Business Logic (`lib/services/rewardEvaluator.ts`)
- `evaluateMatchRewards(supabase, matchId)` - Main evaluation function
- `calculateRewardProgress(supabase, playerId, rewardId, season)` - Progress tracking
- Handles match-based, season-based, and leadership rewards
- Prevents duplicate reward assignments

#### API Routes
1. **`GET /api/teams/[teamId]/rewards`**
   - Lists all available rewards from catalog
   - Public access to rewards definitions

2. **`GET /api/teams/[teamId]/players/[playerId]/rewards`**
   - Player's earned rewards + progress toward locked ones
   - Respects privacy settings for parents
   - Returns `RewardWithProgress[]`

3. **`POST /api/teams/[teamId]/matches/[matchId]/evaluate-rewards`**
   - Triggers reward evaluation after match completion
   - Returns newly unlocked rewards
   - Called automatically after POTM selection

4. **`GET /api/teams/[teamId]/rewards/leaderboard`**
   - Team-wide rewards leaderboard
   - Ranked by total rewards earned

### Frontend

#### Components (`components/rewards/`)

1. **`RewardBadge.tsx`**
   - Display individual reward badges
   - Shows locked/unlocked states
   - Progress bars for locked rewards
   - Color-coded by type (match/season/leadership)

2. **`RewardsGallery.tsx`**
   - Browse all rewards with filters
   - Filter by status (all/earned/locked)
   - Filter by type (match/season/leadership)
   - Progress tracking display
   - Grouped by reward type

3. **`PlayerRewardsSection.tsx`**
   - Shows player's earned rewards
   - Displays top 3 closest-to-completion locked rewards
   - Fetches data via API
   - Loading and error states

#### Pages

1. **`app/(dashboard)/teams/[teamId]/rewards/page.tsx`**
   - Standalone rewards gallery page
   - Team leaderboard
   - Player-specific view with query param `?player=[playerId]`

#### Enhanced Existing Components

1. **`components/matches/MatchSummary.tsx`**
   - Auto-triggers reward evaluation after POTM selection
   - Displays "New Rewards Unlocked!" section
   - Toast notifications for achievements
   - Shows reward badges with player names

2. **`app/(dashboard)/teams/[teamId]/page.tsx`**
   - Player names are clickable links to player detail pages
   - Team view focuses on roster, matches, and stats
   - Removed team-level rewards tab (rewards are player-specific)

3. **`app/(dashboard)/teams/[teamId]/players/[playerId]/page.tsx`** (NEW)
   - Manager's player detail page
   - 3 tabs: Overview, Matches, Rewards
   - Full rewards gallery with progress tracking
   - Same experience as parent view

4. **`app/(dashboard)/parent/children/[playerId]/page.tsx`**
   - Added 3rd tab: "Rewards" ✨
   - Privacy-aware rewards display
   - Full gallery view with `showFullGallery={true}`
   - Shows summary, close-to-unlocking, and all rewards by type

---

## 🏆 Available Rewards (17 Total)

### Match-Based (7)
| Reward | Criteria | Icon |
|--------|----------|------|
| Goal Scorer | 1 goal in one match | ⚽ |
| Hat Trick Hero | 3 goals in one match | 🎩 |
| Super Saver | 5 saves in one match | 🧤 |
| Assist Ace | 3 assists in one match | 🎯 |
| Tackle Titan | 10 tackles in one match | 🛡️ |
| Shot Stopper | 5 saves in one match | ✋ |
| All Rounder | 1 goal + 1 assist + 1 tackle in one match | ⭐ |

### Season-Based (6)
| Reward | Criteria | Icon |
|--------|----------|------|
| 30 Goal Season | 30 goals in one season | 🔥 |
| Playmaker Pro | 20 assists in one season | 🎮 |
| Defensive Wall | 50 tackles in one season | 🧱 |
| Goal Guardian | 20 saves in one season | 🥅 |
| Defender's Pride | 100 tackles in one season | 💪 |
| Season Legend | 200 total events in one season | 👑 |

### Leadership (4)
| Reward | Criteria | Icon |
|--------|----------|------|
| Captain's Debut | First time as captain | 🔰 |
| Club Captain | Captain 5 times | Ⓒ |
| Team Leader | Captain 10 times | 👑 |
| Double Honor | Captain + POTM in same game | 🏅 |

---

## 🔄 User Flow

### Manager Flow
1. **Create Match** → Select squad and captain
2. **Log Events** → Record goals, assists, tackles, saves during match
3. **End Match** → Mark all periods as complete
4. **Select POTM** → Choose Player of the Match
5. **✨ Auto-Evaluation** → System evaluates all rewards
6. **View Rewards** → See newly unlocked achievements in MatchSummary
7. **Access Player Rewards** → Click player name in roster → View player details → Rewards tab

### Parent Flow
1. **Navigate** → Go to child's profile from parent dashboard
2. **Rewards Tab** → Click "Rewards" tab
3. **View Full Gallery** → See summary stats, close-to-unlocking section, and all rewards
4. **Track Progress** → View progress bars for both locked and earned rewards
5. **Privacy** → Controlled by player's `show_awards` setting

### Player Progression
- **Real-time Progress** → "23/30 goals" for season-based rewards
- **Automatic Detection** → Multi-criteria rewards like "All Rounder"
- **Achievement Display** → Earned rewards show what was achieved (e.g., "Achieved: 3 goals")
- **Leaderboard** → Team-wide ranking by total rewards

---

## 🔐 Security & Privacy

### RLS Policies
- **rewards table**: Public read access (catalog is public)
- **player_rewards table**:
  - Managers: Full access to their team's player rewards
  - Parents: Read access to children's rewards (if `show_awards = true`)
  - Write access: Manager-only

### Privacy Settings
Parents can only view rewards if player's privacy settings allow:
```typescript
privacy_settings: {
  show_awards: true  // Must be true for parent access
}
```

---

## 📊 Database Schema

### rewards
```sql
- id: UUID (PK)
- name: TEXT (UNIQUE)
- description: TEXT
- reward_type: TEXT (match | season | leadership)
- criteria_event_type: TEXT (goal | assist | tackle | save | NULL)
- criteria_threshold: INTEGER
- criteria_scope: TEXT (single_match | season | career | special)
- icon: TEXT (emoji)
- metadata: JSONB (complex criteria)
- created_at: TIMESTAMPTZ
```

### player_rewards
```sql
- id: UUID (PK)
- player_id: UUID (FK -> players)
- reward_id: UUID (FK -> rewards)
- achieved_date: TIMESTAMPTZ
- match_id: UUID (FK -> matches, nullable)
- metadata: JSONB (context when earned)
- created_at: TIMESTAMPTZ
- UNIQUE(player_id, reward_id, match_id)
```

---

## 🎨 UI Features

### Filters
- **Status**: All / Earned / Locked (via tabs)
- **Type**: All / Match / Season / Leadership (tabbed filtering)

### Visual Design
- **Color-coded badges**:
  - Blue: Match-based
  - Purple: Season-based
  - Amber: Leadership
  - Gray: Locked
- **Progress bars** for ALL rewards:
  - Locked: Blue-to-purple gradient showing current/target
  - Earned: Green gradient (full) showing achievement criteria
- **Celebration UI** for newly unlocked rewards
- **Summary Cards**: Breakdown by reward type with counts

### Responsive
- Mobile-first design
- Grid layout adapts to screen size (1-3 columns)
- Touch-friendly buttons and cards
- Tabbed interface for better organization

---

## 🧪 Testing the System

### Quick Test Flow
1. Create a test match with 2-3 players
2. Log 3 goals for Player A (should unlock "Hat Trick Hero")
3. Make Player B captain
4. End match and select Player B as POTM
5. System should unlock:
   - Player A: "Goal Scorer" + "Hat Trick Hero"
   - Player B: "Captain's Debut" + "Double Honor"
6. Check MatchSummary for celebration UI
7. Visit Rewards tab to see progress

---

## 🚀 Future Enhancements (Optional)

### Potential Additions
- [ ] Custom reward creation (manager can define team-specific rewards)
- [ ] Reward images/badges instead of emojis
- [ ] Email notifications when rewards are unlocked
- [ ] Reward categories/collections (e.g., "Striker Collection")
- [ ] Seasonal reward reset functionality
- [ ] Export rewards to PDF/image for sharing
- [ ] Reward rarity levels (common/rare/legendary)
- [ ] Comparative rewards ("Most Improved Player")

### Analytics Ideas
- [ ] Reward unlock rate dashboard
- [ ] Most popular rewards
- [ ] Player motivation tracking
- [ ] Team engagement metrics

---

## 📝 Notes

- **Performance**: Reward evaluation runs after match completion only (not real-time)
- **Duplicates**: UNIQUE constraint prevents same reward from being awarded twice for same match
- **Season tracking**: Uses `team.season` field to group season-based rewards
- **Extensibility**: Metadata JSONB field allows for future complex criteria without schema changes

---

## ✅ Production Ready
- All components tested and working
- No TypeScript errors
- RLS policies in place
- API routes secured
- Privacy controls implemented
- Mobile responsive

**Status**: 🟢 Ready for Production Use

---

## 🎯 Final Implementation Highlights (Oct 2025)

### Manager Experience
- Access rewards through individual player detail pages
- Click any player name in team roster to view their profile
- Player page has 3 tabs: Overview, Matches, **Rewards**
- Full gallery view with summary, progress tracking, and filtering
- Team-level view focuses on roster management, matches, and collective stats

### Parent Experience
- Full rewards gallery in child's profile (Rewards tab)
- Summary cards showing breakdown by reward type
- "Close to Unlocking" section highlighting top 3 nearest rewards
- All rewards displayed with tabs for filtering (All/Match/Season/Leadership)
- Privacy-aware access controlled by `show_awards` setting

### Visual Enhancements
- **Earned Rewards**: Show full green progress bar + achievement criteria
  - Example: "Achieved: 3 goals" with 100% green bar
- **Locked Rewards**: Show progress toward goal
  - Example: "Progress: 3/5 saves" with 60% blue-purple bar
- **Smart Text Extraction**: Automatically formats criteria text
  - Event-based: "3 goals", "10 tackles"
  - Special: "Captain + POTM in same game"

### Technical Achievements
- Fixed parent API access using `get_parent_children` RPC function
- Fixed reward evaluator Promise handling in season event counting
- Consistent player detail experience for both managers and parents
- Fully responsive grid layouts with mobile-first design

**Last Updated**: 2025-10-19
