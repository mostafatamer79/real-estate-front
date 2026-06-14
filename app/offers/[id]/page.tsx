// app/offers/[id]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
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
  Star as StarIcon
} from "lucide-react";
import { offersApi, bookingsApi } from "@/lib/api";
import { Offer as ApiOffer } from "@/types/api";
import { chatApi } from "@/lib/chat";
import ChatButton from "@/components/chat/chat-button";
import SimpleChatModal from "@/components/chat/chat-modal";
import VisitRequestModal from "@/components/modals/visit-request-modal";
import PurchaseModal from "@/components/modals/PurchaseModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

interface ExtendedOffer extends ApiOffer {
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role: string;
    isVerified: boolean;
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

export default function OfferDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const [offer, setOffer] = useState<ExtendedOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [views, setViews] = useState(0);

  const [isOwner, setIsOwner] = useState(false);
  
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

      // Transform the data to match our interface
      const transformedOffer: ExtendedOffer = {
        ...offerData,
        user: (offerData as any).user || undefined,
        mediaFiles: Array.isArray(offerData.mediaFiles) ? offerData.mediaFiles : [],
        propertyDocuments: Array.isArray(offerData.propertyDocuments) ? offerData.propertyDocuments : [],
        threeDVideos: Array.isArray(offerData.threeDVideos) ? offerData.threeDVideos : [],
      };

      setOffer(transformedOffer);
      if (offerData.views !== undefined) {
        setViews(offerData.views);
      }

      // Check if current user is the owner
      if (user && (offerData as any).userId === user.id) {
        setIsOwner(true);
      }

    } catch (err: any) {
      console.error("Error fetching offer details:", err);
      setError(err.response?.data?.message || "فشل في تحميل بيانات العرض");
    } finally {
      setLoading(false);
    }
  }, [offerId, user]);

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
      router.push("/login");
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
    } catch (error) {
      console.error("Error reporting offer:", error);
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
    const shareUrl = window.location.href;
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
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleEditOffer = () => {
    if (offer) {
      router.push(`/offers/${offer.id}/edit`);
    }
  };

  const handleDeleteOffer = async () => {
    if (!offer || !user) return;

    try {
      await offersApi.delete(offer.id);

      toast({
        title: t('offer.deleted'),
        description: t('offer.deletedDesc'),
      });

      router.push("/offers");
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast({
        title: t('offer.error'),
        description: t('offer.errorDelete'),
        variant: "destructive",
      });
    }
  };

  const handleInterest = async (type: 'visit' | 'buy') => {
    if (!user) {
        toast({
            title: t('offer.loginRequired'),
            description: t('offer.loginDesc'),
            variant: "destructive",
        });
        router.push("/login");
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
            // Build description with recording type and calendar type
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

            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests`, {
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

            toast({
                title: t('common.success'),
                description: t('bm.offer.visitReqSent'),
            });
        } else {
            // Standard visit booking
            await offersApi.createVisit(offer.id, data);
            toast({
                title: t('common.success'),
                description: t('bm.offer.visitReqSent'),
            });
        }
        
        setIsVisitModalOpen(false);

        // Optional: Open chat with success message

    } catch (error) {
        console.error('Error creating visit request:', error);
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
              description: t('bm.offer.purchaseReqSent'),
          });

          setIsPurchaseModalOpen(false);
          // No chat opened intentionally

      } catch (error) {
          console.error('Error creating purchase request:', error);
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
        
        // 1. Create/Get Room
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
        
        // 2. Send Message
        let message = "";
        if (type === 'visit') {
             message = `${t('bm.offer.visitReq')} \n\n ${t('chat.date')}: ${dateString}`;
        } else {
             const key = offer.dealType === 'rent' ? 'offer.rentProp' : 'offer.buyProp';
             message = `${t('bm.offer.buyProp')} (${t(key)})`;
        }
            
        await chatApi.sendMessage(room.id, message);

        // 3. Open Chat
        setChatRoomId(room.id);
        setIsChatOpen(true);
        
    } catch (error) {
        console.error('Error handling interest:', error);
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
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ar });
    } catch (error) {
      return dateString;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case t('offer.new'):
        return 'bg-green-100 text-green-800';
      case t('offer.used'):
        return 'bg-slate-100 text-blue-800';
      case t('offer.construction'):
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-gray-800';
    }
  };

  const renderImages = () => {
    const images = offer?.mediaFiles || [];

    if (images.length === 0) {
      return (
        <div className="relative w-full h-[400px] bg-slate-100 rounded-lg flex flex-col items-center justify-center">
          <Camera className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-500">{t('offer.noImages')}</p>
        </div>
      );
    }

    const currentImage = images[currentImageIndex];

    return (
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative w-full h-[400px] bg-slate-100 rounded-lg overflow-hidden">
          <Image
            src={currentImage}
            alt={`${t('offer.imageAlt')} ${currentImageIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                  currentImageIndex === index
                    ? 'border-gray-700'
                    : 'border-transparent'
                }`}
              >
                <Image
                  src={image}
                  alt={`${t('offer.thumbAlt')} ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPropertyDetails = () => {
    if (!offer) return null;

    const highlights = [
      { key: 'price', label: t('offer.price'), value: formatPrice(offer.price), icon: DollarSign },
      { key: 'area', label: t('offer.area'), value: `${offer.area} ${t('chat.areaUnit')}`, icon: Ruler },
      { key: 'type', label: t('offer.type'), value: offer.propertyType, icon: Building },
      { key: 'city', label: t('offer.city'), value: offer.city, icon: MapPin },
    ];

    const tabs = [
      { id: 'details', label: language === 'ar' ? 'التفاصيل' : 'Details' },
      { id: 'features', label: language === 'ar' ? 'المزايا' : 'Features' },
      { id: 'media', label: language === 'ar' ? 'الوسائط' : 'Media' },
      { id: 'advertiser', label: language === 'ar' ? 'المعلن' : 'Advertiser' },
    ];

    return (
      <div className="space-y-6">
        <Card className="overflow-hidden border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">
              {offer.propertyType} في {offer.city}
              {offer.neighborhood && ` - حي ${offer.neighborhood}`}
            </CardTitle>
            <CardDescription>
              {offer.additionalNotes || "عرض عقاري متميز"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {highlights.map((item) => (
                <div key={item.key} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-5 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <item.icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="text-lg font-black text-slate-900 break-words">{item.value}</div>
                  <p className="mt-1 text-xs font-bold text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`h-11 rounded-2xl text-sm font-black transition-colors ${
                  activeTab === tab.id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'details' && (
          <Card className="border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle>{t('offer.details')}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'عرض منظم وموسع لكل بيانات العقار الأساسية والمكانية.' : 'A richer structured view of the main property and location data.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      {t('offer.basic')}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('offer.condition')}</span>
                        <Badge className={getConditionColor(offer.propertyCondition || "")}>
                          {offer.propertyCondition || t('offer.undefined')}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('offer.age')}</span>
                        <span className="font-semibold">{offer.propertyAge || t('offer.undefined')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('offer.deed')}</span>
                        <span className="font-semibold">{offer.deedType || t('offer.undefined')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('offer.direction')}</span>
                        <span className="font-semibold">{offer.direction || t('offer.undefined')}</span>
                      </div>
                      {(offer.length || offer.width) && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">{language === 'ar' ? 'الأبعاد' : 'Dimensions'}</span>
                          <span className="font-semibold">{offer.length || 0} × {offer.width || 0} {t('scan.unit.meter')}</span>
                        </div>
                      )}
                      {offer.dealType && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">{language === 'ar' ? 'نوع العملية' : 'Deal type'}</span>
                          <span className="font-semibold">{offer.dealType}</span>
                        </div>
                      )}
                      {offer.mainCategory && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">{language === 'ar' ? 'التصنيف' : 'Category'}</span>
                          <span className="font-semibold">{offer.mainCategory}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {t('offer.location')}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('offer.neighborhood')}</span>
                        <span className="font-semibold">{offer.neighborhood || t('offer.undefined')}</span>
                      </div>
                      {offer.streetWidth && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('offer.streetWidth')}</span>
                          <span className="font-semibold">{offer.streetWidth} {t('scan.unit.meter')}</span>
                        </div>
                      )}
                      {offer.locationUrl && (
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-gray-500">{language === 'ar' ? 'رابط الموقع' : 'Location link'}</span>
                          <a href={offer.locationUrl} target="_blank" rel="noreferrer" className="font-semibold text-slate-700 hover:text-slate-900 underline">
                            {language === 'ar' ? 'فتح الخريطة' : 'Open map'}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <DoorOpen className="w-5 h-5" />
                      {t('offer.facilities')}
                    </h3>
                    <div className="space-y-2">
                      {offer.rooms && <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-2"><Bed className="w-4 h-4" />{t('offer.rooms')}</span><span className="font-semibold">{offer.rooms}</span></div>}
                      {offer.bathrooms && <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-2"><BathIcon className="w-4 h-4" />{t('offer.baths')}</span><span className="font-semibold">{offer.bathrooms}</span></div>}
                      {offer.livingRooms && <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-2"><Sofa className="w-4 h-4" />{t('offer.living')}</span><span className="font-semibold">{offer.livingRooms}</span></div>}
                      {offer.kitchens && <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-2"><UtensilsCrossed className="w-4 h-4" />{t('offer.kitchens')}</span><span className="font-semibold">{offer.kitchens}</span></div>}
                      {offer.floors && <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-2"><Layers className="w-4 h-4" />{t('offer.floors')}</span><span className="font-semibold">{offer.floors}</span></div>}
                      {offer.apartments && <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-2"><Building className="w-4 h-4" />{language === 'ar' ? 'عدد الشقق' : 'Apartments'}</span><span className="font-semibold">{offer.apartments}</span></div>}
                      {offer.buildingArea && <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-2"><Ruler className="w-4 h-4" />{language === 'ar' ? 'مساحة البناء' : 'Building area'}</span><span className="font-semibold">{offer.buildingArea} {t('chat.areaUnit')}</span></div>}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      {t('offer.features')}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {offer.hasElevator && <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-sm">{t('offer.elevator')}</span></div>}
                      {offer.hasGarage && <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-sm">{t('offer.garage')}</span></div>}
                      {offer.hasPool && <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-sm">{t('offer.pool')}</span></div>}
                      {offer.hasMaidRoom && <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-sm">{t('offer.maid')}</span></div>}
                      {offer.hasRoof && <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-sm">{t('offer.roof')}</span></div>}
                      {offer.hasExternalAnnex && <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-sm">{t('offer.annex')}</span></div>}
                    </div>
                    {offer.furnitureStatus && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('offer.furniture')}</span>
                          <span className="font-semibold">{offer.furnitureStatus}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'features' && (
          <Card className="border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'المزايا السريعة' : 'Quick features'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'بطاقات سريعة لأهم عناصر هذا العرض.' : 'Quick cards for the most important offer attributes.'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: t('offer.rooms'), value: offer.rooms || '-', icon: Bed },
                  { label: t('offer.baths'), value: offer.bathrooms || '-', icon: Bath },
                  { label: t('offer.living'), value: offer.livingRooms || '-', icon: Sofa },
                  { label: t('offer.kitchens'), value: offer.kitchens || '-', icon: UtensilsCrossed },
                  { label: t('offer.floors'), value: offer.floors || '-', icon: Layers },
                  { label: language === 'ar' ? 'عدد الشقق' : 'Apartments', value: offer.apartments || '-', icon: Building },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <item.icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400">{item.label}</div>
                        <div className="text-lg font-black text-slate-900">{item.value}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'media' && (
          <Card className="border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'الملفات والوسائط' : 'Media and documents'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'كل المواد المرفقة المرتبطة بهذا العرض.' : 'All attached media and documents for this listing.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {(offer.threeDVideos?.length || offer.video3d) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    {language === 'ar' ? 'فيديوهات ثلاثية الأبعاد' : '3D videos'}
                  </h3>
                  <div className="space-y-2">
                    {offer.video3d && (
                      <a href={offer.video3d} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50">
                        <span className="text-sm font-medium">3D Video</span>
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    {(offer.threeDVideos || []).map((video, index) => (
                      <a key={`${video}-${index}`} href={video} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50">
                        <span className="text-sm font-medium">{language === 'ar' ? `فيديو ${index + 1}` : `Video ${index + 1}`}</span>
                        <Download className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {offer.propertyDocuments?.length ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {language === 'ar' ? 'مستندات العقار' : 'Property documents'}
                  </h3>
                  <div className="space-y-2">
                    {offer.propertyDocuments.map((doc, index) => (
                      <a key={`${doc}-${index}`} href={doc} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50">
                        <span className="text-sm font-medium">{language === 'ar' ? `مستند ${index + 1}` : `Document ${index + 1}`}</span>
                        <Download className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              {offer.checkImage && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    {language === 'ar' ? 'صورة الشيك' : 'Check image'}
                  </h3>
                  <a href={offer.checkImage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border px-4 py-3 hover:bg-slate-50">
                    <span className="text-sm font-medium">{language === 'ar' ? 'فتح الصورة' : 'Open image'}</span>
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              )}
              {!offer.threeDVideos?.length && !offer.video3d && !offer.propertyDocuments?.length && !offer.checkImage && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">
                  {language === 'ar' ? 'لا توجد وسائط إضافية لهذا العرض حالياً.' : 'No extra media is available for this listing yet.'}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'advertiser' && (
          <div className="space-y-6">
            {renderSellerInfo()}
          </div>
        )}
      </div>
    );
  };

  const renderSellerInfo = () => {
    if (!offer?.user && !offer?.clientName && !offer?.clientPhone) return null;

    const seller = offer.user;
    const sellerName = seller
      ? `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || seller.email?.split('@')[0] || "معلن"
      : offer.clientName || (language === 'ar' ? 'المعلن' : 'Advertiser');
    const userIsSeller = isUserSeller();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('offer.advertiser')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
              {seller?.profileImage ? (
                <Image
                  src={seller.profileImage}
                  alt={sellerName}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <User className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{sellerName}</h3>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">
                  {seller?.role ? (t(`profile.role.${seller.role?.toLowerCase()}`) || seller.role) : (language === 'ar' ? 'معلن' : 'Advertiser')}
                </span>
                {seller?.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
          </div>

          {seller?.createdAt && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  {t('offer.memberSince')}: {formatDate(seller.createdAt)}
                </span>
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            {seller && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">{t('offer.status')}</span>
                <Badge variant={seller.isVerified ? "default" : "secondary"}>
                  {seller.isVerified ? t('offer.verifiedUser') : t('offer.underReview')}
                </Badge>
              </div>
            )}

            {offer.clientPhone && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="w-4 h-4" />
                <span>{offer.clientPhone}</span>
              </div>
            )}

            {seller?.role === 'AGENT' && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <ShieldCheck className="w-4 h-4" />
                <span>{t('offer.agent')}</span>
              </div>
            )}
          </div>

          {!isOwner && user && !userIsSeller && seller && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <Button 
                        variant="secondary" 
                        className="w-full"
                        onClick={() => handleInterest('visit')}
                        disabled={!!actionLoading}
                    >
                        {actionLoading === 'visit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4 ml-2" />}
                         {t('bm.offer.visitBtn')}
                    </Button>
                    <Button 
                        variant="secondary"
                        className="w-full" 
                        onClick={() => handleInterest('buy')}
                        disabled={!!actionLoading}
                    >
                         {actionLoading === 'buy' ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4 ml-2" />}
                         {offer.dealType === 'rent' ? t('offer.rentProp') : t('offer.buyProp')}
                    </Button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <div className="w-full [&>button]:w-full [&>button]:justify-center [&>button]:bg-slate-700 [&>button]:py-2.5 [&>button]:font-medium [&>button]:hover:bg-slate-800">
                    {offer.user ? (
                      <ChatButton
                        offerId={offer.id}
                        offerTitle={`${offer.propertyType} في ${offer.city}`}
                        sellerId={offer.user.id}
                        sellerName={`${offer.user.firstName || ''} ${offer.user.lastName || ''}`.trim() || offer.user.email || "المعلن"}
                        userId={user.id}
                        userName={user.name || user.username || user.email}
                      />
                    ) : (
                      <div className="rounded-lg bg-white px-4 py-3 text-center text-sm font-medium text-slate-500">
                        {language === 'ar' ? 'بيانات المعلن غير متوفرة لبدء المحادثة' : 'Advertiser data is not available for chat'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderLoadingState = () => (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Images skeleton */}
          <Skeleton className="h-[400px] w-full rounded-lg" />
          {/* Details skeleton */}
          <Skeleton className="h-64 w-full" />
        </div>

        {/* Sidebar skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center py-12">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('offer.error')}</h2>
      <p className="text-gray-600 mb-6">{error || t('offer.errorLoad')}</p>
      <div className="flex gap-3 justify-center">
        <Button onClick={fetchOfferDetails}>
          <Loader2 className="w-4 h-4 ml-2" />
          {t('offer.tryAgain')}
        </Button>
        <Button variant="outline" onClick={() => router.push('/offers')}>
          <ArrowRight className="w-4 h-4 ml-2" />
          {t('offer.backOffers')}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {renderLoadingState()}
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {renderErrorState()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <button
                  onClick={() => router.push('/offers')}
                  className="flex items-center gap-1 hover:text-gray-800 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>العروض</span>
                </button>
                <span>/</span>
                <span>تفاصيل العرض</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                {offer.propertyType} في {offer.city}
              </h1>

              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>نشر: {formatDate(offer.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{views} مشاهدة</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsShareModalOpen(true)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>مشاركة</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>خيارات العرض</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleEditOffer}>
                        <Edit className="w-4 h-4 ml-2" />
                        تعديل العرض
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDeleteOffer}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        حذف العرض
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {!isOwner && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setIsReportModalOpen(true)}
                  >
                    <Flag className="w-4 h-4" />
                    <span className="hidden sm:inline mr-2">إبلاغ</span>
                  </Button>
                )}
              </div>

              <Button
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                <span className="hidden md:inline">رجوع</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Images */}
            <Card>
              <CardHeader>
                <CardTitle>صور العقار</CardTitle>
              </CardHeader>
              <CardContent>
                {renderImages()}
              </CardContent>
            </Card>

            {/* Property Details */}
            {renderPropertyDetails()}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Seller Info */}
            {renderSellerInfo()}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>خيارات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">طلب خدمة</p>
                    <span className="text-[11px] text-gray-400">اختر الخدمة المناسبة</span>
                  </div>
                </div>

                {/* Service shortcut buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    { type: 'postPurchase', icon: <CheckCircle className="w-4 h-4" /> },
                    { type: 'legal',        icon: <ShieldCheck className="w-4 h-4" /> },
                    { type: 'construction', icon: <Building className="w-4 h-4" /> },
                    { type: 'marketing',    icon: <StarIcon className="w-4 h-4" /> },
                    { type: 'other',        icon: <MoreVertical className="w-4 h-4" />  },
                  ] as const).map((svc) => (
                    <Button
                      key={svc.type}
                      variant="outline"
                      className="h-14 w-full justify-start gap-3 rounded-2xl border-slate-200 bg-white text-sm text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus-visible:ring-2 focus-visible:ring-slate-300"
                      onClick={() => router.push(`/services/form?type=${svc.type}`)}
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        {svc.icon}
                      </span>
                      <span className="font-semibold">{t(`services.${svc.type}`)}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  نصائح للتعامل الآمن
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                  احرصوا دائماً على اتمام جميع تعاملاتكم داخل المنصة حيث أن المنصة لا تضمن أي تعاملات تتم خارجها.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
تجنب تحويل المبالغ أو الشيكات خارج الإطار المعتمد.                  </p>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>معلومات الاتصال</DialogTitle>
            <DialogDescription>
              يمكنك استخدام هذه المعلومات للاتصال بالمعلن
            </DialogDescription>
          </DialogHeader>

          {offer?.user && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold">
                    {`${offer.user.firstName || ''} ${offer.user.lastName || ''}`.trim() || offer.user.email || "المعلن"}
                  </h4>
                  <p className="text-sm text-gray-500">{t(`profile.role.${offer.user.role}`)}</p>
                </div>
              </div>

              <Separator />

              {offer.user.phone && (
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <div className="flex items-center gap-2">
                    <Input value={offer.user.phone} readOnly />
                    <Button
                      size="sm"
                      onClick={() => window.open(`tel:${offer.user?.phone}`)}
                    >
                      <Phone className="w-4 h-4 ml-2" />
                      اتصل الآن
                    </Button>
                  </div>
                </div>
              )}

              {offer.user.email && (
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <div className="flex items-center gap-2">
                    <Input value={offer.user.email} readOnly />
                    <Button
                      size="sm"
                      onClick={() => window.open(`mailto:${offer.user?.email}`)}
                    >
                      <Mail className="w-4 h-4 ml-2" />
                      إرسال بريد
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsContactModalOpen(false)}>
              تم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مشاركة العرض</DialogTitle>
            <DialogDescription>
              شارك هذا العرض مع الآخرين
            </DialogDescription>
          </DialogHeader>

 

          <Separator />

          <div className="space-y-2">
            <Label>رابط العرض</Label>
            <div className="flex gap-2">
              <Input
                value={typeof window !== 'undefined' ? window.location.href : ''}
                readOnly
              />
              <Button
                variant="outline"
                onClick={() => handleShare('copy')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">إغلاق</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>الإبلاغ عن مخالفة</DialogTitle>
            <DialogDescription>
              الرجاء تحديد سبب الإبلاغ عن هذا العرض
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>سبب الإبلاغ</Label>
              <Select onValueChange={setReportReason} value={reportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر سبب الإبلاغ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">إعلان مكرر أو بريد عشوائي</SelectItem>
                  <SelectItem value="fake">معلومات غير صحيحة</SelectItem>
                  <SelectItem value="fraud">احتيال أو محاولة نصب</SelectItem>
                  <SelectItem value="offensive">محتوى مسيء أو غير لائق</SelectItem>
                  <SelectItem value="wrong_category">تصنيف خاطئ</SelectItem>
                  <SelectItem value="other">سبب آخر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportReason === 'other' && (
              <div className="space-y-2">
                <Label>الرجاء توضيح السبب</Label>
                <Textarea
                  placeholder="اذكر سبب الإبلاغ بالتفصيل..."
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
            >
              إلغاء
            </Button>
            <Button
              onClick={handleReportOffer}
              disabled={!reportReason.trim() || reportLoading}
            >
              {reportLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                'إرسال البلاغ'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

      <VisitRequestModal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        onSubmit={handleVisitSubmit}
        loading={actionLoading === 'visit'}
      />

      {offer && (
        <PurchaseModal
            isOpen={isPurchaseModalOpen}
            onClose={() => setIsPurchaseModalOpen(false)}
            onConfirm={handlePurchaseSubmit}
            loading={actionLoading === 'buy'}
            propertyTitle={`${offer.propertyType} ${t('cards.ops.sale2024')} ${offer.city}`}
            price={`${offer.price.toLocaleString()} ${t('currency')}`}
        />
      )}
    </div>
  );
}
