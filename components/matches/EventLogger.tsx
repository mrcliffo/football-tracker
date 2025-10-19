'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Trophy, Target, Shield, AlertTriangle, ArrowRight, ArrowLeft, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MatchEvent, Player, PeriodTracking } from '@/lib/types/database';
import { EventType } from '@/lib/schemas/event';
import { EventTypeButton } from './EventTypeButton';
import { PlayerButton } from './PlayerButton';

interface ActiveEventType {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
}

interface EventLoggerProps {
  teamId: string;
  matchId: string;
  players: Player[];
  initialEvents: (MatchEvent & { player: Player })[];
  periods: PeriodTracking[];
  matchStatus: string;
}

export function EventLogger({
  teamId,
  matchId,
  players,
  initialEvents,
  periods,
  matchStatus,
}: EventLoggerProps) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeEventTypes, setActiveEventTypes] = useState<ActiveEventType[]>([]);
  const [loadingEventTypes, setLoadingEventTypes] = useState(true);

  const activePeriod = periods.find((p) => !p.ended_at);
  const canLogEvents = matchStatus === 'in_progress' && activePeriod;

  // Fetch active event types
  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const response = await fetch('/api/event-types');
        if (!response.ok) throw new Error('Failed to fetch event types');
        const data = await response.json();
        setActiveEventTypes(data);
      } catch (error) {
        console.error('Error fetching event types:', error);
        toast.error('Failed to load event types');
      } finally {
        setLoadingEventTypes(false);
      }
    };

    fetchEventTypes();
  }, []);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'goal':
        return <Trophy className="h-4 w-4" />;
      case 'assist':
        return <Target className="h-4 w-4" />;
      case 'tackle':
      case 'save':
        return <Shield className="h-4 w-4" />;
      case 'yellow_card':
      case 'red_card':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getEventBadgeVariant = (eventType: string) => {
    switch (eventType) {
      case 'goal':
        return 'default';
      case 'assist':
        return 'secondary';
      case 'yellow_card':
        return 'outline';
      case 'red_card':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatEventName = (eventType: string) => {
    return eventType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentCumulativeTime = () => {
    if (!activePeriod) return 0;

    const startTime = new Date(activePeriod.started_at).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - startTime) / 1000);
    return activePeriod.cumulative_seconds + elapsed;
  };

  const logEvent = async (playerId: string) => {
    if (!selectedEventType || !canLogEvents) return;

    const cumulativeTime = getCurrentCumulativeTime();

    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/matches/${matchId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          eventType: selectedEventType,
          cumulativeTimeSeconds: cumulativeTime,
          periodNumber: activePeriod!.period_number,
          metadata: {},
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to log event');
      }

      const { event } = await response.json();
      setEvents([event, ...events]);
      toast.success(`${formatEventName(selectedEventType)} logged for ${event.player.name}`);
      setSelectedEventType(null); // Reset to event selection
      router.refresh();
    } catch (error) {
      console.error('Error logging event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to log event');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/teams/${teamId}/matches/${matchId}/events/${eventId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete event');
      }

      setEvents(events.filter((e) => e.id !== eventId));
      toast.success('Event removed');
      router.refresh();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Event Logging</span>
          {selectedEventType && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedEventType(null)}
              className="text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Events
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          {canLogEvents
            ? selectedEventType
              ? `Select the player for ${formatEventName(selectedEventType)}`
              : 'Tap an event type, then select the player'
            : 'Start a period to begin logging events'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Event Logger Controls */}
          {canLogEvents && (
            <div className="space-y-4">
              {!selectedEventType ? (
                // Event Type Selection Grid
                <div>
                  <div className="flex items-center mb-3">
                    <Trophy className="h-5 w-5 mr-2 text-muted-foreground" />
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Select Event Type
                    </h3>
                  </div>
                  {loadingEventTypes ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : activeEventTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No active event types available. Please contact your administrator.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {activeEventTypes.map((eventType) => {
                        // Map event type names to icons and variants
                        const getIconForEvent = (name: string) => {
                          if (name.includes('goal')) return Trophy;
                          if (name.includes('assist')) return Target;
                          if (name.includes('tackle') || name.includes('save')) return Shield;
                          if (name.includes('card')) return AlertTriangle;
                          if (name.includes('on')) return ArrowRight;
                          if (name.includes('off')) return ArrowLeft;
                          return Trophy;
                        };

                        const getVariantForEvent = (name: string): any => {
                          if (name.includes('goal')) return 'goal';
                          if (name.includes('assist')) return 'assist';
                          if (name.includes('tackle')) return 'tackle';
                          if (name.includes('save')) return 'save';
                          if (name.includes('yellow')) return 'yellow';
                          if (name.includes('red')) return 'red';
                          if (name.includes('on')) return 'sub-on';
                          if (name.includes('off')) return 'sub-off';
                          return 'goal';
                        };

                        return (
                          <EventTypeButton
                            key={eventType.id}
                            icon={getIconForEvent(eventType.name)}
                            label={eventType.icon ? `${eventType.icon} ${eventType.display_name}` : eventType.display_name}
                            variant={getVariantForEvent(eventType.name)}
                            onClick={() => setSelectedEventType(eventType.name)}
                            disabled={isLoading}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                // Player Selection List
                <div>
                  <div className="flex items-center mb-3">
                    <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Select Player
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {players.map((player) => (
                      <PlayerButton
                        key={player.id}
                        player={player}
                        onClick={() => logEvent(player.id)}
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Event List */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">
              Event History ({events.length} event{events.length !== 1 ? 's' : ''})
            </h4>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No events logged yet
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getEventIcon(event.event_type)}
                        <Badge variant={getEventBadgeVariant(event.event_type)}>
                          {formatEventName(event.event_type)}
                        </Badge>
                      </div>
                      <span className="font-medium">{event.player.name}</span>
                      {event.player.squad_number && (
                        <span className="text-sm text-muted-foreground">
                          #{event.player.squad_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-muted-foreground font-mono">
                        {formatTime(event.cumulative_time_seconds)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        P{event.period_number}
                      </Badge>
                      {canLogEvents && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEvent(event.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
