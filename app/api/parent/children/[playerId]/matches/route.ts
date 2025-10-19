import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/parent/children/[playerId]/matches - Get child's match history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a parent
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can access this endpoint' }, { status: 403 });
    }

    // Verify this parent is linked to this player
    const { data: link, error: linkError } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('player_id', playerId)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'You do not have access to this player' }, { status: 403 });
    }

    // Get player details with privacy settings
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, name, privacy_settings')
      .eq('id', playerId)
      .eq('is_active', true)
      .single();

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Check privacy settings
    const privacySettings = player.privacy_settings as any;
    if (privacySettings && privacySettings.show_match_history === false) {
      return NextResponse.json(
        { error: 'Match history is not available due to privacy settings' },
        { status: 403 }
      );
    }

    // Get matches where this player participated
    const { data: matchPlayers, error: matchPlayersError } = await supabase
      .from('match_players')
      .select(`
        match_id,
        is_captain,
        matches (
          id,
          opponent_name,
          match_date,
          match_time,
          status,
          team_id,
          teams (
            name
          )
        )
      `)
      .eq('player_id', playerId)
      .order('matches(match_date)', { ascending: false });

    if (matchPlayersError) {
      console.error('Error fetching matches:', matchPlayersError);
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }

    // Get stats for each match
    const matchesWithStats = await Promise.all(
      (matchPlayers || []).map(async (mp: any) => {
        const match = mp.matches;

        // Get player's events in this match
        const { data: events } = await supabase
          .from('match_events')
          .select('event_type')
          .eq('match_id', match.id)
          .eq('player_id', playerId);

        // Get player of match award if exists
        const { data: award } = await supabase
          .from('match_awards')
          .select('award_type')
          .eq('match_id', match.id)
          .eq('player_id', playerId)
          .single();

        // Count events by type
        const stats = {
          goals: events?.filter((e) => e.event_type === 'goal').length || 0,
          assists: events?.filter((e) => e.event_type === 'assist').length || 0,
          tackles: events?.filter((e) => e.event_type === 'tackle').length || 0,
          saves: events?.filter((e) => e.event_type === 'save').length || 0,
          yellowCards: events?.filter((e) => e.event_type === 'yellow_card').length || 0,
          redCards: events?.filter((e) => e.event_type === 'red_card').length || 0,
        };

        return {
          matchId: match.id,
          opponentName: match.opponent_name,
          matchDate: match.match_date,
          matchTime: match.match_time,
          status: match.status,
          teamName: match.teams?.name || 'Unknown Team',
          wasCaptain: mp.is_captain,
          wasPlayerOfMatch: !!award,
          stats,
        };
      })
    );

    return NextResponse.json({
      player: {
        id: player.id,
        name: player.name,
      },
      matches: matchesWithStats,
    });
  } catch (error) {
    console.error('Error in GET /api/parent/children/[playerId]/matches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
