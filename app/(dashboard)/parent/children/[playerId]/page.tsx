import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Trophy, Target, HandMetal, Shield, AlertCircle, Award, Crown, Sparkles, Goal, Crosshair, Save } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlayerRewardsSection } from '@/components/rewards/PlayerRewardsSection';
import { MatchReport } from '@/components/matches/MatchReport';

interface ChildDetailPageProps {
  params: Promise<{
    playerId: string;
  }>;
}

export default async function ChildDetailPage({ params }: ChildDetailPageProps) {
  const { playerId } = await params;
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

  // Verify parent has access to this player
  const { data: link } = await supabase
    .from('team_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('player_id', playerId)
    .single();

  if (!link) {
    notFound();
  }

  // Get player details using the RPC function which bypasses RLS
  const { data: childrenData } = await supabase
    .rpc('get_parent_children', { parent_user_id: user.id });

  const childData = childrenData?.find((c: any) => c.player_id === playerId);

  if (!childData) {
    notFound();
  }

  // Map the RPC result to player object format
  const player = {
    id: childData.player_id,
    name: childData.player_name,
    squad_number: childData.squad_number,
    position: childData.position,
    date_of_birth: childData.date_of_birth,
    privacy_settings: childData.privacy_settings,
    is_active: true,
    team: {
      id: childData.team_id,
      name: childData.team_name,
      age_group: childData.age_group,
      season: childData.season,
    },
  };

  // Check privacy settings
  const privacySettings = player.privacy_settings as any;
  const showStats = privacySettings?.show_stats_to_parents !== false;
  const showMatchHistory = privacySettings?.show_match_history !== false;
  const showAwards = privacySettings?.show_awards !== false;

  // Fetch active event types
  const { data: activeEventTypes } = await supabase
    .from('event_types')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  // Get player statistics
  let stats: any = null;
  if (showStats) {
    const { data: statsData } = await supabase
      .from('player_stats_view')
      .select('*')
      .eq('player_id', playerId)
      .single();

    // Fetch match events to calculate dynamic stats
    const { data: playerEvents } = await supabase
      .from('match_events')
      .select(`
        event_type,
        matches!inner(team_id, status, is_active)
      `)
      .eq('player_id', playerId)
      .eq('matches.is_active', true)
      .eq('matches.status', 'completed');

    // Calculate stats for each active event type
    const dynamicStats: any = {
      matches_played: statsData?.matches_played || 0,
      player_of_match_awards: statsData?.player_of_match_awards || 0,
      captain_appearances: statsData?.captain_appearances || 0,
    };

    activeEventTypes?.forEach((eventType: any) => {
      const columnName = `total_${eventType.name}`;
      dynamicStats[columnName] = playerEvents?.filter((e: any) => e.event_type === eventType.name).length || 0;
    });

    stats = dynamicStats;
  }

  // Get match history
  let matches: any[] = [];
  if (showMatchHistory) {
    const { data: matchPlayers } = await supabase
      .from('match_players')
      .select(`
        is_captain,
        match:matches(
          id,
          opponent_name,
          match_date,
          match_time,
          status
        )
      `)
      .eq('player_id', playerId)
      .order('match(match_date)', { ascending: false });

    if (matchPlayers) {
      // Get events and awards for each match
      const matchesWithDetails = await Promise.all(
        matchPlayers.map(async (mp: any) => {
          const match = mp.match;

          // Get events
          const { data: events } = await supabase
            .from('match_events')
            .select('event_type')
            .eq('match_id', match.id)
            .eq('player_id', playerId);

          // Get award
          const { data: award } = await supabase
            .from('match_awards')
            .select('award_type')
            .eq('match_id', match.id)
            .eq('player_id', playerId)
            .single();

          // Calculate stats for each active event type
          const eventStats: any = {};
          activeEventTypes?.forEach((eventType: any) => {
            eventStats[eventType.name] = events?.filter((e) => e.event_type === eventType.name).length || 0;
          });

          return {
            ...match,
            wasCaptain: mp.is_captain,
            wasPlayerOfMatch: !!award,
            stats: eventStats,
          };
        })
      );

      matches = matchesWithDetails;
    }
  }

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
    if (eventTypeName.includes('goal')) return 'text-green-600';
    if (eventTypeName.includes('assist')) return 'text-blue-600';
    if (eventTypeName.includes('tackle')) return 'text-purple-600';
    if (eventTypeName.includes('save')) return 'text-orange-600';
    if (eventTypeName.includes('yellow')) return 'text-yellow-600';
    if (eventTypeName.includes('red')) return 'text-red-600';
    return 'text-gray-600';
  };

  // Get first 4 active event types for quick stats (to show in cards)
  const quickStatsEventTypes = activeEventTypes?.slice(0, 4) || [];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link href={`/parent/teams/${player.team.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {player.team.name}
          </Button>
        </Link>
      </div>

      {/* Player Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl flex items-center gap-3">
                {player.name}
                {player.squad_number && (
                  <Badge variant="outline" className="text-xl">
                    #{player.squad_number}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-2 flex items-center gap-2">
                <span>{player.team.name}</span>
                {player.team.age_group && (
                  <>
                    <span>•</span>
                    <span>{player.team.age_group}</span>
                  </>
                )}
                {player.position && (
                  <>
                    <span>•</span>
                    <span>{player.position}</span>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs for Overview, Matches, and Rewards */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">
            <Trophy className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="matches">
            <Award className="mr-2 h-4 w-4" />
            Matches
          </TabsTrigger>
          <TabsTrigger value="rewards">
            <Sparkles className="mr-2 h-4 w-4" />
            Rewards
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {!showStats ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Statistics are currently not available due to privacy settings.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Matches Played</CardDescription>
                    <CardTitle className="text-3xl">{stats.matches_played || 0}</CardTitle>
                  </CardHeader>
                </Card>
                {quickStatsEventTypes.map((eventType: any) => {
                  const Icon = getEventIcon(eventType.name);
                  const colorClass = getEventColor(eventType.name);
                  const columnName = `total_${eventType.name}`;
                  const value = stats[columnName] || 0;

                  return (
                    <Card key={eventType.id}>
                      <CardHeader className="pb-2">
                        <CardDescription>{eventType.display_name}</CardDescription>
                        <CardTitle className="text-3xl flex items-center gap-2">
                          <Icon className={`h-6 w-6 ${colorClass}`} />
                          {value}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>

              {/* Detailed Stats */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activeEventTypes?.slice(4).map((eventType: any) => {
                      const columnName = `total_${eventType.name}`;
                      const value = stats[columnName] || 0;
                      const colorClass = getEventColor(eventType.name);

                      return (
                        <div key={eventType.id} className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{eventType.display_name}</span>
                          <span className={`font-medium ${colorClass}`}>
                            {value}
                          </span>
                        </div>
                      );
                    })}
                    {(!activeEventTypes || activeEventTypes.length <= 4) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No additional stats
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Awards & Honors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-600" />
                        Captain Appearances
                      </span>
                      <span className="font-medium">{stats.captain_appearances || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-blue-600" />
                        Player of the Match
                      </span>
                      <span className="font-medium">
                        {stats.player_of_match_awards || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="mt-6">
          {!showMatchHistory ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Match history is currently not available due to privacy settings.
              </AlertDescription>
            </Alert>
          ) : matches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No matches played yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {matches.map((match: any, index: number) => (
                <Card key={match.id || index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          vs {match.opponent_name}
                          {match.wasCaptain && (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="mr-1 h-3 w-3" />
                              Captain
                            </Badge>
                          )}
                          {match.wasPlayerOfMatch && (
                            <Badge variant="default" className="text-xs">
                              <Trophy className="mr-1 h-3 w-3" />
                              POTM
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {new Date(match.match_date).toLocaleDateString()} •{' '}
                          <Badge variant="outline" className="text-xs">
                            {match.status}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {match.status === 'completed' && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        {activeEventTypes?.map((eventType: any) => (
                          <div key={eventType.id}>
                            <p className="text-muted-foreground">{eventType.display_name}</p>
                            <p className="font-bold text-lg">{match.stats[eventType.name] || 0}</p>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 border-t">
                        <MatchReport teamId={player.team.id} matchId={match.id} />
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="mt-6">
          {!showAwards ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Rewards are currently not available due to privacy settings.
              </AlertDescription>
            </Alert>
          ) : (
            <PlayerRewardsSection
              teamId={player.team.id}
              playerId={playerId}
              showViewAll={false}
              showFullGallery={true}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
