import { z } from 'zod';

export const teamSchema = z.object({
  name: z
    .string()
    .min(2, 'Team name must be at least 2 characters')
    .max(50, 'Team name must be less than 50 characters'),
  ageGroup: z.string().optional(),
  season: z.string().optional(),
});

export type TeamFormData = z.infer<typeof teamSchema>;
