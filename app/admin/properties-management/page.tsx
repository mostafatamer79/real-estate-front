"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Building2, Calendar, CreditCard, Edit2, FileText, Loader2, MapPin, Plus, Save, Search, User, Wrench, X, Eye, MessageSquare, Share2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { propertiesApi, offersApi } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { Pagination } from "../../src/components/Pagination";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";
import { AddPropertyWizard } from "@/components/modals/AddPropertyWizard";

type ManagementTab = "properties" | "tenants" | "leases" | "payments" | "maintenance";

const emptyForms: Record<ManagementTab, Record<string, string>> = {
  properties: {
    name: "",
    deedNumber: "",
    type: "building",
    locationUrl: "",
    constructionDate: "",
    purchasePrice: "",
    ownerId: "",
    propertyType: "فيلا",
    length: "",
    width: "",
    area: "",
    propertyAge: "جديد",
    direction: "شمال",
    price: "",
    city: "الرياض",
    neighborhood: "",
    streetWidth: "",
    deedType: "صك إلكتروني",
    propertyCondition: "جديد",
    rooms: "",
    bathrooms: "",
    livingRooms: "",
    kitchens: "",
    floors: "",
    apartments: "",
    hasMaidRoom: "false",
    hasRoof: "false",
    hasExternalAnnex: "false",
    buildingArea: "",
    hasGarage: "false",
    hasPool: "false",
    hasElevator: "false",
    furnitureStatus: "unfurnished",
    additionalNotes: "",
    dealType: "بيع",
    mainCategory: "residential",
  },
  tenants: { fullName: "", idNumber: "", phoneNumber: "", email: "", employer: "", type: "individual", preferredPaymentDay: "", userId: "" },
  leases: { unitId: "", tenantId: "", startDate: "", endDate: "", annualRent: "", paymentFrequency: "annual", securityDeposit: "", securityDepositStatus: "held", deductionReason: "" },
  payments: { leaseId: "", dueDate: "", amount: "", status: "pending" },
  maintenance: { propertyId: "", unitId: "", type: "routine", description: "", status: "pending", cost: "", technicianName: "", completedDate: "" },
};

export default function AdminPropertiesManagementPage() {
  const { language, t } = useLanguage();
  const confirmDialog = useConfirmDialog();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isRtl = language === "ar";

  const handleOpenChat = async (targetUserId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/rooms/direct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/chat/${data.id}`);
      } else {
        toast.error(isRtl ? "فشل فتح المحادثة" : "Failed to open chat");
      }
    } catch (error) {
      console.error(error);
      toast.error(isRtl ? "حدث خطأ أثناء فتح المحادثة" : "Error opening chat");
    }
  };
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ManagementTab>("properties");
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyForms.properties);
  const itemsPerPage = 10;
  const propertyTabs = [
    { id: "properties", href: "/admin/properties-management", icon: Building2, label: isRtl ? "الأملاك" : "Properties", count: properties.length },
    { id: "tenants", href: "/admin/properties-management?tab=tenants", icon: User, label: isRtl ? "المستأجرين" : "Tenants", count: tenants.length },
    { id: "leases", href: "/admin/properties-management?tab=leases", icon: FileText, label: isRtl ? "العقود" : "Leases", count: leases.length },
    { id: "payments", href: "/admin/properties-management?tab=payments", icon: CreditCard, label: isRtl ? "مدفوعات الأملاك" : "Property Payments", count: payments.length },
    { id: "maintenance", href: "/admin/properties-management?tab=maintenance", icon: Wrench, label: isRtl ? "الصيانة" : "Maintenance", count: maintenance.length },
  ] as const;

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const [propertiesRes, tenantsRes, leasesRes, paymentsRes, maintenanceRes] = await Promise.all([
        propertiesApi.findAll(),
        propertiesApi.getTenants().catch(() => ({ data: [] })),
        propertiesApi.getLeases().catch(() => ({ data: [] })),
        propertiesApi.getPayments().catch(() => ({ data: [] })),
        propertiesApi.getMaintenanceLogs().catch(() => ({ data: [] })),
      ]);
      setProperties(Array.isArray(propertiesRes.data) ? propertiesRes.data : []);
      setTenants(Array.isArray(tenantsRes.data) ? tenantsRes.data : []);
      setLeases(Array.isArray(leasesRes.data) ? leasesRes.data : []);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      setMaintenance(Array.isArray(maintenanceRes.data) ? maintenanceRes.data : []);
    } catch (error) {
      toast.error(isRtl ? "فشل تحميل الأملاك" : "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const nextTab = searchParams.get("tab") as ManagementTab | null;
    if (nextTab && Object.keys(emptyForms).includes(nextTab)) {
      setActiveTab(nextTab);
    } else {
      setActiveTab("properties");
    }
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
    setEditingId(null);
    setForm(emptyForms[activeTab]);
  }, [search, activeTab]);

  const activeItems = useMemo(() => {
    if (activeTab === "tenants") return tenants;
    if (activeTab === "leases") return leases;
    if (activeTab === "payments") return payments;
    if (activeTab === "maintenance") return maintenance;
    return properties;
  }, [activeTab, leases, maintenance, payments, properties, tenants]);

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return activeItems;
    return activeItems.filter((property) => {
      const haystack = [
        property.id,
        property.name,
        property.title,
        property.fullName,
        property.tenant?.fullName,
        property.propertyType,
        property.type,
        property.status,
        property.amount,
        property.description,
        property.city,
        property.neighborhood,
        property.property?.name,
        property.unit?.name,
        property.owner?.firstName,
        property.owner?.lastName,
        property.owner?.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [activeItems, search]);

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const paginatedProperties = filteredProperties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formFields = useMemo(() => {
    if (activeTab === "properties") return [
      ["name", isRtl ? "اسم الملك" : "Property name", "text"],
      ["type", isRtl ? "النوع" : "Type", "select:building,compound,land,warehouse"],
      ["ownerId", isRtl ? "معرف المالك" : "Owner ID", "text"],
      ["deedNumber", isRtl ? "رقم الصك" : "Deed number", "text"],
      ["locationUrl", isRtl ? "رابط الموقع" : "Location URL", "text"],
      ["constructionDate", isRtl ? "تاريخ البناء" : "Construction date", "date"],
      ["purchasePrice", isRtl ? "سعر الشراء" : "Purchase price", "number"],
      ["mainCategory", isRtl ? "القسم الرئيسي" : "Main category", "select:residential,commercial"],
      ["propertyType", isRtl ? "نوع العقار" : "Property type", "text"],
      ["dealType", isRtl ? "نوع الصفقة" : "Deal type", "select:بيع,إيجار"],
      ["price", isRtl ? "السعر" : "Price", "number"],
      ["area", isRtl ? "المساحة" : "Area", "number"],
      ["length", isRtl ? "الطول" : "Length", "number"],
      ["width", isRtl ? "العرض" : "Width", "number"],
      ["streetWidth", isRtl ? "عرض الشارع" : "Street width", "number"],
      ["city", isRtl ? "المدينة" : "City", "text"],
      ["neighborhood", isRtl ? "الحي" : "Neighborhood", "text"],
      ["propertyAge", isRtl ? "عمر العقار" : "Property age", "text"],
      ["direction", isRtl ? "الواجهة" : "Direction", "text"],
      ["deedType", isRtl ? "نوع الصك" : "Deed type", "text"],
      ["propertyCondition", isRtl ? "حالة العقار" : "Property condition", "text"],
      ["rooms", isRtl ? "عدد الغرف" : "Rooms", "number"],
      ["bathrooms", isRtl ? "عدد دورات المياه" : "Bathrooms", "number"],
      ["livingRooms", isRtl ? "عدد الصالات" : "Living rooms", "number"],
      ["kitchens", isRtl ? "عدد المطابخ" : "Kitchens", "number"],
      ["floors", isRtl ? "عدد الأدوار" : "Floors", "number"],
      ["apartments", isRtl ? "عدد الشقق" : "Apartments", "number"],
      ["hasMaidRoom", isRtl ? "غرفة عاملة" : "Maid room", "select:true,false"],
      ["hasRoof", isRtl ? "سطح" : "Roof", "select:true,false"],
      ["hasExternalAnnex", isRtl ? "ملحق خارجي" : "External annex", "select:true,false"],
      ["buildingArea", isRtl ? "مسطح البناء" : "Building area", "number"],
      ["hasGarage", isRtl ? "كراج" : "Garage", "select:true,false"],
      ["hasPool", isRtl ? "مسبح" : "Pool", "select:true,false"],
      ["hasElevator", isRtl ? "مصعد" : "Elevator", "select:true,false"],
      ["furnitureStatus", isRtl ? "حالة الأثاث" : "Furniture status", "select:furnished,unfurnished"],
      ["additionalNotes", isRtl ? "ملاحظات إضافية" : "Additional notes", "text"],
    ];
    if (activeTab === "tenants") return [
      ["fullName", isRtl ? "اسم المستأجر" : "Tenant name", "text"],
      ["type", isRtl ? "النوع" : "Type", "select:individual,company"],
      ["idNumber", isRtl ? "رقم الهوية" : "ID number", "text"],
      ["phoneNumber", isRtl ? "الجوال" : "Phone", "text"],
      ["email", isRtl ? "البريد" : "Email", "email"],
      ["employer", isRtl ? "جهة العمل" : "Employer", "text"],
      ["preferredPaymentDay", isRtl ? "يوم الدفع" : "Payment day", "number"],
      ["userId", isRtl ? "معرف المستخدم" : "User ID", "text"],
    ];
    if (activeTab === "leases") return [
      ["unitId", isRtl ? "معرف الوحدة" : "Unit ID", "text"],
      ["tenantId", isRtl ? "معرف المستأجر" : "Tenant ID", "text"],
      ["startDate", isRtl ? "بداية العقد" : "Start date", "date"],
      ["endDate", isRtl ? "نهاية العقد" : "End date", "date"],
      ["annualRent", isRtl ? "الإيجار السنوي" : "Annual rent", "number"],
      ["paymentFrequency", isRtl ? "دورية الدفع" : "Payment frequency", "select:monthly,quarterly,semi-annual,annual"],
      ["securityDeposit", isRtl ? "التأمين" : "Deposit", "number"],
      ["securityDepositStatus", isRtl ? "حالة التأمين" : "Deposit status", "select:held,partially_refunded,fully_refunded"],
      ["deductionReason", isRtl ? "سبب الخصم" : "Deduction reason", "text"],
    ];
    if (activeTab === "payments") return [
      ["leaseId", isRtl ? "معرف العقد" : "Lease ID", "text"],
      ["dueDate", isRtl ? "تاريخ الاستحقاق" : "Due date", "date"],
      ["amount", isRtl ? "المبلغ" : "Amount", "number"],
      ["status", isRtl ? "الحالة" : "Status", "select:pending,paid,overdue"],
    ];
    return [
      ["propertyId", isRtl ? "معرف الملك" : "Property ID", "text"],
      ["unitId", isRtl ? "معرف الوحدة" : "Unit ID", "text"],
      ["type", isRtl ? "النوع" : "Type", "select:routine,emergency"],
      ["description", isRtl ? "الوصف" : "Description", "text"],
      ["status", isRtl ? "الحالة" : "Status", "select:pending,in_progress,completed"],
      ["cost", isRtl ? "التكلفة" : "Cost", "number"],
      ["technicianName", isRtl ? "الفني" : "Technician", "text"],
      ["completedDate", isRtl ? "تاريخ الإكمال" : "Completed date", "date"],
    ];
  }, [activeTab, isRtl]);

  const normalizePayload = () => {
    const numericKeys = new Set([
      "purchasePrice", "preferredPaymentDay", "annualRent", "securityDeposit", "amount", "cost",
      "length", "width", "area", "price", "streetWidth", "rooms", "bathrooms", "livingRooms",
      "kitchens", "floors", "apartments", "buildingArea", "views"
    ]);
    const booleanKeys = new Set([
      "hasMaidRoom", "hasRoof", "hasExternalAnnex", "hasGarage", "hasPool", "hasElevator", "isActive"
    ]);
    const payload: Record<string, any> = {};
    Object.entries(form).forEach(([key, value]) => {
      if (value === "") return;
      if (numericKeys.has(key)) {
        payload[key] = Number(value);
      } else if (booleanKeys.has(key)) {
        payload[key] = String(value) === "true";
      } else {
        payload[key] = value;
      }
    });
    return payload;
  };

  const handleCloseFormModal = () => {
    setIsCreateOpen(false);
    setEditingId(null);
    setForm(emptyForms[activeTab]);
  };

  const saveRecord = async () => {
    setSaving(true);
    try {
      const payload = normalizePayload();
      if (activeTab === "properties") {
        editingId ? await propertiesApi.update(editingId, payload as any) : await propertiesApi.create(payload as any);
      } else if (activeTab === "tenants") {
        editingId ? await propertiesApi.updateTenant(editingId, payload as any) : await propertiesApi.createTenant(payload as any);
      } else if (activeTab === "leases") {
        editingId ? await propertiesApi.updateLease(editingId, payload as any) : await propertiesApi.createLease(payload as any);
      } else if (activeTab === "payments") {
        editingId ? await propertiesApi.updatePayment(editingId, payload as any) : await propertiesApi.createPayment(payload as any);
      } else {
        editingId ? await propertiesApi.updateMaintenanceLog(editingId, payload as any) : await propertiesApi.createMaintenanceLog(payload as any);
      }
      toast.success(editingId ? (isRtl ? "تم التعديل" : "Updated") : (isRtl ? "تمت الإضافة" : "Created"));
      handleCloseFormModal();
      await fetchProperties();
    } catch {
      toast.error(isRtl ? "تعذر حفظ السجل" : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleExportToOffers = async (property: any) => {
    try {
      const payload: any = {
        mainCategory: property.mainCategory || "residential",
        propertyType: property.propertyType || "فيلا",
        dealType: property.dealType || "بيع",
        price: Number(property.price || property.purchasePrice || 0),
        area: Number(property.area || 1),
        length: property.length ? Number(property.length) : undefined,
        width: property.width ? Number(property.width) : undefined,
        streetWidth: property.streetWidth ? Number(property.streetWidth) : undefined,
        city: property.city || "الرياض",
        neighborhood: property.neighborhood || "",
        propertyAge: property.propertyAge || "جديد",
        direction: property.direction || "شمال",
        deedType: property.deedType || "صك إلكتروني",
        propertyCondition: property.propertyCondition || "جديد",
        rooms: property.rooms ? Number(property.rooms) : undefined,
        bathrooms: property.bathrooms ? Number(property.bathrooms) : undefined,
        livingRooms: property.livingRooms ? Number(property.livingRooms) : undefined,
        kitchens: property.kitchens ? Number(property.kitchens) : undefined,
        floors: property.floors ? Number(property.floors) : undefined,
        apartments: property.apartments ? Number(property.apartments) : undefined,
        hasMaidRoom: property.hasMaidRoom === "true" || property.hasMaidRoom === true,
        hasRoof: property.hasRoof === "true" || property.hasRoof === true,
        hasExternalAnnex: property.hasExternalAnnex === "true" || property.hasExternalAnnex === true,
        buildingArea: property.buildingArea ? Number(property.buildingArea) : undefined,
        hasGarage: property.hasGarage === "true" || property.hasGarage === true,
        hasPool: property.hasPool === "true" || property.hasPool === true,
        hasElevator: property.hasElevator === "true" || property.hasElevator === true,
        furnitureStatus: property.furnitureStatus || "unfurnished",
        locationUrl: property.locationUrl || "",
        additionalNotes: property.additionalNotes || `تم التصدير من إدارة الأملاك: ${property.name}`,
        mediaFiles: property.mediaFiles || [],
        propertyDocuments: property.propertyDocuments || [],
        threeDVideos: property.threeDVideos || [],
        video3d: property.video3d || "",
        checkImage: property.checkImage || "",
        status: "published",
        isActive: true,
      };

      await offersApi.create(payload);
      toast.success(t("pm.success.exportOffer"));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || (isRtl ? "فشل التصدير كعرض" : "Failed to export as offer"));
    }
  };

  const startEdit = (record: any) => {
    const next = { ...emptyForms[activeTab] };
    Object.keys(next).forEach((key) => {
      const value = record[key];
      if (value !== undefined && value !== null) {
        next[key] = String(value).slice(0, key.toLowerCase().includes("date") ? 10 : undefined as any);
      }
    });
    setEditingId(record.id);
    setForm(next);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await propertiesApi.update(id, { isActive: !currentStatus });
      toast.success(isRtl ? "تم تحديث حالة النشاط بنجاح" : "Activity status updated successfully");
      await fetchProperties();
    } catch (error) {
      console.error(error);
      toast.error(isRtl ? "فشل تحديث حالة النشاط" : "Failed to update activity status");
    }
  };

  const deleteRecord = async (id: string) => {
    const ok = await confirmDialog({
      title: isRtl ? "هل تريد حذف هذا السجل؟" : "Delete this record?",
      description: isRtl ? "سيتم حذف السجل من هذه الإدارة." : "This record will be deleted from the current section.",
      confirmLabel: isRtl ? "حذف" : "Delete",
      cancelLabel: isRtl ? "إلغاء" : "Cancel",
      destructive: true,
    });
    if (!ok) return;
    try {
      if (activeTab === "properties") await propertiesApi.delete(id);
      else if (activeTab === "tenants") await propertiesApi.deleteTenant(id);
      else if (activeTab === "leases") await propertiesApi.deleteLease(id);
      else if (activeTab === "payments") await propertiesApi.deletePayment(id);
      else await propertiesApi.deleteMaintenanceLog(id);
      toast.success(isRtl ? "تم الحذف" : "Deleted");
      await fetchProperties();
    } catch {
      toast.error(isRtl ? "تعذر الحذف" : "Delete failed");
    }
  };

  return (
    <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
            <Building2 className="h-3.5 w-3.5" />
            {isRtl ? "الإدارات" : "Departments"}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            {isRtl ? "إدارة الأملاك" : "Properties Management"}
          </h1>
          <p className="text-sm font-bold text-slate-400">
            {isRtl ? "عرض وتحكم إداري في كل أملاك المستخدمين وتوابعها." : "Admin control over all user properties and related records."}
          </p>
        </div>

        <div className="flex w-full flex-col sm:flex-row gap-3 md:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${isRtl ? "right-4" : "left-4"}`} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={isRtl ? "بحث في الأملاك..." : "Search properties..."}
              className={`h-12 w-full rounded-2xl border border bg-card px-11 text-sm font-bold outline-none focus:border-slate-900`}
            />
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setForm(emptyForms[activeTab]);
              setIsCreateOpen(true);
            }}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-stone-400/10 hover:bg-slate-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {isRtl ? "تحديث" : "Add New"}
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border bg-card p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "إجمالي الأملاك" : "Total properties"}</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{properties.length}</p>
        </div>
        <div className="rounded-2xl border border bg-card p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "نتائج البحث" : "Filtered"}</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{filteredProperties.length}</p>
        </div>
        <div className="rounded-2xl border border bg-card p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "صفحة التحكم" : "Control page"}</p>
          <p className="mt-1 text-lg font-black text-slate-950">{isRtl ? "إدارية فقط" : "Admin only"}</p>
        </div>
      </section>

      <section className="rounded-2xl border border bg-card p-2 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          {propertyTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex min-w-fit flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${
                  active ? "bg-slate-950 text-white shadow-lg shadow-stone-400/10" : "text-slate-500 hover:bg-muted hover:text-slate-950"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-card/15 text-white" : "bg-muted text-slate-500"}`}>
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right">
            <thead className="bg-muted/70">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "السجل" : "Record"}</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "المالك/الطرف" : "Owner/Party"}</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "التفاصيل" : "Details"}</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "الحالة/التاريخ" : "Status/Date"}</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "إجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-300" />
                  </td>
                </tr>
              ) : paginatedProperties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-xs font-black uppercase tracking-widest text-slate-300">
                    {isRtl ? "لا توجد أملاك" : "No properties"}
                  </td>
                </tr>
              ) : (
                paginatedProperties.map((property) => {
                  const isPropertyRow = activeTab === "properties";
                  const title = property.name || property.title || property.fullName || property.tenant?.fullName || property.description || property.property?.name || property.id;
                  const ownerName = property.owner ? `${property.owner.firstName || ""} ${property.owner.lastName || ""}` : property.ownerId || property.tenantId || property.userId || "—";
                  const details = activeTab === "payments"
                    ? `${Number(property.amount || 0).toLocaleString(isRtl ? "ar-SA" : "en-US")} - ${property.paymentMethod || property.type || "—"}`
                    : activeTab === "leases"
                      ? `${property.unit?.name || property.unitId || "—"} - ${property.tenant?.fullName || property.tenantId || "—"}`
                      : activeTab === "maintenance"
                        ? `${property.property?.name || property.propertyId || "—"} - ${property.unit?.name || property.unitId || "—"}`
                        : [property.city, property.neighborhood, property.type || property.propertyType].filter(Boolean).join(" - ") || "—";
                  return (
                  <tr key={property.id} className="hover:bg-muted/50">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-slate-500">
                          {activeTab === "tenants" ? <User className="h-5 w-5" /> : activeTab === "leases" ? <FileText className="h-5 w-5" /> : activeTab === "payments" ? <CreditCard className="h-5 w-5" /> : activeTab === "maintenance" ? <Wrench className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-950">{title}</p>
                          <p className="font-mono text-[10px] font-bold text-slate-400">#{String(property.id).slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <User className="h-4 w-4 text-slate-300" />
                        {ownerName}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <MapPin className="h-4 w-4 text-slate-300" />
                        {details}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {isPropertyRow ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleActive(property.id, property.isActive);
                            }}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              property.isActive ? "bg-slate-900" : "bg-muted"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${
                                property.isActive ? (isRtl ? "-translate-x-5" : "translate-x-5") : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span className="text-xs font-bold text-slate-600">
                            {property.isActive ? (isRtl ? "نشط" : "Active") : (isRtl ? "غير نشط" : "Inactive")}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                          <Calendar className="h-4 w-4 text-slate-300" />
                          {property.status || property.paymentStatus || property.createdAt?.slice?.(0, 10) || "—"}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingRecord(property)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-300"
                      >
                        <Eye className="h-4 w-4" />
                        {isRtl ? "عرض" : "View"}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(property)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-300"
                      >
                        <Edit2 className="h-4 w-4" />
                        {isRtl ? "تحديث" : "Update"}
                      </button>
                      {isPropertyRow && (
                        <button
                          type="button"
                          onClick={() => handleExportToOffers(property)}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 text-[10px] font-black uppercase tracking-widest text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300"
                        >
                          <Share2 className="h-4 w-4" />
                          {t("pm.action.exportOffer")}
                        </button>
                      )}
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredProperties.length}
          itemsLabel={isRtl ? "ملك" : "properties"}
        />
      </section>

      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[1.25rem] border border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border bg-muted/50 px-8 py-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isRtl ? "تفاصيل السجل" : "Record Details"}
                </h3>
                <p className="font-mono text-xs text-slate-400 mt-1">ID: {viewingRecord.id}</p>
              </div>
              <button
                onClick={() => setViewingRecord(null)}
                className="rounded-xl border border bg-card p-2 text-slate-400 hover:text-slate-900 hover:shadow-sm transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[70vh] overflow-y-auto px-8 py-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formFields.map(([key, label]) => {
                  const val = viewingRecord[String(key)];
                  return (
                    <div key={key} className="p-4 rounded-2xl bg-muted/50 border border space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                      <p className="text-sm font-bold text-slate-800">
                        {val === true ? (isRtl ? "نعم" : "Yes") : val === false ? (isRtl ? "لا" : "No") : val || "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
              
              {/* Additional fields not in formFields, like dates & relationship objects */}
              <div className="border-t border pt-4 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {viewingRecord.createdAt && (
                  <div className="p-4 rounded-2xl bg-muted/50 border border space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {isRtl ? "تاريخ الإنشاء" : "Created At"}
                    </span>
                    <p className="text-sm font-bold text-slate-800">
                      {new Date(viewingRecord.createdAt).toLocaleString(isRtl ? "ar-SA" : "en-US")}
                    </p>
                  </div>
                )}
                {viewingRecord.updatedAt && (
                  <div className="p-4 rounded-2xl bg-muted/50 border border space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {isRtl ? "تاريخ التحديث" : "Updated At"}
                    </span>
                    <p className="text-sm font-bold text-slate-800">
                      {new Date(viewingRecord.updatedAt).toLocaleString(isRtl ? "ar-SA" : "en-US")}
                    </p>
                  </div>
                )}
                {viewingRecord.owner && (
                  <div className="p-4 rounded-2xl bg-muted/50 border border flex items-center justify-between sm:col-span-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {isRtl ? "بيانات المالك" : "Owner Details"}
                      </span>
                      <p className="text-sm font-bold text-slate-800">
                        {viewingRecord.owner.firstName} {viewingRecord.owner.lastName} ({viewingRecord.owner.email || "—"} / {viewingRecord.owner.phone || "—"})
                      </p>
                    </div>
                    {viewingRecord.owner.id && (
                      <button
                        onClick={() => handleOpenChat(viewingRecord.owner.id)}
                        className="flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-xs font-black text-white hover:bg-slate-800 transition-colors gap-2 shrink-0"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {isRtl ? "فتح الشات" : "Open Chat"}
                      </button>
                    )}
                  </div>
                )}
                {viewingRecord.tenant && (
                  <div className="p-4 rounded-2xl bg-muted/50 border border flex items-center justify-between sm:col-span-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {isRtl ? "بيانات المستأجر" : "Tenant Details"}
                      </span>
                      <p className="text-sm font-bold text-slate-800">
                        {viewingRecord.tenant.fullName} ({viewingRecord.tenant.email || "—"} / {viewingRecord.tenant.phoneNumber || "—"})
                      </p>
                    </div>
                    {viewingRecord.tenant.userId && (
                      <button
                        onClick={() => handleOpenChat(viewingRecord.tenant.userId)}
                        className="flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-xs font-black text-white hover:bg-slate-800 transition-colors gap-2 shrink-0"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {isRtl ? "فتح الشات" : "Open Chat"}
                      </button>
                    )}
                  </div>
                )}

                {viewingRecord.unit && (
                  <div className="p-4 rounded-2xl bg-muted/50 border border space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {isRtl ? "بيانات الوحدة" : "Unit Details"}
                    </span>
                    <p className="text-sm font-bold text-slate-800">
                      {viewingRecord.unit.unitNumber || viewingRecord.unit.name} ({viewingRecord.unit.type || "—"} - {viewingRecord.unit.area ? `${viewingRecord.unit.area} م²` : ""})
                    </p>
                  </div>
                )}
                {viewingRecord.property && (
                  <div className="p-4 rounded-2xl bg-muted/50 border border space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {isRtl ? "بيانات العقار" : "Property Details"}
                    </span>
                    <p className="text-sm font-bold text-slate-800">
                      {viewingRecord.property.name} ({viewingRecord.property.type || "—"})
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border bg-muted/30 px-8 py-5 flex justify-end">
              <button
                onClick={() => setViewingRecord(null)}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-colors"
              >
                {isRtl ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standard Create/Edit Form Modal */}
      {(isCreateOpen || editingId !== null) && (activeTab !== "properties" || editingId !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[1.25rem] border border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border bg-muted/50 px-8 py-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingId 
                    ? (isRtl ? "تعديل سجل" : "Edit Record") 
                    : (isRtl ? "إضافة سجل جديد" : "Add New Record")
                  }
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isRtl ? "أدخل البيانات المطلوبة بالأسفل" : "Fill in the required information below"}
                </p>
              </div>
              <button
                onClick={handleCloseFormModal}
                className="rounded-xl border border bg-card p-2 text-slate-400 hover:text-slate-900 hover:shadow-sm transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[60vh] overflow-y-auto px-8 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formFields.map(([key, label, type]) => {
                  const typeString = String(type);
                  if (typeString.startsWith("select:")) {
                    const options = typeString.replace("select:", "").split(",");
                    return (
                      <div key={key} className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                        <select
                          value={form[String(key)] || ""}
                          onChange={(event) => setForm((current) => ({ ...current, [String(key)]: event.target.value }))}
                          className="h-11 w-full rounded-xl border border bg-card px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors"
                        >
                          {options.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </div>
                    );
                  }
                  return (
                    <div key={key} className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                      <input
                        type={typeString}
                        value={form[String(key)] || ""}
                        onChange={(event) => setForm((current) => ({ ...current, [String(key)]: event.target.value }))}
                        className="h-11 w-full rounded-xl border border bg-card px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border bg-muted/30 px-8 py-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseFormModal}
                className="inline-flex h-11 items-center justify-center rounded-xl border border bg-card px-6 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-muted transition-colors"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={saveRecord}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50 hover:bg-slate-800 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingId ? (isRtl ? "حفظ التعديل" : "Save") : (isRtl ? "إضافة" : "Create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Wizard Modal for Creating Properties */}
      {isCreateOpen && activeTab === "properties" && editingId === null && (
        <AddPropertyWizard
          isOpen={isCreateOpen}
          onClose={handleCloseFormModal}
          onSubmit={async (data) => {
            setSaving(true);
            try {
              await propertiesApi.create(data);
              toast.success(isRtl ? "تم إضافة العقار بنجاح" : "Property added successfully");
              handleCloseFormModal();
              await fetchProperties();
            } catch (error) {
              console.error(error);
              toast.error(isRtl ? "تعذر إضافة العقار" : "Failed to add property");
            } finally {
              setSaving(false);
            }
          }}
          loading={saving}
        />
      )}
    </div>
  );
}
