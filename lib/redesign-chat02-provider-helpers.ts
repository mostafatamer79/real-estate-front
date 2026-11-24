/**
 * lib/redesign-chat02-provider-helpers.ts
 * Pure business logic and calculation helpers for Provider Registration and Opportunities.
 * Scoped to chat02 ownership; imported directly by production and test suites.
 */

import type {
  DeliveryMode,
  ProviderProfile,
  ProviderOpportunity,
  ProviderRegistrationField,
  ProviderSpecialization,
} from "@/lib/providers";

/**
 * Matches whether a dynamic registration field is enabled and applicable to the selected categories.
 * Follows hierarchical category matching (e.g. "legal" matches "legal_contracts").
 */
export function matchesFieldCategories(
  field: Pick<ProviderRegistrationField, "enabled" | "categories">,
  categories: string[],
): boolean {
  if (!field.enabled) return false;
  if (!field.categories || field.categories.length === 0) return true;
  return categories.some((category) =>
    field.categories.some(
      (root) =>
        category === root ||
        category.startsWith(`${root}_`) ||
        root.startsWith(`${category}_`),
    ),
  );
}

/**
 * Checks whether a specialization applies to the chosen categories.
 * An empty categories array on the specialization matches any category selection.
 */
export function matchesSpecialization(
  spec: Pick<ProviderSpecialization, "enabled" | "categories">,
  categories: string[],
): boolean {
  if (!spec.enabled) return false;
  if (!categories || categories.length === 0) return true;
  return categories.every(
    (category) =>
      !spec.categories.length ||
      spec.categories.some(
        (root) => category === root || category.startsWith(`${root}_`),
      ),
  );
}

/**
 * Calculates the absolute minimum offer floor.
 * Must respect:
 * 1. Default platform minimum floor (0.01 SAR)
 * 2. profile.minOffer if configured
 * 3. Fixed platform agreement fee (if agreementType is "fixed", offer must cover agreementValue)
 */
export function calculateMinOffer(
  profile?: Pick<ProviderProfile, "minOffer" | "agreementType" | "agreementValue"> | null,
): number {
  return Math.max(
    0.01,
    profile?.minOffer || 0,
    profile?.agreementType === "fixed" ? profile?.agreementValue || 0 : 0,
  );
}

/**
 * Calculates the maximum allowable offer bound if specified on profile.
 */
export function calculateMaxOffer(
  profile?: Pick<ProviderProfile, "maxOffer"> | null,
): number | undefined {
  return profile?.maxOffer && profile.maxOffer > 0 ? profile.maxOffer : undefined;
}

/**
 * Determines whether a given opportunity is currently actionable (can accept a bid).
 * Guarantees that stale opportunities on previous pages or during refresh/page loading
 * are strictly NON-actionable.
 */
export function isOpportunityActionable(params: {
  item: Pick<ProviderOpportunity, "ownOffer" | "availableDeliveryModes">;
  profile?: Pick<ProviderProfile, "status"> | null;
  licenseBlocked: boolean;
  isPageLoading: boolean;
  isBusy: boolean;
}): boolean {
  const { item, profile, licenseBlocked, isPageLoading, isBusy } = params;

  if (isPageLoading || isBusy) return false;
  if (licenseBlocked) return false;
  if (profile?.status !== "approved") return false;
  if (item.ownOffer) return false;
  if (item.availableDeliveryModes && item.availableDeliveryModes.length === 0) return false;

  return true;
}

export interface FileValidationResult {
  valid: boolean;
  errorKey?: "invalid_type" | "file_too_large";
}

const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates multipart file uploads for provider registration documents.
 */
export function validateUploadFile(file?: {
  type: string;
  size: number;
} | null): FileValidationResult {
  if (!file) {
    return { valid: false, errorKey: "invalid_type" };
  }
  if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
    return { valid: false, errorKey: "invalid_type" };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, errorKey: "file_too_large" };
  }
  return { valid: true };
}

export interface OfferValidationResult {
  valid: boolean;
  errorKey?: "amount_invalid" | "below_min" | "above_max" | "invalid_delivery_mode";
}

/**
 * Validates offer input before calling backend API.
 */
export function validateOfferSubmission(
  amount: number,
  mode: DeliveryMode,
  profile?: ProviderProfile | null,
  opportunity?: ProviderOpportunity | null,
): OfferValidationResult {
  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    return { valid: false, errorKey: "amount_invalid" };
  }

  const minFloor = calculateMinOffer(profile);
  if (amount < minFloor) {
    return { valid: false, errorKey: "below_min" };
  }

  const maxCeiling = calculateMaxOffer(profile);
  if (maxCeiling !== undefined && amount > maxCeiling) {
    return { valid: false, errorKey: "above_max" };
  }

  // Delivery mode validation:
  const allowedModes = opportunity?.availableDeliveryModes ?? profile?.deliveryModes ?? ["online"];
  if (!allowedModes.includes(mode)) {
    return { valid: false, errorKey: "invalid_delivery_mode" };
  }

  return { valid: true };
}

export interface TrackingLinksContract {
  clientRequestsHref: string;
  clientRequestsLabelAr: string;
  clientRequestsLabelEn: string;
  providerRequestsHref: string;
  providerRequestsLabelAr: string;
  providerRequestsLabelEn: string;
  explanationAr: string;
  explanationEn: string;
}

/**
 * Returns accurate navigation contracts distinguishing provider opportunities from client tracking.
 * Note: /services/provider-requests is backed by /service-providers/my-requests which filters by
 * { where: { userId: id } } — it tracks the user's submitted provider-category requests, NOT assigned provider jobs.
 */
export function getTrackingNavigationContract(): TrackingLinksContract {
  return {
    clientRequestsHref: "/services/my-requests",
    clientRequestsLabelAr: "متابعة طلباتي كعميل",
    clientRequestsLabelEn: "Track Client Requests",
    providerRequestsHref: "/services/provider-requests",
    providerRequestsLabelAr: "طلبات خدمات المزودين (الخاصة بي)",
    providerRequestsLabelEn: "My Provider Service Requests",
    explanationAr:
      "الفرص المعروضة هنا مخصصة للمزودين لتقديم عروض أسعار. لمتابعة الطلبات الشخصية التي أنشأتها كعميل أو طالب خدمة:",
    explanationEn:
      "Opportunities listed here are for providers to submit price bids. To track personal service requests submitted as a requester:",
  };
}
