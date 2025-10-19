import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/teams/[teamId]/rewards
 * List all available rewards from the catalog
 */
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

    // Verify user has access to this team (manager or parent)
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('manager_id')
      .eq('id', teamId)
      .eq('is_active', true)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is manager
    const isManager = team.manager_id === user.id;

    // Check if user is a parent with access to this team
    if (!isManager) {
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('team_id', teamId)
        .maybeSingle();

      if (!teamMember) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get all rewards from catalog
    const { data: rewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .order('reward_type', { ascending: true })
      .order('criteria_threshold', { ascending: true });

    if (rewardsError) {
      console.error('Error fetching rewards:', rewardsError);
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
    }

    return NextResponse.json({ rewards: rewards || [] });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/rewards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
