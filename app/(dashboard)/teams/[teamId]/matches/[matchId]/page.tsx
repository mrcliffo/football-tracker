import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Users, Award } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { PeriodManager } from '@/components/matches/PeriodManager';
import { EventLogger } from '@/components/matches/EventLogger';
import { MatchSummary } from '@/components/matches/MatchSummary';

interface MatchDetailPageProps {
  params: Promise<{
    teamId: string;
    matchId: string;
  }>;
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { teamId, matchId } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in</div>;
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Get match details with captain and players
  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      *,
      captain:players!captain_id(id, name, squad_number),
      match_players(
        player:players(id, name, squad_number, position)
      )
    `)
    .eq('id', matchId)
    .eq('team_id', teamId)
    .eq('is_active', true)
    .single();

  if (error || !match) {
    notFound();
  }

  // Get periods for this match
  const { data: periods } = await supabase
    .from('period_tracking')
    .select('*')
    .eq('match_id', matchId)
    .order('period_number', { ascending: true });

  // Get events for this match
  const { data: events } = await supabase
    .from('match_events')
    .select(`
      *,
      player:players(id, name, squad_number)
    `)
    .eq('match_id', matchId)
    .order('cumulative_time_seconds', { ascending: false });

  const isManager = profile?.role === 'manager';
  const players = match.match_players?.map((mp: any) => mp.player) || [];

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch {
      return timeString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-green-500">In Progress</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center space-x-4">
        <Link href={`/teams/${teamId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Team
          </Button>
        </Link>
      </div>

      {/* Match info card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl">vs {match.opponent_name}</CardTitle>
              <CardDescription className="mt-2 space-y-1">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(match.match_date)}</span>
                  {match.match_time && (
                    <>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>{formatTime(match.match_time)}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{players.length} players</span>
                  {match.captain && (
                    <>
                      <Award className="h-4 w-4 ml-2" />
                      <span>
                        Captain: {match.captain.name}
                        {match.captain.squad_number && ` (#${match.captain.squad_number})`}
                      </span>
                    </>
                  )}
                </div>
              </CardDescription>
            </div>
            <div className="flex flex-col items-end space-y-2">
              {getStatusBadge(match.status)}
              <Badge variant="secondary">
                {match.number_of_periods} Period{match.number_of_periods !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Period Manager and Event Logger - Only for managers */}
      {isManager && match.status !== 'completed' && (
        <>
          <PeriodManager
            teamId={teamId}
            matchId={matchId}
            totalPeriods={match.number_of_periods}
            initialPeriods={periods || []}
            matchStatus={match.status}
          />

          <EventLogger
            teamId={teamId}
            matchId={matchId}
            players={players}
            initialEvents={events || []}
            periods={periods || []}
            matchStatus={match.status}
          />
        </>
      )}

      {/* Match Summary for completed matches */}
      {isManager && match.status === 'completed' && (
        <MatchSummary
          teamId={teamId}
          matchId={matchId}
          players={players}
          events={events || []}
        />
      )}

      {/* Read-only view for parents */}
      {!isManager && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Match event logging is only available to team managers.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
