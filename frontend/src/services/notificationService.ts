import api from './api';

export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link_url?: string;
  created_at: string;
}

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: number) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};
