'use client';

import { type Reward, type RewardWithProgress } from '@/lib/types/database';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RewardBadgeProps {
  reward: Reward | RewardWithProgress;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
}

export function RewardBadge({ reward, size = 'md', showProgress = false, className }: RewardBadgeProps) {
  const isLocked = 'is_earned' in reward ? !reward.is_earned : false;
  const progress = 'progress' in reward ? reward.progress : undefined;
  const progressTotal = 'progress_total' in reward ? reward.progress_total : undefined;

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  // Reward type colors
  const typeColors = {
    match: 'bg-blue-100 text-blue-800 border-blue-300',
    season: 'bg-purple-100 text-purple-800 border-purple-300',
    leadership: 'bg-amber-100 text-amber-800 border-amber-300',
  };

  const lockedClasses = 'bg-gray-100 text-gray-500 border-gray-300 opacity-60';

  // Get the criteria text for display
  const getCriteriaText = () => {
    if (reward.criteria_scope === 'special') {
      // For special rewards, use the description
      return reward.description;
    }

    const threshold = reward.criteria_threshold;
    const eventType = reward.criteria_event_type;

    if (eventType) {
      // Event-based rewards
      const eventLabel = eventType === 'goal' ? 'goals' :
                         eventType === 'assist' ? 'assists' :
                         eventType === 'tackle' ? 'tackles' :
                         eventType === 'save' ? 'saves' : eventType;
      return `${threshold} ${eventLabel}`;
    }

    return reward.description;
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Badge
        variant="outline"
        className={cn(
          sizeClasses[size],
          'flex items-center gap-1.5 font-medium transition-all',
          isLocked ? lockedClasses : typeColors[reward.reward_type]
        )}
      >
        {isLocked && <Lock className="h-3 w-3" />}
        <span>{reward.icon}</span>
        <span>{reward.name}</span>
      </Badge>

      {showProgress && (
        <div className="flex flex-col gap-1">
          {isLocked ? (
            // Show progress for locked rewards
            progress !== undefined && progressTotal !== undefined && (
              <>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span className="font-mono">
                    {progress}/{progressTotal}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                    style={{ width: `${Math.min((progress / progressTotal) * 100, 100)}%` }}
                  />
                </div>
              </>
            )
          ) : (
            // Show achievement criteria for earned rewards
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Achieved</span>
                <span className="font-mono font-medium text-green-700">
                  {getCriteriaText()}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                  style={{ width: '100%' }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
