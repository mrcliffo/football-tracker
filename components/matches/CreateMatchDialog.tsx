'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { matchSchema, type MatchFormData } from '@/lib/schemas/match';
import { Player } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CreateMatchDialogProps {
  teamId: string;
  players: Player[];
}

export function CreateMatchDialog({ teamId, players }: CreateMatchDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      opponentName: '',
      matchDate: '',
      matchTime: '',
      numberOfPeriods: 2,
      captainId: null,
      selectedPlayers: [],
    },
  });

  const selectedPlayers = form.watch('selectedPlayers');
  const availableCaptains = players.filter((p) => selectedPlayers.includes(p.id));

  const onSubmit = async (data: MatchFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/teams/${teamId}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Match creation error details:', error);
        throw new Error(error.details || error.error || 'Failed to create match');
      }

      toast.success('Match created successfully!');
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      console.error('Error creating match:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create match');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayer = (playerId: string) => {
    const currentPlayers = form.getValues('selectedPlayers');
    const newPlayers = currentPlayers.includes(playerId)
      ? currentPlayers.filter((id) => id !== playerId)
      : [...currentPlayers, playerId];

    form.setValue('selectedPlayers', newPlayers);

    // If captain is no longer in selected players, clear captain
    const captainId = form.getValues('captainId');
    if (captainId && !newPlayers.includes(captainId)) {
      form.setValue('captainId', null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Match
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Match</DialogTitle>
          <DialogDescription>
            Schedule a match and select players and captain.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Match Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Match Details</h3>

              <FormField
                control={form.control}
                name="opponentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opponent Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., City FC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="matchDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="matchTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="numberOfPeriods"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Periods *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      How many periods will this match have? (e.g., 2 for halves, 4 for quarters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Player Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold">Select Players *</h3>
              <FormField
                control={form.control}
                name="selectedPlayers"
                render={() => (
                  <FormItem>
                    <div className="space-y-2">
                      {players.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No players available. Add players to your team first.
                        </p>
                      ) : (
                        players.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={selectedPlayers.includes(player.id)}
                              onCheckedChange={() => togglePlayer(player.id)}
                            />
                            <label className="flex-1 cursor-pointer text-sm">
                              {player.name}
                              {player.squad_number && ` (#${player.squad_number})`}
                              {player.position && ` - ${player.position}`}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Captain Selection */}
            {selectedPlayers.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Select Captain</h3>
                <FormField
                  control={form.control}
                  name="captainId"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a captain (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCaptains.map((player) => (
                            <SelectItem key={player.id} value={player.id}>
                              {player.name}
                              {player.squad_number && ` (#${player.squad_number})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the captain for this match from the selected players.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || players.length === 0}>
                {isLoading ? 'Creating...' : 'Create Match'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
