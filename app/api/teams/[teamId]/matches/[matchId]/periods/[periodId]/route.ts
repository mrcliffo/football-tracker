import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { endPeriodSchema, pausePeriodSchema } from '@/lib/schemas/event';

// PATCH /api/teams/[teamId]/matches/[matchId]/periods/[periodId] - End or pause a period
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; matchId: string; periodId: string }> }
) {
  try {
    const { teamId, matchId, periodId } = await params;
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
      return NextResponse.json({ error: 'Only team managers can manage periods' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const action = body.action; // 'end', 'pause', or 'resume'

    if (action === 'end') {
      const validatedData = endPeriodSchema.parse(body);

      // End the period
      const { data: period, error: periodError } = await supabase
        .from('period_tracking')
        .update({
          ended_at: new Date().toISOString(),
          cumulative_seconds: validatedData.cumulativeSeconds,
          paused_at: null, // Clear pause if it was paused
        })
        .eq('id', periodId)
        .eq('match_id', matchId)
        .select()
        .single();

      if (periodError) {
        console.error('Error ending period:', periodError);
        return NextResponse.json({ error: 'Failed to end period' }, { status: 500 });
      }

      // Check if this was the last period
      const { data: match } = await supabase
        .from('matches')
        .select('number_of_periods')
        .eq('id', matchId)
        .single();

      const { data: periods } = await supabase
        .from('period_tracking')
        .select('period_number')
        .eq('match_id', matchId)
        .not('ended_at', 'is', null);

      // If all periods are complete, mark match as completed
      if (match && periods && periods.length >= match.number_of_periods) {
        await supabase
          .from('matches')
          .update({ status: 'completed' })
          .eq('id', matchId);
      }

      return NextResponse.json({ period });
    } else if (action === 'pause') {
      const validatedData = pausePeriodSchema.parse(body);

      // Pause the period
      const { data: period, error: periodError } = await supabase
        .from('period_tracking')
        .update({
          paused_at: new Date().toISOString(),
          cumulative_seconds: validatedData.cumulativeSeconds,
        })
        .eq('id', periodId)
        .eq('match_id', matchId)
        .is('ended_at', null) // Can only pause active periods
        .select()
        .single();

      if (periodError) {
        console.error('Error pausing period:', periodError);
        return NextResponse.json({ error: 'Failed to pause period' }, { status: 500 });
      }

      return NextResponse.json({ period });
    } else if (action === 'resume') {
      // Resume the period (clear paused_at)
      const { data: period, error: periodError } = await supabase
        .from('period_tracking')
        .update({
          paused_at: null,
        })
        .eq('id', periodId)
        .eq('match_id', matchId)
        .is('ended_at', null) // Can only resume active periods
        .select()
        .single();

      if (periodError) {
        console.error('Error resuming period:', periodError);
        return NextResponse.json({ error: 'Failed to resume period' }, { status: 500 });
      }

      return NextResponse.json({ period });
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "end", "pause", or "resume"' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in PATCH /api/teams/[teamId]/matches/[matchId]/periods/[periodId]:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid period data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
