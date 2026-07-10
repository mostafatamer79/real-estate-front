"use client";

import { useState, useRef } from "react";
import {
  ShoppingBag,
  FileText,
  Megaphone,
  DollarSign,
  Scale,
  Home,
  Upload,
  Plus,
  X,
  AlertCircle,
  SaudiRiyalIcon,
} from "lucide-react";
import { offersApi, uploadFile, prepareOfferData } from "@/lib/api";
import { useOffers } from "@/hooks/useOffers";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { SaudiRiyalSymbol } from "@/components/ui/saudi-riyal";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  {
    id: "offers",
    label: "ادارة العروض",
    icon: ShoppingBag,
  },
  {
    id: "orders",
    label: "ادارة الطلبات",
    icon: FileText,
  },
  {
    id: "marketing",
    label: "ادارة التسويق",
    icon: Megaphone,
  },
  {
    id: "financial",
    label: "الادارة المالية",
    icon: SaudiRiyalIcon,
  },
  {
    id: "legal",
    label: "الادارة القانونية",
    icon: Scale,
  },
];

// Type for form data
interface FormData {
  propertyType: string;
  length: string;
  width: string;
  area: string;
  propertyAge: string;
  direction: string;
  price: string;
  city: string;
  neighborhood: string;
  streetWidth: string;
  deedType: string;
  propertyCondition: string;
  rooms: string;
  bathrooms: string;
  livingRooms: string;
  kitchens: string;
  floors: string;
  apartments: string;
  hasMaidRoom: string;
  hasRoof: string;
  hasExternalAnnex: string;
  buildingArea: string;
  hasGarage: string;
  hasPool: string;
  hasElevator: string;
  furnitureStatus: string;
  dealType: string;
}

export default function BuildingManagement() {
  const router = useRouter();
  const [selectedSection, setSelectedSection] = useState<string>("offers");
  const [propertyType, setPropertyType] = useState<string>("");
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [files, setFiles] = useState<File[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>("");
  const [checkImage, setCheckImage] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData>({
    propertyType: "",
    length: "",
    width: "",
    area: "",
    propertyAge: "",
    direction: "",
    price: "",
    city: "",
    neighborhood: "",
    streetWidth: "",
    deedType: "",
    propertyCondition: "",
    rooms: "",
    bathrooms: "",
    livingRooms: "",
    kitchens: "",
    floors: "",
    apartments: "",
    hasMaidRoom: "",
    hasRoof: "",
    hasExternalAnnex: "",
    buildingArea: "",
    hasGarage: "",
    hasPool: "",
    hasElevator: "",
    furnitureStatus: "",
    dealType: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const checkImageInputRef = useRef<HTMLInputElement>(null);

  const { createOffer, uploadMedia, loading: offersLoading } = useOffers();

  const propertyTypes = ["فيلا", "قصر", "شقة", "أرض", "محل تجاري", "مكتب"];
  const propertyAges = ["أقل من سنة", "1-5 سنوات", "6-10 سنوات", "أكثر من 10 سنوات"];
  const directions = ["شمال", "جنوب", "شرق", "غرب"];
  const deedTypes = ["الكتروني", "ورقي"];
  const propertyConditions = ["جديد", "مستعمل", "مجدد"];
  const yesNoOptions = ["نعم", "لا"];
  const furnitureOptions = ["مفروش", "غير مفروش"];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const handleCheckImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCheckImage(e.target.files[0]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const removeCheckImage = () => {
    setCheckImage(null);
  };

  const handlePropertyTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    setPropertyType(type);
    setShowDetails(["فيلا", "قصر", "شقة"].includes(type));
    setFormData({ ...formData, propertyType: type });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const uploadAllFiles = async (offerId: string): Promise<void> => {
    try {
      // Upload media files
      if (files.length > 0) {
        await uploadMedia(offerId, files);
      }

      // Upload check image if exists
      if (checkImage) {
        const checkImageUrl = await uploadFile(checkImage, 'check');
        await offersApi.update(offerId, { checkImage: checkImageUrl });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.propertyType || !formData.area || !formData.price ||
          !formData.city || !formData.neighborhood || !formData.deedType ||
          !formData.propertyCondition) {
        throw new Error("الرجاء ملء جميع الحقول المطلوبة");
      }

      // Prepare offer data
      const offerData = prepareOfferData(formData);
      offerData.additionalNotes = additionalNotes;

      // Create the offer
      const createdOffer = await createOffer(offerData);

      // Upload files after offer is created
      if (files.length > 0 || checkImage) {
        await uploadAllFiles(createdOffer.id);
      }

      // Show success toast
      toast.success("تم حفظ العرض بنجاح!", {
        duration: 3000,
        position: "top-center",
        style: {
          background: "#10b981",
          color: "white",
          padding: "16px",
          borderRadius: "8px",
          fontWeight: "bold",
        },
        icon: "✅",
      });

      // Reset form
      resetForm();

      // Navigate to details page after delay
      setTimeout(() => {
        router.push(`/details`);
      }, 2000);

    } catch (error: any) {
      console.error("Error creating offer:", error);

      // Show error toast
      toast.error(error.message || "حدث خطأ أثناء حفظ العرض. الرجاء المحاولة مرة أخرى.", {
        duration: 4000,
        position: "top-center",
        style: {
          background: "#ef4444",
          color: "white",
          padding: "16px",
          borderRadius: "8px",
          fontWeight: "bold",
        },
        icon: "❌",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPropertyType("");
    setShowDetails(false);
    setFiles([]);
    setAdditionalNotes("");
    setCheckImage(null);
    setFormData({
      propertyType: "",
      length: "",
      width: "",
      area: "",
      propertyAge: "",
      direction: "",
      price: "",
      city: "",
      neighborhood: "",
      streetWidth: "",
      deedType: "",
      propertyCondition: "",
      rooms: "",
      bathrooms: "",
      livingRooms: "",
      kitchens: "",
      floors: "",
      apartments: "",
      hasMaidRoom: "",
      hasRoof: "",
      hasExternalAnnex: "",
      buildingArea: "",
      hasGarage: "",
      hasPool: "",
      hasElevator: "",
      furnitureStatus: "",
      dealType: "",
    });
  };

  const renderMainContent = () => {
    if (selectedSection !== "offers") {
      return (
        <div className="p-6 bg-muted rounded-lg border border">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {sidebarItems.find((item) => item.id === selectedSection)?.label}
          </h2>
          <p className="text-gray-600">
            محتوى قسم {sidebarItems.find((item) => item.id === selectedSection)?.label} سيظهر هنا
          </p>
        </div>
      );
    }

    return (
      <div className="bg-card/80 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-muted rounded-lg">
            <Home className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">إنشاء عرض جديد</h1>
            <p className="text-gray-600">أضف تفاصيل العرض العقاري</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* صور و فيديو ثلاثي الابعاد */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">صور و فيديو ثلاثي الابعاد</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">اسحب وأفلت الملفات هنا أو انقر للتحميل</p>
              <p className="text-sm text-gray-500 mb-4">يدعم الصور والفيديو بجميع الصيغ</p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                ref={fileInputRef}
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                رفع الملفات
              </label>
            </div>

            {/* الملفات المرفوعة */}
            {files.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-700 mb-2">الملفات المرفوعة:</h3>
                <div className="grid grid-cols-2 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {files.map((file, index) => (
                    <div key={index} className="relative border rounded-lg p-3">
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 left-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="mt-2">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* معلومات العقار الأساسية */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">معلومات العقار الأساسية</h2>
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-6">
              {/* نوع العقار */}
              <div>
                <label className="block text-gray-700 mb-2">
                  نوع العقار <span className="text-red-500">*</span>
                </label>
                <select
                  name="propertyType"
                  value={propertyType}
                  onChange={handlePropertyTypeChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">اختر نوع العقار</option>
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* الأطوال */}
              <div>
                <label className="block text-gray-700 mb-2">الأطوال (الطول × العرض)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="length"
                    placeholder="الطول"
                    value={formData.length}
                    onChange={handleInputChange}
                    className="flex-1 p-3 border border-gray-300 rounded-lg"
                  />
                  <span className="self-center">×</span>
                  <input
                    type="number"
                    name="width"
                    placeholder="العرض"
                    value={formData.width}
                    onChange={handleInputChange}
                    className="flex-1 p-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* المساحة */}
              <div>
                <label className="block text-gray-700 mb-2">
                  المساحة <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <span className="absolute left-3 top-3 text-gray-500">م²</span>
                </div>
              </div>

              {/* عمر العقار */}
              <div>
                <label className="block text-gray-700 mb-2">
                  عمر العقار <span className="text-red-500">*</span>
                </label>
                <select
                  name="propertyAge"
                  value={formData.propertyAge}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">اختر عمر العقار</option>
                  {propertyAges.map((age) => (
                    <option key={age} value={age}>
                      {age}
                    </option>
                  ))}
                </select>
              </div>

              {/* الواجهة */}
              <div>
                <label className="block text-gray-700 mb-2">
                  الواجهة <span className="text-red-500">*</span>
                </label>
                <select
                  name="direction"
                  value={formData.direction}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">اختر اتجاه الواجهة</option>
                  {directions.map((dir) => (
                    <option key={dir} value={dir}>
                      {dir}
                    </option>
                  ))}
                </select>
              </div>

              {/* السعر */}
              <div>
                <label className="block text-gray-700 mb-2">
                  السعر <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <span className="absolute left-3 top-3 text-gray-500"><SaudiRiyalSymbol iconClassName="h-4 w-4" /></span>
                </div>
              </div>

              {/* المدينة - الحي */}
              <div>
                <label className="block text-gray-700 mb-2">
                  المدينة – الحي <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="city"
                    placeholder="المدينة"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <input
                    type="text"
                    name="neighborhood"
                    placeholder="الحي"
                    value={formData.neighborhood}
                    onChange={handleInputChange}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* عرض الشارع */}
              <div>
                <label className="block text-gray-700 mb-2">عرض الشارع</label>
                <div className="relative">
                  <input
                    type="number"
                    name="streetWidth"
                    value={formData.streetWidth}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                  <span className="absolute left-3 top-3 text-gray-500">م</span>
                </div>
              </div>

              {/* نوع الصك */}
              <div>
                <label className="block text-gray-700 mb-2">
                  نوع الصك <span className="text-red-500">*</span>
                </label>
                <select
                  name="deedType"
                  value={formData.deedType}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">اختر نوع الصك</option>
                  {deedTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* حالة العقار */}
              <div>
                <label className="block text-gray-700 mb-2">
                  حالة العقار <span className="text-red-500">*</span>
                </label>
                <select
                  name="propertyCondition"
                  value={formData.propertyCondition}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">اختر حالة العقار</option>
                  {propertyConditions.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* بيانات تفصيلية */}
          {showDetails && (
            <div className="mb-8 p-6 bg-muted rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">بيانات تفصيلية</h2>
              <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* عدد الغرف */}
                <div>
                  <label className="block text-gray-700 mb-2">عدد الغرف</label>
                  <input
                    type="number"
                    name="rooms"
                    min="0"
                    value={formData.rooms}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* عدد دورات المياه */}
                <div>
                  <label className="block text-gray-700 mb-2">عدد دورات المياه</label>
                  <input
                    type="number"
                    name="bathrooms"
                    min="0"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* عدد الصالات */}
                <div>
                  <label className="block text-gray-700 mb-2">عدد الصالات</label>
                  <input
                    type="number"
                    name="livingRooms"
                    min="0"
                    value={formData.livingRooms}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* عدد المطابخ */}
                <div>
                  <label className="block text-gray-700 mb-2">عدد المطابخ</label>
                  <input
                    type="number"
                    name="kitchens"
                    min="0"
                    value={formData.kitchens}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* عدد الأدوار */}
                <div>
                  <label className="block text-gray-700 mb-2">عدد الأدوار</label>
                  <input
                    type="number"
                    name="floors"
                    min="0"
                    value={formData.floors}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* عدد الشقق */}
                <div>
                  <label className="block text-gray-700 mb-2">عدد الشقق</label>
                  <input
                    type="number"
                    name="apartments"
                    min="0"
                    value={formData.apartments}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* وجود غرفة خادمة */}
                <div>
                  <label className="block text-gray-700 mb-2">وجود غرفة خادمة</label>
                  <select
                    name="hasMaidRoom"
                    value={formData.hasMaidRoom}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">اختر</option>
                    {yesNoOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {/* وجود سطح */}
                <div>
                  <label className="block text-gray-700 mb-2">وجود سطح</label>
                  <select
                    name="hasRoof"
                    value={formData.hasRoof}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">اختر</option>
                    {yesNoOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {/* وجود ملحق خارجي */}
                <div>
                  <label className="block text-gray-700 mb-2">وجود ملحق خارجي</label>
                  <select
                    name="hasExternalAnnex"
                    value={formData.hasExternalAnnex}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">اختر</option>
                    {yesNoOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {/* مساحة البناء */}
                <div>
                  <label className="block text-gray-700 mb-2">مساحة البناء</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="buildingArea"
                      value={formData.buildingArea}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <span className="absolute left-3 top-3 text-gray-500">م²</span>
                  </div>
                </div>

                {/* مدخل سيارة / كراج */}
                <div>
                  <label className="block text-gray-700 mb-2">مدخل سيارة / كراج</label>
                  <select
                    name="hasGarage"
                    value={formData.hasGarage}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">اختر</option>
                    {yesNoOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {/* مسبح */}
                <div>
                  <label className="block text-gray-700 mb-2">مسبح</label>
                  <select
                    name="hasPool"
                    value={formData.hasPool}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">اختر</option>
                    {yesNoOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {/* مصعد */}
                <div>
                  <label className="block text-gray-700 mb-2">مصعد</label>
                  <select
                    name="hasElevator"
                    value={formData.hasElevator}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">اختر</option>
                    {yesNoOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {/* الأثاث */}
                <div>
                  <label className="block text-gray-700 mb-2">الأثاث</label>
                  <select
                    name="furnitureStatus"
                    value={formData.furnitureStatus}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">اختر</option>
                    {furnitureOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* المرفقات */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">المرفقات</h2>

            {/* اضافة اوراقالعقار */}
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">اضافة اوراقالعقار</label>
              <textarea
                placeholder="اكتب طلباتك أو معلومات إضافية هنا..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg h-32"
              />
              <div className="mt-2">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              </div>
            </div>

          {/* أزرار الإرسال */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting || offersLoading}
              className="px-8 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(isSubmitting || offersLoading) && (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isSubmitting || offersLoading ? "جاري الحفظ..." : "حفظ العرض"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={isSubmitting || offersLoading}
              className="px-8 py-3 bg-muted text-gray-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <>

      <div className="w-full min-h-screen bg-card flex" dir="rtl">
        {/* Fixed Sidebar */}
        <div className="fixed top-0 right-0 h-screen w-80 bg-muted border-l border p-6 overflow-y-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">إدارة الاملاك</h1>

          <div className="space-y-3">
            {sidebarItems.map((item) => {
              const IconComponent = item.icon;
              const isSelected = selectedSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedSection(item.id)}
                  className={`w-full p-4 rounded-lg text-right transition-colors ${
                    isSelected
                      ? "bg-slate-700 text-white"
                      : "bg-card text-gray-700 border border hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-5 h-5" />
                    <span className="font-semibold">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 mr-80 p-6">
          <div className="max-w-5xl">
            {renderMainContent()}
          </div>
        </div>
      </div>
    </>
  );
}
