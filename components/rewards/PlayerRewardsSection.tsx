'use client';

import { useEffect, useState } from 'react';
import { type RewardWithProgress } from '@/lib/types/database';
import { RewardBadge } from './RewardBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ChevronRight, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface PlayerRewardsSectionProps {
  teamId: string;
  playerId: string;
  showViewAll?: boolean;
  showFullGallery?: boolean; // New prop to show full gallery
}

export function PlayerRewardsSection({
  teamId,
  playerId,
  showViewAll = true,
  showFullGallery = false
}: PlayerRewardsSectionProps) {
  const [rewards, setRewards] = useState<RewardWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRewards() {
      try {
        const response = await fetch(`/api/teams/${teamId}/players/${playerId}/rewards`);

        if (!response.ok) {
          throw new Error('Failed to fetch rewards');
        }

        const data = await response.json();
        setRewards(data.rewards || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRewards();
  }, [teamId, playerId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex min-h-[150px] items-center justify-center">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const earnedRewards = rewards.filter((r) => r.is_earned);
  const lockedRewards = rewards.filter((r) => !r.is_earned);
  const inProgressRewards = rewards
    .filter((r) => !r.is_earned && r.progress && r.progress > 0)
    .sort((a, b) => {
      const aPercent = (a.progress! / a.progress_total!) * 100;
      const bPercent = (b.progress! / b.progress_total!) * 100;
      return bPercent - aPercent; // Sort by highest percentage first
    })
    .slice(0, 3); // Show top 3 closest to completion

  // Group rewards by type for full gallery
  const matchRewards = rewards.filter((r) => r.reward_type === 'match');
  const seasonRewards = rewards.filter((r) => r.reward_type === 'season');
  const leadershipRewards = rewards.filter((r) => r.reward_type === 'leadership');

  // Show full gallery view
  if (showFullGallery) {
    return (
      <div className="space-y-6">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Rewards Summary
            </CardTitle>
            <CardDescription>
              {earnedRewards.length} of {rewards.length} unlocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold text-blue-600">{matchRewards.filter((r) => r.is_earned).length}</div>
                <div className="text-sm text-muted-foreground">Match Rewards</div>
                <div className="text-xs text-muted-foreground">of {matchRewards.length} total</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold text-purple-600">{seasonRewards.filter((r) => r.is_earned).length}</div>
                <div className="text-sm text-muted-foreground">Season Rewards</div>
                <div className="text-xs text-muted-foreground">of {seasonRewards.length} total</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold text-amber-600">{leadershipRewards.filter((r) => r.is_earned).length}</div>
                <div className="text-sm text-muted-foreground">Leadership Rewards</div>
                <div className="text-xs text-muted-foreground">of {leadershipRewards.length} total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Close to Unlocking */}
        {inProgressRewards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Close to Unlocking
              </CardTitle>
              <CardDescription>Keep going! You're almost there</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inProgressRewards.map((reward) => (
                  <RewardBadge key={reward.id} reward={reward} size="md" showProgress />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Rewards by Type */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({rewards.length})</TabsTrigger>
            <TabsTrigger value="match">Match ({matchRewards.length})</TabsTrigger>
            <TabsTrigger value="season">Season ({seasonRewards.length})</TabsTrigger>
            <TabsTrigger value="leadership">Leadership ({leadershipRewards.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rewards.map((reward) => (
                <RewardBadge key={reward.id} reward={reward} size="lg" showProgress />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="match" className="mt-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matchRewards.map((reward) => (
                <RewardBadge key={reward.id} reward={reward} size="lg" showProgress />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="season" className="mt-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {seasonRewards.map((reward) => (
                <RewardBadge key={reward.id} reward={reward} size="lg" showProgress />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leadership" className="mt-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {leadershipRewards.map((reward) => (
                <RewardBadge key={reward.id} reward={reward} size="lg" showProgress />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Show compact summary view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Rewards
            </CardTitle>
            <CardDescription>
              {earnedRewards.length} of {rewards.length} unlocked
            </CardDescription>
          </div>
          {showViewAll && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/teams/${teamId}/rewards?player=${playerId}`}>
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recently Earned */}
        {earnedRewards.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Recently Unlocked</h4>
            <div className="flex flex-wrap gap-2">
              {earnedRewards.slice(0, 6).map((reward) => (
                <RewardBadge key={reward.id} reward={reward} size="sm" />
              ))}
            </div>
            {earnedRewards.length > 6 && (
              <p className="text-xs text-muted-foreground">
                +{earnedRewards.length - 6} more unlocked
              </p>
            )}
          </div>
        )}

        {/* In Progress */}
        {inProgressRewards.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Close to Unlocking</h4>
            <div className="space-y-3">
              {inProgressRewards.map((reward) => (
                <RewardBadge key={reward.id} reward={reward} size="md" showProgress />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {earnedRewards.length === 0 && inProgressRewards.length === 0 && (
          <div className="flex min-h-[100px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No rewards earned yet. Keep playing to unlock achievements!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
