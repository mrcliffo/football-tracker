-- Create match_players table (junction table for match and players)
CREATE TABLE IF NOT EXISTS public.match_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    is_captain BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(match_id, player_id)
);

-- Enable Row Level Security
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

-- Create policies for match_players
CREATE POLICY "Team managers can view their match players"
    ON public.match_players FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.matches
            JOIN public.teams ON teams.id = matches.team_id
            WHERE matches.id = match_players.match_id
            AND teams.manager_id = auth.uid()
        )
    );

CREATE POLICY "Team managers can add players to their matches"
    ON public.match_players FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.matches
            JOIN public.teams ON teams.id = matches.team_id
            WHERE matches.id = match_players.match_id
            AND teams.manager_id = auth.uid()
        )
    );

CREATE POLICY "Team managers can update their match players"
    ON public.match_players FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.matches
            JOIN public.teams ON teams.id = matches.team_id
            WHERE matches.id = match_players.match_id
            AND teams.manager_id = auth.uid()
        )
    );

CREATE POLICY "Team managers can remove players from their matches"
    ON public.match_players FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.matches
            JOIN public.teams ON teams.id = matches.team_id
            WHERE matches.id = match_players.match_id
            AND teams.manager_id = auth.uid()
        )
    );

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON public.match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_player_id ON public.match_players(player_id);
CREATE INDEX IF NOT EXISTS idx_match_players_is_captain ON public.match_players(is_captain) WHERE is_captain = true;

-- Constraint: Only one captain per match
CREATE UNIQUE INDEX idx_match_players_one_captain_per_match
    ON public.match_players(match_id)
    WHERE is_captain = true;
