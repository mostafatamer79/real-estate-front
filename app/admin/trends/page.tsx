"use client";

import React, { useEffect, useMemo, useState } from "react";
import { LineChart, Save, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { financialApi } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";

export default function AdminTrendsPage() {
  const { language } = useLanguage();
  const { settings, updateSettings, saveSettings } = useSettings();
  const isRtl = language === "ar";
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    financialApi.getDashboardStats().then((res) => setStats(res.data || null)).catch(() => setStats(null));
  }, []);

  const monthlyTotals = Array.isArray(stats?.monthlyTotals) ? stats.monthlyTotals : [];
  const trendText = settings.textOverrides?.admin_trends_note || "";
  const trendTitle = settings.textOverrides?.admin_trends_title || "";

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
    </div>
  );
}
