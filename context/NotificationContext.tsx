"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { notificationApi, Notification } from '@/lib/api/notification-api';
import { toast } from 'react-hot-toast';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationApi.fetchNotifications(20, 0);
      setNotifications(data.notifications);
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('فشل تحديث الإشعار');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('تم تحديد جميع الإشعارات كمقروءة');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('فشل تحديث الإشعارات');
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(prev => {
        const notification = prev.find(n => n.id === id);
        if (notification && !notification.isRead) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        return prev.filter(n => n.id !== id);
      });
      toast.success('تم حذف الإشعار');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('فشل حذف الإشعار');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetchNotifications();

    // Setup WebSocket connection
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030/api';
    const socketBaseUrl = API_URL.replace(/\/api\/?$/, '');
    const newSocket = io(`${socketBaseUrl}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Notification WebSocket connected');
    });

    newSocket.on('notification', (notification: Notification) => {
      console.log('Received notification:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast.success(notification.title, {
        duration: 4000,
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Notification WebSocket disconnected');
    });

    setSocket(newSocket);

    const handleRefresh = () => {
      fetchNotifications();
    };

    window.addEventListener('refresh-notifications', handleRefresh);

    return () => {
      window.removeEventListener('refresh-notifications', handleRefresh);
      newSocket.close();
    };
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
