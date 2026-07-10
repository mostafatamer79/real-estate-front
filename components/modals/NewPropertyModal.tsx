"use client";

import React from "react";
import { X, Building, MapPin, Hash, DollarSign, Loader2, Home, Landmark, Warehouse, Map, SaudiRiyalIcon } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Property } from "@/types/api";
import { SaudiRiyalSymbol } from "@/components/ui/saudi-riyal";

interface NewPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  data: Partial<Property>;
  setData: (data: Partial<Property>) => void;
  loading: boolean;
}

export function NewPropertyModal({
  isOpen,
  onClose,
  onSubmit,
  data,
  setData,
  loading
}: NewPropertyModalProps) {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  const propertyTypes = [
    { value: "building", label: t('property.type.building'), icon: Building },
    { value: "compound", label: t('property.type.compound'), icon: Home },
    { value: "land", label: t('property.type.land'), icon: Landmark },
    { value: "warehouse", label: t('property.type.warehouse'), icon: Warehouse },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-gray-800 rounded-3xl w-[95vw] sm:max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative p-3 sm:p-6 border-b border-gray-800 bg-slate-900/50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <PlusIcon className="w-5 h-5 text-blue-500" />
                {t('bm.offer.new')} - {t('pm.properties')}
              </h3>
              <p className="text-gray-400 text-sm mt-1">{t('action.assetManagement')}</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-4 sm:p-8 space-y-6">
          {/* Property Name */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2 ml-1">
              <Building className="w-4 h-4 text-blue-500" />
              {t('pm.field.propertyName')}
            </Label>
            <Input 
              required
              value={data.name || ''}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder={t('pm.field.propertyName')}
              className="bg-slate-950 border-gray-800 text-white placeholder:text-gray-600 focus:ring-blue-500/20 focus:border-blue-500 h-12 rounded-xl px-4"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Property Type */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2 ml-1">
                <Home className="w-4 h-4 text-blue-500" />
                {t('bm.offer.type')}
              </Label>
              <select 
                className="w-full h-12 px-4 rounded-xl border border-gray-800 bg-slate-950 text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                value={data.type || 'building'}
                onChange={(e) => setData({ ...data, type: e.target.value as any })}
              >
                {propertyTypes.map(type => (
                  <option key={type.value} value={type.value} className="bg-slate-900">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Deed Number */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2 ml-1">
                <Hash className="w-4 h-4 text-blue-500" />
                {t('bm.offer.deedNumber')}
              </Label>
              <Input 
                value={data.deedNumber || ''}
                onChange={(e) => setData({ ...data, deedNumber: e.target.value })}
                placeholder="0000000000"
                className="bg-slate-950 border-gray-800 text-white placeholder:text-gray-600 focus:ring-blue-500/20 focus:border-blue-500 h-12 rounded-xl px-4"
              />
            </div>
          </div>

          {/* Location URL */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2 ml-1">
              <MapPin className="w-4 h-4 text-blue-500" />
              {t('bm.offer.location')}
            </Label>
            <div className="relative">
              <Input 
                value={data.locationUrl || ''}
                onChange={(e) => setData({ ...data, locationUrl: e.target.value })}
                placeholder="https://maps.google.com/..."
                className="bg-slate-950 border-gray-800 text-white placeholder:text-gray-600 focus:ring-blue-500/20 focus:border-blue-500 h-12 rounded-xl pl-4 pr-10"
              />
              <Map className="absolute right-3 top-3.5 w-5 h-5 text-gray-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Price */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2 ml-1">
                <SaudiRiyalIcon className="w-4 h-4 text-blue-500" />
                {t('pm.field.purchasePrice')}
              </Label>
              <div className="relative">
                <Input 
                  type="number"
                  value={data.purchasePrice ?? 0}
                  onChange={(e) => setData({ ...data, purchasePrice: Number(e.target.value) })}
                  className="bg-slate-950 border-gray-800 text-white placeholder:text-gray-600 focus:ring-blue-500/20 focus:border-blue-500 h-12 rounded-xl pl-4 pr-12"
                />
                <span className="absolute right-4 top-3.5 text-gray-500 text-sm"><SaudiRiyalSymbol iconClassName="h-4 w-4" /></span>
              </div>
            </div>

            {/* Construction Year */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2 ml-1">
                <Home className="w-4 h-4 text-blue-500" />
                {t('pm.field.constructionDate')}
              </Label>
              <Input 
                type="text"
                value={data.constructionDate || ''}
                onChange={(e) => setData({ ...data, constructionDate: e.target.value })}
                placeholder="2024"
                className="bg-slate-950 border-gray-800 text-white placeholder:text-gray-600 focus:ring-blue-500/20 focus:border-blue-500 h-12 rounded-xl px-4"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 h-12 rounded-xl border-gray-800 text-gray-300 hover:bg-slate-800 hover:text-white transition-all font-medium" 
              onClick={onClose}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-12 rounded-xl bg-slate-600 hover:bg-slate-700 text-white transition-all font-bold shadow-lg shadow-blue-500/20" 
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <div className={`p-1 bg-slate-500/20 rounded ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    </div>
  );
}
