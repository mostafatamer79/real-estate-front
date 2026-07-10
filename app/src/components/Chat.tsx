import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { X, Send, MoreVertical, Calendar, CreditCard, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StripePaymentModal from "@/components/Payment/StripePaymentModal";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import { SaudiRiyalIcon } from "@/components/ui/saudi-riyal-icon";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  type?: "text" | "booking_offer" | "payment_request";
  metadata?: {
    bookingId?: string;
    price?: number;
    date?: string;
    status?: string;
  };
}

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
  offerId?: string;
  personName?: string;
  address?: string;
}

export default function Chat({ isOpen, onClose, offerId, personName, address }: ChatProps) {
  const { t, language } = useLanguage();

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
     setMessages([
        {
          id: "1",
          text: t('chat.welcome', { 
            name: personName || t('chat.defaultName'), 
            address: address || t('chat.defaultAddress') 
          }),
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
  }, [language, personName, address, offerId]); // Added language to dependencies
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{id: string, price: number} | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset messages when offer changes is now handled by the main useEffect above
  // Removing redundant effect or merging logic.
  // The logic above handles initialization. 
  // Let's keep a specific one for "Reset on open" if needed, but the above covers it.
  
  // Actually, the original code had a separate effect for 'offerId' changes to reset. 
  // I merged them. I will just remove the second separate useEffect to avoid conflicts.

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
      // DEBUG: Simulate Agent sending a Booking Offer if user types "booking"
      if (inputValue.includes("حجز") || inputValue.toLowerCase().includes("book")) {
         const offerMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: t('chat.simulateOffer'),
            sender: "bot",
            timestamp: new Date(),
            type: "booking_offer",
            metadata: {
                date: new Date(Date.now() + 86400000).toISOString(),
                price: 1500000,
            }
         };
         setMessages((prev) => [...prev, offerMsg]);
      } else {
        const botResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: t('chat.botResponse'),
            sender: "bot",
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botResponse]);
      }
    }, 1000);
  };

  const handleCreateBooking = () => {
      // Simulate Agent creating booking then asking for payment
      const paymentMsg: Message = {
          id: Date.now().toString(),
          text: t('chat.simulatePayment'),
          sender: "bot",
          timestamp: new Date(),
          type: "payment_request",
          metadata: {
              bookingId: "booking-123-simulated", // This needs to be real ID in prod
              price: 5000,
              status: "pending"
          }
      };
      setMessages((prev) => [...prev, paymentMsg]);
  };

  const openPayment = (bookingId: string, price: number) => {
      setSelectedBooking({ id: bookingId, price });
      setIsPaymentModalOpen(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed bottom-24 left-6 z-50 transition-all duration-300 ease-out ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
        dir={language === 'ar' ? "rtl" : "ltr"}
      >
        <div className="bg-card rounded-2xl shadow-2xl w-96 h-[500px] flex flex-col border border overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-700 text-white">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center shrink-0">
                <span className="text-gray-600 font-semibold text-sm">
                  {(personName || t('chat.defaultName'))[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-medium truncate">{personName || t('chat.title')}</h2>
                {address && (
                  <p className="text-xs text-gray-200 truncate">{address}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
               {/* DEBUG TOOLBAR FOR DEMO */}
               <button onClick={handleCreateBooking} title="Simulate Payment Request" className="text-white hover:text-green-300">
                   <SaudiRiyalIcon className="w-4 h-4" />
               </button>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div 
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
            style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5ddd5' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
               backgroundColor: '#efeae2'
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 shadow-sm ${
                    message.sender === "user"
                      ? "bg-[#DCF8C6] text-gray-900 rounded-tr-none"
                      : "bg-card text-gray-900 rounded-tl-none"
                  }`}
                >
                  {message.type === 'booking_offer' ? (
                      <div className="space-y-2">
                          <div className="flex items-center gap-2 text-blue-600 font-semibold border-b pb-2">
                             <Calendar className="w-4 h-4" />
                             <span>{t('chat.bookingOffer')}</span>
                          </div>
                          <div className="text-sm">
                              <p>{t('chat.date')}: {new Date(message.metadata?.date || '').toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                              <p>{t('chat.price')}: <SaudiRiyalAmount amount={message.metadata?.price || 0} locale={language === 'ar' ? 'ar-SA' : 'en-US'} /></p>
                          </div>
                          <Button size="sm" className="w-full mt-2 bg-slate-600 hover:bg-slate-700">{t('chat.acceptBooking')}</Button>
                      </div>
                  ) : message.type === 'payment_request' ? (
                       <div className="space-y-2">
                          <div className="flex items-center gap-2 text-green-600 font-semibold border-b pb-2">
                             <CreditCard className="w-4 h-4" />
                             <span>{t('chat.paymentRequest')}</span>
                          </div>
                          <div className="text-sm">
                              <p className="font-bold text-lg"><SaudiRiyalAmount amount={message.metadata?.price || 0} locale={language === 'ar' ? 'ar-SA' : 'en-US'} /></p>
                              <p className="text-gray-500 text-xs">{t('chat.downPayment')}</p>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full mt-2 bg-green-600 hover:bg-green-700"
                            onClick={() => openPayment(message.metadata?.bookingId!, message.metadata?.price!)}
                          >
                            {t('chat.payNow')}
                          </Button>
                      </div>
                  ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  )}
                  
                  <span className="text-[10px] text-gray-400 block text-left mt-1">
                    {message.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 bg-[#f0f2f5] border-t border">
            <div className="flex gap-2 items-end">
              <div className="flex-1 bg-card rounded-full px-4 py-2 border border-gray-300 focus-within:border-[#075E54]">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('chat.inputPlaceholder')}
                  className="border-0 focus-visible:ring-0 bg-transparent text-right"
                  dir={language === 'ar' ? "rtl" : "ltr"}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="bg-slate-700 text-white p-2.5 rounded-full hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

       {selectedBooking && (
        <StripePaymentModal 
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            bookingId={selectedBooking.id}
            price={selectedBooking.price}
            onPaymentSuccess={() => {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'user', // System message really
                    text: t('chat.paymentSuccess'),
                    timestamp: new Date(),
                    type: 'text'
                }]);
            }}
        />
       )}
    </>
  );
}
