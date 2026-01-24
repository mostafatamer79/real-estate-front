// app/chat/page.tsx - Updated with proper API
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Search, Filter, User, Clock, Check, CheckCheck, ArrowRight } from "lucide-react";

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
      const token = localStorage.getItem('token');

      const response = await fetch('/api/chat/rooms', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const result = await response.json();

      // Transform rooms to include additional data
      const transformedRooms: ChatRoom[] = result.data.map((room: any) => {
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
      });

      setChats(transformedRooms);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFullName = (firstName: string = '', lastName: string = '') => {
    return `${firstName} ${lastName}`.trim() || 'مستخدم';
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
        return date.toLocaleTimeString('ar-SA', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (diffInHours < 48) {
        return 'أمس';
      } else {
        return date.toLocaleDateString('ar-SA', {
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      return 'الآن';
    }
  };

  const getOtherParticipantName = (chat: ChatRoom) => {
    if (chat.otherParticipant) {
      return getFullName(chat.otherParticipant.firstName, chat.otherParticipant.lastName);
    }

    // Fallback to room name if no participant found
    return chat.name || 'محادثة';
  };

  const getLastMessagePreview = (chat: ChatRoom) => {
    if (!chat.lastMessage) return 'بدء محادثة جديدة';

    const senderName = chat.lastMessage.sender.id === currentUser?.id
      ? 'أنت'
      : getFullName(chat.lastMessage.sender.firstName, chat.lastMessage.sender.lastName);

    return `${senderName}: ${chat.lastMessage.content}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700"></div>
      </div>
    );
  }

  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-gray-700" />
                <h1 className="text-2xl font-bold text-gray-800">المحادثات</h1>
                {chats.length > 0 && (
                <span className="bg-gray-700 text-white text-sm px-2 py-1 rounded-full">
                    {chats.length}
                </span>
                )}
             </div>
             <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm"
              >
                <ArrowRight className="w-5 h-5 transform rotate-180" />
                <span>العودة للرئيسية</span>
              </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث في المحادثات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
              dir="rtl"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">جميع المحادثات</h2>
              <button
                onClick={fetchChats}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">تحديث</span>
              </button>
            </div>
          </div>

          {filteredChats.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {searchQuery ? "لا توجد نتائج" : "لا توجد محادثات"}
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "لم يتم العثور على محادثات تطابق بحثك"
                  : "ابدأ محادثة جديدة من خلال صفحة العروض"
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
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
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
                          <CheckCheck className="w-4 h-4 text-blue-500" />
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