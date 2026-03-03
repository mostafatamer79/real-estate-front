// app/chat/page.tsx - Updated with proper API
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Search, Filter, User, Clock, Check, CheckCheck, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { chatApi } from "@/lib/chat";

interface ChatRoom {
  id: string;
  name: string;
  lastMessage?: {
    content: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
    };
    createdAt: string;
  };
  participants: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  unreadCount: number;
  offerId?: string;
  otherParticipant?: any;
}

export default function ChatPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = () => {
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            setCurrentUser(JSON.parse(userData));
          } catch (err) {
            console.error('Failed to parse user data:', err);
          }
        }
      }
    };

    fetchUser();
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const data = await chatApi.getUserRooms();

      // Transform rooms to include additional data
      const rooms = data.data || data;
      const transformedRooms: ChatRoom[] = Array.isArray(rooms) ? rooms.map((room: any) => {
        const otherParticipant = room.participants?.find(
          (p: any) => p.id !== currentUser?.id
        );

        return {
          id: room.id,
          name: room.name,
          lastMessage: room.lastMessage,
          participants: room.participants || [],
          unreadCount: 0, // You can implement unread count later
          offerId: room.offerId,
          otherParticipant,
        };
      }) : [];

      setChats(transformedRooms);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFullName = (firstName: string | null = '', lastName: string | null = '') => {
    const first = firstName || '';
    const last = lastName || '';
    return `${first} ${last}`.trim() || t('chat.user') || 'مستخدم';
  };

  const filteredChats = chats.filter(chat => {
    const searchLower = searchQuery.toLowerCase();

    // Search in room name
    if (chat.name.toLowerCase().includes(searchLower)) return true;

    // Search in participants' names
    if (chat.participants.some(p =>
      getFullName(p.firstName, p.lastName).toLowerCase().includes(searchLower) ||
      p.email?.toLowerCase().includes(searchLower)
    )) return true;

    return false;
  });

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (diffInHours < 48) {
        return t('chat.yesterday');
      } else {
        return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      return t('chat.now');
    }
  };

  const getOtherParticipantName = (chat: ChatRoom) => {
    if (chat.otherParticipant) {
      return getFullName(chat.otherParticipant.firstName, chat.otherParticipant.lastName);
    }

    // Fallback to room name if no participant found
    return chat.name || t('chat.conversation');
  };

  const getLastMessagePreview = (chat: ChatRoom) => {
    if (!chat.lastMessage) return t('chat.startNew');

    const sender = chat.lastMessage.sender;
    const senderName = sender?.id === currentUser?.id
      ? t('chat.you')
      : getFullName(sender?.firstName, sender?.lastName);

    return `${senderName}: ${chat.lastMessage.content || ''}`;
  };

  /* ... */

  const { t, language } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-gray-700" />
                <h1 className="text-2xl font-bold text-gray-800">{t('chat.title')}</h1>
                {chats.length > 0 && (
                <span className="bg-slate-700 text-white text-sm px-2 py-1 rounded-full">
                    {chats.length}
                </span>
                )}
             </div>
             <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm"
              >
                <ArrowRight className={`w-5 h-5 transform ${language === 'ar' ? 'rotate-180' : ''}`} />
                <span>{t('chat.back')}</span>
              </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
            <input
              type="text"
              placeholder={t('chat.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600`}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">{t('chat.all')}</h2>
              <button
                onClick={fetchChats}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">{t('chat.refresh')}</span>
              </button>
            </div>
          </div>

          {filteredChats.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {searchQuery ? t('chat.noResults') : t('chat.noChats')}
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? t('chat.noMatch')
                  : t('chat.start')
                }
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredChats.map((chat) => {
                const otherParticipantName = getOtherParticipantName(chat);
                const lastMessagePreview = getLastMessagePreview(chat);

                return (
                  <div
                    key={chat.id}
                    onClick={() => window.location.href = `/chat/${chat.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-800 truncate">
                          {otherParticipantName}
                        </h4>
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(chat.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      {chat.offerId && (
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {chat.name}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate">
                          {lastMessagePreview}
                        </p>
                        {chat.unreadCount > 0 ? (
                          <Check className="w-4 h-4 text-gray-400" />
                        ) : (
                          <CheckCheck className="w-4 h-4 text-gray-800" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}