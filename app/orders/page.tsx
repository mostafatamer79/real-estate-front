"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ordersApi } from "@/lib/api";
import { CreateOrderDto } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const propertyTypes = [
  "شقة", "فيلا", "أرض", "عمارة", "استراحة", "محل تجاري", "مكتب", "مستودع"
];

const orderTypes = [
  { value: "buy", label: "شراء" },
  { value: "rent", label: "إيجار" }
];

const deedTypes = [
  { value: "electronic", label: "صك إلكتروني" },
  { value: "paper", label: "صك ورقي" },
  { value: "other", label: "أخرى" }
];

const propertyAges = [
  "جديد", "أقل من 5 سنوات", "5-10 سنوات", "10-20 سنة", "أكثر من 20 سنة"
];

export default function CreateOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateOrderDto>({
    orderType: "buy",
    propertyType: "شقة",
    city: "",
    neighborhood: "",
    area: 0,
    propertyAge: "جديد",
    deedType: "electronic",
    price: 0,
    additionalDetails: ""
  });

  const handleChange = (field: keyof CreateOrderDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.city || !formData.neighborhood || !formData.price || !formData.area) {
        throw new Error("الرجاء ملء جميع الحقول المطلوبة");
      }

      await ordersApi.create(formData);
      toast.success("تم إنشاء طلب العقار بنجاح");
      
      // Reset form
      setFormData({
        orderType: "buy",
        propertyType: "شقة",
        city: "",
        neighborhood: "",
        area: 0,
        propertyAge: "جديد",
        deedType: "electronic",
        price: 0,
        additionalDetails: ""
      });

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "حدث خطأ أثناء إنشاء الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <Toaster />
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-4 flex items-center gap-2 hover:bg-gray-100"
        >
            <ArrowRight className="w-4 h-4" />
            عودة
        </Button>
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">طلب عقار جديد</h1>
            <p className="text-gray-500">سجل طلبك وسنقوم بالبحث عن العقار المناسب لك</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">بيانات الطلب</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <Label>نوع الطلب</Label>
                <Select 
                    value={formData.orderType} 
                    onValueChange={(val) => handleChange("orderType", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orderTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>نوع العقار</Label>
                <Select 
                    value={formData.propertyType} 
                    onValueChange={(val) => handleChange("propertyType", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>المدينة</Label>
                <Input 
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="مثال: الرياض"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>الحي</Label>
                <Input 
                  value={formData.neighborhood}
                  onChange={(e) => handleChange("neighborhood", e.target.value)}
                  placeholder="مثال: النرجس"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>المساحة المطلوبة (م²)</Label>
                <Input 
                  type="number"
                  value={formData.area || ''}
                  onChange={(e) => handleChange("area", Number(e.target.value))}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>السعر المتوقع (ريال)</Label>
                <Input 
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => handleChange("price", Number(e.target.value))}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>عمر العقار</Label>
                <Select 
                    value={formData.propertyAge} 
                    onValueChange={(val) => handleChange("propertyAge", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyAges.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>نوع الصك</Label>
                <Select 
                    value={formData.deedType} 
                    onValueChange={(val) => handleChange("deedType", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {deedTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>تفاصيل إضافية</Label>
                <Textarea 
                  value={formData.additionalDetails}
                  onChange={(e) => handleChange("additionalDetails", e.target.value)}
                  placeholder="أي تفاصيل أخرى ترغب بإضافتها..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="md:col-span-2 pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-blue-900 hover:bg-blue-800 h-12 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin w-5 h-5" />
                        جاري الإرسال...
                    </div>
                  ) : "إرسال الطلب"}
                </Button>
              </div>

            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
