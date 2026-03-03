// src/components/ProfileCard.tsx
"use client";

import { useState } from 'react';
import { User, Mail, Phone, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import VerificationBadge from '@/components/VerificationBadge';
import { VerifyStatus, Role } from '@/types/user';

export default function ProfileCard() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const getRoleText = (role: Role) => {
    switch (role) {
      case Role.ADMIN: return 'مدير';
      case Role.AGENT: return 'مقدم الخدمة';
      default: return 'مستخدم';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-slate-800/80 hover:bg-slate-800 rounded-xl p-3 backdrop-blur-sm border border-slate-700 transition-colors"
      >
        <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
          <User className="w-5 h-5" />
        </div>
        <div className="text-right">
          <div className="font-medium">
            {user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`
              : 'مستخدم'
            }
          </div>
          <div className="text-xs text-white/60">{getRoleText(user.role)}</div>
        </div>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full left-0 mt-2 w-80 bg-slate-800 rounded-xl border border-slate-700 shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : 'مستخدم'
                    }
                  </div>
                  <div className="text-sm text-white/60 flex items-center gap-2 mt-1">
                    <Shield className="w-3 h-3" />
                    {getRoleText(user.role)}
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">حالة الحساب:</span>
                  <VerificationBadge 
                    status={user.isVerified ? VerifyStatus.VERIFIED : VerifyStatus.PENDING}
                  />
                </div>
                
                {user.role === Role.AGENT && user.agentVerificationStatus && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">حالة الوسيط:</span>
                    <VerificationBadge 
                      status={user.agentVerificationStatus as VerifyStatus}
                      type="agent"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="p-4 border-b border-slate-700 space-y-3">
              {user.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-white/40" />
                  <span className="text-sm">{user.email}</span>
                </div>
              )}
              
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-white/40" />
                  <span className="text-sm">{user.phone}</span>
                </div>
              )}
              
              {user.city && user.country && (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 text-white/40">📍</div>
                  <span className="text-sm">{user.city}, {user.country}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}