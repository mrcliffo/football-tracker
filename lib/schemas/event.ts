import { z } from 'zod';

// Event types
export const eventTypes = [
  'goal',
  'assist',
  'tackle',
  'save',
  'yellow_card',
  'red_card',
  'substitution_on',
  'substitution_off',
] as const;

export type EventType = (typeof eventTypes)[number];

// Create event schema
export const createEventSchema = z.object({
  playerId: z.string().uuid('Invalid player ID'),
  eventType: z.enum(eventTypes, {
    errorMap: () => ({ message: 'Invalid event type' }),
  }),
  cumulativeTimeSeconds: z.number().int().min(0, 'Time must be non-negative'),
  periodNumber: z.number().int().min(1, 'Period number must be at least 1'),
  metadata: z.record(z.any()).optional(),
});

export type CreateEventFormData = z.infer<typeof createEventSchema>;

// Period tracking schema
export const startPeriodSchema = z.object({
  periodNumber: z.number().int().min(1, 'Period number must be at least 1'),
  cumulativeSeconds: z.number().int().min(0, 'Cumulative seconds must be non-negative'),
});

export const endPeriodSchema = z.object({
  periodId: z.string().uuid('Invalid period ID'),
  cumulativeSeconds: z.number().int().min(0, 'Cumulative seconds must be non-negative'),
});

export const pausePeriodSchema = z.object({
  periodId: z.string().uuid('Invalid period ID'),
  cumulativeSeconds: z.number().int().min(0, 'Cumulative seconds must be non-negative'),
});

export const resumePeriodSchema = z.object({
  periodId: z.string().uuid('Invalid period ID'),
});

export type StartPeriodFormData = z.infer<typeof startPeriodSchema>;
export type EndPeriodFormData = z.infer<typeof endPeriodSchema>;
export type PausePeriodFormData = z.infer<typeof pausePeriodSchema>;
export type ResumePeriodFormData = z.infer<typeof resumePeriodSchema>;
