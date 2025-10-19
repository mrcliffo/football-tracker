import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/parent/children/[playerId]/stats - Get child's statistics
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

    // Get player details
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*, privacy_settings')
      .eq('id', playerId)
      .eq('is_active', true)
      .single();

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Check privacy settings
    const privacySettings = player.privacy_settings as any;
    if (privacySettings && privacySettings.show_stats_to_parents === false) {
      return NextResponse.json(
        { error: 'Statistics are not available due to privacy settings' },
        { status: 403 }
      );
    }

    // Get player statistics from the view
    const { data: stats, error: statsError } = await supabase
      .from('player_stats_view')
      .select('*')
      .eq('player_id', playerId)
      .single();

    if (statsError) {
      // Player might not have any stats yet
      return NextResponse.json({
        player: {
          id: player.id,
          name: player.name,
          position: player.position,
          squadNumber: player.squad_number,
        },
        stats: {
          matchesPlayed: 0,
          goals: 0,
          assists: 0,
          tackles: 0,
          saves: 0,
          yellowCards: 0,
          redCards: 0,
          playerOfMatchAwards: 0,
          captainAppearances: 0,
        },
      });
    }

    return NextResponse.json({
      player: {
        id: player.id,
        name: player.name,
        position: player.position,
        squadNumber: player.squad_number,
      },
      stats: {
        matchesPlayed: stats.matches_played || 0,
        goals: stats.total_goals || 0,
        assists: stats.total_assists || 0,
        tackles: stats.total_tackles || 0,
        saves: stats.total_saves || 0,
        yellowCards: stats.total_yellow_cards || 0,
        redCards: stats.total_red_cards || 0,
        playerOfMatchAwards: stats.player_of_match_awards || 0,
        captainAppearances: stats.captain_appearances || 0,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/parent/children/[playerId]/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
