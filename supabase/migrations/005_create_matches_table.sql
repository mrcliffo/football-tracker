-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    opponent_name TEXT NOT NULL,
    match_date DATE NOT NULL,
    match_time TIME,
    number_of_periods INTEGER NOT NULL CHECK (number_of_periods >= 1 AND number_of_periods <= 10),
    captain_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create policies for matches
CREATE POLICY "Team managers can view their team's matches"
    ON public.matches FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE teams.id = matches.team_id
            AND teams.manager_id = auth.uid()
        )
    );

CREATE POLICY "Team managers can create matches"
    ON public.matches FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE teams.id = matches.team_id
            AND teams.manager_id = auth.uid()
        )
    );

CREATE POLICY "Team managers can update their team's matches"
    ON public.matches FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE teams.id = matches.team_id
            AND teams.manager_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE teams.id = matches.team_id
            AND teams.manager_id = auth.uid()
        )
    );

CREATE POLICY "Team managers can delete their team's matches"
    ON public.matches FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE teams.id = matches.team_id
            AND teams.manager_id = auth.uid()
        )
    );

-- Create trigger for matches updated_at
CREATE TRIGGER set_updated_at_matches
    BEFORE UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_matches_team_id ON public.matches(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_match_date ON public.matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_is_active ON public.matches(is_active) WHERE is_active = true;
