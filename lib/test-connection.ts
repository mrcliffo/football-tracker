import { createClient } from '@/lib/supabase/client';

export async function testConnection() {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Connection error:', error);
      return false;
    }

    console.log('✅ Supabase connection successful!');
    return true;
  } catch (err) {
    console.error('Connection failed:', err);
    return false;
  }
}
