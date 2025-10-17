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
    };
  };
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];
export type Player = Database['public']['Tables']['players']['Row'];
export type TeamMember = Database['public']['Tables']['team_members']['Row'];
