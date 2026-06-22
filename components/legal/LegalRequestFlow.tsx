"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scale, FileText, ShieldCheck, CheckCircle2, MoreHorizontal, Loader2, ArrowRight, ChevronLeft, MapPin, Upload, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";
import { useSettings } from "@/context/SettingsContext";

const legalCategories = [
  { id: "disputes",      title: "المنازعات العقارية", desc: "منازعات الملكية، البيع، الرهن والمخالفات", icon: Scale },
  { id: "contracts",    title: "العقود",              desc: "إنشاء العقود أو إرسالها للمراجعة",       icon: FileText },
  { id: "documentation",title: "التوثيق",             desc: "رفع صك الملكية ومستندات البيع",          icon: ShieldCheck },
  { id: "other",        title: "أخرى",                desc: "استشارات قانونية أو تقارير قانونية",     icon: MoreHorizontal },
];

const initialPartyState = {
  name: "", type: "individual", side: "seller",
  idType: "national_id", idNumber: "", nationality: "",
  city: "", district: "", phone: "", email: "", hasAgent: false,
};

const initialContractPartyState = {
  name: "", idType: "national_id", idNumber: "", nationality: "",
  city: "", phone: "", email: "", nationalAddressFile: null,
  agent: { name: "", agencyNumber: "", agencyFile: null },
};

// ─── Shared style tokens — navbar palette ───────────────────────────────────
const INP = "w-full h-13 bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/5 rounded-2xl px-5 text-slate-900 text-sm font-bold placeholder:text-slate-400 focus:outline-none transition-all duration-200 shadow-sm";
const LBL = "text-[9px] font-black text-slate-500 uppercase tracking-[0.22em] mb-2 block";
const CARD = "bg-white border border-slate-200 rounded-[2rem] p-6 space-y-4 shadow-sm";

const SectionDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 py-1">
    <div className="h-px flex-1 bg-slate-200" />
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">{label}</span>
    <div className="h-px flex-1 bg-slate-200" />
  </div>
);

const UploadRow = ({ label, sub }: { label: string; sub?: string }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
        <Upload className="w-4 h-4 text-slate-500" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-900">{label}</p>
        {sub && <p className="text-[9px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
    <button className="h-8 px-3 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-black text-slate-600 hover:text-slate-900 transition-all flex items-center gap-1.5">
      <Upload className="w-3 h-3" />
      رفع
    </button>
  </div>
);

const DropZone = ({ label, sub }: { label: string; sub?: string }) => (
  <div className="p-7 border border-dashed border-slate-200 hover:border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-3 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group">
    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-slate-300 transition-colors">
      <Upload className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
    </div>
    <div className="text-center">
      <p className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{label}</p>
      {sub && <p className="text-[9px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

type LegalRequestFlowProps = {
  onSuccessRedirect?: string;
  initialCategory?: string | null;
  selectionOnly?: boolean;
  onCategorySelect?: (category: string) => void;
  onBackToSelection?: () => void;
};

export default function LegalRequestFlow({
  onSuccessRedirect = "/wallet",
  initialCategory = null,
  selectionOnly = false,
  onCategorySelect,
  onBackToSelection,
}: LegalRequestFlowProps) {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuth();
  const { settings } = useSettings();

  const moduleStatus = (k: string): 'enabled' | 'soon' | 'disabled' => {
    const v = (settings.moduleFlags as any)?.[k];
    if (v === 'soon' || v === 'disabled') return v;
    return 'enabled';
  };
  const moduleMessage = (k: string) => (settings.moduleMessages as any)?.[k] || '';
  const isAdmin = (user as any)?.role === 'admin';

  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [disputeData, setDisputeData] = useState({
    party1: { ...initialPartyState, side: "seller" },
    party2: { ...initialPartyState, side: "buyer" },
    disputeType: "",
    otherDisputeType: "",
    description: "",
  });

  const [contractData, setContractData] = useState({
    type: "عقد بيع", otherType: "",
    party1: { ...initialContractPartyState },
    party2: { ...initialContractPartyState },
    details: { services: "", duration: "", paymentAmount: "", paymentMethod: "", paymentDueDates: "", rights: "", cancellation: "" },
    applicantRole: "party1",
    contractFile: null,
  });

  const [documentationData, setDocumentationData] = useState({
    party1: { name: "", idType: "national_id", idNumber: "" },
    party2: { name: "", idType: "national_id", idNumber: "" },
    saleAmount: "", saleAmountFile: null,
    deedInfo: "", deedFile: null,
    otherDocs: null,
  });

  const [otherData, setOtherData] = useState({
    type: "استشارة قانونية", name: "", phone: "", email: "", topic: "", details: "", attachment: null,
    role: "", propertyType: "", listingNumber: "", customType: ""
  });

  useEffect(() => {
    if (user && isAuthenticated) {
      const fullName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "";
      const base = {
        name: fullName,
        phone: user.phone || "",
        email: user.email || "",
        city: user.city || "",
        district: user.district || ""
      };
      setDisputeData(prev => ({ ...prev, party1: { ...prev.party1, ...base } }));
      setContractData(prev => ({ ...prev, party1: { ...prev.party1, ...base } }));
      setDocumentationData(prev => ({ ...prev, party1: { ...prev.party1, name: fullName } }));
      setOtherData(prev => ({ ...prev, ...base }));
    }
  }, [user, isAuthenticated]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const loadingToast = toast.loading("جاري إرسال طلبك...");
    try {
      let finalData: any = {};
      let serviceType = "";
      if (selectedCategory === "disputes") { serviceType = "منازعة عقارية"; finalData = disputeData; }
      else if (selectedCategory === "contracts") {
        serviceType = contractData.type === "مراجعة العقود" ? "مراجعة عقد" :
                      contractData.type === "أخرى" ? `عقد - ${contractData.otherType}` : `عقد - ${contractData.type}`;
        finalData = contractData;
      } else if (selectedCategory === "documentation") { serviceType = "توثيق"; finalData = documentationData; }
      else {
        serviceType = otherData.type === "أخرى" ? `خدمة قانونية - ${otherData.customType}` : `خدمة قانونية - ${otherData.type}`;
        finalData = otherData;
      }

      const requestData = {
        category: "legal", serviceType,
        clientName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (finalData.party1?.name || "عميل"),
        phone: user?.phone || finalData.party1?.phone || "05xxxxxxxx",
        city: user?.city || finalData.party1?.city || "",
        district: user?.district || finalData.party1?.district || "",
        quantity: 1,
        description: selectedCategory === "disputes" ?
                     `[${disputeData.disputeType === 'اخرى' ? disputeData.otherDisputeType : disputeData.disputeType}]\n${disputeData.description}` :
                     selectedCategory === "contracts" ?
                     (contractData.type === "مراجعة العقود" ? "طلب مراجعة عقد" : `[${serviceType}]\n${contractData.details.services}`) :
                     selectedCategory === "other" ?
                     (otherData.type === "استشارات قانونية" ? `[استشارة] ${otherData.topic}` :
                      otherData.type === "تقارير قانونية" ? `[تقرير] ${otherData.name} - ${otherData.propertyType}` :
                      `[طلب مخصص] ${otherData.customType}\n${otherData.details}`) :
                     "طلب توثيق عقاري",
        firstParty: finalData.party1 || null,
        secondParty: finalData.party2 || null,
        metadata: {
          ...finalData.metadata,
          type: finalData.type,
          otherType: finalData.otherType,
          topic: finalData.topic,
          details: finalData.details,
          saleAmount: finalData.saleAmount,
          deedInfo: finalData.deedInfo,
          applicantRole: finalData.applicantRole,
          disputeType: disputeData.disputeType,
          otherDisputeType: disputeData.otherDisputeType,
          contractDetails: contractData.details,
          otherData: {
            role: otherData.role,
            propertyType: otherData.propertyType,
            listingNumber: otherData.listingNumber,
            customType: otherData.customType
          }
        },
        documentIds: finalData.documentIds || [],
        userId: user?.id,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.dismiss(loadingToast);
        if (Array.isArray(result.message)) {
          result.message.forEach((msg: string) => toast.error(msg));
        } else {
          toast.error(result.message || "فشل إرسال الطلب");
        }
        return;
      }

      toast.success("تم إنشاء طلب الخدمة بنجاح، سيقوم الفريق بالمراجعة والرد عليك قريباً", { id: loadingToast, duration: 4000 });
      setTimeout(() => router.push(onSuccessRedirect), 4000);
    } catch (err: any) {
      toast.error("حدث خطأ غير متوقع", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Disputes Form ──────────────────────────────────────────────────────────
  const renderDisputesForm = () => {
    const disputeTypes = [
      "نزاعات الملكية", "عقود البيع والإيجار", "قضايا الرهن العقاري",
      "مخالفات البناء", "نزع الملكية للمصلحة العامة", "مشاكل في مشاريع التطوير",
      "قضايا التركات العقارية", "اخرى"
    ];

    return (
      <div className="space-y-6">
        {[
          { key: "party1", title: "الطرف الأول" },
          { key: "party2", title: "الطرف الثاني" },
        ].map((p) => (
          <div key={p.key}>
            <SectionDivider label={p.title} />
            <div className={`mt-4 ${CARD}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "الاسم الكامل", field: "name", placeholder: "اسم البائع / المشتري / الوسيط" },
                  { label: "رقم الهوية",   field: "idNumber", placeholder: "أدخل رقم الهوية" },
                  { label: "الجنسية",      field: "nationality", placeholder: "الجنسية" },
                  { label: "المدينة",      field: "city", placeholder: "المدينة" },
                ].map(f => (
                  <div key={f.field} className="space-y-1.5">
                    <label className={LBL}>{f.label}</label>
                    <input
                      className={INP}
                      value={(disputeData as any)[p.key][f.field]}
                      onChange={(e) => setDisputeData({ ...disputeData, [p.key]: { ...(disputeData as any)[p.key], [f.field]: e.target.value } })}
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label className={LBL}>الصفة</label>
                  <select
                    className={INP + " appearance-none cursor-pointer"}
                    value={(disputeData as any)[p.key].side}
                    onChange={(e) => setDisputeData({ ...disputeData, [p.key]: { ...(disputeData as any)[p.key], side: e.target.value } })}
                  >
                    <option value="seller" className="bg-white text-slate-900">بائع</option>
                    <option value="buyer" className="bg-white text-slate-900">مشتري</option>
                    <option value="broker" className="bg-white text-slate-900">وسيط</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={LBL}>رقم الجوال</label>
                  <input
                    className={INP}
                    value={(disputeData as any)[p.key].phone}
                    onChange={(e) => setDisputeData({ ...disputeData, [p.key]: { ...(disputeData as any)[p.key], phone: e.target.value } })}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="space-y-4">
          <SectionDivider label="نوع النزاع (اختياري)" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={LBL}>اختر نوع النزاع</label>
              <select
                className={INP + " appearance-none cursor-pointer"}
                value={disputeData.disputeType}
                onChange={(e) => setDisputeData({ ...disputeData, disputeType: e.target.value })}
              >
                <option value="" className="bg-white text-slate-900">اختر...</option>
                {disputeTypes.map(t => <option key={t} value={t} className="bg-white text-slate-900">{t}</option>)}
              </select>
            </div>
            {disputeData.disputeType === "اخرى" && (
              <div className="space-y-1.5 animate-in zoom-in-95 duration-200">
                <label className={LBL}>اكتب نوع النزاع</label>
                <input
                  className={INP}
                  value={disputeData.otherDisputeType}
                  onChange={(e) => setDisputeData({ ...disputeData, otherDisputeType: e.target.value })}
                  placeholder="نوع النزاع..."
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <SectionDivider label="وصف النزاع" />
          <textarea
            className={INP + " h-32 py-3 resize-none mt-4"}
            value={disputeData.description}
            onChange={(e) => setDisputeData({ ...disputeData, description: e.target.value })}
            placeholder="اكتب وصفاً تفصيلياً للنزاع..."
          />
          <div className="space-y-4">
            <label className={LBL}>المستندات (Word, PDF, صور)</label>
            <DropZone label="رفع المستندات والملفات" sub="الحد الأقصى لكل ملف: 10MB" />
          </div>
        </div>
      </div>
    );
  };

  // ─── Contracts Form ─────────────────────────────────────────────────────────
  const renderContractsForm = () => {
    const isReviewOnly = contractData.type === "مراجعة العقود";
    const types = ["عقد بيع", "عقد إيجار", "عقد الانتفاع العقاري", "عقد الهبة العقاري", "عقد الرهن العقاري", "عقد الاستثمار العقاري", "مراجعة العقود", "أخرى"];
    const idTypes = [{ id: "national_id", label: "رقم الهوية" }, { id: "residency", label: "رقم الإقامة" }, { id: "commercial_register", label: "السجل التجاري" }];

    return (
      <div className="space-y-6">
        {/* Contract Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={LBL}>نوع العقد</label>
            <select className={INP + " appearance-none cursor-pointer"} value={contractData.type} onChange={(e) => setContractData({ ...contractData, type: e.target.value })}>
              {types.map(t => <option key={t} value={t} className="bg-white text-slate-900">{t}</option>)}
            </select>
          </div>
          {contractData.type === "أخرى" && (
            <div className="space-y-1.5 animate-in zoom-in-95 duration-200">
              <label className={LBL}>اكتب نوع العقد</label>
              <input className={INP} value={contractData.otherType} onChange={(e) => setContractData({ ...contractData, otherType: e.target.value })} placeholder="مثلاً: عقد إدارة أملاك" />
            </div>
          )}
        </div>

        {isReviewOnly ? (
          <div className="space-y-6">
            <SectionDivider label="باقة مراجعة العقود" />
            <DropZone label="ارفق العقد للمراجعة" sub="PDF, Word, أو صور — الحد الأقصى 20MB" />
          </div>
        ) : (
          <>
            {/* Parties */}
            {[{ key: "party1", title: "بيانات الطرف الأول" }, { key: "party2", title: "بيانات الطرف الثاني" }].map((p) => (
              <div key={p.key} className="space-y-4">
                <SectionDivider label={p.title} />
                <div className={CARD}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className={LBL}>الاسم (اسم العميل / اسم الشركة) *</label>
                      <input className={INP} value={(contractData as any)[p.key].name} onChange={(e) => setContractData({ ...contractData, [p.key]: { ...(contractData as any)[p.key], name: e.target.value } })} placeholder="أدخل الاسم الكامل" />
                    </div>
                    {/* ID */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className={LBL}>الهوية / الإقامة / السجل التجاري *</label>
                      <div className="flex gap-2">
                        <select
                          className="w-40 h-13 bg-white border border-slate-200 rounded-2xl px-4 text-xs font-bold text-slate-700 text-slate-900 focus:outline-none focus:border-slate-400 hover:border-slate-300 transition-all appearance-none"
                          value={(contractData as any)[p.key].idType}
                          onChange={(e) => setContractData({ ...contractData, [p.key]: { ...(contractData as any)[p.key], idType: e.target.value } })}
                        >
                          {idTypes.map(it => <option key={it.id} value={it.id} className="bg-white text-slate-900">{it.label}</option>)}
                        </select>
                        <input className={INP} value={(contractData as any)[p.key].idNumber} onChange={(e) => setContractData({ ...contractData, [p.key]: { ...(contractData as any)[p.key], idNumber: e.target.value } })} placeholder="أدخل الأرقام" />
                      </div>
                    </div>
                    {/* Nationality & City */}
                    <div className="space-y-1.5">
                      <label className={LBL}>الجنسية</label>
                      <input className={INP} value={(contractData as any)[p.key].nationality} onChange={(e) => setContractData({ ...contractData, [p.key]: { ...(contractData as any)[p.key], nationality: e.target.value } })} placeholder="الجنسية" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={LBL}>المدينة</label>
                      <input className={INP} value={(contractData as any)[p.key].city} onChange={(e) => setContractData({ ...contractData, [p.key]: { ...(contractData as any)[p.key], city: e.target.value } })} placeholder="المدينة" />
                    </div>
                    {/* Phone & Email */}
                    <div className="space-y-1.5">
                      <label className={LBL}>رقم الجوال</label>
                      <input className={INP} value={(contractData as any)[p.key].phone} onChange={(e) => setContractData({ ...contractData, [p.key]: { ...(contractData as any)[p.key], phone: e.target.value } })} placeholder="05xxxxxxxx" dir="ltr" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={LBL}>البريد الإلكتروني</label>
                      <input className={INP} value={(contractData as any)[p.key].email} onChange={(e) => setContractData({ ...contractData, [p.key]: { ...(contractData as any)[p.key], email: e.target.value } })} placeholder="example@email.com" dir="ltr" />
                    </div>
                  </div>

                  {/* National Address */}
                  <UploadRow label="العنوان الوطني" sub="رفق صورة أو PDF" />

                  {/* Agent */}
                  <div className="space-y-4 pt-4 border-t border-white/[0.05]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">بيانات الوكيل</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className={LBL}>اسم الوكيل</label>
                        <input className={INP} value={(contractData as any)[p.key].agent.name} onChange={(e) => setContractData({ ...contractData, [p.key]: { ...(contractData as any)[p.key], agent: { ...(contractData as any)[p.key].agent, name: e.target.value } } })} placeholder="اسم الوكيل بالكامل" />
                      </div>
                      <div className="space-y-1.5">
                        <label className={LBL}>رقم الوكالة</label>
                        <input className={INP} value={(contractData as any)[p.key].agent.agencyNumber} onChange={(e) => setContractData({ ...contractData, [p.key]: { ...(contractData as any)[p.key], agent: { ...(contractData as any)[p.key].agent, agencyNumber: e.target.value } } })} placeholder="رقم الوكالة" />
                      </div>
                    </div>
                    <div className="space-y-2">
                        <label className={LBL}>مرفق الوكالة</label>
                        <button className="w-full h-13 bg-white border border-dashed border-slate-300 hover:border-slate-400 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all">
                        <Upload className="w-4 h-4" />
                        ارفاق الوكالة (صورة أو PDF)
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Contract Details */}
            <div className="space-y-4">
              <SectionDivider label="تفاصيل العقد" />
              <div className={CARD}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className={LBL}>وصف الخدمات</label>
                    <textarea className={INP + " h-24 py-3 resize-none"} value={contractData.details.services} onChange={(e) => setContractData({ ...contractData, details: { ...contractData.details, services: e.target.value } })} placeholder="ما هي الخدمات التي سيتم تقديمها، وما هي طبيعة الالتزامات." />
                  </div>
                  <div className="space-y-1.5">
                    <label className={LBL}>المدة الزمنية</label>
                    <input className={INP} value={contractData.details.duration} onChange={(e) => setContractData({ ...contractData, details: { ...contractData.details, duration: e.target.value } })} placeholder="مدة العقد" />
                  </div>
                  <div className="space-y-1.5">
                    <label className={LBL}>تفاصيل الدفع</label>
                    <input className={INP} value={contractData.details.paymentAmount} onChange={(e) => setContractData({ ...contractData, details: { ...contractData.details, paymentAmount: e.target.value } })} placeholder="مبلغ الدفع، طريقة الدفع، وتواريخ الاستحقاق" />
                  </div>
                  <div className="space-y-1.5">
                    <label className={LBL}>الحقوق والمسؤوليات</label>
                    <textarea className={INP + " h-20 py-3 resize-none"} value={contractData.details.rights} onChange={(e) => setContractData({ ...contractData, details: { ...contractData.details, rights: e.target.value } })} placeholder="الحقوق والواجبات لكل طرف" />
                  </div>
                  <div className="space-y-1.5">
                    <label className={LBL}>شروط إلغاء العقد</label>
                    <textarea className={INP + " h-20 py-3 resize-none"} value={contractData.details.cancellation} onChange={(e) => setContractData({ ...contractData, details: { ...contractData.details, cancellation: e.target.value } })} placeholder="كيفية إلغاء العقد وفسخه" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Applicant Role */}
        <div className="space-y-4">
          <SectionDivider label="صفة مقدم الطلب" />
          <div className="grid grid-cols-3 gap-3">
            {[{ id: "party1", label: "الطرف الأول" }, { id: "party2", label: "الطرف الثاني" }, { id: "agent", label: "الوكيل" }].map(role => (
              <button
                key={role.id}
                type="button"
                onClick={() => setContractData({ ...contractData, applicantRole: role.id })}
                className={`h-12 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${
                  contractData.applicantRole === role.id
                    ? "bg-slate-950 text-white border-slate-950"
                    : "bg-white shadow-sm border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── Documentation Form ─────────────────────────────────────────────────────
  const renderDocumentationForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[{ key: "party1", title: "الطرف الأول" }, { key: "party2", title: "الطرف الثاني" }].map((p) => (
          <div key={p.key} className={CARD}>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{p.title}</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className={LBL}>الاسم بالكامل</label>
                <input className={INP} value={(documentationData as any)[p.key].name} onChange={(e) => setDocumentationData({ ...documentationData, [p.key]: { ...(documentationData as any)[p.key], name: e.target.value } })} placeholder="أدخل الاسم" />
              </div>
              <div className="space-y-1.5">
                <label className={LBL}>رقم الهوية</label>
                <input className={INP} value={(documentationData as any)[p.key].idNumber} onChange={(e) => setDocumentationData({ ...documentationData, [p.key]: { ...(documentationData as any)[p.key], idNumber: e.target.value } })} placeholder="أدخل رقم الهوية" />
              </div>
              <UploadRow label="صورة الهوية" sub="ارفاق صورة الهوية (يقبل كذا صيغة)" />
            </div>
          </div>
        ))}
      </div>

      {/* Deed Info */}
      <div className={CARD + " space-y-4"}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <p className="text-xs font-black text-slate-900">صك الملكية</p>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed bg-white/[0.03] p-3 rounded-xl border border-white/5">
          الأصل المحدث والصادر من وزارة العدل، ويكون خالياً من أي موانع تمنع الإفراغ، مثل الرهن أو الحجز.
        </p>
        <UploadRow label="ارفاق صك الملكية" sub="PDF أو صورة واضحة (يقبل كذا صيغة)" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
            <label className={LBL}>مبلغ البيع</label>
            <div className="relative">
                <input className={INP + " pl-12"} value={documentationData.saleAmount} onChange={(e) => setDocumentationData({ ...documentationData, saleAmount: e.target.value })} placeholder="0.00" dir="ltr" />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">ر.س</span>
            </div>
        </div>
      </div>

      <div className="space-y-4">
        <SectionDivider label="مستندات أخرى" />
        <DropZone label="رفع مستندات إضافية" sub="(يقبل كذا صيغة)" />
      </div>
    </div>
  );

  // ─── Other Form ─────────────────────────────────────────────────────────────
  const renderOtherForm = () => {
    const types = [
      { id: "consultation", label: "استشارات قانونية" },
      { id: "report",       label: "تقارير قانونية" },
      { id: "custom",       label: "أخرى" },
    ];

    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className={LBL}>نوع الخدمة</label>
          <div className="grid grid-cols-3 gap-3">
            {types.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setOtherData({ ...otherData, type: t.label })}
                className={`h-13 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${
                  otherData.type === t.label
                    ? "bg-slate-950 text-white border-slate-950"
                    : "bg-white shadow-sm border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className={CARD}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherData.type === "أخرى" && (
                <div className="space-y-1.5 md:col-span-2 animate-in slide-in-from-top-2 duration-300">
                    <label className={LBL}>نوع الخدمة المخصص</label>
                    <input
                        className={INP}
                        value={(otherData as any).customType || ""}
                        onChange={(e) => setOtherData({ ...otherData, customType: e.target.value } as any)}
                        placeholder="ما هي الخدمة القانونية التي تحتاجها؟"
                    />
                </div>
            )}

            <div className="space-y-1.5">
              <label className={LBL}>الاسم بالكامل</label>
              <input className={INP} value={otherData.name} onChange={(e) => setOtherData({ ...otherData, name: e.target.value })} placeholder="أدخل اسمك" />
            </div>

            {otherData.type === "استشارات قانونية" ? (
              <>
                <div className="space-y-1.5">
                  <label className={LBL}>رقم الجوال</label>
                  <input className={INP} value={otherData.phone} onChange={(e) => setOtherData({ ...otherData, phone: e.target.value })} placeholder="05xxxxxxxx" dir="ltr" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className={LBL}>موضوع الاستشارة</label>
                  <textarea className={INP + " h-28 py-3 resize-none"} value={otherData.topic} onChange={(e) => setOtherData({ ...otherData, topic: e.target.value })} placeholder="اكتب موضوع استشارتك هنا..." />
                </div>
              </>
            ) : otherData.type === "تقارير قانونية" ? (
              <>
                <div className="space-y-1.5">
                  <label className={LBL}>الصفة</label>
                  <input className={INP} value={otherData.role} onChange={(e) => setOtherData({ ...otherData, role: e.target.value })} placeholder="صفتك (مالك، وكيل، إلخ)" />
                </div>
                <div className="space-y-1.5">
                  <label className={LBL}>نوع العقار</label>
                  <input className={INP} value={otherData.propertyType} onChange={(e) => setOtherData({ ...otherData, propertyType: e.target.value })} placeholder="فيلا، شقة، أرض..." />
                </div>
                <div className="space-y-1.5">
                  <label className={LBL}>رقم العرض</label>
                  <input className={INP} value={otherData.listingNumber} onChange={(e) => setOtherData({ ...otherData, listingNumber: e.target.value })} placeholder="رقم العرض إن وجد" />
                </div>
                <div className="md:col-span-2 pt-2">
                    <p className="text-[10px] text-slate-500 italic mb-2">يصدر في خانة التقارير وضع العقار القانوني</p>
                </div>
              </>
            ) : (
                <div className="space-y-1.5 md:col-span-2">
                    <label className={LBL}>تفاصيل وطلبات إضافية</label>
                    <textarea
                        className={INP + " h-28 py-4 resize-none"}
                        value={otherData.details}
                        onChange={(e) => setOtherData({ ...otherData, details: e.target.value })}
                        placeholder="اشرح لنا حاجتك بالتفصيل..."
                    />
                </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
            <label className={LBL}>المرفقات (جميع الصيغ)</label>
            <DropZone label="إرفاق ملفات داعمة" sub="يقبل جميع الصيغ" />
        </div>
      </div>
    );
  };

  // ─── Main Render ─────────────────────────────────────────────────────────────
	  return (
	    <div className="w-full" dir="rtl">
	      {!selectedCategory ? (
	        /* Category Selection Grid */
	        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
	          {legalCategories.map((cat) => {
	            const moduleKey =
	              cat.id === 'documentation' ? 'legal_documentation' :
	              cat.id === 'contracts' ? 'legal_contracts' :
	              cat.id === 'disputes' ? 'legal_disputes' :
	              'legal_other';
	            const status = moduleStatus(moduleKey);
	            // Disabled modules should be removed from the page for everyone.
	            if (status === 'disabled') return null;
	            const disabled = status !== 'enabled';
	            const isSoon = status === 'soon';
	            return (
	              <motion.div
	                key={cat.id}
	                whileHover={disabled ? undefined : "hovered"}
	                whileTap={disabled ? undefined : { scale: 0.98 }}
	                role="button"
	                tabIndex={disabled ? -1 : 0}
	                aria-disabled={disabled}
	                onKeyDown={(e) => {
	                  if (disabled) {
	                    const msg = moduleMessage(moduleKey) || 'قريباً';
	                    toast.error(msg);
	                    return;
	                  }
	                  if (e.key === "Enter" || e.key === " ") {
	                    e.preventDefault();
                    if (onCategorySelect) onCategorySelect(cat.id);
                    else setSelectedCategory(cat.id);
	                  }
	                }}
	                onClick={() => {
	                  if (disabled) {
	                    const msg = moduleMessage(moduleKey) || 'قريباً';
	                    toast.error(msg);
	                    return;
	                  }
                  if (onCategorySelect) onCategorySelect(cat.id);
                  else setSelectedCategory(cat.id);
	                }}
	                className={`group relative rounded-2xl p-4 sm:p-5 text-right flex flex-col justify-between min-h-[140px] sm:min-h-[160px] transition-all duration-300 overflow-hidden border ${
	                  disabled
	                    ? 'opacity-60 cursor-not-allowed bg-white/[0.02] border-white/[0.08]'
	                    : 'bg-white/[0.02] border-white/[0.08] hover:border-white/20 cursor-pointer hover:-translate-y-0.5'
	                }`}
	              >
	                <motion.div
	                  variants={{ hovered: { opacity: 1 }, initial: { opacity: 0 } }}
	                  transition={{ duration: 0.3 }}
	                  className="absolute inset-0 bg-white/[0.03] pointer-events-none"
	                />
	                {/* Stronger "not available" sheen for soon/disabled so it doesn't look normal even for admin */}
	                {disabled && (
	                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-transparent" />
	                )}
	                <motion.div
	                  variants={{ hovered: { opacity: 1 }, initial: { opacity: 0 } }}
	                  className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
	                />
	                <div className="relative z-10 flex items-start justify-between gap-4">
	                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 group-hover:scale-105 flex items-center justify-center transition-all duration-300">
	                    <cat.icon className="w-4 h-4 text-white/50 group-hover:text-white/90 transition-colors duration-200" />
	                  </div>
	                  {isSoon && (
	                    <span className="text-[9px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-widest">
	                      قريباً
	                    </span>
	                  )}
	                </div>
	                <div className="relative z-10 mt-auto pt-4">
	                  <p className="text-base sm:text-lg font-bold text-white/80 group-hover:text-white transition-colors duration-200">{cat.title}</p>
	                  <p className="text-[10px] font-medium text-white/40 mt-1 leading-relaxed">{cat.desc}</p>
	                </div>

	                {/* Admin-only explicit preview so "soon" doesn't behave like normal click */}
	                {isAdmin && isSoon && (
	                  <div className="pt-1">
	                    <button
	                      type="button"
	                      onClick={(e) => {
	                        e.stopPropagation();
                        if (onCategorySelect) onCategorySelect(cat.id);
                        else setSelectedCategory(cat.id);
	                      }}
	                      className="h-9 px-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-[10px] font-black text-slate-500 hover:text-slate-300 transition-all inline-flex items-center gap-2"
	                    >
	                      <Info className="w-4 h-4" />
	                      معاينة كمسؤول
	                    </button>
	                  </div>
	                )}
	              </motion.div>
	            );
	          })}
	        </div>
      ) : !selectionOnly && (
        /* Selected Category Form */
        <div className="space-y-8">
          {/* Back button */}
          <button
            onClick={() => onBackToSelection ? onBackToSelection() : setSelectedCategory(null)}
            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
            العودة لاختيار التصنيف
          </button>

          {/* Form card */}
          <div className="bg-white shadow-sm border border-slate-200 rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            {selectedCategory === "disputes"      && renderDisputesForm()}
            {selectedCategory === "contracts"     && renderContractsForm()}
            {selectedCategory === "documentation" && renderDocumentationForm()}
            {selectedCategory === "other"         && renderOtherForm()}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => onBackToSelection ? onBackToSelection() : setSelectedCategory(null)}
              className="flex-1 h-14 rounded-2xl border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-900 text-xs font-black uppercase tracking-widest transition-all"
            >
              إلغاء
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-[2] h-14 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><span>إرسال الطلب</span><ArrowRight className="w-4 h-4 rotate-180" /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
