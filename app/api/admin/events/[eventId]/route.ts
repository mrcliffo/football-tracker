import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateEventTypeSchema = z.object({
  name: z.string().min(1).regex(/^[a-z_]+$/, 'Name must be lowercase with underscores only'),
  display_name: z.string().min(1),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

// PUT update event type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const supabase = await createClient();
    const { eventId } = await params;

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
    const validatedData = updateEventTypeSchema.parse(body);

    // Update event type
    const { data: updatedEvent, error } = await supabase
      .from('event_types')
      .update({
        display_name: validatedData.display_name,
        description: validatedData.description,
        icon: validatedData.icon,
        is_active: validatedData.is_active ?? true,
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;

    if (!updatedEvent) {
      return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
    }

    return NextResponse.json(updatedEvent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating event type:', error);
    return NextResponse.json(
      { error: 'Failed to update event type' },
      { status: 500 }
    );
  }
}

// DELETE event type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const supabase = await createClient();
    const { eventId } = await params;

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

    // Check if event type is being used in any match events
    const { count } = await supabase
      .from('match_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', eventId);

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete event type that is being used in match events',
          usageCount: count,
        },
        { status: 400 }
      );
    }

    // Delete event type
    const { error } = await supabase.from('event_types').delete().eq('id', eventId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event type:', error);
    return NextResponse.json(
      { error: 'Failed to delete event type' },
      { status: 500 }
    );
  }
}
