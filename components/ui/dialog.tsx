import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({ className, ...props }: any) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[1.25rem] border border-white/70 bg-card/95 p-0 shadow-[0_28px_90px_rgba(15,23,42,0.28)] backdrop-blur-xl duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className
        )}
        {...props}
      >
        {props.children}
        <DialogPrimitive.Close className="absolute right-5 top-5 inline-flex size-9 items-center justify-center rounded-full border border bg-card/90 text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-950">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className, ...props }: any) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />
}

export function DialogFooter({ className, ...props }: any) {
  return <div className={cn("flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)} {...props} />
}

export function DialogTitle({ className, ...props }: any) {
  return (
    <DialogPrimitive.Title
      className={cn("text-xl font-black tracking-tight text-slate-950", className)}
      {...props}
    />
  )
}

export function DialogDescription({ className, ...props }: any) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm font-medium leading-6 text-slate-500", className)}
      {...props}
    />
  )
}
