-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position TEXT,
    squad_number INTEGER CHECK (squad_number >= 1 AND squad_number <= 99),
    date_of_birth DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(team_id, squad_number)
);

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Create policies for players
CREATE POLICY "Team managers and members can view players"
    ON public.players FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE teams.id = players.team_id
            AND (
                teams.manager_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.team_members
                    WHERE team_members.team_id = teams.id
                    AND team_members.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Team managers can create players"
    ON public.players FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE teams.id = players.team_id
            AND teams.manager_id = auth.uid()
        )
    );

CREATE POLICY "Team managers can update players"
    ON public.players FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE teams.id = players.team_id
            AND teams.manager_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE teams.id = players.team_id
            AND teams.manager_id = auth.uid()
        )
    );

CREATE POLICY "Team managers can delete players"
    ON public.players FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE teams.id = players.team_id
            AND teams.manager_id = auth.uid()
        )
    );

-- Create trigger for players updated_at
CREATE TRIGGER set_updated_at_players
    BEFORE UPDATE ON public.players
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_is_active ON public.players(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_players_squad_number ON public.players(team_id, squad_number);
