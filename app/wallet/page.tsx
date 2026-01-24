"use client";
import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardFooter } from '../src/components/ui/card'
import { ArrowDownCircle, ArrowUpCircle, Wallet, CreditCard, FileText, TrendingUp, Receipt, Coins, X, Plus, Trash2, ArrowRight } from 'lucide-react'
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import InvoiceModal from '../src/components/invoice'

const WalletPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        orderNumber: '',
        amount: '',
        payment: ''
    })
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [showInvoiceModal, setShowInvoiceModal] = useState(false)
    const [showCommissionForm, setShowCommissionForm] = useState(false)
    const [showCommissionList, setShowCommissionList] = useState(false)
    const [showInvestmentCards, setShowInvestmentCards] = useState(false)
    const [showBrokerModal, setShowBrokerModal] = useState(false)
    const [showCommissionRequestModal, setShowCommissionRequestModal] = useState(false)
    const [requestStatus, setRequestStatus] = useState<'معلق' | 'مقبول' | 'مرفوض'>('معلق')
    const [requestNumber, setRequestNumber] = useState('')
    const [requestDate, setRequestDate] = useState('')
    const [editingBroker, setEditingBroker] = useState<number | null>(null)
    const [brokerForm, setBrokerForm] = useState({
        name: '',
        license: '',
        percentage: '',
        mobile: '',
        email: ''
    })
    
    // Commission form state
    const [commissionForm, setCommissionForm] = useState({
        status: '', // مباشر المالك, مباشر الوكيل, وسيط
        name: '', // الاسم
        license: '', // الرخصة
        // Owner/Seller data
        ownerName: '',
        ownerId: '',
        ownerStatus: '',
        ownerAgencyNumber: '',
        ownerPropertyType: '',
        ownerPercentage: '',
        // Buyer data
        buyerName: '',
        buyerId: '',
        buyerStatus: '',
        buyerAgencyNumber: '',
        buyerPercentage: '',
        // Property data
        propertyType: '',
        city: '',
        neighborhood: '',
        streetName: '',
        planNumber: '',
        plotNumber: '',
        area: '',
        deedNumber: '',
        propertyAge: '',
        numberOfFloors: '',
        numberOfUnits: '',
        specifications: '',
        // Contract values
        totalAmount: '', // المبلغ الكلي
        amountAfterDiscount: '', // المبلغ بعد خصم 15%
        commissionPercentage: '', // نسبة السعي (%)
        commission: '', // قيمة السعي (محسوبة تلقائياً)
        // Transfer type
        transferType: '', // wallet or bank
    })
    
    const [brokers, setBrokers] = useState<Array<{
        id: number;
        name: string;
        license: string;
        percentage: string;
        mobile: string;
        email: string;
    }>>([])
    
    const [brokerPercentages, setBrokerPercentages] = useState<Array<{
        name: string;
        percentage: string;
        amountAfterTax: string;
    }>>([])
    
    // Commission list data
    const [commissionList, setCommissionList] = useState<Array<{
        id: number;
        commissionNumber: string;
        serviceType: string;
    }>>([
        {
            id: 1,
            commissionNumber: 'SA-001',
            serviceType: 'بيع عقار'
        },
        {
            id: 2,
            commissionNumber: 'SA-002',
            serviceType: 'إيجار عقار'
        },
        {
            id: 3,
            commissionNumber: 'SA-003',
            serviceType: 'بيع عقار'
        }
    ])
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const leftSectionItems = [
        {
            icon: Receipt,
            label: 'فواتير',
            description: 'إدارة الفواتير',
        },
        {
            icon: Coins,
            label: 'سعي',
            description: 'عمليات السعي',
        },
        {
            icon: FileText,
            label: 'الملفات',
            description: 'المستندات والملفات',
        },
        {
            icon: TrendingUp,
            label: 'الاستثمار',
            description: 'إدارة الاستثمارات',
        }
    ]
    const data = [
        {
            status: 'دفع',
            amount: "100.00",
            date: '2025-01-01',
             service: "خدمة",
             invoice: "1234567890",
        }
    ]

    const router = useRouter();

    return (
        <div className='w-full min-h-screen bg-white text-black' dir="rtl">
            <div className='flex'>
                {/* Fixed Sidebar */}
                <div className='fixed top-0 right-0 h-screen w-80 lg:w-96 p-4 z-10'>
                    <Card className='bg-white p-6 h-full'>
                        <CardHeader>
                            <div className='space-y-4'>
                                <button 
                                  onClick={() => router.push('/')}
                                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors bg-gray-50 px-3 py-2 rounded-lg w-full"
                                >
                                  <ArrowRight className="w-5 h-5 transform rotate-180" />
                                  <span className="font-medium">العودة للرئيسية</span>
                                </button>
                                <CardTitle className='text-xl font-bold text-black'>القائمة الرئيسية</CardTitle>
                            </div>
                        </CardHeader>
                        <div className='grid grid-rows-4 gap-4 h-[calc(100%-140px)] '>
                            {leftSectionItems.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        if (item.label === 'سعي') {
                                            setShowCommissionList(true)
                                            setShowCommissionForm(false)
                                            setShowInvestmentCards(false)
                                        } else if (item.label === 'الاستثمار') {
                                            setShowInvestmentCards(true)
                                            setShowCommissionForm(false)
                                            setShowCommissionList(false)
                                        } else {
                                            setShowCommissionForm(false)
                                            setShowCommissionList(false)
                                            setShowInvestmentCards(false)
                                        }
                                    }}
                                    className={`
                                        group relative bg-white border-2 border-gray-200 rounded-2xl 
                                        hover:border-gray-600 shadow-lg hover:shadow-xl text-black
                                        transition-all duration-300 hover:scale-105 
                                        flex flex-col items-center justify-center gap-3
                                    `}
                                >
                                    {/* Icon Container */}
                                    <div className='p-3 bg-gray-800 rounded-xl'>
                                        <item.icon className='h-6 w-6 text-white' />
                                    </div>
                                    
                                    {/* Text Content */}
                                    <div className='text-center space-y-1'>
                                        <h3 className='text-black font-bold text-sm'>{item.label}</h3>
                                        <p className='text-black text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                                            {item.description}
                                        </p>
                                    </div>

                                    {/* Hover Indicator */}
                                    <div className='absolute top-2 left-2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Main Content - Adjusted for sidebar */}
                <div className='flex-1 mr-80 lg:mr-96 p-4'>
                    {showCommissionList ? (
                        <div className='w-full flex gap-4'>
                            {/* Left Side - Table */}
                            <div className='flex-1'>
                                <Card className='bg-white rounded-xl shadow-lg p-6'>
                                    <CardHeader className='pb-6'>
                                        <div className='flex items-center justify-between'>
                                            <CardTitle className='text-2xl font-bold text-black text-right'>نموذج السعي</CardTitle>
                                            <Button
                                                onClick={() => setShowCommissionForm(true)}
                                                className='px-6 py-2 text-white bg-gray-800 hover:bg-gray-700 rounded-lg'
                                            >
                                                طلب سعي
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <div className='overflow-x-auto'>
                                        <Table className='bg-white border border-gray-200 text-black shadow-lg'>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className='text-right'>رقم السعي</TableHead>
                                                    <TableHead className='text-right'>نوع الخدمة</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {commissionList.map((commission) => (
                                                    <TableRow key={commission.id}>
                                                        <TableCell className='text-right'>{commission.commissionNumber}</TableCell>
                                                        <TableCell className='text-right'>{commission.serviceType}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {commissionList.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={2} className='text-center text-gray-500'>
                                                            لا توجد بيانات سعي
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>
                            </div>

                            {/* Right Side - Commission Form */}
                            {showCommissionForm && (
                                <div className='flex-1'>
                                    <Card className='bg-white rounded-xl shadow-lg p-6 overflow-y-auto max-h-[calc(100vh-2rem)]'>
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-2xl font-bold text-black">نموذج السعي</h2>
                                            <button
                                                onClick={() => setShowCommissionForm(false)}
                                                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                                            >
                                                <span>إغلاق</span>
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>

                                        {/* Commission Form Content */}
                                        <div className="space-y-6">
                                            {/* 1. Status Section */}
                                            <div>
                                                <label className="block text-right text-lg font-semibold mb-3">الصفة</label>
                                                <Select
                                                    value={commissionForm.status}
                                                    onValueChange={(value) => setCommissionForm(prev => ({ ...prev, status: value }))}
                                                >
                                                    <SelectTrigger className="w-full text-right">
                                                        <SelectValue placeholder="اختر الصفة" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="مباشر المالك">مباشر المالك</SelectItem>
                                                        <SelectItem value="مباشر الوكيل">مباشر الوكيل</SelectItem>
                                                        <SelectItem value="وسيط">وسيط</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Name and License Fields */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-right text-sm mb-1">الاسم</label>
                                                    <Input
                                                        type="text"
                                                        value={commissionForm.name}
                                                        onChange={(e) => setCommissionForm(prev => ({ ...prev, name: e.target.value }))}
                                                        placeholder="أدخل الاسم"
                                                        className="text-right"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-right text-sm mb-1">رخصة</label>
                                                    <Input
                                                        type="text"
                                                        value={commissionForm.license}
                                                        onChange={(e) => setCommissionForm(prev => ({ ...prev, license: e.target.value }))}
                                                        placeholder="أدخل الرخصة"
                                                        className="text-right"
                                                    />
                                                </div>
                                            </div>

                                            {/* 2. Party Data Section */}
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-bold text-right border-b pb-2">بيانات الأطراف</h3>
                                                
                                                {/* Owner/Seller Section */}
                                                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                                    <h4 className="font-semibold text-right">المالك أو البائع</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-right text-sm mb-1">الاسم</label>
                                                            <Input
                                                                type="text"
                                                                value={commissionForm.ownerName}
                                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, ownerName: e.target.value }))}
                                                                placeholder="أدخل الاسم"
                                                                className="text-right"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-right text-sm mb-1">رقم الهوية</label>
                                                            <Input
                                                                type="text"
                                                                value={commissionForm.ownerId}
                                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, ownerId: e.target.value }))}
                                                                placeholder="أدخل رقم الهوية"
                                                                className="text-right"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-right text-sm mb-1">الصفة</label>
                                                            <Select
                                                                value={commissionForm.ownerStatus}
                                                                onValueChange={(value) => setCommissionForm(prev => ({ ...prev, ownerStatus: value }))}
                                                            >
                                                                <SelectTrigger className="w-full text-right">
                                                                    <SelectValue placeholder="اختر الصفة"/>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="المالك">المالك</SelectItem>
                                                                    <SelectItem value="الوكيل">الوكيل</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-right text-sm mb-1">رقم الوكالة</label>
                                                            <Input
                                                                type="text"
                                                                value={commissionForm.ownerAgencyNumber}
                                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, ownerAgencyNumber: e.target.value }))}
                                                                placeholder="أدخل رقم الوكالة"
                                                                className="text-right"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-right text-sm mb-1">نوع العقار</label>
                                                            <Input
                                                                type="text"
                                                                value={commissionForm.ownerPropertyType}
                                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, ownerPropertyType: e.target.value }))}
                                                                placeholder="أدخل نوع العقار"
                                                                className="text-right"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-right text-sm mb-1">النسبة المتفق عليها</label>
                                                            <Input
                                                                type="text"
                                                                value={commissionForm.ownerPercentage}
                                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, ownerPercentage: e.target.value }))}
                                                                placeholder="أدخل النسبة"
                                                                className="text-right"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Buyer Section */}
                                                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                                    <h4 className="font-semibold text-right">المشتري</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-right text-sm mb-1">الاسم</label>
                                                            <Input
                                                                type="text"
                                                                value={commissionForm.buyerName}
                                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, buyerName: e.target.value }))}
                                                                placeholder="أدخل الاسم"
                                                                className="text-right"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-right text-sm mb-1">رقم الهوية</label>
                                                            <Input
                                                                type="text"
                                                                value={commissionForm.buyerId}
                                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, buyerId: e.target.value }))}
                                                                placeholder="أدخل رقم الهوية"
                                                                className="text-right"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-right text-sm mb-1">الصفة</label>
                                                            <Select
                                                                value={commissionForm.buyerStatus}
                                                                onValueChange={(value) => setCommissionForm(prev => ({ ...prev, buyerStatus: value }))}
                                                            >
                                                                <SelectTrigger className="w-full text-right">
                                                                    <SelectValue placeholder="اختر الصفة" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="المشتري">المشتري</SelectItem>
                                                                    <SelectItem value="الوكيل">الوكيل</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-right text-sm mb-1">رقم الوكالة</label>
                                                            <Input
                                                                type="text"
                                                                value={commissionForm.buyerAgencyNumber}
                                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, buyerAgencyNumber: e.target.value }))}
                                                                placeholder="أدخل رقم الوكالة"
                                                                className="text-right"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-right text-sm mb-1">النسبة المتفق عليها</label>
                                                            <Input
                                                                type="text"
                                                                value={commissionForm.buyerPercentage}
                                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, buyerPercentage: e.target.value }))}
                                                                placeholder="أدخل النسبة"
                                                                className="text-right"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 3. Brokers Data Section */}
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-bold text-right border-b pb-2">بيانات الوسطاء</h3>
                                                <div className="overflow-x-auto">
                                                    <Table className="border border-gray-200">
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="text-right">الاسم</TableHead>
                                                                <TableHead className="text-right">رخصة فال</TableHead>
                                                                <TableHead className="text-right">نسبة السعي</TableHead>
                                                                <TableHead className="text-right">رقم الجوال</TableHead>
                                                                <TableHead className="text-right">البريد الإلكتروني</TableHead>
                                                                <TableHead className="text-right">إجراءات</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {brokers.map((broker) => (
                                                                <TableRow key={broker.id}>
                                                                    <TableCell>{broker.name}</TableCell>
                                                                    <TableCell>{broker.license}</TableCell>
                                                                    <TableCell>{broker.percentage}%</TableCell>
                                                                    <TableCell>{broker.mobile}</TableCell>
                                                                    <TableCell>{broker.email}</TableCell>
                                                                    <TableCell>
                                                                        <div className="flex gap-2 justify-end">
                                                                            <Button
                                                                                onClick={() => {
                                                                                    setEditingBroker(broker.id)
                                                                                    setBrokerForm({
                                                                                        name: broker.name,
                                                                                        license: broker.license,
                                                                                        percentage: broker.percentage,
                                                                                        mobile: broker.mobile,
                                                                                        email: broker.email
                                                                                    })
                                                                                    setShowBrokerModal(true)
                                                                                }}
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="text-blue-600 hover:text-blue-800"
                                                                            >
                                                                                تعديل
                                                                            </Button>
                                                                            <Button
                                                                                onClick={() => setBrokers(brokers.filter(b => b.id !== broker.id))}
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="text-red-600 hover:text-red-800"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                            {brokers.length === 0 && (
                                                                <TableRow>
                                                                    <TableCell colSpan={6} className="text-center text-gray-500">
                                                                        لا توجد وسطاء مضافة
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                                <Button
                                                    onClick={() => {
                                                        setEditingBroker(null)
                                                        setBrokerForm({
                                                            name: '',
                                                            license: '',
                                                            percentage: '',
                                                            mobile: '',
                                                            email: ''
                                                        })
                                                        setShowBrokerModal(true)
                                                    }}
                                                    className="w-full"
                                                    variant="default"
                                                >
                                                    <Plus className="h-5 w-5" />
                                                    إضافة وسيط جديد
                                                </Button>
                                            </div>

                                            {/* 4. Property Type Section */}
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-bold text-right border-b pb-2">نوع العقار</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-right text-sm mb-1">نوع العقار <span className="text-red-500">*</span></label>
                                                        <Input
                                                            type="text"
                                                            value={commissionForm.propertyType}
                                                            onChange={(e) => setCommissionForm(prev => ({ ...prev, propertyType: e.target.value }))}
                                                            placeholder="أدخل نوع العقار"
                                                            className="text-right"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-right text-sm mb-1">المدينة <span className="text-red-500">*</span></label>
                                                        <Input
                                                            type="text"
                                                            value={commissionForm.city}
                                                            onChange={(e) => setCommissionForm(prev => ({ ...prev, city: e.target.value }))}
                                                            placeholder="أدخل المدينة"
                                                            className="text-right"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-right text-sm mb-1">الحي <span className="text-red-500">*</span></label>
                                                        <Input
                                                            type="text"
                                                            value={commissionForm.neighborhood}
                                                            onChange={(e) => setCommissionForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                                                            placeholder="أدخل الحي"
                                                            className="text-right"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-right text-sm mb-1">اسم الشارع <span className="text-red-500">*</span></label>
                                                        <Input
                                                            type="text"
                                                            value={commissionForm.streetName}
                                                            onChange={(e) => setCommissionForm(prev => ({ ...prev, streetName: e.target.value }))}
                                                            placeholder="أدخل اسم الشارع"
                                                            className="text-right"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-right text-sm mb-1">رقم المخطط <span className="text-red-500">*</span></label>
                                                        <Input
                                                            type="text"
                                                            value={commissionForm.planNumber}
                                                            onChange={(e) => setCommissionForm(prev => ({ ...prev, planNumber: e.target.value }))}
                                                            placeholder="أدخل رقم المخطط"
                                                            className="text-right"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-right text-sm mb-1">رقم القطعة <span className="text-red-500">*</span></label>
                                                        <Input
                                                            type="text"
                                                            value={commissionForm.plotNumber}
                                                            onChange={(e) => setCommissionForm(prev => ({ ...prev, plotNumber: e.target.value }))}
                                                            placeholder="أدخل رقم القطعة"
                                                            className="text-right"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-right text-sm mb-1">المساحة <span className="text-red-500">*</span></label>
                                                        <Input
                                                            type="text"
                                                            value={commissionForm.area}
                                                            onChange={(e) => setCommissionForm(prev => ({ ...prev, area: e.target.value }))}
                                                            placeholder="أدخل المساحة"
                                                            className="text-right"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-right text-sm mb-1">رقم الصك <span className="text-red-500">*</span></label>
                                                        <Input
                                                            type="text"
                                                            value={commissionForm.deedNumber}
                                                            onChange={(e) => setCommissionForm(prev => ({ ...prev, deedNumber: e.target.value }))}
                                                            placeholder="أدخل رقم الصك"
                                                            className="text-right"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-right text-sm mb-1">عمر العقار</label>
                                                        <Input
                                                            type="text"
                                                            value={commissionForm.propertyAge}
                                                            onChange={(e) => setCommissionForm(prev => ({ ...prev, propertyAge: e.target.value }))}
                                                            placeholder="أدخل عمر العقار"
                                                            className="text-right"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-right text-sm mb-1">عدد الأدوار</label>
                                                        <Input
                                                            type="text"
                                                            value={commissionForm.numberOfFloors}
                                                            onChange={(e) => setCommissionForm(prev => ({ ...prev, numberOfFloors: e.target.value }))}
                                                            placeholder="أدخل عدد الأدوار"
                                                            className="text-right"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-right text-sm mb-1">عدد الوحدات</label>
                                                        <Input
                                                            type="text"
                                                            value={commissionForm.numberOfUnits}
                                                            onChange={(e) => setCommissionForm(prev => ({ ...prev, numberOfUnits: e.target.value }))}
                                                            placeholder="أدخل عدد الوحدات"
                                                            className="text-right"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-right text-sm mb-1">المواصفات الأساسية (غرف – صالات – دورات مياه…)</label>
                                                        <Textarea
                                                            value={commissionForm.specifications}
                                                            onChange={(e) => setCommissionForm(prev => ({ ...prev, specifications: e.target.value }))}
                                                            placeholder="أدخل المواصفات"
                                                            rows={3}
                                                            className="text-right"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 5. Contract Values Section */}
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-bold text-right border-b pb-2">قيم العقد</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-right text-sm mb-1">المبلغ الكلي</label>
                                                        <Input
                                                            type="number"
                                                            value={commissionForm.totalAmount}
                                                            onChange={(e) => {
                                                                const totalAmount = parseFloat(e.target.value) || 0
                                                                const discount = totalAmount * 0.15
                                                                const amountAfterDiscount = totalAmount - discount
                                                                const commissionPercentage = parseFloat(commissionForm.commissionPercentage) || 0
                                                                const commission = amountAfterDiscount * (commissionPercentage / 100)
                                                                
                                                                setCommissionForm(prev => ({
                                                                    ...prev,
                                                                    totalAmount: e.target.value,
                                                                    amountAfterDiscount: amountAfterDiscount.toFixed(2),
                                                                    commission: commission.toFixed(2)
                                                                }))
                                                            }}
                                                            placeholder="أدخل المبلغ الكلي"
                                                            className="text-right"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-right text-sm mb-1">المبلغ بعد خصم 15% ضريبة</label>
                                                        <Input
                                                            type="number"
                                                            value={commissionForm.amountAfterDiscount}
                                                            readOnly
                                                            placeholder="سيتم الحساب تلقائياً"
                                                            className="text-right bg-gray-50"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-right text-sm mb-1">نسبة السعي (%)</label>
                                                        <Input
                                                            type="number"
                                                            value={commissionForm.commissionPercentage}
                                                            onChange={(e) => {
                                                                const commissionPercentage = parseFloat(e.target.value) || 0
                                                                const amountAfterDiscount = parseFloat(commissionForm.amountAfterDiscount) || 0
                                                                const commission = amountAfterDiscount * (commissionPercentage / 100)
                                                                
                                                                setCommissionForm(prev => ({
                                                                    ...prev,
                                                                    commissionPercentage: e.target.value,
                                                                    commission: commission.toFixed(2)
                                                                }))
                                                            }}
                                                            placeholder="أدخل نسبة السعي"
                                                            className="text-right"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-right text-sm mb-1">قيمة السعي</label>
                                                        <Input
                                                            type="number"
                                                            value={commissionForm.commission}
                                                            readOnly
                                                            placeholder="سيتم الحساب تلقائياً"
                                                            className="text-right bg-gray-50"
                                                        />
                                                        {commissionForm.commission && (
                                                            <p className="text-xs text-gray-500 mt-1 text-right">
                                                                قيمة السعي: {commissionForm.commission} ريال
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 6. Broker Percentages Table */}
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-bold text-right border-b pb-2">جدول نسب الوسطاء</h3>
                                                <div className="overflow-x-auto">
                                                    <Table className="border border-gray-200">
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="text-right">اسم الوسيط</TableHead>
                                                                <TableHead className="text-right">قيمة السعي</TableHead>
                                                                <TableHead className="text-right">المبلغ</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {brokerPercentages.map((broker, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>{broker.name}</TableCell>
                                                                    <TableCell>{broker.percentage}%</TableCell>
                                                                    <TableCell>{broker.amountAfterTax}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                            {brokerPercentages.length === 0 && (
                                                                <TableRow>
                                                                    <TableCell colSpan={3} className="text-center text-gray-500">
                                                                        لا توجد بيانات
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>

                                            {/* Submit Buttons */}
                                            <div className="flex gap-4 pt-4">
                                                <Button
                                                    onClick={() => setShowCommissionForm(false)}
                                                    className="flex-1"
                                                    variant="outline"
                                                >
                                                    إلغاء
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        console.log('Data saved:', { commissionForm, brokers, brokerPercentages })
                                                        alert('تم حفظ البيانات بنجاح')
                                                    }}
                                                    className="flex-1"
                                                    variant="secondary"
                                                >
                                                    حفظ
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        const newRequestNumber = `REQ-${Date.now()}`
                                                        const today = new Date().toLocaleDateString('ar-SA')
                                                        setRequestNumber(newRequestNumber)
                                                        setRequestDate(today)
                                                        setRequestStatus('معلق')
                                                        setShowCommissionRequestModal(true)
                                                    }}
                                                    className="flex-1"
                                                    variant="default"
                                                >
                                                    إرسال الطلب
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            )}
                        </div>
                    ) : showInvestmentCards ? (
                        <div className='w-full'>
                            <Card className='bg-white rounded-xl shadow-lg p-6'>
                                <CardHeader className='pb-6'>
                                    <CardTitle className='text-2xl font-bold text-black text-right'>الاستثمار</CardTitle>
                                </CardHeader>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                    <button
                                        onClick={() => {
                                            // Handle long-term investment click
                                            console.log('استثمار طويل المدي clicked')
                                        }}
                                        className='group relative bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-600 shadow-lg hover:shadow-xl text-black transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center gap-4 p-8'
                                    >
                                        <div className='p-4 bg-gray-800 rounded-xl group-hover:bg-gray-700 transition-colors'>
                                            <TrendingUp className='h-8 w-8 text-white' />
                                        </div>
                                        <h3 className='text-black font-bold text-lg'>استثمار طويل المدى</h3>
                                        <div className='absolute top-2 left-2 w-2 h-2 bg-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            // Handle short-term investment click
                                            console.log('استثمار قصير المدى')
                                        }}
                                        className='group relative bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-600 shadow-lg hover:shadow-xl text-black transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center gap-4 p-8'
                                    >
                                        <div className='p-4 bg-gray-800 rounded-xl group-hover:bg-gray-700 transition-colors'>
                                            <TrendingUp className='h-8 w-8 text-white' />
                                        </div>
                                        <h3 className='text-black font-bold text-lg'>استثمار قصير المدى</h3>
                                        <div className='absolute top-2 left-2 w-2 h-2 bg-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            // Handle real estate partnership click
                                            console.log('مشاركة عقارية clicked')
                                        }}
                                        className='group relative bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-600 shadow-lg hover:shadow-xl text-black transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center gap-4 p-8'
                                    >
                                        <div className='p-4 bg-gray-800 rounded-xl group-hover:bg-gray-700 transition-colors'>
                                            <TrendingUp className='h-8 w-8 text-white' />
                                        </div>
                                        <h3 className='text-black font-bold text-lg'>مشاركة عقارية</h3>
                                        <div className='absolute top-2 left-2 w-2 h-2 bg-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            // Handle real estate redevelopment click
                                            console.log('اعادة تطوير العقارات clicked')
                                        }}
                                        className='group relative bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-600 shadow-lg hover:shadow-xl text-black transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center gap-4 p-8'
                                    >
                                        <div className='p-4 bg-gray-800 rounded-xl group-hover:bg-gray-700 transition-colors'>
                                            <TrendingUp className='h-8 w-8 text-white' />
                                        </div>
                                        <h3 className='text-black font-bold text-lg'>اعادة تطوير العقارات</h3>
                                        <div className='absolute top-2 left-2 w-2 h-2 bg-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                                    </button>
                                </div>
                            </Card>
                        </div>
                    ) : showCommissionForm && !showCommissionList ? (
                        <Card className='bg-white rounded-xl shadow-lg p-6 overflow-y-auto max-h-[calc(100vh-2rem)]'>
                            {/* Back Button */}
                            <div className="flex items-center justify-between mb-6">
                               
                                <h2 className="text-2xl font-bold text-black">نموذج السعي</h2>
                                <button
                                    onClick={() => {
                                        setShowCommissionForm(false)
                                        setShowCommissionList(true)
                                    }}
                                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                                >
                                    <span>رجوع</span>
                                    <ArrowDownCircle className="mt-2 h-5 w-5 rotate-90" />
                                </button>
                            </div>

                            {/* Commission Form Content */}
                            <div className="space-y-6">
                                {/* 1. Status Section */}
                                <div>
                                    <label className="block text-right text-lg font-semibold mb-3">الصفة</label>
                                    <Select
                                        value={commissionForm.status}
                                        onValueChange={(value) => setCommissionForm(prev => ({ ...prev, status: value }))}
                                    >
                                        <SelectTrigger className="w-full text-right">
                                            <SelectValue placeholder="اختر الصفة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="مباشر المالك">مباشر المالك</SelectItem>
                                            <SelectItem value="مباشر الوكيل">مباشر الوكيل</SelectItem>
                                            <SelectItem value="وسيط">وسيط</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Name and License Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-right text-sm mb-1">الاسم</label>
                                        <Input
                                            type="text"
                                            value={commissionForm.name}
                                            onChange={(e) => setCommissionForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="أدخل الاسم"
                                            className="text-right"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-right text-sm mb-1">رخصة</label>
                                        <Input
                                            type="text"
                                            value={commissionForm.license}
                                            onChange={(e) => setCommissionForm(prev => ({ ...prev, license: e.target.value }))}
                                            placeholder="أدخل الرخصة"
                                            className="text-right"
                                        />
                                    </div>
                                </div>

                                {/* 2. Party Data Section */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-right border-b pb-2">بيانات الأطراف</h3>
                                    
                                    {/* Owner/Seller Section */}
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                        <h4 className="font-semibold text-right">المالك أو البائع</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-right text-sm mb-1">الاسم</label>
                                                <Input
                                                    type="text"
                                                    value={commissionForm.ownerName}
                                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, ownerName: e.target.value }))}
                                                    placeholder="أدخل الاسم"
                                                    className="text-right"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-right text-sm mb-1">رقم الهوية</label>
                                                <Input
                                                    type="text"
                                                    value={commissionForm.ownerId}
                                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, ownerId: e.target.value }))}
                                                    placeholder="أدخل رقم الهوية"
                                                    className="text-right"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-right text-sm mb-1">الصفة</label>
                                                <Select
                                                    value={commissionForm.ownerStatus}
                                                    onValueChange={(value) => setCommissionForm(prev => ({ ...prev, ownerStatus: value }))}
                                                >
                                                    <SelectTrigger className="w-full text-right">
                                                        <SelectValue placeholder="اختر الصفة"/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="المالك">المالك</SelectItem>
                                                        <SelectItem value="الوكيل">الوكيل</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="block text-right text-sm mb-1">رقم الوكالة</label>
                                                <Input
                                                    type="text"
                                                    value={commissionForm.ownerAgencyNumber}
                                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, ownerAgencyNumber: e.target.value }))}
                                                    placeholder="أدخل رقم الوكالة"
                                                    className="text-right"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-right text-sm mb-1">نوع العقار</label>
                                                <Input
                                                    type="text"
                                                    value={commissionForm.ownerPropertyType}
                                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, ownerPropertyType: e.target.value }))}
                                                    placeholder="أدخل نوع العقار"
                                                    className="text-right"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-right text-sm mb-1">النسبة المتفق عليها</label>
                                                <Input
                                                    type="text"
                                                    value={commissionForm.ownerPercentage}
                                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, ownerPercentage: e.target.value }))}
                                                    placeholder="أدخل النسبة"
                                                    className="text-right"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Buyer Section */}
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                        <h4 className="font-semibold text-right">المشتري</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-right text-sm mb-1">الاسم</label>
                                                <Input
                                                    type="text"
                                                    value={commissionForm.buyerName}
                                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, buyerName: e.target.value }))}
                                                    placeholder="أدخل الاسم"
                                                    className="text-right"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-right text-sm mb-1">رقم الهوية</label>
                                                <Input
                                                    type="text"
                                                    value={commissionForm.buyerId}
                                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, buyerId: e.target.value }))}
                                                    placeholder="أدخل رقم الهوية"
                                                    className="text-right"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-right text-sm mb-1">الصفة</label>
                                                <Select
                                                    value={commissionForm.buyerStatus}
                                                    onValueChange={(value) => setCommissionForm(prev => ({ ...prev, buyerStatus: value }))}
                                                >
                                                    <SelectTrigger className="w-full text-right">
                                                        <SelectValue placeholder="اختر الصفة" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="المشتري">المشتري</SelectItem>
                                                        <SelectItem value="الوكيل">الوكيل</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="block text-right text-sm mb-1">رقم الوكالة</label>
                                                <Input
                                                    type="text"
                                                    value={commissionForm.buyerAgencyNumber}
                                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, buyerAgencyNumber: e.target.value }))}
                                                    placeholder="أدخل رقم الوكالة"
                                                    className="text-right"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-right text-sm mb-1">النسبة المتفق عليها</label>
                                                <Input
                                                    type="text"
                                                    value={commissionForm.buyerPercentage}
                                                    onChange={(e) => setCommissionForm(prev => ({ ...prev, buyerPercentage: e.target.value }))}
                                                    placeholder="أدخل النسبة"
                                                    className="text-right"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Brokers Data Section */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-right border-b pb-2">بيانات الوسطاء</h3>
                                    <div className="overflow-x-auto">
                                        <Table className="border border-gray-200">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-right">الاسم</TableHead>
                                                    <TableHead className="text-right">رخصة فال</TableHead>
                                                    <TableHead className="text-right">نسبة السعي</TableHead>
                                                    <TableHead className="text-right">رقم الجوال</TableHead>
                                                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                                                    <TableHead className="text-right">إجراءات</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {brokers.map((broker) => (
                                                    <TableRow key={broker.id}>
                                                        <TableCell>{broker.name}</TableCell>
                                                        <TableCell>{broker.license}</TableCell>
                                                        <TableCell>{broker.percentage}%</TableCell>
                                                        <TableCell>{broker.mobile}</TableCell>
                                                        <TableCell>{broker.email}</TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2 justify-end">
                                                                <Button
                                                                    onClick={() => {
                                                                        setEditingBroker(broker.id)
                                                                        setBrokerForm({
                                                                            name: broker.name,
                                                                            license: broker.license,
                                                                            percentage: broker.percentage,
                                                                            mobile: broker.mobile,
                                                                            email: broker.email
                                                                        })
                                                                        setShowBrokerModal(true)
                                                                    }}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-blue-600 hover:text-blue-800"
                                                                >
                                                                    تعديل
                                                                </Button>
                                                                <Button
                                                                    onClick={() => setBrokers(brokers.filter(b => b.id !== broker.id))}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {brokers.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center text-gray-500">
                                                            لا توجد وسطاء مضافة
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            setEditingBroker(null)
                                            setBrokerForm({
                                                name: '',
                                                license: '',
                                                percentage: '',
                                                mobile: '',
                                                email: ''
                                            })
                                            setShowBrokerModal(true)
                                        }}
                                        className="w-full"
                                        variant="default"
                                    >
                                        <Plus className="h-5 w-5" />
                                        إضافة وسيط جديد
                                    </Button>
                                </div>

                                {/* 4. Property Type Section */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-right border-b pb-2">نوع العقار</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-right text-sm mb-1">نوع العقار <span className="text-red-500">*</span></label>
                                            <Input
                                                type="text"
                                                value={commissionForm.propertyType}
                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, propertyType: e.target.value }))}
                                                placeholder="أدخل نوع العقار"
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-right text-sm mb-1">المدينة <span className="text-red-500">*</span></label>
                                            <Input
                                                type="text"
                                                value={commissionForm.city}
                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, city: e.target.value }))}
                                                placeholder="أدخل المدينة"
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-right text-sm mb-1">الحي <span className="text-red-500">*</span></label>
                                            <Input
                                                type="text"
                                                value={commissionForm.neighborhood}
                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                                                placeholder="أدخل الحي"
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-right text-sm mb-1">اسم الشارع <span className="text-red-500">*</span></label>
                                            <Input
                                                type="text"
                                                value={commissionForm.streetName}
                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, streetName: e.target.value }))}
                                                placeholder="أدخل اسم الشارع"
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-right text-sm mb-1">رقم المخطط <span className="text-red-500">*</span></label>
                                            <Input
                                                type="text"
                                                value={commissionForm.planNumber}
                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, planNumber: e.target.value }))}
                                                placeholder="أدخل رقم المخطط"
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-right text-sm mb-1">رقم القطعة <span className="text-red-500">*</span></label>
                                            <Input
                                                type="text"
                                                value={commissionForm.plotNumber}
                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, plotNumber: e.target.value }))}
                                                placeholder="أدخل رقم القطعة"
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-right text-sm mb-1">المساحة <span className="text-red-500">*</span></label>
                                            <Input
                                                type="text"
                                                value={commissionForm.area}
                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, area: e.target.value }))}
                                                placeholder="أدخل المساحة"
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-right text-sm mb-1">رقم الصك <span className="text-red-500">*</span></label>
                                            <Input
                                                type="text"
                                                value={commissionForm.deedNumber}
                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, deedNumber: e.target.value }))}
                                                placeholder="أدخل رقم الصك"
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-right text-sm mb-1">عمر العقار</label>
                                            <Input
                                                type="text"
                                                value={commissionForm.propertyAge}
                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, propertyAge: e.target.value }))}
                                                placeholder="أدخل عمر العقار"
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-right text-sm mb-1">عدد الأدوار</label>
                                            <Input
                                                type="text"
                                                value={commissionForm.numberOfFloors}
                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, numberOfFloors: e.target.value }))}
                                                placeholder="أدخل عدد الأدوار"
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-right text-sm mb-1">عدد الوحدات</label>
                                            <Input
                                                type="text"
                                                value={commissionForm.numberOfUnits}
                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, numberOfUnits: e.target.value }))}
                                                placeholder="أدخل عدد الوحدات"
                                                className="text-right"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-right text-sm mb-1">المواصفات الأساسية (غرف – صالات – دورات مياه…)</label>
                                            <Textarea
                                                value={commissionForm.specifications}
                                                onChange={(e) => setCommissionForm(prev => ({ ...prev, specifications: e.target.value }))}
                                                placeholder="أدخل المواصفات"
                                                rows={3}
                                                className="text-right"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 5. Contract Values Section */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-right border-b pb-2">قيم العقد</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-right text-sm mb-1">المبلغ الكلي</label>
                                            <Input
                                                type="number"
                                                value={commissionForm.totalAmount}
                                                onChange={(e) => {
                                                    const totalAmount = parseFloat(e.target.value) || 0
                                                    const discount = totalAmount * 0.15 // خصم 15%
                                                    const amountAfterDiscount = totalAmount - discount
                                                    const commissionPercentage = parseFloat(commissionForm.commissionPercentage) || 0
                                                    const commission = amountAfterDiscount * (commissionPercentage / 100)
                                                    
                                                    setCommissionForm(prev => ({
                                                        ...prev,
                                                        totalAmount: e.target.value,
                                                        amountAfterDiscount: amountAfterDiscount.toFixed(2),
                                                        commission: commission.toFixed(2)
                                                    }))
                                                }}
                                                placeholder="أدخل المبلغ الكلي"
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-right text-sm mb-1">المبلغ بعد خصم 15% ضريبة</label>
                                            <Input
                                                type="number"
                                                value={commissionForm.amountAfterDiscount}
                                                readOnly
                                                placeholder="سيتم الحساب تلقائياً"
                                                className="text-right bg-gray-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-right text-sm mb-1">نسبة السعي (%)</label>
                                            <Input
                                                type="number"
                                                value={commissionForm.commissionPercentage}
                                                onChange={(e) => {
                                                    const commissionPercentage = parseFloat(e.target.value) || 0
                                                    const amountAfterDiscount = parseFloat(commissionForm.amountAfterDiscount) || 0
                                                    const commission = amountAfterDiscount * (commissionPercentage / 100)
                                                    
                                                    setCommissionForm(prev => ({
                                                        ...prev,
                                                        commissionPercentage: e.target.value,
                                                        commission: commission.toFixed(2)
                                                    }))
                                                }}
                                                placeholder="أدخل نسبة السعي"
                                                className="text-right"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-right text-sm mb-1">قيمة السعي</label>
                                            <Input
                                                type="number"
                                                value={commissionForm.commission}
                                                readOnly
                                                placeholder="سيتم الحساب تلقائياً"
                                                className="text-right bg-gray-50"
                                            />
                                            {commissionForm.commission && (
                                                <p className="text-xs text-gray-500 mt-1 text-right">
                                                    قيمة السعي: {commissionForm.commission} ريال
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 6. Broker Percentages Table */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-right border-b pb-2">جدول نسب الوسطاء</h3>
                                    <div className="overflow-x-auto">
                                        <Table className="border border-gray-200">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-right">اسم الوسيط</TableHead>
                                                    <TableHead className="text-right">قيمة السعي</TableHead>
                                                    <TableHead className="text-right">المبلغ</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {brokerPercentages.map((broker, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{broker.name}</TableCell>
                                                        <TableCell>{broker.percentage}%</TableCell>
                                                        <TableCell>{broker.amountAfterTax}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {brokerPercentages.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center text-gray-500">
                                                            لا توجد بيانات
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex gap-4 pt-4">
                                    <Button
                                        onClick={() => setShowCommissionForm(false)}
                                        className="flex-1"
                                        variant="outline"
                                    >
                                        إلغاء
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            console.log('Data saved:', { commissionForm, brokers, brokerPercentages })
                                            alert('تم حفظ البيانات بنجاح')
                                        }}
                                        className="flex-1"
                                        variant="secondary"
                                    >
                                        حفظ
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            // Generate request number and date
                                            const newRequestNumber = `REQ-${Date.now()}`
                                            const today = new Date().toLocaleDateString('ar-SA')
                                            setRequestNumber(newRequestNumber)
                                            setRequestDate(today)
                                            setRequestStatus('معلق') // Set initial status to pending
                                            setShowCommissionRequestModal(true)
                                        }}
                                        className="flex-1"
                                        variant="default"
                                    >
                                        إرسال الطلب
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <div className='w-full'>
                            <Card className='bg-white rounded-xl shadow-lg'>
                                <CardHeader className='pb-4'>
                                    <CardTitle className='text-2xl font-bold text-black text-right'>المحفظة</CardTitle>
                                </CardHeader>
                            <div className='px-6 pb-6'>
                                <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-2'>
                                    {/* Left Side - Available Balance */}
                                    <div className='w-full md:w-auto md:flex-1'>
                                        <div className='text-right md:text-right'>
                                            <div className='text-black text-sm mb-2'>الرصيد المتاح</div>
                                            <div className='text-3xl font-bold text-black'>
                                                0.00 <span className='text-xl font-normal'>ريال</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side - Action Buttons */}
                                    <div className='flex gap-3 w-full md:w-auto flex-wrap md:flex-nowrap'>
                                        <button 
                                            onClick={() => {
                                                setShowCommissionList(true)
                                                setShowCommissionForm(false)
                                            }}
                                            className='px-6 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm whitespace-nowrap'>
                                            طلب سعي
                                        </button>
                                        <button className='px-6 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm whitespace-nowrap'>
                                            إضافة رصيد
                                        </button>
                                        <button className='px-6 py-4 text-white bg-gray-800 hover:bg-gray-700 font-semibold rounded-lg transition-colors duration-200 text-sm whitespace-nowrap'>
                                            سحب رصيد
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className='px-6 pb-6'>
                                <Table className='mt-8 bg-white border border-gray-200 text-black p-4 shadow-lg'>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className='text-right'>رقم الفاتورة</TableHead>
                                            <TableHead className='text-right'>نوع الخدمة</TableHead>
                                            <TableHead className='text-right'>تاريخ الفاتورة</TableHead>
                                            <TableHead className='text-right'>المبلغ</TableHead>
                                            <TableHead className='text-right'>الحالة</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((row, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{row.invoice}</TableCell>
                                                <TableCell>{row.service}</TableCell>
                                                <TableCell>{row.date}</TableCell>
                                                <TableCell>{row.amount}</TableCell>
                                                <TableCell>{row.status}</TableCell>
                                                <TableCell>
                                                    <div className='flex gap-2 justify-end'>
                                                        <Button 
                                                            onClick={() => setShowPaymentModal(true)}
                                                            className='px-4 py-2 text-white bg-gray-800 hover:bg-gray-700 rounded-lg text-right'>
                                                            دفع
                                                        </Button>
                                                        <Button 
                                                            onClick={() => setShowInvoiceModal(true)}
                                                            className='px-4 py-2 text-white bg-gray-800 hover:bg-gray-700 rounded-lg text-right ml-2'>
                                                            عرض الفاتورة
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={() => setShowPaymentModal(false)}
                dir="rtl"
            >
                <div
                className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-2xl mx-4 text-black animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
                >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold">طرق الدفع</h2>
                    <button
                    onClick={() => setShowPaymentModal(false)}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                    >
                    <X className="h-6 w-6 text-gray-400" />
                    </button>
                </div>

                {/* Payment Methods (Two Buttons) */}
                <div className="p-6 grid grid-cols-2 gap-4">
                    <button className="w-full p-4 bg-gray-800 text-white hover:bg-gray-700 border-2 border-gray-700 hover:border-gray-600 rounded-lg transition-all duration-200 flex items-center justify-between">
                    <span className="font-semibold">الدفع من الرصيد</span>
                    <Wallet className="h-5 w-5" />
                    </button>

                    <button className="w-full p-4 bg-gray-800 text-white hover:bg-gray-700 border-2 border-gray-700 hover:border-gray-600 rounded-lg transition-all duration-200 flex items-center justify-between">
                    <span className="font-semibold">دفع ببطاقات الائتمان</span>
                    <CreditCard className="h-5 w-5" />
                    </button>
                </div>

                {/* Installments */}
                <div className="p-6">
                    <button className="w-full p-4 bg-gray-800 text-white hover:bg-gray-700 border-2 border-gray-700 hover:border-gray-600 rounded-lg transition-all duration-200 flex items-center justify-between">
                    <div className="text-right">
                        <div className="font-semibold">دفع من تابي وتمارا</div>
                        <div className="text-sm text-gray-400 mt-1">12 قسط</div>
                    </div>
                    <Receipt className="h-5 w-5" />
                    </button>
                </div>
                </div>
            </div>
            )}

            {/* Invoice Modal */}
            <InvoiceModal 
                isOpen={showInvoiceModal} 
                onClose={() => setShowInvoiceModal(false)} 
            />


            {/* Broker Modal */}
            {showBrokerModal && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowBrokerModal(false)}
                    dir="rtl"
                >
                    <div
                        className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-2xl mx-4 text-black animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold">{editingBroker ? 'تعديل وسيط' : 'إضافة وسيط جديد'}</h2>
                            <button
                                onClick={() => setShowBrokerModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        {/* Form Content */}
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-right text-sm mb-1">الاسم</label>
                                <Input
                                    type="text"
                                    value={brokerForm.name}
                                    onChange={(e) => setBrokerForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="أدخل الاسم"
                                    className="text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-right text-sm mb-1">رخصة فال</label>
                                <Input
                                    type="text"
                                    value={brokerForm.license}
                                    onChange={(e) => setBrokerForm(prev => ({ ...prev, license: e.target.value }))}
                                    placeholder="أدخل رخصة فال"
                                    className="text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-right text-sm mb-1">قيمة السعي</label>
                                <Input
                                    type="text"
                                    value={brokerForm.percentage}
                                    onChange={(e) => setBrokerForm(prev => ({ ...prev, percentage: e.target.value }))}
                                    placeholder="أدخل قيمة السعي"
                                    className="text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-right text-sm mb-1">رقم الجوال</label>
                                <Input
                                    type="text"
                                    value={brokerForm.mobile}
                                    onChange={(e) => setBrokerForm(prev => ({ ...prev, mobile: e.target.value }))}
                                    placeholder="أدخل رقم الجوال"
                                    className="text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-right text-sm mb-1">البريد الإلكتروني</label>
                                <Input
                                    type="email"
                                    value={brokerForm.email}
                                    onChange={(e) => setBrokerForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="أدخل البريد الإلكتروني"
                                    className="text-right"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4 pt-4">
                                <Button
                                    onClick={() => setShowBrokerModal(false)}
                                    className="flex-1"
                                    variant="outline"
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (editingBroker) {
                                            setBrokers(brokers.map(b => 
                                                b.id === editingBroker 
                                                    ? { ...b, ...brokerForm }
                                                    : b
                                            ))
                                        } else {
                                            const newBroker = {
                                                id: Date.now(),
                                                ...brokerForm
                                            }
                                            setBrokers([...brokers, newBroker])
                                        }
                                        setShowBrokerModal(false)
                                        setBrokerForm({
                                            name: '',
                                            license: '',
                                            percentage: '',
                                            mobile: '',
                                            email: ''
                                        })
                                        setEditingBroker(null)
                                    }}
                                    className="flex-1"
                                    variant="default"
                                >
                                    {editingBroker ? 'حفظ التعديلات' : 'إضافة'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Commission Request Modal */}
            {showCommissionRequestModal && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4"
                    onClick={() => setShowCommissionRequestModal(false)}
                    dir="rtl"
                >
                    <div
                        className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-6xl my-8 text-black animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h1 className="text-2xl font-bold">طلب السعي</h1>
                            <button
                                onClick={() => setShowCommissionRequestModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-6 w-6 text-gray-600" />
                            </button>
                        </div>

                        {/* Request Content */}
                        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto ">
                            <Card className="bg-white border-0 shadow-none">
                                {/* Request Header Section */}
                                <CardHeader className="border-b border-gray-200 pb-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2 text-gray-700">
                                            <div><span className="font-semibold">رقم الطلب:</span> {requestNumber || 'REQ-000000'}</div>
                                            <div><span className="font-semibold">تاريخ الطلب:</span> {requestDate || new Date().toLocaleDateString('ar-SA')}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">حالة الطلب:</span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                    requestStatus === 'مقبول' ? 'bg-green-100 text-green-800' :
                                                    requestStatus === 'مرفوض' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {requestStatus}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <div className="p-6 space-y-8">
                                    {/* Divider */}
                                    <div className="border-t border-gray-300"></div>

                                    {/* Request Details */}
                                    <div>
                                        <h3 className="text-xl font-bold mb-4">تفاصيل الطلب</h3>
                                        <div className="overflow-x-auto">
                                            <Table className="border border-gray-200">
                                                <TableHeader>
                                                    <TableRow className="bg-gray-50">
                                                        <TableHead className="text-right font-bold">نوع العقار</TableHead>
                                                        <TableHead className="text-right font-bold">المدينة / الحي</TableHead>
                                                        <TableHead className="text-right font-bold">قيمة العقار</TableHead>
                                                        <TableHead className="text-right font-bold">اسم البائع / المالك</TableHead>
                                                        <TableHead className="text-right font-bold">اسم المشتري</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell className="text-right">{commissionForm.propertyType || 'غير محدد'}</TableCell>
                                                        <TableCell className="text-right">{commissionForm.city && commissionForm.neighborhood ? `${commissionForm.city} / ${commissionForm.neighborhood}` : 'غير محدد'}</TableCell>
                                                        <TableCell className="text-right">{commissionForm.totalAmount ? `${parseFloat(commissionForm.totalAmount).toLocaleString('ar-SA')} ريال` : 'غير محدد'}</TableCell>
                                                        <TableCell className="text-right">{commissionForm.ownerName || 'غير محدد'}</TableCell>
                                                        <TableCell className="text-right">{commissionForm.buyerName || 'غير محدد'}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-gray-300"></div>

                                    {/* Broker Percentages Table */}
                                    {brokerPercentages.length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-bold mb-4">جدول نسب الوسطاء</h3>
                                            <Table className="border border-gray-200">
                                                <TableHeader>
                                                    <TableRow className="bg-gray-50">
                                                        <TableHead className="text-right font-bold">اسم الوسيط</TableHead>
                                                        <TableHead className="text-right font-bold">نسبة السعي</TableHead>
                                                        <TableHead className="text-right font-bold">مبلغ بعد خصم الضريبة 15%</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {brokerPercentages.map((broker, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell className="text-right">{broker.name}</TableCell>
                                                            <TableCell className="text-right">{broker.percentage}%</TableCell>
                                                            <TableCell className="text-right">{parseFloat(broker.amountAfterTax || '0').toLocaleString('ar-SA')} ريال</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}

                                    {/* Divider */}
                                    <div className="border-t border-gray-300"></div>

                                    {/* Commission Request Button */}
                                    <CardFooter className="pt-4">
                                        <Button
                                            onClick={() => {
                                                alert('تم إرسال طلب السعي بنجاح')
                                                setShowCommissionRequestModal(false)
                                            }}
                                            disabled={requestStatus !== 'مقبول'}
                                            className="w-full px-8 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            طلب السعي
                                        </Button>
                                       
                                    </CardFooter>
                                    {requestStatus !== 'مقبول' && (
                                            <p className="text-sm text-gray-500 text-center mt-2">
                                                يُعدّ السعي مستحقًا للوسيط فور قيام مالك العقار أو المشتري، أو من ينوب عنهما، بقبول طلب السعي.
                                            </p>
                                        )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>            )}

        </div>
    )
}
export default WalletPage;