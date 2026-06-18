'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Plus,
  Trash2,
  Edit2,
  Play,
  CheckCircle,
  XCircle,
  RefreshCcw,
  AlertCircle,
  Clock,
  Send,
  MessageSquare,
  Megaphone
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useConfirmDialog } from '@/components/ui/confirm-dialog-provider';
import MarketingCampaignModal from '@/components/marketing/MarketingCampaignModal';
import ServiceRequestsTable from '@/components/shared/ServiceRequestsTable';
import MarketingPageInternal from '@/app/marketing/page';

interface EmailMarketing {
  id: string;
  category: string;
  content: string;
  frequency: string;
  targetRole: string | null;
  isActive: boolean;
  lastSentAt: string | null;
  createdAt: string;
}

export default function MarketingPage() {
  const { t } = useLanguage();
  const confirmDialog = useConfirmDialog();
  const [campaigns, setCampaigns] = useState<EmailMarketing[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailMarketing | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'campaigns' | 'internal'>('requests');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/marketing/email-marketing');
      setCampaigns(response.data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: t('common.confirmDelete'),
      confirmLabel: 'حذف',
      cancelLabel: 'إلغاء',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/marketing/email-marketing/${id}`);
      toast.success(t('common.success'));
      fetchCampaigns();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleToggleStatus = async (campaign: EmailMarketing) => {
    try {
      await api.patch(`/marketing/email-marketing/${campaign.id}`, {
        isActive: !campaign.isActive
      });
      toast.success(t('common.success'));
      fetchCampaigns();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleManualTrigger = async () => {
    try {
      setTriggering(true);
      await api.post('/marketing/email-marketing/trigger');
      toast.success(t('common.success'));
      fetchCampaigns();
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
            <div className="p-2 bg-slate-100 rounded-2xl text-slate-700">
              <Mail className="w-8 h-8" />
            </div>
            {t('admin.marketing.title')}
          </h1>
          <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-widest">{t('admin.marketing.desc')}</p>
        </div>

        {activeTab === 'campaigns' && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleManualTrigger}
            disabled={triggering}
            className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all border border-slate-200 text-xs font-black uppercase tracking-widest disabled:opacity-50"
          >
            {triggering ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t('admin.marketing.action.trigger')}
          </button>

          <button
            onClick={() => {
              setEditingCampaign(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-slate-950 text-white rounded-2xl hover:bg-slate-800 transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-500/20"
          >
            <Plus className="w-5 h-5" />
            {t('admin.marketing.create')}
          </button>
        </div>
        )}
      </div>

      <div className="flex gap-2 rounded-2xl bg-slate-100 p-1.5 w-fit">

        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'campaigns' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          الحملات البريدية
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('internal')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'internal' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          خدمات التسويق
        </button>
      </div>

      {activeTab === 'requests' && (
        <ServiceRequestsTable
          title="طلبات التسويق"
          subtitle="استقبال طلبات العملاء، تسعيرها، إرسال الفاتورة، تغيير الحالة، والرد من الشات"
          department="marketing"
        />
      )}

      {activeTab === 'internal' && (
        <MarketingPageInternal embedded />
      )}

      {activeTab === 'campaigns' && (
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <RefreshCcw className="w-10 h-10 text-slate-500 animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('common.loading')}</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
            <div className="p-6 bg-slate-50 rounded-full">
              <Mail className="w-16 h-16 text-slate-200" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('admin.service_requests.no_data')}</p>
              <p className="text-xs font-bold text-slate-400 max-w-xs mx-auto mt-2 uppercase tracking-widest">{t('admin.marketing.noDataDesc')}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left" dir="auto">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.marketing.table.category')}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.marketing.table.role')}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.marketing.table.frequency')}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.marketing.table.status')}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.marketing.table.lastSent')}</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.marketing.table.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {campaigns.map((campaign) => (
                  <motion.tr
                    key={campaign.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/50 transition-all group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${
                          campaign.category === 'OFFERS' ? 'bg-slate-100 text-slate-700' :
                          campaign.category === 'ORDERS' ? 'bg-slate-100 text-slate-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
                          {t(`admin.marketing.categories.${campaign.category.toLowerCase()}`)}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-700 border border-slate-200">
                        {campaign.targetRole ? t(`admin.marketing.targetRole.${campaign.targetRole.toLowerCase()}`) : t('admin.marketing.targetRole.all')}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {t(`admin.marketing.frequencies.${campaign.frequency.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <button
                        onClick={() => handleToggleStatus(campaign)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          campaign.isActive
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {campaign.isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {campaign.isActive ? t('admin.marketing.status.active') : t('admin.marketing.status.paused')}
                      </button>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {campaign.lastSentAt ? new Date(campaign.lastSentAt).toLocaleDateString() : t('admin.marketing.neverSent')}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => {
                            setEditingCampaign(campaign);
                            setIsModalOpen(true);
                          }}
                          className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      <MarketingCampaignModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCampaign(null);
        }}
        onSuccess={fetchCampaigns}
        campaign={editingCampaign}
      />
    </div>
  );
}
