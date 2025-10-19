-- Feature Slice 5: Player Statistics & Reports
-- Creates a database view to aggregate player statistics from match events

-- Create a view that aggregates player statistics
CREATE OR REPLACE VIEW public.player_stats_view AS
SELECT
    p.id AS player_id,
    p.team_id,
    p.name,
    p.squad_number,
    p.position,
    -- Matches played (count of distinct matches where player participated)
    COUNT(DISTINCT mp.match_id) AS matches_played,
    -- Goals
    COUNT(CASE WHEN me.event_type = 'goal' THEN 1 END) AS total_goals,
    -- Assists
    COUNT(CASE WHEN me.event_type = 'assist' THEN 1 END) AS total_assists,
    -- Tackles
    COUNT(CASE WHEN me.event_type = 'tackle' THEN 1 END) AS total_tackles,
    -- Saves
    COUNT(CASE WHEN me.event_type = 'save' THEN 1 END) AS total_saves,
    -- Yellow cards
    COUNT(CASE WHEN me.event_type = 'yellow_card' THEN 1 END) AS total_yellow_cards,
    -- Red cards
    COUNT(CASE WHEN me.event_type = 'red_card' THEN 1 END) AS total_red_cards,
    -- Player of the Match awards
    COUNT(DISTINCT ma.id) AS player_of_match_awards,
    -- Captain appearances
    COUNT(CASE WHEN m.captain_id = p.id THEN 1 END) AS captain_appearances
FROM
    public.players p
    LEFT JOIN public.match_players mp ON p.id = mp.player_id
    LEFT JOIN public.matches m ON mp.match_id = m.id AND m.is_active = true
    LEFT JOIN public.match_events me ON p.id = me.player_id AND m.id = me.match_id
    LEFT JOIN public.match_awards ma ON p.id = ma.player_id AND m.id = ma.match_id
WHERE
    p.is_active = true
GROUP BY
    p.id, p.team_id, p.name, p.squad_number, p.position;

-- Grant access to authenticated users
GRANT SELECT ON public.player_stats_view TO authenticated;

-- Add comment
COMMENT ON VIEW public.player_stats_view IS 'Aggregated player statistics including goals, assists, tackles, saves, cards, and awards';
