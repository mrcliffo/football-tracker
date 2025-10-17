import { z } from 'zod';

export const playerSchema = z.object({
  name: z
    .string()
    .min(2, 'Player name must be at least 2 characters')
    .max(50, 'Player name must be less than 50 characters'),
  position: z.string().optional(),
  squadNumber: z
    .number()
    .int('Squad number must be a whole number')
    .min(1, 'Squad number must be at least 1')
    .max(99, 'Squad number must be less than 100')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z.string().optional(),
});

export type PlayerFormData = z.infer<typeof playerSchema>;
