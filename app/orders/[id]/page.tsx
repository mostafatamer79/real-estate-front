"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ordersApi } from "@/lib/api";
import { Order } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, MapPin, Ruler, DollarSign, Calendar, FileText, CheckCircle2, Building2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { t, language } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (params.id) {
            const response = await ordersApi.findOne(params.id as string);
            setOrder(response.data);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error(t('orders.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id, t]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800">{t('orders.notFound')}</h1>
        <Button variant="link" onClick={() => router.push('/orders')}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Toaster />
      <div className="max-w-4xl mx-auto">
        <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="mb-6 flex items-center gap-2 hover:bg-slate-100"
        >
            <ArrowRight className={`w-4 h-4 ${language === 'en' ? 'rotate-180' : ''}`} />
            {t('common.back')}
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    {t('orders.details')}
                    <Badge variant={order.orderType === 'buy' ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                        {t(`orders.${order.orderType}`)}
                    </Badge>
                </h1>
                <p className="text-gray-500 mt-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
            </div>
            {order.status && (
                 <Badge variant="outline" className="text-base px-4 py-2 border-2">
                    {order.status}
                </Badge>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Info Card */}
            <Card className="md:col-span-2 shadow-sm border-gray-200">
                <CardHeader className="bg-slate-50/50 pb-4 border-b border-gray-100">
                    <CardTitle className="flex items-center gap-2 text-xl text-primary">
                        <Building2 className="w-5 h-5" />
                        {t('orders.propType')}: <span className="text-gray-900">{order.propertyType}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-500">{t('orders.city')}</label>
                        <p className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            {order.city}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-500">{t('orders.neighborhood')}</label>
                        <p className="text-lg font-semibold text-gray-800">{order.neighborhood}</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-500">{t('orders.area')}</label>
                        <p className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                            <Ruler className="w-5 h-5 text-gray-400" />
                            {order.area} م²
                        </p>
                    </div>
                    <div className="space-y-1">
                         <label className="text-sm font-medium text-gray-500">{t('orders.price')}</label>
                        <p className="text-lg font-semibold flex items-center gap-2 text-primary">
                            <DollarSign className="w-5 h-5" />
                            {order.price.toLocaleString()}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Sidebar / Additional Info */}
            <div className="space-y-6">
                <Card className="shadow-sm border-gray-200">
                    <CardHeader className="bg-slate-50/50 pb-3 border-b border-gray-100">
                         <CardTitle className="text-base font-semibold">{t('bm.offer.detailed')}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <span className="text-gray-500">{t('orders.age')}</span>
                            <span className="font-medium">{order.propertyAge}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                             <span className="text-gray-500">{t('orders.deed')}</span>
                             <span className="font-medium">{t(`orders.deed.${order.deedType}`) || order.deedType}</span>
                        </div>
                        {order.rooms && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                <span className="text-gray-500">{t('orders.rooms')}</span>
                                <span className="font-medium">{order.rooms}</span>
                            </div>
                        )}
                         {order.bathrooms && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                <span className="text-gray-500">{t('orders.baths')}</span>
                                <span className="font-medium">{order.bathrooms}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                 {/* Features */}
                 <Card className="shadow-sm border-gray-200">
                    <CardHeader className="bg-slate-50/50 pb-3 border-b border-gray-100">
                         <CardTitle className="text-base font-semibold">{t('orders.details')}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex flex-wrap gap-2">
                            {order.hasGarage && <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1"/> {t('orders.garage')}</Badge>}
                            {order.hasPool && <Badge variant="secondary" className="bg-slate-50 text-blue-700 hover:bg-slate-100"><CheckCircle2 className="w-3 h-3 mr-1"/>{t('orders.pool')}</Badge>}
                            {order.hasElevator && <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100"><CheckCircle2 className="w-3 h-3 mr-1"/>{t('orders.elevator')}</Badge>}
                            {order.hasMaidRoom && <Badge variant="secondary" className="bg-slate-100 text-gray-700 hover:bg-slate-200"><CheckCircle2 className="w-3 h-3 mr-1"/>{t('orders.maid')}</Badge>}
                        </div>
                         {order.additionalDetails && (
                            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-gray-600 leading-relaxed">
                                <FileText className="w-4 h-4 inline-block mr-2 mb-1 text-gray-400" />
                                {order.additionalDetails}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
