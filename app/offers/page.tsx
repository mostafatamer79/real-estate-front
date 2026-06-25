"use client";
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { TableOfContents, MessageCircle, Ruler, DollarSign, MapPin, Calendar, Layers, CheckCircle, AlertCircle, ArrowRight, LayoutGrid, User as UserIcon, SaudiRiyalIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { offersApi, bookingsApi } from "@/lib/api";
import { Offer as ApiOffer, Booking } from "@/types/api";
import { User } from "@/types/user";
import ChatButton from "@/components/chat/chat-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OfferAppointmentsModal from "@/components/modals/offer-appointments-modal";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";

interface Offer {
  id: string;
  propertyType: string;
  city: string;
  address: string;
  description: string;
  area: number;
  price: number;
  timeAgo: string;
  neighborhood?: string;
  propertyAge?: string;
  direction?: string;
  propertyCondition?: string;
  rooms?: number;
  bathrooms?: number;
  livingRooms?: number;
  floors?: number;
  hasGarage?: boolean;
  hasElevator?: boolean;
  hasPool?: boolean;
  furnitureStatus?: string;
  userId?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

interface ApiOfferWithUser extends ApiOffer {
  userId?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

const residentialSubtypes = [
  { value: "أرض سكنية", label: "property.type.land" },
  { value: "فيلا", label: "property.type.villa" },
  { value: "قصر", label: "property.type.palace" },
  { value: "شقة", label: "property.type.apartment" },
  { value: "بيت شعبي", label: "property.type.publicHouse" }
];

const commercialSubtypes = [
  { value: "محل تجاري", label: "property.type.shop" },
  { value: "مكتب", label: "property.type.office" },
  { value: "فندق", label: "property.type.hotel" },
  { value: "برج", label: "property.type.tower" },
  { value: "مصنع", label: "property.type.factory" },
  { value: "مستودع", label: "property.type.warehouse" }
];

export default function OffersPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { isOpen, message, isAdmin: isAdminUser } = useSectionGuard('offers');



  // Core State
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [openChatOfferId, setOpenChatOfferId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "my" | "appointments">("all");

  // Dept/Access State
  const [isDeptUser, setIsDeptUser] = useState(false);
  const [deptName, setDeptName] = useState('');

  const DEPT_NAMES: Record<string, string> = {
    marketing: 'إدارة التسويق',
    properties: 'إدارة الاملاك',
    finance: 'الإدارة المالية',
    legal: 'الإدارة القانونية',
    employees: 'إدارة الموظفين',
  };

  // Filter State
  const [propertyType, setPropertyType] = useState<"residential" | "commercial" | null>(null);
  const [subtype, setSubtype] = useState<string | null>(null);
  const [areaFrom, setAreaFrom] = useState<string>("");
  const [areaTo, setAreaTo] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [neighborhood, setNeighborhood] = useState<string>("");
  const [priceFrom, setPriceFrom] = useState<string>("");
  const [priceTo, setPriceTo] = useState<string>("");

  const [propertyAge, setPropertyAge] = useState<string>("");
  const [direction, setDirection] = useState<string>("");
  const [propertyCondition, setPropertyCondition] = useState<string>("");
  const [furnitureStatus, setFurnitureStatus] = useState<string>("");
  const [rooms, setRooms] = useState<string>("");
  const [bathrooms, setBathrooms] = useState<string>("");
  const [hasGarage, setHasGarage] = useState<string>("");
  const [hasElevator, setHasElevator] = useState<string>("");
  const [hasPool, setHasPool] = useState<string>("");

  // Modal & Bookings State
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [selectedOfferTitle, setSelectedOfferTitle] = useState<string>("");
  const [isAppointmentsModalOpen, setIsAppointmentsModalOpen] = useState(false);
  const [incomingBookings, setIncomingBookings] = useState<Booking[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Constants
  const propertyAges = [
    { value: "أقل من سنة", label: "property.age.less1" },
    { value: "1-5 سنوات", label: "property.age.1to5" },
    { value: "6-10 سنوات", label: "property.age.6to10" },
    { value: "أكثر من 10 سنوات", label: "property.age.more10" }
  ];

  const directions = [
    { value: "شمال", label: "property.direction.north" },
    { value: "جنوب", label: "property.direction.south" },
    { value: "شرق", label: "property.direction.east" },
    { value: "غرب", label: "property.direction.west" }
  ];

  const propertyConditions = [
    { value: "جديد", label: "property.condition.new" },
    { value: "مستعمل", label: "property.condition.used" },
    { value: "مجدد", label: "property.condition.renovated" }
  ];

  const furnitureOptions = [
    { value: "مفروش", label: "property.furniture.furnished" },
    { value: "غير مفروش", label: "property.furniture.unfurnished" }
  ];

  const yesNoOptions = [
    { value: "yes", label: "common.yes" },
    { value: "no", label: "common.no" }
  ];

  // Logic Helpers
  const canCreateOffers = ['agent', 'broker', 'real_estate_office', 'owner', 'marketing', 'marketing_admin', 'admin']
    .includes(String(user?.role || '').toLowerCase());

  const generateTimeAgo = (createdAt: string): string => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return t('property.age.new');
    if (diffInMinutes < 60) return `${diffInMinutes} ${language === 'ar' ? 'دقيقة' : 'min'}`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ${language === 'ar' ? 'ساعة' : 'hr'}`;
    return `${Math.floor(diffInMinutes / 1440)} ${language === 'ar' ? 'يوم' : 'day'}`;
  };

  const generateDescription = (offer: ApiOffer): string => {
    const findTypeLabel = (val: string) => {
      const all = [...residentialSubtypes, ...commercialSubtypes];
      const found = all.find(i => i.value === val);
      return found ? t(found.label) : val;
    };

    const findConditionLabel = (val: string) => {
      const found = propertyConditions.find(i => i.value === val);
      return found ? t(found.label) : val;
    };

    let description = `${findTypeLabel(offer.propertyType)} ${offer.propertyCondition ? findConditionLabel(offer.propertyCondition) + ' ' : ''}`;
    if (offer.rooms) description += `، ${t('offers.filter.rooms')}: ${offer.rooms}`;
    if (offer.bathrooms) description += `، ${t('offers.filter.baths')}: ${offer.bathrooms}`;
    if (offer.livingRooms) description += `، ${t('offer.living')}: ${offer.livingRooms}`;
    description += `. ${t('offer.area')} ${offer.area} ${t('offers.filter.area').split(' ')[1] || 'm²'}`;
    if (offer.neighborhood) description += ` ${language === 'ar' ? '، حي' : ', '} ${offer.neighborhood}`;
    if (offer.city) description += `، ${offer.city}`;
    if (offer.hasElevator) description += `، ${t('offer.elevator')}`;
    if (offer.hasGarage) description += `، ${t('offer.garage')}`;
    if (offer.hasPool) description += `، ${t('offer.pool')}`;

    if (offer.additionalNotes) {
      const shortNotes = offer.additionalNotes.length > 100
        ? offer.additionalNotes.substring(0, 100) + '...'
        : offer.additionalNotes;
      description += `. ${shortNotes}`;
    }
    return description;
  };
const MeterIcon = ({ className }: { className?: string }) => (
  <img src="/icons/meter.svg" alt="meter" className={className} style={{ width: '5em', height: '5em', opacity: 1 }} />
);
  const fetchIncomingBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await bookingsApi.findIncoming();
      setIncomingBookings(res.data);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setIncomingBookings([]);
        return;
      }
      console.error("Failed to fetch incoming bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await bookingsApi.findAll();
      setMyBookings(res.data);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setMyBookings([]);
        return;
      }
      console.error("Failed to fetch my bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await offersApi.findAll();
      const apiOffers = response.data;
      if (apiOffers.length === 0) {
        setOffers([]);
        setFilteredOffers([]);
        return;
      }
      const transformedOffers: Offer[] = apiOffers.map((rawOffer: ApiOffer) => {
        const offer = rawOffer as ApiOfferWithUser;
        return {
          id: offer.id,
          propertyType: offer.propertyType,
          city: offer.city,
          address: `${offer.propertyType} - ${offer.city}${offer.neighborhood ? ` - ${offer.neighborhood}` : ''}`,
          description: generateDescription(offer),
          area: offer.area,
          price: offer.price,
          timeAgo: generateTimeAgo(offer.createdAt),
          neighborhood: offer.neighborhood,
          propertyAge: offer.propertyAge,
          direction: offer.direction,
          propertyCondition: offer.propertyCondition,
          rooms: offer.rooms,
          bathrooms: offer.bathrooms,
          livingRooms: offer.livingRooms,
          floors: offer.floors,
          hasGarage: offer.hasGarage,
          hasElevator: offer.hasElevator,
          hasPool: offer.hasPool,
          furnitureStatus: offer.furnitureStatus,
          userId: offer.userId,
          user: offer.user,
        };
      });
      setOffers(transformedOffers);
      setFilteredOffers(transformedOffers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      setError(t('offers.error'));
      setOffers([]);
      setFilteredOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...offers];
    if (propertyType === "residential") {
      result = result.filter(offer => residentialSubtypes.map(s => s.value).includes(offer.propertyType));
    } else if (propertyType === "commercial") {
      result = result.filter(offer => commercialSubtypes.map(s => s.value).includes(offer.propertyType));
    }
    if (subtype) result = result.filter(offer => offer.propertyType === subtype);
    if (areaFrom) result = result.filter(offer => offer.area >= parseFloat(areaFrom));
    if (areaTo) result = result.filter(offer => offer.area <= parseFloat(areaTo));
    if (city) result = result.filter(offer => offer.city.toLowerCase().includes(city.toLowerCase()));
    if (neighborhood) result = result.filter(offer => offer.neighborhood?.toLowerCase().includes(neighborhood.toLowerCase()));
    if (priceFrom) result = result.filter(offer => offer.price >= parseFloat(priceFrom));
    if (priceTo) result = result.filter(offer => offer.price <= parseFloat(priceTo));
    if (propertyAge) result = result.filter(offer => offer.propertyAge === propertyAge);
    if (direction) result = result.filter(offer => offer.direction === direction);
    if (propertyCondition) result = result.filter(offer => offer.propertyCondition === propertyCondition);
    if (furnitureStatus) result = result.filter(offer => offer.furnitureStatus === furnitureStatus);
    if (rooms) result = result.filter(offer => offer.rooms && offer.rooms >= parseInt(rooms));
    if (bathrooms) result = result.filter(offer => offer.bathrooms && offer.bathrooms >= parseInt(bathrooms));
    if (hasGarage === "yes") result = result.filter(offer => offer.hasGarage === true);
    else if (hasGarage === "no") result = result.filter(offer => offer.hasGarage === false);
    if (hasElevator === "yes") result = result.filter(offer => offer.hasElevator === true);
    else if (hasElevator === "no") result = result.filter(offer => offer.hasElevator === false);
    if (hasPool === "yes") result = result.filter(offer => offer.hasPool === true);
    else if (hasPool === "no") result = result.filter(offer => offer.hasPool === false);

    if (activeTab === "my" && user?.id) {
      result = result.filter((offer) => offer.userId === user.id || offer.user?.id === user.id);
    } else if (activeTab === "appointments" && user?.id) {
      const incomingOfferIds = new Set(incomingBookings.map(b => b.offerId));
      const myBookingOfferIds = new Set(myBookings.map(b => b.offerId));
      result = result.filter((offer) => incomingOfferIds.has(offer.id) || myBookingOfferIds.has(offer.id));
    }
    setFilteredOffers(result);
  };

  const handlePropertySelect = (type: "residential" | "commercial") => {
    setPropertyType(type);
    setSubtype(null);
  };

  const handleSubtypeSelect = (sub: string) => {
    setSubtype(sub);
  };

  const resetFilters = () => {
    setPropertyType(null);
    setSubtype(null);
    setAreaFrom(""); setAreaTo("");
    setCity(""); setNeighborhood("");
    setPriceFrom(""); setPriceTo("");
    setPropertyAge(""); setDirection("");
    setPropertyCondition(""); setFurnitureStatus("");
    setRooms(""); setBathrooms("");
    setHasGarage(""); setHasElevator(""); setHasPool("");
  };

  // Effects
  useEffect(() => {
    const init = () => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          if (parsed?.department) {
            setIsDeptUser(true);
            setDeptName(DEPT_NAMES[parsed.department] ?? parsed.department);
          }
        }
      } catch (err) { console.error(err); }
    };
    init();
    fetchOffers();
    fetchIncomingBookings();
    fetchMyBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    offers, propertyType, subtype, areaFrom, areaTo, city, neighborhood,
    priceFrom, priceTo, propertyAge, direction, propertyCondition,
    furnitureStatus, rooms, bathrooms, hasGarage, hasElevator, hasPool, activeTab, user?.id, incomingBookings, myBookings
  ]);

  // Early Returns
  if (!isOpen) {
    return <ComingSoonOverlay sectionName={t('action.offers') || 'العروض'} message={message} isAdmin={isAdminUser} />;
  }


  // Final Render
  return (
    <section className="w-full min-h-screen bg-slate-50 flex" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar - Adjusted for fixed header */}
      <div className="fixed top-16 right-0 h-[calc(100vh-64px)] w-80 bg-white border-l border-gray-200 shadow-lg overflow-y-auto">
        <div className="p-6">
          <div className="my-4 space-y-4">
            <button onClick={() => router.push('/details')} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors bg-slate-50 px-3 py-2 rounded-lg w-full">
              <ArrowRight className={`w-5 h-5 transform ${language === 'en' ? 'rotate-180' : ''}`} />
              <span className="font-medium">{t('chat.back')}</span>
            </button>
            <div className="flex items-center gap-2">
              <TableOfContents className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-700">{t('offers.title')}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('offers.filter.type')}</h3>
              <div className="flex gap-3">
                <button onClick={() => handlePropertySelect("residential")} className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${propertyType === "residential" ? "bg-slate-700 text-white" : "bg-slate-100 text-gray-700 hover:bg-slate-200"}`}>{t('offers.filter.residential')}</button>
                <button onClick={() => handlePropertySelect("commercial")} className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${propertyType === "commercial" ? "bg-slate-700 text-white" : "bg-slate-100 text-gray-700 hover:bg-slate-200"}`}>{t('offers.filter.commercial')}</button>
              </div>
            </div>

            {propertyType && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('offers.filter.subtype')}</h3>
                <div className="grid grid-cols-1 gap-2">
                  {(propertyType === "residential" ? residentialSubtypes : commercialSubtypes).map((sub) => (
                    <button key={sub.value} onClick={() => handleSubtypeSelect(sub.value)} className={`px-4 py-2 rounded-lg text-right font-medium transition-colors ${subtype === sub.value ? "bg-slate-700 text-white" : "bg-slate-100 text-gray-700 hover:bg-slate-200"}`}>{t(sub.label)}</button>
                  ))}
                </div>
              </div>
            )}

            <div><h3 className="text-sm font-semibold text-gray-700  flex items-center "><MeterIcon className="w-4 h-4" />{t('offers.filter.area')}</h3>
              <div className="flex gap-2">
                <Input type="number" placeholder={language === 'ar' ? 'من' : 'From'} value={areaFrom} onChange={(e) => setAreaFrom(e.target.value)} />
                <Input type="number" placeholder={language === 'ar' ? 'إلى' : 'To'} value={areaTo} onChange={(e) => setAreaTo(e.target.value)} />
              </div>
            </div>

            <div><h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><SaudiRiyalIcon className="w-4 h-4" />{t('offers.filter.price')}</h3>
              <div className="flex gap-2">
                <Input type="number" placeholder={language === 'ar' ? 'من' : 'From'} value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} />
                <Input type="number" placeholder={language === 'ar' ? 'إلى' : 'To'} value={priceTo} onChange={(e) => setPriceTo(e.target.value)} />
              </div>
            </div>

            <div><h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" />المدينة</h3>
              <Input type="text" placeholder="اكتب اسم المدينة" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>

            <div><h3 className="text-sm font-semibold text-gray-700 mb-3">الحي</h3>
              <Input type="text" placeholder="اكتب اسم الحي" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
            </div>

            <div><h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" />{t('orders.age')}</h3>
              <select value={propertyAge} onChange={(e) => setPropertyAge(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white text-right">
                <option value="">{t('common.select')}</option>
                {propertyAges.map(item => <option key={item.value} value={item.value}>{t(item.label)}</option>)}
              </select>
            </div>

            <div><h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Layers className="w-4 h-4" />{t('offers.filter.direction')}</h3>
              <select value={direction} onChange={(e) => setDirection(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white text-right">
                <option value="">{t('common.select')}</option>
                {directions.map(item => <option key={item.value} value={item.value}>{t(item.label)}</option>)}
              </select>
            </div>

            <div className="pt-4"><button onClick={resetFilters} className="w-full px-4 py-2 bg-slate-200 text-gray-700 rounded-lg hover:bg-slate-300 transition-colors font-medium">إعادة تعيين الفلاتر</button></div>
          </div>
        </div>
      </div>

      <div className="flex-1 mr-80">
        {loading && <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div></div>}
        {error && !loading && <div className="flex items-center justify-center h-screen text-center"><AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-700 mb-2">حدث خطأ</h3><p className="text-gray-500 mb-4">{error}</p><button onClick={fetchOffers} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800">محاولة مرة أخرى</button></div>}
        
        {!loading && !error && (
          <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {user?.id && (
                <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full md:w-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <TabsList className="grid w-full grid-cols-2 lg:w-[450px]">
                    <TabsTrigger value="all" className="flex items-center gap-2"><LayoutGrid className="w-4 h-4" />{t('offers.allOffers')}</TabsTrigger>
                    <TabsTrigger value="appointments" className="flex items-center gap-2"><Calendar className="w-4 h-4" />{language === 'ar' ? 'مواعيدي' : 'My Appointments'}</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>

            {activeTab === "appointments" && user?.id && (incomingBookings.length > 0 || myBookings.length > 0) && (
              <div className="mb-10 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Calendar className="w-5 h-5 text-blue-600" /></div><div><h3 className="font-bold text-slate-900">{language === 'ar' ? 'المواعيد القادمة' : 'Upcoming Appointments'}</h3><p className="text-xs text-slate-500">{language === 'ar' ? `لديك ${incomingBookings.length + myBookings.length} موعد` : `You have ${incomingBookings.length + myBookings.length} appointments`}</p></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...incomingBookings, ...myBookings].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0,3).map((booking) => {
                    const isIncoming = incomingBookings.some(ib => ib.id === booking.id);
                    return (
                      <div key={booking.id} className="p-4 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-white transition-colors group relative">
                        <div className="flex justify-between items-start mb-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{booking.status}</span><div className="flex flex-col items-end"><span className="text-[10px] text-slate-400 font-medium">{new Date(booking.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</span><span className={`text-[9px] font-bold ${isIncoming ? 'text-blue-500' : 'text-emerald-500'}`}>{isIncoming ? (language === 'ar' ? 'طلب مستلم' : 'Received') : (language === 'ar' ? 'طلبك' : 'Your Request')}</span></div></div>
                        <p className="text-sm font-bold text-slate-900 mb-1 truncate">{booking.offer ? (language === 'ar' ? `${booking.offer.propertyType} في ${booking.offer.city}` : `${booking.offer.propertyType} in ${booking.offer.city}`) : (language === 'ar' ? 'عقار' : 'Property')}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500"><UserIcon className="w-3 h-3" /><span>{isIncoming ? (booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : 'User') : ((booking.offer as any)?.user ? `${(booking.offer as any).user.firstName} ${(booking.offer as any).user.lastName}` : (language === 'ar' ? 'المالك' : 'Owner'))}</span></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-6"><p className="text-gray-600">{t('offers.results').replace('{count}', filteredOffers.length.toString())}</p></div>
            <div className="space-y-4">
              {filteredOffers.length > 0 ? filteredOffers.map((offer) => {
                const sellerName = offer.user ? `${offer.user.firstName || ''} ${offer.user.lastName || ''}`.trim() : t('offers.owner');
                return (
                  <div key={offer.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">{offer.address}</h2>
                    <div className="flex items-center gap-2 mb-3 text-sm"><span className="font-semibold text-gray-700">{sellerName}</span><span className="text-gray-400 mr-auto">•</span><span className="text-gray-500">{offer.timeAgo}</span></div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{offer.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-100 pt-4">
                      <div className="flex items-center gap-4"><div className="flex items-center"><MeterIcon className="w-4 h-4 text-gray-500" /><span>{offer.area} م²</span></div><span>•</span><div className="flex items-center gap-1"><SaudiRiyalIcon className="w-4 h-4 text-gray-500" /><span className="font-semibold text-gray-800"><SaudiRiyalAmount amount={offer.price} locale={language === 'ar' ? 'ar-SA' : 'en-US'} /></span></div></div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => window.location.href = `/offers/${offer.id}`} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-slate-50 transition-colors text-sm">{t('offers.details')}</button>
                        {(user?.id === offer.userId || user?.id === offer.user?.id) && (<button onClick={() => { setSelectedOfferId(offer.id); setSelectedOfferTitle(offer.address); setIsAppointmentsModalOpen(true); }} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">{language === 'ar' ? 'عرض المواعيد' : 'View Appointments'}</button>)}
                        {user && offer.userId && offer.user && (<ChatButton offerId={offer.id} offerTitle={`${offer.propertyType} في ${offer.city}`} sellerId={offer.userId} sellerName={offer.user ? `${offer.user.firstName} ${offer.user.lastName}` : 'المعلن'} userId={user.id} userName={user.firstName || ''} />)}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
                  <TableOfContents className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{activeTab === 'appointments' ? (language === 'ar' ? 'لا توجد مواعيد' : 'No appointments found') : (language === 'ar' ? 'لا توجد عروض' : 'No offers found')}</h3>
                  <p className="text-gray-500 mb-6">{activeTab === 'appointments' ? (language === 'ar' ? 'لم يتم العثور على أي مواعيد قادمة' : 'No upcoming appointments found') : (offers.length === 0 ? (language === 'ar' ? 'لا يوجد عروض متاحة حالياً' : 'No offers available at the moment') : (language === 'ar' ? 'لم يتم العثور على عروض تطابق معايير البحث' : 'No offers match your search criteria'))}</p>
                </div>
              )}
            </div>
          </main>
        )}
      </div>
      <OfferAppointmentsModal isOpen={isAppointmentsModalOpen} onClose={() => setIsAppointmentsModalOpen(false)} offerId={selectedOfferId} propertyTitle={selectedOfferTitle} />
    </section>
  );
}
