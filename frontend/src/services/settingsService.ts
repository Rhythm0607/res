import api from './api';

export interface UserSettings {
  id: number;
  user_id: number;
  skills_match: number;
  experience_match: number;
  culture_match: number;
  communication_match: number;
  theme_preference: string;
  alert_match: boolean;
  alert_recap: boolean;
}

export const settingsService = {
  getSettings: async (): Promise<UserSettings> => {
    const response = await api.get<UserSettings>('/settings');
    return response.data;
  },

  updateSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await api.put<UserSettings>('/settings', settings);
    return response.data;
  },
};
