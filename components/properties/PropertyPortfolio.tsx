"use client";

import React, { useState } from "react";
import { Building, Plus, Trash2, Search, MapPin, Ruler, Bed, Bath, Home, Share2, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Property } from "@/types/api";

interface PropertyPortfolioProps {
  properties: Property[];
  loading: boolean;
  onToggleActive?: (id: string, isActive: boolean) => void;
  onView: (property: Property) => void;
  onCreate?: () => void;
  onExportOffer?: (property: Property) => void;
}

export function PropertyPortfolio({
  properties,
  loading,
  onToggleActive,
  onView,
  onCreate,
  onExportOffer
}: PropertyPortfolioProps) {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProperties = properties.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.deedNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-100/50">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
            <div>
                 <h2 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">{t('pm.tab.portfolio')}</h2>
                 <p className="text-slate-500 text-sm font-medium">{t('pm.properties')}</p>
            </div>
          
           <div className="flex gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                    <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                    <Input
                        type="text"
                        placeholder={t('pm.list.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`h-12 bg-slate-50 border-gray-100 ${language === 'ar' ? 'pr-11' : 'pl-11'} focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-500/5 transition-all font-bold text-slate-900 rounded-2xl text-xs`}
                    />
                </div>
                {onCreate && (
                <Button
                    onClick={onCreate}
                    className="h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 shadow-lg shadow-slate-200 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all hover:-translate-y-0.5"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('bm.offer.new')}</span>
                </Button>
                )}
           </div>
        </div>
      </div>

      {loading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
               <div key={i} className="h-72 bg-slate-50 rounded-[2rem] animate-pulse border border-gray-100" />
            ))}
         </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-24 bg-slate-50/30 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-24 h-24 bg-white shadow-xl shadow-slate-200/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Building className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{t('pm.list.empty')}</h3>
            <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto font-medium">{t('pm.list.emptyDesc')}</p>
            {onCreate && (
            <Button 
                onClick={onCreate} 
                className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl font-black text-[11px] uppercase tracking-widest px-8 h-12 shadow-sm transition-all"
            >
               {t('pm.list.createFirst')}
            </Button>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map(property => (
            <Card 
                key={property.id} 
                className="bg-white border-gray-100 hover:border-slate-200 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2 transition-all duration-500 rounded-[2.5rem] overflow-hidden cursor-pointer shadow-xl shadow-slate-100/30 group border-0"
                onClick={() => onView(property)}
            >
              <CardContent className="p-0">
                 <div className="p-8 pb-5">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-sm">
                            <Building className="w-7 h-7" />
                        </div>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-slate-50 text-[10px] font-black uppercase tracking-wider rounded-lg text-slate-600 border border-slate-100 group-hover:border-slate-200 group-hover:bg-white transition-colors">
                                {t(`property.type.${property.type}`) || property.type}
                            </span>
                              {onExportOffer && (
                              <button 
                                 className="w-8 h-8 flex items-center justify-center bg-white border border-gray-100 rounded-lg shadow-sm hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 transition-all opacity-40 group-hover:opacity-100" 
                                 title={t("pm.action.exportOffer")}
                                 onClick={(e) => { e.stopPropagation(); onExportOffer(property); }}
                             >
                                 <Share2 className="w-4 h-4" />
                             </button>
                             )}
                             {onToggleActive && (
                             <button 
                                className={`w-8 h-8 flex items-center justify-center bg-white border rounded-lg shadow-sm transition-all opacity-40 group-hover:opacity-100 ${
                                  property.isActive 
                                    ? 'hover:bg-slate-50 hover:border-slate-200 hover:text-slate-900 border-gray-100 text-slate-900' 
                                    : 'hover:bg-amber-50 hover:border-amber-100 hover:text-amber-600 border-gray-100 text-slate-300'
                                }`}
                                title={property.isActive ? (language === 'ar' ? 'تعطيل العقار' : 'Deactivate Property') : (language === 'ar' ? 'تفعيل العقار' : 'Activate Property')}
                                onClick={(e) => { e.stopPropagation(); onToggleActive(property.id, !property.isActive); }}
                             >
                                {property.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                             </button>
                             )}
                        </div>
                     </div>
                     
                     <h3 className="font-black text-2xl text-slate-900 mb-2 line-clamp-1 tracking-tight">{property.name}</h3>
                     <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-bold">
                        <span className="bg-slate-50 px-3 py-1 rounded-lg text-slate-900 border border-slate-100 font-black tracking-wider">
                            {property.deedNumber || '-'}
                        </span>
                        <span className="uppercase tracking-widest text-[10px] opacity-70">{t('pm.field.deedNumber')}</span>
                     </div>
                 </div>

                 <div className="bg-slate-50/50 p-6 px-8 border-t border-gray-50 flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                    <div className="text-slate-400 group-hover:text-slate-900 transition-colors">
                        <span className="text-slate-900">{property.units?.length || 0}</span> {t('pm.tab.units')}
                    </div>
                    <div className={`flex items-center gap-2 text-slate-900 opacity-40 group-hover:opacity-100 transition-all ${language === 'ar' ? 'group-hover:translate-x-[-8px]' : 'group-hover:translate-x-[8px]'}`}>
                        {t('cards.details')}
                        <Plus className="w-3.5 h-3.5" />
                    </div>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
