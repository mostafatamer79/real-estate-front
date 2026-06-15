"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ordersApi } from "@/lib/api";
import { Order } from "@/types/api";
import { useLanguage } from "@/context/LanguageContext";
import {
  Loader2, ArrowRight, MapPin, Ruler, Calendar, FileText,
  CheckCircle2, Building2, User as UserIcon, Phone, Mail,
  Shield, Clock, Home, Layers, Bath, ChefHat, Layers2,
  Car, Sofa, Tag, Hash, BedDouble, Warehouse
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: "قيد الانتظار", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  in_progress: { label: "قيد التنفيذ",  color: "text-blue-700",   bg: "bg-blue-50 border-blue-200"  },
  completed:   { label: "مكتمل",        color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  cancelled:   { label: "ملغي",         color: "text-red-700",    bg: "bg-red-50 border-red-200"    },
};

const DEED_MAP: Record<string, string> = {
  electronic: "إلكتروني", paper: "ورقي", digital: "رقمي",
};

function InfoRow({ label, value, icon: Icon }: { label: string; value?: any; icon?: any }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="flex items-center gap-2 text-slate-500 text-sm font-medium">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        {label}
      </span>
      <span className="font-bold text-slate-800 text-sm">{value}</span>
    </div>
  );
}

function FeatureBadge({ active, label }: { active?: boolean; label: string }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
      <CheckCircle2 className="w-3.5 h-3.5" /> {label}
    </span>
  );
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { language } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const isRtl = language === "ar";

  const handleBack = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      let isAdmin = false;
      try { const p = JSON.parse(stored || "{}"); isAdmin = p.role === "admin" || p.role === "super_admin"; } catch {}
      if (document.referrer?.includes("/admin")) { router.push("/admin/orders"); return; }
      router.push(isAdmin ? "/admin/orders" : "/orders");
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (params.id) {
          const res = await ordersApi.findOne(params.id as string);
          setOrder(res.data);
        }
      } catch {
        toast.error("تعذّر تحميل بيانات الطلب");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4 text-slate-500">
        <Building2 className="w-12 h-12 text-slate-200" />
        <p className="font-bold">الطلب غير موجود</p>
        <button onClick={() => router.push("/orders")} className="text-sm text-slate-400 hover:text-slate-700 underline">
          العودة للطلبات
        </button>
      </div>
    );
  }

  const status = (order.status ? STATUS_MAP[order.status] : null) || { label: order.status || "", color: "text-slate-700", bg: "bg-slate-50 border-slate-200" };
  const user = (order as any).user;
  const assignedTo = (order as any).assignedTo;

  return (
    <div className="min-h-screen bg-slate-50/50" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Back Button */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-bold"
        >
          <ArrowRight className={`w-4 h-4 ${!isRtl ? "rotate-180" : ""}`} />
          {isRtl ? "العودة" : "Back"}
        </button>

        {/* Header */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                <Tag className="w-3 h-3" />
                {order.orderType === "buy" ? "شراء" : "إيجار"}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${status.bg} ${status.color}`}>
                {status.label}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {order.propertyType}
            </h1>
            <p className="text-slate-500 text-sm flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {order.city}{order.neighborhood ? ` — ${order.neighborhood}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Calendar className="w-4 h-4" />
            {new Date(order.createdAt).toLocaleDateString(isRtl ? "ar-SA" : "en-US", {
              year: "numeric", month: "long", day: "numeric"
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Main Details */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> المعلومات الأساسية
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <InfoRow label="نوع العقار"   value={order.propertyType}  icon={Building2} />
                <InfoRow label="المدينة"       value={order.city}          icon={MapPin} />
                <InfoRow label="الحي"          value={order.neighborhood}  icon={MapPin} />
                <InfoRow label="المساحة"       value={order.area ? `${Number(order.area).toLocaleString()} م²` : undefined} icon={Ruler} />
                <InfoRow label="السعر المطلوب" value={order.price ? `${Number(order.price).toLocaleString()} ريال` : undefined} icon={Tag} />
                <InfoRow label="عمر العقار"   value={order.propertyAge}   icon={Clock} />
                <InfoRow label="نوع الصك"     value={DEED_MAP[order.deedType] || order.deedType} icon={FileText} />
                <InfoRow label="نوع الصفقة"   value={order.orderType === "buy" ? "شراء" : "إيجار"} icon={Tag} />
              </div>
            </div>

            {/* Room Details */}
            {(order.rooms || order.bathrooms || order.livingRooms || order.kitchens || order.floors || order.apartments || order.buildingArea) && (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> بيانات تفصيلية
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <InfoRow label="عدد الغرف"        value={order.rooms}        icon={BedDouble} />
                  <InfoRow label="دورات المياه"      value={order.bathrooms}    icon={Bath} />
                  <InfoRow label="غرف المعيشة"       value={(order as any).livingRooms}  icon={Sofa} />
                  <InfoRow label="المطابخ"           value={(order as any).kitchens}     icon={ChefHat} />
                  <InfoRow label="عدد الأدوار"       value={(order as any).floors}       icon={Layers2} />
                  <InfoRow label="عدد الشقق"         value={(order as any).apartments}   icon={Home} />
                  <InfoRow label="مساحة البناء"      value={(order as any).buildingArea ? `${Number((order as any).buildingArea).toLocaleString()} م²` : undefined} icon={Ruler} />
                  <InfoRow label="حالة الأثاث"       value={(order as any).furnitureStatus} icon={Warehouse} />
                </div>
              </div>
            )}

            {/* Features */}
            {(order.hasGarage || order.hasPool || order.hasElevator || order.hasMaidRoom || (order as any).hasRoof || (order as any).hasExternalAnnex) && (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> المميزات المطلوبة
                </h2>
                <div className="flex flex-wrap gap-2">
                  <FeatureBadge active={order.hasGarage}               label="كراج" />
                  <FeatureBadge active={order.hasPool}                  label="مسبح" />
                  <FeatureBadge active={order.hasElevator}              label="مصعد" />
                  <FeatureBadge active={order.hasMaidRoom}              label="غرفة خادمة" />
                  <FeatureBadge active={(order as any).hasRoof}         label="روف" />
                  <FeatureBadge active={(order as any).hasExternalAnnex} label="ملحق خارجي" />
                </div>
              </div>
            )}

            {/* Additional Notes */}
            {order.additionalDetails && (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> تفاصيل إضافية
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  {order.additionalDetails}
                </p>
              </div>
            )}

            {/* Client Info (if anonymous) */}
            {((order as any).clientName || (order as any).clientPhone) && !user && (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" /> بيانات العميل
                </h2>
                <InfoRow label="اسم العميل"   value={(order as any).clientName}  icon={UserIcon} />
                <InfoRow label="هاتف العميل"  value={(order as any).clientPhone} icon={Phone} />
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Order ID & Status */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Hash className="w-4 h-4" /> معلومات الطلب
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">رقم الطلب</p>
                  <p className="font-mono text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 break-all">
                    {order.id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">الحالة</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-bold ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">تاريخ الإنشاء</p>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(order.createdAt).toLocaleDateString(isRtl ? "ar-SA" : "en-US", {
                      year: "numeric", month: "long", day: "numeric"
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* User Card */}
            {user && (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" /> صاحب الطلب
                </h2>
                <div className="flex items-center gap-3 mb-4">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.firstName} className="w-12 h-12 rounded-2xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-black text-lg">
                      {user.firstName?.[0] || <UserIcon className="w-5 h-5" />}
                    </div>
                  )}
                  <div>
                    <p className="font-black text-slate-900">{user.firstName} {user.lastName}</p>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {user.email && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-600 font-medium break-all">{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-600 font-medium">{user.phone}</span>
                    </div>
                  )}
                  {user.city && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-600 font-medium">{user.city}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                    {user.isVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                        <Shield className="w-3 h-3" /> موثق
                      </span>
                    )}
                    {user.isActive && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
                        <CheckCircle2 className="w-3 h-3" /> فعّال
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Assigned To */}
            {assignedTo && (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> المسؤول عن الطلب
                </h2>
                <div className="flex items-center gap-3">
                  {assignedTo.profileImage ? (
                    <img src={assignedTo.profileImage} alt={assignedTo.firstName} className="w-10 h-10 rounded-2xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-sm">
                      {assignedTo.firstName?.[0] || <UserIcon className="w-4 h-4" />}
                    </div>
                  )}
                  <div>
                    <p className="font-black text-slate-900 text-sm">{assignedTo.firstName} {assignedTo.lastName}</p>
                    {assignedTo.email && <p className="text-xs text-slate-400">{assignedTo.email}</p>}
                    {assignedTo.phone && <p className="text-xs text-slate-400">{assignedTo.phone}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Client info (if present alongside user) */}
            {((order as any).clientName || (order as any).clientPhone) && user && (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> بيانات التواصل
                </h2>
                <InfoRow label="الاسم"  value={(order as any).clientName}  icon={UserIcon} />
                <InfoRow label="الهاتف" value={(order as any).clientPhone} icon={Phone} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
