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

  return res.json();
}
