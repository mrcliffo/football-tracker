import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Trophy, Info } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default async function ParentTeamsPage() {
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

  // Group children by team
  const teamsMap = new Map();

  if (children && children.length > 0) {
    children.forEach((child: any) => {
      if (!teamsMap.has(child.team_id)) {
        teamsMap.set(child.team_id, {
          id: child.team_id,
          name: child.team_name,
          age_group: child.age_group,
          season: child.season,
          players: [],
        });
      }

      teamsMap.get(child.team_id).players.push({
        id: child.player_id,
        name: child.player_name,
        squad_number: child.squad_number,
        position: child.position,
        matches_played: child.matches_played,
      });
    });
  }

  const teams = Array.from(teamsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Teams</h1>
        <p className="text-muted-foreground mt-2">
          View teams your children are part of
        </p>
      </div>

      {/* Teams List */}
      {!teams || teams.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You don't have access to any teams yet. Please contact your team manager to
                link your account to your child's player profile.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: any) => (
            <Link key={team.id} href={`/parent/teams/${team.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{team.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {team.age_group && `${team.age_group}`}
                        {team.season && ` • ${team.season}`}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-sm font-bold">
                      <Users className="mr-1 h-3 w-3" />
                      {team.players.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Your Children:</div>
                    <div className="space-y-1">
                      {team.players.map((player: any) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span>{player.name}</span>
                            {player.squad_number && (
                              <Badge variant="outline" className="text-xs">
                                #{player.squad_number}
                              </Badge>
                            )}
                          </div>
                          {player.position && (
                            <span className="text-muted-foreground text-xs">
                              {player.position}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground pt-2">
                      <Trophy className="mr-1 h-3 w-3" />
                      <span>
                        {team.players.reduce((sum: number, p: any) => sum + (p.matches_played || 0), 0)}{' '}
                        total matches played
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>About Your Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Click on any team above to view detailed statistics for your children in that team.
              You can see individual player stats, match history, and achievements.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
