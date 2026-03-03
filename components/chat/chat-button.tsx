// components/chat/chat-button.tsx - Updated
"use client";

import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import { chatApi } from "@/lib/chat";
import SimpleChatModal from "./chat-modal";

interface ChatButtonProps {
  offerId: string;
  offerTitle: string;
  sellerId: string;
  sellerName: string;
  userId: string;
  userName: string;
}

export default function ChatButton({
  offerId,
  offerTitle,
  sellerId,
  sellerName,
  userId,
  userName,
}: ChatButtonProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);

  const openChat = async () => {
    if (!userId) {
      alert('يجب تسجيل الدخول للدردشة');
      return;
    }

    setIsLoading(true);
    try {
      // Create or get offer chat room
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/rooms/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          offerId,
          sellerId,
          offerTitle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat room');
      }

      const room = await response.json();
      setRoomId(room.id);
      setIsChatOpen(true);
    } catch (error) {
      console.error('Failed to open chat:', error);
      alert('فشل في فتح الدردشة. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={openChat}
        disabled={isLoading}
        className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <MessageCircle className="w-4 h-4" />
        )}
        <span> التواصل مع المعلن</span>
      </button>

      {isChatOpen && roomId && (
        <SimpleChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          roomId={roomId}
          userId={userId}
          userName={userName}
          otherUserName={sellerName}
        />
      )}
    </>
  );
}