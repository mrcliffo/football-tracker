import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default async function AdminPage() {
  const supabase = await createClient();

  // Get counts for overview
  const { count: eventTypesCount } = await supabase
    .from('match_events')
    .select('event_type', { count: 'exact', head: true });

  const { count: rewardsCount } = await supabase
    .from('rewards')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Admin Overview</h2>
        <p className="text-muted-foreground">
          Welcome to the admin panel. Manage your football tracking system configuration.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/admin/events">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Manage Events
                <ArrowRight className="h-5 w-5" />
              </CardTitle>
              <CardDescription>
                Configure which events can be logged during matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{eventTypesCount || 0}</div>
              <p className="text-sm text-muted-foreground">Total events logged</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/rewards">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Manage Rewards
                <ArrowRight className="h-5 w-5" />
              </CardTitle>
              <CardDescription>
                Add, edit, and remove rewards for player achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{rewardsCount || 0}</div>
              <p className="text-sm text-muted-foreground">Active rewards</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
