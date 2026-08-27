"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { hapticTick } from '@/lib/haptics';

interface NotificationBellProps {
  buttonClassName?: string;
  panelClassName?: string;
  align?: 'left' | 'right';
  variant?: 'dark' | 'light';
}

export default function NotificationBell({
  buttonClassName,
  panelClassName,
  align = 'left',
  variant = 'dark',
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loading } = useNotifications();
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'order':
        return <span className={iconClass}>📋</span>;
      case 'booking':
        return <span className={iconClass}>📅</span>;
      case 'chat':
        return <span className={iconClass}>💬</span>;
      case 'legal_dispute':
        return <span className={iconClass}>⚖️</span>;
      case 'commission':
        return <span className={iconClass}>💰</span>;
      case 'offer':
        return <span className={iconClass}>🏠</span>;
      default:
        return <span className={iconClass}>🔔</span>;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: language === 'ar' ? ar : undefined,
      });
    } catch {
      return dateString;
    }
  };

  const getNotificationHref = (notification: any) => {
    const data = notification?.data || {};

    if (data.ticketId || data.type === 'customer_service_ticket') {
      return data.action === 'admin_reply' ? '/customerservice' : '/admin/customer-service';
    }
    if (data.roomId) return `/chat/${data.roomId}`;
    if (data.offerId) return `/offers/${data.offerId}`;
    if (data.orderId) return `/orders/${data.orderId}`;
    if (data.serviceRequestId) return `/admin/service-requests?requestId=${data.serviceRequestId}`;
    if (data.commissionId) return '/wallet';
    if (data.bookingId) return '/orders';

    switch (notification.type) {
      case 'chat':
        return data.roomId ? `/chat/${data.roomId}` : '/chat';
      case 'offer':
        return data.offerId ? `/offers/${data.offerId}` : '/offers';
      case 'order':
        return data.orderId ? `/orders/${data.orderId}` : '/orders';
      case 'booking':
        return '/orders';
      case 'commission':
        return '/wallet';
      case 'service_request':
        return data.serviceRequestId ? `/admin/service-requests?requestId=${data.serviceRequestId}` : '/services/my-requests';
      case 'legal_dispute':
        return '/disputes';
      default:
        return null;
    }
  };

  const handleNotificationClick = async (notification: any) => {
    const href = getNotificationHref(notification);
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (href) {
      setIsOpen(false);
      router.push(href);
    }
  };

  const isLight = variant === 'light';
  const panelBaseClass = isLight
    ? 'bg-card border shadow-2xl'
    : 'bg-slate-800 border-gray-700 shadow-xl';
  const headerBorderClass = isLight ? 'border' : 'border-gray-700';
  const titleClass = isLight ? 'text-slate-950' : 'text-white';
  const actionClass = isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300';
  const emptyTextClass = isLight ? 'text-slate-400' : 'text-gray-400';
  const listDividerClass = isLight ? 'divide-slate-100' : 'divide-gray-700';
  const unreadClass = isLight ? 'bg-muted' : 'bg-slate-750/50';
  const itemHoverClass = isLight ? 'hover:bg-muted' : 'hover:bg-slate-750';
  const messageClass = isLight ? 'text-slate-500' : 'text-gray-400';
  const timeClass = isLight ? 'text-slate-400' : 'text-gray-500';
  const markReadClass = isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300';
  const deleteClass = isLight ? 'text-red-500 hover:text-red-600' : 'text-red-400 hover:text-red-300';

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => { setIsOpen(!isOpen); hapticTick(); }}
        whileTap={{ scale: 0.9 }}
        className={`relative p-2 text-gray-300 hover:text-white transition-colors ${buttonClassName || ''}`}
        aria-label={t('notification.bell')}
      >
        <motion.div
          animate={isOpen ? { rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Bell 
            className="h-6 w-6" 
            style={{
              color: settings?.headerNotificationColor || undefined,
              width: settings?.headerNotificationSize ? `${settings.headerNotificationSize}px` : undefined,
              height: settings?.headerNotificationSize ? `${settings.headerNotificationSize}px` : undefined,
            }}
          />
        </motion.div>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 text-[8px] font-bold text-white items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </motion.button>

      {/* Dropdown Panel — AnimatePresence for smooth open/close */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.8 }}
            className={`absolute mt-2 w-[min(24rem,calc(100vw-1.5rem))] border rounded-2xl z-[9999] max-h-[600px] flex flex-col backdrop-blur-xl ${
              align === 'right' ? 'right-0' : 'left-0'
            } ${panelBaseClass} ${panelClassName || ''}`}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${headerBorderClass}`}>
              <h3 className={`text-lg font-semibold ${titleClass}`}>{t('notification.title')}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => { markAllAsRead(); hapticTick(); }}
                  className={`text-sm flex items-center gap-1 ${actionClass} transition-colors`}
                >
                  <CheckCheck className="h-4 w-4" />
                  {t('notification.markAllRead')}
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="wow-skeleton w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="wow-skeleton h-3.5 w-3/4 rounded-lg" />
                        <div className="wow-skeleton h-3 w-1/2 rounded-lg" />
                        <div className="wow-skeleton h-2.5 w-20 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className={`p-8 text-center ${emptyTextClass}`}>
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t('notification.empty')}</p>
                </div>
              ) : (
                <div className={`divide-y ${listDividerClass}`}>
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.25 }}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleNotificationClick(notification)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleNotificationClick(notification);
                        }
                      }}
                      className={`p-4 cursor-pointer transition-colors ${itemHoverClass} active:scale-[0.98] ${
                        !notification.isRead ? unreadClass : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${titleClass}`}>
                                {notification.title}
                              </p>
                              <p className={`text-sm mt-1 ${messageClass}`}>
                                {notification.message}
                              </p>
                              <p className={`text-xs mt-2 ${timeClass}`}>
                                {formatTime(notification.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {!notification.isRead && (
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    markAsRead(notification.id);
                                    hapticTick();
                                  }}
                                  className={`p-1 transition-colors ${markReadClass}`}
                                  title={t('notification.markRead')}
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteNotification(notification.id);
                                  hapticTick();
                                }}
                                className={`p-1 transition-colors ${deleteClass}`}
                                title={t('notification.delete')}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
