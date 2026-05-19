"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Search, User, Clock, CheckCheck, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { chatApi } from "@/lib/chat";
import { motion } from "framer-motion";

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

export default function NormalChatPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

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
            return JSON.parse(userData);
          } catch (err) {
            console.error('Failed to parse user data:', err);
          }
        }
      }
      return null;
    };

    const u = fetchUser();
    if (u) setCurrentUser(u);
    fetchChats(u);
  }, []);

  const fetchChats = async (user?: any) => {
    try {
      setLoading(true);
      const data = await chatApi.getUserRooms();
      const rooms = data.data || data;
      const dedupedRooms = Array.isArray(rooms)
        ? Array.from(new Map(rooms.map((r: any) => [r.id, r])).values())
        : [];

      const meId = user?.id || user?.userId || currentUser?.id || currentUser?.userId;

      const transformedRooms: ChatRoom[] = dedupedRooms.map((room: any) => {
        const otherParticipant = room.participants?.find(
          (p: any) => (meId ? p.id !== meId : true)
        );

        return {
          id: room.id,
          name: room.name,
          lastMessage: room.lastMessage,
          participants: room.participants || [],
          unreadCount: room.unreadCount || 0,
          offerId: room.offerId,
          otherParticipant,
        };
      });

      // Sort chats from the last sent message (most recent first)
      transformedRooms.sort((a, b) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setChats(transformedRooms);
      window.dispatchEvent(new Event('refresh-notifications'));
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFullName = (firstName: string | null = '', lastName: string | null = '') => {
    const first = firstName || '';
    const last = lastName || '';
    return `${first} ${last}`.trim() || 'مستخدم';
  };

  const filteredChats = chats.filter(chat => {
    const searchLower = searchQuery.toLowerCase();
    if (chat.name.toLowerCase().includes(searchLower)) return true;
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
        return 'أمس';
      } else {
        return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
          month: 'short', day: 'numeric'
        });
      }
    } catch {
      return 'الآن';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-xl shadow-slate-900/20">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">محادثاتي</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">تواصل مع المعلنين</p>
          </div>
        </div>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-950 transition-colors text-sm font-black"
        >
          <span>الرجوع</span>
          <ArrowRight className="w-5 h-5 rotate-180" />
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text"
          placeholder="البحث في المحادثات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-12 pl-4 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-slate-950 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredChats.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center">
            <MessageCircle className="w-16 h-16 text-slate-100 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-700">لا توجد رسائل</h3>
            <p className="text-sm text-slate-400 mt-1">ابدأ بالتواصل مع المعلنين حول العقارات</p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <motion.div
              key={chat.id}
              whileHover={{ y: -2, scale: 1.01 }}
              onClick={() => router.push(`/chat/${chat.id}`)}
              className="group flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-[1.5rem] cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 transition-all"
            >
              <div className="relative shrink-0">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-slate-950 transition-colors">
                  <User className="w-7 h-7 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                {chat.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-slate-950 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-black text-slate-900 truncate">
                    {chat.otherParticipant ? getFullName(chat.otherParticipant.firstName, chat.otherParticipant.lastName) : chat.name}
                  </h4>
                  {chat.lastMessage && (
                    <span className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                      <Clock className="w-3 h-3" />
                      {formatTime(chat.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate max-w-[80%] ${chat.unreadCount > 0 ? 'font-black text-slate-950' : 'font-medium text-slate-500'}`}>
                    {chat.lastMessage ? chat.lastMessage.content : "ابدأ محادثة جديدة"}
                  </p>
                  {chat.unreadCount > 0 ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  ) : (
                    <CheckCheck className="w-4 h-4 text-slate-300" />
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
