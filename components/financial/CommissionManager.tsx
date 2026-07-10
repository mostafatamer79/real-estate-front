"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, Plus, Trash2, ArrowDownCircle } from 'lucide-react';
import { SaudiRiyalAmount } from '@/components/ui/saudi-riyal';

import { financialApi, FinancialTransaction } from '@/lib/financial-service';
import { Loader2 } from 'lucide-react';

export default function CommissionManager() {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [loading, setLoading] = useState(true);
    const [commissions, setCommissions] = useState<FinancialTransaction[]>([]);
    
    // Commission form state
    // ... (keep form state as is for now)
    const [commissionForm, setCommissionForm] = useState({
        status: '', 
        name: '', 
        license: '', 
        ownerName: '',
        ownerId: '',
        ownerStatus: '',
        ownerAgencyNumber: '',
        ownerPropertyType: '',
        ownerPercentage: '',
        buyerName: '',
        buyerId: '',
        buyerStatus: '',
        buyerAgencyNumber: '',
        buyerPercentage: '',
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
        totalAmount: '',
        amountAfterDiscount: '',
        commissionPercentage: '',
        commission: '',
    });

    const [brokers, setBrokers] = useState<Array<{
        id: number;
        name: string;
        license: string;
        percentage: string;
        mobile: string;
        email: string;
    }>>([]);

    const fetchCommissions = async () => {
        try {
            const data = await financialApi.getCommissions();
            setCommissions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommissions();
    }, []);

    const [showBrokerModal, setShowBrokerModal] = useState(false);
    const [editingBroker, setEditingBroker] = useState<number | null>(null);
    const [brokerForm, setBrokerForm] = useState({
        name: '', license: '', percentage: '', mobile: '', email: ''
    });

    if (view === 'list') {
        return (
            <Card className='bg-card rounded-xl shadow-lg border-0'>
                <CardHeader className='flex flex-row items-center justify-between pb-6'>
                    <CardTitle className='text-2xl font-bold text-black text-right'>إدارة العمولات (السعي)</CardTitle>
                    <Button
                        onClick={() => setView('form')}
                        className='px-6 py-2 text-white bg-slate-800 hover:bg-slate-700 rounded-lg'
                    >
                        طلب سعي جديد
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-4 sm:p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className='overflow-x-auto'>
                            <Table className='bg-card border border text-black shadow-sm'>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className='text-right'>رقم العملية</TableHead>
                                        <TableHead className='text-right'>المبلغ</TableHead>
                                        <TableHead className='text-right'>التاريخ</TableHead>
                                        <TableHead className='text-right'>الحالة</TableHead>
                                        <TableHead className='text-right'>الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {commissions.length > 0 ? (
                                        commissions.map((c) => (
                                            <TableRow key={c.id}>
                                                <TableCell className='text-right'>{c.id.slice(0, 8)}</TableCell>
                                                <TableCell className='text-right'><SaudiRiyalAmount amount={c.commissionAmount || c.amount} locale="ar-SA" /></TableCell>
                                                <TableCell className='text-right'>{new Date(c.transactionDate).toLocaleDateString('ar-SA')}</TableCell>
                                                <TableCell className='text-right'>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${c.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {c.status === 'completed' ? 'مكتمل' : 'قيد المراجعة'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" onClick={() => setView('form')}>عرض</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                لا توجد عمولات مسجلة
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // FORM VIEW
    return (
        <Card className='bg-card rounded-xl shadow-lg border-0'>
            <CardHeader className="flex flex-row items-center justify-between pb-6">
                <CardTitle className="text-xl sm:text-2xl font-bold text-black">نموذج طلب سعي</CardTitle>
                <button
                    onClick={() => setView('list')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                    <span>رجوع للقائمة</span>
                    <ArrowDownCircle className="h-5 w-5 bg-muted rounded-full rotate-90" />
                </button>
            </CardHeader>
            
            <CardContent className="space-y-6">
                {/* 1. Status Section */}
                <div>
                    <Label className="mb-2 block">الصفة</Label>
                    <Select
                        value={commissionForm.status}
                        onValueChange={(value) => setCommissionForm(prev => ({ ...prev, status: value }))}
                    >
                        <SelectTrigger className="w-full text-right"><SelectValue placeholder="اختر الصفة" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="مباشر المالك">مباشر المالك</SelectItem>
                            <SelectItem value="مباشر الوكيل">مباشر الوكيل</SelectItem>
                            <SelectItem value="وسيط">وسيط</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-1 block">الاسم</Label>
                        <Input value={commissionForm.name} onChange={(e) => setCommissionForm(prev => ({ ...prev, name: e.target.value }))} className="text-right" />
                    </div>
                    <div>
                        <Label className="mb-1 block">رخصة فال</Label>
                        <Input value={commissionForm.license} onChange={(e) => setCommissionForm(prev => ({ ...prev, license: e.target.value }))} className="text-right" />
                    </div>
                </div>

                {/* 2. Party Data Section */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-right border-b pb-2">بيانات الأطراف</h3>
                    
                    {/* Owner/Seller Section */}
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                        <h4 className="font-semibold text-right">المالك أو البائع</h4>
                        <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label>الاسم</Label><Input value={commissionForm.ownerName} onChange={(e) => setCommissionForm(prev => ({...prev, ownerName: e.target.value}))} className="text-right"/></div>
                            <div><Label>رقم الهوية</Label><Input value={commissionForm.ownerId} onChange={(e) => setCommissionForm(prev => ({...prev, ownerId: e.target.value}))} className="text-right"/></div>
                        </div>
                    </div>

                    {/* Buyer Section */}
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                        <h4 className="font-semibold text-right">المشتري</h4>
                         <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label>الاسم</Label><Input value={commissionForm.buyerName} onChange={(e) => setCommissionForm(prev => ({...prev, buyerName: e.target.value}))} className="text-right"/></div>
                            <div><Label>رقم الهوية</Label><Input value={commissionForm.buyerId} onChange={(e) => setCommissionForm(prev => ({...prev, buyerId: e.target.value}))} className="text-right"/></div>
                        </div>
                    </div>
                </div>

                {/* 3. Brokers Data Section */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-right border-b pb-2">بيانات الوسطاء</h3>
                    <div className="overflow-x-auto">
                        <Table className="border border">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">الاسم</TableHead>
                                    <TableHead className="text-right">النسبة</TableHead>
                                    <TableHead className="text-right">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {brokers.map((broker) => (
                                    <TableRow key={broker.id}>
                                        <TableCell>{broker.name}</TableCell>
                                        <TableCell>{broker.percentage}%</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" onClick={() => setBrokers(brokers.filter(b => b.id !== broker.id))} className="text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <Button onClick={() => setShowBrokerModal(true)} className="w-full" variant="outline">
                        <Plus className="h-4 w-4 ml-2" /> إضافة وسيط
                    </Button>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4 border-t mt-4">
                    <Button onClick={() => setView('list')} className="flex-1" variant="outline">إلغاء</Button>
                    <Button onClick={() => { alert('تم الحفظ'); setView('list'); }} className="flex-1 bg-slate-900 text-white hover:bg-slate-800">حفظ وإرسال الطلب</Button>
                </div>
            </CardContent>

             {/* Broker Modal */}
            {showBrokerModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowBrokerModal(false)} dir="rtl">
                    <div className="bg-card border border rounded-xl shadow-2xl w-full w-[95vw] sm:max-w-md mx-4 p-3 sm:p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">إضافة وسيط</h2>
                        <div className="space-y-4">
                            <div><Label>الاسم</Label><Input value={brokerForm.name} onChange={(e) => setBrokerForm({...brokerForm, name: e.target.value})} /></div>
                            <div><Label>النسبة (%)</Label><Input type="number" value={brokerForm.percentage} onChange={(e) => setBrokerForm({...brokerForm, percentage: e.target.value})} /></div>
                            <Button onClick={() => {
                                setBrokers([...brokers, { id: Date.now(), ...brokerForm } as any]);
                                setShowBrokerModal(false);
                                setBrokerForm({ name: '', license: '', percentage: '', mobile: '', email: '' });
                            }} className="w-full">إضافة</Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
