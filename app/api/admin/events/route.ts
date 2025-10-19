import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const eventTypeSchema = z.object({
  name: z.string().min(1).regex(/^[a-z_]+$/, 'Name must be lowercase with underscores only'),
  display_name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
});

// GET all event types
export async function GET() {
  try {
    const supabase = await createClient();

    // Check user is authenticated and is a manager
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all event types
    const { data: events, error } = await supabase
      .from('event_types')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(events || []);
  } catch (error) {
    console.error('Error fetching event types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event types' },
      { status: 500 }
    );
  }
}

// POST create new event type
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check user is authenticated and is a manager
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = eventTypeSchema.parse(body);

    // Check if event type with this name already exists
    const { data: existing } = await supabase
      .from('event_types')
      .select('id')
      .eq('name', validatedData.name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Event type with this name already exists' },
        { status: 400 }
      );
    }

    // Create event type
    const { data: newEvent, error } = await supabase
      .from('event_types')
      .insert({
        name: validatedData.name,
        display_name: validatedData.display_name,
        description: validatedData.description || null,
        icon: validatedData.icon || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating event type:', error);
    return NextResponse.json(
      { error: 'Failed to create event type' },
      { status: 500 }
    );
  }
}
