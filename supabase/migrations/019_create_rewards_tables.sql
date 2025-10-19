-- Create rewards and player_rewards tables for Feature Slice 4: Match Completion & Rewards
-- Implements gamification system with match-based, season-based, and leadership rewards

-- =====================================================
-- REWARDS TABLE: Define available reward types
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('match', 'season', 'leadership')),
    criteria_event_type TEXT, -- goal, assist, tackle, save, or NULL for multi-criteria
    criteria_threshold INTEGER NOT NULL CHECK (criteria_threshold > 0),
    criteria_scope TEXT NOT NULL CHECK (criteria_scope IN ('single_match', 'season', 'career', 'special')),
    icon TEXT DEFAULT '🏆', -- Optional emoji/icon identifier
    metadata JSONB, -- Flexible field for complex criteria (e.g., "all_rounder" requirements)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PLAYER_REWARDS TABLE: Track earned rewards
-- =====================================================
CREATE TABLE IF NOT EXISTS public.player_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
    achieved_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL, -- NULL for season/career rewards
    metadata JSONB, -- Store additional context (e.g., actual count when earned)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_id, reward_id, match_id) -- Prevent duplicate match-based rewards
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_rewards ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: REWARDS TABLE (public read access)
-- =====================================================
CREATE POLICY "Anyone can view rewards definitions"
    ON public.rewards FOR SELECT
    USING (true); -- Rewards catalog is public

-- =====================================================
-- RLS POLICIES: PLAYER_REWARDS TABLE
-- =====================================================

-- Team managers can view player rewards for their team's players
CREATE POLICY "Team managers can view player rewards for their team"
    ON public.player_rewards FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.players
            JOIN public.teams ON teams.id = players.team_id
            WHERE players.id = player_rewards.player_id
            AND teams.manager_id = auth.uid()
        )
    );

-- Team managers can create player rewards for their team's players
CREATE POLICY "Team managers can create player rewards for their team"
    ON public.player_rewards FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.players
            JOIN public.teams ON teams.id = players.team_id
            WHERE players.id = player_rewards.player_id
            AND teams.manager_id = auth.uid()
        )
    );

-- Team managers can delete player rewards for their team's players (for corrections)
CREATE POLICY "Team managers can delete player rewards for their team"
    ON public.player_rewards FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.players
            JOIN public.teams ON teams.id = players.team_id
            WHERE players.id = player_rewards.player_id
            AND teams.manager_id = auth.uid()
        )
    );

-- Parents can view their children's rewards (respecting privacy settings)
CREATE POLICY "Parents can view their children's rewards"
    ON public.player_rewards FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            JOIN public.players p ON p.id = tm.player_id
            WHERE tm.user_id = auth.uid()
            AND tm.player_id = player_rewards.player_id
            AND (p.privacy_settings->>'show_awards')::boolean = true
        )
    );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_rewards_type ON public.rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_rewards_criteria_event ON public.rewards(criteria_event_type);
CREATE INDEX IF NOT EXISTS idx_rewards_criteria_scope ON public.rewards(criteria_scope);

CREATE INDEX IF NOT EXISTS idx_player_rewards_player_id ON public.player_rewards(player_id);
CREATE INDEX IF NOT EXISTS idx_player_rewards_reward_id ON public.player_rewards(reward_id);
CREATE INDEX IF NOT EXISTS idx_player_rewards_match_id ON public.player_rewards(match_id);
CREATE INDEX IF NOT EXISTS idx_player_rewards_achieved_date ON public.player_rewards(achieved_date);

-- Composite index for checking if player already has a reward
CREATE INDEX IF NOT EXISTS idx_player_rewards_unique_check ON public.player_rewards(player_id, reward_id);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE public.rewards IS 'Catalog of all available rewards/achievements in the system';
COMMENT ON COLUMN public.rewards.reward_type IS 'Category: match (single match), season (season aggregate), leadership (captain/awards)';
COMMENT ON COLUMN public.rewards.criteria_event_type IS 'Event type to count (goal, assist, tackle, save) or NULL for multi-criteria';
COMMENT ON COLUMN public.rewards.criteria_threshold IS 'Number required to unlock (e.g., 3 for Hat Trick Hero)';
COMMENT ON COLUMN public.rewards.criteria_scope IS 'Context: single_match, season, career, or special (custom logic)';
COMMENT ON COLUMN public.rewards.metadata IS 'JSONB for complex criteria (e.g., all_rounder: {goal:1, assist:1, tackle:1})';

COMMENT ON TABLE public.player_rewards IS 'Junction table tracking which rewards each player has earned';
COMMENT ON COLUMN public.player_rewards.match_id IS 'Match where reward was earned (NULL for season/career rewards)';
COMMENT ON COLUMN public.player_rewards.metadata IS 'Context when earned (e.g., {"goals_count": 5} for a hat trick in a 5-goal match)';

-- =====================================================
-- SEED INITIAL REWARDS DATA
-- =====================================================

-- Match-Based Rewards
INSERT INTO public.rewards (name, description, reward_type, criteria_event_type, criteria_threshold, criteria_scope, icon) VALUES
('Goal Scorer', 'Score at least 1 goal in a match', 'match', 'goal', 1, 'single_match', '⚽'),
('Hat Trick Hero', 'Score 3 goals in a single match', 'match', 'goal', 3, 'single_match', '🎩'),
('Super Saver', 'Make 5 saves in a single match', 'match', 'save', 5, 'single_match', '🧤'),
('Assist Ace', 'Provide 3 assists in a single match', 'match', 'assist', 3, 'single_match', '🎯'),
('Tackle Titan', 'Complete 10 tackles in a single match', 'match', 'tackle', 10, 'single_match', '🛡️'),
('Shot Stopper', 'Make 5 saves in a single match', 'match', 'save', 5, 'single_match', '✋')
ON CONFLICT (name) DO NOTHING;

-- All Rounder (special multi-criteria match reward)
INSERT INTO public.rewards (name, description, reward_type, criteria_event_type, criteria_threshold, criteria_scope, icon, metadata) VALUES
('All Rounder', 'Record at least 1 goal, 1 assist, and 1 tackle in a single match', 'match', NULL, 1, 'special', '⭐',
 '{"requires": {"goal": 1, "assist": 1, "tackle": 1}}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Season-Based Rewards
INSERT INTO public.rewards (name, description, reward_type, criteria_event_type, criteria_threshold, criteria_scope, icon) VALUES
('30 Goal Season', 'Score 30 goals in a single season', 'season', 'goal', 30, 'season', '🔥'),
('Playmaker Pro', 'Provide 20 assists in a single season', 'season', 'assist', 20, 'season', '🎮'),
('Defensive Wall', 'Complete 50 tackles in a single season', 'season', 'tackle', 50, 'season', '🧱'),
('Goal Guardian', 'Make 20 saves in a single season', 'season', 'save', 20, 'season', '🥅'),
('Defender''s Pride', 'Complete 100 tackles in a single season', 'season', 'tackle', 100, 'season', '💪')
ON CONFLICT (name) DO NOTHING;

-- Season Legend (special - total events)
INSERT INTO public.rewards (name, description, reward_type, criteria_event_type, criteria_threshold, criteria_scope, icon, metadata) VALUES
('Season Legend', 'Record 200 total events (goals, assists, tackles, saves) in a single season', 'season', NULL, 200, 'special', '👑',
 '{"requires": {"total_events": 200}}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Leadership Rewards
INSERT INTO public.rewards (name, description, reward_type, criteria_event_type, criteria_threshold, criteria_scope, icon, metadata) VALUES
('Captain''s Debut', 'Selected as team captain for the first time', 'leadership', NULL, 1, 'special', '🔰',
 '{"requires": {"captain_count": 1}}'::jsonb),
('Club Captain', 'Selected as team captain 5 times', 'leadership', NULL, 5, 'special', 'Ⓒ',
 '{"requires": {"captain_count": 5}}'::jsonb),
('Team Leader', 'Selected as team captain 10 times', 'leadership', NULL, 10, 'special', '👑',
 '{"requires": {"captain_count": 10}}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Double Honor (special - captain + POTM in same match)
INSERT INTO public.rewards (name, description, reward_type, criteria_event_type, criteria_threshold, criteria_scope, icon, metadata) VALUES
('Double Honor', 'Be selected as both Captain and Player of the Match in the same game', 'leadership', NULL, 1, 'special', '🏅',
 '{"requires": {"captain_and_potm_same_match": true}}'::jsonb)
ON CONFLICT (name) DO NOTHING;
