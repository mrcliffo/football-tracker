import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRewardSchema } from '@/lib/schemas/reward';

// GET /api/admin/rewards - Get all rewards
export async function GET(request: NextRequest) {
  try {
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

    // Fetch all rewards ordered by reward type and name
    const { data: rewards, error } = await supabase
      .from('rewards')
      .select('*')
      .order('reward_type', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching rewards:', error);
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
    }

    return NextResponse.json(rewards);
  } catch (error) {
    console.error('Error in GET /api/admin/rewards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/rewards - Create a new reward
export async function POST(request: NextRequest) {
  try {
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

    // Create reward
    const { data: reward, error } = await supabase
      .from('rewards')
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        reward_type: validatedData.rewardType,
        criteria_event_type: validatedData.criteriaEventType || null,
        criteria_threshold: validatedData.criteriaThreshold,
        criteria_scope: validatedData.criteriaScope,
        icon: validatedData.icon || null,
        metadata: validatedData.metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reward:', error);
      return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
    }

    return NextResponse.json(reward, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/rewards:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid reward data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
