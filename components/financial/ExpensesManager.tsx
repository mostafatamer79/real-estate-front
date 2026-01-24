
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Loader2, Plus } from 'lucide-react';
import { financialApi, TransactionType, CreateTransactionDto, FinancialTransaction, TransactionStatus } from '@/lib/financial-service';
import { toast } from 'react-hot-toast';

export default function ExpensesManager() {
    const [expenses, setExpenses] = useState<FinancialTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        amount: '',
        category: '',
        description: '',
    });

    const fetchExpenses = async () => {
        try {
            const allTransactions = await financialApi.getAllTransactions();
            const expenseList = allTransactions.filter(t => t.type === TransactionType.EXPENSE);
            setExpenses(expenseList);
        } catch (error) {
            console.error(error);
            toast.error('فشل تحميل المصروفات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.category) {
            toast.error('الرجاء إدخال المبلغ والتصنيف');
            return;
        }

        setIsSubmitting(true);
        try {
            const dto: CreateTransactionDto = {
                type: TransactionType.EXPENSE,
                amount: parseFloat(formData.amount),
                expenseCategory: formData.category,
                description: formData.description,
                status: TransactionStatus.COMPLETED,
            };

            await financialApi.createExpense(dto);
            toast.success('تم إضافة المصروف بنجاح');
            setShowForm(false);
            setFormData({ amount: '', category: '', description: '' });
            fetchExpenses(); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ أثناء إضافة المصروف');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>سجل المصروفات</CardTitle>
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className="ml-2 h-4 w-4" /> تسجيل مصروف جديد
                    </Button>
                </CardHeader>
                <CardContent>
                    {showForm && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>المبلغ (ر.س)</Label>
                                        <Input 
                                            type="number" 
                                            value={formData.amount} 
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>تصنيف المصروف</Label>
                                        <Input 
                                            value={formData.category} 
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            placeholder="تسويق، تشغيل، صيانة..."
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label>الوصف</Label>
                                        <Input 
                                            value={formData.description} 
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            placeholder="تفاصيل إضافية..."
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>إلغاء</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'حفظ المصروف'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">التصنيف</TableHead>
                                    <TableHead className="text-right">الوصف</TableHead>
                                    <TableHead className="text-right">المبلغ</TableHead>
                                    <TableHead className="text-right">التاريخ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.length > 0 ? (
                                    expenses.map((expense) => (
                                        <TableRow key={expense.id}>
                                            <TableCell>{expense.expenseCategory || 'عام'}</TableCell>
                                            <TableCell>{expense.description}</TableCell>
                                            <TableCell className="font-bold text-red-600">-{expense.amount} ر.س</TableCell>
                                            <TableCell>{new Date(expense.transactionDate).toLocaleDateString('ar-SA')}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                            لا توجد مصروفات مسجلة
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
