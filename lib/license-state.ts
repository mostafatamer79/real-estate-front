export type LicenseState =
  | "missing"
  | "pending"
  | "verified"
  | "rejected"
  | "expired";
export function getLicenseState(
  user: {
    licenseDocument?: string | null;
    agentVerificationStatus?: string | null;
    falLicenseExpiry?: string | Date | null;
  },
  now = new Date(),
): LicenseState {
  if (!user.licenseDocument) return "missing";
  if (user.agentVerificationStatus === "rejected") return "rejected";
  if (user.agentVerificationStatus !== "verified") return "pending";
  if (user.falLicenseExpiry) {
    const expiry = new Date(user.falLicenseExpiry);
    // Date-only licenses remain valid through the stated expiry date.
    if (!Number.isFinite(expiry.getTime())) return "pending";
    if (expiry.toISOString().slice(0, 10) < now.toISOString().slice(0, 10))
      return "expired";
  }
  return "verified";
}
export const LICENSE_LABELS: Record<LicenseState, { ar: string; en: string }> =
  {
    missing: { ar: "لم تُرفق الرخصة", en: "License not submitted" },
    pending: { ar: "قيد المراجعة", en: "Under review" },
    verified: { ar: "سارية ومعتمدة", en: "Valid and approved" },
    rejected: { ar: "غير معتمدة", en: "Not approved" },
    expired: { ar: "منتهية الصلاحية", en: "Expired" },
  };
