"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../src/components/Header";
import { ChevronLeft, Upload, Plus, Camera, ShoppingCart, Calendar, User, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/src/components/ui/card";

const residentialSubtypes = [
  { id: "land", label: "اراضي سكنية" },
  { id: "villas", label: "فلل / قصور" },
  { id: "apartments", label: "شقق" },
];

const commercialSubtypes = [
  { id: "office-towers", label: "ابراج مكتبية/ مكاتب" },
  { id: "shops", label: "محلات تجارية" },
  { id: "hotels", label: "فنادق" },
  { id: "towers", label: "ابراج" },
];

const allPropertyTypes = [
  ...residentialSubtypes,
  ...commercialSubtypes,
];

export default function OrdersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [showMediaSection, setShowMediaSection] = useState(false);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);

  // Basic Order Data
  const [orderType, setOrderType] = useState<"buy" | "rent" | "">("");
  const [propertyType, setPropertyType] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [propertyAge, setPropertyAge] = useState("");
  const [deedType, setDeedType] = useState<"electronic" | "paper" | "">("");
  const [price, setPrice] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");

  // Media Section Data
  const [mediaPropertyType, setMediaPropertyType] = useState("");
  const [dimensions, setDimensions] = useState({ length: "", width: "" });
  const [mediaArea, setMediaArea] = useState("");
  const [mediaPropertyAge, setMediaPropertyAge] = useState("");
  const [direction, setDirection] = useState("");
  const [mediaPrice, setMediaPrice] = useState("");
  const [mediaCity, setMediaCity] = useState("");
  const [mediaDistrict, setMediaDistrict] = useState("");
  const [streetWidth, setStreetWidth] = useState("");
  const [mediaDeedType, setMediaDeedType] = useState<"electronic" | "paper" | "">("");
  const [propertyCondition, setPropertyCondition] = useState("");

  // Detailed Info (for villas/palaces/apartments)
  const [rooms, setRooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [halls, setHalls] = useState("");
  const [kitchens, setKitchens] = useState("");
  const [floors, setFloors] = useState("");
  const [apartments, setApartments] = useState("");
  const [hasMaidRoom, setHasMaidRoom] = useState<"yes" | "no" | "">("");
  const [hasRoof, setHasRoof] = useState<"yes" | "no" | "">("");
  const [hasExternalAnnex, setHasExternalAnnex] = useState<"yes" | "no" | "">("");
  const [buildingArea, setBuildingArea] = useState("");
  const [hasCarEntrance, setHasCarEntrance] = useState<"yes" | "no" | "">("");
  const [hasPool, setHasPool] = useState<"yes" | "no" | "">("");
  const [hasElevator, setHasElevator] = useState<"yes" | "no" | "">("");
  const [furniture, setFurniture] = useState("");

  // Attachments
  const [propertyDocuments, setPropertyDocuments] = useState<File | null>(null);
  const [checkImage, setCheckImage] = useState<File | null>(null);
  const [propertyDocumentsText, setPropertyDocumentsText] = useState("");
  const [checkImageText, setCheckImageText] = useState("");
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  
  // Media Section - Photos and Videos
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<File[]>([]);

  const handleSubmitOrder = () => {
    // Basic validation
    if (!orderType || !propertyType || !city || !district || !deedType || !price) {
      toast({
        variant: "default",
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
      });
      return;
    }
    // Handle order submission
    toast({
      title: "تم الإرسال",
      description: "تم إرسال الطلب بنجاح",
    });
    setShowMediaSection(true);
  };

  const isDetailedInfoRequired = () => {
    return propertyType === "villas" || propertyType === "apartments";
  };

  const handleFileUpload = (type: "documents" | "check", file: File | null) => {
    if (type === "documents") {
      setPropertyDocuments(file);
    } else {
      setCheckImage(file);
    }
  };

  const handleMediaUpload = (type: "photo" | "video", files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    if (type === "photo") {
      setUploadedPhotos((prev) => [...prev, ...fileArray]);
    } else {
      setUploadedVideos((prev) => [...prev, ...fileArray]);
    }
  };

  const removeMediaFile = (type: "photo" | "video", index: number) => {
    if (type === "photo") {
      setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setUploadedVideos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <section className="w-full min-h-screen flex flex-col" dir="rtl">
      {/* Navigation Arrow */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-6">
        <button
          onClick={() => router.push("/details")}
          className="flex items-center gap-2  transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          الصفحة الرئيسية
        </button>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold ">صفحة الطلبات</h1>
          <Button
            onClick={() => setShowAddOrder(!showAddOrder)}
            className="bg-gray-800 hover:bg-gray-700 text-white"
          >
            إضافة طلب
          </Button>
        </div>

        {/* Add Order Form */}
        {showAddOrder && (
          <div className="space-y-6">
            {/* Basic Order Data */}
            <Card >
              <CardHeader>
                <CardTitle className="text-xl font-bold ">بيانات الطلب الأساسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      نوع الطلب <span className="text-red-500">*</span>
                    </label>
                    <Select value={orderType} onValueChange={(value) => setOrderType(value as "buy" | "rent")}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="اختر نوع الطلب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">شراء</SelectItem>
                        <SelectItem value="rent">إيجار</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      نوع العقار المطلوب <span className="text-red-500">*</span>
                    </label>
                    <Select value={propertyType} onValueChange={(value) => {
                      setPropertyType(value);
                      setShowDetailedInfo(value === "villas" || value === "apartments");
                    }}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="اختر نوع العقار" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential" disabled>عقار سكني</SelectItem>
                        {residentialSubtypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="commercial" disabled>عقار تجاري</SelectItem>
                        {commercialSubtypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      المدينة <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="أدخل المدينة"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      الحي <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="أدخل الحي"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">المساحة</label>
                    <Input
                      type="number"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="أدخل المساحة"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">عمر العقار</label>
                    <Input
                      type="number"
                      value={propertyAge}
                      onChange={(e) => setPropertyAge(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="أدخل عمر العقار"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      نوع الصك <span className="text-red-500">*</span>
                    </label>
                    <Select value={deedType} onValueChange={(value) => setDeedType(value as "electronic" | "paper")}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="اختر نوع الصك" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electronic">إلكتروني</SelectItem>
                        <SelectItem value="paper">ورقي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      السعر <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="أدخل السعر"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">تفاصيل إضافية</label>
                  <Textarea
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="أدخل تفاصيل إضافية"
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSubmitOrder}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                >
                  إرسال الطلب
                </Button>
              </CardContent>
            </Card>

            {/* Media Section - Shows after order submission */}
            {showMediaSection && (
              <Card >
                <CardHeader>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Photos and Videos Section */}
                  <div className="mt-6 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Photos Upload */}
                    <div>
                      <label className="block text-sm font-medium mb-3">
                        رفع الصور
                      </label>
                      <div className="flex items-center gap-2 mb-3">
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleMediaUpload("photo", e.target.files)}
                          className="bg-gray-700 border-gray-600 hidden"
                          id="upload-photos"
                        />
                        <label
                          htmlFor="upload-photos"
                          className="flex items-center gap-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 text-white"
                        >
                          <Upload className="w-4 h-4" />
                          رفع صور
                        </label>
                        {uploadedPhotos.length > 0 && (
                          <span className="text-sm text-white">
                            ({uploadedPhotos.length} صورة)
                          </span>
                        )}
                      </div>
                      {uploadedPhotos.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {uploadedPhotos.map((photo, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-600"
                              />
                              <button
                                onClick={() => removeMediaFile("photo", index)}
                                className="absolute top-1 left-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <p className="text-xs text-white mt-1 truncate">{photo.name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Videos Upload */}
                    <div>
                      <label className="block text-sm font-medium mb-3">
                        رفع فيديو
                      </label>
                      <div className="flex items-center gap-2 mb-3">
                        <Input
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={(e) => handleMediaUpload("video", e.target.files)}
                          className="bg-gray-700 border-gray-600 hidden"
                          id="upload-videos"
                        />
                        <label
                          htmlFor="upload-videos"
                          className="flex items-center gap-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 text-white"
                        >
                          <Upload className="w-4 h-4" />
                          رفع فيديو
                        </label>
                        {uploadedVideos.length > 0 && (
                          <span className="text-sm text-white">
                            ({uploadedVideos.length} فيديو)
                          </span>
                        )}
                      </div>
                      {uploadedVideos.length > 0 && (
                        <div className="space-y-3">
                          {uploadedVideos.map((video, index) => (
                            <div key={index} className="relative group bg-gray-800 rounded-lg p-3 border border-gray-600">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-white font-medium">{video.name}</p>
                                    <p className="text-xs text-gray-400">
                                      {(video.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeMediaFile("video", index)}
                                  className="bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium mb-2">الطول</label>
                        <Input
                          type="number"
                          value={dimensions.length}
                          onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="الطول"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">العرض</label>
                        <Input
                          type="number"
                          value={dimensions.width}
                          onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="العرض"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        المساحة <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        value={mediaArea}
                        onChange={(e) => setMediaArea(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="أدخل المساحة"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        الواجهة <span className="text-red-500">*</span>
                      </label>
                      <Select value={direction} onValueChange={setDirection}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="اختر الواجهة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="north">شمال</SelectItem>
                          <SelectItem value="south">جنوب</SelectItem>
                          <SelectItem value="east">شرق</SelectItem>
                          <SelectItem value="west">غرب</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        السعر <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        value={mediaPrice}
                        onChange={(e) => setMediaPrice(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="أدخل السعر"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        عرض الشارع <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        value={streetWidth}
                        onChange={(e) => setStreetWidth(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="أدخل عرض الشارع"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        حالة العقار <span className="text-red-500">*</span>
                      </label>
                      <Select value={propertyCondition} onValueChange={setPropertyCondition}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="اختر حالة العقار" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">جديد</SelectItem>
                          <SelectItem value="used">مستعمل</SelectItem>
                          <SelectItem value="renovated">مجدد</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Info - Only for villas/palaces/apartments */}
            {showDetailedInfo && (propertyType === "villas" || propertyType === "apartments") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold ">بيانات تفصيلية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">عدد الغرف</label>
                      <Input
                        type="number"
                        value={rooms}
                        onChange={(e) => setRooms(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="عدد الغرف"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">عدد دورات المياه</label>
                      <Input
                        type="number"
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="عدد دورات المياه"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">عدد الصالات</label>
                      <Input
                        type="number"
                        value={halls}
                        onChange={(e) => setHalls(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="عدد الصالات"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">عدد المطابخ</label>
                      <Input
                        type="number"
                        value={kitchens}
                        onChange={(e) => setKitchens(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="عدد المطابخ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">عدد الأدوار</label>
                      <Input
                        type="number"
                        value={floors}
                        onChange={(e) => setFloors(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="عدد الأدوار"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">عدد الشقق (لو فيلا فيها شقق)</label>
                      <Input
                        type="number"
                        value={apartments}
                        onChange={(e) => setApartments(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="عدد الشقق"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">وجود غرفة خادمة</label>
                      <Select value={hasMaidRoom} onValueChange={(value) => setHasMaidRoom(value as "yes" | "no")}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="اختر" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">نعم</SelectItem>
                          <SelectItem value="no">لا</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">وجود سطح</label>
                      <Select value={hasRoof} onValueChange={(value) => setHasRoof(value as "yes" | "no")}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="اختر" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">نعم</SelectItem>
                          <SelectItem value="no">لا</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">وجود ملحق خارجي</label>
                      <Select value={hasExternalAnnex} onValueChange={(value) => setHasExternalAnnex(value as "yes" | "no")}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="اختر" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">نعم</SelectItem>
                          <SelectItem value="no">لا</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">مساحة البناء</label>
                      <Input
                        type="number"
                        value={buildingArea}
                        onChange={(e) => setBuildingArea(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="مساحة البناء"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">مدخل سيارة / كراج</label>
                      <Select value={hasCarEntrance} onValueChange={(value) => setHasCarEntrance(value as "yes" | "no")}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="اختر" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">نعم</SelectItem>
                          <SelectItem value="no">لا</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">مسبح</label>
                      <Select value={hasPool} onValueChange={(value) => setHasPool(value as "yes" | "no")}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="اختر" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">نعم</SelectItem>
                          <SelectItem value="no">لا</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">مصعد</label>
                      <Select value={hasElevator} onValueChange={(value) => setHasElevator(value as "yes" | "no")}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="اختر" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">نعم</SelectItem>
                          <SelectItem value="no">لا</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">الأثاث</label>
                      <Select value={furniture} onValueChange={setFurniture}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="اختر" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="furnished">مفروش</SelectItem>
                          <SelectItem value="unfurnished">غير مفروش</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attachments Section */}
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold ">المرفقات</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={(e) => handleFileUpload("documents", e.target.files?.[0] || null)}
                      className="bg-gray-700 border-gray-600 hidden"
                      id="property-documents"
                    />
                    <label
                      htmlFor="property-documents"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 text-white"
                    >
                      <Upload className="w-4 h-4" />
                      رفع ملف
                    </label>
                    {propertyDocuments && (
                      <span className="text-sm ">{propertyDocuments.name}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

          
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold ">خيارات الإجراء السريعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    className="w-full bg-gray-700 hover:bg-gray-700 text-white h-12"
                    onClick={() => setShowVisitModal(true)}
                  >
                    <Calendar className="w-5 h-5" />
                    طلب زيارة عقار
                  </Button>

                  <Button
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white h-12"
                    onClick={() => setShowPurchaseModal(true)}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    شراء عقار
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

       
        {!showAddOrder && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="">لا توجد طلبات حالياً. اضغط على "إضافة طلب" لإنشاء طلب جديد.</p>
            </CardContent>
          </Card>
        )}

        
        {showVisitModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowVisitModal(false)}>
            <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="text-xl font-bold">طلب زيارة عقار</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">طلب مندوب</label>
                  <Select>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="اختر نوع الطلب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">طلب مندوب</SelectItem>
                      <SelectItem value="appointment">تحديد موعد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white"
                    onClick={() => {
                      toast({
                        title: "تم الإرسال",
                        description: "تم إرسال طلب الزيارة بنجاح",
                      });
                      setShowVisitModal(false);
                    }}
                  >
                    إرسال
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowVisitModal(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        
        {showPurchaseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPurchaseModal(false)}>
            <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="text-xl font-bold">شراء عقار</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">سيتم نقلك لخطوات إتمام عملية الشراء</p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                    onClick={() => {
                      // Navigate to purchase flow
                      toast({
                        title: "بدء العملية",
                        description: "سيتم نقلك لخطوات إتمام عملية الشراء",
                      });
                      setShowPurchaseModal(false);
                      // router.push("/purchase"); // Uncomment when purchase page is ready
                    }}
                  >
                    متابعة
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowPurchaseModal(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}

