'use client';

import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Target, 
  Calendar, 
  Type, 
  CheckCircle,
  AlertCircle,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campaign?: any;
}

export default function MarketingCampaignModal({ isOpen, onClose, onSuccess, campaign }: Props) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: campaign?.category || 'offers',
    content: campaign?.content || '',
    frequency: campaign?.frequency || 'weekly',
    targetRole: campaign?.targetRole || '',
    isActive: campaign?.isActive !== undefined ? campaign.isActive : true
  });

  const categories = [
    { value: 'orders', label: t('admin.marketing.categories.orders') },
    { value: 'offers', label: t('admin.marketing.categories.offers') },
    { value: 'property_management', label: t('admin.marketing.categories.property_management') },
  ];
  const frequencies = [
    { value: 'daily', label: t('admin.marketing.frequencies.daily') },
    { value: 'every_2_days', label: t('admin.marketing.frequencies.every_2_days') },
    { value: 'weekly', label: t('admin.marketing.frequencies.weekly') },
    { value: 'biweekly', label: t('admin.marketing.frequencies.biweekly') },
  ];
  const roles = [
    { value: '', label: t('admin.marketing.targetRole.all') },
    { value: 'user', label: language === 'ar' ? 'مستفيد' : 'Beneficiary (User)' },
    { value: 'broker', label: language === 'ar' ? 'وسيط عقاري' : 'Broker' },
    { value: 'agent', label: language === 'ar' ? 'وكيل' : 'Agent' },
    { value: 'owner', label: language === 'ar' ? 'مالك' : 'Owner' },
    { value: 'lawyer', label: language === 'ar' ? 'محامي' : 'Lawyer' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }

    try {
      setLoading(true);
      const data = {
        ...formData,
        targetRole: formData.targetRole || null
      };

      if (campaign?.id) {
        await api.patch(`/marketing/email-marketing/${campaign.id}`, data);
      } else {
        await api.post('/marketing/email-marketing', data);
      }

      toast.success(t('common.success'));
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white rounded-[2rem] border-0 shadow-2xl" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader className="sr-only">
          <DialogTitle>{campaign ? 'Edit Campaign' : t('admin.marketing.create')}</DialogTitle>
          <DialogDescription>
            {campaign ? 'Update existing marketing campaign' : 'Create a new automated campaign'}
          </DialogDescription>
        </DialogHeader>

        {/* Modal Header */}
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {campaign ? 'Edit Campaign' : t('admin.marketing.create')}
              </h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                {campaign ? 'Update existing marketing campaign' : 'Create a new automated campaign'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <Type className="w-3 h-3" />
                {t('admin.marketing.table.category')}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Role */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <CheckCircle className="w-3 h-3" />
                {t('admin.marketing.table.role')}
              </label>
              <select
                value={formData.targetRole}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <Calendar className="w-3 h-3" />
                {t('admin.marketing.table.frequency')}
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              >
                {frequencies.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <AlertCircle className="w-3 h-3" />
                {t('admin.marketing.table.status')}
              </label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl h-[46px]">
                <span className="text-sm font-bold text-slate-700">Active</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
              <Mail className="w-3 h-3" />
              {t('admin.marketing.table.content')} (HTML Allowed)
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              placeholder="Enter email content (HTML templates are supported)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <DialogFooter className="flex items-center justify-end gap-3 pt-4 bg-transparent border-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {campaign ? 'Update Campaign' : 'Create Campaign'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
