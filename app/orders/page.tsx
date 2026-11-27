"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ordersApi } from "@/lib/api";
import { CreateOrderDto, Order } from "@/types/api";
import { TabsContent } from "@/components/ui/tabs";
import { SegmentedTabs, SegmentedList, SegmentedTrigger } from "@/components/ui/mobile-tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import {
  Loader2,
  ArrowRight,
  PlusCircle,
  List,
  MapPin,
  Ruler,
  Calendar,
  Trash2,
  ExternalLink,
  Home,
  Building,
  Bed,
  Bath,
  Building2,
  Compass
} from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";
import styles from "./orders-redesign.module.css";
import RequestInspiration from "@/components/orders/RequestInspiration";

const PROPERTY_TYPES = [
  { value: "شقة", label: "property.type.apartment" },
  { value: "فيلا", label: "property.type.villa" },
  { value: "قصر", label: "property.type.palace" },
  { value: "أرض", label: "property.type.land" },
  { value: "عمارة", label: "property.type.building" },
  { value: "استراحة", label: "property.type.restHouse" },
  { value: "محل تجاري", label: "property.type.shop" },
  { value: "مكتب", label: "property.type.office" },
  { value: "مستودع", label: "property.type.warehouse" }
];

const DEED_TYPES = [
  { value: "electronic", label: "property.deed.electronic" },
  { value: "paper", label: "property.deed.paper" },
  { value: "other", label: "property.deed.other" }
];

const PROPERTY_AGES = [
  { value: "جديد", label: "property.age.new" },
  { value: "أقل من 5 سنوات", label: "property.age.less5" },
  { value: "5-10 سنوات", label: "property.age.5to10" },
  { value: "10-20 سنة", label: "property.age.10to20" },
  { value: "أكثر من 20 سنة", label: "property.age.more20" }
];

const INITIAL_FORM_STATE: CreateOrderDto = {
  orderType: "buy",
  propertyType: "شقة",
  city: "",
  neighborhood: "",
  area: 0,
  propertyAge: "جديد",
  deedType: "electronic",
  price: 0,
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
  additionalDetails: ""
};

const DEPT_NAMES: Record<string, string> = {
  marketing: "إدارة التسويق",
  properties: "إدارة الاملاك",
  finance: "الإدارة المالية",
  legal: "الإدارة القانونية",
  employees: "إدارة الموظفين"
};

export default function OrdersPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const confirmDialog = useConfirmDialog();
  const { isOpen, message, isAdmin } = useSectionGuard("orders");

  const [activeTab, setActiveTab] = useState("create");
  const [formData, setFormData] = useState<CreateOrderDto>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);
  const [isDeptUser, setIsDeptUser] = useState(false);
  const [deptName, setDeptName] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.department) {
          setIsDeptUser(true);
          setDeptName(DEPT_NAMES[parsed.department] ?? parsed.department);
        }
      }
    } catch {}
  }, []);

  const fetchMyOrders = useCallback(async () => {
    try {
      setLoadingMyOrders(true);
      const response = await ordersApi.findMyOrders();
      setMyOrders(response.data || []);
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "response" in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 403) {
          setMyOrders([]);
          return;
        }
      }
      console.error("Error fetching my orders:", error);
      toast.error(t("orders.error"));
    } finally {
      setLoadingMyOrders(false);
    }
  }, [t]);

  useEffect(() => {
    if (activeTab === "my-orders") {
      void fetchMyOrders();
    }
  }, [activeTab, fetchMyOrders]);

  const handleChange = <K extends keyof CreateOrderDto>(field: K, value: CreateOrderDto[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.city || !formData.city.trim()) {
      newErrors.city = t("orders.validation.cityRequired");
    }
    if (!formData.neighborhood || !formData.neighborhood.trim()) {
      newErrors.neighborhood = t("orders.validation.neighborhoodRequired");
    }
    if (!formData.area || Number(formData.area) <= 0) {
      newErrors.area = t("orders.validation.areaRequired");
    }
    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = t("orders.validation.priceRequired");
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const targetElement = document.getElementById(`order-field-${firstErrorField}`);
      if (targetElement) {
        const prefersReducedMotion =
          typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        targetElement.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "center"
        });
        targetElement.focus();
      }
      toast.error(t("orders.validation.summary"));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await ordersApi.create(formData);
      toast.success(t("orders.success"));
      setFormData(INITIAL_FORM_STATE);
      setErrors({});
      setActiveTab("my-orders");
    } catch (err: unknown) {
      console.error("Order creation error:", err);
      const responseError = err as { response?: { data?: { message?: unknown } } };
      const serverMessage = responseError?.response?.data?.message;
      const msg = typeof serverMessage === 'string' ? serverMessage : Array.isArray(serverMessage) ? serverMessage.filter(value => typeof value === 'string').join('، ') : t("orders.error");
      setSubmitError(msg || t("orders.error"));
      toast.error(msg || t("orders.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    const ok = await confirmDialog({
      title: t("common.confirmDelete"),
      confirmLabel: language === "ar" ? "حذف" : "Delete",
      cancelLabel: language === "ar" ? "إلغاء" : "Cancel",
      destructive: true
    });
    if (!ok) return;

    try {
      await ordersApi.delete(id);
      toast.success(t("common.deletedSuccess"));
      setMyOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err: unknown) {
      console.error("Error deleting order:", err);
      toast.error(t("common.deleteError"));
    }
  };

  const showDetailedFields = ["فيلا", "قصر", "شقة"].includes(formData.propertyType);

  if (!isOpen) {
    return (
      <ComingSoonOverlay
        sectionName={t("action.requests") || "الطلبات"}
        message={message}
        isAdmin={isAdmin}
      />
    );
  }

  const selectedPropertyLabel =
    PROPERTY_TYPES.find((p) => p.value === formData.propertyType)?.label ?? "";

  return (
    <div
      className={`orders-page-root ${styles.ordersPage}`}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Background Architectural Grid Pattern */}
      <div className={styles.architecturalBackdrop} aria-hidden="true">
        <div className={styles.architecturalGrid} />
      </div>

      <div className={styles.ordersShell}>
        {/* Top Navigation & Context Bar */}
        <div className={styles.topBar}>
          <button
            type="button"
            onClick={() => router.push("/details")}
            className={styles.backBtn}
            aria-label={t("common.back")}
          >
            <ArrowRight
              className={`w-4 h-4 shrink-0 transition-transform ${language === "en" ? "rotate-180" : ""}`}
            />
            <span>{t("common.back")}</span>
          </button>

          {isDeptUser && deptName && (
            <div className={styles.deptBadge}>
              <Building2 className="w-3.5 h-3.5" />
              <span>{deptName}</span>
            </div>
          )}
        </div>

        {/* Dynamic Editorial Masthead */}
        <header className={`${styles.editorialHeader} ${styles.revealIntro}`}>
          <div className={styles.headerKicker}>
            <Compass className="w-3.5 h-3.5" />
            <span>{language === "ar" ? "بوابة العمليات والطلبات العقارية" : "Property Operations Workspace"}</span>
          </div>
          <h1 className={styles.headerTitle}>
            {activeTab === "create" ? t("orders.titleCreate") : t("orders.titleMy")}
          </h1>
          <p className={styles.headerSubtitle}>
            {activeTab === "create" ? t("orders.subtitleCreate") : t("orders.subtitleMy")}
          </p>
        </header>

        {/* Segmented Tab Controls */}
        <div className={styles.tabsWrapper}>
          <SegmentedTabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            <SegmentedList className={styles.tabsListCustom}>
              <SegmentedTrigger
                value="create"
                className={styles.tabTriggerCustom}
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span>{t("orders.createOrder")}</span>
              </SegmentedTrigger>
              <SegmentedTrigger
                value="my-orders"
                className={styles.tabTriggerCustom}
              >
                <List className="w-4 h-4 shrink-0" />
                <span>{t("orders.myOrders")}</span>
              </SegmentedTrigger>
            </SegmentedList>

            {/* TAB 1: Create Order Form Workspace */}
            <TabsContent value="create" className="focus-visible:outline-none">
              <div className={styles.workspaceGrid}>
                <aside className={styles.orientationRail} aria-label={language === "ar" ? "تصوّر عقارك القادم" : "Imagine your next property"}>
                  <RequestInspiration
                    isArabic={language === "ar"}
                    property={selectedPropertyLabel ? t(selectedPropertyLabel) : formData.propertyType}
                    city={formData.city}
                    neighborhood={formData.neighborhood}
                    isRent={formData.orderType === "rent"}
                  />
                </aside>

                {/* Column 2: Main Form Card */}
                <div className={styles.formCard}>
                  <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
                    {submitError && <p role="alert" className={styles.submitError}>{submitError}</p>}
                    {/* Group 01: Purpose & Property Type */}
                    <section id="order-group-01" className={styles.groupSectionFirst}>
                      <div className={styles.groupHeadingRow}>
                        <span className={styles.groupNumberBadge}>01</span>
                        <h2 className={styles.groupTitle}>
                          {t("orders.group.purposeAndType")}
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Purpose Toggle (Buy / Rent) */}
                        <div className="space-y-2 md:col-span-2">
                          <Label className={styles.fieldLabel}>
                            {t("orders.requestPurpose")} <span className="text-red-500">*</span>
                          </Label>
                          <div
                            className={styles.purposeGrid}
                            role="radiogroup"
                            aria-label={t("orders.requestPurpose")}
                          >
                            <button
                              type="button"
                              role="radio"
                              aria-checked={formData.orderType === "buy"}
                              onClick={() => handleChange("orderType", "buy")}
                              className={styles.purposeButton}
                              data-selected={formData.orderType === "buy"}
                            >
                              <Home className="w-4 h-4 shrink-0" />
                              <span>{t("orders.buy")}</span>
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={formData.orderType === "rent"}
                              onClick={() => handleChange("orderType", "rent")}
                              className={styles.purposeButton}
                              data-selected={formData.orderType === "rent"}
                            >
                              <Building className="w-4 h-4 shrink-0" />
                              <span>{t("orders.rent")}</span>
                            </button>
                          </div>
                        </div>

                        {/* Property Type */}
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="order-field-propertyType"
                            className={styles.fieldLabel}
                          >
                            {t("orders.propType")} <span className="text-red-500">*</span>
                          </Label>
                          <Select dir={language === "ar" ? "rtl" : "ltr"}
                            value={formData.propertyType}
                            onValueChange={(val) => handleChange("propertyType", val)}
                          >
                            <SelectTrigger
                              id="order-field-propertyType"
                              className="oo-input h-11 font-medium bg-[var(--oo-surface)] border-[var(--oo-border)]"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir={language === "ar" ? "rtl" : "ltr"} className={styles.selectPopup}>
                              {PROPERTY_TYPES.map((pType) => (
                                <SelectItem key={pType.value} value={pType.value}>
                                  {t(pType.label)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Deed Type */}
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="order-field-deedType"
                            className={styles.fieldLabel}
                          >
                            {t("orders.deed")}
                          </Label>
                          <Select dir={language === "ar" ? "rtl" : "ltr"}
                            value={formData.deedType}
                            onValueChange={(val) => handleChange("deedType", val)}
                          >
                            <SelectTrigger
                              id="order-field-deedType"
                              className="oo-input h-11 font-medium bg-[var(--oo-surface)] border-[var(--oo-border)]"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir={language === "ar" ? "rtl" : "ltr"} className={styles.selectPopup}>
                              {DEED_TYPES.map((dType) => (
                                <SelectItem key={dType.value} value={dType.value}>
                                  {t(dType.label)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </section>

                    {/* Group 02: Location */}
                    <section id="order-group-02" className={styles.groupSection}>
                      <div className={styles.groupHeadingRow}>
                        <span className={styles.groupNumberBadge}>02</span>
                        <h2 className={styles.groupTitle}>{t("orders.group.location")}</h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* City */}
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="order-field-city"
                            className={styles.fieldLabel}
                          >
                            {t("orders.city")} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="order-field-city"
                            value={formData.city}
                            onChange={(e) => handleChange("city", e.target.value)}
                            placeholder={language === "ar" ? "مثال: الرياض" : "e.g. Riyadh"}
                            className={`oo-input h-11 font-medium bg-[var(--oo-surface)] border-[var(--oo-border)] ${
                              errors.city ? "oo-input-error border-red-500" : ""
                            }`}
                            aria-invalid={!!errors.city}
                            aria-describedby={errors.city ? "order-field-city-error" : undefined}
                          />
                          {errors.city && (
                            <p
                              id="order-field-city-error"
                              className="text-xs font-semibold text-[var(--oo-status-error-text)]"
                            >
                              {errors.city}
                            </p>
                          )}
                        </div>

                        {/* Neighborhood */}
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="order-field-neighborhood"
                            className={styles.fieldLabel}
                          >
                            {t("orders.neighborhood")} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="order-field-neighborhood"
                            value={formData.neighborhood}
                            onChange={(e) => handleChange("neighborhood", e.target.value)}
                            placeholder={language === "ar" ? "مثال: الملقا" : "e.g. Al-Malqa"}
                            className={`oo-input h-11 font-medium bg-[var(--oo-surface)] border-[var(--oo-border)] ${
                              errors.neighborhood ? "oo-input-error border-red-500" : ""
                            }`}
                            aria-invalid={!!errors.neighborhood}
                            aria-describedby={errors.neighborhood ? "order-field-neighborhood-error" : undefined}
                          />
                          {errors.neighborhood && (
                            <p
                              id="order-field-neighborhood-error"
                              className="text-xs font-semibold text-[var(--oo-status-error-text)]"
                            >
                              {errors.neighborhood}
                            </p>
                          )}
                        </div>
                      </div>
                    </section>

                    {/* Group 03: Budget & Area */}
                    <section id="order-group-03" className={styles.groupSection}>
                      <div className={styles.groupHeadingRow}>
                        <span className={styles.groupNumberBadge}>03</span>
                        <h2 className={styles.groupTitle}>{t("orders.group.budgetAndArea")}</h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Area */}
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="order-field-area"
                            className={styles.fieldLabel}
                          >
                            {t("orders.area")} <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="order-field-area"
                              type="number"
                              min="1"
                              value={formData.area || ""}
                              onChange={(e) => handleChange("area", Number(e.target.value))}
                              placeholder={language === "ar" ? "مثلاً ٢٥٠" : "e.g. 250"}
                              className={`oo-input h-11 font-medium bg-[var(--oo-surface)] border-[var(--oo-border)] ${
                                language === "ar" ? "pl-12" : "pr-12"
                              } ${errors.area ? "oo-input-error border-red-500" : ""}`}
                              aria-invalid={!!errors.area}
                              aria-describedby={errors.area ? "order-field-area-error" : undefined}
                            />
                            <span
                              className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--oo-text-secondary)] pointer-events-none ${
                                language === "ar" ? "left-3" : "right-3"
                              }`}
                            >
                              {t("orders.unit.sqm")}
                            </span>
                          </div>
                          {errors.area && (
                            <p
                              id="order-field-area-error"
                              className="text-xs font-semibold text-[var(--oo-status-error-text)]"
                            >
                              {errors.area}
                            </p>
                          )}
                        </div>

                        {/* Price / Budget */}
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="order-field-price"
                            className={styles.fieldLabel}
                          >
                            {t("orders.price")} <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="order-field-price"
                              type="number"
                              min="1"
                              value={formData.price || ""}
                              onChange={(e) => handleChange("price", Number(e.target.value))}
                              placeholder={language === "ar" ? "مثلاً ٥٠٠٠٠٠" : "e.g. 500000"}
                              className={`oo-input h-11 font-medium bg-[var(--oo-surface)] border-[var(--oo-border)] ${
                                language === "ar" ? "pl-14" : "pr-14"
                              } ${errors.price ? "oo-input-error border-red-500" : ""}`}
                              aria-invalid={!!errors.price}
                              aria-describedby={errors.price ? "order-field-price-error" : undefined}
                            />
                            <span
                              className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--oo-text-secondary)] pointer-events-none ${
                                language === "ar" ? "left-3" : "right-3"
                              }`}
                            >
                              {t("orders.unit.sar")}
                            </span>
                          </div>
                          {errors.price && (
                            <p
                              id="order-field-price-error"
                              className="text-xs font-semibold text-[var(--oo-status-error-text)]"
                            >
                              {errors.price}
                            </p>
                          )}
                        </div>

                        {/* Property Age */}
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="order-field-propertyAge"
                            className={styles.fieldLabel}
                          >
                            {t("orders.age")}
                          </Label>
                          <Select dir={language === "ar" ? "rtl" : "ltr"}
                            value={formData.propertyAge}
                            onValueChange={(val) => handleChange("propertyAge", val)}
                          >
                            <SelectTrigger
                              id="order-field-propertyAge"
                              className="oo-input h-11 font-medium bg-[var(--oo-surface)] border-[var(--oo-border)]"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir={language === "ar" ? "rtl" : "ltr"} className={styles.selectPopup}>
                              {PROPERTY_AGES.map((age) => (
                                <SelectItem key={age.value} value={age.value}>
                                  {t(age.label)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </section>

                    {/* Group 04: Specifications (Conditional for Residential: Villa, Palace, Apartment) */}
                    {showDetailedFields && (
                      <section id="order-group-04" className={styles.groupSection}>
                        <div className={styles.groupHeadingRow}>
                          <span className={styles.groupNumberBadge}>04</span>
                          <h2 className={styles.groupTitle}>{t("orders.group.specs")}</h2>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                          {/* Rooms */}
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="order-field-rooms"
                              className={styles.fieldLabel}
                            >
                              {t("orders.rooms")}
                            </Label>
                            <Input
                              id="order-field-rooms"
                              type="number"
                              min="0"
                              value={formData.rooms || ""}
                              onChange={(e) => handleChange("rooms", Number(e.target.value))}
                              placeholder="0"
                              className="oo-input h-11 font-medium bg-[var(--oo-surface)] border-[var(--oo-border)]"
                            />
                          </div>

                          {/* Bathrooms */}
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="order-field-baths"
                              className={styles.fieldLabel}
                            >
                              {t("orders.baths")}
                            </Label>
                            <Input
                              id="order-field-baths"
                              type="number"
                              min="0"
                              value={formData.bathrooms || ""}
                              onChange={(e) => handleChange("bathrooms", Number(e.target.value))}
                              placeholder="0"
                              className="oo-input h-11 font-medium bg-[var(--oo-surface)] border-[var(--oo-border)]"
                            />
                          </div>

                          {/* Living Rooms */}
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="order-field-living"
                              className={styles.fieldLabel}
                            >
                              {t("orders.living")}
                            </Label>
                            <Input
                              id="order-field-living"
                              type="number"
                              min="0"
                              value={formData.livingRooms || ""}
                              onChange={(e) => handleChange("livingRooms", Number(e.target.value))}
                              placeholder="0"
                              className="oo-input h-11 font-medium bg-[var(--oo-surface)] border-[var(--oo-border)]"
                            />
                          </div>

                          {/* Kitchens */}
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="order-field-kitchens"
                              className={styles.fieldLabel}
                            >
                              {t("orders.kitchens")}
                            </Label>
                            <Input
                              id="order-field-kitchens"
                              type="number"
                              min="0"
                              value={formData.kitchens || ""}
                              onChange={(e) => handleChange("kitchens", Number(e.target.value))}
                              placeholder="0"
                              className="oo-input h-11 font-medium bg-[var(--oo-surface)] border-[var(--oo-border)]"
                            />
                          </div>

                          {/* Floors */}
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="order-field-floors"
                              className={styles.fieldLabel}
                            >
                              {t("orders.floors")}
                            </Label>
                            <Input
                              id="order-field-floors"
                              type="number"
                              min="0"
                              value={formData.floors || ""}
                              onChange={(e) => handleChange("floors", Number(e.target.value))}
                              placeholder="0"
                              className="oo-input h-11 font-medium bg-[var(--oo-surface)] border-[var(--oo-border)]"
                            />
                          </div>

                          {/* Apartments */}
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="order-field-apartments"
                              className={styles.fieldLabel}
                            >
                              {t("orders.apartments")}
                            </Label>
                            <Input
                              id="order-field-apartments"
                              type="number"
                              min="0"
                              value={formData.apartments || ""}
                              onChange={(e) => handleChange("apartments", Number(e.target.value))}
                              placeholder="0"
                              className="oo-input h-11 font-medium bg-[var(--oo-surface)] border-[var(--oo-border)]"
                            />
                          </div>

                          {/* Building Area */}
                          <div className="space-y-1.5 sm:col-span-2">
                            <Label
                              htmlFor="order-field-buildArea"
                              className={styles.fieldLabel}
                            >
                              {t("orders.buildArea")}
                            </Label>
                            <div className="relative">
                              <Input
                                id="order-field-buildArea"
                                type="number"
                                min="0"
                                value={formData.buildingArea || ""}
                                onChange={(e) => handleChange("buildingArea", Number(e.target.value))}
                                placeholder="0"
                                className={`oo-input h-11 font-medium bg-[var(--oo-surface)] border-[var(--oo-border)] ${
                                  language === "ar" ? "pl-12" : "pr-12"
                                }`}
                              />
                              <span
                                className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--oo-text-secondary)] pointer-events-none ${
                                  language === "ar" ? "left-3" : "right-3"
                                }`}
                              >
                                {t("orders.unit.sqm")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Group 05: Amenities & Furnishing */}
                    <section id="order-group-05" className={styles.groupSection}>
                      <div className={styles.groupHeadingRow}>
                        <span className={styles.groupNumberBadge}>
                          {showDetailedFields ? "05" : "04"}
                        </span>
                        <h2 className={styles.groupTitle}>{t("orders.group.amenities")}</h2>
                      </div>

                      <div className={styles.amenitiesGrid}>
                        <label
                          htmlFor="order-amenity-maid"
                          className={styles.amenityCard}
                          data-checked={formData.hasMaidRoom}
                        >
                          <Checkbox
                            id="order-amenity-maid"
                            checked={formData.hasMaidRoom}
                            onCheckedChange={(val) => handleChange("hasMaidRoom", !!val)}
                          />
                          <span className="text-xs sm:text-sm select-none">{t("orders.maid")}</span>
                        </label>

                        <label
                          htmlFor="order-amenity-roof"
                          className={styles.amenityCard}
                          data-checked={formData.hasRoof}
                        >
                          <Checkbox
                            id="order-amenity-roof"
                            checked={formData.hasRoof}
                            onCheckedChange={(val) => handleChange("hasRoof", !!val)}
                          />
                          <span className="text-xs sm:text-sm select-none">{t("orders.roof")}</span>
                        </label>

                        <label
                          htmlFor="order-amenity-annex"
                          className={styles.amenityCard}
                          data-checked={formData.hasExternalAnnex}
                        >
                          <Checkbox
                            id="order-amenity-annex"
                            checked={formData.hasExternalAnnex}
                            onCheckedChange={(val) => handleChange("hasExternalAnnex", !!val)}
                          />
                          <span className="text-xs sm:text-sm select-none">{t("orders.annex")}</span>
                        </label>

                        <label
                          htmlFor="order-amenity-garage"
                          className={styles.amenityCard}
                          data-checked={formData.hasGarage}
                        >
                          <Checkbox
                            id="order-amenity-garage"
                            checked={formData.hasGarage}
                            onCheckedChange={(val) => handleChange("hasGarage", !!val)}
                          />
                          <span className="text-xs sm:text-sm select-none">{t("orders.garage")}</span>
                        </label>

                        <label
                          htmlFor="order-amenity-pool"
                          className={styles.amenityCard}
                          data-checked={formData.hasPool}
                        >
                          <Checkbox
                            id="order-amenity-pool"
                            checked={formData.hasPool}
                            onCheckedChange={(val) => handleChange("hasPool", !!val)}
                          />
                          <span className="text-xs sm:text-sm select-none">{t("orders.pool")}</span>
                        </label>

                        <label
                          htmlFor="order-amenity-elevator"
                          className={styles.amenityCard}
                          data-checked={formData.hasElevator}
                        >
                          <Checkbox
                            id="order-amenity-elevator"
                            checked={formData.hasElevator}
                            onCheckedChange={(val) => handleChange("hasElevator", !!val)}
                          />
                          <span className="text-xs sm:text-sm select-none">{t("orders.elevator")}</span>
                        </label>
                      </div>

                      {/* Furnishing Status */}
                      <div className="space-y-1.5 pt-4 max-w-sm">
                        <Label
                          htmlFor="order-field-furniture"
                          className={styles.fieldLabel}
                        >
                          {t("orders.furniture")}
                        </Label>
                        <Select dir={language === "ar" ? "rtl" : "ltr"}
                          value={formData.furnitureStatus}
                          onValueChange={(val) => handleChange("furnitureStatus", val)}
                        >
                          <SelectTrigger
                            id="order-field-furniture"
                            className="oo-input h-11 font-medium bg-[var(--oo-surface)] border-[var(--oo-border)]"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent dir={language === "ar" ? "rtl" : "ltr"} className={styles.selectPopup}>
                            <SelectItem value="unfurnished">{t("orders.unfurnished")}</SelectItem>
                            <SelectItem value="furnished">{t("orders.furnished")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </section>

                    {/* Group 06: Additional Notes */}
                    <section id="order-group-06" className={styles.groupSection}>
                      <div className={styles.groupHeadingRow}>
                        <span className={styles.groupNumberBadge}>
                          {showDetailedFields ? "06" : "05"}
                        </span>
                        <h2 className={styles.groupTitle}>{t("orders.group.notes")}</h2>
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="order-field-notes"
                          className={styles.fieldLabel}
                        >
                          {t("orders.details")}
                        </Label>
                        <Textarea
                          id="order-field-notes"
                          value={formData.additionalDetails}
                          onChange={(e) => handleChange("additionalDetails", e.target.value)}
                          placeholder={t("orders.additionalDetailsPlaceholder")}
                          className="oo-input min-h-[110px] font-medium resize-y bg-[var(--oo-surface)] border-[var(--oo-border)]"
                        />
                      </div>
                    </section>

                    {/* Submit Action */}
                    <div className={styles.groupSection}>
                      <Button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>{t("orders.submitting")}</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-5 h-5" />
                            <span>{t("orders.submit")}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: My Orders Workspace */}
            <TabsContent value="my-orders" className="focus-visible:outline-none">
              <div className={styles.myOrdersContainer}>
                {loadingMyOrders ? (
                  /* Loading Skeletons */
                  <div className={styles.ordersList}>
                    {[1, 2, 3].map((n) => (
                      <div key={n} className={styles.skeletonCard}>
                        <div className="flex justify-between items-center">
                          <div className={`${styles.skeletonBlock} h-6 w-32`} />
                          <div className={`${styles.skeletonBlock} h-5 w-16 rounded-full`} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className={`${styles.skeletonBlock} h-4 w-24`} />
                          <div className={`${styles.skeletonBlock} h-4 w-20`} />
                          <div className={`${styles.skeletonBlock} h-4 w-28`} />
                          <div className={`${styles.skeletonBlock} h-4 w-16`} />
                        </div>
                        <div className="pt-3 border-t border-[var(--oo-border)] flex justify-end gap-2">
                          <div className={`${styles.skeletonBlock} h-8 w-20 rounded-lg`} />
                          <div className={`${styles.skeletonBlock} h-8 w-24 rounded-lg`} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : myOrders.length === 0 ? (
                  /* High-end Empty State */
                  <div className={styles.emptyCard}>
                    <div className={styles.emptyIconCircle}>
                      <List className="w-7 h-7" />
                    </div>
                    <h3 className={styles.emptyTitle}>
                      {t("orders.emptyRequests")}
                    </h3>
                    <p className={styles.emptySubtitle}>
                      {t("orders.emptyRequestsSubtitle")}
                    </p>
                    <Button
                      type="button"
                      onClick={() => setActiveTab("create")}
                      className={styles.detailsBtn}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{t("orders.createOrder")}</span>
                    </Button>
                  </div>
                ) : (
                  /* Architectural Order Cards List */
                  <>
                    <div className={styles.ordersToolbar}>
                      <div className={styles.ordersSummary}>
                        <span className={styles.ordersSummaryIcon} aria-hidden="true">
                          <List className="w-4 h-4" />
                        </span>
                        <div>
                          <span className={styles.ordersSummaryCount}>
                            {myOrders.length.toLocaleString(language === "ar" ? "ar-SA-u-nu-arab" : "en-US")}
                          </span>{" "}
                          <span className={styles.ordersSummaryLabel}>
                            {language === "ar" ? "طلب عقاري مسجل" : "registered property requests"}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setActiveTab("create")}
                        className={styles.detailsBtn}
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>{t("orders.createOrder")}</span>
                      </Button>
                    </div>
                    <div className={styles.ordersList}>
                      {myOrders.map((order) => {
                        const isBuy = order.orderType === "buy";
                        return (
                          <article
                            key={order.id}
                            className={styles.orderCard}
                            data-order-type={isBuy ? "buy" : "rent"}
                          >
                            {/* Header */}
                            <div className={styles.orderHeader}>
                              <div className={styles.orderTitleGroup}>
                                <div className={styles.orderPropertyType}>
                                  <span className={styles.orderTypeIcon} aria-hidden="true">
                                    {isBuy ? <Home className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                                  </span>
                                  <span>{order.propertyType}</span>
                                  <span
                                    className={`${styles.statusBadge} ${
                                      isBuy ? styles.statusBadgeBuy : styles.statusBadgeRent
                                    }`}
                                  >
                                    {isBuy ? t("orders.buy") : t("orders.rent")}
                                  </span>
                                </div>
                                <span className={styles.orderDate}>
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>
                                    {new Date(order.createdAt).toLocaleDateString(
                                      language === "ar" ? "ar-SA" : "en-US",
                                      { year: "numeric", month: "short", day: "numeric" }
                                    )}
                                  </span>
                                </span>
                              </div>
                              <div className={styles.orderPriceBlock}>
                                <span className={styles.orderPriceLabel}>
                                  {language === "ar" ? "الميزانية" : "Budget"}
                                </span>
                                <div className={styles.orderPrice}>
                                  <SaudiRiyalAmount
                                    amount={order.price || 0}
                                    locale={language === "ar" ? "ar-SA" : "en-US"}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className={styles.orderDetailsGrid}>
                              <div className={styles.orderDetailItem}>
                                <MapPin className="w-4 h-4 shrink-0 text-[var(--oo-gold)]" />
                                <span className={styles.orderDetailValue}>
                                  {order.city} - {order.neighborhood}
                                </span>
                              </div>
                              <div className={styles.orderDetailItem}>
                                <Ruler className="w-4 h-4 shrink-0 text-[var(--oo-gold)]" />
                                <span className={styles.orderDetailValue}>
                                  {order.area} {t("orders.unit.sqm")}
                                </span>
                              </div>
                              <div className={styles.orderDetailItem}>
                                <Calendar className="w-4 h-4 shrink-0 text-[var(--oo-gold)]" />
                                <span className={styles.orderDetailValue}>
                                  {order.propertyAge}
                                </span>
                              </div>
                            </div>

                            {/* Optional Specs Chips */}
                            {((order.rooms != null && order.rooms > 0) ||
                              (order.bathrooms != null && order.bathrooms > 0)) && (
                              <div className={styles.specChipsRow}>
                                {order.rooms != null && order.rooms > 0 && (
                                  <span className={styles.specChip}>
                                    <Bed className="w-3.5 h-3.5 text-[var(--oo-gold)]" />
                                    <span>
                                      {order.rooms} {t("orders.rooms")}
                                    </span>
                                  </span>
                                )}
                                {order.bathrooms != null && order.bathrooms > 0 && (
                                  <span className={styles.specChip}>
                                    <Bath className="w-3.5 h-3.5 text-[var(--oo-gold)]" />
                                    <span>
                                      {order.bathrooms} {t("orders.baths")}
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className={styles.orderActions}>
                              <button
                                type="button"
                                className={styles.deleteBtn}
                                onClick={() => handleDeleteOrder(order.id)}
                                aria-label={t("common.delete")}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{t("common.delete")}</span>
                              </button>
                              <button
                                type="button"
                                className={styles.detailsBtn}
                                onClick={() => router.push(`/orders/${order.id}`)}
                                aria-label={t("orders.viewDetails")}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>{t("orders.viewDetails")}</span>
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </SegmentedTabs>
        </div>
      </div>
    </div>
  );
}
