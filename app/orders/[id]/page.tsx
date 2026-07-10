"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ordersApi } from "@/lib/api";
import { Order } from "@/types/api";
import { useLanguage } from "@/context/LanguageContext";
import { io } from "socket.io-client";
import { chatApi } from "@/lib/chat";
import {
  Loader2, ArrowRight, MapPin, Ruler, Calendar, FileText,
  CheckCircle2, Building2, User as UserIcon, Phone, Mail,
  Shield, Clock, Home, Layers, Bath, ChefHat, Layers2,
  Sofa, Tag, Hash, BedDouble, Warehouse, CheckCheck, MessageSquare, Send
} from "lucide-react";
import toast from "react-hot-toast";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: "قيد الانتظار", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  in_progress: { label: "قيد التنفيذ",  color: "text-blue-700",   bg: "bg-blue-50 border-blue-200"  },
  completed:   { label: "مكتمل",        color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  cancelled:   { label: "ملغي",         color: "text-red-700",    bg: "bg-red-50 border-red-200"    },
};

const DEED_MAP: Record<string, string> = {
  electronic: "إلكتروني", paper: "ورقي", digital: "رقمي",
};

const MeterIcon = ({ className }: { className?: string }) => (
  <img src="/icons/meter.svg" alt="meter" className={className} style={{ width: '3em', height: '3em', opacity: 0.7 }} />
);

function InfoRow({ label, value, icon: Icon }: { label: string; value?: any; icon?: any }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center justify-between py-3 border-b border last:border-0 hover:bg-muted/50 px-2 rounded-xl transition-colors">
      <span className="flex items-center gap-2 text-slate-500 text-sm font-medium">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        {label}
      </span>
      <span className="font-bold text-slate-800 text-sm">{value}</span>
    </div>
  );
}

function FeatureBadge({ active, label }: { active?: boolean; label: string }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
      <CheckCircle2 className="w-3.5 h-3.5" /> {label}
    </span>
  );
}

function OrderChatBox({ order, currentUser }: { order: Order; currentUser: any }) {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const [roomId, setRoomId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isClient = currentUser?.id === order.userId;
  const otherId = isClient ? (order.assignedToId || 'admin') : order.userId;
  const otherUser = isClient ? ((order as any).assignedTo || { firstName: isRtl ? 'الإدارة' : 'Administration', lastName: '', role: 'admin' }) : (order as any).user;

  useEffect(() => {
    if (!currentUser || !otherId) {
      setLoading(false);
      return;
    }

    const initChat = async () => {
      try {
        const title = `طلب: ${order.propertyType} - ${order.city}`;
        const room = await chatApi.getOrCreateOrderRoom({
          orderId: order.id,
          otherId,
          title
        });
        setRoomId(room.id);
        
        // Fetch messages
        const msgs = await chatApi.getRoomMessages(room.id);
        setMessages(msgs);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

        // Setup socket
        const token = localStorage.getItem('token');
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3030';
        const socketUrl = wsUrl.replace(/^ws/, 'http');

        const socketIo = io(`${socketUrl}/chat`, {
          auth: { token, userId: currentUser.id },
          transports: ['websocket', 'polling']
        });

        socketIo.on('connect', () => {
          socketIo.emit('joinRoom', { roomId: room.id });
          socketIo.emit('checkUserStatus', { userId: otherId });
        });

        socketIo.on('receiveMessage', (data) => {
          const msg = data.message || data.data || data;
          if (msg) {
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
            
            // Mark read if incoming from other
            const senderId = msg.sender?.id || msg.senderId;
            if (senderId === otherId) {
              chatApi.markRoomAsRead(room.id).catch(err => console.error('Failed to mark read:', err));
            }
          }
        });

        socketIo.on('userStatus', (data) => {
          if (data.userId === otherId) {
            setIsOnline(data.status === 'online');
          }
        });

        setSocket(socketIo);
      } catch (err) {
        console.error("Failed to initialize order chat room:", err);
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [order.id, otherId, currentUser]);

  const sendMessage = async () => {
    if (!message.trim() || !socket || !roomId) return;
    try {
      socket.emit('sendMessage', { roomId, senderId: currentUser.id, content: message });
      setMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
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

  if (!currentUser) {
    return (
      <div className="bg-muted border border rounded-3xl p-6 text-center space-y-2">
        <MessageSquare className="w-8 h-8 mx-auto text-slate-400" />
        <p className="text-xs font-black text-slate-500">يرجى تسجيل الدخول للبدء بالمحادثة المباشرة</p>
      </div>
    );
  }

  if (!otherId) {
    return (
      <div className="bg-muted border border rounded-3xl p-6 text-center space-y-2">
        <MessageSquare className="w-8 h-8 mx-auto text-slate-400 animate-pulse" />
        <p className="text-xs font-black text-slate-500">
          {isRtl 
            ? "بانتظار تعيين موظف من قبل الإدارة للبدء في المحادثة المباشرة..." 
            : "Waiting for an agent to be assigned by admin to start the live chat..."}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card/80 backdrop-blur-sm rounded-3xl border border shadow-sm p-8 flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const otherName = otherUser
    ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || 'المسؤول'
    : 'الطرف الآخر';

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-3xl border border shadow-md overflow-hidden flex flex-col h-[400px]">
      {/* Header */}
      <div className="px-5 py-3 border-b border flex items-center justify-between bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xs uppercase">
              {otherName.charAt(0)}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">{otherName}</h4>
            <p className="text-[9px] font-black text-slate-400 mt-0.5">
              {isOnline ? 'متصل الآن' : 'غير متصل'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-1 opacity-40">
            <MessageSquare className="w-8 h-8 text-slate-400" />
            <p className="text-[11px] font-bold">ابدأ المحادثة الآن بخصوص هذا الطلب</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender?.id === currentUser.id || msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id || index}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col gap-0.5 max-w-[85%]">
                  <div
                    className={`px-3 py-2 rounded-2xl shadow-sm text-xs ${
                      isOwn
                        ? 'bg-slate-900 text-white rounded-br-none'
                        : 'bg-card/90 backdrop-blur-sm border border text-slate-900 rounded-bl-none'
                    }`}
                  >
                    <p className="font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[8px] font-bold text-slate-400">
                      {formatTime(msg.createdAt)}
                    </span>
                    {isOwn && <CheckCheck className="w-2.5 h-2.5 text-slate-300" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input section */}
      <div className="p-3 border-t border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 bg-muted border border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all shrink-0"
          >
            <Send className="w-3.5 h-3.5 -rotate-45 ml-0.5 mb-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { language } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const isRtl = language === "ar";

  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (params.id) {
          const res = await ordersApi.findOne(params.id as string);
          setOrder(res.data);
        }
      } catch {
        toast.error("تعذّر تحميل بيانات الطلب");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4 text-slate-500">
        <Building2 className="w-12 h-12 text-slate-200" />
        <p className="font-bold">الطلب غير موجود</p>
        <button onClick={() => router.push("/orders")} className="text-sm text-slate-400 hover:text-slate-700 underline">
          العودة للطلبات
        </button>
      </div>
    );
  }

  const status = (order.status ? STATUS_MAP[order.status] : null) || { label: order.status || "", color: "text-slate-700", bg: "bg-muted border" };
  const user = (order as any).user;
  const assignedTo = (order as any).assignedTo;

  return (
    <div className="min-h-screen bg-muted/50 pb-12" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Back Button */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-bold"
        >
          <ArrowRight className={`w-4 h-4 ${!isRtl ? "rotate-180" : ""}`} />
          {isRtl ? "العودة للطلبات" : "Back to Orders"}
        </button>

        {/* Amazon-style Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Clean details (8 grid-cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Header / Summary Card */}
            <div className="bg-card/80 backdrop-blur-sm rounded-[1.25rem] border border shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                    <Tag className="w-3 h-3" />
                    {order.orderType === "buy" ? "شراء" : "إيجار"}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div className="text-slate-400 text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(order.createdAt).toLocaleDateString(isRtl ? "ar-SA" : "en-US", {
                    year: "numeric", month: "long", day: "numeric"
                  })}
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                  {order.propertyType}
                </h1>
                <p className="text-slate-500 text-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-700">{order.city}</span>
                  {order.neighborhood && <span className="text-slate-400">— {order.neighborhood}</span>}
                </p>
              </div>
            </div>

            {/* Basic Specifications Card */}
            <div className="bg-card/80 backdrop-blur-sm rounded-[1.25rem] border border shadow-sm p-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">المواصفات الأساسية</h3>
              <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                <InfoRow label="نوع العقار"   value={order.propertyType}  icon={Building2} />
                <InfoRow label="المدينة"       value={order.city}          icon={MapPin} />
                <InfoRow label="الحي"          value={order.neighborhood}  icon={MapPin} />
                <InfoRow label="المساحة المطلوب" value={order.area ? `${Number(order.area).toLocaleString()} م²` : undefined} icon={MeterIcon} />
                <InfoRow label="السعر المطلوب" value={order.price ? <SaudiRiyalAmount amount={Number(order.price)} locale="ar-SA" /> : undefined} icon={Tag} />
                <InfoRow label="عمر العقار"   value={order.propertyAge}   icon={Clock} />
                <InfoRow label="نوع الصك"     value={DEED_MAP[order.deedType] || order.deedType} icon={FileText} />
                <InfoRow label="نوع الصفقة"   value={order.orderType === "buy" ? "شراء" : "إيجار"} icon={Tag} />
              </div>
            </div>

            {/* Layout specifications (conditional) */}
            {(order.rooms || order.bathrooms || order.livingRooms || order.kitchens || order.floors || order.apartments || order.buildingArea) && (
              <div className="bg-card/80 backdrop-blur-sm rounded-[1.25rem] border border shadow-sm p-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">التفاصيل الهيكلية</h3>
                <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                  <InfoRow label="عدد الغرف"        value={order.rooms}        icon={BedDouble} />
                  <InfoRow label="دورات المياه"      value={order.bathrooms}    icon={Bath} />
                  <InfoRow label="غرف المعيشة"       value={(order as any).livingRooms}  icon={Sofa} />
                  <InfoRow label="المطابخ"           value={(order as any).kitchens}     icon={ChefHat} />
                  <InfoRow label="عدد الأدوار"       value={(order as any).floors}       icon={Layers2} />
                  <InfoRow label="عدد الشقق"         value={(order as any).apartments}   icon={Home} />
                  <InfoRow label="مساحة البناء"      value={(order as any).buildingArea ? `${Number((order as any).buildingArea).toLocaleString()} م²` : undefined} icon={MeterIcon} />
                  <InfoRow label="حالة الأثاث"       value={(order as any).furnitureStatus === 'furnished' ? 'مفروش' : (order as any).furnitureStatus === 'unfurnished' ? 'غير مفروش' : (order as any).furnitureStatus} icon={Warehouse} />
                </div>
              </div>
            )}

            {/* Features list (conditional) */}
            {(order.hasGarage || order.hasPool || order.hasElevator || order.hasMaidRoom || (order as any).hasRoof || (order as any).hasExternalAnnex) && (
              <div className="bg-card/80 backdrop-blur-sm rounded-[1.25rem] border border shadow-sm p-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">الميزات المطلوبة</h3>
                <div className="flex flex-wrap gap-2.5">
                  <FeatureBadge active={order.hasGarage}               label="كراج سيارة" />
                  <FeatureBadge active={order.hasPool}                  label="مسبح" />
                  <FeatureBadge active={order.hasElevator}              label="مصعد" />
                  <FeatureBadge active={order.hasMaidRoom}              label="غرفة خادمة" />
                  <FeatureBadge active={(order as any).hasRoof}         label="روف / سطح" />
                  <FeatureBadge active={(order as any).hasExternalAnnex} label="ملحق خارجي" />
                </div>
              </div>
            )}

            {/* Additional details (conditional) */}
            {order.additionalDetails && (
              <div className="bg-card/80 backdrop-blur-sm rounded-[1.25rem] border border shadow-sm p-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">تفاصيل إضافية من العميل</h3>
                <p className="text-slate-600 text-sm leading-relaxed bg-muted/50 rounded-2xl p-4 border border font-medium">
                  {order.additionalDetails}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Buy box style status + direct chat room (4 grid-cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Status Box */}
            <div className="bg-card/80 backdrop-blur-sm rounded-[1.25rem] border border shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">معلومات الطلب</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1.5 border-b border">
                  <span className="text-slate-400 text-xs font-bold">رقم الطلب</span>
                  <span className="font-mono text-xs text-slate-500 bg-muted px-2.5 py-1 rounded-lg border border select-all">
                    #{order.id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border">
                  <span className="text-slate-400 text-xs font-bold">حالة الطلب</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-black ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400 text-xs font-bold">تاريخ الإنشاء</span>
                  <span className="text-xs font-bold text-slate-700">
                    {new Date(order.createdAt).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Info (Owner or Assigned Agent) */}
            {user && (
              <div className="bg-card/80 backdrop-blur-sm rounded-[1.25rem] border border shadow-sm p-6 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">صاحب الطلب</h3>
                <div className="flex items-center gap-3">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.firstName} className="w-12 h-12 rounded-2xl object-cover border border" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-muted border border flex items-center justify-center text-slate-500 font-black text-lg">
                      {user.firstName?.[0] || <UserIcon className="w-5 h-5" />}
                    </div>
                  )}
                  <div>
                    <p className="font-black text-slate-900 text-sm">{user.firstName} {user.lastName}</p>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-muted px-2 py-0.5 rounded-lg border border">
                      {user.role}
                    </span>
                  </div>
                </div>
                
                {/* Contact details shown to admin/agents */}
                {currentUser?.role !== "client" && (
                  <div className="space-y-2.5 pt-2 border-t border">
                    {user.email && (
                      <div className="flex items-center gap-2 text-xs">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600 font-bold break-all select-all">{user.email}</span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center gap-2 text-xs">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600 font-bold select-all">{user.phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Contact details for anonymous orders */}
            {((order as any).clientName || (order as any).clientPhone) && !user && (
              <div className="bg-card/80 backdrop-blur-sm rounded-[1.25rem] border border shadow-sm p-6 space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">بيانات العميل</h3>
                <InfoRow label="الاسم"  value={(order as any).clientName}  icon={UserIcon} />
                <InfoRow label="الهاتف" value={(order as any).clientPhone} icon={Phone} />
              </div>
            )}

            {/* Direct Chat Module */}
            <OrderChatBox order={order} currentUser={currentUser} />

          </div>
        </div>
      </div>
    </div>
  );
}
