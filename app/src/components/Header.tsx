"use client";

import { Globe2 } from "lucide-react";
import { useRouter } from "next/navigation";
interface HeaderProps {
  onSignUp?: () => void;
  showSignUp?: boolean;
}

export default function Header({ onSignUp, showSignUp = true }: HeaderProps) {
  const router = useRouter();
  return (
    <nav className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        <button onClick={() => router.push("/")} className="text-lg font-extrabold text-white">
            عقارات السعودية
          </button>

        <div className="flex items-center gap-3">
          <button className="bg-gray-700 text-white px-4 py-2 rounded-full hover:bg-gray-600" onClick={() => router.push("/customerservice")}>
            تواصل معنا
          </button>
          <button className="flex items-center gap-2 rounded-4xl bg-gray-700 text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white px-4 py-2">
            <span>EN/AR</span>
            <Globe2 className="w-4 h-4 text-blue-500" />
          </button>
          <button className="bg-gray-700 text-white px-4 py-2 rounded-full hover:bg-gray-600" onClick={() => router.push("/details")}>
            الصفحة الرئيسية
          </button>
        </div>
      </div>
    </nav>
  );
}
