"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Search, Filter, User, Clock, Check, CheckCheck, Sparkles, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { chatApi } from "@/lib/chat";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
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

export default function InternalChatPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { isOpen, message, isAdmin } = useSectionGuard('chat');
  const isRtl = language === "ar";

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
          unreadCount: room.unreadCount || 0,
          offerId: room.offerId,
          otherParticipant,
        };
      }) : [];

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
    return `${first} ${last}`.trim() || t("internal.chat.userFallback");
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
        return t("internal.chat.yesterday");
      } else {
        return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      return t("internal.chat.now");
    }
  };

  const getOtherParticipantName = (chat: ChatRoom) => {
    if (chat.otherParticipant) {
      return getFullName(chat.otherParticipant.firstName, chat.otherParticipant.lastName);
    }
    return chat.name || t("internal.chat.conversationFallback");
  };

  const getLastMessagePreview = (chat: ChatRoom) => {
    if (!chat.lastMessage) return t("internal.chat.startNew");
    const sender = chat.lastMessage.sender;
    const senderName = sender?.id === currentUser?.id
      ? t("internal.chat.you")
      : getFullName(sender?.firstName, sender?.lastName);
    return `${senderName}: ${chat.lastMessage.content || ''}`;
  };

  if (!isOpen) {
    return <ComingSoonOverlay sectionName={t("internal.nav.chat")} message={message} isAdmin={isAdmin} />;
  }

  const container = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } }
  };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Welcome Header */}
      <motion.div variants={item} className="relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-slate-950/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-slate-950/5 blur-3xl" />
        <div className="relative flex items-center justify-between gap-6">
	          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              {t("internal.nav.chat")}
            </div>
	            <h1 className="text-2xl font-black text-slate-950 tracking-tight">{t("internal.chat.centerTitle")}</h1>
	            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t("internal.chat.centerSubtitle")}</p>
	          </div>
          <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-950">
            <MessageSquare className="w-8 h-8" />
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 ${isRtl ? "right-4" : "left-4"}`} />
          <input
            type="text"
            placeholder={t("internal.chat.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-3 bg-white border border-slate-100 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-slate-950 shadow-sm transition-all text-sm font-bold ${isRtl ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"}`}
          />
        </div>
        <button 
          onClick={fetchChats}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-100 rounded-[1.25rem] text-slate-600 hover:text-slate-950 shadow-sm hover:shadow-md transition-all font-black text-sm"
        >
          <Filter className="w-4 h-4" />
          {t("internal.common.refresh")}
        </button>
      </motion.div>

      {/* Chat List */}
      <motion.div variants={item} className="grid grid-cols-1 gap-3">
        {loading ? (
          new Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-[2rem] border border-slate-100 animate-pulse" />
          ))
        ) : filteredChats.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center shadow-sm">
            <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-700">{t("internal.chat.emptyTitle")}</h3>
            <p className="text-sm text-slate-400 mt-2">{t("internal.chat.emptySubtitle")}</p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <motion.div
              key={chat.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => router.push(`/internal/chat/${chat.id}`)}
              className="group relative flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-[2rem] cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 transition-all"
            >
              <div className="relative shrink-0">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-slate-950 transition-colors">
                  <User className="w-8 h-8 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                {chat.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-slate-950 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                    {chat.unreadCount}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-[16px] font-black text-slate-900 truncate">
                    {getOtherParticipantName(chat)}
                  </h4>
                  {chat.lastMessage && (
                    <span className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                      <Clock className="w-3 h-3" />
                      {formatTime(chat.lastMessage.createdAt)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-slate-400 truncate max-w-[80%]">
                    {getLastMessagePreview(chat)}
                  </p>
                  <div className="flex items-center gap-2">
                    {chat.offerId && (
                      <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        {t("internal.chat.offerTag")}
                      </span>
                    )}
                    {chat.unreadCount > 0 ? (
                      <div className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
                    ) : (
                      <CheckCheck className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                </div>
              </div>

              <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
