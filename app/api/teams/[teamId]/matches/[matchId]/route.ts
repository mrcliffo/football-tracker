import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { matchSchema } from '@/lib/schemas/match';

// GET /api/teams/[teamId]/matches/[matchId] - Get a specific match
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

    // Get match with captain and players info
    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        *,
        captain:players!captain_id(id, name, squad_number),
        match_players(
          player:players(id, name, squad_number, position)
        )
      `)
      .eq('id', matchId)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .single();

    if (error || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/matches/[matchId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/teams/[teamId]/matches/[matchId] - Update a match
export async function PATCH(
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
      return NextResponse.json({ error: 'Only team managers can update matches' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = matchSchema.parse(body);

    // Verify captain is in selected players
    if (validatedData.captainId && !validatedData.selectedPlayers.includes(validatedData.captainId)) {
      return NextResponse.json({ error: 'Captain must be one of the selected players' }, { status: 400 });
    }

    // Update match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .update({
        opponent_name: validatedData.opponentName,
        match_date: validatedData.matchDate,
        match_time: validatedData.matchTime || null,
        number_of_periods: validatedData.numberOfPeriods,
        captain_id: validatedData.captainId || null,
      })
      .eq('id', matchId)
      .eq('team_id', teamId)
      .select()
      .single();

    if (matchError) {
      console.error('Error updating match:', matchError);
      return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
    }

    // Delete existing match players
    await supabase.from('match_players').delete().eq('match_id', matchId);

    // Add updated players to match
    const matchPlayers = validatedData.selectedPlayers.map((playerId) => ({
      match_id: matchId,
      player_id: playerId,
      is_captain: playerId === validatedData.captainId,
    }));

    const { error: playersError } = await supabase
      .from('match_players')
      .insert(matchPlayers);

    if (playersError) {
      console.error('Error updating match players:', playersError);
      return NextResponse.json({ error: 'Failed to update match players' }, { status: 500 });
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error('Error in PATCH /api/teams/[teamId]/matches/[matchId]:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid match data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/teams/[teamId]/matches/[matchId] - Soft delete a match
export async function DELETE(
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
      return NextResponse.json({ error: 'Only team managers can delete matches' }, { status: 403 });
    }

    // Soft delete match
    const { error } = await supabase
      .from('matches')
      .update({ is_active: false })
      .eq('id', matchId)
      .eq('team_id', teamId);

    if (error) {
      console.error('Error deleting match:', error);
      return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/teams/[teamId]/matches/[matchId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
