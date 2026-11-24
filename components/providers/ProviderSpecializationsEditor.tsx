"use client";
import {useEffect,useState} from 'react';
import {providerApi,providerError,type ProviderSpecialization} from '@/lib/providers';
import {useLanguage} from '@/context/LanguageContext';
import {Button} from '@/components/ui/button';
import ServiceCategoryTree from './ServiceCategoryTree';
export default function ProviderSpecializationsEditor(){
 const[ready,setReady]=useState(false);
 const{language}=useLanguage();const ar=language==='ar';
 const[items,setItems]=useState<ProviderSpecialization[]>([]),[selected,setSelected]=useState<string|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 useEffect(()=>{providerApi.specializations().then(result=>{setItems(result.data);setReady(true)}).catch(error=>setError(providerError(error,ar?'تعذر تحميل أنواع المزودين':'Could not load provider types')))},[ar]);
 const update=(id:string,patch:Partial<ProviderSpecialization>)=>setItems(current=>current.map(item=>item.id===id?{...item,...patch}:item));
 return <section className="space-y-4 rounded-xl border border-border bg-card p-4" aria-label={ar?'إعداد أنواع المزودين':'Provider types settings'}>
 <h2 className="font-bold">{ar?'أنواع المزودين والتخصصات':'Provider types and specializations'}</h2>
 <p className="text-sm text-muted-foreground">{ar?'أضف نوعًا مثل مقاول واربطه بالأقسام المناسبة. النوع لا يمنح صلاحيات تلقائية، وتبقى الطلبات القديمة محفوظة عند تعطيله.':'Add types such as contractor and link their categories. Types do not grant permissions; disabling one preserves historical applications.'}</p>
 {items.map(item=><div key={item.id} className="space-y-2 rounded-lg border p-3"><label className="block text-sm">{ar?'اسم النوع':'Type name'}<input disabled={!ready||busy} value={item.title} maxLength={100} onChange={e=>update(item.id,{title:e.target.value})} className="mt-1 w-full rounded-lg border bg-background p-2"/></label><label className="flex gap-2"><input disabled={!ready||busy} type="checkbox" checked={item.enabled} onChange={e=>update(item.id,{enabled:e.target.checked})}/>{ar?'متاح للتسجيل':'Available for applications'}</label><Button variant="outline" onClick={()=>setSelected(selected===item.id?null:item.id)}>{ar?'الأقسام المرتبطة':'Linked categories'}</Button>{selected===item.id&&<ServiceCategoryTree selected={item.categories} onChange={categories=>update(item.id,{categories})}/>}</div>)}
 <div className="flex flex-wrap gap-3"><Button variant="outline" disabled={!ready||busy||items.length>=50} onClick={()=>setItems(current=>[...current,{id:'type_'+Date.now().toString(36),title:'',categories:[],enabled:true}])}>{ar?'إضافة نوع مزود':'Add provider type'}</Button><Button disabled={!ready||busy} onClick={async()=>{setBusy(true);setError('');setNotice('');try{const result=await providerApi.saveSpecializations(items);setItems(result.data);setNotice(ar?'تم حفظ الأنواع':'Types saved')}catch(error){setError(providerError(error,ar?'تعذر حفظ الأنواع':'Could not save types'))}finally{setBusy(false)}}}>{ar?'حفظ أنواع المزودين':'Save provider types'}</Button></div>
 <p className="text-sm">{ar?'إضافة أقسام وخدمات وحقول نماذج:':'Manage categories, services and form fields:'} <a href="/admin/services?panel=pricing" className="underline">{ar?'الأقسام والخدمات':'Categories and services'}</a> · <a href="/admin/services?panel=forms" className="underline">{ar?'حقول نماذج الطلبات':'Request form fields'}</a></p>
 {error&&<p role="alert">{error}</p>}{!ready&&error&&<Button variant="outline" onClick={()=>window.location.reload()}>{ar?"إعادة تحميل الإعدادات":"Reload settings"}</Button>}{notice&&<p role="status">{notice}</p>}
 </section>
}
