import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { evaluateMatchRewards } from '@/lib/services/rewardEvaluator';

/**
 * POST /api/teams/[teamId]/matches/[matchId]/evaluate-rewards
 * Trigger reward evaluation after match completion
 * This endpoint is called after Player of the Match is selected
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; matchId: string }> }
) {
  try {
    const { teamId, matchId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is the team manager
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('manager_id')
      .eq('id', teamId)
      .eq('is_active', true)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.manager_id !== user.id) {
      return NextResponse.json(
        { error: 'Only team managers can trigger reward evaluation' },
        { status: 403 }
      );
    }

    // Verify match exists and belongs to this team
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, status, team_id')
      .eq('id', matchId)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only evaluate rewards for completed matches' },
        { status: 400 }
      );
    }

    // Run reward evaluation
    const result = await evaluateMatchRewards(supabase, matchId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Reward evaluation completed with errors',
          errors: result.errors,
          newRewards: result.newRewards,
        },
        { status: 207 } // Multi-Status: partial success
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully evaluated rewards. ${result.newRewards.length} new reward(s) unlocked.`,
        newRewards: result.newRewards,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/teams/[teamId]/matches/[matchId]/evaluate-rewards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
