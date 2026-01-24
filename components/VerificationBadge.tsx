// app/components/VerificationBadge.tsx
"use client";

import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { VerifyStatus } from '@/types/user';

interface VerificationBadgeProps {
  status: VerifyStatus;
  type?: 'agent' | 'general';
  className?: string;
}

export default function VerificationBadge({ status, type = 'general', className = '' }: VerificationBadgeProps) {
  const getConfig = () => {
    switch (status) {
      case VerifyStatus.VERIFIED:
        return {
          icon: CheckCircle,
          text: type === 'agent' ? 'وكيل موثوق' : 'موثق',
          color: 'text-green-400',
          bg: 'bg-green-500/20',
          border: 'border-green-500/30'
        };
      case VerifyStatus.PENDING:
        return {
          icon: Clock,
          text: 'قيد المراجعة',
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/30'
        };
      case VerifyStatus.REJECTED:
        return {
          icon: XCircle,
          text: 'مرفوض',
          color: 'text-red-400',
          bg: 'bg-red-500/20',
          border: 'border-red-500/30'
        };
      default:
        return {
          icon: AlertCircle,
          text: 'غير موثق',
          color: 'text-gray-400',
          bg: 'bg-gray-500/20',
          border: 'border-gray-500/30'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.border} ${config.color} ${className}`}>
      <Icon className="w-4 h-4" />
      <span>{config.text}</span>
    </div>
  );
}