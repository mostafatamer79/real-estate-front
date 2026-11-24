// app/offers/[id]/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { safeHttpUrl } from "@/lib/safe-url";
import { loginHref } from "@/lib/auth-navigation";
import Offer3DMedia from "@/components/cinematic/Offer3DMedia";
import {
  Home,
  ArrowRight,
  Calendar,
  MapPin,
  DollarSign,
  Ruler,
  Building,
  Users,
  Car,
  Layers,
  MessageCircle,
  MessageSquare,
  Share2,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  Award,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  Bath,
  Bed,
  Eye,
  Download,
  Camera,
  Video,
  FileText,
  AlertCircle,
  Loader2,
  DoorOpen,
  Sofa,
  Bath as BathIcon,
  Car as CarIcon,
  UtensilsCrossed,
  ShieldCheck,
  MoreVertical,
  Edit,
  Trash2,
  Flag,
  Copy,
  Facebook,
  Twitter,
  PhoneCall,
  BadgeCheck,
  Star as StarIcon,
  CheckCheck,
  Send,
  SaudiRiyalIcon,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import { offersApi, bookingsApi } from "@/lib/api";
import { Offer as ApiOffer } from "@/types/api";
import { chatApi } from "@/lib/chat";
import { io } from "socket.io-client";
import ChatButton from "@/components/chat/chat-button";
import SimpleChatModal from "@/components/chat/chat-modal";
import VisitRequestModal from "@/components/modals/visit-request-modal";
import PurchaseModal from "@/components/modals/PurchaseModal";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { SegmentedTabs, SegmentedList, SegmentedTrigger } from "@/components/ui/mobile-tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./offer-detail.module.css";
import requestDialogStyles from "@/components/modals/offer-request-modal.module.css";

const DETAIL_COPY: Record<string, readonly [string, string]> = {
  "offer.price": [
    "السعر",
    "Price"
  ],
  "offer.area": [
    "المساحة",
    "Area"
  ],
  "offer.type": [
    "نوع العقار",
    "Property type"
  ],
  "offer.city": [
    "المدينة",
    "City"
  ],
  "offer.basic": [
    "معلومات أساسية",
    "Overview"
  ],
  "offer.age": [
    "عمر العقار",
    "Property age"
  ],
  "offer.deed": [
    "نوع الصك",
    "Deed type"
  ],
  "offer.direction": [
    "الاتجاه",
    "Direction"
  ],
  "offer.location": [
    "الموقع",
    "Location"
  ],
  "offer.neighborhood": [
    "الحي",
    "District"
  ],
  "offer.facilities": [
    "المرافق والغرف",
    "Rooms & spaces"
  ],
  "offer.rooms": [
    "عدد الغرف",
    "Bedrooms"
  ],
  "offer.baths": [
    "دورات المياه",
    "Bathrooms"
  ],
  "offer.features": [
    "المميزات",
    "Features"
  ],
  "offer.living": [
    "غرف المعيشة",
    "Living rooms"
  ],
  "offer.kitchens": [
    "المطابخ",
    "Kitchens"
  ],
  "offer.floors": [
    "الأدوار",
    "Floors"
  ],
  "offer.furniture": [
    "الأثاث",
    "Furnishing"
  ],
  "offer.garage": [
    "موقف سيارة",
    "Garage"
  ],
  "offer.pool": [
    "مسبح",
    "Pool"
  ],
  "offer.elevator": [
    "مصعد",
    "Elevator"
  ],
  "offer.maid": [
    "غرفة خادمة",
    "Maid room"
  ],
  "offer.roof": [
    "سطح",
    "Roof"
  ],
  "offer.annex": [
    "ملحق",
    "Annex"
  ],
  "offer.streetWidth": [
    "عرض الشارع",
    "Street width"
  ],
  "offer.status": [
    "حالة التحقق",
    "Verification"
  ],
  "offer.memberSince": [
    "عضو منذ",
    "Member since"
  ],
  "offer.undefined": [
    "غير محدد",
    "Not specified"
  ],
  "offer.advertiser": [
    "المعلن",
    "Advertiser"
  ],
  "offer.verifiedUser": [
    "موثّق",
    "Verified"
  ],
  "offer.new": [
    "جديد",
    "New"
  ],
  "offer.used": [
    "مستعمل",
    "Used"
  ],
  "offer.construction": [
    "قيد الإنشاء",
    "Under construction"
  ],
  "offer.condition": [
    "حالة العقار",
    "Condition"
  ],
  "offer.errorLoad": [
    "تعذر تحميل العرض",
    "Could not load listing"
  ],
  "offer.tryAgain": [
    "محاولة مرة أخرى",
    "Try again"
  ],
  "offer.backOffers": [
    "العودة إلى العروض",
    "Back to listings"
  ],
  "offer.deleted": [
    "تم الحذف",
    "Listing deleted"
  ],
  "offer.deletedDesc": [
    "تم حذف العرض بنجاح",
    "The listing was deleted."
  ],
  "offer.errorDelete": [
    "تعذر حذف العرض",
    "Could not delete listing"
  ],
  "offer.error": [
    "حدث خطأ",
    "Something went wrong"
  ],
  "offer.errorReport": [
    "تعذر إرسال البلاغ",
    "Could not submit report"
  ],
  "offer.reportReason": [
    "اختر سبب البلاغ",
    "Choose a reason"
  ],
  "offer.reported": [
    "تم إرسال البلاغ",
    "Report submitted"
  ],
  "offer.reportedDesc": [
    "سيتم مراجعة البلاغ",
    "Your report will be reviewed."
  ],
  "offer.copied": [
    "تم النسخ",
    "Link copied"
  ],
  "offer.copiedDesc": [
    "تم نسخ رابط العرض",
    "The listing link was copied."
  ],
  "offer.loginRequired": [
    "يلزم تسجيل الدخول",
    "Sign in required"
  ],
  "offer.loginDesc": [
    "سجل الدخول لإكمال هذا الإجراء",
    "Sign in to continue."
  ],
  "offer.shareTitle": [
    "مشاركة العرض",
    "Share listing"
  ],
  "offer.shareDesc": [
    "تفاصيل العرض العقاري",
    "Property listing details"
  ],
  "offer.imageAlt": [
    "صورة العقار",
    "Property image"
  ],
  "offer.thumbAlt": [
    "صورة مصغرة",
    "Thumbnail"
  ],
  "chat.areaUnit": [
    "م²",
    "m²"
  ]
};

interface ExtendedOffer extends ApiOffer {
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role: string;
    isVerified: boolean;
    nafathVerifiedAt?: string | null;
    profileImage?: string;
    createdAt: string;
    updatedAt: string;
  };
  threeDVideos?: string[];
  checkImage?: string;
  views?: number;
  clientName?: string;
  clientPhone?: string;
}

function OfferChatBox({ offer, currentUser }: { offer: ExtendedOffer; currentUser: any }) {
  const { language } = useLanguage();
  const router = useRouter();
  const isRtl = language === "ar";
  const [roomId, setRoomId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [chatError, setChatError] = useState(false);
  const [retry, setRetry] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If the offer doesn't have a registered user, default sellerId to the System Admin ID
  const sellerId = offer.user?.id || "b61df4bb-85fc-456b-8366-494610d03820";

  useEffect(() => {
    if (!currentUser || !sellerId) {
      setLoading(false);
      return;
    }

    // A seller cannot chat with themselves
    if (currentUser.id === sellerId) {
      setLoading(false);
      return;
    }

    let disposed = false;
    let connection: ReturnType<typeof io> | undefined;
    const controller = new AbortController();
    const timers: ReturnType<typeof setTimeout>[] = [];
    const scrollToLatest = () => {
      timers.push(setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }), 50));
    };
    setLoading(true);
    setChatError(false);
    setSocket(null);
    const initChat = async () => {
      try {
        const title = `${offer.propertyType} في ${offer.city}`;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/rooms/offer`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            offerId: offer.id,
            sellerId,
            offerTitle: title,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create chat room');
        }

        const room = await response.json();
        if (disposed) return;
        setRoomId(room.id);

        // Fetch messages
        const msgs = await chatApi.getRoomMessages(room.id);
        if (disposed) return;
        setMessages(Array.isArray(msgs) ? msgs : []);
        scrollToLatest();

        // Setup socket
        const token = localStorage.getItem('token');
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3030';
        const socketUrl = wsUrl.replace(/^ws/, 'http');

        const socketIo = io(`${socketUrl}/chat`, {
          auth: { token, userId: currentUser.id },
          transports: ['websocket', 'polling']
        });

        connection = socketIo;
        socketIo.on('connect', () => {
          socketIo.emit('joinRoom', { roomId: room.id });
          socketIo.emit('checkUserStatus', { userId: sellerId });
        });

        socketIo.on('receiveMessage', (data) => {
          const msg = data.message || data.data || data;
          if (msg) {
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            scrollToLatest();

            // Mark read if incoming from other
            const senderId = msg.sender?.id || msg.senderId;
            if (senderId === sellerId) {
              chatApi.markRoomAsRead(room.id).catch(err => console.error('Failed to mark read:', err));
            }
          }
        });

        socketIo.on('userStatus', (data) => {
          if (data.userId === sellerId) {
            setIsOnline(data.status === 'online');
          }
        });

        setSocket(socketIo);
      } catch (err) {
        if (!disposed) {
          console.error("Failed to initialize offer chat room:", err);
          setChatError(true);
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    initChat();

    return () => {
      disposed = true;
      controller.abort();
      timers.forEach(clearTimeout);
      connection?.disconnect();
    };
  }, [offer.id, sellerId, currentUser, retry]);

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
      return date.toLocaleTimeString(isRtl ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return isRtl ? "الآن" : "now";
    }
  };

  if (!currentUser) {
    return (
      <div className={`${styles.chatCard} calm-panel`}>
        <div className={styles.chatLoginNotice}>
          <div className={styles.metricIconWrap}>
            <MessageSquare className="w-5 h-5 text-current" />
          </div>
          <p className="text-xs font-bold">
            {isRtl ? "يرجى تسجيل الدخول للبدء بالمحادثة المباشرة مع المعلن" : "Please sign in to start a live chat with the advertiser"}
          </p>
          <Link
            href={loginHref(`/offers/${offer.id}`)}
            className={styles.chatLoginLink}
          >
            {isRtl ? "تسجيل الدخول" : "Sign In"}
          </Link>
        </div>
      </div>
    );
  }

  // A seller looking at their own offer doesn't chat with themselves
  if (currentUser.id === sellerId) {
    return (
      <div className={`${styles.editorialCard} calm-panel text-center`}>
        <div className={styles.metricIconWrap}>
          <MessageSquare className="w-5 h-5 text-current" />
        </div>
        <p className="text-xs font-bold text-muted-foreground mt-2">
          {isRtl
            ? "هذا هو عرضك الخاص. يمكنك متابعة الرسائل والطلبات الواردة في صفحة المحادثات."
            : "This is your own offer. You can follow incoming chats on the chats page."}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${styles.chatCard} calm-panel flex items-center justify-center`}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (chatError) {
    return <div className={styles.chatCard} role="alert">
      <p className="p-4 text-sm">{isRtl ? 'تعذر تحميل المحادثة.' : 'Could not load this conversation.'}</p>
      <Button variant="outline" onClick={() => setRetry(value => value + 1)}>{isRtl ? 'محاولة مرة أخرى' : 'Retry chat'}</Button>
    </div>;
  }

  const otherName = offer.user
    ? `${offer.user.firstName || ''} ${offer.user.lastName || ''}`.trim() || (isRtl ? 'المعلن' : 'Advertiser')
    : (isRtl ? 'الدعم الفني للوساطة' : 'Support');

  return (
    <div className={`${styles.chatCard} calm-panel`}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderUser}>
          <div className={styles.chatAvatarWrap}>
            <div className={styles.chatAvatarSmall}>
              {otherName.charAt(0)}
            </div>
            <span
              className={`${styles.onlineStatusDot} ${isOnline ? styles.dotOnline : styles.dotOffline}`}
              aria-label={isOnline ? (isRtl ? "متصل" : "Online") : (isRtl ? "غير متصل" : "Offline")}
            />
          </div>
          <div>
            <div className={styles.chatHeaderName}>{otherName}</div>
            <div className={styles.chatHeaderStatus}>
              {isOnline ? (isRtl ? 'متصل الآن' : 'Online') : (isRtl ? 'غير متصل' : 'Offline')}
            </div>
          </div>
        </div>
        {roomId && (
          <button
            type="button"
            onClick={() => router.push(`/chat/${roomId}`)}
            className={styles.chatFullLinkBtn}
            title={isRtl ? "الانتقال إلى صفحة المحادثة الكاملة" : "Open full chat page"}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isRtl ? "المحادثة الكاملة" : "Full Chat"}</span>
          </button>
        )}
      </div>

      {/* Messages list */}
      <div className={styles.chatMessageList}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-1 opacity-50 py-8">
            <MessageSquare className="w-6 h-6 text-muted-foreground mb-1" />
            <p className="text-xs font-bold">
              {isRtl ? "ابدأ المحادثة الآن بخصوص هذا العرض" : "Start the conversation regarding this listing"}
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender?.id === currentUser.id || msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id || index}
                className={isOwn ? styles.chatBubbleOwn : styles.chatBubbleOther}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <div className={styles.chatBubbleMeta}>
                  <span>{formatTime(msg.createdAt)}</span>
                  {isOwn && <CheckCheck className="w-2.5 h-2.5" />}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input section */}
      <div className={styles.chatInputArea}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRtl ? "اكتب استفسارك هنا..." : "Type your message..."}
          className={styles.chatInputField}
          aria-label={isRtl ? "رسالة المحادثة" : "Chat message"}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!message.trim()}
          className={styles.chatSendBtn}
          aria-label={isRtl ? "إرسال" : "Send"}
        >
          <Send className={`w-4 h-4 ${isRtl ? '-rotate-45 ml-0.5' : 'rotate-45 mr-0.5'}`} />
        </button>
      </div>
    </div>
  );
}

const MeterIcon = ({ className }: { className?: string }) => (
  <Image src="/icons/meter.svg" alt="meter" width={20} height={20} className={className} />
);

export default function OfferDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;
  const { toast } = useToast();
  const { t: translate, language } = useLanguage();
  const isRtl = language === "ar";
  const t = (key: string) => {
    const copy = translate(key);
    return copy === key ? (DETAIL_COPY[key]?.[isRtl ? 0 : 1] || copy) : copy;
  };

  const [offer, setOffer] = useState<ExtendedOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreenGalleryOpen, setIsFullscreenGalleryOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [views, setViews] = useState(0);

  const [isOwner, setIsOwner] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleBack = () => {
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    let target = isAdmin ? '/admin/offers' : '/offers';
    try {
      const referrer = new URL(document.referrer);
      if (isAdmin && referrer.origin === window.location.origin && referrer.pathname === '/admin/orders') {
        target = '/admin/orders';
      }
    } catch { /* Direct visits return to the listing index. */ }
    router.push(target);
  };

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Visit Modal state
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  // Purchase Modal state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Check if current user is the seller
  const isUserSeller = useCallback(() => {
    if (!user || !offer?.user) return false;
    return user.id === offer.user.id;
  }, [user, offer]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = () => {
      try {
        if (typeof window !== 'undefined') {
          const userData = localStorage.getItem('user');
          const token = localStorage.getItem('token');

          if (userData && token) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
          }
        }
      } catch (err) {
        console.error('Failed to parse user data:', err);
      }
    };

    fetchUserData();
  }, []);

  // Fetch offer details
  const fetchOfferDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await offersApi.findOne(offerId);
      const offerData = response.data;
      if (!offerData || typeof offerData !== 'object' || Array.isArray(offerData) || !offerData.id) throw new Error('Invalid listing response');

      // Transform the data to match our interface
      const transformedOffer: ExtendedOffer = {
        ...offerData,
        user: (offerData as any).user || undefined,
        mediaFiles: Array.isArray(offerData.mediaFiles) ? offerData.mediaFiles.filter((url: string) => typeof url === "string" && Boolean(safeHttpUrl(url))) : [],
        propertyDocuments: Array.isArray(offerData.propertyDocuments) ? offerData.propertyDocuments.filter((url: string) => typeof url === "string" && Boolean(safeHttpUrl(url))) : [],
        threeDVideos: Array.isArray(offerData.threeDVideos) ? offerData.threeDVideos.filter((url: string) => typeof url === "string" && Boolean(safeHttpUrl(url))) : [],
      };

      setOffer(transformedOffer);
      if (offerData.views !== undefined) {
        setViews(offerData.views);
      }

      // Check if current user is the owner
      setIsOwner(Boolean(user && ((offerData as any).userId === user.id || (offerData as any).user?.id === user.id)));
      setCurrentImageIndex(0);

    } catch (err: any) {
      console.error("Error fetching offer details:", err);
      setError(err.response?.data?.message || (isRtl ? "فشل في تحميل بيانات العرض" : "Failed to load listing data"));
    } finally {
      setLoading(false);
    }
  }, [offerId, user, isRtl]);

  useEffect(() => {
    fetchOfferDetails();
  }, [fetchOfferDetails]);

  useEffect(() => {
    if (offerId) {
      offersApi.incrementViews(offerId).catch(err => {
        console.error("Error incrementing views:", err);
      });
    }
  }, [offerId]);

  const handleReportOffer = async () => {
    if (!user) {
      toast({
        title: t('offer.loginRequired'),
        description: t('offer.loginDesc'),
        variant: "destructive",
      });
      router.push(loginHref(`/offers/${offerId}`));
      return;
    }

    if (!reportReason.trim()) {
      toast({
        title: t('offer.reportReason'),
        variant: "destructive",
      });
      return;
    }

    try {
      setReportLoading(true);
      await offersApi.report(offerId, {
        reason: reportReason,
        message: reportDetails,
      });

      toast({
        title: t('offer.reported'),
        description: t('offer.reportedDesc'),
      });

      setReportReason("");
      setReportDetails("");
      setIsReportModalOpen(false);
    } catch (err) {
      console.error("Error reporting offer:", err);
      toast({
        title: t('offer.error'),
        description: t('offer.errorReport'),
        variant: "destructive",
      });
    } finally {
      setReportLoading(false);
    }
  };

  const handleShare = async (platform?: string) => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = offer ? `${offer.propertyType} ${t('cards.ops.sale2024')} ${offer.city}` : t('offer.shareTitle');

    const shareData = {
      title: shareTitle,
      text: offer?.additionalNotes || t('offer.shareDesc'),
      url: shareUrl,
    };

    try {
      if (platform === "whatsapp") {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`, "_blank");
      } else if (platform === "facebook") {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
      } else if (platform === "twitter") {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
      } else if (platform === "copy") {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: t('offer.copied'),
          description: t('offer.copiedDesc'),
        });
      } else if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: t('offer.copied'),
          description: t('offer.copiedDesc'),
        });
      }
    } catch (shareErr) {
      console.error("Error sharing:", shareErr);
    }
  };

  const handleEditOffer = () => {
    if (offer) {
      router.push(`/offers/${offer.id}/edit`);
    }
  };

  const handleDeleteOffer = async () => {
    if (!offer || !user || deleteLoading) return;

    try {
      setDeleteLoading(true);
      setDeleteError("");
      await offersApi.delete(offer.id);

      toast({
        title: t('offer.deleted'),
        description: t('offer.deletedDesc'),
      });

      router.push("/offers");
    } catch (delErr) {
      console.error("Error deleting offer:", delErr);
      setDeleteError(isRtl ? 'تعذر حذف العرض. حاول مرة أخرى.' : 'Could not delete the listing. Try again.');
      toast({
        title: t('offer.error'),
        description: t('offer.errorDelete'),
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleInterest = async (type: 'visit' | 'buy') => {
    if (!user) {
      toast({
        title: t('offer.loginRequired'),
        description: t('offer.loginDesc'),
        variant: "destructive",
      });
      router.push(loginHref(`/offers/${offerId}`));
      return;
    }

    if (type === 'visit') {
      setIsVisitModalOpen(true);
      return;
    }

    if (type === 'buy') {
      setIsPurchaseModalOpen(true);
      return;
    }
  };

  const handleVisitSubmit = async (data: any) => {
    try {
      setActionLoading('visit');
      if (!offer) return;

      if (data.visitType === 'agent') {
        const recordingLabel = data.recordingType === 'live'
          ? (language === 'ar' ? 'بث مباشر' : 'Live Streaming')
          : (language === 'ar' ? 'تسجيل فيديو' : 'Video Recording');
        const calLabel = data.calendarType === 'hijri'
          ? (language === 'ar' ? 'هجري' : 'Hijri')
          : (language === 'ar' ? 'ميلادي' : 'Gregorian');

        let finalDescription = `طلب زيارة بالنيابة للعقار رقم: ${offer.id}`;
        if (data.visitDate) {
          finalDescription += `\nالتاريخ والوقت: ${format(new Date(data.visitDate), 'dd/MM/yyyy HH:mm')}`;
          finalDescription += `\nنوع التقويم: ${calLabel}`;
        }
        finalDescription += `\nنوع التسجيل: ${recordingLabel}`;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            category: 'visit',
            serviceType: language === 'ar' ? 'زيارة بالنيابة' : 'Visit by Proxy',
            clientName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
            phone: user?.phone || '0000000000',
            city: offer.city || user?.city || 'الرياض',
            district: offer.neighborhood || user?.district || 'الحي',
            quantity: 1,
            description: finalDescription,
            metadata: {
              offerId: offer.id,
              recordingType: data.recordingType,
              calendarType: data.calendarType,
              visitDate: data.visitDate,
            }
          }),
        });

        if (!response.ok) throw new Error('Visit request was rejected');

        toast({
          title: t('common.success'),
          description: t('bm.offer.visitReqSent'),
        });
      } else {
        await offersApi.createVisit(offer.id, data);
        toast({
          title: t('common.success'),
          description: t('bm.offer.visitReqSent'),
        });
      }

      setIsVisitModalOpen(false);
    } catch (visitErr) {
      console.error('Error creating visit request:', visitErr);
      toast({
        title: t('common.error'),
        description: t('common.errorDesc'),
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePurchaseSubmit = async () => {
    try {
      setActionLoading('buy');
      if (!offer) return;

      await offersApi.createPurchase(offer.id);

      toast({
        title: t('common.success'),
        description: (isRtl ? 'تم إرسال طلب الشراء بنجاح' : 'Purchase request sent successfully'),
      });

      setIsPurchaseModalOpen(false);
    } catch (purchaseErr) {
      console.error('Error creating purchase request:', purchaseErr);
      toast({
        title: t('common.error'),
        description: t('common.errorDesc'),
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const processInterestAction = async (type: 'visit' | 'buy', dateString?: string) => {
    if (!offer) return;

    try {
      setActionLoading(type);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/rooms/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          offerId: offer.id,
          sellerId: offer.user?.id,
          offerTitle: `${offer.propertyType} في ${offer.city}`,
        }),
      });

      if (!response.ok) throw new Error('Failed to create chat room');
      const room = await response.json();

      let chatMsg = "";
      if (type === 'visit') {
        chatMsg = `${t('bm.offer.visitReq')} \n\n ${t('chat.date')}: ${dateString}`;
      } else {
        const key = offer.dealType === 'rent' ? 'offer.rentProp' : 'offer.buyProp';
        chatMsg = `${t('bm.offer.buyProp')} (${t(key)})`;
      }

      await chatApi.sendMessage(room.id, chatMsg);

      setChatRoomId(room.id);
      setIsChatOpen(true);
    } catch (procErr) {
      console.error('Error handling interest:', procErr);
      toast({
        title: t('common.error'),
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: isRtl ? ar : undefined });
    } catch {
      return dateString;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case t('offer.new'):
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
      case t('offer.used'):
        return 'bg-muted text-slate-800 dark:bg-slate-800 dark:text-slate-200';
      case t('offer.construction'):
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
      default:
        return 'bg-muted text-gray-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  // Render actual backend property media without decorative artwork
  const renderImages = () => {
    const images = offer?.mediaFiles || [];

    // Truthful empty state with existing camera icon
    if (images.length === 0) {
      return (
        <div className={`cinematic-listing-gallery calm-panel ${styles.noMediaBox}`}>
          <Camera className={styles.noMediaIcon} />
          <h3 className={styles.noMediaTitle}>
            {isRtl ? "لا توجد صور مرفقة لهذا العقار" : "No photography attached to this listing"}
          </h3>
          <p className={styles.noMediaDesc}>
            {isRtl
              ? "يتم عرض الوسائط الحقيقية المرفوعة من صاحب العرض فور توفرها دون استبدالها بصور تخيلية."
              : "Actual property media uploaded by the owner will appear here once provided."}
          </p>
        </div>
      );
    }

    const currentImage = images[currentImageIndex];

    return (
      <div className={styles.gallerySection}>
        {/* Main Image Frame */}
        <div className={`cinematic-listing-gallery calm-panel ${styles.mainGalleryFrame}`}>
          <Image
            key={currentImage}
            src={currentImage}
            unoptimized={/^https?:\/\//i.test(currentImage)}
            alt={`${offer ? `${offer.propertyType} في ${offer.city}` : t('offer.imageAlt')} - ${currentImageIndex + 1}`}
            fill
            className={`cinematic-listing-image ${styles.galleryImage}`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 1200px"
            priority
          />

          {/* Scrim Overlay */}
          <div className={styles.galleryScrim} />

          {/* Navigation Controls */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label={isRtl ? 'الصورة السابقة' : 'Previous image'}
                onClick={() => setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                className={`${styles.galleryNavBtn} ${styles.galleryNavPrev}`}
              >
                {isRtl ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
              </button>
              <button
                type="button"
                aria-label={isRtl ? 'الصورة التالية' : 'Next image'}
                onClick={() => setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                className={`${styles.galleryNavBtn} ${styles.galleryNavNext}`}
              >
                {isRtl ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
              </button>
            </>
          )}

          {/* Counter Badge */}
          <div className={styles.galleryCounter}>
            {isRtl
              ? `${currentImageIndex + 1} من ${images.length}`
              : `${currentImageIndex + 1} / ${images.length}`}
          </div>

          {/* Fullscreen Trigger */}
          <button
            type="button"
            onClick={() => setIsFullscreenGalleryOpen(true)}
            className={styles.galleryFullscreenBtn}
            aria-label={isRtl ? "تكبير واستعراض الصور" : "Enlarge gallery"}
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">{isRtl ? "عرض مكبر" : "Enlarge"}</span>
          </button>
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className={styles.thumbnailStrip} role="group" aria-label={isRtl ? "معرض الصور المصغرة" : "Image thumbnails"}>
            {images.map((image, index) => (
              <button
                type="button"
                aria-pressed={currentImageIndex === index}
                aria-label={isRtl ? `عرض الصورة ${index + 1}` : `View image ${index + 1}`}
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`${styles.thumbnailBtn} ${currentImageIndex === index ? styles.thumbnailActive : styles.thumbnailInactive}`}
              >
                <Image
                  src={image}
                  unoptimized={/^https?:\/\//i.test(image)}
                  alt={`${t('offer.thumbAlt')} ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="92px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Fullscreen Image Lightbox Dialog */}
        <Dialog open={isFullscreenGalleryOpen} onOpenChange={setIsFullscreenGalleryOpen}>
          <DialogContent className="max-w-5xl p-2 sm:p-4 bg-slate-950/95 border-slate-800 text-white">
            <DialogHeader className="sr-only">
              <DialogTitle>{offer ? `${offer.propertyType} في ${offer.city}` : "Gallery"}</DialogTitle>
              <DialogDescription>{isRtl ? "استعراض الصور بالحجم الكامل" : "Full size imagery"}</DialogDescription>
            </DialogHeader>
            <div className="relative w-full aspect-[16/10] min-h-[300px] max-h-[75vh] flex items-center justify-center overflow-hidden rounded-xl">
              <Image
                src={images[currentImageIndex]}
                unoptimized={/^https?:\/\//i.test(images[currentImageIndex])}
                alt={`${offer ? `${offer.propertyType} في ${offer.city}` : t('offer.imageAlt')} - ${currentImageIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 1400px) 100vw, 1400px"
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label={isRtl ? 'الصورة السابقة' : 'Previous image'}
                    onClick={() => setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                    className={`${styles.galleryNavBtn} ${styles.galleryNavPrev}`}
                  >
                    {isRtl ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
                  </button>
                  <button
                    type="button"
                    aria-label={isRtl ? 'الصورة التالية' : 'Next image'}
                    onClick={() => setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                    className={`${styles.galleryNavBtn} ${styles.galleryNavNext}`}
                  >
                    {isRtl ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                  </button>
                </>
              )}
              <div className={styles.galleryCounter}>
                {isRtl
                  ? `${currentImageIndex + 1} من ${images.length}`
                  : `${currentImageIndex + 1} / ${images.length}`}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const renderPropertyDetails = () => {
    if (!offer) return null;

    const keyMetrics = [
      { key: 'price', label: t('offer.price'), value: formatPrice(offer.price), icon: SaudiRiyalIcon },
      { key: 'area', label: t('offer.area'), value: `${offer.area} ${t('chat.areaUnit')}`, icon: Ruler },
      { key: 'type', label: t('offer.type'), value: offer.propertyType, icon: Building },
      { key: 'city', label: t('offer.city'), value: offer.city, icon: MapPin },
    ];

    if (offer.rooms) {
      keyMetrics.push({ key: 'rooms', label: t('offer.rooms'), value: `${offer.rooms}`, icon: Bed });
    }
    if (offer.bathrooms) {
      keyMetrics.push({ key: 'baths', label: t('offer.baths'), value: `${offer.bathrooms}`, icon: BathIcon });
    }

    return (
      <div className={styles.mainColumn}>
        {/* Architectural Overview Card */}
        <div className={`${styles.editorialCard} calm-panel`}>
          <div className={styles.keyMetricsGrid}>
            {keyMetrics.slice(0, 4).map((item) => (
              <div key={item.key} className={styles.metricCell}>
                <div className={styles.metricIconWrap}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className={styles.metricValue}>{item.value}</div>
                <div className={styles.metricLabel}>{item.label}</div>
              </div>
            ))}
          </div>

          {offer.additionalNotes && (
            <div className="mt-4 pt-4 border-t border-[var(--od-border-subtle)]">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                {isRtl ? "الوصف والملاحظات" : "Description & Notes"}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {offer.additionalNotes}
              </p>
            </div>
          )}
        </div>

        {/* Tabbed Architectural Specs & Attachments */}
        <div className={`${styles.editorialCard} calm-panel`}>
          <SegmentedTabs defaultValue="details" className={styles.specsTabsRoot} dir={isRtl ? 'rtl' : 'ltr'}>
            <SegmentedList className={styles.specsTabsList}>
              <SegmentedTrigger value="details" className={styles.specsTabTrigger}>
                <Building className="w-4 h-4" />
                <span>{isRtl ? 'تفاصيل العقار' : 'Property Details'}</span>
              </SegmentedTrigger>
              <SegmentedTrigger value="media" className={styles.specsTabTrigger}>
                <FileText className="w-4 h-4" />
                <span>{isRtl ? 'الملفات والمرفقات' : 'Files & Attachments'}</span>
              </SegmentedTrigger>
            </SegmentedList>

            {/* Property Details Tab */}
            <TabsContent value="details" className="outline-none focus:outline-none">
              <div className={styles.specSectionsGrid}>
                {/* Basic Specs */}
                <div className={styles.specSubPanel}>
                  <h4 className={styles.specSubTitle}>
                    <Building />
                    <span>{t('offer.basic')}</span>
                  </h4>
                  <div className={styles.specRowList}>
                    <div className={styles.specRow}>
                      <span className={styles.specKey}>{t('offer.condition')}</span>
                      <Badge className={getConditionColor(offer.propertyCondition || "")}>
                        {offer.propertyCondition || t('offer.undefined')}
                      </Badge>
                    </div>
                    <div className={styles.specRow}>
                      <span className={styles.specKey}>{t('offer.age')}</span>
                      <span className={styles.specVal}>{offer.propertyAge || t('offer.undefined')}</span>
                    </div>
                    <div className={styles.specRow}>
                      <span className={styles.specKey}>{t('offer.deed')}</span>
                      <span className={styles.specVal}>{offer.deedType || t('offer.undefined')}</span>
                    </div>
                    <div className={styles.specRow}>
                      <span className={styles.specKey}>{t('offer.direction')}</span>
                      <span className={styles.specVal}>{offer.direction || t('offer.undefined')}</span>
                    </div>
                    {(offer.length || offer.width) && (
                      <div className={styles.specRow}>
                        <span className={styles.specKey}>{isRtl ? 'الأبعاد' : 'Dimensions'}</span>
                        <span className={styles.specVal}>{offer.length || 0} × {offer.width || 0} {t('scan.unit.meter')}</span>
                      </div>
                    )}
                    {offer.dealType && (
                      <div className={styles.specRow}>
                        <span className={styles.specKey}>{isRtl ? 'نوع العملية' : 'Deal type'}</span>
                        <span className={styles.specVal}>{offer.dealType}</span>
                      </div>
                    )}
                    {offer.mainCategory && (
                      <div className={styles.specRow}>
                        <span className={styles.specKey}>{isRtl ? 'التصنيف' : 'Category'}</span>
                        <span className={styles.specVal}>{offer.mainCategory}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Specs */}
                <div className={styles.specSubPanel}>
                  <h4 className={styles.specSubTitle}>
                    <MapPin />
                    <span>{t('offer.location')}</span>
                  </h4>
                  <div className={styles.specRowList}>
                    <div className={styles.specRow}>
                      <span className={styles.specKey}>{t('offer.city')}</span>
                      <span className={styles.specVal}>{offer.city}</span>
                    </div>
                    <div className={styles.specRow}>
                      <span className={styles.specKey}>{t('offer.neighborhood')}</span>
                      <span className={styles.specVal}>{offer.neighborhood || t('offer.undefined')}</span>
                    </div>
                    {offer.streetWidth && (
                      <div className={styles.specRow}>
                        <span className={styles.specKey}>{t('offer.streetWidth')}</span>
                        <span className={styles.specVal}>{offer.streetWidth} {t('scan.unit.meter')}</span>
                      </div>
                    )}
                    {safeHttpUrl(offer.locationUrl) && (
                      <div className={styles.specRow}>
                        <span className={styles.specKey}>{isRtl ? 'رابط الموقع' : 'Location link'}</span>
                        <a
                          href={safeHttpUrl(offer.locationUrl)!}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-[var(--od-gold)] hover:underline"
                        >
                          <span>{isRtl ? 'فتح الخريطة' : 'Open map'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Facilities & Spaces */}
                <div className={styles.specSubPanel}>
                  <h4 className={styles.specSubTitle}>
                    <DoorOpen />
                    <span>{t('offer.facilities')}</span>
                  </h4>
                  <div className={styles.specRowList}>
                    {offer.rooms && (
                      <div className={styles.specRow}>
                        <span className={styles.specKey}><Bed className="w-4 h-4" />{t('offer.rooms')}</span>
                        <span className={styles.specVal}>{offer.rooms}</span>
                      </div>
                    )}
                    {offer.bathrooms && (
                      <div className={styles.specRow}>
                        <span className={styles.specKey}><BathIcon className="w-4 h-4" />{t('offer.baths')}</span>
                        <span className={styles.specVal}>{offer.bathrooms}</span>
                      </div>
                    )}
                    {offer.livingRooms && (
                      <div className={styles.specRow}>
                        <span className={styles.specKey}><Sofa className="w-4 h-4" />{t('offer.living')}</span>
                        <span className={styles.specVal}>{offer.livingRooms}</span>
                      </div>
                    )}
                    {offer.kitchens && (
                      <div className={styles.specRow}>
                        <span className={styles.specKey}><UtensilsCrossed className="w-4 h-4" />{t('offer.kitchens')}</span>
                        <span className={styles.specVal}>{offer.kitchens}</span>
                      </div>
                    )}
                    {offer.floors && (
                      <div className={styles.specRow}>
                        <span className={styles.specKey}><Layers className="w-4 h-4" />{t('offer.floors')}</span>
                        <span className={styles.specVal}>{offer.floors}</span>
                      </div>
                    )}
                    {offer.apartments && (
                      <div className={styles.specRow}>
                        <span className={styles.specKey}><Building className="w-4 h-4" />{isRtl ? 'عدد الشقق' : 'Apartments'}</span>
                        <span className={styles.specVal}>{offer.apartments}</span>
                      </div>
                    )}
                    {offer.buildingArea && (
                      <div className={styles.specRow}>
                        <span className={styles.specKey}><MeterIcon className="w-4 h-4" />{isRtl ? 'مساحة البناء' : 'Building area'}</span>
                        <span className={styles.specVal}>{offer.buildingArea} {t('chat.areaUnit')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features & Amenities */}
                <div className={styles.specSubPanel}>
                  <h4 className={styles.specSubTitle}>
                    <Award />
                    <span>{t('offer.features')}</span>
                  </h4>
                  <div className={styles.amenitiesGrid}>
                    {offer.hasElevator && (
                      <div className={styles.amenityItem}>
                        <CheckCircle className={styles.amenityIcon} />
                        <span>{t('offer.elevator')}</span>
                      </div>
                    )}
                    {offer.hasGarage && (
                      <div className={styles.amenityItem}>
                        <CheckCircle className={styles.amenityIcon} />
                        <span>{t('offer.garage')}</span>
                      </div>
                    )}
                    {offer.hasPool && (
                      <div className={styles.amenityItem}>
                        <CheckCircle className={styles.amenityIcon} />
                        <span>{t('offer.pool')}</span>
                      </div>
                    )}
                    {offer.hasMaidRoom && (
                      <div className={styles.amenityItem}>
                        <CheckCircle className={styles.amenityIcon} />
                        <span>{t('offer.maid')}</span>
                      </div>
                    )}
                    {offer.hasRoof && (
                      <div className={styles.amenityItem}>
                        <CheckCircle className={styles.amenityIcon} />
                        <span>{t('offer.roof')}</span>
                      </div>
                    )}
                    {offer.hasExternalAnnex && (
                      <div className={styles.amenityItem}>
                        <CheckCircle className={styles.amenityIcon} />
                        <span>{t('offer.annex')}</span>
                      </div>
                    )}
                  </div>
                  {offer.furnitureStatus && (
                    <div className="mt-3 pt-3 border-t border-[var(--od-border-subtle)]">
                      <div className={styles.specRow}>
                        <span className={styles.specKey}>{t('offer.furniture')}</span>
                        <span className={styles.specVal}>{offer.furnitureStatus}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Files & Attachments Tab */}
            <TabsContent value="media" className="outline-none focus:outline-none">
              <div className={styles.mediaAttachList}>
                {(offer.threeDVideos?.length || offer.video3d) && (
                  <div className="space-y-3">
                    <h4 className={styles.specSubTitle}>
                      <Video />
                      <span>{isRtl ? 'فيديوهات ثلاثية الأبعاد' : '3D videos'}</span>
                    </h4>
                    <div className="space-y-2">
                      {offer.video3d && (
                        <Offer3DMedia
                          source={offer.video3d}
                          label={isRtl ? 'جولة العقار ثلاثية الأبعاد' : 'Property 3D tour'}
                          language={isRtl ? 'ar' : 'en'}
                        />
                      )}
                      {(offer.threeDVideos || []).map((video, index) => (
                        <Offer3DMedia
                          key={`${video}-${index}`}
                          source={video}
                          label={isRtl ? `فيديو ثلاثي الأبعاد ${index + 1}` : `3D video ${index + 1}`}
                          language={isRtl ? 'ar' : 'en'}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {offer.propertyDocuments?.length ? (
                  <div className="space-y-3">
                    <h4 className={styles.specSubTitle}>
                      <FileText />
                      <span>{isRtl ? 'مستندات العقار' : 'Property documents'}</span>
                    </h4>
                    <div className="space-y-2">
                      {offer.propertyDocuments.map((doc, index) => (
                        <a
                          key={`${doc}-${index}`}
                          href={doc}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.docItemLink}
                        >
                          <span>{isRtl ? `مستند العقار ${index + 1}` : `Property Document ${index + 1}`}</span>
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {offer.checkImage && (
                  <div className="space-y-3">
                    <h4 className={styles.specSubTitle}>
                      <Camera />
                      <span>{isRtl ? 'صورة الشيك المرفق' : 'Attached check image'}</span>
                    </h4>
                    <a
                      href={safeHttpUrl(offer.checkImage) || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.docItemLink}
                    >
                      <span>{isRtl ? 'فتح صورة الشيك' : 'Open check image'}</span>
                      <Download className="w-4 h-4 text-muted-foreground" />
                    </a>
                  </div>
                )}

                {!offer.threeDVideos?.length && !offer.video3d && !offer.propertyDocuments?.length && !offer.checkImage && (
                  <div className="text-center py-8 text-sm font-bold text-muted-foreground border border-dashed border-[var(--od-border)] rounded-xl">
                    {isRtl ? 'لا توجد وسائط أو ملفات إضافية لهذا العرض حالياً.' : 'No extra media or documents available for this listing.'}
                  </div>
                )}
              </div>
            </TabsContent>
          </SegmentedTabs>
        </div>
      </div>
    );
  };

  const renderSellerInfo = () => {
    if (!offer?.user && !offer?.clientName && !offer?.clientPhone) return null;

    const seller = offer.user;
    const sellerName = seller
      ? `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || seller.email?.split('@')[0] || (isRtl ? "معلن" : "Advertiser")
      : offer.clientName || (isRtl ? 'المعلن' : 'Advertiser');
    const userIsSeller = isUserSeller();

    return (
      <div className={`${styles.advertiserCard} calm-panel`}>
        <div className={styles.advertiserHeader}>
          <div className={styles.advertiserAvatar}>
            {seller?.profileImage ? (
              <Image
                src={seller.profileImage}
                alt={sellerName}
                width={52}
                height={52}
                className="rounded-full object-cover"
              />
            ) : (
              sellerName.charAt(0) || <User className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className={styles.advertiserMeta}>
            <div className={styles.advertiserName}>
              <span>{sellerName}</span>
              {seller?.nafathVerifiedAt && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <BadgeCheck className={styles.verifiedCheck} />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isRtl ? "حساب موثق عبر نفاذ الوطني" : "Verified via Nafath"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className={styles.advertiserRole}>
              {seller?.role ? (t(`profile.role.${seller.role?.toLowerCase()}`) || seller.role) : (isRtl ? 'معلن' : 'Advertiser')}
            </div>
          </div>
        </div>

        <div className={styles.advertiserDetailsList}>
          {seller && (
            <div className={styles.advertiserDetailItem}>
              <span>{t('offer.status')}</span>
              <Badge variant={seller.nafathVerifiedAt ? "default" : "secondary"}>
                {seller.nafathVerifiedAt ? t('offer.verifiedUser') : (isRtl ? 'لم يتم التحقق' : 'Not verified')}
              </Badge>
            </div>
          )}

          {seller?.createdAt && (
            <div className={styles.advertiserDetailItem}>
              <span>{t('offer.memberSince')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(seller.createdAt)}</span>
            </div>
          )}

          {offer.clientPhone && (
            <div className={styles.advertiserDetailItem}>
              <span>{isRtl ? "رقم الاتصال" : "Phone"}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200" dir="ltr">{offer.clientPhone}</span>
            </div>
          )}
        </div>

        {/* Primary Action Buttons (Visit / Buy / Rent) for non-owners */}
        {!isOwner && user && !userIsSeller && seller && (
          <div className="space-y-3">
            <div className={styles.advertiserActionGrid}>
              <button
                type="button"
                className={styles.secondaryCtaBtn}
                onClick={() => handleInterest('visit')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'visit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                <span>{t('bm.offer.visitBtn')}</span>
              </button>
              <button
                type="button"
                className={styles.primaryCtaBtn}
                onClick={() => handleInterest('buy')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'buy' ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaudiRiyalIcon className="w-4 h-4" />}
                <span>{offer.dealType === 'rent' ? t('offer.rentProp') : t('offer.buyProp')}</span>
              </button>
            </div>

            {/* Embedded ChatButton */}
            <div className="w-full [&>button]:w-full [&>button]:justify-center [&>button]:min-h-[44px]">
              {offer.user ? (
                <ChatButton
                  offerId={offer.id}
                  offerTitle={`${offer.propertyType} في ${offer.city}`}
                  sellerId={offer.user.id}
                  sellerName={`${offer.user.firstName || ''} ${offer.user.lastName || ''}`.trim() || offer.user.email || (isRtl ? "المعلن" : "Advertiser")}
                  userId={user.id}
                  userName={user.name || user.username || user.email}
                />
              ) : (
                <div className="rounded-lg bg-muted px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                  {isRtl ? 'بيانات المعلن غير متوفرة لبدء المحادثة' : 'Advertiser data not available for chat'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLoadingState = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-9 w-2/3 rounded-xl" />
        <Skeleton className="h-5 w-1/3 rounded-lg" />
      </div>

      <Skeleton className="h-[380px] w-full rounded-2xl" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className={`cinematic-listing-error ${styles.editorialCard} calm-panel text-center max-w-lg mx-auto py-8 sm:py-12`}>
      <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">{t('offer.error')}</h2>
      <p className="text-sm text-muted-foreground mb-6">{error || t('offer.errorLoad')}</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={fetchOfferDetails} className="min-h-[44px]">
          <Loader2 className="w-4 h-4 ml-2" />
          {t('offer.tryAgain')}
        </Button>
        <Button variant="outline" onClick={() => router.push('/offers')} className="min-h-[44px]">
          <ArrowRight className="w-4 h-4 ml-2" />
          {t('offer.backOffers')}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`${styles.offerDetailRoot} calm-page calm-screen min-h-dvh-safe`}>
        <div className={styles.container}>
          {renderLoadingState()}
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className={`${styles.offerDetailRoot} cinematic-listing-error-page calm-page calm-screen min-h-dvh-safe`}>
        <div className={styles.container}>
          {renderErrorState()}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.offerDetailRoot} cinematic-listing calm-page calm-screen min-h-dvh-safe`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className={styles.container}>
        {/* Editorial Top Navigation */}
        <div className={styles.topNav}>
          <div className={styles.breadcrumbs}>
            <button
              type="button"
              onClick={handleBack}
              className={styles.breadcrumbLink}
              aria-label={isRtl ? "رجوع إلى العروض" : "Back to listings"}
            >
              <ArrowRight className={`w-4 h-4 ${!isRtl ? 'rotate-180' : ''}`} />
              <span>{isRtl ? "العروض" : "Offers"}</span>
            </button>
            <span className={styles.breadcrumbSep}>/</span>
            <span className="truncate max-w-[200px] sm:max-w-[360px] text-slate-800 dark:text-slate-200">
              {offer.propertyType} {isRtl ? "في" : "in"} {offer.city}
            </span>
          </div>

          <div className={styles.topActions}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => setIsShareModalOpen(true)}
                    aria-label={isRtl ? "مشاركة العرض" : "Share listing"}
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{isRtl ? "مشاركة" : "Share"}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{isRtl ? "مشاركة العرض" : "Share"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    aria-label={isRtl ? "خيارات إدارة العرض" : "Manage offer"}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{isRtl ? "خيارات العرض" : "Offer Options"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleEditOffer} className="cursor-pointer">
                    <Edit className="w-4 h-4 ml-2" />
                    <span>{isRtl ? "تعديل العرض" : "Edit Offer"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { setDeleteError(""); setDeleteConfirmOpen(true); }}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    <span>{isRtl ? "حذف العرض" : "Delete Offer"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {!isOwner && (
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setIsReportModalOpen(true)}
                aria-label={isRtl ? "إبلاغ عن مخالفة" : "Report offer"}
              >
                <Flag className="w-4 h-4 text-rose-500" />
                <span className="hidden sm:inline">{isRtl ? "إبلاغ" : "Report"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleBack}
              className={`${styles.actionBtn} ${styles.backBtn}`}
              aria-label={isRtl ? "رجوع" : "Back"}
            >
              <ArrowRight className={`w-4 h-4 ${!isRtl ? 'rotate-180' : ''}`} />
              <span className="hidden sm:inline">{isRtl ? "رجوع" : "Back"}</span>
            </button>
          </div>
        </div>

        {/* Editorial Headline Hierarchy */}
        <div className={`cinematic-listing-heading ${styles.editorialHeader}`}>
          <div className={styles.headerTopRow}>
            {offer.dealType && (
              <span className={styles.dealBadge}>
                {offer.dealType}
              </span>
            )}
            <span className={styles.typeBadge}>
              {offer.propertyType}
            </span>
            {offer.propertyCondition && (
              <span className={styles.typeBadge}>
                {offer.propertyCondition}
              </span>
            )}
          </div>

          <h1 className={styles.editorialTitle}>
            {offer.propertyType} {isRtl ? "في" : "in"} {offer.city}
            {offer.neighborhood && ` - ${isRtl ? 'حي' : 'District'} ${offer.neighborhood}`}
          </h1>

          <div className={styles.headerMetaRow}>
            <div className={styles.metaItem}>
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{isRtl ? "تاريخ النشر:" : "Published:"} {formatDate(offer.createdAt)}</span>
            </div>
            <div className={styles.metaItem}>
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span>{views} {isRtl ? "مشاهدة" : "views"}</span>
            </div>
            <div className={styles.metaItem}>
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{offer.city}{offer.neighborhood ? `، ${offer.neighborhood}` : ''}</span>
            </div>
          </div>
        </div>

        {/* Price & Primary Call-to-Action Card */}
        <div className={`${styles.priceHeroCard} mb-6`}>
          <div className={styles.priceDisplayBlock}>
            <span className={styles.priceLabel}>
              {offer.dealType === 'rent'
                ? (isRtl ? 'القيمة الإيجارية' : 'Rental Price')
                : (isRtl ? 'السعر المطلوب' : 'Asking Price')}
            </span>
            <div className={styles.priceAmount}>
              <SaudiRiyalAmount amount={offer.price} locale={isRtl ? 'ar-SA' : 'en-US'} />
            </div>
          </div>

          {!isOwner && (
            <div className={styles.priceActionBtns}>
              <button
                type="button"
                className={styles.secondaryCtaBtn}
                onClick={() => handleInterest('visit')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'visit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                <span>{t('bm.offer.visitBtn')}</span>
              </button>
              <button
                type="button"
                className={styles.primaryCtaBtn}
                onClick={() => handleInterest('buy')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'buy' ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaudiRiyalIcon className="w-4 h-4" />}
                <span>{offer.dealType === 'rent' ? t('offer.rentProp') : t('offer.buyProp')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Property Real Photography Gallery */}
        {renderImages()}

        {/* Architectural Two-Column Layout */}
        <div className={styles.editorialLayout}>
          {/* Main Column: Specs & Tabs */}
          {renderPropertyDetails()}

          {/* Task-Focused Sidebar */}
          <div className={styles.sidebarColumn}>
            {/* Advertiser Identity Card */}
            {renderSellerInfo()}

            {/* Direct Socket Chat Module */}
            <OfferChatBox offer={offer} currentUser={user} />

            {/* Quick Service Shortcuts */}
            <div className={`${styles.editorialCard} calm-panel`}>
              <h3 className={styles.cardHeaderTitle}>
                <Building className="w-4 h-4 text-[var(--od-gold)]" />
                <span>{isRtl ? "خيارات وخدمات سريعة" : "Quick Services"}</span>
              </h3>
              <p className={styles.cardHeaderDesc}>
                {isRtl ? "طلب خدمات عقارية وإدارية مباشرة مرتبطة بهذا العرض." : "Request related real estate and legal services."}
              </p>

              <div className={styles.servicesGrid}>
                {([
                  { type: 'postPurchase', icon: <CheckCircle className="w-4 h-4" /> },
                  { type: 'legal', icon: <ShieldCheck className="w-4 h-4" /> },
                  { type: 'construction', icon: <Building className="w-4 h-4" /> },
                  { type: 'marketing', icon: <StarIcon className="w-4 h-4" /> },
                  { type: 'other', icon: <MoreVertical className="w-4 h-4" /> },
                ] as const).map((svc) => (
                  <button
                    key={svc.type}
                    type="button"
                    className={styles.serviceShortcutBtn}
                    onClick={() => router.push(svc.type === 'legal' ? '/services/legal' : `/services/form?type=${svc.type}`)}
                  >
                    <span className={styles.serviceIconWrap}>
                      {svc.icon}
                    </span>
                    <span>{t(`services.${svc.type}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Guarantee & Safety Advisory */}
            <div className={`${styles.safetyAdvisoryCard} calm-panel`}>
              <h3 className={styles.cardHeaderTitle}>
                <Shield className="w-4 h-4 text-[var(--od-gold)]" />
                <span>{isRtl ? "إرشادات التعامل المالي الآمن" : "Safe Dealing Advisory"}</span>
              </h3>
              <div className={styles.safetyAdvisoryItem}>
                <CheckCircle className={styles.safetyIcon} />
                <p>
                  {isRtl
                    ? "احرص دائماً على إتمام كافة المحادثات والتعاملات الرسمية عبر المنصة لحفظ حقوق الأطراف."
                    : "Always conduct communications and official transactions via the platform to safeguard both parties' rights."}
                </p>
              </div>
              <div className={styles.safetyAdvisoryItem}>
                <CheckCircle className={styles.safetyIcon} />
                <p>
                  {isRtl
                    ? "تجنب تحويل أي مبالغ مالية أو شيكات خارج القنوات والاتفاقيات المعتمدة داخل المنصة."
                    : "Avoid transferring funds or checks outside approved platform agreements and verification channels."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Quick Action Dock */}
      {!isOwner && (
        <div className={styles.mobileActionDock}>
          <div className={styles.mobileDockPrice}>
            <span className={styles.mobileDockPriceLabel}>
              {offer.dealType === 'rent'
                ? (isRtl ? 'القيمة الإيجارية' : 'Rent')
                : (isRtl ? 'السعر' : 'Price')}
            </span>
            <span className={styles.mobileDockPriceValue}>
              <SaudiRiyalAmount amount={offer.price} locale={isRtl ? 'ar-SA' : 'en-US'} />
            </span>
          </div>

          <div className={styles.mobileDockBtns}>
            <button
              type="button"
              className={`${styles.secondaryCtaBtn} ${styles.mobileDockBtn}`}
              onClick={() => handleInterest('visit')}
              disabled={!!actionLoading}
            >
              {actionLoading === 'visit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              <span>{t('bm.offer.visitBtn')}</span>
            </button>
            <button
              type="button"
              className={`${styles.primaryCtaBtn} ${styles.mobileDockBtn}`}
              onClick={() => handleInterest('buy')}
              disabled={!!actionLoading}
            >
              {actionLoading === 'buy' ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaudiRiyalIcon className="w-4 h-4" />}
              <span>{offer.dealType === 'rent' ? t('offer.rentProp') : t('offer.buyProp')}</span>
            </button>
          </div>
        </div>
      )}

      <Dialog open={deleteConfirmOpen} onOpenChange={(open) => { if (!deleteLoading) setDeleteConfirmOpen(open); }}>
        <DialogContent className={requestDialogStyles.modal}>
          <DialogHeader>
            <DialogTitle>{isRtl ? 'حذف العرض؟' : 'Delete listing?'}</DialogTitle>
            <DialogDescription>{isRtl ? 'سيتم حذف هذا العرض. لا يمكن التراجع عن هذه الخطوة.' : 'This listing will be deleted. This action cannot be undone.'}</DialogDescription>
          </DialogHeader>
          {deleteError && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" disabled={deleteLoading} onClick={() => setDeleteConfirmOpen(false)}>{isRtl ? 'إلغاء' : 'Cancel'}</Button>
            <Button variant="destructive" disabled={deleteLoading} onClick={handleDeleteOffer}>{deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}{isRtl ? 'تأكيد الحذف' : 'Confirm deletion'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent className={`${requestDialogStyles.modal} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>{isRtl ? "معلومات الاتصال" : "Contact Details"}</DialogTitle>
            <DialogDescription>
              {isRtl ? "يمكنك استخدام هذه المعلومات للاتصال بالمعلن" : "Contact details provided by the advertiser"}
            </DialogDescription>
          </DialogHeader>

          {offer?.user && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="calm-icon w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold">
                    {`${offer.user.firstName || ''} ${offer.user.lastName || ''}`.trim() || offer.user.email || (isRtl ? "المعلن" : "Advertiser")}
                  </h4>
                  <p className="text-sm text-muted-foreground">{t(`profile.role.${offer.user.role}`)}</p>
                </div>
              </div>

              <Separator />

              {offer.user.phone && (
                <div className="space-y-2">
                  <Label>{isRtl ? "رقم الهاتف" : "Phone"}</Label>
                  <div className="flex items-center gap-2">
                    <Input value={offer.user.phone} readOnly />
                    <Button
                      size="sm"
                      onClick={() => window.open(`tel:${offer.user?.phone}`)}
                      className="min-h-[44px]"
                    >
                      <Phone className="w-4 h-4 ml-2" />
                      {isRtl ? "اتصل الآن" : "Call now"}
                    </Button>
                  </div>
                </div>
              )}

              {offer.user.email && (
                <div className="space-y-2">
                  <Label>{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
                  <div className="flex items-center gap-2">
                    <Input value={offer.user.email} readOnly />
                    <Button
                      size="sm"
                      onClick={() => window.open(`mailto:${offer.user?.email}`)}
                      className="min-h-[44px]"
                    >
                      <Mail className="w-4 h-4 ml-2" />
                      {isRtl ? "إرسال بريد" : "Send email"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsContactModalOpen(false)} className="min-h-[44px]">
              {isRtl ? "تم" : "Done"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className={`${requestDialogStyles.modal} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>{isRtl ? "مشاركة العرض" : "Share Listing"}</DialogTitle>
            <DialogDescription>
              {isRtl ? "شارك هذا العرض مع الآخرين أو انسخ رابط الصفحة" : "Share this listing or copy link to clipboard"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                className="min-h-[44px]"
                onClick={() => handleShare('whatsapp')}
              >
                <span>WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="min-h-[44px]"
                onClick={() => handleShare('twitter')}
              >
                <span>X / Twitter</span>
              </Button>
              <Button
                variant="outline"
                className="min-h-[44px]"
                onClick={() => handleShare('facebook')}
              >
                <span>Facebook</span>
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>{isRtl ? "رابط العرض" : "Listing URL"}</Label>
              <div className="flex gap-2">
                <Input
                  value={typeof window !== 'undefined' ? window.location.href : ''}
                  readOnly
                  className="min-h-[44px]"
                />
                <Button
                  variant="outline"
                  onClick={() => handleShare('copy')}
                  className="min-h-[44px] min-w-[44px]"
                  aria-label={isRtl ? "نسخ الرابط" : "Copy link"}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="min-h-[44px]">
                {isRtl ? "إغلاق" : "Close"}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className={`${requestDialogStyles.modal} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>{isRtl ? "الإبلاغ عن مخالفة" : "Report Violation"}</DialogTitle>
            <DialogDescription>
              {isRtl ? "الرجاء تحديد سبب الإبلاغ عن هذا العرض لمراجعته" : "Please select the reason for reporting this listing"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="offer-report-reason">{isRtl ? "سبب الإبلاغ" : "Reason"}</Label>
              <Select onValueChange={setReportReason} value={reportReason}>
                <SelectTrigger id="offer-report-reason" className="min-h-[44px]">
                  <SelectValue placeholder={isRtl ? "اختر سبب الإبلاغ" : "Select reason"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">{isRtl ? "إعلان مكرر أو بريد عشوائي" : "Duplicate or spam"}</SelectItem>
                  <SelectItem value="fake">{isRtl ? "معلومات غير صحيحة" : "Inaccurate information"}</SelectItem>
                  <SelectItem value="fraud">{isRtl ? "احتيال أو محاولة نصب" : "Fraud attempt"}</SelectItem>
                  <SelectItem value="offensive">{isRtl ? "محتوى مسيء أو غير لائق" : "Offensive content"}</SelectItem>
                  <SelectItem value="wrong_category">{isRtl ? "تصنيف خاطئ" : "Wrong category"}</SelectItem>
                  <SelectItem value="other">{isRtl ? "سبب آخر" : "Other"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportReason === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="offer-report-details">{isRtl ? "الرجاء توضيح السبب" : "Please describe in detail"}</Label>
                <Textarea
                  id="offer-report-details"
                  placeholder={isRtl ? "اذكر سبب الإبلاغ بالتفصيل..." : "Describe the issue..."}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReportModalOpen(false)}
              className="min-h-[44px]"
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleReportOffer}
              disabled={!reportReason.trim() || reportLoading}
              className="min-h-[44px]"
            >
              {reportLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  <span>{isRtl ? "جاري الإرسال..." : "Sending..."}</span>
                </>
              ) : (
                isRtl ? 'إرسال البلاغ' : 'Submit Report'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SimpleChatModal */}
      {isChatOpen && chatRoomId && user && (
        <SimpleChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          roomId={chatRoomId}
          userId={user.id}
          userName={user.firstName || user.email}
          otherUserName={offer?.user?.firstName || t('offer.advertiser')}
        />
      )}

      {/* VisitRequestModal */}
      <VisitRequestModal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        onSubmit={handleVisitSubmit}
        loading={actionLoading === 'visit'}
      />

      {/* PurchaseModal */}
      {offer && (
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          onConfirm={handlePurchaseSubmit}
          loading={actionLoading === 'buy'}
          propertyTitle={`${offer.propertyType} ${t('cards.ops.sale2024')} ${offer.city}`}
          price={<SaudiRiyalAmount amount={offer.price} locale={isRtl ? 'ar-SA' : 'en-US'} />}
        />
      )}
    </div>
  );
}
