"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SaudiRiyalSymbol } from "@/components/ui/saudi-riyal";
import { 
  Search, 
  MapPin, 
  User as UserIcon, 
  Filter,
  ShoppingBag,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  MoreVertical,
  Loader2,
  CheckCircle,
  Plus,
  X,
  Building,
  DollarSign,
  Save,
  Clock,
  ArrowRight,
  Ruler,
  Home,
  MessageSquare,
  FileText,
  UserCheck,
  Check,
  Play
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import api, { ordersApi, usersApi, adminApi } from "@/lib/api";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "../../src/components/Pagination";

// --- Components ---

function CreateOrderModal({ onClose, onSuccess, initialData = null }: { onClose: () => void; onSuccess: () => void; initialData?: any }) {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [clientMode, setClientMode] = useState<"registered" | "anonymous">(initialData?.userId || initialData?.user ? "registered" : "anonymous");

  const getInitialCategory = (propType: string) => {
    const commTypes = ["محل", "مكتب", "عمارة", "مستودع", "محل تجاري", "برج", "مصنع", "فندق", "تجاري"];
    return commTypes.includes(propType) ? "commercial" : "residential";
  };

  const propertyTypeOptions: Record<string, string[]> = {
    residential: ["شقة", "فيلا", "قصر", "أرض", "عمارة", "استراحة"],
    commercial: ["محل", "مكتب", "عمارة", "مستودع", "محل تجاري", "برج", "مصنع", "فندق", "تجاري"]
  };

  const [form, setForm] = useState<any>(() => {
    if (initialData) {
      return {
        ...initialData,
        mainCategory: getInitialCategory(initialData.propertyType)
      };
    }
    return {
      orderType: "buy",
      mainCategory: "residential",
      propertyType: "شقة",
      city: "الرياض",
      neighborhood: "",
      area: 1,
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
      additionalDetails: "",
      userId: "",
      clientName: "",
      clientPhone: "",
      status: "pending"
    };
  });

  useEffect(() => {
    usersApi.findAll().then(res => setUsers(res.data || [])).finally(() => setLoadingUsers(false));
    if (initialData?.user) {
        setUserSearch(`${initialData.user.firstName} ${initialData.user.lastName}`);
        setClientMode("registered");
    }
  }, [initialData]);

  const handleCategoryChange = (cat: "residential" | "commercial") => {
    setForm((f: any) => ({
      ...f,
      mainCategory: cat,
      propertyType: cat === "residential" ? "شقة" : "مكتب"
    }));
  };

  const filteredUsers = users.filter(u => 
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone?.includes(userSearch)
  ).slice(0, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.neighborhood) return toast.error("يرجى إدخال الحي");
    if (!form.city) return toast.error("يرجى إدخال المدينة");
    if (form.price <= 0) return toast.error("يرجى إدخال سعر صحيح");
    if (form.area <= 0) return toast.error("يرجى إدخال مساحة صحيحة");

    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.userId) {
        delete payload.userId;
      }
      
      // Parse numeric/boolean properties to match NestJS expectations
      payload.price = parseFloat(payload.price) || 0;
      payload.area = parseFloat(payload.area) || 0;
      payload.rooms = payload.rooms ? parseInt(payload.rooms) : undefined;
      payload.bathrooms = payload.bathrooms ? parseInt(payload.bathrooms) : undefined;
      payload.livingRooms = payload.livingRooms ? parseInt(payload.livingRooms) : undefined;
      payload.kitchens = payload.kitchens ? parseInt(payload.kitchens) : undefined;
      payload.floors = payload.floors ? parseInt(payload.floors) : undefined;
      payload.apartments = payload.apartments ? parseInt(payload.apartments) : undefined;
      payload.buildingArea = payload.buildingArea ? parseFloat(payload.buildingArea) : undefined;

      if (initialData) {
        await ordersApi.update(initialData.id, payload);
        toast.success("تم تحديث الطلب بنجاح");
      } else {
        await ordersApi.create(payload);
        toast.success("تم إنشاء الطلب بنجاح");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إرسال الطلب");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full h-11 bg-muted border-transparent border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all";
  const labelCls = "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5";
  const pillBtn = (active: boolean) =>
    `h-10 px-4 rounded-2xl text-xs font-black transition-all border ${
      active ? "bg-slate-950 text-white border-slate-950 shadow-sm" : "bg-card text-slate-500 border hover:border"
    }`;

  const selectRegisteredUser = (u: any) => {
    setForm((f: any) => ({ ...f, userId: u.id, clientName: "", clientPhone: "" }));
    setUserSearch(`${u.firstName} ${u.lastName}`);
    setClientMode("registered");
  };

  const clearRegisteredUser = () => {
    setForm((f: any) => ({ ...f, userId: "" }));
    setUserSearch("");
    setClientMode("anonymous");
  };

  // Check if detailed specifications should be shown based on property type
  const showDetailedFields = ["فيلا", "شقة", "قصر", "عمارة", "مكتب"].includes(form.propertyType);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-4xl rounded-[1rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto hide-scrollbar">
        <button onClick={onClose} className="absolute left-8 top-8 p-2 text-slate-300 hover:text-slate-950 transition-colors"><X className="w-5 h-5" /></button>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white">
            {initialData ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-950">{initialData ? "تعديل طلب عقاري" : "إضافة طلب عقاري جديد"}</h2>
            <p className="text-xs text-slate-400 font-bold">يرجى إدخال تفاصيل الطلب وتخصيصه لعميل</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection Section */}
          <div className="bg-muted/50 p-5 rounded-2xl border border-/80 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">معلومات العميل</h3>
                <p className="text-[11px] font-bold text-slate-400 mt-1">
                  اختر عميلًا مسجلًا أو أدخل بيانات عميل مجهول.
                </p>
              </div>
              <div className="flex p-1 bg-card rounded-2xl border border w-fit">
                <button
                  type="button"
                  className={pillBtn(clientMode === "registered")}
                  onClick={() => setClientMode("registered")}
                >
                  عميل مسجل
                </button>
                <button
                  type="button"
                  className={pillBtn(clientMode === "anonymous")}
                  onClick={() => {
                    setClientMode("anonymous");
                    setForm((f: any) => ({ ...f, userId: "" }));
                    setUserSearch("");
                  }}
                >
                  عميل مجهول
                </button>
              </div>
            </div>

            {clientMode === "registered" ? (
              <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1 relative">
                  <label className={labelCls}>ابحث عن عميل</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={userSearch}
                      onChange={(e) => {
                        const v = e.target.value;
                        setUserSearch(v);
                        if (form.userId) setForm((f: any) => ({ ...f, userId: "" }));
                      }}
                      className="w-full h-11 bg-card border border focus:border-slate-950 rounded-xl pr-10 pl-10 text-sm font-bold outline-none transition-all"
                      placeholder="ابحث بالاسم أو الجوال..."
                    />
                    {(userSearch || form.userId) && (
                      <button
                        type="button"
                        onClick={clearRegisteredUser}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-300 hover:text-slate-950 hover:bg-muted transition-colors"
                        title="مسح"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {userSearch && !form.userId && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                      {loadingUsers ? (
                        <div className="p-4 text-center text-[10px] font-bold text-slate-400">جارٍ التحميل...</div>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => selectRegisteredUser(u)}
                            className="w-full px-4 py-3 text-right hover:bg-muted flex items-center justify-between border-b border last:border-0"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                {(u.firstName?.[0] || u.email?.[0] || "?").toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-slate-950 truncate">
                                  {u.firstName} {u.lastName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold truncate">
                                  {u.phone || u.email}
                                </span>
                              </div>
                            </div>
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-[10px] font-bold text-slate-400">لا يوجد نتائج</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className={labelCls}>النتيجة</label>
                  <div className="h-11 px-4 rounded-xl border border bg-card flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-950 truncate">
                      {form.userId ? userSearch : "لم يتم اختيار عميل"}
                    </span>
                    {form.userId && (
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                        مرتبط
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className={labelCls}>اسم العميل المجهول</label>
                  <input
                    value={form.clientName}
                    onChange={(e) => setForm((f: any) => ({ ...f, clientName: e.target.value }))}
                    className="w-full h-11 bg-card border border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all"
                    placeholder=": محمد أحمد"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>هاتف العميل</label>
                  <input
                    value={form.clientPhone}
                    onChange={(e) => setForm((f: any) => ({ ...f, clientPhone: e.target.value }))}
                    className="w-full h-11 bg-card border border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all"
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">تفاصيل الطلب الأساسية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>نوع الطلب</label>
                <select
                  value={form.orderType}
                  onChange={e => setForm((f: any) => ({ ...f, orderType: e.target.value }))}
                  className={inputCls}
                >
                  <option value="buy">شراء</option>
                  <option value="rent">إيجار</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>تصنيف الطلب</label>
                <div className="flex gap-2 p-1 bg-muted rounded-xl h-11 items-center">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("residential")}
                    className={`flex-1 h-9 rounded-lg text-xs font-black transition-all ${
                      form.mainCategory === "residential"
                        ? "bg-card text-slate-950 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    سكني
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("commercial")}
                    className={`flex-1 h-9 rounded-lg text-xs font-black transition-all ${
                      form.mainCategory === "commercial"
                        ? "bg-card text-slate-950 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    تجاري
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>نوع العقار</label>
                <select
                  value={form.propertyType}
                  onChange={e => setForm((f: any) => ({ ...f, propertyType: e.target.value }))}
                  className={inputCls}
                >
                  {propertyTypeOptions[form.mainCategory || "residential"].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>نوع الصك</label>
                <select
                  value={form.deedType}
                  onChange={e => setForm((f: any) => ({ ...f, deedType: e.target.value }))}
                  className={inputCls}
                >
                  <option value="electronic">إلكتروني</option>
                  <option value="paper">ورقي</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>المدينة</label>
                <input
                  value={form.city}
                  onChange={e => setForm((f: any) => ({ ...f, city: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>الحي</label>
                <input
                  value={form.neighborhood}
                  onChange={e => setForm((f: any) => ({ ...f, neighborhood: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>المساحة المطلوبة (م²)</label>
                <input
                  type="number"
                  value={form.area || ''}
                  onChange={e => setForm((f: any) => ({ ...f, area: parseFloat(e.target.value) || 0 }))}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>السعر الأقصى</label>
                <input
                  type="number"
                  value={form.price || ''}
                  onChange={e => setForm((f: any) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>عمر العقار المفضل</label>
                <input
                  value={form.propertyAge}
                  onChange={e => setForm((f: any) => ({ ...f, propertyAge: e.target.value }))}
                  className={inputCls}
                  placeholder=": جديد، أقل من 5 سنوات..."
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>حالة الأثاث</label>
                <select
                  value={form.furnitureStatus}
                  onChange={e => setForm((f: any) => ({ ...f, furnitureStatus: e.target.value }))}
                  className={inputCls}
                >
                  <option value="unfurnished">غير مفروش</option>
                  <option value="furnished">مفروش</option>
                </select>
              </div>
            </div>
          </div>

          {/* Detailed Specifications Section */}
          {showDetailedFields && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">تفاصيل البناء المطلوبة</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>عدد الغرف</label>
                  <input
                    type="number"
                    value={form.rooms || ''}
                    onChange={e => setForm((f: any) => ({ ...f, rooms: parseInt(e.target.value) || 0 }))}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>دورات المياه</label>
                  <input
                    type="number"
                    value={form.bathrooms || ''}
                    onChange={e => setForm((f: any) => ({ ...f, bathrooms: parseInt(e.target.value) || 0 }))}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>الصالات</label>
                  <input
                    type="number"
                    value={form.livingRooms || ''}
                    onChange={e => setForm((f: any) => ({ ...f, livingRooms: parseInt(e.target.value) || 0 }))}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>المطابخ</label>
                  <input
                    type="number"
                    value={form.kitchens || ''}
                    onChange={e => setForm((f: any) => ({ ...f, kitchens: parseInt(e.target.value) || 0 }))}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>الأدوار</label>
                  <input
                    type="number"
                    value={form.floors || ''}
                    onChange={e => setForm((f: any) => ({ ...f, floors: parseInt(e.target.value) || 0 }))}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>الشقق</label>
                  <input
                    type="number"
                    value={form.apartments || ''}
                    onChange={e => setForm((f: any) => ({ ...f, apartments: parseInt(e.target.value) || 0 }))}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>مساحة البناء (م²)</label>
                  <input
                    type="number"
                    value={form.buildingArea || ''}
                    onChange={e => setForm((f: any) => ({ ...f, buildingArea: parseFloat(e.target.value) || 0 }))}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-6">
                  <label className="flex items-center gap-2 bg-muted border border rounded-xl px-3 py-2 cursor-pointer hover:bg-muted transition-colors">
                    <input
                      type="checkbox"
                      checked={form.hasGarage}
                      onChange={e => setForm((f: any) => ({ ...f, hasGarage: e.target.checked }))}
                      className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-950"
                    />
                    <span className="text-xs font-bold text-slate-700">كراج</span>
                  </label>

                  <label className="flex items-center gap-2 bg-muted border border rounded-xl px-3 py-2 cursor-pointer hover:bg-muted transition-colors">
                    <input
                      type="checkbox"
                      checked={form.hasPool}
                      onChange={e => setForm((f: any) => ({ ...f, hasPool: e.target.checked }))}
                      className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-950"
                    />
                    <span className="text-xs font-bold text-slate-700">مسبح</span>
                  </label>

                  <label className="flex items-center gap-2 bg-muted border border rounded-xl px-3 py-2 cursor-pointer hover:bg-muted transition-colors">
                    <input
                      type="checkbox"
                      checked={form.hasElevator}
                      onChange={e => setForm((f: any) => ({ ...f, hasElevator: e.target.checked }))}
                      className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-950"
                    />
                    <span className="text-xs font-bold text-slate-700">مصعد</span>
                  </label>

                  <label className="flex items-center gap-2 bg-muted border border rounded-xl px-3 py-2 cursor-pointer hover:bg-muted transition-colors">
                    <input
                      type="checkbox"
                      checked={form.hasMaidRoom}
                      onChange={e => setForm((f: any) => ({ ...f, hasMaidRoom: e.target.checked }))}
                      className="w-4 h-4 rounded text-slate-950 border-slate-300 focus:ring-slate-950"
                    />
                    <span className="text-xs font-bold text-slate-700">غرفة خادمة</span>
                  </label>

                  <label className="flex items-center gap-2 bg-muted border border rounded-xl px-3 py-2 cursor-pointer hover:bg-muted transition-colors">
                    <input
                      type="checkbox"
                      checked={form.hasRoof}
                      onChange={e => setForm((f: any) => ({ ...f, hasRoof: e.target.checked }))}
                      className="w-4 h-4 rounded text-slate-950 border-slate-300 focus:ring-slate-950"
                    />
                    <span className="text-xs font-bold text-slate-700">سطح</span>
                  </label>

                  <label className="flex items-center gap-2 bg-muted border border rounded-xl px-3 py-2 cursor-pointer hover:bg-muted transition-colors">
                    <input
                      type="checkbox"
                      checked={form.hasExternalAnnex}
                      onChange={e => setForm((f: any) => ({ ...f, hasExternalAnnex: e.target.checked }))}
                      className="w-4 h-4 rounded text-slate-950 border-slate-300 focus:ring-slate-950"
                    />
                    <span className="text-xs font-bold text-slate-700">ملحق خارجي</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className={labelCls}>تفاصيل إضافية</label>
            <textarea
              value={form.additionalDetails}
              onChange={e => setForm((f: any) => ({ ...f, additionalDetails: e.target.value }))}
              rows={3}
              className="w-full bg-muted border border-transparent focus:border-slate-950 rounded-xl p-3 text-sm font-bold outline-none transition-all resize-none"
              placeholder="اكتب أي متطلبات خاصة أخرى..."
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl bg-slate-950 text-white hover:bg-slate-900 text-sm font-black shadow-xl shadow-stone-400/10">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData ? "تحديث الطلب" : "إرسال الطلب")}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

function AssignOrderModal({ order, onClose, onSuccess }: { order: any; onClose: () => void; onSuccess: () => void }) {
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setCurrentUser(JSON.parse(stored));
        usersApi.findAll().then(res => setUsers(res.data || []));
    }, []);

    const filteredUsers = users.filter(u => 
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search)
    ).slice(0, 10);

    const handleAssign = async (userId: string | null) => {
        setLoading(true);
        try {
            await ordersApi.assign(order.id, userId);
            toast.success("تم التعيين بنجاح");
            onSuccess();
            onClose();
        } catch (err) {
            toast.error("فشل التعيين");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full w-[95vw] sm:max-w-md rounded-2xl p-8 shadow-2xl relative">
                <button onClick={onClose} className="absolute left-8 top-8 p-2 text-slate-300 hover:text-slate-950 transition-colors"><X className="w-5 h-5" /></button>
                
                <h2 className="text-xl font-black text-slate-950 mb-6 flex items-center gap-2">
                    <UserCheck className="w-6 h-6" />
                    تعيين الطلب لـ...
                </h2>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Button onClick={() => handleAssign(currentUser?.id)} variant="outline" className="h-12 rounded-xl border hover:border-slate-950 font-bold gap-2">
                            <UserIcon className="w-4 h-4" /> أنا (Me)
                        </Button>
                        <Button onClick={() => handleAssign(null)} variant="outline" className="h-12 rounded-xl border hover:border-slate-950 font-bold gap-2">
                            <EyeOff className="w-4 h-4" /> مجهول (None)
                        </Button>
                    </div>

                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="ابحث عن موظف أو عميل..." 
                            className="pr-10 h-12 rounded-xl bg-muted border-transparent focus:border-slate-950" 
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                        {filteredUsers.map(u => (
                            <button 
                                key={u.id} 
                                onClick={() => handleAssign(u.id)}
                                className="w-full p-3 rounded-xl hover:bg-muted border border flex items-center justify-between transition-all group"
                            >
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900">{u.firstName} {u.lastName}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{u.role}</p>
                                </div>
                                <ArrowRight className={`w-4 h-4 text-slate-200 group-hover:text-slate-950 group-hover:translate-x-1 ${language === 'ar' ? 'rotate-180' : ''}`} />
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// --- Main Page ---

export default function OrdersPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const confirmDialog = useConfirmDialog();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [publisherFilter, setPublisherFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const itemsPerPage = 10;

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
        toast.error(language === "ar" ? "فشل فتح المحادثة" : "Failed to open chat");
      }
    } catch (error) {
      console.error(error);
      toast.error(language === "ar" ? "حدث خطأ أثناء فتح المحادثة" : "Error opening chat");
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await ordersApi.findAll();
      setOrders(res.data || []);
    } catch (error) {
      toast.error("فشل تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, []);

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: "هل أنت متأكد من حذف هذا الطلب؟",
      description: "سيتم حذف الطلب من لوحة الإدارة.",
      confirmLabel: "حذف الطلب",
      cancelLabel: "إلغاء",
      destructive: true,
    });
    if (!ok) return;
    try {
        await ordersApi.delete(id);
        toast.success("تم الحذف بنجاح");
        fetchOrders();
    } catch (err) {
        toast.error("فشل الحذف");
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
        await ordersApi.updateStatus(id, status);
        toast.success("تم تحديث الحالة");
        fetchOrders();
    } catch (err) {
        toast.error("فشل تحديث الحالة");
    }
  };

  const isResidential = (type: string) => {
    const resTypes = ["فيلا", "شقة", "أرض", "عمارة", "أرض سكنية", "قصر", "بيت شعبي"];
    return resTypes.includes(type);
  };

  const isCommercial = (type: string) => {
    const commTypes = ["محل", "مكتب", "فندق", "برج", "مصنع", "مستودع", "محل تجاري", "تجاري"];
    return commTypes.includes(type);
  };

  const filteredOrders = orders.filter(o => {
    const createdAt = o.createdAt ? new Date(o.createdAt) : null;
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesType = propertyTypeFilter === "all" || 
      (propertyTypeFilter === "residential" && isResidential(o.propertyType)) ||
      (propertyTypeFilter === "commercial" && isCommercial(o.propertyType));
    const matchesPublisher = publisherFilter === "all" || 
      (currentUser && (o.userId === currentUser.id || o.assignedToId === currentUser.id));
    const matchesAssignment =
      assignmentFilter === "all" ||
      (assignmentFilter === "assigned" && Boolean(o.assignedToId || o.assignedTo)) ||
      (assignmentFilter === "unassigned" && !(o.assignedToId || o.assignedTo));
    const matchesFrom = !dateFrom || (createdAt && createdAt >= new Date(dateFrom));
    const matchesTo = !dateTo || (createdAt && createdAt <= new Date(`${dateTo}T23:59:59`));
    const matchesSearch =
        o.propertyType?.toLowerCase().includes(search.toLowerCase()) ||
        o.city?.toLowerCase().includes(search.toLowerCase()) ||
        o.neighborhood?.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        o.clientName?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesType && matchesAssignment && matchesFrom && matchesTo && matchesSearch && matchesPublisher;
  });
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, propertyTypeFilter, publisherFilter, assignmentFilter, dateFrom, dateTo]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-bold px-3 py-1 rounded-full ring-1 ring-amber-200/50">قيد الانتظار</Badge>;
      case 'in_progress': return <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-bold px-3 py-1 rounded-full ring-1 ring-blue-200/50">قيد المعالجة</Badge>;
      case 'completed': return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-3 py-1 rounded-full ring-1 ring-emerald-200/50">مكتمل</Badge>;
      case 'cancelled': return <Badge className="bg-rose-50 text-rose-600 border-rose-100 font-bold px-3 py-1 rounded-full ring-1 ring-rose-200/50">ملغي</Badge>;
      default: return <Badge className="bg-muted text-slate-400 border font-bold px-3 py-1 rounded-full">{status}</Badge>;
    }
  };

  const stats = [
    { label: "إجمالي الطلبات", value: orders.length, icon: ShoppingBag, color: "bg-muted text-slate-700" },
    { label: "طلبات معلقة", value: orders.filter(o => o.status === 'pending').length, icon: Clock, color: "bg-muted text-slate-700" },
    { label: "قيد العمل", value: orders.filter(o => o.status === 'in_progress').length, icon: Play, color: "bg-muted text-slate-700" },
    { label: "طلبات مكتملة", value: orders.filter(o => o.status === 'completed').length, icon: CheckCircle, color: "bg-muted text-slate-700" },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 mb-1">إدارة الطلبات العقارية</h1>
          <p className="text-slate-400 text-xs font-bold">إضافة، تعديل، وتعيين الطلبات للوسطاء والموظفين</p>
        </div>
        <Button 
          onClick={() => { setSelectedOrder(null); setShowCreate(true); }} 
          className="flex items-center gap-2 bg-slate-950 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> إضافة طلب جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={s.label} className="bg-card p-5 rounded-2xl border border shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
                    <s.icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-2xl font-black text-slate-950">{s.value}</p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                </div>
            </motion.div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-card border border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border grid grid-cols-1 gap-3 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <div className="relative w-full md:col-span-2">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في العقار، المدينة، العميل..." className="h-11 pr-11 rounded-xl bg-card border focus:border-slate-950" />
            </div>
            <div className="flex items-center gap-3 w-full md:col-span-2">
                <div className="flex items-center gap-2 p-1.5 bg-muted rounded-2xl">
                    {['all', 'pending', 'in_progress', 'completed'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${statusFilter === s ? 'bg-card text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            {s === 'all' ? 'الكل' : s === 'pending' ? 'المعلق' : s === 'in_progress' ? 'قيد العمل' : 'المكتمل'}
                        </button>
                    ))}
                </div>
            </div>
            <select value={propertyTypeFilter} onChange={(e) => setPropertyTypeFilter(e.target.value)} className="h-11 rounded-xl border border bg-card px-3 text-sm font-bold cursor-pointer">
              <option value="all">الكل (سكني/تجاري)</option>
              <option value="residential">سكني</option>
              <option value="commercial">تجاري</option>
            </select>
            <select value={publisherFilter} onChange={(e) => setPublisherFilter(e.target.value)} className="h-11 rounded-xl border border bg-card px-3 text-sm font-bold cursor-pointer">
              <option value="all">كل الطلبات</option>
              <option value="my_orders">طلباتي فقط</option>
            </select>
            <select value={assignmentFilter} onChange={(e) => setAssignmentFilter(e.target.value)} className="h-11 rounded-xl border border bg-card px-3 text-sm font-bold cursor-pointer">
              <option value="all">كل التعيينات</option>
              <option value="assigned">معين</option>
              <option value="unassigned">غير معين</option>
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-11 rounded-xl border border bg-card px-3 text-sm font-bold" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-11 rounded-xl border border bg-card px-3 text-sm font-bold" />
            <button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); setPropertyTypeFilter("all"); setPublisherFilter("all"); setAssignmentFilter("all"); setDateFrom(""); setDateTo(""); }} className="h-11 rounded-xl border border bg-card px-3 text-sm font-black">
              مسح
            </button>
        </div>

        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="w-20 text-center font-black py-6">ID</TableHead>
                        <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">نوع العقار</TableHead>
                        <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">العميل</TableHead>
                        <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">التفاصيل</TableHead>
                        <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">المسؤول</TableHead>
                        <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">السعر</TableHead>
                        <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">الحالة</TableHead>
                        <TableHead className="w-10"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={8} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-200" /></TableCell></TableRow>
                    ) : filteredOrders.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="py-20 text-center font-bold text-slate-300 italic">لا يوجد طلبات مطابقة للبحث</TableCell></TableRow>
                    ) : paginatedOrders.map(order => (
                        <TableRow key={order.id} className="group hover:bg-muted/50 transition-colors">
                            <TableCell className="text-center font-mono text-[10px] text-slate-400">#{order.id.substring(0, 4)}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-slate-400 group-hover:bg-card group-hover:text-slate-950 transition-all border border-transparent group-hover:border">
                                        <Building className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-950">{order.propertyType}</p>
                                        <p className={`text-[10px] font-black uppercase tracking-tighter ${order.orderType === 'buy' ? 'text-blue-500' : 'text-slate-400'}`}>
                                            {order.orderType === 'buy' ? 'شراء' : 'إيجار'}
                                        </p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                {order.user ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">
                                            {order.user.firstName?.[0]}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-900">{order.user.firstName} {order.user.lastName}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">{order.user.phone}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 italic">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-slate-300">
                                            <UserIcon className="w-4 h-4" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-400">{order.clientName || 'مجهول'}</p>
                                            <p className="text-[10px] text-slate-300 font-bold">{order.clientPhone || 'بدون هاتف'}</p>
                                        </div>
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                                        <MapPin className="w-3 h-3 text-slate-400" />
                                        {order.city} • {order.neighborhood}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 bg-muted px-2 py-0.5 rounded-md">{order.area} م²</span>
                                        {order.rooms > 0 && <span className="text-[10px] font-bold text-slate-400 bg-muted px-2 py-0.5 rounded-md">{order.rooms} غرف</span>}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                {order.assignedTo ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                                            <UserCheck className="w-3 h-3" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">{order.assignedTo.firstName}</span>
                                    </div>
                                ) : (
                                    <button onClick={() => { setAssigningOrder(order); setShowAssign(true); }} className="text-[10px] font-black text-slate-300 hover:text-slate-950 uppercase tracking-widest flex items-center gap-1 transition-colors">
                                        <UserCheck className="w-3 h-3" /> تعيين مسؤول
                                    </button>
                                )}
                            </TableCell>
                            <TableCell>
                                <p className="text-sm font-black text-slate-950">{order.price?.toLocaleString()} <span className="text-[10px] text-slate-400"><SaudiRiyalSymbol iconClassName="h-3 w-3" /></span></p>
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-muted">
                                            <MoreVertical className="w-5 h-5 text-slate-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border">
                                        {(order.user?.id || order.userId) && (
                                            <DropdownMenuItem onClick={() => handleOpenChat(order.user?.id || order.userId)} className="rounded-xl font-bold py-3 text-slate-700 gap-3 cursor-pointer">
                                                <MessageSquare className="w-4 h-4" /> مراسلة العميل
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => window.open(`/orders/${order.id}`, '_blank')} className="rounded-xl font-bold py-3 text-slate-700 gap-3 cursor-pointer">
                                            <Eye className="w-4 h-4" /> معاينة الطلب
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setSelectedOrder(order); setShowCreate(true); }} className="rounded-xl font-bold py-3 text-slate-700 gap-3">
                                            <Edit2 className="w-4 h-4" /> تعديل الطلب
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setAssigningOrder(order); setShowAssign(true); }} className="rounded-xl font-bold py-3 text-slate-700 gap-3">
                                            <UserCheck className="w-4 h-4" /> تغيير المسؤول
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-muted my-1" />
                                        <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">تغيير الحالة</div>
                                        {['pending', 'in_progress', 'completed', 'cancelled'].map(s => (
                                            <DropdownMenuItem key={s} onClick={() => handleUpdateStatus(order.id, s)} className="rounded-xl font-bold py-2 text-slate-600 hover:text-slate-950 gap-3">
                                                <div className={`w-2 h-2 rounded-full ${s === 'pending' ? 'bg-amber-500' : s === 'in_progress' ? 'bg-blue-500' : s === 'completed' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                {s === 'pending' ? 'قيد الانتظار' : s === 'in_progress' ? 'قيد العمل' : s === 'completed' ? 'مكتمل' : 'إلغاء الطلب'}
                                                {order.status === s && <Check className="w-4 h-4 ms-auto text-slate-950" />}
                                            </DropdownMenuItem>
                                        ))}
                                        <DropdownMenuSeparator className="bg-muted my-1" />
                                        <DropdownMenuItem onClick={() => handleDelete(order.id)} className="rounded-xl font-bold py-3 text-rose-600 hover:bg-rose-50 gap-3">
                                            <Trash2 className="w-4 h-4" /> حذف الطلب
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredOrders.length}
          itemsLabel="طلب"
        />
      </div>

      <AnimatePresence>
        {showCreate && <CreateOrderModal initialData={selectedOrder} onClose={() => setShowCreate(false)} onSuccess={fetchOrders} />}
        {showAssign && <AssignOrderModal order={assigningOrder} onClose={() => setShowAssign(false)} onSuccess={fetchOrders} />}
      </AnimatePresence>
    </div>
  );
}
