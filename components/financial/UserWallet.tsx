"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Wallet, CreditCard, Receipt, X, Loader2 } from 'lucide-react';
import InvoiceModal from '@/app/src/components/invoice';
import { financialApi, WalletData, TransactionType, TransactionStatus } from '@/lib/financial-service';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UserWallet() {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [walletData, setWalletData] = useState<WalletData | null>(null);
    
    // Withdrawal state
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const fetchWallet = async () => {
        try {
            const data = await financialApi.getMyWallet();
            setWalletData(data);
        } catch (error) {
            console.error(error);
            toast.error('فشل تحميل بيانات المحفظة');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallet();
    }, []);

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(withdrawAmount);
        if (!amount || amount <= 0) {
            toast.error('الرجاء إدخال مبلغ صحيح');
            return;
        }
        if (amount > (walletData?.balance || 0)) {
            toast.error('لا يوجد رصيد كافٍ');
            return;
        }

        setIsWithdrawing(true);
        try {
            await financialApi.requestWithdrawal(amount);
            toast.success('تم إرسال طلب السحب بنجاح');
            setShowWithdrawModal(false);
            setWithdrawAmount('');
            fetchWallet();
        } catch (error) {
            console.error(error);
            toast.error('فشل إرسال طلب السحب');
        } finally {
            setIsWithdrawing(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card className='bg-white rounded-xl shadow-lg'>
                <CardHeader className='pb-4'>
                    <CardTitle className='text-2xl font-bold text-black text-right'>المحفظة</CardTitle>
                </CardHeader>
                <div className='px-6 pb-6'>
                    <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-2'>
                        {/* Left Side - Available Balance */}
                        <div className='w-full md:w-auto md:flex-1'>
                            <div className='text-right md:text-right'>
                                <div className='text-black text-sm mb-2'>الرصيد المتاح</div>
                                <div className='text-3xl font-bold text-black'>
                                    {walletData?.balance.toLocaleString() || '0.00'} <span className='text-xl font-normal'>ريال</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Action Buttons */}
                        <div className='flex gap-3 w-full md:w-auto flex-wrap md:flex-nowrap'>
                            <Button className='px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-sm whitespace-nowrap'>
                                إضافة رصيد
                            </Button>
                            <Button 
                                onClick={() => setShowWithdrawModal(true)}
                                className='px-6 py-4 text-white bg-slate-800 hover:bg-slate-700 font-semibold rounded-lg text-sm whitespace-nowrap'>
                                سحب رصيد
                            </Button>
                        </div>
                    </div>
                </div>
                
                {/* Recent Wallet Transactions */}
                <div className='px-6 pb-6'>
                    <h3 className="text-right font-bold mb-4">آخر العمليات</h3>
                    <Table className='bg-white border border-gray-200 text-black p-4 shadow-sm'>
                        <TableHeader>
                            <TableRow>
                                <TableHead className='text-right'>رقم العملية</TableHead>
                                <TableHead className='text-right'>النوع</TableHead>
                                <TableHead className='text-right'>التاريخ</TableHead>
                                <TableHead className='text-right'>المبلغ</TableHead>
                                <TableHead className='text-right'>الحالة</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {walletData?.transactions && walletData.transactions.length > 0 ? (
                                walletData.transactions.slice(0, 10).map((t, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{t.id.slice(0, 8)}</TableCell>
                                        <TableCell>{t.type}</TableCell>
                                        <TableCell>{new Date(t.transactionDate).toLocaleDateString('ar-SA')}</TableCell>
                                        <TableCell className={t.type === TransactionType.WITHDRAWAL || t.type === TransactionType.EXPENSE ? 'text-red-600' : 'text-green-600'}>
                                            {t.amount} ر.س
                                        </TableCell>
                                        <TableCell>{t.status}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                                        لا توجد عمليات مسجلة
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowWithdrawModal(false)}
                    dir="rtl"
                >
                    <div
                        className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-md mx-4 text-black p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                         <h2 className="text-xl font-bold mb-4">طلب سحب رصيد</h2>
                         <form onSubmit={handleWithdraw}>
                             <div className="space-y-4">
                                 <div>
                                     <Label>المبلغ المراد سحبه</Label>
                                     <Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.00" />
                                     <p className="text-sm text-gray-500 mt-1">الرصيد المتاح: {walletData?.balance} ريال</p>
                                 </div>
                                 <div className="flex gap-2 justify-end">
                                     <Button type="button" variant="ghost" onClick={() => setShowWithdrawModal(false)}>إلغاء</Button>
                                     <Button type="submit" disabled={isWithdrawing}>
                                         {isWithdrawing ? <Loader2 className="animate-spin" /> : 'تأكيد السحب'}
                                     </Button>
                                 </div>
                             </div>
                         </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowPaymentModal(false)}
                    dir="rtl"
                >
                    <div
                        className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-2xl mx-4 text-black animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold">طرق الدفع</h2>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            <button className="w-full p-4 bg-slate-800 text-white hover:bg-slate-700 border-2 border-gray-700 hover:border-gray-600 rounded-lg transition-all duration-200 flex items-center justify-between">
                                <span className="font-semibold">الدفع من الرصيد</span>
                                <Wallet className="h-5 w-5" />
                            </button>

                            <button className="w-full p-4 bg-slate-800 text-white hover:bg-slate-700 border-2 border-gray-700 hover:border-gray-600 rounded-lg transition-all duration-200 flex items-center justify-between">
                                <span className="font-semibold">دفع ببطاقات الائتمان</span>
                                <CreditCard className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 pt-0">
                            <button className="w-full p-4 bg-slate-800 text-white hover:bg-slate-700 border-2 border-gray-700 hover:border-gray-600 rounded-lg transition-all duration-200 flex items-center justify-between">
                                <div className="text-right">
                                    <div className="font-semibold">دفع من تابي وتمارا</div>
                                    <div className="text-sm text-gray-400 mt-1">12 قسط</div>
                                </div>
                                <Receipt className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <InvoiceModal 
                isOpen={showInvoiceModal} 
                onClose={() => setShowInvoiceModal(false)} 
            />
        </div>
    );
}
