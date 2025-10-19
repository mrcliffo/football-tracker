import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { playerSchema } from '@/lib/schemas/player';

// GET /api/teams/[teamId]/players/[playerId] - Get a specific player
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

    // Get player
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .single();

    if (error || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json({ player });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/players/[playerId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/teams/[teamId]/players/[playerId] - Update a player
export async function PATCH(
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
      return NextResponse.json({ error: 'Only team managers can update players' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = playerSchema.parse(body);

    // Check if squad number is already taken by another player
    if (validatedData.squadNumber) {
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('team_id', teamId)
        .eq('squad_number', validatedData.squadNumber)
        .eq('is_active', true)
        .neq('id', playerId)
        .single();

      if (existingPlayer) {
        return NextResponse.json(
          { error: `Squad number ${validatedData.squadNumber} is already taken` },
          { status: 400 }
        );
      }
    }

    // Update player
    const { data: player, error } = await supabase
      .from('players')
      .update({
        name: validatedData.name,
        position: validatedData.position || null,
        squad_number: validatedData.squadNumber || null,
        date_of_birth: validatedData.dateOfBirth || null,
      })
      .eq('id', playerId)
      .eq('team_id', teamId)
      .select()
      .single();

    if (error) {
      console.error('Error updating player:', error);
      return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
    }

    return NextResponse.json({ player });
  } catch (error) {
    console.error('Error in PATCH /api/teams/[teamId]/players/[playerId]:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid player data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/teams/[teamId]/players/[playerId] - Soft delete a player
export async function DELETE(
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
      return NextResponse.json({ error: 'Only team managers can remove players' }, { status: 403 });
    }

    // Soft delete player
    const { error } = await supabase
      .from('players')
      .update({ is_active: false })
      .eq('id', playerId)
      .eq('team_id', teamId);

    if (error) {
      console.error('Error deleting player:', error);
      return NextResponse.json({ error: 'Failed to remove player' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/teams/[teamId]/players/[playerId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
