import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cn } from "@/lib/utils"

export function Separator({ className, ...props }: any) {
  return (
    <SeparatorPrimitive.Root
      className={cn("bg-border shrink-0", className)}
      {...props}
    />
  )
}
