export type Json =
  | string
  | number
  | boolean
  | null
  | { [key]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'manager' | 'parent';
          full_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
          metadata: Json | null;
        };
        Insert: {
          id: string;
          role: 'manager' | 'parent';
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          role?: 'manager' | 'parent';
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
      };
      teams: {
        Row: {
          id: string;
          manager_id: string;
          name: string;
          age_group: string | null;
          season: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          manager_id: string;
          name: string;
          age_group?: string | null;
          season?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          manager_id?: string;
          name?: string;
          age_group?: string | null;
          season?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
      };
      players: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          position: string | null;
          squad_number: number | null;
          date_of_birth: string | null;
          is_active: boolean;
          privacy_settings: Json | null;
          created_at: string;
          updated_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          position?: string | null;
          squad_number?: number | null;
          date_of_birth?: string | null;
          is_active?: boolean;
          privacy_settings?: Json | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          name?: string;
          position?: string | null;
          squad_number?: number | null;
          date_of_birth?: string | null;
          is_active?: boolean;
          privacy_settings?: Json | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
      };
      team_members: {
        Row: {
          id: string;
          user_id: string;
          team_id: string;
          player_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          team_id: string;
          player_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          team_id?: string;
          player_id?: string | null;
          created_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          team_id: string;
          opponent_name: string;
          match_date: string;
          match_time: string | null;
          number_of_periods: number;
          captain_id: string | null;
          status: 'scheduled' | 'in_progress' | 'completed';
          is_active: boolean;
          created_at: string;
          updated_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          opponent_name: string;
          match_date: string;
          match_time?: string | null;
          number_of_periods: number;
          captain_id?: string | null;
          status?: 'scheduled' | 'in_progress' | 'completed';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          opponent_name?: string;
          match_date?: string;
          match_time?: string | null;
          number_of_periods?: number;
          captain_id?: string | null;
          status?: 'scheduled' | 'in_progress' | 'completed';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
      };
      match_players: {
        Row: {
          id: string;
          match_id: string;
          player_id: string;
          is_captain: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          player_id: string;
          is_captain?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          player_id?: string;
          is_captain?: boolean;
          created_at?: string;
        };
      };
      period_tracking: {
        Row: {
          id: string;
          match_id: string;
          period_number: number;
          started_at: string;
          ended_at: string | null;
          paused_at: string | null;
          cumulative_seconds: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          period_number: number;
          started_at?: string;
          ended_at?: string | null;
          paused_at?: string | null;
          cumulative_seconds?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          period_number?: number;
          started_at?: string;
          ended_at?: string | null;
          paused_at?: string | null;
          cumulative_seconds?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      match_events: {
        Row: {
          id: string;
          match_id: string;
          player_id: string;
          event_type: 'goal' | 'assist' | 'tackle' | 'save' | 'yellow_card' | 'red_card' | 'substitution_on' | 'substitution_off';
          cumulative_time_seconds: number;
          period_number: number;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          player_id: string;
          event_type: 'goal' | 'assist' | 'tackle' | 'save' | 'yellow_card' | 'red_card' | 'substitution_on' | 'substitution_off';
          cumulative_time_seconds: number;
          period_number: number;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          player_id?: string;
          event_type?: 'goal' | 'assist' | 'tackle' | 'save' | 'yellow_card' | 'red_card' | 'substitution_on' | 'substitution_off';
          cumulative_time_seconds?: number;
          period_number?: number;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      match_awards: {
        Row: {
          id: string;
          match_id: string;
          player_id: string;
          award_type: 'player_of_match';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          player_id: string;
          award_type?: 'player_of_match';
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          player_id?: string;
          award_type?: 'player_of_match';
          notes?: string | null;
          created_at?: string;
        };
      };
      rewards: {
        Row: {
          id: string;
          name: string;
          description: string;
          reward_type: 'match' | 'season' | 'leadership';
          criteria_event_type: 'goal' | 'assist' | 'tackle' | 'save' | null;
          criteria_threshold: number;
          criteria_scope: 'single_match' | 'season' | 'career' | 'special';
          icon: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          reward_type: 'match' | 'season' | 'leadership';
          criteria_event_type?: 'goal' | 'assist' | 'tackle' | 'save' | null;
          criteria_threshold: number;
          criteria_scope: 'single_match' | 'season' | 'career' | 'special';
          icon?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          reward_type?: 'match' | 'season' | 'leadership';
          criteria_event_type?: 'goal' | 'assist' | 'tackle' | 'save' | null;
          criteria_threshold?: number;
          criteria_scope?: 'single_match' | 'season' | 'career' | 'special';
          icon?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      player_rewards: {
        Row: {
          id: string;
          player_id: string;
          reward_id: string;
          achieved_date: string;
          match_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          reward_id: string;
          achieved_date?: string;
          match_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          reward_id?: string;
          achieved_date?: string;
          match_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
    };
  };
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];
export type Player = Database['public']['Tables']['players']['Row'];
export type TeamMember = Database['public']['Tables']['team_members']['Row'];
export type Match = Database['public']['Tables']['matches']['Row'];
export type MatchPlayer = Database['public']['Tables']['match_players']['Row'];
export type PeriodTracking = Database['public']['Tables']['period_tracking']['Row'];
export type MatchEvent = Database['public']['Tables']['match_events']['Row'];
export type MatchAward = Database['public']['Tables']['match_awards']['Row'];
export type Reward = Database['public']['Tables']['rewards']['Row'];
export type PlayerReward = Database['public']['Tables']['player_rewards']['Row'];

// Privacy settings type
export interface PlayerPrivacySettings {
  show_stats_to_parents: boolean;
  show_match_history: boolean;
  show_awards: boolean;
}

// Parent children view type
export interface ParentChildView {
  parent_id: string;
  team_id: string;
  player_id: string;
  player_name: string;
  squad_number: number | null;
  position: string | null;
  date_of_birth: string | null;
  privacy_settings: PlayerPrivacySettings | null;
  team_name: string;
  age_group: string | null;
  season: string | null;
  matches_played: number;
}

// Reward-related types
export interface RewardWithProgress extends Reward {
  is_earned: boolean;
  earned_at?: string;
  progress?: number; // e.g., 23 out of 30 goals
  progress_total?: number; // e.g., 30
}

export interface PlayerRewardWithDetails extends PlayerReward {
  reward: Reward;
  player?: Player;
  match?: Match;
}

export interface RewardMetadata {
  requires?: {
    goal?: number;
    assist?: number;
    tackle?: number;
    save?: number;
    total_events?: number;
    captain_count?: number;
    captain_and_potm_same_match?: boolean;
  };
  actual_count?: number; // Store actual count when reward was earned
}
