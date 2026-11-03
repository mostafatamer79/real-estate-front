"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Keep the existing signed-in home destination while guests can read the public homepage.
export default function HomeRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      router.replace(user && (user.role === "admin" || (user.firstName && user.lastName)) ? "/details" : "/profile");
    } catch {
      router.replace("/profile");
    }
  }, [router]);
  return null;
}
