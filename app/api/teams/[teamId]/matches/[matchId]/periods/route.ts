import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startPeriodSchema } from '@/lib/schemas/event';

// GET /api/teams/[teamId]/matches/[matchId]/periods - Get all periods for a match
export async function GET(
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

    // Get periods for this match
    const { data: periods, error } = await supabase
      .from('period_tracking')
      .select('*')
      .eq('match_id', matchId)
      .order('period_number', { ascending: true });

    if (error) {
      console.error('Error fetching periods:', error);
      return NextResponse.json({ error: 'Failed to fetch periods' }, { status: 500 });
    }

    return NextResponse.json({ periods });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/matches/[matchId]/periods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teams/[teamId]/matches/[matchId]/periods - Start a new period
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
      return NextResponse.json({ error: 'Only team managers can start periods' }, { status: 403 });
    }

    // Verify match exists and belongs to team
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, status')
      .eq('id', matchId)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = startPeriodSchema.parse(body);

    // Check if there's already an active period (not ended)
    const { data: activePeriod } = await supabase
      .from('period_tracking')
      .select('id')
      .eq('match_id', matchId)
      .is('ended_at', null)
      .single();

    if (activePeriod) {
      return NextResponse.json(
        { error: 'Cannot start a new period while another period is active' },
        { status: 400 }
      );
    }

    // Create period
    const { data: period, error: periodError } = await supabase
      .from('period_tracking')
      .insert({
        match_id: matchId,
        period_number: validatedData.periodNumber,
        cumulative_seconds: validatedData.cumulativeSeconds,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (periodError) {
      console.error('Error creating period:', periodError);
      return NextResponse.json({ error: 'Failed to start period' }, { status: 500 });
    }

    // Update match status to in_progress if it was scheduled
    if (match.status === 'scheduled') {
      await supabase
        .from('matches')
        .update({ status: 'in_progress' })
        .eq('id', matchId);
    }

    return NextResponse.json({ period }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/teams/[teamId]/matches/[matchId]/periods:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid period data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
