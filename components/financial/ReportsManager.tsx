
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ReportsManager() {
    const [reportType, setReportType] = useState('monthly');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

    const handleExport = (format: 'pdf' | 'excel') => {
        // Mock export functionality
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: `جاري إنشاء تقرير ${reportType === 'monthly' ? 'شهري' : 'سنوي'} بصيغة ${format.toUpperCase()}...`,
                success: 'تم تحميل التقرير بنجاح',
                error: 'فشل تحميل التقرير',
            }
        );
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>التقارير المالية</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">نوع التقرير</label>
                                <Select value={reportType} onValueChange={setReportType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">تقرير شهري</SelectItem>
                                        <SelectItem value="annual">تقرير سنوي</SelectItem>
                                        <SelectItem value="tax">تقرير ضريبي</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">السنة</label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2024">2024</SelectItem>
                                        <SelectItem value="2025">2025</SelectItem>
                                        <SelectItem value="2026">2026</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {reportType === 'monthly' && (
                                <div className="col-span-2">
                                    <label className="text-sm font-medium mb-1 block">الشهر</label>
                                    <Select value={month} onValueChange={setMonth}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                <SelectItem key={m} value={m.toString()}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 space-y-3">
                            <Button className="w-full justify-start" variant="outline" onClick={() => handleExport('pdf')}>
                                <FileText className="ml-2 h-4 w-4 text-red-600"/> تصدير PDF
                            </Button>
                            <Button className="w-full justify-start" variant="outline" onClick={() => handleExport('excel')}>
                                <Download className="ml-2 h-4 w-4 text-green-600"/> تصدير Excel
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>التقارير الضريبية</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg mb-4">
                            <p className="text-sm text-blue-800 font-bold mb-1">الرصيد الضريبي المستحق (تقديري)</p>
                            <p className="text-2xl font-bold text-blue-900">0.00 ريال</p>
                            <p className="text-xs text-blue-600 mt-1">يتم احتسابه بناءً على العمليات المسجلة</p>
                        </div>
                        <Button className="w-full justify-start" variant="outline" onClick={() => handleExport('pdf')}>
                            <FileText className="ml-2 h-4 w-4"/> إقرار ضريبة القيمة المضافة (الربع الحالي)
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
