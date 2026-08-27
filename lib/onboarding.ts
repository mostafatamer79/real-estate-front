import { createElement } from "react";
import {
  BarChart3,
  Building2,
  ClipboardList,
  Grid,
  Headset,
  Map as MapIcon,
  Megaphone,
  MessageSquare,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { TourStep } from "@/components/Tutorial";
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

// ---------------------------------------------------------------------------
// Tour steps
// ---------------------------------------------------------------------------

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

const tourIcon = (Icon: LucideIcon) => createElement(Icon, { className: "w-6 h-6" });

/**
 * Ordered onboarding tour steps. Steps with a `targetId` spotlight a live
 * element on the details page; the rest render as centered cards.
 */
export function buildTourSteps(t: TranslateFn): TourStep[] {
  return [
    {
      id: "customer-service",
      title: t("tour.customerService.title"),
      description: t("tour.customerService.description"),
      position: "center",
      icon: tourIcon(Headset),
    },
    {
      id: "chat",
      title: t("tour.chat.title"),
      description: t("tour.chat.description"),
      position: "center",
      icon: tourIcon(MessageSquare),
    },
    {
      id: "services-center",
      title: t("tour.servicesCenter.title"),
      description: t("tour.servicesCenter.description"),
      position: "center",
      icon: tourIcon(Grid),
    },
    {
      id: "map",
      title: t("tour.map.title"),
      description: t("tour.map.description"),
      targetId: "tour-target-map",
      position: "bottom",
      icon: tourIcon(MapIcon),
    },
    {
      id: "stats",
      title: t("tour.stats.title"),
      description: t("tour.stats.description"),
      targetId: "tour-target-stats",
      position: "top",
      icon: tourIcon(BarChart3),
    },
    {
      id: "quick-actions",
      title: t("tour.quickActions.title"),
      description: t("tour.quickActions.description"),
      targetId: "tour-target-quick-actions",
      position: "top",
      icon: tourIcon(Zap),
    },
    {
      id: "wallet",
      title: t("tour.wallet.title"),
      description: t("tour.wallet.description"),
      position: "center",
      icon: tourIcon(Wallet),
    },
    {
      id: "admin-services",
      title: t("tour.adminServices.title"),
      description: t("tour.adminServices.description"),
      position: "center",
      icon: tourIcon(Building2),
    },
    {
      id: "offers",
      title: t("tour.offers.title"),
      description: t("tour.offers.description"),
      position: "center",
      icon: tourIcon(Megaphone),
    },
    {
      id: "requests",
      title: t("tour.requests.title"),
      description: t("tour.requests.description"),
      position: "center",
      icon: tourIcon(ClipboardList),
    },
  ];
}
