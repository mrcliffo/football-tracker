import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateRewardProgress } from '@/lib/services/rewardEvaluator';
import type { RewardWithProgress } from '@/lib/types/database';

/**
 * GET /api/teams/[teamId]/players/[playerId]/rewards
 * Get player's earned rewards and progress toward locked rewards
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; playerId: string }> }
) {
  try {
    const { teamId, playerId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get player data via parent RPC function (bypasses RLS)
    const { data: parentChildren } = await supabase
      .rpc('get_parent_children', { parent_user_id: user.id });

    const childData = parentChildren?.find(
      (c: any) => c.player_id === playerId && c.team_id === teamId
    );

    // Check if user is a parent with access to this player
    const isParent = !!childData;

    // Get team to verify manager access and get season
    const { data: team } = await supabase
      .from('teams')
      .select('manager_id, season')
      .eq('id', teamId)
      .eq('is_active', true)
      .maybeSingle();

    const isManager = team?.manager_id === user.id;

    if (!isManager && !isParent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get player data and privacy settings
    let privacySettings: { show_awards?: boolean } | null = null;
    let season: string | undefined;

    if (isParent && childData) {
      // Use data from RPC for parent
      privacySettings = childData.privacy_settings as { show_awards?: boolean } | null;
      season = childData.season || undefined;

      // Check privacy settings for parent access
      if (privacySettings?.show_awards === false) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (isManager) {
      // Manager has full access, just need season
      season = team?.season || undefined;
    }

    // Get all rewards from catalog
    const { data: allRewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .order('reward_type', { ascending: true })
      .order('criteria_threshold', { ascending: true });

    if (rewardsError) {
      console.error('Error fetching rewards:', rewardsError);
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
    }

    // Get player's earned rewards
    const { data: earnedRewards, error: earnedError } = await supabase
      .from('player_rewards')
      .select('*, reward:rewards(*), match:matches(id, opponent_name, match_date)')
      .eq('player_id', playerId)
      .order('achieved_date', { ascending: false });

    if (earnedError) {
      console.error('Error fetching earned rewards:', earnedError);
      return NextResponse.json({ error: 'Failed to fetch earned rewards' }, { status: 500 });
    }

    // Create a set of earned reward IDs
    const earnedRewardIds = new Set(earnedRewards?.map((er) => er.reward_id) || []);

    // Calculate progress for each reward
    const rewardsWithProgress: RewardWithProgress[] = await Promise.all(
      (allRewards || []).map(async (reward) => {
        const isEarned = earnedRewardIds.has(reward.id);

        // Find when this reward was earned (if multiple times, get first one)
        const earnedRecord = earnedRewards?.find((er) => er.reward_id === reward.id);

        if (isEarned) {
          return {
            ...reward,
            is_earned: true,
            earned_at: earnedRecord?.achieved_date,
          };
        }

        // Calculate progress for locked rewards
        const progress = await calculateRewardProgress(
          supabase,
          playerId,
          reward.id,
          season
        );

        return {
          ...reward,
          is_earned: false,
          progress: progress.current,
          progress_total: progress.target,
        };
      })
    );

    return NextResponse.json({
      rewards: rewardsWithProgress,
      earnedRewards: earnedRewards || [],
    });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/players/[playerId]/rewards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
