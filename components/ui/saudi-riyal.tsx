import React from "react";

import { cn } from "@/lib/utils";
import { SaudiRiyalIcon } from "@/components/ui/saudi-riyal-icon";

type SaudiRiyalSymbolProps = {
  className?: string;
  iconClassName?: string;
};

export function SaudiRiyalSymbol({ className, iconClassName }: SaudiRiyalSymbolProps) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <SaudiRiyalIcon className={cn("h-4 w-4 shrink-0", iconClassName)} />
    </span>
  );
}

type SaudiRiyalAmountProps = {
  amount: number | string;
  className?: string;
  iconClassName?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function SaudiRiyalAmount({
  amount,
  className,
  iconClassName,
  locale = "en-US",
  minimumFractionDigits,
  maximumFractionDigits,
}: SaudiRiyalAmountProps) {
  const numericAmount = Number(amount || 0);
  const formattedAmount = Number.isFinite(numericAmount)
    ? numericAmount.toLocaleString(locale, {
        minimumFractionDigits,
        maximumFractionDigits,
      })
    : String(amount);

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span>{formattedAmount}</span>
      <SaudiRiyalIcon className={cn("h-4 w-4 shrink-0", iconClassName)} />
    </span>
  );
}
