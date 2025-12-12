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
import { Download, Printer, X } from 'lucide-react'

interface InvoiceModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function InvoiceModal({ isOpen, onClose }: InvoiceModalProps) {
    if (!isOpen) return null

    // Sample data - in real app, this would come from props or API
    const invoiceData = {
        invoiceNumber: 'INV-2025-001',
        issueDate: '21/11/2025',
        platformName: 'دير عقارك',
        client: {
            name: 'احمد ', // Would be from ID card
            phone: '+966501234567', // Registered in site
            email: 'ahmed@example.com' // Registered in site
        },
        property: {
            type: 'فيلا',
            location: 'الرياض – حي النرجس',
            orderNumber: 'ORD-2025-12345',
            description: 'فيلا فاخرة مساحة 500 متر مربع، 4 غرف نوم، 3 دورات مياه، صالة واسعة، مطبخ مجهز، حديقة خاصة، موقف سيارات.'
        },
        fees: {
            propertyPrice: 1500000,
            vat: 225000, // 15%
            commission: 75000,
            documentationFee: 5000,
            saleContract: 10000,
        }
    }

    const totalAmount = Object.values(invoiceData.fees).reduce((sum, fee) => sum + fee, 0)

    return (
        <div 
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4'
            onClick={onClose}
            dir="rtl"
        >
            <div 
                className='bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-4xl my-8 text-black animate-in fade-in zoom-in duration-200'
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className='flex justify-between items-center p-6 border-b border-gray-200'>
                    <h1 className='text-2xl font-bold'>نموذج الفاتورة</h1>
                    <button
                        onClick={onClose}
                        className='p-2 hover:bg-gray-100 rounded-full transition-colors'
                    >
                        <X className='h-6 w-6 text-gray-600' />
                    </button>
                </div>

                {/* Invoice Content */}
                <div className='p-6 max-h-[calc(100vh-200px)] overflow-y-auto'>
                <Card className='bg-white border-0 shadow-none'>
                    <CardHeader className='border-b border-gray-200 pb-6'>
                        <div className='flex justify-between items-start'>
                            <div>
                                <div className='space-y-2 text-gray-700'>
                                    <div><span className='font-semibold'>رقم الفاتورة:</span> {invoiceData.invoiceNumber}</div>
                                    <div><span className='font-semibold'>تاريخ الإصدار:</span> {invoiceData.issueDate}</div>
                                    <div><span className='font-semibold'>اسم المنصّة:</span> {invoiceData.platformName}</div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <div className='p-6 space-y-8'>
                        {/* Divider */}
                        <div className='border-t border-gray-300'></div>

                        {/* Client Data */}
                        <div>
                            <h3 className='text-xl font-bold mb-4'>بيانات العميل</h3>
                            <div className='space-y-2 text-gray-700'>
                                <div><span className='font-semibold'>اسم العميل:</span> {invoiceData.client.name}</div>
                                <div><span className='font-semibold'>رقم الجوال:</span> {invoiceData.client.phone}</div>
                                <div><span className='font-semibold'>البريد الإلكتروني:</span> {invoiceData.client.email}</div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className='border-t border-gray-300'></div>

                        {/* Property Data */}
                        <div>
                            <h3 className='text-xl font-bold mb-4'>بيانات العقار</h3>
                            <div className='space-y-2 text-gray-700 mb-4'>
                                <div><span className='font-semibold'>نوع العقار:</span> {invoiceData.property.type}</div>
                                <div><span className='font-semibold'>موقع العقار:</span> {invoiceData.property.location}</div>
                                <div><span className='font-semibold'>رقم العرض/الطلب:</span> {invoiceData.property.orderNumber}</div>
                            </div>
                            <div className='bg-gray-50 p-4 rounded-lg border border-gray-200'>
                                <p className='text-gray-700'>{invoiceData.property.description}</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className='border-t border-gray-300'></div>

                        {/* Fee Details */}
                        <div>
                            <h3 className='text-xl font-bold mb-4'>تفاصيل الرسوم</h3>
                            <Table className='border border-gray-200'>
                                <TableHeader>
                                    <TableRow className='bg-gray-50'>
                                        <TableHead className='text-right font-bold'>البند</TableHead>
                                        <TableHead className='text-right font-bold'>المبلغ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className='text-right'>سعر العقار</TableCell>
                                        <TableCell className='text-right'>{invoiceData.fees.propertyPrice.toLocaleString('ar-SA')} ريال</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className='text-right'>ضريبة القيمة المضافة (15%)</TableCell>
                                        <TableCell className='text-right'>{invoiceData.fees.vat.toLocaleString('ar-SA')} ريال</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className='text-right'>عمولة الموقع/ الوسيط</TableCell>
                                        <TableCell className='text-right'>{invoiceData.fees.commission.toLocaleString('ar-SA')} ريال</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className='text-right'>رسوم التوثيق</TableCell>
                                        <TableCell className='text-right'>{invoiceData.fees.documentationFee.toLocaleString('ar-SA')} ريال</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className='text-right'>عقد البيع</TableCell>
                                        <TableCell className='text-right'>{invoiceData.fees.saleContract.toLocaleString('ar-SA')} ريال</TableCell>
                                    </TableRow>
                                    <TableRow className='bg-gray-50 font-bold'>
                                        <TableCell className='text-right'>الإجمالي النهائي المستحق</TableCell>
                                        <TableCell className='text-right'>{totalAmount.toLocaleString('ar-SA')} ريال</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        {/* Divider */}
                        <div className='border-t border-gray-300'></div>

                        {/* Process Summary */}
                        <div>
                            <h3 className='text-xl font-bold mb-4'>ملخص العملية</h3>
                            <div className='bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 text-gray-700'>
                                <p>• سيتم إرسال الصك الإلكتروني خلال 24 ساعة بعد الدفع.</p>
                                <p>• يتم نقل الملكية إلكترونياً عبر المنصّة.</p>
                                <p>• المنصّة غير مسؤولة عن أي تعامل خارجها</p>
                            </div>
                        </div>
                        <CardFooter>
                        <button className='px-8 py-4  bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2'>
                            اتمام الدفع
                        </button>
                        </CardFooter>
                    </div>
                </Card>
                </div>
            </div>
        </div>
    )
}

