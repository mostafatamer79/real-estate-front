"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SaudiRiyalAmount, SaudiRiyalSymbol } from "@/components/ui/saudi-riyal";
import { 
  CreditCard, 
  Search, 
  Filter, 
  User as UserIcon, 
  Briefcase, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  Loader2,
  Package,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Ban,
  Trash2,
  RefreshCw,
  Plus,
  X,
  DollarSign,
  Save
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import api, { adminSubscriptionsApi, usersApi, packagesApi } from "@/lib/api";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";
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

// Helper to normalize backend Arabic status to English
const normalizeStatus = (status: string) => {
  if (status === 'نشط') return 'active';
  if (status === 'منتهي') return 'expired';
  if (status === 'ملغي') return 'cancelled';
  if (status === 'معلق') return 'pending';
  return status;
};

const ADMINISTRATIONS = [
  "admin.dept.real_estate",
  "admin.dept.offers",
  "admin.dept.orders",
  "admin.dept.marketing",
  "admin.dept.legal",
  "admin.dept.finance",
  "admin.dept.hr",
];
const emptyGlobalPricing = () => ({
  departmentPrices: ADMINISTRATIONS.reduce((acc, department) => {
    acc[department] = { monthly: 0, yearly: 0 };
    return acc;
  }, {} as Record<string, { monthly: number; yearly: number }>),
  employeeSeatMonthlyPrice: 0,
  employeeSeatYearlyPrice: 0,
});

const DEPARTMENTS = [
  { value: 'marketing',  labelAr: 'إدارة التسويق',   labelEn: 'Marketing' },
  { value: 'properties', labelAr: 'إدارة الاملاك',   labelEn: 'Properties' },
  { value: 'offers',     labelAr: 'إدارة العروض',    labelEn: 'Offers Management' },
  { value: 'orders',     labelAr: 'إدارة الطلبات',   labelEn: 'Orders Management' },
  { value: 'finance',    labelAr: 'الإدارة المالية',  labelEn: 'Finance' },
  { value: 'legal',      labelAr: 'الإدارة القانونية', labelEn: 'Legal' },
  { value: 'employees',  labelAr: 'إدارة الموظفين',  labelEn: 'Employees' },
];

const ROLES = [
  { value: 'employee', labelAr: 'موظف', labelEn: 'Employee' },
  { value: 'manager', labelAr: 'مدير', labelEn: 'Manager' },
  { value: 'legal', labelAr: 'قانوني', labelEn: 'Legal' },
  { value: 'finance', labelAr: 'مالي', labelEn: 'Finance' },
  { value: 'marketing', labelAr: 'تسويق', labelEn: 'Marketing' },
  { value: 'viewer', labelAr: 'قارئ', labelEn: 'Viewer' },
];

function CreateSubscriptionModal({ onClose, onSuccess, subscription }: { onClose: () => void; onSuccess: () => void; subscription?: any | null }) {
  const { language, t } = useLanguage();
  const isEdit = Boolean(subscription?.id);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [planMode, setPlanMode] = useState<"package" | "custom">("package");
  const [globalPricing, setGlobalPricing] = useState(emptyGlobalPricing());

  const [form, setForm] = useState({
    userId: subscription?.userId || "",
    packageId: subscription?.packageId || subscription?.managementPackage?.id || "",
    subscriptionType: subscription?.subscriptionType || "سنوي", // Default to Arabic enum as per backend entity
    customPeriodMonths: Number(subscription?.customPeriodMonths || 1),
    amount: Number(subscription?.amount || 0),
    selectedDepartments: (subscription?.selectedDepartments || []) as string[],
    employeeSeats: Number(subscription?.employeeSeats || 0),
    startDate: subscription?.startDate ? new Date(subscription.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: subscription?.endDate ? new Date(subscription.endDate).toISOString().split('T')[0] : "",
    paymentMethod: subscription?.paymentMethod || "بطاقة ائتمان", // Default to Arabic enum
    status: subscription?.status || "نشط", // Default to Arabic enum
    noExpiry: Boolean(subscription?.noExpiry),
    notes: subscription?.notes || ""
  });

  const [createUserMode, setCreateUserMode] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "employee",
    department: [] as string[],
    parentId: "",
  });

  const [managerAllowedDepartments, setManagerAllowedDepartments] = useState<string[] | null>(null);

  // Auto-assign department when role changes for new user
  useEffect(() => {
    if (newUserForm.role === 'legal') setNewUserForm(f => ({ ...f, department: ['legal'], parentId: '' }));
    else if (newUserForm.role === 'finance') setNewUserForm(f => ({ ...f, department: ['finance'], parentId: '' }));
    else if (newUserForm.role === 'marketing') setNewUserForm(f => ({ ...f, department: ['marketing'], parentId: '' }));
    else if (newUserForm.role === 'employee' && newUserForm.department.length === 0) setNewUserForm(f => ({ ...f, department: ['employees'] }));
    else if (newUserForm.role !== 'employee') setNewUserForm(f => ({ ...f, parentId: '' }));

    if (newUserForm.role !== 'employee') {
      setManagerAllowedDepartments(null);
    }
  }, [newUserForm.role]);

  // Whenever managerAllowedDepartments changes, prune invalid departments
  useEffect(() => {
    if (managerAllowedDepartments !== null) {
      setNewUserForm(f => {
        const pruned = f.department.filter(d => managerAllowedDepartments.includes(d));
        return { ...f, department: pruned };
      });
    }
  }, [managerAllowedDepartments]);

  const handleParentIdChange = (parentId: string) => {
    setNewUserForm(f => ({ ...f, parentId }));
    
    if (!parentId) {
      setManagerAllowedDepartments(null);
      return;
    }

    const mgr = users.find(u => u.id === parentId);
    if (mgr && Array.isArray(mgr.departments)) {
      setManagerAllowedDepartments(mgr.departments);
    }

    api.get(`/subscriptions/status?userId=${parentId}`)
      .then(res => {
        const sub = res.data?.subscription;
        if (sub) {
          const packageDepts = Array.isArray(sub.managementPackage?.administrations)
            ? sub.managementPackage.administrations
            : [];
          const selectedDepts = Array.isArray(sub.selectedDepartments) && sub.selectedDepartments.length > 0
            ? sub.selectedDepartments
            : packageDepts;
          
          const administrationToDepartment: Record<string, string> = {
            'admin.dept.real_estate': 'properties',
            'properties': 'properties',
            'admin.dept.offers': 'offers',
            'offers': 'offers',
            'admin.dept.orders': 'orders',
            'orders': 'orders',
            'admin.dept.marketing': 'marketing',
            'marketing': 'marketing',
            'admin.dept.legal': 'legal',
            'legal': 'legal',
            'admin.dept.finance': 'finance',
            'finance': 'finance',
            'financial': 'finance',
            'admin.dept.hr': 'employees',
            'employees': 'employees',
          };

          const activeDepts = selectedDepts.map((k: string) => administrationToDepartment[k]).filter(Boolean);
          setManagerAllowedDepartments(activeDepts);
        } else {
          if (mgr && Array.isArray(mgr.departments)) {
            setManagerAllowedDepartments(mgr.departments);
          } else {
            setManagerAllowedDepartments([]);
          }
        }
      })
      .catch(() => {
        if (mgr && Array.isArray(mgr.departments)) {
          setManagerAllowedDepartments(mgr.departments);
        } else {
          setManagerAllowedDepartments([]);
        }
      });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uRes, pRes, pricingRes] = await Promise.all([
          usersApi.findAll(),
          packagesApi.findAll(),
          api.get('/subscriptions/department-pricing'),
        ]);
        setUsers(uRes.data || []);
        setPackages(pRes.data || []);
        setGlobalPricing({
          ...emptyGlobalPricing(),
          ...(pricingRes.data || {}),
          departmentPrices: {
            ...emptyGlobalPricing().departmentPrices,
            ...(pricingRes.data?.departmentPrices || {}),
          },
        });
      } catch (err) {
        toast.error("خطأ في تحميل البيانات");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const filteredUsers = users.filter(u => 
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone?.includes(userSearch)
  ).slice(0, 5);

  const selectedPackage = packages.find((p) => p.id === form.packageId);
  const isEmployeeSelected = form.selectedDepartments.includes("admin.dept.hr");
  const priceKey = form.subscriptionType === "سنوي" ? "yearly" : "monthly";
  const departmentLabel = (department: string) => t(department) || department;
  const employeeSeatPrice = form.subscriptionType === "سنوي"
    ? Number(globalPricing.employeeSeatYearlyPrice || 0)
    : Number(globalPricing.employeeSeatMonthlyPrice || 0);
  const departmentPrice = (department: string) => Number(globalPricing.departmentPrices?.[department]?.[priceKey] || 0);
  const selectedDepartmentPricing = form.selectedDepartments.map((department) => ({
    department,
    label: departmentLabel(department),
    price: departmentPrice(department),
  }));
  const employeeSeatTotal = isEmployeeSelected ? form.employeeSeats * employeeSeatPrice : 0;

  const calculatePackageAmount = (
    pkg: any,
    subscriptionType: string,
    departments: string[],
    seats: number,
    mode: "package" | "custom",
  ) => {
    const key = subscriptionType === "سنوي" ? "yearly" : "monthly";
    if (mode === "custom") {
      let basePrice = departments.reduce((total, department) => {
        return total + Number(globalPricing.departmentPrices?.[department]?.[key] || 0);
      }, 0);
      if (departments.includes("admin.dept.hr")) {
        basePrice += seats * Number(key === "yearly" ? globalPricing.employeeSeatYearlyPrice || 0 : globalPricing.employeeSeatMonthlyPrice || 0);
      }
      return basePrice;
    }

    if (!pkg) return 0;
    const basePrice = subscriptionType === "سنوي" ? Number(pkg.yearlyPrice || 0) : Number(pkg.monthlyPrice || 0);
    return basePrice * (1 - Number(pkg.discount || 0) / 100);
  };

  const updatePackageAmount = (next: Partial<typeof form>) => {
    setForm((current) => {
      const merged = { ...current, ...next };
      const pkg = packages.find((p) => p.id === merged.packageId);
      return {
        ...merged,
        amount: calculatePackageAmount(pkg, merged.subscriptionType, merged.selectedDepartments, merged.employeeSeats, planMode),
      };
    });
  };

  const switchPlanMode = (mode: "package" | "custom") => {
    setPlanMode(mode);
    setForm((current) => ({
      ...current,
      packageId: "",
      selectedDepartments: [],
      employeeSeats: 0,
      amount: 0,
      notes: mode === "custom" && !current.notes ? "اشتراك مخصص" : current.notes,
    }));
  };

  const managers = users.filter(u => u.role === 'manager' || u.role === 'admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let targetUserId = form.userId;

    if (!isEdit && createUserMode) {
      if (!newUserForm.firstName.trim()) return toast.error("الاسم الأول مطلوب");
      if (!newUserForm.email && !newUserForm.phone) return toast.error("يجب إدخال البريد الإلكتروني أو رقم الجوال");
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^05\d{8}$/;
      if (newUserForm.email && !emailRegex.test(newUserForm.email)) return toast.error("صيغة البريد الإلكتروني غير صحيحة");
      if (newUserForm.phone && !phoneRegex.test(newUserForm.phone)) return toast.error("رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام");
      if (newUserForm.role === 'employee' && newUserForm.department.length === 0) return toast.error("يجب اختيار إدارة واحدة على الأقل للموظف");

      setLoading(true);
      try {
        const userPayload: any = {
          firstName: newUserForm.firstName,
          lastName: newUserForm.lastName,
          role: newUserForm.role,
          departments: newUserForm.department,
          parentId: newUserForm.role === 'employee' ? newUserForm.parentId || undefined : undefined,
        };
        if (newUserForm.email) userPayload.email = newUserForm.email;
        if (newUserForm.phone) userPayload.phone = newUserForm.phone;

        const userRes = await api.post('/user', userPayload);
        targetUserId = userRes.data.id;
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "فشل في إنشاء المستخدم الجديد");
        setLoading(false);
        return;
      }
    } else {
      if (!targetUserId) return toast.error("يرجى اختيار المستخدم");
    }

    if (planMode === "package" && !form.packageId) {
      setLoading(false);
      return toast.error("يرجى اختيار الباقة");
    }
    if (planMode === "custom" && form.selectedDepartments.length === 0) {
      setLoading(false);
      return toast.error("يرجى اختيار إدارة واحدة على الأقل");
    }
    if (planMode === "custom" && isEmployeeSelected && form.employeeSeats < 1) {
      setLoading(false);
      return toast.error("يرجى تحديد عدد الموظفين");
    }

    setLoading(true);
    try {
      await adminSubscriptionsApi.create({
        ...form,
        userId: targetUserId,
        customPeriodMonths: form.subscriptionType === "مخصص" ? Math.max(1, Number(form.customPeriodMonths || 1)) : undefined,
        packageId: planMode === "package" ? form.packageId : undefined,
        selectedDepartments: planMode === "custom" ? form.selectedDepartments : undefined,
        employeeSeats: planMode === "custom" && isEmployeeSelected ? form.employeeSeats : 0,
      });
      toast.success("تم إنشاء الاشتراك بنجاح");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل في إنشاء الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscription?.id) return;
    setLoading(true);
    try {
      await adminSubscriptionsApi.update(subscription.id, {
        subscriptionType: form.subscriptionType,
        customPeriodMonths: form.subscriptionType === "مخصص" ? Math.max(1, Number(form.customPeriodMonths || 1)) : undefined,
        amount: form.amount,
        startDate: form.startDate,
        endDate: form.noExpiry ? undefined : form.endDate,
        status: form.status,
        noExpiry: form.noExpiry,
        notes: form.notes,
      });
      toast.success(language === 'ar' ? "تم تعديل مدة الاشتراك" : "Subscription duration updated");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (language === 'ar' ? "فشل تعديل الاشتراك" : "Failed to update subscription"));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full h-11 bg-muted border-transparent border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all";
  const labelCls = "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5";

  const visibleDepartments = managerAllowedDepartments !== null
    ? DEPARTMENTS.filter(d => managerAllowedDepartments.includes(d.value))
    : DEPARTMENTS;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full w-[95vw] sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-[1rem] p-4 sm:p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute left-8 top-8 p-2 text-slate-300 hover:text-slate-950 transition-colors"><X className="w-5 h-5" /></button>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-950">{isEdit ? "تعديل مدة الاشتراك" : "إنشاء اشتراك جديد"}</h2>
            <p className="text-xs text-slate-400 font-bold">{isEdit ? "تحديث تاريخ الانتهاء وحالة الاشتراك" : "تخصيص باقة لمستخدم بشكل يدوي"}</p>
          </div>
        </div>

        <form onSubmit={isEdit ? handleEditSubmit : handleSubmit} className="space-y-6">
          {!isEdit && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border pb-3">
                <div>
                  <h3 className="text-xs font-black text-slate-950">المستخدم المستهدف</h3>
                  <p className="text-[10px] text-slate-400 font-bold">اختر مستخدماً حالياً أو سجل مستخدماً جديداً</p>
                </div>
                <div className="flex gap-1 rounded-xl bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setCreateUserMode(false)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                      !createUserMode ? "bg-card text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950"
                    }`}
                  >
                    مستخدم حالي
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateUserMode(true)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                      createUserMode ? "bg-card text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950"
                    }`}
                  >
                    إنشاء مستخدم جديد
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!createUserMode ? (
                  <motion.div
                    key="existing-user"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {/* User Selection */}
                    <div className="space-y-1 relative col-span-2 sm:col-span-1">
                      <label className={labelCls}>المستخدم (بحث)</label>
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          value={userSearch} 
                          onChange={e => { setUserSearch(e.target.value); if(form.userId) setForm(f => ({...f, userId: ""})) }} 
                          className={inputCls} 
                          placeholder="ابحث بالاسم أو البريد الإلكتروني..." 
                        />
                      </div>
                      {userSearch && !form.userId && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border rounded-xl shadow-xl overflow-hidden">
                          {filteredUsers.length > 0 ? filteredUsers.map(u => (
                            <button key={u.id} type="button" onClick={() => { setForm(f => ({...f, userId: u.id})); setUserSearch(`${u.firstName} ${u.lastName}`); }} className="w-full px-4 py-3 text-right hover:bg-muted flex items-center justify-between border-b border last:border-0">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-950">{u.firstName} {u.lastName}</span>
                                <span className="text-[10px] text-slate-400 font-bold">{u.email}</span>
                              </div>
                              <CheckCircle className={`w-4 h-4 ${form.userId === u.id ? 'text-emerald-500' : 'text-slate-100'}`} />
                            </button>
                          )) : <div className="p-4 text-center text-[10px] font-bold text-slate-400">لا يوجد نتائج</div>}
                        </div>
                      )}
                    </div>

                    {/* Package Selection */}
                    {planMode === "package" ? (
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className={labelCls}>الباقة</label>
                        <select value={form.packageId} onChange={e => {
                          updatePackageAmount({ packageId: e.target.value, selectedDepartments: [], employeeSeats: 0 });
                        }} className={inputCls}>
                          <option value="">اختر باقة...</option>
                          {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <label className={labelCls}>نوع الاشتراك</label>
                        <div className="flex h-11 items-center rounded-xl bg-muted px-4 text-sm font-black text-slate-700">
                          اشتراك مخصص بالإدارات
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="new-user"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4 p-5 rounded-[1.25rem] bg-muted border border-/80"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className={labelCls}>الاسم الأول</label>
                        <input
                          type="text"
                          value={newUserForm.firstName}
                          onChange={e => setNewUserForm(f => ({ ...f, firstName: e.target.value }))}
                          className={inputCls}
                          placeholder="الاسم الأول"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>الاسم الأخير</label>
                        <input
                          type="text"
                          value={newUserForm.lastName}
                          onChange={e => setNewUserForm(f => ({ ...f, lastName: e.target.value }))}
                          className={inputCls}
                          placeholder="الاسم الأخير"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className={labelCls}>البريد الإلكتروني</label>
                        <input
                          type="email"
                          value={newUserForm.email}
                          onChange={e => setNewUserForm(f => ({ ...f, email: e.target.value }))}
                          className={inputCls}
                          placeholder="example@mail.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>رقم الجوال</label>
                        <input
                          type="text"
                          value={newUserForm.phone}
                          onChange={e => setNewUserForm(f => ({ ...f, phone: e.target.value }))}
                          className={inputCls}
                          placeholder="05xxxxxxxx"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className={labelCls}>الصلاحية / الدور</label>
                        <select
                          value={newUserForm.role}
                          onChange={e => setNewUserForm(f => ({ ...f, role: e.target.value }))}
                          className={inputCls}
                        >
                          {ROLES.map(r => (
                            <option key={r.value} value={r.value}>
                              {language === 'ar' ? r.labelAr : r.labelEn}
                            </option>
                          ))}
                        </select>
                      </div>

                      {newUserForm.role === 'employee' && (
                        <div className="space-y-1">
                          <label className={labelCls}>المدير المسؤول (اختياري)</label>
                          <select
                            value={newUserForm.parentId}
                            onChange={e => handleParentIdChange(e.target.value)}
                            className={inputCls}
                          >
                            <option value="">بدون مدير مسؤول (إداري مستقل)...</option>
                            {managers.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.firstName} {m.lastName}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {newUserForm.role === 'employee' && (
                      <div className="space-y-2">
                        <label className={labelCls}>الإدارة</label>
                        {managerAllowedDepartments !== null && managerAllowedDepartments.length === 0 ? (
                          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100/70 flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-right">
                              <p className="text-[10px] font-black text-amber-800 leading-snug">
                                {language === 'ar' 
                                  ? "المدير المختار لا يملك اشتراكاً فعالاً في أي إدارة." 
                                  : "The selected manager does not have an active subscription."}
                              </p>
                              <p className="text-[9px] font-bold text-amber-600 mt-0.5">
                                {language === 'ar'
                                  ? "يرجى تفعيل اشتراك المدير المسؤول أولاً لتتمكن من تعيين موظفين لديه."
                                  : "Please activate this manager's subscription first to assign employees."}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {visibleDepartments.map(dept => {
                              const isSelected = newUserForm.department.includes(dept.value);
                              return (
                                <button
                                  key={dept.value}
                                  type="button"
                                  onClick={() => {
                                    setNewUserForm(f => {
                                      const newDepts = f.department.includes(dept.value)
                                        ? f.department.filter(d => d !== dept.value)
                                        : [...f.department, dept.value];
                                      return { ...f, department: newDepts };
                                    });
                                  }}
                                  className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-right text-[10px] font-black transition-all ${
                                    isSelected
                                      ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                                      : 'bg-card text-slate-500 border hover:border-slate-400'
                                  }`}
                                >
                                  <span>{language === 'ar' ? dept.labelAr : dept.labelEn}</span>
                                  {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {!isEdit && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border pb-3">
                <div>
                  <h3 className="text-xs font-black text-slate-950">تفاصيل خطة الاشتراك</h3>
                  <p className="text-[10px] text-slate-400 font-bold">حدد نوع وهيكل خطة الاشتراك</p>
                </div>
                <div className="flex gap-1 rounded-xl bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => switchPlanMode("package")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                      planMode === "package" ? "bg-card text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950"
                    }`}
                  >
                    باقة جاهزة
                  </button>
                  <button
                    type="button"
                    onClick={() => switchPlanMode("custom")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                      planMode === "custom" ? "bg-card text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950"
                    }`}
                  >
                    اشتراك مخصص
                  </button>
                </div>
              </div>

              {createUserMode && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={planMode}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                  >
                    {planMode === "package" ? (
                      <div className="space-y-1">
                        <label className={labelCls}>الباقة</label>
                        <select value={form.packageId} onChange={e => {
                          updatePackageAmount({ packageId: e.target.value, selectedDepartments: [], employeeSeats: 0 });
                        }} className={inputCls}>
                          <option value="">اختر باقة...</option>
                          {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className={labelCls}>نوع الاشتراك</label>
                        <div className="flex h-11 items-center rounded-xl bg-muted px-4 text-sm font-black text-slate-700">
                          اشتراك مخصص بالإدارات
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelCls}>نوع الاشتراك</label>
              <select value={form.subscriptionType} onChange={e => updatePackageAmount({ subscriptionType: e.target.value })} className={inputCls}>
                <option value="سنوي">سنوي</option>
                <option value="شهري">شهري</option>
                <option value="مخصص">مخصص</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>تاريخ البدء</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} className={inputCls} />
            </div>
          </div>

          {form.subscriptionType === "مخصص" && (
            <div className="space-y-1">
              <label className={labelCls}>مدة الاشتراك المخصص بالأشهر</label>
              <input
                type="number"
                min={1}
                value={form.customPeriodMonths}
                onChange={e => setForm(f => ({...f, customPeriodMonths: Math.max(1, Number(e.target.value || 1))}))}
                className={inputCls}
              />
            </div>
          )}

          {!form.noExpiry && (
            <div className="space-y-1">
              <label className={labelCls}>تاريخ الانتهاء</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} className={inputCls} />
            </div>
          )}

          {planMode === "package" && selectedPackage && (
            <div className="rounded-2xl border border bg-muted p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black text-slate-950">{selectedPackage.name}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(selectedPackage.administrations || []).map((department: string) => (
                      <span key={department} className="rounded-full bg-card px-2 py-1 text-[10px] font-black text-slate-500">
                        {departmentLabel(department)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xs font-black text-slate-400">{form.subscriptionType}</div>
                  <div className="text-lg font-black text-slate-950"><SaudiRiyalAmount amount={Number(form.amount || 0)} locale="ar-SA" /></div>
                </div>
              </div>
            </div>
          )}

          {planMode === "custom" && (
            <div className="space-y-3">
              <label className={labelCls}>الإدارات وأسعارها</label>
              <div className="grid grid-cols-1 gap-2">
                {ADMINISTRATIONS.map((department: string) => {
                  const checked = form.selectedDepartments.includes(department);
                  return (
                    <button
                      key={department}
                      type="button"
                      onClick={() => {
                        const nextDepartments = checked
                          ? form.selectedDepartments.filter((item) => item !== department)
                          : [...form.selectedDepartments, department];
                        updatePackageAmount({
                          selectedDepartments: nextDepartments,
                          employeeSeats: department === "admin.dept.hr" && checked ? 0 : form.employeeSeats,
                        });
                      }}
                      className={`rounded-2xl border px-4 py-3 text-right transition-colors ${
                        checked ? "border-slate-950 bg-muted" : "border hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black text-slate-800">{departmentLabel(department)}</span>
                        <span className="text-[11px] font-black text-slate-400"><SaudiRiyalAmount amount={departmentPrice(department)} locale="ar-SA" iconClassName="h-3 w-3 text-slate-400" /> / {form.subscriptionType}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {planMode === "custom" && isEmployeeSelected && (
            <div className="space-y-1">
              <label className={labelCls}>عدد الموظفين</label>
              <input
                type="number"
                min={1}
                value={form.employeeSeats || ""}
                onChange={e => updatePackageAmount({ employeeSeats: Math.max(0, Number(e.target.value || 0)) })}
                className={inputCls}
                placeholder="0"
              />
              <p className="text-[10px] font-bold text-slate-400">سعر الموظف: <SaudiRiyalAmount amount={employeeSeatPrice} locale="ar-SA" iconClassName="h-3 w-3 text-slate-400" /></p>
            </div>
          )}

          {planMode === "custom" && (
            <div className="space-y-2 rounded-2xl border border bg-muted p-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>تفصيل الأسعار</span>
                <span>{form.subscriptionType}</span>
              </div>
              {selectedDepartmentPricing.length === 0 ? (
                <div className="rounded-xl bg-card px-3 py-2 text-xs font-bold text-slate-400">
                  اختر إدارة لعرض السعر
                </div>
              ) : (
                <div className="space-y-1">
                  {selectedDepartmentPricing.map((item) => (
                    <div key={item.department} className="flex items-center justify-between rounded-xl bg-card px-3 py-2">
                      <span className="text-xs font-black text-slate-700">{item.label}</span>
                      <span className="text-xs font-black text-slate-950"><SaudiRiyalAmount amount={item.price} locale="ar-SA" iconClassName="h-3 w-3" /></span>
                    </div>
                  ))}
                  {isEmployeeSelected && (
                    <div className="rounded-xl bg-slate-950 px-3 py-2 text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">الموظفون</span>
                        <span className="text-xs font-black"><SaudiRiyalAmount amount={employeeSeatTotal} locale="ar-SA" iconClassName="h-3 w-3 text-white" /></span>
                      </div>
                      <div className="mt-1 text-[10px] font-bold text-white/60">
                        {form.employeeSeats || 0} × <SaudiRiyalAmount amount={employeeSeatPrice} locale="ar-SA" iconClassName="h-3 w-3 text-white/60" /> لكل موظف
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelCls}>طريقة الدفع</label>
              <select value={form.paymentMethod} onChange={e => setForm(f => ({...f, paymentMethod: e.target.value}))} className={inputCls}>
                <option value="بطاقة ائتمان">بطاقة ائتمان</option>
                <option value="تحويل بنكي">تحويل بنكي</option>
                <option value="نقدي">نقدي</option>
                <option value="مدى">مدى</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>المبلغ</label>
              <div className="relative">
                <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: parseFloat(e.target.value)}))} className={inputCls} />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><SaudiRiyalSymbol iconClassName="h-3 w-3" /></span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">اشتراك غير محدود (لا ينتهي)</span>
            </div>
            <button type="button" onClick={() => setForm(f => ({...f, noExpiry: !f.noExpiry}))} className={`w-10 h-5 rounded-full p-1 transition-all ${form.noExpiry ? 'bg-slate-950' : 'bg-muted'}`}>
              <div className={`w-3 h-3 bg-card rounded-full transition-all ${form.noExpiry ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <button type="submit" disabled={loading} className="w-full h-12 bg-slate-950 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 mt-4">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "حفظ تعديل المدة" : "حفظ وإنشاء الاشتراك"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminSubscriptionsPage() {
  const { t, language } = useLanguage();
  const confirmDialog = useConfirmDialog();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subscriptionTypeFilter, setSubscriptionTypeFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<any | null>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await adminSubscriptionsApi.findAll();
      if (res.data) {
        setSubscriptions(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions", error);
      toast.error(t('admin.error.fetch_failed') || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleActivate = async (id: string) => {
    try {
      await adminSubscriptionsApi.activate(id);
      toast.success(language === 'ar' ? "تم تفعيل الاشتراك بنجاح" : "Subscription activated successfully");
      fetchSubscriptions();
    } catch (error) {
      toast.error(language === 'ar' ? "فشل تفعيل الاشتراك" : "Activation failed");
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt(language === 'ar' ? "سبب الإلغاء:" : "Reason for cancellation:");
    if (reason === null) return;

    try {
      await adminSubscriptionsApi.cancel(id, reason);
      toast.success(language === 'ar' ? "تم إلغاء الاشتراك" : "Subscription cancelled");
      fetchSubscriptions();
    } catch (error) {
      toast.error(language === 'ar' ? "فشل إلغاء الاشتراك" : "Cancellation failed");
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: language === 'ar' ? "هل أنت متأكد من حذف هذا الاشتراك نهائياً؟" : "Are you sure you want to permanently delete this subscription?",
      description: language === 'ar' ? "سيتم حذف الاشتراك نهائيًا ولا يمكن استعادته." : "This subscription will be permanently deleted.",
      confirmLabel: language === 'ar' ? "حذف نهائي" : "Delete",
      cancelLabel: language === 'ar' ? "إلغاء" : "Cancel",
      destructive: true,
    });
    if (!ok) return;
    try {
      await adminSubscriptionsApi.delete(id);
      toast.success("تم حذف الاشتراك");
      fetchSubscriptions();
    } catch (err) {
      toast.error("فشل الحذف");
    }
  };

  const openEditDuration = (subscription: any) => {
    if (normalizeStatus(subscription.status) === 'cancelled') {
      toast.error(language === 'ar' ? "لا يمكن تعديل اشتراك ملغي" : "Cancelled subscriptions cannot be edited");
      return;
    }
    setEditingSubscription(subscription);
    setIsModalOpen(true);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const normStatus = normalizeStatus(sub.status);
    const query = search.trim().toLowerCase();
    const startDate = sub.startDate ? new Date(sub.startDate) : null;
    const matchesSearch = !query ||
      `${sub.user?.firstName} ${sub.user?.lastName}`.toLowerCase().includes(query) ||
      sub.user?.email?.toLowerCase().includes(query) ||
      sub.managementPackage?.name?.toLowerCase().includes(query) ||
      sub.id?.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || normStatus === statusFilter;
    const matchesType = subscriptionTypeFilter === "all" || sub.subscriptionType === subscriptionTypeFilter;
    const matchesPackage = packageFilter === "all" || sub.packageId === packageFilter || sub.managementPackage?.id === packageFilter;
    const matchesFrom = !dateFrom || (startDate && startDate >= new Date(dateFrom));
    const matchesTo = !dateTo || (startDate && startDate <= new Date(`${dateTo}T23:59:59`));
    return matchesSearch && matchesStatus && matchesType && matchesPackage && matchesFrom && matchesTo;
  });
  const packageOptions = Array.from(
    new Map<string, string>(
      subscriptions
        .map((sub): [string, string] | null => {
          const id = sub.packageId || sub.managementPackage?.id;
          if (!id) return null;
          return [String(id), sub.managementPackage?.name || String(id)];
        })
        .filter((entry): entry is [string, string] => Boolean(entry))
    ).entries()
  );

  const getStatusBadge = (status: string) => {
    const normStatus = normalizeStatus(status);
    switch (normStatus) {
      case 'active': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">نشط</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">معلق</Badge>;
      case 'expired': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">منتهي</Badge>;
      case 'cancelled': return <Badge className="bg-muted text-slate-700 hover:bg-muted border">ملغي</Badge>;
      default: return <Badge className="bg-muted text-slate-700">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-4 sm:p-8">
      <AnimatePresence>
        {isModalOpen && (
          <CreateSubscriptionModal
            subscription={editingSubscription}
            onClose={() => { setIsModalOpen(false); setEditingSubscription(null); }}
            onSuccess={fetchSubscriptions}
          />
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
            <CreditCard className="w-3 h-3" />
            إدارة الاشتراكات
          </div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-950">
            {t('admin.subscriptions.title') || "إدارة اشتراكات المستخدمين"}
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            متابعة الاشتراكات النشطة، تفعيل الحزم، وإدارة دورات الفوترة للمستخدمين
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <Link
            href="/admin/packages"
            className="h-12 px-6 bg-card text-slate-950 border border rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:border-slate-950 transition-all shadow-sm flex-1 md:flex-initial"
          >
            <Package className="w-4 h-4" />
            إدارة الباقات
          </Link>
          <button 
            onClick={() => { setEditingSubscription(null); setIsModalOpen(true); }}
            className="h-12 px-6 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-stone-400/20 flex-1 md:flex-initial"
          >
            <Plus className="w-4 h-4" />
            إضافة اشتراك
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'إجمالي المشتركين', val: subscriptions.length, icon: UserIcon, bg: 'bg-muted', color: 'text-slate-950' },
           { label: 'اشتراكات نشطة', val: subscriptions.filter(s => normalizeStatus(s.status) === 'active').length, icon: Zap, bg: 'bg-emerald-50', color: 'text-emerald-600' },
           { label: 'بانتظار التفعيل', val: subscriptions.filter(s => normalizeStatus(s.status) === 'pending').length, icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600' },
           { label: 'تم إلغاؤها', val: subscriptions.filter(s => normalizeStatus(s.status) === 'cancelled').length, icon: Ban, bg: 'bg-red-50', color: 'text-red-600' },
         ].map((card, i) => (
           <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i} 
            className="p-3 sm:p-6 bg-card border border rounded-3xl shadow-sm"
           >
              <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-4`}>
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
              <p className={`text-2xl font-black ${card.color}`}>{card.val}</p>
           </motion.div>
         ))}
      </div>

      {/* Table Control/Filter Bar */}
      <div className="bg-card p-5 rounded-[1.25rem] border border shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* Search */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="بحث باسم المشترك أو الباقة..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pr-10 pl-4 rounded-xl border border bg-muted/50 focus:bg-card focus:outline-none focus:border-slate-950 text-sm font-bold transition-all shadow-sm"
            />
          </div>

          {/* Status */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border bg-muted/50 focus:bg-card focus:outline-none focus:border-slate-950 text-sm font-bold transition-all shadow-sm"
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="pending">معلق</option>
            <option value="expired">منتهي</option>
            <option value="cancelled">ملغي</option>
          </select>

          {/* Type */}
          <select 
            value={subscriptionTypeFilter} 
            onChange={(e) => setSubscriptionTypeFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border bg-muted/50 focus:bg-card focus:outline-none focus:border-slate-950 text-sm font-bold transition-all shadow-sm"
          >
            <option value="all">كل الأنواع</option>
            <option value="شهري">شهري</option>
            <option value="سنوي">سنوي</option>
            <option value="مخصص">مخصص</option>
          </select>

          {/* Package */}
          <select 
            value={packageFilter} 
            onChange={(e) => setPackageFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border bg-muted/50 focus:bg-card focus:outline-none focus:border-slate-950 text-sm font-bold transition-all shadow-sm animate-none"
          >
            <option value="all">كل الباقات</option>
            {packageOptions.map(([id, name]) => <option key={id as string} value={id as string}>{name || id}</option>)}
          </select>

          {/* Date From */}
          <div className="relative">
            <input 
              type="date" 
              value={dateFrom} 
              onChange={(e) => setDateFrom(e.target.value)} 
              className="w-full h-11 px-4 rounded-xl border border bg-muted/50 focus:bg-card focus:outline-none focus:border-slate-950 text-xs font-bold transition-all shadow-sm" 
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <input 
              type="date" 
              value={dateTo} 
              onChange={(e) => setDateTo(e.target.value)} 
              className="w-full h-11 px-4 rounded-xl border border bg-muted/50 focus:bg-card focus:outline-none focus:border-slate-950 text-xs font-bold transition-all shadow-sm" 
            />
          </div>

          {/* Clear button */}
          <button 
            type="button" 
            onClick={() => { setSearch(""); setStatusFilter("all"); setSubscriptionTypeFilter("all"); setPackageFilter("all"); setDateFrom(""); setDateTo(""); }} 
            className="h-11 px-6 rounded-xl border border bg-card text-slate-500 hover:text-slate-950 hover:border-slate-950 text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1 col-span-full sm:col-span-1"
          >
            مسح الفلاتر
          </button>
        </div>
      </div>

      <div className="bg-card border border rounded-[1rem] overflow-hidden shadow-xl">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">المشترك</TableHead>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">الباقة</TableHead>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">تاريخ البدء</TableHead>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">تاريخ الانتهاء</TableHead>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">الحالة</TableHead>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-2" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">جاري التحميل...</span>
                  </TableCell>
                </TableRow>
              ) : filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-slate-400 font-bold">لا يوجد اشتراكات مطابقة</TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-muted/50 group transition-colors">
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-[11px] font-black text-slate-500 border border-/50">
                          {sub.user?.firstName?.[0] || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-950 text-sm">{sub.user?.firstName} {sub.user?.lastName}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{sub.user?.email || 'بدون إيميل'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-black text-slate-900 text-xs">
                            {language === 'ar' ? sub.managementPackage?.name : sub.managementPackage?.name}
                          </span>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">ID: {sub.packageId?.substring(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-600 font-bold text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                        {new Date(sub.startDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-600 font-bold text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                        {sub.noExpiry ? 'غير محدود' : (sub.endDate ? new Date(sub.endDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : 'غير محدد')}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      {getStatusBadge(sub.status)}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-muted rounded-xl transition-colors text-slate-400 hover:text-slate-950">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border">
                          {normalizeStatus(sub.status) === 'pending' && (
                            <DropdownMenuItem 
                              onClick={() => handleActivate(sub.id)}
                              className="rounded-xl px-3 py-2.5 text-xs font-bold gap-3 cursor-pointer text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                              <ShieldCheck className="w-4 h-4" /> تفعيل الاشتراك
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem
                            onClick={() => openEditDuration(sub)}
                            className="rounded-xl px-3 py-2.5 text-xs font-bold gap-3 cursor-pointer"
                          >
                            <RefreshCw className="w-4 h-4" /> تعديل المدة
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="my-1 bg-muted" />
                          
                          <DropdownMenuItem 
                            onClick={() => handleCancel(sub.id)}
                            className="rounded-xl px-3 py-2.5 text-xs font-bold gap-3 cursor-pointer text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                          >
                            <Ban className="w-4 h-4" /> إلغاء الاشتراك
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            onClick={() => handleDelete(sub.id)}
                            className="rounded-xl px-3 py-2.5 text-xs font-bold gap-3 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" /> حذف نهائي
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
