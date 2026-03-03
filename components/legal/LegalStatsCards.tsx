"use client";

import React from "react";
import { Scale, AlertCircle, FileText, MessageSquare } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface LegalStats {
  totalServices: number;
  disputes: { total: number; pending: number; completed: number };
  contracts: { total: number; inReview: number };
  otherServices: { total: number; responded: number };
}

interface LegalStatsCardsProps {
  stats: LegalStats;
  loading: boolean;
}

export function LegalStatsCards({ stats, loading }: LegalStatsCardsProps) {
  const { t } = useLanguage();

  const statCards = [
    {
      title: t('pm.legal.stats.total'),
      value: stats.totalServices,
      icon: Scale,
      color: "blue",
      details: null
    },
    {
      title: t('pm.legal.stats.disputes'),
      value: stats.disputes.total,
      icon: AlertCircle,
      color: "red",
      details: [
        { label: t('bm.stats.pending'), value: stats.disputes.pending, color: "yellow" },
        { label: t('bm.stats.completed'), value: stats.disputes.completed, color: "green" }
      ]
    },
    {
      title: t('pm.legal.stats.contracts'),
      value: stats.contracts.total,
      icon: FileText,
      color: "green",
      details: [
        { label: t('bm.stats.review'), value: stats.contracts.inReview, color: "blue" }
      ]
    },
    {
      title: t('pm.legal.stats.other'),
      value: stats.otherServices.total,
      icon: MessageSquare,
      color: "purple",
      details: [
        { label: t('bm.stats.responded'), value: stats.otherServices.responded, color: "purple" }
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue": return "bg-slate-50 text-blue-600 border-blue-100";
      case "red": return "bg-red-50 text-red-600 border-red-100";
      case "yellow": return "bg-yellow-50 text-yellow-600 border-yellow-100";
      case "green": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "purple": return "bg-purple-50 text-purple-600 border-purple-100";
      default: return "bg-slate-50 text-gray-600 border-gray-100";
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
        case "blue": return "text-blue-600";
        case "red": return "text-red-600";
        case "green": return "text-emerald-600";
        case "purple": return "text-purple-600";
        default: return "text-gray-600";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => (
        <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
            <div className={`p-2.5 rounded-xl ${getColorClasses(card.color).split(" ")[0]}`}>
              <card.icon className={`w-5 h-5 ${getIconColor(card.color)}`} />
            </div>
          </div>
          
          <div className="text-3xl font-bold text-gray-900 mb-4">
            {loading ? (
              <div className="h-8 w-16 bg-slate-100 animate-pulse rounded"></div>
            ) : (
              card.value
            )}
          </div>

          {card.details && (
            <div className="flex flex-wrap gap-2">
              {card.details.map((detail, idx) => (
                <span key={idx} className={`text-xs px-2 py-1 rounded-md border ${getColorClasses(detail.color)}`}>
                  {detail.label}: {loading ? '...' : detail.value}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
