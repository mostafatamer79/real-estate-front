"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, LineChart, Package, Save, TrendingUp, ArrowUpDown, Eye, EyeOff, Sparkles, Megaphone, Edit2, Trash2, Plus, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import api, { financialApi } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import MarketingCampaignModal from "@/components/marketing/MarketingCampaignModal";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";

export default function AdminTrendsPage() {
  const { language } = useLanguage();
  const { settings, updateSettings, saveSettings } = useSettings();
  const confirmDialog = useConfirmDialog();
  const isRtl = language === "ar";
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);

  useEffect(() => {
    financialApi.getDashboardStats().then((res) => setStats(res.data || null)).catch(() => setStats(null));
    fetchCampaigns();
  }, []);

  const monthlyTotals = Array.isArray(stats?.monthlyTotals) ? stats.monthlyTotals : [];
  const trendText = settings.textOverrides?.admin_trends_note || "";
  const trendTitle = settings.textOverrides?.admin_trends_title || "";
  const detailsOrder = settings.textOverrides?.details_parts_order || "map,stats,charts,ads,previous_logs,quick_actions";
  const categoryLabel = (value: string) => {
    if (value === 'orders') return isRtl ? 'الطلبات' : 'Orders';
    if (value === 'offers') return isRtl ? 'العروض' : 'Offers';
    if (value === 'property_management') return isRtl ? 'إدارة الأملاك' : 'Property management';
    if (value === 'custom') return isRtl ? 'مخصص' : 'Custom';
    return value;
  };
  const detailsParts: Array<{ id: string; label: string; desc: string }> = [
    { id: "map", label: isRtl ? "الخريطة" : "Map", desc: isRtl ? "موقع الخريطة والزر" : "Map block and CTA" },
    { id: "stats", label: isRtl ? "الإحصائيات" : "Stats", desc: isRtl ? "البطاقات التعريفية" : "Info cards" },
    { id: "charts", label: isRtl ? "الرسوم البيانية" : "Charts", desc: isRtl ? "المخططان الرئيسيان" : "Main charts" },
    { id: "ads", label: isRtl ? "الإعلانات" : "Ads", desc: isRtl ? "طلبات الإعلانات" : "Ads requests" },
    { id: "previous_logs", label: isRtl ? "السجل السابق" : "Previous logs", desc: isRtl ? "النشاط السابق" : "Past activity" },
    { id: "quick_actions", label: isRtl ? "الإجراءات السريعة" : "Quick actions", desc: isRtl ? "الأزرار السريعة" : "Fast actions" },
  ];
  const orderPreview = detailsOrder.split(",").map((item) => item.trim()).filter(Boolean);

  const cards = useMemo(
    () => [
      { label: isRtl ? "معدل التحويل" : "Conversion rate", value: `${stats?.conversionRate || 0}%` },
      { label: isRtl ? "صافي الربح" : "Net profit", value: Number(stats?.netProfit || 0).toLocaleString(isRtl ? "ar-SA" : "en-US") },
      { label: isRtl ? "العمولات" : "Commission", value: Number(stats?.totalCommission || 0).toLocaleString(isRtl ? "ar-SA" : "en-US") },
    ],
    [isRtl, stats],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await saveSettings();
      if (ok) toast.success(isRtl ? "تم حفظ التحليلات" : "Analytics saved");
      else toast.error(isRtl ? "تعذر الحفظ" : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updatePartFlag = (id: string, value: 'enabled' | 'soon' | 'hidden') => {
    updateSettings({
      detailsPartFlags: {
        ...(settings.detailsPartFlags || {}),
        [id]: value,
      },
    });
  };

  const fetchCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const res = await api.get('/marketing/email-marketing');
      setCampaigns(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    const ok = await confirmDialog({
      title: isRtl ? "حذف الإعلان" : "Delete ad",
      confirmLabel: isRtl ? "حذف" : "Delete",
      cancelLabel: isRtl ? "إلغاء" : "Cancel",
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/marketing/email-marketing/${id}`);
      toast.success(isRtl ? "تم الحذف" : "Deleted");
      fetchCampaigns();
    } catch {
      toast.error(isRtl ? "فشل الحذف" : "Delete failed");
    }
  };

  const updateCampaignOrder = async (campaign: any, sortOrder: number) => {
    try {
      await api.patch(`/marketing/email-marketing/${campaign.id}`, { sortOrder });
      fetchCampaigns();
    } catch {
      toast.error(isRtl ? "تعذر حفظ الترتيب" : "Failed to save order");
    }
  };

  return (
    <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
          <LineChart className="h-3.5 w-3.5" />
          {isRtl ? "تحليلات والاتجاهات" : "Analytics & Trends"}
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950">
          {isRtl ? "تحليلات واتجاهات المنصة" : "Platform Analytics & Trends"}
        </h1>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-950">
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-black text-slate-950">{isRtl ? "الاتجاه الشهري" : "Monthly trend"}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {monthlyTotals.slice(-6).map((item: any, index: number) => (
            <div key={item.month || index} className="rounded-xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.month || index + 1}</p>
              <p className="mt-1 text-lg font-black text-slate-950">{Number(item.total || item.revenue || 0).toLocaleString(isRtl ? "ar-SA" : "en-US")}</p>
            </div>
          ))}
          {!monthlyTotals.length && (
            <div className="col-span-full py-10 text-center text-xs font-black uppercase tracking-widest text-slate-300">
              {isRtl ? "لا توجد بيانات شهرية" : "No monthly data"}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-950">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">{isRtl ? "إدارة الإعلانات" : "Ads management"}</h2>
              <p className="text-xs font-bold text-slate-400">{isRtl ? "إنشاء وترتيب الحملات البريدية" : "Create and sort email campaigns"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setEditingCampaign(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white"
          >
            <Plus className="h-4 w-4" />
            {isRtl ? "إعلان جديد" : "New ad"}
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          {loadingCampaigns ? (
            <div className="p-10 text-center text-xs font-black uppercase tracking-widest text-slate-400">
              <RefreshCcw className="mx-auto mb-3 h-5 w-5 animate-spin" />
              {isRtl ? "جاري التحميل..." : "Loading..."}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-10 text-center text-xs font-black uppercase tracking-widest text-slate-400">
              {isRtl ? "لا توجد إعلانات" : "No ads campaigns"}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {campaigns.map((campaign, index) => (
                <div key={campaign.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{campaign.subject || campaign.category}</p>
                    <p className="text-[11px] font-bold text-slate-400">
                      {categoryLabel(campaign.category)} • {campaign.frequency} • {campaign.targetRole || (isRtl ? "الكل" : "All")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      defaultValue={campaign.sortOrder ?? index * 10}
                      onBlur={(e) => updateCampaignOrder(campaign, Number(e.target.value) || 0)}
                      className="w-24 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-black outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => { setEditingCampaign(campaign); setModalOpen(true); }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700"
                    >
                      <Edit2 className="h-4 w-4" />
                      {isRtl ? "تعديل" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCampaign(campaign.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isRtl ? "حذف" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isRtl ? "عنوان التحليل" : "Analysis title"}
            </label>
            <input
              value={trendTitle}
              onChange={(event) =>
                updateSettings({
                  textOverrides: {
                    ...settings.textOverrides,
                    admin_trends_title: event.target.value,
                  },
                })
              }
              className="h-12 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-slate-900"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isRtl ? "ملاحظة الاتجاهات" : "Trends note"}
            </label>
            <textarea
              value={trendText}
              onChange={(event) =>
                updateSettings({
                  textOverrides: {
                    ...settings.textOverrides,
                    admin_trends_note: event.target.value,
                  },
                })
              }
              className="min-h-28 w-full rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold outline-none focus:border-slate-900"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? (isRtl ? "جار الحفظ..." : "Saving...") : (isRtl ? "حفظ" : "Save")}
        </button>
      </section>

  
      <MarketingCampaignModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCampaign(null);
        }}
        onSuccess={fetchCampaigns}
        campaign={editingCampaign}
      />
    </div>
  );
}
