"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { serviceRequestApi, ServiceRequest, ServiceStatus } from "@/lib/service-request-api";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Building2,
  Check,
  Clock,
  Loader2,
  MessageSquare,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  SaudiRiyalIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import MobileAppHeader from "@/app/src/components/MobileAppHeader";
import PullToRefresh from "@/components/shared/PullToRefresh";
import { useAuth } from "@/hooks/useAuth";

const STAFF_ROLES = new Set([
  "admin",
  "agent",
  "manager",
  "employee",
  "marketing",
  "marketing_admin",
  "legal",
  "legal_admin",
  "finance",
  "finance_admin",
]);

const departmentLabels: Record<string, string> = {
  admin: "الإدارة",
  agent: "الوسيط",
  marketing: "التسويق",
  finance: "المالية",
  legal: "القانونية",
  properties: "الأملاك",
  employees: "الموظفين",
  real_estate: "الأملاك",
};

type RequestFilter = "all" | "accepted" | "rejected";

export default function MyServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, { price: string; note: string; deptSlug: string }>>({});
  const [search, setSearch] = useState("");
  const [requestFilter, setRequestFilter] = useState<RequestFilter>("all");
  const { t, language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const confirmDialog = useConfirmDialog();

  const role = String((user as any)?.role || "");
  const isAdmin = role === "admin";
  const canManageRequests = STAFF_ROLES.has(role);

  const defaultDeptSlug = useMemo(() => {
    const departments = Array.isArray((user as any)?.departments) ? (user as any).departments : [];
    if (isAdmin) return "admin";
    if (role === "agent") return "agent";
    return departments[0] || role || "agent";
  }, [isAdmin, role, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!canManageRequests) {
      setLoading(false);
      return;
    }
    fetchRequests();
  }, [authLoading, canManageRequests]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await serviceRequestApi.findAll({ page: 1, limit: 200 });
      setRequests(response.data.items || []);
    } catch (error) {
      console.error("Error fetching service requests:", error);
      toast.error(t("common.error") || "تعذر تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  const getDraft = (request: ServiceRequest) =>
    priceDrafts[request.id] || {
      price: request.price ? String(request.price) : "",
      note: "",
      deptSlug: defaultDeptSlug,
    };

  const updateDraft = (request: ServiceRequest, key: "price" | "note" | "deptSlug", value: string) => {
    setPriceDrafts((current) => ({
      ...current,
      [request.id]: { ...getDraft(request), [key]: value },
    }));
  };

  const submitPrice = async (request: ServiceRequest) => {
    const draft = getDraft(request);
    const price = Number(draft.price);
    if (!price || price < 0) {
      toast.error("أدخل سعر صحيح");
      return;
    }

    setSavingId(request.id);
    try {
      const response = await serviceRequestApi.addDepartmentPrice(request.id, {
        price,
        note: draft.note,
        deptSlug: draft.deptSlug || defaultDeptSlug,
      });
      toast.success("تم إرسال السعر بانتظار اعتماد الإدارة");
      setSelectedRequest(response.data);
      await fetchRequests();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "تعذر إرسال السعر");
    } finally {
      setSavingId(null);
    }
  };

  const confirmOffer = async (request: ServiceRequest, deptSlug: string) => {
    if (!isAdmin) return;
    const ok = await confirmDialog({
      title: "اعتماد السعر؟",
      description: "بعد الاعتماد ستظهر الفاتورة للعميل في المحفظة للدفع.",
      confirmLabel: "اعتماد وإرسال للمحفظة",
      cancelLabel: "إلغاء",
    });
    if (!ok) return;

    setSavingId(request.id);
    try {
      const response = await serviceRequestApi.acceptDepartmentOffer(request.id, deptSlug);
      toast.success("تم اعتماد السعر وإظهار الفاتورة في محفظة العميل");
      setSelectedRequest(response.data);
      await fetchRequests();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "تعذر اعتماد السعر");
    } finally {
      setSavingId(null);
    }
  };

  const openChat = async (requestId: string) => {
    setSavingId(requestId);
    try {
      const response = await serviceRequestApi.getOrCreateChat(requestId);
      router.push(`/chat?roomId=${response.data.chatRoomId}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "تعذر فتح المحادثة");
    } finally {
      setSavingId(null);
    }
  };

  const getStatusBadge = (request: ServiceRequest) => {
    if (request.adminAccepted || request.clientDecision === "accepted") {
      return <Badge variant="outline" className="border-emerald-100 bg-emerald-50 text-emerald-700">معتمد للمحفظة</Badge>;
    }
    if (Object.keys(request.departmentPrices || {}).length > 0) {
      return <Badge variant="outline" className="border-amber-100 bg-amber-50 text-amber-700">بانتظار اعتماد الإدارة</Badge>;
    }
    switch (request.status) {
      case ServiceStatus.PENDING:
        return <Badge variant="outline" className="border-slate-300 bg-card text-slate-600">قيد المراجعة</Badge>;
      case ServiceStatus.IN_PROGRESS:
        return <Badge variant="outline" className="border-slate-300 bg-card text-slate-600">قيد المعالجة</Badge>;
      case ServiceStatus.COMPLETED:
        return <Badge variant="outline" className="border-slate-300 bg-card text-slate-600">مكتمل</Badge>;
      case ServiceStatus.CANCELLED:
        return <Badge variant="outline" className="border-red-100 bg-red-50 text-red-600">ملغي</Badge>;
      default:
        return <Badge variant="outline" className="border-slate-300 bg-card text-slate-600">{request.status}</Badge>;
    }
  };

  const isAcceptedRequest = (request: ServiceRequest) =>
    Boolean(request.adminAccepted || request.clientDecision === "accepted" || request.status === ServiceStatus.COMPLETED);

  const isRejectedRequest = (request: ServiceRequest) =>
    Boolean(request.clientDecision === "rejected" || request.status === ServiceStatus.CANCELLED);

  const filterRequests = (request: ServiceRequest) => {
    if (requestFilter === "accepted") return isAcceptedRequest(request);
    if (requestFilter === "rejected") return isRejectedRequest(request);
    return true;
  };

  const filteredRequests = requests.filter((request) => {
    if (!filterRequests(request)) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [request.serviceType, request.clientName, request.phone, request.city, request.district, request.category]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center" dir="rtl">
        <div className="flex items-center gap-3 text-slate-500 font-bold">
          <Loader2 className="h-5 w-5 animate-spin" />
          جاري تحميل طلبات الخدمات...
        </div>
      </div>
    );
  }

  if (!canManageRequests) {
    return (
      <div className="min-h-screen bg-muted" dir={language === "ar" ? "rtl" : "ltr"}>
        <MobileAppHeader title="طلبات الخدمات" theme="light" />
        <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-card border text-slate-500">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-950">هذه الصفحة للإدارة والفريق فقط</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
            طلبك يتم مراجعته من الفريق. عند اعتماد السعر من الإدارة ستظهر الفاتورة مباشرة في المحفظة.
          </p>
          <Button onClick={() => router.push("/wallet")} className="mt-6 rounded-2xl bg-slate-950 px-6 text-white hover:bg-black">
            الذهاب إلى المحفظة
          </Button>
        </main>
      </div>
    );
  }

  const requestForDetails = selectedRequest;

  if (requestForDetails) {
    const draft = getDraft(requestForDetails);
    const offers = requestForDetails.departmentPrices || {};
    const acceptedOffer = requestForDetails.metadata?.acceptedOffer;

    return (
      <div className="min-h-screen bg-muted" dir={language === "ar" ? "rtl" : "ltr"}>
        <MobileAppHeader title="تفاصيل طلب الخدمة" theme="light" />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-4 pb-12">
          <Button variant="ghost" className="mb-6 gap-2 text-slate-500 hover:text-slate-900" onClick={() => setSelectedRequest(null)}>
            <ArrowLeft className={`h-4 w-4 ${language === "ar" ? "rotate-180" : ""}`} />
            العودة للطلبات
          </Button>

          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b bg-card p-5 sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-950">{requestForDetails.serviceType || "طلب خدمة"}</h1>
                    <p className="mt-1 text-xs font-bold text-slate-400">#{requestForDetails.id.substring(0, 8)} · {new Date(requestForDetails.createdAt).toLocaleDateString("ar-SA")}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(requestForDetails)}
                  <Button variant="outline" className="h-10 rounded-xl gap-2" onClick={() => openChat(requestForDetails.id)} disabled={savingId === requestForDetails.id}>
                    <MessageSquare className="h-4 w-4" />
                    محادثة الطلب
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoTile label="العميل" value={requestForDetails.clientName || requestForDetails.user?.firstName || "-"} />
                  <InfoTile label="الجوال" value={requestForDetails.phone || requestForDetails.user?.phone || "-"} />
                  <InfoTile label="الموقع" value={`${requestForDetails.city || "-"}، ${requestForDetails.district || "-"}`} />
                  <InfoTile label="القسم" value={departmentLabels[requestForDetails.targetDepartment || ""] || requestForDetails.targetDepartment || "-"} />
                </div>
                <div className="rounded-2xl border bg-muted p-4">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">وصف الطلب</p>
                  <p className="text-sm font-bold leading-7 text-slate-700">{requestForDetails.description || "لا يوجد وصف"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <SaudiRiyalIcon className="h-4 w-4 text-slate-500" />
                    <h2 className="text-sm font-black text-slate-950">إرسال سعر للفريق الإداري</h2>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="number"
                      min="0"
                      value={draft.price}
                      onChange={(event) => updateDraft(requestForDetails, "price", event.target.value)}
                      className="h-11 w-full rounded-xl border bg-muted px-4 text-sm font-black outline-none focus:border-slate-950"
                      placeholder="السعر"
                    />
                    <input
                      value={draft.deptSlug}
                      onChange={(event) => updateDraft(requestForDetails, "deptSlug", event.target.value)}
                      className="h-11 w-full rounded-xl border bg-muted px-4 text-sm font-bold outline-none focus:border-slate-950"
                      placeholder="القسم / المزود"
                      dir="ltr"
                    />
                    <textarea
                      value={draft.note}
                      onChange={(event) => updateDraft(requestForDetails, "note", event.target.value)}
                      className="h-24 w-full resize-none rounded-xl border bg-muted p-4 text-sm font-bold outline-none focus:border-slate-950"
                      placeholder="ملاحظة داخلية عن السعر"
                    />
                    <Button className="h-11 w-full rounded-xl bg-slate-950 text-white hover:bg-black" disabled={savingId === requestForDetails.id} onClick={() => submitPrice(requestForDetails)}>
                      {savingId === requestForDetails.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <SaudiRiyalIcon className="h-4 w-4" />}
                      إرسال السعر
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                  <h2 className="mb-4 text-sm font-black text-slate-950">عروض الأسعار</h2>
                  <div className="space-y-3">
                    {Object.entries(offers).map(([dept, offer]) => {
                      const isAccepted = acceptedOffer?.dept === dept;
                      return (
                        <div key={dept} className={`rounded-xl border p-4 ${isAccepted ? "border-emerald-100 bg-emerald-50" : "bg-muted"}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-slate-900">{departmentLabels[dept] || dept}</p>
                              <p className="mt-1 text-xs font-bold text-slate-500">{offer.note || "بدون ملاحظات"}</p>
                            </div>
                            <p className="text-sm font-black text-slate-950"><SaudiRiyalAmount amount={offer.price} locale="ar-SA" /></p>
                          </div>
                          {isAdmin && !acceptedOffer && (
                            <Button className="mt-3 h-9 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" disabled={savingId === requestForDetails.id} onClick={() => confirmOffer(requestForDetails, dept)}>
                              <Check className="h-4 w-4" />
                              اعتماد وإظهارها في المحفظة
                            </Button>
                          )}
                          {isAccepted && <p className="mt-3 text-[10px] font-black text-emerald-700">تم اعتماد هذا السعر وإرساله للمحفظة</p>}
                        </div>
                      );
                    })}
                    {Object.keys(offers).length === 0 && (
                      <div className="rounded-xl border border-dashed bg-muted p-8 text-center text-sm font-bold text-slate-400">
                        لا توجد أسعار مرسلة بعد
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={fetchRequests}>
      <div className="min-h-screen bg-card" dir={language === "ar" ? "rtl" : "ltr"}>
        <MobileAppHeader title="طلبات الخدمات" theme="light" />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-4 pb-12">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Button variant="ghost" className="mb-4 gap-2 text-slate-500 hover:text-slate-900" onClick={() => router.back()}>
                <ArrowLeft className={`h-4 w-4 ${language === "ar" ? "rotate-180" : ""}`} />
                رجوع
              </Button>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black text-slate-600">
                  {isAdmin ? "لوحة المشرف" : "بوابة الوكيل"}
                </span>
                <span className="rounded-full border border-slate-200 bg-card px-3 py-1 text-[10px] font-bold text-slate-400">
                  {isAdmin ? "اعتماد الأسعار وإدارة جميع الطلبات" : "تقديم عروض الأسعار ومتابعة الطلبات"}
                </span>
              </div>
              <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-950">
                <Package className="h-6 w-6 text-slate-600" />
                {isAdmin ? "إدارة طلبات الخدمات" : "طلبات خدمات الوكيل"}
              </h1>
              <p className="mt-2 text-sm font-bold text-slate-500">إرسال الأسعار من الفريق ثم اعتمادها من الإدارة قبل ظهورها في محفظة العميل.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-11 w-full rounded-xl border bg-muted pr-10 pl-4 text-sm font-bold outline-none focus:border-slate-950 sm:w-80"
                  placeholder="بحث في الطلبات"
                />
              </div>
              <Button variant="outline" className="h-11 rounded-xl gap-2" onClick={fetchRequests}>
                <RefreshCw className="h-4 w-4" />
                تحديث
              </Button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border bg-muted p-1.5 sm:max-w-2xl sm:gap-3">
            {([
              { id: "all", label: "كل الخدمات", count: requests.length },
              { id: "accepted", label: "الخدمات المقبولة", count: requests.filter(isAcceptedRequest).length },
              { id: "rejected", label: "الخدمات المرفوضة", count: requests.filter(isRejectedRequest).length },
            ] as const).map((tab) => {
              const active = requestFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRequestFilter(tab.id)}
                  className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-center text-[10px] font-black transition-all sm:text-xs ${
                    active ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-card hover:text-slate-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${active ? "bg-card/15 text-white" : "bg-card text-slate-400"}`}>{tab.count}</span>
                </button>
              );
            })}
          </div>

          {filteredRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
              <Clock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-black text-slate-400">لا توجد خدمات ضمن هذا التصنيف</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredRequests.map((request) => {
                const offersCount = Object.keys(request.departmentPrices || {}).length;
                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedRequest(request)}
                    className="group rounded-2xl border bg-card p-5 text-right shadow-sm transition-all hover:border-slate-300 hover:shadow-lg"
                  >
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-slate-600">
                        <Building2 className="h-5 w-5" />
                      </div>
                      {getStatusBadge(request)}
                    </div>
                    <h2 className="line-clamp-1 text-base font-black text-slate-950">{request.serviceType || "طلب خدمة"}</h2>
                    <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-500">{request.clientName || request.user?.firstName || "عميل"} · {request.phone || request.user?.phone || "-"}</p>
                    <div className="mt-5 grid grid-cols-2 gap-2 border-t pt-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-300">العروض</p>
                        <p className="text-sm font-black text-slate-900">{offersCount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-300">السعر الحالي</p>
                        <p className="text-sm font-black text-slate-900"><SaudiRiyalAmount amount={request.price || 0} locale="ar-SA" /></p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </PullToRefresh>
  );
}

function InfoTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-muted p-4">
      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}
