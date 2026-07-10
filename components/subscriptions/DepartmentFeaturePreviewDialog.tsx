"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Briefcase,
  Building2,
  Calculator,
  FileCheck,
  FileText,
  Gavel,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Search,
  ShieldCheck,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/context/LanguageContext";

export type PreviewDepartmentKey = "properties" | "offers" | "orders" | "marketing" | "legal" | "finance" | "employees";

type PreviewSection = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

type PreviewDepartment = {
  id: PreviewDepartmentKey;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  icon: React.ElementType;
  featuresAr: string[];
  featuresEn: string[];
  sections: PreviewSection[];
};

const PREVIEW_DEPARTMENTS: PreviewDepartment[] = [
  {
    id: "properties",
    titleAr: "إدارة الأملاك",
    titleEn: "Property Management",
    subtitleAr: "عرض المحافظ العقارية والمستأجرين والعقود والمدفوعات والصيانة",
    subtitleEn: "View portfolios, tenants, leases, payments, and maintenance",
    icon: Building2,
    featuresAr: ["عرض العقارات", "عرض المستأجرين", "عرض العقود", "عرض المدفوعات", "عرض سجلات الصيانة"],
    featuresEn: ["Property portfolio", "Tenant list", "Lease list", "Payments list", "Maintenance logs"],
    sections: [
      { id: "dashboard", titleAr: "لوحة القسم", titleEn: "Dashboard", descriptionAr: "ملخص سريع للأملاك والحالة التشغيلية.", descriptionEn: "Quick summary of assets and operational status." },
      { id: "portfolio", titleAr: "المحفظة العقارية", titleEn: "Portfolio", descriptionAr: "مراجعة العقارات والوحدات والبيانات الأساسية.", descriptionEn: "Review properties, units, and core information." },
      { id: "tenants", titleAr: "المستأجرون", titleEn: "Tenants", descriptionAr: "عرض بيانات المستأجرين المرتبطة بالأملاك.", descriptionEn: "View tenant data linked to the portfolio." },
      { id: "finance", titleAr: "العقود والمدفوعات", titleEn: "Leases & Payments", descriptionAr: "متابعة العقود والتحصيلات المالية.", descriptionEn: "Track leases and payment activity." },
    ],
  },
  {
    id: "offers",
    titleAr: "إدارة العروض",
    titleEn: "Offers Management",
    subtitleAr: "عرض وإدارة العروض العقارية ومتابعة حالتها",
    subtitleEn: "View and manage real estate offers and their status",
    icon: ShoppingBag,
    featuresAr: ["عرض العروض", "إنشاء العروض", "تعديل حالة العرض", "متابعة المواعيد", "تقارير العروض"],
    featuresEn: ["Offers list", "Create offers", "Offer status updates", "Appointments", "Offer reports"],
    sections: [
      { id: "offers", titleAr: "العروض", titleEn: "Offers", descriptionAr: "استعراض العروض وإدارتها من مساحة العمل الداخلية.", descriptionEn: "Browse and manage offers from the internal workspace." },
      { id: "appointments", titleAr: "المواعيد", titleEn: "Appointments", descriptionAr: "متابعة طلبات الزيارة والمواعيد المرتبطة بالعروض.", descriptionEn: "Track visit requests and appointments linked to offers." },
      { id: "reports", titleAr: "التقارير", titleEn: "Reports", descriptionAr: "مراجعة بلاغات وتقارير العروض.", descriptionEn: "Review offer reports and activity." },
    ],
  },
  {
    id: "orders",
    titleAr: "إدارة الطلبات",
    titleEn: "Orders Management",
    subtitleAr: "عرض وإدارة طلبات الشراء والطلبات العقارية",
    subtitleEn: "View and manage purchase and real estate requests",
    icon: FileCheck,
    featuresAr: ["عرض الطلبات", "إنشاء الطلبات", "تحديث الحالة", "التعيين والمتابعة", "سجل الطلبات"],
    featuresEn: ["Orders list", "Create orders", "Status updates", "Assignment and tracking", "Order history"],
    sections: [
      { id: "orders", titleAr: "الطلبات", titleEn: "Orders", descriptionAr: "استعراض الطلبات وإدارة مراحلها.", descriptionEn: "Browse orders and manage their lifecycle." },
      { id: "assignment", titleAr: "التعيين", titleEn: "Assignment", descriptionAr: "تعيين الطلبات ومتابعة المسؤول عنها.", descriptionEn: "Assign orders and track ownership." },
      { id: "status", titleAr: "الحالات", titleEn: "Statuses", descriptionAr: "متابعة حالة كل طلب والتحديثات المرتبطة به.", descriptionEn: "Track each order status and related updates." },
    ],
  },
  {
    id: "marketing",
    titleAr: "إدارة التسويق",
    titleEn: "Marketing",
    subtitleAr: "عرض الحملات والإعلانات والاتجاهات ومحتوى التسويق",
    subtitleEn: "View campaigns, ads, trends, and marketing content",
    icon: Megaphone,
    featuresAr: ["عرض الحملات", "عرض الإعلانات", "عرض الاتجاهات", "عرض المحتوى", "عرض الأداء"],
    featuresEn: ["Campaigns", "Ads", "Trends", "Content", "Performance"],
    sections: [
      { id: "dashboard", titleAr: "لوحة التسويق", titleEn: "Marketing Dashboard", descriptionAr: "مؤشرات ملخصة للنشاط التسويقي.", descriptionEn: "High-level metrics for marketing activity." },
      { id: "campaigns", titleAr: "الحملات", titleEn: "Campaigns", descriptionAr: "استعراض الحملات المرتبطة بالعروض والطلبات والأملاك.", descriptionEn: "Browse campaigns linked to offers, orders, and properties." },
      { id: "ads", titleAr: "الإعلانات", titleEn: "Ads", descriptionAr: "معاينة الإعلانات وترتيب ظهورها.", descriptionEn: "Preview ads and their display ordering." },
      { id: "reports", titleAr: "التقارير", titleEn: "Reports", descriptionAr: "عرض النتائج والاتجاهات الحالية.", descriptionEn: "Review current results and trends." },
    ],
  },
  {
    id: "legal",
    titleAr: "الإدارة القانونية",
    titleEn: "Legal",
    subtitleAr: "عرض المنازعات والعقود والتوثيق والخدمات القانونية",
    subtitleEn: "View disputes, contracts, documentation, and legal services",
    icon: Gavel,
    featuresAr: ["عرض المنازعات", "عرض العقود", "عرض التوثيق", "عرض الطلبات القانونية", "عرض الحالات"],
    featuresEn: ["Disputes", "Contracts", "Documentation", "Legal requests", "Case statuses"],
    sections: [
      { id: "dashboard", titleAr: "لوحة القانونية", titleEn: "Legal Dashboard", descriptionAr: "ملخص للطلبات والنشاط القانوني.", descriptionEn: "Summary of legal activity and requests." },
      { id: "disputes", titleAr: "المنازعات", titleEn: "Disputes", descriptionAr: "استعراض قضايا المنازعات العقارية والقانونية.", descriptionEn: "Review legal and real-estate disputes." },
      { id: "contracts", titleAr: "العقود", titleEn: "Contracts", descriptionAr: "متابعة العقود ومراحلها.", descriptionEn: "Track contracts and their progress." },
      { id: "documentation", titleAr: "التوثيق", titleEn: "Documentation", descriptionAr: "عرض خدمات التوثيق والمرفقات.", descriptionEn: "View documentation services and attachments." },
    ],
  },
  {
    id: "finance",
    titleAr: "الإدارة المالية",
    titleEn: "Finance",
    subtitleAr: "عرض المعاملات والمدفوعات والمصروفات والتقارير",
    subtitleEn: "View transactions, payments, expenses, and reports",
    icon: Calculator,
    featuresAr: ["عرض المعاملات", "عرض المدفوعات", "عرض المصروفات", "عرض التسويات", "عرض التقارير"],
    featuresEn: ["Transactions", "Payments", "Expenses", "Settlements", "Reports"],
    sections: [
      { id: "dashboard", titleAr: "لوحة المالية", titleEn: "Finance Dashboard", descriptionAr: "مؤشرات مالية عامة للقسم.", descriptionEn: "Overall financial department metrics." },
      { id: "transactions", titleAr: "المعاملات", titleEn: "Transactions", descriptionAr: "عرض السجل المالي والعمليات المرتبطة.", descriptionEn: "View transaction history and related operations." },
      { id: "payments", titleAr: "المدفوعات", titleEn: "Payments", descriptionAr: "استعراض الدفعات والحالات.", descriptionEn: "Review payments and their statuses." },
      { id: "reports", titleAr: "التقارير", titleEn: "Reports", descriptionAr: "عرض التقارير والتحليلات المالية.", descriptionEn: "Review financial reports and analytics." },
    ],
  },
  {
    id: "employees",
    titleAr: "إدارة الموظفين",
    titleEn: "Employees",
    subtitleAr: "عرض الموظفين والصلاحيات والمتابعة الداخلية",
    subtitleEn: "View employees, permissions, and internal tracking",
    icon: Users,
    featuresAr: ["عرض الموظفين", "عرض الصلاحيات", "عرض الأقسام", "عرض المتابعة", "عرض السجل الداخلي"],
    featuresEn: ["Employees", "Permissions", "Departments", "Tracking", "Internal logs"],
    sections: [
      { id: "dashboard", titleAr: "لوحة الموظفين", titleEn: "Employees Dashboard", descriptionAr: "ملخص الموظفين وحالة الوصول.", descriptionEn: "Summary of employees and access status." },
      { id: "team", titleAr: "الفريق", titleEn: "Team", descriptionAr: "استعراض أعضاء الفريق والبيانات الأساسية.", descriptionEn: "Browse team members and their profile data." },
      { id: "permissions", titleAr: "الصلاحيات", titleEn: "Permissions", descriptionAr: "عرض الصلاحيات والقسم المرتبط بكل موظف.", descriptionEn: "View permissions and each employee's department access." },
      { id: "logs", titleAr: "السجل", titleEn: "Logs", descriptionAr: "عرض النشاطات الداخلية المرتبطة بالموظفين.", descriptionEn: "View internal employee-related activity logs." },
    ],
  },
];

const SECTION_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  portfolio: Building2,
  tenants: Users,
  finance: Calculator,
  campaigns: Megaphone,
  ads: Briefcase,
  reports: BarChart3,
  disputes: ShieldCheck,
  contracts: FileText,
  documentation: FileCheck,
  transactions: Search,
  payments: Calculator,
  team: Users,
  permissions: ShieldCheck,
  logs: MessageSquare,
};

export default function DepartmentFeaturePreviewDialog({
  open,
  onOpenChange,
  initialDepartment = "properties",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDepartment?: PreviewDepartmentKey;
}) {
  const { language, direction } = useLanguage();
  const [activeDepartment, setActiveDepartment] = useState<PreviewDepartmentKey>(initialDepartment);
  const [activeSection, setActiveSection] = useState<string>("dashboard");

  useEffect(() => {
    if (open) {
      setActiveDepartment(initialDepartment);
    }
  }, [initialDepartment, open]);

  const currentDepartment = useMemo(
    () => PREVIEW_DEPARTMENTS.find((department) => department.id === activeDepartment) || PREVIEW_DEPARTMENTS[0],
    [activeDepartment],
  );

  useEffect(() => {
    setActiveSection(currentDepartment.sections[0]?.id || "dashboard");
  }, [currentDepartment]);

  const currentSection =
    currentDepartment.sections.find((section) => section.id === activeSection) || currentDepartment.sections[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl rounded-[1.25rem] border border bg-card p-0 overflow-hidden" dir={direction}>
        <div className="border-b border bg-slate-950 px-6 py-5 text-white">
          <DialogHeader className="space-y-2 text-right">
            <DialogTitle className="text-2xl font-black">
              {language === "ar" ? "معاينة الأقسام قبل الاشتراك" : "Department Preview Before Subscription"}
            </DialogTitle>
            <DialogDescription className="text-sm font-bold text-white/70">
              {language === "ar"
                ? "هذه معاينة للخصائص والواجهات فقط. لا يمكن إنشاء أو تعديل أي بيانات من هنا."
                : "This is a read-only preview of features and interfaces. No data can be created or edited here."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-0 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="border-b border bg-muted p-4 lg:border-b-0 lg:border-l">
            <div className="space-y-2">
              {PREVIEW_DEPARTMENTS.map((department) => {
                const Icon = department.icon;
                const active = department.id === currentDepartment.id;
                return (
                  <button
                    key={department.id}
                    type="button"
                    onClick={() => setActiveDepartment(department.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-right transition-colors ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border bg-card text-slate-700 hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Icon className="h-5 w-5 shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black">
                          {language === "ar" ? department.titleAr : department.titleEn}
                        </div>
                        <div className={`mt-1 truncate text-[11px] font-bold ${active ? "text-white/70" : "text-slate-400"}`}>
                          {language === "ar" ? "عرض فقط" : "Preview only"}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="p-6">
            <div className="rounded-[1rem] border border bg-muted p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2 text-right">
                  <div className="text-2xl font-black text-slate-950">
                    {language === "ar" ? currentDepartment.titleAr : currentDepartment.titleEn}
                  </div>
                  <p className="text-sm font-bold text-slate-500">
                    {language === "ar" ? currentDepartment.subtitleAr : currentDepartment.subtitleEn}
                  </p>
                </div>
                <div className="rounded-2xl border border-dashed border-slate-300 bg-card px-4 py-3 text-[11px] font-black text-slate-500">
                  {language === "ar" ? "وضع استعراض بدون إنشاء أو تعديل" : "Read-only mode with no create or edit actions"}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(language === "ar" ? currentDepartment.featuresAr : currentDepartment.featuresEn).map((feature) => (
                  <span key={feature} className="rounded-full border border bg-card px-3 py-2 text-[11px] font-black text-slate-700">
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 text-xs font-black text-slate-400">
                {language === "ar" ? "أقسام المعاينة" : "Preview sections"}
              </div>
              <div className="flex flex-wrap gap-2">
                {currentDepartment.sections.map((section) => {
                  const Icon = SECTION_ICONS[section.id] || LayoutDashboard;
                  const active = section.id === currentSection.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-black transition-colors ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border bg-card text-slate-700 hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{language === "ar" ? section.titleAr : section.titleEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-[1rem] border border bg-card p-5 shadow-sm">
                <div className="mb-2 text-lg font-black text-slate-950">
                  {language === "ar" ? currentSection.titleAr : currentSection.titleEn}
                </div>
                <p className="text-sm font-bold text-slate-500">
                  {language === "ar" ? currentSection.descriptionAr : currentSection.descriptionEn}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((index) => (
                    <div key={index} className="rounded-2xl border border bg-muted p-4">
                      <div className="text-xs font-black text-slate-400">
                        {language === "ar" ? `بطاقة عرض ${index}` : `Preview card ${index}`}
                      </div>
                      <div className="mt-2 h-3 w-2/3 rounded-full bg-muted" />
                      <div className="mt-3 space-y-2">
                        <div className="h-2.5 rounded-full bg-muted" />
                        <div className="h-2.5 w-5/6 rounded-full bg-muted" />
                        <div className="h-2.5 w-3/4 rounded-full bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1rem] border border bg-muted p-5">
                  <div className="text-sm font-black text-slate-950">
                    {language === "ar" ? "ما الذي ستحصل عليه" : "What you will get"}
                  </div>
                  <div className="mt-3 space-y-2">
                    {(language === "ar" ? currentDepartment.featuresAr : currentDepartment.featuresEn).slice(0, 4).map((feature) => (
                      <div key={feature} className="rounded-2xl bg-card px-3 py-3 text-sm font-bold text-slate-700">
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1rem] border border-dashed border-slate-300 bg-card p-5">
                  <div className="text-sm font-black text-slate-950">
                    {language === "ar" ? "بعد تفعيل الاشتراك" : "After subscription activation"}
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    {language === "ar"
                      ? "تظهر لك الواجهة الكاملة للقسم مع الصلاحيات المناسبة لخطة الاشتراك."
                      : "You will get the full department workspace with the permissions allowed by your subscription."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
