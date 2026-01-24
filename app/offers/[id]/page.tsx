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
import { offersApi } from "@/lib/api";
import { Offer as ApiOffer } from "@/types/api";
import { chatApi } from "@/lib/chat";
import ChatButton from "@/components/chat/chat-button";
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
  mediaFiles?: string[];
  propertyDocuments?: string[];
  threeDVideos?: string[];
  checkImage?: string;
}

export default function OfferDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;
  const { toast } = useToast();

  const [offer, setOffer] = useState<ExtendedOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [views, setViews] = useState(0);
  const [isOwner, setIsOwner] = useState(false);

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

  const handleReportOffer = async () => {
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "يجب تسجيل الدخول للإبلاغ عن مخالفة",
        variant: "destructive",
      });
      router.push("/auth/login");
      return;
    }

    if (!reportReason.trim()) {
      toast({
        title: "الرجاء إدخال سبب البلاغ",
        variant: "destructive",
      });
      return;
    }

    try {
      setReportLoading(true);
      // Here you would call your API to report the offer
      // await reportOffer(offerId, reportReason);

      toast({
        title: "تم الإبلاغ عن العرض",
        description: "شكراً لإبلاغك، سيقوم فريقنا بمراجعة البلاغ",
      });

      setReportReason("");
      setIsReportModalOpen(false);
    } catch (error) {
      console.error("Error reporting offer:", error);
      toast({
        title: "حدث خطأ",
        description: "فشل في الإبلاغ عن العرض",
        variant: "destructive",
      });
    } finally {
      setReportLoading(false);
    }
  };

  const handleShare = async (platform?: string) => {
    const shareUrl = window.location.href;
    const shareTitle = offer ? `${offer.propertyType} للبيع في ${offer.city}` : "عرض عقاري";

    const shareData = {
      title: shareTitle,
      text: offer?.additionalNotes || "عرض عقاري متميز",
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
          title: "تم النسخ",
          description: "تم نسخ رابط العرض إلى الحافظة",
        });
      } else if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "تم النسخ",
          description: "تم نسخ رابط العرض إلى الحافظة",
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
        title: "تم الحذف",
        description: "تم حذف العرض بنجاح",
      });

      router.push("/offers");
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast({
        title: "حدث خطأ",
        description: "فشل في حذف العرض",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
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
      case 'جديد':
        return 'bg-green-100 text-green-800';
      case 'مستعمل':
        return 'bg-blue-100 text-blue-800';
      case 'تحت الإنشاء':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderImages = () => {
    const images = offer?.mediaFiles || [];

    if (images.length === 0) {
      return (
        <div className="relative w-full h-[400px] bg-gray-100 rounded-lg flex flex-col items-center justify-center">
          <Camera className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-500">لا توجد صور متاحة</p>
        </div>
      );
    }

    const currentImage = images[currentImageIndex];

    return (
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={currentImage}
            alt={`صورة العقار ${currentImageIndex + 1}`}
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
                  alt={`صورة مصغرة ${index + 1}`}
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

    return (
      <div className="space-y-6">
        {/* Project Name/Title */}
        <Card>
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
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-lg font-bold text-gray-800">
                    {formatPrice(offer.price)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">السعر</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Ruler className="w-5 h-5 text-blue-600" />
                  <span className="text-lg font-bold text-gray-800">
                    {offer.area} م²
                  </span>
                </div>
                <p className="text-sm text-gray-600">المساحة</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Building className="w-5 h-5 text-purple-600" />
                  <span className="text-lg font-bold text-gray-800">
                    {offer.propertyType}
                  </span>
                </div>
                <p className="text-sm text-gray-600">نوع العقار</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <span className="text-lg font-bold text-gray-800">
                    {offer.city}
                  </span>
                </div>
                <p className="text-sm text-gray-600">المدينة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Information */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل العقار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    معلومات أساسية
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">حالة العقار</span>
                      <Badge className={getConditionColor(offer.propertyCondition || "")}>
                        {offer.propertyCondition || "غير محدد"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">عمر العقار</span>
                      <span className="font-semibold">{offer.propertyAge || "غير محدد"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">نوع الصك</span>
                      <span className="font-semibold">{offer.deedType || "غير محدد"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">اتجاه الواجهة</span>
                      <span className="font-semibold">{offer.direction || "غير محدد"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    الموقع
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">الحي</span>
                      <span className="font-semibold">{offer.neighborhood || "غير محدد"}</span>
                    </div>
                    {offer.streetWidth && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">عرض الشارع</span>
                        <span className="font-semibold">{offer.streetWidth} متر</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <DoorOpen className="w-5 h-5" />
                    الغرف والمرافق
                  </h3>
                  <div className="space-y-2">
                    {offer.rooms && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 flex items-center gap-2">
                          <Bed className="w-4 h-4" />
                          عدد الغرف
                        </span>
                        <span className="font-semibold">{offer.rooms}</span>
                      </div>
                    )}
                    {offer.bathrooms && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 flex items-center gap-2">
                          <BathIcon className="w-4 h-4" />
                          عدد الحمامات
                        </span>
                        <span className="font-semibold">{offer.bathrooms}</span>
                      </div>
                    )}
                    {offer.livingRooms && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 flex items-center gap-2">
                          <Sofa className="w-4 h-4" />
                          الصالات
                        </span>
                        <span className="font-semibold">{offer.livingRooms}</span>
                      </div>
                    )}
                    {offer.kitchens && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 flex items-center gap-2">
                          <UtensilsCrossed className="w-4 h-4" />
                          المطابخ
                        </span>
                        <span className="font-semibold">{offer.kitchens}</span>
                      </div>
                    )}
                    {offer.floors && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          عدد الأدوار
                        </span>
                        <span className="font-semibold">{offer.floors}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    المميزات
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {offer.hasElevator && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">مصعد</span>
                      </div>
                    )}
                    {offer.hasGarage && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">كراج</span>
                      </div>
                    )}
                    {offer.hasPool && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">مسبح</span>
                      </div>
                    )}
                    {offer.hasMaidRoom && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">غرفة خادمة</span>
                      </div>
                    )}
                    {offer.hasRoof && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">سطح</span>
                      </div>
                    )}
                    {offer.hasExternalAnnex && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">ملحق خارجي</span>
                      </div>
                    )}
                  </div>
                  {offer.furnitureStatus && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between">
                        <span className="text-gray-500">حالة الأثاث</span>
                        <span className="font-semibold">{offer.furnitureStatus}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSellerInfo = () => {
    if (!offer?.user) return null;

    const seller = offer.user;
    const sellerName = `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || seller.email?.split('@')[0] || "معلن";
    const userIsSeller = isUserSeller();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            معلومات المعلن
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              {seller.profileImage ? (
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
                <span className="text-gray-600 text-sm">{seller.role}</span>
                {seller.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                عضو منذ: {formatDate(seller.createdAt)}
              </span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">الحالة:</span>
              <Badge variant={seller.isVerified ? "default" : "secondary"}>
                {seller.isVerified ? "مستخدم موثوق" : "تحت المراجعة"}
              </Badge>
            </div>

            {seller.role === 'AGENT' && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <ShieldCheck className="w-4 h-4" />
                <span>وسيط عقاري مرخص</span>
              </div>
            )}
          </div>

          {!isOwner && user && !userIsSeller && (
            <>
              <Separator />
              <div className="space-y-2">
                <Button
                  onClick={() => setIsContactModalOpen(true)}
                  className="w-full"
                  variant="outline"
                >
                  <Phone className="w-4 h-4 ml-2" />
                  عرض رقم الهاتف
                </Button>

                {/* Only show chat button if user is not the seller */}
                {!userIsSeller && (
                  <ChatButton
                    offerId={offer.id}
                    offerTitle={`${offer.propertyType} في ${offer.city}`}
                    sellerId={offer.user.id}
                    sellerName={sellerName}
                    userId={user.id}
                    userName={user.name || user.username || user.email}
                  />
                )}
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
      <h2 className="text-2xl font-bold text-gray-800 mb-2">حدث خطأ</h2>
      <p className="text-gray-600 mb-6">{error}</p>
      <div className="flex gap-3 justify-center">
        <Button onClick={fetchOfferDetails}>
          <Loader2 className="w-4 h-4 ml-2" />
          المحاولة مرة أخرى
        </Button>
        <Button variant="outline" onClick={() => router.push('/offers')}>
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة إلى العروض
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {renderLoadingState()}
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {renderErrorState()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6" dir="rtl">
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
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setIsContactModalOpen(true)}
                >
                  <Phone className="w-4 h-4 ml-2" />
                  الاتصال بالمعلن
                </Button>

                {user && offer.user && (
                  <ChatButton
                    offerId={offer.id}
                    offerTitle={`${offer.propertyType} في ${offer.city}`}
                    sellerId={offer.user.id}
                    sellerName={`${offer.user.firstName || ''} ${offer.user.lastName || ''}`.trim() || offer.user.email || "المعلن"}
                    userId={user.id}
                    userName={user.name || user.username || user.email}
                  />
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsShareModalOpen(true)}
                >
                  <Share2 className="w-4 h-4 ml-2" />
                  مشاركة العرض
                </Button>
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
                    قم بمقابلة المعلن في مكان عام
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    تحقق من صحة الوثائق والمستندات
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    لا تدفع أي مبالغ قبل الرؤية والتأكد
                  </p>
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
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold">
                    {`${offer.user.firstName || ''} ${offer.user.lastName || ''}`.trim() || offer.user.email || "المعلن"}
                  </h4>
                  <p className="text-sm text-gray-500">{offer.user.role}</p>
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
              شارك هذا العرض مع الآخرين عبر المنصات المختلفة
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="flex flex-col h-auto py-4"
              onClick={() => handleShare('whatsapp')}
            >
              <PhoneCall className="w-6 h-6 text-green-600 mb-2" />
              <span>واتساب</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col h-auto py-4"
              onClick={() => handleShare('facebook')}
            >
              <Facebook className="w-6 h-6 text-blue-600 mb-2" />
              <span>فيسبوك</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col h-auto py-4"
              onClick={() => handleShare('twitter')}
            >
              <Twitter className="w-6 h-6 text-blue-400 mb-2" />
              <span>تويتر</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col h-auto py-4"
              onClick={() => handleShare('copy')}
            >
              <Copy className="w-6 h-6 text-gray-600 mb-2" />
              <span>نسخ الرابط</span>
            </Button>
          </div>

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
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
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
    </div>
  );
}