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

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "rgba(255,255,255,0.96)",
          "--normal-text": "rgb(15 23 42)",
          "--normal-border": "rgb(226 232 240)",
          "--border-radius": "24px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group !gap-3 !rounded-[24px] !border !border !bg-card/95 !px-4 !py-4 !shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl",
          title: "!text-sm !font-black !text-slate-950",
          description: "!text-sm !font-medium !text-slate-500",
          actionButton:
            "!h-9 !rounded-xl !border !border !bg-card !px-3 !text-sm !font-bold !text-slate-950",
          cancelButton:
            "!h-9 !rounded-xl !border !border !bg-card !px-3 !text-sm !font-bold !text-slate-500",
          closeButton:
            "!rounded-full !border !border !bg-card !text-slate-400 hover:!text-slate-900",
          success: "!border-emerald-200",
          error: "!border-red-200",
          warning: "!border-amber-200",
          info: "!border-blue-200",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
