import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET active event types
export async function GET() {
  try {
    const supabase = await createClient();

    // Check user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active event types
    const { data: eventTypes, error } = await supabase
      .from('event_types')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(eventTypes || []);
  } catch (error) {
    console.error('Error fetching active event types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event types' },
      { status: 500 }
    );
  }
}
