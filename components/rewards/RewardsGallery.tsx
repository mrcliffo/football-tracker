'use client';

import { useState } from 'react';
import { type RewardWithProgress } from '@/lib/types/database';
import { RewardBadge } from './RewardBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Award, Crown, Filter } from 'lucide-react';

interface RewardsGalleryProps {
  rewards: RewardWithProgress[];
  playerId?: string; // If provided, shows player-specific progress
}

export function RewardsGallery({ rewards, playerId }: RewardsGalleryProps) {
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'match' | 'season' | 'leadership'>('all');

  // Filter rewards
  const filteredRewards = rewards.filter((reward) => {
    // Status filter
    if (filter === 'earned' && !reward.is_earned) return false;
    if (filter === 'locked' && reward.is_earned) return false;

    // Type filter
    if (typeFilter !== 'all' && reward.reward_type !== typeFilter) return false;

    return true;
  });

  // Group rewards by type
  const matchRewards = filteredRewards.filter((r) => r.reward_type === 'match');
  const seasonRewards = filteredRewards.filter((r) => r.reward_type === 'season');
  const leadershipRewards = filteredRewards.filter((r) => r.reward_type === 'leadership');

  // Stats
  const earnedCount = rewards.filter((r) => r.is_earned).length;
  const totalCount = rewards.length;
  const completionPercentage = Math.round((earnedCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      {playerId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Rewards Progress
            </CardTitle>
            <CardDescription>
              {earnedCount} of {totalCount} rewards unlocked ({completionPercentage}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="earned">Earned ({earnedCount})</TabsTrigger>
            <TabsTrigger value="locked">Locked ({totalCount - earnedCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">
              <Filter className="mr-1 h-3 w-3" />
              All Types
            </TabsTrigger>
            <TabsTrigger value="match">Match</TabsTrigger>
            <TabsTrigger value="season">Season</TabsTrigger>
            <TabsTrigger value="leadership">Leadership</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Rewards Grid by Type */}
      <div className="space-y-6">
        {(typeFilter === 'all' || typeFilter === 'match') && matchRewards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-500" />
                Match-Based Rewards
              </CardTitle>
              <CardDescription>Unlocked during individual matches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {matchRewards.map((reward) => (
                  <Card key={reward.id} className="p-4">
                    <div className="space-y-3">
                      <RewardBadge reward={reward} size="md" showProgress={!reward.is_earned && playerId !== undefined} />
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                      {reward.is_earned && reward.earned_at && (
                        <p className="text-xs text-green-600">
                          Unlocked {new Date(reward.earned_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {(typeFilter === 'all' || typeFilter === 'season') && seasonRewards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-500" />
                Season-Based Rewards
              </CardTitle>
              <CardDescription>Earned across an entire season</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {seasonRewards.map((reward) => (
                  <Card key={reward.id} className="p-4">
                    <div className="space-y-3">
                      <RewardBadge reward={reward} size="md" showProgress={!reward.is_earned && playerId !== undefined} />
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                      {reward.is_earned && reward.earned_at && (
                        <p className="text-xs text-green-600">
                          Unlocked {new Date(reward.earned_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {(typeFilter === 'all' || typeFilter === 'leadership') && leadershipRewards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Leadership Rewards
              </CardTitle>
              <CardDescription>Recognition for team leadership</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {leadershipRewards.map((reward) => (
                  <Card key={reward.id} className="p-4">
                    <div className="space-y-3">
                      <RewardBadge reward={reward} size="md" showProgress={!reward.is_earned && playerId !== undefined} />
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                      {reward.is_earned && reward.earned_at && (
                        <p className="text-xs text-green-600">
                          Unlocked {new Date(reward.earned_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {filteredRewards.length === 0 && (
          <Card>
            <CardContent className="flex min-h-[200px] items-center justify-center">
              <p className="text-muted-foreground">No rewards found with current filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
