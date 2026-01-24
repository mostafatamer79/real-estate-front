"use client";

import { User } from "lucide-react";
export default function ProfileCard() {

  return (
    <div className="relative" dir="rtl">
      <button
        className="group relative bg-gray-800 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600 rounded-full p-2.5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
      >
        <div className="w-11 h-11 rounded-full bg-gray-600 flex items-center justify-center shadow-lg ring-2 ring-gray-700/50 group-hover:ring-gray-600/50 transition-all">
          <User className="h-6 w-6 text-white" />
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-900"></div>
      </button>
    </div>
  );
}

