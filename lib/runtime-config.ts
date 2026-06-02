const DEFAULT_API_URL = "http://localhost:3030/api";

export function getApiBaseUrl(): string {
  let url = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  url = url.replace(/\/+$/, "");

  if (!url.endsWith("/api")) {
    url = `${url}/api`;
  }

  return url;
}

export async function fetchPublicSettings(): Promise<Array<{ key: string; value: string }>> {
  const res = await fetch(`${getApiBaseUrl()}/settings/public`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch public settings: ${res.status}`);
  }

  const settings = await res.json();
  return Array.isArray(settings)
    ? settings.map((setting) => ({
        ...setting,
        value: normalizeLegacyPublicSetting(setting.key, setting.value),
      }))
    : settings;
}

function normalizeLegacyPublicSetting(key: string, value: string): string {
  if (typeof value !== "string") return value;

  if (key === "theme_appName" || key === "txt_project.name") {
    if (value === "دير عقارك") return "الوساطة الرقمية";
    if (value === "Deer Aqarak") return "Digital Brokerage";
  }

  if (key === "theme_description") {
    return value
      .replace(/دير عقارك/g, "الوساطة الرقمية")
      .replace(/Deer Aqarak/g, "Digital Brokerage");
  }

  return value;
}
