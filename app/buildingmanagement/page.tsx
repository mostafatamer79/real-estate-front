"use client";

import React, { useState, useRef, useEffect, useMemo, Suspense, useCallback } from "react";
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
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck,
  MessageSquare,
  HelpCircle,
  BarChart3,
  Download,
  Hash,
  Layers,
  AlignLeft,
  Landmark,
  Briefcase,
  Ruler,
  ArrowRight,
  Activity,
  Calendar,
  Receipt,
  LayoutDashboard,
  PlusCircle,
  List,
  ExternalLink,
  Save,
  Settings2,
  Clock3,
  TrendingUp,
  Video,
  Image as ImageIcon,
  Map as MapIcon,
  Link as LinkIcon,
  Send,
  Loader2,
} from "lucide-react";
import {
  offersApi,
  ordersApi,
  usersApi,
  propertiesApi,
  financialApi,
  bookingsApi,
  uploadFile,
  default as api
} from "@/lib/api";
import { chatApi } from "@/lib/chat";
import dynamic from 'next/dynamic';
const Map = dynamic(() => import('@/app/src/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Loading Map...</div>
});
import OrderDetailsModal from "@/components/modals/order-details-modal";
import PropertyDetailsModal from "@/components/modals/property-details-modal";
import TenantDetailsModal from "@/components/modals/tenant-details-modal";
import OfferDetailsModal from "@/components/modals/offer-details-modal";
import OfferAppointmentsModal from "@/components/modals/offer-appointments-modal";
import { CreateOrderDto, Offer, Order, Property, TenantProfile, Lease, Payment, MaintenanceRequest, Booking } from "@/types/api";
import { useOffers } from "@/hooks/useOffers";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
import ServiceRequestsTable from '@/components/shared/ServiceRequestsTable';
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { enUS } from "date-fns/locale";

import { useLanguage } from "@/context/LanguageContext";
import { LegalStatsCards } from "@/components/legal/LegalStatsCards";
import { LegalDisputesTable } from "@/components/legal/LegalDisputesTable";
import { ContractForm, DocumentationForm, LegalDisputeForm, OtherServicesForm } from "@/components/legal";
import { PropertyPortfolio } from "@/components/properties/PropertyPortfolio";
import { AddPropertyWizard } from "@/components/modals/AddPropertyWizard";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  image?: string;
}



// Status options moved inside component with useMemo


const DISPUTE_TYPES = ["dispute", "deedUpdate", "منازعة عقارية", "منازعة قانونية", "منازعة قانوية"];
const CONTRACT_TYPES = ["contracts", "consultation", "مراجعة عقد"];
const NOTARY_TYPES = ["notary", "توثيق", "التوثيق", "notarization"];

const STATUS_STYLES: Record<string, string> = {
  pending:     "bg-amber-100 text-amber-700",
  assigned:    "bg-blue-100 text-blue-700",
  in_progress: "bg-violet-100 text-violet-700",
  completed:   "bg-emerald-100 text-emerald-700",
  cancelled:   "bg-rose-100 text-rose-700",
};

const getStatusColor = (status: string, t: any, invoiceStatus?: string) => {
  if (invoiceStatus) {
    if (invoiceStatus === 'accepted') return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    if (invoiceStatus === 'rejected') return "bg-rose-100 text-rose-800 border border-rose-200";
    return "bg-blue-100 text-blue-800 border border-blue-200"; // Invoice Sent
  }

  switch (status) {
    case 'pending':
    case t('bm.status.pending'):
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    case 'processing':
    case 'review':
    case 'doc':
    case 'assigned':
    case t('bm.status.processing'):
    case t('bm.status.review'):
    case t('bm.status.doc'):
      return "bg-slate-100 text-slate-800 border border-slate-200";
    case 'completed':
    case t('bm.status.completed'):
    case t('property.condition.renovated'): // repurposed
      return "bg-green-100 text-green-800 border border-green-200";
    case 'cancelled':
    case t('bm.status.cancelled'):
      return "bg-red-100 text-red-800 border border-red-200";
    default:
      return "bg-slate-100 text-gray-800 border border-slate-200";
  }
};

const getStatusIcon = (status: string, t: any, invoiceStatus?: string) => {
  if (invoiceStatus) {
    if (invoiceStatus === 'accepted') return CheckCircle;
    if (invoiceStatus === 'rejected') return XCircle;
    return FileText;
  }

  switch (status) {
    case 'pending':
    case t('bm.status.pending'):
      return Clock;
    case 'processing':
    case 'review':
    case 'doc':
    case 'assigned':
    case t('bm.status.processing'):
    case t('bm.status.review'):
    case t('bm.status.doc'):
      return AlertCircle;
    case 'completed':
    case t('bm.status.completed'):
      return CheckCircle;
    case 'cancelled':
    case t('bm.status.cancelled'):
      return XCircle;
    default:
      return Clock;
  }
};

const getServiceStatusLabel = (service: any, t: any) => {
  if (service.invoiceStatus) {
    if (service.invoiceStatus === 'accepted') return t('admin.service_requests.status.accepted');
    if (service.invoiceStatus === 'rejected') return t('admin.service_requests.status.rejected');
    return t('admin.service_requests.status.invoice_sent');
  }
  
  // Check if status is already a translated Arabic string
  if (typeof service.status === 'string' && (service.status.includes(' ') || service.status.match(/[\u0600-\u06FF]/))) {
     return service.status;
  }

  return t(`bm.status.${service.status || 'pending'}`);
};

const DEPARTMENTS = [
  { id: "real_estate", key: "admin.trans.dept.real_estate" },
  { id: "marketing",   key: "admin.trans.dept.marketing"   },
  { id: "legal",       key: "admin.trans.dept.legal"       },
  { id: "finance",     key: "admin.trans.dept.finance"     },
];

function filterRequests(all: any[], tab: string) {
  switch (tab) {
    case "all":
      return all.filter(
        (r) => r.category === "legal" || r.targetDepartment === "legal"
      );
    case "disputes":
      return all.filter(
        (r) => (r.category === "legal" || (r.category === "other" && r.targetDepartment === "legal")) && 
               (DISPUTE_TYPES.includes(r.serviceType) || r.serviceType?.includes("منازعة"))
      );
    case "contracts":
      return all.filter(
        (r) => (r.category === "legal" || (r.category === "other" && r.targetDepartment === "legal")) && 
               CONTRACT_TYPES.includes(r.serviceType)
      );
    case "notary":
      return all.filter(
        (r) => (r.category === "legal" || (r.category === "other" && r.targetDepartment === "legal")) && 
               NOTARY_TYPES.includes(r.serviceType)
      );
    case "services":
      return all.filter((r) => r.category === "legal");
    case "other":
      return all.filter(
        (r) => r.category === "other" && 
               r.targetDepartment === "legal" && 
               !DISPUTE_TYPES.includes(r.serviceType) && 
               !r.serviceType?.includes("منازعة") &&
               !CONTRACT_TYPES.includes(r.serviceType)
      );
    default:
      return all;
  }
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}

function RequestRow({ req, language, onOpen, t, getStatusColor, getServiceStatusLabel, actionIcon: ActionIcon = Receipt }: any) {
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
  <User className="w-3 h-3 text-slate-500" />
</div>
          <div>
            <p className="text-sm font-bold text-slate-900">{req.clientName || req.firstParty?.name || t('bm.undefined')}</p>
            <p className="text-[11px] text-slate-400 font-medium" dir="ltr">{req.phone}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge variant="outline" className="font-bold text-[10px]">
          {req.serviceType || req.type}
        </Badge>
      </td>
      <td className="px-6 py-4">
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${getStatusColor(req.status, req.invoiceStatus)}`}>
          {getServiceStatusLabel(req)}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <button
          onClick={() => onOpen(req)}
          className="p-2 rounded-xl border border-slate-100 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all text-slate-400"
        >
          <ActionIcon className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function RequestsTable({ items, isLoading, language, onOpen, t, getStatusColor, getServiceStatusLabel }: any) {
  const [search, setSearch] = useState("");
  const filtered = items.filter(
    (r: any) =>
      r.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      r.serviceType?.toLowerCase().includes(search.toLowerCase()) ||
      r.phone?.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.service_requests.search_placeholder")}
            className="w-full bg-white border border-slate-100 py-3 pr-11 pl-5 text-sm font-bold rounded-2xl outline-none focus:border-slate-900 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('bm.list.parties')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('bm.list.type')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('bm.list.status')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('bm.list.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-4 h-16 bg-slate-50/50" />
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-bold text-sm">
                    {t('bm.list.empty')}
                  </td>
                </tr>
              ) : (
                filtered.map((req: any) => (
                  <RequestRow 
                    key={req.id} 
                    req={req} 
                    language={language} 
                    onOpen={onOpen} 
                    t={t} 
                    getStatusColor={getStatusColor}
                    getServiceStatusLabel={getServiceStatusLabel}
                    actionIcon={Send}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BuildingManagementContent() {
  const router = useRouter();  
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const { t, language } = useLanguage();

  const disputeTypes = useMemo(() => [
    t('bm.type.prop'),
    t('bm.type.salerent'),
    t('bm.type.mortgage'),
    t('bm.type.violation'),
    t('bm.type.public'),
    t('bm.type.dev'),
    t('bm.type.heritage'),
    t('bm.type.other')
  ], [t]);

  const contractTypes = useMemo(() => [
    t('bm.contract.sale'),
    t('bm.contract.rent'),
    t('bm.contract.benefit'),
    t('bm.contract.gift'),
    t('bm.contract.mortgage'),
    t('bm.contract.invest'),
    t('bm.contract.review'),
    t('bm.type.other')
  ], [t]);

  const legalServiceTypes = useMemo(() => [
    t('bm.service.consult'),
    t('bm.service.report')
  ], [t]);

  // Framer Motion Imports (Dynamic to avoid SSR issues if needed, but standard import is usually fine in 'use client')
  const { motion, AnimatePresence } = require("framer-motion");

  const partyRoles = useMemo(() => [t('bm.role.seller'), t('bm.role.buyer'), t('bm.role.broker')], [t]);
  const idTypes = useMemo(() => [t('bm.id.national'), t('bm.id.residence'), t('bm.id.cr')], [t]);
  const partyTypes = useMemo(() => [t('bm.party.individual'), t('bm.party.company')], [t]);
  const applicantRoles = useMemo(() => [t('bm.role.first'), t('bm.role.second'), t('bm.role.agent')], [t]);

  const statusOptions = useMemo(() => ({
    disputes: [t('bm.status.pending'), t('bm.status.processing'), t('bm.status.completed'), t('bm.status.cancelled')],
    contracts: [t('bm.status.pending'), t('bm.status.review'), t('bm.status.modified'), t('bm.status.completed'), t('bm.status.cancelled')],
    documentations: [t('bm.status.pending'), t('bm.status.doc'), t('bm.status.completed'), t('bm.status.cancelled')],
    other: [t('bm.status.pending'), t('bm.status.processing'), t('bm.status.completed'), t('bm.status.cancelled')],
  }), [t]);


  const sidebarItems: SidebarItem[] = [
    {
      id: "offers",
      label: t('pm.offers'),
      icon: Briefcase,
      image: "/icons/3rod.png"
    },
    {
      id: "orders",
      label: t('pm.orders'),
      icon: FileText,
      image: "/icons/orders.png"
    },
    {
      id: "marketing",
      label: t('pm.marketing'),
      icon: Megaphone,
      image: "/icons/marketing.png"
    },
    {
      id: "properties",
      label: t('pm.properties'), // Portfolio / Assets
      icon: Building,
      image: "/icons/3kar.png"
    },
    {
      id: "financial",
      label: t('pm.financial'), // Collection & Cashflow
      icon: DollarSign,
      image: "/icons/finacial.png"
    },
    {
      id: "legal",
      label: t('pm.legal'),
      icon: Scale,
      image: "/icons/kanon.png"
    },

    {
      id: "users",
      label: t('bm.users.title'),
      icon: User,
    },
    {
      id: "subscriptions",
      label: t('pm.subscriptions'),
      icon: Home,
      image: "/icons/a4trkat.png" // Using the same as properties for now or another relevant one
    },
  ];

  // Add Back Button Handler
  const handleBack = () => {
     router.back();
     // Or router.push('/') if back is not reliable
  };
  const [selectedOrder, setSelectedOrder] = useState<any>(null); // For detail view
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>("offers");
  const [activeLegalTab, setActiveLegalTab] = useState<string>("dashboard");

  // Handle Query Params
  useEffect(() => {
    const section = searchParams.get('section');
    const tab = searchParams.get('tab');
    if (section) {
      setSelectedSection(section);
    }
    if (tab && section === 'legal') {
      setActiveLegalTab(tab);
    }
  }, [searchParams]);

  // User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [activePropertyTab, setActivePropertyTab] = useState<'portfolio' | 'tenants' | 'financial' | 'reports' | 'service-requests'>('portfolio');
  const [showNewPropertyModal, setShowNewPropertyModal] = useState(false);
  const [newPropertyData, setNewPropertyData] = useState<Partial<Property>>({
    name: '',
    type: 'building', // Default
    deedNumber: '',
    locationUrl: '',
    purchasePrice: 0
  });
  const [isCreatingProperty, setIsCreatingProperty] = useState(false);

  // Tenant State
  const [tenants, setTenants] = useState<TenantProfile[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [showNewTenantModal, setShowNewTenantModal] = useState(false);
  const [newTenantData, setNewTenantData] = useState<Partial<TenantProfile>>({
    fullName: '',
    phoneNumber: '',
    email: '',
    type: 'individual',
    idNumber: '',
    employer: '',
    preferredPaymentDay: 1
  });
  const [tenantIdFile, setTenantIdFile] = useState<File | null>(null);
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantProfile | null>(null);
  const [showTenantDetails, setShowTenantDetails] = useState(false);

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);

  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showOfferDetails, setShowOfferDetails] = useState(false);
  
  // Financial State
  const [leases, setLeases] = useState<Lease[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [activeFinancialSubTab, setActiveFinancialSubTab] = useState<'payments' | 'utilities' | 'deposits'>('payments');
  const [activeReportsSubTab, setActiveReportsSubTab] = useState<'roi' | 'maintenance'>('roi');
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceRequest[]>([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [showNewMaintenanceModal, setShowNewMaintenanceModal] = useState(false);
  const [newMaintenanceData, setNewMaintenanceData] = useState<Partial<MaintenanceRequest>>({
    type: 'routine',
    description: '',
    status: 'pending'
  });

  // Subscription State
  const [activeSubscriptionTab, setActiveSubscriptionTab] = useState<"new" | "list">("new");
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [newSubscriptionData, setNewSubscriptionData] = useState({
    propertyId: '',
    propertyType: '',
    unitId: '',
    packageId: '',
    startDate: '',
    notes: ''
  });
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [activeUserTab, setActiveUserTab] = useState<"new" | "list">("new");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("disputes");
  const [legalSearchTerm, setLegalSearchTerm] = useState("");

  // Legal Services States
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<any>(null);
  const [isServiceRequestDetailsOpen, setIsServiceRequestDetailsOpen] = useState(false);
  const [invoicePrice, setInvoicePrice] = useState("");
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [invoiceMessage, setInvoiceMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Service Request Creation Form State (under Legal)
  const [srActiveTab, setSrActiveTab] = useState<"create" | "view">("view");
  const [srFormData, setSrFormData] = useState({
    clientName: "",
    phone: "",
    city: "",
    district: "",
    serviceCategory: "other" as string,
    serviceType: "",
    targetDepartment: "real_estate",
    quantity: "1",
    description: "",
  });
  const [srIsSubmitting, setSrIsSubmitting] = useState(false);
  const [srSubmitStatus, setSrSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [srErrorMessage, setSrErrorMessage] = useState("");
  const [srRequests, setSrRequests] = useState<any[]>([]);
  const [srIsLoading, setSrIsLoading] = useState(false);
  const [srIsUpdatingPrice, setSrIsUpdatingPrice] = useState(false);
  const [srIsAccepting, setSrIsAccepting] = useState(false);
  const [srIsSendingInvoice, setSrIsSendingInvoice] = useState(false);
  const [srInvoicePrice, setSrInvoicePrice] = useState("");
  const [srInvoiceMessage, setSrInvoiceMessage] = useState<{type:'success'|'error', text:string} | null>(null);
  const [srSearchTerm, setSrSearchTerm] = useState("");
  const [srSelectedRequest, setSrSelectedRequest] = useState<any>(null);
  const [srIsDetailsOpen, setSrIsDetailsOpen] = useState(false);
  const [srEditingPrice, setSrEditingPrice] = useState("");
  const [srEditingDepartment, setSrEditingDepartment] = useState("");
  const [srUserBookings, setSrUserBookings] = useState<any[]>([]);
  const [srUserInvoices, setSrUserInvoices] = useState<any[]>([]);
  const [srIsLoadingRelated, setSrIsLoadingRelated] = useState(false);

  // Offer Appointments Modal State
  const [selectedOfferForAppointments, setSelectedOfferForAppointments] = useState<Offer | null>(null);
  const [showOfferAppointments, setShowOfferAppointments] = useState(false);
  const [incomingBookings, setIncomingBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [legalStats, setLegalStats] = useState<LegalServicesStats>({
    totalServices: 0,
    disputes: { total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 },
    contracts: { total: 0, pending: 0, inReview: 0, completed: 0, signed: 0 },
    otherServices: { total: 0, pending: 0, completed: 0, responded: 0 },
  });

  // Legal Data States
  const [legalDisputes, setLegalDisputes] = useState<LegalDispute[]>([]);

  // Fetch Functions
  const fetchProperties = async () => {
    setLoadingProperties(true);
    try {
      const res = await propertiesApi.findAll();
      setProperties(res.data);
    } catch (error) {
      console.error(error);
      toast.error(t('bm.toast.errorLoad'));
    } finally {
      setLoadingProperties(false);
    }
  };

  const fetchTenants = async () => {
    setLoadingTenants(true);
    try {
      const res = await propertiesApi.getTenants();
      setTenants(res.data);
    } catch (error) {
      console.error(error);
      toast.error(t('bm.toast.errorLoad'));
    } finally {
      setLoadingTenants(false);
    }
  };

  const fetchFinancials = async () => {
    setLoadingFinancial(true);
    try {
      const [leasesRes, paymentsRes] = await Promise.all([
        propertiesApi.getLeases(),
        propertiesApi.getPayments()
      ]);
      setLeases(leasesRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingFinancial(false);
    }
  };

  const fetchMaintenanceLogs = async () => {
    setLoadingMaintenance(true);
    try {
      const res = await propertiesApi.getMaintenanceLogs();
      setMaintenanceLogs(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMaintenance(false);
    }
  };

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions/my');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const fetchIncomingBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await bookingsApi.findIncoming();
      setIncomingBookings(res.data);
    } catch (err) {
      console.error("Failed to fetch incoming bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch subscriptions when section changes
  useEffect(() => {
    if (selectedSection === 'subscriptions') {
      fetchSubscriptions();
    }
    if (selectedSection === 'offers') {
      fetchIncomingBookings();
    }
  }, [selectedSection]);
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
      role: t('bm.role.seller'),
      idType: t('bm.id.national'),
      idNumber: "",
      nationality: "",
      city: "",
      nationalAddress: "",
      phone: "",
      email: "",
    },
    secondParty: {
      name: "",
      role: t('bm.role.buyer'),
      idType: t('bm.id.national'),
      idNumber: "",
      nationality: "",
      city: "",
      nationalAddress: "",
      phone: "",
      email: "",
    },
    disputeType: t('bm.type.prop'),
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
  const [orderFormData, setOrderFormData] = useState<any>({
    orderType: "buy",
    propertyType: "",
    city: "",
    neighborhood: "",
    area: 0,
    propertyAge: "",
    deedType: "",
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
    furnitureStatus: "",
    additionalDetails: ""
  });

  // Offer Filtering
  // Packages State
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [loadingPackages, setLoadingPackages] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
        const res = await api.get('/management-packages');
        setPackages(res.data.filter((p: any) => p.isActive));
    } catch (err) {
        console.error("Error fetching packages", err);
    } finally {
        setLoadingPackages(false);
    }
  };

  const [activeOfferTab, setActiveOfferTab] = useState<"new" | "list">("new");
  const [activeOffersFilterTab, setActiveOffersFilterTab] = useState<"all" | "my">("all");
  const [myOffers, setMyOffers] = useState<Offer[]>([]); 

  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [loadingAllOffers, setLoadingAllOffers] = useState(false);

  const filteredOffers = useMemo(() => {
     if (activeOffersFilterTab === 'my') return myOffers;
     return allOffers; 
  }, [activeOffersFilterTab, myOffers, allOffers]);

  useEffect(() => {
     if (activeOfferTab === 'list') {
         if (activeOffersFilterTab === 'my') {
             offersApi.findMyOffers().then(res => setMyOffers(res.data)).catch(console.error);
         } else {
             setLoadingAllOffers(true);
             offersApi.findAll().then(res => setAllOffers(res.data)).catch(console.error).finally(() => setLoadingAllOffers(false));
         }
     }
  }, [activeOfferTab, activeOffersFilterTab]);
  
  // Filtering states
  const [activeOrdersFilterTab, setActiveOrdersFilterTab] = useState<"all" | "my">("all");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingAllOrders, setLoadingAllOrders] = useState(false);

  const filteredOrders = useMemo(() => {
    if (activeOrdersFilterTab === 'my') return myOrders;
    return allOrders; 
  }, [activeOrdersFilterTab, myOrders, allOrders]);

  // Fetch orders based on active tab and filter
  useEffect(() => {
      if (activeOrderTab === 'list') {
          if (activeOrdersFilterTab === 'my') {
              ordersApi.findMyOrders().then(res => setMyOrders(res.data)).catch(console.error);
          } else {
              setLoadingAllOrders(true);
              ordersApi.findAll().then(res => setAllOrders(res.data)).catch(console.error).finally(() => setLoadingAllOrders(false));
          }
      }
  }, [activeOrderTab, activeOrdersFilterTab]);
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
    locationUrl: "",
    address: "",
  });
  const [showOfferMap, setShowOfferMap] = useState(false);
  const [offerMapCoordinates, setOfferMapCoordinates] = useState<[number, number] | null>(null);

  const handleOfferLocationSelect = useCallback(async (lat: number, lng: number) => {
    setOfferMapCoordinates([lat, lng]);
    const link = `https://www.google.com/maps?q=${lat},${lng}`;
    
    // Fetch address using reverse geocoding
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ar,en`);
      const data = await response.json();
      if (data && data.display_name) {
        setFormData(prev => ({ ...prev, locationUrl: link, address: data.display_name }));
      } else {
        setFormData(prev => ({ ...prev, locationUrl: link }));
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setFormData(prev => ({ ...prev, locationUrl: link }));
    }
  }, []);

  const extractCoordinates = (url?: string): { lat: number; lng: number } | null => {
    if (!url) return null;
    try {
      // Handle standard "q=lat,lng" format
      const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qMatch) {
         return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
      }
      // Handle "@lat,lng" format
      const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) {
         return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const confirmOfferLocation = () => {
    setShowOfferMap(false);
  };
  
  const [offerImages, setOfferImages] = useState<File[]>([]);
  const [offerVideo3d, setOfferVideo3d] = useState<File | null>(null);
  const video3dInputRef = useRef<HTMLInputElement>(null);
  
  const [dealType, setDealType] = useState<"sale" | "rent">("sale");
  const [mainCategory, setMainCategory] = useState<"residential" | "commercial">("residential");
  
  // Dynamic Property Types based on Category (using keys for stability)
  const propertyTypeOptions = useMemo(() => ({
    residential: [
        { key: 'land', label: t('bm.prop.land') },
        { key: 'villa', label: t('bm.prop.villa') },
        { key: 'palace', label: t('bm.prop.palace') },
        { key: 'apt', label: t('bm.prop.apt') }
    ],
    commercial: [
        { key: 'officeTower', label: t('bm.prop.officeTower') },
        { key: 'office', label: t('bm.prop.office') },
        { key: 'shop', label: t('bm.prop.shop') },
        { key: 'hotel', label: t('bm.prop.hotel') },
        { key: 'towers', label: t('bm.prop.towers') },
        { key: 'building', label: t('bm.prop.building') }
    ]
  }), [t]);

  const showDetailedFields = useMemo(() => ['villa', 'palace', 'apt'].includes(formData.propertyType), [formData.propertyType]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);

  const handleOrderChat = async (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    if (!user) {
        toast.error(t('chat.pleaseLogin') || 'Please login to start a chat');
        return;
    }

    const advertiserId = order.user?.id;
    if (!advertiserId) {
        toast.error('Advertiser information not found');
        return;
    }

    if (user.id === advertiserId) {
        toast.error(t('chat.ownOffer') || "This is your order, you can't chat with yourself");
        return;
    }

    try {
        setChatLoadingId(order.id);
        const room = await chatApi.getOrCreateOrderRoom({
            orderId: order.id,
            otherId: advertiserId,
            title: `${order.propertyType} - ${order.city}`
        });

        if (room && room.id) {
            router.push(`/chat/${room.id}`);
        } else {
            throw new Error('Failed to create chat room');
        }
    } catch (error) {
        console.error('Error starting chat:', error);
        toast.error('Failed to start chat. Please try again.');
    } finally {
        setChatLoadingId(null);
    }
  };

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
          await loadAllServices();
          srFetchRequests();
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
        case "all":
          await loadAllServices();
          break;
        case "service-requests":
          srFetchRequests();
          break;
      }
    } catch (error) {
      console.error("Error loading legal services data:", error);
      toast.error(t('bm.toast.errorLoad'));
    }
  };

  const loadStats = async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const stats = await legalServicesApi.getUserLegalStats();
      setLegalStats(stats);
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error(t('bm.toast.errorStats'));
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
          (typeof dispute.firstParty === 'string' ? dispute.firstParty : t('bm.undefined')),
        secondParty: typeof dispute.secondParty === 'object' && dispute.secondParty !== null ?
          dispute.secondParty.name :
          (typeof dispute.secondParty === 'string' ? dispute.secondParty : t('bm.undefined')),
        // Ensure other properties exist
        disputeType: dispute.disputeType || t('bm.undefined'),
        status: dispute.status || t('bm.status.pending'),
        createdAt: dispute.createdAt ?
          new Date(dispute.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') :
          t('bm.undefined')
      }));

      setLegalDisputes(transformedDisputes);
    } catch (error) {
      console.error("Error loading disputes:", error);
      toast.error(t('bm.toast.errorDisputes'));
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
          (typeof dispute.firstParty === 'string' ? dispute.firstParty : t('bm.undefined')),
        secondParty: typeof dispute.secondParty === 'object' && dispute.secondParty !== null ?
          dispute.secondParty.name :
          (typeof dispute.secondParty === 'string' ? dispute.secondParty : t('bm.undefined')),
        disputeType: dispute.disputeType || t('bm.undefined'),
        status: dispute.status || t('bm.status.pending'),
        createdAt: dispute.createdAt ?
          new Date(dispute.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') :
          t('bm.undefined')
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
      toast.error(t('bm.toast.errorContracts'));
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
      toast.error(t('bm.toast.errorOther'));
      setOtherServices([]);
    } finally {
      setLoading(prev => ({ ...prev, otherServices: false }));
    }
  };

  const [allServices, setAllServices] = useState<any[]>([]);

  const loadAllServices = async () => {
      setLoading(prev => ({ ...prev, disputes: true, contracts: true, otherServices: true, stats: true }));
      try {
          const [disputesRes, contractsRes, otherRes, srRes, stats] = await Promise.all([
              legalServicesApi.getLegalDisputes({ take: 50, skip: 0 }),
              legalServicesApi.getContracts({ take: 50, skip: 0 }),
              legalServicesApi.getOtherLegalServices({ take: 50, skip: 0 }),
              api.get('/service-requests'),
              legalServicesApi.getUserLegalStats()
          ]);

          const disputes = (Array.isArray(disputesRes) ? disputesRes : (disputesRes.data || disputesRes.disputes || [])).map((d: any) => ({ ...d, type: t('bm.disputes.title'), date: d.createdAt }));
          const contracts = (Array.isArray(contractsRes) ? contractsRes : (contractsRes.data || contractsRes.contracts || [])).map((c: any) => ({ ...c, type: t('bm.contracts.title'), date: c.createdAt }));
          const other = (Array.isArray(otherRes) ? otherRes : (otherRes.data || otherRes.otherServices || [])).map((o: any) => ({ ...o, type: t('pm.legal.stats.other'), date: o.createdAt }));
          
          const srRequestsData = Array.isArray(srRes.data) ? srRes.data : [];
          const srLegal = srRequestsData
            .filter((req: any) => req.category === 'legal' || req.targetDepartment === 'legal')
            .map((req: any) => ({ ...req, type: req.serviceType || t('disputes.tab.service_requests'), date: req.createdAt }));

          const combined = [...disputes, ...contracts, ...other, ...srLegal].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setAllServices(combined);
          setLegalStats(stats);

      } catch (error) {
          console.error("Error loading all services", error);
          toast.error(t('bm.toast.errorLoad'));
      } finally {
          setLoading(prev => ({ ...prev, disputes: false, contracts: false, otherServices: false, stats: false }));
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

  const handleViewServiceRequest = async (request: any) => {
    setSelectedServiceRequest(request);
    setIsServiceRequestDetailsOpen(true);
    setSrEditingPrice(request.price?.toString() || "");
    setSrEditingDepartment(request.targetDepartment || "real_estate");
    setInvoicePrice("");
    setInvoiceMessage(null);

    // Fetch related visits & invoices
    setSrIsLoadingRelated(true);
    try {
      // Using existing bookingsApi and financialApi if available, or fetch
      const [bookings, invs] = await Promise.all([
        bookingsApi.getUserBookings(request.userId || request.clientId),
        financialApi.getUserInvoices(request.userId || request.clientId),
      ]);
      setSrUserBookings(Array.isArray(bookings) ? bookings : (bookings as any).data || []);
      setSrUserInvoices(Array.isArray(invs) ? invs : (invs as any).data || []);
    } catch (error) {
      console.error("Error fetching related data:", error);
      setSrUserBookings([]);
      setSrUserInvoices([]);
    } finally {
      setSrIsLoadingRelated(false);
    }
  };

  const handleUpdateSrStatus = async (status: string) => {
    if (!selectedServiceRequest || !token) return;
    try {
      const res = await api.put(`/service-requests/${selectedServiceRequest.id}/status`, { status });
      if (res.data) {
        toast.success(t('bm.toast.successUpdate'));
        setSelectedServiceRequest(res.data);
        loadAllServices();
      }
    } catch (error) {
      toast.error(t('bm.toast.errorUpdate'));
    }
  };

  const handleSaveSrChanges = async () => {
    if (!selectedServiceRequest || !token) return;
    setSrIsUpdatingPrice(true);
    try {
      const res = await api.put(`/service-requests/${selectedServiceRequest.id}`, {
        price: parseFloat(srEditingPrice),
        targetDepartment: srEditingDepartment
      });
      if (res.data) {
        toast.success(t('bm.toast.successSave'));
        setSelectedServiceRequest(res.data);
        loadAllServices();
        setSrIsDetailsOpen(false);
      }
    } catch (error) {
      toast.error(t('bm.toast.errorSave'));
    } finally {
      setSrIsUpdatingPrice(false);
    }
  };

  const legalHandleSendInvoice = async () => {
    if (!token || !selectedServiceRequest || !invoicePrice) return;
    setIsSendingInvoice(true);
    setInvoiceMessage(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/service-requests/${selectedServiceRequest.id}/send-invoice`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ price: parseFloat(invoicePrice) }),
        }
      );
      if (res.ok) {
        toast.success(t("legal.invoice.sendSuccess"));
        loadAllServices();
        setInvoicePrice("");
        setSrIsDetailsOpen(false);
      } else {
        toast.error(t("legal.invoice.sendError"));
      }
    } catch {
      toast.error(t("legal.invoice.sendError"));
    } finally {
      setIsSendingInvoice(false);
    }
  };

  // ── Service Request Form Constants ──────────────────────────────────────────
  const srServiceOptions: Record<string, string[]> = {
    postPurchase: ["gas", "furniture", "insurance", "maintenance", "cleaning", "landscaping", "security"],
    legal: ["notary", "deedUpdate", "dispute", "contracts", "consultation"],
    construction: ["skeleton", "engineering", "finishing", "electrical", "plumbing", "carpentry", "painting", "aluminum", "supervision", "interior"],
    other: ["valuation", "survey", "neighborhoodReport", "traditionalAds"],
  };
  const srDepartments = [
    { id: 'real_estate', key: 'admin.trans.dept.real_estate' },
    { id: 'marketing',   key: 'admin.trans.dept.marketing' },
    { id: 'legal',       key: 'admin.trans.dept.legal' },
    { id: 'finance',     key: 'admin.trans.dept.finance' },
  ];

  const srFetchRequests = async () => {
    if (!token) return;
    setSrIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) setSrRequests(await res.json());
    } catch (e) { console.error(e); }
    finally { setSrIsLoading(false); }
  };

  const srFetchRelated = useCallback(async (userId: string) => {
    if (!userId || !token) return;
    setSrIsLoadingRelated(true);
    try {
      const [bookingsRes, invoicesRes] = await Promise.all([
        bookingsApi.getUserBookings(userId),
        financialApi.getUserInvoices(userId),
      ]);
      setSrUserBookings(bookingsRes.data || []);
      setSrUserInvoices(invoicesRes.data || []);
    } catch { setSrUserBookings([]); setSrUserInvoices([]); }
    finally { setSrIsLoadingRelated(false); }
  }, [token]);

  const srHandleInputChange = (field: string, value: string) => {
    setSrFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'serviceCategory') {
        next.serviceType = '';
        if (value === 'legal') next.targetDepartment = 'legal';
        else if (value === 'postPurchase' || value === 'construction') next.targetDepartment = 'real_estate';
      }
      return next;
    });
    if (srSubmitStatus !== 'idle') setSrSubmitStatus('idle');
  };

  const srHandleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSrIsSubmitting(true);
    setSrSubmitStatus('idle');
    setSrErrorMessage('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          category: srFormData.serviceCategory,
          serviceType: srFormData.serviceType,
          clientName: srFormData.clientName,
          phone: srFormData.phone,
          city: srFormData.city,
          district: srFormData.district,
          quantity: parseInt(srFormData.quantity),
          description: srFormData.description || undefined,
          targetDepartment: srFormData.targetDepartment,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      setSrSubmitStatus('success');
      setSrFormData({ clientName: '', phone: '', city: '', district: '', serviceCategory: 'other', serviceType: '', targetDepartment: 'real_estate', quantity: '1', description: '' });
      if (srActiveTab === 'view') srFetchRequests();
    } catch (err: any) {
      setSrSubmitStatus('error');
      setSrErrorMessage(err.message || 'An error occurred');
    } finally { setSrIsSubmitting(false); }
  };

  const srHandleSave = async () => {
    if (!token || !srSelectedRequest) return;
    setSrIsUpdatingPrice(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests/${srSelectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ price: parseFloat(srEditingPrice), targetDepartment: srEditingDepartment }),
      });
      if (res.ok) { srFetchRequests(); setSrIsDetailsOpen(false); }
    } catch (e) { console.error(e); }
    finally { setSrIsUpdatingPrice(false); }
  };

  const srHandleSendInvoice = async () => {
    if (!token || !srSelectedRequest || !srInvoicePrice) return;
    setSrIsSendingInvoice(true);
    setSrInvoiceMessage(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests/${srSelectedRequest.id}/send-invoice`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: parseFloat(srInvoicePrice) }),
      });
      if (res.ok) {
        setSrInvoiceMessage({ type: 'success', text: t('legal.invoice.sendSuccess') });
        srFetchRequests();
        setSrInvoicePrice('');
      } else {
        setSrInvoiceMessage({ type: 'error', text: t('legal.invoice.sendError') });
      }
    } catch { setSrInvoiceMessage({ type: 'error', text: t('legal.invoice.sendError') }); }
    finally { setSrIsSendingInvoice(false); }
  };

  // Auto-fetch when switching to view tab
  useEffect(() => { if (srActiveTab === 'view') srFetchRequests(); }, [srActiveTab]);
  // Auto-fetch related info when details open
  useEffect(() => {
    if (srIsDetailsOpen && srSelectedRequest?.userId) srFetchRelated(srSelectedRequest.userId);
    else { setSrUserBookings([]); setSrUserInvoices([]); }
  }, [srIsDetailsOpen, srSelectedRequest, srFetchRelated]);

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedDocuments(prev => [...prev, ...newFiles]);

      // In a real implementation, you would upload these files to the server
      // and get back document IDs to store in the form
      toast.success(t('bm.toast.successFiles'));
    }
  };

  const submitLegalDispute = async () => {
    setIsSubmitting(true);
    try {
      // Validate required fields
      if (!legalDisputeForm.firstParty.name || !legalDisputeForm.secondParty.name || !legalDisputeForm.disputeDescription) {
        throw new Error(t('bm.error.required'));
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
          toast.error(t('bm.toast.errorFileUpload'));
        }
      }

      // Prepare data for API
      const disputeData = {
        ...legalDisputeForm,
        documentIds: documentIds.length > 0 ? documentIds : undefined
      };

      // Send request to create legal dispute
      await legalServicesApi.createLegalDispute(disputeData);

      toast.success(t('bm.toast.successDispute'), {
        duration: 3000,
        position: "top-center",
      });

      // Reset form
      setLegalDisputeForm({
        firstParty: {
          name: "",
          role: t('bm.role.seller'),
          idType: t('bm.id.national'),
          idNumber: "",
          nationality: "",
          city: "",
          nationalAddress: "",
          phone: "",
          email: "",
        },
        secondParty: {
          name: "",
          role: t('bm.role.buyer'),
          idType: t('bm.id.national'),
          idNumber: "",
          nationality: "",
          city: "",
          nationalAddress: "",
          phone: "",
          email: "",
        },
        disputeType: t('bm.type.prop'),
        disputeDescription: "",
      });
      setUploadedDocuments([]);

      // Go back to disputes list
      setActiveLegalTab("disputes");

      // Refresh data
      loadDisputes();
      loadStats();

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || t('bm.toast.offerError');
      toast.error(errorMessage, {
        duration: 4000,
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleUpdateDispute = async (disputeId: string) => {
    toast.success(t('bm.form.editModel'));
  };

  const handleDeleteDispute = async (disputeId: string) => {
    if (!confirm(t('bm.dispute.confirmDelete'))) {
      return;
    }

    try {
      await legalServicesApi.deleteLegalDispute(disputeId);
      toast.success(t('bm.toast.deleteSuccess'));
      // Refresh disputes list
      loadDisputes();
      loadStats();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || t('bm.dispute.deleteError');
      toast.error(errorMessage);
    }
  };

  const handleSearchLegalServices = async () => {
    if (legalSearchTerm.trim().length < 2) {
      toast.error(t('bm.error.searchMin'));
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
            disputeType: dispute.disputeType || t('bm.undefined'),
            status: dispute.status || t('bm.status.pending'),
            createdAt: dispute.createdAt ?
              new Date(dispute.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') :
              t('bm.undefined')
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
      const errorMessage = error.response?.data?.message || error.message || t('bm.search.error');
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status: string, invoiceStatus?: string) => {
    if (invoiceStatus) {
      if (invoiceStatus === 'accepted') return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      if (invoiceStatus === 'rejected') return "bg-rose-100 text-rose-800 border border-rose-200";
      return "bg-blue-100 text-blue-800 border border-blue-200"; // Invoice Sent
    }

    switch (status) {
      case 'pending':
      case t('bm.status.pending'):
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case 'processing':
      case 'review':
      case 'doc':
      case 'assigned':
      case t('bm.status.processing'):
      case t('bm.status.review'):
      case t('bm.status.doc'):
        return "bg-slate-100 text-slate-800 border border-slate-200";
      case 'completed':
      case t('bm.status.completed'):
      case t('property.condition.renovated'): // repurposed
        return "bg-green-100 text-green-800 border border-green-200";
      case 'cancelled':
      case t('bm.status.cancelled'):
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-slate-100 text-gray-800 border border-slate-200";
    }
  };

  const getStatusIcon = (status: string, invoiceStatus?: string) => {
    if (invoiceStatus) {
      if (invoiceStatus === 'accepted') return CheckCircle;
      if (invoiceStatus === 'rejected') return XCircle;
      return FileText;
    }

    switch (status) {
      case 'pending':
      case t('bm.status.pending'):
        return Clock;
      case 'processing':
      case 'review':
      case 'doc':
      case 'assigned':
      case t('bm.status.processing'):
      case t('bm.status.review'):
      case t('bm.status.doc'):
        return AlertCircle;
      case 'completed':
      case t('bm.status.completed'):
        return CheckCircle;
      case 'cancelled':
      case t('bm.status.cancelled'):
        return XCircle;
      default:
        return Clock;
    }
  };

  const getServiceStatusLabel = (service: any) => {
    if (service.invoiceStatus) {
      if (service.invoiceStatus === 'accepted') return t('admin.service_requests.status.accepted');
      if (service.invoiceStatus === 'rejected') return t('admin.service_requests.status.rejected');
      return t('admin.service_requests.status.invoice_sent');
    }
    
    // Check if status is already a translated Arabic string
    if (typeof service.status === 'string' && (service.status.includes(' ') || service.status.match(/[\u0600-\u06FF]/))) {
       return service.status;
    }

    return t(`bm.status.${service.status || 'pending'}`);
  };


  // Render New Legal Service Form (Generic)
  const renderNewLegalServiceForm = () => {
    const getServiceDetails = () => {
      switch (activeLegalTab) {
        case "new-contract":
          return { 
            title: t('bm.form.newContract'), 
            subtitle: t('bm.form.newContractSub'), 
            typeLabel: t('bm.form.newContract'), 
            descLabel: t('bm.form.descLabel'), 
            icon: FileText, 
            colorClass: "bg-green-100 text-green-600",
            borderColor: "border-green-200",
            bgClass: "bg-green-50"
          };
        case "new-documentation":
          return { 
            title: t('bm.form.newDoc'), 
            subtitle: t('bm.form.newDocSub'), 
            typeLabel: t('bm.form.newDoc'), 
            descLabel: t('bm.form.descLabel'), 
            icon: FileCheck, 
            colorClass: "bg-slate-100 text-slate-600",
            borderColor: "border-slate-200",
            bgClass: "bg-slate-50"
          };
      
        case "new-dispute":
        default:
          return { 
            subtitle: t('bm.form.newDisputeSub'), 
            typeLabel: t('bm.form.type.dispute'), 
            descLabel: t('bm.form.descLabel'), 
            icon: AlertCircle, 
            colorClass: "bg-red-100 text-red-600",
            borderColor: "border-slate-200", // Keep blue for parties as default or make dynamic
            bgClass: "bg-slate-50"
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
          <h1 className="text-xl font-bold text-gray-800">{details.title}</h1>
          <p className="text-gray-600">{details.subtitle}</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* بيانات الأطراف */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-4">{t('bm.form.parties')}</h2>

          {/* الطرف الأول */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-slate-100 rounded-lg">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <h4 className="font-medium text-slate-800">{t('bm.form.firstParty')}</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">{t('bm.form.name')} *</label>
                <input
                  type="text"
                  value={legalDisputeForm.firstParty.name}
                  onChange={(e) => handleLegalDisputeChange("firstParty", "name", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">{t('bm.form.role')} *</label>
                <select
                  value={legalDisputeForm.firstParty.role}
                  onChange={(e) => handleLegalDisputeChange("firstParty", "role", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
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
                <label className="block text-gray-700 mb-2">الحي</label>
                <input
                  type="text"
                  value={legalDisputeForm.firstParty.nationalAddress}
                  onChange={(e) => handleLegalDisputeChange("firstParty", "nationalAddress", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">{t('bm.form.phone')} *</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={legalDisputeForm.firstParty.phone}
                    onChange={(e) => handleLegalDisputeChange("firstParty", "phone", e.target.value)}
                    className="w-full p-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">{t('bm.form.email')}</label>
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

          {/* First Party Agent */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="hasFirstPartyAgent"
                checked={!!legalDisputeForm.firstPartyAgent}
                onChange={(e) => {
                  if (e.target.checked) {
                    setLegalDisputeForm(prev => ({
                      ...prev,
                      firstPartyAgent: { name: "", agencyNumber: "", idNumber: "" }
                    }));
                  } else {
                    setLegalDisputeForm(prev => {
                      const { firstPartyAgent, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className="w-4 h-4 text-slate-600 rounded focus:ring-slate-500"
              />
              <label htmlFor="hasFirstPartyAgent" className="font-medium text-slate-800 cursor-pointer">
                {t('bm.form.addAgent')}
              </label>
            </div>

            {legalDisputeForm.firstPartyAgent && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-gray-700 mb-2">{t('bm.form.agentName')} *</label>
                  <input
                    type="text"
                    value={legalDisputeForm.firstPartyAgent.name}
                    onChange={(e) => setLegalDisputeForm(prev => ({
                      ...prev,
                      firstPartyAgent: { ...prev.firstPartyAgent!, name: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">{t('bm.form.agencyNumber')} *</label>
                  <input
                    type="text"
                    value={legalDisputeForm.firstPartyAgent.agencyNumber}
                    onChange={(e) => setLegalDisputeForm(prev => ({
                      ...prev,
                      firstPartyAgent: { ...prev.firstPartyAgent!, agencyNumber: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    required
                  />
                </div>
                 <div>
                  <label className="block text-gray-700 mb-2">{t('bm.form.agentIdNumber')} *</label>
                  <input
                    type="text"
                    value={legalDisputeForm.firstPartyAgent.idNumber}
                    onChange={(e) => setLegalDisputeForm(prev => ({
                      ...prev,
                      firstPartyAgent: { ...prev.firstPartyAgent!, idNumber: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    required
                  />
                </div>
              </div>
            )}
          </div>
          {/* الطرف الثاني - Similar structure */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-medium text-green-800">{t('bm.form.secondParty')}</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">{t('bm.form.name')} *</label>
                <input
                  type="text"
                  value={legalDisputeForm.secondParty.name}
                  onChange={(e) => handleLegalDisputeChange("secondParty", "name", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">{t('bm.form.role')} *</label>
                <select
                  value={legalDisputeForm.secondParty.role}
                  onChange={(e) => handleLegalDisputeChange("secondParty", "role", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  {partyRoles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">{t('bm.form.idType')} *</label>
                <select
                  value={legalDisputeForm.secondParty.idType}
                  onChange={(e) => handleLegalDisputeChange("secondParty", "idType", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  {idTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">{t('bm.form.idNumber')} *</label>
                <input
                  type="text"
                  value={legalDisputeForm.secondParty.idNumber}
                  onChange={(e) => handleLegalDisputeChange("secondParty", "idNumber", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">{t('bm.form.nationality')}</label>
                <input
                  type="text"
                  value={legalDisputeForm.secondParty.nationality}
                  onChange={(e) => handleLegalDisputeChange("secondParty", "nationality", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">{t('bm.form.city')}</label>
                <input
                  type="text"
                  value={legalDisputeForm.secondParty.city}
                  onChange={(e) => handleLegalDisputeChange("secondParty", "city", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">{t('bm.form.district')}</label>
                <input
                  type="text"
                  value={legalDisputeForm.secondParty.nationalAddress}
                  onChange={(e) => handleLegalDisputeChange("secondParty", "nationalAddress", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">{t('bm.form.phone')} *</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={legalDisputeForm.secondParty.phone}
                    onChange={(e) => handleLegalDisputeChange("secondParty", "phone", e.target.value)}
                    className="w-full p-3 ps-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">{t('bm.form.email')}</label>
                <div className="relative">
                  <Mail className="absolute start-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={legalDisputeForm.secondParty.email}
                    onChange={(e) => handleLegalDisputeChange("secondParty", "email", e.target.value)}
                    className="w-full p-3 ps-12 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
          </div>

           {/* Second Party Agent */}
           <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="hasSecondPartyAgent"
                checked={!!legalDisputeForm.secondPartyAgent}
                onChange={(e) => {
                  if (e.target.checked) {
                    setLegalDisputeForm(prev => ({
                      ...prev,
                      secondPartyAgent: { name: "", agencyNumber: "", idNumber: "" }
                    }));
                  } else {
                    setLegalDisputeForm(prev => {
                      const { secondPartyAgent, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <label htmlFor="hasSecondPartyAgent" className="font-medium text-green-800 cursor-pointer">
                {t('bm.form.addAgent')}
              </label>
            </div>

            {legalDisputeForm.secondPartyAgent && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-gray-700 mb-2">{t('bm.form.agentName')} *</label>
                  <input
                    type="text"
                    value={legalDisputeForm.secondPartyAgent.name}
                    onChange={(e) => setLegalDisputeForm(prev => ({
                      ...prev,
                      secondPartyAgent: { ...prev.secondPartyAgent!, name: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">{t('bm.form.agencyNumber')} *</label>
                  <input
                    type="text"
                    value={legalDisputeForm.secondPartyAgent.agencyNumber}
                    onChange={(e) => setLegalDisputeForm(prev => ({
                      ...prev,
                      secondPartyAgent: { ...prev.secondPartyAgent!, agencyNumber: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                 <div>
                  <label className="block text-gray-700 mb-2">{t('bm.form.agentIdNumber')} *</label>
                  <input
                    type="text"
                    value={legalDisputeForm.secondPartyAgent.idNumber}
                    onChange={(e) => setLegalDisputeForm(prev => ({
                      ...prev,
                      secondPartyAgent: { ...prev.secondPartyAgent!, idNumber: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>
            )}
          </div>


        {/* بيانات الخدمة / النزاع */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-4">{details.title}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2">{details.typeLabel} *</label>
              <select
                value={legalDisputeForm.disputeType}
                onChange={(e) => setLegalDisputeForm({ ...legalDisputeForm, disputeType: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                {disputeTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {legalDisputeForm.disputeType === t('bm.type.other') && (
              <div>
                <label className="block text-gray-700 mb-2">{t('bm.offer.subtype')} {details.typeLabel}</label>
                <input
                  type="text"
                  placeholder={`${t('bm.form.placeholder.desc')} ${details.typeLabel}`}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 h-40"
              placeholder={`${details.descLabel}...`}
              required
            />
          </div>
        </div>

        {/* المستندات */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-4">{t('bm.form.upload')}</h2>

          {/* Uploaded Documents List */}
          {uploadedDocuments.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-gray-700 mb-2">{t('bm.form.uploadedFiles')}</h3>
              <div className="space-y-2">
                {uploadedDocuments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-600">{file.name}</span>
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
            <p className="text-gray-600 mb-2">{t('bm.form.uploadDesc')}</p>
            <p className="text-xs text-gray-500 mb-4">{t('bm.form.uploadTips')}</p>
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              {t('bm.form.uploadBtn')}
            </button>
          </div>
        </div>

        {/* أزرار الإرسال */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={submitLegalDispute}
            disabled={isSubmitting}
            className="px-8 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('bm.form.sending')}
              </>
            ) : (
              t('bm.form.submit')
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveLegalTab("disputes")}
            className="px-8 py-3 bg-slate-200 text-gray-700 rounded-lg hover:bg-slate-300 transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );}; // End of renderNewLegalServiceForm

  const handleDeleteProperty = async (id: string) => {
    if (!window.confirm(t('common.deleteConfirm'))) return;
    try {
        await propertiesApi.delete(id);
        toast.success(t('bm.request.success'));
        fetchProperties(); // Use the fetch function if available or refresh list
        if (selectedProperty?.id === id) setSelectedProperty(null);
    } catch (error) {
        console.error(error);
        toast.error(t('bm.toast.error'));
    }
  };




  // Render Property Management Main Section with Sub-tabs
  const renderPropertyManagement = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 p-10 border border-slate-50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-slate-200 text-white">
              <Building className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{t('pm.properties')}</h1>
              <p className="text-slate-500 font-medium text-sm">{t('action.assetManagement')}</p>
            </div>
          </div>
          
          <div className="bg-slate-50 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-slate-100/50">
            {[
              { id: "portfolio", label: t('pm.tab.portfolio'), icon: Building },
              { id: "tenants", label: t('pm.tenants'), icon: Users },
              { id: "financial", label: t('pm.financial.desc'), icon: DollarSign },
              { id: "reports", label: t('pm.reports'), icon: BarChart3 },
              { id: "service-requests", label: t('disputes.tab.service_requests'), icon: LayoutDashboard }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActivePropertyTab(tab.id as any)} 
                className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                  activePropertyTab === tab.id 
                    ? "bg-white text-slate-900 shadow-lg shadow-slate-200/50 scale-105" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selection Banner */}
        {selectedProperty && (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-6 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-600">
                        <Building className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('pm.selected') || 'Selected Property'}</p>
                        <p className="text-base font-black text-slate-900">{selectedProperty.name}</p>
                    </div>
                </div>
                <button 
                    onClick={() => setSelectedProperty(null)}
                    className="px-4 py-2 bg-white text-slate-600 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-all border border-slate-100"
                >
                    {t('common.clear') || 'Clear Filter'}
                </button>
            </div>
        )}

        {/* Tab Content */}
        <div className="min-h-[400px] mt-6">
            {activePropertyTab === 'portfolio' && (
               <PropertyPortfolio
                  properties={properties}
                  loading={loadingProperties}
                  onDelete={handleDeleteProperty}
                  onView={(p) => { setSelectedProperty(p); setShowPropertyDetails(true); }}
                  onCreate={() => setShowNewPropertyModal(true)}
               />
            )}
            {activePropertyTab === 'tenants' && renderTenants()}
            {activePropertyTab === 'financial' && renderFinancial()}
            {activePropertyTab === 'reports' && renderReports()}
            {activePropertyTab === 'service-requests' && (
               <ServiceRequestsTable 
                  title={t('disputes.tab.service_requests')}
                  subtitle={t('bm.requests.all')}
                  department="real_estate"
               />
            )}
        </div>
      </div>
    </div>
  );

  // Render Tenants
  // Create Tenant Handler
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingTenant(true);
    try {
        let idDocumentUrl = '';
        if (tenantIdFile) {
            idDocumentUrl = await uploadFile(tenantIdFile, 'document');
        }

        const payload = {
            ...newTenantData,
            idDocumentUrl
        };

        await propertiesApi.createTenant(payload as any);
        toast.success(t('bm.request.success'));
        setShowNewTenantModal(false);
        setNewTenantData({ 
            fullName: '', 
            phoneNumber: '', 
            email: '', 
            type: 'individual',
            idNumber: '',
            employer: '',
            preferredPaymentDay: 1
        });
        setTenantIdFile(null);
        
        // Refresh list
        const res = await propertiesApi.getTenants();
        setTenants(res.data);
    } catch (error) {
        console.error(error);
        toast.error(t('bm.toast.error'));
    } finally {
        setIsCreatingTenant(false);
    }
  };

  // Render New Tenant Modal
  const renderNewTenantModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-in fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className={`p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r ${language === 'ar' ? 'from-slate-50 to-transparent' : 'from-transparent to-slate-50'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 leading-none mb-1">{t('bm.offer.new')}</h3>
                        <p className="text-xs text-gray-500 font-medium">{t('pm.tenants')}</p>
                    </div>
                </div>
                <button 
                  onClick={() => setShowNewTenantModal(false)} 
                  className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-slate-100 transition-all"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <form onSubmit={handleCreateTenant} className="p-8 space-y-6">
                {/* Tenant Name & ID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-600" />
                            {t('pm.field.tenantName')}
                        </Label>
                        <Input 
                            required
                            className="h-12 bg-slate-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-slate-500/20 transition-all text-sm text-start"
                            value={newTenantData.fullName}
                            onChange={(e) => setNewTenantData({ ...newTenantData, fullName: e.target.value })}
                            placeholder={t('pm.field.tenantName')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <Hash className="w-4 h-4 text-slate-600" />
                            {t('pm.field.idNumber')}
                        </Label>
                        <Input 
                            required
                            className="h-12 bg-slate-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-slate-500/20 transition-all text-sm text-start"
                            value={newTenantData.idNumber}
                            onChange={(e) => setNewTenantData({ ...newTenantData, idNumber: e.target.value })}
                            placeholder="1XXXXXXXXX"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phone Number */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-600" />
                            {t('bm.offer.phone')}
                        </Label>
                        <Input 
                            required
                            className="h-12 bg-slate-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-slate-500/20 transition-all text-sm text-start"
                            value={newTenantData.phoneNumber}
                            onChange={(e) => setNewTenantData({ ...newTenantData, phoneNumber: e.target.value })}
                            placeholder="05XXXXXXXX"
                            dir="ltr"
                        />
                    </div>

                    {/* Employer / Entity */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <Building className="w-4 h-4 text-slate-600" />
                            {t('pm.tenant.employer')}
                        </Label>
                        <Input 
                            className="h-12 bg-slate-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-slate-500/20 transition-all text-sm text-start"
                            value={newTenantData.employer}
                            onChange={(e) => setNewTenantData({ ...newTenantData, employer: e.target.value })}
                            placeholder={t('pm.field.employer')}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tenant Type */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-600" />
                            {t('bm.offer.type')}
                        </Label>
                        <select 
                            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-slate-50 text-xs focus:bg-white focus:ring-2 focus:ring-slate-500/20 transition-all appearance-none cursor-pointer text-start"
                            value={newTenantData.type}
                            onChange={(e) => setNewTenantData({ ...newTenantData, type: e.target.value as any })}
                        >
                            <option value="individual">{t('pm.tenant.individual')}</option>
                            <option value="company">{t('pm.tenant.company')}</option> 
                        </select>
                    </div>

                    {/* Preferred Payment Day */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-600" />
                            {t('pm.field.paymentDay')}
                        </Label>
                        <select 
                            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-slate-50 text-xs focus:bg-white focus:ring-2 focus:ring-slate-500/20 transition-all appearance-none cursor-pointer text-start"
                            value={newTenantData.preferredPaymentDay}
                            onChange={(e) => setNewTenantData({ ...newTenantData, preferredPaymentDay: parseInt(e.target.value) })}
                        >
                            {[...Array(31)].map((_, i) => (
                                <option key={i+1} value={i+1}>{i+1}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-600" />
                        {t('bm.offer.email')}
                    </Label>
                    <Input 
                        type="email"
                        className="h-12 bg-slate-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-slate-500/20 transition-all text-sm text-start"
                        value={newTenantData.email}
                        onChange={(e) => setNewTenantData({ ...newTenantData, email: e.target.value })}
                        placeholder="example@mail.com"
                        dir="ltr"
                    />
                </div>

                {/* ID Document Upload */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-slate-600" />
                        {t('pm.tenant.idUpload')}
                    </Label>
                    <div className="relative group overflow-hidden bg-slate-50 border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-slate-400 transition-all">
                        <input 
                            type="file" 
                            accept="image/*,application/pdf"
                            onChange={(e) => setTenantIdFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-400 group-hover:text-slate-500 shadow-sm transition-colors">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-700">{tenantIdFile ? tenantIdFile.name : t('bm.offer.media.hint')}</p>
                                    <p className="text-xs text-gray-400">{t('bm.offer.mediaDesc')}</p>
                                </div>
                            </div>
                            {tenantIdFile && (
                                <button 
                                    type="button" 
                                    onClick={(e) => { e.stopPropagation(); setTenantIdFile(null); }}
                                    className="p-1 hover:bg-red-50 text-red-500 rounded-full transition-colors z-20"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-6 flex gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1 h-12 rounded-xl font-semibold border-gray-200 hover:bg-slate-50 transition-colors" 
                      onClick={() => setShowNewTenantModal(false)}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-12 rounded-xl font-semibold bg-slate-600 hover:bg-slate-700 text-white shadow-lg shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-70" 
                      disabled={isCreatingTenant}
                    >
                        {isCreatingTenant ? <Loader2 className="animate-spin w-5 h-5 ms-2" /> : null}
                        {t('common.save')}
                    </Button>
                </div>
            </form>
        </div>
    </div>
  );

  const handleDeleteTenant = async (id: string) => {
      if (!window.confirm(t('common.deleteConfirm'))) return;
      try {
          await propertiesApi.deleteTenant(id);
          toast.success(t('bm.request.success'));
          fetchTenants(); // Refresh list
      } catch (error) {
          console.error(error);
          toast.error(t('bm.toast.error'));
      }
  };

  const renderTenants = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
                  <Users className="w-7 h-7 text-slate-900" />
              </div>
              <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{t('pm.tenants')}</h2>
                  <p className="text-slate-500 text-sm font-medium">{t('pm.tenants.desc')}</p>
              </div>
          </div>
          <button 
            onClick={() => setShowNewTenantModal(true)}
            className="h-12 px-8 bg-slate-900 text-white rounded-2xl flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 font-black text-[11px] uppercase tracking-widest hover:-translate-y-1"
          >
            <Plus className="w-4 h-4" />
            {t('pm.tenant.add')}
          </button>
        </div>

        {loadingTenants ? (
          <div className="space-y-6">
             {[1, 2, 3].map(i => (
               <div key={i} className="h-24 bg-slate-50 rounded-[2rem] animate-pulse border border-slate-100" />
             ))}
          </div>
        ) : tenants.filter(tenant => {
            if (!selectedProperty) return true;
            return leases.some(lease => lease.tenantId === tenant.id && lease.unit?.propertyId === selectedProperty.id);
        }).length === 0 ? (
          <div className="text-center py-28 bg-slate-50/30 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200/50 mx-auto mb-6">
                <Users className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{t('pm.list.empty')}</h3>
            <p className="text-slate-500 font-medium text-sm mb-8">{t('pm.tenants.desc')}</p>
            <button 
                onClick={() => setShowNewTenantModal(true)}
                className="h-12 px-8 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
            >
                {t('pm.tenant.add')}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-slate-50 overflow-hidden shadow-2xl shadow-slate-200/30">
            <div className="overflow-x-auto">
                <table className="w-full text-start">
                    <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                        <tr>
                            <th className="p-6 text-start">{t('pm.field.tenantName')}</th>
                            <th className="p-6 text-start">{t('bm.offer.phone')}</th>
                            <th className="p-6 text-start">{t('pm.tenant.type')}</th>
                            <th className="p-6 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {tenants
                          .filter(tenant => {
                              if (!selectedProperty) return true;
                              return leases.some(lease => lease.tenantId === tenant.id && lease.unit?.propertyId === selectedProperty.id);
                          })
                          .map(tenant => (
                            <tr key={tenant.id} className="hover:bg-slate-50/30 transition-all group">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-sm uppercase shadow-lg shadow-slate-200/50 group-hover:scale-110 transition-transform duration-500">
                                            {tenant.fullName.substring(0, 2)}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 text-base tracking-tight">{tenant.fullName}</p>
                                            <p className="text-xs text-slate-400 font-bold">{tenant.email || t('bm.undefined')}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 text-slate-600 font-black text-sm tracking-tight">{tenant.phoneNumber || '-'}</td>
                                 <td className="p-6">
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                        tenant.type === 'company' 
                                            ? 'bg-white text-slate-900 border-slate-200 shadow-sm' 
                                            : 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200/50'
                                    }`}>
                                        {tenant.type === 'company' ? t('pm.tenant.company') : t('pm.tenant.individual')}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="flex gap-2 justify-center opacity-30 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                        <button 
                                            onClick={() => { setSelectedTenant(tenant); setShowTenantDetails(true); }}
                                            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteTenant(tenant.id)}
                                            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}
    </div>
  );

  // Render Reports
  const renderReports = () => (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {/* Sub-tabs */}
          <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1 border border-slate-100/50 w-fit">
              {[
                { id: 'roi', label: t('pm.tab.roi') },
                { id: 'maintenance', label: t('pm.maintenance.log') }
              ].map((subTab) => (
                <button 
                  key={subTab.id}
                  onClick={() => setActiveReportsSubTab(subTab.id as any)}
                  className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                    activeReportsSubTab === subTab.id 
                    ? "bg-white text-slate-900 shadow-lg shadow-slate-200/50" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-50 overflow-hidden shadow-2xl shadow-slate-200/30">
              {activeReportsSubTab === 'roi' ? (
                  <div className="p-10 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:-translate-y-1 transition-all">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">{t('pm.field.purchasePrice')}</p>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">
                                    {(selectedProperty ? (selectedProperty.purchasePrice || 0) : properties.reduce((acc, p) => acc + (p.purchasePrice || 0), 0)).toLocaleString()} <span className="text-xs ml-1 opacity-40 uppercase tracking-widest">SAR</span>
                                </p>
                          </div>
                          <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl shadow-slate-200 group hover:-translate-y-1 transition-all">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 opacity-60">{t('pm.roi.annualIncome')}</p>
                                <p className="text-3xl font-black text-white tracking-tight">
                                    {(payments
                                        .filter(p => p.status === 'paid' && (!selectedProperty || p.lease?.unit?.propertyId === selectedProperty.id))
                                        .reduce((acc, p) => acc + p.amount, 0)).toLocaleString()} <span className="text-xs ml-1 opacity-40 uppercase tracking-widest">SAR</span>
                                </p>
                          </div>
                          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:-translate-y-1 transition-all">
                                <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-2">{t('pm.roi.annualExpenses')}</p>
                                <p className="text-3xl font-black text-red-900 tracking-tight">
                                    0 <span className="text-xs ml-1 opacity-40 uppercase tracking-widest">SAR</span>
                                </p>
                          </div>
                      </div>

                      <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/20">
                          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200/50 mx-auto mb-6">
                              <BarChart3 className="w-10 h-10 text-slate-200" />
                          </div>
                          <h4 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">{t('pm.tab.roi')} {t('common.analysis') || 'Analysis'}</h4>
                          <p className="text-slate-400 font-medium text-sm max-w-sm mx-auto leading-relaxed">{t('bm.dev.desc')}</p>
                      </div>
                  </div>
              ) : (
                   <div className="p-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="p-8 px-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                          <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{t('pm.maintenance.log')}</h3>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">{t('common.history') || 'History'}</p>
                          </div>
                          <button 
                            onClick={() => setShowNewMaintenanceModal(true)}
                            className="h-12 px-8 bg-slate-900 text-white rounded-2xl flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 font-black text-[11px] uppercase tracking-widest hover:-translate-y-1"
                          >
                              <Plus className="w-4 h-4" />
                              {t('bm.offer.new')}
                          </button>
                      </div>
                      <div className="overflow-x-auto">
                           <table className="w-full text-start">
                               <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                                   <tr>
                                       <th className="p-6 text-start">{t('pm.field.status')}</th>
                                       <th className="p-6 text-start">{t('pm.maintenance.faultDesc')}</th>
                                       <th className="p-6 text-start">{t('pm.field.amount')}</th>
                                       <th className="p-6 text-start">{t('pm.maintenance.technician')}</th>
                                       <th className="p-6 text-center">{t('pm.maintenance.completionDate')}</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-50">
                                   {loadingMaintenance ? (
                                       <tr>
                                           <td colSpan={5} className="p-32 text-center">
                                                <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('common.loading')}</p>
                                           </td>
                                       </tr>
                                   ) : maintenanceLogs.filter(log => !selectedProperty || log.propertyId === selectedProperty.id).length === 0 ? (
                                       <tr>
                                           <td colSpan={5} className="p-32 text-center">
                                               <div className="flex flex-col items-center gap-6 opacity-20">
                                                   <Activity className="w-16 h-16" />
                                                   <p className="font-black uppercase tracking-widest text-[10px]">{t('bm.list.empty')}</p>
                                               </div>
                                           </td>
                                       </tr>
                                   ) : (
                                       maintenanceLogs
                                        .filter(log => !selectedProperty || log.propertyId === selectedProperty.id)
                                        .map(log => (
                                           <tr key={log.id} className="hover:bg-slate-50/30 transition-all group">
                                               <td className="p-6">
                                                   <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                       log.status === 'completed' ? 'bg-white text-green-600 border-green-100 shadow-sm shadow-green-50' :
                                                       log.status === 'in_progress' ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200/50' :
                                                       'bg-white text-slate-400 border-slate-100 shadow-sm shadow-slate-50'
                                                   }`}>
                                                       {t(`pm.status.${log.status}`) || log.status}
                                                   </span>
                                               </td>
                                               <td className="p-6 font-black text-slate-900 text-base tracking-tight">{log.description}</td>
                                               <td className="p-6 font-black text-slate-900 text-lg">
                                                   {log.cost?.toLocaleString() || '0'} 
                                                   <span className="text-[10px] ml-1 opacity-30 uppercase tracking-widest font-bold">SAR</span>
                                               </td>
                                               <td className="p-6">
                                                   <div className="flex flex-col px-4 py-2 border border-slate-100 rounded-xl bg-slate-50 group-hover:bg-white group-hover:border-slate-200 transition-all">
                                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('pm.maintenance.technician')}</span>
                                                       <span className="text-sm font-black text-slate-900">{log.technicianName || '-'}</span>
                                                   </div>
                                               </td>
                                               <td className="p-6 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                                   <div className="flex flex-col items-center">
                                                       <Calendar className="w-4 h-4 mb-2 opacity-20" />
                                                       {log.completedDate ? new Date(log.completedDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                                                   </div>
                                               </td>
                                           </tr>
                                        ))
                                   )}
                               </tbody>
                           </table>
                      </div>
                  </div>
              )}
          </div>
      </div>
  );

  // Render Contracts List (similar to disputes)
  const renderContractsList = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative mb-6">
              <Search className="absolute end-3 top-3 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder={t('bm.list.searchPlaceholder')}
                className="w-full pe-10 ps-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-2">{t('bm.form.devStatus')}</h3>
        <p className="text-gray-500">{t('bm.form.devDesc')}</p>
      </div>
    </div>
  );

  const renderAllServicesList = () => (
      <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
               <h3 className="text-base font-bold mb-4">{t('bm.requests.all')}</h3>
               <div className="space-y-4">
                   {allServices.length === 0 && !loading.stats ? (
                       <p className="text-center text-gray-500 py-8">{t('bm.list.empty')}</p>
                   ) : (
                       allServices.map((service, idx) => (
                           <div key={idx} className="flex flex-col md:flex-row justify-between items-center p-4 border rounded-lg hover:shadow-md transition-shadow bg-slate-50">
                               <div>
                                   <div className="flex items-center gap-2 mb-1">
                                       <span className="font-bold text-gray-800">{service.type}</span>
                                       <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(service.status, service.invoiceStatus)}`}>
                                           {getServiceStatusLabel(service)}
                                       </span>
                                   </div>
                                    <p className="text-xs text-gray-500">
                                       {service.disputeNumber || service.contractNumber || service.serviceNumber || `#${idx + 1}`}
                                   </p>
                                   <p className="text-xs text-gray-400 mt-1">
                                       {new Date(service.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                   </p>
                               </div>
                               <button 
                                 onClick={() => handleViewServiceRequest(service)}
                                 className="text-slate-600 text-xs font-medium hover:underline mt-2 md:mt-0"
                               >
                                   {t('cards.details')}
                               </button>
                           </div>
                       ))
                   )}
               </div>
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

  const handleOfferImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const newFiles = Array.from(e.target.files);
        setOfferImages(prev => [...prev, ...newFiles]);
        toast.success(`${newFiles.length} ${t('bm.toast.successFiles')}`);
    }
  };

  const handleOfferVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setOfferVideo3d(e.target.files[0]);
        toast.success(t('bm.toast.successFiles'));
    }
  };

  const handleCategoryChange = (val: "residential" | "commercial") => {
    setMainCategory(val);
    setFormData(prev => ({ ...prev, propertyType: "" })); // Reset property type when category changes
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.propertyType || !formData.city || !formData.price || !formData.area) {
        toast.error(t('bm.error.required'));
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

      let response: any;
      if (createOffer) {
        response = await createOffer(submissionData);
      } else {
        const apiRes = await offersApi.create(submissionData);
        response = apiRes.data;
      }

      // Handle media uploads if offer was created successfully
      const offerId = response?.data?.id || response?.id;
      if (offerId) {
        if (offerImages.length > 0) {
            await offersApi.uploadMedia(offerId, offerImages);
        }
        if (offerVideo3d) {
            await offersApi.upload3DVideos(offerId, [offerVideo3d]);
        }
      }

      toast.success(t('bm.toast.offerSuccess'));
      router.push('/offers');
    } catch (error) {
      console.error(error);
      toast.error(t('bm.toast.offerError'));
      setIsSubmitting(false);
    }
  };

  // --- USER MANAGEMENT TAB ---
  const [createUserForm, setCreateUserForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    nationalId: "",
    role: "employee", // employee or collaborator
    financialAgreementType: "salary",
    financialAgreementValue: "",
    departmentPermissions: {
      offers: "view",
      orders: "view",
      marketing: "view",
      financial: "view",
      properties: "view",
      legal: "view",
      employees: false
    },
    falLicenseNumber: "",
  });

  const handleCreateUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateUserForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (dept: string, value: any) => {
    setCreateUserForm(prev => ({
      ...prev,
      departmentPermissions: {
        ...prev.departmentPermissions,
        [dept]: value
      }
    }));
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Basic validation
      if (!createUserForm.firstName || !createUserForm.lastName || !createUserForm.phone || !createUserForm.nationalId) {
        toast.error(t('bm.error.required'));
        setIsSubmitting(false);
        return;
      }

      const payload = {
        ...createUserForm,
        financialAgreementValue: parseFloat(createUserForm.financialAgreementValue) || 0,
        // Role is strictly employee or collaborator for this form
        role: createUserForm.role, 
        isActive: true,
        isVerified: true
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      toast.success(t('bm.users.createSuccess'));
      setCreateUserForm({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        nationalId: "",
        role: "employee",
        financialAgreementType: "salary",
        financialAgreementValue: "",
        departmentPermissions: {
          offers: "view",
          orders: "view",
          marketing: "view",
          financial: "view",
          properties: "view",
          legal: "view",
          employees: false
        },
        falLicenseNumber: "",
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || t('bm.users.createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderUserManagement = () => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <h1 className="text-lg font-bold text-gray-800 mb-4">{t('bm.title.users')}</h1>
      
      <Tabs value={activeUserTab} onValueChange={(v) => setActiveUserTab(v as "new" | "list")} dir={language === 'ar' ? 'rtl' : 'ltr'} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="new">{t('bm.users.newTitle')}</TabsTrigger>
          <TabsTrigger value="list">{t('bm.users.title')}</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{t('bm.users.newTitle')}</h2>
              <p className="text-gray-500">{t('bm.users.newDesc')}</p>
            </div>
          </div>
          
          <form onSubmit={handleCreateUserSubmit} className="space-y-8">
            
            {/* Classification Section */}
            <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">{t('bm.users.classification')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">{t('bm.users.classification')} *</label>
                  <div className="flex gap-3">
                    <label className={`flex-1 p-2 rounded-lg border-2 cursor-pointer transition-all ${createUserForm.role === 'employee' ? 'border-gray-600 bg-slate-50 text-gray-700' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="radio" 
                        name="role" 
                        value="employee" 
                        checked={createUserForm.role === 'employee'} 
                        onChange={handleCreateUserChange}
                        className="hidden" 
                      />
                      <div className="text-center text-xs font-medium">{t('bm.users.role.employee')}</div>
                    </label>
                    <label className={`flex-1 p-2 rounded-lg border-2 cursor-pointer transition-all ${createUserForm.role === 'collaborator' ? 'border-gray-600 bg-slate-50 text-gray-700' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="radio" 
                        name="role" 
                        value="collaborator" 
                        checked={createUserForm.role === 'collaborator'} 
                        onChange={handleCreateUserChange}
                        className="hidden" 
                      />
                      <div className="text-center text-xs font-medium">{t('bm.users.role.collaborator')}</div>
                    </label>
                  </div>
                </div>

                <div>
                   <label className="block text-xs text-gray-700 mb-1">{t('bm.form.nationalId')} *</label>
                   <input
                     type="text"
                     name="nationalId"
                     value={createUserForm.nationalId}
                     onChange={handleCreateUserChange}
                     className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 text-xs"
                     required
                   />
                </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">{t('profile.nameLabel')} ({t('common.firstName')}) *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={createUserForm.firstName}
                      onChange={handleCreateUserChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">{t('profile.nameLabel')} ({t('common.lastName')}) *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={createUserForm.lastName}
                      onChange={handleCreateUserChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">{t('bm.form.phone')} *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={createUserForm.phone}
                      onChange={handleCreateUserChange}
                      placeholder="05xxxxxxxx"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                      required
                    />
                  </div>
              </div>
            </div>

            {/* Financial Agreement Section */}
            <div className="bg-slate-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-base font-semibold text-gray-800 mb-4">{t('bm.users.financial')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-gray-700 mb-2">{t('bm.users.financial.type')}</label>
                   <select
                      name="financialAgreementType"
                      value={createUserForm.financialAgreementType}
                      onChange={handleCreateUserChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                   >
                     <option value="salary">{t('bm.users.financial.salary')}</option>
                     <option value="percentage">{t('bm.users.financial.percentage')}</option>
                   </select>
                </div>

                <div>
                   <label className="block text-gray-700 mb-2">
                     {createUserForm.financialAgreementType === 'salary' ? t('bm.users.financial.salaryAmount') : t('bm.users.financial.percentageValue')}
                   </label>
                   <div className="relative">
                      <input
                        type="number"
                        name="financialAgreementValue"
                        value={createUserForm.financialAgreementValue}
                        onChange={handleCreateUserChange}
                        className="w-full p-3 ps-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                        placeholder="0.00"
                      />
                      <div className="absolute start-3 top-3 text-gray-500 font-medium">
                         {createUserForm.financialAgreementType === 'salary' ? t('chat.currency') : '%'}
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="bg-slate-50 p-6 rounded-xl border border-gray-200">
               <h3 className="text-base font-semibold text-gray-800 mb-2">{t('bm.users.permissions')}</h3>
               <p className="text-gray-500 text-xs mb-6">{t('bm.users.permissions.desc')}</p>

               <div className="space-y-4">
                  {[
                    { id: 'offers', label: t('bm.users.perm.offers') },
                    { id: 'orders', label: t('bm.users.perm.orders') },
                    { id: 'marketing', label: t('bm.users.perm.marketing') },
                    { id: 'financial', label: t('bm.users.perm.financial') },
                    { id: 'properties', label: t('bm.users.perm.properties') },
                    { id: 'legal', label: t('bm.users.perm.legal') }
                  ].map((dept) => (
                    <div key={dept.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                       <div className="font-medium text-gray-800 mb-2 md:mb-0">{dept.label}</div>
                       <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => handlePermissionChange(dept.id, 'none')}
                            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${createUserForm.departmentPermissions[dept.id as keyof typeof createUserForm.departmentPermissions] === 'none' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'}`}
                          >
                             {t('bm.perm.view')}
                          </button>
                          <button 
                            type="button"
                            onClick={() => handlePermissionChange(dept.id, 'view')}
                            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${createUserForm.departmentPermissions[dept.id as keyof typeof createUserForm.departmentPermissions] === 'view' ? 'bg-slate-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                          >
                             {t('bm.perm.edit')}
                          </button>
                          <button 
                            type="button"
                            onClick={() => handlePermissionChange(dept.id, 'manage')}
                            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${createUserForm.departmentPermissions[dept.id as keyof typeof createUserForm.departmentPermissions] === 'manage' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                          >
                             {t('bm.perm.full')}
                          </button>
                       </div>
                    </div>
                  ))}

                  {/* Employee Management Special Permission */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                     <div className="font-medium text-gray-800">{t('bm.users.perm.employees')}</div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={createUserForm.departmentPermissions.employees} 
                          onChange={(e) => handlePermissionChange('employees', e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-600"></div>
                     </label>
                  </div>
               </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('bm.form.sending')}
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    {t('bm.users.createBtn')}
                  </>
                )}
              </button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="list">
          <div className="space-y-4">
            {isFetchingUsers ? (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-600" />
                <p className="mt-2 text-gray-500">{t('common.loading')}</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-10 text-gray-500">{t('wallet.noData')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 text-gray-700 uppercase">
                    <tr>
                      <th className="px-3 py-2">{t('profile.nameLabel')}</th>
                      <th className="px-3 py-2">{t('bm.form.role')}</th>
                      <th className="px-3 py-2">{t('bm.form.phone')}</th>
                      <th className="px-3 py-2">{t('bm.form.email')}</th>
                      <th className="px-3 py-2">{t('bm.users.status')}</th>
                      <th className="px-3 py-2">{t('bm.users.lastSeen')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} className="bg-white border-b hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.role === 'admin' ? 'bg-red-100 text-red-800' : 
                            u.role === 'broker' ? 'bg-slate-100 text-slate-800' : 'bg-slate-100 text-gray-800'
                          }`}>
                            {t(`profile.role.${u.role}`) || u.role}
                          </span>
                        </td>
                        <td className="px-3 py-2">{u.phone}</td>
                        <td className="px-3 py-2">{u.email || '-'}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${u.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                            <span className="text-[10px]">{u.isOnline ? t('bm.users.online') : t('bm.users.offline')}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[10px] text-gray-500">
                          {u.lastSeen ? new Date(u.lastSeen).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit'
                          }) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );



  // Render Legal Services Content
  const renderLegalContent = () => {
    const disputes    = filterRequests(allServices, "disputes");
    const contracts   = filterRequests(allServices, "contracts");
    const notaries    = filterRequests(allServices, "notary");
    const services    = filterRequests(allServices, "services");
    const pending     = allServices.filter((r) => r.status === 'pending').length;
    const completed   = allServices.filter((r) => r.status === 'completed').length;

    switch (activeLegalTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
              <StatCard label={t('bm.all.title')}       value={allServices.length}   icon={Layers}   color="bg-slate-100 text-slate-700" />
              <StatCard label={t('bm.disputes.title')}   value={disputes.length}      icon={Scale}    color="bg-slate-100 text-slate-700" />
              <StatCard label={t('bm.contracts.title')}  value={contracts.length}     icon={FileText} color="bg-slate-100 text-slate-700"   />
              <StatCard label={t('bm.legal.docTitle')}   value={notaries.length}      icon={FileCheck}  color="bg-slate-100 text-slate-700" />
              <StatCard label={t('pm.legal.stats.other')} value={services.length}      icon={Settings2} color="bg-slate-100 text-slate-700" />
              <StatCard label={t('bm.status.pending')}   value={pending}              icon={Clock3}   color="bg-slate-100 text-slate-700"   />
              <StatCard label={t('bm.status.completed')} value={completed}            icon={CheckCircle} color="bg-emeslaterald-100 text-slate-700" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {t('bm.recent.title')}
              </h2>
              {loading.stats || loading.disputes ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                </div>
              ) : allServices.length === 0 ? (
                <div className="text-center py-12 opacity-40">
                  <Scale className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-400">{t('bm.list.empty')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allServices.slice(0, 5).map((req) => (
                    <div
                      key={req.id}
                      onClick={() => handleViewServiceRequest(req)}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
             <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
  <User className="w-3 h-3 text-slate-500" />
</div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{req.clientName || req.firstParty?.name || t('bm.undefined')}</p>
                          <p className="text-[10px] font-bold text-slate-400">{req.serviceType || req.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${getStatusColor(req.status, req.invoiceStatus)}`}>
                          {getServiceStatusLabel(req)}
                        </span>
                        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case "all":
      case "disputes":
      case "contracts":
      case "services":
      case "other":
        return (
          <RequestsTable
            items={filterRequests(allServices, activeLegalTab)}
            isLoading={loading.disputes}
            language={language}
            onOpen={handleViewServiceRequest}
            t={t}
            getStatusColor={getStatusColor}
            getServiceStatusLabel={getServiceStatusLabel}
          />
        );
      case "service-requests":
        return (() => {
          const { motion: m, AnimatePresence: AP } = require("framer-motion");
          const srFiltered = srRequests.filter(req =>
            req.clientName?.toLowerCase().includes(srSearchTerm.toLowerCase()) ||
            req.serviceType?.toLowerCase().includes(srSearchTerm.toLowerCase()) ||
            req.phone?.includes(srSearchTerm)
          );
          return (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Header + Tab Switcher */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{t('admin.service_requests.title')}</h2>
                  <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    {t('admin.service_requests.subtitle')}
                  </p>
                </div>
                <div className="bg-slate-100 p-1.5 rounded-[2rem] flex items-center gap-1 self-start shadow-inner">
                  <button
                    onClick={() => setSrActiveTab("create")}
                    className={`px-5 py-2 rounded-[1.5rem] flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all ${srActiveTab === "create" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    {t('admin.service_requests.create')}
                  </button>
                  <button
                    onClick={() => setSrActiveTab("view")}
                    className={`px-5 py-2 rounded-[1.5rem] flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all ${srActiveTab === "view" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <List className="w-4 h-4" />
                    {t('admin.service_requests.view_all')}
                  </button>
                </div>
              </div>

              <AP mode="wait">
                {srActiveTab === "create" ? (
                  <m.div key="sr-create" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                    <form onSubmit={srHandleSubmit} className="p-8 space-y-8">
                      {srSubmitStatus === 'success' && (
                        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl flex items-center gap-4 text-emerald-900">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0"><CheckCircle className="w-5 h-5" /></div>
                          <div>
                            <p className="font-black text-sm uppercase tracking-wider">{t('common.success')}</p>
                            <p className="text-emerald-700/80 text-xs font-bold mt-0.5">{t('admin.service_requests.submitting')}</p>
                          </div>
                        </div>
                      )}
                      {srSubmitStatus === 'error' && (
                        <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-center gap-4 text-rose-900">
                          <div className="w-10 h-10 rounded-2xl bg-rose-500 flex items-center justify-center text-white shrink-0"><AlertCircle className="w-5 h-5" /></div>
                          <div>
                            <p className="font-black text-sm uppercase tracking-wider">{t('common.error')}</p>
                            <p className="text-rose-700/80 text-xs font-bold mt-0.5">{srErrorMessage}</p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                        {/* Client Info */}
                        <div className="space-y-4">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                            {t('admin.service_requests.client_info')}
                          </h3>
                          <div className="relative group">
                            <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                            <input required type="text" placeholder={t('admin.service_requests.client_name')} value={srFormData.clientName} onChange={e => srHandleInputChange('clientName', e.target.value)} className="bg-slate-50/50 border border-slate-100 py-4 pr-12 pl-6 text-sm font-bold w-full outline-none hover:border-slate-300 focus:border-slate-900 focus:bg-white transition-all rounded-2xl" />
                          </div>
                          <div className="relative group">
                            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                            <input required type="tel" placeholder={t('admin.service_requests.phone')} value={srFormData.phone} onChange={e => srHandleInputChange('phone', e.target.value)} className="bg-slate-50/50 border border-slate-100 py-4 pr-12 pl-6 text-sm font-bold w-full outline-none hover:border-slate-300 focus:border-slate-900 focus:bg-white transition-all rounded-2xl" dir="ltr" />
                          </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-4">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            {t('admin.service_requests.location_info')}
                          </h3>
                          <div className="relative group">
                            <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                            <input required type="text" placeholder={t('admin.service_requests.city')} value={srFormData.city} onChange={e => srHandleInputChange('city', e.target.value)} className="bg-slate-50/50 border border-slate-100 py-4 pr-12 pl-6 text-sm font-bold w-full outline-none hover:border-slate-300 focus:border-slate-900 focus:bg-white transition-all rounded-2xl" />
                          </div>
                          <div className="relative group">
                            <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 opacity-50" />
                            <input required type="text" placeholder={t('admin.service_requests.district')} value={srFormData.district} onChange={e => srHandleInputChange('district', e.target.value)} className="bg-slate-50/50 border border-slate-100 py-4 pr-12 pl-6 text-sm font-bold w-full outline-none hover:border-slate-300 focus:border-slate-900 focus:bg-white transition-all rounded-2xl" />
                          </div>
                        </div>

                        {/* Service Details */}
                        <div className="space-y-4 md:col-span-2">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                            {t('admin.service_requests.service_details')}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-4">{t('admin.service_requests.category')}</label>
                              <div className="relative">
                                <Layers className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select value={srFormData.serviceCategory} onChange={e => srHandleInputChange('serviceCategory', e.target.value)} className="bg-slate-50 border border-slate-100 py-4 pr-12 pl-6 text-sm font-bold w-full outline-none hover:border-slate-300 focus:border-slate-900 transition-all rounded-2xl appearance-none cursor-pointer">
                                  <option value="postPurchase">{t('admin.service_requests.category.postPurchase')}</option>
                                  <option value="legal">{t('admin.service_requests.category.legal')}</option>
                                  <option value="construction">{t('admin.service_requests.category.construction')}</option>
                                  <option value="other">{t('admin.service_requests.category.other')}</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-4">{t('admin.service_requests.service_type')}</label>
                              <div className="relative">
                                <Layers className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select required value={srFormData.serviceType} onChange={e => srHandleInputChange('serviceType', e.target.value)} className="bg-slate-50 border border-slate-100 py-4 pr-12 pl-6 text-sm font-bold w-full outline-none hover:border-slate-300 focus:border-slate-900 transition-all rounded-2xl appearance-none cursor-pointer">
                                  <option value="" disabled>{t('admin.service_requests.service_type')}</option>
                                  {(srServiceOptions[srFormData.serviceCategory] || []).map((opt, i) => (
                                    <option key={i} value={opt}>{t(`admin.service_requests.type.${opt}`)}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-4">{t('admin.service_requests.quantity')}</label>
                              <div className="relative">
                                <Hash className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input required type="number" min="1" value={srFormData.quantity} onChange={e => srHandleInputChange('quantity', e.target.value)} className="bg-slate-50 border border-slate-100 py-4 pr-12 pl-6 text-sm font-bold w-full outline-none hover:border-slate-300 focus:border-slate-900 transition-all rounded-2xl" />
                              </div>
                            </div>

                            {srFormData.serviceCategory === 'other' && (
                              <div className="space-y-2 md:col-span-3 pb-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-4">{t('admin.service_requests.target_dept')}</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                  {srDepartments.map(dept => {
                                    const sel = srFormData.targetDepartment === dept.id;
                                    return (
                                      <div key={dept.id} onClick={() => srHandleInputChange('targetDepartment', dept.id)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 text-center ${sel ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200'}`}>
                                        <Building2 className={`w-6 h-6 ${sel ? 'text-white' : 'text-slate-200'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-wider leading-tight">{t(dept.key)}</span>
                                        {sel && <div className="w-1.5 h-1.5 rounded-full bg-white mt-1" />}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="space-y-2 md:col-span-3">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-4">{t('admin.service_requests.description')}</label>
                              <div className="relative">
                                <AlignLeft className="absolute right-4 top-5 w-4 h-4 text-slate-400" />
                                <textarea rows={4} placeholder={t('admin.service_requests.description')} value={srFormData.description} onChange={e => srHandleInputChange('description', e.target.value)} className="bg-slate-50 border border-slate-100 py-4 pr-12 pl-6 text-sm font-bold w-full outline-none hover:border-slate-300 focus:border-slate-900 focus:bg-white transition-all rounded-3xl resize-none" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button disabled={srIsSubmitting} type="submit" className="bg-slate-950 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 disabled:opacity-50 shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95">
                          {srIsSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" />{t('admin.service_requests.submitting')}</> : <>{t('admin.service_requests.submit')}<Send className="w-5 h-5" /></>}
                        </button>
                      </div>
                    </form>
                  </m.div>
                ) : (
                  <m.div key="sr-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-1">
                      <div className="relative w-full md:w-96 group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder={t('admin.service_requests.search_placeholder')} value={srSearchTerm} onChange={e => setSrSearchTerm(e.target.value)} className="bg-white border border-slate-100 py-3.5 pr-12 pl-6 text-sm font-bold w-full outline-none hover:border-slate-300 focus:border-slate-900 shadow-sm transition-all rounded-[1.5rem]" />
                      </div>
                      <button onClick={srFetchRequests} className="p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-slate-900 transition-all text-slate-500 hover:text-slate-950 shadow-sm">
                        <Filter className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden min-h-[400px]">
                      {srIsLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                          <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-slate-900 animate-spin" />
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('common.loading')}</p>
                        </div>
                      ) : srFiltered.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.client_name')}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.service_type')}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.target_dept')}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.date')}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('common.details')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {srFiltered.map(req => (
                                <tr key={req.id} className="group hover:bg-slate-50/50 transition-colors">
                                  <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-950 group-hover:text-white transition-all">
                                        <User className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-black text-slate-900">{req.clientName}</p>
                                        <p className="text-[11px] font-bold text-slate-400">{req.phone}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-8 py-5">
                                    <div>
                                      <p className="text-sm font-black text-slate-900">{req.serviceType}</p>
                                      <p className="text-[11px] font-bold text-slate-400">{req.city} - {req.district}</p>
                                    </div>
                                  </td>
                                  <td className="px-8 py-5">
                                    <Badge variant="secondary" className="font-bold">{t(`admin.trans.dept.${req.targetDepartment}`)}</Badge>
                                  </td>
                                  <td className="px-8 py-5">
                                    <div className="flex items-center gap-2 text-slate-400">
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span className="text-[11px] font-bold">
                                        {new Date(req.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-5 text-center">
                                    <button
                                      onClick={() => { setSrSelectedRequest(req); setSrEditingPrice(req.price?.toString() || "0"); setSrEditingDepartment(req.targetDepartment || ""); setSrInvoiceMessage(null); setSrIsDetailsOpen(true); }}
                                      className="p-2 rounded-xl border border-slate-100 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all text-slate-400"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-32 gap-6 opacity-40">
                          <div className="p-8 rounded-[2.5rem] bg-slate-50"><Briefcase className="w-16 h-16 text-slate-200" /></div>
                          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.no_data')}</p>
                        </div>
                      )}
                    </div>
                  </m.div>
                )}
              </AP>

              {/* Details Dialog */}
              <Dialog open={srIsDetailsOpen} onOpenChange={setSrIsDetailsOpen}>
                <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black text-slate-900">{t('admin.service_requests.details_title')}</DialogTitle>
                    <DialogDescription>{srSelectedRequest?.serviceType} - {srSelectedRequest?.clientName}</DialogDescription>
                  </DialogHeader>
                  {srSelectedRequest && (() => {
                    const { Tabs: T, TabsList: TL, TabsTrigger: TT, TabsContent: TC } = require("@/components/ui/tabs");
                    return (
                      <div className="py-4">
                        <T defaultValue="details" className="w-full">
                          <TL className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1 rounded-xl h-auto">
                            <TT value="details" className="py-2 rounded-lg font-bold">{t('common.details')}</TT>
                          
                          </TL>

                          <TC value="details" className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm"><User className="w-6 h-6" /></div>
                              <div>
                                <p className="text-sm font-black text-slate-900">{srSelectedRequest.clientName}</p>
                                <p className="text-xs font-bold text-slate-400">{srSelectedRequest.phone}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.service_type')}</label>
                                <p className="text-sm font-bold text-slate-900">{srSelectedRequest.serviceType}</p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.target_dept')}</label>
                                <p className="text-sm font-bold text-slate-900">{t(`admin.trans.dept.${srSelectedRequest.targetDepartment}`)}</p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.location_info')}</label>
                                <p className="text-sm font-bold text-slate-900">{srSelectedRequest.city} - {srSelectedRequest.district}</p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.quantity')}</label>
                                <p className="text-sm font-bold text-slate-900">{srSelectedRequest.quantity}</p>
                              </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.target_dept')} (Admin)</label>
                              <select value={srEditingDepartment} >
                              </select>
                            </div>

                            {srSelectedRequest.category === 'legal' && (srSelectedRequest.firstParty || srSelectedRequest.secondParty || srSelectedRequest.metadata) && (
                              <div className="space-y-4 pt-4 border-t border-slate-100">
                                {srSelectedRequest.firstParty && (
                                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('disputes.firstParty')}</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                      <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الاسم</p><p className="text-xs font-bold text-slate-900">{srSelectedRequest.firstParty.name}</p></div>
                                      <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الهوية</p><p className="text-xs font-bold text-slate-900">{srSelectedRequest.firstParty.idNumber}</p></div>
                                      {srSelectedRequest.firstParty.phone && <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الجوال</p><p className="text-xs font-bold text-slate-900">{srSelectedRequest.firstParty.phone}</p></div>}
                                    </div>
                                  </div>
                                )}
                                {srSelectedRequest.secondParty && (
                                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('disputes.secondParty')}</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                      <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الاسم</p><p className="text-xs font-bold text-slate-900">{srSelectedRequest.secondParty.name}</p></div>
                                      <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الهوية</p><p className="text-xs font-bold text-slate-900">{srSelectedRequest.secondParty.idNumber}</p></div>
                                    </div>
                                  </div>
                                )}
                                {srSelectedRequest.metadata?.details && (
                                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">تفاصيل إضافية</p>
                                    {srSelectedRequest.description && <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.description')}</p><p className="text-xs font-medium text-slate-600 leading-relaxed">{srSelectedRequest.description}</p></div>}
                                  </div>
                                )}
                              </div>
                            )}

                            {(!srSelectedRequest.firstParty && !srSelectedRequest.secondParty) && srSelectedRequest.description && (
                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.description')}</label>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl">{srSelectedRequest.description}</p>
                              </div>
                            )}

                            {/* Price & Save */}
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.price')}</label>
                              <div className="flex gap-3">
                                <input 
                                  type="number" 
                                  value={srEditingPrice} 
                                  onChange={e => setSrEditingPrice(e.target.value)} 
                                  className="bg-slate-50 border border-slate-100 py-3 px-4 text-sm font-bold w-full outline-none focus:border-slate-900 rounded-xl transition-all disabled:opacity-50" 
                                  placeholder="0.00" 
                                  disabled={srSelectedRequest.invoiceSent}
                                />
                                <div className="flex flex-col gap-2">
                                  <button 
                                    onClick={srHandleSave} 
                                    disabled={srIsUpdatingPrice || srSelectedRequest.invoiceSent} 
                                    className="bg-slate-900 text-white py-3 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 whitespace-nowrap"
                                  >
                                    <Save className="w-4 h-4" />{t('admin.service_requests.save_changes')}
                                  </button>
                                  {(!srSelectedRequest.adminAccepted && ['postPurchase','other'].includes(srSelectedRequest.category)) && (
                                    <button onClick={async () => {
                                      if (!token || !srSelectedRequest) return;
                                      setSrIsAccepting(true);
                                      try {
                                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests/${srSelectedRequest.id}/accept`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
                                        if (res.ok) { srFetchRequests(); setSrIsDetailsOpen(false); }
                                      } catch (e) { console.error(e); } finally { setSrIsAccepting(false); }
                                    }} disabled={srIsAccepting} className="bg-slate-500 text-white py-3 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-600 transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 whitespace-nowrap">
                                      {srIsAccepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                      {t('admin.service_requests.accept_forward')}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Legal Invoice Section */}
                            {srSelectedRequest.category === 'legal' && (
                              <div className="space-y-4 pt-4 border-t-2 border-black-100">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-black text-black-600 uppercase tracking-widest">⚖️ {t('legal.invoice.sendBtn')}</label>
                                  {srSelectedRequest.invoiceSent ? (
                                    <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-3 py-1 rounded-full">✓ {t('legal.invoice.sent')}</span>
                                  ) : (
                                    <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-3 py-1 rounded-full">⏳ {t('legal.invoice.notSent')}</span>
                                  )}
                                </div>
                                {srSelectedRequest.clientDecision && srSelectedRequest.clientDecision !== 'pending' && (
                                  <div className={`p-3 rounded-xl text-[11px] font-black text-center ${srSelectedRequest.clientDecision === 'accepted' ? 'bg-slate-50 text-slate-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                    {srSelectedRequest.clientDecision === 'accepted' ? `✓ ${t('legal.decision.accepted')}` : `✗ ${t('legal.decision.rejected')}`}
                                  </div>
                                )}
                                {(!srSelectedRequest.invoiceSent) && (
                                  <div className="flex gap-3">
                                    <input type="number" value={srInvoicePrice} onChange={e => setSrInvoicePrice(e.target.value)} className="bg-blue-50 border border-blue-200 py-3 px-4 text-sm font-bold w-full outline-none focus:border-blue-500 rounded-xl transition-all" placeholder={t('legal.invoice.price')} min="0" />
                                    <button onClick={srHandleSendInvoice} disabled={srIsSendingInvoice || !srInvoicePrice} className="bg-blue-600 text-white py-3 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 whitespace-nowrap">
                                      {srIsSendingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                      {t('legal.invoice.sendBtn')}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="pt-2 flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{t('admin.service_requests.date')}: {new Date(srSelectedRequest.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </TC>

                          <TC value="visits" className="space-y-4">
                            {srIsLoadingRelated ? (
                              <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
                            ) : srUserBookings.length > 0 ? (
                              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {srUserBookings.map((b: any) => (
                                  <div key={b.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                      <Badge variant="outline" className="bg-white">{b.type}</Badge>
                                      <span className="text-xs text-slate-400 font-medium">{new Date(b.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-1">
                                      <Clock className="w-4 h-4 text-slate-400" />
                                      {b.visitDate ? new Date(b.visitDate).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending Schedule'}
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : b.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{b.status}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2"><Calendar className="w-8 h-8 opacity-50" /><p className="text-xs font-bold">{t('admin.service_requests.no_visits')}</p></div>
                            )}
                          </TC>

                          <TC value="invoices" className="space-y-4">
                            {srIsLoadingRelated ? (
                              <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
                            ) : srUserInvoices.length > 0 ? (
                              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {srUserInvoices.map((inv: any) => (
                                  <div key={inv.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1"><Receipt className="w-4 h-4 text-slate-400" /><span className="font-bold text-slate-900 text-sm">#{inv.invoiceNumber || inv.id.substring(0,8)}</span></div>
                                      <p className="text-xs text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-black text-slate-900">{inv.amount} SAR</p>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{inv.status}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2"><Receipt className="w-8 h-8 opacity-50" /><p className="text-xs font-bold">{t('admin.service_requests.no_invoices')}</p></div>
                            )}
                          </TC>
                        </T>
                      </div>
                    );
                  })()}
                </DialogContent>
              </Dialog>
            </div>
          );
        })();
      default:
        return (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Scale className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">{t('bm.dev.title')}</h3>
            <p className="text-gray-500">{t('bm.dev.desc')}</p>
          </div>
        );
    }
  };

  // Order Handlers
  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const isNumber = type === 'number' || name === 'area' || name === 'price' || ['rooms', 'bathrooms', 'livingRooms', 'kitchens', 'floors', 'apartments', 'buildingArea'].includes(name);

    setOrderFormData((prev: any) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : (isNumber ? parseFloat(value) || 0 : value)
    }));
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await ordersApi.create(orderFormData);
      toast.success(t('bm.toast.orderSuccess'));
      setOrderFormData({
        orderType: "buy",
        propertyType: "",
        city: "",
        neighborhood: "",
        area: 0,
        propertyAge: "",
        deedType: "",
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
        furnitureStatus: "",
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

  const fetchUsers = async () => {
    setIsFetchingUsers(true);
    try {
      const res = await usersApi.findAll();
      setUsers(res.data);
    } catch (error) {
      console.error(error);
      toast.error(t('bm.toast.errorLoad'));
    } finally {
      setIsFetchingUsers(false);
    }
  };

  useEffect(() => {
    if (activeLegalTab === 'users' && activeUserTab === 'list') {
      fetchUsers();
    }
  }, [activeLegalTab, activeUserTab]);

  useEffect(() => {
    if (selectedSection === 'properties' && activePropertyTab === 'portfolio') {
      fetchProperties();
    }
  }, [selectedSection, activePropertyTab]);

  useEffect(() => {
    if (selectedSection === 'properties' && activePropertyTab === 'tenants') {
      fetchTenants();
    }
  }, [selectedSection, activePropertyTab]);

  useEffect(() => {
     if (selectedSection === 'properties' && activePropertyTab === 'financial') {
        fetchFinancials();
     }
  }, [selectedSection, activePropertyTab]);

  useEffect(() => {
     if (selectedSection === 'properties' && activePropertyTab === 'reports') {
        fetchMaintenanceLogs();
     }
  }, [selectedSection, activePropertyTab]);

  const handleCreateMaintenanceLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await propertiesApi.createMaintenanceLog({
            ...newMaintenanceData,
            propertyId: selectedProperty?.id
        });
        toast.success(t('bm.request.success'));
        setShowNewMaintenanceModal(false);
        setNewMaintenanceData({ type: 'routine', description: '', status: 'pending' });
        fetchMaintenanceLogs();
    } catch (error) {
        console.error(error);
        toast.error(t('bm.toast.error'));
    }
  };

  const renderNewMaintenanceModal = () => (
    <Dialog open={showNewMaintenanceModal} onOpenChange={setShowNewMaintenanceModal}>
      <DialogContent className="sm:max-w-[500px]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
              <Plus className="w-6 h-6" />
            </div>
            {t('bm.offer.new')}
          </DialogTitle>
          <DialogDescription>
            {t('pm.maintenance.faultDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateMaintenanceLog} className="space-y-6 py-4">
          <div className="space-y-1">
            <Label className="font-bold text-gray-700">{t('bm.offer.type')}</Label>
            <Select 
              value={newMaintenanceData.type} 
              onValueChange={(v) => setNewMaintenanceData({...newMaintenanceData, type: v as any})}
            >
              <SelectTrigger className="h-12 rounded-xl border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routine">{t('pm.maintenance.routine') || 'Routine'}</SelectItem>
                <SelectItem value="emergency">{t('pm.maintenance.emergency') || 'Emergency'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="font-bold text-gray-700">{t('pm.maintenance.faultDesc')}</Label>
            <Textarea 
              value={newMaintenanceData.description}
              onChange={(e) => setNewMaintenanceData({...newMaintenanceData, description: e.target.value})}
              placeholder={t('bm.list.searchPlaceholder')}
              className="rounded-xl border-gray-200 min-h-[100px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="font-bold text-gray-700">{t('pm.field.amount')}</Label>
              <Input 
                type="number"
                value={newMaintenanceData.cost || ''}
                onChange={(e) => setNewMaintenanceData({...newMaintenanceData, cost: Number(e.target.value)})}
                className="h-12 rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-bold text-gray-700">{t('pm.maintenance.technician')}</Label>
              <Input 
                value={newMaintenanceData.technicianName || ''}
                onChange={(e) => setNewMaintenanceData({...newMaintenanceData, technicianName: e.target.value})}
                className="h-12 rounded-xl border-gray-200"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setShowNewMaintenanceModal(false)} className="rounded-xl h-12 px-6">
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="bg-slate-600 hover:bg-slate-700 rounded-xl h-12 px-6">
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  const renderFinancial = () => (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all group">
                    <div className="flex items-center gap-5 mb-4">
                        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                            <DollarSign className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{t('pm.financial.income')}</p>
                            <p className="text-2xl font-black text-slate-900 tracking-tight">
                                {payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toLocaleString()} 
                                <span className="text-xs ml-1 opacity-50">SAR</span>
                            </p>
                        </div>
                    </div>
                    <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-900 w-2/3 group-hover:w-full transition-all duration-1000"></div>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all group">
                    <div className="flex items-center gap-5 mb-4">
                        <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                            <FileCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{t('pm.tab.leases')}</p>
                            <p className="text-2xl font-black text-slate-900 tracking-tight">
                                {leases.filter(l => !selectedProperty || l.unit?.propertyId === selectedProperty.id).length}
                            </p>
                        </div>
                    </div>
                    <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-200 w-1/2 group-hover:w-full transition-all duration-1000"></div>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all group">
                    <div className="flex items-center gap-5 mb-4">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 shadow-sm">
                            <Clock className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{t('pm.status.pending')}</p>
                            <p className="text-2xl font-black text-slate-900 tracking-tight">
                                {payments.filter(p => p.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                    <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-400 w-1/4 group-hover:w-full transition-all duration-1000"></div>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all group">
                    <div className="flex items-center gap-5 mb-4">
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
                            <AlertCircle className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-1">{t('pm.status.overdue')}</p>
                            <p className="text-2xl font-black text-red-900 tracking-tight">
                                {payments.filter(p => p.status === 'overdue').length}
                            </p>
                        </div>
                    </div>
                    <div className="h-1 w-full bg-red-50 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 w-1/3 group-hover:w-full transition-all duration-1000"></div>
                    </div>
                </div>
          </div>

          {/* Sub-tabs */}
          <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1 border border-slate-100/50 w-fit">
              {[
                { id: 'payments', label: t('pm.cashflow.schedule') },
                { id: 'utilities', label: t('pm.tab.utilities') },
                { id: 'deposits', label: t('pm.field.securityDeposit') }
              ].map((subTab) => (
                <button 
                  key={subTab.id}
                  onClick={() => setActiveFinancialSubTab(subTab.id as any)}
                  className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                    activeFinancialSubTab === subTab.id 
                    ? "bg-white text-slate-900 shadow-lg shadow-slate-200/50" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-50 overflow-hidden shadow-2xl shadow-slate-200/30">
             {loadingFinancial ? (
                 <div className="p-32 text-center flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-slate-900/20" />
                        </div>
                    </div>
                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">{t('common.loading')}</p>
                 </div>
             ) : activeFinancialSubTab === 'payments' ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-start">
                        <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                            <tr>
                                <th className="p-6 text-start">{t('pm.field.dueDate')}</th>
                                <th className="p-6 text-start">{t('pm.field.amount')}</th>
                                <th className="p-6 text-start">{t('pm.field.paymentStatus')}</th>
                                <th className="p-6 text-start">{t('pm.field.paymentMethod')}</th>
                                <th className="p-6 text-center">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {payments.filter(p => !selectedProperty || p.lease?.unit?.propertyId === selectedProperty.id).length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <Receipt className="w-12 h-12" />
                                            <p className="font-black uppercase tracking-widest text-xs">{t('bm.list.empty')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                payments
                                .filter(p => !selectedProperty || p.lease?.unit?.propertyId === selectedProperty.id)
                                .map(payment => (
                                    <tr key={payment.id} className="hover:bg-slate-50/30 transition-all group">
                                        <td className="p-6 font-black text-slate-900 text-sm">{new Date(payment.dueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</td>
                                        <td className="p-6 font-black text-slate-900 text-base">{payment.amount.toLocaleString()} <span className="text-[10px] opacity-40">SAR</span></td>
                                        <td className="p-6">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                payment.status === 'paid' ? 'bg-white text-green-600 border-green-100 shadow-sm shadow-green-50' : 
                                                payment.status === 'overdue' ? 'bg-red-900 text-white border-red-900 shadow-lg shadow-red-200' : 
                                                'bg-white text-slate-400 border-slate-100 shadow-sm shadow-slate-50'
                                            }`}>
                                                {t(`pm.status.${payment.status || 'pending'}`)}
                                            </span>
                                        </td>
                                        <td className="p-6 text-slate-500 font-bold text-xs uppercase tracking-wider">{t(`pm.cashflow.method.${payment.method || 'bank'}`)}</td>
                                        <td className="p-6">
                                            <div className="flex justify-center transition-all duration-300">
                                                <button 
                                                    onClick={() => { setSelectedTenant(payment.lease?.tenant || null); setShowTenantDetails(true); }}
                                                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                                                >
                                                    <FileText className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
             ) : (
                 <div className="p-32 text-center flex flex-col items-center gap-6 animate-in zoom-in duration-500">
                     <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center shadow-inner">
                        <Landmark className="w-10 h-10 text-slate-200" />
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{activeFinancialSubTab === 'utilities' ? t('pm.tab.utilities') : t('pm.field.securityDeposit')}</h3>
                        <p className="text-slate-400 font-medium text-sm max-w-xs mx-auto leading-relaxed">{t('bm.dev.desc')}</p>
                     </div>
                 </div>)}
          </div>
      </div>
    );

  const renderOrdersSection = () => {
    const orderPropertyTypes = [
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

    const showOrderDetailedFields = ["فيلا", "قصر", "شقة"].includes(orderFormData.propertyType);
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-slate-100 rounded-lg">
                    <FileText className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">{t('pm.orders')}</h1>
                </div>
            </div>

            <Tabs value={activeOrderTab} onValueChange={(v) => setActiveOrderTab(v as "new" | "list")} dir={language === 'ar' ? 'rtl' : 'ltr'} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="new">{t('bm.quick.new')}</TabsTrigger>
                    <TabsTrigger value="list">{t('chat.all')}</TabsTrigger>
                </TabsList>

                <TabsContent value="new" className="mt-6">
                    <form onSubmit={handleOrderSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <Label>{t('orders.type')}</Label>
                            <RadioGroup value={orderFormData.orderType} onValueChange={(v) => setOrderFormData((p: any) => ({...p, orderType: v}))} className="flex gap-4">
                                <div className="flex items-center gap-2"><RadioGroupItem value="buy" id="buy" /><Label htmlFor="buy">{t('orders.buy')}</Label></div>
                                <div className="flex items-center gap-2"><RadioGroupItem value="rent" id="rent" /><Label htmlFor="rent">{t('orders.rent')}</Label></div>
                            </RadioGroup>
                        </div>
                        
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <Label>{t('orders.propType')}</Label>
                                 <Select value={orderFormData.propertyType} onValueChange={(v) => setOrderFormData((p: any) => ({...p, propertyType: v}))}>
                                    <SelectTrigger><SelectValue placeholder={t('orders.propTypePlaceholder')} /></SelectTrigger>
                                    <SelectContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
                                        {orderPropertyTypes.map(pType => <SelectItem key={pType.value} value={pType.value}>{t(pType.label)}</SelectItem>)}
                                    </SelectContent>
                                 </Select>
                              </div>
                              <div className="space-y-2">
                                 <Label>{t('orders.city')}</Label>
                                 <Input name="city" value={orderFormData.city} onChange={handleOrderChange} required />
                              </div>
                              <div className="space-y-2">
                                 <Label>{t('orders.neighborhood')}</Label>
                                 <Input name="neighborhood" value={orderFormData.neighborhood} onChange={handleOrderChange} required />
                              </div>
                              <div className="space-y-2">
                                 <Label>{t('orders.area')}</Label>
                                 <Input type="number" name="area" value={orderFormData.area || ''} onChange={handleOrderChange} required />
                              </div>
                              <div className="space-y-2">
                                 <Label>{t('orders.age')}</Label>
                                 <Input name="propertyAge" value={orderFormData.propertyAge} onChange={handleOrderChange} required />
                              </div>
                              <div className="space-y-2">
                                 <Label>{t('orders.deed')}</Label>
                                 <Select value={orderFormData.deedType} onValueChange={(v) => setOrderFormData((p: any) => ({...p, deedType: v}))}>
                                     <SelectTrigger><SelectValue placeholder={t('wallet.commission.select')} /></SelectTrigger>
                                     <SelectContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
                                         <SelectItem value="electronic">{t('orders.deed.electronic')}</SelectItem>
                                         <SelectItem value="paper">{t('orders.deed.paper')}</SelectItem>
                                     </SelectContent>
                                 </Select>
                              </div>
                              <div className="space-y-2">
                                 <Label>{t('orders.price')}</Label>
                                 <Input type="number" name="price" value={orderFormData.price || ''} onChange={handleOrderChange} required />
                              </div>
                         </div>

                       
                            <>
                                <hr className="my-6" />
                         <h3 className="text-base font-semibold mb-4">{t('bm.offer.detailed')}</h3>
                         
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <Label>{t('orders.rooms')}</Label>
                                <Input type="number" name="rooms" value={orderFormData.rooms || ''} onChange={handleOrderChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('orders.baths')}</Label>
                                <Input type="number" name="bathrooms" value={orderFormData.bathrooms || ''} onChange={handleOrderChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('orders.living')}</Label>
                                <Input type="number" name="livingRooms" value={orderFormData.livingRooms || ''} onChange={handleOrderChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('orders.kitchens')}</Label>
                                <Input type="number" name="kitchens" value={orderFormData.kitchens || ''} onChange={handleOrderChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('orders.floors')}</Label>
                                <Input type="number" name="floors" value={orderFormData.floors || ''} onChange={handleOrderChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('orders.apartments')}</Label>
                                <Input type="number" name="apartments" value={orderFormData.apartments || ''} onChange={handleOrderChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('orders.buildArea')}</Label>
                                <Input type="number" name="buildingArea" value={orderFormData.buildingArea || ''} onChange={handleOrderChange} />
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 p-3 rounded border">
                                <Checkbox id="order_hasMaidRoom" checked={!!orderFormData.hasMaidRoom} onCheckedChange={(c) => setOrderFormData((p: any) => ({...p, hasMaidRoom: !!c}))} />
                                <label htmlFor="order_hasMaidRoom" className="text-xs font-medium">{t('orders.maid')}</label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 p-3 rounded border">
                                <Checkbox id="order_hasRoof" checked={!!orderFormData.hasRoof} onCheckedChange={(c) => setOrderFormData((p: any) => ({...p, hasRoof: !!c}))} />
                                <label htmlFor="order_hasRoof" className="text-xs font-medium">{t('orders.roof')}</label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 p-3 rounded border">
                                <Checkbox id="order_hasExternalAnnex" checked={!!orderFormData.hasExternalAnnex} onCheckedChange={(c) => setOrderFormData((p: any) => ({...p, hasExternalAnnex: !!c}))} />
                                <label htmlFor="order_hasExternalAnnex" className="text-xs font-medium">{t('orders.annex')}</label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 p-3 rounded border">
                                <Checkbox id="order_hasGarage" checked={!!orderFormData.hasGarage} onCheckedChange={(c) => setOrderFormData((p: any) => ({...p, hasGarage: !!c}))} />
                                <label htmlFor="order_hasGarage" className="text-xs font-medium">{t('orders.garage')}</label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 p-3 rounded border">
                                <Checkbox id="order_hasPool" checked={!!orderFormData.hasPool} onCheckedChange={(c) => setOrderFormData((p: any) => ({...p, hasPool: !!c}))} />
                                <label htmlFor="order_hasPool" className="text-xs font-medium">{t('orders.pool')}</label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 p-3 rounded border">
                                <Checkbox id="order_hasElevator" checked={!!orderFormData.hasElevator} onCheckedChange={(c) => setOrderFormData((p: any) => ({...p, hasElevator: !!c}))} />
                                <label htmlFor="order_hasElevator" className="text-xs font-medium">{t('orders.elevator')}</label>
                            </div>
                         </div>

                         <div className="space-y-2 mt-6">
                            <Label>{t('orders.furniture')}</Label>
                            <Select value={orderFormData.furnitureStatus} onValueChange={(v) => setOrderFormData((p: any) => ({...p, furnitureStatus: v}))}>
                                <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                                <SelectContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
                                    <SelectItem value="furnished">{t('orders.furnished')}</SelectItem>
                                    <SelectItem value="unfurnished">{t('orders.unfurnished')}</SelectItem>
                                </SelectContent>
                            </Select>
                         </div>
                            </>
                         

                        <div className="space-y-2">
                            <Label>{t('orders.details')}</Label>
                            <Textarea name="additionalDetails" value={orderFormData.additionalDetails} onChange={handleOrderChange} placeholder={t('orders.additionalDetailsPlaceholder')} />
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-600 hover:bg-slate-700">
                            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : t('orders.submit')}
                        </Button>
                    </form>
                </TabsContent>

                <TabsContent value="list" className="mt-6">
                    <div className="space-y-4">
                       <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm gap-4">
                           <h3 className="font-bold text-base">{t('bm.requests.all')}</h3>
                           <Tabs value={activeOrdersFilterTab} onValueChange={(v) => setActiveOrdersFilterTab(v as "all" | "my")} className="w-[300px]">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="all">{t('offers.allOfferss')}</TabsTrigger>
                                    <TabsTrigger value="my">{t('offers.myOfferss')}</TabsTrigger>
                                </TabsList>
                           </Tabs>
                       </div>

                        {loadingAllOrders ? (
                            <div className="text-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-slate-600 mx-auto" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredOrders.map(order => (
                                    <div 
                                        key={order.id} 
                                        className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer group"
                                        onClick={() => {
                                            console.log('Order clicked:', order);
                                            console.log('Current user:', user);
                                            setSelectedOrder(order);
                                            setIsOrderModalOpen(true);
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors">
                                                    <Building className="w-6 h-6 text-slate-600" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-gray-900 group-hover:text-slate-700 transition-colors">
                                                            {order.propertyType}
                                                        </h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            order.orderType === 'sale' 
                                                                ? 'bg-slate-100 text-slate-700' 
                                                                : 'bg-slate-50 text-slate-500 border border-slate-100'
                                                        }`}>
                                                            {order.orderType === 'sale' ? t('bm.offer.dealSale') : t('bm.offer.dealRent')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        <span>{order.city} • {order.neighborhood}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="text-end space-y-1">
                                                <div className="text-sm font-black text-slate-800">
                                                    {order.price?.toLocaleString()} {t('chat.currency')}
                                                </div>
                                                <div className="flex items-center justify-end gap-1.5 text-xs text-gray-400">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span suppressHydrationWarning>
                                                        {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Ruler className="w-4 h-4 text-slate-400" />
                                                    <span>{order.area} {t('bm.prop.area')}</span>
                                                </div>
                                                {order.rooms && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Home className="w-4 h-4 text-slate-400" />
                                                        <span>{order.rooms} {t('orders.rooms')}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex gap-2">
                                              {order && user && (
                        <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                                                        onClick={(e) => handleOrderChat(e, order)}
                                                        disabled={chatLoadingId === order.id}
                                                    >
                                                        {chatLoadingId === order.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin text-slate-800" />
                                                        ) : (
                                                            <MessageSquare className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                )}
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-8 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 rounded-lg group-hover:text-slate-950 transition-all"
                                                >
                                                    {t('bm.details')}
                                                    <ArrowRight className={`ms-2 w-3.5 h-3.5 transition-transform group-hover:translate-x-1 ${language === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    );
  };

  const renderOffersSection = () => {
    // Offer Form
    return (
      <div className="p-6">
        <Tabs value={activeOfferTab} onValueChange={(v) => setActiveOfferTab(v as "new" | "list")} dir={language === 'ar' ? 'rtl' : 'ltr'} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="new">{t('bm.quick.new.offer')}</TabsTrigger>
                <TabsTrigger value="list">{t('chat.all.offer')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="new">
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-50/50 border border-gray-100 p-8 mb-8 pb-32">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 bg-slate-600 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                    <ShoppingBag className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('bm.offer.new')}</h1>
                    <p className="text-gray-500 font-medium">{t('bm.offer.newSub')}</p>
                  </div>
                </div>

        {/* Tabs for Sale / Rent */}
        <div className="mb-10">
            <Tabs defaultValue="sale" dir={language === 'ar' ? 'rtl' : 'ltr'} className="w-full" onValueChange={(val) => setDealType(val as "sale" | "rent")}>
            <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-50 p-1.5 rounded-2xl">
                <TabsTrigger value="sale" className="text-base font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-600 data-[state=active]:shadow-sm transition-all">
                    {t('bm.offer.dealSale')}
                </TabsTrigger>
                <TabsTrigger value="rent" className="text-base font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-600 data-[state=active]:shadow-sm transition-all">
                    {t('bm.offer.dealRent')}
                </TabsTrigger>
            </TabsList>
            </Tabs>
        </div>

        {/* Main Category Selection */}
        <div className="mb-10">
            <Label className="block text-sm font-bold text-gray-700 mb-4">{t('bm.offer.category')}</Label>
            <RadioGroup defaultValue="residential" className="grid grid-cols-1 md:grid-cols-2 gap-4" onValueChange={(val) => handleCategoryChange(val as "residential" | "commercial")}>
                <div 
                    onClick={() => handleCategoryChange('residential')}
                    className={`flex items-center gap-3 border p-3 rounded-xl cursor-pointer transition-all ${mainCategory === 'residential' ? 'border-slate-500 bg-slate-50/50' : 'border-gray-100 hover:border-slate-200 hover:bg-slate-50'}`}
                >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mainCategory === 'residential' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-gray-500'}`}>
                        <Home className="w-5 h-5" />
                    </div>
                    <div>
                        <RadioGroupItem value="residential" id="res" className="sr-only" />
                        <Label htmlFor="res" className="text-sm font-bold cursor-pointer block">{t('bm.offer.residential')}</Label>
                        <p className="text-[10px] text-gray-400">{t('bm.offer.basicDesc')}</p>
                    </div>
                </div>
                <div 
                    onClick={() => handleCategoryChange('commercial')}
                    className={`flex items-center gap-3 border p-3 rounded-xl cursor-pointer transition-all ${mainCategory === 'commercial' ? 'border-slate-500 bg-slate-50/50' : 'border-gray-100 hover:border-slate-200 hover:bg-slate-50'}`}
                >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mainCategory === 'commercial' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-gray-500'}`}>
                        <Building className="w-5 h-5" />
                    </div>
                    <div>
                        <RadioGroupItem value="commercial" id="comm" className="sr-only" />
                        <Label htmlFor="comm" className="text-sm font-bold cursor-pointer block">{t('bm.offer.commercial')}</Label>
                        <p className="text-[10px] text-gray-400">{t('bm.offer.basicDesc')}</p>
                    </div>
                </div>
            </RadioGroup>
        </div>

        <form onSubmit={handleOfferSubmit} className="space-y-10">
          
          {/* Media Upload */}
          <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <ImageIcon className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{t('bm.offer.media')}</h3>
                    <p className="text-xs text-gray-500">{t('bm.offer.mediaDesc')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Image Upload */}
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-slate-800 hover:bg-white transition-all bg-white/50"
                 >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleOfferImageUpload} 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                    />
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-slate-700" />
                    </div>
                    <p className="text-gray-900 font-bold text-base mb-1">{t('bm.offer.media.images')}</p>
                    <p className="text-xs text-gray-400">{t('bm.offer.media.hint')}</p>
                    {offerImages.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            {offerImages.map((img, i) => (
                                <div key={i} className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-gray-200 relative group/img">
                                    <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setOfferImages(prev => prev.filter((_, idx) => idx !== i)); }}>
                                        <X className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>

                 {/* 3D Video Upload */}
                 <div 
                    onClick={() => video3dInputRef.current?.click()}
                    className="group border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-slate-800 hover:bg-white transition-all bg-white/50"
                 >
                    <input 
                        type="file" 
                        ref={video3dInputRef} 
                        onChange={handleOfferVideoUpload} 
                        accept="video/*" 
                        className="hidden" 
                    />
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Video className="w-8 h-8 text-slate-700" />
                    </div>
                    <p className="text-gray-900 font-bold text-base mb-1">{t('bm.offer.media.video')}</p>
                    <p className="text-xs text-gray-400">{offerVideo3d ? offerVideo3d.name : t('bm.offer.mediaDesc')}</p>
                    {offerVideo3d && (
                        <div className="mt-4 flex justify-center">
                            <div className="px-3 py-1 bg-slate-100 text-gray-700 rounded-full text-xs font-bold flex items-center gap-2">
                                <Video className="w-3 h-3" />
                                {t('common.success')}
                                <X className="w-3 h-3 cursor-pointer hover:text-gray-900" onClick={(e) => { e.stopPropagation(); setOfferVideo3d(null); }} />
                            </div>
                        </div>
                    )}
                 </div>
            </div>
          </div>

          {/* Basic Info */}
          <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
              <CardTitle className="flex items-center gap-3 text-gray-900">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Building className="w-5 h-5 text-slate-700" />
                </div>
                {t('bm.offer.basicInfo')}
              </CardTitle>
              <CardDescription>{t('bm.offer.basicSub')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
              <div className="space-y-3">
                <Label className="text-gray-700 font-bold">{t('bm.offer.propertyType')} <span className="text-red-500">*</span></Label>
                <Select onValueChange={(val) => handleOfferSelectChange('propertyType', val)} value={formData.propertyType}>
                  <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-slate-500 text-start">
                    <SelectValue placeholder={t('bm.offer.propertyTypePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent dir={language === 'ar' ? 'rtl' : 'ltr'} className="rounded-xl shadow-xl">
                    {propertyTypeOptions[mainCategory].map(opt => (
                        <SelectItem key={opt.key} value={opt.key} className="py-3 rounded-lg  cursor-pointer">{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-3">
                  <Label className="text-gray-700 font-bold">{t('bm.offer.dimensions')}</Label>
                  <div className="flex gap-3 items-center">
                      <Input type="number" name="length" placeholder={t('bm.offer.length')} value={formData.length} onChange={handleOfferChange} className="h-12 rounded-xl border-gray-200 bg-white text-start" />
                      <span className="text-gray-300 font-bold">×</span>
                      <Input type="number" name="width" placeholder={t('bm.offer.width')} value={formData.width} onChange={handleOfferChange} className="h-12 rounded-xl border-gray-200 bg-white text-start" />
                  </div>
              </div>

               <div className="space-y-3">
                <Label className="text-gray-700 font-bold">{t('bm.offer.area')} <span className="text-red-500">*</span> (م²)</Label>
                <Input type="number" name="area" value={formData.area} onChange={handleOfferChange} placeholder="0" className="h-12 rounded-xl border-gray-200 bg-white text-start" required />
              </div>

              <div className="space-y-3">
                <Label className="text-gray-700 font-bold">{t('offer.age')} <span className="text-red-500">*</span></Label>
                <Select onValueChange={(val) => handleOfferSelectChange('propertyAge', val)} value={formData.propertyAge}>
                  <SelectTrigger className="h-12 rounded-xl border-gray-200 text-start">
                    <SelectValue placeholder={t('wallet.commission.select')} />
                  </SelectTrigger>
                  <SelectContent dir={language === 'ar' ? 'rtl' : 'ltr'} className="rounded-xl shadow-xl">
                    <SelectItem value="new" className="py-3 cursor-pointer">{t('property.age.new')}</SelectItem>
                    <SelectItem value="less1" className="py-3 cursor-pointer">{t('property.age.less1')}</SelectItem>
                    <SelectItem value="1to5" className="py-3 cursor-pointer">{t('property.age.1to5')}</SelectItem>
                    <SelectItem value="more10" className="py-3 cursor-pointer">{t('property.age.more10')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            
              <div className="space-y-3">
                <Label className="text-gray-700 font-bold">{t('offer.direction')} <span className="text-red-500">*</span></Label>
                <Select onValueChange={(val) => handleOfferSelectChange('direction', val)} value={formData.direction}>
                  <SelectTrigger className="h-12 rounded-xl border-gray-200 text-start">
                    <SelectValue placeholder={t('wallet.commission.select')} />
                  </SelectTrigger>
                  <SelectContent dir={language === 'ar' ? 'rtl' : 'ltr'} className="rounded-xl shadow-xl">
                    <SelectItem value="north" className="py-3 cursor-pointer">{t('property.direction.north')}</SelectItem>
                    <SelectItem value="south" className="py-3 cursor-pointer">{t('property.direction.south')}</SelectItem>
                    <SelectItem value="east" className="py-3 cursor-pointer">{t('property.direction.east')}</SelectItem>
                    <SelectItem value="west" className="py-3 cursor-pointer">{t('property.direction.west')}</SelectItem>
                    <SelectItem value="ne" className="py-3 cursor-pointer">{t('property.direction.north')} {t('property.direction.east')}</SelectItem>
                    <SelectItem value="nw" className="py-3 cursor-pointer">{t('property.direction.north')} {t('property.direction.west')}</SelectItem>
                    <SelectItem value="se" className="py-3 cursor-pointer">{t('property.direction.south')} {t('property.direction.east')}</SelectItem>
                    <SelectItem value="sw" className="py-3 cursor-pointer">{t('property.direction.south')} {t('property.direction.west')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-3">
                <Label className="text-gray-700 font-bold">{t('bm.offer.priceSAR')} <span className="text-red-500">*</span></Label>
                <Input type="number" name="price" value={formData.price} onChange={handleOfferChange} placeholder="0" className="h-12 rounded-xl border-gray-200 bg-white text-start" required />
              </div>

                <div className="space-y-3">
                 <Label className="text-gray-700 font-bold">{t('pm.field.address')}</Label>
                 <div className="relative">
                    <Textarea 
                      name="address"
                      value={formData.address || ''} 
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder={t('pm.field.address')}
                      className="min-h-[80px] rounded-xl border-gray-200 bg-white ps-10 pt-3 text-start text-xs"
                    />
                    <MapPin className="absolute top-3.5 w-4 h-4 text-gray-400 start-3" />
                 </div>
               </div>

               <div className="space-y-3">
                <Label className="text-gray-700 font-bold">{t('bm.offer.locationUrl')}</Label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input 
                            dir="ltr"
                            value={formData.locationUrl || ''} 
                            onChange={(e) => setFormData(prev => ({ ...prev, locationUrl: e.target.value }))}
                            placeholder="https://maps.google.com/?q=..." 
                            className="h-12 rounded-xl border-gray-200 bg-white ps-10"
                        />
                        <LinkIcon className="absolute top-3.5 w-5 h-5 text-gray-400 start-3" />
                    </div>
                    <Button type="button" onClick={() => setShowOfferMap(true)} className="h-12 w-12 rounded-xl bg-slate-600 hover:bg-slate-700 text-white p-0 flex items-center justify-center shadow-lg shadow-slate-200">
                        <MapIcon className="w-6 h-6" />
                    </Button>
                </div>
              </div>

               <div className="space-y-3">
                <Label className="text-gray-700 font-bold">{t('bm.offer.city')} <span className="text-red-500">*</span></Label>
                <Input type="text" name="city" value={formData.city} onChange={handleOfferChange} placeholder={t('city.riyadh')} className="h-12 rounded-xl border-gray-200 text-start" required />
              </div>

               <div className="space-y-3">
                <Label className="text-gray-700 font-bold">{t('bm.offer.neighborhood')} <span className="text-red-500">*</span></Label>
                <Input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleOfferChange} placeholder={t('offers.filter.neighborhood')} className="h-12 rounded-xl border-gray-200 text-start" required />
              </div>

              <div className="space-y-3">
                 <Label className="text-gray-700 font-bold">{t('bm.offer.streetWidth')} <span className="text-red-500">*</span></Label>
                 <Input type="number" name="streetWidth" value={formData.streetWidth} onChange={handleOfferChange} placeholder="0" className="h-12 rounded-xl border-gray-200 bg-white text-start" required />
              </div>

               <div className="space-y-3">
                <Label className="text-gray-700 font-bold">{t('bm.offer.deedType')} <span className="text-red-500">*</span></Label>
                 <Select onValueChange={(val) => handleOfferSelectChange('deedType', val)} value={formData.deedType}>
                  <SelectTrigger className="h-12 rounded-xl border-gray-200 text-start">
                    <SelectValue placeholder={t('common.select')} />
                  </SelectTrigger>
                   <SelectContent dir={language === 'ar' ? 'rtl' : 'ltr'} className="rounded-xl shadow-xl">
                    <SelectItem value="electronic" className="py-3 cursor-pointer">{t('orders.deed.electronic')}</SelectItem>
                    <SelectItem value="paper" className="py-3 cursor-pointer">{t('orders.deed.paper')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-3">
                <Label className="text-gray-700 font-bold">{t('bm.offer.condition')}</Label>
                <Select onValueChange={(val) => handleOfferSelectChange('propertyCondition', val)} value={formData.propertyCondition}>
                  <SelectTrigger className="h-12 rounded-xl border-gray-200 text-start">
                    <SelectValue placeholder={t('common.select')} />
                  </SelectTrigger>
                   <SelectContent dir={language === 'ar' ? 'rtl' : 'ltr'} className="rounded-xl shadow-xl">
                    <SelectItem value="new" className="py-3 cursor-pointer">{t('property.condition.new')}</SelectItem>
                    <SelectItem value="used" className="py-3 cursor-pointer">{t('property.condition.used')}</SelectItem>
                    <SelectItem value="under_construction" className="py-3 cursor-pointer">{t('property.condition.underConstruction')}</SelectItem>
                    <SelectItem value="renovated" className="py-3 cursor-pointer">{t('property.condition.renovated')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>


           {/* Detailed Data (Conditional) */}
           {showDetailedFields && (
            <Card className="rounded-3xl border-slate-100 bg-slate-50/20 overflow-hidden">
                <CardHeader className="bg-slate-100/30 border-b border-slate-100/50 pb-6">
                <CardTitle className="flex items-center gap-3 text-slate-900">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Building className="w-5 h-5 text-slate-600" />
                    </div>
                    {t('bm.offer.detailed')}
                </CardTitle>
                <CardDescription>{t('bm.offer.detailedDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8">
                    <div className="space-y-3">
                        <Label className="text-gray-700 font-bold">{t('offers.filter.rooms')}</Label>
                        <Input type="number" name="rooms" value={formData.rooms} onChange={handleOfferChange} className="h-12 rounded-xl border-gray-200 bg-white text-start" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-gray-700 font-bold">{t('offers.filter.baths')}</Label>
                        <Input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleOfferChange} className="h-12 rounded-xl border-gray-200 bg-white text-start" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-gray-700 font-bold">{t('offer.living')}</Label>
                        <Input type="number" name="livingRooms" value={formData.livingRooms} onChange={handleOfferChange} className="h-12 rounded-xl border-gray-200 bg-white text-start" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-gray-700 font-bold">{t('offer.kitchens')}</Label>
                        <Input type="number" name="kitchens" value={formData.kitchens} onChange={handleOfferChange} className="h-12 rounded-xl border-gray-200 bg-white text-start" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-gray-700 font-bold">{t('offer.floors')}</Label>
                        <Input type="number" name="floors" value={formData.floors} onChange={handleOfferChange} className="h-12 rounded-xl border-gray-200 bg-white text-start" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-gray-700 font-bold">{t('offer.apartments')}</Label>
                        <Input type="number" name="apartments" value={formData.apartments} onChange={handleOfferChange} className="h-12 rounded-xl border-gray-200 bg-white text-start" />
                    </div>
                     <div className="space-y-3">
                        <Label className="text-gray-700 font-bold">{t('property.area.build')}</Label>
                        <Input type="number" name="buildingArea" value={formData.buildingArea} onChange={handleOfferChange} className="h-12 rounded-xl border-gray-200 bg-white text-start" />
                    </div>

                    <div className="col-span-2 md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
                            <Checkbox id="hasMaidRoom" checked={!!formData.hasMaidRoom} onCheckedChange={(c) => handleOfferCheckboxChange('hasMaidRoom', c as boolean)} />
                            <Label htmlFor="hasMaidRoom" className="text-xs font-bold text-gray-700 cursor-pointer">{t('property.feature.maid')}</Label>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
                            <Checkbox id="hasRoof" checked={!!formData.hasRoof} onCheckedChange={(c) => handleOfferCheckboxChange('hasRoof', c as boolean)} />
                            <Label htmlFor="hasRoof" className="text-xs font-bold text-gray-700 cursor-pointer">{t('property.feature.roof')}</Label>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
                            <Checkbox id="hasExternalAnnex" checked={!!formData.hasExternalAnnex} onCheckedChange={(c) => handleOfferCheckboxChange('hasExternalAnnex', c as boolean)} />
                            <Label htmlFor="hasExternalAnnex" className="text-xs font-bold text-gray-700 cursor-pointer">{t('property.feature.annex')}</Label>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
                            <Checkbox id="hasGarage" checked={!!formData.hasGarage} onCheckedChange={(c) => handleOfferCheckboxChange('hasGarage', c as boolean)} />
                            <Label htmlFor="hasGarage" className="text-xs font-bold text-gray-700 cursor-pointer">{t('property.feature.garage')}</Label>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
                            <Checkbox id="hasPool" checked={!!formData.hasPool} onCheckedChange={(c) => handleOfferCheckboxChange('hasPool', c as boolean)} />
                            <Label htmlFor="hasPool" className="text-xs font-bold text-gray-700 cursor-pointer">{t('property.feature.pool')}</Label>
                        </div>
                         <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
                            <Checkbox id="hasElevator" checked={!!formData.hasElevator} onCheckedChange={(c) => handleOfferCheckboxChange('hasElevator', c as boolean)} />
                            <Label htmlFor="hasElevator" className="text-xs font-bold text-gray-700 cursor-pointer">{t('property.feature.elevator')}</Label>
                        </div>
                    </div>

                     <div className="space-y-3 col-span-2">
                        <Label className="text-gray-700 font-bold">{t('offers.filter.furniture')}</Label>
                        <Select onValueChange={(val) => handleOfferSelectChange('furnitureStatus', val)} value={formData.furnitureStatus}>
                            <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white text-start">
                                <SelectValue placeholder={t('common.select')} />
                            </SelectTrigger>
                            <SelectContent dir={language === 'ar' ? 'rtl' : 'ltr'} className="rounded-xl shadow-xl">
                                <SelectItem value="furnished" className="py-3 cursor-pointer">{t('orders.furnished')}</SelectItem>
                                <SelectItem value="unfurnished" className="py-3 cursor-pointer">{t('orders.unfurnished')}</SelectItem>
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
                    {t('bm.offer.attachments')}
                </CardTitle>
                <CardDescription>{t('bm.offer.attachmentsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Property Papers */}
                    <div className="border p-4 rounded-xl bg-slate-50">
                        <Label className="block mb-3 font-semibold">{t('bm.offer.paperReq')}</Label>
                        <Input type="file" className="bg-white mb-2" />
                        <Textarea placeholder={t('marketing.photo.notes')} className="bg-white h-20 text-xs text-start" />
                    </div>

                    {/* Deposit Check */}
                  
                </div>


            </CardContent>
           </Card>

            {/* Description */}
           <Card>
            <CardHeader>
              <CardTitle>{t('bm.offer.specs')}</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="space-y-2">
                    <Label>{t('bm.offer.notes')}</Label>
                    <Textarea 
                        name="additionalNotes" 
                        value={additionalNotes} 
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        className="min-h-[150px] text-start"
                        placeholder={t('bm.offer.notesPlaceholder')} 
                    />
                </div>
            </CardContent>
           </Card>

           <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-800 hover:bg-slate-900 h-12 text-base shadow-xl shadow-slate-900/10">
                {isSubmitting && <Loader2 className="animate-spin ms-2 w-5 h-5" />}
                {t('bm.offer.addBtn')}
           </Button>

        </form>
      </div>
    </TabsContent>

    <TabsContent value="list">
       <div className="space-y-4">
           <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm gap-4">
               <h3 className="font-bold text-base">{t('bm.requests.all')}</h3>
               <Tabs value={activeOffersFilterTab} onValueChange={(v) => setActiveOffersFilterTab(v as "all" | "my")} className="w-[300px]">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="all">{t('offers.allOffers')}</TabsTrigger>
                        <TabsTrigger value="my">{t('offers.myOffers')}</TabsTrigger>
                    </TabsList>
               </Tabs>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingAllOffers ? (
                    <div className="col-span-full text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-600 mx-auto" />
                    </div>
                ) : filteredOffers.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl">
                        <p className="text-gray-500">{t('bm.list.empty')}</p>
                    </div>
                ) : (
                    filteredOffers.map((offer) => (
                        <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow border-gray-200">
                            <div className="aspect-video bg-slate-100 relative">
                                {offer.mediaFiles && offer.mediaFiles.length > 0 ? (
                                    <img src={offer.mediaFiles[0]} alt={offer.propertyType} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <ImageIcon className="w-12 h-12" />
                                    </div>
                                )}
                                <span className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold shadow-sm">
                                    {offer.dealType === 'sale' ? t('bm.offer.dealSale') : t('bm.offer.dealRent')}
                                </span>
                                {incomingBookings.filter(b => b.offerId === offer.id).length > 0 && (
                                    <span className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold shadow-sm flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {incomingBookings.filter(b => b.offerId === offer.id).length}
                                    </span>
                                )}
                            </div>
                            <CardContent className="p-4">
                                <h4 className="font-bold text-base mb-1">{offer.propertyType}</h4>
                                <p className="text-xs text-gray-500 mb-2">{offer.city} - {offer.neighborhood}</p>
                                <p className="font-bold text-slate-600 text-base mb-4">
                                    {offer.price.toLocaleString()} <span className="text-xs text-gray-500">SAR</span>
                                </p>
                                <div className="flex gap-2">
                                     <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedOffer(offer as Offer);
                                            setShowOfferDetails(true);
                                        }}
                                        className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-slate-900/10 text-xs font-bold"
                                     >
                                        {t('common.details')}
                                     </button>
                                     {activeOffersFilterTab === 'my' && (
                                     <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedOfferForAppointments(offer as Offer);
                                            setShowOfferAppointments(true);
                                        }}
                                        className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-xs font-bold"
                                     >
                                        {language === 'ar' ? 'عرض المواعيد' : 'View Appointments'}
                                     </button>
                                                                     )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
           </div>
       </div>
    
            <OfferDetailsModal 
                isOpen={showOfferDetails}
                onClose={() => setShowOfferDetails(false)}
                offer={selectedOffer}
            />

            <OfferAppointmentsModal 
                isOpen={showOfferAppointments}
                onClose={() => setShowOfferAppointments(false)}
                offerId={selectedOfferForAppointments?.id || null}
                propertyTitle={selectedOfferForAppointments ? `${selectedOfferForAppointments.propertyType} - ${selectedOfferForAppointments.city}` : undefined}
            />
        </TabsContent>
  </Tabs>
</div>
);
  };

  const renderOfferMapModal = () => {
    if (!showOfferMap) return null;
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl ring-1 ring-gray-200 flex flex-col max-h-[90vh]">
               <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                   <h3 className="font-bold text-base text-gray-800 flex items-center gap-2">
                       <MapPin className="w-5 h-5 text-slate-600" />
                       {t('bm.offer.location')}
                   </h3>
                   <Button variant="ghost" size="icon" onClick={() => setShowOfferMap(false)} className="rounded-full">
                       <X className="w-5 h-5" />
                   </Button>
               </div>
                   <div className="flex-1 min-h-[400px] relative">
                   <Map 
                      center={offerMapCoordinates || [24.7136, 46.6753]}
                      zoom={13}
                      interactive={true}
                      onLocationSelect={handleOfferLocationSelect}
                      markerPosition={offerMapCoordinates || undefined}
                      height="100%"
                      useCurrentLocation={false}
                      showControls={true}
                      places={filteredOffers.map(offer => {
                        const coords = extractCoordinates(offer.locationUrl);
                        if (!coords) return null;
                        return {
                          id: offer.id,
                          name: `${offer.propertyType} - ${offer.price.toLocaleString()} SAR`,
                          type: 'property', // Uses the 'property' icon type we saw in Map.tsx
                          latitude: coords.lat,
                          longitude: coords.lng,
                          city: offer.city,
                          price: offer.price
                        };
                      }).filter(Boolean) as any[]}
                   />
               </div>
               <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
                   <Button variant="outline" onClick={() => setShowOfferMap(false)}>{t('common.close')}</Button>
                   <Button className="bg-slate-600 hover:bg-slate-700 text-white" onClick={confirmOfferLocation}>
                       {t('common.save')}
                   </Button>
               </div>
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
    if (selectedSection === "users") {
      return renderUserManagement();
    }
    if (selectedSection === "properties") {
      return renderPropertyManagement(); 
    }

      // Subscription Section
    if (selectedSection === "subscriptions") {
      const handleCreateSubscription = async () => {
        // Validation
        if (!newSubscriptionData.propertyId) {
          toast.error(t('sub.validation.property'));
          return;
        }
        if (!newSubscriptionData.packageId) {
          toast.error("Please select a package");
          return;
        }

        setIsCreatingSubscription(true);
        try {
          const payload = {
            propertyId: newSubscriptionData.propertyId,
            unitId: newSubscriptionData.unitId || undefined,
            packageId: newSubscriptionData.packageId,
            startDate: newSubscriptionData.startDate || new Date().toISOString().split('T')[0],
            paymentMethod: 'مدى', // Default payment method
            notes: newSubscriptionData.notes
          };

          const response = await api.post('/subscriptions', payload);

          toast.success(t('sub.toast.success'));
          
          // Reset form
          setNewSubscriptionData({
            propertyId: '',
            propertyType: '',
            unitId: '',
            packageId: '',
            startDate: '',
            notes: ''
          });
          
          // Reload subscriptions and switch to list tab
          await fetchSubscriptions();
          setActiveSubscriptionTab('list');
        } catch (error) {
          console.error(error);
          toast.error(t('sub.toast.error'));
        } finally {
          setIsCreatingSubscription(false);
        }
      };



      // Get units for selected property
      const selectedPropertyUnits = properties.find(p => p.id === newSubscriptionData.propertyId)?.units || [];

      return (
        <div className="space-y-6">

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-slate-50 rounded-lg">
                <Home className="w-6 h-6 text-slate-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{t('sub.title')}</h1>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveSubscriptionTab("new")} 
                  className={`px-6 py-3 font-medium text-xs border-b-2 transition-colors ${activeSubscriptionTab === "new" ? "border-slate-700 text-slate-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                >
                  {t('sub.tab.new')}
                </button>
                <button 
                  onClick={() => setActiveSubscriptionTab("list")} 
                  className={`px-6 py-3 font-medium text-xs border-b-2 transition-colors ${activeSubscriptionTab === "list" ? "border-slate-700 text-slate-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                >
                  {t('sub.tab.list')}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeSubscriptionTab === "new" ? (
              <div className="space-y-6">
                <Card className="rounded-3xl border-slate-100 bg-slate-50/20 overflow-hidden">
                  <CardHeader className="bg-slate-100/30 border-b border-slate-100/50 pb-6">
                    <CardTitle className="flex items-center gap-3 text-slate-900">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Home className="w-5 h-5 text-slate-700" />
                      </div>
                      {t('sub.tab.new')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    {/* Property Selection */}
            

                    {/* Unit Selection (Optional) */}
                    {newSubscriptionData.propertyId && selectedPropertyUnits.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-gray-700 font-bold">{t('pm.unit')} ({t('common.optional')})</Label>
                        <Select 
                          value={newSubscriptionData.unitId || ''} 
                          onValueChange={(val) => setNewSubscriptionData({...newSubscriptionData, unitId: val})}
                        >
                          <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-white text-start">
                            <SelectValue placeholder={t('pm.unit.selectHint')} />
                          </SelectTrigger>
                          <SelectContent dir={language === 'ar' ? 'rtl' : 'ltr'} className="rounded-xl shadow-xl">
                            <SelectItem value="" className="py-3 cursor-pointer">{t('sub.field.property')} ({t('common.all')})</SelectItem>
                            {selectedPropertyUnits.map((unit: any) => (
                              <SelectItem key={unit.id} value={unit.id} className="py-3 cursor-pointer">
                                {t('pm.unit')} {unit.unitNumber} - {unit.type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">{t('sub.field.unitHint')}</p>
                      </div>
                    )}

                    {/* Package Selection */}
                    <div className="space-y-4">
                      <Label className="text-gray-700 font-bold">{t('sub.field.package') || 'Select Package'}</Label>
                      {loadingPackages ? (
                          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-600"/></div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {packages.map((pkg) => (
                                <div 
                                    key={pkg.id} 
                                    onClick={() => setNewSubscriptionData({...newSubscriptionData, packageId: pkg.id})}
                                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all hover:shadow-md ${newSubscriptionData.packageId === pkg.id ? 'border-slate-600 bg-slate-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900">{pkg.name}</h3>
                                        {newSubscriptionData.packageId === pkg.id && <div className="w-5 h-5 bg-slate-600 rounded-full flex items-center justify-center"><CheckCircle className="w-3 h-3 text-white" /></div>}
                                    </div>
                                    <p className="text-xl font-black text-slate-600 mb-4">{pkg.price} <span className="text-xs font-normal text-gray-500">SAR</span></p>
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{pkg.description}</p>
                                    <ul className="space-y-1">
                                        {pkg.features?.slice(0, 3).map((f: any, i: number) => (
                                            <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Start Date */}
                    <div className="space-y-3">
                      <Label className="text-gray-700 font-bold">{t('sub.field.startDate')}</Label>
                      <Input 
                        type="date" 
                        value={newSubscriptionData.startDate}
                        onChange={(e) => setNewSubscriptionData({...newSubscriptionData, startDate: e.target.value})}
                        className="h-12 rounded-xl border-slate-100 bg-white text-start"
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                      <Label className="text-gray-700 font-bold">{t('sub.field.notes')}</Label>
                      <Textarea 
                        value={newSubscriptionData.notes}
                        onChange={(e) => setNewSubscriptionData({...newSubscriptionData, notes: e.target.value})}
                        className="rounded-xl border-slate-100 bg-white min-h-[100px] text-start"
                        placeholder={t('sub.field.notesPlaceholder')}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                      <Button 
                        onClick={handleCreateSubscription}
                        disabled={isCreatingSubscription}
                        className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold shadow-lg shadow-slate-700/10"
                      >
                        {isCreatingSubscription ? t('sub.btn.creating') : t('sub.btn.submit')}
                      </Button>
                      <Button 
                        onClick={() => {
                          setNewSubscriptionData({
                            propertyId: '',
                            propertyType: '',
                            unitId: '',
                            packageId: '',
                            startDate: '',
                            notes: ''
                          });
                        }}
                        variant="outline"
                        className="h-12 rounded-xl font-semibold"
                      >
                        {t('sub.btn.cancel')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptions.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">{t('sub.list.empty')}</p>
                    <Button 
                      onClick={() => setActiveSubscriptionTab('new')}
                      className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                    >
                      {t('sub.list.createFirst')}
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-start text-xs font-semibold text-gray-700">{t('sub.list.property')}</th>
                          <th className="px-6 py-4 text-start text-xs font-semibold text-gray-700">{t('pm.unit')}</th>
                          <th className="px-6 py-4 text-start text-xs font-semibold text-gray-700">{t('sub.list.type')}</th>
                          <th className="px-6 py-4 text-start text-xs font-semibold text-gray-700">{t('sub.list.amount')}</th>
                          <th className="px-6 py-4 text-start text-xs font-semibold text-gray-700">{t('sub.list.startDate')}</th>
                          <th className="px-6 py-4 text-start text-xs font-semibold text-gray-700">{t('sub.list.status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {subscriptions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-xs text-gray-900">{sub.property?.name || sub.propertyId}</td>
                            <td className="px-6 py-4 text-xs text-gray-900">{sub.unit?.unitNumber || '-'}</td>
                            <td className="px-6 py-4 text-xs text-gray-900">{sub.subscriptionType}</td>
                            <td className="px-6 py-4 text-xs text-gray-900">{sub.amount} {t('fin.currencyShort')}</td>
                            <td className="px-6 py-4 text-xs text-gray-900">{new Date(sub.startDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                sub.status === 'نشط' ? 'bg-green-100 text-green-700' : 
                                sub.status === 'منتهي' ? 'bg-red-100 text-red-700' : 
                                'bg-slate-100 text-gray-700'
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (selectedSection === "service-requests") {
      return (
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
        >
           <ServiceRequestsTable 
              title={t('fin.tab.service_requests')}
              subtitle={t('bm.requests.all')}
              department="real_estate"
           />
        </motion.div>
      );
    }

    if (selectedSection === "legal") {
      const legalNavItems = [
        { id: "dashboard", label: t('admin.legal.dashboard'), icon: BarChart3  },
        { id: "all",       label: t('admin.legal.all'),       icon: Layers     },
     
      ];

       return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-lg">
                <Scale className="w-6 h-6 text-slate-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{t('pm.legal')}</h1>
                  <p className="text-xs text-gray-500">{t('admin.legal.desc')}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex flex-wrap gap-2"dir="rtl">
                {legalNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveLegalTab(item.id)}
                    className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      activeLegalTab === item.id
                        ? "bg-slate-50 border-slate-200 text-slate-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {renderLegalContent()}
          </div>
        </div>
      );
    }
    
     const sidebarItem = sidebarItems.find((item) => item.id === selectedSection);
     if (sidebarItem && selectedSection !== "offers") {
       return (
         <div className="p-6 bg-slate-50 rounded-lg border border-gray-200">
           <h2 className="text-lg font-bold text-gray-800 mb-2">{sidebarItem.label}</h2>
           <p className="text-gray-600">{t('bm.form.devDesc')} {sidebarItem.label}</p>
         </div>
       );
     }

     return renderOffersSection();
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

      <AddPropertyWizard
        isOpen={showNewPropertyModal}
        onClose={() => setShowNewPropertyModal(false)}
        onSubmit={async (data) => {
          setIsCreatingProperty(true);
          try {
             await propertiesApi.create(data);
             toast.success(t('bm.toast.successProp'));
             setShowNewPropertyModal(false);
             fetchProperties();
          } catch (error) {
             console.error(error);
             toast.error(t('bm.toast.errorProp'));
          } finally {
             setIsCreatingProperty(false);
          }
        }}
        loading={isCreatingProperty}
      />
      {showNewTenantModal && renderNewTenantModal()}




      <div className="flex h-screen overflow-hidden bg-slate-50/50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Fixed Sidebar - PREMIUM GLASSMORPHISM */}
        <motion.div 
          initial={{ x: language === 'ar' ? 100 : -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="fixed top-0 right-0 h-screen w-72 lg:w-80 p-6 z-20"
        >
          <div className="bg-white/90 backdrop-blur-3xl p-6 h-full rounded-[2rem] border border-white/50 shadow-2xl flex flex-col gap-6">
            <div className="space-y-6">
              <motion.button 
                whileHover={{ x: language === 'ar' ? -5 : 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50/50 px-5 py-3 rounded-2xl w-full border border-slate-100/50"
              >
                <div className={`transform ${language === 'en' ? 'rotate-180' : ''}`}>
                   <ArrowRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                </div>
                <span className="font-bold text-[11px] uppercase tracking-widest">{t('wallet.backToHome')}</span>
              </motion.button>
              <div className="px-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tighter mb-1">{t('bm.sidebar.title')}</h1>
                <div className="w-8 h-1 bg-slate-900 rounded-full" />
              </div>
            </div>

            <nav className="flex flex-col gap-4 flex-1 overflow-y-auto pr-1 hide-scrollbar">
              {sidebarItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (index * 0.1) }}
                  whileHover={{ x: language === 'ar' ? -8 : 8 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                        setSelectedSection(item.id);
                        if (item.id === "legal") {
                          setActiveLegalTab("dashboard");
                        }
                  }}
                  className={`
                    group relative p-3 lg:p-4 bg-white border rounded-[1.5rem] 
                    transition-all duration-700 flex items-center gap-3 lg:gap-4 text-start
                    ${selectedSection === item.id 
                      ? 'border-slate-900 bg-slate-50 shadow-xl shadow-slate-200/50 ring-2 ring-slate-900/5' 
                      : 'border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-lg'}
                  `}
                >
                  {/* Icon Container - MORE COMPACT */}
                  <div className={`
                    w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-[1rem] shadow-lg transition-all duration-700
                    ${selectedSection === item.id 
                      ? 'bg-slate-900 scale-105 rotate-3 shadow-slate-900/40' 
                      : 'bg-slate-100 group-hover:bg-slate-200 group-hover:scale-105 group-hover:-rotate-2'}
                  `}>
                    {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.label} 
                          className={`
                            h-6 w-6 lg:h-7 lg:w-7 object-contain transition-all duration-700
                            ${selectedSection === item.id ? 'brightness-0 invert' : 'brightness-0'}
                          `} 
                        />
                    ) : (
                        <item.icon className={`h-6 w-6 lg:h-7 lg:w-7 transition-all duration-700 ${selectedSection === item.id ? 'text-white' : 'text-slate-900'}`} />
                    )}
                  </div>
                  
                  {/* Text Content */}
                  <div className="flex-1 space-y-1 text-start">
                    <h3 className={`font-black text-xs lg:text-xs tracking-tight transition-colors duration-500 ${selectedSection === item.id ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'}`}>{item.label}</h3>
                    {selectedSection === item.id && (
                        <motion.p 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-[10px] text-slate-400 font-bold leading-tight"
                        >
                          {item?.id === 'users' ? 'إدارة الموظفين والمناديب' : t('common.active')}
                        </motion.p>
                    )}
                  </div>

                  {/* Active Indicator Line */}
                  {selectedSection === item.id && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute right-0 w-2 h-16 bg-slate-900 rounded-l-full"
                    />
                  )}
                  <ArrowRight className={`w-6 h-6 transition-all duration-500 ${selectedSection === item.id ? 'text-slate-900 translate-x-1' : 'text-slate-200 group-hover:text-slate-400'} ${language === 'ar' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
                </motion.button>
              ))}
            </nav>
            
            {/* Sidebar Footer Badge */}
          
          </div>
        </motion.div>

        {/* Main Workspace - Adjusted for sidebar */}
        <div className="flex-1 mr-96 lg:mr-[28rem] relative overflow-hidden">
          <main className="h-full overflow-y-auto overflow-x-hidden p-8 lg:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSection}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-7xl mx-auto"
              >
       
                <div className="mt-8">
                  {renderMainContent()}
                </div>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Modals moved to top level */}
      <PropertyDetailsModal 
          isOpen={showPropertyDetails} 
          onClose={() => setShowPropertyDetails(false)} 
          property={selectedProperty}
          onUpdate={fetchProperties} 
      />
      <OrderDetailsModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          orderId={selectedOrder?.id || null}
      />
      <TenantDetailsModal
          isOpen={showTenantDetails}
          onClose={() => setShowTenantDetails(false)}
          tenant={selectedTenant}
          leases={leases}
          payments={payments}
      />
      {renderNewMaintenanceModal()}
      {renderOfferMapModal()}

      {/* Service Request Details Modal */}
      <Dialog open={isServiceRequestDetailsOpen} onOpenChange={setIsServiceRequestDetailsOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">{t('admin.service_requests.details_title')}</DialogTitle>
            <DialogDescription>
              {selectedServiceRequest?.serviceType || selectedServiceRequest?.type} – {selectedServiceRequest?.clientName || selectedServiceRequest?.firstParty?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedServiceRequest && (
            <div className="py-4">
              <Tabs defaultValue="details" className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="flex justify-center w-full">
                  <TabsList className="flex w-full max-w-xs mb-6 bg-slate-100 p-1 rounded-xl h-auto">
                    <TabsTrigger value="details"  className="w-full py-2 rounded-lg font-bold">{t("common.details")}</TabsTrigger>
                  </TabsList>
                </div>

                {/* ── Details tab ──────────────────────────────────────── */}
                <TabsContent value="details" className="space-y-6">
                  {/* Client card */}
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <User className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{selectedServiceRequest.clientName || selectedServiceRequest.firstParty?.name}</p>
                      <p className="text-xs font-bold text-slate-400" dir="ltr">{selectedServiceRequest.phone}</p>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: t("admin.service_requests.service_type"), value: selectedServiceRequest.serviceType || selectedServiceRequest.type },
                      { label: t("admin.service_requests.target_dept"),  value: t(`admin.trans.dept.${selectedServiceRequest.targetDepartment}`) },
                      { label: t("admin.service_requests.location_info"),value: `${selectedServiceRequest.city} – ${selectedServiceRequest.district}` },
                      { label: t("admin.service_requests.quantity"),      value: selectedServiceRequest.quantity || '1' },
                    ].map(({ label, value }) => (
                      <div key={label} className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
                        <p className="text-sm font-bold text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Status & Department (Legal overrides) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                        {t("bm.users.status")}
                      <select
                        value={selectedServiceRequest.status}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-slate-900 transition-all appearance-none"
                      >
                       
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {t("admin.service_requests.target_dept")}
                      </label>
                      <select
                        value={srEditingDepartment}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-slate-900 transition-all appearance-none"
                      >
                      
                      </select>
                    </div>
                  </div>

                  {/* Legal party info */}
                  {selectedServiceRequest.category === "legal" &&
                    (selectedServiceRequest.firstParty || selectedServiceRequest.secondParty) && (
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        {selectedServiceRequest.firstParty && (
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('legal.party.first')}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">{t('legal.party.name')}</p>
                                <p className="text-xs font-bold text-slate-900">{selectedServiceRequest.firstParty.name}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">{t('legal.party.id')}</p>
                                <p className="text-xs font-bold text-slate-900">{selectedServiceRequest.firstParty.idNumber}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {selectedServiceRequest.secondParty && (
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('legal.party.second')}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">{t('legal.party.name')}</p>
                                <p className="text-xs font-bold text-slate-900">{selectedServiceRequest.secondParty.name}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">{t('legal.party.id')}</p>
                                <p className="text-xs font-bold text-slate-900">{selectedServiceRequest.secondParty.idNumber}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  {selectedServiceRequest.description && (
                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.service_requests.description")}</p>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">{selectedServiceRequest.description}</p>
                    </div>
                  )}

                  {/* Price & Save */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.service_requests.price")}</label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={srEditingPrice}
                        onChange={(e) => setSrEditingPrice(e.target.value)}
                        className="bg-slate-50 border border-slate-100 py-3 px-4 text-sm font-bold w-full outline-none focus:border-slate-900 rounded-xl transition-all"
                        placeholder="0.00"
                      />
                      <button
                        onClick={handleSaveSrChanges}
                        disabled={srIsUpdatingPrice}
                        className="bg-slate-900 text-white py-3 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                      >
                        <Save className="w-4 h-4" />
                        {t("admin.service_requests.save_changes")}
                      </button>
                    </div>
                  </div>

                  {/* Legal Invoice Section */}
                  {selectedServiceRequest.category === "legal" && (
                    <div className="space-y-4 pt-4 border-t-2 border-blue-100">
                       <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">⚖️ {t("legal.invoice.sendBtn")}</label>
                         {selectedServiceRequest.invoiceSent ? (
                           <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full">✓ {t("legal.invoice.sent")}</span>
                         ) : (
                           <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full">⏳ {t("legal.invoice.notSent")}</span>
                         )}
                       </div>

                       {selectedServiceRequest.clientDecision && selectedServiceRequest.clientDecision !== "pending" && (
                         <div className="space-y-3">
                           <div className={`p-4 rounded-2xl text-xs font-black flex items-center justify-between ${
                             selectedServiceRequest.clientDecision === "accepted" ? "bg-slate-50 text-slate-700 border border-slate-100" : "bg-slate-50 text-slate-700 border border-slate-100"
                           }`}>
                             <div className="flex items-center gap-2">
                               {selectedServiceRequest.clientDecision === "accepted" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                               <span>{selectedServiceRequest.clientDecision === "accepted" ? t("legal.decision.accepted") : t("legal.decision.rejected")}</span>
                             </div>
                             {selectedServiceRequest.clientDecision === "accepted" && (
                               <div className={`px-3 py-1 rounded-lg border flex items-center gap-1.5 ${selectedServiceRequest.paymentStatus === "paid" ? "bg-slate-500 text-white border-emerald-600" : "bg-rose-500 text-white border-rose-600"}`}>
                                 <Receipt className="w-3 h-3" />
                                 <span className="text-[10px] uppercase">{selectedServiceRequest.paymentStatus === "paid" ? t("legal.status.paid") : t("legal.status.unpaid")}</span>
                               </div>
                             )}
                           </div>

                           {selectedServiceRequest.clientDecision === "accepted" && selectedServiceRequest.paymentStatus !== "paid" && (
                             <Button
                               onClick={async () => {
                                 try {
                                   const res = await api.put(`/service-requests/${selectedServiceRequest.id}/mark-paid`);
                                   if (res.data) {
                                     toast.success(t("legal.action.markPaidSuccess"));
                                     setSelectedServiceRequest(res.data);
                                     loadAllServices();
                                   }
                                 } catch (err) { toast.error(t("legal.action.markPaidError")); }
                               }}
                               className="w-full h-11 bg-slate-600 text-white hover:bg-slate-700 rounded-xl font-black text-xs gap-2 shadow-lg shadow-slate-100"
                             >
                               <CheckCircle2 className="w-4 h-4" />
                                     {t("legal.action.markPaid")}
                             </Button>
                           )}
                         </div>
                       )}

                       {!selectedServiceRequest.invoiceSent && (
                         <div className="flex gap-3">
                           <input type="number" value={invoicePrice} onChange={(e) => setInvoicePrice(e.target.value)} placeholder={t("legal.invoice.price")} className="bg-blue-50 border border-blue-200 py-3 px-4 text-sm font-bold w-full outline-none focus:border-blue-500 rounded-xl transition-all" />
                           <button onClick={legalHandleSendInvoice} disabled={isSendingInvoice || !invoicePrice} className="bg-blue-600 text-white py-3 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap">
                             {isSendingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                             {t("legal.invoice.sendBtn")}
                           </button>
                         </div>
                       )}
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t("admin.service_requests.date")}: {format(new Date(selectedServiceRequest.createdAt), "dd MMMM yyyy", { locale: language === "ar" ? ar : enUS })}</span>
                  </div>
                </TabsContent>

                {/* ── Visits tab ───────────────────────────────────────── */}
                <TabsContent value="visits" className="space-y-4">
                  {srIsLoadingRelated ? (
                    <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
                  ) : srUserBookings.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 text-start">
                      {srUserBookings.map((booking: any) => (
                        <div key={booking.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="bg-white">{booking.type}</Badge>
                            <span className="text-xs text-slate-400 font-medium">{format(new Date(booking.createdAt), "dd/MM/yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {booking.visitDate ? format(new Date(booking.visitDate), "dd MMM – hh:mm a", { locale: language === "ar" ? ar : enUS }) : "Pending"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2 opacity-40">
                      <Calendar className="w-8 h-8" /><p className="text-xs font-bold">{t("admin.service_requests.no_visits")}</p>
                    </div>
                  )}
                </TabsContent>

                {/* ── Invoices tab ─────────────────────────────────────── */}
                <TabsContent value="invoices" className="space-y-4">
                  {srIsLoadingRelated ? (
                    <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
                  ) : srUserInvoices.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 text-start">
                      {srUserInvoices.map((inv: any) => (
                        <div key={inv.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Receipt className="w-4 h-4 text-slate-400" />
                              <span className="font-bold text-slate-900 text-sm">#{inv.invoiceNumber || inv.id.substring(0, 8)}</span>
                            </div>
                            <p className="text-xs text-slate-500">{format(new Date(inv.createdAt), "dd MMMM yyyy")}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-slate-900">{inv.amount} SAR</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inv.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{inv.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2 opacity-40">
                      <Receipt className="w-8 h-8" /><p className="text-xs font-bold">{t("admin.service_requests.no_invoices")}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function BuildingManagement() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    }>
      <BuildingManagementContent />
    </Suspense>
  );
} 
