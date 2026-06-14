"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertTriangle, CircleHelp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmDialogContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);
  const [loading, setLoading] = useState(false);

  const close = useCallback((value: boolean) => {
    resolver?.(value);
    setResolver(null);
    setOptions(null);
    setLoading(false);
  }, [resolver]);

  const confirm = useCallback((nextOptions: ConfirmOptions) => {
    setOptions(nextOptions);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={Boolean(options)}
        onOpenChange={(open) => {
          if (!open) close(false);
        }}
        title={options?.title || ""}
        description={options?.description}
        confirmLabel={options?.confirmLabel || "تأكيد"}
        cancelLabel={options?.cancelLabel || "إلغاء"}
        destructive={options?.destructive}
        loading={loading}
        icon={options?.destructive ? <AlertTriangle className="h-5 w-5" /> : <CircleHelp className="h-5 w-5" />}
        onConfirm={async () => {
          setLoading(true);
          close(true);
        }}
      />
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  }
  return context.confirm;
}
