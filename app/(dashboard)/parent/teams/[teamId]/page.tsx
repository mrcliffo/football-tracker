import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, TrendingUp, Trophy, Target, HandMetal, Shield, Goal, Crosshair, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ParentTeamDetailPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function ParentTeamDetailPage({ params }: ParentTeamDetailPageProps) {
  const { teamId } = await params;
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
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'parent') {
    redirect('/teams');
  }

  // Get parent's children using RPC function
  const { data: children } = await supabase
    .rpc('get_parent_children', { parent_user_id: user.id });

  if (!children || children.length === 0) {
    notFound();
  }

  // Filter children for this specific team
  const teamChildren = children.filter((child: any) => child.team_id === teamId);

  if (teamChildren.length === 0) {
    notFound();
  }

  // Get team info from first child (all children in same team have same team info)
  const teamInfo = {
    id: teamChildren[0].team_id,
    name: teamChildren[0].team_name,
    age_group: teamChildren[0].age_group,
    season: teamChildren[0].season,
  };

  // Fetch active event types
  const { data: activeEventTypes } = await supabase
    .from('event_types')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  // Get detailed stats for each player
  const playersWithStats = await Promise.all(
    teamChildren.map(async (child: any) => {
      // Get player stats from view
      const { data: statsData } = await supabase
        .from('player_stats_view')
        .select('*')
        .eq('player_id', child.player_id)
        .single();

      // Fetch match events to calculate dynamic stats
      const { data: playerEvents } = await supabase
        .from('match_events')
        .select(`
          event_type,
          matches!inner(team_id, status, is_active)
        `)
        .eq('player_id', child.player_id)
        .eq('matches.is_active', true)
        .eq('matches.status', 'completed');

      // Calculate stats for each active event type
      const dynamicStats: any = {
        player_of_match_awards: statsData?.player_of_match_awards || 0,
        captain_appearances: statsData?.captain_appearances || 0,
      };

      activeEventTypes?.forEach((eventType: any) => {
        const columnName = `total_${eventType.name}`;
        dynamicStats[columnName] = playerEvents?.filter((e: any) => e.event_type === eventType.name).length || 0;
      });

      return {
        id: child.player_id,
        name: child.player_name,
        squad_number: child.squad_number,
        position: child.position,
        matches_played: child.matches_played,
        stats: dynamicStats,
      };
    })
  );

  // Helper functions for dynamic rendering
  const getEventIcon = (eventTypeName: string) => {
    if (eventTypeName.includes('goal')) return Goal;
    if (eventTypeName.includes('assist')) return Crosshair;
    if (eventTypeName.includes('tackle')) return Shield;
    if (eventTypeName.includes('save')) return Save;
    if (eventTypeName.includes('yellow') || eventTypeName.includes('red')) return AlertCircle;
    return Trophy;
  };

  const getEventColor = (eventTypeName: string) => {
    if (eventTypeName.includes('goal')) return 'text-blue-600';
    if (eventTypeName.includes('assist')) return 'text-purple-600';
    if (eventTypeName.includes('tackle')) return 'text-orange-600';
    if (eventTypeName.includes('save')) return 'text-green-600';
    if (eventTypeName.includes('yellow')) return 'text-yellow-600';
    if (eventTypeName.includes('red')) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link href="/parent/teams">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Teams
          </Button>
        </Link>
      </div>

      {/* Team Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl flex items-center gap-3">
                {teamInfo.name}
              </CardTitle>
              <CardDescription className="mt-2 flex items-center gap-2">
                {teamInfo.age_group && <span>{teamInfo.age_group}</span>}
                {teamInfo.season && (
                  <>
                    <span>•</span>
                    <span>{teamInfo.season}</span>
                  </>
                )}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg">
              <Users className="mr-1 h-4 w-4" />
              {playersWithStats.length} {playersWithStats.length === 1 ? 'child' : 'children'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Players List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Children in This Team</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {playersWithStats.map((player) => (
            <Link key={player.id} href={`/parent/children/${player.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{player.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {player.position && `${player.position}`}
                      </CardDescription>
                    </div>
                    {player.squad_number && (
                      <Badge variant="outline" className="text-lg font-bold">
                        #{player.squad_number}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Matches</p>
                          <p className="font-bold">{player.matches_played || 0}</p>
                        </div>
                      </div>
                      {activeEventTypes?.map((eventType: any) => {
                        const Icon = getEventIcon(eventType.name);
                        const colorClass = getEventColor(eventType.name);
                        const columnName = `total_${eventType.name}`;
                        const value = player.stats[columnName] || 0;

                        return (
                          <div key={eventType.id} className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${colorClass}`} />
                            <div>
                              <p className="text-xs text-muted-foreground">{eventType.display_name}</p>
                              <p className="font-bold">{value}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Awards */}
                    {(player.stats.player_of_match_awards > 0 || player.stats.captain_appearances > 0) && (
                      <div className="pt-3 border-t space-y-1">
                        {player.stats.captain_appearances > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Captain</span>
                            <span className="font-medium">{player.stats.captain_appearances}x</span>
                          </div>
                        )}
                        {player.stats.player_of_match_awards > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Trophy className="h-3 w-3" />
                              POTM
                            </span>
                            <span className="font-medium">{player.stats.player_of_match_awards}x</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Team Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Click on any player card above to view their detailed statistics, match history,
            and achievements. This view shows only your children who are part of {teamInfo.name}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
