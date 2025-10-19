-- Migration: Create match_events table
-- Stores all events that occur during a match (goals, assists, tackles, etc.)

CREATE TABLE IF NOT EXISTS public.match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (
        event_type IN (
            'goal',
            'assist',
            'tackle',
            'save',
            'yellow_card',
            'red_card',
            'substitution_on',
            'substitution_off'
        )
    ),
    cumulative_time_seconds INTEGER NOT NULL CHECK (cumulative_time_seconds >= 0),
    period_number INTEGER NOT NULL CHECK (period_number >= 1),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_match_events_match_id ON public.match_events(match_id);
CREATE INDEX idx_match_events_player_id ON public.match_events(player_id);
CREATE INDEX idx_match_events_event_type ON public.match_events(event_type);
CREATE INDEX idx_match_events_cumulative_time ON public.match_events(match_id, cumulative_time_seconds);

-- RLS Policies
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- Allow team managers to view events for their matches
CREATE POLICY "Managers can view events for their matches"
    ON public.match_events
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.matches m
            JOIN public.teams t ON m.team_id = t.id
            WHERE m.id = match_events.match_id
            AND t.manager_id = auth.uid()
        )
    );

-- Allow managers to insert events
CREATE POLICY "Managers can insert events"
    ON public.match_events
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.matches m
            JOIN public.teams t ON m.team_id = t.id
            WHERE m.id = match_events.match_id
            AND t.manager_id = auth.uid()
        )
    );

-- Allow managers to update events
CREATE POLICY "Managers can update events"
    ON public.match_events
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.matches m
            JOIN public.teams t ON m.team_id = t.id
            WHERE m.id = match_events.match_id
            AND t.manager_id = auth.uid()
        )
    );

-- Allow managers to delete events (for undo functionality)
CREATE POLICY "Managers can delete events"
    ON public.match_events
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.matches m
            JOIN public.teams t ON m.team_id = t.id
            WHERE m.id = match_events.match_id
            AND t.manager_id = auth.uid()
        )
    );

-- Trigger to update updated_at
CREATE TRIGGER update_match_events_updated_at
    BEFORE UPDATE ON public.match_events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Comments
COMMENT ON TABLE public.match_events IS 'Stores all events that occur during a match';
COMMENT ON COLUMN public.match_events.event_type IS 'Type of event: goal, assist, tackle, save, yellow_card, red_card, substitution_on, substitution_off';
COMMENT ON COLUMN public.match_events.cumulative_time_seconds IS 'Time in seconds from the start of the match (cumulative across all periods)';
COMMENT ON COLUMN public.match_events.period_number IS 'Which period this event occurred in';
COMMENT ON COLUMN public.match_events.metadata IS 'Additional event data (e.g., assisted_by for goals, reason for cards)';
