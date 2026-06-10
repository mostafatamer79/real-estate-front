"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Map, Save, FileText, Lock, Unlock, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";

export default function AdminMapControlPage() {
  const { language } = useLanguage();
  const { settings, updateSettings, saveSettings } = useSettings();
  const isRtl = language === "ar";
  const [saving, setSaving] = useState(false);

  const mapOpen = settings.sectionFlags?.map !== "closed";
  const reportPrice = settings.servicePrices?.service_price_scan_report || 0;
  const reportTitle = settings.textOverrides?.scan_report_title || "";
  const reportNote = settings.textOverrides?.scan_report_note || "";

  const controls = useMemo(
    () => [
      {
        label: isRtl ? "الخريطة" : "Map",
        value: mapOpen ? (isRtl ? "مفتوحة" : "Open") : (isRtl ? "مغلقة" : "Closed"),
        icon: mapOpen ? Unlock : Lock,
      },
      {
        label: isRtl ? "سعر التقرير" : "Report price",
        value: `${reportPrice} ${isRtl ? "ر.س" : "SAR"}`,
        icon: FileText,
      },
    ],
    [isRtl, mapOpen, reportPrice],
  );

  const patchSettings = (patch: any) => updateSettings(patch);

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await saveSettings();
      if (ok) toast.success(isRtl ? "تم حفظ إعدادات الخريطة" : "Map settings saved");
      else toast.error(isRtl ? "تعذر حفظ الإعدادات" : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
            <Map className="h-3.5 w-3.5" />
            {isRtl ? "الخريطة" : "Map"}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            {isRtl ? "إدارة الخريطة والتقارير" : "Map & Reports Control"}
          </h1>
        </div>
        <Link
          href="/scan-map"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[11px] font-black uppercase tracking-widest text-slate-700 hover:border-slate-900"
        >
          <ExternalLink className="h-4 w-4" />
          {isRtl ? "فتح الخريطة" : "Open map"}
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {controls.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-950">
              <item.icon className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isRtl ? "حالة الخريطة" : "Map status"}
            </label>
            <div className="flex rounded-xl bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => patchSettings({ sectionFlags: { ...settings.sectionFlags, map: "open" } })}
                className={`h-11 flex-1 rounded-lg text-xs font-black ${mapOpen ? "bg-slate-950 text-white" : "text-slate-500"}`}
              >
                {isRtl ? "فتح المناطق" : "Open areas"}
              </button>
              <button
                type="button"
                onClick={() => patchSettings({ sectionFlags: { ...settings.sectionFlags, map: "closed" } })}
                className={`h-11 flex-1 rounded-lg text-xs font-black ${!mapOpen ? "bg-slate-950 text-white" : "text-slate-500"}`}
              >
                {isRtl ? "إغلاق المناطق" : "Close areas"}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isRtl ? "سعر التقارير" : "Report price"}
            </label>
            <input
              type="number"
              min="0"
              value={reportPrice}
              onChange={(event) =>
                patchSettings({
                  servicePrices: {
                    ...settings.servicePrices,
                    service_price_scan_report: Number(event.target.value) || 0,
                  },
                })
              }
              className="h-12 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-slate-900"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isRtl ? "عنوان التقرير" : "Report title"}
            </label>
            <input
              value={reportTitle}
              onChange={(event) =>
                patchSettings({
                  textOverrides: {
                    ...settings.textOverrides,
                    scan_report_title: event.target.value,
                  },
                })
              }
              className="h-12 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-slate-900"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isRtl ? "نص يظهر في التقرير" : "Report note"}
            </label>
            <textarea
              value={reportNote}
              onChange={(event) =>
                patchSettings({
                  textOverrides: {
                    ...settings.textOverrides,
                    scan_report_note: event.target.value,
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
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? (isRtl ? "جار الحفظ..." : "Saving...") : (isRtl ? "حفظ التعديلات" : "Save changes")}
        </button>
      </section>
    </div>
  );
}
