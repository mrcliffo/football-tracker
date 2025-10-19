import { z } from 'zod';

// Reward types
export const rewardTypes = ['match', 'season', 'leadership'] as const;
export type RewardType = (typeof rewardTypes)[number];

// Criteria event types (for counting)
export const criteriaEventTypes = ['goal', 'assist', 'tackle', 'save'] as const;
export type CriteriaEventType = (typeof criteriaEventTypes)[number];

// Criteria scopes
export const criteriaScopes = ['single_match', 'season', 'career', 'special'] as const;
export type CriteriaScope = (typeof criteriaScopes)[number];

// Reward metadata schema
export const rewardMetadataSchema = z.object({
  requires: z.object({
    goal: z.number().int().min(0).optional(),
    assist: z.number().int().min(0).optional(),
    tackle: z.number().int().min(0).optional(),
    save: z.number().int().min(0).optional(),
    total_events: z.number().int().min(0).optional(),
    captain_count: z.number().int().min(0).optional(),
    captain_and_potm_same_match: z.boolean().optional(),
  }).optional(),
  actual_count: z.number().int().min(0).optional(),
});

export type RewardMetadata = z.infer<typeof rewardMetadataSchema>;

// Create reward schema (for admin/seeding)
export const createRewardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description is too long'),
  rewardType: z.enum(rewardTypes, {
    errorMap: () => ({ message: 'Invalid reward type' }),
  }),
  criteriaEventType: z.enum(criteriaEventTypes).nullable().optional(),
  criteriaThreshold: z.number().int().min(1, 'Threshold must be at least 1'),
  criteriaScope: z.enum(criteriaScopes, {
    errorMap: () => ({ message: 'Invalid criteria scope' }),
  }),
  icon: z.string().max(10).optional(),
  metadata: rewardMetadataSchema.optional(),
});

export type CreateRewardFormData = z.infer<typeof createRewardSchema>;

// Reward evaluation trigger schema
export const evaluateRewardsSchema = z.object({
  matchId: z.string().uuid('Invalid match ID'),
});

export type EvaluateRewardsFormData = z.infer<typeof evaluateRewardsSchema>;

// Player reward creation schema (for internal use by evaluation engine)
export const createPlayerRewardSchema = z.object({
  playerId: z.string().uuid('Invalid player ID'),
  rewardId: z.string().uuid('Invalid reward ID'),
  achievedDate: z.string().datetime().optional(), // ISO date string
  matchId: z.string().uuid('Invalid match ID').nullable().optional(),
  metadata: rewardMetadataSchema.optional(),
});

export type CreatePlayerRewardFormData = z.infer<typeof createPlayerRewardSchema>;

// Filter rewards schema (for API queries)
export const rewardFilterSchema = z.object({
  rewardType: z.enum(rewardTypes).optional(),
  playerId: z.string().uuid().optional(),
  matchId: z.string().uuid().optional(),
  isEarned: z.boolean().optional(),
});

export type RewardFilterFormData = z.infer<typeof rewardFilterSchema>;
