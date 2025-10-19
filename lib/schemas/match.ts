import { z } from 'zod';

export const matchSchema = z.object({
  opponentName: z
    .string()
    .min(2, 'Opponent name must be at least 2 characters')
    .max(100, 'Opponent name must be less than 100 characters'),
  matchDate: z.string().min(1, 'Match date is required'),
  matchTime: z.string().optional().nullable(),
  numberOfPeriods: z.coerce
    .number()
    .int('Number of periods must be a whole number')
    .min(1, 'Must have at least 1 period')
    .max(10, 'Cannot exceed 10 periods'),
  captainId: z.string().uuid('Invalid captain ID').optional().nullable(),
  selectedPlayers: z
    .array(z.string().uuid())
    .min(1, 'At least one player must be selected'),
});

export type MatchFormData = z.infer<typeof matchSchema>;
