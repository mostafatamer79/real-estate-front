"use client";

import { User } from "lucide-react";
interface ProfileCardProps {
  onClick?: () => void;
}

export default function ProfileCard({ onClick }: ProfileCardProps) {

  return (
    <div className="relative" dir="rtl">
      <button
        onClick={onClick}
        className="group relative bg-slate-800 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600 rounded-full p-2.5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
      >
     
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-900"></div>
      </button>
    </div>
  );
}

