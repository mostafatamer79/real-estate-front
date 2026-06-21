"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

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
    ? 'bg-white border-slate-200 shadow-2xl'
    : 'bg-slate-800 border-gray-700 shadow-xl';
  const headerBorderClass = isLight ? 'border-slate-100' : 'border-gray-700';
  const titleClass = isLight ? 'text-slate-950' : 'text-white';
  const actionClass = isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300';
  const emptyTextClass = isLight ? 'text-slate-400' : 'text-gray-400';
  const listDividerClass = isLight ? 'divide-slate-100' : 'divide-gray-700';
  const unreadClass = isLight ? 'bg-slate-50' : 'bg-slate-750/50';
  const itemHoverClass = isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-750';
  const messageClass = isLight ? 'text-slate-500' : 'text-gray-400';
  const timeClass = isLight ? 'text-slate-400' : 'text-gray-500';
  const markReadClass = isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300';
  const deleteClass = isLight ? 'text-red-500 hover:text-red-600' : 'text-red-400 hover:text-red-300';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 text-gray-300 hover:text-white transition-colors ${buttonClassName || ''}`}
        aria-label={t('notification.bell')}
      >
        <Bell 
          className="h-6 w-6" 
          style={{
            color: settings?.headerNotificationColor || undefined,
            width: settings?.headerNotificationSize ? `${settings.headerNotificationSize}px` : undefined,
            height: settings?.headerNotificationSize ? `${settings.headerNotificationSize}px` : undefined,
          }}
        />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className={`absolute mt-2 w-96 border rounded-lg z-[9999] max-h-[600px] flex flex-col ${
          align === 'right' ? 'right-0' : 'left-0'
        } ${panelBaseClass} ${panelClassName || ''}`}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${headerBorderClass}`}>
            <h3 className={`text-lg font-semibold ${titleClass}`}>{t('notification.title')}</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className={`text-sm flex items-center gap-1 ${actionClass}`}
              >
                <CheckCheck className="h-4 w-4" />
                {t('notification.markAllRead')}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className={`p-8 text-center ${emptyTextClass}`}>
                {t('common.loading')}
              </div>
            ) : notifications.length === 0 ? (
              <div className={`p-8 text-center ${emptyTextClass}`}>
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{t('notification.empty')}</p>
              </div>
            ) : (
              <div className={`divide-y ${listDividerClass}`}>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotificationClick(notification)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleNotificationClick(notification);
                      }
                    }}
                    className={`p-4 cursor-pointer transition-colors ${itemHoverClass} ${
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
