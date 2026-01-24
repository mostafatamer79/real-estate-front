"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { 
    LayoutDashboard, 
    Receipt, 
    Banknote, 
    CreditCard, 
    Calculator, 
    FileText, 
    Wallet, 
    ArrowUpRight, 
    ArrowDownLeft, 
    DollarSign,
    Briefcase,
    Loader2
} from 'lucide-react';

import UserWallet from '@/components/financial/UserWallet';
import CommissionManager from '@/components/financial/CommissionManager';
import ExpensesManager from '@/components/financial/ExpensesManager';
import ReportsManager from '@/components/financial/ReportsManager';
import PaymentsManager from '@/components/financial/PaymentsManager';
import { financialApi, FinancialTransaction } from '@/lib/financial-service';

export default function FinancialPage() {
    const [activeTab, setActiveTab] = useState("dashboard");

    return (
        <div className="container mx-auto p-6" dir="rtl">
            <h1 className="text-3xl font-bold mb-6 text-right">الإدارة المالية والمحاسبية</h1>

            <Tabs defaultValue="dashboard" className="w-full" onValueChange={setActiveTab}>
                {/* Scrollable Tabs List for many items */}
                <div className="overflow-x-auto pb-2 mb-6">
                    <TabsList className="inline-flex w-max min-w-full">
                        <TabsTrigger value="dashboard" className="gap-2"><LayoutDashboard className="w-4 h-4"/> لوحة مالية عامة</TabsTrigger>
                        <TabsTrigger value="transactions" className="gap-2"><Receipt className="w-4 h-4"/> العمليات المالية</TabsTrigger>
                        <TabsTrigger value="commissions" className="gap-2"><Banknote className="w-4 h-4"/> العمولات</TabsTrigger>
                        <TabsTrigger value="payments" className="gap-2"><CreditCard className="w-4 h-4"/> المدفوعات</TabsTrigger>
                        <TabsTrigger value="expenses" className="gap-2"><Calculator className="w-4 h-4"/> المصروفات</TabsTrigger>
                        <TabsTrigger value="reports" className="gap-2"><FileText className="w-4 h-4"/> التقارير والضريبة</TabsTrigger>
                        <TabsTrigger value="wallet" className="gap-2"><Wallet className="w-4 h-4"/> محفظة المستخدم</TabsTrigger>
                        <TabsTrigger value="settlements" className="gap-2"><Briefcase className="w-4 h-4"/> التسويات</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="dashboard">
                    <GeneralDashboard />
                </TabsContent>

                <TabsContent value="transactions">
                    <TransactionsSection />
                </TabsContent>

                <TabsContent value="commissions">
                    <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <Card>
                                 <CardHeader><CardTitle>توزيع العمولات</CardTitle></CardHeader>
                                 <CardContent className="space-y-4">
                                     <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                         <span>عمولة الوسطاء (المسوقين)</span>
                                         <span className="font-bold">2.5%</span>
                                     </div>
                                     <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                         <span>عمولة المنصة</span>
                                         <span className="font-bold">1.0%</span>
                                     </div>
                                 </CardContent>
                             </Card>
                         </div>
                         <CommissionManager />
                    </div>
                </TabsContent>
                
                <TabsContent value="payments">
                     <PaymentsManager />
                </TabsContent>

                <TabsContent value="expenses">
                    <ExpensesManager />
                </TabsContent>

                <TabsContent value="reports">
                    <ReportsManager />
                </TabsContent>

                <TabsContent value="wallet">
                    <UserWallet />
                </TabsContent>

                <TabsContent value="settlements">
                    <PlaceholderSection title="التسويات المالية" />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function GeneralDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await financialApi.getDashboardStats();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Placeholder data if backend returns empty or for fallback
    const kpis = [
        { label: "إجمالي المبيعات", value: stats?.totalSales ? `${stats.totalSales} ريال` : "0 ريال", icon: DollarSign, color: "text-green-600 bg-green-100" },
        { label: "إجمالي الايجارات", value: stats?.totalRentals ? `${stats.totalRentals} ريال` : "0 ريال", icon: Briefcase, color: "text-blue-600 bg-blue-100" },
        { label: "العمولات المستحقة", value: stats?.totalCommission ? `${stats.totalCommission} ريال` : "0 ريال", icon: Banknote, color: "text-yellow-600 bg-yellow-100" },
        { label: "المصروفات", value: stats?.totalExpenses ? `${stats.totalExpenses} ريال` : "0 ريال", icon: ArrowDownLeft, color: "text-red-600 bg-red-100" },
        { label: "الأرباح الصافية", value: stats?.netProfit ? `${stats.netProfit} ريال` : "0 ريال", icon: ArrowUpRight, color: "text-emerald-600 bg-emerald-100" },
        { label: "ضريبة القيمة المضافة", value: stats?.totalTax ? `${stats.totalTax} ريال` : "0 ريال", icon: Calculator, color: "text-purple-600 bg-purple-100" },
    ];

    if (loading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi, idx) => (
                <Card key={idx}>
                    <CardContent className="flex items-center p-6 gap-4">
                        <div className={`p-4 rounded-full ${kpi.color}`}>
                            <kpi.icon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{kpi.label}</p>
                            <h3 className="text-2xl font-bold">{kpi.value}</h3>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function TransactionsSection() {
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await financialApi.getAllTransactions();
                setTransactions(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>جدول العمليات المالية</CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">تصفية</Button>
                    <Button variant="outline" size="sm">تصدير</Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">رقم العملية</TableHead>
                                <TableHead className="text-right">النوع</TableHead>
                                <TableHead className="text-right">القيمة</TableHead>
                                <TableHead className="text-right">الضريبة</TableHead>
                                <TableHead className="text-right">العمولة</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                                <TableHead className="text-right">التاريخ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions && transactions.length > 0 ? (
                                transactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell>{t.id.slice(0, 8)}</TableCell>
                                        <TableCell>{t.type}</TableCell>
                                        <TableCell className="font-bold">{t.amount} ر.س</TableCell>
                                        <TableCell>{t.taxAmount} ر.س</TableCell>
                                        <TableCell>{t.commissionAmount} ر.س</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs 
                                                ${t.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {t.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>{new Date(t.transactionDate).toLocaleDateString('ar-SA')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                                        لا توجد عمليات مالية مسجلة.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

function PlaceholderSection({ title }: { title: string }) {
    return (
        <Card>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-gray-400">
                قريباً...
            </CardContent>
        </Card>
    );
}
