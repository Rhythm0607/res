import api from './api';

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  coverage: string | null;
  status: string;
  created_at: string;
}

export const teamService = {
  getTeam: async (): Promise<TeamMember[]> => {
    const response = await api.get<TeamMember[]>('/team');
    return response.data;
  },

  inviteMember: async (name: string, email: string, role: string, coverage?: string): Promise<TeamMember> => {
    const response = await api.post<TeamMember>('/team', { name, email, role, coverage });
    return response.data;
  },

  removeMember: async (id: number): Promise<void> => {
    await api.delete(`/team/${id}`);
  },
};
