"use client";

import { io, Socket } from "socket.io-client";
import { useLanguage } from "@/context/LanguageContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowLeft, ArrowRight, Send, Clock, MessageSquare, WifiOff, AlertCircle, RotateCcw } from "lucide-react";
import { chatApi } from "@/lib/chat";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { canNavigateBack } from "@/lib/workspace-usability";
import {
  Participant,
  sanitizeParticipants,
  safeParticipantName,
  formatConversationTime,
} from "@/lib/redesign-chat07-chat-utils";

interface MessageItem {
  id: string;
  content: string;
  sender?: {
    id?: string | number | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  senderId?: string | number | null;
  createdAt?: string | null;
}

interface StoredUser {
  id?: string | number;
  userId?: string | number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface RoomDetails {
  id: string;
  name?: string | null;
  participants?: Participant[];
  offerId?: string | null;
}

export default function InternalChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { t, language } = useLanguage();
  const isRtl = language === "ar";

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const roomDetailsRef = useRef<RoomDetails | null>(null);
  const currentUserRef = useRef<StoredUser | null>(null);
  const isMountedRef = useRef(true);
  const pendingDraftRef = useRef<string>("");

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    roomDetailsRef.current = roomDetails;
  }, [roomDetails]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const getOtherParticipantId = useCallback(() => {
    const details = roomDetailsRef.current;
    const user = currentUserRef.current;
    if (!details || !details.participants || !user) return null;
    const myId = user.id ?? user.userId;
    const participants = sanitizeParticipants(details.participants);
    const other = participants.find((p) => (myId != null && p.id != null ? String(p.id) !== String(myId) : true));
    return other?.id != null ? String(other.id) : null;
  }, []);

  useEffect(() => {
    const otherId = getOtherParticipantId();
    if (socket && socket.connected && otherId) {
      socket.emit("checkUserStatus", { userId: otherId });
    }
  }, [roomDetails, currentUser, socket, getOtherParticipantId]);

  const fetchRoomDetails = useCallback(async () => {
    try {
      const response = await api.get(`/chat/rooms/${roomId}`);
      if (!isMountedRef.current) return;
      const data = response.data as RoomDetails;
      if (data && typeof data === "object") {
        setRoomDetails({
          ...data,
          participants: sanitizeParticipants(data.participants),
        });
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Error fetching room details:", error);
    }
  }, [roomId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const msgs = await chatApi.getRoomMessages(roomId);
      if (!isMountedRef.current) return;
      if (Array.isArray(msgs)) {
        setMessages(msgs);
        setTimeout(scrollToBottom, 100);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("refresh-notifications"));
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Error fetching messages:", error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [roomId, scrollToBottom]);

  const setupWebSocket = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const parsedUser = userStr ? (JSON.parse(userStr) as StoredUser) : null;
    const userId = currentUserRef.current?.id ?? currentUserRef.current?.userId ?? parsedUser?.id ?? parsedUser?.userId;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3030";
    const socketUrl = wsUrl.replace(/^ws/, "http");

    const socketIo: Socket = io(`${socketUrl}/chat`, {
      auth: {
        token,
        userId: userId != null ? String(userId) : undefined,
      },
      transports: ["websocket", "polling"],
    });

    socketIo.on("connect", () => {
      if (!isMountedRef.current) return;
      setSocketConnected(true);
      setSendError(null);
      socketIo.emit("joinRoom", { roomId });
      const otherId = getOtherParticipantId();
      if (otherId) {
        socketIo.emit("checkUserStatus", { userId: otherId });
      }
    });

    socketIo.on("disconnect", () => {
      if (!isMountedRef.current) return;
      setSocketConnected(false);
      setIsOnline(false);
      if (pendingDraftRef.current) {
        setMessage(pendingDraftRef.current);
        pendingDraftRef.current = "";
        setIsSending(false);
        setSendError(
          isRtl
            ? "انقطع الاتصال بالخادم. تم استرجاع مسودة رسالتك للمحاولة مجدداً."
            : "Disconnected from server. Your draft has been restored to try again."
        );
      }
    });

    socketIo.on("error", (err: unknown) => {
      if (!isMountedRef.current) return;
      console.error("Socket error received:", err);
      if (pendingDraftRef.current) {
        setMessage(pendingDraftRef.current);
        pendingDraftRef.current = "";
        setIsSending(false);
        const errMsg =
          err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
            ? (err as { message: string }).message
            : isRtl
            ? "تعذر إرسال الرسالة من الخادم. تم استرجاع المسودة."
            : "Server rejected message. Draft restored.";
        setSendError(errMsg);
      }
    });

    socketIo.on("receiveMessage", (data: unknown) => {
      if (!isMountedRef.current) return;
      const rec = data as { message?: MessageItem; data?: MessageItem } | MessageItem;
      const msg = (rec && "message" in rec ? rec.message : rec && "data" in rec ? rec.data : rec) as MessageItem;

      if (msg && msg.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 50);

        // Confirm delivery if this was our message
        const myId = currentUserRef.current?.id ?? currentUserRef.current?.userId;
        const senderId = msg.sender?.id ?? msg.senderId;
        if (
          myId != null &&
          senderId != null &&
          String(senderId) === String(myId) &&
          pendingDraftRef.current
        ) {
          if (msg.content === pendingDraftRef.current) {
            pendingDraftRef.current = "";
            setIsSending(false);
            setSendError(null);
          }
        }

        // Mark room as read on incoming message from other user
        const otherId = getOtherParticipantId();
        if (otherId && senderId != null && String(senderId) === String(otherId)) {
          chatApi
            .markRoomAsRead(roomId)
            .then(() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("refresh-notifications"));
              }
            })
            .catch((err) => console.error("Failed to mark room as read:", err));
        }
      }
    });

    socketIo.on("userStatus", (data: { userId: string; status: string }) => {
      if (!isMountedRef.current) return;
      const otherId = getOtherParticipantId();
      if (data && data.userId === otherId) {
        setIsOnline(data.status === "online");
      }
    });

    setSocket(socketIo);
    return socketIo;
  }, [roomId, getOtherParticipantId, isRtl, scrollToBottom]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const parsed = JSON.parse(userData) as StoredUser;
          currentUserRef.current = parsed;
          setCurrentUser(parsed);
        } catch (err) {
          console.error("Failed to parse user data:", err);
        }
      }
    }

    let activeSocket: Socket | null = null;
    if (roomId) {
      void fetchRoomDetails();
      void fetchMessages();
      activeSocket = setupWebSocket();
    }

    return () => {
      if (activeSocket) {
        activeSocket.disconnect();
      }
    };
  }, [roomId, fetchRoomDetails, fetchMessages, setupWebSocket]);

  // Delivery timeout protector: restore draft if no confirmation arrives within 10s
  useEffect(() => {
    if (!isSending || !pendingDraftRef.current) return;
    const timeout = setTimeout(() => {
      if (isSending && pendingDraftRef.current) {
        setMessage(pendingDraftRef.current);
        pendingDraftRef.current = "";
        setIsSending(false);
        setSendError(
          isRtl
            ? "لم يتم تأكيد وصول الرسالة خلال المهلة المحددة. تم استرجاع المسودة."
            : "Message delivery timed out. Your draft was restored."
        );
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [isSending, isRtl]);

  const sendMessage = async () => {
    const draft = message.trim();
    if (!draft || isSending) return;

    if (!socket || !socket.connected) {
      setSendError(
        isRtl
          ? "تعذر إرسال الرسالة لانقطاع الاتصال. مسودتك محفوظة بأمان."
          : "Cannot send message while offline. Your draft is safely preserved."
      );
      return;
    }

    setIsSending(true);
    setSendError(null);
    pendingDraftRef.current = draft;

    try {
      socket.emit("sendMessage", {
        roomId,
        content: draft,
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setMessage(pendingDraftRef.current);
      pendingDraftRef.current = "";
      setIsSending(false);
      setSendError(
        isRtl
          ? "تعذر إرسال الرسالة. تم استرجاع المسودة."
          : "Failed to send message. Draft restored."
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleReturn = () => {
    if (typeof window !== "undefined") {
      const navigation = (window as Window & {
        navigation?: {
          currentEntry?: { index: number };
          entries: () => Array<{ index: number; url?: string }>;
        };
      }).navigation;
      const currentEntry = navigation?.currentEntry;
      const previousUrl = currentEntry
        ? navigation?.entries().find((entry) => entry.index === currentEntry.index - 1)?.url
        : undefined;

      if (
        canNavigateBack(
          window.location.href,
          window.history.length,
          document.referrer,
          currentEntry ? { index: currentEntry.index, previousUrl } : undefined
        )
      ) {
        router.back();
        return;
      }
    }
    router.push("/internal/chat");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" dir={isRtl ? "rtl" : "ltr"}>
        <div className="w-12 h-12 border-4 border-slate-950 border-t-transparent dark:border-white dark:border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const myId = currentUser?.id ?? currentUser?.userId;
  const participants = sanitizeParticipants(roomDetails?.participants);
  const otherParticipant = participants.find(
    (p) => (myId != null && p.id != null ? String(p.id) !== String(myId) : true)
  ) || null;

  const otherParticipantName = safeParticipantName(
    otherParticipant,
    roomDetails?.name,
    t("internal.chat.conversationFallback") || (isRtl ? "محادثة" : "Conversation")
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="calm-panel max-w-4xl mx-auto flex flex-col h-[calc(100vh-160px)] bg-card rounded-2xl border border shadow-sm overflow-hidden w-full"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <header className="px-4 py-3 border-b border flex items-center justify-between shrink-0 bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReturn}
            className="w-8 h-8 rounded-lg bg-muted border border flex items-center justify-center text-muted-foreground dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:border-slate-300 transition-all"
            aria-label={isRtl ? "العودة لقائمة المحادثات الداخلية" : "Back to internal chat list"}
          >
            {isRtl ? (
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="calm-icon w-10 h-10 bg-background dark:bg-slate-950 rounded-xl flex items-center justify-center text-foreground dark:text-white text-base font-black shadow-lg shadow-primary/5 dark:shadow-stone-400/20">
                {otherParticipantName.charAt(0)}
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-border dark:border-white ${
                  isOnline ? "bg-green-500" : "bg-slate-300"
                }`}
              />
            </div>

            <div>
              <h1 className="text-sm font-black text-slate-950 dark:text-white leading-tight">
                {otherParticipantName}
              </h1>
              <p
                className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${
                  isOnline ? "text-green-600 dark:text-green-400" : "text-muted-foreground dark:text-slate-400"
                }`}
              >
                {isOnline ? t("internal.chat.activeNow") || (isRtl ? "متصل الآن" : "Online") : t("internal.chat.inactive") || (isRtl ? "غير متصل" : "Offline")}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Offline Alert Banner */}
      {!socketConnected && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold"
          role="status"
        >
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {isRtl
                ? "الاتصال غير متوفر حالياً. مسودتك محفوظة."
                : "You are currently offline. Your draft is preserved."}
            </span>
          </div>
        </div>
      )}

      {/* Recoverable Send Error Alert Banner */}
      {sendError && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{sendError}</span>
          </div>
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={isSending || !socketConnected}
            className="flex items-center gap-1 underline font-bold hover:opacity-80 disabled:opacity-50"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>{isRtl ? "إعادة المحاولة" : "Retry"}</span>
          </button>
        </div>
      )}

      {/* Messages */}
      <main
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
        aria-label={isRtl ? "سجل الرسائل" : "Message history"}
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="calm-icon w-16 h-16 bg-muted border border rounded-2xl flex items-center justify-center text-foreground dark:text-slate-200">
                <MessageSquare className="w-8 h-8" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-700 dark:text-slate-300">
                  {t("internal.chat.startTitle") || (isRtl ? "لا توجد رسائل سابقة" : "No messages yet")}
                </h2>
                <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
                  {t("internal.chat.startSubtitle") ||
                    (isRtl ? "ابدأ المحادثة الآن لمتابعة العمل والتنسيق." : "Start the conversation to collaborate.")}
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const senderId = msg.sender?.id ?? msg.senderId;
              const isOwn = myId != null && senderId != null && String(senderId) === String(myId);
              const timeString = formatConversationTime(msg.createdAt, isRtl) || (t("internal.chat.now") || (isRtl ? "الآن" : "Now"));

              return (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[70%]">
                    <div
                      className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                        isOwn
                          ? "bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-tr-none"
                          : "bg-muted border border text-slate-950 dark:text-white rounded-tl-none"
                      }`}
                    >
                      <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Real timestamp without fabricated checkmarks */}
                    <div className={`flex items-center gap-1.5 px-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                      <span className="text-[8px] font-black text-muted-foreground dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" aria-hidden="true" />
                        {timeString}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      {/* Input Composer */}
      <footer className="p-4 border-t border bg-card/50 backdrop-blur-md">
        <div className="flex items-end gap-2 w-[95vw] sm:max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (sendError) setSendError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={t("internal.chat.messagePlaceholder") || (isRtl ? "اكتب رسالة..." : "Type a message...")}
              aria-label={isRtl ? "نص الرسالة" : "Message text"}
              className="w-full bg-card border border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-white shadow-sm transition-all resize-none min-h-[44px] max-h-[150px] text-xs font-bold"
              rows={1}
              disabled={isSending}
            />
          </div>

          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!message.trim() || isSending}
            className="w-11 h-11 min-h-[44px] min-w-[44px] bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-primary/5 dark:shadow-stone-400/20"
            aria-label={isRtl ? "إرسال الرسالة" : "Send message"}
          >
            <Send className={`w-4 h-4 ${isRtl ? "-rotate-45 ml-0.5 mb-0.5" : "rotate-45 mr-0.5 mt-0.5"}`} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </motion.div>
  );
}
