"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { TableOfContents, MessageCircle, Ruler, DollarSign, MapPin, Calendar, Layers, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { offersApi } from "@/lib/api";
import { Offer as ApiOffer } from "@/types/api";
import ChatButton from "@/components/chat/chat-button";


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
const residentialSubtypes = [
  "أرض سكنية",
  "فيلا",
  "قصر",
  "شقة",
  "بيت شعبي"
];

const commercialSubtypes = [
  "محل تجاري",
  "مكتب",
  "فندق",
  "برج",
  "مصنع",
  "مستودع"
];

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [openChatOfferId, setOpenChatOfferId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Filter state
  const [propertyType, setPropertyType] = useState<"residential" | "commercial" | null>(null);
  const [subtype, setSubtype] = useState<string | null>(null);
  const [areaFrom, setAreaFrom] = useState<string>("");
  const [areaTo, setAreaTo] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [neighborhood, setNeighborhood] = useState<string>("");
  const [priceFrom, setPriceFrom] = useState<string>("");
  const [priceTo, setPriceTo] = useState<string>("");

  // فلاتر إضافية
  const [propertyAge, setPropertyAge] = useState<string>("");
  const [direction, setDirection] = useState<string>("");
  const [propertyCondition, setPropertyCondition] = useState<string>("");
  const [furnitureStatus, setFurnitureStatus] = useState<string>("");
  const [rooms, setRooms] = useState<string>("");
  const [bathrooms, setBathrooms] = useState<string>("");
  const [hasGarage, setHasGarage] = useState<string>("");
  const [hasElevator, setHasElevator] = useState<string>("");
  const [hasPool, setHasPool] = useState<string>("");

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
    fetchOffers();
  }, []);

  // Apply filters whenever filter state changes
  useEffect(() => {
    applyFilters();
  }, [
    offers, propertyType, subtype, areaFrom, areaTo, city, neighborhood,
    priceFrom, priceTo, propertyAge, direction, propertyCondition,
    furnitureStatus, rooms, bathrooms, hasGarage, hasElevator, hasPool
  ]);

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

      // Transform API offers to frontend format
      const transformedOffers: Offer[] = apiOffers.map((offer: ApiOffer) => {
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
          userId: (offer as any).userId,
          user: (offer as any).user,
        };
      });

      setOffers(transformedOffers);
      setFilteredOffers(transformedOffers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      setError("حدث خطأ في تحميل العروض. الرجاء المحاولة مرة أخرى.");
      setOffers([]);
      setFilteredOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const generateDescription = (offer: ApiOffer): string => {
    let description = `${offer.propertyType} ${offer.propertyCondition ? offer.propertyCondition + ' ' : ''}`;

    if (offer.rooms) description += `، تتكون من ${offer.rooms} غرف`;
    if (offer.bathrooms) description += ` و ${offer.bathrooms} دورات مياه`;
    if (offer.livingRooms) description += ` و ${offer.livingRooms} صالات`;

    description += `. المساحة ${offer.area} متر مربع`;

    if (offer.neighborhood) description += ` في حي ${offer.neighborhood}`;
    if (offer.city) description += `، ${offer.city}`;

    if (offer.hasElevator) description += `، يوجد مصعد`;
    if (offer.hasGarage) description += `، يوجد كراج`;
    if (offer.hasPool) description += `، يوجد مسبح`;

    if (offer.additionalNotes) {
      const shortNotes = offer.additionalNotes.length > 100
        ? offer.additionalNotes.substring(0, 100) + '...'
        : offer.additionalNotes;
      description += `. ${shortNotes}`;
    }

    return description;
  };

  const generateTimeAgo = (createdAt: string): string => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "الآن";
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  // توليد الأسماء عشوائياً من بيانات العقار



  const generatePersonRole = (price: number): string => {
    if (price > 5000000) return "مالك عقار مميز";
    if (price > 1000000) return "مالك العقار";
    return "وسيط عقاري";
  };


  const applyFilters = () => {
    let result = [...offers];

    // Property type filter
    if (propertyType === "residential") {
      result = result.filter(offer =>
        ["أرض سكنية", "فيلا", "قصر", "شقة", "بيت شعبي"].includes(offer.propertyType)
      );
    } else if (propertyType === "commercial") {
      result = result.filter(offer =>
        ["محل تجاري", "مكتب", "فندق", "برج", "مصنع", "مستودع"].includes(offer.propertyType)
      );
    }

    // Subtype filter
    if (subtype) {
      result = result.filter(offer => offer.propertyType === subtype);
    }

    // Area range filter
    if (areaFrom) {
      const minArea = parseFloat(areaFrom);
      result = result.filter(offer => offer.area >= minArea);
    }
    if (areaTo) {
      const maxArea = parseFloat(areaTo);
      result = result.filter(offer => offer.area <= maxArea);
    }

    // City filter
    if (city) {
      result = result.filter(offer =>
        offer.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    // Neighborhood filter
    if (neighborhood) {
      result = result.filter(offer =>
        offer.neighborhood?.toLowerCase().includes(neighborhood.toLowerCase())
      );
    }

    // Price range filter
    if (priceFrom) {
      const minPrice = parseFloat(priceFrom);
      result = result.filter(offer => offer.price >= minPrice);
    }
    if (priceTo) {
      const maxPrice = parseFloat(priceTo);
      result = result.filter(offer => offer.price <= maxPrice);
    }

    // Property age filter
    if (propertyAge) {
      result = result.filter(offer => offer.propertyAge === propertyAge);
    }

    // Direction filter
    if (direction) {
      result = result.filter(offer => offer.direction === direction);
    }

    // Property condition filter
    if (propertyCondition) {
      result = result.filter(offer => offer.propertyCondition === propertyCondition);
    }

    // Furniture status filter
    if (furnitureStatus) {
      result = result.filter(offer => offer.furnitureStatus === furnitureStatus);
    }

    // Rooms filter
    if (rooms) {
      const numRooms = parseInt(rooms);
      result = result.filter(offer => offer.rooms && offer.rooms >= numRooms);
    }

    // Bathrooms filter
    if (bathrooms) {
      const numBathrooms = parseInt(bathrooms);
      result = result.filter(offer => offer.bathrooms && offer.bathrooms >= numBathrooms);
    }

    // Has garage filter
    if (hasGarage === "نعم") {
      result = result.filter(offer => offer.hasGarage === true);
    } else if (hasGarage === "لا") {
      result = result.filter(offer => offer.hasGarage === false);
    }

    // Has elevator filter
    if (hasElevator === "نعم") {
      result = result.filter(offer => offer.hasElevator === true);
    } else if (hasElevator === "لا") {
      result = result.filter(offer => offer.hasElevator === false);
    }

    // Has pool filter
    if (hasPool === "نعم") {
      result = result.filter(offer => offer.hasPool === true);
    } else if (hasPool === "لا") {
      result = result.filter(offer => offer.hasPool === false);
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
    setAreaFrom("");
    setAreaTo("");
    setCity("");
    setNeighborhood("");
    setPriceFrom("");
    setPriceTo("");
    setPropertyAge("");
    setDirection("");
    setPropertyCondition("");
    setFurnitureStatus("");
    setRooms("");
    setBathrooms("");
    setHasGarage("");
    setHasElevator("");
    setHasPool("");
  };

  const propertyAges = [
    "أقل من سنة",
    "1-5 سنوات",
    "6-10 سنوات",
    "أكثر من 10 سنوات"
  ];

  const directions = ["شمال", "جنوب", "شرق", "غرب"];
  const propertyConditions = ["جديد", "مستعمل", "مجدد"];
  const furnitureOptions = ["مفروش", "غير مفروش"];
  const yesNoOptions = ["نعم", "لا"];

  return (
    <section className="w-full min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Fixed Filter Sidebar */}
      <div className="fixed top-0 right-0 h-screen w-80 bg-white border-l border-gray-200 shadow-lg overflow-y-auto">
        <div className="p-6">
          <div className="my-4 space-y-4">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors bg-gray-50 px-3 py-2 rounded-lg w-full"
            >
              <ArrowRight className="w-5 h-5 transform rotate-180" />
              <span className="font-medium">العودة للرئيسية</span>
            </button>
            <div className="flex items-center gap-2">
              <TableOfContents className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-700">فلاتر البحث</span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Property Type */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">اختر سكني أو تجاري</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => handlePropertySelect("residential")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    propertyType === "residential"
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  عقار سكني
                </button>
                <button
                  onClick={() => handlePropertySelect("commercial")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    propertyType === "commercial"
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  عقار تجاري
                </button>
              </div>
            </div>

            {/* Subtypes */}
            {propertyType && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">الخيارات الفرعية</h3>
                <div className="grid grid-cols-1 gap-2">
                  {(propertyType === "residential" ? residentialSubtypes : commercialSubtypes).map((sub) => (
                    <button
                      key={sub}
                      onClick={() => handleSubtypeSelect(sub)}
                      className={`px-4 py-2 rounded-lg text-right font-medium transition-colors ${
                        subtype === sub
                          ? "bg-gray-700 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Area Range */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                المساحة (متر مربع)
              </h3>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="من"
                  value={areaFrom}
                  onChange={(e) => setAreaFrom(e.target.value)}
                  className="text-right"
                />
                <Input
                  type="number"
                  placeholder="إلى"
                  value={areaTo}
                  onChange={(e) => setAreaTo(e.target.value)}
                  className="text-right"
                />
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                السعر (ريال)
              </h3>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="من"
                  value={priceFrom}
                  onChange={(e) => setPriceFrom(e.target.value)}
                  className="text-right"
                />
                <Input
                  type="number"
                  placeholder="إلى"
                  value={priceTo}
                  onChange={(e) => setPriceTo(e.target.value)}
                  className="text-right"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                المدينة
              </h3>
              <Input
                type="text"
                placeholder="اكتب اسم المدينة"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="text-right"
              />
            </div>

            {/* Neighborhood */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">الحي</h3>
              <Input
                type="text"
                placeholder="اكتب اسم الحي"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="text-right"
              />
            </div>

            {/* Property Age */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                عمر العقار
              </h3>
              <select
                value={propertyAge}
                onChange={(e) => setPropertyAge(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-right"
              >
                <option value="">اختر عمر العقار</option>
                {propertyAges.map(age => (
                  <option key={age} value={age}>{age}</option>
                ))}
              </select>
            </div>

            {/* Direction */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                الواجهة
              </h3>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-right"
              >
                <option value="">اختر اتجاه الواجهة</option>
                {directions.map(dir => (
                  <option key={dir} value={dir}>{dir}</option>
                ))}
              </select>
            </div>

            {/* Property Condition */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                حالة العقار
              </h3>
              <select
                value={propertyCondition}
                onChange={(e) => setPropertyCondition(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-right"
              >
                <option value="">اختر حالة العقار</option>
                {propertyConditions.map(cond => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>

            {/* Furniture Status */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">الأثاث</h3>
              <select
                value={furnitureStatus}
                onChange={(e) => setFurnitureStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-right"
              >
                <option value="">اختر حالة الأثاث</option>
                {furnitureOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Rooms */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">عدد الغرف</h3>
              <Input
                type="number"
                placeholder="الحد الأدنى للغرف"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                className="text-right"
              />
            </div>

            {/* Bathrooms */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">عدد دورات المياه</h3>
              <Input
                type="number"
                placeholder="الحد الأدنى لدورات المياه"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="text-right"
              />
            </div>

            {/* Has Garage */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">كراج</h3>
              <select
                value={hasGarage}
                onChange={(e) => setHasGarage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-right"
              >
                <option value="">اختر</option>
                {yesNoOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Has Elevator */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">مصعد</h3>
              <select
                value={hasElevator}
                onChange={(e) => setHasElevator(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-right"
              >
                <option value="">اختر</option>
                {yesNoOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Has Pool */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">مسبح</h3>
              <select
                value={hasPool}
                onChange={(e) => setHasPool(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-right"
              >
                <option value="">اختر</option>
                {yesNoOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <div className="pt-4">
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                إعادة تعيين الفلاتر
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
       <div className="flex-1 mr-80">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل العروض...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">حدث خطأ</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button
                onClick={fetchOffers}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
              >
                محاولة مرة أخرى
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredOffers.length === 0 && (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <TableOfContents className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد عروض</h3>
              <p className="text-gray-500 mb-4">
                {offers.length === 0
                  ? "لا يوجد عروض متاحة حالياً"
                  : "لم يتم العثور على عروض تطابق معايير البحث"
                }
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
              >
                إعادة تعيين الفلاتر
              </button>
            </div>
          </div>
        )}

        {/* Offers List */}
        {!loading && !error && filteredOffers.length > 0 && (
          <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                عرض <span className="font-semibold text-gray-800">{filteredOffers.length}</span> نتيجة
              </p>
            </div>

            <div className="space-y-4">
              {filteredOffers.map((offer) => {
                // Get seller name from user object or generate from offer data
                const sellerName = offer.user
                  ? `${offer.user.firstName || ''} ${offer.user.lastName || ''}`.trim()
                  : 'مالك العقار';

                return (
                  <div
                    key={offer.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Address */}
                    <h2 className="text-lg font-bold text-gray-800 mb-3">
                      {offer.address}
                    </h2>

                    {/* Person Name and Role */}
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      <span className="font-semibold text-gray-700">{sellerName}</span>
                      <span className="text-gray-400 mr-auto">•</span>
                      <span className="text-gray-500">{offer.timeAgo}</span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {offer.description}
                    </p>

                    {/* Details */}
                    <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-100 pt-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Ruler className="w-4 h-4 text-gray-500" />
                          <span>{offer.area} م²</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-gray-800">
                            {offer.price.toLocaleString()} ريال
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => window.location.href = `/offers/${offer.id}`}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          عرض التفاصيل
                        </button>

                        {/* Chat Button */}
                        {user && offer.userId && offer.user && (
                          <ChatButton
                            offerId={offer.id}
                            offerTitle={`${offer.propertyType} في ${offer.city}`}
                            sellerId={(offer as any).userId}
                            sellerName={offer.user ? `${offer.user.firstName} ${offer.user.lastName}` : 'المعلن'}
                            userId={user.id || user.userId}
                            userName={user.firstName}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        )}
      </div>
    </section>
  );
}
