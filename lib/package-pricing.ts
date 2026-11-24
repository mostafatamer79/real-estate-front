export type PackageDiscountPeriod = 'both' | 'monthly' | 'yearly';
export type PackageBillingPeriod = 'شهري' | 'سنوي';

export interface PackagePricing {
  monthlyPrice: number | string;
  yearlyPrice: number | string;
  discount?: number | string;
  discountPeriod?: PackageDiscountPeriod;
}

export function getPackageDiscount(pkg: PackagePricing, billingPeriod: PackageBillingPeriod): number {
  const period = billingPeriod === 'سنوي' ? 'yearly' : 'monthly';
  const scope = pkg.discountPeriod ?? 'both';
  return scope === 'both' || scope === period ? Number(pkg.discount || 0) : 0;
}

export function getPackagePrice(pkg: PackagePricing, billingPeriod: PackageBillingPeriod): number {
  const base = Number(billingPeriod === 'سنوي' ? pkg.yearlyPrice : pkg.monthlyPrice);
  return base * (1 - getPackageDiscount(pkg, billingPeriod) / 100);
}
