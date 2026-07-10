"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Search, User, Clock, CheckCheck, ArrowRight } from "lucide-react";
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
  const { language } = useLanguage();

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

  const unreadTotal = chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);

  return (
    <div className="min-h-screen bg-muted px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl border border bg-card p-3 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white">
              <MessageCircle className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">محادثاتي</h1>
              <p className="mt-1 text-sm font-bold text-slate-500">متابعة المحادثات والردود من مكان واحد.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border bg-muted px-4 py-3 text-center">
              <p className="text-xl sm:text-2xl font-black tabular-nums text-slate-950">{chats.length.toLocaleString("ar-SA")}</p>
              <p className="text-[10px] font-black text-slate-400">محادثة</p>
            </div>
            <div className="rounded-xl border border bg-muted px-4 py-3 text-center">
              <p className="text-xl sm:text-2xl font-black tabular-nums text-slate-950">{unreadTotal.toLocaleString("ar-SA")}</p>
              <p className="text-[10px] font-black text-slate-400">غير مقروءة</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/details")}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-black text-white transition-all hover:bg-black"
            >
              <span>العودة</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input 
          type="text"
          placeholder="ابحث باسم العميل، البريد، أو اسم المحادثة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-14 w-full rounded-xl border border bg-card pr-14 pl-4 text-sm font-bold shadow-sm outline-none transition-all focus:border-slate-950"
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredChats.length === 0 ? (
          <div className="rounded-2xl border border bg-card p-14 text-center shadow-sm">
            <MessageCircle className="mx-auto mb-4 h-16 w-16 text-slate-200" />
            <h3 className="text-lg font-black text-slate-800">لا توجد محادثات مطابقة</h3>
            <p className="mt-1 text-sm font-bold text-slate-400">جرّب بحثًا آخر أو ابدأ محادثة من صفحة العرض أو الطلب.</p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <motion.div
              key={chat.id}
              whileHover={{ y: -2, scale: 1.01 }}
              onClick={() => router.push(`/chat/${chat.id}`)}
              className={`group flex cursor-pointer items-center gap-4 rounded-2xl border bg-card p-5 transition-all hover:border-slate-950 hover:shadow-sm ${
                chat.unreadCount > 0 ? "border-slate-950" : "border"
              }`}
            >
              <div className="relative shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border bg-muted transition-colors group-hover:bg-slate-950">
                  <User className="h-7 w-7 text-slate-400 transition-colors group-hover:text-white" />
                </div>
                {chat.unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-lg">
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
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatTime(chat.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate max-w-[80%] ${chat.unreadCount > 0 ? 'font-black text-slate-950' : 'font-medium text-slate-500'}`}>
                    {chat.lastMessage ? chat.lastMessage.content : "ابدأ محادثة جديدة"}
                  </p>
                  {chat.unreadCount > 0 ? (
                    <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                  ) : (
                    <CheckCheck className="h-4 w-4 text-slate-300" />
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
      </div>
    </div>
  );
}
