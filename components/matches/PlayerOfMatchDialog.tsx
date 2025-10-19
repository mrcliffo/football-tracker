'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Player } from '@/lib/types/database';
import { Trophy } from 'lucide-react';
import { toast } from 'sonner';

interface PlayerOfMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  matchId: string;
  players: Player[];
  onAwardSet: (award: any) => void;
  currentAward?: any | null;
}

export function PlayerOfMatchDialog({
  open,
  onOpenChange,
  teamId,
  matchId,
  players,
  onAwardSet,
  currentAward,
}: PlayerOfMatchDialogProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    currentAward?.player_id || ''
  );
  const [notes, setNotes] = useState<string>(currentAward?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlayerId) {
      toast.error('Please select a player');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/teams/${teamId}/matches/${matchId}/award`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: selectedPlayerId,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set Player of the Match');
      }

      const data = await response.json();
      toast.success('Player of the Match set successfully!');
      onAwardSet(data.award);
      onOpenChange(false);
    } catch (error) {
      console.error('Error setting Player of the Match:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to set Player of the Match');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!currentAward) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/teams/${teamId}/matches/${matchId}/award`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove Player of the Match');
      }

      toast.success('Player of the Match removed');
      onAwardSet(null);
      setSelectedPlayerId('');
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error removing Player of the Match:', error);
      toast.error('Failed to remove Player of the Match');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>Select Player of the Match</span>
            </DialogTitle>
            <DialogDescription>
              Choose the player who had the best performance in this match
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Player</Label>
              <RadioGroup value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted"
                    >
                      <RadioGroupItem value={player.id} id={player.id} />
                      <Label
                        htmlFor={player.id}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            {player.name}
                            {player.squad_number && ` #${player.squad_number}`}
                          </span>
                          {player.position && (
                            <span className="text-sm text-muted-foreground">
                              {player.position}
                            </span>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Why did this player deserve the award?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div>
                {currentAward && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleRemove}
                    disabled={isSubmitting}
                  >
                    Remove Award
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !selectedPlayerId}>
                  {isSubmitting ? 'Saving...' : currentAward ? 'Update' : 'Set Award'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
