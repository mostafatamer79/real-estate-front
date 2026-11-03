"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ toastOptions, style, className, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={["toaster group", className].filter(Boolean).join(" ")}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "rgb(15 23 42)",
          "--normal-border": "rgb(226 232 240)",
          "--border-radius": "16px",
          ...style,
        } as React.CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast:
            "group !gap-3 !rounded-2xl !border !border-slate-200 !bg-white !text-slate-950 !px-4 !py-4 !shadow-[0_20px_60px_rgba(15,23,42,0.16)]",
          title: "!text-sm !font-black !text-slate-950",
          description: "!text-sm !font-medium !text-slate-600",
          actionButton:
            "!h-9 !rounded-xl !border !border !bg-card !px-3 !text-sm !font-bold !text-slate-950",
          cancelButton:
            "!h-9 !rounded-xl !border !border !bg-card !px-3 !text-sm !font-bold !text-slate-500",
          closeButton:
            "!rounded-full !border !border !bg-card !text-slate-400 hover:!text-slate-900",
          success: "!border-emerald-200 [&_[data-icon]]:!text-emerald-700",
          error: "!border-red-200 [&_[data-icon]]:!text-red-700",
          warning: "!border-amber-200",
          info: "!border-blue-200",
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
