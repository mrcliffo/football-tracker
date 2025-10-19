import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema for linking a parent
const linkParentSchema = z.object({
  parentEmail: z.string().email('Invalid email address'),
});

// GET /api/teams/[teamId]/players/[playerId]/parents - Get linked parents for a player
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
      return NextResponse.json({ error: 'Only team managers can view parent links' }, { status: 403 });
    }

    // Get linked parents for this player
    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select(`
        id,
        user_id,
        created_at,
        profiles:user_id (
          id,
          full_name,
          role
        )
      `)
      .eq('team_id', teamId)
      .eq('player_id', playerId);

    if (error) {
      console.error('Error fetching parent links:', error);
      return NextResponse.json({ error: 'Failed to fetch parent links' }, { status: 500 });
    }

    // Transform data to include parent details
    const parents = teamMembers.map((tm: any) => ({
      linkId: tm.id,
      userId: tm.user_id,
      fullName: tm.profiles?.full_name || 'Unknown',
      role: tm.profiles?.role || 'parent',
      linkedAt: tm.created_at,
    }));

    return NextResponse.json({ parents });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/players/[playerId]/parents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teams/[teamId]/players/[playerId]/parents - Link a parent to a player
export async function POST(
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
      return NextResponse.json({ error: 'Only team managers can link parents' }, { status: 403 });
    }

    // Verify player exists and belongs to this team
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id')
      .eq('id', playerId)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .single();

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = linkParentSchema.parse(body);

    // Find parent user by email using our secure RPC function
    const { data: parentUsers, error: lookupError } = await supabase
      .rpc('find_user_by_email', { search_email: validatedData.parentEmail });

    if (lookupError) {
      console.error('Error looking up parent:', lookupError);
      return NextResponse.json(
        { error: 'Error searching for parent user' },
        { status: 500 }
      );
    }

    if (!parentUsers || parentUsers.length === 0) {
      return NextResponse.json(
        {
          error: 'Parent not found. Please ensure the parent has registered with this email address.',
          hint: 'The parent must create an account with the "parent" role before being linked.'
        },
        { status: 404 }
      );
    }

    const parentProfile = parentUsers[0];

    // Verify the user is actually a parent (already checked in RPC, but double-check)
    if (parentProfile.user_role !== 'parent') {
      return NextResponse.json(
        { error: 'User must have parent role to be linked to a player' },
        { status: 400 }
      );
    }

    // Check if this parent is already linked to this player
    const { data: existingLink } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', parentProfile.user_id)
      .eq('team_id', teamId)
      .eq('player_id', playerId)
      .single();

    if (existingLink) {
      return NextResponse.json(
        { error: 'This parent is already linked to this player' },
        { status: 400 }
      );
    }

    // Create the parent-child link
    const { data: teamMember, error: linkError } = await supabase
      .from('team_members')
      .insert({
        user_id: parentProfile.user_id,
        team_id: teamId,
        player_id: playerId,
      })
      .select()
      .single();

    if (linkError) {
      console.error('Error creating parent link:', linkError);
      return NextResponse.json({ error: 'Failed to link parent to player' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      link: {
        linkId: teamMember.id,
        userId: parentProfile.user_id,
        fullName: parentProfile.user_full_name,
        role: parentProfile.user_role,
        linkedAt: teamMember.created_at,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/teams/[teamId]/players/[playerId]/parents:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
