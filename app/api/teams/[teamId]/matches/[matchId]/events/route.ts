import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createEventSchema } from '@/lib/schemas/event';

// GET /api/teams/[teamId]/matches/[matchId]/events - Get all events for a match
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

    // Get events for this match with player info
    const { data: events, error } = await supabase
      .from('match_events')
      .select(`
        *,
        player:players(id, name, squad_number)
      `)
      .eq('match_id', matchId)
      .order('cumulative_time_seconds', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/matches/[matchId]/events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teams/[teamId]/matches/[matchId]/events - Log a new event
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
      return NextResponse.json({ error: 'Only team managers can log events' }, { status: 403 });
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

    if (match.status === 'completed') {
      return NextResponse.json({ error: 'Cannot log events for a completed match' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createEventSchema.parse(body);

    // Verify event type is active
    const { data: eventType, error: eventTypeError } = await supabase
      .from('event_types')
      .select('id, is_active')
      .eq('name', validatedData.eventType)
      .single();

    if (eventTypeError || !eventType) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    if (!eventType.is_active) {
      return NextResponse.json(
        { error: 'This event type is currently inactive and cannot be logged' },
        { status: 400 }
      );
    }

    // Verify player is in this match
    const { data: matchPlayer } = await supabase
      .from('match_players')
      .select('player_id')
      .eq('match_id', matchId)
      .eq('player_id', validatedData.playerId)
      .single();

    if (!matchPlayer) {
      return NextResponse.json(
        { error: 'Player is not participating in this match' },
        { status: 400 }
      );
    }

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('match_events')
      .insert({
        match_id: matchId,
        player_id: validatedData.playerId,
        event_type: validatedData.eventType,
        cumulative_time_seconds: validatedData.cumulativeTimeSeconds,
        period_number: validatedData.periodNumber,
        metadata: validatedData.metadata || {},
      })
      .select(`
        *,
        player:players(id, name, squad_number)
      `)
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/teams/[teamId]/matches/[matchId]/events:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid event data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
