
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Loader2, CreditCard, Wallet, Banknote, StopCircle } from 'lucide-react';
import { financialApi, FinancialTransaction, TransactionStatus, PaymentMethod } from '@/lib/financial-service';
import { toast } from 'react-hot-toast';

export default function PaymentsManager() {
    const [payments, setPayments] = useState<FinancialTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPayments = async () => {
        try {
            const allTransactions = await financialApi.getAllTransactions();
            // Filter where paymentMethod is defined or it's a payment-like transaction
            const paymentList = allTransactions.filter(t => t.paymentMethod || t.amount > 0);
            setPayments(paymentList);
        } catch (error) {
            console.error(error);
            toast.error('فشل تحميل المدفوعات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const getMethodIcon = (method?: PaymentMethod) => {
        switch (method) {
            case PaymentMethod.CARD: return <CreditCard className="w-4 h-4 text-blue-600" />;
            case PaymentMethod.WALLET: return <Wallet className="w-4 h-4 text-purple-600" />;
            case PaymentMethod.CASH: return <Banknote className="w-4 h-4 text-green-600" />;
            default: return <StopCircle className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>سجل المدفوعات</CardTitle></CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">رقم العملية</TableHead>
                                <TableHead className="text-right">طريقة الدفع</TableHead>
                                <TableHead className="text-right">المبلغ</TableHead>
                                <TableHead className="text-right">التاريخ</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.length > 0 ? (
                                payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{payment.id.slice(0, 8)}</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            {getMethodIcon(payment.paymentMethod)}
                                            {payment.paymentMethod || 'غير محدد'}
                                        </TableCell>
                                        <TableCell>{payment.amount} ر.س</TableCell>
                                        <TableCell>{new Date(payment.transactionDate).toLocaleDateString('ar-SA')}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs 
                                                ${payment.status === TransactionStatus.COMPLETED ? 'bg-green-100 text-green-800' : 
                                                  payment.status === TransactionStatus.FAILED ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {payment.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        لا توجد مدفوعات مسجلة
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
