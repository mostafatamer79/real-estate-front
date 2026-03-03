"use client";

import React, { useState } from "react";
import { Search, Plus, Eye, Edit, Trash2, AlertCircle, Calendar, User } from "lucide-react";
import { LegalDispute } from "@/lib/legal-services";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LegalDisputesTableProps {
  disputes: LegalDispute[];
  loading: boolean;
  onView: (dispute: LegalDispute) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate?: () => void;
}

export function LegalDisputesTable({
  disputes,
  loading,
  onView,
  onEdit,
  onDelete,
  onCreate
}: LegalDisputesTableProps) {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDisputes = disputes.filter(dispute => 
    dispute.disputeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispute.disputeType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'inProgress': return 'bg-slate-50 text-blue-600 border-blue-100';
      case 'pending': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t('bm.list.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border-gray-100 text-right pr-9 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
          {onCreate && (
            <Button
              onClick={onCreate}
              className="w-full md:w-auto bg-slate-600 hover:bg-slate-700 text-white flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('bm.list.newDispute')}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array(5).fill(0).map((_, index) => (
              <div key={index} className="h-12 bg-slate-50 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-lg mb-4">{t('bm.list.empty')}</p>
            {onCreate && (
              <Button variant="outline" onClick={onCreate} className="border-gray-200 text-gray-600 hover:bg-slate-50">
                {t('bm.list.createFirst')}
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">{t('bm.list.number')}</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">{t('bm.list.type')}</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">{t('bm.list.parties')}</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">{t('bm.list.status')}</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">{t('bm.list.date')}</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">{t('bm.list.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredDisputes.map((dispute) => {
                  const firstPartyName = typeof dispute.firstParty === 'string' ? dispute.firstParty : (dispute.firstParty as any)?.name;
                  const secondPartyName = typeof dispute.secondParty === 'string' ? dispute.secondParty : (dispute.secondParty as any)?.name;

                  return (
                    <tr key={dispute.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-blue-600 font-medium">{dispute.disputeNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 font-medium">{dispute.disputeType}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                           <User className="w-4 h-4 text-gray-400" />
                           {firstPartyName} <span className="text-gray-400">↔</span> {secondPartyName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(dispute.status)}`}>
                          {dispute.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                         <div className="flex items-center gap-2">
                             <Calendar className="w-3.5 h-3.5 text-gray-400" />
                             {new Date(dispute.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => onView(dispute)} className="p-2 hover:bg-white rounded-lg text-blue-600 hover:text-blue-700 hover:shadow-sm border border-transparent hover:border-blue-100 transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => onEdit(dispute.id)} className="p-2 hover:bg-white rounded-lg text-emerald-600 hover:text-emerald-700 hover:shadow-sm border border-transparent hover:border-emerald-100 transition-all">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDelete(dispute.id)} className="p-2 hover:bg-white rounded-lg text-red-600 hover:text-red-700 hover:shadow-sm border border-transparent hover:border-red-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
