"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { User, Role } from "@/types/user";
import { Loader2, Trash2, CheckCircle, XCircle, Shield, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get<User[]>('/user');
            setUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast({
                title: "خطأ",
                description: "فشل تحميل المستخدمين",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyUser = async (userId: string, status: boolean) => {
        if (!confirm(status ? 'تأكيد تفعيل المستخدم؟' : 'تأكيد إلغاء تفعيل المستخدم؟')) return;
        
        try {
            // VerifyStatus enum from backend: PENDING, VERIFIED, REJECTED
            const verifyStatus = status ? 'verified' : 'rejected'; 
            await api.put(`/user/${userId}/verify`, { status: verifyStatus });

            setUsers(users.map(u => u.id === userId ? { ...u, isVerified: status } : u));
            toast({
                title: "نجاح",
                description: "تم تحديث حالة المستخدم بنجاح",
                variant: "default"
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "خطأ",
                description: "فشل تحديث حالة المستخدم",
                variant: "destructive"
            });
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) return;

        try {
           // Assuming there is a delete endpoint. If not, maybe use soft delete or request backend change.
           // Checked UserController, it DOES NOT have DELETE. 
           // But I plan to add it or just omit it?
           // Task Requirements: "Create / update / delete: Users"
           // So I MUST add delete endpoint to backend if missing.
           // For now I'll add the button and assume endpoint exists or I will add it next.
           await api.delete(`/user/${userId}`);
           setUsers(users.filter(u => u.id !== userId));
           toast({
               title: "تم الحذف",
               description: "تم حذف المستخدم بنجاح",
               variant: "default"
           });
        } catch (error: any) {
            toast({
                title: "خطأ",
                description: "فشل حذف المستخدم",
                variant: "destructive"
            });
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>;

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">إدارة المستخدمين</h1>
                <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg font-medium">
                    العدد الكلي: {users.length}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">الاسم</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">معلومات الاتصال</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">الصلاحية</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">الحالة</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                <UserIcon className="w-5 h-5" />
                                            </div>
                                            <div className="mr-4">
                                                <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.email}</div>
                                        <div className="text-sm text-gray-500">{user.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1
                                            ${user.role === Role.ADMIN ? 'bg-purple-100 text-purple-800' : 
                                              user.role === Role.AGENT ? 'bg-orange-100 text-orange-800' : 
                                              'bg-blue-100 text-blue-800'}`}>
                                            {user.role === Role.ADMIN && <Shield className="w-3 h-3" />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.isVerified ? (
                                            <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
                                                <CheckCircle className="w-3 h-3" />
                                                مفعل
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-red-500 bg-red-50 px-2 py-1 rounded-full text-xs font-medium">
                                                <XCircle className="w-3 h-3" />
                                                غير مفعل
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <div className="flex items-center justify-center gap-2">
                                            {!user.isVerified ? (
                                                <button 
                                                    onClick={() => handleVerifyUser(user.id, true)}
                                                    className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
                                                    title="تفعيل المستخدم"
                                                >
                                                    تفعيل
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleVerifyUser(user.id, false)}
                                                    className="text-white bg-yellow-500 hover:bg-yellow-600 px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
                                                    title="إلغاء تفعيل المستخدم"
                                                >
                                                    تعليق
                                                </button>
                                            )}
                                            
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                title="حذف المستخدم"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
