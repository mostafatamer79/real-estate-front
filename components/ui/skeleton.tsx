import { cn } from "@/lib/utils"

export function Skeleton({ className, ...props }: any) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}
