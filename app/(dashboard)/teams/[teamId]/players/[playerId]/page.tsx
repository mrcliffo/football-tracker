import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Trophy, Target, HandMetal, Shield, AlertCircle, Award, Crown, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerRewardsSection } from '@/components/rewards/PlayerRewardsSection';

interface PlayerDetailPageProps {
  params: Promise<{
    teamId: string;
    playerId: string;
  }>;
}

export default async function PlayerDetailPage({ params }: PlayerDetailPageProps) {
  const { teamId, playerId } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile to verify they're a manager
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Get team to verify manager access
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .eq('is_active', true)
    .single();

  if (!team || team.manager_id !== user.id) {
    redirect('/teams');
  }

  // Get player details
  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .eq('team_id', teamId)
    .eq('is_active', true)
    .single();

  if (!player) {
    notFound();
  }

  // Get player statistics
  const { data: statsData } = await supabase
    .from('player_stats_view')
    .select('*')
    .eq('player_id', playerId)
    .single();

  const stats = statsData || {
    matches_played: 0,
    total_goals: 0,
    total_assists: 0,
    total_tackles: 0,
    total_saves: 0,
    total_yellow_cards: 0,
    total_red_cards: 0,
    player_of_match_awards: 0,
    captain_appearances: 0,
  };

  // Get match history
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

  let matches: any[] = [];
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

        const eventStats = {
          goals: events?.filter((e) => e.event_type === 'goal').length || 0,
          assists: events?.filter((e) => e.event_type === 'assist').length || 0,
          tackles: events?.filter((e) => e.event_type === 'tackle').length || 0,
          saves: events?.filter((e) => e.event_type === 'save').length || 0,
          yellowCards: events?.filter((e) => e.event_type === 'yellow_card').length || 0,
          redCards: events?.filter((e) => e.event_type === 'red_card').length || 0,
        };

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

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link href={`/teams/${teamId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Team
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
                <span>{team.name}</span>
                {team.age_group && (
                  <>
                    <span>•</span>
                    <span>{team.age_group}</span>
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
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Matches Played</CardDescription>
                <CardTitle className="text-3xl">{stats.matches_played || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Goals</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Target className="h-6 w-6 text-green-600" />
                  {stats.total_goals || 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Assists</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <HandMetal className="h-6 w-6 text-blue-600" />
                  {stats.total_assists || 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tackles</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Shield className="h-6 w-6 text-purple-600" />
                  {stats.total_tackles || 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Saves</span>
                  <span className="font-medium">{stats.total_saves || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Yellow Cards</span>
                  <span className="font-medium text-yellow-600">
                    {stats.total_yellow_cards || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Red Cards</span>
                  <span className="font-medium text-red-600">
                    {stats.total_red_cards || 0}
                  </span>
                </div>
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
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="mt-6">
          {matches.length === 0 ? (
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
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <p className="text-muted-foreground">Goals</p>
                          <p className="font-bold text-lg">{match.stats.goals}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Assists</p>
                          <p className="font-bold text-lg">{match.stats.assists}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tackles</p>
                          <p className="font-bold text-lg">{match.stats.tackles}</p>
                        </div>
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
          <PlayerRewardsSection
            teamId={teamId}
            playerId={playerId}
            showViewAll={false}
            showFullGallery={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
