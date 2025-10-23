-- Migration 023: Add UPDATE policy for match_reports
-- Allow managers to regenerate (update) match reports

-- Managers can update reports for their team's matches
DROP POLICY IF EXISTS "Managers can update match reports for their teams" ON match_reports;
CREATE POLICY "Managers can update match reports for their teams"
  ON match_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      INNER JOIN teams t ON m.team_id = t.id
      WHERE m.id = match_reports.match_id
        AND t.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m
      INNER JOIN teams t ON m.team_id = t.id
      WHERE m.id = match_reports.match_id
        AND t.manager_id = auth.uid()
    )
  );

-- Add comment
COMMENT ON POLICY "Managers can update match reports for their teams" ON match_reports IS 'Allows managers to regenerate match reports';
