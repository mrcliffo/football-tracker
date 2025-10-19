import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/parent/children - Get all children for the logged-in parent
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

    // Get all children using the parent_children_view
    const { data: children, error } = await supabase
      .from('parent_children_view')
      .select('*')
      .eq('parent_id', user.id)
      .order('team_name')
      .order('player_name');

    if (error) {
      console.error('Error fetching children:', error);
      return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 });
    }

    return NextResponse.json({ children: children || [] });
  } catch (error) {
    console.error('Error in GET /api/parent/children:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
