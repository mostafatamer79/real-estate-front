"use client";
import React from 'react'
import { Card, CardFooter, CardHeader, CardTitle } from './ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Download, Printer, X, CheckCircle, XCircle, FileText, Calendar, User, Phone, MapPin, Hash, DollarSign } from 'lucide-react'

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
    isOpen: boolean
    onClose: () => void
    serviceRequest?: ServiceRequest | null
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, serviceRequest }) => {
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
            documentationFee: 0,
        }
    }

    const totalAmount = invoiceData.fees.servicePrice + invoiceData.fees.vat +
                       invoiceData.fees.commission + invoiceData.fees.documentationFee

    const getStatusText = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'pending': 'معلق',
            'assigned': 'مكلف',
            'in_progress': 'قيد التنفيذ',
            'completed': 'مكتمل',
            'cancelled': 'ملغى'
        };
        return statusMap[status] || status;
    };

    const getCategoryText = (category: string) => {
        const categoryMap: { [key: string]: string } = {
            'postPurchase': 'خدمات ما بعد الشراء',
            'legal': 'الخدمات القانونية',
            'construction': 'أعمال البناء',
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
                    <h1 className='text-2xl font-bold'>فاتورة الخدمة</h1>
                    <div className='flex items-center gap-2'>
                        <button
                            onClick={handlePrint}
                            className='p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2'
                        >
                            <Printer className='h-5 w-5' />
                            <span>طباعة</span>
                        </button>
                        <button
                            onClick={handleDownload}
                            className='p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2'
                        >
                            <Download className='h-5 w-5' />
                            <span>تحميل</span>
                        </button>
                        <button
                            onClick={onClose}
                            className='p-2 hover:bg-gray-100 rounded-full transition-colors'
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
                                            <CardTitle className='text-3xl font-bold text-gray-900'>فاتورة الخدمة</CardTitle>
                                            <p className='text-gray-600'>منصة دير عقارك - الخدمات العقارية</p>
                                        </div>
                                    </div>

                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
                                        <div className='space-y-2'>
                                            <div className='flex items-center gap-2'>
                                                <Hash className='h-4 w-4 text-gray-500' />
                                                <span className='font-semibold'>رقم الفاتورة:</span>
                                                <span className='font-mono text-blue-600'>{invoiceData.invoiceNumber}</span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <Calendar className='h-4 w-4 text-gray-500' />
                                                <span className='font-semibold'>تاريخ الإصدار:</span>
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
                                                <span className='font-semibold'>حالة الدفع:</span>
                                                <span className={`font-bold ${invoiceData.service.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {invoiceData.service.paymentStatus === 'paid' ? 'مدفوعة' : 'غير مدفوعة'}
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <span className='font-semibold'>حالة الخدمة:</span>
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
                                        بيانات العميل
                                    </h3>
                                    <div className='bg-gray-50 p-4 rounded-lg space-y-3'>
                                        <div className='flex items-center gap-2'>
                                            <User className='h-4 w-4 text-gray-500' />
                                            <div>
                                                <p className='font-semibold'>الاسم</p>
                                                <p className='text-gray-700'>{invoiceData.client.name}</p>
                                            </div>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <Phone className='h-4 w-4 text-gray-500' />
                                            <div>
                                                <p className='font-semibold'>رقم الجوال</p>
                                                <p className='text-gray-700'>{invoiceData.client.phone}</p>
                                            </div>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <MapPin className='h-4 w-4 text-gray-500' />
                                            <div>
                                                <p className='font-semibold'>الموقع</p>
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
                                            <p className='font-semibold'>نوع الخدمة</p>
                                            <p className='text-gray-700'>{invoiceData.service.type}</p>
                                        </div>
                                        <div>
                                            <p className='font-semibold'>التصنيف</p>
                                            <p className='text-gray-700'>{getCategoryText(invoiceData.service.category)}</p>
                                        </div>
                                        <div>
                                            <p className='font-semibold'>الكمية</p>
                                            <p className='text-gray-700'>{invoiceData.service.quantity}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Service Description */}
                            <div>
                                <h3 className='text-xl font-bold mb-4'>وصف الخدمة</h3>
                                <div className='bg-blue-50 p-4 rounded-lg border border-blue-100'>
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
                                            <TableRow className='bg-gray-50'>
                                                <TableHead className='text-right font-bold text-gray-700'>البند</TableHead>
                                                <TableHead className='text-right font-bold text-gray-700'>الكمية</TableHead>
                                                <TableHead className='text-right font-bold text-gray-700'>سعر الوحدة</TableHead>
                                                <TableHead className='text-right font-bold text-gray-700'>الإجمالي</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className='text-right font-medium'>{invoiceData.service.type}</TableCell>
                                                <TableCell className='text-right'>{invoiceData.service.quantity}</TableCell>
                                                <TableCell className='text-right'>{invoiceData.service.price.toLocaleString('ar-SA')} ريال</TableCell>
                                                <TableCell className='text-right'>{invoiceData.fees.servicePrice.toLocaleString('ar-SA')} ريال</TableCell>
                                            </TableRow>

                                            {/* VAT Row */}
                                            <TableRow className='bg-gray-50'>
                                                <TableCell colSpan={3} className='text-right font-medium'>
                                                    ضريبة القيمة المضافة (15%)
                                                </TableCell>
                                                <TableCell className='text-right'>{invoiceData.fees.vat.toLocaleString('ar-SA')} ريال</TableCell>
                                            </TableRow>

                                            {/* Commission if applicable */}
                                            {invoiceData.fees.commission > 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className='text-right font-medium'>
                                                        عمولة الخدمة
                                                    </TableCell>
                                                    <TableCell className='text-right'>{invoiceData.fees.commission.toLocaleString('ar-SA')} ريال</TableCell>
                                                </TableRow>
                                            )}

                                            {/* Documentation fee if applicable */}
                                            {invoiceData.fees.documentationFee > 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className='text-right font-medium'>
                                                        رسوم التوثيق
                                                    </TableCell>
                                                    <TableCell className='text-right'>{invoiceData.fees.documentationFee.toLocaleString('ar-SA')} ريال</TableCell>
                                                </TableRow>
                                            )}

                                            {/* Total Row */}
                                            <TableRow className='bg-blue-50 font-bold border-t-2 border-blue-200'>
                                                <TableCell colSpan={3} className='text-right text-blue-800'>
                                                    الإجمالي النهائي المستحق
                                                </TableCell>
                                                <TableCell className='text-right text-blue-800 text-lg'>
                                                    {totalAmount.toLocaleString('ar-SA')} ريال
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Payment Terms and Notes */}
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                <div className='bg-yellow-50 p-4 rounded-lg border border-yellow-100'>
                                    <h4 className='font-bold text-yellow-800 mb-2'>شروط الدفع</h4>
                                    <ul className='space-y-1 text-sm text-yellow-700'>
                                        <li>• يجب سداد المبلغ خلال 7 أيام من تاريخ الفاتورة</li>
                                        <li>• يمكن الدفع عبر الرصيد أو البطاقات الائتمانية</li>
                                        <li>• يرجى الاحتفاظ بنسخة من الفاتورة كمرجع</li>
                                    </ul>
                                </div>

                                <div className='bg-gray-50 p-4 rounded-lg border border-gray-200'>
                                    <h4 className='font-bold text-gray-800 mb-2'>ملاحظات هامة</h4>
                                    <ul className='space-y-1 text-sm text-gray-700'>
                                        <li>• سيتم بدء تنفيذ الخدمة بعد تأكيد الدفع</li>
                                        <li>• للمساعدة، يرجى التواصل مع الدعم الفني</li>
                                        <li>• جميع الأسعار تشمل ضريبة القيمة المضافة</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Footer Notes */}
                            <div className='border-t border-gray-200 pt-6'>
                                <div className='text-center text-gray-600 text-sm space-y-2'>
                                    <p>شكراً لاستخدامكم منصة دير عقارك للخدمات العقارية</p>
                                    <p>للاستفسارات: support@dairaker.com | هاتف: 920000000</p>
                                    <p className='text-xs text-gray-500'>هذه الفاتورة صادرة إلكترونياً ولا تحتاج إلى ختم</p>
                                </div>
                            </div>

                            {/* Action Buttons - Hide in print */}
                            <CardFooter className='pt-6 flex justify-between print:hidden'>
                                <div className='flex gap-4'>
                                    <button
                                        onClick={handlePrint}
                                        className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2'
                                    >
                                        <Printer className='h-4 w-4' />
                                        طباعة الفاتورة
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className='px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2'
                                    >
                                        <Download className='h-4 w-4' />
                                        تحميل PDF
                                    </button>
                                </div>

                                {invoiceData.service.paymentStatus === 'unpaid' && (
                                    <button className='px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2'>
                                        <DollarSign className='h-4 w-4' />
                                        اتمام الدفع الآن
                                    </button>
                                )}
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