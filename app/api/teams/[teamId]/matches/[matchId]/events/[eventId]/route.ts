import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE /api/teams/[teamId]/matches/[matchId]/events/[eventId] - Delete an event (undo)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; matchId: string; eventId: string }> }
) {
  try {
    const { teamId, matchId, eventId } = await params;
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
      return NextResponse.json({ error: 'Only team managers can delete events' }, { status: 403 });
    }

    // Delete event
    const { error } = await supabase
      .from('match_events')
      .delete()
      .eq('id', eventId)
      .eq('match_id', matchId);

    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/teams/[teamId]/matches/[matchId]/events/[eventId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
