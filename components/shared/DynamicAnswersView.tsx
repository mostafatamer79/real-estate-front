"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";
import { ServiceFormDef } from "@/types/service-form";
import { coerceServiceFormDef, getPath, resolveServiceForm } from "@/lib/service-forms";
import { LEGAL_SUBCATEGORIES } from "@/lib/service-catalog";

const SKIP_TYPES = new Set(["file", "terms", "divider"]);
const JSONB_ROOTS = ["metadata", "firstParty", "secondParty"] as const;

/** Flatten a nested object into dotted-path entries with primitive values. */
function flatten(obj: any, prefix: string, out: { path: string; value: string }[] = []) {
  if (!obj || typeof obj !== "object") return out;
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "object") {
      flatten(value, path, out);
    } else {
      out.push({ path, value: String(value) });
    }
  }
  return out;
}

/** Extract the literal prefix of a serviceTypeTemplate ("عقد - {type}" → "عقد -"). */
function templatePrefix(tpl: ServiceFormDef["serviceTypeTemplate"]): string {
  if (typeof tpl === "string") return tpl.split("{")[0].trim();
  if (Array.isArray(tpl)) {
    const first = tpl.find((r) => r && typeof r.template === "string");
    return first ? first.template.split("{")[0].trim() : "";
  }
  return "";
}

/** Pick the legal sub-form def that matches the request's composed serviceType. */
function pickLegalDef(
  request: any,
  serviceForms: Record<string, string> | undefined,
): ServiceFormDef | null {
  const candidates = LEGAL_SUBCATEGORIES.map((s) =>
    resolveServiceForm(s.formKey, serviceForms),
  ).filter((d): d is ServiceFormDef => !!d);
  const serviceType: string = request?.serviceType || "";
  const match = candidates.find((def) => {
    const prefix = templatePrefix(def.serviceTypeTemplate);
    return !!prefix && serviceType.startsWith(prefix);
  });
  return match || candidates[0] || null;
}

/**
 * Definition-driven answers view for a service request: renders each form field's
 * Arabic label against the value stored at its target, then lists any extra
 * metadata/firstParty/secondParty keys not covered by the definition (so requests
 * submitted by older/hardcoded forms still display).
 */
export default function DynamicAnswersView({ request }: { request: any }) {
  const { settings } = useSettings();
  const [def, setDef] = useState<ServiceFormDef | null>(null);

  useEffect(() => {
    if (!request?.category) {
      setDef(null);
      return;
    }
    if (request.category === "legal") {
      const picked = pickLegalDef(request, settings.serviceForms);
      if (picked) {
        setDef(picked);
        return;
      }
    } else {
      const local = resolveServiceForm(request.category, settings.serviceForms);
      if (local) {
        setDef(local);
        return;
      }
    }
    // Fallback: fetch the def from the API (first legal form key for legal requests)
    const key =
      request.category === "legal" ? LEGAL_SUBCATEGORIES[0].formKey : request.category;
    let cancelled = false;
    api
      .get(`/settings/service-forms/${key}`)
      .then((res) => {
        if (!cancelled) setDef(coerceServiceFormDef(res.data));
      })
      .catch(() => {
        if (!cancelled) setDef(null);
      });
    return () => {
      cancelled = true;
    };
  }, [request?.id, request?.category, request?.serviceType, settings.serviceForms]);

  const rows: { label: string; value: string }[] = [];
  const covered = new Set<string>();
  if (def) {
    for (const field of def.fields) {
      if (SKIP_TYPES.has(field.type) || !field.target) continue;
      covered.add(field.target);
      const value = getPath(request, field.target);
      if (value === undefined || value === null || value === "" || value === false) continue;
      if (field.type === "checkbox") {
        rows.push({ label: field.label, value: value === true || value === "true" ? "نعم" : "لا" });
        continue;
      }
      const opt = field.options?.find((o) => o.value === value);
      rows.push({ label: field.label, value: opt ? opt.label : String(value) });
    }
  }

  // Generic fallback: jsonb keys not covered by the definition (legacy requests).
  const extras = JSONB_ROOTS.flatMap((root) => flatten(request?.[root], root)).filter(
    ({ path }) => !covered.has(path),
  );

  if (rows.length === 0 && extras.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t border">
      {rows.length > 0 && (
        <div className="p-4 bg-muted rounded-2xl border border">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            إجابات النموذج
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            {rows.map((row) => (
              <div key={row.label}>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {row.label}
                </p>
                <p className="text-xs font-bold text-slate-900 whitespace-pre-wrap">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {extras.length > 0 && (
        <div className="p-4 bg-muted rounded-2xl border border">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            بيانات إضافية
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            {extras.map(({ path, value }) => (
              <div key={path}>
                <p className="text-[9px] font-black text-slate-400 tracking-widest" dir="ltr">
                  {path}
                </p>
                <p className="text-xs font-bold text-slate-900 whitespace-pre-wrap">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
