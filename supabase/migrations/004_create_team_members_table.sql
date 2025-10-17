-- Create team_members table (for parent access to teams)
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, team_id, player_id)
);

-- Enable Row Level Security
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for team_members
CREATE POLICY "Users can view their own team memberships"
    ON public.team_members FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Team managers can view team members"
    ON public.team_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE teams.id = team_members.team_id
            AND teams.manager_id = auth.uid()
        )
    );

CREATE POLICY "Team managers can add team members"
    ON public.team_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE teams.id = team_members.team_id
            AND teams.manager_id = auth.uid()
        )
    );

CREATE POLICY "Team managers can remove team members"
    ON public.team_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE teams.id = team_members.team_id
            AND teams.manager_id = auth.uid()
        )
    );

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_player_id ON public.team_members(player_id);
