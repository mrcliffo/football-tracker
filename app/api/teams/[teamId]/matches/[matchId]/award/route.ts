import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for match award
const matchAwardSchema = z.object({
  playerId: z.string().uuid(),
  notes: z.string().optional(),
});

// GET /api/teams/[teamId]/matches/[matchId]/award - Get Player of the Match award
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

    // Get award with player info
    const { data: award, error } = await supabase
      .from('match_awards')
      .select(`
        *,
        player:players(id, name, squad_number, position)
      `)
      .eq('match_id', matchId)
      .eq('award_type', 'player_of_match')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is ok
      console.error('Error fetching award:', error);
      return NextResponse.json({ error: 'Failed to fetch award' }, { status: 500 });
    }

    return NextResponse.json({ award: award || null });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/matches/[matchId]/award:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teams/[teamId]/matches/[matchId]/award - Create/Update Player of the Match award
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
      return NextResponse.json({ error: 'Only team managers can set Player of the Match' }, { status: 403 });
    }

    // Verify match exists and is completed
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

    if (match.status !== 'completed') {
      return NextResponse.json({ error: 'Can only set Player of the Match for completed matches' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = matchAwardSchema.parse(body);

    // Verify player participated in the match
    const { data: matchPlayer, error: matchPlayerError } = await supabase
      .from('match_players')
      .select('id')
      .eq('match_id', matchId)
      .eq('player_id', validatedData.playerId)
      .single();

    if (matchPlayerError || !matchPlayer) {
      return NextResponse.json({ error: 'Player did not participate in this match' }, { status: 400 });
    }

    // Check if award already exists
    const { data: existingAward } = await supabase
      .from('match_awards')
      .select('id')
      .eq('match_id', matchId)
      .eq('award_type', 'player_of_match')
      .single();

    let award;

    if (existingAward) {
      // Update existing award
      const { data, error: updateError } = await supabase
        .from('match_awards')
        .update({
          player_id: validatedData.playerId,
          notes: validatedData.notes || null,
        })
        .eq('id', existingAward.id)
        .select(`
          *,
          player:players(id, name, squad_number, position)
        `)
        .single();

      if (updateError) {
        console.error('Error updating award:', updateError);
        return NextResponse.json({ error: 'Failed to update award' }, { status: 500 });
      }

      award = data;
    } else {
      // Create new award
      const { data, error: insertError } = await supabase
        .from('match_awards')
        .insert({
          match_id: matchId,
          player_id: validatedData.playerId,
          award_type: 'player_of_match',
          notes: validatedData.notes || null,
        })
        .select(`
          *,
          player:players(id, name, squad_number, position)
        `)
        .single();

      if (insertError) {
        console.error('Error creating award:', insertError);
        return NextResponse.json({ error: 'Failed to create award' }, { status: 500 });
      }

      award = data;
    }

    return NextResponse.json({ award }, { status: existingAward ? 200 : 201 });
  } catch (error) {
    console.error('Error in POST /api/teams/[teamId]/matches/[matchId]/award:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid award data', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/teams/[teamId]/matches/[matchId]/award - Remove Player of the Match award
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
      return NextResponse.json({ error: 'Only team managers can remove Player of the Match' }, { status: 403 });
    }

    // Delete award
    const { error } = await supabase
      .from('match_awards')
      .delete()
      .eq('match_id', matchId)
      .eq('award_type', 'player_of_match');

    if (error) {
      console.error('Error deleting award:', error);
      return NextResponse.json({ error: 'Failed to delete award' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/teams/[teamId]/matches/[matchId]/award:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
