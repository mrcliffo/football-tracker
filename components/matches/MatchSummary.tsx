'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Goal, Crosshair, Shield, Save, AlertCircle, Award, Sparkles, Loader2 } from 'lucide-react';
import { Player, MatchEvent, PlayerReward, Reward } from '@/lib/types/database';
import { PlayerOfMatchDialog } from './PlayerOfMatchDialog';
import { RewardBadge } from '@/components/rewards/RewardBadge';
import { MatchReport } from './MatchReport';
import { toast } from 'sonner';

interface ActiveEventType {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
}

interface PlayerStats {
  player: Player;
  eventCounts: Record<string, number>;
}

interface MatchSummaryProps {
  teamId: string;
  matchId: string;
  players: Player[];
  events: MatchEvent[];
}

export function MatchSummary({ teamId, matchId, players, events }: MatchSummaryProps) {
  const [playerOfMatch, setPlayerOfMatch] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAwardDialog, setShowAwardDialog] = useState(false);
  const [newlyUnlockedRewards, setNewlyUnlockedRewards] = useState<(PlayerReward & { reward: Reward; player: Player })[]>([]);
  const [isEvaluatingRewards, setIsEvaluatingRewards] = useState(false);
  const [activeEventTypes, setActiveEventTypes] = useState<ActiveEventType[]>([]);
  const [loadingEventTypes, setLoadingEventTypes] = useState(true);

  // Fetch active event types
  useEffect(() => {
    async function fetchEventTypes() {
      try {
        const response = await fetch('/api/event-types');
        if (response.ok) {
          const data = await response.json();
          setActiveEventTypes(data);
        }
      } catch (error) {
        console.error('Error fetching event types:', error);
      } finally {
        setLoadingEventTypes(false);
      }
    }

    fetchEventTypes();
  }, []);

  // Calculate stats for each player based on active event types
  const playerStats: PlayerStats[] = players.map((player) => {
    const playerEvents = events.filter((e: any) => e.player_id === player.id);
    const eventCounts: Record<string, number> = {};

    // Only count events for active event types
    activeEventTypes.forEach(eventType => {
      eventCounts[eventType.name] = playerEvents.filter((e: any) => e.event_type === eventType.name).length;
    });

    return { player, eventCounts };
  }).filter((stats) => {
    // Only show players who had at least one event from active types
    return Object.values(stats.eventCounts).some(count => count > 0);
  }).sort((a, b) => {
    // Sort by total event count
    const aTotal = Object.values(a.eventCounts).reduce((sum, count) => sum + count, 0);
    const bTotal = Object.values(b.eventCounts).reduce((sum, count) => sum + count, 0);
    return bTotal - aTotal;
  });

  // Calculate team totals based on active event types
  const teamTotals: Record<string, number> = {};
  activeEventTypes.forEach(eventType => {
    teamTotals[eventType.name] = events.filter((e: any) => e.event_type === eventType.name).length;
  });

  // Fetch Player of the Match award
  useEffect(() => {
    async function fetchAward() {
      try {
        const response = await fetch(`/api/teams/${teamId}/matches/${matchId}/award`);
        if (response.ok) {
          const data = await response.json();
          setPlayerOfMatch(data.award);
        }
      } catch (error) {
        console.error('Error fetching award:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAward();
  }, [teamId, matchId]);

  const handleAwardSet = async (award: any) => {
    setPlayerOfMatch(award);
    setShowAwardDialog(false);

    // Trigger reward evaluation after POTM is set
    await evaluateRewards();
  };

  const evaluateRewards = async () => {
    setIsEvaluatingRewards(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/matches/${matchId}/evaluate-rewards`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();

        if (data.newRewards && data.newRewards.length > 0) {
          // Fetch reward details for each new reward
          const rewardsWithDetails = await Promise.all(
            data.newRewards.map(async (pr: PlayerReward) => {
              // Fetch reward details
              const rewardResponse = await fetch(`/api/teams/${teamId}/rewards`);
              const rewardsData = await rewardResponse.json();
              const reward = rewardsData.rewards.find((r: Reward) => r.id === pr.reward_id);

              // Find player
              const player = players.find((p) => p.id === pr.player_id);

              return {
                ...pr,
                reward,
                player,
              };
            })
          );

          setNewlyUnlockedRewards(rewardsWithDetails);

          // Show success toast
          toast.success(`${data.newRewards.length} new reward(s) unlocked!`, {
            description: 'Check the rewards section below',
            icon: <Sparkles className="h-4 w-4" />,
          });
        } else {
          toast.info('No new rewards unlocked this match');
        }
      }
    } catch (error) {
      console.error('Error evaluating rewards:', error);
      toast.error('Failed to evaluate rewards');
    } finally {
      setIsEvaluatingRewards(false);
    }
  };

  // Helper function to get icon and color for event type
  const getEventTypeIcon = (eventTypeName: string) => {
    if (eventTypeName.includes('goal')) return { Icon: Goal, color: 'text-green-500' };
    if (eventTypeName.includes('assist')) return { Icon: Crosshair, color: 'text-blue-500' };
    if (eventTypeName.includes('tackle')) return { Icon: Shield, color: 'text-purple-500' };
    if (eventTypeName.includes('save')) return { Icon: Save, color: 'text-orange-500' };
    if (eventTypeName.includes('yellow')) return { Icon: AlertCircle, color: 'text-yellow-500' };
    if (eventTypeName.includes('red')) return { Icon: AlertCircle, color: 'text-red-500' };
    return { Icon: Trophy, color: 'text-muted-foreground' };
  };

  const getEventTypeBadgeColor = (eventTypeName: string) => {
    if (eventTypeName.includes('goal')) return 'bg-green-500';
    if (eventTypeName.includes('assist')) return 'bg-blue-500';
    if (eventTypeName.includes('tackle')) return 'bg-purple-500';
    if (eventTypeName.includes('save')) return 'bg-orange-500';
    if (eventTypeName.includes('yellow')) return 'bg-yellow-500';
    if (eventTypeName.includes('red')) return 'bg-red-500';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Player of the Match */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span>Player of the Match</span>
              </CardTitle>
              <CardDescription>Recognize outstanding performance</CardDescription>
            </div>
            <Button onClick={() => setShowAwardDialog(true)} size="sm">
              {playerOfMatch ? 'Change' : 'Select'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : playerOfMatch ? (
            <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
              <Trophy className="h-12 w-12 text-yellow-500" />
              <div className="flex-1">
                <p className="font-semibold text-lg">
                  {playerOfMatch.player.name}
                  {playerOfMatch.player.squad_number && ` #${playerOfMatch.player.squad_number}`}
                </p>
                {playerOfMatch.player.position && (
                  <p className="text-sm text-muted-foreground">{playerOfMatch.player.position}</p>
                )}
                {playerOfMatch.notes && (
                  <p className="text-sm mt-2 italic">{playerOfMatch.notes}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No Player of the Match selected yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Team Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Team Summary</CardTitle>
          <CardDescription>Overall match statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEventTypes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeEventTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active event types configured
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {activeEventTypes.map((eventType) => {
                const { Icon, color } = getEventTypeIcon(eventType.name);
                const count = teamTotals[eventType.name] || 0;

                return (
                  <div key={eventType.id} className="flex items-center space-x-3">
                    <Icon className={`h-8 w-8 ${color}`} />
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm text-muted-foreground">{eventType.display_name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Player Statistics</CardTitle>
          <CardDescription>Individual performance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEventTypes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : playerStats.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No events logged for this match
            </p>
          ) : (
            <div className="space-y-4">
              {playerStats.map((stats) => (
                <div
                  key={stats.player.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {stats.player.name}
                      {stats.player.squad_number && ` #${stats.player.squad_number}`}
                    </p>
                    {stats.player.position && (
                      <p className="text-sm text-muted-foreground">{stats.player.position}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 flex-wrap gap-2">
                    {activeEventTypes.map((eventType) => {
                      const count = stats.eventCounts[eventType.name] || 0;
                      if (count === 0) return null;

                      const { Icon, color } = getEventTypeIcon(eventType.name);
                      const badgeColor = getEventTypeBadgeColor(eventType.name);

                      return (
                        <Badge key={eventType.id} variant="default" className={badgeColor}>
                          <Icon className="h-3 w-3 mr-1" />
                          {count}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Match Report */}
      <MatchReport teamId={teamId} matchId={matchId} canGenerate={true} />

      {/* Newly Unlocked Rewards */}
      {newlyUnlockedRewards.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span>New Rewards Unlocked!</span>
            </CardTitle>
            <CardDescription>Players earned new achievements in this match</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {newlyUnlockedRewards.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-yellow-200 bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {item.player?.name}
                        {item.player?.squad_number && ` #${item.player.squad_number}`}
                      </p>
                      {item.reward && (
                        <p className="text-sm text-muted-foreground">{item.reward.description}</p>
                      )}
                    </div>
                  </div>
                  {item.reward && <RewardBadge reward={item.reward} size="md" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player of Match Dialog */}
      <PlayerOfMatchDialog
        open={showAwardDialog}
        onOpenChange={setShowAwardDialog}
        teamId={teamId}
        matchId={matchId}
        players={players}
        onAwardSet={handleAwardSet}
        currentAward={playerOfMatch}
      />
    </div>
  );
}
