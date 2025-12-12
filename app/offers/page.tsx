"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { TableOfContents, MessageCircle } from "lucide-react";
import Chat from "../src/components/Chat";

interface Offer {
  id: string;
  propertyType: string; // e.g., "شقة"
  city: string; // e.g., "الرياض"
  address: string; // e.g., "شقة - الرياض"
  description: string;
  personName: string;
  personRole: string; // e.g., "مالك العقار", "وسيط", "وسيطة"
  area: number; // in square meters
  price: number; // in riyals
  timeAgo: string;
}

const mockOffers: Offer[] = [
  {
    id: "1",
    propertyType: "شقة",
    city: "الرياض",
    address: "شقة - الرياض",
    description: "شقة فاخرة للبيع في حي النرجس، تتكون من ٣ غرف نوم وصالتين و٣ دورات مياه ومطبخ مجهز. الشقة في الطابق الخامس من مبنى حديث، مع إطلالة ممتازة.",
    personName: "محمد أحمد",
    personRole: "مالك العقار",
    area: 150,
    price: 850000,
    timeAgo: "منذ دقيقة"
  },
  {
    id: "2",
    propertyType: "فيلا",
    city: "جدة",
    address: "فيلا - جدة",
    description: "فيلا راقية للبيع في حي الياسمين، تتكون من طابقين مع حديقة واسعة وموقف سيارات. الموقع ممتاز قريب من الشاطئ.",
    personName: "شركة عقارية",
    personRole: "وسيط",
    area: 600,
    price: 2500000,
    timeAgo: "منذ ٥ دقائق"
  },
  {
    id: "3",
    propertyType: "أرض سكنية",
    city: "الرياض",
    address: "أرض سكنية - الرياض",
    description: "أرض سكنية ممتازة على شارع رئيسي. الموقع استراتيجي قريب من الخدمات والمرافق. جاهزة للبناء مباشرة.",
    personName: "خالد عبدالله",
    personRole: "مالك العقار",
    area: 500,
    price: 1200000,
    timeAgo: "منذ ١٠ دقائق"
  },
  {
    id: "4",
    propertyType: "محل تجاري",
    city: "الرياض",
    address: "محل تجاري - الرياض",
    description: "محل تجاري ممتاز في موقع حيوي على شارع رئيسي مزدحم. مجهز بالكامل وجاهز للاستخدام الفوري.",
    personName: "رنا خالد",
    personRole: "وسيطة",
    area: 80,
    price: 15000,
    timeAgo: "منذ ساعة"
  },
  {
    id: "5",
    propertyType: "شقة",
    city: "الدمام",
    address: "شقة - الدمام",
    description: "شقة حديثة للإيجار في حي المطار، تتكون من غرفتين نوم وصالة ومطبخ. مكيفة بالكامل ومجهزة بجميع الأثاث.",
    personName: "محمد سالم",
    personRole: "مالك العقار",
    area: 120,
    price: 4500,
    timeAgo: "منذ ساعتين"
  },
  {
    id: "6",
    propertyType: "مكتب",
    city: "الخبر",
    address: "مكتب - الخبر",
    description: "مكتب فاخر في برج تجاري حديث مع إطلالة على البحر. مجهز بالكامل ومفروش، مناسب للشركات والمكاتب الاستشارية.",
    personName: "شركة عقارية",
    personRole: "وسيط",
    area: 100,
    price: 12000,
    timeAgo: "منذ ٣ ساعات"
  }
];

const residentialSubtypes = [
  "اراضي سكنية",
  "فلل / قصور",
  "شقق"
];

const commercialSubtypes = [
  "ابراج مكتبية/ مكاتب",
  "محلات تجارية",
  "فنادق",
  "ابراج"
];

export default function OffersPage() {
  const [offers] = useState<Offer[]>(mockOffers);
  const [openChatOfferId, setOpenChatOfferId] = useState<string | null>(null);
  
  // Filter state
  const [propertyType, setPropertyType] = useState<"residential" | "commercial" | null>(null);
  const [subtype, setSubtype] = useState<string | null>(null);
  const [areaFrom, setAreaFrom] = useState<string>("");
  const [areaTo, setAreaTo] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [neighborhood, setNeighborhood] = useState<string>("");
  const [priceFrom, setPriceFrom] = useState<string>("");
  const [priceTo, setPriceTo] = useState<string>("");

  const handlePropertySelect = (type: "residential" | "commercial") => {
    setPropertyType(type);
    setSubtype(null);
  };

  const handleSubtypeSelect = (sub: string) => {
    setSubtype(sub);
  };

  return (
    <section className="w-full min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Fixed Filter Sidebar */}
      <div className="fixed top-0 right-0 h-screen w-80 bg-white border-l border-gray-200 shadow-lg">
        <div className="p-6 h-full overflow-y-auto">
           <div className="my-4">  <TableOfContents /> </div>

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
              <h3 className="text-sm font-semibold text-gray-700 mb-3">المساحة (متر مربع)</h3>
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

            {/* City */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">المدينة</h3>
              <Input
                type="text"
                placeholder="اختر المدينة"
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
                placeholder="اكتب الحي"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="text-right"
              />
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">السعر (ريال)</h3>
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 mr-80">
        {/* Offers List */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
          <div className="space-y-4">
            {offers.map((offer) => (
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
                  <span className="font-semibold text-gray-700">{offer.personName}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600">{offer.personRole}</span>
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
                    <span>المساحة: {offer.area} م²</span>
                    <span>•</span>
                    <span className="font-semibold text-gray-800">
                      {offer.price.toLocaleString()} ريال
                    </span>
                  </div>
                  <button
                    onClick={() => setOpenChatOfferId(offer.id)}
                    className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                    aria-label="فتح الدردشة"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>دردشة</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Chat Modal */}
      {openChatOfferId && (
        <Chat
          isOpen={true}
          onClose={() => setOpenChatOfferId(null)}
          offerId={openChatOfferId}
          personName={offers.find((o) => o.id === openChatOfferId)?.personName}
          address={offers.find((o) => o.id === openChatOfferId)?.address}
        />
      )}
    </section>
  );
}
