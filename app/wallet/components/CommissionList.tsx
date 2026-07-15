import React from 'react'
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

interface CommissionListProps {
    onNewRequest: () => void;
    commissions: Commission[];
    onTrackRequest?: (commission: Commission) => void;
}

const CommissionList: React.FC<CommissionListProps> = ({ onNewRequest, commissions, onTrackRequest }) => {
    const { t, language } = useLanguage()

    return (
        <div className='flex-1'>
            <Card className='bg-white/30 backdrop-blur-xl border border-white/30 shadow-xl rounded-xl p-6'>
                <CardHeader className='pb-6'>
                    <div className='flex items-center justify-between'>
                        <CardTitle className='text-2xl font-bold text-black text-right'>{t('wallet.commission.title')}</CardTitle>
                        <Button
                            onClick={onNewRequest}
                            className='px-6 py-2 text-white bg-slate-800 hover:bg-slate-700 rounded-lg'
                        >
                            {t('wallet.commission.request')}
                        </Button>
                    </div>
                </CardHeader>
                <div className='overflow-x-auto'>
                    <Table className='bg-transparent border border-white/20 text-black'>
                        <TableHeader className='bg-slate-900/5'>
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
                                <TableRow key={commission.id} className='hover:bg-white/30 border-b border-slate-200/10 transition-colors group'>
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
                                            commission.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {t(`bm.status.${commission.status}`) || t(`status.${commission.status}`) || commission.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className='text-right font-bold text-slate-900'>
                                        <SaudiRiyalAmount amount={Number(commission.commissionAmount)} locale={language === 'ar' ? 'ar-SA' : 'en-US'} />
                                    </TableCell>
                                    <TableCell className='text-center'>
                                        <div className='flex items-center justify-center gap-2'>
                                            <CommissionPdfGenerator commission={commission} />
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-slate-600 hover:text-slate-800 flex items-center gap-2"
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
                                    <TableCell colSpan={6} className='text-center text-gray-500 py-10'>
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
