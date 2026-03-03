import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }: any) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1",
        className
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: any) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition",
        "data-[state=active]:bg-slate-500 data-[state=active]:text-white data-[state=active]:shadow-sm",
        "data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600 hover:bg-slate-100",
        className
      )}
      {...props}
    />
  )
}

export const TabsContent = TabsPrimitive.Content
