import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { playerSchema } from '@/lib/schemas/player';

// GET /api/teams/[teamId]/players - Get all players for a team
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

    // Get players for this team
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching players:', error);
      return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
    }

    return NextResponse.json({ players });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/players:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teams/[teamId]/players - Create a new player
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
      return NextResponse.json({ error: 'Only team managers can add players' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = playerSchema.parse(body);

    // Check if squad number is already taken
    if (validatedData.squadNumber) {
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('team_id', teamId)
        .eq('squad_number', validatedData.squadNumber)
        .eq('is_active', true)
        .single();

      if (existingPlayer) {
        return NextResponse.json(
          { error: `Squad number ${validatedData.squadNumber} is already taken` },
          { status: 400 }
        );
      }
    }

    // Create player
    const { data: player, error } = await supabase
      .from('players')
      .insert({
        team_id: teamId,
        name: validatedData.name,
        position: validatedData.position || null,
        squad_number: validatedData.squadNumber || null,
        date_of_birth: validatedData.dateOfBirth || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating player:', error);
      return NextResponse.json({ error: 'Failed to create player' }, { status: 500 });
    }

    return NextResponse.json({ player }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/teams/[teamId]/players:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid player data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
