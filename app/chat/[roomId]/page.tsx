// app/chat/[roomId]/page.tsx - Updated with proper API calls
"use client";
import { useLanguage } from "@/context/LanguageContext";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { ArrowRight, Send, User, Clock } from "lucide-react";
import { chatApi } from "@/lib/chat";
import api from "@/lib/api";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { t, language } = useLanguage();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [roomDetails, setRoomDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [socket, setSocket] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (err) {
        console.error('Failed to parse user data:', err);
      }
    }

    if (roomId) {
      fetchRoomDetails();
      fetchMessages();
      setupWebSocket();
    }
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
      scrollToBottom();
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipantId = () => {
    if (!roomDetails || !roomDetails.participants || !currentUser) return null;
    const other = roomDetails.participants.find((p: any) => p.id !== currentUser.id);
    return other?.id;
  }

  const setupWebSocket = () => {
    const token = localStorage.getItem('token');
    const userId = currentUser?.id || JSON.parse(localStorage.getItem('user') || '{}').id;

    // Initialize WebSocket connection
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3030';
    const ws = new WebSocket(`${wsUrl}/chat?token=${token}&userId=${userId}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Join the room
      ws.send(JSON.stringify({
        type: 'joinRoom',
        roomId,
      }));

       // Check status of other user
       const otherId = getOtherParticipantId();
       if (otherId) {
         ws.send(JSON.stringify({
           type: 'checkUserStatus',
           userId: otherId
         }));
       }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'receiveMessage' || (data.event === 'receiveMessage')) {
            // Handle both wrapper formats if applicable
            const msg = data.message || data.data;
            if (msg) {
              setMessages(prev => [...prev, msg]);
              scrollToBottom();
            }
        }
        
        if (data.event === 'userStatus' || data.type === 'userStatus') {
           const moveData = data.data || data;
           const otherId = getOtherParticipantId();
           if (moveData.userId === otherId) {
               setIsOnline(moveData.status === 'online');
           }
        }
      } catch (e) {
          console.error("WS Parse error", e);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!message.trim() || !socket) return;

    try {
      // Send via WebSocket
      socket.send(JSON.stringify({
        type: 'sendMessage',
        roomId,
        content: message,
      }));

      // Also save to database via HTTP
      await chatApi.sendMessage(roomId, message);

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
      return date.toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "الآن";
    }
  };

  const getOtherParticipant = () => {
    if (!roomDetails || !roomDetails.participants || !currentUser) return null;

    return roomDetails.participants.find(
      (p: any) => p.id !== currentUser.id
    );
  };

  const getFullName = (firstName: string | null = '', lastName: string | null = '') => {
    const first = firstName || '';
    const last = lastName || '';
    return `${first} ${last}`.trim() || t('chat.user') || 'مستخدم';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700"></div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();
  const otherParticipantName = otherParticipant
    ? getFullName(otherParticipant.firstName, otherParticipant.lastName)
    : roomDetails?.name || t('chat.conversation') || 'محادثة';

  return (
    <div className="min-h-screen bg-slate-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowRight className={`w-5 h-5 ${language === 'en' ? 'rotate-180' : ''}`} />
                <span className="hidden md:inline">{t('chat.back')}</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                    {otherParticipant ? (
                        <span className="font-semibold text-gray-700">
                        {getFullName(otherParticipant.firstName, otherParticipant.lastName).charAt(0)}
                        </span>
                    ) : (
                        <User className="w-5 h-5 text-gray-600" />
                    )}
                    </div>
                    {/* Status Dot */}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
                
                <div>
                  <h1 className="font-semibold text-gray-800 flex items-center gap-2">
                    {otherParticipantName}
                  </h1>
                  <span className={`text-xs font-medium block ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                    {isOnline ? t('chat.activeNow') : t('chat.notActive')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-180px)] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  {t('chat.new')}
                </h3>
                <p className="text-gray-500">
                  {otherParticipant
                    ? `${t('chat.start')} ${otherParticipantName}`
                    : t('chat.start')
                  }
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => {
                  const ownMessage = msg.sender?.id === currentUser?.id;

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex ${ownMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs rounded-lg px-4 py-2 ${
                          ownMessage
                            ? 'bg-slate-700 text-white rounded-tr-none'
                            : 'bg-slate-100 text-gray-800 rounded-tl-none'
                        }`}
                      >
                        {!ownMessage && msg.sender && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-gray-700">
                                {getFullName(msg.sender.firstName, msg.sender.lastName).charAt(0)}
                              </span>
                            </div>
                            <span className="text-xs font-medium">
                              {getFullName(msg.sender.firstName, msg.sender.lastName)}
                            </span>
                          </div>
                        )}

                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                        {msg.createdAt && (
                          <div className={`flex items-center justify-end gap-2 mt-1 ${
                            ownMessage ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('chat.typeMessage')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600 resize-none"
                  rows={2}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
                <span className="hidden sm:inline">{t('chat.send')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}