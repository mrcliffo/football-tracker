import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/parent/teams - Get all teams with linked players for the logged-in parent
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a parent
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can access this endpoint' }, { status: 403 });
    }

    // Get all children using RPC function
    const { data: children, error: childrenError } = await supabase
      .rpc('get_parent_children', { parent_user_id: user.id });

    if (childrenError) {
      console.error('Error fetching children:', childrenError);
      return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 });
    }

    if (!children || children.length === 0) {
      return NextResponse.json({ teams: [] });
    }

    // Group players by team
    const teamsMap = new Map();

    children.forEach((child: any) => {
      if (!teamsMap.has(child.team_id)) {
        teamsMap.set(child.team_id, {
          id: child.team_id,
          name: child.team_name,
          age_group: child.age_group,
          season: child.season,
          players: [],
        });
      }

      teamsMap.get(child.team_id).players.push({
        id: child.player_id,
        name: child.player_name,
        squad_number: child.squad_number,
        position: child.position,
        date_of_birth: child.date_of_birth,
        privacy_settings: child.privacy_settings,
        matches_played: child.matches_played,
      });
    });

    // Convert map to array and sort by team name
    const teams = Array.from(teamsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Error in GET /api/parent/teams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
