"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Loader2, CreditCard, Wallet, Banknote, StopCircle, Plus, Building2 } from 'lucide-react';
import { financialApi, FinancialTransaction, TransactionStatus, PaymentMethod, TransactionType, CreateTransactionDto } from '@/lib/financial-service';
import { toast } from 'react-hot-toast';
import { useLanguage } from "@/context/LanguageContext";
import { SaudiRiyalAmount } from '@/components/ui/saudi-riyal';

export default function PaymentsManager() {
    const { t, language } = useLanguage();
    const isRTL = language === 'ar';
    
    const [payments, setPayments] = useState<FinancialTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        amount: '',
        paymentMethod: PaymentMethod.BANK,
        description: '',
        referenceType: '',
        referenceId: '',
    });

    const fetchPayments = async () => {
        try {
            const allTransactions = await financialApi.getAllTransactions();
            // Filter payment-related transactions
            const paymentList = allTransactions.filter(t => 
                t.paymentMethod || 
                t.type === TransactionType.DEPOSIT || 
                t.type === TransactionType.WITHDRAWAL
            );
            setPayments(paymentList);
        } catch (error) {
            console.error(error);
            toast.error(t('fin.payment.loadError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast.error(t('fin.payment.validation.amount'));
            return;
        }

        setIsSubmitting(true);
        try {
            const dto: CreateTransactionDto = {
                type: TransactionType.DEPOSIT, // Default to deposit, can be changed based on context
                amount: parseFloat(formData.amount),
                paymentMethod: formData.paymentMethod,
                description: formData.description,
                status: TransactionStatus.COMPLETED,
                referenceType: formData.referenceType || undefined,
                referenceId: formData.referenceId || undefined,
            };

            await financialApi.createTransaction(dto);
            toast.success(t('fin.payment.success'));
            setShowForm(false);
            setFormData({
                amount: '',
                paymentMethod: PaymentMethod.BANK,
                description: '',
                referenceType: '',
                referenceId: '',
            });
            fetchPayments(); // Refresh list
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data?.message || t('fin.payment.error');
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getMethodIcon = (method?: PaymentMethod) => {
        switch (method) {
            case PaymentMethod.CARD: return <CreditCard className="w-4 h-4 text-blue-600" />;
            case PaymentMethod.WALLET: return <Wallet className="w-4 h-4 text-purple-600" />;
            case PaymentMethod.CASH: return <Banknote className="w-4 h-4 text-green-600" />;
            case PaymentMethod.BANK: return <Building2 className="w-4 h-4 text-indigo-600" />;
            default: return <StopCircle className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusBadgeClass = (status: TransactionStatus) => {
        switch (status) {
            case TransactionStatus.COMPLETED:
                return 'bg-green-100 text-green-800';
            case TransactionStatus.FAILED:
                return 'bg-red-100 text-red-800';
            case TransactionStatus.PENDING:
                return 'bg-yellow-100 text-yellow-800';
            case TransactionStatus.CANCELLED:
                return 'bg-muted text-gray-800';
            default:
                return 'bg-muted text-gray-800';
        }
    };

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t('fin.payment.title')}</CardTitle>
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('fin.payment.add')}
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Payment Form */}
                    {showForm && (
                        <div className="mb-6 p-6 bg-muted rounded-lg border">
                            <h3 className="text-lg font-semibold mb-4">{t('fin.payment.record')}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Amount */}
                                    <div className="space-y-2">
                                        <Label>{t('fin.payment.amount')} *</Label>
                                        <Input 
                                            type="number" 
                                            step="0.01"
                                            value={formData.amount} 
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>

                                    {/* Payment Method */}
                                    <div className="space-y-2">
                                        <Label>{t('fin.payment.method')} *</Label>
                                        <Select 
                                            value={formData.paymentMethod} 
                                            onValueChange={(val) => setFormData({...formData, paymentMethod: val as PaymentMethod})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={PaymentMethod.BANK}>
                                                    {t('fin.payment.method.bank')}
                                                </SelectItem>
                                                <SelectItem value={PaymentMethod.CARD}>
                                                    {t('fin.payment.method.card')}
                                                </SelectItem>
                                                <SelectItem value={PaymentMethod.WALLET}>
                                                    {t('fin.payment.method.wallet')}
                                                </SelectItem>
                                                <SelectItem value={PaymentMethod.CASH}>
                                                    {t('fin.payment.method.cash')}
                                                </SelectItem>
                                                <SelectItem value={PaymentMethod.APPLE_PAY}>
                                                    {t('fin.payment.method.applePay')}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Reference Type */}
                                    <div className="space-y-2">
                                        <Label>{t('fin.payment.referenceType')}</Label>
                                        <Select 
                                            value={formData.referenceType} 
                                            onValueChange={(val) => setFormData({...formData, referenceType: val})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('fin.payment.selectReference')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="order">{t('fin.payment.ref.order')}</SelectItem>
                                                <SelectItem value="commission">{t('fin.payment.ref.commission')}</SelectItem>
                                                <SelectItem value="booking">{t('fin.payment.ref.booking')}</SelectItem>
                                                <SelectItem value="other">{t('fin.payment.ref.other')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Reference ID */}
                                    <div className="space-y-2">
                                        <Label>{t('fin.payment.referenceId')}</Label>
                                        <Input 
                                            value={formData.referenceId} 
                                            onChange={(e) => setFormData({...formData, referenceId: e.target.value})}
                                            placeholder={t('fin.payment.referenceIdPlaceholder')}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="col-span-2 space-y-2">
                                        <Label>{t('fin.payment.description')}</Label>
                                        <Input 
                                            value={formData.description} 
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            placeholder={t('fin.payment.descriptionPlaceholder')}
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
                                            t('fin.payment.save')
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Payments Table */}
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto w-full">
                            <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                                        {t('fin.payment.transactionId')}
                                    </TableHead>
                                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                                        {t('fin.payment.method')}
                                    </TableHead>
                                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                                        {t('fin.payment.amount')}
                                    </TableHead>
                                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                                        {t('fin.payment.date')}
                                    </TableHead>
                                    <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                                        {t('fin.payment.status')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.length > 0 ? (
                                    payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-mono text-sm">
                                                {payment.id.slice(0, 8)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getMethodIcon(payment.paymentMethod)}
                                                    <span>
                                                        {payment.paymentMethod 
                                                            ? t(`fin.payment.method.${payment.paymentMethod}`)
                                                            : t('fin.payment.method.unknown')
                                                        }
                                                    </span>
                                                </div>
                                            </TableCell>
                                      
                                            <TableCell>
                                                {new Date(payment.transactionDate).toLocaleDateString(
                                                    isRTL ? 'ar-SA' : 'en-US'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(payment.status)}`}>
                                                    {t(`fin.status.${payment.status}`)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                            {t('fin.payment.noData')}
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
