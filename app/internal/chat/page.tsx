"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Search, Filter, User, Clock, Check, CheckCheck, Sparkles, ArrowLeft, Plus, X, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { chatApi } from "@/lib/chat";
import api from "@/lib/api";
import { toast } from "sonner";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { motion, AnimatePresence } from "framer-motion";

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

  // States for starting new direct chat
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);

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

  const handleOpenNewChatModal = async () => {
    setIsNewChatModalOpen(true);
    setLoadingUsers(true);
    try {
      const res = await api.get("/user");
      setUsersList(res.data || []);
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.error(isRtl ? "فشل تحميل قائمة المستخدمين" : "Failed to load users list");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSelectUser = async (targetUser: any) => {
    setCreatingRoom(true);
    try {
      const room = await chatApi.getOrCreateDirectRoom(targetUser.id);
      const targetRoomId = room?.id || room?.data?.id;
      if (targetRoomId) {
        setIsNewChatModalOpen(false);
        router.push(`/internal/chat/${targetRoomId}`);
      } else {
        toast.error(isRtl ? "تعذر إنشاء المحادثة" : "Could not start chat");
      }
    } catch (err) {
      console.error("Error starting direct chat:", err);
      toast.error(isRtl ? "حدث خطأ أثناء فتح المحادثة" : "Error opening chat");
    } finally {
      setCreatingRoom(false);
    }
  };

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

  const filteredUsers = usersList.filter(user => {
    // Exclude self
    if (user.id === currentUser?.id) return false;
    const query = searchUserQuery.toLowerCase();
    const fullName = getFullName(user.firstName, user.lastName).toLowerCase();
    return (
      fullName.includes(query) ||
      (user.email?.toLowerCase().includes(query) ?? false) ||
      (user.phone?.includes(query) ?? false)
    );
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
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="max-w-4xl mx-auto space-y-4 p-4 md:p-6" 
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Welcome Header */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border bg-card p-4 shadow-sm">
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="p-2 bg-muted hover:bg-muted border border rounded-xl text-slate-700 transition-colors"
              title={isRtl ? "رجوع" : "Back"}
            >
              <ArrowLeft className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
            </button>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-muted text-slate-600 border border text-[9px] font-black uppercase tracking-widest">
                  <MessageSquare className="w-3 h-3 text-slate-500" />
                  {t("internal.nav.chat")}
                </div>
                {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                  <button 
                    onClick={handleOpenNewChatModal}
                    className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                    {isRtl ? "محادثة جديدة" : "New Chat"}
                  </button>
                )}
              </div>
              <h1 className="text-xl font-black text-slate-950 tracking-tight">{t("internal.chat.centerTitle")}</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("internal.chat.centerSubtitle")}</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-muted border border flex items-center justify-center text-slate-950">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 ${isRtl ? "right-4" : "left-4"}`} />
          <input
            type="text"
            placeholder={t("internal.chat.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-2 bg-card border border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 shadow-sm transition-all text-xs font-bold ${isRtl ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"}`}
          />
        </div>
        <button 
          onClick={fetchChats}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-card border border rounded-xl text-slate-600 hover:text-slate-950 shadow-sm hover:shadow-md transition-all font-black text-xs h-9"
        >
          <Filter className="w-3.5 h-3.5" />
          {t("internal.common.refresh")}
        </button>
      </motion.div>

      {/* Chat List */}
      <motion.div variants={item} className="grid grid-cols-1 gap-2">
        {loading ? (
          new Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-16 bg-card rounded-xl border border animate-pulse" />
          ))
        ) : filteredChats.length === 0 ? (
          <div className="bg-card rounded-2xl border border p-8 text-center shadow-sm">
            <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h3 className="text-base font-black text-slate-700">{t("internal.chat.emptyTitle")}</h3>
            <p className="text-xs text-slate-400 mt-1">{t("internal.chat.emptySubtitle")}</p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <motion.div
              key={chat.id}
              whileHover={{ scale: 1.005 }}
              onClick={() => router.push(`/internal/chat/${chat.id}`)}
              className="group relative flex items-center gap-3 p-4 bg-card border border rounded-xl cursor-pointer hover:shadow-lg hover:shadow-stone-400 transition-all"
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 bg-muted border border rounded-xl flex items-center justify-center group-hover:bg-slate-950 transition-colors">
                  <User className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                {chat.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-950 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg">
                    {chat.unreadCount}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-sm font-black text-slate-900 truncate">
                    {getOtherParticipantName(chat)}
                  </h4>
                  {chat.lastMessage && (
                    <span className="text-[9px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTime(chat.lastMessage.createdAt)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400 truncate max-w-[80%]">
                    {getLastMessagePreview(chat)}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {chat.offerId && (
                      <span className="px-1.5 py-0.5 bg-muted border border rounded text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                        {t("internal.chat.offerTag")}
                      </span>
                    )}
                    {chat.unreadCount > 0 ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
                    ) : (
                      <CheckCheck className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              </div>

              <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-lg bg-muted border border flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {isNewChatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" dir={isRtl ? "rtl" : "ltr"}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full w-[95vw] sm:max-w-md rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]"
            >
              <button 
                onClick={() => setIsNewChatModalOpen(false)} 
                className="absolute left-4 top-4 p-1.5 text-slate-400 hover:text-slate-950 hover:bg-muted rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">{isRtl ? "بدء محادثة جديدة" : "New Chat"}</h2>
                  <p className="text-[10px] text-slate-400 font-bold">{isRtl ? "اختر مستخدماً لمراسلته" : "Select a user to chat with"}</p>
                </div>
              </div>

              <div className="relative mb-3">
                <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 ${isRtl ? "right-3" : "left-3"}`} />
                <input
                  type="text"
                  placeholder={isRtl ? "ابحث بالاسم، البريد أو الهاتف..." : "Search by name, email or phone..."}
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className={`w-full py-2 bg-muted border border-transparent focus:border-slate-950 rounded-xl focus:outline-none focus:ring-0 text-xs font-bold ${isRtl ? "pr-9 pl-3 text-right" : "pl-9 pr-3 text-left"}`}
                />
              </div>

              <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[350px] space-y-1.5 scrollbar-hide">
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-950" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-xs font-bold">{isRtl ? "لم يتم العثور على مستخدمين" : "No users found"}</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      disabled={creatingRoom}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-all text-start border border-transparent hover:border"
                    >
                      <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-slate-950 truncate">
                          {getFullName(user.firstName, user.lastName)}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">{user.email || user.phone}</p>
                      </div>
                      <span className="px-1.5 py-0.5 bg-muted text-slate-500 border border rounded text-[8px] font-black uppercase tracking-tighter">
                        {t(`admin.trans.role.${user.role}`) || user.role}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
