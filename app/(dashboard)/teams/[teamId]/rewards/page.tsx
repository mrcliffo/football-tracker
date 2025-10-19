import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RewardsGallery } from '@/components/rewards/RewardsGallery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';
import type { RewardWithProgress } from '@/lib/types/database';

interface RewardsPageProps {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ player?: string }>;
}

export default async function RewardsPage({ params, searchParams }: RewardsPageProps) {
  const { teamId } = await params;
  const { player: playerId } = await searchParams;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get team
  const { data: team } = await supabase
    .from('teams')
    .select('id, name, manager_id, season')
    .eq('id', teamId)
    .eq('is_active', true)
    .single();

  if (!team) {
    redirect('/teams');
  }

  // Check access
  const isManager = team.manager_id === user.id;

  if (!isManager) {
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('team_id', teamId)
      .maybeSingle();

    if (!teamMember) {
      redirect('/teams');
    }
  }

  // Fetch rewards
  let rewards: RewardWithProgress[] = [];
  let playerName: string | undefined;

  if (playerId) {
    // Player-specific view
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/teams/${teamId}/players/${playerId}/rewards`,
      {
        headers: {
          Cookie: `${await supabase.auth.getSession().then((s) => s.data.session?.access_token)}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      rewards = data.rewards || [];
    }

    // Get player name
    const { data: player } = await supabase
      .from('players')
      .select('name')
      .eq('id', playerId)
      .single();

    playerName = player?.name;
  } else {
    // Team-wide view (all rewards catalog)
    const { data: allRewards } = await supabase
      .from('rewards')
      .select('*')
      .order('reward_type', { ascending: true })
      .order('criteria_threshold', { ascending: true });

    rewards =
      allRewards?.map((r) => ({
        ...r,
        is_earned: false,
      })) || [];
  }

  // Get leaderboard
  const leaderboardResponse = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/teams/${teamId}/rewards/leaderboard`,
    {
      headers: {
        Cookie: `${await supabase.auth.getSession().then((s) => s.data.session?.access_token)}`,
      },
    }
  );

  let leaderboard: any[] = [];
  if (leaderboardResponse.ok) {
    const data = await leaderboardResponse.json();
    leaderboard = data.leaderboard || [];
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {playerId && playerName ? `${playerName}'s Rewards` : `${team.name} - Rewards`}
        </h1>
        <p className="text-muted-foreground">
          {playerId ? 'Track your achievements and progress' : 'Team achievements and leaderboard'}
        </p>
      </div>

      {/* Leaderboard (if team view) */}
      {!playerId && leaderboard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-yellow-500" />
              Team Leaderboard
            </CardTitle>
            <CardDescription>Players ranked by total rewards earned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((entry, index) => (
                <div
                  key={entry.player_id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                        index === 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : index === 1
                            ? 'bg-gray-100 text-gray-700'
                            : index === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">
                        {entry.player_name}
                        {entry.squad_number && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            #{entry.squad_number}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.match_rewards} match • {entry.season_rewards} season •{' '}
                        {entry.leadership_rewards} leadership
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="font-bold">{entry.total_rewards}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards Gallery */}
      <RewardsGallery rewards={rewards} playerId={playerId} />
    </div>
  );
}
