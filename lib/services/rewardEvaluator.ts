import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Reward, PlayerReward, RewardMetadata } from '@/lib/types/database';

/**
 * Reward Evaluation Engine
 *
 * Evaluates and assigns rewards to players after match completion.
 * Handles match-based, season-based, and leadership rewards.
 */

interface EvaluationResult {
  success: boolean;
  newRewards: PlayerReward[];
  errors: string[];
}

interface PlayerEventCounts {
  playerId: string;
  totalEvents: number;
  eventCounts: Record<string, number>; // Dynamic event type counts
}

/**
 * Evaluate and assign rewards for all players in a completed match
 */
export async function evaluateMatchRewards(
  supabase: SupabaseClient<Database>,
  matchId: string
): Promise<EvaluationResult> {
  const errors: string[] = [];
  const newRewards: PlayerReward[] = [];

  try {
    // 1. Fetch match details with team and season info
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*, team:teams(id, season, manager_id)')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      errors.push('Match not found');
      return { success: false, newRewards, errors };
    }

    if (match.status !== 'completed') {
      errors.push('Match must be completed before evaluating rewards');
      return { success: false, newRewards, errors };
    }

    // 2. Fetch all match events for this match
    const { data: events, error: eventsError } = await supabase
      .from('match_events')
      .select('player_id, event_type')
      .eq('match_id', matchId);

    if (eventsError) {
      errors.push('Error fetching match events');
      return { success: false, newRewards, errors };
    }

    // 3. Fetch Player of the Match award
    const { data: potmAward } = await supabase
      .from('match_awards')
      .select('player_id')
      .eq('match_id', matchId)
      .eq('award_type', 'player_of_match')
      .maybeSingle();

    // 4. Fetch match players to get captain info
    const { data: matchPlayers } = await supabase
      .from('match_players')
      .select('player_id, is_captain')
      .eq('match_id', matchId);

    const captainId = matchPlayers?.find((mp) => mp.is_captain)?.player_id;

    // 5. Calculate event counts per player (dynamically handles all event types)
    const playerEventCounts: Map<string, PlayerEventCounts> = new Map();

    events?.forEach((event) => {
      const counts = playerEventCounts.get(event.player_id) || {
        playerId: event.player_id,
        totalEvents: 0,
        eventCounts: {},
      };

      // Dynamically count all event types
      counts.eventCounts[event.event_type] = (counts.eventCounts[event.event_type] || 0) + 1;
      counts.totalEvents++;

      playerEventCounts.set(event.player_id, counts);
    });

    // 6. Fetch all rewards from the catalog
    const { data: allRewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*');

    if (rewardsError || !allRewards) {
      errors.push('Error fetching rewards catalog');
      return { success: false, newRewards, errors };
    }

    // 7. Evaluate each reward for each player
    for (const counts of playerEventCounts.values()) {
      for (const reward of allRewards) {
        // Check if player already has this reward for this match
        const alreadyHas = await checkExistingReward(
          supabase,
          counts.playerId,
          reward.id,
          reward.criteria_scope === 'single_match' ? matchId : null
        );

        if (alreadyHas) continue;

        // Evaluate reward criteria
        const earned = await evaluateRewardCriteria(
          supabase,
          reward,
          counts,
          matchId,
          match.team?.season || '',
          captainId,
          potmAward?.player_id
        );

        if (earned) {
          // Create player reward
          const { data: newReward, error: createError } = await supabase
            .from('player_rewards')
            .insert({
              player_id: counts.playerId,
              reward_id: reward.id,
              match_id: reward.criteria_scope === 'single_match' ? matchId : null,
              metadata: { actual_count: getActualCount(counts, reward) },
            })
            .select()
            .single();

          if (createError) {
            errors.push(`Error creating reward ${reward.name} for player ${counts.playerId}`);
          } else if (newReward) {
            newRewards.push(newReward);
          }
        }
      }
    }

    // 8. Evaluate leadership rewards for captain and POTM
    if (captainId) {
      await evaluateLeadershipRewards(
        supabase,
        allRewards,
        captainId,
        matchId,
        potmAward?.player_id === captainId,
        newRewards,
        errors
      );
    }

    return { success: errors.length === 0, newRewards, errors };
  } catch (error) {
    errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, newRewards, errors };
  }
}

/**
 * Check if a player already has a specific reward
 */
async function checkExistingReward(
  supabase: SupabaseClient<Database>,
  playerId: string,
  rewardId: string,
  matchId: string | null
): Promise<boolean> {
  const query = supabase
    .from('player_rewards')
    .select('id')
    .eq('player_id', playerId)
    .eq('reward_id', rewardId);

  // For match-based rewards, check if already earned in this specific match
  if (matchId) {
    query.eq('match_id', matchId);
  }

  const { data } = await query.maybeSingle();
  return !!data;
}

/**
 * Evaluate if a reward should be granted based on its criteria
 */
async function evaluateRewardCriteria(
  supabase: SupabaseClient<Database>,
  reward: Reward,
  matchCounts: PlayerEventCounts,
  matchId: string,
  season: string,
  captainId: string | undefined,
  potmId: string | undefined
): Promise<boolean> {
  // Handle special criteria (multi-requirement rewards)
  if (reward.criteria_scope === 'special') {
    const metadata = reward.metadata as RewardMetadata | null;

    if (!metadata?.requires) return false;

    // All Rounder: 1 goal, 1 assist, 1 tackle in single match
    if (metadata.requires.goal && metadata.requires.assist && metadata.requires.tackle) {
      return (
        (matchCounts.eventCounts['goal'] || 0) >= metadata.requires.goal &&
        (matchCounts.eventCounts['assist'] || 0) >= metadata.requires.assist &&
        (matchCounts.eventCounts['tackle'] || 0) >= metadata.requires.tackle
      );
    }

    // Season Legend: 200 total events in season
    if (metadata.requires.total_events) {
      const seasonTotal = await getSeasonEventCount(supabase, matchCounts.playerId, season);
      return seasonTotal >= metadata.requires.total_events;
    }

    // Leadership rewards handled separately
    return false;
  }

  // Match-based rewards (single match threshold)
  if (reward.criteria_scope === 'single_match') {
    if (!reward.criteria_event_type) return false;

    const eventCount = getEventCount(matchCounts, reward.criteria_event_type);
    return eventCount >= reward.criteria_threshold;
  }

  // Season-based rewards (aggregate across season)
  if (reward.criteria_scope === 'season') {
    if (!reward.criteria_event_type) return false;

    const seasonTotal = await getSeasonEventCount(
      supabase,
      matchCounts.playerId,
      season,
      reward.criteria_event_type
    );
    return seasonTotal >= reward.criteria_threshold;
  }

  return false;
}

/**
 * Evaluate leadership-specific rewards (captain, POTM)
 */
async function evaluateLeadershipRewards(
  supabase: SupabaseClient<Database>,
  allRewards: Reward[],
  captainId: string,
  matchId: string,
  isDoubleHonor: boolean,
  newRewards: PlayerReward[],
  errors: string[]
): Promise<void> {
  const leadershipRewards = allRewards.filter((r) => r.reward_type === 'leadership');

  // Get captain count for this player
  const { data: captainMatches } = await supabase
    .from('match_players')
    .select('id')
    .eq('player_id', captainId)
    .eq('is_captain', true);

  const captainCount = captainMatches?.length || 0;

  for (const reward of leadershipRewards) {
    const metadata = reward.metadata as RewardMetadata | null;

    // Skip if already has this reward
    const alreadyHas = await checkExistingReward(supabase, captainId, reward.id, null);
    if (alreadyHas) continue;

    let earned = false;

    // Double Honor: Captain + POTM in same game
    if (metadata?.requires?.captain_and_potm_same_match && isDoubleHonor) {
      earned = true;
    }

    // Captain count-based rewards
    if (metadata?.requires?.captain_count) {
      earned = captainCount >= metadata.requires.captain_count;
    }

    if (earned) {
      const { data: newReward, error: createError } = await supabase
        .from('player_rewards')
        .insert({
          player_id: captainId,
          reward_id: reward.id,
          match_id: reward.name === 'Double Honor' ? matchId : null,
          metadata: { actual_count: captainCount },
        })
        .select()
        .single();

      if (createError) {
        errors.push(`Error creating leadership reward ${reward.name}`);
      } else if (newReward) {
        newRewards.push(newReward);
      }
    }
  }
}

/**
 * Get event count for a specific type from match counts
 */
function getEventCount(counts: PlayerEventCounts, eventType: string): number {
  return counts.eventCounts[eventType] || 0;
}

/**
 * Get total event count across all matches in a season for a player
 */
async function getSeasonEventCount(
  supabase: SupabaseClient<Database>,
  playerId: string,
  season: string,
  eventType?: string
): Promise<number> {
  // Get player's team_id first
  const { data: player } = await supabase
    .from('players')
    .select('team_id')
    .eq('id', playerId)
    .single();

  if (!player?.team_id) {
    console.log(`[getSeasonEventCount] Player ${playerId} not found or has no team_id`);
    return 0;
  }

  console.log(`[getSeasonEventCount] Player ${playerId} belongs to team ${player.team_id}`);

  // Get all match IDs for this player's team in this season
  const { data: matches } = await supabase
    .from('matches')
    .select('id')
    .eq('status', 'completed')
    .eq('team_id', player.team_id);

  if (!matches || matches.length === 0) {
    console.log(`[getSeasonEventCount] No completed matches found for team ${player.team_id}`);
    return 0;
  }

  const matchIds = matches.map((m) => m.id);
  console.log(`[getSeasonEventCount] Found ${matches.length} completed matches for team ${player.team_id}`);

  // Count events
  let query = supabase
    .from('match_events')
    .select('id', { count: 'exact', head: true })
    .eq('player_id', playerId)
    .in('match_id', matchIds);

  if (eventType) {
    query = query.eq('event_type', eventType);
    console.log(`[getSeasonEventCount] Filtering for event_type: ${eventType}`);
  } else {
    console.log(`[getSeasonEventCount] Counting ALL event types`);
  }

  const { count } = await query;
  console.log(`[getSeasonEventCount] Found ${count || 0} events for player ${playerId} (event_type: ${eventType || 'all'})`);
  return count || 0;
}

/**
 * Get actual count to store in metadata when reward is earned
 */
function getActualCount(counts: PlayerEventCounts, reward: Reward): number {
  if (reward.criteria_event_type) {
    return getEventCount(counts, reward.criteria_event_type);
  }
  return counts.totalEvents;
}

/**
 * Calculate player progress toward a specific reward
 */
export async function calculateRewardProgress(
  supabase: SupabaseClient<Database>,
  playerId: string,
  rewardId: string,
  season?: string
): Promise<{ current: number; target: number }> {
  const { data: reward } = await supabase
    .from('rewards')
    .select('*')
    .eq('id', rewardId)
    .single();

  if (!reward) {
    console.log(`[calculateRewardProgress] Reward ${rewardId} not found`);
    return { current: 0, target: 0 };
  }

  const target = reward.criteria_threshold;
  let current = 0;

  console.log(`[calculateRewardProgress] Calculating progress for reward: ${reward.name}, player: ${playerId}, scope: ${reward.criteria_scope}, event_type: ${reward.criteria_event_type}`);

  // For season-based rewards, count events across season
  if (reward.criteria_scope === 'season' && season && reward.criteria_event_type) {
    current = await getSeasonEventCount(supabase, playerId, season, reward.criteria_event_type);
    console.log(`[calculateRewardProgress] Season reward "${reward.name}": current=${current}, target=${target}, event_type=${reward.criteria_event_type}`);
  }

  // For special rewards with total_events
  if (reward.criteria_scope === 'special') {
    const metadata = reward.metadata as RewardMetadata | null;
    if (metadata?.requires?.total_events && season) {
      current = await getSeasonEventCount(supabase, playerId, season);
      console.log(`[calculateRewardProgress] Special reward "${reward.name}" (total_events): current=${current}, target=${metadata.requires.total_events}`);
    }
    if (metadata?.requires?.captain_count) {
      const { count } = await supabase
        .from('match_players')
        .select('id', { count: 'exact', head: true })
        .eq('player_id', playerId)
        .eq('is_captain', true);
      current = count || 0;
      console.log(`[calculateRewardProgress] Special reward "${reward.name}" (captain_count): current=${current}, target=${metadata.requires.captain_count}`);
    }
  }

  console.log(`[calculateRewardProgress] Final result for "${reward.name}": current=${current}, target=${target}`);
  return { current, target };
}
