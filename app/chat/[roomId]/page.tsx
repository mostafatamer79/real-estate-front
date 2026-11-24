"use client";

import { io, Socket } from "socket.io-client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowRight, ArrowLeft, Send, MessageSquare, Wifi, WifiOff, AlertCircle, RotateCcw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { chatApi } from "@/lib/chat";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { hapticTick } from "@/lib/haptics";
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
  role?: string;
}

interface RoomDetails {
  id: string;
  name?: string | null;
  participants?: Participant[];
  offerId?: string | null;
}

export default function NormalChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { language } = useLanguage();
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
        // Restore draft to input so work is never lost
        setMessage(pendingDraftRef.current);
        pendingDraftRef.current = "";
        setIsSending(false);
        setSendError(
          isRtl
            ? "انقطع الاتصال أثناء الإرسال. تم استرجاع مسودة رسالتك."
            : "Connection lost while sending. Your draft has been restored."
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

        // Confirm delivery of pending draft if this is our message
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
            .catch((e) => console.error("Failed to mark room as read:", e));
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
            ? "لم يتم تأكيد استلام الرسالة خلال المهلة. تم استرجاع المسودة لتتمكن من إعادة المحاولة."
            : "Message delivery timed out. Your draft was restored so you can retry."
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

    hapticTick();
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
    router.push("/chat");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-muted" dir={isRtl ? "rtl" : "ltr"}>
        <div className="space-y-4 w-full max-w-md px-4">
          <div className="flex items-center gap-4">
            <div className="wow-skeleton w-12 h-12 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="wow-skeleton h-4 w-32 rounded-lg" />
              <div className="wow-skeleton h-3 w-20 rounded-lg" />
            </div>
          </div>
          <div className="space-y-3 mt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`wow-skeleton ${i % 2 === 0 ? "w-3/4" : "w-2/3"} h-12 rounded-2xl`} />
              </div>
            ))}
          </div>
        </div>
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
    isRtl ? "محادثة" : "Conversation"
  );

  return (
    <div
      className="calm-page calm-screen min-h-dvh-safe bg-muted px-4 py-5 max-md:px-0 max-md:py-0"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="calm-panel mx-auto flex h-[calc(100dvh-2.5rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border border bg-card shadow-sm max-md:h-[100dvh] max-md:rounded-none max-md:border-0 max-md:shadow-none">
        {/* Header */}
        <header className="border-b border bg-card px-5 py-4 wow-reveal">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.button
                type="button"
                onClick={handleReturn}
                whileTap={{ scale: 0.985 }}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border bg-muted text-slate-600 transition-all hover:bg-background hover:dark:bg-slate-950 hover:text-foreground hover:dark:text-white"
                aria-label={isRtl ? "العودة للمحادثات" : "Back to conversations"}
              >
                {isRtl ? (
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                )}
              </motion.button>

              <div className="flex min-w-0 items-center gap-3">
                <div className="relative shrink-0">
                  <div className="calm-icon flex h-12 w-12 items-center justify-center rounded-xl bg-background dark:bg-slate-950 text-lg font-black text-foreground dark:text-white">
                    {otherParticipantName.charAt(0)}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-border dark:border-white ${
                      isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-lg font-black leading-tight text-slate-950 dark:text-white">
                    {otherParticipantName}
                  </h1>
                  <p
                    className={`mt-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
                      isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground dark:text-slate-400"
                    }`}
                  >
                    {isOnline ? (
                      <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {isOnline ? (isRtl ? "متصل الآن" : "Online") : isRtl ? "غير متصل" : "Offline"}
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden rounded-full bg-muted px-4 py-2 text-[10px] font-black text-muted-foreground dark:text-slate-400 md:block">
              {isRtl ? "Enter للإرسال · Shift+Enter لسطر جديد" : "Enter to send · Shift+Enter for new line"}
            </div>
          </div>
        </header>

        {/* Offline Warning Banner */}
        {!socketConnected && (
          <div
            className="flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold"
            role="status"
          >
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {isRtl
                  ? "الاتصال غير متوفر حالياً. سيتم حفظ أي رسائل تكتبها حتى استعادة الاتصال."
                  : "You are currently offline. Any messages you draft are saved until connection is restored."}
              </span>
            </div>
          </div>
        )}

        {/* Recoverable Send Error Alert Banner */}
        {sendError && (
          <div
            className="flex items-center justify-between gap-3 px-4 py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold"
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

        {/* Messages Feed */}
        <main
          className="flex-1 space-y-4 overflow-y-auto bg-muted p-5 scrollbar-hide md:p-7"
          aria-label={isRtl ? "سجل الرسائل" : "Message history"}
        >
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center space-y-3 text-center text-muted-foreground dark:text-slate-300 wow-reveal">
                <div className="calm-panel flex h-20 w-20 items-center justify-center rounded-2xl bg-card shadow-sm">
                  <MessageSquare className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                </div>
                <h2 className="text-sm font-black text-muted-foreground dark:text-slate-300">
                  {isRtl ? "لا توجد رسائل سابقة" : "No messages yet"}
                </h2>
                <p className="max-w-xs text-xs font-bold text-muted-foreground dark:text-slate-400">
                  {isRtl
                    ? "ابدأ المحادثة برسالة واضحة حتى يسهل متابعة الطلب."
                    : "Start the conversation with a clear message to track your inquiry."}
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const senderId = msg.sender?.id ?? msg.senderId;
                const isOwn = myId != null && senderId != null && String(senderId) === String(myId);
                const timeString = formatConversationTime(msg.createdAt, isRtl) || (isRtl ? "الآن" : "Now");

                return (
                  <motion.div
                    key={msg.id || index}
                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div className="flex max-w-[84%] flex-col gap-1 md:max-w-[70%]">
                      <div
                        className={`px-4 py-3 shadow-sm transition-all duration-200 ${
                          isOwn
                            ? "rounded-2xl rounded-br-md bg-background dark:bg-slate-950 text-foreground dark:text-white"
                            : "rounded-2xl rounded-bl-md border border bg-card text-slate-900 dark:text-white"
                        }`}
                      >
                        <p className="text-[13px] font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {/* Real timestamp without fabricated checkmarks */}
                      <div className={`flex items-center gap-1.5 px-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                        <span className="text-[9px] font-black uppercase text-muted-foreground dark:text-slate-400">
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
        <footer
          className="border-t border bg-card p-4 max-md:pb-[max(1rem,env(safe-area-inset-bottom))] wow-reveal"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (sendError) setSendError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder={isRtl ? "اكتب رسالة..." : "Type a message..."}
                aria-label={isRtl ? "نص الرسالة" : "Message text"}
                className="max-h-[150px] min-h-[52px] w-full resize-none rounded-xl border border bg-muted px-4 py-3 text-sm font-bold outline-none transition-all focus:border-slate-950 focus:shadow-lg focus:shadow-slate-950/5 dark:focus:border-white"
                rows={1}
                disabled={isSending}
              />
            </div>

            <motion.button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!message.trim() || isSending}
              whileTap={{ scale: 0.985 }}
              className="flex h-[52px] w-[52px] min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-background dark:bg-slate-950 text-foreground dark:text-white transition-all hover:bg-black disabled:scale-100 disabled:opacity-30"
              aria-label={isRtl ? "إرسال الرسالة" : "Send message"}
            >
              <Send className={`h-5 w-5 ${isRtl ? "-rotate-45 mb-1 ml-1" : "rotate-45 mt-1 mr-1"}`} aria-hidden="true" />
            </motion.button>
          </div>
        </footer>
      </div>
    </div>
  );
}
