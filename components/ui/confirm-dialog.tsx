"use client";

import React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  loading,
  icon,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md">
        <div className="border-b border bg-gradient-to-br from-white via-slate-50 to-slate-100/80 px-6 pb-5 pt-6">
          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl border border-white bg-card text-slate-950 shadow-sm">
            {icon || <Sparkles className="h-5 w-5" />}
          </div>
          <DialogHeader>
            <DialogTitle className="text-slate-950">{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
        </div>
        <div className="px-6 pb-6 pt-5">
        <DialogFooter>
          <Button type="button" variant="outline" className="h-11 rounded-2xl border px-5 font-bold" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            className="h-11 rounded-2xl px-5 font-bold shadow-sm"
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
