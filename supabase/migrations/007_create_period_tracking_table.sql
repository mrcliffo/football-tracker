-- Migration: Create period_tracking table
-- Tracks the start and end times of each period in a match
-- Supports cumulative time tracking across all periods

CREATE TABLE IF NOT EXISTS public.period_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    period_number INTEGER NOT NULL CHECK (period_number >= 1),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    cumulative_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one active period per match (no overlapping periods)
    UNIQUE(match_id, period_number)
);

-- Indexes
CREATE INDEX idx_period_tracking_match_id ON public.period_tracking(match_id);
CREATE INDEX idx_period_tracking_period_number ON public.period_tracking(match_id, period_number);

-- RLS Policies
ALTER TABLE public.period_tracking ENABLE ROW LEVEL SECURITY;

-- Allow team managers to view period tracking for their matches
CREATE POLICY "Managers can view period tracking for their matches"
    ON public.period_tracking
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.matches m
            JOIN public.teams t ON m.team_id = t.id
            WHERE m.id = period_tracking.match_id
            AND t.manager_id = auth.uid()
        )
    );

-- Allow managers to insert period tracking
CREATE POLICY "Managers can insert period tracking"
    ON public.period_tracking
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.matches m
            JOIN public.teams t ON m.team_id = t.id
            WHERE m.id = period_tracking.match_id
            AND t.manager_id = auth.uid()
        )
    );

-- Allow managers to update period tracking
CREATE POLICY "Managers can update period tracking"
    ON public.period_tracking
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.matches m
            JOIN public.teams t ON m.team_id = t.id
            WHERE m.id = period_tracking.match_id
            AND t.manager_id = auth.uid()
        )
    );

-- Allow managers to delete period tracking
CREATE POLICY "Managers can delete period tracking"
    ON public.period_tracking
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.matches m
            JOIN public.teams t ON m.team_id = t.id
            WHERE m.id = period_tracking.match_id
            AND t.manager_id = auth.uid()
        )
    );

-- Trigger to update updated_at
CREATE TRIGGER update_period_tracking_updated_at
    BEFORE UPDATE ON public.period_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Comments
COMMENT ON TABLE public.period_tracking IS 'Tracks the start and end times of each period in a match for cumulative time calculation';
COMMENT ON COLUMN public.period_tracking.period_number IS 'The period number (1, 2, 3, etc.)';
COMMENT ON COLUMN public.period_tracking.cumulative_seconds IS 'Total seconds elapsed across all periods up to this point';
COMMENT ON COLUMN public.period_tracking.paused_at IS 'When the period was paused (null if not paused or ended)';
