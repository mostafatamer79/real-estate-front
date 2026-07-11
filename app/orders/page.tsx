"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ordersApi } from "@/lib/api";
import { CreateOrderDto, Order } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowRight, PlusCircle, List, MapPin, Ruler, DollarSign, Calendar, SaudiRiyal } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";

  const propertyTypes = [
    { value: "شقة", label: "property.type.apartment" },
    { value: "فيلا", label: "property.type.villa" },
    { value: "قصر", label: "property.type.palace" },
    { value: "أرض", label: "property.type.land" },
    { value: "عمارة", label: "property.type.building" },
    { value: "استراحة", label: "property.type.restHouse" },
    { value: "محل تجاري", label: "property.type.shop" },
    { value: "مكتب", label: "property.type.office" },
    { value: "مستودع", label: "property.type.warehouse" }
  ];

  const orderTypes = [
    { value: "buy", label: "orders.buy" },
    { value: "rent", label: "orders.rent" }
  ];

  const deedTypes = [
    { value: "electronic", label: "property.deed.electronic" },
    { value: "paper", label: "property.deed.paper" },
    { value: "other", label: "property.deed.other" }
  ];

  const propertyAges = [
    { value: "جديد", label: "property.age.new" },
    { value: "أقل من 5 سنوات", label: "property.age.less5" },
    { value: "5-10 سنوات", label: "property.age.5to10" },
    { value: "10-20 سنة", label: "property.age.10to20" },
    { value: "أكثر من 20 سنة", label: "property.age.more20" }
  ];

  export default function CreateOrderPage() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const confirmDialog = useConfirmDialog();
    const { isOpen, message, isAdmin } = useSectionGuard('orders');



    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("create");
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [loadingMyOrders, setLoadingMyOrders] = useState(false);
    const [isDeptUser, setIsDeptUser] = React.useState(false);
    const [deptName, setDeptName] = React.useState('');
    const [formData, setFormData] = useState<CreateOrderDto>({
      orderType: "buy",
      propertyType: "شقة",
      city: "",
      neighborhood: "",
      area: 0,
      propertyAge: "جديد",
      deedType: "electronic",
      price: 0,
      rooms: 0,
      bathrooms: 0,
      livingRooms: 0,
      kitchens: 0,
      floors: 0,
      apartments: 0,
      hasMaidRoom: false,
      hasRoof: false,
      hasExternalAnnex: false,
      buildingArea: 0,
      hasGarage: false,
      hasPool: false,
      hasElevator: false,
      furnitureStatus: "unfurnished",
      additionalDetails: ""
    });

    const DEPT_NAMES: Record<string,string> = {
      marketing: 'إدارة التسويق',
      properties: 'إدارة الاملاك',
      finance: 'الإدارة المالية',
      legal: 'الإدارة القانونية',
      employees: 'إدارة الموظفين',
    };

    React.useEffect(() => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.department) {
            setIsDeptUser(true);
            setDeptName(DEPT_NAMES[parsed.department] ?? parsed.department);
          }
        }
      } catch {}
    }, []);

    React.useEffect(() => {
      if (activeTab === "my-orders") {
        fetchMyOrders();
      }
    }, [activeTab]);




  
    const handleChange = (field: keyof CreateOrderDto, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
  
      try {
        if (!formData.city || !formData.neighborhood || !formData.price || !formData.area) {
          throw new Error(t('orders.required'));
        }
  
        await ordersApi.create(formData);
        toast.success(t('orders.success'));
        
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
          rooms: 0,
          bathrooms: 0,
          livingRooms: 0,
          kitchens: 0,
          floors: 0,
          apartments: 0,
          hasMaidRoom: false,
          hasRoof: false,
          hasExternalAnnex: false,
          buildingArea: 0,
          hasGarage: false,
          hasPool: false,
          hasElevator: false,
          furnitureStatus: "unfurnished",
          additionalDetails: ""
        });
  
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || t('orders.error'));
      } finally {
        setIsSubmitting(false);
      }
    };
  
    const showDetailedFields = ["فيلا", "قصر", "شقة"].includes(formData.propertyType);

    const fetchMyOrders = async () => {
      try {
        setLoadingMyOrders(true);
        const response = await ordersApi.findMyOrders();
        setMyOrders(response.data);
      } catch (error: any) {
        if (error?.response?.status === 403) {
          setMyOrders([]);
          return;
        }
        console.error("Error fetching my orders:", error);
        toast.error("Failed to load your orders");
      } finally {
        setLoadingMyOrders(false);
      }
    };
    const MeterIcon = ({ className }: { className?: string }) => (
  <img src="/icons/meter.svg" alt="meter" className={className} style={{ width: '5em', height: '5em', opacity: 1 }} />
);


    const handleDeleteOrder = async (id: string) => {
        const ok = await confirmDialog({
            title: t('common.confirmDelete'),
            confirmLabel: language === 'ar' ? 'حذف' : 'Delete',
            cancelLabel: language === 'ar' ? 'إلغاء' : 'Cancel',
            destructive: true,
        });
        if (!ok) return;

        try {
            await ordersApi.delete(id);
            toast.success(t('common.deletedSuccess'));
            setMyOrders(myOrders.filter(o => o.id !== id));
        } catch (error) {
             toast.error(t('common.deleteError'));
        }
    }

  if (!isOpen) {
      return <ComingSoonOverlay sectionName={t('action.requests') || 'الطلبات'} message={message} isAdmin={isAdmin} />;
  }

  return (
      <div className="orders-page-root w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/90 text-slate-950 relative overflow-hidden pb-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className='absolute top-0 left-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none' />
        <div className='absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3 pointer-events-none' />
        <div className='absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-purple-400/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none' />
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-8 relative z-10">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/details')} 
            className="mb-4 flex items-center gap-2 hover:bg-slate-950/5 text-slate-800 font-bold"
          >
              <ArrowRight className={`w-4 h-4 ${language === 'en' ? 'rotate-180' : ''}`} />
              {t('common.back')}
          </Button>
          <div className="mb-8 text-center">
              <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-950 via-slate-800 to-indigo-950 tracking-tight mb-2">{t('orders.title')}</h1>
              <p className="text-slate-500 font-bold">{t('orders.subtitle')}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <TabsList className="grid w-full grid-cols-2 mb-8 !bg-slate-950/5 backdrop-blur-md border !border-slate-950/10 p-1.5 rounded-2xl h-auto gap-1">
              <TabsTrigger 
                value="create" 
                className="flex items-center justify-center gap-2 font-black py-3 rounded-xl transition-all duration-200 data-[state=active]:!bg-slate-950 data-[state=active]:!text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-950/5"
              >
                <PlusCircle className="w-4.5 h-4.5" />
                {t('orders.createOrder')}
              </TabsTrigger>
              <TabsTrigger 
                value="my-orders" 
                className="flex items-center justify-center gap-2 font-black py-3 rounded-xl transition-all duration-200 data-[state=active]:!bg-slate-950 data-[state=active]:!text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-950/5"
              >
                <List className="w-4.5 h-4.5" />
                {t('orders.myOrders')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <form onSubmit={handleSubmit}>
            <Card className="bg-card shadow-xl rounded-[1.25rem] overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">{t('orders.details')}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                
                <div className="space-y-2">
                  <Label className="text-slate-900 font-bold">{t('orders.type')}</Label>
                  <Select 
                      value={formData.orderType} 
                      onValueChange={(val) => handleChange("orderType", val)}
                  >
                    <SelectTrigger className="text-slate-900 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {orderTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {t(type.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
  
                <div className="space-y-2">
                  <Label className="text-slate-900 font-bold">{t('orders.propType')}</Label>
                  <Select 
                      value={formData.propertyType} 
                      onValueChange={(val) => handleChange("propertyType", val)}
                  >
                    <SelectTrigger className="text-slate-900 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map(pType => <SelectItem key={pType.value} value={pType.value}>{t(pType.label)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
  
                <div className="space-y-2">
                  <Label className="text-slate-900 font-bold">{t('orders.city')}</Label>
                  <Input className="placeholder:text-slate-900 text-slate-900 font-bold" 
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder={language === 'ar' ? ": الرياض" : "e.g. Riyadh"}
                    required
                  />
                </div>
  
                <div className="space-y-2">
                  <Label className="text-slate-900 font-bold">{t('orders.neighborhood')}</Label>
                  <Input className="placeholder:text-slate-900 text-slate-900 font-bold" 
                    value={formData.neighborhood}
                    onChange={(e) => handleChange("neighborhood", e.target.value)}
                    placeholder={language === 'ar' ? ": النرجس" : "e.g. Al-Narjis"}
                    required
                  />
                </div>
  
                <div className="space-y-2">
                  <Label className="text-slate-900 font-bold">{t('orders.area')}</Label>
                  <Input className="placeholder:text-slate-900 text-slate-900 font-bold" 
                    type="number"
                    value={formData.area || ''}
                    onChange={(e) => handleChange("area", Number(e.target.value))}
                    placeholder="0"
                    required
                  />
                </div>
  
                <div className="space-y-2">
                  <Label className="text-slate-900 font-bold">{t('orders.price')}</Label>
                  <Input className="placeholder:text-slate-900 text-slate-900 font-bold" 
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => handleChange("price", Number(e.target.value))}
                    placeholder="0"
                    required
                  />
                </div>
  
                <div className="space-y-2">
                  <Label className="text-slate-900 font-bold">{t('orders.age')}</Label>
                  <Select 
                      value={formData.propertyAge} 
                      onValueChange={(val) => handleChange("propertyAge", val)}
                  >
                    <SelectTrigger className="text-slate-900 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {propertyAges.map(item => <SelectItem key={item.value} value={item.value}>{t(item.label)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
  
                <div className="space-y-2">
                  <Label className="text-slate-900 font-bold">{t('orders.deed')}</Label>
                  <Select 
                      value={formData.deedType} 
                      onValueChange={(val) => handleChange("deedType", val)}
                  >
                    <SelectTrigger className="text-slate-900 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {deedTypes.map(item => <SelectItem key={item.value} value={item.value}>{t(item.label)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
  
              {showDetailedFields && (
                <div className="md:col-span-2 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-6">{t('bm.offer.detailed')}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-900 font-bold">{t('orders.rooms')}</Label>
                      <Input className="placeholder:text-slate-900 text-slate-900 font-bold" type="number" value={formData.rooms || ''} onChange={(e) => handleChange("rooms", Number(e.target.value))} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-900 font-bold">{t('orders.baths')}</Label>
                      <Input className="placeholder:text-slate-900 text-slate-900 font-bold" type="number" value={formData.bathrooms || ''} onChange={(e) => handleChange("bathrooms", Number(e.target.value))} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-900 font-bold">{t('orders.living')}</Label>
                      <Input className="placeholder:text-slate-900 text-slate-900 font-bold" type="number" value={formData.livingRooms || ''} onChange={(e) => handleChange("livingRooms", Number(e.target.value))} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-900 font-bold">{t('orders.kitchens')}</Label>
                      <Input className="placeholder:text-slate-900 text-slate-900 font-bold" type="number" value={formData.kitchens || ''} onChange={(e) => handleChange("kitchens", Number(e.target.value))} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-900 font-bold">{t('orders.floors')}</Label>
                      <Input className="placeholder:text-slate-900 text-slate-900 font-bold" type="number" value={formData.floors || ''} onChange={(e) => handleChange("floors", Number(e.target.value))} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-900 font-bold">{t('orders.apartments')}</Label>
                      <Input className="placeholder:text-slate-900 text-slate-900 font-bold" type="number" value={formData.apartments || ''} onChange={(e) => handleChange("apartments", Number(e.target.value))} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-900 font-bold">{t('orders.buildArea')}</Label>
                      <Input className="placeholder:text-slate-900 text-slate-900 font-bold" type="number" value={formData.buildingArea || ''} onChange={(e) => handleChange("buildingArea", Number(e.target.value))} placeholder="0" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                    <div className="flex items-center gap-2 border p-3 rounded-lg bg-muted/50">
                      <Checkbox id="maid" checked={formData.hasMaidRoom} onCheckedChange={(val) => handleChange("hasMaidRoom", !!val)} />
                      <Label htmlFor="maid" className="cursor-pointer">{t('orders.maid')}</Label>
                    </div>
                    <div className="flex items-center gap-2 border p-3 rounded-lg bg-muted/50">
                      <Checkbox id="roof" checked={formData.hasRoof} onCheckedChange={(val) => handleChange("hasRoof", !!val)} />
                      <Label htmlFor="roof" className="cursor-pointer">{t('orders.roof')}</Label>
                    </div>
                    <div className="flex items-center gap-2 border p-3 rounded-lg bg-muted/50">
                      <Checkbox id="annex" checked={formData.hasExternalAnnex} onCheckedChange={(val) => handleChange("hasExternalAnnex", !!val)} />
                      <Label htmlFor="annex" className="cursor-pointer">{t('orders.annex')}</Label>
                    </div>
                    <div className="flex items-center gap-2 border p-3 rounded-lg bg-muted/50">
                      <Checkbox id="garage" checked={formData.hasGarage} onCheckedChange={(val) => handleChange("hasGarage", !!val)} />
                      <Label htmlFor="garage" className="cursor-pointer">{t('orders.garage')}</Label>
                    </div>
                    <div className="flex items-center gap-2 border p-3 rounded-lg bg-muted/50">
                      <Checkbox id="pool" checked={formData.hasPool} onCheckedChange={(val) => handleChange("hasPool", !!val)} />
                      <Label htmlFor="pool" className="cursor-pointer">{t('orders.pool')}</Label>
                    </div>
                    <div className="flex items-center gap-2 border p-3 rounded-lg bg-muted/50">
                      <Checkbox id="elevator" checked={formData.hasElevator} onCheckedChange={(val) => handleChange("hasElevator", !!val)} />
                      <Label htmlFor="elevator" className="cursor-pointer">{t('orders.elevator')}</Label>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Label className="text-slate-900 font-bold">{t('orders.furniture')}</Label>
                    <Select 
                      value={formData.furnitureStatus} 
                      onValueChange={(val) => handleChange("furnitureStatus", val)}
                    >
                      <SelectTrigger className="text-slate-900 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="furnished">{t('orders.furnished')}</SelectItem>
                        <SelectItem value="unfurnished">{t('orders.unfurnished')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

                <div className="md:col-span-2 space-y-2">
                  <Label className="text-slate-900 font-bold">{t('orders.details')}</Label>
                  <Textarea 
                    value={formData.additionalDetails}
                    onChange={(e) => handleChange("additionalDetails", e.target.value)}
                    placeholder={language === 'ar' ? "أي تفاصيل أخرى ترغب بإضافتها..." : "Any additional details..."}
                    className="placeholder:text-slate-900 text-slate-900 font-bold min-h-[100px]"
                  />
                </div>
  
                <div className="md:col-span-2 pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-slate-950 hover:bg-slate-900 h-13 text-base font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-slate-950/10 flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin w-5 h-5" />
                          {t('orders.submitting')}
                      </div>
                    ) : t('orders.submit')}
                  </Button>
                </div>
  
            </CardContent>
          </Card>
        </form>
      </TabsContent>

      <TabsContent value="my-orders">
        {loadingMyOrders ? (
          <div className="flex justify-center py-6 md:py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : myOrders.length === 0 ? (
          <div className="text-center py-6 md:py-12 bg-muted rounded-xl border border-dashed border">
            <p className="text-gray-500 font-medium">{t('orders.noOrders')}</p>
            <Button variant="link" onClick={() => setActiveTab("create")}>
              {t('orders.createOrder')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {myOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow bg-card shadow-xl rounded-[1.25rem]">
                <CardHeader className="bg-muted/50 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            {order.propertyType}
                            <Badge variant={order.orderType === 'buy' ? 'default' : 'secondary'} className="text-xs">
                                {t(`orders.${order.orderType}`)}
                            </Badge>
                        </CardTitle>
                        <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{order.city} - {order.neighborhood}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MeterIcon className="w-4 h-4 text-gray-400" />
                    <span>{order.area} م²</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                     <SaudiRiyal className="w-4 h-4 text-gray-400" />
                     <span className="font-bold text-gray-900">{order.price.toLocaleString()}</span>
                  </div>
                   <div className="flex items-center gap-2 text-gray-600">
                     <Calendar className="w-4 h-4 text-gray-400" />
                     <span>{order.propertyAge}</span>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 py-3 flex justify-end gap-2">
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteOrder(order.id)}>
                        {t('common.delete')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/orders/${order.id}`)}>
                        {t('common.details')}
                    </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
        </div>
      </div>
    );
  }
