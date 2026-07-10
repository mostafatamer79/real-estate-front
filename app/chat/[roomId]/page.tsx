"use client";
import { io } from "socket.io-client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { ArrowRight, Send, CheckCheck, MessageSquare, Wifi, WifiOff } from "lucide-react";
import { chatApi } from "@/lib/chat";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function NormalChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

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
      return date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "الآن";
    }
  };

  const getOtherParticipant = () => {
    if (!roomDetails || !roomDetails.participants || !currentUser) return null;
    return roomDetails.participants.find((p: any) => p.id !== currentUser.id);
  };

  const getFullName = (firstName: string | null = '', lastName: string | null = '') => {
    const first = firstName || '';
    const last = lastName || '';
    return `${first} ${last}`.trim() || 'مستخدم';
  };

  const handleReturn = () => {
    if (typeof window === "undefined") {
      router.push("/chat");
      return;
    }

    const referrer = document.referrer;
    if (referrer) {
      try {
        const previousUrl = new URL(referrer);
        const isSameOrigin = previousUrl.origin === window.location.origin;
        const isDifferentPage = previousUrl.pathname !== window.location.pathname;
        const isOutsideChat = !previousUrl.pathname.startsWith("/chat");
        if (isSameOrigin && isDifferentPage && isOutsideChat) {
          router.back();
          return;
        }
      } catch {
        // Fall back below when referrer is not a valid URL.
      }
    }

    router.push("/chat");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();
  const otherParticipantName = otherParticipant
    ? getFullName(otherParticipant.firstName, otherParticipant.lastName)
    : roomDetails?.name || 'محادثة';

  return (
    <div className="min-h-screen bg-muted px-4 py-5" dir="rtl">
      <div className="mx-auto flex h-[calc(100vh-2.5rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border border bg-card shadow-sm">
        
        {/* Header */}
        <div className="border-b border bg-card px-5 py-4">
          <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleReturn}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border bg-muted text-slate-600 transition-all hover:bg-slate-950 hover:text-white"
              aria-label="العودة"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-lg font-black text-white">
                  {otherParticipantName.charAt(0)}
                </div>
                <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>
              <div>
                <h1 className="text-lg font-black leading-tight text-slate-950">{otherParticipantName}</h1>
                <p className={`mt-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                  {isOnline ? 'متصل الآن' : 'غير متصل'}
                </p>
              </div>
            </div>
          </div>
          <div className="hidden rounded-full bg-muted px-4 py-2 text-[10px] font-black text-slate-500 md:block">
            Enter للإرسال · Shift+Enter لسطر جديد
          </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-muted p-5 scrollbar-hide md:p-7">
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center space-y-3 text-center text-slate-300">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card shadow-sm">
                  <MessageSquare className="h-10 w-10" />
                </div>
                <p className="text-sm font-black text-slate-400">لا توجد رسائل سابقة</p>
                <p className="max-w-xs text-xs font-bold text-slate-300">ابدأ المحادثة برسالة واضحة حتى يسهل متابعة الطلب.</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isOwn = msg.sender?.id === currentUser?.id;
                return (
                  <motion.div
                    key={msg.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex max-w-[84%] flex-col gap-1 md:max-w-[70%]">
                      <div
                        className={`px-4 py-3 shadow-sm ${
                          isOwn
                            ? 'rounded-2xl rounded-br-md bg-slate-950 text-white'
                            : 'rounded-2xl rounded-bl-md border border bg-card text-slate-900'
                        }`}
                      >
                        <p className="text-[13px] font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[9px] font-black uppercase text-slate-400">
                          {formatTime(msg.createdAt)}
                        </span>
                        {isOwn && <CheckCheck className="h-3 w-3 text-slate-300" />}
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
        <div className="border-t border bg-card p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالة..."
                className="max-h-[150px] min-h-[52px] w-full resize-none rounded-xl border border bg-muted px-4 py-3 text-sm font-bold outline-none transition-all focus:border-slate-950"
                rows={1}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-slate-950 text-white transition-all hover:bg-black active:scale-95 disabled:scale-100 disabled:opacity-30"
            >
              <Send className="mb-1 ml-1 h-5 w-5 -rotate-45" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
