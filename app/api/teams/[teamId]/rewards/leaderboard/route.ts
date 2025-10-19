import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface PlayerRewardCount {
  player_id: string;
  player_name: string;
  squad_number: number | null;
  total_rewards: number;
  match_rewards: number;
  season_rewards: number;
  leadership_rewards: number;
}

/**
 * GET /api/teams/[teamId]/rewards/leaderboard
 * Get team-wide rewards leaderboard showing which players have earned the most rewards
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
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

    // Verify user has access to this team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('manager_id')
      .eq('id', teamId)
      .eq('is_active', true)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is manager or parent with access
    const isManager = team.manager_id === user.id;

    if (!isManager) {
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('team_id', teamId)
        .maybeSingle();

      if (!teamMember) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get all players from this team with their rewards
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, name, squad_number')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('squad_number', { ascending: true });

    if (playersError) {
      console.error('Error fetching players:', playersError);
      return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
    }

    // Get all rewards with their types
    const { data: rewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('id, name, reward_type');

    if (rewardsError) {
      console.error('Error fetching rewards:', rewardsError);
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
    }

    // Create a map of reward types
    const rewardTypesMap = new Map(rewards?.map((r) => [r.id, r.reward_type]) || []);

    // Get all player rewards for this team
    const { data: playerRewards, error: prError } = await supabase
      .from('player_rewards')
      .select('player_id, reward_id')
      .in(
        'player_id',
        players?.map((p) => p.id) || []
      );

    if (prError) {
      console.error('Error fetching player rewards:', prError);
      return NextResponse.json({ error: 'Failed to fetch player rewards' }, { status: 500 });
    }

    // Calculate counts for each player
    const leaderboard: PlayerRewardCount[] = (players || []).map((player) => {
      const playerRewardsList = playerRewards?.filter((pr) => pr.player_id === player.id) || [];

      const matchRewards = playerRewardsList.filter(
        (pr) => rewardTypesMap.get(pr.reward_id) === 'match'
      ).length;

      const seasonRewards = playerRewardsList.filter(
        (pr) => rewardTypesMap.get(pr.reward_id) === 'season'
      ).length;

      const leadershipRewards = playerRewardsList.filter(
        (pr) => rewardTypesMap.get(pr.reward_id) === 'leadership'
      ).length;

      return {
        player_id: player.id,
        player_name: player.name,
        squad_number: player.squad_number,
        total_rewards: playerRewardsList.length,
        match_rewards: matchRewards,
        season_rewards: seasonRewards,
        leadership_rewards: leadershipRewards,
      };
    });

    // Sort by total rewards (descending)
    leaderboard.sort((a, b) => {
      if (b.total_rewards !== a.total_rewards) {
        return b.total_rewards - a.total_rewards;
      }
      // Tie-breaker: squad number
      return (a.squad_number || 999) - (b.squad_number || 999);
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/rewards/leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
