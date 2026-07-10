"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { serviceRequestApi, ServiceRequest, ServiceStatus } from '@/lib/service-request-api';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  User,
  DollarSign,
  Calendar,
  Check,
  ChevronLeft,
  Search,
  ArrowLeft,
  Plus,
  Building2,
  Lock,
  SaudiRiyalIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '@/app/src/components/Header';
import { useConfirmDialog } from '@/components/ui/confirm-dialog-provider';
import { SaudiRiyalAmount } from '@/components/ui/saudi-riyal';

export default function MyServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const { t, language } = useLanguage();
  const router = useRouter();
  const confirmDialog = useConfirmDialog();

  useEffect(() => {
    fetchRequests();
  }, [page]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await serviceRequestApi.findAll({ page, limit: 10, mine: true });
      setRequests(response.data.items);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelfChat = async (requestId: string) => {
    try {
      const response = await serviceRequestApi.getOrCreateSelfChat(requestId);
      router.push(`/chat?roomId=${response.data.chatRoomId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error(t('common.error'));
    }
  };

  const handleStaffChat = async (requestId: string, staffId: string) => {
    try {
      const response = await serviceRequestApi.getOrCreateStaffChat(requestId, staffId);
      router.push(`/chat?roomId=${response.data.chatRoomId}`);
    } catch (error) {
      console.error('Error starting staff chat:', error);
      toast.error(t('common.error'));
    }
  };

  const handleAcceptOffer = async (requestId: string, deptSlug: string) => {
    const ok = await confirmDialog({
      title: language === 'ar' ? 'هل أنت متأكد من قبول هذا العرض؟' : 'Are you sure you want to accept this offer?',
      description: language === 'ar' ? 'سيتم اعتماد العرض والانتقال إلى مرحلة التنفيذ.' : 'This offer will be approved and moved to execution.',
      confirmLabel: language === 'ar' ? 'قبول العرض' : 'Accept offer',
      cancelLabel: language === 'ar' ? 'إلغاء' : 'Cancel',
    });
    if (!ok) return;

    try {
      const response = await serviceRequestApi.acceptDepartmentOffer(requestId, deptSlug);
      toast.success(language === 'ar' ? 'تم قبول العرض بنجاح' : 'Offer accepted successfully');
      setSelectedRequest(response.data);
      fetchRequests();
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error(t('common.error'));
    }
  };

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.PENDING:
        return <Badge variant="outline" className="border-slate-300 bg-card text-slate-600">{t('legal.status.pending')}</Badge>;
      case ServiceStatus.IN_PROGRESS:
        return <Badge variant="outline" className="border-slate-300 bg-card text-slate-600">{t('legal.status.in_progress')}</Badge>;
      case ServiceStatus.COMPLETED:
        return <Badge variant="outline" className="border-slate-300 bg-card text-slate-600">{t('legal.status.completed')}</Badge>;
      case ServiceStatus.CANCELLED:
        return <Badge variant="outline" className="border-slate-300 bg-card text-slate-600">{t('legal.status.cancelled')}</Badge>;
      default:
        return <Badge variant="outline" className="border-slate-300 bg-card text-slate-600">{status}</Badge>;
    }
  };

  if (selectedRequest) {
    const acceptedOffer = selectedRequest.metadata?.acceptedOffer;
    return (
      <div className="min-h-screen bg-muted" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Header />
        <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
          <Button
            variant="ghost"
            className="mb-6 gap-2 text-slate-500 hover:text-slate-900"
            onClick={() => setSelectedRequest(null)}
          >
            <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
            {language === 'ar' ? 'العودة للطلبات' : 'Back to Requests'}
          </Button>

          <Card className="overflow-hidden border shadow-xl rounded-2xl">
            <CardHeader className="bg-card border-b border p-4 sm:p-8">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl border border bg-card flex items-center justify-center text-slate-600">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{selectedRequest.serviceType}</h2>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="font-semibold text-slate-600">#{selectedRequest.id.substring(0, 8)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {getStatusBadge(selectedRequest.status)}
                  <Button
                    variant="outline"
                    className="border text-slate-700 hover:bg-muted gap-2 rounded-xl h-9 px-3 text-xs"
                    onClick={() => handleSelfChat(selectedRequest.id)}
                  >
                    <Lock className="w-4 h-4" />
                    {language === 'ar' ? 'ملاحظات خاصة' : 'Private Notes'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 mb-8">
                <div className="p-4 bg-muted rounded-xl border border">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'الموقع' : 'Location'}</p>
                  <p className="font-bold text-slate-800">{selectedRequest.city}, {selectedRequest.district}</p>
                </div>
                <div className="p-4 bg-muted rounded-xl border border">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'السعر' : 'Price'}</p>
                  <p className="font-bold text-slate-800 text-lg"><SaudiRiyalAmount amount={selectedRequest.price} locale={language === 'ar' ? 'ar-SA' : 'en-US'} /></p>
                </div>
                <div className="p-4 bg-muted rounded-xl border border">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'رقم الفاتورة' : 'Invoice Number'}</p>
                  <p className="font-mono font-bold text-blue-600">{selectedRequest.invoiceNumber || '---'}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">{language === 'ar' ? 'وصف الطلب' : 'Request Description'}</h3>
                  <div className="p-4 bg-card border border rounded-xl italic text-slate-600 leading-relaxed">
                    "{selectedRequest.description || (language === 'ar' ? 'لا يوجد وصف' : 'No description provided')}"
                  </div>
                </div>

                <div className="pt-6 border-t border">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <SaudiRiyalIcon className="w-4 h-4 text-slate-500" />
                    {language === 'ar' ? 'عروض الأسعار المتاحة' : 'Available Pricing Offers'}
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(selectedRequest.departmentPrices || {}).map(([dept, data]) => {
                      const isAccepted = acceptedOffer?.dept === dept;
                      return (
                        <div key={dept} className={`flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border transition-all ${isAccepted ? 'bg-muted border-slate-300' : 'bg-card border hover:border-slate-300'}`}>
                          <div className="flex items-center gap-4 mb-4 md:mb-0">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-card border border text-slate-500">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 capitalize">{dept === 'admin' ? (language === 'ar' ? 'الإدارة' : 'Admin') : dept}</span>
                                {isAccepted && <Badge variant="outline" className="border-slate-300 bg-card text-slate-600">{language === 'ar' ? 'مقبول' : 'Accepted'}</Badge>}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{data.note || (language === 'ar' ? 'عرض سعر رسمي' : 'Official pricing offer')}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-center md:items-end gap-3">
                            <div className="text-base font-black text-slate-900">
                              <SaudiRiyalAmount amount={data.price} locale={language === 'ar' ? 'ar-SA' : 'en-US'} />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 gap-2 rounded-lg hover:bg-muted text-slate-700 border text-xs"
                                onClick={() => handleStaffChat(selectedRequest.id, data.addedBy)}
                              >
                                <MessageSquare className="w-4 h-4" />
                                {language === 'ar' ? 'مراسلة العارض' : 'Chat Offerer'}
                              </Button>
                              {!isAccepted && !acceptedOffer && (
                                <Button
                                  size="sm"
                                  className="h-8 px-3 gap-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs"
                                  onClick={() => handleAcceptOffer(selectedRequest.id, dept)}
                                >
                                  <Check className="w-4 h-4" />
                                  {language === 'ar' ? 'اختيار العرض' : 'Select Offer'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {Object.keys(selectedRequest.departmentPrices || {}).length === 0 && (
                      <div className="p-12 text-center bg-muted rounded-2xl border border-dashed border">
                        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">
                          {language === 'ar' ? 'جاري انتظار عروض الأسعار من الأقسام المختصة...' : 'Waiting for pricing offers from relevant departments...'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header />

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        <Button
          variant="ghost"
          className="mb-6 gap-2 text-slate-500 hover:text-slate-900"
          onClick={() => router.back()}
        >
          <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
          {language === 'ar' ? 'العودة للخدمات' : 'Back to Services'}
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6 text-slate-600" />
              {t('chat.myRequests')}
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              {language === 'ar' ? 'إدارة ومتابعة طلبات الخدمات الخاصة بك في مكان واحد' : 'Manage and track your service requests in one place'}
            </p>
          </div>
          <Button
            onClick={() => router.push('/services')}
            className="bg-slate-900 hover:bg-black text-white gap-2 px-4 h-10 rounded-lg text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'طلب خدمة جديد' : 'New Service Request'}
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border rounded-full"></div>
            <div className="absolute inset-0 border-4 border-slate-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-slate-400 font-medium animate-pulse">{t('common.loading')}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-card rounded-2xl border border-dashed border p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {language === 'ar' ? 'لا توجد طلبات حتى الآن' : 'No requests yet'}
            </h3>
            <p className="text-sm text-slate-500 mb-6 w-[95vw] sm:max-w-md mx-auto">
              {language === 'ar' ? 'ابدأ بطلب أول خدمة لك، وسيقوم فريقنا بمراجعتها وتقديم العروض المناسبة.' : 'Start by requesting your first service, and our team will review it and provide suitable offers.'}
            </p>
            <Button onClick={() => router.push('/services')} variant="outline" className="h-10 px-5 rounded-lg font-bold border">
              {language === 'ar' ? 'تصفح الخدمات المتاحة' : 'Browse Available Services'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <div
                key={request.id}
                className="group bg-card rounded-2xl border border p-4 hover:border-slate-300 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-9 h-9 bg-muted rounded-xl border border flex items-center justify-center text-slate-600 transition-colors">
                    <Package className="w-4 h-4" />
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2 transition-colors line-clamp-1">
                  {request.serviceType}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                  <span className="font-bold text-slate-500">#{request.id.substring(0, 8)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(request.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border">
                  <div className="flex -space-x-2 rtl:space-x-reverse">
                    {Object.keys(request.departmentPrices || {}).map((dept, i) => (
                      <div key={dept} className="w-8 h-8 rounded-full bg-muted border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-500 uppercase" title={dept}>
                        {dept[0]}
                      </div>
                    ))}
                    {Object.keys(request.departmentPrices || {}).length === 0 && (
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'قيد المراجعة' : 'In Review'}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">{language === 'ar' ? 'السعر' : 'Price'}</p>
                    <p className="font-black text-slate-900"><SaudiRiyalAmount amount={request.price} locale={language === 'ar' ? 'ar-SA' : 'en-US'} /></p>
                  </div>
                </div>

                <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                  <ChevronRight className={`w-4 h-4 text-slate-500 ${language === 'ar' ? 'rotate-180' : ''}`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!selectedRequest && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-16">
            <Button
              variant="ghost"
              disabled={page === 1}
              onClick={(e) => { e.stopPropagation(); setPage(p => p - 1); }}
              className="rounded-lg h-10 px-4 font-bold text-sm"
            >
              <ChevronLeft className={`w-5 h-5 me-2 ${language === 'ar' ? 'rotate-180' : ''}`} />
              {language === 'ar' ? 'السابق' : 'Previous'}
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={page === p ? "default" : "ghost"}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm ${page === p ? 'bg-slate-900 text-white' : ''}`}
                >
                  {p}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              disabled={page === totalPages}
              onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }}
              className="rounded-lg h-10 px-4 font-bold text-sm"
            >
              {language === 'ar' ? 'التالي' : 'Next'}
              <ChevronRight className={`w-5 h-5 ms-2 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
