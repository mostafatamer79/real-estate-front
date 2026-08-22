import { User } from "@/types/user";

export type OnboardingStatus = "pending" | "skipped" | "completed";

const STORAGE_KEY = "onboarding_status";

function storageKey(userId: string): string {
  return `${STORAGE_KEY}_${userId}`;
}

export function getLocalOnboardingStatus(userId?: string | null): OnboardingStatus | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw === "pending" || raw === "skipped" || raw === "completed") return raw;
    return null;
  } catch {
    return null;
  }
}

export function setLocalOnboardingStatus(
  userId: string,
  status: OnboardingStatus
): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(storageKey(userId), status);
  } catch {
    // ignore storage errors
  }
}

export async function saveOnboardingStatus(
  user: User | null | undefined,
  status: Exclude<OnboardingStatus, "pending">
): Promise<boolean> {
  if (!user?.id) return false;

  setLocalOnboardingStatus(user.id, status);

  try {
    const token = localStorage.getItem("token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const res = await fetch(`${baseUrl}/user/profile/onboarding`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function shouldShowOnboarding(user?: User | null): boolean {
  if (!user?.id) return false;

  // Backend is the source of truth; localStorage is a fast cache.
  const backendStatus = user.onboardingStatus;
  if (backendStatus && backendStatus !== "pending") return false;

  const localStatus = getLocalOnboardingStatus(user.id);
  if (localStatus && localStatus !== "pending") return false;

  return true;
}

export function clearOnboardingStatus(userId?: string | null): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}
