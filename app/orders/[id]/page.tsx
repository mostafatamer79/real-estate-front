// app/orders/[id]/page.tsx
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ordersApi } from "@/lib/api";
import { Order } from "@/types/api";
import { useLanguage } from "@/context/LanguageContext";
import { io, Socket } from "socket.io-client";
import { chatApi } from "@/lib/chat";
import { safeHttpUrl } from "@/lib/safe-url";
import { loginHref } from "@/lib/auth-navigation";
import {
  ArrowRight,
  MapPin,
  Calendar,
  Building2,
  Tag,
  Clock,
  FileText,
  BedDouble,
  Bath,
  Sofa,
  ChefHat,
  Layers2,
  Home,
  Warehouse,
  CheckCircle2,
  Copy,
  Check,
  Phone,
  Mail,
  User as UserIcon,
  Send,
  CheckCheck,
  MessageSquare,
  RotateCcw,
  Compass,
  Ruler,
  Maximize2,
  Pause,
  Play,
  BadgeCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import styles from "./order-detail.module.css";
import { OrderNetworkArtwork, useOrderMotion } from "./order-motion";

interface CurrentUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  phone?: string;
}

interface ChatMessage {
  id?: string;
  senderId?: string;
  sender?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  content: string;
  createdAt: string;
}

interface ReceiveMessagePayload {
  message?: ChatMessage;
  data?: ChatMessage;
  id?: string;
  senderId?: string;
  sender?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  content?: string;
  createdAt?: string;
}

interface UserStatusPayload {
  userId?: string;
  status?: string;
}

interface ExtendedOrder extends Order {
  length?: number | string;
  width?: number | string;
  streetWidth?: number | string;
  direction?: string;
  clientName?: string;
  clientPhone?: string;
}

/* ==========================================================================
   Comprehensive Bilingual Localization Dictionary (Scoped to /orders/[id])
   ========================================================================== */
const DICTIONARY = {
  ar: {
    // Navigation & Breadcrumbs
    orders: "الطلبات",
    orderDetails: "تفاصيل الطلب",
    backToOrders: "العودة للطلبات",
    orderReference: "رقم الطلب المرجعي",
    createdOn: "تاريخ تقديم الطلب",
    lastUpdated: "آخر تحديث",

    // Statuses
    status_pending: "قيد الانتظار",
    status_in_progress: "قيد التنفيذ",
    status_completed: "مكتمل",
    status_cancelled: "ملغي",

    // Deal Types
    deal_buy: "طلب شراء",
    deal_rent: "طلب إيجار",
    buy: "شراء",
    rent: "إيجار",

    // Property Types
    prop_apartment: "شقة",
    prop_villa: "فيلا",
    prop_palace: "قصر",
    prop_land: "أرض",
    prop_building: "عمارة",
    prop_restHouse: "استراحة",
    prop_shop: "محل تجاري",
    prop_office: "مكتب",
    prop_warehouse: "مستودع",
    prop_duplex: "دوبلكس",
    prop_floor: "دور",

    // Deed Types
    deed_electronic: "صك إلكتروني",
    deed_paper: "صك ورقي",
    deed_digital: "صك رقمي",
    deed_other: "صك آخر",

    // Property Age
    age_new: "جديد",
    age_less5: "أقل من 5 سنوات",
    age_5to10: "من 5 إلى 10 سنوات",
    age_10to20: "من 10 إلى 20 سنة",
    age_more20: "أكثر من 20 سنة",

    // Furnishing Status
    furn_furnished: "مفروش",
    furn_unfurnished: "غير مفروش",
    furn_semi: "شبه مفروش",

    // Section Titles
    section_primary: "المواصفات الأساسية للطلب",
    section_layout: "التفاصيل الهيكلية والتقسيم",
    section_land: "مواصفات الأرض والمخطط",
    section_amenities: "الميزات والمرافق المطلوبة",
    section_notes: "ملاحظات وتفاصيل إضافية",
    section_registry: "بيانات السجل والطلب",
    section_client: "صاحب الطلب",
    section_agent: "الممثل المعيّن",
    section_anonymous: "بيانات العميل المستعلم",
    section_chat: "المحادثة التشغيلية المباشرة",

    // Metric Labels
    budget: "الميزانية / السعر المطلوب",
    requestedArea: "المساحة المطلوبة",
    propertyType: "نوع العقار",
    location: "الموقع الجغرافي",
    city: "المدينة",
    neighborhood: "الحي",
    propertyAge: "عمر العقار",
    deedType: "نوع الصك",
    dealType: "نوع الصفقة",
    orderStatus: "حالة الطلب",
    orderId: "الرمز المرجعي",

    // Structural Layout
    rooms: "عدد الغرف",
    bathrooms: "دورات المياه",
    livingRooms: "غرف المعيشة",
    kitchens: "المطابخ",
    floors: "عدد الأدوار",
    apartments: "عدد الشقق",
    buildingArea: "مساحة البناء",
    furnitureStatus: "حالة التأثيث",

    // Land Dimensions
    length: "الطول",
    width: "العرض",
    streetWidth: "عرض الشارع",
    direction: "الواجهة",

    // Amenities
    amenity_garage: "كراج سيارة",
    amenity_pool: "مسبح",
    amenity_elevator: "مصعد",
    amenity_maidRoom: "غرفة خادمة",
    amenity_roof: "سطح / روف",
    amenity_annex: "ملحق خارجي",

    // Stakeholders & Contacts
    role: "الدور الوظيفي",
    email: "البريد الإلكتروني",
    phone: "رقم الجوال",
    copy: "نسخ",
    copied: "تم النسخ بنجاح",
    verified: "حساب موثق",
    clientName: "اسم العميل",
    clientPhone: "رقم الهاتف",
    adminOffice: "الإدارة التشغيلية",

    // Chat Panel
    chatOnline: "متصل الآن",
    chatOffline: "غير متصل",
    chatPlaceholder: "اكتب رسالتك بخصوص هذا الطلب...",
    chatSend: "إرسال",
    chatEmpty: "لا توجد رسائل سابقة. يمكنك بدء المحادثة المباشرة الآن.",
    chatSignInPrompt: "يرجى تسجيل الدخول للبدء بالمحادثة المباشرة مع فريق العمليات.",
    chatSignInAction: "تسجيل الدخول",
    chatWaitingAgent: "بانتظار تعيين ممثل من قبل الإدارة للبدء في المحادثة المباشرة...",
    chatJustNow: "الآن",

    // States
    loadingTitle: "جاري استرداد مواصفات الطلب...",
    errorTitle: "تعذّر تحميل بيانات الطلب",
    errorMessage: "حدث خطأ أثناء جلب مواصفات الطلب من الخادم. يرجى التحقق من اتصالك والمحاولة مجدداً.",
    retryAction: "إعادة المحاولة",
    notFoundTitle: "الطلب غير موجود",
    notFoundMessage: "لم نتمكن من العثور على الطلب المطلوب، قد يكون الرابط غير صحيح أو تم حذفه.",

    // Units
    sqm: "م²",
    meters: "متر",
  },
  en: {
    // Navigation & Breadcrumbs
    orders: "Orders",
    orderDetails: "Order Details",
    backToOrders: "Back to Orders",
    orderReference: "Order Reference ID",
    createdOn: "Submission Date",
    lastUpdated: "Last Updated",

    // Statuses
    status_pending: "Pending Review",
    status_in_progress: "In Progress",
    status_completed: "Completed",
    status_cancelled: "Cancelled",

    // Deal Types
    deal_buy: "Purchase Request",
    deal_rent: "Rental Request",
    buy: "Purchase",
    rent: "Rent",

    // Property Types
    prop_apartment: "Apartment",
    prop_villa: "Villa",
    prop_palace: "Palace",
    prop_land: "Land Plot",
    prop_building: "Building",
    prop_restHouse: "Rest House",
    prop_shop: "Commercial Shop",
    prop_office: "Office Space",
    prop_warehouse: "Warehouse",
    prop_duplex: "Duplex",
    prop_floor: "Whole Floor",

    // Deed Types
    deed_electronic: "Electronic Deed",
    deed_paper: "Paper Deed",
    deed_digital: "Digital Deed",
    deed_other: "Other Deed",

    // Property Age
    age_new: "New",
    age_less5: "Under 5 Years",
    age_5to10: "5 - 10 Years",
    age_10to20: "10 - 20 Years",
    age_more20: "Over 20 Years",

    // Furnishing Status
    furn_furnished: "Furnished",
    furn_unfurnished: "Unfurnished",
    furn_semi: "Semi-Furnished",

    // Section Titles
    section_primary: "Primary Specifications",
    section_layout: "Architectural & Structural Layout",
    section_land: "Land & Plot Specifications",
    section_amenities: "Requested Amenities & Features",
    section_notes: "Additional Details & Notes",
    section_registry: "Order Registry Overview",
    section_client: "Requester Profile",
    section_agent: "Assigned Specialist",
    section_anonymous: "Direct Client Information",
    section_chat: "Direct Operational Chat",

    // Metric Labels
    budget: "Target Budget / Price",
    requestedArea: "Requested Area",
    propertyType: "Property Type",
    location: "Location",
    city: "City",
    neighborhood: "Neighborhood",
    propertyAge: "Property Age",
    deedType: "Deed Type",
    dealType: "Deal Type",
    orderStatus: "Order Status",
    orderId: "Reference ID",

    // Structural Layout
    rooms: "Bedrooms",
    bathrooms: "Bathrooms",
    livingRooms: "Living Rooms",
    kitchens: "Kitchens",
    floors: "Floors Count",
    apartments: "Apartments Count",
    buildingArea: "Built-up Area",
    furnitureStatus: "Furnishing Status",

    // Land Dimensions
    length: "Length",
    width: "Width",
    streetWidth: "Street Width",
    direction: "Street Facade",

    // Amenities
    amenity_garage: "Garage",
    amenity_pool: "Swimming Pool",
    amenity_elevator: "Elevator",
    amenity_maidRoom: "Maid's Room",
    amenity_roof: "Rooftop",
    amenity_annex: "External Annex",

    // Stakeholders & Contacts
    role: "Role",
    email: "Email Address",
    phone: "Phone Number",
    copy: "Copy",
    copied: "Copied to clipboard",
    verified: "Verified Account",
    clientName: "Client Name",
    clientPhone: "Phone Number",
    adminOffice: "Operations Management",

    // Chat Panel
    chatOnline: "Online",
    chatOffline: "Offline",
    chatPlaceholder: "Write a message regarding this order...",
    chatSend: "Send",
    chatEmpty: "No messages yet. Send a message to start direct communication.",
    chatSignInPrompt: "Please sign in to participate in the operational chat.",
    chatSignInAction: "Sign In",
    chatWaitingAgent: "Waiting for an agent assignment to start live messaging...",
    chatJustNow: "Just now",

    // States
    loadingTitle: "Retrieving order specifications...",
    errorTitle: "Failed to load order details",
    errorMessage: "A communication error occurred while loading this order. Please verify your connection and retry.",
    retryAction: "Retry Loading",
    notFoundTitle: "Order Not Found",
    notFoundMessage: "The requested order could not be found. It may have been removed or the link is invalid.",

    // Units
    sqm: "m²",
    meters: "m",
  },
};

/* ==========================================================================
   Helper Functions for Localization & Value Formatting
   ========================================================================== */
function isPresent(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  return true;
}

function localizePropertyType(type: string | undefined, lang: "ar" | "en"): string {
  if (!type) return "—";
  const dict = DICTIONARY[lang];
  const t = type.trim().toLowerCase();
  if (t === "شقة" || t === "apartment") return dict.prop_apartment;
  if (t === "فيلا" || t === "villa") return dict.prop_villa;
  if (t === "قصر" || t === "palace") return dict.prop_palace;
  if (t === "أرض" || t === "land") return dict.prop_land;
  if (t === "عمارة" || t === "building") return dict.prop_building;
  if (t === "استراحة" || t === "resthouse" || t === "rest house") return dict.prop_restHouse;
  if (t === "محل تجاري" || t === "محل" || t === "shop") return dict.prop_shop;
  if (t === "مكتب" || t === "office") return dict.prop_office;
  if (t === "مستودع" || t === "warehouse") return dict.prop_warehouse;
  if (t === "دوبلكس" || t === "duplex") return dict.prop_duplex;
  if (t === "دور" || t === "floor") return dict.prop_floor;
  return type;
}

function localizeDeedType(deed: string | undefined, lang: "ar" | "en"): string {
  if (!deed) return "—";
  const dict = DICTIONARY[lang];
  const d = deed.toLowerCase().trim();
  if (d === "electronic" || d === "إلكتروني") return dict.deed_electronic;
  if (d === "paper" || d === "ورقي") return dict.deed_paper;
  if (d === "digital" || d === "رقمي") return dict.deed_digital;
  if (d === "other" || d === "أخرى") return dict.deed_other;
  return deed;
}

function localizePropertyAge(age: string | undefined, lang: "ar" | "en"): string {
  if (!age) return "—";
  const dict = DICTIONARY[lang];
  const a = age.trim().toLowerCase();
  if (a === "جديد" || a === "new") return dict.age_new;
  if (a.includes("أقل من 5") || a.includes("less5") || a.includes("under 5")) return dict.age_less5;
  if (a.includes("5-10") || a.includes("5to10") || a.includes("5 إلى 10")) return dict.age_5to10;
  if (a.includes("10-20") || a.includes("10to20") || a.includes("10 إلى 20")) return dict.age_10to20;
  if (a.includes("أكثر من 20") || a.includes("more20") || a.includes("over 20")) return dict.age_more20;
  return age;
}

function localizeFurnitureStatus(furn: string | undefined, lang: "ar" | "en"): string {
  if (!furn) return "—";
  const dict = DICTIONARY[lang];
  const f = furn.toLowerCase().trim();
  if (f === "furnished" || f === "مفروش") return dict.furn_furnished;
  if (f === "unfurnished" || f === "غير مفروش") return dict.furn_unfurnished;
  if (f === "semi-furnished" || f === "شبه مفروش") return dict.furn_semi;
  return furn;
}

function localizeStatus(status: string | undefined, lang: "ar" | "en"): { label: string; className: string } {
  const dict = DICTIONARY[lang];
  const s = (status || "").toLowerCase().trim();
  if (s === "pending" || s === "قيد الانتظار") {
    return { label: dict.status_pending, className: styles.status_pending };
  }
  if (s === "in_progress" || s === "قيد التنفيذ") {
    return { label: dict.status_in_progress, className: styles.status_in_progress };
  }
  if (s === "completed" || s === "مكتمل") {
    return { label: dict.status_completed, className: styles.status_completed };
  }
  if (s === "cancelled" || s === "ملغي") {
    return { label: dict.status_cancelled, className: styles.status_cancelled };
  }
  return { label: status || "—", className: styles.status_pending };
}

/* ==========================================================================
   Real Operational Chat Component
   ========================================================================== */
function OrderChatBox({ order, currentUser }: { order: Order; currentUser: CurrentUser | null }) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "ar";
  const isRtl = lang === "ar";
  const dict = DICTIONARY[lang];

  const [roomId, setRoomId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [chatError, setChatError] = useState(false);
  const [retry, setRetry] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isClient = currentUser?.id === order.userId;
  const otherId = isClient ? (order.assignedToId || "admin") : order.userId;
  const otherUser = isClient
    ? (order.assignedTo || { firstName: isRtl ? "الإدارة التشغيلية" : "Operations Administration", lastName: "", role: "admin" })
    : order.user;

  useEffect(() => {
    if (!currentUser || !otherId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let socketInstance: Socket | null = null;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const scrollToLatest = () => {
      timers.push(setTimeout(() => {
        const anchor = messagesEndRef.current;
        const paused = anchor?.closest("[data-motion-paused]")?.getAttribute("data-motion-paused") === "true";
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        anchor?.scrollIntoView({ behavior: paused || reduced ? "auto" : "smooth" });
      }, 50));
    };
    setLoading(true);
    setChatError(false);
    setSocket(null);

    const initChat = async () => {
      try {
        const title = isRtl
          ? `طلب: ${order.propertyType} - ${order.city}`
          : `Order: ${order.propertyType} - ${order.city}`;

        const room = await chatApi.getOrCreateOrderRoom({
          orderId: order.id,
          otherId,
          title,
        });

        if (!isMounted) return;
        setRoomId(room.id);

        const msgs = await chatApi.getRoomMessages(room.id);
        if (!isMounted) return;
        setMessages(Array.isArray(msgs) ? msgs : []);
        scrollToLatest();

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3030";
        const socketUrl = wsUrl.replace(/^ws/, "http");

        socketInstance = io(`${socketUrl}/chat`, {
          auth: { token, userId: currentUser.id },
          transports: ["websocket", "polling"],
        });

        socketInstance.on("connect", () => {
          socketInstance?.emit("joinRoom", { roomId: room.id });
          socketInstance?.emit("checkUserStatus", { userId: otherId });
        });

        socketInstance.on("receiveMessage", (data: ReceiveMessagePayload) => {
          const raw = data.message || data.data || data;
          if (raw && isMounted && typeof raw.content === "string") {
            const msg: ChatMessage = {
              id: raw.id,
              senderId: raw.senderId,
              sender: raw.sender,
              content: raw.content,
              createdAt: raw.createdAt || new Date().toISOString(),
            };
            setMessages((prev) => {
              if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            scrollToLatest();

            const senderId = msg.sender?.id || msg.senderId;
            if (senderId === otherId) {
              chatApi.markRoomAsRead(room.id).catch((err) => console.error("Failed to mark read:", err));
            }
          }
        });

        socketInstance.on("userStatus", (data: UserStatusPayload) => {
          if (data.userId === otherId && isMounted) {
            setIsOnline(data.status === "online");
          }
        });

        if (isMounted) {
          setSocket(socketInstance);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to initialize order chat room:", err);
          setChatError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initChat();

    return () => {
      isMounted = false;
      timers.forEach(clearTimeout);
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [order.id, order.propertyType, order.city, otherId, currentUser, isRtl, retry]);

  const sendMessage = () => {
    if (!message.trim() || !socket || !roomId || !currentUser) return;
    try {
      socket.emit("sendMessage", { roomId, senderId: currentUser.id, content: message.trim() });
      setMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return dict.chatJustNow;
      return date.toLocaleTimeString(isRtl ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return dict.chatJustNow;
    }
  };

  if (!currentUser) {
    return (
      <div className={styles.chatPromptBox}>
        <MessageSquare className={styles.chatPromptIcon} />
        <p className={styles.chatPromptText}>{dict.chatSignInPrompt}</p>
        <Link href={loginHref(`/orders/${order.id}`)} className={styles.chatLoginLink}>
          {dict.chatSignInAction}
        </Link>
      </div>
    );
  }

  if (!otherId) {
    return (
      <div className={styles.chatPromptBox}>
        <MessageSquare className={styles.chatPromptIcon} />
        <p className={styles.chatPromptText}>{dict.chatWaitingAgent}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.stateContainer}>
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (chatError) {
    return <div className={styles.chatPromptBox} role="alert">
      <p className={styles.chatPromptText}>{isRtl ? 'تعذر تحميل المحادثة.' : 'Could not load this conversation.'}</p>
      <button type="button" className={styles.retryButton} onClick={() => setRetry(value => value + 1)}>{dict.retryAction}</button>
    </div>;
  }

  const otherName = otherUser
    ? `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim() || dict.adminOffice
    : dict.adminOffice;

  return (
    <div className={styles.chatContainer}>
      {/* Architectural Chat Header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatPartnerInfo}>
          <div className={styles.chatAvatarWrapper}>
            <div className={styles.chatAvatar}>
              {otherName.charAt(0)}
            </div>
            <div
              className={`${styles.presenceDot} ${isOnline ? styles.presenceOnline : styles.presenceOffline}`}
              aria-label={isOnline ? dict.chatOnline : dict.chatOffline}
            />
          </div>
          <div>
            <h4 className={styles.chatPartnerName}>{otherName}</h4>
            <p className={styles.chatPresenceText}>
              {isOnline ? dict.chatOnline : dict.chatOffline}
            </p>
          </div>
        </div>
        
      </div>

      {/* Messages Thread Viewport */}
      <div className={styles.chatMessagesArea}>
        {messages.length === 0 ? (
          <div className={styles.chatEmptyState}>
            <MessageSquare className={styles.chatEmptyIcon} />
            <p className={styles.chatEmptyText}>{dict.chatEmpty}</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender?.id === currentUser.id || msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id || index}
                className={`${styles.messageRow} ${isOwn ? styles.messageRowOwn : styles.messageRowOther}`}
              >
                <div className={styles.messageBubble}>
                  <div
                    className={`${styles.messageBody} ${isOwn ? styles.messageBodyOwn : styles.messageBodyOther}`}
                  >
                    {msg.content}
                  </div>
                  <div
                    className={`${styles.messageMeta} ${isOwn ? styles.messageMetaOwn : styles.messageMetaOther}`}
                  >
                    <span>{formatMessageTime(msg.createdAt)}</span>
                    {isOwn && <CheckCheck className={styles.readReceiptIcon} />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className={styles.chatInputBar}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dict.chatPlaceholder}
          aria-label={dict.chatPlaceholder}
          className={styles.chatInput}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!message.trim()}
          aria-label={dict.chatSend}
          className={styles.chatSendBtn}
        >
          <Send className={isRtl ? styles.sendIconRtl : styles.sendIconLtr} />
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   Order Details Main Page Component
   ========================================================================== */
export default function OrderDetailsPage() {
  const params = useParams();
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "ar";
  const isRtl = lang === "ar";
  const dict = DICTIONARY[lang];

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedContact, setCopiedContact] = useState<string | null>(null);
  const fetchSerial = useRef(0);
  const { rootRef, paused, reducedMotion, toggleMotion } = useOrderMotion(order?.id, loading);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {
          // ignore corrupted local storage
        }
      }
    }
  }, []);

  const fetchOrder = useCallback(async () => {
    if (!params?.id) return;
    const request = ++fetchSerial.current;
    setLoading(true);
    setError(false);
    try {
      const res = await ordersApi.findOne(params.id as string);
      if (request !== fetchSerial.current) return;
      if (res.data && (typeof res.data !== 'object' || typeof res.data.id !== 'string')) throw new Error('Invalid order response');
      setOrder(res.data);
    } catch (err) {
      if (request !== fetchSerial.current) return;
      console.error("Failed to fetch order:", err);
      setError(true);
      toast.error(dict.errorMessage);
    } finally {
      if (request === fetchSerial.current) setLoading(false);
    }
  }, [params?.id, dict.errorMessage]);

  useEffect(() => {
    fetchOrder();
    return () => { fetchSerial.current += 1; };
  }, [fetchOrder]);

  const copyToClipboard = async (text: string, type: "ref" | "email" | "phone") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "ref") {
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2000);
      } else {
        setCopiedContact(type);
        setTimeout(() => setCopiedContact(null), 2000);
      }
      toast.success(dict.copied);
    } catch {
      toast.error(isRtl ? "تعذّر النسخ" : "Failed to copy");
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className={styles.orderDetailRoot} dir={isRtl ? "rtl" : "ltr"}>
        <div className={styles.container}>
          <div className={styles.skeletonHeader} />
          <div className={styles.layoutGrid}>
            <div className={styles.mainColumn}>
              <div className={styles.skeletonBlock} />
              <div className={styles.skeletonBlock} />
            </div>
            <div className={styles.sideColumn}>
              <div className={styles.skeletonBlock} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className={styles.orderDetailRoot} dir={isRtl ? "rtl" : "ltr"}>
        <div className={styles.container}>
          <div className={styles.stateContainer}>
            <RotateCcw className={styles.stateIcon} />
            <h2 className={styles.stateTitle}>{dict.errorTitle}</h2>
            <p className={styles.stateMessage}>{dict.errorMessage}</p>
            <button
              type="button"
              onClick={fetchOrder}
              className={styles.retryButton}
              aria-label={dict.retryAction}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{dict.retryAction}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!order) {
    return (
      <div className={styles.orderDetailRoot} dir={isRtl ? "rtl" : "ltr"}>
        <div className={styles.container}>
          <div className={styles.stateContainer}>
            <Building2 className={styles.stateIcon} />
            <h2 className={styles.stateTitle}>{dict.notFoundTitle}</h2>
            <p className={styles.stateMessage}>{dict.notFoundMessage}</p>
            <Link href="/orders" className={styles.backButton} aria-label={dict.backToOrders}>
              <ArrowRight className={isRtl ? styles.iconRtl : styles.iconLtr} />
              <span>{dict.backToOrders}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Order Details Calculations
  const localizedStatus = localizeStatus(order.status, lang);
  const localizedPropertyTypeTitle = localizePropertyType(order.propertyType, lang);
  const localizedDeed = localizeDeedType(order.deedType, lang);
  const localizedAge = localizePropertyAge(order.propertyAge, lang);
  const isLand = order.propertyType === "أرض" || order.propertyType?.toLowerCase() === "land";

  const isBuy = order.orderType === "buy";
  const dealTypeLabel = isBuy ? dict.deal_buy : dict.deal_rent;

  // Extra Order Fields that might be attached dynamically
  const extOrder = order as ExtendedOrder;
  const lengthVal = extOrder.length;
  const widthVal = extOrder.width;
  const streetWidthVal = extOrder.streetWidth;
  const directionVal = extOrder.direction;
  const livingRoomsVal = extOrder.livingRooms;
  const kitchensVal = extOrder.kitchens;
  const floorsVal = extOrder.floors;
  const apartmentsVal = extOrder.apartments;
  const buildingAreaVal = extOrder.buildingArea;
  const furnitureStatusVal = extOrder.furnitureStatus;
  const hasRoofVal = extOrder.hasRoof;
  const hasExternalAnnexVal = extOrder.hasExternalAnnex;
  const clientNameVal = extOrder.clientName;
  const clientPhoneVal = extOrder.clientPhone;

  // Structural details presence check (Preserves 0 values!)
  const hasStructuralDetails =
    !isLand &&
    (isPresent(order.rooms) ||
      isPresent(order.bathrooms) ||
      isPresent(livingRoomsVal) ||
      isPresent(kitchensVal) ||
      isPresent(floorsVal) ||
      isPresent(apartmentsVal) ||
      isPresent(buildingAreaVal) ||
      isPresent(furnitureStatusVal));

  // Land dimensions presence check
  const hasLandDimensions =
    isLand &&
    (isPresent(lengthVal) ||
      isPresent(widthVal) ||
      isPresent(streetWidthVal) ||
      isPresent(directionVal));

  // Features presence check
  const hasFeatures = Boolean(
    order.hasGarage ||
    order.hasPool ||
    order.hasElevator ||
    order.hasMaidRoom ||
    hasRoofVal ||
    hasExternalAnnexVal
  );

  // Client Details
  const orderUser = order.user;
  const assignedSpecialist = order.assignedTo;
  const canSeePrivateContacts = Boolean(currentUser?.role && currentUser.role !== "client");

  // Formatted date string
  const formattedCreationDate = new Date(order.createdAt).toLocaleDateString(
    isRtl ? "ar-SA" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const safeProfileImg = safeHttpUrl(orderUser?.profileImage);
  const safeAgentImg = safeHttpUrl(assignedSpecialist?.profileImage);
  const motionLabel = reducedMotion
    ? (isRtl ? "الحركة المخففة مفعّلة" : "Reduced motion enabled")
    : paused ? (isRtl ? "تشغيل الحركة" : "Enable motion") : (isRtl ? "إيقاف الحركة" : "Pause motion");

  return (
    <div ref={rootRef} className={styles.orderDetailRoot} dir={isRtl ? "rtl" : "ltr"} data-motion-paused={paused || reducedMotion}>
      <div className={styles.container}>
        {/* Top Navigation & Breadcrumbs */}
        <div className={styles.topNav}>
          <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
            <Link href="/orders" className={styles.breadcrumbLink}>
              {dict.orders}
            </Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>{dict.orderDetails}</span>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.refHash}>#{order.id.slice(0, 8)}</span>
          </nav>

          <div className={styles.motionControls}>
            <button
              type="button"
              className={styles.motionButton}
              onClick={toggleMotion}
              disabled={reducedMotion}
              aria-pressed={paused || reducedMotion}
              aria-label={motionLabel}
            >
              {paused || reducedMotion ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
              <span>{motionLabel}</span>
            </button>
            <Link href="/orders" className={styles.backButton} aria-label={dict.backToOrders}>
              <ArrowRight className={isRtl ? styles.iconRtl : styles.iconLtr} />
              <span>{dict.backToOrders}</span>
            </Link>
          </div>
        </div>

        {/* Command Center request overview */}
        <div className={styles.heroSection}>
          <OrderNetworkArtwork />
          {/* Top Meta Row */}
          <div className={styles.heroMetaRow}>
            <div className={styles.badgeGroup}>
              <span className={styles.dealBadge}>
                <Tag className="w-3 h-3" />
                {dealTypeLabel}
              </span>
              <span className={`${styles.statusBadge} ${localizedStatus.className}`}>
                <span className={styles.statusDot} />
                {localizedStatus.label}
              </span>
            </div>

            <div className={styles.heroTimestamp}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{dict.createdOn}: {formattedCreationDate}</span>
            </div>
          </div>

          {/* Title Area */}
          <div className={styles.heroTitleArea}>
            <span className={styles.blueprintMicroLabel}>
              {dict.orderReference} / {order.id.slice(0, 8)}
            </span>
            <h1 className={styles.heroTitle}>{localizedPropertyTypeTitle}</h1>
            <div className={styles.heroLocation}>
              <MapPin className={styles.heroLocationIcon} />
              <span className={styles.heroLocationCity}>{order.city}</span>
              {order.neighborhood && (
                <>
                  <span className={styles.heroLocationSep}>—</span>
                  <span>{order.neighborhood}</span>
                </>
              )}
            </div>
          </div>

          {/* Ruled Key Specifications Strip (Preserving 0 values!) */}
          <div className={styles.ruledFiguresBar}>
            {/* Target Budget / Price */}
            <div className={styles.ruledFigureCell}>
              <span className={styles.ruledFigureLabel}>
                <Tag className="w-3 h-3" />
                {dict.budget}
              </span>
              <div className={styles.ruledFigureValue}>
                {isPresent(order.price) ? (
                  <SaudiRiyalAmount
                    amount={Number(order.price)}
                    locale={isRtl ? "ar-SA" : "en-US"}
                  />
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>

            {/* Requested Area */}
            <div className={styles.ruledFigureCell}>
              <span className={styles.ruledFigureLabel}>
                <Ruler className="w-3 h-3" />
                {dict.requestedArea}
              </span>
              <div className={styles.ruledFigureValue}>
                {isPresent(order.area) ? (
                  <>
                    <span>{Number(order.area).toLocaleString(isRtl ? "ar-SA" : "en-US")}</span>
                    <span className={styles.ruledFigureUnit}>{dict.sqm}</span>
                  </>
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>

            {/* Reference ID with Copy Button */}
            <div className={styles.ruledFigureCell}>
              <span className={styles.ruledFigureLabel}>
                <FileText className="w-3 h-3" />
                {dict.orderId}
              </span>
              <div className={styles.ruledFigureValue}>
                <span className={styles.refHash}>#{order.id.slice(0, 8)}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(order.id, "ref")}
                  className={styles.copyRefButton}
                  aria-label={dict.copy}
                  title={copiedRef ? dict.copied : dict.copy}
                >
                  {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Property Age or Deed */}
            <div className={styles.ruledFigureCell}>
              <span className={styles.ruledFigureLabel}>
                <Clock className="w-3 h-3" />
                {dict.propertyAge}
              </span>
              <div className={styles.ruledFigureValue} style={{ fontSize: "1rem" }}>
                <span>{localizedAge}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className={styles.layoutGrid}>
          {/* Main Column: Specifications, Layout, Amenities, Notes */}
          <div className={styles.mainColumn}>
            {/* Primary Specifications Block */}
            <div className={styles.specBlock}>
              <div className={styles.specBlockHeader}>
                <h2 className={styles.specBlockTitle}>
                  <Building2 className={styles.specBlockTitleIcon} />
                  <span>{dict.section_primary}</span>
                </h2>
                
              </div>

              <div className={styles.specGrid}>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>
                    <Building2 className={styles.specLabelIcon} />
                    {dict.propertyType}
                  </span>
                  <span className={styles.specValue}>{localizedPropertyTypeTitle}</span>
                </div>

                <div className={styles.specRow}>
                  <span className={styles.specLabel}>
                    <Tag className={styles.specLabelIcon} />
                    {dict.dealType}
                  </span>
                  <span className={styles.specValue}>{dealTypeLabel}</span>
                </div>

                <div className={styles.specRow}>
                  <span className={styles.specLabel}>
                    <MapPin className={styles.specLabelIcon} />
                    {dict.city}
                  </span>
                  <span className={styles.specValue}>{order.city || "—"}</span>
                </div>

                <div className={styles.specRow}>
                  <span className={styles.specLabel}>
                    <MapPin className={styles.specLabelIcon} />
                    {dict.neighborhood}
                  </span>
                  <span className={styles.specValue}>{order.neighborhood || "—"}</span>
                </div>

                <div className={styles.specRow}>
                  <span className={styles.specLabel}>
                    <Maximize2 className={styles.specLabelIcon} />
                    {dict.requestedArea}
                  </span>
                  <span className={styles.specValue}>
                    {isPresent(order.area) ? `${Number(order.area).toLocaleString(isRtl ? "ar-SA" : "en-US")} ${dict.sqm}` : "—"}
                  </span>
                </div>

                <div className={styles.specRow}>
                  <span className={styles.specLabel}>
                    <Tag className={styles.specLabelIcon} />
                    {dict.budget}
                  </span>
                  <span className={styles.specValue}>
                    {isPresent(order.price) ? (
                      <SaudiRiyalAmount amount={Number(order.price)} locale={isRtl ? "ar-SA" : "en-US"} />
                    ) : (
                      "—"
                    )}
                  </span>
                </div>

                <div className={styles.specRow}>
                  <span className={styles.specLabel}>
                    <Clock className={styles.specLabelIcon} />
                    {dict.propertyAge}
                  </span>
                  <span className={styles.specValue}>{localizedAge}</span>
                </div>

                <div className={styles.specRow}>
                  <span className={styles.specLabel}>
                    <FileText className={styles.specLabelIcon} />
                    {dict.deedType}
                  </span>
                  <span className={styles.specValue}>{localizedDeed}</span>
                </div>
              </div>
            </div>

            {/* Land & Plot Specifications Block (Conditional for Land) */}
            {hasLandDimensions && (
              <div className={styles.specBlock}>
                <div className={styles.specBlockHeader}>
                  <h2 className={styles.specBlockTitle}>
                    <Compass className={styles.specBlockTitleIcon} />
                    <span>{dict.section_land}</span>
                  </h2>
                  
                </div>

                <div className={styles.specGrid}>
                  {isPresent(lengthVal) && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>
                        <Ruler className={styles.specLabelIcon} />
                        {dict.length}
                      </span>
                      <span className={styles.specValue}>{Number(lengthVal).toLocaleString(isRtl ? "ar-SA" : "en-US")} {dict.meters}</span>
                    </div>
                  )}

                  {isPresent(widthVal) && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>
                        <Ruler className={styles.specLabelIcon} />
                        {dict.width}
                      </span>
                      <span className={styles.specValue}>{Number(widthVal).toLocaleString(isRtl ? "ar-SA" : "en-US")} {dict.meters}</span>
                    </div>
                  )}

                  {isPresent(streetWidthVal) && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>
                        <Ruler className={styles.specLabelIcon} />
                        {dict.streetWidth}
                      </span>
                      <span className={styles.specValue}>{Number(streetWidthVal).toLocaleString(isRtl ? "ar-SA" : "en-US")} {dict.meters}</span>
                    </div>
                  )}

                  {isPresent(directionVal) && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>
                        <Compass className={styles.specLabelIcon} />
                        {dict.direction}
                      </span>
                      <span className={styles.specValue}>{directionVal}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Structural Layout Specifications Block (Conditional for Non-Land, Preserving 0 Values!) */}
            {hasStructuralDetails && (
              <div className={styles.specBlock}>
                <div className={styles.specBlockHeader}>
                  <h2 className={styles.specBlockTitle}>
                    <Layers2 className={styles.specBlockTitleIcon} />
                    <span>{dict.section_layout}</span>
                  </h2>
                  
                </div>

                <div className={styles.specGrid}>
                  {isPresent(order.rooms) && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>
                        <BedDouble className={styles.specLabelIcon} />
                        {dict.rooms}
                      </span>
                      <span className={styles.specValue}>{Number(order.rooms).toLocaleString(isRtl ? "ar-SA" : "en-US")}</span>
                    </div>
                  )}

                  {isPresent(order.bathrooms) && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>
                        <Bath className={styles.specLabelIcon} />
                        {dict.bathrooms}
                      </span>
                      <span className={styles.specValue}>{Number(order.bathrooms).toLocaleString(isRtl ? "ar-SA" : "en-US")}</span>
                    </div>
                  )}

                  {isPresent(livingRoomsVal) && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>
                        <Sofa className={styles.specLabelIcon} />
                        {dict.livingRooms}
                      </span>
                      <span className={styles.specValue}>{Number(livingRoomsVal).toLocaleString(isRtl ? "ar-SA" : "en-US")}</span>
                    </div>
                  )}

                  {isPresent(kitchensVal) && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>
                        <ChefHat className={styles.specLabelIcon} />
                        {dict.kitchens}
                      </span>
                      <span className={styles.specValue}>{Number(kitchensVal).toLocaleString(isRtl ? "ar-SA" : "en-US")}</span>
                    </div>
                  )}

                  {isPresent(floorsVal) && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>
                        <Layers2 className={styles.specLabelIcon} />
                        {dict.floors}
                      </span>
                      <span className={styles.specValue}>{Number(floorsVal).toLocaleString(isRtl ? "ar-SA" : "en-US")}</span>
                    </div>
                  )}

                  {isPresent(apartmentsVal) && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>
                        <Home className={styles.specLabelIcon} />
                        {dict.apartments}
                      </span>
                      <span className={styles.specValue}>{Number(apartmentsVal).toLocaleString(isRtl ? "ar-SA" : "en-US")}</span>
                    </div>
                  )}

                  {isPresent(buildingAreaVal) && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>
                        <Maximize2 className={styles.specLabelIcon} />
                        {dict.buildingArea}
                      </span>
                      <span className={styles.specValue}>{Number(buildingAreaVal).toLocaleString(isRtl ? "ar-SA" : "en-US")} {dict.sqm}</span>
                    </div>
                  )}

                  {isPresent(furnitureStatusVal) && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>
                        <Warehouse className={styles.specLabelIcon} />
                        {dict.furnitureStatus}
                      </span>
                      <span className={styles.specValue}>{localizeFurnitureStatus(furnitureStatusVal, lang)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Requested Amenities & Features Block */}
            {hasFeatures && (
              <div className={styles.specBlock}>
                <div className={styles.specBlockHeader}>
                  <h2 className={styles.specBlockTitle}>
                    <CheckCircle2 className={styles.specBlockTitleIcon} />
                    <span>{dict.section_amenities}</span>
                  </h2>
                  
                </div>

                <div className={styles.featuresGrid}>
                  {order.hasGarage && (
                    <div className={styles.featureTag}>
                      <CheckCircle2 className={styles.featureCheckIcon} />
                      <span>{dict.amenity_garage}</span>
                    </div>
                  )}

                  {order.hasPool && (
                    <div className={styles.featureTag}>
                      <CheckCircle2 className={styles.featureCheckIcon} />
                      <span>{dict.amenity_pool}</span>
                    </div>
                  )}

                  {order.hasElevator && (
                    <div className={styles.featureTag}>
                      <CheckCircle2 className={styles.featureCheckIcon} />
                      <span>{dict.amenity_elevator}</span>
                    </div>
                  )}

                  {order.hasMaidRoom && (
                    <div className={styles.featureTag}>
                      <CheckCircle2 className={styles.featureCheckIcon} />
                      <span>{dict.amenity_maidRoom}</span>
                    </div>
                  )}

                  {hasRoofVal && (
                    <div className={styles.featureTag}>
                      <CheckCircle2 className={styles.featureCheckIcon} />
                      <span>{dict.amenity_roof}</span>
                    </div>
                  )}

                  {hasExternalAnnexVal && (
                    <div className={styles.featureTag}>
                      <CheckCircle2 className={styles.featureCheckIcon} />
                      <span>{dict.amenity_annex}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Details & Client Notes Block */}
            {isPresent(order.additionalDetails) && (
              <div className={styles.specBlock}>
                <div className={styles.specBlockHeader}>
                  <h2 className={styles.specBlockTitle}>
                    <FileText className={styles.specBlockTitleIcon} />
                    <span>{dict.section_notes}</span>
                  </h2>
                  
                </div>

                <div className={styles.notesCallout}>
                  <p className={styles.notesText}>{order.additionalDetails}</p>
                </div>
              </div>
            )}
          </div>

          {/* Side Column: Registry Overview, Client Profile, Direct Chat */}
          <div className={styles.sideColumn}>
            {/* Order Registry Summary */}
            <div className={styles.specBlock}>
              <div className={styles.specBlockHeader}>
                <h3 className={styles.specBlockTitle}>
                  <FileText className={styles.specBlockTitleIcon} />
                  <span>{dict.section_registry}</span>
                </h3>
                
              </div>

              <div className={styles.contactRow}>
                <span className={styles.contactLabelGroup}>
                  <Tag className={styles.contactIcon} />
                  {dict.orderReference}
                </span>
                <span className={styles.refHash}>#{order.id.slice(0, 8)}</span>
              </div>

              <div className={styles.contactRow}>
                <span className={styles.contactLabelGroup}>
                  <Clock className={styles.contactIcon} />
                  {dict.orderStatus}
                </span>
                <span className={`${styles.statusBadge} ${localizedStatus.className}`}>
                  <span className={styles.statusDot} />
                  {localizedStatus.label}
                </span>
              </div>

              <div className={styles.contactRow}>
                <span className={styles.contactLabelGroup}>
                  <Calendar className={styles.contactIcon} />
                  {dict.createdOn}
                </span>
                <span className={styles.specValue}>{formattedCreationDate}</span>
              </div>
            </div>

            {/* Requester Profile Card */}
            {orderUser && (
              <div className={styles.specBlock}>
                <div className={styles.specBlockHeader}>
                  <h3 className={styles.specBlockTitle}>
                    <UserIcon className={styles.specBlockTitleIcon} />
                    <span>{dict.section_client}</span>
                  </h3>
                  
                </div>

                <div className={styles.profileCard}>
                  {safeProfileImg ? (
                    <Image
                      src={safeProfileImg}
                      alt={orderUser.firstName}
                      width={44}
                      height={44}
                      unoptimized
                      className={styles.profileAvatar}
                    />
                  ) : (
                    <div className={styles.profileAvatar}>
                      {orderUser.firstName?.[0]?.toUpperCase() || <UserIcon className="w-5 h-5" />}
                    </div>
                  )}

                  <div className={styles.profileInfo}>
                    <p className={styles.profileName}>
                      <span>{orderUser.firstName} {orderUser.lastName || ""}</span>

                    </p>
                    <span className={styles.profileRoleBadge}>
                      {orderUser.role || "—"}
                    </span>
                  </div>
                </div>

                {/* Privacy Gated Contact Details (Visible to Admins / Agents) */}
                {canSeePrivateContacts && (
                  <div>
                    {orderUser.email && (
                      <div className={styles.contactRow}>
                        <span className={styles.contactLabelGroup}>
                          <Mail className={styles.contactIcon} />
                          {dict.email}
                        </span>
                        <div className="flex items-center gap-1">
                          <a href={`mailto:${orderUser.email}`} className={styles.contactValueAction}>
                            {orderUser.email}
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              if (orderUser.email) copyToClipboard(orderUser.email, "email");
                            }}
                            className={styles.copyContactBtn}
                            aria-label={dict.copy}
                          >
                            {copiedContact === "email" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {orderUser.phone && (
                      <div className={styles.contactRow}>
                        <span className={styles.contactLabelGroup}>
                          <Phone className={styles.contactIcon} />
                          {dict.phone}
                        </span>
                        <div className="flex items-center gap-1">
                          <a href={`tel:${orderUser.phone}`} className={styles.contactValueAction}>
                            {orderUser.phone}
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              if (orderUser.phone) copyToClipboard(orderUser.phone, "phone");
                            }}
                            className={styles.copyContactBtn}
                            aria-label={dict.copy}
                          >
                            {copiedContact === "phone" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Direct Contact for Anonymous or Lead Orders */}
            {!orderUser && (clientNameVal || clientPhoneVal) && (
              <div className={styles.specBlock}>
                <div className={styles.specBlockHeader}>
                  <h3 className={styles.specBlockTitle}>
                    <UserIcon className={styles.specBlockTitleIcon} />
                    <span>{dict.section_anonymous}</span>
                  </h3>
                  
                </div>

                {clientNameVal && (
                  <div className={styles.contactRow}>
                    <span className={styles.contactLabelGroup}>
                      <UserIcon className={styles.contactIcon} />
                      {dict.clientName}
                    </span>
                    <span className={styles.specValue}>{clientNameVal}</span>
                  </div>
                )}

                {clientPhoneVal && canSeePrivateContacts && (
                  <div className={styles.contactRow}>
                    <span className={styles.contactLabelGroup}>
                      <Phone className={styles.contactIcon} />
                      {dict.clientPhone}
                    </span>
                    <a href={`tel:${clientPhoneVal}`} className={styles.contactValueAction}>
                      {clientPhoneVal}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Assigned Specialist Card (if assigned) */}
            {assignedSpecialist && (
              <div className={styles.specBlock}>
                <div className={styles.specBlockHeader}>
                  <h3 className={styles.specBlockTitle}>
                    <BadgeCheck className={styles.specBlockTitleIcon} />
                    <span>{dict.section_agent}</span>
                  </h3>
                  
                </div>

                <div className={styles.profileCard}>
                  {safeAgentImg ? (
                    <Image
                      src={safeAgentImg}
                      alt={assignedSpecialist.firstName}
                      width={44}
                      height={44}
                      unoptimized
                      className={styles.profileAvatar}
                    />
                  ) : (
                    <div className={styles.profileAvatar}>
                      {assignedSpecialist.firstName?.[0]?.toUpperCase() || <UserIcon className="w-5 h-5" />}
                    </div>
                  )}

                  <div className={styles.profileInfo}>
                    <p className={styles.profileName}>
                      {assignedSpecialist.firstName} {assignedSpecialist.lastName || ""}
                    </p>
                    <span className={styles.profileRoleBadge}>
                      {dict.section_agent}
                    </span>
                  </div>
                </div>

                {assignedSpecialist.email && canSeePrivateContacts && (
                  <div className={styles.contactRow}>
                    <span className={styles.contactLabelGroup}>
                      <Mail className={styles.contactIcon} />
                      {dict.email}
                    </span>
                    <a href={`mailto:${assignedSpecialist.email}`} className={styles.contactValueAction}>
                      {assignedSpecialist.email}
                    </a>
                  </div>
                )}

                {assignedSpecialist.phone && canSeePrivateContacts && (
                  <div className={styles.contactRow}>
                    <span className={styles.contactLabelGroup}>
                      <Phone className={styles.contactIcon} />
                      {dict.phone}
                    </span>
                    <a href={`tel:${assignedSpecialist.phone}`} className={styles.contactValueAction}>
                      {assignedSpecialist.phone}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Real Operational Chat Module */}
            <OrderChatBox order={order} currentUser={currentUser} />
          </div>
        </div>
      </div>
    </div>
  );
}
