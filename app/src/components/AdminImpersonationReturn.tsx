"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function AdminImpersonationReturn() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => {
      setVisible(Boolean(localStorage.getItem("adminImpersonationSession")));
    };

    sync();
    window.addEventListener("auth-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const handleReturnToAdmin = () => {
    const rawSession = localStorage.getItem("adminImpersonationSession");
    if (!rawSession) return;

    try {
      const session = JSON.parse(rawSession);
      if (session.token) localStorage.setItem("token", session.token);
      else localStorage.removeItem("token");

      if (session.refreshToken) localStorage.setItem("refreshToken", session.refreshToken);
      else localStorage.removeItem("refreshToken");

      if (session.user) localStorage.setItem("user", session.user);
      else localStorage.removeItem("user");

      localStorage.removeItem("adminImpersonationSession");
      localStorage.removeItem("impersonatedByAdmin");
      setVisible(false);
      window.dispatchEvent(new Event("auth-change"));
      router.push(session.returnTo || "/admin/users");
    } catch {
      localStorage.removeItem("adminImpersonationSession");
      localStorage.removeItem("impersonatedByAdmin");
      setVisible(false);
      window.dispatchEvent(new Event("auth-change"));
      router.push("/admin/users");
    }
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={handleReturnToAdmin}
      className="fixed bottom-5 left-5 z-[10000] h-12 px-5 rounded-2xl bg-emerald-600 text-white shadow-2xl shadow-emerald-900/20 border border-emerald-400/30 hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-black"
      dir="rtl"
    >
      <ArrowRight className="w-4 h-4" />
      العودة للإدارة
    </button>
  );
}
