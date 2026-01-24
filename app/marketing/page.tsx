"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Camera, Megaphone, ClipboardList, Calendar, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { marketingApi, MarketingRequest, MarketingRequestType, CreateMarketingRequestDto } from '@/lib/marketing-service';

export default function MarketingPage() {
    const [activeTab, setActiveTab] = useState("photography");

    return (
        <div className="container mx-auto p-6" dir="rtl">
            <Toaster />
            <h1 className="text-3xl font-bold mb-6 text-right">إدارة التسويق</h1>

            <Tabs defaultValue="photography" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="photography" className="text-lg">
                        <Camera className="w-5 h-5 ml-2" />
                        خدمات التصوير العقاري
                    </TabsTrigger>
                    <TabsTrigger value="advertising" className="text-lg">
                        <Megaphone className="w-5 h-5 ml-2" />
                        الإعلان والترويج
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="text-lg">
                        <ClipboardList className="w-5 h-5 ml-2" />
                        إدارة طلبات التسويق
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="photography">
                    <PhotographySection />
                </TabsContent>

                <TabsContent value="advertising">
                    <AdvertisingSection />
                </TabsContent>

                <TabsContent value="requests">
                    <RequestManagementSection />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function PhotographySection() {
    const [formData, setFormData] = useState({
        propertyId: '',
        date: '',
        time: '',
        notes: '',
        type: MarketingRequestType.PHOTOGRAPHY_PROFESSIONAL
    });
    const [submitting, setSubmitting] = useState(false);
    const [myRequests, setMyRequests] = useState<MarketingRequest[]>([]);

    useEffect(() => {
        // Fetch current user's recent photography requests
        const load = async () => {
            try {
                const requests = await marketingApi.getMyRequests();
                // Filter locally for photography type for display
                const photoRequests = requests.filter(r => 
                    r.type === MarketingRequestType.PHOTOGRAPHY_PROFESSIONAL || 
                    r.type === MarketingRequestType.PHOTOGRAPHY_FIELD
                );
                setMyRequests(photoRequests);
            } catch (err) {
                console.error(err);
            }
        };
        load();
    }, [submitting]); // Reload after submit

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await marketingApi.createRequest({
                type: formData.type,
                details: {
                    propertyId: formData.propertyId,
                    preferredDate: formData.date,
                    preferredTime: formData.time,
                    notes: formData.notes
                }
            });
            toast.success("تم إرسال الطلب بنجاح");
            // Reset form
            setFormData(prev => ({ ...prev, propertyId: '', date: '', time: '', notes: '' }));
        } catch (err: any) {
            toast.error("فشل إرسال الطلب");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>طلب خدمة تصوير</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>نوع التصوير</Label>
                        <Select 
                            value={formData.type} 
                            onValueChange={(val) => setFormData({...formData, type: val as MarketingRequestType})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر نوع التصوير" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={MarketingRequestType.PHOTOGRAPHY_PROFESSIONAL}>تصوير احترافي (شركات معتمدة)</SelectItem>
                                <SelectItem value={MarketingRequestType.PHOTOGRAPHY_FIELD}>تصوير ميداني سريع (أفراد بالهاتف)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>رقم العقار / المعرف</Label>
                        <Input 
                            value={formData.propertyId}
                            onChange={(e) => setFormData({...formData, propertyId: e.target.value})}
                            placeholder="مثال: PROP-123"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>تاريخ وموعد الجلسة المفضل</Label>
                        <div className="flex gap-2">
                            <Input 
                                type="date" 
                                className="flex-1"
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                            />
                            <Input 
                                type="time" 
                                className="flex-1" 
                                value={formData.time}
                                onChange={(e) => setFormData({...formData, time: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>ملاحظات إضافية</Label>
                        <Textarea 
                            placeholder="أي تعليمات خاصة للمصور..." 
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>

                    <Button 
                        onClick={handleSubmit} 
                        disabled={submitting}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                    >
                        {submitting ? <Loader2 className="animate-spin" /> : "إرسال الطلب"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>طلباتي الحالية</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {myRequests.length === 0 && <p className="text-gray-500 text-center">لا توجد طلبات سابقة</p>}
                        {myRequests.map((req) => (
                            <div key={req.id} className="border rounded-lg p-4 flex justify-between items-center bg-gray-50">
                                <div>
                                    <p className="font-bold">طلب {req.type === MarketingRequestType.PHOTOGRAPHY_PROFESSIONAL ? 'احترافي' : 'ميداني'}</p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(req.createdAt).toLocaleDateString('ar-SA')}
                                    </p>
                                    {req.details?.propertyId && <p className="text-xs text-gray-400">عقار: {req.details.propertyId}</p>}
                                </div>
                                <div className="text-left">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                          req.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {req.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function AdvertisingSection() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <div className="p-3 bg-blue-100 rounded-full mb-3">
                            <Megaphone className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-bold mb-1">ربط السوشيال ميديا</h3>
                        <p className="text-sm text-gray-500 mb-4">Twitter, Instagram, TikTok</p>
                        <Button variant="outline" size="sm" className="w-full">إدارة الربط</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <div className="p-3 bg-green-100 rounded-full mb-3">
                            <ClipboardList className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="font-bold mb-1">النشر التلقائي</h3>
                        <p className="text-sm text-gray-500 mb-4">نشر العروض تلقائياً عند إضافتها</p>
                        <Button variant="outline" size="sm" className="w-full">تفعيل</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <div className="p-3 bg-purple-100 rounded-full mb-3">
                            <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="font-bold mb-1">جدولة الحملات</h3>
                        <p className="text-sm text-gray-500 mb-4">تخطيط الحملات الإعلانية القادمة</p>
                        <Button variant="outline" size="sm" className="w-full">إنشاء حملة</Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>أداء الحملات والإعلانات</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">العنوان</TableHead>
                                <TableHead className="text-right">المنصة</TableHead>
                                <TableHead className="text-right">المشاهدات</TableHead>
                                <TableHead className="text-right">التفاعل</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">فيلا مودرن للبيع - الرياض</TableCell>
                                <TableCell>Twitter</TableCell>
                                <TableCell>1,234</TableCell>
                                <TableCell>56</TableCell>
                                <TableCell>
                                    <span className="text-green-600 flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4" /> نشط
                                    </span>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function RequestManagementSection() {
    const [requests, setRequests] = useState<MarketingRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                // Fetch all my requests
                const data = await marketingApi.getMyRequests();
                setRequests(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>سجل طلبات التسويق</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline">تصدير PDF</Button>
                        <Button variant="outline">فلترة</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? <div className="text-center p-4">جاري التحميل...</div> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">رقم الطلب</TableHead>
                                <TableHead className="text-right">نوع الخدمة</TableHead>
                                <TableHead className="text-right">التاريخ</TableHead>
                                <TableHead className="text-right">المسؤول</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                                <TableHead className="text-right">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500">لا توجد طلبات</TableCell>
                                </TableRow>
                            )}
                            {requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.id.slice(0, 8)}</TableCell>
                                    <TableCell>{req.type}</TableCell>
                                    <TableCell>{new Date(req.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                                    <TableCell>{req.assignedTo || '-'}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs 
                                            ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                              req.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                              req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>
                                            {req.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm">التفاصيل</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
