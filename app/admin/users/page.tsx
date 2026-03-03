"use client";

import React, { useEffect, useState } from "react";
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
  ChevronDown,
  Mail,
  Phone,
  ArrowUpRight,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function UsersPage() {
    const { t, language } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get<User[]>('/user');
            setUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyUser = async (userId: string, status: boolean) => {
        if (!confirm(status ? t('admin.users.action.confirmVerify') : t('admin.users.action.confirmUnverify'))) return;
        
        
        try {
            const verifyStatus = status ? 'verified' : 'rejected'; 
            await api.put(`/user/${userId}/verify`, { status: verifyStatus });

            setUsers(users.map(u => u.id === userId ? { ...u, isVerified: status } : u));
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm(t('admin.users.action.confirmDelete'))) return;
        try {
           await api.delete(`/user/${userId}`);
           setUsers(users.filter(u => u.id !== userId));
        } catch (error: any) {
            console.error(error);
        }
    };

    const filteredUsers = users.filter(u => 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );

    if (loading) return (
        <div className="space-y-8 animate-pulse">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-slate-200 rounded-lg" />
                    <div className="h-4 w-32 bg-slate-100 rounded-lg" />
                </div>
                <div className="h-10 w-24 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-[600px] bg-slate-200 rounded-[2rem]" />
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest border border-slate-200">
                        <Users className="w-3 h-3" />
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
                </div>
            </section>

            {/* Table Control Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className="relative w-full md:w-96 group">
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
                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">{t('admin.users.table.status')}</th>
                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">{t('admin.users.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <UserIcon className="w-12 h-12" />
                                            <p className="font-black text-sm uppercase tracking-widest">{t('admin.users.empty')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user, i) => (
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
                                                <p className="text-sm font-black text-slate-950">{user.firstName} {user.lastName}</p>
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
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border
                                            ${user.role === Role.ADMIN ? 'bg-slate-950 text-white border-slate-950' : 'bg-slate-100 text-slate-600 border-slate-100'}`}>
                                            {user.role === Role.ADMIN && <Shield className="w-3 h-3" />}
                                            {user.role}
                                        </span>
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
                                            
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            
                                            <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-300 hover:text-slate-950 transition-all">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
