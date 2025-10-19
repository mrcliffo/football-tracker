import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, TrendingUp, Trophy, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function ParentDashboardPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile to verify they're a parent
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'parent') {
    redirect('/teams');
  }

  // Get parent's children using RPC function (bypasses RLS complications)
  const { data: children } = await supabase
    .rpc('get_parent_children', { parent_user_id: user.id });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Children</h1>
        <p className="text-muted-foreground mt-2">
          View your children's football statistics and match history
        </p>
      </div>

      {/* Children List */}
      {!children || children.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You don't have access to any players yet. Please contact your team manager to
                link your account to your child's player profile.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Link key={child.player_id} href={`/parent/children/${child.player_id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{child.player_name}</CardTitle>
                      <CardDescription className="mt-1">
                        {child.team_name}
                        {child.age_group && ` • ${child.age_group}`}
                      </CardDescription>
                    </div>
                    {child.squad_number && (
                      <Badge variant="outline" className="text-lg font-bold">
                        #{child.squad_number}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {child.position && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-2 h-4 w-4" />
                        <span>{child.position}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
                      <span className="font-medium">
                        {child.matches_played} match{child.matches_played !== 1 ? 'es' : ''}{' '}
                        played
                      </span>
                    </div>
                    {child.season && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Trophy className="mr-2 h-4 w-4" />
                        <span>{child.season}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {children.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>About Your Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Click on any of your children above to view their detailed statistics, match history,
              and achievements. All data is updated automatically after each match.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
