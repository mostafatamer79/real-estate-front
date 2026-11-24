type LicenseDates = { licenseIssueDate?: string; licenseExpiryDate?: string };

export function validLicenseDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function licenseDatesError(profile: LicenseDates, ar = false): string {
  if ([profile.licenseIssueDate, profile.licenseExpiryDate].some(value => value !== undefined && !validLicenseDate(value)))
    return ar ? "أدخل تاريخ ترخيص ميلادي صحيحاً." : "Enter a valid Gregorian license date.";
  if (profile.licenseIssueDate && profile.licenseExpiryDate && profile.licenseIssueDate > profile.licenseExpiryDate)
    return ar ? "يجب ألا يسبق انتهاء الترخيص تاريخ إصداره." : "License expiry must be on or after its issue date.";
  return "";
}

export function formatLicenseDate(value: string | undefined, ar = false): string {
  if (value === undefined) return ar ? "غير مسجل" : "Not provided";
  if (!validLicenseDate(value)) return ar ? "تاريخ غير صحيح" : "Invalid date";
  const hijri = new Intl.DateTimeFormat(ar ? "ar-SA" : "en-SA", {
    calendar: "islamic-umalqura", timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(`${value}T00:00:00.000Z`));
  return `${value} (${ar ? "ميلادي" : "Gregorian"}) · ${hijri} (${ar ? "هجري محوّل" : "Hijri, converted"})`;
}

export function providerLicenseExpired(profile: LicenseDates, now = new Date()): boolean {
  if (!validLicenseDate(profile.licenseExpiryDate)) return false;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)!.value;
  return profile.licenseExpiryDate < `${part("year")}-${part("month")}-${part("day")}`;
}
