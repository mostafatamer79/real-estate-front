"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Loader2, Plus } from 'lucide-react';
import { financialApi, TransactionType, CreateTransactionDto, FinancialTransaction, TransactionStatus } from '@/lib/financial-service';
import { toast } from 'react-hot-toast';
import { useLanguage } from "@/context/LanguageContext";
import { SaudiRiyalAmount } from '@/components/ui/saudi-riyal';

// Expense categories
const EXPENSE_CATEGORIES = [
    'marketing',
    'operations',
    'maintenance',
    'salaries',
    'rent',
    'other'
];

export default function ExpensesManager() {
    const { t, language } = useLanguage();
    const isRTL = language === 'ar';
    
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
            toast.error(t('fin.expense.loadError'));
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
            toast.error(t('fin.expense.validation.required'));
            return;
        }

        if (parseFloat(formData.amount) <= 0) {
            toast.error(t('fin.expense.validation.amount'));
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
            toast.success(t('fin.expense.success'));
            setShowForm(false);
            setFormData({ amount: '', category: '', description: '' });
            fetchExpenses(); // Refresh list
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data?.message || t('fin.expense.error');
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t('fin.expense.title')}</CardTitle>
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('fin.expense.add')}
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Expense Form */}
                    {showForm && (
                        <div className="mb-6 p-3 sm:p-6 bg-muted rounded-lg border">
                            <h3 className="text-lg font-semibold mb-4">{t('fin.expense.new')}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Amount */}
                                    <div className="space-y-2">
                                        <Label>{t('fin.expense.amount')} *</Label>
                                        <Input 
                                            type="number" 
                                            step="0.01"
                                            value={formData.amount} 
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>

                                    {/* Category Dropdown */}
                                    <div className="space-y-2">
                                        <Label>{t('fin.expense.category')} *</Label>
                                        <Select 
                                            value={formData.category} 
                                            onValueChange={(val) => setFormData({...formData, category: val})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('fin.expense.selectCategory')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {EXPENSE_CATEGORIES.map(cat => (
                                                    <SelectItem key={cat} value={cat}>
                                                        {t(`fin.expense.category.${cat}`)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Description */}
                                    <div className="col-span-2 space-y-2">
                                        <Label>{t('fin.expense.description')}</Label>
                                        <Input 
                                            value={formData.description} 
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            placeholder={t('fin.expense.descriptionPlaceholder')}
                                        />
                                    </div>
                                </div>

                                <div className={`flex gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                                        {t('common.cancel')}
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className={`animate-spin h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                                {t('common.saving')}
                                            </>
                                        ) : (
                                            t('fin.expense.save')
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Expenses Table */}
                    {loading ? (
                        <div className="flex justify-center p-4 sm:p-8">
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto w-full">
<Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                                        {t('fin.expense.category')}
                                    </TableHead>
                                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                                        {t('fin.expense.description')}
                                    </TableHead>
                                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                                        {t('fin.expense.amount')}
                                    </TableHead>
                                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                                        {t('fin.expense.date')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.length > 0 ? (
                                    expenses.map((expense) => (
                                        <TableRow key={expense.id}>
                                            <TableCell>
                                                {expense.expenseCategory 
                                                    ? t(`fin.expense.category.${expense.expenseCategory}`)
                                                    : t('fin.expense.category.other')
                                                }
                                            </TableCell>
                                            <TableCell>{expense.description || '-'}</TableCell>
                                            <TableCell className="font-bold text-red-600">
                                                -<SaudiRiyalAmount amount={expense.amount} locale={isRTL ? 'ar-SA' : 'en-US'} />
                                            </TableCell>
                                            <TableCell>
                                                {new Date(expense.transactionDate).toLocaleDateString(
                                                    isRTL ? 'ar-SA' : 'en-US'
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                            {t('fin.expense.noData')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
