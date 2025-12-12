"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Send, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
  offerId?: string;
  personName?: string;
  address?: string;
}

export default function Chat({ isOpen, onClose, offerId, personName, address }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `مرحباً! أنا ${personName || "المسؤول"}. كيف يمكنني مساعدتك بخصوص ${address || "هذا العقار"}؟`,
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset messages when offer changes
  useEffect(() => {
    if (isOpen && offerId) {
      setMessages([
        {
          id: "1",
          text: `مرحباً! أنا ${personName || "المسؤول"}. كيف يمكنني مساعدتك بخصوص ${address || "هذا العقار"}؟`,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
      setInputValue("");
    }
  }, [offerId, isOpen, personName, address]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue("");

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "شكراً لرسالتك. سأقوم بالرد عليك قريباً.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Minimal overlay - only when open */}
      {isOpen && (
        <div
          className="fixed inset-0  bg-opacity-20 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Chat Window - Fixed at bottom right (left for RTL) */}
      <div
        className={`fixed bottom-24 left-6 z-50 transition-all duration-300 ease-out ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
        dir="rtl"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200 overflow-hidden">
          {/* Header - WhatsApp Green */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-700 text-white">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                <span className="text-gray-600 font-semibold text-sm">
                  {(personName || "م")[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-medium truncate">{personName || "الدردشة"}</h2>
                {address && (
                  <p className="text-xs text-gray-200 truncate">{address}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-white hover:text-gray-200 transition-colors p-1.5">
                <MoreVertical className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages - WhatsApp Background Pattern */}
          <div 
            className="flex-1 overflow-y-auto px-2 py-4 space-y-1"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5ddd5' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundColor: '#efeae2'
            }}
          >
            {messages.map((message, index) => {
              const showTime = index === messages.length - 1 || 
                new Date(message.timestamp).getTime() - new Date(messages[index - 1]?.timestamp || 0).getTime() > 300000; // 5 minutes
              
              return (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} mb-1`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-2 py-1.5 ${
                      message.sender === "user"
                        ? "bg-[#DCF8C6] text-gray-900 rounded-tr-none"
                        : "bg-white text-gray-900 rounded-tl-none shadow-sm"
                    }`}
                  >
                    <p className="text-sm leading-relaxed wrap-break-word">{message.text}</p>
                    {showTime && (
                      <div className={`flex items-center justify-end gap-1 mt-0.5 ${
                        message.sender === "user" ? "text-[#667781]" : "text-[#667781]"
                      }`}>
                        <span className="text-[10px]">
                          {message.timestamp.toLocaleTimeString("ar-SA", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {message.sender === "user" && (
                          <svg width="12" height="12" viewBox="0 0 12 12" className="text-[#667781]">
                            <path fill="currentColor" d="M9.5 1L11 2.5 5.5 8 1 3.5 2.5 2l3 3z"/>
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - WhatsApp Style */}
          <div className="p-2 bg-[#f0f2f5] border-t border-gray-200">
            <div className="flex gap-2 items-end">
              <div className="flex-1 bg-white rounded-full px-4 py-2 border border-gray-300 focus-within:border-[#075E54] focus-within:ring-1 focus-within:ring-[#075E54]">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="اكتب رسالتك..."
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-right text-sm bg-transparent"
                  dir="rtl"
                />
              </div>
              {inputValue.trim() && (
                <button
                  onClick={handleSend}
                  className="bg-gray-700 text-white p-2.5 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

