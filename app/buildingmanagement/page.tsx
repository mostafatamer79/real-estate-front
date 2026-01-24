"use client";

import { useState, useRef, useEffect } from "react";
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
  Users,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  FileCheck,
  MessageSquare,
  HelpCircle,
  BarChart3,
  Download,
} from "lucide-react";
import { offersApi, ordersApi, uploadFile, prepareOfferData } from "@/lib/api";
import { CreateOrderDto, Order } from "@/types/api";
import { useOffers } from "@/hooks/useOffers";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import toast, { Toaster } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Video, Image as ImageIcon } from "lucide-react";
import {
  legalServicesApi,
  LegalDisputeFormData,
  LegalDispute,
  Contract,
  OtherLegalService,
  LegalDisputeQueryDto,
  LegalServicesStats
} from "@/lib/legal-services";

import FinancialPage from "@/app/financial/page";
import MarketingPage from "@/app/marketing/page";

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
    icon: DollarSign,
  },
  {
    id: "legal",
    label: "الادارة القانونية",
    icon: Scale,
  },
];

// Constants for Legal Services
const disputeTypes = [
  "نزاعات الملكية",
  "عقود البيع والإيجار",
  "قضايا الرهن العقاري",
  "مخالفات البناء",
  "نزع الملكية للمصلحة العامة",
  "مشاكل في مشاريع التطوير",
  "قضايا التركات العقارية",
  "اخرى"
];

const contractTypes = [
  "عقد البيع",
  "عقد الإيجار",
  "عقد الانتفاع العقاري",
  "عقد الهبة العقاري",
  "عقد الرهن العقاري",
  "عقد الاستثمار العقاري",
  "مراجعة العقود",
  "اخرى"
];

const legalServiceTypes = [
  "استشارات قانونية",
  "تقارير قانونية"
];

const partyRoles = ["بائع", "مشتري", "وسيط"];
const idTypes = ["هوية", "إقامة", "سجل تجاري"];
const partyTypes = ["فرد", "شركة"];
const applicantRoles = ["الطرف الاول", "الطرف الثاني", "الوكيل"];

// Status options
const statusOptions = {
  disputes: ["معلقة", "قيد المعالجة", "مكتملة", "ملغاة"],
  contracts: ["معلقة", "قيد المراجعة", "معدلة", "مكتملة", "ملغاة"],
  documentations: ["معلقة", "قيد التوثيق", "مكتملة", "ملغاة"],
  other: ["معلقة", "قيد المعالجة", "مكتملة", "ملغاة"],
};

export default function BuildingManagement() {
  const router = useRouter();  
  const { user } = useAuth();

  // Add Back Button Handler
  const handleBack = () => {
     router.back();
     // Or router.push('/') if back is not reliable
  };

  const [selectedSection, setSelectedSection] = useState<string>("offers");
  const [activeLegalTab, setActiveLegalTab] = useState<string>("dashboard");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("disputes");
  const [legalSearchTerm, setLegalSearchTerm] = useState("");

  // Legal Services States
  const [showNewLegalServiceModal, setShowNewLegalServiceModal] = useState(false);
  const [newLegalServiceType, setNewLegalServiceType] = useState("");
  const [legalStats, setLegalStats] = useState<LegalServicesStats>({
    totalServices: 0,
    disputes: { total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 },
    contracts: { total: 0, pending: 0, inReview: 0, completed: 0, signed: 0 },
    otherServices: { total: 0, pending: 0, completed: 0, responded: 0 },
  });

  // Legal Data States
  const [legalDisputes, setLegalDisputes] = useState<LegalDispute[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [otherServices, setOtherServices] = useState<OtherLegalService[]>([]);
  const [loading, setLoading] = useState({
    disputes: false,
    contracts: false,
    otherServices: false,
    stats: false,
  });

  // Legal Form States
  const [legalDisputeForm, setLegalDisputeForm] = useState<LegalDisputeFormData>({
    firstParty: {
      name: "",
      role: "بائع",
      idType: "هوية",
      idNumber: "",
      nationality: "",
      city: "",
      nationalAddress: "",
      phone: "",
      email: "",
    },
    secondParty: {
      name: "",
      role: "مشتري",
      idType: "هوية",
      idNumber: "",
      nationality: "",
      city: "",
      nationalAddress: "",
      phone: "",
      email: "",
    },
    disputeType: "نزاعات الملكية",
    disputeDescription: "",
  });

  // Document upload
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // ... (existing offer states remain the same)
  const [propertyType, setPropertyType] = useState<string>("");
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [files, setFiles] = useState<File[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>("");
  const [checkImage, setCheckImage] = useState<File | null>(null);

  // Order State
  const [activeOrderTab, setActiveOrderTab] = useState<"new" | "list">("new");
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [orderFormData, setOrderFormData] = useState<CreateOrderDto>({
    orderType: "buy",
    propertyType: "",
    city: "",
    neighborhood: "",
    area: 0,
    propertyAge: "",
    deedType: "",
    price: 0,
    additionalDetails: ""
  });
  const [formData, setFormData] = useState({
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
    video3d: "", // Placeholder for 3D video URL or file
  });
  
  const [dealType, setDealType] = useState<"sale" | "rent">("sale");
  const [mainCategory, setMainCategory] = useState<"residential" | "commercial">("residential");
  
  // Dynamic Property Types based on Category
  const propertyTypes = {
    residential: ["أرض سكنية", "فيلا", "قصر", "شقة"],
    commercial: ["أبراج مكتبية", "مكاتب", "محلات تجارية", "فندق", "أبراج", "عمارة"]
  };

  const showDetailedFields = ["فيلا", "قصر", "شقة"].includes(formData.propertyType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const checkImageInputRef = useRef<HTMLInputElement>(null);

  const { createOffer, uploadMedia, loading: offersLoading } = useOffers();

  // Load legal services data
  useEffect(() => {
    if (selectedSection === "legal") {
      loadLegalServicesData();
    }
  }, [selectedSection, activeLegalTab]);

  const loadLegalServicesData = async () => {
    try {
      switch (activeLegalTab) {
        case "dashboard":
          await loadStats();
          await loadRecentDisputes();
          break;
        case "disputes":
          await loadDisputes();
          break;
        case "contracts":
          await loadContracts();
          break;
        case "services":
          await loadOtherServices();
          break;
      }
    } catch (error) {
      console.error("Error loading legal services data:", error);
      toast.error("حدث خطأ في تحميل البيانات");
    }
  };

  const loadStats = async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const stats = await legalServicesApi.getUserLegalStats();
      setLegalStats(stats);
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("حدث خطأ في تحميل الإحصائيات");
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const loadDisputes = async () => {
    setLoading(prev => ({ ...prev, disputes: true }));
    try {
      const query: LegalDisputeQueryDto = {
        search: legalSearchTerm || undefined,
        take: 10,
        skip: 0,
      };
      const response = await legalServicesApi.getLegalDisputes(query);

      // Handle different response formats
      const disputes = Array.isArray(response) ?
        response :
        (response.data || response.disputes || []);

      // Transform disputes to ensure firstParty and secondParty are strings
      const transformedDisputes = disputes.map((dispute: any) => ({
        ...dispute,
        disputeNumber: dispute.disputeNumber || `DIS-${dispute.id?.substring(0, 8)?.toUpperCase() || 'UNKNOWN'}`,
        // Extract name from object or use string directly
        firstParty: typeof dispute.firstParty === 'object' && dispute.firstParty !== null ?
          dispute.firstParty.name :
          (typeof dispute.firstParty === 'string' ? dispute.firstParty : 'غير محدد'),
        secondParty: typeof dispute.secondParty === 'object' && dispute.secondParty !== null ?
          dispute.secondParty.name :
          (typeof dispute.secondParty === 'string' ? dispute.secondParty : 'غير محدد'),
        // Ensure other properties exist
        disputeType: dispute.disputeType || 'غير محدد',
        status: dispute.status || 'معلقة',
        createdAt: dispute.createdAt ?
          new Date(dispute.createdAt).toLocaleDateString('ar-SA') :
          'غير محدد'
      }));

      setLegalDisputes(transformedDisputes);
    } catch (error) {
      console.error("Error loading disputes:", error);
      toast.error("حدث خطأ في تحميل المنازعات");
      setLegalDisputes([]);
    } finally {
      setLoading(prev => ({ ...prev, disputes: false }));
    }
  };

  const loadRecentDisputes = async () => {
    try {
      const query: LegalDisputeQueryDto = {
        take: 3,
        skip: 0,
      };
      const response = await legalServicesApi.getLegalDisputes(query);

      // Handle different response formats
      const disputes = Array.isArray(response) ?
        response :
        (response.data || response.disputes || []);

      // Transform disputes
      const transformedDisputes = disputes.map((dispute: any) => ({
        ...dispute,
        disputeNumber: dispute.disputeNumber || `DIS-${dispute.id?.substring(0, 8)?.toUpperCase() || 'UNKNOWN'}`,
        firstParty: typeof dispute.firstParty === 'object' && dispute.firstParty !== null ?
          dispute.firstParty.name :
          (typeof dispute.firstParty === 'string' ? dispute.firstParty : 'غير محدد'),
        secondParty: typeof dispute.secondParty === 'object' && dispute.secondParty !== null ?
          dispute.secondParty.name :
          (typeof dispute.secondParty === 'string' ? dispute.secondParty : 'غير محدد'),
        disputeType: dispute.disputeType || 'غير محدد',
        status: dispute.status || 'معلقة',
        createdAt: dispute.createdAt ?
          new Date(dispute.createdAt).toLocaleDateString('ar-SA') :
          'غير محدد'
      })).slice(0, 3);

      setLegalDisputes(transformedDisputes);
    } catch (error) {
      console.error("Error loading recent disputes:", error);
      setLegalDisputes([]);
    }
  };

  const loadContracts = async () => {
    setLoading(prev => ({ ...prev, contracts: true }));
    try {
      const response = await legalServicesApi.getContracts({
        take: 10,
        skip: 0,
      });

      // Handle different response formats
      const contractsData = Array.isArray(response) ?
        response :
        (response.data || response.contracts || []);

      setContracts(contractsData);
    } catch (error) {
      console.error("Error loading contracts:", error);
      toast.error("حدث خطأ في تحميل العقود");
      setContracts([]);
    } finally {
      setLoading(prev => ({ ...prev, contracts: false }));
    }
  };

  const loadOtherServices = async () => {
    setLoading(prev => ({ ...prev, otherServices: true }));
    try {
      const response = await legalServicesApi.getOtherLegalServices({
        take: 10,
        skip: 0,
      });

      // Handle different response formats
      const servicesData = Array.isArray(response) ?
        response :
        (response.data || response.otherServices || []);

      setOtherServices(servicesData);
    } catch (error) {
      console.error("Error loading other services:", error);
      toast.error("حدث خطأ في تحميل الخدمات الأخرى");
      setOtherServices([]);
    } finally {
      setLoading(prev => ({ ...prev, otherServices: false }));
    }
  };

  // Legal Services Handlers
  const handleLegalDisputeChange = (party: "firstParty" | "secondParty", field: string, value: string) => {
    setLegalDisputeForm({
      ...legalDisputeForm,
      [party]: {
        ...legalDisputeForm[party],
        [field]: value,
      },
    });
  };

  const handleCreateLegalService = (type: string) => {
    setNewLegalServiceType(type);
    setShowNewLegalServiceModal(true);
  };

  const handleLegalServiceCreation = () => {
    switch (newLegalServiceType) {
      case "disputes":
        setActiveLegalTab("new-dispute");
        break;
      case "contracts":
        setActiveLegalTab("new-contract");
        break;
      case "documentations":
        setActiveLegalTab("new-documentation");
        break;
      case "other":
        setActiveLegalTab("new-other");
        break;
    }
    setShowNewLegalServiceModal(false);
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedDocuments(prev => [...prev, ...newFiles]);

      // In a real implementation, you would upload these files to the server
      // and get back document IDs to store in the form
      toast.success(`تم إضافة ${newFiles.length} ملف(ات)`);
    }
  };

  const submitLegalDispute = async () => {
    setIsSubmitting(true);
    try {
      // Validate required fields
      if (!legalDisputeForm.firstParty.name || !legalDisputeForm.secondParty.name || !legalDisputeForm.disputeDescription) {
        throw new Error("الرجاء ملء جميع الحقول المطلوبة");
      }

      // Upload documents if any
      let documentIds: string[] = [];
      if (uploadedDocuments.length > 0) {
        try {
          const uploadResponse = await legalServicesApi.uploadLegalDocuments(
            uploadedDocuments,
            'dispute'
          );
          documentIds = uploadResponse.files.map((file: any) => file.id || file.url);
        } catch (uploadError) {
          console.error("Error uploading documents:", uploadError);
          toast.error("حدث خطأ في رفع الملفات، لكن سيتم إرسال الطلب بدونها");
        }
      }

      // Prepare data for API
      const disputeData = {
        ...legalDisputeForm,
        documentIds: documentIds.length > 0 ? documentIds : undefined
      };

      // Send request to create legal dispute
      await legalServicesApi.createLegalDispute(disputeData);

      toast.success("تم إرسال طلب النزاع العقاري بنجاح!", {
        duration: 3000,
        position: "top-center",
      });

      // Reset form
      setLegalDisputeForm({
        firstParty: {
          name: "",
          role: "بائع",
          idType: "هوية",
          idNumber: "",
          nationality: "",
          city: "",
          nationalAddress: "",
          phone: "",
          email: "",
        },
        secondParty: {
          name: "",
          role: "مشتري",
          idType: "هوية",
          idNumber: "",
          nationality: "",
          city: "",
          nationalAddress: "",
          phone: "",
          email: "",
        },
        disputeType: "نزاعات الملكية",
        disputeDescription: "",
      });
      setUploadedDocuments([]);

      // Go back to disputes list
      setActiveLegalTab("disputes");

      // Refresh data
      loadDisputes();
      loadStats();

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "حدث خطأ أثناء إرسال الطلب";
      toast.error(errorMessage, {
        duration: 4000,
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDispute = async (disputeId: string) => {
    try {
      const dispute = await legalServicesApi.getLegalDisputeById(disputeId);
      // TODO: Show dispute details in a modal or navigate to detail page
      console.log("Dispute details:", dispute);
      toast.success("جاري تحميل تفاصيل النزاع");
    } catch (error) {
      toast.error("حدث خطأ في تحميل تفاصيل النزاع");
    }
  };

  const handleUpdateDispute = async (disputeId: string) => {
    try {
      // In a real implementation, you would show an edit form
      // For now, just show a message
      toast.success("جاري فتح نموذج التعديل");
    } catch (error) {
      toast.error("حدث خطأ في فتح نموذج التعديل");
    }
  };

  const handleDeleteDispute = async (disputeId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا النزاع؟")) {
      return;
    }

    try {
      await legalServicesApi.deleteLegalDispute(disputeId);
      toast.success("تم حذف النزاع بنجاح");
      // Refresh disputes list
      loadDisputes();
      loadStats();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "حدث خطأ أثناء حذف النزاع";
      toast.error(errorMessage);
    }
  };

  const handleSearchLegalServices = async () => {
    if (legalSearchTerm.trim().length < 2) {
      toast.error("الرجاء إدخال مصطلح بحث مكون من حرفين على الأقل");
      return;
    }

    try {
      const searchResults = await legalServicesApi.searchLegalServices(legalSearchTerm);
      // Handle search results based on current tab
      switch (activeLegalTab) {
        case "disputes":
          // Transform search results if needed
          const disputes = Array.isArray(searchResults) ?
            searchResults :
            (searchResults.data || searchResults.disputes || []);

          const transformedDisputes = disputes.map((dispute: any) => ({
            ...dispute,
            disputeNumber: dispute.disputeNumber || `DIS-${dispute.id?.substring(0, 8)?.toUpperCase() || 'UNKNOWN'}`,
            firstParty: typeof dispute.firstParty === 'object' && dispute.firstParty !== null ?
              dispute.firstParty.name :
              (typeof dispute.firstParty === 'string' ? dispute.firstParty : 'غير محدد'),
            secondParty: typeof dispute.secondParty === 'object' && dispute.secondParty !== null ?
              dispute.secondParty.name :
              (typeof dispute.secondParty === 'string' ? dispute.secondParty : 'غير محدد'),
            disputeType: dispute.disputeType || 'غير محدد',
            status: dispute.status || 'معلقة',
            createdAt: dispute.createdAt ?
              new Date(dispute.createdAt).toLocaleDateString('ar-SA') :
              'غير محدد'
          }));

          setLegalDisputes(transformedDisputes);
          break;
        case "contracts":
          setContracts(searchResults.contracts || searchResults);
          break;
        case "services":
          setOtherServices(searchResults.otherServices || searchResults);
          break;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "حدث خطأ أثناء البحث";
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "معلقة":
        return "bg-yellow-100 text-yellow-800";
      case "قيد المعالجة":
      case "قيد المراجعة":
      case "قيد التوثيق":
        return "bg-blue-100 text-blue-800";
      case "مكتملة":
      case "موثق":
        return "bg-green-100 text-green-800";
      case "ملغاة":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "معلقة":
        return Clock;
      case "قيد المعالجة":
      case "قيد المراجعة":
      case "قيد التوثيق":
        return AlertCircle;
      case "مكتملة":
      case "موثق":
        return CheckCircle;
      case "ملغاة":
        return XCircle;
      default:
        return Clock;
    }
  };

  // Render Legal Services Dashboard
  const renderLegalDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards - FIXED: Using div instead of p for containing div elements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي الخدمات</p>
              <div className="text-2xl font-bold text-gray-800 mt-2">
                {loading.stats ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  legalStats.totalServices
                )}
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Scale className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">المنازعات</p>
              <div className="text-2xl font-bold text-gray-800 mt-2">
                {loading.stats ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  legalStats.disputes.total
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  معلقة: {loading.stats ? '...' : legalStats.disputes.pending}
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  مكتملة: {loading.stats ? '...' : legalStats.disputes.completed}
                </span>
              </div>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">العقود</p>
              <div className="text-2xl font-bold text-gray-800 mt-2">
                {loading.stats ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  legalStats.contracts.total
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  قيد المراجعة: {loading.stats ? '...' : legalStats.contracts.inReview}
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">الخدمات الأخرى</p>
              <div className="text-2xl font-bold text-gray-800 mt-2">
                {loading.stats ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  legalStats.otherServices.total
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  تم الرد: {loading.stats ? '...' : legalStats.otherServices.responded}
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => handleCreateLegalService("disputes")}
            className="flex flex-col items-center p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-3 bg-red-100 rounded-lg mb-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <span className="font-medium text-gray-700">المنازعات العقارية</span>
            <span className="text-sm text-gray-500 mt-1">طلب جديد</span>
          </button>

          <button
            onClick={() => handleCreateLegalService("contracts")}
            className="flex flex-col items-center p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-3 bg-green-100 rounded-lg mb-3">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <span className="font-medium text-gray-700">العقود</span>
            <span className="text-sm text-gray-500 mt-1">طلب جديد</span>
          </button>

          <button
            onClick={() => handleCreateLegalService("documentations")}
            className="flex flex-col items-center p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-3 bg-blue-100 rounded-lg mb-3">
              <FileCheck className="w-6 h-6 text-blue-600" />
            </div>
            <span className="font-medium text-gray-700">التوثيق</span>
            <span className="text-sm text-gray-500 mt-1">طلب جديد</span>
          </button>

          <button
            onClick={() => handleCreateLegalService("other")}
            className="flex flex-col items-center p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-3 bg-purple-100 rounded-lg mb-3">
              <HelpCircle className="w-6 h-6 text-purple-600" />
            </div>
            <span className="font-medium text-gray-700">خدمات قانونية أخرى</span>
            <span className="text-sm text-gray-500 mt-1">طلب جديد</span>
          </button>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">أحدث الطلبات</h2>
          <button
            onClick={() => setActiveLegalTab("disputes")}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          >
            عرض الكل
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {loading.disputes ? (
            // Loading skeleton
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))
          ) : legalDisputes.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد منازعات حديثة</p>
            </div>
          ) : (
            legalDisputes.map((dispute) => {
              const StatusIcon = getStatusIcon(dispute.status);

              // Safely extract party names
              const firstPartyName = typeof dispute.firstParty === 'string'
                ? dispute.firstParty
                : ((dispute.firstParty as any)?.name || 'غير محدد');

              const secondPartyName = typeof dispute.secondParty === 'string'
                ? dispute.secondParty
                : ((dispute.secondParty as any)?.name || 'غير محدد');

              return (
                <div key={dispute.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{dispute.disputeType}</p>
                      <p className="text-sm text-gray-500">رقم النزاع: {dispute.disputeNumber}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {firstPartyName} ↔ {secondPartyName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
                      {dispute.status}
                    </span>
                    <button
                      onClick={() => handleViewDispute(dispute.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  // Render Legal Disputes List
  const renderLegalDisputesList = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في المنازعات..."
                value={legalSearchTerm}
                onChange={(e) => setLegalSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchLegalServices()}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSearchLegalServices}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              بحث
            </button>
            <button
              onClick={() => handleCreateLegalService("disputes")}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              نزاع جديد
            </button>
          </div>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading.disputes ? (
          // Loading skeleton for table
          <div className="p-6">
            {Array(5).fill(0).map((_, index) => (
              <div key={index} className="h-16 bg-gray-100 animate-pulse rounded mb-2"></div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">رقم النزاع</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">نوع النزاع</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الأطراف</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">تاريخ الإنشاء</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {legalDisputes.map((dispute) => {
                  const StatusIcon = getStatusIcon(dispute.status);

                  // Safely extract party names
                  const firstPartyName = typeof dispute.firstParty === 'string'
                    ? dispute.firstParty
                    : ((dispute.firstParty as any)?.name || 'غير محدد');

                  const secondPartyName = typeof dispute.secondParty === 'string'
                    ? dispute.secondParty
                    : ((dispute.secondParty as any)?.name || 'غير محدد');

                  return (
                    <tr key={dispute.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">{dispute.disputeNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{dispute.disputeType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="text-gray-600">{firstPartyName}</span>
                          <span className="mx-2">↔</span>
                          <span className="text-gray-600">{secondPartyName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4" />
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
                            {dispute.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600" suppressHydrationWarning>
                        {dispute.createdAt}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDispute(dispute.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateDispute(dispute.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDispute(dispute.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading.disputes && legalDisputes.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد منازعات</p>
            <button
              onClick={() => handleCreateLegalService("disputes")}
              className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              إنشاء نزاع جديد
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Render New Legal Service Form (Generic)
  const renderNewLegalServiceForm = () => {
    const getServiceDetails = () => {
      switch (activeLegalTab) {
        case "new-contract":
          return { 
            title: "طلب عقد جديد", 
            subtitle: "أدخل بيانات العقد", 
            typeLabel: "نوع العقد", 
            descLabel: "تفاصيل العقد", 
            icon: FileText, 
            colorClass: "bg-green-100 text-green-600",
            borderColor: "border-green-200",
            bgClass: "bg-green-50"
          };
        case "new-documentation":
          return { 
            title: "طلب توثيق جديد", 
            subtitle: "أدخل بيانات التوثيق", 
            typeLabel: "نوع التوثيق", 
            descLabel: "تفاصيل التوثيق", 
            icon: FileCheck, 
            colorClass: "bg-blue-100 text-blue-600",
            borderColor: "border-blue-200",
            bgClass: "bg-blue-50"
          };
        case "new-other":
          return { 
            title: "طلب خدمة قانونية", 
            subtitle: "أدخل بيانات الخدمة", 
            typeLabel: "نوع الخدمة", 
            descLabel: "تفاصيل الخدمة", 
            icon: HelpCircle, 
            colorClass: "bg-purple-100 text-purple-600",
            borderColor: "border-purple-200",
            bgClass: "bg-purple-50"
          };
        case "new-dispute":
        default:
          return { 
            title: "طلب نزاع عقاري جديد", 
            subtitle: "أدخل بيانات النزاع العقاري", 
            typeLabel: "نوع النزاع", 
            descLabel: "وصف النزاع", 
            icon: AlertCircle, 
            colorClass: "bg-red-100 text-red-600",
            borderColor: "border-blue-200", // Keep blue for parties as default or make dynamic
            bgClass: "bg-blue-50"
          };
      }
    };

    const details = getServiceDetails();
    const Icon = details.icon;

    return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-8">
        <div className={`p-2 rounded-lg ${details.colorClass.split(" ")[0]}`}>
          <Icon className={`w-6 h-6 ${details.colorClass.split(" ")[1]}`} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{details.title}</h1>
          <p className="text-gray-600">{details.subtitle}</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* بيانات الأطراف */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">بيانات الأطراف</h2>

          {/* الطرف الأول */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-medium text-blue-800">الطرف الأول</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">الاسم *</label>
                <input
                  type="text"
                  value={legalDisputeForm.firstParty.name}
                  onChange={(e) => handleLegalDisputeChange("firstParty", "name", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">الصفة *</label>
                <select
                  value={legalDisputeForm.firstParty.role}
                  onChange={(e) => handleLegalDisputeChange("firstParty", "role", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {partyRoles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">نوع الهوية *</label>
                <select
                  value={legalDisputeForm.firstParty.idType}
                  onChange={(e) => handleLegalDisputeChange("firstParty", "idType", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {idTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">رقم الهوية *</label>
                <input
                  type="text"
                  value={legalDisputeForm.firstParty.idNumber}
                  onChange={(e) => handleLegalDisputeChange("firstParty", "idNumber", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">الجنسية</label>
                <input
                  type="text"
                  value={legalDisputeForm.firstParty.nationality}
                  onChange={(e) => handleLegalDisputeChange("firstParty", "nationality", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">المدينة</label>
                <input
                  type="text"
                  value={legalDisputeForm.firstParty.city}
                  onChange={(e) => handleLegalDisputeChange("firstParty", "city", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">العنوان الوطني</label>
                <input
                  type="text"
                  value={legalDisputeForm.firstParty.nationalAddress}
                  onChange={(e) => handleLegalDisputeChange("firstParty", "nationalAddress", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">رقم الجوال *</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={legalDisputeForm.firstParty.phone}
                    onChange={(e) => handleLegalDisputeChange("firstParty", "phone", e.target.value)}
                    className="w-full p-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={legalDisputeForm.firstParty.email}
                    onChange={(e) => handleLegalDisputeChange("firstParty", "email", e.target.value)}
                    className="w-full p-3 pl-12 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* الطرف الثاني - Similar structure */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-medium text-green-800">الطرف الثاني</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">الاسم *</label>
                <input
                  type="text"
                  value={legalDisputeForm.secondParty.name}
                  onChange={(e) => handleLegalDisputeChange("secondParty", "name", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">الصفة *</label>
                <select
                  value={legalDisputeForm.secondParty.role}
                  onChange={(e) => handleLegalDisputeChange("secondParty", "role", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {partyRoles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">نوع الهوية *</label>
                <select
                  value={legalDisputeForm.secondParty.idType}
                  onChange={(e) => handleLegalDisputeChange("secondParty", "idType", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {idTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">رقم الهوية *</label>
                <input
                  type="text"
                  value={legalDisputeForm.secondParty.idNumber}
                  onChange={(e) => handleLegalDisputeChange("secondParty", "idNumber", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">الجنسية</label>
                <input
                  type="text"
                  value={legalDisputeForm.secondParty.nationality}
                  onChange={(e) => handleLegalDisputeChange("secondParty", "nationality", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">المدينة</label>
                <input
                  type="text"
                  value={legalDisputeForm.secondParty.city}
                  onChange={(e) => handleLegalDisputeChange("secondParty", "city", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">العنوان الوطني</label>
                <input
                  type="text"
                  value={legalDisputeForm.secondParty.nationalAddress}
                  onChange={(e) => handleLegalDisputeChange("secondParty", "nationalAddress", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">رقم الجوال *</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={legalDisputeForm.secondParty.phone}
                    onChange={(e) => handleLegalDisputeChange("secondParty", "phone", e.target.value)}
                    className="w-full p-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={legalDisputeForm.secondParty.email}
                    onChange={(e) => handleLegalDisputeChange("secondParty", "email", e.target.value)}
                    className="w-full p-3 pl-12 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* بيانات الخدمة / النزاع */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{details.title}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2">{details.typeLabel} *</label>
              <select
                value={legalDisputeForm.disputeType}
                onChange={(e) => setLegalDisputeForm({ ...legalDisputeForm, disputeType: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {disputeTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {legalDisputeForm.disputeType === "اخرى" && (
              <div>
                <label className="block text-gray-700 mb-2">حدد {details.typeLabel}</label>
                <input
                  type="text"
                  placeholder={`اكتب ${details.typeLabel}`}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => setLegalDisputeForm({ ...legalDisputeForm, otherDisputeType: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-gray-700 mb-2">{details.descLabel} *</label>
            <textarea
              value={legalDisputeForm.disputeDescription}
              onChange={(e) => setLegalDisputeForm({ ...legalDisputeForm, disputeDescription: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-40"
              placeholder={`${details.descLabel}...`}
              required
            />
          </div>
        </div>

        {/* المستندات */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">المستندات</h2>

          {/* Uploaded Documents List */}
          {uploadedDocuments.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">الملفات المرفوعة:</h3>
              <div className="space-y-2">
                {uploadedDocuments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">اسحب وأفلت الملفات هنا أو انقر للتحميل</p>
            <p className="text-sm text-gray-500 mb-4">يدعم الصور وملفات PDF وملفات Word (حتى 10 ملفات)</p>
            <input
              type="file"
              ref={documentInputRef}
              multiple
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleDocumentUpload}
            />
            <button
              onClick={() => documentInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              رفع المستندات
            </button>
          </div>
        </div>

        {/* أزرار الإرسال */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={submitLegalDispute}
            disabled={isSubmitting}
            className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري الإرسال...
              </>
            ) : (
              "إرسال الطلب"
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveLegalTab("disputes")}
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );}; // End of renderNewLegalServiceForm

  // Render Contracts List (similar to disputes)
  const renderContractsList = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في العقود..."
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() => handleCreateLegalService("contracts")}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            عقد جديد
          </button>
        </div>
      </div>

      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">قيد التطوير</h3>
        <p className="text-gray-500">قسم العقود قيد التطوير حالياً</p>
      </div>
    </div>
  );

  // Offer Handlers
  const handleOfferChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOfferSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOfferCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.propertyType || !formData.city || !formData.price || !formData.area) {
        toast.error("الحقول الأساسية مطلوبة (النوع، المدينة، السعر، المساحة)");
        setIsSubmitting(false);
        return;
      }

      const submissionData: any = {
        ...formData,
        price: parseFloat(formData.price),
        area: parseFloat(formData.area),
        length: formData.length ? parseFloat(formData.length) : undefined,
        width: formData.width ? parseFloat(formData.width) : undefined,
        streetWidth: formData.streetWidth ? parseFloat(formData.streetWidth) : undefined,
        rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        livingRooms: formData.livingRooms ? parseInt(formData.livingRooms) : undefined,
        kitchens: formData.kitchens ? parseInt(formData.kitchens) : undefined,
        floors: formData.floors ? parseInt(formData.floors) : undefined,
        apartments: formData.apartments ? parseInt(formData.apartments) : undefined,
        additionalNotes: additionalNotes,
        dealType, // Add deal type
        mainCategory, // Add main category
      };

      if (createOffer) {
        await createOffer(submissionData);
      } else {
        await offersApi.create(submissionData);
      }

      toast.success("تمت إضافة العقار بنجاح");
      router.push('/offers');

    } catch (error: any) {
      console.error("Error creating offer:", error);
      toast.error(error.response?.data?.message || "حدث خطأ أثناء إرسال الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Legal Services Content
  const renderLegalContent = () => {
    switch (activeLegalTab) {
      case "dashboard":
        return renderLegalDashboard();
      case "disputes":
        return renderLegalDisputesList();
      case "new-dispute":
        return renderNewLegalServiceForm();
      case "contracts":
        return renderContractsList();
      case "new-contract":
      case "new-documentation":
      case "new-other":
        return renderNewLegalServiceForm();
      default:
        return (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Scale className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">قيد التطوير</h3>
            <p className="text-gray-500">هذه الصفحة قيد التطوير حالياً</p>
          </div>
        );
    }
  };

  // Order Handlers
  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrderFormData(prev => ({ 
        ...prev, 
        [name]: name === 'area' || name === 'price' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await ordersApi.create(orderFormData);
      toast.success("تم إرسال الطلب بنجاح");
      setOrderFormData({
        orderType: "buy",
        propertyType: "",
        city: "",
        neighborhood: "",
        area: 0,
        propertyAge: "",
        deedType: "",
        price: 0,
        additionalDetails: ""
      });
      setActiveOrderTab("list");
      fetchMyOrders();
    } catch (error: any) {
        toast.error("حدث خطأ أثناء إرسال الطلب");
    } finally {
        setIsSubmitting(false);
    }
  };

  const fetchMyOrders = async () => {
      try {
          const res = await ordersApi.findMyOrders();
          setMyOrders(res.data);
      } catch (error) {
          console.error(error);
      }
  };

  useEffect(() => {
      if (selectedSection === 'orders' && activeOrderTab === 'list') {
          fetchMyOrders();
      }
  }, [selectedSection, activeOrderTab]);

  const renderOrdersSection = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">إدارة الطلبات</h1>
                    <p className="text-gray-600">أضف طلبك العقاري أو تصفح طلباتك السابقة</p>
                </div>
            </div>

            <Tabs value={activeOrderTab} onValueChange={(v) => setActiveOrderTab(v as "new" | "list")} dir="rtl" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="new">طلب جديد</TabsTrigger>
                    <TabsTrigger value="list">طلباتي</TabsTrigger>
                </TabsList>

                <TabsContent value="new" className="mt-6">
                    <form onSubmit={handleOrderSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <Label>نوع الطلب</Label>
                            <RadioGroup value={orderFormData.orderType} onValueChange={(v) => setOrderFormData(p => ({...p, orderType: v}))} className="flex gap-4">
                                <div className="flex items-center gap-2"><RadioGroupItem value="buy" id="buy" /><Label htmlFor="buy">شراء</Label></div>
                                <div className="flex items-center gap-2"><RadioGroupItem value="rent" id="rent" /><Label htmlFor="rent">إيجار</Label></div>
                            </RadioGroup>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <Label>نوع العقار المطلوب</Label>
                                <Input name="propertyType" value={orderFormData.propertyType} onChange={handleOrderChange} placeholder="مثال: شقة، فيلا" required />
                             </div>
                             <div className="space-y-2">
                                <Label>المدينة</Label>
                                <Input name="city" value={orderFormData.city} onChange={handleOrderChange} required />
                             </div>
                             <div className="space-y-2">
                                <Label>الحي</Label>
                                <Input name="neighborhood" value={orderFormData.neighborhood} onChange={handleOrderChange} required />
                             </div>
                             <div className="space-y-2">
                                <Label>المساحة (م²)</Label>
                                <Input type="number" name="area" value={orderFormData.area || ''} onChange={handleOrderChange} required />
                             </div>
                             <div className="space-y-2">
                                <Label>عمر العقار</Label>
                                <Input name="propertyAge" value={orderFormData.propertyAge} onChange={handleOrderChange} required />
                             </div>
                             <div className="space-y-2">
                                <Label>نوع الصك</Label>
                                <Select value={orderFormData.deedType} onValueChange={(v) => setOrderFormData(p => ({...p, deedType: v}))}>
                                    <SelectTrigger><SelectValue placeholder="اختر نوع الصك" /></SelectTrigger>
                                    <SelectContent dir="rtl">
                                        <SelectItem value="electronic">إلكتروني</SelectItem>
                                        <SelectItem value="paper">ورقي</SelectItem>
                                    </SelectContent>
                                </Select>
                             </div>
                             <div className="space-y-2">
                                <Label>السعر (ريال)</Label>
                                <Input type="number" name="price" value={orderFormData.price || ''} onChange={handleOrderChange} required />
                             </div>
                        </div>

                        <div className="space-y-2">
                            <Label>تفاصيل إضافية</Label>
                            <Textarea name="additionalDetails" value={orderFormData.additionalDetails} onChange={handleOrderChange} placeholder="أي مواصفات أخرى..." />
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700">
                            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "إرسال الطلب"}
                        </Button>
                    </form>
                </TabsContent>

                <TabsContent value="list" className="mt-6">
                    <div className="space-y-4">
                        {myOrders.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">لا توجد طلبات سابقة</div>
                        ) : (
                            myOrders.map(order => (
                                <Card key={order.id}>
                                    <CardContent className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-lg">{order.propertyType} - {order.orderType === 'buy' ? 'شراء' : 'إيجار'}</p>
                                            <p className="text-sm text-gray-600">{order.city} - {order.neighborhood}</p>
                                            <p className="text-sm text-gray-500" suppressHydrationWarning>{new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-blue-600">{order.price.toLocaleString()} ريال</p>
                                            <p className="text-sm text-gray-600">{order.area} م²</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    if (selectedSection === "orders") {
      return renderOrdersSection();
    }
    if (selectedSection === "financial") {
      return <FinancialPage />;
    }
    if (selectedSection === "marketing") {
      return <MarketingPage />;
    }
    if (selectedSection === "legal") {
      return (
        <div className="space-y-6">
          {/* Legal Services Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Scale className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">الإدارة القانونية</h1>
                <p className="text-gray-600">إدارة جميع الخدمات القانونية والعقارية</p>
              </div>
            </div>

            {/* Legal Services Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveLegalTab("dashboard")}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeLegalTab === "dashboard"
                      ? "border-gray-700 text-gray-800"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  لوحة التحكم
                </button>
                <button
                  onClick={() => setActiveLegalTab("disputes")}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeLegalTab === "disputes"
                      ? "border-gray-700 text-gray-800"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  المنازعات العقارية
                </button>
                <button
                  onClick={() => setActiveLegalTab("contracts")}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeLegalTab === "contracts"
                      ? "border-gray-700 text-gray-800"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  العقود
                </button>
              </div>
            </div>

            {/* Legal Services Content */}
            {renderLegalContent()}
          </div>
        </div>
      );
    }

    // ... (existing offer rendering code remains the same)
    if (selectedSection !== "offers") {
      return (
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {sidebarItems.find((item) => item.id === selectedSection)?.label}
          </h2>
          <p className="text-gray-600">
            محتوى قسم {sidebarItems.find((item) => item.id === selectedSection)?.label} سيظهر هنا
          </p>
        </div>
      );
    }

    // ... (your existing offer form rendering code)
    // Offer Form
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">إضافة عرض جديد</h1>
            <p className="text-gray-600">أدخل بيانات العقار الجديد</p>
          </div>
        </div>

        {/* Tabs for Sale / Rent */}
        <Tabs defaultValue="sale" dir="rtl" className="w-full mb-8" onValueChange={(val) => setDealType(val as "sale" | "rent")}>
          <TabsList className="grid w-full grid-cols-2 h-12">
             <TabsTrigger value="sale" className="text-lg">بيع / شراء</TabsTrigger>
             <TabsTrigger value="rent" className="text-lg">إيجار</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Main Category Selection */}
        <div className="mb-8">
            <Label className="block text-lg font-medium mb-4">تصنيف العقار</Label>
            <RadioGroup defaultValue="residential" className="flex gap-6" onValueChange={(val) => setMainCategory(val as "residential" | "commercial")}>
                <div className="flex items-center gap-2 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
                    <RadioGroupItem value="residential" id="res" />
                    <Label htmlFor="res" className="text-lg cursor-pointer flex items-center gap-2">
                        <Home className="w-5 h-5 text-gray-600" />
                        عقار سكني
                    </Label>
                </div>
                <div className="flex items-center gap-2 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
                    <RadioGroupItem value="commercial" id="comm" />
                    <Label htmlFor="comm" className="text-lg cursor-pointer flex items-center gap-2">
                        <Building className="w-5 h-5 text-gray-600" />
                        عقار تجاري
                    </Label>
                </div>
            </RadioGroup>
        </div>

        <form onSubmit={handleOfferSubmit} className="space-y-8">
          
          {/* Media Upload (Partial Implementation) */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    الوسائط
                </CardTitle>
                <CardDescription>صور وفيديو ثلاثي الأبعاد</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">رفع صور العقار</p>
                    <p className="text-sm text-gray-400">JPG, PNG, WEBP (Max 10MB)</p>
                     {/* Hidden input for multiple images */}
                 </div>
                 <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <Video className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">رفع فيديو ثلاثي الأبعاد</p>
                 </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                المعلومات الأساسية
              </CardTitle>
              <CardDescription>البيانات الرئيسية للعقار</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>نوع العقار <span className="text-red-500">*</span></Label>
                <Select onValueChange={(val) => handleOfferSelectChange('propertyType', val)} value={formData.propertyType}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر نوع العقار" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {propertyTypes[mainCategory].map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-2">
                  <Label>الأطوال (الطول × العرض)</Label>
                  <div className="flex gap-2">
                      <Input type="number" name="length" placeholder="الطول" value={formData.length} onChange={handleOfferChange} className="text-right" />
                      <span className="flex items-center text-gray-400">×</span>
                      <Input type="number" name="width" placeholder="العرض" value={formData.width} onChange={handleOfferChange} className="text-right" />
                  </div>
              </div>

               <div className="space-y-2">
                <Label>المساحة (م²) <span className="text-red-500">*</span></Label>
                <Input type="number" name="area" value={formData.area} onChange={handleOfferChange} placeholder="0" className="text-right" required />
              </div>

              <div className="space-y-2">
                <Label>عمر العقار <span className="text-red-500">*</span></Label>
                <Select onValueChange={(val) => handleOfferSelectChange('propertyAge', val)} value={formData.propertyAge}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="جديد">جديد</SelectItem>
                    <SelectItem value="أقل من سنة">أقل من سنة</SelectItem>
                    <SelectItem value="1-5 سنوات">1-5 سنوات</SelectItem>
                    <SelectItem value="أكثر من 10 سنوات">أكثر من 10 سنوات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            
              <div className="space-y-2">
                <Label>الواجهة <span className="text-red-500">*</span></Label>
                <Select onValueChange={(val) => handleOfferSelectChange('direction', val)} value={formData.direction}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="شمال">شمال</SelectItem>
                    <SelectItem value="جنوب">جنوب</SelectItem>
                    <SelectItem value="شرق">شرق</SelectItem>
                    <SelectItem value="غرب">غرب</SelectItem>
                    <SelectItem value="شمال شرقي">شمال شرقي</SelectItem>
                    <SelectItem value="شمال غربي">شمال غربي</SelectItem>
                    <SelectItem value="جنوب شرقي">جنوب شرقي</SelectItem>
                    <SelectItem value="جنوب غربي">جنوب غربي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-2">
                <Label>السعر (ريال) <span className="text-red-500">*</span></Label>
                <Input type="number" name="price" value={formData.price} onChange={handleOfferChange} placeholder="0" className="text-right" required />
              </div>

               <div className="space-y-2">
                <Label>المدينة <span className="text-red-500">*</span></Label>
                <Input type="text" name="city" value={formData.city} onChange={handleOfferChange} placeholder="الرياض" className="text-right" required />
              </div>

               <div className="space-y-2">
                <Label>الحي <span className="text-red-500">*</span></Label>
                <Input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleOfferChange} placeholder="النرجس" className="text-right" required />
              </div>

              <div className="space-y-2">
                 <Label>عرض الشارع (م) <span className="text-red-500">*</span></Label>
                 <Input type="number" name="streetWidth" value={formData.streetWidth} onChange={handleOfferChange} className="text-right" required />
              </div>

               <div className="space-y-2">
                <Label>نوع الصك <span className="text-red-500">*</span></Label>
                 <Select onValueChange={(val) => handleOfferSelectChange('deedType', val)} value={formData.deedType}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                   <SelectContent dir="rtl">
                    <SelectItem value="إلكتروني">إلكتروني</SelectItem>
                    <SelectItem value="ورقي">ورقي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-2">
                <Label>حالة العقار</Label>
                <Select onValueChange={(val) => handleOfferSelectChange('propertyCondition', val)} value={formData.propertyCondition}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                   <SelectContent dir="rtl">
                    <SelectItem value="جديد">جديد</SelectItem>
                    <SelectItem value="مستعمل">مستعمل</SelectItem>
                    <SelectItem value="تحت الإنشاء">تحت الإنشاء</SelectItem>
                    <SelectItem value="مجدد">مجدد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>


           {/* Detailed Data (Conditional) */}
           {showDetailedFields && (
            <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Home className="w-5 h-5" />
                    بيانات تفصيلية
                </CardTitle>
                <CardDescription>الرجاء تعبئة التفاصيل بدقة</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <Label>عدد الغرف</Label>
                        <Input type="number" name="rooms" value={formData.rooms} onChange={handleOfferChange} className="text-right bg-white" />
                    </div>
                    <div className="space-y-2">
                        <Label>دورات المياه</Label>
                        <Input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleOfferChange} className="text-right bg-white" />
                    </div>
                    <div className="space-y-2">
                        <Label>الصالات</Label>
                        <Input type="number" name="livingRooms" value={formData.livingRooms} onChange={handleOfferChange} className="text-right bg-white" />
                    </div>
                    <div className="space-y-2">
                        <Label>المطابخ</Label>
                        <Input type="number" name="kitchens" value={formData.kitchens} onChange={handleOfferChange} className="text-right bg-white" />
                    </div>
                    <div className="space-y-2">
                        <Label>عدد الأدوار</Label>
                        <Input type="number" name="floors" value={formData.floors} onChange={handleOfferChange} className="text-right bg-white" />
                    </div>
                    <div className="space-y-2">
                        <Label>عدد الشقق</Label>
                        <Input type="number" name="apartments" value={formData.apartments} onChange={handleOfferChange} className="text-right bg-white" />
                    </div>
                     <div className="space-y-2">
                        <Label>مساحة البناء</Label>
                        <Input type="number" name="buildingArea" value={formData.buildingArea} onChange={handleOfferChange} className="text-right bg-white" />
                    </div>

                    <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-center space-x-2 space-x-reverse bg-white p-3 rounded border">
                            <Checkbox id="hasMaidRoom" checked={!!formData.hasMaidRoom} onCheckedChange={(c) => handleOfferCheckboxChange('hasMaidRoom', c as boolean)} />
                            <label htmlFor="hasMaidRoom" className="text-sm font-medium">غرفة خادمة</label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse bg-white p-3 rounded border">
                            <Checkbox id="hasRoof" checked={!!formData.hasRoof} onCheckedChange={(c) => handleOfferCheckboxChange('hasRoof', c as boolean)} />
                            <label htmlFor="hasRoof" className="text-sm font-medium">سطح</label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse bg-white p-3 rounded border">
                            <Checkbox id="hasExternalAnnex" checked={!!formData.hasExternalAnnex} onCheckedChange={(c) => handleOfferCheckboxChange('hasExternalAnnex', c as boolean)} />
                            <label htmlFor="hasExternalAnnex" className="text-sm font-medium">ملحق خارجي</label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse bg-white p-3 rounded border">
                            <Checkbox id="hasGarage" checked={!!formData.hasGarage} onCheckedChange={(c) => handleOfferCheckboxChange('hasGarage', c as boolean)} />
                            <label htmlFor="hasGarage" className="text-sm font-medium">مدخل سيارة / كراج</label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse bg-white p-3 rounded border">
                            <Checkbox id="hasPool" checked={!!formData.hasPool} onCheckedChange={(c) => handleOfferCheckboxChange('hasPool', c as boolean)} />
                            <label htmlFor="hasPool" className="text-sm font-medium">مسبح</label>
                        </div>
                         <div className="flex items-center space-x-2 space-x-reverse bg-white p-3 rounded border">
                            <Checkbox id="hasElevator" checked={!!formData.hasElevator} onCheckedChange={(c) => handleOfferCheckboxChange('hasElevator', c as boolean)} />
                            <label htmlFor="hasElevator" className="text-sm font-medium">مصعد</label>
                        </div>
                    </div>

                     <div className="space-y-2 col-span-2">
                        <Label>الأثاث</Label>
                        <Select onValueChange={(val) => handleOfferSelectChange('furnitureStatus', val)} value={formData.furnitureStatus}>
                        <SelectTrigger className="text-right bg-white">
                            <SelectValue placeholder="اختر" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="مفروش">مفروش</SelectItem>
                            <SelectItem value="غير مفروش">غير مفروش</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
           )}

           {/* Attachments & Requests Section (New) */}
           <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5" />
                    المرفقات والمتطلبات
                </CardTitle>
                <CardDescription>الوثائق المطلوبة والخيارات الإضافية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Property Papers */}
                    <div className="border p-4 rounded-xl bg-gray-50">
                        <Label className="block mb-3 font-semibold">طلب أوراق العقار</Label>
                        <Input type="file" className="bg-white mb-2" />
                        <Textarea placeholder="ملاحظات..." className="bg-white text-right h-20 text-sm" />
                    </div>

                    {/* Deposit Check */}
                    <div className="border p-4 rounded-xl bg-gray-50">
                        <Label className="block mb-3 font-semibold">إيداع صورة من الشيك</Label>
                        <Input type="file" className="bg-white mb-2" />
                         <Textarea placeholder="ملاحظات..." className="bg-white text-right h-20 text-sm" />
                         <p className="text-xs text-gray-500 mt-2">
                         استخدام الشيك كضمان يتعارض مع مبادئه الأساسية كأداة وفاء وليست ضمان ائتمان.
                         </p>
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                     <div className="flex items-center space-x-2 space-x-reverse bg-white p-4 rounded border flex-1 shadow-sm">
                        <Checkbox id="reqVisit" />
                        <label htmlFor="reqVisit" className="text-sm font-medium cursor-pointer flex-1">
                            طلب زيارة عقار (طلب مندوب / تحديد موعد)
                        </label>
                    </div>
                     <div className="flex items-center space-x-2 space-x-reverse bg-white p-4 rounded border flex-1 shadow-sm">
                        <Checkbox id="buyProp" />
                        <label htmlFor="buyProp" className="text-sm font-medium cursor-pointer flex-1">
                            شراء عقار
                        </label>
                    </div>
                </div>
            </CardContent>
           </Card>

            {/* Description */}
           <Card>
            <CardHeader>
              <CardTitle>الوصف والملاحظات</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="space-y-2">
                    <Label>ملاحظات إضافية / وصف العقار</Label>
                    <Textarea 
                        name="additionalNotes" 
                        value={additionalNotes} 
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        className="min-h-[150px] text-right"
                        placeholder="أضف وصفاً تفصيلياً للعقار..." 
                    />
                </div>
            </CardContent>
           </Card>

           <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg">
                {isSubmitting && <Loader2 className="animate-spin ml-2 w-5 h-5" />}
                إضافة العقار
           </Button>

        </form>
      </div>
    );
  };

  return (
    <>
      <Toaster
        toastOptions={{
          duration: 4000,
          position: "top-center",
          style: {
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: "14px",
          },
        }}
      />

      {/* New Service Modal */}
      {showNewLegalServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">اختر نوع الخدمة</h3>
              <p className="text-gray-600 mb-6">اختر نوع الخدمة القانونية التي ترغب في طلبها</p>

              <div className="space-y-3">
                <button
                  onClick={() => setNewLegalServiceType("disputes")}
                  className={`w-full p-4 text-right rounded-lg border flex items-center justify-between transition-colors ${
                    newLegalServiceType === "disputes"
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="font-medium">المنازعات العقارية</span>
                  </div>
                  {newLegalServiceType === "disputes" && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </button>

                <button
                  onClick={() => setNewLegalServiceType("contracts")}
                  className={`w-full p-4 text-right rounded-lg border flex items-center justify-between transition-colors ${
                    newLegalServiceType === "contracts"
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-medium">العقود</span>
                  </div>
                  {newLegalServiceType === "contracts" && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </button>

                <button
                  onClick={() => setNewLegalServiceType("documentations")}
                  className={`w-full p-4 text-right rounded-lg border flex items-center justify-between transition-colors ${
                    newLegalServiceType === "documentations"
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-medium">التوثيق</span>
                  </div>
                  {newLegalServiceType === "documentations" && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </button>

                <button
                  onClick={() => setNewLegalServiceType("other")}
                  className={`w-full p-4 text-right rounded-lg border flex items-center justify-between transition-colors ${
                    newLegalServiceType === "other"
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <HelpCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="font-medium">خدمات قانونية أخرى</span>
                  </div>
                  {newLegalServiceType === "other" && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowNewLegalServiceModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleLegalServiceCreation}
                  disabled={!newLegalServiceType}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  متابعة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      <div className="w-full min-h-screen bg-white flex" dir="rtl">
        {/* Fixed Sidebar */}
        <div className="fixed top-0 right-0 h-screen w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
              <button 
                onClick={handleBack}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors group flex items-center gap-2"
                title="العودة"
              >
                <div className="transform rotate-180 group-hover:-translate-x-1 transition-transform">
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">عودة</span>
              </button>

              <button
                onClick={() => router.push('/profile')}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                title="الملف الشخصي"
              >
                <User className="w-6 h-6 text-gray-600" />
              </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">إدارة العقارات</h1>

          <div className="space-y-3">
            {sidebarItems.map((item) => {
              const IconComponent = item.icon;
              const isSelected = selectedSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedSection(item.id);
                    if (item.id === "legal") {
                      setActiveLegalTab("dashboard");
                    }
                  }}
                  className={`w-full p-4 rounded-lg text-right transition-colors ${
                    isSelected
                      ? "bg-gray-700 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
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