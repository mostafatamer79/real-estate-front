
"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { X, Send, Loader2 } from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  userId: string;
  userName: string;
  otherUserName: string;
  readOnly?: boolean;
}

export default function SimpleChatModal({
  isOpen,
  onClose,
  roomId,
  userId,
  userName,
  otherUserName,
  readOnly = false,
}: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const rawApiUrl = (typeof getApiUrl === 'function' ? getApiUrl() : null) || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030/api";
    const apiUrl = typeof rawApiUrl === 'string' ? rawApiUrl : "http://localhost:3030/api";
    const socketBaseUrl = apiUrl.replace(/\/api\/?$/, "");
    let active = true;
    setMessages([]);
    setNewMessage("");
    setLoading(true);

    // Connect to Socket.IO
    const newSocket = io(`${socketBaseUrl}/chat`, {
      path: "/socket.io",
      auth: { token: localStorage.getItem("token") },
      transports: ["websocket", "polling"],
    });

    setSocket(newSocket);

    // Socket.IO room membership is lost on reconnect.
    newSocket.on("connect", () => {
      newSocket.emit("joinRoom", { roomId });
      void fetchPreviousMessages();
    });

    // Listen for messages
    newSocket.on("receiveMessage", (event: Message | { message: Message }) => {
      if (!active) return;
      const message = "message" in event ? event.message : event;
      setMessages((prev) => prev.some((item) => item.id === message.id) ? prev : [...prev, message]);
    });

    // Keep messages received while history is loading, and ignore stale room responses.
    const fetchPreviousMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${apiUrl}/chat/${roomId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const history: Message[] = await res.json();
          if (active) {
            setMessages((current) => {
              const byId = new Map(history.map((message) => [message.id, message]));
              for (const message of current) byId.set(message.id, message);
              return [...byId.values()].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchPreviousMessages();

    return () => {
      active = false;
      newSocket.disconnect();
    };
  }, [isOpen, roomId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !newMessage.trim() || !socket) return;

    // Send via socket
    socket.emit("sendMessage", {
      roomId,
      content: newMessage,
    });

    setNewMessage("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="calm-panel bg-card rounded-xl w-[95vw] sm:max-w-md h-[85dvh] max-h-[90dvh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="calm-panel p-4 border-b flex justify-between items-center bg-muted rounded-t-xl">
          <div>
            <h3 className="font-bold text-gray-800">محادثة مع {otherUserName}</h3>
            <span className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              متصل
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 sm:p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/50">
          {loading ? (
             <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
             </div>
          ) : messages.length === 0 ? (
             <div className="text-center text-gray-400 py-10">
                <p>ابدأ المحادثة الآن</p>
             </div>
          ) : (
             messages.map((msg) => {
                const isMe = msg.sender.id === userId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl ${
                        isMe
                          ? "bg-slate-600 text-white rounded-br-none"
                          : "bg-card border border text-gray-800 rounded-bl-none shadow-sm"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <span className={`text-[10px] block mt-1 ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="calm-panel p-4 border-t bg-card rounded-b-xl">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              disabled={readOnly}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              type="submit"
              disabled={readOnly || !newMessage.trim()}
              className="p-3 sm:p-2 bg-slate-600 text-white rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
