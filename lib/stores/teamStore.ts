import { create } from 'zustand';
import type { Team } from '@/lib/types/database';

interface TeamState {
  teams: Team[];
  currentTeam: Team | null;
  isLoading: boolean;
  setTeams: (teams: Team[]) => void;
  setCurrentTeam: (team: Team | null) => void;
  addTeam: (team: Team) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  removeTeam: (id: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  clear: () => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  teams: [],
  currentTeam: null,
  isLoading: false,
  setTeams: (teams) => set({ teams }),
  setCurrentTeam: (team) => set({ currentTeam: team }),
  addTeam: (team) => set((state) => ({ teams: [...state.teams, team] })),
  updateTeam: (id, updates) =>
    set((state) => ({
      teams: state.teams.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      currentTeam:
        state.currentTeam?.id === id
          ? { ...state.currentTeam, ...updates }
          : state.currentTeam,
    })),
  removeTeam: (id) =>
    set((state) => ({
      teams: state.teams.filter((t) => t.id !== id),
      currentTeam: state.currentTeam?.id === id ? null : state.currentTeam,
    })),
  setIsLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ teams: [], currentTeam: null, isLoading: false }),
}));
