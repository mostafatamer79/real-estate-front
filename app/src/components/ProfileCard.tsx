"use client";

import { User } from "lucide-react";
import { motion } from "framer-motion";
import { hapticTick } from "@/lib/haptics";

interface ProfileCardProps {
  onClick?: () => void;
}

export default function ProfileCard({ onClick }: ProfileCardProps) {

  return (
    <div className="relative" dir="rtl">
      <motion.button
        onClick={() => { onClick?.(); hapticTick(); }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="group relative bg-slate-800 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600 rounded-full p-2.5 shadow-xl hover:shadow-2xl transition-all duration-300"
      >
        <User className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse" />
      </motion.button>
    </div>
  );
}

