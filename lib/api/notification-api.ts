import api from '../api';

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'booking' | 'chat' | 'legal_dispute' | 'commission' | 'offer' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
}

export const notificationApi = {
  async fetchNotifications(limit: number = 20, offset: number = 0): Promise<NotificationsResponse> {
    try {
      const response = await api.get('/notifications', {
        params: { limit, offset },
      });
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable (fetchNotifications), returning empty data.');
      return { notifications: [], total: 0 };
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.count;
    } catch (error) {
      console.warn('Backend unavailable (getUnreadCount), returning 0.');
      return 0;
    }
  },

  async markAsRead(id: string): Promise<Notification> {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.warn(`Backend unavailable (markAsRead ${id}), skipping.`);
      // Return a dummy object to satisfy the return type
      return { id, isRead: true } as Notification;
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      await api.patch('/notifications/read-all');
    } catch (error) {
      console.warn('Backend unavailable (markAllAsRead), skipping.');
    }
  },

  async deleteNotification(id: string): Promise<void> {
    try {
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.warn(`Backend unavailable (deleteNotification ${id}), skipping.`);
    }
  },
};
