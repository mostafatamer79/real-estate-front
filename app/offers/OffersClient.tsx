"use client";

import PullToRefresh from '@/components/shared/PullToRefresh';
import { hapticTick } from "@/lib/haptics";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import AnimatedArtwork from "@/components/cinematic/AnimatedArtwork";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import {
  SlidersHorizontal,
  X,
  Ruler,
  MapPin,
  Calendar,
  AlertCircle,
  ArrowRight,
  LayoutGrid,
  User as UserIcon,
  Clock,
  Building2,
  Home as HomeIcon,
  RotateCcw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { offersApi, bookingsApi } from "@/lib/api";
import { Offer as ApiOffer, Booking } from "@/types/api";
import { User } from "@/types/user";
import ChatButton from "@/components/chat/chat-button";
import { SegmentedTabs, SegmentedList, SegmentedTrigger } from "@/components/ui/mobile-tabs";
import OfferAppointmentsModal from "@/components/modals/offer-appointments-modal";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import styles from "./offers-redesign.module.css";

interface Offer {
  id: string;
  propertyType: string;
  city: string;
  address: string;
  description: string;
  area: number;
  price: number;
  mediaFiles?: string[];
  timeAgo: string;
  createdAt: string;
  additionalNotes?: string;
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

export default function OffersPage({ children }: { children?: React.ReactNode } = {}) {
  const router = useRouter();
  const { t, language, toggleLanguage } = useLanguage();
  const isRtl = language === 'ar';
  const { isOpen, message, isAdmin: isAdminUser } = useSectionGuard('offers');

  // Core State
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "my" | "appointments">("all");

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
  const [, setLoadingBookings] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Accessible element refs
  const filterToggleBtnRef = useRef<HTMLButtonElement>(null);
  const filterDrawerRef = useRef<HTMLDivElement>(null);

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

  const generateTimeAgo = (createdAt: string): string => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return t('property.age.new');
    if (diffInMinutes < 60) return `${diffInMinutes} ${isRtl ? 'دقيقة' : 'min'}`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ${isRtl ? 'ساعة' : 'hr'}`;
    return `${Math.floor(diffInMinutes / 1440)} ${isRtl ? 'يوم' : 'day'}`;
  };

  const generateDescription = (offer: Pick<Offer, "propertyType" | "propertyCondition" | "rooms" | "bathrooms" | "livingRooms" | "area" | "neighborhood" | "city" | "additionalNotes">): string => {
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
    if (offer.rooms) description += `، ${t('orders.rooms')}: ${offer.rooms}`;
    if (offer.bathrooms) description += `، ${t('orders.baths')}: ${offer.bathrooms}`;
    if (offer.livingRooms) description += `، ${t('orders.living')}: ${offer.livingRooms}`;
    description += `. ${isRtl ? 'المساحة' : 'Area'} ${offer.area} ${isRtl ? 'م²' : 'm²'}`;
    if (offer.neighborhood) description += ` ${isRtl ? '، حي' : ', '} ${offer.neighborhood}`;
    if (offer.city) description += `، ${offer.city}`;

    if (offer.additionalNotes) {
      const shortNotes = offer.additionalNotes.length > 90
        ? offer.additionalNotes.substring(0, 90) + '...'
        : offer.additionalNotes;
      description += `. ${shortNotes}`;
    }
    return description;
  };

  const fetchIncomingBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await bookingsApi.findIncoming();
      setIncomingBookings(res.data);
    } catch (err: unknown) {
      const responseErr = err as { response?: { status?: number } };
      if (responseErr?.response?.status === 403) {
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
    } catch (err: unknown) {
      const responseErr = err as { response?: { status?: number } };
      if (responseErr?.response?.status === 403) {
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
      const response = await offersApi.findAll(localStorage.getItem("token") ? undefined : { isActive: true });
      const apiOffers = response.data;
      if (!apiOffers || apiOffers.length === 0) {
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
          mediaFiles: offer.mediaFiles,
          timeAgo: generateTimeAgo(offer.createdAt),
          createdAt: offer.createdAt,
          additionalNotes: offer.additionalNotes,
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
    setPropertyType(prev => prev === type ? null : type);
    setSubtype(null);
  };

  const handleSubtypeSelect = (sub: string) => {
    setSubtype(prev => prev === sub ? null : sub);
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

  // Keep keyboard focus within the visible drawer and restore its actual opener.
  const filterOpenerRef = useRef<HTMLElement | null>(null);
  const openFilters = () => {
    filterOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    hapticTick();
    setIsFilterOpen(true);
  };
  const closeFiltersAndRestoreFocus = () => setIsFilterOpen(false);
  useEffect(() => {
    if (!isFilterOpen) return;
    const panel = filterDrawerRef.current;
    if (!panel) return;
    const fallbackOpener = filterToggleBtnRef.current;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const controls = () => Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href],[tabindex="0"]')).filter(el => el.getClientRects().length > 0);
    controls()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setIsFilterOpen(false); }
      if (event.key === 'Tab') {
        const items = controls(), first = items[0], last = items.at(-1);
        if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
      }
    };
    const wide = matchMedia('(min-width: 1024px)');
    const onResize = () => { if (wide.matches) setIsFilterOpen(false); };
    document.addEventListener('keydown', keydown);
    wide.addEventListener('change', onResize);
    onResize();
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener('keydown', keydown);
      wide.removeEventListener('change', onResize);
      const opener = filterOpenerRef.current;
      if (opener?.isConnected && opener.getClientRects().length) opener.focus();
      else fallbackOpener?.focus();
    };
  }, [isFilterOpen]);

  // Effects
  useEffect(() => {
    const init = () => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
        }
      } catch (err) { console.error(err); }
    };
    init();
    fetchOffers();
    if (localStorage.getItem("token")) {
      fetchIncomingBookings();
      fetchMyBookings();
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    offers, propertyType, subtype, areaFrom, areaTo, city, neighborhood,
    priceFrom, priceTo, propertyAge, direction, propertyCondition,
    furnitureStatus, rooms, bathrooms, hasGarage, hasElevator, hasPool, activeTab, user?.id, incomingBookings, myBookings
  ]);

  // Compute active filter chips list
  const activeChips: Array<{ key: string; label: string; onRemove: () => void }> = [];
  if (propertyType) {
    activeChips.push({
      key: 'propertyType',
      label: propertyType === 'residential' ? t('offers.filter.residential') : t('offers.filter.commercial'),
      onRemove: () => { setPropertyType(null); setSubtype(null); }
    });
  }
  if (subtype) {
    const found = [...residentialSubtypes, ...commercialSubtypes].find(s => s.value === subtype);
    activeChips.push({
      key: 'subtype',
      label: found ? t(found.label) : subtype,
      onRemove: () => setSubtype(null)
    });
  }
  if (city) {
    activeChips.push({
      key: 'city',
      label: `${isRtl ? 'المدينة' : 'City'}: ${city}`,
      onRemove: () => setCity('')
    });
  }
  if (neighborhood) {
    activeChips.push({
      key: 'neighborhood',
      label: `${isRtl ? 'الحي' : 'District'}: ${neighborhood}`,
      onRemove: () => setNeighborhood('')
    });
  }
  if (priceFrom || priceTo) {
    const text = priceFrom && priceTo
      ? `${priceFrom} - ${priceTo} ر.س`
      : priceFrom ? `>= ${priceFrom} ر.س` : `<= ${priceTo} ر.س`;
    activeChips.push({
      key: 'price',
      label: `${isRtl ? 'السعر' : 'Price'}: ${text}`,
      onRemove: () => { setPriceFrom(''); setPriceTo(''); }
    });
  }
  if (areaFrom || areaTo) {
    const text = areaFrom && areaTo
      ? `${areaFrom} - ${areaTo} م²`
      : areaFrom ? `>= ${areaFrom} م²` : `<= ${areaTo} م²`;
    activeChips.push({
      key: 'area',
      label: `${isRtl ? 'المساحة' : 'Area'}: ${text}`,
      onRemove: () => { setAreaFrom(''); setAreaTo(''); }
    });
  }
  if (propertyAge) {
    activeChips.push({
      key: 'age',
      label: propertyAge,
      onRemove: () => setPropertyAge('')
    });
  }
  if (propertyCondition) {
    activeChips.push({
      key: 'condition',
      label: propertyCondition,
      onRemove: () => setPropertyCondition('')
    });
  }

  // Early Returns
  if (!isOpen) {
    return <ComingSoonOverlay sectionName={t('action.offers') || 'العروض'} message={message} isAdmin={isAdminUser} />;
  }

  // Render Filter Form Content
  const renderFilterControls = (isMobileView: boolean) => (
    <div>
      {/* 1. Property Type & Subtype */}
      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>
          {t('offers.filter.type')}
        </label>
        <div className={styles.typeButtonGroup}>
          <button
            type="button"
            onClick={() => handlePropertySelect("residential")}
            aria-pressed={propertyType === "residential"}
            className={`${styles.typeButton} ${
              propertyType === "residential" ? styles.typeButtonActive : ""
            }`}
          >
            {t('offers.filter.residential')}
          </button>
          <button
            type="button"
            onClick={() => handlePropertySelect("commercial")}
            aria-pressed={propertyType === "commercial"}
            className={`${styles.typeButton} ${
              propertyType === "commercial" ? styles.typeButtonActive : ""
            }`}
          >
            {t('offers.filter.commercial')}
          </button>
        </div>

        {propertyType && (
          <div className="pt-2">
            <span className={styles.filterSubLabel}>
              {t('offers.filter.subtype')}
            </span>
            <div className={styles.subtypesWrap}>
              {(propertyType === "residential" ? residentialSubtypes : commercialSubtypes).map((sub) => {
                const isSelected = subtype === sub.value;
                return (
                  <button
                    key={sub.value}
                    type="button"
                    onClick={() => handleSubtypeSelect(sub.value)}
                    aria-pressed={isSelected}
                    className={`${styles.subtypeChip} ${
                      isSelected ? styles.subtypeChipActive : ""
                    }`}
                  >
                    {t(sub.label)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Location */}
      <div className={`${styles.filterSection} ${styles.locationFields}`}>
        <label className={styles.filterLabel}>
          {isRtl ? 'الموقع والمدينة' : 'Location'}
        </label>
        <div className={styles.filterInputGroup}>
          <label htmlFor={isMobileView ? "mobile-filter-city" : "filter-city"} className={styles.filterSubLabel}>
            {isRtl ? 'المدينة' : 'City'}
          </label>
          <Input
            id={isMobileView ? "mobile-filter-city" : "filter-city"}
            type="text"
            className={`${styles.filterInput} oo-input`}
            placeholder={t('offers.filter.enterCity')}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div className={styles.filterInputGroup}>
          <label htmlFor={isMobileView ? "mobile-filter-neighborhood" : "filter-neighborhood"} className={styles.filterSubLabel}>
            {isRtl ? 'الحي' : 'Neighborhood'}
          </label>
          <Input
            id={isMobileView ? "mobile-filter-neighborhood" : "filter-neighborhood"}
            type="text"
            className={`${styles.filterInput} oo-input`}
            placeholder={t('offers.filter.enterDistrict')}
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Budget */}
      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>
          {t('offers.filter.budget')}
        </label>
        <div className={styles.rangeInputsGrid}>
          <div>
            <label htmlFor={isMobileView ? "mobile-priceFrom" : "priceFrom"} className={styles.filterSubLabel}>
              {t('offers.filter.priceMin')}
            </label>
            <Input
              id={isMobileView ? "mobile-priceFrom" : "priceFrom"}
              type="number"
              className={`${styles.filterInput} oo-input`}
              placeholder={isRtl ? 'من (ريال)' : 'From (SAR)'}
              value={priceFrom}
              onChange={(e) => setPriceFrom(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={isMobileView ? "mobile-priceTo" : "priceTo"} className={styles.filterSubLabel}>
              {t('offers.filter.priceMax')}
            </label>
            <Input
              id={isMobileView ? "mobile-priceTo" : "priceTo"}
              type="number"
              className={`${styles.filterInput} oo-input`}
              placeholder={isRtl ? 'إلى (ريال)' : 'To (SAR)'}
              value={priceTo}
              onChange={(e) => setPriceTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 4. Area */}
      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>
          {isRtl ? 'المساحة (م²)' : 'Area (m²)'}
        </label>
        <div className={styles.rangeInputsGrid}>
          <div>
            <label htmlFor={isMobileView ? "mobile-areaFrom" : "areaFrom"} className={styles.filterSubLabel}>
              {t('offers.filter.areaMin')}
            </label>
            <Input
              id={isMobileView ? "mobile-areaFrom" : "areaFrom"}
              type="number"
              className={`${styles.filterInput} oo-input`}
              placeholder={isRtl ? 'من (م²)' : 'From (m²)'}
              value={areaFrom}
              onChange={(e) => setAreaFrom(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={isMobileView ? "mobile-areaTo" : "areaTo"} className={styles.filterSubLabel}>
              {t('offers.filter.areaMax')}
            </label>
            <Input
              id={isMobileView ? "mobile-areaTo" : "areaTo"}
              type="number"
              className={`${styles.filterInput} oo-input`}
              placeholder={isRtl ? 'إلى (م²)' : 'To (m²)'}
              value={areaTo}
              onChange={(e) => setAreaTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 5. Advanced Criteria */}
      <div className={styles.filterSection}>
        <button type="button" className={styles.advancedToggle}
          aria-expanded={advancedOpen}
          aria-controls={isMobileView ? "mobile-advanced-fields" : "advanced-fields"}
          onClick={() => setAdvancedOpen(open => !open)}>

          {isRtl ? 'مواصفات إضافية' : 'Advanced Criteria'}
          <span aria-hidden="true">{advancedOpen ? '−' : '+'}</span>
        </button>
        <div id={isMobileView ? "mobile-advanced-fields" : "advanced-fields"} hidden={!advancedOpen} className={styles.advancedFields}>

        <div className={styles.filterInputGroup}>
          <label htmlFor={isMobileView ? "mobile-filter-age" : "filter-age"} className={styles.filterSubLabel}>
            {t('orders.age')}
          </label>
          <select
            id={isMobileView ? "mobile-filter-age" : "filter-age"}
            value={propertyAge}
            onChange={(e) => setPropertyAge(e.target.value)}
            className={styles.nativeSelect}
          >
            <option value="">{t('common.select')}</option>
            {propertyAges.map(item => <option key={item.value} value={item.value}>{t(item.label)}</option>)}
          </select>
        </div>

        <div className={styles.filterInputGroup}>
          <label htmlFor={isMobileView ? "mobile-filter-direction" : "filter-direction"} className={styles.filterSubLabel}>
            {t('offers.filter.direction')}
          </label>
          <select
            id={isMobileView ? "mobile-filter-direction" : "filter-direction"}
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className={styles.nativeSelect}
          >
            <option value="">{t('common.select')}</option>
            {directions.map(item => <option key={item.value} value={item.value}>{t(item.label)}</option>)}
          </select>
        </div>

        <div className={styles.filterInputGroup}>
          <label htmlFor={isMobileView ? "mobile-filter-condition" : "filter-condition"} className={styles.filterSubLabel}>
            {isRtl ? 'حالة العقار' : 'Property Condition'}
          </label>
          <select
            id={isMobileView ? "mobile-filter-condition" : "filter-condition"}
            value={propertyCondition}
            onChange={(e) => setPropertyCondition(e.target.value)}
            className={styles.nativeSelect}
          >
            <option value="">{t('common.select')}</option>
            {propertyConditions.map(item => <option key={item.value} value={item.value}>{t(item.label)}</option>)}
          </select>
        </div>
      </div>
      </div>

      {/* Action buttons */}
      <div className={isMobileView ? styles.drawerActions : "pt-2 space-y-2"}>
        {isMobileView && (
          <button
            type="button"
            onClick={closeFiltersAndRestoreFocus}
            className={styles.drawerSubmitBtn}
          >
            {t('offers.filter.showResults')} ({filteredOffers.length})
          </button>
        )}
        <button
          type="button"
          onClick={resetFilters}
          className={isMobileView ? styles.drawerResetBtn : styles.stateBtn}
          style={!isMobileView ? { width: '100%', justifyContent: 'center' } : undefined}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('offers.filter.clearAll')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <PullToRefresh onRefresh={fetchOffers}>
      <section
        className={`${styles.offersPage} offers-page-root calm-page calm-screen w-full min-h-dvh-safe relative flex flex-col`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Subtle Ambient Atmosphere */}
        <div className={styles.ambientBackground} aria-hidden="true">
          <div className={styles.ambientGlow} />
          <div className={styles.architecturalGrid} />
        </div>

        <nav className={styles.mobileNav} aria-label={isRtl ? 'خيارات الصفحة' : 'Page options'}><span>{t('action.offers')}</span><button type="button" onClick={toggleLanguage} aria-label={isRtl ? 'Switch to English' : 'التبديل إلى العربية'}>{isRtl ? 'EN' : 'ع'}</button></nav>

        {/* Mobile Filter Drawer (Accessible Dialog) — Rendered within root so tokens inherit */}
        {isFilterOpen && (
          <div
            className={styles.drawerModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="offers-mobile-filters-heading"
          >
            {/* Backdrop */}
            <div
              className={styles.drawerBackdrop}
              onClick={closeFiltersAndRestoreFocus}
              aria-hidden="true"
            />
            {/* Drawer Panel */}
            <div
              ref={filterDrawerRef}
              className={styles.drawerPanel}
            >
              <div className={styles.drawerHeader}>
                <div className={styles.drawerTitle}>
                  <SlidersHorizontal className="w-5 h-5 text-[var(--oo-gold-deep)]" />
                  <h2 id="offers-mobile-filters-heading">
                    {t('offers.filter.title')}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeFiltersAndRestoreFocus}
                  aria-label={t('offers.filter.close')}
                  className={styles.drawerCloseBtn}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderFilterControls(true)}
            </div>
          </div>
        )}

        <div className={styles.offersShell}>
          {/* Architectural Editorial Hero Section */}
          <div className={styles.heroSection}>
            <div className={styles.heroGrid}>
              {/* Content Narrative Card */}
              <div className={styles.heroContentCard}>
                <div>
                  <div className={styles.heroTopRow}>
                    <div className={styles.heroOrientationPill}>
                      <span className={styles.goldPulseDot} />
                      <span>{isRtl ? 'بوابة العروض العقارية' : 'Property offers'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push('/details')}
                      className={styles.backButton}
                      aria-label={t('common.back')}
                    >
                      <ArrowRight className={`w-4 h-4 ${!isRtl ? 'rotate-180' : ''}`} />
                      <span>{t('common.back')}</span>
                    </button>
                  </div>

                  <h1 className={styles.heroHeading}>
                    {t('offers.hero.title') || (isRtl ? 'المكان المناسب يبدأ من هنا' : 'The right place starts here')}
                  </h1>

                  <p className={styles.heroSubtitle}>
                    {isRtl ? 'استكشف العروض العقارية، قارن المواصفات، وتابع مواعيدك من مكان واحد.' : 'Explore property offers, compare the details, and keep track of your appointments.'}
                  </p>
                </div>

                <div className={styles.heroBottomBar}>
                  <div className={styles.heroStatsBadge}>
                    <span className={styles.heroStatsNumber}>{filteredOffers.length}</span>
                    <span>{t('offers.resultsCount')}</span>
                  </div>

                  <button
                    type="button"
                    onClick={openFilters}
                    ref={filterToggleBtnRef}
                    aria-label={t('offers.filter.open')}
                    aria-haspopup="dialog"
                    aria-expanded={isFilterOpen}
                    className={styles.heroMobileFilterBtn}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>{t('offers.hero.cta')}</span>
                  </button>
                </div>
              </div>

              {/* 3D Pavilion Artwork Stage — Using NEW /artworks/offers-pavilion-v1.webp exclusively */}
              <div className={styles.heroArtworkStage}>
                <div className={styles.artworkContainer}>
                  <AnimatedArtwork
                    src="/artworks/offers-pavilion-v1.webp"
                    alt={isRtl ? "تصور بصري لمجسم جناح العروض العقارية" : "Architectural pavilion concept"}
                    priority
                    sizes="(max-width: 1023px) 100vw, 600px"
                  />
                </div>
                <span className={styles.heroArtworkBadge}>
                  {isRtl ? 'تصور معماري استكشافي' : 'Illustrative architectural pavilion concept'}
                </span>
              </div>
            </div>
          </div>

          {children}

          {/* Main Discovery Workspace Grid */}
          <div className={styles.workspaceGrid}>
            {/* Desktop Sticky Sidebar */}
            <aside
              className={styles.filterSidebar}
              aria-label={t('offers.filter.title')}
            >
              <div className={styles.sidebarHeader}>
                <div className={styles.sidebarTitle}>
                  <SlidersHorizontal className="w-4 h-4 text-[var(--oo-gold-deep)]" />
                  <h2>{t('offers.filter.title')}</h2>
                </div>
                {activeChips.length > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className={styles.clearFiltersLink}
                  >
                    {t('offers.filter.clearAll')}
                  </button>
                )}
              </div>
              {renderFilterControls(false)}
            </aside>

            {/* Results Column */}
            <main className={styles.resultsColumn}>
              {/* Results Toolbar & Tabs */}
              <div className={styles.toolbarRow}>
                {user?.id ? (
                  <SegmentedTabs
                    value={activeTab}
                    onValueChange={(val) => setActiveTab(val as "all" | "my" | "appointments")}
                    className="w-full sm:w-auto"
                    dir={isRtl ? 'rtl' : 'ltr'}
                  >
                    <SegmentedList className={`${styles.tabsList} grid grid-cols-2 gap-1 w-full sm:w-80`}>
                      <SegmentedTrigger
                        value="all"
                        className={`${styles.tabTrigger} flex items-center justify-center gap-2`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>{t('offers.allOffers')}</span>
                      </SegmentedTrigger>
                      <SegmentedTrigger
                        value="appointments"
                        className={`${styles.tabTrigger} flex items-center justify-center gap-2`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'مواعيدي' : 'My Appointments'}</span>
                      </SegmentedTrigger>
                    </SegmentedList>
                  </SegmentedTabs>
                ) : (
                  <div className={styles.guestBrowseHeading}>
                    {t('offers.allOffers')}
                  </div>
                )}

                {/* Real Result count */}
                <div className={styles.resultsCount}>
                  <span className={styles.resultsCountNumber}>
                    {filteredOffers.length}
                  </span>
                  <span>{t('offers.resultsCount')}</span>
                </div>
              </div>

              {/* Active Filter Chips Bar */}
              {activeChips.length > 0 && (
                <div className={styles.activeChipsBar}>
                  <span className={styles.activeChipsTitle}>
                    {t('offers.filter.activeFilters')}
                  </span>
                  {activeChips.map((chip) => (
                    <span
                      key={chip.key}
                      className={styles.chipTag}
                    >
                      <span>{chip.label}</span>
                      <button
                        type="button"
                        onClick={chip.onRemove}
                        aria-label={`Remove filter ${chip.label}`}
                        className={styles.chipRemoveBtn}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={resetFilters}
                    className={`${styles.clearFiltersLink} ms-auto`}
                  >
                    {t('offers.filter.clearAll')}
                  </button>
                </div>
              )}

              {/* Upcoming Appointments Summary (when appointments tab active) */}
              {activeTab === "appointments" && user?.id && (incomingBookings.length > 0 || myBookings.length > 0) && (
                <div className={styles.appointmentsPreviewBox}>
                  <div className={styles.appointmentsHeader}>
                    <div className={styles.appointmentsIconWrap}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={styles.appointmentsTitle}>
                        {isRtl ? 'المواعيد القادمة' : 'Upcoming Appointments'}
                      </h3>
                      <p className={styles.appointmentsSubtitle}>
                        {isRtl
                          ? `لديك ${incomingBookings.length + myBookings.length} مواعيد مجدولة`
                          : `You have ${incomingBookings.length + myBookings.length} scheduled appointments`}
                      </p>
                    </div>
                  </div>
                  <div className={styles.appointmentsGrid}>
                    {[...incomingBookings, ...myBookings]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 3)
                      .map((booking) => {
                        const isIncoming = incomingBookings.some(ib => ib.id === booking.id);
                        const bookingOffer = booking.offer as ApiOfferWithUser | undefined;
                        return (
                          <div
                            key={booking.id}
                            className={styles.appointmentCard}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  booking.status === 'confirmed'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : booking.status === 'pending'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {booking.status}
                              </span>
                              <span className="text-[10px] text-[var(--oo-text-secondary)]">
                                {new Date(booking.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-[var(--oo-text-main)] mb-1 truncate">
                              {booking.offer
                                ? `${booking.offer.propertyType} - ${booking.offer.city}`
                                : (isRtl ? 'عقار' : 'Property')}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-[var(--oo-text-secondary)]">
                              <UserIcon className="w-3 h-3" />
                              <span>
                                {isIncoming
                                  ? (booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : 'User')
                                  : (bookingOffer?.user ? `${bookingOffer.user.firstName} ${bookingOffer.user.lastName}` : (isRtl ? 'المالك' : 'Owner'))}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Loading Skeletons */}
              {loading && (
                <div className={styles.offersList}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={styles.skeletonCard}>
                      <div className={styles.skeletonThumbnail} />
                      <div className={styles.skeletonBody}>
                        <div className="space-y-3">
                          <div className={`${styles.skeletonLine} h-5 w-2/3`} />
                          <div className={`${styles.skeletonLine} h-4 w-1/3`} />
                          <div className={`${styles.skeletonLine} h-3.5 w-full`} />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <div className={`${styles.skeletonLine} h-9 w-28`} />
                          <div className={`${styles.skeletonLine} h-9 w-28`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className={styles.stateCard}>
                  <div className={styles.stateIconWrap}>
                    <AlertCircle className="w-7 h-7 text-rose-500" />
                  </div>
                  <h3 className={styles.stateTitle}>
                    {isRtl ? 'حدث خطأ أثناء تحميل العروض' : 'Error loading offers'}
                  </h3>
                  <p className={styles.stateDesc}>{error}</p>
                  <button
                    type="button"
                    onClick={fetchOffers}
                    className={styles.stateBtn}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t('offers.retry')}</span>
                  </button>
                </div>
              )}

              {/* Loaded Offers List */}
              {!loading && !error && (
                <div className={styles.offersList}>
                  {filteredOffers.length > 0 ? (
                    filteredOffers.map((offer) => {
                      const sellerName = offer.user
                        ? `${offer.user.firstName || ''} ${offer.user.lastName || ''}`.trim()
                        : t('offers.owner');
                      const hasImage = offer.mediaFiles && offer.mediaFiles.length > 0 && !!offer.mediaFiles[0];

                      return (
                        <article
                          key={offer.id}
                          className={styles.offerCard}
                        >
                          {/* Media container 16/10 proportion */}
                          <div className={`${styles.offerThumbnailStage} ${!hasImage ? styles.thumbnailEmpty : ""}`}>
                            {hasImage ? (
                              <Image
                                src={offer.mediaFiles![0]}
                                alt={offer.address}
                                fill
                                sizes="(max-width: 767px) 100vw, 260px"
                                unoptimized={/^https?:\/\//i.test(offer.mediaFiles![0])}
                                className={styles.offerThumbnailImg}
                              />
                            ) : (
                              <div className={styles.noImagePlaceholder}>
                                <Building2 className={styles.noImageIcon} />
                                <span className={styles.noImageType}>
                                  {offer.propertyType}
                                </span>
                                <span className={styles.noImageTruthfulText}>
                                  {isRtl ? 'لا توجد صورة متوفرة' : 'No photo available'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Content Body */}
                          <div className={styles.offerCardBody}>
                            <div>
                              {/* Title & Badge */}
                              <div className={styles.cardHeaderRow}>
                                <h2 className={styles.offerCardTitle}>
                                  {offer.address}
                                </h2>
                                <span className={styles.propertyTypeTag}>
                                  {offer.propertyType}
                                </span>
                              </div>

                              {/* Location & Metadata */}
                              <div className={styles.metaInfoRow}>
                                <span className={styles.metaItem}>
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{offer.city}{offer.neighborhood ? ` - ${offer.neighborhood}` : ''}</span>
                                </span>
                                <span className={styles.metaDivider}>•</span>
                                <span className={styles.metaItem}>
                                  <UserIcon className="w-3.5 h-3.5" />
                                  <span>{sellerName}</span>
                                </span>
                                <span className={styles.metaDivider}>•</span>
                                <span className={styles.metaItem}>
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{generateTimeAgo(offer.createdAt)}</span>
                                </span>
                              </div>

                              {/* Description */}
                              <p className={styles.offerDescription}>
                                {generateDescription(offer)}
                              </p>

                              {/* Specifications Chips */}
                              <div className={styles.specsChipsRow}>
                                <span className={styles.specChip}>
                                  <Ruler className="w-3 h-3 text-[var(--oo-gold-deep)]" />
                                  <span>{offer.area} م²</span>
                                </span>
                                {offer.rooms && (
                                  <span className={styles.specChip}>
                                    {offer.rooms} {isRtl ? 'غرف' : 'rooms'}
                                  </span>
                                )}
                                {offer.bathrooms && (
                                  <span className={styles.specChip}>
                                    {offer.bathrooms} {isRtl ? 'حمامات' : 'baths'}
                                  </span>
                                )}
                                {offer.propertyCondition && (
                                  <span className={styles.specChip}>
                                    {offer.propertyCondition}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Bottom Row: Price & Actions */}
                            <div className={styles.cardFooterRow}>
                              {/* Price */}
                              <div className={styles.priceDisplay}>
                                {offer.price > 0 ? (
                                  <div className="flex items-baseline gap-1.5">
                                    <span className={styles.priceNumber}>
                                      <SaudiRiyalAmount amount={offer.price} locale={isRtl ? 'ar-SA' : 'en-US'} />
                                    </span>
                                  </div>
                                ) : (
                                  <span className={styles.priceOnContact}>
                                    {t('offers.priceOnContact')}
                                  </span>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className={styles.cardActionGroup}>
                                <button
                                  type="button"
                                  onClick={() => { hapticTick(); router.push(`/offers/${offer.id}`); }}
                                  className={styles.detailsBtn}
                                >
                                  {t('offers.details')}
                                </button>

                                {(user?.id === offer.userId || user?.id === offer.user?.id) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedOfferId(offer.id);
                                      setSelectedOfferTitle(offer.address);
                                      setIsAppointmentsModalOpen(true);
                                    }}
                                    className={styles.appointmentsBtn}
                                  >
                                    {isRtl ? 'عرض المواعيد' : 'View Appointments'}
                                  </button>
                                )}

                                {user && offer.userId && offer.user && user.id !== offer.userId && (
                                  <ChatButton
                                    offerId={offer.id}
                                    offerTitle={`${offer.propertyType} في ${offer.city}`}
                                    sellerId={offer.userId}
                                    sellerName={offer.user ? `${offer.user.firstName} ${offer.user.lastName}` : 'المعلن'}
                                    userId={user.id}
                                    userName={user.firstName || ''}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    /* Empty States */
                    <div className={styles.stateCard}>
                      <div className={styles.stateIconWrap}>
                        <HomeIcon className="w-7 h-7 text-[var(--oo-gold-deep)]" />
                      </div>
                      <h3 className={styles.stateTitle}>
                        {activeTab === 'appointments'
                          ? t('offers.noAppointments')
                          : (offers.length === 0 ? (isRtl ? 'لا توجد عروض متاحة حالياً' : 'No offers available at the moment') : t('offers.noOffers'))}
                      </h3>
                      <p className={styles.stateDesc}>
                        {activeTab === 'appointments'
                          ? t('offers.noAppointmentsSubtitle')
                          : (offers.length === 0 ? (isRtl ? 'يرجى مراجعة الموقع لاحقاً للاطلاع على العروض الجديدة.' : 'Please check back later for newly published offers.') : t('offers.noOffersSubtitle'))}
                      </p>
                      {offers.length > 0 && activeTab !== 'appointments' && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className={styles.stateBtn}
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>{t('offers.filter.clearAll')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>

        <OfferAppointmentsModal
          isOpen={isAppointmentsModalOpen}
          onClose={() => setIsAppointmentsModalOpen(false)}
          offerId={selectedOfferId}
          propertyTitle={selectedOfferTitle}
        />
      </section>
    </PullToRefresh>
  );
}
