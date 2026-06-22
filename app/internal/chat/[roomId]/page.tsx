"use client";
import { io } from "socket.io-client";
import { useLanguage } from "@/context/LanguageContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Send, User, Clock, CheckCheck, Sparkles, Phone, Video, Info, MessageSquare } from "lucide-react";
import { chatApi } from "@/lib/chat";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function InternalChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { t, language } = useLanguage();
  const isRtl = language === "ar";

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [roomDetails, setRoomDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [socket, setSocket] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const roomDetailsRef = useRef<any>(null);
  const currentUserRef = useRef<any>(null);

  useEffect(() => {
    roomDetailsRef.current = roomDetails;
  }, [roomDetails]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    const otherId = getOtherParticipantId();
    if (socket && otherId) {
      socket.emit('checkUserStatus', { userId: otherId });
    }
  }, [roomDetails, currentUser, socket]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (err) {
        console.error('Failed to parse user data:', err);
      }
    }

    let activeSocket: any = null;

    if (roomId) {
      fetchRoomDetails();
      fetchMessages();
      activeSocket = setupWebSocket();
    }

    return () => {
      if (activeSocket) activeSocket.disconnect();
    };
  }, [roomId]);

  const fetchRoomDetails = async () => {
    try {
      const response = await api.get(`/chat/rooms/${roomId}`);
      setRoomDetails(response.data);
    } catch (error) {
      console.error("Error fetching room details:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const messages = await chatApi.getRoomMessages(roomId);
      setMessages(messages);
      setTimeout(scrollToBottom, 100);
      window.dispatchEvent(new Event('refresh-notifications'));
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipantId = () => {
    const details = roomDetailsRef.current;
    const user = currentUserRef.current;
    if (!details || !details.participants || !user) return null;
    const other = details.participants.find((p: any) => p.id !== user.id);
    return other?.id;
  }

  const setupWebSocket = () => {
    const token = localStorage.getItem('token');
    const userId = currentUser?.id || JSON.parse(localStorage.getItem('user') || '{}').id;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3030';
    const socketUrl = wsUrl.replace(/^ws/, 'http');

    const socketIo = io(`${socketUrl}/chat`, {
      auth: {
        token,
        userId
      },
      transports: ['websocket', 'polling']
    });

    socketIo.on('connect', () => {
      socketIo.emit('joinRoom', { roomId });
      const otherId = getOtherParticipantId();
      if (otherId) {
        socketIo.emit('checkUserStatus', { userId: otherId });
      }
    });

    socketIo.on('receiveMessage', (data) => {
      const msg = data.message || data.data || data;
      if (msg) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 50);

        // Mark room as read on incoming message from other user
        const otherId = getOtherParticipantId();
        const senderId = msg.sender?.id || msg.senderId;
        if (otherId && senderId === otherId) {
          chatApi.markRoomAsRead(roomId)
            .then(() => {
              window.dispatchEvent(new Event('refresh-notifications'));
            })
            .catch(err => console.error('Failed to mark room as read:', err));
        }
      }
    });

    socketIo.on('userStatus', (data) => {
      const otherId = getOtherParticipantId();
      if (data.userId === otherId) {
        setIsOnline(data.status === 'online');
      }
    });

    setSocket(socketIo);
    return socketIo;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!message.trim() || !socket) return;
    try {
      socket.emit('sendMessage', { roomId, senderId: currentUser?.id, content: message });
      setMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString(language === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return t("internal.chat.now");
    }
  };

  const getOtherParticipant = () => {
    if (!roomDetails || !roomDetails.participants || !currentUser) return null;
    return roomDetails.participants.find((p: any) => p.id !== currentUser.id);
  };

  const getFullName = (firstName: string | null = '', lastName: string | null = '') => {
    const first = firstName || '';
    const last = lastName || '';
    return `${first} ${last}`.trim() || t("internal.chat.userFallback");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();
  const otherParticipantName = otherParticipant
    ? getFullName(otherParticipant.firstName, otherParticipant.lastName)
    : roomDetails?.name || t("internal.chat.conversationFallback");

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-160px)] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden w-full" 
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/internal/chat')}
            className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-950 hover:border-slate-300 transition-all"
          >
            <ArrowLeft className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
          </button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-white text-base font-black shadow-lg shadow-slate-900/20">
                {otherParticipantName.charAt(0)}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-950 leading-tight">{otherParticipantName}</h1>
              <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isOnline ? 'text-green-600' : 'text-slate-400'}`}>
                {isOnline ? t("internal.chat.activeNow") : t("internal.chat.inactive")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-200">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-700">{t("internal.chat.startTitle")}</h3>
                <p className="text-xs text-slate-400 mt-1">{t("internal.chat.startSubtitle")}</p>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwn = msg.sender?.id === currentUser?.id;
              return (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[70%]`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                        isOwn
                          ? 'bg-slate-950 text-white rounded-tr-none'
                          : 'bg-slate-50 border border-slate-100 text-slate-950 rounded-tl-none'
                      }`}
                    >
                      <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime(msg.createdAt)}
                      </span>
                      {isOwn && <CheckCheck className="w-3 h-3 text-slate-300" />}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 bg-white/50 backdrop-blur-md">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("internal.chat.messagePlaceholder")}
              className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-950 shadow-sm transition-all resize-none min-h-[40px] max-h-[150px] text-xs font-bold"
              rows={1}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="w-10 h-10 bg-slate-950 text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-slate-900/20"
          >
            <Send className="w-4 h-4 -rotate-45 ml-0.5 mb-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
