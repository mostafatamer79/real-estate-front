"use client";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { getServiceDisplayName } from "@/lib/service-catalog";
import { serviceTree } from "@/lib/providers";

export default function ServiceCategoryTree({
  selected = [],
  onChange,
  manageServices = false,
}: {
  selected?: string[];
  manageServices?: boolean;
  onChange?: (selected: string[]) => void;
}) {
  const { settings } = useSettings();
  const { language } = useLanguage();
  const ar = language === "ar";
  const toggle = (id: string) =>
    onChange?.(
      selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    );
  return (
    <div className="space-y-3">
      {serviceTree(settings.customServices, settings.customCategories).map(
        (category) => (
          <details
            key={category.id}
            className="rounded-xl border border-border p-3"
          >
            <summary className="cursor-pointer font-semibold">
              {category.title}
              {selected.includes(category.id) ? " ✓" : ""}
            </summary>
            {onChange && (
              <label className="my-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(category.id)}
                  onChange={() => toggle(category.id)}
                />
                {ar ? "كل خدمات هذا القسم" : "All category services"}
              </label>
            )}
            <div className="mt-3 space-y-3">
              {category.children.map((child) => (
                <details key={child.id} className="rounded-lg bg-muted p-3">
                  <summary className="cursor-pointer">
                    {child.title}
                    {selected.includes(child.id) ||
                    selected.includes(category.id)
                      ? " ✓"
                      : ""}
                  </summary>
                  {onChange && child.id !== category.id && (
                    <label className="my-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          selected.includes(child.id) ||
                          selected.includes(category.id)
                        }
                        disabled={selected.includes(category.id)}
                        onChange={() => toggle(child.id)}
                      />
                      {ar ? "السماح بهذا الفرع" : "Allow this branch"}
                    </label>
                  )}
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {child.services.map((name) => (
                      <li key={name}>
                        {getServiceDisplayName(
                          child.id,
                          name,
                          settings.customServices,
                        )}
                      </li>
                    ))}
                  </ul>
                  {manageServices && <Link href={`/admin/services?panel=pricing&type=${encodeURIComponent(child.id)}`} className="mt-3 inline-flex min-h-11 items-center text-sm underline underline-offset-4">{ar ? "تعديل أسماء الخدمات أو حذفها" : "Rename or delete services"}</Link>}
                </details>
              ))}
            </div>
          </details>
        ),
      )}
    </div>
  );
}
