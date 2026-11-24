"use client";

import { useId } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useLanguage } from '@/context/LanguageContext';
import { getServiceDisplayName } from '@/lib/service-catalog';
import { serviceTree, serviceGrant, type ServiceSelection } from '@/lib/service-navigation';

export default function ServiceCategoryBrowser({ value, onChange, grants }: {
  value: ServiceSelection;
  onChange: (value: ServiceSelection) => void;
  grants?: string[];
}) {
  const { settings } = useSettings();
  const { language } = useLanguage();
  const ar = language === 'ar';
  const id = useId();
  const tree = serviceTree(settings.customServices, settings.customCategories);
  const category = tree.find(item => item.id === value.category);
  const branches = category?.children || [];
  const branch = branches.find(item => item.id === value.branch) || (branches.length === 1 ? branches[0] : undefined);
  const grantLabel = (key: string) => {
    if (!grants) return '';
    const status = serviceGrant(grants, key);
    return status === 'approved' ? (ar ? ' — معتمد لك' : ' — Approved')
      : status === 'partial' ? (ar ? ' — بعض الفروع معتمدة' : ' — Some branches approved')
        : (ar ? ' — للاستعراض فقط' : ' — Browse only');
  };
  const selectClass = 'min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
  return (
    <section aria-label={ar ? 'أقسام الخدمات وتفريعاتها' : 'Service categories and branches'} className="space-y-4 rounded-xl border border-border bg-card p-4" dir={ar ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        <label htmlFor={`${id}-category`} className="block text-sm font-semibold">{ar ? 'القسم' : 'Category'}</label>
        <select id={`${id}-category`} value={category?.id || ''} onChange={event => onChange({ category: event.target.value || undefined })} className={selectClass}>
          <option value="">{ar ? 'كل الخدمات' : 'All services'}</option>
          {tree.map(item => <option key={item.id} value={item.id}>{item.title}{grantLabel(item.id)}</option>)}
        </select>
      </div>
      {category && branches.length > 1 && (
        <div className="space-y-2">
          <label htmlFor={`${id}-branch`} className="block text-sm font-semibold">{ar ? 'الفرع' : 'Branch'}</label>
          <select id={`${id}-branch`} value={value.branch || ''} onChange={event => onChange({ category: category.id, branch: event.target.value || undefined })} className={selectClass}>
            <option value="">{ar ? 'كل فروع القسم' : 'All category branches'}</option>
            {branches.map(item => <option key={item.id} value={item.id}>{item.title}{grantLabel(item.id)}</option>)}
          </select>
        </div>
      )}
      {branch && (
        <div className="space-y-2">
          <label htmlFor={`${id}-service`} className="block text-sm font-semibold">{ar ? 'الخدمة' : 'Service'}</label>
          <select id={`${id}-service`} value={value.service || ''} onChange={event => onChange({ ...value, service: event.target.value || undefined })} className={selectClass}>
            <option value="">{ar ? 'كل خدمات الفرع' : 'All branch services'}</option>
            {branch.services.map(name => <option key={name} value={name}>{getServiceDisplayName(branch.id, name, settings.customServices)}</option>)}
          </select>
        </div>
      )}
      {grants && <p className="text-sm text-muted-foreground">{ar ? 'جميع الأقسام متاحة للاستعراض. تقديم العروض متاح فقط للأقسام والفروع المعتمدة لك.' : 'Browse every category. Submit offers only in your approved categories and branches.'}</p>}
    </section>
  );
}
