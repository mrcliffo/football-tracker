import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE /api/teams/[teamId]/players/[playerId]/parents/[linkId] - Remove parent link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; playerId: string; linkId: string }> }
) {
  try {
    const { teamId, playerId, linkId } = await params;
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
      return NextResponse.json({ error: 'Only team managers can remove parent links' }, { status: 403 });
    }

    // Verify the link exists and belongs to this team/player
    const { data: existingLink, error: checkError } = await supabase
      .from('team_members')
      .select('id')
      .eq('id', linkId)
      .eq('team_id', teamId)
      .eq('player_id', playerId)
      .single();

    if (checkError || !existingLink) {
      return NextResponse.json({ error: 'Parent link not found' }, { status: 404 });
    }

    // Delete the parent link
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', linkId);

    if (deleteError) {
      console.error('Error removing parent link:', deleteError);
      return NextResponse.json({ error: 'Failed to remove parent link' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/teams/[teamId]/players/[playerId]/parents/[linkId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
