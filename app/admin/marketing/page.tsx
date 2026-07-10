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
  Megaphone,
  Eye
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
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
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';
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

  const handleReorder = async (newOrder: EmailMarketing[]) => {
    setCampaigns(newOrder);
    try {
      await Promise.all(
        newOrder.map((camp, index) =>
          api.patch(`/marketing/email-marketing/${camp.id}`, {
            sortOrder: index,
          })
        )
      );
      // Optional: uncomment below if you want a toast for reordering
      // toast.success(isRtl ? 'تم تحديث الترتيب' : 'Order updated');
    } catch (error) {
      toast.error(t('common.error'));
      fetchCampaigns(); // revert on error
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
            <div className="p-2 bg-muted rounded-2xl text-slate-700">
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
            className="flex items-center gap-2 px-5 py-3 bg-muted text-slate-700 rounded-2xl hover:bg-muted transition-all border border text-xs font-black uppercase tracking-widest disabled:opacity-50"
          >
            {triggering ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t('admin.marketing.action.trigger')}
          </button>

          <button
            onClick={() => {
              setEditingCampaign(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-slate-950 text-white rounded-2xl hover:bg-slate-800 transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-stone-400/20"
          >
            <Plus className="w-5 h-5" />
            {t('admin.marketing.create')}
          </button>
        </div>
        )}
      </div>

      <div className="flex gap-2 rounded-2xl bg-muted p-1.5 w-fit">

        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'campaigns' ? 'bg-card text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          الحملات البريدية
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('internal')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'internal' ? 'bg-card text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
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
      <div className="bg-card rounded-[1rem] shadow-sm border border overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <RefreshCcw className="w-10 h-10 text-slate-500 animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('common.loading')}</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
            <div className="p-6 bg-muted rounded-full">
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
                <tr className="bg-muted/50 border-b border">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.marketing.table.category')}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.marketing.table.role')}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.marketing.table.frequency')}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.marketing.table.status')}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.marketing.table.lastSent')}</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.marketing.table.action')}</th>
                </tr>
              </thead>
              <Reorder.Group as="tbody" axis="y" values={campaigns} onReorder={handleReorder} className="divide-y divide-slate-50">
                {campaigns.map((campaign) => (
                  <Reorder.Item
                    as="tr"
                    value={campaign}
                    key={campaign.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-muted/50 transition-all group cursor-grab active:cursor-grabbing relative bg-card"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${
                          campaign.category === 'OFFERS' ? 'bg-muted text-slate-700' :
                          campaign.category === 'ORDERS' ? 'bg-muted text-slate-700' :
                          'bg-muted text-slate-700'
                        }`}>
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
                          {t(`admin.marketing.categories.${campaign.category.toLowerCase()}`)}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-muted text-slate-700 border border">
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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(campaign)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            campaign.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              campaign.isActive ? (isRtl ? '-translate-x-4' : 'translate-x-4') : (isRtl ? '-translate-x-0.5' : 'translate-x-0.5')
                            }`}
                          />
                        </button>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${campaign.isActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {campaign.isActive ? t('admin.marketing.status.active') : t('admin.marketing.status.paused')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {campaign.lastSentAt ? new Date(campaign.lastSentAt).toLocaleDateString() : t('admin.marketing.neverSent')}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingCampaign(campaign);
                            setIsModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {isRtl ? 'عرض / تعديل' : 'View / Edit'}
                        </button>
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
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
