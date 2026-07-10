import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useLanguage } from '@/context/LanguageContext'
import { Plus, Wallet, ArrowDownCircle, ArrowUpCircle, Loader2, CreditCard, Banknote, ShieldCheck } from 'lucide-react'
import { Invoice } from './types'
import InvoiceModal from '@/app/src/components/invoice'
import { apiClient } from '@/lib/client'
import toast from 'react-hot-toast'
import PaymentMethodsModal from '@/components/Payment/PaymentMethodsModal'
import { SaudiRiyalAmount, SaudiRiyalSymbol } from '@/components/ui/saudi-riyal'

// Define extended Invoice interface to include all necessary fields
interface ExtendedInvoice extends Invoice {
    id: string; // Add ID for key
    originalStatus: string; // Add originalStatus if needed for logic
    // Add other fields from API response if available and needed for modal
}

interface InvoicesSectionProps {
    invoices: any[]; // Changed to any[] to accept the mapped invoices from page.tsx which might have more fields
    onRefresh?: () => void;
    balance?: number;
}

const InvoicesSection: React.FC<InvoicesSectionProps> = ({ invoices, onRefresh, balance = 0 }) => {
    const { t } = useLanguage()
    const [showInvoiceModal, setShowInvoiceModal] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [processingId, setProcessingId] = useState<string | null>(null)
    
    // Balance Action States
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
    const [addAmount, setAddAmount] = useState('')
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [paymentInvoice, setPaymentInvoice] = useState<any>(null)

    const handleDecision = async (id: string, decision: 'accepted' | 'rejected', invoice?: any) => {
        setProcessingId(id);
        try {
            await apiClient.put(`/service-requests/${id}/client-decision`, { decision });
            toast.success(decision === 'accepted' ? t('legal.decision.successAccept') : t('legal.decision.successReject'));
            
            if (decision === 'accepted' && invoice) {
                setPaymentInvoice(invoice);
                setIsPaymentModalOpen(true);
            }
            if (onRefresh) onRefresh();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || t('legal.decision.error'));
        } finally {
            setProcessingId(null);
        }
    }

    const handleAddCredit = () => {
        setIsSubmitting(true);
        // Simulate a delay or API call
        setTimeout(() => {
            toast.success("سيتم توفير خيارات شحن الرصيد قريباً");
            setIsSubmitting(false);
            setShowAddDialog(false);
            setAddAmount('');
        }, 1000);
    };

    const handleWithdrawal = async () => {
        if (!withdrawAmount || isNaN(Number(withdrawAmount))) return;
        if (Number(withdrawAmount) > balance) {
            toast.error("المبلغ يتجاوز الرصيد المتاح");
            return;
        }

        setIsSubmitting(true);
        try {
            await apiClient.post('/financial/withdraw', { amount: Number(withdrawAmount) });
            toast.success("تم تقديم طلب السحب بنجاح");
            setShowWithdrawDialog(false);
            setWithdrawAmount('');
            if (onRefresh) onRefresh();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "فشل طلب السحب");
        } finally {
            setIsSubmitting(false);
        }
    };

    const mapToServiceRequest = (invoice: any) => {
        return {
            id: invoice.id,
            invoiceNumber: invoice.invoice,
            createdAt: invoice.date,
            clientName: 'N/A',
            phone: 'N/A',
            city: 'N/A',
            district: 'N/A',
            serviceType: invoice.service,
            category: 'other',
            quantity: 1,
            price: parseFloat(invoice.amount.replace(/,/g, '')),
            description: invoice.service,
            status: 'completed',
            paymentStatus: invoice.originalStatus === 'paid' ? 'paid' : 'unpaid',
            estimatedCost: 0,
            finalCost: 0,
            assignedAgentId: null,
            assignedAt: null,
            completedAt: null,
            invoiceGenerated: true,
            userId: '',
            updatedAt: '',
            isPendingDecision: invoice.isPendingDecision
        };
    };

    const handleViewInvoice = (invoice: any) => {
        setSelectedInvoice(mapToServiceRequest(invoice));
        setShowInvoiceModal(true);
    }

    // Sync selectedInvoice when invoices prop changes (e.g. after refresh)
    React.useEffect(() => {
        if (selectedInvoice && invoices) {
            const updated = invoices.find(inv => inv.id === selectedInvoice.id);
            if (updated) {
                setSelectedInvoice(mapToServiceRequest(updated));
            }
        }
    }, [invoices]);

    return (
        <div className='flex flex-col gap-6 w-full'>
            {/* Balance Card - Keeping it here or moving to a separate component? Assuming Invoices section includes balance for now based on layout */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Card className='md:col-span-2 relative overflow-hidden bg-slate-900 border-none shadow-xl rounded-[1.25rem] p-6'>
                    {/* Background Gradients */}
                    <div className='absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2' />
                    <div className='absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2' />
                    
                    <CardContent className='relative z-10 p-0'>
                        <div className="mb-4 w-full rounded-2xl border border-white/10 bg-card/5 p-2 backdrop-blur-md">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-2">
                                <div
                                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border"
                                    style={{
                                        backgroundColor: "var(--soon-badge-bg, #ffffff)",
                                        color: "var(--soon-badge-text, #000000)",
                                        borderColor: "var(--soon-badge-bg, #ffffff)",
                                    }}
                                >
                                    <span className="inline-block h-2 w-2 rounded-full opacity-70" style={{ backgroundColor: "var(--soon-badge-text, #000000)" }} />
                                    {t("common.soon") || "قريباً"}
                                </div>
                                <div className='flex gap-2 w-full md:w-auto'>
                                    <Button 
                                        onClick={() => setShowAddDialog(true)}
                                        disabled
                                        className='flex-1 md:flex-none h-10 px-5 bg-card text-slate-900 hover:bg-muted font-bold rounded-xl text-xs shadow-lg shadow-white/5 transition-transform hover:-translate-y-0.5'
                                    >
                                        <ArrowDownCircle className='mr-1.5 h-4 w-4' />
                                        {t('wallet.balance.add')}
                                        <span
                                            className="ml-2 text-[9px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5"
                                            style={{
                                                backgroundColor: "var(--soon-badge-bg, #ffffff)",
                                                color: "var(--soon-badge-text, #000000)",
                                                borderColor: "var(--soon-badge-bg, #ffffff)",
                                            }}
                                        >
                                            {t("common.soon") || "قريباً"}
                                        </span>
                                    </Button>
                                    <Button 
                                        onClick={() => setShowWithdrawDialog(true)}
                                        disabled
                                        className='flex-1 md:flex-none h-10 px-5 bg-card/10 text-white hover:bg-card/20 font-bold rounded-xl text-xs backdrop-blur-md border border-white/10 transition-transform hover:-translate-y-0.5'
                                    >
                                        <ArrowUpCircle className='mr-1.5 h-4 w-4' />
                                        {t('wallet.balance.withdraw')}
                                        <span
                                            className="ml-2 text-[9px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5"
                                            style={{
                                                backgroundColor: "var(--soon-badge-bg, #ffffff)",
                                                color: "var(--soon-badge-text, #000000)",
                                                borderColor: "var(--soon-badge-bg, #ffffff)",
                                            }}
                                        >
                                            {t("common.soon") || "قريباً"}
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-8'>
                            <div className='space-y-1 pl-4 pb-2'>
                                <div className='flex items-center gap-2 mb-2'>
                                    <div className='p-2 bg-card/10 rounded-xl backdrop-blur-md border border-white/10'>
                                        <Wallet className='h-5 w-5 text-white' />
                                    </div>
                                    <span className='text-slate-400 font-medium text-sm tracking-wide'>{t('wallet.balance.label')}</span>
                                </div>
                                <div className='flex items-baseline gap-2'>
                                    <h2 className='text-4xl font-black text-white tracking-tighter'>
                                        {Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </h2>
                                    <SaudiRiyalSymbol className='text-slate-400' iconClassName='h-4 w-4' />
                                </div>
                            </div>
                            
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices Table */}
            <Card className='bg-card border-0 shadow-lg rounded-[1.25rem] overflow-hidden'>
               <div className='p-8'>
                    <div className='flex items-center justify-between mb-8'>
                        <div>
                            <h2 className='text-2xl font-black text-slate-900 tracking-tight mb-1'>{t('wallet.invoices.title')}</h2>
                            <p className='text-slate-500 font-bold text-sm'>{t('wallet.invoices.manageDesc')}</p>
                        </div>
                        
            
                    </div>

                    <div className='rounded-2xl border border overflow-hidden'>
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 w-full">
<Table>
                            <TableHeader className='bg-muted/50'>
                                <TableRow>
                                    <TableHead className='text-right py-5 font-black text-slate-900 whitespace-nowrap'>{t('wallet.table.invoiceNo')}</TableHead>
                                    <TableHead className='text-right py-5 font-black text-slate-900 whitespace-nowrap'>{t('wallet.table.service')}</TableHead>
                                    <TableHead className='text-right py-5 font-black text-slate-900 whitespace-nowrap'>{t('wallet.table.date')}</TableHead>
                                    <TableHead className='text-right py-5 font-black text-slate-900 whitespace-nowrap'>{t('wallet.table.amount')}</TableHead>
                                    <TableHead className='text-right py-5 font-black text-slate-900 whitespace-nowrap'>{t('wallet.table.status')}</TableHead>
                                    <TableHead className='text-left py-5 font-black text-slate-900 whitespace-nowrap'>{t('wallet.commission.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((invoice, index) => (
                                    <TableRow key={index} className='hover:bg-muted/50 transition-colors group'>
                                        <TableCell className='font-bold text-slate-700 py-4 whitespace-nowrap'>{invoice.invoice}</TableCell>
                                        <TableCell className='font-medium text-slate-600 py-4 whitespace-nowrap'>{invoice.service}</TableCell>
                                        <TableCell className='text-slate-500 py-4 whitespace-nowrap'>{invoice.date}</TableCell>
                                        <TableCell className='font-black text-slate-900 py-4 whitespace-nowrap'><SaudiRiyalAmount amount={Number(String(invoice.amount).replace(/,/g, '')) || 0} locale="en-US" /></TableCell>
                                        <TableCell className="py-4 text-center whitespace-nowrap">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                invoice.isSubscriptionActive || invoice.status === t('wallet.paid') || invoice.status === 'مدفوع' 
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                : invoice.isUnderReview
                                                    ? 'bg-muted text-slate-500 border border'
                                                : invoice.isPendingDecision && (invoice.status !== t('wallet.paid') && invoice.status !== 'مدفوع' && invoice.status !== 'تم الدفع')
                                                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                                    : invoice.status === t('wallet.paid') || invoice.status === 'تم الدفع' || invoice.status === 'مدفوع'
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                                            }`}>
                                                {invoice.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className='py-4'>
                                            <div className='flex justify-end gap-2 transition-opacity'>
                                                <Button 
                                                    size='sm' 
                                                    variant='ghost' 
                                                    className='text-slate-500 hover:text-slate-900 font-bold'
                                                    onClick={() => handleViewInvoice(invoice)}
                                                >
                                                    {t('common.view')}
                                                </Button>
                                                {invoice.isSubscriptionActive ? (
                                                    <span className="text-[10px] font-bold text-emerald-600 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">نشط</span>
                                                ) : invoice.isUnderReview ? (
                                                    <span className="text-[10px] font-bold text-slate-400 px-3 py-1.5 bg-muted rounded-lg border border">بانتظار التسعير</span>
                                                ) : (invoice.isPendingDecision && invoice.status !== t('wallet.paid') && invoice.status !== 'دفع') ? (
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            size='sm' 
                                                            className='bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-lg'
                                                            onClick={(e) => { e.stopPropagation(); handleDecision(invoice.id, 'accepted', {
                                                                ...invoice,
                                                                amount: invoice.amount // Passing amount for modal price
                                                            }); }}
                                                            disabled={processingId === invoice.id}
                                                        >
                                                            {t('legal.decision.accept')}
                                                        </Button>
                                                        {invoice.originalDecision !== 'rejected' && (
                                                            <Button 
                                                                size='sm' 
                                                                className='bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold rounded-lg'
                                                                onClick={(e) => { e.stopPropagation(); handleDecision(invoice.id, 'rejected'); }}
                                                                disabled={processingId === invoice.id}
                                                            >
                                                                {t('legal.decision.reject')}
                                                            </Button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    (invoice.status !== t('wallet.paid') && invoice.status !== 'مدفوع') && (
                                                        <Button 
                                                            size='sm' 
                                                            className='bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-lg'
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPaymentInvoice(invoice);
                                                                setIsPaymentModalOpen(true);
                                                            }}
                                                        >
                                                            {invoice.isSubscription ? 'دفع الاشتراك' : t('wallet.pay')}
                                                        </Button>
                                                    )
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
</div>
                    </div>
                </div> 
            </Card>

             <InvoiceModal 
                isOpen={showInvoiceModal}
                onClose={() => setShowInvoiceModal(false)}
                serviceRequest={selectedInvoice}
                onDecision={handleDecision}
                onPay={(inv) => {
                    setPaymentInvoice(inv);
                    setIsPaymentModalOpen(true);
                }}
                isPendingDecision={selectedInvoice?.isPendingDecision}
            />

            {/* Add Balance Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="w-[95vw] sm:max-w-md rounded-[1.25rem] p-4 sm:p-8" dir="rtl">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900">{t('wallet.balance.addTitle') || 'إضافة رصيد للمحفظة'}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-bold text-slate-500 mb-2 block">{t('wallet.balance.enterAmount') || 'أدخل المبلغ'}</label>
                            <div className="relative">
                                <Input 
                                    type="number"
                                    value={addAmount}
                                    onChange={(e) => setAddAmount(e.target.value)}
                                    className="h-16 text-xl sm:text-2xl font-black rounded-2xl border-2 border focus:border-slate-900 transition-all pl-12"
                                    placeholder="0.00"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><SaudiRiyalSymbol iconClassName="h-4 w-4" /></span>
                            </div>
                        </div>

                     

                        <div className="space-y-4 pt-4 border-t border">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('wallet.balance.paymentMethod') || 'طريقة الدفع'}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl border-2 border-slate-900 bg-muted flex items-center gap-3">
                                    <CreditCard className="w-6 h-6 text-slate-900" />
                                    <span className="font-bold text-slate-900">بطاقة صراف</span>
                                </div>
                                <div className="p-4 rounded-2xl border-2 border opacity-40 flex items-center gap-3">
                                    <Banknote className="w-6 h-6 text-slate-400" />
                                    <span className="font-bold text-slate-400">حوالة بنكية</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    <DialogFooter className="mt-8 flex-col sm:flex-row gap-3">
                        <Button 
                            onClick={handleAddCredit}
                            disabled={!addAmount || isSubmitting}
                            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg"
                        >
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : t('wallet.balance.confirm') || 'تأكيد عملية الشحن'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Withdraw Balance Dialog */}
            <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
                <DialogContent className="w-[95vw] sm:max-w-md rounded-[1.25rem] p-4 sm:p-8" dir="rtl">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900">{t('wallet.balance.withdrawTitle') || 'طلب سحب رصيد'}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                        <div className="p-3 sm:p-6 bg-slate-900 rounded-[1.25rem] text-white">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t('wallet.balance.availableForWithdraw') || 'الرصيد القابل للسحب'}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl sm:text-4xl font-black">{Number(balance).toLocaleString()}</h3>
                                <SaudiRiyalSymbol className="text-slate-400" iconClassName="h-3.5 w-3.5" />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-slate-500 mb-2 block">{t('wallet.balance.withdrawAmount') || 'المبلغ المراد سحبه'}</label>
                            <div className="relative">
                                <Input 
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="h-16 text-xl sm:text-2xl font-black rounded-2xl border-2 border focus:border-slate-900 transition-all pl-12"
                                    placeholder="0.00"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><SaudiRiyalSymbol iconClassName="h-4 w-4" /></span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-bold">* قد تستغرق عملية التحويل 24-48 ساعة عمل</p>
                        </div>
                    </div>

                    <DialogFooter className="mt-8 flex-col sm:flex-row gap-3">
                        <Button 
                            onClick={handleWithdrawal}
                            disabled={!withdrawAmount || isSubmitting}
                            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg"
                        >
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : t('wallet.balance.confirmWithdraw') || 'تأكيد طلب السحب'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <PaymentMethodsModal 
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                invoiceId={paymentInvoice?.isSubscription ? undefined : paymentInvoice?.id}
                subscriptionId={paymentInvoice?.isSubscription ? paymentInvoice?.subscriptionId : undefined}
                price={parseFloat(paymentInvoice?.amount?.replace(/,/g, '') || '0')}
                onPaymentSuccess={async () => {
                    if (onRefresh) onRefresh();
                    toast.success(t('payment.success') || "تم الدفع بنجاح");
                }}
            />
        </div>
    )
}

export default InvoicesSection
