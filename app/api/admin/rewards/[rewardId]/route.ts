import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRewardSchema } from '@/lib/schemas/reward';

// GET /api/admin/rewards/[rewardId] - Get a specific reward
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  try {
    const { rewardId } = await params;
    const supabase = await createClient();

    // Verify user is authenticated and is a manager
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can access admin features' }, { status: 403 });
    }

    // Fetch reward
    const { data: reward, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .single();

    if (error || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    return NextResponse.json(reward);
  } catch (error) {
    console.error('Error in GET /api/admin/rewards/[rewardId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/rewards/[rewardId] - Update a reward
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  try {
    const { rewardId } = await params;
    const supabase = await createClient();

    // Verify user is authenticated and is a manager
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can access admin features' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createRewardSchema.parse(body);

    // Update reward
    const { data: reward, error } = await supabase
      .from('rewards')
      .update({
        name: validatedData.name,
        description: validatedData.description,
        reward_type: validatedData.rewardType,
        criteria_event_type: validatedData.criteriaEventType || null,
        criteria_threshold: validatedData.criteriaThreshold,
        criteria_scope: validatedData.criteriaScope,
        icon: validatedData.icon || null,
        metadata: validatedData.metadata || null,
      })
      .eq('id', rewardId)
      .select()
      .single();

    if (error) {
      console.error('Error updating reward:', error);
      return NextResponse.json({ error: 'Failed to update reward' }, { status: 500 });
    }

    return NextResponse.json(reward);
  } catch (error) {
    console.error('Error in PUT /api/admin/rewards/[rewardId]:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid reward data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/rewards/[rewardId] - Delete a reward
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  try {
    const { rewardId } = await params;
    const supabase = await createClient();

    // Verify user is authenticated and is a manager
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can access admin features' }, { status: 403 });
    }

    // Check if any players have earned this reward
    const { count } = await supabase
      .from('player_rewards')
      .select('id', { count: 'exact', head: true })
      .eq('reward_id', rewardId);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete reward: ${count} player(s) have already earned it` },
        { status: 400 }
      );
    }

    // Delete reward
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', rewardId);

    if (error) {
      console.error('Error deleting reward:', error);
      return NextResponse.json({ error: 'Failed to delete reward' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/rewards/[rewardId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
