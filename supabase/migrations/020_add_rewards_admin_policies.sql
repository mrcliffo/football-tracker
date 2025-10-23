-- Add RLS policies for managers to administer rewards
-- This allows managers to create, update, and delete rewards from the admin panel

-- =====================================================
-- MANAGER ADMIN POLICIES FOR REWARDS TABLE
-- =====================================================

-- Managers can create new rewards
CREATE POLICY "Managers can create rewards"
    ON public.rewards FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'manager'
        )
    );

-- Managers can update existing rewards
CREATE POLICY "Managers can update rewards"
    ON public.rewards FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'manager'
        )
    );

-- Managers can delete rewards (unless players have earned them - enforced at application level)
CREATE POLICY "Managers can delete rewards"
    ON public.rewards FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'manager'
        )
    );

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY "Managers can create rewards" ON public.rewards IS 'Allows managers to add new rewards via admin panel';
COMMENT ON POLICY "Managers can update rewards" ON public.rewards IS 'Allows managers to edit existing rewards via admin panel';
COMMENT ON POLICY "Managers can delete rewards" ON public.rewards IS 'Allows managers to remove rewards via admin panel (with application-level checks for earned rewards)';
