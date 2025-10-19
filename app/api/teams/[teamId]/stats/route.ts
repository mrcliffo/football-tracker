import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{
    teamId: string;
  }>;
}

/**
 * GET /api/teams/[teamId]/stats
 * Fetch aggregated team statistics including player stats
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { teamId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify team exists and user has access
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, manager_id')
      .eq('id', teamId)
      .eq('is_active', true)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is the team manager or a team member (for parent access)
    const isManager = team.manager_id === user.id;

    if (!isManager) {
      // Check if user is a parent with access to this team
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

      if (!teamMember) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch active event types
    const { data: activeEventTypes, error: eventTypesError } = await supabase
      .from('event_types')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (eventTypesError) {
      console.error('Error fetching event types:', eventTypesError);
      return NextResponse.json(
        { error: 'Failed to fetch event types' },
        { status: 500 }
      );
    }

    // Fetch player statistics from the view
    const { data: playerStats, error: statsError } = await supabase
      .from('player_stats_view')
      .select('*')
      .eq('team_id', teamId)
      .order('total_goals', { ascending: false });

    if (statsError) {
      console.error('Error fetching player stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch player statistics' },
        { status: 500 }
      );
    }

    // Get actual match count for the team
    const { count: matchCount } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('is_active', true)
      .eq('status', 'completed');

    // Fetch all match events for this team to calculate dynamic stats
    const { data: matchEvents, error: eventsError } = await supabase
      .from('match_events')
      .select(`
        id,
        event_type,
        player_id,
        match_id,
        matches!inner(team_id, status, is_active)
      `)
      .eq('matches.team_id', teamId)
      .eq('matches.is_active', true)
      .eq('matches.status', 'completed');

    if (eventsError) {
      console.error('Error fetching match events:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch match events' },
        { status: 500 }
      );
    }

    // Calculate team totals dynamically based on active event types and actual event data
    const teamTotals: any = {
      totalPlayers: playerStats?.length || 0,
      totalMatches: matchCount || 0,
    };

    // Add totals for each active event type from actual event data
    activeEventTypes?.forEach((eventType: any) => {
      const columnName = `total_${eventType.name}`;
      const total = matchEvents?.filter((e: any) => e.event_type === eventType.name).length || 0;
      teamTotals[columnName] = total;
    });

    // Calculate player-specific stats for each active event type
    const playerStatsWithDynamicEvents = playerStats?.map((player: any) => {
      const enhancedPlayer = { ...player };

      activeEventTypes?.forEach((eventType: any) => {
        const columnName = `total_${eventType.name}`;
        const playerEventCount = matchEvents?.filter(
          (e: any) => e.player_id === player.player_id && e.event_type === eventType.name
        ).length || 0;

        enhancedPlayer[columnName] = playerEventCount;
      });

      return enhancedPlayer;
    }) || [];

    // Find top performers dynamically based on actual event data
    const topPerformers: any = {};
    activeEventTypes?.forEach((eventType: any) => {
      const columnName = `total_${eventType.name}`;
      const topPerformer = [...playerStatsWithDynamicEvents].sort((a: any, b: any) =>
        (b[columnName] || 0) - (a[columnName] || 0))[0];

      if (topPerformer && topPerformer[columnName] > 0) {
        topPerformers[eventType.name] = {
          player: topPerformer,
          eventType: eventType,
          count: topPerformer[columnName],
        };
      }
    });

    return NextResponse.json({
      teamTotals,
      playerStats: playerStatsWithDynamicEvents,
      topPerformers,
      activeEventTypes: activeEventTypes || [],
    });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
