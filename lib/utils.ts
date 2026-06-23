import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const SAUDI_RIYAL_SYMBOL = "\u20C1"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSaudiRiyal(amount: number | string, locale: string = "en-US") {
  const numericAmount = typeof amount === "number" ? amount : Number(amount)

  if (!Number.isFinite(numericAmount)) {
    return `${amount} ${SAUDI_RIYAL_SYMBOL}`
  }

  return `${numericAmount.toLocaleString(locale)} ${SAUDI_RIYAL_SYMBOL}`
}
