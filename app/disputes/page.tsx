"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { legalServicesApi, LegalDispute } from "@/lib/legal-services";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, FileText, Gavel, ArrowRight } from "lucide-react";

export default function DisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<LegalDispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const res = await legalServicesApi.getLegalDisputes();
        // The API returns PaginatedResponse<LegalDispute> or just array? 
        // Based on legal-services.ts lines 169-170: returns response.data directly.
        // And response.data usually is the payload.
        // Let's assume it returns data compatible with what we expect, or handle array vs object.
        // The interface legalServicesApi.getLegalDisputes says it returns `response.data`.
        // If it's paginated, it might be { data: [], total: ... }
        // Let's check safely.
        if (Array.isArray(res)) {
            setDisputes(res);
        } else if (res && Array.isArray(res.data)) {
            setDisputes(res.data);
        } else {
            console.error("Unexpected response format", res);
            setDisputes([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'inProgress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'inProgress': return 'جاري العمل';
      case 'pending': return 'قيد الانتظار';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-4 flex items-center gap-2 hover:bg-gray-100"
      >
          <ArrowRight className="w-4 h-4" />
          عودة
      </Button>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">النزاعات العقارية</h1>
      
      {loading ? (
        <div className="text-center py-10">جاري التحميل...</div>
      ) : disputes.length === 0 ? (
        <div className="text-center text-gray-500 py-10">لا توجد نزاعات مسجلة حالياً</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {disputes.map((dispute) => (
            <Card key={dispute.id} className="hover:shadow-md transition-shadow bg-white">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-purple-600" />
                        {dispute.disputeType}
                    </h3>
                    <div className="mt-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(dispute.status)}`}>
                            {getStatusLabel(dispute.status)}
                        </span>
                    </div>
                  </div>
                   <div className="flex items-center text-gray-400 text-sm gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(dispute.createdAt).toLocaleDateString('ar-SA')}</span>
                   </div>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                    <div className="space-y-1">
                        <div className="text-xs text-gray-500">الطرف الأول</div>
                        <div className="text-sm font-medium flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {dispute.firstParty}
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <div className="text-xs text-gray-500">الطرف الثاني</div>
                        <div className="text-sm font-medium flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {dispute.secondParty}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs text-gray-500">رقم النزاع</div>
                        <div className="text-sm font-mono flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            {dispute.disputeNumber}
                        </div>
                    </div>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
