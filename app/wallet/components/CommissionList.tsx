import React, { useState } from 'react'
import { commissionApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useLanguage } from '@/context/LanguageContext'
import { Commission } from './types'
import { SaudiRiyalAmount } from '@/components/ui/saudi-riyal'
import CommissionPdfGenerator from './CommissionPdfGenerator'
import { FileSearch } from 'lucide-react'
import styles from '../wallet-redesign.module.css'

interface CommissionListProps {
    onNewRequest: () => void;
    onRefresh?: () => void;
    commissions: Commission[];
    onTrackRequest?: (commission: Commission) => void;
}

const CommissionList: React.FC<CommissionListProps> = ({ onNewRequest, commissions, onTrackRequest, onRefresh }) => {
    const { t, language } = useLanguage()
    const [submittingId, setSubmittingId] = useState<string | null>(null)
    const submitDraft = async (id: string) => {
        setSubmittingId(id)
        try {
            await commissionApi.submit(id)
            toast.success(language === 'ar' ? 'تم تقديم طلب السعي للمراجعة' : 'Commission submitted for review')
            onRefresh?.()
        } catch (error: unknown) {
            const message = (error as {response?: {data?: {message?: string}}}).response?.data?.message
            toast.error(message || (language === 'ar' ? 'تعذر تقديم الطلب؛ يمكنك إعادة المحاولة' : 'Could not submit; please retry'))
        } finally { setSubmittingId(null) }
    }
    const submitButton = (commission: Commission) => commission.status === 'draft' && (
        <Button size="sm" disabled={submittingId !== null} onClick={() => submitDraft(commission.id)}>
            {submittingId === commission.id ? t('common.loading') : language === 'ar' ? 'تقديم المسودة' : 'Submit draft'}
        </Button>
    )

    return (
        <div className='flex-1 w-full min-w-0'>
            <Card className={`${styles.walletContentCard} w-full min-w-0 rounded-xl p-4 sm:p-6`}>
                <CardHeader className='pb-4 sm:pb-6 px-0'>
                    <div className='flex items-center justify-between gap-3'>
                        <CardTitle className='text-xl sm:text-2xl font-bold text-[color:var(--w-text-main)] text-right'>
                            {t('wallet.commission.title')}
                        </CardTitle>
                        <Button
                            onClick={onNewRequest}
                            className='shrink-0 px-3 sm:px-6 py-2 text-foreground dark:text-white bg-muted dark:bg-slate-800 hover:bg-muted hover:dark:bg-slate-700 rounded-lg text-sm'
                        >
                            {t('wallet.commission.request')}
                        </Button>
                    </div>
                </CardHeader>

                {/* ── Mobile card list (visible on small screens) ── */}
                <div className='sm:hidden flex flex-col gap-3'>
                    {commissions.length === 0 ? (
                        <p className='text-center text-[color:var(--w-text-secondary)] py-8 text-sm'>{t('common.noData')}</p>
                    ) : commissions.map((commission) => (
                        <div
                            key={commission.id}
                            className='bg-[var(--w-surface-muted)] border border-[var(--w-border)] rounded-xl p-4 flex flex-col gap-3 shadow-sm'
                        >
                            {/* Row 1: number + status */}
                            <div className='flex items-start justify-between gap-2'>
                                <div>
                                    <p className='text-[10px] text-[color:var(--w-text-secondary)] font-semibold mb-0.5'>
                                        {t('wallet.commission.table.number') || 'رقم الطلب'}
                                    </p>
                                    <p className='text-xs font-bold text-[color:var(--w-text-main)] font-mono leading-tight'>
                                        {commission.commissionNumber}
                                    </p>
                                </div>
                                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    commission.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    commission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    commission.status === 'paid'     ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {t(`bm.status.${commission.status}`) || t(`status.${commission.status}`) || commission.status}
                                </span>
                            </div>

                            {/* Row 2: date + type */}
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <p className='text-[10px] text-[color:var(--w-text-secondary)] font-semibold mb-0.5'>
                                        {t('wallet.date') || 'التاريخ'}
                                    </p>
                                    <p className='text-xs font-semibold text-[color:var(--w-text-main)]'>
                                        {commission.createdAt ? new Date(commission.createdAt).toLocaleDateString('en-CA') : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className='text-[10px] text-[color:var(--w-text-secondary)] font-semibold mb-0.5'>
                                        {t('wallet.commission.table.service') || 'الخدمة'}
                                    </p>
                                    <p className='text-xs font-semibold text-[color:var(--w-text-main)]'>
                                        {commission.type === 'sale' ? t('wallet.commission.type.sale') :
                                         commission.type === 'rent' ? t('wallet.commission.type.rent') : commission.type}
                                    </p>
                                </div>
                            </div>

                            {/* Row 3: amount */}
                            <div>
                                <p className='text-[10px] text-[color:var(--w-text-secondary)] font-semibold mb-0.5'>
                                    {t('wallet.commission.commissionValue') || 'قيمة السعي'}
                                </p>
                                <p className='text-sm font-bold text-[color:var(--w-text-main)]'>
                                    <SaudiRiyalAmount amount={Number(commission.commissionAmount)} locale={language === 'ar' ? 'ar-SA' : 'en-US'} />
                                </p>
                            </div>

                            {/* Row 4: Actions */}
                            <div className='flex items-center gap-2 pt-1 border-t border-slate-100'>
                                {submitButton(commission)}
                                <CommissionPdfGenerator commission={commission} />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[color:var(--w-text-secondary)] hover:text-[color:var(--w-text-main)] flex items-center gap-1.5 text-xs"
                                    onClick={() => onTrackRequest && onTrackRequest(commission)}
                                >
                                    <FileSearch className="w-4 h-4 shrink-0" />
                                    {t('wallet.commission.trackRequest') || 'متابعة الطلب'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Desktop table (hidden on small screens) ── */}
                <div className='hidden sm:block overflow-x-auto'>
                    <Table className='bg-transparent border border-border dark:border-white/20 text-black'>
                        <TableHeader className='bg-card/5 dark:bg-slate-900/5'>
                            <TableRow>
                                <TableHead className='text-right'>{t('wallet.commission.table.number')}</TableHead>
                                <TableHead className='text-right'>{t('wallet.date')}</TableHead>
                                <TableHead className='text-right'>{t('wallet.commission.table.service')}</TableHead>
                                <TableHead className='text-right'>{t('financial.status')}</TableHead>
                                <TableHead className='text-right'>{t('wallet.commission.commissionValue')}</TableHead>
                                <TableHead className='text-center'>{t('common.actions') || 'الإجراءات'}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {commissions.map((commission) => (
                                <TableRow key={commission.id} className='hover:bg-[var(--w-surface-muted)] border-b border-slate-200/10 transition-colors group'>
                                    <TableCell className='text-right font-medium'>{commission.commissionNumber}</TableCell>
                                    <TableCell className='text-right'>
                                        {commission.createdAt ? new Date(commission.createdAt).toLocaleDateString('en-CA') : '-'}
                                    </TableCell>
                                    <TableCell className='text-right'>
                                        {commission.type === 'sale' ? t('wallet.commission.type.sale') :
                                         commission.type === 'rent' ? t('wallet.commission.type.rent') : commission.type}
                                    </TableCell>
                                    <TableCell className='text-right'>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            commission.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            commission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            commission.status === 'paid'     ? 'bg-blue-100 text-blue-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {t(`bm.status.${commission.status}`) || t(`status.${commission.status}`) || commission.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className='text-right font-bold text-[color:var(--w-text-main)]'>
                                        <SaudiRiyalAmount amount={Number(commission.commissionAmount)} locale={language === 'ar' ? 'ar-SA' : 'en-US'} />
                                    </TableCell>
                                    <TableCell className='text-center'>
                                        <div className='flex items-center justify-center gap-2'>
                                            {submitButton(commission)}
                                <CommissionPdfGenerator commission={commission} />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[color:var(--w-text-secondary)] hover:text-[color:var(--w-text-main)] flex items-center gap-2"
                                                onClick={() => onTrackRequest && onTrackRequest(commission)}
                                            >
                                                <FileSearch className="w-4 h-4" />
                                                {t('wallet.commission.trackRequest') || 'متابعة الطلب'}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {commissions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className='text-center text-[color:var(--w-text-secondary)] py-10'>
                                        {t('common.noData')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}

export default CommissionList
