'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Trophy, Users } from 'lucide-react';

interface ActiveEventType {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
}

interface PlayerStats {
  player_id: string;
  name: string;
  squad_number: number | null;
  position: string | null;
  matches_played: number;
  player_of_match_awards: number;
  captain_appearances: number;
  [key: string]: any; // Dynamic event type stats
}

interface PlayerStatsListProps {
  playerStats: PlayerStats[];
  activeEventTypes: ActiveEventType[];
}

export function PlayerStatsList({ playerStats, activeEventTypes }: PlayerStatsListProps) {
  // Filter out players who haven't played any matches
  const activePlayers = playerStats.filter(p => p.matches_played > 0);

  if (activePlayers.length === 0) {
    return null;
  }

  // Helper function to get abbreviation for event type
  const getEventAbbreviation = (eventTypeName: string) => {
    if (eventTypeName.includes('goal')) return 'G';
    if (eventTypeName.includes('assist')) return 'A';
    if (eventTypeName.includes('tackle')) return 'T';
    if (eventTypeName.includes('save')) return 'S';
    if (eventTypeName.includes('yellow')) return 'YC';
    if (eventTypeName.includes('red')) return 'RC';
    // For custom event types, use first letter or first two letters
    return eventTypeName.substring(0, 2).toUpperCase();
  };

  // Helper function to get color for event type
  const getEventColor = (eventTypeName: string) => {
    if (eventTypeName.includes('goal')) return 'text-blue-600';
    if (eventTypeName.includes('assist')) return 'text-green-600';
    if (eventTypeName.includes('tackle')) return 'text-orange-600';
    if (eventTypeName.includes('save')) return 'text-purple-600';
    if (eventTypeName.includes('yellow')) return 'text-yellow-600';
    if (eventTypeName.includes('red')) return 'text-red-600';
    return 'text-gray-600';
  };

  // Helper function to check if event type should be shown as badge
  const shouldShowAsBadge = (eventTypeName: string) => {
    return eventTypeName.includes('yellow') || eventTypeName.includes('red');
  };

  // Create legend text
  const legendItems = ['MP = Matches Played'];
  activeEventTypes.forEach(eventType => {
    const abbr = getEventAbbreviation(eventType.name);
    legendItems.push(`${abbr} = ${eventType.display_name}`);
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Users className="mr-2 h-5 w-5" />
        Player Statistics
      </h3>
      <Card>
        <CardHeader>
          <CardDescription>
            Season performance for all players
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left py-3 px-2 font-medium">Player</th>
                  <th className="text-center py-3 px-2 font-medium">MP</th>
                  {activeEventTypes.map(eventType => (
                    <th key={eventType.id} className="text-center py-3 px-2 font-medium">
                      {getEventAbbreviation(eventType.name)}
                    </th>
                  ))}
                  <th className="text-center py-3 px-2 font-medium">Awards</th>
                </tr>
              </thead>
              <tbody>
                {activePlayers.map((player) => (
                  <tr
                    key={player.player_id}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium">
                          {player.name}
                          {player.squad_number && (
                            <span className="text-muted-foreground ml-1">
                              #{player.squad_number}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {player.position && (
                            <Badge variant="outline" className="text-xs">
                              {player.position}
                            </Badge>
                          )}
                          {player.captain_appearances > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Trophy className="h-3 w-3 mr-1" />
                              Captain ({player.captain_appearances})
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2 font-medium">
                      {player.matches_played}
                    </td>
                    {activeEventTypes.map(eventType => {
                      const columnName = `total_${eventType.name}`;
                      const value = player[columnName] || 0;
                      const colorClass = getEventColor(eventType.name);
                      const showAsBadge = shouldShowAsBadge(eventType.name);

                      return (
                        <td key={eventType.id} className="text-center py-3 px-2">
                          {value > 0 ? (
                            showAsBadge ? (
                              <Badge
                                variant="outline"
                                className={
                                  eventType.name.includes('yellow')
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                    : 'bg-red-100 text-red-800 border-red-300'
                                }
                              >
                                {value}
                              </Badge>
                            ) : (
                              <span className={`font-semibold ${colorClass}`}>
                                {value}
                              </span>
                            )
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center py-3 px-2">
                      {player.player_of_match_awards > 0 && (
                        <div className="flex items-center justify-center">
                          <Award className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="font-semibold">
                            {player.player_of_match_awards}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p><strong>Legend:</strong></p>
            <p>{legendItems.join(', ')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
