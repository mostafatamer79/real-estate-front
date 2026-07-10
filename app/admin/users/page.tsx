"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Calendar,
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Pagination } from "../../src/components/Pagination";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";
import DepartmentFeaturePreviewDialog, { PreviewDepartmentKey } from "@/components/subscriptions/DepartmentFeaturePreviewDialog";

// ─── Department meta ───────────────────────────────────────────────────────────
const DEPARTMENTS = [
  { value: 'marketing',  labelAr: 'إدارة التسويق',   labelEn: 'Marketing' },
  { value: 'properties', labelAr: 'إدارة الاملاك',   labelEn: 'Properties' },
  { value: 'offers',     labelAr: 'إدارة العروض',    labelEn: 'Offers Management' },
  { value: 'orders',     labelAr: 'إدارة الطلبات',   labelEn: 'Orders Management' },
  { value: 'finance',    labelAr: 'الإدارة المالية',  labelEn: 'Finance' },
  { value: 'legal',      labelAr: 'الإدارة القانونية', labelEn: 'Legal' },
  { value: 'employees',  labelAr: 'إدارة الموظفين',  labelEn: 'Employees' },
];

const DEPT_COLORS: Record<string, string> = {
  marketing:  'bg-muted text-slate-600 border',
  properties: 'bg-muted text-slate-600 border',
  offers:     'bg-muted text-slate-600 border',
  orders:     'bg-muted text-slate-600 border',
  finance:    'bg-muted text-slate-600 border',
  legal:      'bg-muted text-slate-600 border',
  employees:  'bg-muted text-slate-600 border',
};

const getDeptLabel = (dept: string) => DEPARTMENTS.find(d => d.value === dept)?.labelAr ?? dept;

const DEPARTMENT_PREVIEW_MAP: Record<string, PreviewDepartmentKey> = {
  properties: "properties",
  offers: "offers",
  orders: "orders",
  marketing: "marketing",
  legal: "legal",
  finance: "finance",
  employees: "employees",
};

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
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDepartment, setPreviewDepartment] = useState<PreviewDepartmentKey>("properties");

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

      onCreated(res.data);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const deptLabel = (d: typeof DEPARTMENTS[0]) => language === 'ar' ? d.labelAr : d.labelEn;
  const fieldCls = (f: string) => `w-full h-11 bg-muted rounded-xl px-4 text-sm font-bold border ${touched[f] && fieldErrors[f] ? 'border-red-500' : 'border-transparent focus:border-slate-950'} outline-none transition-all`;
  const iconFieldCls = (f: string) => `w-full h-11 bg-muted rounded-xl pr-10 pl-4 text-sm font-bold border ${touched[f] && fieldErrors[f] ? 'border-red-500' : 'border-transparent focus:border-slate-950'} outline-none transition-all`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full w-[95vw] sm:max-w-lg rounded-[1rem] p-8 shadow-2xl relative overflow-hidden">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الصلاحية</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full h-11 bg-muted rounded-xl px-4 text-sm font-bold border border-transparent focus:border-slate-950 outline-none transition-all appearance-none">
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

          {form.role !== Role.USER && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الإدارة</label>
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-2">
                {DEPARTMENTS.map(dept => {
                  const isSelected = form.department.includes(dept.value);
                  return (
                    <div key={dept.value} className={`flex items-center gap-1 rounded-xl border p-1 transition-all ${isSelected ? 'bg-slate-950 text-white border-slate-950' : 'bg-muted text-slate-500 border-transparent hover:border'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setForm(f => {
                            const newDepts = f.department.includes(dept.value) ? f.department.filter(d => d !== dept.value) : [...f.department, dept.value];
                            return { ...f, department: newDepts };
                          });
                        }}
                        className="min-w-0 flex-1 px-2 py-2 text-right text-[9px] font-black"
                      >
                        {deptLabel(dept)}
                      </button>
                      <button
                        type="button"
                        title={language === 'ar' ? 'معاينة الميزات' : 'Preview features'}
                        onClick={() => {
                          setPreviewDepartment(DEPARTMENT_PREVIEW_MAP[dept.value] || "properties");
                          setPreviewOpen(true);
                        }}
                        className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-card/10 text-white hover:bg-card/20' : 'bg-card text-slate-400 hover:text-slate-950'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {touched.department && fieldErrors.department && (
                <p className="text-[10px] font-bold text-red-500">{fieldErrors.department}</p>
              )}
            </div>
          )}



          {['legal', 'finance', 'marketing'].includes(form.role) && (
            <div className="p-4 rounded-2xl bg-muted border border flex items-center gap-3">
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
      <DepartmentFeaturePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        initialDepartment={previewDepartment}
      />
    </div>
  );
}


// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
    const { t, language } = useLanguage();
    const confirmDialog = useConfirmDialog();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [roleFilter, setRoleFilter] = useState("all");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [verificationFilter, setVerificationFilter] = useState("all");

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
    const isRtl = language === "ar";
    const handleOpenChat = async (targetUserId: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/rooms/direct`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ targetUserId }),
            });
            const data = await res.json();
            if (data.id) {
                router.push(`/internal/chat/${data.id}`);
            } else {
                toast.error(isRtl ? "فشل فتح المحادثة" : "Failed to open chat");
            }
        } catch (error) {
            console.error(error);
            toast.error(isRtl ? "حدث خطأ أثناء فتح المحادثة" : "Error opening chat");
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
        const ok = await confirmDialog({
            title: status ? t('admin.users.action.confirmVerify') : t('admin.users.action.confirmUnverify'),
            confirmLabel: language === 'ar' ? 'تأكيد' : 'Confirm',
            cancelLabel: language === 'ar' ? 'إلغاء' : 'Cancel',
        });
        if (!ok) return;
        try {
            const verifyStatus = status ? 'verified' : 'rejected'; 
            await api.put(`/user/${userId}/verify`, { status: verifyStatus });
            setUsers(users.map(u => u.id === userId ? { ...u, isVerified: status } : u));
        } catch (error) { console.error(error); }
    };

    const handleToggleUserActive = async (targetUser: User) => {
        const nextActive = !targetUser.isActive;
        const ok = await confirmDialog({
            title: nextActive
                ? (language === 'ar' ? 'تفعيل الحساب؟' : 'Activate account?')
                : (language === 'ar' ? 'تقييد الحساب؟' : 'Restrict account?'),
            description: nextActive
                ? (language === 'ar' ? 'سيتم السماح للمستخدم بالدخول واستخدام الحساب.' : 'The user will be allowed to access the account.')
                : (language === 'ar' ? 'سيتم منع المستخدم من استخدام الحساب حتى يتم تفعيله مرة أخرى.' : 'The user will be blocked until the account is activated again.'),
            confirmLabel: nextActive ? (language === 'ar' ? 'تفعيل' : 'Activate') : (language === 'ar' ? 'تقييد' : 'Restrict'),
            cancelLabel: language === 'ar' ? 'إلغاء' : 'Cancel',
            destructive: !nextActive,
        });
        if (!ok) return;
        try {
            const res = await api.put(`/user/${targetUser.id}`, { isActive: nextActive });
            const updated = res.data || { ...targetUser, isActive: nextActive };
            setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, ...updated, isActive: nextActive } : u));
            toast.success(nextActive ? 'تم تفعيل الحساب' : 'تم تقييد الحساب');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'تعذر تحديث حالة الحساب');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        const ok = await confirmDialog({
            title: t('admin.users.action.confirmDelete'),
            confirmLabel: language === 'ar' ? 'حذف' : 'Delete',
            cancelLabel: language === 'ar' ? 'إلغاء' : 'Cancel',
            destructive: true,
        });
        if (!ok) return;
        try {
           await api.delete(`/user/${userId}`);
           setUsers(users.filter(u => u.id !== userId));
        } catch (error: any) { console.error(error); }
    };

    const handleImpersonateUser = async (targetUser: User) => {
        const displayName = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.email || targetUser.phone || 'هذا المستخدم';
        const ok = await confirmDialog({
            title: `هل تريد الدخول بحساب ${displayName}؟`,
            description: language === 'ar' ? 'سيتم نقلك إلى جلسة هذا المستخدم حتى تعود لوضع الإدارة.' : 'You will switch into this user session until you return to admin mode.',
            confirmLabel: language === 'ar' ? 'دخول' : 'Continue',
            cancelLabel: language === 'ar' ? 'إلغاء' : 'Cancel',
        });
        if (!ok) return;

        try {
            const adminSession = {
                token: localStorage.getItem('token'),
                refreshToken: localStorage.getItem('refreshToken'),
                user: localStorage.getItem('user'),
                returnTo: '/admin/users',
                startedAt: new Date().toISOString(),
            };

            const res = await api.post(`/auth/impersonate/${targetUser.id}`);
            localStorage.setItem('adminImpersonationSession', JSON.stringify(adminSession));
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            localStorage.setItem('impersonatedByAdmin', JSON.stringify(res.data.impersonatedBy));
            window.dispatchEvent(new Event('auth-change'));
            toast.success('تم الدخول بحساب المستخدم');
            router.push('/department-hub');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'تعذر الدخول بحساب المستخدم');
        }
    };

    const filteredUsers = users.filter(u => {
        // Hide admin users from the list to protect them
        if (u.role === Role.ADMIN) return false;
        
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchLower) ||
            (u.email?.toLowerCase().includes(searchLower) ?? false) ||
            (u.phone?.includes(searchTerm) ?? false);
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        const matchesDepartment = departmentFilter === "all" || (u.departments || []).map(String).includes(departmentFilter);
        const matchesVerification =
            verificationFilter === "all" ||
            (verificationFilter === "verified" && u.isVerified) ||
            (verificationFilter === "pending" && !u.isVerified);
        return matchesSearch && matchesRole && matchesDepartment && matchesVerification;
    });

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter, departmentFilter, verificationFilter]);

    const tableContainerRef = React.useRef<HTMLDivElement>(null);
    const [showLeftScroll, setShowLeftScroll] = useState(false);
    const [showRightScroll, setShowRightScroll] = useState(false);

    const checkScroll = () => {
        if (tableContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
            const isScrollable = scrollWidth > clientWidth;
            if (!isScrollable) {
                setShowLeftScroll(false);
                setShowRightScroll(false);
                return;
            }

            const isRtl = language === 'ar';
            if (isRtl) {
                const maxScroll = scrollWidth - clientWidth;
                const absScrollLeft = Math.abs(scrollLeft);
                setShowRightScroll(absScrollLeft > 10);
                setShowLeftScroll(absScrollLeft < maxScroll - 10);
            } else {
                setShowLeftScroll(scrollLeft > 10);
                setShowRightScroll(scrollLeft < (scrollWidth - clientWidth) - 10);
            }
        }
    };

    const scrollTable = (direction: 'left' | 'right') => {
        if (tableContainerRef.current) {
            const amount = 300;
            const scrollValue = direction === 'left' ? -amount : amount;
            tableContainerRef.current.scrollBy({
                left: scrollValue,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const el = tableContainerRef.current;
        if (el) {
            el.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
            checkScroll();
            const timer = setTimeout(checkScroll, 500);
            return () => {
                el.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
                clearTimeout(timer);
            };
        }
    }, [users, filteredUsers, language]);

    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftState, setScrollLeftState] = useState(0);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (
            target.closest('button') || 
            target.closest('a') || 
            target.closest('select') || 
            target.closest('input')
        ) {
            return;
        }

        if (!tableContainerRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - tableContainerRef.current.offsetLeft);
        setScrollLeftState(tableContainerRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !tableContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - tableContainerRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        tableContainerRef.current.scrollLeft = scrollLeftState - walk;
    };


    if (loading) return (
        <div className="space-y-8 animate-pulse">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-muted rounded-lg" /><div className="h-4 w-32 bg-muted rounded-lg" />
                </div>
                <div className="h-10 w-24 bg-muted rounded-xl" />
            </div>
            <div className="h-[600px] bg-muted rounded-[1.25rem]" />
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-slate-500 text-[9px] font-black uppercase tracking-widest border border">
                        <Users className="w-4 h-4" />
                        {t('admin.users.directory')}
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-950">{t('admin.users.title')}</h1>
                    <p className="text-slate-400 text-xs font-bold">{t('admin.users.desc')}</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-card border border px-4 py-2.5 rounded-2xl shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t('admin.users.total')}</p>
                        <p className="text-xl font-black text-slate-950 tabular-nums">{users.length}</p>
                    </div>
                    {/* Create user button */}

                </div>
            </section>

            {/* Table Control Bar */}
            <div className="grid grid-cols-1 gap-3 bg-card p-4 rounded-3xl border border shadow-sm md:grid-cols-5">
                <div className={`relative w-full group md:col-span-2`}>
                    <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-950 transition-colors`} />
                    <input 
                        type="text"
                        placeholder={t('admin.users.searchPlaceholder')}
                        className="w-full h-11 bg-muted rounded-2xl px-12 text-sm font-bold border border-transparent focus:border-slate-950 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-11 rounded-2xl border border bg-card px-4 text-sm font-bold">
                    <option value="all">كل الأدوار</option>
                    {Object.values(Role).map((role) => <option key={role} value={role}>{t(`admin.trans.role.${role}`) || role}</option>)}
                </select>
                <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="h-11 rounded-2xl border border bg-card px-4 text-sm font-bold">
                    <option value="all">كل الإدارات</option>
                    {DEPARTMENTS.map((dept) => <option key={dept.value} value={dept.value}>{language === 'ar' ? dept.labelAr : dept.labelEn}</option>)}
                </select>
                <select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)} className="h-11 rounded-2xl border border bg-card px-4 text-sm font-bold">
                    <option value="all">كل الحالات</option>
                    <option value="verified">موثق</option>
                    <option value="pending">بانتظار التوثيق</option>
                </select>
                <div className="flex gap-2 w-full">
                    <button onClick={() => { setSearchTerm(""); setRoleFilter("all"); setDepartmentFilter("all"); setVerificationFilter("all"); }} className="flex-1 h-11 px-6 rounded-2xl bg-card border border hover:border-slate-950 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <Filter className="w-4 h-4" />
                        مسح
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-card border border rounded-[1rem] overflow-hidden shadow-sm">
                <div className="relative group/table">
                    {/* Left scroll button */}
                    {showLeftScroll && (
                        <button
                            type="button"
                            onClick={() => scrollTable('left')}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card/90 backdrop-blur border border-/80 shadow-md text-slate-700 hover:bg-slate-950 hover:text-white transition-all flex items-center justify-center active:scale-95 opacity-90 md:opacity-0 md:group-hover/table:opacity-100 duration-300"
                            title={language === 'ar' ? 'تمرير لليسار' : 'Scroll Left'}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}

                    {/* Right scroll button */}
                    {showRightScroll && (
                        <button
                            type="button"
                            onClick={() => scrollTable('right')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card/90 backdrop-blur border border-/80 shadow-md text-slate-700 hover:bg-slate-950 hover:text-white transition-all flex items-center justify-center active:scale-95 opacity-90 md:opacity-0 md:group-hover/table:opacity-100 duration-300"
                            title={language === 'ar' ? 'تمرير لليمين' : 'Scroll Right'}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}

                    <div 
                        ref={tableContainerRef} 
                        className={`overflow-x-auto pb-3 ${
                            (showLeftScroll || showRightScroll) 
                                ? (isDragging ? 'cursor-grabbing select-none' : 'cursor-grab') 
                                : ''
                        }`}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                    >
                    <table className="w-full text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <thead>
                            <tr className="bg-muted/50 border-b border">
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
                                    className="hover:bg-muted/50 transition-colors group"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border flex items-center justify-center text-white font-black text-xs shrink-0 group-hover:scale-110 transition-transform">
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
                                                'bg-muted text-slate-600 border border'
                                            }`}>
                                                {t(`admin.trans.role.${user.role || 'viewer'}`)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-wrap gap-1">
                                            {user.departments && user.departments.length > 0 ? (
                                                user.departments.map(dept => (
                                                    <span key={dept} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black border ${DEPT_COLORS[dept] ?? 'bg-muted text-slate-600 border'}`}>
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
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-950 bg-muted border border">
                                                <div className="w-1 h-1 rounded-full bg-slate-950" />
                                                {t('admin.users.status.verified')}
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 bg-muted border border">
                                                <div className="w-1 h-1 rounded-full bg-slate-300 animate-pulse" />
                                                {t('admin.users.status.pending')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            {!user.isVerified ? (
                                                <button 
                                                    type="button"
                                                    onClick={() => handleVerifyUser(user.id, true)}
                                                    className="h-9 px-4 rounded-xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm"
                                                >
                                                    {t('admin.users.action.verify')}
                                                </button>
                                            ) : (
                                                <button 
                                                    type="button"
                                                    onClick={() => handleVerifyUser(user.id, false)}
                                                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted text-slate-400 hover:text-slate-950 hover:bg-muted transition-all"
                                                    title="تعليق"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}

                                            <button
                                                  type="button"
                                                  onClick={() => handleOpenChat(user.id)}
                                                  className="h-9 w-9 flex items-center justify-center rounded-xl border border bg-card text-slate-600 hover:bg-muted transition-all"
                                                  title={language === 'ar' ? "مراسلة العميل" : "Message Client"}
                                             >
                                                 <MessageSquare className="w-4 h-4" />
                                             </button>

                                            <button
                                                type="button"
                                                onClick={() => handleToggleUserActive(user)}
                                                className={`h-9 px-3 flex items-center justify-center gap-1.5 rounded-xl border transition-all text-[10px] font-black whitespace-nowrap ${
                                                    user.isActive
                                                        ? 'border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                        : 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                }`}
                                                title={user.isActive ? 'تقييد الحساب' : 'تفعيل الحساب'}
                                            >
                                                {user.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                                <span>{user.isActive ? 'تقييد الحساب' : 'تفعيل الحساب'}</span>
                                            </button>
                                            
                                            <Link
                                                 href={`/admin/users/${user.id}`}
                                                 className="h-9 w-9 flex items-center justify-center rounded-xl border border bg-slate-900 text-white hover:bg-slate-800 transition-all"
                                                 title="الدخول للملف"
                                             >
                                                 <Eye className="w-4 h-4" />
                                             </Link>

                                            <button
                                                 type="button"
                                                 onClick={() => handleImpersonateUser(user)}
                                                 className="h-9 px-3 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all text-[10px] font-black whitespace-nowrap"
                                                 title="الدخول كالمستخدم"
                                             >
                                                 <UserIcon className="w-4 h-4" />
                                                 <span>الدخول كالمستخدم</span>
                                             </button>

                                            <button 
                                                 type="button"
                                                 onClick={() => handleEditUser(user)}
                                                 className="h-9 w-9 flex items-center justify-center rounded-xl border border bg-slate-900 text-white hover:bg-slate-800 transition-all"
                                                 title="تعديل"
                                             >
                                                 <Edit className="w-4 h-4" />
                                             </button>
 
                                            <button 
                                                type="button"
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
