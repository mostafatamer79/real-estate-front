'use client';
import { DEFAULT_DETAILS_DESIGN, parseDetailsDesign, type DetailsDesign, type DetailsPlace } from '@/lib/details-design';

export default function DetailsDesignControls({value,onChange,order,onOrderChange}:{value?:string;onChange:(value:string)=>void;order?:string;onOrderChange:(value:string)=>void}){
  const config=parseDetailsDesign(value);
  const update=(patch:Partial<DetailsDesign>)=>onChange(JSON.stringify({...config,...patch}));
  const pinUpdate=(id:string,patch:Partial<DetailsPlace>)=>update({places:config.places.map(pin=>pin.id===id?{...pin,...patch}:pin)});
  const labels={map:'الخريطة',stats:'إحصائيات العمليات',charts:'التحليلات',quick_actions:'الوصول السريع'};
  type Section=keyof typeof labels;
  const defaults=Object.keys(labels) as Section[];
  const saved=(order||'').split(',').filter((part):part is Section=>part in labels);
  const sections=[...new Set([...saved,...defaults])];
  const move=(index:number,delta:number)=>{const next=[...sections];[next[index],next[index+delta]]=[next[index+delta],next[index]];onOrderChange(next.join(','));};
  return <section className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-6" dir="rtl">
    <h3 className="text-lg font-bold">تصميم صفحة التفاصيل والمشهد ثلاثي الأبعاد</h3>
    <p className="text-sm text-muted-foreground">تُحفظ هذه الخيارات مع زر حفظ الإعدادات الحالي. نصوص الواجهة قابلة للتعديل من قسم النصوص تحت details. النموذج والأماكن توضيحية وليست بيانات مواقع فعلية.</p>
    <div className="grid gap-3 sm:grid-cols-2">{([
      ['enable3d','إظهار العرض ثلاثي الأبعاد'],['typing','تأثير الكتابة في العنوان'],['showPins','إظهار علامات الأماكن المحيطة'],['showPropertyPin','إظهار علامة العقار الرئيسية'],['showSectionIcons','إظهار أيقونات عناوين الأقسام'],
    ] as const).map(([key,label])=><label key={key} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={config[key]} onChange={e=>update({[key]:e.target.checked})}/>{label}</label>)}</div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-1 text-sm">لون علامة العقار<input aria-label="لون علامة العقار" type="color" value={config.propertyPinColor} onChange={e=>update({propertyPinColor:e.target.value})} className="block h-11 w-full"/></label>
      {([['desktopHeight','ارتفاع المشهد على الكمبيوتر',260,480],['mobileHeight','ارتفاع المشهد على الجوال',220,340],['latitude','خط العرض للخريطة',-85,85],['longitude','خط الطول للخريطة',-180,180]] as const).map(([key,label,min,max])=><label key={key} className="space-y-1 text-sm">{label}<input type="number" step={key.includes('Height')?1:.0001} min={min} max={max} value={config[key]} onChange={e=>{if(e.target.value!=='')update({[key]:Math.max(min,Math.min(max,Number(e.target.value)))});}} className="block min-h-11 w-full rounded-lg border border-border bg-background px-3"/></label>)}
    </div>
    <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="mb-3 font-semibold">ألوان صفحة التفاصيل — النهاري والليلي</legend>{([['lightBackground','الخلفية النهارية'],['lightSurface','البطاقات النهارية'],['lightText','النص النهاري'],['darkBackground','الخلفية الليلية'],['darkSurface','البطاقات الليلية'],['darkText','النص الليلي']] as const).map(([key,label])=><label key={key} className="text-sm">{label}<input type="color" aria-label={label} value={config[key]} onChange={e=>update({[key]:e.target.value})} className="mt-1 block h-11 w-full"/></label>)}</fieldset>
    <fieldset className="space-y-3"><legend className="font-semibold">ترتيب الأقسام</legend>{sections.map((id,index)=><div key={id} className="flex items-center justify-between gap-3 text-sm"><span>{labels[id]}</span><div className="flex gap-2"><button type="button" disabled={index===0} aria-label={`تحريك ${labels[id]} لأعلى`} onClick={()=>move(index,-1)} className="min-h-11 rounded-lg border px-3 disabled:opacity-40">↑</button><button type="button" disabled={index===sections.length-1} aria-label={`تحريك ${labels[id]} لأسفل`} onClick={()=>move(index,1)} className="min-h-11 rounded-lg border px-3 disabled:opacity-40">↓</button></div></div>)}</fieldset>
    <fieldset className="space-y-4"><legend className="font-semibold">علامات الأماكن — الأسماء والمواضع</legend>{config.places.map(pin=><div key={pin.id} className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-2"><label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={pin.enabled} onChange={e=>pinUpdate(pin.id,{enabled:e.target.checked})}/>{DEFAULT_DETAILS_DESIGN.places.find(p=>p.id===pin.id)?.ar}</label><label className="text-xs">الاسم بالعربية<input value={pin.ar} maxLength={80} onChange={e=>pinUpdate(pin.id,{ar:e.target.value})} className="mt-1 block min-h-11 w-full rounded-lg border bg-background px-3"/></label><label className="text-xs">English label<input dir="ltr" value={pin.en} maxLength={80} onChange={e=>pinUpdate(pin.id,{en:e.target.value})} className="mt-1 block min-h-11 w-full rounded-lg border bg-background px-3"/></label><div className="grid grid-cols-3 gap-2 sm:col-span-2">{(['x','y','z'] as const).map(key=><label key={key} className="text-xs">{key.toUpperCase()}<input type="number" step="0.1" min={key==='y'?.3:key==='x'?-6.5:-4.5} max={key==='y'?3:key==='x'?6.5:4.5} value={pin[key]} onChange={e=>{if(e.target.value!=='')pinUpdate(pin.id,{[key]:Number(e.target.value)});}} className="mt-1 block min-h-11 w-full rounded-lg border bg-background px-2"/></label>)}</div></div>)}</fieldset>
  </section>;
}
