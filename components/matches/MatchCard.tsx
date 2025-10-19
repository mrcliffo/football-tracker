import { Match } from '@/lib/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Award } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface MatchCardProps {
  match: Match & {
    captain?: { id: string; name: string; squad_number: number | null } | null;
    match_players?: Array<{
      player: { id: string; name: string; squad_number: number | null };
    }>;
  };
  teamId: string;
}

export function MatchCard({ match, teamId }: MatchCardProps) {
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEE, MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    try {
      // Time comes as HH:MM:SS from database
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch {
      return timeString;
    }
  };

  return (
    <Link href={`/teams/${teamId}/matches/${match.id}`}>
      <Card className="transition-all hover:shadow-md cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">vs {match.opponent_name}</CardTitle>
            {getStatusBadge(match.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(match.match_date)}</span>
              {match.match_time && (
                <>
                  <Clock className="h-4 w-4 ml-2" />
                  <span>{formatTime(match.match_time)}</span>
                </>
              )}
            </div>

            {match.captain && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Award className="h-4 w-4" />
                <span>
                  Captain: {match.captain.name}
                  {match.captain.squad_number && ` (#${match.captain.squad_number})`}
                </span>
              </div>
            )}

            {match.match_players && match.match_players.length > 0 && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{match.match_players.length} player{match.match_players.length !== 1 ? 's' : ''} selected</span>
              </div>
            )}

            <div className="text-muted-foreground">
              {match.number_of_periods} period{match.number_of_periods !== 1 ? 's' : ''}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
