"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { User, Role } from "@/types/user";
import { 
  Loader2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Shield, 
  User as UserIcon,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Plus,
  X,
  Building2,
  Users,
  Edit,
  Eye,
  Save,
  AlertCircle,
  Clock,
  Calendar
} from "lucide-react";
import { Pagination } from "../../src/components/Pagination";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

// ─── Department meta ───────────────────────────────────────────────────────────
const DEPARTMENTS = [
  { value: 'marketing',  labelAr: 'إدارة التسويق',   labelEn: 'Marketing' },
  { value: 'properties', labelAr: 'إدارة الاملاك',   labelEn: 'Properties' },
  { value: 'finance',    labelAr: 'الإدارة المالية',  labelEn: 'Finance' },
  { value: 'legal',      labelAr: 'الإدارة القانونية', labelEn: 'Legal' },
  { value: 'employees',  labelAr: 'إدارة الموظفين',  labelEn: 'Employees' },
];

const DEPT_COLORS: Record<string, string> = {
  marketing:  'bg-slate-50 text-slate-600 border-slate-100',
  properties: 'bg-slate-50 text-slate-600 border-slate-100',
  finance:    'bg-slate-50 text-slate-600 border-slate-100',
  legal:      'bg-slate-50 text-slate-600 border-slate-100',
  employees:  'bg-slate-50 text-slate-600 border-slate-100',
};

const getDeptLabel = (dept: string) => DEPARTMENTS.find(d => d.value === dept)?.labelAr ?? dept;


function UserModal({ onClose, onCreated, user, managers = [] }: { onClose: () => void; onCreated: (u: User) => void; user?: User | null; managers?: User[] }) {
  const { language, t } = useLanguage();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'employee',
    department: (user?.departments as string[]) || [],
    parentId: user?.parentId || '',
    noExpiry: false,
    endDate: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingSubId, setExistingSubId] = useState<string | null>(null);

  // Pre-load subscription info when editing an admin
  useEffect(() => {
    if (user?.id && (user?.role === Role.ADMIN || user?.role === Role.MANGER)) {
      api.get(`/subscriptions/status?userId=${user.id}`).then(res => {
        const sub = res.data?.subscription;
        if (sub) {
          setExistingSubId(sub.id);
          setForm(f => ({
            ...f,
            noExpiry: sub.noExpiry || false,
            endDate: sub.endDate ? sub.endDate.split('T')[0] : '',
          }));
        }
      }).catch(() => {});
    }
  }, [user?.id, user?.role]);

  // Specialist roles auto-department
  useEffect(() => {
    if (form.role === 'legal') setForm(f => ({ ...f, department: ['legal'] }));
    else if (form.role === 'finance') setForm(f => ({ ...f, department: ['finance'] }));
    else if (form.role === 'marketing') setForm(f => ({ ...f, department: ['marketing'] }));
    else if (form.role === 'employee' && form.department.length === 0) setForm(f => ({ ...f, department: ['employees'] }));
  }, [form.role]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^05\d{8}$/;

  const fieldErrors: Record<string, string> = {};
  if (!form.firstName.trim()) fieldErrors.firstName = 'الاسم الأول مطلوب';
  if (!form.email && !form.phone) fieldErrors.email = 'يجب إدخال البريد أو الجوال';
  if (form.email && !emailRegex.test(form.email)) fieldErrors.email = 'صيغة البريد الإلكتروني غير صحيحة';
  if (form.phone && !phoneRegex.test(form.phone)) fieldErrors.phone = 'الجوال يجب أن يبدأ بـ 05 ويكون 10 أرقام';
  if (form.role === 'employee' && !form.parentId) fieldErrors.parentId = 'يجب اختيار المدير';
  if (form.role === 'employee' && form.department.length === 0) fieldErrors.department = 'يجب اختيار الإدارة';

  const isValid = Object.keys(fieldErrors).length === 0;
  const touch = (field: string) => setTouched(p => ({ ...p, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ firstName: true, email: true, phone: true, parentId: true });
    if (!isValid) return;

    setError(null);
    setLoading(true);
    try {
      const payload: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        departments: form.department,
        parentId: form.role === 'employee' ? form.parentId : undefined,
      };
      if (!user?.id && form.email) payload.email = form.email;
      if (form.phone) payload.phone = form.phone;

      let res;
      if (user?.id) {
        res = await api.put(`/user/${user.id}`, payload);
      } else {
        res = await api.post('/user', payload);
      }

      // Create or update subscription for admin/manager role
      if (form.role === Role.ADMIN || form.role === Role.MANGER) {
        const today = new Date();
        const endDate = form.noExpiry
          ? new Date(today.getFullYear() + 100, today.getMonth(), today.getDate()).toISOString().split('T')[0]
          : form.endDate;

        const subPayload: any = {
          userId: res.data.id || user?.id,
          subscriptionType: 'سنوي',
          amount: 0,
          startDate: today.toISOString().split('T')[0],
          paymentMethod: 'نقدي',
          status: 'نشط',
          noExpiry: form.noExpiry,
        };

        if (endDate) {
          subPayload.endDate = endDate;
        }

        try {
          if (existingSubId) {
            await api.put(`/subscriptions/${existingSubId}`, subPayload);
          } else {
            await api.post('/subscriptions', subPayload);
          }
        } catch (subErr) {
          console.error('Failed to save subscription', subErr);
        }
      }

      onCreated(res.data);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const deptLabel = (d: typeof DEPARTMENTS[0]) => language === 'ar' ? d.labelAr : d.labelEn;
  const fieldCls = (f: string) => `w-full h-11 bg-slate-50 rounded-xl px-4 text-sm font-bold border ${touched[f] && fieldErrors[f] ? 'border-red-500' : 'border-transparent focus:border-slate-950'} outline-none transition-all`;
  const iconFieldCls = (f: string) => `w-full h-11 bg-slate-50 rounded-xl pr-10 pl-4 text-sm font-bold border ${touched[f] && fieldErrors[f] ? 'border-red-500' : 'border-transparent focus:border-slate-950'} outline-none transition-all`;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <button onClick={onClose} className="absolute left-6 top-6 p-2 text-slate-300 hover:text-slate-950 transition-colors"><X className="w-5 h-5" /></button>
        
        <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 flex items-center justify-center">
              {user?.id ? <Edit className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950 tracking-tight">{user?.id ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم داخلي'}</h2>
              <p className="text-xs text-slate-400 font-bold">إدارة الصلاحيات والوصول</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الاسم الأول</label>
              <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} onBlur={() => touch('firstName')} className={fieldCls('firstName')} placeholder="محمد" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اسم العائلة</label>
              <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className={fieldCls('lastName')} placeholder="العلي" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right block w-full">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="email" 
                value={form.email} 
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                className={`${iconFieldCls('email')} ${user?.id ? 'opacity-50 cursor-not-allowed' : ''}`} 
                placeholder="example@domain.com" 
                disabled={!!user?.id}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right block w-full">رقم الهاتف</label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={iconFieldCls('phone')} placeholder="05xxxxxxxx" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الصلاحية</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full h-11 bg-slate-50 rounded-xl px-4 text-sm font-bold border border-transparent focus:border-slate-950 outline-none transition-all appearance-none">
                <option value={Role.VIEWER}>{language === 'ar' ? 'مشاهد (Viewer)' : 'Viewer'}</option>
                <option value={Role.MANGER}>{language === 'ar' ? 'مدير (Manager)' : 'Manager'}</option>
                <option value={Role.EMPLOYEE}>{language === 'ar' ? 'موظف (Employee)' : 'Employee'}</option>
                <option value={Role.LEGAL}>{language === 'ar' ? 'محامي (Lawyer)' : 'Lawyer'}</option>
                <option value={Role.FINANCE}>{language === 'ar' ? 'مالي (Finance)' : 'Finance'}</option>
                <option value={Role.MARKETING}>{language === 'ar' ? 'تسويق (Marketing)' : 'Marketing'}</option>
                <option value={Role.ADMIN}>{language === 'ar' ? 'Super Admin' : 'Super Admin'}</option>
                <option value={Role.USER}>{language === 'ar' ? 'مستفيد (Beneficiary)' : 'Beneficiary'}</option>
              </select>
            </div>

            {form.role === 'employee' && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اختيار المدير</label>
                <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))} className={fieldCls('parentId')}>
                  <option value="">اختر مديراً...</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                </select>
              </div>
            )}
          </div>

          {(form.role === Role.ADMIN || form.role === Role.MANGER || form.role === 'employee') && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الإدارة</label>
              <div className="grid grid-cols-3 gap-2">
                {DEPARTMENTS.map(dept => {
                  const isSelected = form.department.includes(dept.value);
                  return (
                    <button key={dept.value} type="button" onClick={() => {
                      setForm(f => {
                        const newDepts = f.department.includes(dept.value) ? f.department.filter(d => d !== dept.value) : [...f.department, dept.value];
                        return { ...f, department: newDepts };
                      });
                    }} className={`px-2 py-2 rounded-xl border text-[9px] font-bold transition-all ${isSelected ? 'bg-slate-950 text-white border-slate-950' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'}`}>
                      {deptLabel(dept)}
                    </button>
                  );
                })}
              </div>
              {touched.department && fieldErrors.department && (
                <p className="text-[10px] font-bold text-red-500">{fieldErrors.department}</p>
              )}
            </div>
          )}

          {(form.role === Role.ADMIN || form.role === Role.MANGER) && (
            <div className="p-5 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">صلاحية الاشتراك</p>
                  <p className="text-xs font-bold text-slate-950">
                    {existingSubId ? 'تعديل مدة الاشتراك الحالي' : 'إعدادات مدة الوصول للمنصة'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-700">اشتراك غير محدود (لا ينتهي)</span>
                <button 
                  type="button"
                  onClick={() => setForm(f => ({ ...f, noExpiry: !f.noExpiry }))}
                  className={`w-12 h-6 rounded-full p-1 transition-all ${form.noExpiry ? 'bg-slate-950' : 'bg-slate-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all ${form.noExpiry ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {!form.noExpiry && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تاريخ انتهاء الاشتراك</label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="date" 
                      value={form.endDate} 
                      onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                      className={iconFieldCls('endDate')}
                    />
                  </div>
                </div>
              )}

              {existingSubId && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-xl border border-blue-100">
                  <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  <p className="text-[10px] font-bold text-blue-700">سيتم تحديث الاشتراك الحالي بالتعديلات الجديدة</p>
                </div>
              )}
            </div>
          )}

          {['legal', 'finance', 'marketing'].includes(form.role) && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <Building2 className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الإدارة التلقائية</p>
                <p className="text-xs font-bold text-slate-950">{getDeptLabel(form.role)}</p>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full h-12 bg-slate-950 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'جارٍ الحفظ...' : (user?.id ? 'تحديث البيانات' : 'إنشاء المستخدم')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}


// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
    const { t, language } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/user');
            setUsers(res.data);
        } catch (err) {
            toast.error('خطأ في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleCreated = (newUser: User) => {
        if (editingUser) setUsers(prev => prev.map(u => u.id === newUser.id ? newUser : u));
        else setUsers(prev => [newUser, ...prev]);
        toast.success('تمت العملية بنجاح');
        setEditingUser(null);
    };

    const handleEditUser = (user: User) => { setEditingUser(user); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingUser(null); };

    const managers = users.filter(u => u.role === Role.MANGER || u.role === Role.ADMIN);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const handleVerifyUser = async (userId: string, status: boolean) => {
        if (!confirm(status ? t('admin.users.action.confirmVerify') : t('admin.users.action.confirmUnverify'))) return;
        try {
            const verifyStatus = status ? 'verified' : 'rejected'; 
            await api.put(`/user/${userId}/verify`, { status: verifyStatus });
            setUsers(users.map(u => u.id === userId ? { ...u, isVerified: status } : u));
        } catch (error) { console.error(error); }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm(t('admin.users.action.confirmDelete'))) return;
        try {
           await api.delete(`/user/${userId}`);
           setUsers(users.filter(u => u.id !== userId));
        } catch (error: any) { console.error(error); }
    };

    const filteredUsers = users.filter(u => {
        // Hide admin users from the list to protect them
        if (u.role === Role.ADMIN) return false;
        
        const searchLower = searchTerm.toLowerCase();
        return (
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchLower) ||
            (u.email?.toLowerCase().includes(searchLower) ?? false) ||
            (u.phone?.includes(searchTerm) ?? false)
        );
    });

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);


    if (loading) return (
        <div className="space-y-8 animate-pulse">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-slate-200 rounded-lg" /><div className="h-4 w-32 bg-slate-100 rounded-lg" />
                </div>
                <div className="h-10 w-24 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-[600px] bg-slate-200 rounded-[2rem]" />
        </div>
    );

    return (
        <div className="min-h-screen">
        <AnimatePresence>
          {isModalOpen && (
            <UserModal
              user={editingUser}
              onClose={handleCloseModal}
              onCreated={handleCreated}
              managers={managers}
            />
          )}
        </AnimatePresence>

        <div className="space-y-8">
            {/* Header Section */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest border border-slate-200">
                        <Users className="w-4 h-4" />
                        {t('admin.users.directory')}
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-950">{t('admin.users.title')}</h1>
                    <p className="text-slate-400 text-xs font-bold">{t('admin.users.desc')}</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white border border-slate-100 px-4 py-2.5 rounded-2xl shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t('admin.users.total')}</p>
                        <p className="text-xl font-black text-slate-950 tabular-nums">{users.length}</p>
                    </div>
                    {/* Create user button */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="h-12 px-5 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-slate-950/20 hover:shadow-slate-950/30"
                    >
                        <Plus className="w-4 h-4" />
                        إضافة مستخدم
                    </button>
                </div>
            </section>

            {/* Table Control Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className={`relative w-full md:w-96 group`}>
                    <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-950 transition-colors`} />
                    <input 
                        type="text"
                        placeholder={t('admin.users.searchPlaceholder')}
                        className="w-full h-11 bg-slate-50 rounded-2xl px-12 text-sm font-bold border border-transparent focus:border-slate-950 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none h-11 px-6 rounded-2xl bg-white border border-slate-100 hover:border-slate-950 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <Filter className="w-4 h-4" />
                        {t('admin.users.filter')}
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto hide-scrollbar">
                    <table className="w-full text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('admin.users.table.user')}</th>
                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('admin.users.table.contact')}</th>
                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('admin.users.table.role')}</th>
                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">الإدارة</th>
                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">{t('admin.users.table.status')}</th>
                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">{t('admin.users.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <UserIcon className="w-12 h-12" />
                                            <p className="font-black text-sm uppercase tracking-widest">{t('admin.users.empty')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedUsers.map((user, i) => (
                                <motion.tr 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={user.id} 
                                    className="hover:bg-slate-50/50 transition-colors group"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-slate-100 flex items-center justify-center text-white font-black text-xs shrink-0 group-hover:scale-110 transition-transform">
                                                {user.firstName?.[0]}
                                            </div>
                                            <div>
                                                <Link href={`/admin/users/${user.id}`} className="text-sm font-black text-slate-950 hover:underline">
                                                    {user.firstName} {user.lastName}
                                                </Link>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {user.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                <Mail className="w-3.5 h-3.5 text-slate-300" />
                                                {user.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400">
                                                <Phone className="w-3.5 h-3.5 text-slate-300" />
                                                {user.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-wrap gap-1">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                                user.role === Role.ADMIN ? 'bg-slate-900 text-white' : 
                                                'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                                {t(`admin.trans.role.${user.role || 'viewer'}`)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-wrap gap-1">
                                            {user.departments && user.departments.length > 0 ? (
                                                user.departments.map(dept => (
                                                    <span key={dept} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black border ${DEPT_COLORS[dept] ?? 'bg-slate-100 text-slate-600 border-slate-100'}`}>
                                                        <Building2 className="w-2.5 h-2.5" />
                                                        {getDeptLabel(dept)}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-300 text-[10px] font-bold">—</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        {user.isVerified ? (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-950 bg-slate-50 border border-slate-200">
                                                <div className="w-1 h-1 rounded-full bg-slate-950" />
                                                {t('admin.users.status.verified')}
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100">
                                                <div className="w-1 h-1 rounded-full bg-slate-300 animate-pulse" />
                                                {t('admin.users.status.pending')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            {!user.isVerified ? (
                                                <button 
                                                    onClick={() => handleVerifyUser(user.id, true)}
                                                    className="h-9 px-4 rounded-xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm"
                                                >
                                                    {t('admin.users.action.verify')}
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleVerifyUser(user.id, false)}
                                                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:text-slate-950 hover:bg-slate-200 transition-all"
                                                    title="تعليق"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            
                                            <Link
                                                 href={`/admin/users/${user.id}`}
                                                 className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-900 text-white hover:bg-slate-800 transition-all"
                                                 title="الدخول للملف"
                                             >
                                                 <Eye className="w-4 h-4" />
                                             </Link>

                                            <button 
                                                 onClick={() => handleEditUser(user)}
                                                 className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-900 text-white hover:bg-slate-800 transition-all"
                                                 title="تعديل"
                                             >
                                                 <Edit className="w-4 h-4" />
                                             </button>
 
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="h-9 w-9 flex items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-700 hover:bg-red-100 transition-all"
                                                title="حذف"
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

                {/* Pagination */}
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredUsers.length}
                    itemsLabel={t('admin.users.total')}
                />
            </div>
        </div>
        </div>
    );
}
