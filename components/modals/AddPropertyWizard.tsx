"use client";

import React, { useState, useMemo } from "react";
import { 
    X, Building, MapPin, Hash, DollarSign, Loader2, Home, 
    Landmark, Warehouse, Map as MapIcon, Plus, Users, CreditCard, FileText,
    Trash2, Edit, Check, ChevronRight, ChevronLeft, User, Phone, Mail, Calendar,
    LayoutDashboard
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CreatePropertyDto, CreateUnitDto, CreateLeaseDto, CreateTenantDto, CreatePaymentDto, MaintenanceRequest } from "@/types/api";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import { SaudiRiyalIcon } from "../ui/saudi-riyal-icon";

// Dynamic import for Map to avoid SSR issues
const Map = dynamic(() => import('@/app/src/components/Map'), { 
  ssr: false,
  loading: () => {
    const { t } = useLanguage();
    return <div className="h-[400px] w-full bg-muted animate-pulse rounded-xl flex items-center justify-center text-gray-400">{t('map.loading')}</div>
  }
});

interface AddPropertyWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePropertyDto) => void;
  loading: boolean;
}

export function AddPropertyWizard({
  isOpen,
  onClose,
  onSubmit,
  loading
}: AddPropertyWizardProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("assets");
  const isRtl = language === 'ar';

  // Map State
  const [showMap, setShowMap] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState<[number, number] | null>(null);

  const [propertyData, setPropertyData] = useState<CreatePropertyDto>({
    name: "",
    type: "building",
    deedNumber: "",
    locationUrl: "",
    constructionDate: "",
    purchasePrice: 0,
    units: [],
    mainCategory: "residential",
    propertyType: "فيلا",
    dealType: "بيع",
    price: 0,
    area: 0,
    length: 0,
    width: 0,
    streetWidth: 0,
    city: "الرياض",
    neighborhood: "",
    propertyAge: "جديد",
    direction: "شمال",
    deedType: "صك إلكتروني",
    propertyCondition: "جديد",
    rooms: 0,
    bathrooms: 0,
    livingRooms: 0,
    kitchens: 0,
    floors: 0,
    apartments: 0,
    hasMaidRoom: false,
    hasRoof: false,
    hasExternalAnnex: false,
    buildingArea: 0,
    hasGarage: false,
    hasPool: false,
    hasElevator: false,
    furnitureStatus: "unfurnished",
    additionalNotes: "",
  });

  // Helper to update units
  const updateUnits = (units: CreateUnitDto[]) => {
    setPropertyData(prev => ({ ...prev, units }));
  };

  const handleLocationSelect = async (lat: number, lng: number) => {
    setMapCoordinates([lat, lng]);
    // Create Google Maps link
    const link = `https://www.google.com/maps?q=${lat},${lng}`;
    
    // Fetch address using reverse geocoding
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ar,en`);
      const data = await response.json();
      if (data && data.display_name) {
        setPropertyData(prev => ({ ...prev, locationUrl: link }));
      } else {
        setPropertyData(prev => ({ ...prev, locationUrl: link }));
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setPropertyData(prev => ({ ...prev, locationUrl: link }));
    }
  };

  const confirmLocation = () => {
    setShowMap(false);
  };

  // --- Step 1: Asset Management Helpers ---
  const [newUnit, setNewUnit] = useState<Partial<CreateUnitDto>>({
    unitNumber: "",
    type: "apartment",
    area: 0,
    roomsCount: 0,
    occupancyStatus: "vacant",
    expectedVacancyDate: ""
  });

  const addUnit = () => {
    if (!newUnit.unitNumber) return;
    const unit: CreateUnitDto = {
        unitNumber: newUnit.unitNumber,
        type: newUnit.type as any || 'apartment',
        area: newUnit.area,
        roomsCount: newUnit.roomsCount,
        occupancyStatus: newUnit.occupancyStatus as any || 'vacant',
        expectedVacancyDate: newUnit.expectedVacancyDate || undefined,
        leases: [] 
    };
    updateUnits([...(propertyData.units || []), unit]);
    setNewUnit({ unitNumber: "", type: "apartment", area: 0, roomsCount: 0, occupancyStatus: "vacant", expectedVacancyDate: "" });
  };

  const removeUnit = (index: number) => {
    const newUnits = [...(propertyData.units || [])];
    newUnits.splice(index, 1);
    updateUnits(newUnits);
  };

  // --- Step 2: Tenant Helpers ---
  const [editingUnitIndex, setEditingUnitIndex] = useState<number | null>(null);
  const [tempLease, setTempLease] = useState<Partial<CreateLeaseDto> & { tenant: Partial<CreateTenantDto> }>({
    startDate: "",
    endDate: "",
    annualRent: 0,
    paymentFrequency: "annual",
    tenant: {
        fullName: "",
        idNumber: "",
        phoneNumber: "",
        type: "individual"
    }
  });

  const openLeaseEditor = (index: number) => {
    setEditingUnitIndex(index);
    const existingLease = propertyData.units?.[index].leases?.[0];
    if (existingLease) {
        setTempLease({
            ...existingLease,
            tenant: existingLease.tenant || { fullName: "", type: "individual" }
        });
    } else {
        setTempLease({
            startDate: "",
            endDate: "",
            annualRent: 0,
            paymentFrequency: "annual",
            tenant: { fullName: "", type: "individual" }
        });
    }
  };

  const saveLease = () => {
    if (editingUnitIndex === null) return;
    const units = [...(propertyData.units || [])];
    
    // Construct lease object
    const lease: CreateLeaseDto = {
        startDate: tempLease.startDate!,
        endDate: tempLease.endDate!,
        annualRent: Number(tempLease.annualRent),
        paymentFrequency: tempLease.paymentFrequency,
        securityDeposit: tempLease.securityDeposit,
        securityDepositStatus: tempLease.securityDepositStatus as any,
        deductionReason: tempLease.deductionReason,
        tenant: {
            fullName: tempLease.tenant.fullName!,
            idNumber: tempLease.tenant.idNumber,
            phoneNumber: tempLease.tenant.phoneNumber,
            email: tempLease.tenant.email,
            employer: tempLease.tenant.employer,
            type: tempLease.tenant.type as "individual" | "company",
            preferredPaymentDay: tempLease.tenant.preferredPaymentDay
        }
    };

    units[editingUnitIndex].leases = [lease];
    units[editingUnitIndex].occupancyStatus = 'rented';
    
    updateUnits(units);
    setEditingUnitIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(propertyData);
  };

  if (!isOpen) return null;

  const tabItems = [
    { id: 'assets', label: t('action.assetManagement'), icon: Building },

  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div 
        className="bg-card rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-gray-200"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        
        {/* Header - Reduced padding and font size */}
        <div className="p-5 border-b border flex justify-between items-center bg-muted/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-slate-600 rounded-lg text-white shadow-lg shadow-blue-600/20">
                  <LayoutDashboard className="w-5 h-5" />
              </div>
              {t('bm.offer.new')}
            </h3>
            <p className="text-gray-600 text-sm mt-1 ms-[3.25rem] font-medium">{t('action.assetManagement')}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="rounded-full hover:bg-muted text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col w-full min-h-0">
                
                {/* Steps Indicator / Tabs List */}
                <div className="bg-card border-b border px-6 py-4 overflow-x-auto shrink-0 transition-all">
                    <TabsList className="bg-transparent p-0 h-auto justify-start gap-4 inline-flex w-full min-w-max">
                        {tabItems.map((item, idx) => (
                            <TabsTrigger 
                                key={item.id}
                                value={item.id} 
                                className={`
                                    flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300
                                    data-[state=active]:bg-muted data-[state=active]:border-blue-200 data-[state=active]:text-blue-700
                                    data-[state=inactive]:bg-card data-[state=inactive]:border data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-muted
                                `}
                            >
                                <span className={`
                                    flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                                    ${activeTab === item.id ? 'bg-slate-600 text-white shadow-md shadow-blue-600/20' : 'bg-muted text-gray-600'}
                                `}>
                                    {idx + 1}
                                </span>
                                {item.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* Tab Panels Container - Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 bg-muted/30 w-full relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="min-h-full pb-10" // Padding bottom ensures space for scroll
                        >
                            {/* --- TAB 1: ASSETS --- */}
                            <TabsContent value="assets" className="mt-0 space-y-8 focus-visible:outline-none">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                     {/* Property Details Card */}
                                     <Card className="bg-card border shadow-sm md:col-span-2">
                                        <CardContent className="p-6 space-y-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 rounded-lg bg-muted text-blue-600"><Building className="w-5 h-5" /></div>
                                                <h4 className="text-lg font-bold text-gray-900">{t('pm.details.title')}</h4>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">{t('pm.field.propertyName')}</Label>
                                                    <Input 
                                                        value={propertyData.name}
                                                        onChange={e => setPropertyData({...propertyData, name: e.target.value})}
                                                        className="bg-card border-gray-300 focus:border-blue-500 h-12 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                                        placeholder={t('pm.field.propertyName')}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">{t('bm.offer.type')}</Label>
                                                    <Select value={propertyData.type} onValueChange={(v: any) => setPropertyData({...propertyData, type: v})}>
                                                        <SelectTrigger className="bg-card border-gray-300 h-12 font-medium text-gray-900"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="bg-card border shadow-lg">
                                                            <SelectItem value="building">{t('property.type.building')}</SelectItem>
                                                            <SelectItem value="compound">{t('property.type.compound')}</SelectItem>
                                                            <SelectItem value="land">{t('property.type.land')}</SelectItem>
                                                            <SelectItem value="warehouse">{t('property.type.warehouse')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">{t('bm.offer.deedNumber')}</Label>
                                                    <div className="relative">
                                                        <Input 
                                                            value={propertyData.deedNumber}
                                                            onChange={e => setPropertyData({...propertyData, deedNumber: e.target.value})}
                                                            className="bg-card border-gray-300 focus:border-blue-500 h-12 ps-10 font-medium text-gray-900 placeholder:text-gray-400"
                                                        />
                                                        <Hash className="absolute start-3 top-4 w-4 h-4 text-gray-500" />
                                                    </div>
                                                </div>
                                                

                                             <div className="space-y-3">
                                                <Label className="text-gray-700 font-bold">{t('pm.field.location')}</Label>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Input 
                                                            dir="ltr"
                                                            value={propertyData.locationUrl || ''} 
                                                            onChange={e => setPropertyData({...propertyData, locationUrl: e.target.value})}
                                                            placeholder="https://maps.google.com/?q=..." 
                                                            className="h-12 rounded-xl border bg-card ps-10"
                                                        />
                                                        <MapIcon className="absolute top-3.5 w-5 h-5 text-gray-400 start-3" />
                                                    </div>
                                                    <Button 
                                                        type="button" 
                                                        onClick={() => setShowMap(true)} 
                                                        className="h-12 w-12 rounded-xl bg-slate-600 hover:bg-slate-700 text-white p-0 flex items-center justify-center shadow-lg shadow-blue-600/20"
                                                    >
                                                        <MapIcon className="w-6 h-6" />
                                                    </Button>
                                                </div>
                                             </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">{t('pm.field.constructionDate')}</Label>
                                                    <div className="relative">
                                                        <Input 
                                                            value={propertyData.constructionDate}
                                                            onChange={e => setPropertyData({...propertyData, constructionDate: e.target.value})} 
                                                            type="text" 
                                                            className="bg-card border-gray-300 focus:border-blue-500 h-12 ps-10 font-medium text-gray-900 placeholder:text-gray-400"
                                                            placeholder="YYYY"
                                                        />
                                                        <Calendar className="absolute start-3 top-4 w-4 h-4 text-gray-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                     </Card>

                                     {/* Offer Alignment Details Card */}
                                     <Card className="bg-card border shadow-sm md:col-span-2">
                                        <CardContent className="p-6 space-y-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                                    <LayoutDashboard className="w-5 h-5" />
                                                </div>
                                                <h4 className="text-lg font-bold text-gray-900">
                                                    {isRtl ? "مواصفات وبيانات العرض العقاري" : "Offer Specifications & Details"}
                                                </h4>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "القسم الرئيسي" : "Main Category"}
                                                    </Label>
                                                    <Select 
                                                        value={propertyData.mainCategory} 
                                                        onValueChange={v => setPropertyData({...propertyData, mainCategory: v})}
                                                    >
                                                        <SelectTrigger className="bg-card border-gray-300 h-12 font-medium text-gray-900">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-card border shadow-lg">
                                                            <SelectItem value="residential">{isRtl ? "سكني" : "Residential"}</SelectItem>
                                                            <SelectItem value="commercial">{isRtl ? "تجاري" : "Commercial"}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "نوع العقار" : "Property Type"}
                                                    </Label>
                                                    <Input 
                                                        value={propertyData.propertyType}
                                                        onChange={e => setPropertyData({...propertyData, propertyType: e.target.value})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                        placeholder={isRtl ? ": فيلا، شقة" : "e.g., Villa, Apartment"}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "نوع الصفقة" : "Deal Type"}
                                                    </Label>
                                                    <Select 
                                                        value={propertyData.dealType} 
                                                        onValueChange={v => setPropertyData({...propertyData, dealType: v})}
                                                    >
                                                        <SelectTrigger className="bg-card border-gray-300 h-12 font-medium text-gray-900">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-card border shadow-lg">
                                                            <SelectItem value="بيع">{isRtl ? "بيع" : "Sale"}</SelectItem>
                                                            <SelectItem value="إيجار">{isRtl ? "إيجار" : "Rent"}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "السعر" : "Price"}
                                                    </Label>
                                                    <Input 
                                                        type="number"
                                                        value={propertyData.price || ""}
                                                        onChange={e => setPropertyData({...propertyData, price: Number(e.target.value)})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "المساحة (م²)" : "Area (sqm)"}
                                                    </Label>
                                                    <Input 
                                                        type="number"
                                                        value={propertyData.area || ""}
                                                        onChange={e => setPropertyData({...propertyData, area: Number(e.target.value)})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "الطول" : "Length"}
                                                    </Label>
                                                    <Input 
                                                        type="number"
                                                        value={propertyData.length || ""}
                                                        onChange={e => setPropertyData({...propertyData, length: Number(e.target.value)})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "العرض" : "Width"}
                                                    </Label>
                                                    <Input 
                                                        type="number"
                                                        value={propertyData.width || ""}
                                                        onChange={e => setPropertyData({...propertyData, width: Number(e.target.value)})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "عرض الشارع" : "Street Width"}
                                                    </Label>
                                                    <Input 
                                                        type="number"
                                                        value={propertyData.streetWidth || ""}
                                                        onChange={e => setPropertyData({...propertyData, streetWidth: Number(e.target.value)})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "المدينة" : "City"}
                                                    </Label>
                                                    <Input 
                                                        value={propertyData.city}
                                                        onChange={e => setPropertyData({...propertyData, city: e.target.value})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "الحي" : "Neighborhood"}
                                                    </Label>
                                                    <Input 
                                                        value={propertyData.neighborhood}
                                                        onChange={e => setPropertyData({...propertyData, neighborhood: e.target.value})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "عمر العقار" : "Property Age"}
                                                    </Label>
                                                    <Input 
                                                        value={propertyData.propertyAge}
                                                        onChange={e => setPropertyData({...propertyData, propertyAge: e.target.value})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "الواجهة" : "Direction"}
                                                    </Label>
                                                    <Input 
                                                        value={propertyData.direction}
                                                        onChange={e => setPropertyData({...propertyData, direction: e.target.value})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "نوع الصك" : "Deed Type"}
                                                    </Label>
                                                    <Input 
                                                        value={propertyData.deedType}
                                                        onChange={e => setPropertyData({...propertyData, deedType: e.target.value})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "حالة العقار" : "Property Condition"}
                                                    </Label>
                                                    <Input 
                                                        value={propertyData.propertyCondition}
                                                        onChange={e => setPropertyData({...propertyData, propertyCondition: e.target.value})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "الغرف" : "Rooms"}
                                                    </Label>
                                                    <Input 
                                                        type="number"
                                                        value={propertyData.rooms || ""}
                                                        onChange={e => setPropertyData({...propertyData, rooms: Number(e.target.value)})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "دورات المياه" : "Bathrooms"}
                                                    </Label>
                                                    <Input 
                                                        type="number"
                                                        value={propertyData.bathrooms || ""}
                                                        onChange={e => setPropertyData({...propertyData, bathrooms: Number(e.target.value)})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "الصالات" : "Living Rooms"}
                                                    </Label>
                                                    <Input 
                                                        type="number"
                                                        value={propertyData.livingRooms || ""}
                                                        onChange={e => setPropertyData({...propertyData, livingRooms: Number(e.target.value)})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "المطابخ" : "Kitchens"}
                                                    </Label>
                                                    <Input 
                                                        type="number"
                                                        value={propertyData.kitchens || ""}
                                                        onChange={e => setPropertyData({...propertyData, kitchens: Number(e.target.value)})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "الأدوار" : "Floors"}
                                                    </Label>
                                                    <Input 
                                                        type="number"
                                                        value={propertyData.floors || ""}
                                                        onChange={e => setPropertyData({...propertyData, floors: Number(e.target.value)})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "الشقق" : "Apartments"}
                                                    </Label>
                                                    <Input 
                                                        type="number"
                                                        value={propertyData.apartments || ""}
                                                        onChange={e => setPropertyData({...propertyData, apartments: Number(e.target.value)})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "مسطح البناء" : "Building Area"}
                                                    </Label>
                                                    <Input 
                                                        type="number"
                                                        value={propertyData.buildingArea || ""}
                                                        onChange={e => setPropertyData({...propertyData, buildingArea: Number(e.target.value)})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "غرفة عاملة" : "Maid Room"}
                                                    </Label>
                                                    <Select 
                                                        value={String(propertyData.hasMaidRoom)} 
                                                        onValueChange={v => setPropertyData({...propertyData, hasMaidRoom: v === "true"})}
                                                    >
                                                        <SelectTrigger className="bg-card border-gray-300 h-12 font-medium text-gray-900">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-card border shadow-lg">
                                                            <SelectItem value="true">{isRtl ? "نعم" : "Yes"}</SelectItem>
                                                            <SelectItem value="false">{isRtl ? "لا" : "No"}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "سطح" : "Roof"}
                                                    </Label>
                                                    <Select 
                                                        value={String(propertyData.hasRoof)} 
                                                        onValueChange={v => setPropertyData({...propertyData, hasRoof: v === "true"})}
                                                    >
                                                        <SelectTrigger className="bg-card border-gray-300 h-12 font-medium text-gray-900">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-card border shadow-lg">
                                                            <SelectItem value="true">{isRtl ? "نعم" : "Yes"}</SelectItem>
                                                            <SelectItem value="false">{isRtl ? "لا" : "No"}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "ملحق خارجي" : "External Annex"}
                                                    </Label>
                                                    <Select 
                                                        value={String(propertyData.hasExternalAnnex)} 
                                                        onValueChange={v => setPropertyData({...propertyData, hasExternalAnnex: v === "true"})}
                                                    >
                                                        <SelectTrigger className="bg-card border-gray-300 h-12 font-medium text-gray-900">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-card border shadow-lg">
                                                            <SelectItem value="true">{isRtl ? "نعم" : "Yes"}</SelectItem>
                                                            <SelectItem value="false">{isRtl ? "لا" : "No"}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "كراج" : "Garage"}
                                                    </Label>
                                                    <Select 
                                                        value={String(propertyData.hasGarage)} 
                                                        onValueChange={v => setPropertyData({...propertyData, hasGarage: v === "true"})}
                                                    >
                                                        <SelectTrigger className="bg-card border-gray-300 h-12 font-medium text-gray-900">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-card border shadow-lg">
                                                            <SelectItem value="true">{isRtl ? "نعم" : "Yes"}</SelectItem>
                                                            <SelectItem value="false">{isRtl ? "لا" : "No"}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "مسبح" : "Pool"}
                                                    </Label>
                                                    <Select 
                                                        value={String(propertyData.hasPool)} 
                                                        onValueChange={v => setPropertyData({...propertyData, hasPool: v === "true"})}
                                                    >
                                                        <SelectTrigger className="bg-card border-gray-300 h-12 font-medium text-gray-900">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-card border shadow-lg">
                                                            <SelectItem value="true">{isRtl ? "نعم" : "Yes"}</SelectItem>
                                                            <SelectItem value="false">{isRtl ? "لا" : "No"}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "مصعد" : "Elevator"}
                                                    </Label>
                                                    <Select 
                                                        value={String(propertyData.hasElevator)} 
                                                        onValueChange={v => setPropertyData({...propertyData, hasElevator: v === "true"})}
                                                    >
                                                        <SelectTrigger className="bg-card border-gray-300 h-12 font-medium text-gray-900">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-card border shadow-lg">
                                                            <SelectItem value="true">{isRtl ? "نعم" : "Yes"}</SelectItem>
                                                            <SelectItem value="false">{isRtl ? "لا" : "No"}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "حالة الأثاث" : "Furniture Status"}
                                                    </Label>
                                                    <Select 
                                                        value={propertyData.furnitureStatus} 
                                                        onValueChange={v => setPropertyData({...propertyData, furnitureStatus: v})}
                                                    >
                                                        <SelectTrigger className="bg-card border-gray-300 h-12 font-medium text-gray-900">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-card border shadow-lg">
                                                            <SelectItem value="furnished">{isRtl ? "مفروش" : "Furnished"}</SelectItem>
                                                            <SelectItem value="unfurnished">{isRtl ? "غير مفروش" : "Unfurnished"}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2 md:col-span-3">
                                                    <Label className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                                                        {isRtl ? "ملاحظات إضافية" : "Additional Notes"}
                                                    </Label>
                                                    <Input 
                                                        value={propertyData.additionalNotes}
                                                        onChange={e => setPropertyData({...propertyData, additionalNotes: e.target.value})}
                                                        className="bg-card border-gray-300 h-12 font-medium text-gray-900"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                     </Card>

                                     {/* Units Section */}
                                     <div className="md:col-span-2 space-y-4">
                                         <div className="flex items-center justify-between">
                                            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                <Home className="w-5 h-5 text-gray-600" />
                                                {t('pm.tab.units')}
                                            </h4>
                                         </div>

                                         {/* Add Unit Form */}
                                         <Card className="bg-muted/50 border-blue-100 shadow-sm">
                                            <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-end">
                                                <div className="w-full md:w-32 space-y-2">
                                                    <Label className="text-gray-700 text-xs font-bold">{t('pm.unit.number')}</Label>
                                                    <Input 
                                                        value={newUnit.unitNumber} 
                                                        onChange={e => setNewUnit({...newUnit, unitNumber: e.target.value})}
                                                        className="bg-card border-blue-200 h-11 text-gray-900"
                                                    />
                                                </div>
                                                <div className="w-full md:w-40 space-y-2">
                                                    <Label className="text-gray-700 text-xs font-bold">{t('pm.field.unitType')}</Label>
                                                    <select 
                                                        value={newUnit.type} 
                                                        onChange={e => setNewUnit({...newUnit, type: e.target.value as any})}
                                                        className="w-full bg-card border border-blue-200 h-11 text-gray-900 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    >
                                                        <option value="apartment">{t('bm.prop.apt')}</option>
                                                        <option value="shop">{t('bm.prop.shop')}</option>
                                                        <option value="office">{t('bm.prop.office')}</option>
                                                        <option value="warehouse">{t('property.type.warehouse')}</option>
                                                    </select>
                                                </div>
                                                <div className="w-full md:w-32 space-y-2">
                                                    <Label className="text-gray-700 text-xs font-bold">{t('offers.filter.rooms')}</Label>
                                                    <Input 
                                                        type="number"
                                                        value={newUnit.roomsCount} 
                                                        onChange={e => setNewUnit({...newUnit, roomsCount: Number(e.target.value)})}
                                                        className="bg-card border-blue-200 h-11 text-gray-900"
                                                    />
                                                </div>
                                                <div className="w-full md:w-40 space-y-2">
                                                    <Label className="text-gray-700 text-xs font-bold">{t('bm.field.occupancyStatus')}</Label>
                                                    <select 
                                                        value={newUnit.occupancyStatus} 
                                                        onChange={e => setNewUnit({...newUnit, occupancyStatus: e.target.value as any})}
                                                        className="w-full bg-card border border-blue-200 h-11 text-gray-900 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    >
                                                        <option value="vacant">{t('bm.status.vacant')}</option>
                                                        <option value="rented">{t('bm.status.rented')}</option>
                                                        <option value="reserved">{t('bm.status.reserved')}</option>
                                                        <option value="maintenance">{t('bm.status.maintenance')}</option>
                                                    </select>
                                                </div>
                                                <div className="w-full md:w-40 space-y-2">
                                                    <Label className="text-gray-700 text-xs font-bold">{t('pm.field.expectedVacancyDate')}</Label>
                                                    <Input 
                                                        type="date"
                                                        value={newUnit.expectedVacancyDate} 
                                                        onChange={e => setNewUnit({...newUnit, expectedVacancyDate: e.target.value})}
                                                        className="bg-card border-blue-200 h-11 text-gray-900"
                                                    />
                                                </div>
                                                <Button onClick={addUnit} className="bg-slate-600 hover:bg-slate-700 text-white h-11 px-6 rounded-xl shadow-md cursor-pointer w-full md:w-auto">
                                                    <Plus className="w-5 h-5" />
                                                    {t('common.add')}
                                                </Button>
                                            </CardContent>
                                         </Card>

                                         {/* Units List */}
                                         <div className="space-y-3">
                                            {propertyData.units?.map((unit, idx) => (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    key={idx} 
                                                    className="bg-card p-4 rounded-2xl border border flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-blue-600 font-bold">
                                                            {unit.unitNumber}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{t(`bm.prop.${unit.type === 'shop' ? 'shop' : unit.type === 'office' ? 'office' : 'apt'}`)}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {unit.roomsCount} {t('offers.filter.rooms')} • {unit.area}m²
                                                                {unit.expectedVacancyDate && ` • ${t('pm.field.expectedVacancyDate')}: ${unit.expectedVacancyDate}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                            unit.occupancyStatus === 'rented' ? 'bg-green-100 text-green-700' : 
                                                            unit.occupancyStatus === 'reserved' ? 'bg-amber-100 text-amber-700' :
                                                            unit.occupancyStatus === 'maintenance' ? 'bg-rose-100 text-rose-700' :
                                                            'bg-muted text-gray-600'
                                                        }`}>
                                                            {t(`bm.status.${unit.occupancyStatus}`)}
                                                        </div>
                                                        <Button variant="ghost" size="icon" onClick={() => removeUnit(idx)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                            {propertyData.units?.length === 0 && (
                                                <div className="text-center py-8 text-gray-400 bg-card rounded-2xl border border-dashed border">
                                                    {t('pm.units.empty')}
                                                </div>
                                            )}
                                         </div>
                                     </div>
                                </div>
                            </TabsContent>

                            {/* --- TAB 2: TENANTS --- */}
                            <TabsContent value="tenants" className="space-y-6 focus-visible:outline-none">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Units List for Selection */}
                                    <div className="md:col-span-1 space-y-3">
                                        <h4 className="text-lg font-bold text-gray-900 mb-4">{t('pm.tab.units')}</h4>
                                        {propertyData.units?.length === 0 ? (
                                            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{t('pm.units.required')}</p>
                                        ) : (
                                            propertyData.units?.map((unit, idx) => (
                                                <div 
                                                    key={idx}
                                                    onClick={() => openLeaseEditor(idx)}
                                                    className={`
                                                        cursor-pointer p-4 rounded-2xl border flex items-center justify-between transition-all
                                                        ${editingUnitIndex === idx 
                                                            ? 'bg-slate-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                                            : 'bg-card border text-gray-700 hover:border-blue-300 hover:bg-muted'}
                                                    `}
                                                >
                                                    <span className="font-bold">{t('pm.unit')} {unit.unitNumber}</span>
                                                    {unit.leases?.length ? <Check className="w-4 h-4" /> : <ChevronRight className={`w-4 h-4 rtl:rotate-180`} />}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Tenant Form */}
                                    <div className="md:col-span-2">
                                        {editingUnitIndex !== null ? (
                                            <Card className="bg-card border shadow-sm h-full">
                                                <CardContent className="p-6 space-y-6">
                                                    <div className="flex items-center justify-between border-b border pb-4">
                                                        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                            <User className="w-5 h-5 text-blue-600" />
                                                            {t('pm.tenant.details')}
                                                        </h4>

                                                        <span className="text-sm font-medium text-gray-500">{t('pm.unit')} {propertyData.units?.[editingUnitIndex].unitNumber}</span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                        <div className="space-y-2">
                                                            <Label className="text-gray-700 text-xs font-bold">{t('pm.tenant.name')}</Label>
                                                            <Input 
                                                                value={tempLease.tenant.fullName}
                                                                onChange={e => setTempLease({...tempLease, tenant: {...tempLease.tenant, fullName: e.target.value}})}
                                                                className="bg-muted border h-11 focus:bg-card transition-colors text-gray-900" 
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-gray-700 text-xs font-bold">{t('pm.tenant.phone')}</Label>
                                                            <Input 
                                                                value={tempLease.tenant.phoneNumber}
                                                                onChange={e => setTempLease({...tempLease, tenant: {...tempLease.tenant, phoneNumber: e.target.value}})}
                                                                className="bg-muted border h-11 focus:bg-card transition-colors text-gray-900" 
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-gray-700 text-xs font-bold">{t('pm.rent.annual')}</Label>
                                                            <div className="relative">
                                                                <Input 
                                                                    type="number"
                                                                    value={tempLease.annualRent}
                                                                    onChange={e => setTempLease({...tempLease, annualRent: Number(e.target.value)})}
                                                                    className="bg-muted border h-11 ps-10 focus:bg-card transition-colors text-gray-900" 
                                                                />
                                                                <SaudiRiyalIcon className="absolute start-3 top-3.5 w-4 h-4 text-gray-400" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-gray-700 text-xs font-bold">{t('pm.field.paymentMethod')}</Label>
                                                            <Select value={tempLease.paymentFrequency} onValueChange={(v:any) => setTempLease({...tempLease, paymentFrequency: v})}>
                                                                <SelectTrigger className="bg-muted border h-11 text-gray-900"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="annual">{t('pm.payment.annual')}</SelectItem>
                                                                    <SelectItem value="biannual">{t('pm.payment.biannual')}</SelectItem>
                                                                    <SelectItem value="quarterly">{t('pm.payment.quarterly')}</SelectItem>
                                                                    <SelectItem value="monthly">{t('pm.payment.monthly')}</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-gray-700 text-xs font-bold">{t('pm.lease.start')}</Label>
                                                            <Input 
                                                                type="date"
                                                                value={tempLease.startDate}
                                                                onChange={e => setTempLease({...tempLease, startDate: e.target.value})}
                                                                className="bg-muted border h-11 focus:bg-card transition-colors text-gray-900" 
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-gray-700 text-xs font-bold">{t('pm.lease.end')}</Label>
                                                            <Input 
                                                                type="date"
                                                                value={tempLease.endDate}
                                                                onChange={e => setTempLease({...tempLease, endDate: e.target.value})}
                                                                className="bg-muted border h-11 focus:bg-card transition-colors text-gray-900" 
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end pt-4">
                                                        <Button onClick={saveLease} className="bg-slate-600 text-white hover:bg-slate-700 h-12 px-8 rounded-xl shadow-lg shadow-blue-600/20">
                                                            {t('common.save')}
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center bg-card rounded-3xl border border-dashed border-gray-300 text-gray-400 p-10">
                                                <Users className="w-16 h-16 mb-4 opacity-20" />
                                                <p className="font-medium">{t('pm.tenants.desc')}</p>
                                                <p className="text-sm mt-2 opacity-60">{t('pm.unit.selectHint')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* --- TAB 3: FINANCIAL (Placeholder) --- */}
                            <TabsContent value="financial" className="space-y-6 focus-visible:outline-none">
                                <Card className="bg-card border shadow-sm">
                                    <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-2">
                                            <CreditCard className="w-10 h-10 text-blue-600" />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900">{t('pm.financial.management')}</h4>
                                        <p className="text-gray-500 max-w-md">{t('pm.financial.desc')}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mt-8">
                                            <div className="p-4 rounded-2xl bg-muted border border flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                                <span className="font-medium text-gray-700">{t('pm.financial.autoInvoice')}</span>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-muted border border flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-slate-500" />
                                                <span className="font-medium text-gray-700">{t('pm.financial.paymentTrack')}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* --- TAB 4: REPORTS (Placeholder) --- */}
                            <TabsContent value="reports" className="space-y-6 focus-visible:outline-none">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="bg-card border shadow-sm">
                                        <CardContent className="p-6">
                                            <h4 className="text-lg font-bold text-gray-900 mb-2">{t('pm.tab.roi')}</h4>
                                            <p className="text-gray-500 text-sm mb-6">{t('pm.roi.desc')}</p>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                                                    <span className="text-sm font-medium text-gray-600">{t('pm.roi.purchasePrice')}</span>
                                                    <span className="font-bold text-gray-900"><SaudiRiyalAmount amount={propertyData.purchasePrice || 0} locale={language === 'ar' ? 'ar-SA' : 'en-US'} /></span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl text-green-700">
                                                    <span className="text-sm font-medium">{t('pm.roi.expectedIncome')}</span>
                                                    <span className="font-bold"><SaudiRiyalAmount amount={0} locale={language === 'ar' ? 'ar-SA' : 'en-US'} /></span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-card border shadow-sm">
                                        <CardContent className="p-6">
                                            <h4 className="text-lg font-bold text-gray-900 mb-2">{t('pm.tab.maintenance')}</h4>
                                            <p className="text-gray-500 text-sm mb-6">{t('pm.maintenance.newPropDesc')}</p>
                                            <div className="flex items-center justify-center p-8 bg-muted rounded-2xl border border-dashed border">
                                                <p className="text-gray-400 text-sm font-medium">{t('pm.maintenance.empty')}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 bg-card border-t border flex justify-between items-center z-10">
                    <Button 
                        variant="outline" 
                        onClick={onClose}
                        className="h-12 px-8 rounded-xl border text-gray-700 hover:bg-muted font-bold"
                    >
                        {t('common.close')}
                    </Button>
                    
                    <div className="flex gap-3">
                         {activeTab !== 'assets' && (
                             <Button 
                                variant="outline"
                                onClick={() => {
                                    const idx = tabItems.findIndex(t => t.id === activeTab);
                                    if(idx > 0) setActiveTab(tabItems[idx-1].id);
                                }}
                                className="h-12 px-6 rounded-xl border text-gray-700 hover:bg-muted font-bold"
                             >
                                <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                                <span className="mx-2">{t('common.prev')}</span>
                             </Button>
                         )}
                         
                         {tabItems.findIndex(t => t.id === activeTab) < tabItems.length - 1 ? (
                            <Button 
                                onClick={() => {
                                    const idx = tabItems.findIndex(t => t.id === activeTab);
                                    if(idx < tabItems.length-1) setActiveTab(tabItems[idx+1].id);
                                }}
                                className="h-12 px-8 bg-slate-900 text-white hover:bg-black rounded-xl shadow-lg font-bold"
                            >
                                <span className="mx-2">{t('common.next')}</span>
                                <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                            </Button>
                         ) : (
                            <Button 
                                onClick={handleSubmit}
                                disabled={loading}
                                className="h-12 px-10 bg-slate-600 text-white hover:bg-slate-700 rounded-xl shadow-lg shadow-blue-600/30 font-bold"
                            >
                                {loading && <Loader2 className="w-5 h-5 me-2 animate-spin" />}
                                {t('common.save')}
                            </Button>
                         )}
                    </div>
                </div>
                </Tabs>
            </div>
      </div>

      
      {/* MAP MODAL */}
      {showMap && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-card w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl ring-1 ring-gray-200 flex flex-col max-h-[90vh]">
               <div className="p-4 border-b border flex justify-between items-center bg-muted">
                   <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                       <MapPin className="w-5 h-5 text-blue-600" />
                       {t('bm.offer.location')}
                   </h3>
                   <Button variant="ghost" size="icon" onClick={() => setShowMap(false)} className="rounded-full">
                       <X className="w-5 h-5" />
                   </Button>
               </div>
               <div className="flex-1 min-h-[400px] relative">
                   <Map 
                      center={mapCoordinates || [24.7136, 46.6753]}
                      zoom={13}
                      interactive={true}
                      onLocationSelect={handleLocationSelect}
                      markerPosition={mapCoordinates || undefined}
                      height="100%"
                      useCurrentLocation={false}
                      showControls={true}
                   />
               </div>
               <div className="p-4 border-t border flex justify-end gap-3 bg-card">
                   <Button variant="outline" onClick={() => setShowMap(false)}>{t('common.close')}</Button>
                   <Button className="bg-slate-600 hover:bg-slate-700 text-white" onClick={confirmLocation}>
                       {t('common.save')}
                   </Button>
               </div>
           </div>
        </div>
      )}
    </div>
  );
}
