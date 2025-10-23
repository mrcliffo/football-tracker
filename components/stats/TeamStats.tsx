'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Trophy,
  Info,
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { PlayerStatsList } from './PlayerStatsList';
import { getIconComponent } from '@/lib/utils/iconMapper';

interface TeamStatsProps {
  teamId: string;
}

interface ActiveEventType {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
}

interface TeamTotals {
  totalPlayers: number;
  totalMatches: number;
  [key: string]: number; // Dynamic event type totals
}

interface PlayerStats {
  player_id: string;
  name: string;
  squad_number: number | null;
  position: string | null;
  matches_played: number;
  [key: string]: any; // Dynamic event type stats
}

interface TopPerformer {
  player: PlayerStats;
  eventType: ActiveEventType;
  count: number;
}

export function TeamStats({ teamId }: TeamStatsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamTotals, setTeamTotals] = useState<TeamTotals | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [topPerformers, setTopPerformers] = useState<Record<string, TopPerformer>>({});
  const [activeEventTypes, setActiveEventTypes] = useState<ActiveEventType[]>([]);

  useEffect(() => {
    fetchStats();
  }, [teamId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teams/${teamId}/stats`);

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setTeamTotals(data.teamTotals);
      setPlayerStats(data.playerStats);
      setTopPerformers(data.topPerformers || {});
      setActiveEventTypes(data.activeEventTypes || []);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get color for event type
  const getEventTypeColor = (eventTypeName: string) => {
    if (eventTypeName.includes('goal')) return 'text-green-500';
    if (eventTypeName.includes('assist')) return 'text-blue-500';
    if (eventTypeName.includes('tackle')) return 'text-purple-500';
    if (eventTypeName.includes('save')) return 'text-orange-500';
    if (eventTypeName.includes('yellow')) return 'text-yellow-500';
    if (eventTypeName.includes('red')) return 'text-red-500';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading statistics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!teamTotals || teamTotals.totalMatches === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No statistics available yet. Complete some matches to see team and player statistics.
        </AlertDescription>
      </Alert>
    );
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    description,
  }: {
    title: string;
    value: number;
    icon: any;
    description?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Team Totals */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Team Totals</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Matches Played"
            value={teamTotals.totalMatches}
            icon={Trophy}
            description="Completed matches"
          />
          {activeEventTypes.map((eventType) => {
            const columnName = `total_${eventType.name}`;
            const total = teamTotals[columnName] || 0;
            const average = teamTotals.totalMatches > 0
              ? (total / teamTotals.totalMatches).toFixed(1)
              : '0.0';
            const Icon = getIconComponent(eventType.icon);

            return (
              <StatCard
                key={eventType.id}
                title={`Total ${eventType.display_name}`}
                value={total}
                icon={Icon}
                description={`${average} per match`}
              />
            );
          })}
        </div>
      </div>

      {/* Top Performers */}
      {Object.keys(topPerformers).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Top Performers
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {activeEventTypes.map((eventType) => {
              const topPerformer = topPerformers[eventType.name];
              if (!topPerformer) return null;

              const Icon = getIconComponent(eventType.icon);
              const color = getEventTypeColor(eventType.name);

              return (
                <Card key={eventType.id}>
                  <CardHeader className="pb-3">
                    <CardDescription>Most {eventType.display_name}</CardDescription>
                    <CardTitle className="text-lg">
                      {topPerformer.player.name}
                      {topPerformer.player.squad_number && (
                        <span className="text-sm text-muted-foreground ml-2">
                          #{topPerformer.player.squad_number}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Icon className={`h-5 w-5 ${color}`} />
                      <span className="text-2xl font-bold">
                        {topPerformer.count}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {eventType.display_name.toLowerCase()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Player Statistics List */}
      <PlayerStatsList playerStats={playerStats} activeEventTypes={activeEventTypes} />
    </div>
  );
}
