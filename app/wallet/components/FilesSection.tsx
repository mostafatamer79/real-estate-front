import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { FileText, Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/context/LanguageContext'
import InvoiceModal from '@/app/src/components/invoice'

interface FilesSectionProps {
    files: any[];
}

const FilesSection: React.FC<FilesSectionProps> = ({ files }) => {
    const { t } = useLanguage()
    const [showInvoiceModal, setShowInvoiceModal] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)

    const handleViewFile = (file: any) => {
        if (file.type === 'invoice' && file.raw) {
            const inv = file.raw;
            const serviceRequest = {
                id: inv.id,
                invoiceNumber: inv.id.substring(0, 8).toUpperCase(), // or inv.invoiceNumber if available
                createdAt: inv.createdAt,
                clientName: 'N/A',
                phone: 'N/A',
                city: 'N/A',
                district: 'N/A',
                serviceType: inv.description || t('wallet.service.default'),
                category: 'other',
                quantity: 1,
                price: Number(inv.amount),
                description: inv.description,
                status: 'completed',
                paymentStatus: inv.status === 'paid' ? 'paid' : 'unpaid',
                 estimatedCost: 0,
                 finalCost: 0,
                 assignedAgentId: null,
                 assignedAt: null,
                 completedAt: null,
                 invoiceGenerated: true,
                 userId: '',
                 updatedAt: ''
            };
            setSelectedInvoice(serviceRequest);
            setShowInvoiceModal(true);
        } else {
            // For other files, or fallback, just open URL
            if (file.url) {
                window.open(file.url, '_blank');
            }
        }
    }

    return (
        <Card className='bg-white border-0 shadow-lg rounded-[2rem] overflow-hidden'>
            <div className='p-8'>
                <div className='mb-8'>
                    <h2 className='text-2xl font-black text-slate-900 tracking-tight mb-1'>{t('wallet.files')}</h2>
                    <p className='text-slate-500 font-bold text-sm'>{t('wallet.desc.files')}</p>
                </div>

                <div className='rounded-2xl border border-slate-100 overflow-hidden'>
                    <Table>
                        <TableHeader className='bg-slate-50/50'>
                            <TableRow>
                                <TableHead className='text-right py-5 font-black text-slate-900'>{t('wallet.table.service')}</TableHead>
                                <TableHead className='text-right py-5 font-black text-slate-900'>{t('wallet.commission.propertyType')}</TableHead>
                                <TableHead className='text-right py-5 font-black text-slate-900'>{t('wallet.table.date')}</TableHead>
                                <TableHead className='text-center py-5 font-black text-slate-900'>{t('wallet.commission.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {files.map((file, index) => (
                                <TableRow key={index} className='hover:bg-slate-50/50 transition-colors group'>
                                    <TableCell className='py-4'>
                                        <div className='flex items-center gap-3'>
                                            <div className='p-2 bg-blue-50 text-blue-600 rounded-lg'>
                                                <FileText className='w-5 h-5' />
                                            </div>
                                            <span className='font-bold text-slate-700'>{file.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className='text-right py-4'>
                                        <span className='px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest'>
                                            {file.type === 'invoice' ? t('wallet.invoice') : t('wallet.commission')}
                                        </span>
                                    </TableCell>
                                    <TableCell className='text-right text-slate-400 font-bold py-4'>
                                        {file.date ? new Date(file.date).toLocaleDateString('en-CA') : ''}
                                    </TableCell>
                                    <TableCell className='text-center py-4'>
                                        <div className='flex items-center justify-center gap-2'>
                                            <Button variant='ghost' size='sm' className='h-8 w-8 p-0 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900'
                                                onClick={() => handleViewFile(file)}
                                            >
                                                <Eye className='w-4 h-4' />
                                            </Button>
                                            <Button variant='ghost' size='sm' className='h-8 w-8 p-0 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900'
                                                onClick={() => window.open(file.url, '_blank')}
                                            >
                                                <Download className='w-4 h-4' />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {files.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className='text-center py-8 text-slate-400'>
                                        {t('common.noData')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

             <InvoiceModal 
                isOpen={showInvoiceModal}
                onClose={() => setShowInvoiceModal(false)}
                serviceRequest={selectedInvoice}
            />
        </Card>
    )
}

export default FilesSection
