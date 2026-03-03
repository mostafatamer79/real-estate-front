"use client";
import React from 'react'
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardFooter, CardHeader, CardTitle } from './ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Download, Printer, X, CheckCircle, XCircle, FileText, Calendar, User, Phone, MapPin, Hash, DollarSign, Loader2 } from 'lucide-react'

// Define ServiceRequest type
interface ServiceRequest {
    id: string;
    category: string;
    serviceType: string;
    clientName: string;
    phone: string;
    city: string;
    district: string;
    quantity: number;
    description: string;
    status: string;
    estimatedCost: number | null;
    finalCost: number | null;
    assignedAgentId: string | null;
    assignedAt: string | null;
    completedAt: string | null;
    invoiceGenerated: boolean;
    invoiceNumber: string;
    userId: string;
    price: number;
    paymentStatus: 'paid' | 'unpaid';
    createdAt: string;
    updatedAt: string;
}

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    serviceRequest?: ServiceRequest | null;
    onDecision?: (id: string, decision: 'accepted' | 'rejected', invoice?: any) => Promise<void>;
    onPay?: (invoice: any) => void;
    isPendingDecision?: boolean;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, serviceRequest, onDecision, onPay, isPendingDecision }) => {
    const { t, language } = useLanguage();
    const [isProcessing, setIsProcessing] = React.useState(false);
    if (!isOpen) return null

    // If no service request provided, use sample data
    const invoiceData = serviceRequest ? {
        invoiceNumber: serviceRequest.invoiceNumber || `INV-${Date.now()}`,
        issueDate: new Date(serviceRequest.createdAt).toLocaleDateString('ar-SA'),
        client: {
            name: serviceRequest.clientName,
            phone: serviceRequest.phone,
            city: serviceRequest.city,
            district: serviceRequest.district
        },
        service: {
            type: serviceRequest.serviceType,
            category: serviceRequest.category,
            quantity: serviceRequest.quantity,
            price: serviceRequest.price,
            description: serviceRequest.description || 'لا يوجد وصف',
            status: serviceRequest.status,
            paymentStatus: serviceRequest.paymentStatus
        },
        fees: {
            servicePrice: serviceRequest.price * serviceRequest.quantity,
            vat: (serviceRequest.price * serviceRequest.quantity) * 0.15, // 15% VAT
            commission: 0, // Could be calculated based on service type
            siteCommission: 0, // New: Site Commission
            documentationFee: 0, // Could be added if applicable
        }
    } : {
        invoiceNumber: 'INV-2025-001',
        issueDate: '21/11/2025',
        client: {
            name: 'احمد محمد',
            phone: '+966501234567',
            city: 'الرياض',
            district: 'حي النرجس'
        },
        service: {
            type: 'خدمة الغاز',
            category: 'خدمات ما بعد الشراء',
            quantity: 1,
            price: 150,
            description: 'تركيب وتوصيل خدمة الغاز للمنزل',
            status: 'completed',
            paymentStatus: 'unpaid' as const
        },
        fees: {
            servicePrice: 150,
            vat: 22.5, // 15%
            commission: 0,
            siteCommission: 0,
            documentationFee: 0,
        }
    }

    const totalAmount = invoiceData.fees.servicePrice + invoiceData.fees.vat +
                       invoiceData.fees.commission + invoiceData.fees.siteCommission + invoiceData.fees.documentationFee

    const getStatusText = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'pending': t('bm.status.pending'),
            'assigned': t('common.details'),
            'in_progress': t('bm.status.processing'),
            'completed': t('bm.status.completed'),
            'cancelled': t('bm.status.cancelled')
        };
        return statusMap[status] || status;
    };

    const getCategoryText = (category: string) => {
        const categoryMap: { [key: string]: string } = {
            'postPurchase': 'خدمات ما بعد الشراء',
            'legal': 'الخدمات القانونية',
            'construction': 'استشارات العقارية',
            'marketing': 'خدمات التسويق',
            'leasing': 'خدمات التأجير ',
            'other': 'خدمات أخرى'
        };
        return categoryMap[category] || category;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        // In a real app, this would generate and download a PDF
        alert('سيتم تنزيل الفاتورة كملف PDF');
    };

    return (
        <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4 print:block print:p-0'
            onClick={onClose}
            dir="rtl"
        >
            <div
                className='bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-4xl my-8 text-black animate-in fade-in zoom-in duration-200 print:shadow-none print:border-0 print:w-full print:max-w-none print:my-0'
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header - Hide in print */}
                <div className='flex justify-between items-center p-6 border-b border-gray-200 print:hidden'>
                    <h1 className='text-2xl font-bold'>{t('invoice.title')}</h1>
                    <div className='flex items-center gap-2'>
                        <button
                            onClick={handlePrint}
                            className='p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2'
                        >
                            <Printer className='h-5 w-5' />
                            <span>{t('invoice.print')}</span>
                        </button>
                        <button
                            onClick={handleDownload}
                            className='p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2'
                        >
                            <Download className='h-5 w-5' />
                            <span>{t('invoice.download')}</span>
                        </button>
                        <button
                            onClick={onClose}
                            className='p-2 hover:bg-slate-100 rounded-full transition-colors'
                        >
                            <X className='h-6 w-6 text-gray-600' />
                        </button>
                    </div>
                </div>

                {/* Invoice Content */}
                <div className='p-6 max-h-[calc(100vh-200px)] overflow-y-auto print:max-h-none print:overflow-visible'>
                    <Card className='bg-white border-0 shadow-none print:shadow-none'>
                        <CardHeader className='border-b border-gray-200 pb-6 print:border-b-2'>
                            <div className='flex justify-between items-start'>
                                <div className='space-y-4'>
                                    <div className='flex items-center gap-3'>
                                        <FileText className='h-8 w-8 text-blue-600' />
                                        <div>
                                            <CardTitle className='text-3xl font-bold text-gray-900'>{t('invoice.title')}</CardTitle>
                                            <p className='text-gray-600'>{t('project.name')} - {t('pm.legal.title')}</p>
                                        </div>
                                    </div>

                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
                                        <div className='space-y-2'>
                                            <div className='flex items-center gap-2'>
                                                <Hash className='h-4 w-4 text-gray-500' />
                                                <span className='font-semibold'>{t('invoice.number')}:</span>
                                                <span className='font-mono text-blue-600'>{invoiceData.invoiceNumber}</span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <Calendar className='h-4 w-4 text-gray-500' />
                                                <span className='font-semibold'>{t('invoice.date')}:</span>
                                                <span>{invoiceData.issueDate}</span>
                                            </div>
                                        </div>
                                        <div className='space-y-2'>
                                            <div className='flex items-center gap-2'>
                                                {invoiceData.service.paymentStatus === 'paid' ? (
                                                    <CheckCircle className='h-4 w-4 text-green-500' />
                                                ) : (
                                                    <XCircle className='h-4 w-4 text-red-500' />
                                                )}
                                                <span className='font-semibold'>{t('invoice.paymentStatus')}:</span>
                                                <span className={`font-bold ${invoiceData.service.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {invoiceData.service.paymentStatus === 'paid' ? t('invoice.paid') : t('invoice.unpaid')}
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <span className='font-semibold'>{t('invoice.serviceStatus')}:</span>
                                                <span className={`px-2 py-1 rounded text-xs ${invoiceData.service.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {getStatusText(invoiceData.service.status)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <div className='p-6 space-y-8 print:space-y-6'>
                            {/* Client Data Section */}
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                                <div>
                                    <h3 className='text-xl font-bold mb-4 flex items-center gap-2'>
                                        <User className='h-5 w-5 text-blue-600' />
                                        {t('invoice.clientData')}
                                    </h3>
                                    <div className='bg-slate-50 p-4 rounded-lg space-y-3'>
                                        <div className='flex items-center gap-2'>
                                            <User className='h-4 w-4 text-gray-500' />
                                            <div>
                                                <p className='font-semibold'>{t('bm.form.name')}</p>
                                                <p className='text-gray-700'>{invoiceData.client.name}</p>
                                            </div>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <Phone className='h-4 w-4 text-gray-500' />
                                            <div>
                                                <p className='font-semibold'>{t('bm.form.phone')}</p>
                                                <p className='text-gray-700'>{invoiceData.client.phone}</p>
                                            </div>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <MapPin className='h-4 w-4 text-gray-500' />
                                            <div>
                                                <p className='font-semibold'>{t('offer.location')}</p>
                                                <p className='text-gray-700'>{invoiceData.client.city} - {invoiceData.client.district}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className='text-xl font-bold mb-4 flex items-center gap-2'>
                                        <FileText className='h-5 w-5 text-green-600' />
                                        تفاصيل الخدمة
                                    </h3>
                                    <div className='bg-green-50 p-4 rounded-lg space-y-3'>
                                        <div>
                                            <p className='font-semibold'>{t('wallet.commission.table.service')}</p>
                                            <p className='text-gray-700'>{invoiceData.service.type}</p>
                                        </div>

                                        <div>
                                            <p className='font-semibold'>{t('wallet.commission.units')}</p>
                                            <p className='text-gray-700'>{invoiceData.service.quantity}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Service Description */}
                            <div>
                                <h3 className='text-xl font-bold mb-4'>{t('invoice.serviceDesc')}</h3>
                                <div className='bg-slate-50 p-4 rounded-lg border border-blue-100'>
                                    <p className='text-gray-700 leading-relaxed'>{invoiceData.service.description}</p>
                                </div>
                            </div>

                            {/* Fee Details Table */}
                            <div>
                                <h3 className='text-xl font-bold mb-4 flex items-center gap-2'>
                                    <DollarSign className='h-5 w-5 text-purple-600' />
                                    تفاصيل الرسوم
                                </h3>
                                <div className='overflow-x-auto'>
                                    <Table className='border border-gray-200'>
                                        <TableHeader>
                                            <TableRow className='bg-slate-50'>
                                                <TableHead className='text-right font-bold text-gray-700'>{t('invoice.item')}</TableHead>
                                                <TableHead className='text-right font-bold text-gray-700'>{t('wallet.commission.units')}</TableHead>
                                                <TableHead className='text-right font-bold text-gray-700'>{t('invoice.unitPrice')}</TableHead>
                                                <TableHead className='text-right font-bold text-gray-700'>{t('invoice.total')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className='text-right font-medium'>{invoiceData.service.type}</TableCell>
                                                <TableCell className='text-right'>{invoiceData.service.quantity}</TableCell>
                                                <TableCell className='text-right'>{invoiceData.service.price.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')} {t('chat.currency')}</TableCell>
                                                <TableCell className='text-right'>{invoiceData.fees.servicePrice.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')} {t('chat.currency')}</TableCell>
                                            </TableRow>

                                            {/* VAT Row */}
                                            <TableRow className='bg-slate-50'>
                                                <TableCell colSpan={3} className='text-right font-medium'>
                                                    {t('invoice.vat')}
                                                </TableCell>
                                                <TableCell className='text-right'>{invoiceData.fees.vat.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')} {t('chat.currency')}</TableCell>
                                            </TableRow>

                                            {/* Commission if applicable */}
                                            {invoiceData.fees.commission > 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className='text-right font-medium'>
                                                        {t('invoice.serviceCommission')}
                                                    </TableCell>
                                                    <TableCell className='text-right'>{invoiceData.fees.commission.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')} {t('chat.currency')}</TableCell>
                                                </TableRow>
                                            )}

                                            {/* Site Commission */}
                                            <TableRow>
                                                <TableCell colSpan={3} className='text-right font-medium'>
                                                    {t('invoice.siteCommission')}
                                                </TableCell>
                                                <TableCell className='text-right'>{invoiceData.fees.siteCommission.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')} {t('chat.currency')}</TableCell>
                                            </TableRow>

                                            {/* Documentation fee if applicable */}
                                            {invoiceData.fees.documentationFee > 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className='text-right font-medium'>
                                                        {t('invoice.docFee')}
                                                    </TableCell>
                                                    <TableCell className='text-right'>{invoiceData.fees.documentationFee.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')} {t('chat.currency')}</TableCell>
                                                </TableRow>
                                            )}

                                            {/* Total Row */}
                                            <TableRow className='bg-slate-50 font-bold border-t-2 border-blue-200'>
                                                <TableCell colSpan={3} className='text-right text-blue-800'>
                                                    {t('invoice.finalTotal')}
                                                </TableCell>
                                                <TableCell className='text-right text-blue-800 text-lg'>
                                                    {totalAmount.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')} {t('chat.currency')}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Payment Terms and Notes */}
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                <div className='bg-yellow-50 p-4 rounded-lg border border-yellow-100'>
                                    <h4 className='font-bold text-yellow-800 mb-2'>{t('invoice.paymentTerms')}</h4>
                                    <ul className='space-y-1 text-sm text-yellow-700'>
                                        <li>• {t('payment.amountRequired')}</li>
                                    </ul>
                                </div>

                                <div className='bg-slate-50 p-4 rounded-lg border border-gray-200'>
                                    <h4 className='font-bold text-gray-800 mb-2'>{t('invoice.importantNotes')}</h4>
                                    <ul className='space-y-1 text-sm text-gray-700'>
                                        <li>• {t('bm.status.processing')}</li>
                                        <li>• {t('cs.desc')}</li>
                                        <li>• {t('invoice.vat')}</li>
                                    </ul>
                                </div>
                            </div>

                     

                            {/* Action Buttons - Hide in print */}
                            <CardFooter className='pt-6 flex justify-between print:hidden'>
                                <div className='flex gap-4'>
                                    <button
                                        onClick={handlePrint}
                                        className='px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 font-bold'
                                    >
                                        <Printer className='h-4 w-4' />
                                        {t('invoice.printBtn')}
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className='px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 font-bold'
                                    >
                                        <Download className='h-4 w-4' />
                                        {t('invoice.downloadBtn')}
                                    </button>
                                </div>

                                <div className='flex gap-4'>
                                    {isPendingDecision && invoiceData.service.paymentStatus !== 'paid' ? (
                                        <>
                                            <button 
                                                onClick={async () => {
                                                    if (!serviceRequest?.id || !onDecision) return;
                                                    setIsProcessing(true);
                                                    await onDecision(serviceRequest.id, 'accepted', serviceRequest);
                                                    setIsProcessing(false);
                                                    onClose();
                                                }}
                                                disabled={isProcessing}
                                                className='px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 font-bold disabled:opacity-50'
                                            >
                                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className='h-4 w-4' />}
                                                {t('legal.decision.accept')}
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    if (!serviceRequest?.id || !onDecision) return;
                                                    setIsProcessing(true);
                                                    await onDecision(serviceRequest.id, 'rejected');
                                                    setIsProcessing(false);
                                                    onClose();
                                                }}
                                                disabled={isProcessing}
                                                className='px-8 py-3 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors flex items-center gap-2 font-bold disabled:opacity-50'
                                            >
                                                {t('legal.decision.reject')}
                                            </button>
                                        </>
                                    ) : (
                                        !isPendingDecision && invoiceData.service.paymentStatus === 'unpaid' && (
                                            <button 
                                                onClick={() => {
                                                    if (onPay) onPay(serviceRequest);
                                                    onClose();
                                                }}
                                                className='px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-bold'
                                            >
                                                <DollarSign className='h-4 w-4' />
                                                {t('invoice.payNow')}
                                            </button>
                                        )
                                    )}
                                </div>
                            </CardFooter>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .fixed, .fixed * {
                        visibility: visible;
                    }
                    .fixed {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto;
                        background: white;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .shadow-2xl {
                        box-shadow: none !important;
                    }
                    .rounded-xl {
                        border-radius: 0 !important;
                    }
                    .border {
                        border: 1px solid #ddd !important;
                    }
                }
            `}</style>
        </div>
    )
}

export default InvoiceModal