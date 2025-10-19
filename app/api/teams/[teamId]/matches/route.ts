import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { matchSchema } from '@/lib/schemas/match';

// GET /api/teams/[teamId]/matches - Get all matches for a team
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

    // Get matches for this team with captain and players info
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        captain:players!captain_id(id, name, squad_number),
        match_players(
          player:players(id, name, squad_number)
        )
      `)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('match_date', { ascending: true });

    if (error) {
      console.error('Error fetching matches:', error);
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/matches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teams/[teamId]/matches - Create a new match
export async function POST(
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
      return NextResponse.json({ error: 'Only team managers can create matches' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = matchSchema.parse(body);

    // Verify captain is in selected players
    if (validatedData.captainId && !validatedData.selectedPlayers.includes(validatedData.captainId)) {
      return NextResponse.json({ error: 'Captain must be one of the selected players' }, { status: 400 });
    }

    // Create match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        team_id: teamId,
        opponent_name: validatedData.opponentName,
        match_date: validatedData.matchDate,
        match_time: validatedData.matchTime || null,
        number_of_periods: validatedData.numberOfPeriods,
        captain_id: validatedData.captainId || null,
        status: 'scheduled',
      })
      .select()
      .single();

    if (matchError) {
      console.error('Error creating match:', JSON.stringify(matchError, null, 2));
      return NextResponse.json({
        error: 'Failed to create match',
        details: matchError.message || matchError
      }, { status: 500 });
    }

    // Add selected players to match
    const matchPlayers = validatedData.selectedPlayers.map((playerId) => ({
      match_id: match.id,
      player_id: playerId,
      is_captain: playerId === validatedData.captainId,
    }));

    const { error: playersError } = await supabase
      .from('match_players')
      .insert(matchPlayers);

    if (playersError) {
      console.error('Error adding players to match:', playersError);
      // Rollback - delete the match
      await supabase.from('matches').delete().eq('id', match.id);
      return NextResponse.json({ error: 'Failed to add players to match' }, { status: 500 });
    }

    return NextResponse.json({ match }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/teams/[teamId]/matches:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid match data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
