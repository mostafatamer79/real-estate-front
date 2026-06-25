"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import FinancialPage from "@/app/financial/page";

export default function AdminWalletPage() {
  const searchParams = useSearchParams();

  const financialTabMap: Record<string, string> = {
    financial: "dashboard",
    dashboard: "dashboard",
    transactions: "transactions",
    payments: "payments",
    expenses: "expenses",
    reports: "reports",
    settlements: "settlements",
    service_requests: "service_requests",
  };

  const financeTab = financialTabMap[searchParams.get("section") || "financial"] || "dashboard";

  return <FinancialPage embedded initialTab={financeTab} />;
}
