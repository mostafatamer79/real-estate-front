"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  User as UserIcon, 
  Filter,
  ShoppingBag,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  MoreVertical,
  Loader2,
  CheckCircle,
  Plus,
  X,
  Building,
  DollarSign,
  Save,
  Clock,
  ArrowRight,
  Ruler,
  Home,
  MessageSquare,
  FileText,
  UserCheck,
  Check,
  Play
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ordersApi, usersApi, adminApi } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

// --- Components ---

function CreateOrderModal({ onClose, onSuccess, initialData = null }: { onClose: () => void; onSuccess: () => void; initialData?: any }) {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [clientMode, setClientMode] = useState<"registered" | "anonymous">(initialData?.userId || initialData?.user ? "registered" : "anonymous");

  const [form, setForm] = useState<any>(initialData || {
    orderType: "buy",
    propertyType: "شقة",
    city: "الرياض",
    neighborhood: "",
    area: 1,
    propertyAge: "جديد",
    deedType: "electronic",
    price: 0,
    rooms: 0,
    bathrooms: 0,
    livingRooms: 0,
    kitchens: 0,
    floors: 0,
    apartments: 0,
    hasMaidRoom: false,
    hasRoof: false,
    hasExternalAnnex: false,
    buildingArea: 0,
    hasGarage: false,
    hasPool: false,
    hasElevator: false,
    furnitureStatus: "unfurnished",
    additionalDetails: "",
    userId: "",
    clientName: "",
    clientPhone: "",
    status: "pending"
  });

  useEffect(() => {
    usersApi.findAll().then(res => setUsers(res.data || [])).finally(() => setLoadingUsers(false));
    if (initialData?.user) {
        setUserSearch(`${initialData.user.firstName} ${initialData.user.lastName}`);
        setClientMode("registered");
    }
  }, [initialData]);

  const filteredUsers = users.filter(u => 
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone?.includes(userSearch)
  ).slice(0, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.neighborhood) return toast.error("يرجى إدخال الحي");
    if (!form.area || form.area < 1) return toast.error("المساحة يجب أن تكون 1 على الأقل");

    setLoading(true);
    try {
      if (initialData) {
        await ordersApi.update(initialData.id, form);
        toast.success("تم تحديث الطلب بنجاح");
      } else {
        await ordersApi.create(form);
        toast.success("تم إنشاء الطلب بنجاح");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إرسال الطلب");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full h-11 bg-slate-50 border-transparent border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all";
  const labelCls = "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5";
  const pillBtn = (active: boolean) =>
    `h-10 px-4 rounded-2xl text-xs font-black transition-all border ${
      active ? "bg-slate-950 text-white border-slate-950 shadow-sm" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
    }`;

  const selectRegisteredUser = (u: any) => {
    setForm((f: any) => ({ ...f, userId: u.id, clientName: "", clientPhone: "" }));
    setUserSearch(`${u.firstName} ${u.lastName}`);
    setClientMode("registered");
  };

  const clearRegisteredUser = () => {
    setForm((f: any) => ({ ...f, userId: "" }));
    setUserSearch("");
    setClientMode("anonymous");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-4xl rounded-2xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto hide-scrollbar">
        <button onClick={onClose} className="absolute left-8 top-8 p-2 text-slate-300 hover:text-slate-950 transition-colors"><X className="w-5 h-5" /></button>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white">
            {initialData ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-950">{initialData ? "تعديل طلب عقاري" : "إضافة طلب عقاري جديد"}</h2>
            <p className="text-xs text-slate-400 font-bold">يرجى إدخال تفاصيل الطلب وتخصيصه لعميل</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Client Selection Section */}
          <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">معلومات العميل</h3>
                <p className="text-[11px] font-bold text-slate-400 mt-1">
                  اختر عميلًا مسجلًا أو أدخل بيانات عميل مجهول.
                </p>
              </div>
              <div className="flex p-1 bg-white rounded-2xl border border-slate-100 w-fit">
                <button
                  type="button"
                  className={pillBtn(clientMode === "registered")}
                  onClick={() => setClientMode("registered")}
                >
                  عميل مسجل
                </button>
                <button
                  type="button"
                  className={pillBtn(clientMode === "anonymous")}
                  onClick={() => {
                    setClientMode("anonymous");
                    setForm((f: any) => ({ ...f, userId: "" }));
                    setUserSearch("");
                  }}
                >
                  عميل مجهول
                </button>
              </div>
            </div>

            {clientMode === "registered" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1 relative">
                  <label className={labelCls}>ابحث عن عميل</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={userSearch}
                      onChange={(e) => {
                        const v = e.target.value;
                        setUserSearch(v);
                        if (form.userId) setForm((f: any) => ({ ...f, userId: "" }));
                      }}
                      className="w-full h-11 bg-white border-slate-100 border focus:border-slate-950 rounded-xl pr-10 pl-10 text-sm font-bold outline-none transition-all"
                      placeholder="ابحث بالاسم أو الجوال..."
                    />
                    {(userSearch || form.userId) && (
                      <button
                        type="button"
                        onClick={clearRegisteredUser}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-300 hover:text-slate-950 hover:bg-slate-50 transition-colors"
                        title="مسح"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {userSearch && !form.userId && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        {loadingUsers ? (
                          <div className="p-4 text-center text-[10px] font-bold text-slate-400">جارٍ التحميل...</div>
                        ) : filteredUsers.length > 0 ? (
                          filteredUsers.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => selectRegisteredUser(u)}
                              className="w-full px-4 py-3 text-right hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-slate-950 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                  {(u.firstName?.[0] || u.email?.[0] || "?").toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-black text-slate-950 truncate">
                                    {u.firstName} {u.lastName}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-bold truncate">
                                    {u.phone || u.email}
                                  </span>
                                </div>
                              </div>
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-[10px] font-bold text-slate-400">لا يوجد نتائج</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className={labelCls}>النتيجة</label>
                  <div className="h-11 px-4 rounded-xl border border-slate-100 bg-white flex items-center justify-between">
                    <span className="text-sm font-black text-slate-950 truncate">
                      {form.userId ? userSearch : "لم يتم اختيار عميل"}
                    </span>
                    {form.userId && (
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                        مرتبط
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className={labelCls}>اسم العميل المجهول</label>
                  <input
                    value={form.clientName}
                    onChange={(e) => setForm((f: any) => ({ ...f, clientName: e.target.value }))}
                    className="w-full h-11 bg-white border-slate-100 border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all"
                    placeholder="مثال: محمد أحمد"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>هاتف العميل</label>
                  <input
                    value={form.clientPhone}
                    onChange={(e) => setForm((f: any) => ({ ...f, clientPhone: e.target.value }))}
                    className="w-full h-11 bg-white border-slate-100 border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all"
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Property Details - Mirroring Building Management Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label className={labelCls}>{t('orders.type')}</Label>
                    <RadioGroup value={form.orderType} onValueChange={(v) => setForm((p: any) => ({...p, orderType: v}))} className="flex gap-6 p-1 bg-slate-50 rounded-2xl w-fit">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all has-[:checked]:bg-white has-[:checked]:shadow-sm">
                            <RadioGroupItem value="buy" id="buy" className="text-slate-950" />
                            <Label htmlFor="buy" className="text-xs font-black cursor-pointer">{t('orders.buy')}</Label>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all has-[:checked]:bg-white has-[:checked]:shadow-sm">
                            <RadioGroupItem value="rent" id="rent" className="text-slate-950" />
                            <Label htmlFor="rent" className="text-xs font-black cursor-pointer">{t('orders.rent')}</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className={labelCls}>{t('orders.propType')}</Label>
                        <Select value={form.propertyType} onValueChange={(v) => setForm((p: any) => ({...p, propertyType: v}))}>
                            <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
                                {["شقة", "فيلا", "قصر", "أرض", "عمارة", "استراحة", "محل تجاري", "مكتب", "مستودع"].map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className={labelCls}>{t('orders.city')}</Label>
                        <Input value={form.city} onChange={e => setForm((p: any) => ({...p, city: e.target.value}))} className="h-11 rounded-xl bg-slate-50 border-transparent focus:border-slate-950" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className={labelCls}>{t('orders.neighborhood')}</Label>
                        <Input value={form.neighborhood} onChange={e => setForm((p: any) => ({...p, neighborhood: e.target.value}))} className="h-11 rounded-xl bg-slate-50 border-transparent focus:border-slate-950" />
                    </div>
                    <div className="space-y-1">
                        <Label className={labelCls}>{t('orders.area')}</Label>
                        <div className="relative">
                            <Input type="number" value={form.area} onChange={e => setForm((p: any) => ({...p, area: parseFloat(e.target.value) || 0}))} className="h-11 rounded-xl bg-slate-50 border-transparent focus:border-slate-950 pl-10" />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">م²</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className={labelCls}>{t('orders.age')}</Label>
                        <Input value={form.propertyAge} onChange={e => setForm((p: any) => ({...p, propertyAge: e.target.value}))} className="h-11 rounded-xl bg-slate-50 border-transparent focus:border-slate-950" />
                    </div>
                    <div className="space-y-1">
                        <Label className={labelCls}>{t('orders.deed')}</Label>
                        <Select value={form.deedType} onValueChange={(v) => setForm((p: any) => ({...p, deedType: v}))}>
                            <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
                                <SelectItem value="electronic">{t('orders.deed.electronic')}</SelectItem>
                                <SelectItem value="paper">{t('orders.deed.paper')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className={labelCls}>{t('orders.price')}</Label>
                    <div className="relative">
                        <Input type="number" value={form.price} onChange={e => setForm((p: any) => ({...p, price: parseFloat(e.target.value) || 0}))} className="h-11 rounded-xl bg-slate-50 border-transparent focus:border-slate-950 pl-10" />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">ر.س</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-base font-bold text-slate-950">{t('bm.offer.detailed')}</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className={labelCls}>{t('orders.rooms')}</Label>
                        <Input type="number" value={form.rooms} onChange={e => setForm((p: any) => ({...p, rooms: parseInt(e.target.value) || 0}))} className="h-11 rounded-xl bg-slate-50 border-transparent focus:border-slate-950" />
                    </div>
                    <div className="space-y-1">
                        <Label className={labelCls}>{t('orders.baths')}</Label>
                        <Input type="number" value={form.bathrooms} onChange={e => setForm((p: any) => ({...p, bathrooms: parseInt(e.target.value) || 0}))} className="h-11 rounded-xl bg-slate-50 border-transparent focus:border-slate-950" />
                    </div>
                    <div className="space-y-1">
                        <Label className={labelCls}>{t('orders.living')}</Label>
                        <Input type="number" value={form.livingRooms} onChange={e => setForm((p: any) => ({...p, livingRooms: parseInt(e.target.value) || 0}))} className="h-11 rounded-xl bg-slate-50 border-transparent focus:border-slate-950" />
                    </div>
                    <div className="space-y-1">
                        <Label className={labelCls}>{t('orders.kitchens')}</Label>
                        <Input type="number" value={form.kitchens} onChange={e => setForm((p: any) => ({...p, kitchens: parseInt(e.target.value) || 0}))} className="h-11 rounded-xl bg-slate-50 border-transparent focus:border-slate-950" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 p-3 rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer">
                        <Checkbox id="maid" checked={form.hasMaidRoom} onCheckedChange={(v) => setForm((p: any) => ({...p, hasMaidRoom: !!v}))} />
                        <Label htmlFor="maid" className="text-xs font-bold cursor-pointer">{t('orders.maid')}</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 p-3 rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer">
                        <Checkbox id="roof" checked={form.hasRoof} onCheckedChange={(v) => setForm((p: any) => ({...p, hasRoof: !!v}))} />
                        <Label htmlFor="roof" className="text-xs font-bold cursor-pointer">{t('orders.roof')}</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 p-3 rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer">
                        <Checkbox id="pool" checked={form.hasPool} onCheckedChange={(v) => setForm((p: any) => ({...p, hasPool: !!v}))} />
                        <Label htmlFor="pool" className="text-xs font-bold cursor-pointer">{t('orders.pool')}</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 p-3 rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer">
                        <Checkbox id="elevator" checked={form.hasElevator} onCheckedChange={(v) => setForm((p: any) => ({...p, hasElevator: !!v}))} />
                        <Label htmlFor="elevator" className="text-xs font-bold cursor-pointer">{t('orders.elevator')}</Label>
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className={labelCls}>{t('orders.furniture')}</Label>
                    <Select value={form.furnitureStatus} onValueChange={(v) => setForm((p: any) => ({...p, furnitureStatus: v}))}>
                        <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            <SelectItem value="furnished">{t('orders.furnished')}</SelectItem>
                            <SelectItem value="unfurnished">{t('orders.unfurnished')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className={labelCls}>{t('orders.details')}</Label>
            <Textarea 
                value={form.additionalDetails} 
                onChange={e => setForm((p: any) => ({...p, additionalDetails: e.target.value}))} 
                className="rounded-2xl bg-slate-50 border-transparent focus:border-slate-950 min-h-[100px]" 
                placeholder={t('orders.additionalDetailsPlaceholder')} 
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl bg-slate-950 text-white hover:bg-slate-900 text-base font-black shadow-xl shadow-slate-900/10">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (initialData ? "تحديث الطلب" : "إرسال الطلب")}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

function AssignOrderModal({ order, onClose, onSuccess }: { order: any; onClose: () => void; onSuccess: () => void }) {
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setCurrentUser(JSON.parse(stored));
        usersApi.findAll().then(res => setUsers(res.data || []));
    }, []);

    const filteredUsers = users.filter(u => 
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search)
    ).slice(0, 10);

    const handleAssign = async (userId: string | null) => {
        setLoading(true);
        try {
            await ordersApi.assign(order.id, userId);
            toast.success("تم التعيين بنجاح");
            onSuccess();
            onClose();
        } catch (err) {
            toast.error("فشل التعيين");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl relative">
                <button onClick={onClose} className="absolute left-8 top-8 p-2 text-slate-300 hover:text-slate-950 transition-colors"><X className="w-5 h-5" /></button>
                
                <h2 className="text-xl font-black text-slate-950 mb-6 flex items-center gap-2">
                    <UserCheck className="w-6 h-6" />
                    تعيين الطلب لـ...
                </h2>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Button onClick={() => handleAssign(currentUser?.id)} variant="outline" className="h-12 rounded-xl border-slate-100 hover:border-slate-950 font-bold gap-2">
                            <UserIcon className="w-4 h-4" /> أنا (Me)
                        </Button>
                        <Button onClick={() => handleAssign(null)} variant="outline" className="h-12 rounded-xl border-slate-100 hover:border-slate-950 font-bold gap-2">
                            <EyeOff className="w-4 h-4" /> مجهول (None)
                        </Button>
                    </div>

                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="ابحث عن موظف أو عميل..." 
                            className="pr-10 h-12 rounded-xl bg-slate-50 border-transparent focus:border-slate-950" 
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                        {filteredUsers.map(u => (
                            <button 
                                key={u.id} 
                                onClick={() => handleAssign(u.id)}
                                className="w-full p-3 rounded-xl hover:bg-slate-50 border border-slate-50 flex items-center justify-between transition-all group"
                            >
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900">{u.firstName} {u.lastName}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{u.role}</p>
                                </div>
                                <ArrowRight className={`w-4 h-4 text-slate-200 group-hover:text-slate-950 group-hover:translate-x-1 ${language === 'ar' ? 'rotate-180' : ''}`} />
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// --- Main Page ---

export default function OrdersPage() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState<any>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await ordersApi.findAll();
      setOrders(res.data || []);
    } catch (error) {
      toast.error("فشل تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب؟")) return;
    try {
        await ordersApi.delete(id);
        toast.success("تم الحذف بنجاح");
        fetchOrders();
    } catch (err) {
        toast.error("فشل الحذف");
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
        await ordersApi.updateStatus(id, status);
        toast.success("تم تحديث الحالة");
        fetchOrders();
    } catch (err) {
        toast.error("فشل تحديث الحالة");
    }
  };

  const filteredOrders = orders.filter(o => 
    (statusFilter === "all" || o.status === statusFilter) &&
    (
        o.propertyType?.toLowerCase().includes(search.toLowerCase()) ||
        o.city?.toLowerCase().includes(search.toLowerCase()) ||
        o.neighborhood?.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        o.clientName?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-bold px-3 py-1 rounded-full ring-1 ring-amber-200/50">قيد الانتظار</Badge>;
      case 'in_progress': return <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-bold px-3 py-1 rounded-full ring-1 ring-blue-200/50">قيد المعالجة</Badge>;
      case 'completed': return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-3 py-1 rounded-full ring-1 ring-emerald-200/50">مكتمل</Badge>;
      case 'cancelled': return <Badge className="bg-rose-50 text-rose-600 border-rose-100 font-bold px-3 py-1 rounded-full ring-1 ring-rose-200/50">ملغي</Badge>;
      default: return <Badge className="bg-slate-50 text-slate-400 border-slate-100 font-bold px-3 py-1 rounded-full">{status}</Badge>;
    }
  };

  const stats = [
    { label: "إجمالي الطلبات", value: orders.length, icon: ShoppingBag, color: "bg-slate-100 text-slate-700" },
    { label: "طلبات معلقة", value: orders.filter(o => o.status === 'pending').length, icon: Clock, color: "bg-slate-100 text-slate-700" },
    { label: "قيد العمل", value: orders.filter(o => o.status === 'in_progress').length, icon: Play, color: "bg-slate-100 text-slate-700" },
    { label: "طلبات مكتملة", value: orders.filter(o => o.status === 'completed').length, icon: CheckCircle, color: "bg-slate-100 text-slate-700" },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 mb-1">إدارة الطلبات العقارية</h1>
          <p className="text-slate-400 text-xs font-bold">إضافة، تعديل، وتعيين الطلبات للوسطاء والموظفين</p>
        </div>
        <Button 
          onClick={() => { setSelectedOrder(null); setShowCreate(true); }} 
          className="flex items-center gap-2 bg-slate-950 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> إضافة طلب جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
                    <s.icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-2xl font-black text-slate-950">{s.value}</p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                </div>
            </motion.div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في العقار، المدينة، العميل..." className="h-11 pr-11 rounded-xl bg-white border-slate-100 focus:border-slate-950" />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl">
                    {['all', 'pending', 'in_progress', 'completed'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${statusFilter === s ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            {s === 'all' ? 'الكل' : s === 'pending' ? 'المعلق' : s === 'in_progress' ? 'قيد العمل' : 'المكتمل'}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow>
                        <TableHead className="w-20 text-center font-black py-6">ID</TableHead>
                        <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">نوع العقار</TableHead>
                        <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">العميل</TableHead>
                        <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">التفاصيل</TableHead>
                        <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">المسؤول</TableHead>
                        <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">السعر</TableHead>
                        <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">الحالة</TableHead>
                        <TableHead className="w-10"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={8} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-200" /></TableCell></TableRow>
                    ) : filteredOrders.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="py-20 text-center font-bold text-slate-300 italic">لا يوجد طلبات مطابقة للبحث</TableCell></TableRow>
                    ) : filteredOrders.map(order => (
                        <TableRow key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                            <TableCell className="text-center font-mono text-[10px] text-slate-400">#{order.id.substring(0, 4)}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-slate-950 transition-all border border-transparent group-hover:border-slate-100">
                                        <Building className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-950">{order.propertyType}</p>
                                        <p className={`text-[10px] font-black uppercase tracking-tighter ${order.orderType === 'buy' ? 'text-blue-500' : 'text-slate-400'}`}>
                                            {order.orderType === 'buy' ? 'شراء' : 'إيجار'}
                                        </p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                {order.user ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">
                                            {order.user.firstName?.[0]}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-900">{order.user.firstName} {order.user.lastName}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">{order.user.phone}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 italic">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                                            <UserIcon className="w-4 h-4" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-400">{order.clientName || 'مجهول'}</p>
                                            <p className="text-[10px] text-slate-300 font-bold">{order.clientPhone || 'بدون هاتف'}</p>
                                        </div>
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                                        <MapPin className="w-3 h-3 text-slate-400" />
                                        {order.city} • {order.neighborhood}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{order.area} م²</span>
                                        {order.rooms > 0 && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{order.rooms} غرف</span>}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                {order.assignedTo ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                                            <UserCheck className="w-3 h-3" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">{order.assignedTo.firstName}</span>
                                    </div>
                                ) : (
                                    <button onClick={() => { setAssigningOrder(order); setShowAssign(true); }} className="text-[10px] font-black text-slate-300 hover:text-slate-950 uppercase tracking-widest flex items-center gap-1 transition-colors">
                                        <UserCheck className="w-3 h-3" /> تعيين مسؤول
                                    </button>
                                )}
                            </TableCell>
                            <TableCell>
                                <p className="text-sm font-black text-slate-950">{order.price?.toLocaleString()} <span className="text-[10px] text-slate-400">ر.س</span></p>
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100">
                                            <MoreVertical className="w-5 h-5 text-slate-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-slate-100">
                                        <DropdownMenuItem onClick={() => { setSelectedOrder(order); setShowCreate(true); }} className="rounded-xl font-bold py-3 text-slate-700 gap-3">
                                            <Edit2 className="w-4 h-4" /> تعديل الطلب
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setAssigningOrder(order); setShowAssign(true); }} className="rounded-xl font-bold py-3 text-slate-700 gap-3">
                                            <UserCheck className="w-4 h-4" /> تغيير المسؤول
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-slate-50 my-1" />
                                        <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">تغيير الحالة</div>
                                        {['pending', 'in_progress', 'completed', 'cancelled'].map(s => (
                                            <DropdownMenuItem key={s} onClick={() => handleUpdateStatus(order.id, s)} className="rounded-xl font-bold py-2 text-slate-600 hover:text-slate-950 gap-3">
                                                <div className={`w-2 h-2 rounded-full ${s === 'pending' ? 'bg-amber-500' : s === 'in_progress' ? 'bg-blue-500' : s === 'completed' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                {s === 'pending' ? 'قيد الانتظار' : s === 'in_progress' ? 'قيد العمل' : s === 'completed' ? 'مكتمل' : 'إلغاء الطلب'}
                                                {order.status === s && <Check className="w-4 h-4 ms-auto text-slate-950" />}
                                            </DropdownMenuItem>
                                        ))}
                                        <DropdownMenuSeparator className="bg-slate-50 my-1" />
                                        <DropdownMenuItem onClick={() => handleDelete(order.id)} className="rounded-xl font-bold py-3 text-rose-600 hover:bg-rose-50 gap-3">
                                            <Trash2 className="w-4 h-4" /> حذف الطلب
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && <CreateOrderModal initialData={selectedOrder} onClose={() => setShowCreate(false)} onSuccess={fetchOrders} />}
        {showAssign && <AssignOrderModal order={assigningOrder} onClose={() => setShowAssign(false)} onSuccess={fetchOrders} />}
      </AnimatePresence>
    </div>
  );
}
