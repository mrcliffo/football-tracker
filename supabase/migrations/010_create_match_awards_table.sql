-- Create match_awards table for Feature Slice 4: Match Completion & Rewards
-- Simplified to only track Player of the Match

CREATE TABLE IF NOT EXISTS public.match_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    award_type TEXT NOT NULL DEFAULT 'player_of_match' CHECK (award_type = 'player_of_match'),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(match_id, award_type)
);

-- Enable Row Level Security
ALTER TABLE public.match_awards ENABLE ROW LEVEL SECURITY;

-- Create policies for match_awards
CREATE POLICY "Team managers can view awards for their team's matches"
    ON public.match_awards FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.matches
            JOIN public.teams ON teams.id = matches.team_id
            WHERE matches.id = match_awards.match_id
            AND teams.manager_id = auth.uid()
        )
    );

CREATE POLICY "Team managers can create awards for their team's matches"
    ON public.match_awards FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.matches
            JOIN public.teams ON teams.id = matches.team_id
            WHERE matches.id = match_awards.match_id
            AND teams.manager_id = auth.uid()
        )
    );

CREATE POLICY "Team managers can update awards for their team's matches"
    ON public.match_awards FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.matches
            JOIN public.teams ON teams.id = matches.team_id
            WHERE matches.id = match_awards.match_id
            AND teams.manager_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.matches
            JOIN public.teams ON teams.id = matches.team_id
            WHERE matches.id = match_awards.match_id
            AND teams.manager_id = auth.uid()
        )
    );

CREATE POLICY "Team managers can delete awards for their team's matches"
    ON public.match_awards FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.matches
            JOIN public.teams ON teams.id = matches.team_id
            WHERE matches.id = match_awards.match_id
            AND teams.manager_id = auth.uid()
        )
    );

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_match_awards_match_id ON public.match_awards(match_id);
CREATE INDEX IF NOT EXISTS idx_match_awards_player_id ON public.match_awards(player_id);
CREATE INDEX IF NOT EXISTS idx_match_awards_award_type ON public.match_awards(award_type);

COMMENT ON TABLE public.match_awards IS 'Stores Player of the Match award for completed matches';
COMMENT ON COLUMN public.match_awards.award_type IS 'Always player_of_match (kept for potential future expansion)';
COMMENT ON COLUMN public.match_awards.notes IS 'Optional notes about why this player was selected as Player of the Match';
