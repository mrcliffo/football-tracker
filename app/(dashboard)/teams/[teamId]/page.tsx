import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Users, Calendar, Info, CalendarDays, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AddPlayerDialog } from '@/components/players/AddPlayerDialog';
import { EditPlayerDialog } from '@/components/players/EditPlayerDialog';
import { DeletePlayerDialog } from '@/components/players/DeletePlayerDialog';
import { ManageParentsDialog } from '@/components/players/ManageParentsDialog';
import { CreateMatchDialog } from '@/components/matches/CreateMatchDialog';
import { MatchCard } from '@/components/matches/MatchCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamStats } from '@/components/stats/TeamStats';
import { EditTeamDialog } from '@/components/teams/EditTeamDialog';
import { DeleteTeamDialog } from '@/components/teams/DeleteTeamDialog';

interface TeamDetailPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamId } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in</div>;
  }

  // Get team details
  const { data: team, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .eq('is_active', true)
    .single();

  if (error || !team) {
    notFound();
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Get players for this team
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Get matches for this team
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      captain:players!captain_id(id, name, squad_number),
      match_players(
        player:players(id, name, squad_number)
      )
    `)
    .eq('team_id', teamId)
    .eq('is_active', true)
    .order('match_date', { ascending: true });

  const isManager = profile?.role === 'manager';
  const hasPlayers = players && players.length > 0;
  const hasMatches = matches && matches.length > 0;

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center space-x-4">
        <Link href="/teams">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teams
          </Button>
        </Link>
      </div>

      {/* Team info card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl">{team.name}</CardTitle>
              <CardDescription className="mt-2">
                Team details and roster management
              </CardDescription>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <div className="flex items-center space-x-2">
                {team.age_group && (
                  <Badge variant="secondary" className="text-sm">
                    {team.age_group}
                  </Badge>
                )}
                {team.season && (
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{team.season}</span>
                  </div>
                )}
              </div>
              {isManager && (
                <div className="flex space-x-2">
                  <EditTeamDialog team={team} />
                  <DeleteTeamDialog team={team} />
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs for Team, Matches, and Stats */}
      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="team">
            <Users className="mr-2 h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="matches">
            <CalendarDays className="mr-2 h-4 w-4" />
            Matches
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="mr-2 h-4 w-4" />
            Stats
          </TabsTrigger>
        </TabsList>

        {/* Team Tab */}
        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Team Roster
                  </CardTitle>
                  <CardDescription>
                    {hasPlayers
                      ? `${players.length} player${players.length !== 1 ? 's' : ''} in this team`
                      : 'No players added yet'}
                  </CardDescription>
                </div>
                {isManager && <AddPlayerDialog teamId={teamId} />}
              </div>
            </CardHeader>
            <CardContent>
              {!hasPlayers ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {isManager
                      ? 'Get started by adding players to your team roster.'
                      : 'No players have been added to this team yet.'}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Link
                        href={`/teams/${teamId}/players/${player.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <p className="font-medium hover:underline">{player.name}</p>
                        {player.squad_number && (
                          <p className="text-sm text-muted-foreground">
                            #{player.squad_number}
                            {player.position && ` · ${player.position}`}
                          </p>
                        )}
                      </Link>
                      {isManager && (
                        <div className="flex space-x-2">
                          <ManageParentsDialog
                            teamId={teamId}
                            playerId={player.id}
                            playerName={player.name}
                          />
                          <EditPlayerDialog teamId={teamId} player={player} />
                          <DeletePlayerDialog teamId={teamId} player={player} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <CalendarDays className="mr-2 h-5 w-5" />
                    Matches
                  </CardTitle>
                  <CardDescription>
                    {hasMatches
                      ? `${matches.length} match${matches.length !== 1 ? 'es' : ''} scheduled`
                      : 'No matches scheduled yet'}
                  </CardDescription>
                </div>
                {isManager && hasPlayers && (
                  <CreateMatchDialog teamId={teamId} players={players} />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!hasMatches ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {isManager
                      ? hasPlayers
                        ? 'Click "Create Match" to schedule your first match.'
                        : 'Add players to your team before creating matches.'
                      : 'No matches have been scheduled yet.'}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {matches.map((match) => (
                    <MatchCard key={match.id} match={match} teamId={teamId} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-6">
          <TeamStats teamId={teamId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
