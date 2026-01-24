import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

export const TooltipProvider = TooltipPrimitive.Provider

export function Tooltip({ children, ...props }: any) {
  return <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>
}

export function TooltipTrigger({ children, ...props }: any) {
  return (
    <TooltipPrimitive.Trigger asChild {...props}>
      {children}
    </TooltipPrimitive.Trigger>
  )
}

export function TooltipContent({ className, ...props }: any) {
  return (
    <TooltipPrimitive.Content
      className={cn(
        "z-50 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground",
        className
      )}
      {...props}
    />
  )
}
