'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { PeriodTracking } from '@/lib/types/database';

interface PeriodManagerProps {
  teamId: string;
  matchId: string;
  totalPeriods: number;
  initialPeriods: PeriodTracking[];
  matchStatus: string;
}

export function PeriodManager({
  teamId,
  matchId,
  totalPeriods,
  initialPeriods,
  matchStatus,
}: PeriodManagerProps) {
  const router = useRouter();
  const [periods, setPeriods] = useState<PeriodTracking[]>(initialPeriods);
  const [isLoading, setIsLoading] = useState(false);
  const [cumulativeSeconds, setCumulativeSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Find active period (not ended)
  const activePeriod = periods.find((p) => !p.ended_at);
  const isPaused = activePeriod?.paused_at !== null;
  const completedPeriods = periods.filter((p) => p.ended_at).length;
  const currentPeriodNumber = activePeriod?.period_number || completedPeriods + 1;

  // Update cumulative time based on active period
  useEffect(() => {
    if (!activePeriod || isPaused) {
      setIsRunning(false);
      return;
    }

    setIsRunning(true);
    const startTime = new Date(activePeriod.started_at).getTime();
    const pausedDuration = activePeriod.paused_at
      ? new Date(activePeriod.paused_at).getTime() - startTime
      : 0;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime - pausedDuration) / 1000);
      setCumulativeSeconds(activePeriod.cumulative_seconds + elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activePeriod, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startPeriod = async () => {
    if (currentPeriodNumber > totalPeriods) {
      toast.error(`All ${totalPeriods} periods have been completed`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/matches/${matchId}/periods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodNumber: currentPeriodNumber,
          cumulativeSeconds: cumulativeSeconds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start period');
      }

      const { period } = await response.json();
      setPeriods([...periods, period]);
      toast.success(`Period ${currentPeriodNumber} started`);
      router.refresh();
    } catch (error) {
      console.error('Error starting period:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start period');
    } finally {
      setIsLoading(false);
    }
  };

  const pausePeriod = async () => {
    if (!activePeriod) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/teams/${teamId}/matches/${matchId}/periods/${activePeriod.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'pause',
            periodId: activePeriod.id,
            cumulativeSeconds: cumulativeSeconds,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to pause period');
      }

      const { period } = await response.json();
      setPeriods(periods.map((p) => (p.id === period.id ? period : p)));
      toast.success('Period paused');
      router.refresh();
    } catch (error) {
      console.error('Error pausing period:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to pause period');
    } finally {
      setIsLoading(false);
    }
  };

  const resumePeriod = async () => {
    if (!activePeriod) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/teams/${teamId}/matches/${matchId}/periods/${activePeriod.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'resume',
            periodId: activePeriod.id,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resume period');
      }

      const { period } = await response.json();
      setPeriods(periods.map((p) => (p.id === period.id ? period : p)));
      toast.success('Period resumed');
      router.refresh();
    } catch (error) {
      console.error('Error resuming period:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resume period');
    } finally {
      setIsLoading(false);
    }
  };

  const endPeriod = async () => {
    if (!activePeriod) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/teams/${teamId}/matches/${matchId}/periods/${activePeriod.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'end',
            periodId: activePeriod.id,
            cumulativeSeconds: cumulativeSeconds,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to end period');
      }

      const { period } = await response.json();
      setPeriods(periods.map((p) => (p.id === period.id ? period : p)));
      setCumulativeSeconds(cumulativeSeconds); // Keep cumulative time for next period
      toast.success(`Period ${activePeriod.period_number} ended`);
      router.refresh();
    } catch (error) {
      console.error('Error ending period:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to end period');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Match Clock
            </CardTitle>
            <CardDescription>
              Period {currentPeriodNumber} of {totalPeriods}
            </CardDescription>
          </div>
          <Badge variant={isRunning ? 'default' : 'secondary'}>
            {activePeriod ? (isPaused ? 'Paused' : 'Running') : 'Not Started'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Cumulative Time Display */}
          <div className="text-center">
            <div className="text-6xl font-mono font-bold">{formatTime(cumulativeSeconds)}</div>
            <p className="text-sm text-muted-foreground mt-2">Cumulative Match Time</p>
          </div>

          {/* Period Controls */}
          <div className="flex justify-center space-x-2">
            {!activePeriod && (
              <Button
                onClick={startPeriod}
                disabled={isLoading || completedPeriods >= totalPeriods}
                size="lg"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Period {currentPeriodNumber}
              </Button>
            )}

            {activePeriod && !isPaused && (
              <>
                <Button onClick={pausePeriod} disabled={isLoading} variant="outline" size="lg">
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
                <Button onClick={endPeriod} disabled={isLoading} size="lg">
                  <Square className="mr-2 h-4 w-4" />
                  End Period
                </Button>
              </>
            )}

            {activePeriod && isPaused && (
              <Button onClick={resumePeriod} disabled={isLoading} size="lg">
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
          </div>

          {/* Period Summary */}
          {periods.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Period History</h4>
              <div className="space-y-1">
                {periods.map((period) => (
                  <div
                    key={period.id}
                    className="flex justify-between items-center text-sm text-muted-foreground"
                  >
                    <span>Period {period.period_number}</span>
                    <span>
                      {period.ended_at ? (
                        <Badge variant="secondary">Completed</Badge>
                      ) : period.paused_at ? (
                        <Badge variant="outline">Paused</Badge>
                      ) : (
                        <Badge>Active</Badge>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
