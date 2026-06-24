"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Scale, ShieldCheck, CheckCircle2, ChevronDown, Lock, Server, FileText, Landmark, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { infoContentApi, InfoTab, InfoBlock } from "@/lib/api";
import { DEFAULT_INFO_TABS, DEFAULT_INFO_BLOCKS } from "@/lib/default-info-content";

// ─── Animation Variants ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

// ─── Reusable Components ───────────────────────────────────────────────────

function SectionHeader({ title, icon: Icon, colorClass }: { title: string; icon: any; colorClass?: string }) {
  return (
    <motion.div variants={itemVariants} className="flex items-center gap-3 mb-4 mt-8">
      <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-base font-black text-slate-900 tracking-tight">{title}</h3>
    </motion.div>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <motion.p variants={itemVariants} className="text-sm font-medium text-slate-600 leading-relaxed mb-4">
      {children}
    </motion.p>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <motion.ul variants={itemVariants} className="space-y-3 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <span className="text-sm font-medium text-slate-700 leading-relaxed">{item}</span>
        </li>
      ))}
    </motion.ul>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "terms" | "privacy";
  hideTabs?: boolean;
}

export function TermsPrivacyModal({ isOpen, onClose, defaultTab = "terms", hideTabs = false }: TermsPrivacyModalProps) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(defaultTab);
  const [tabs, setTabs] = useState<InfoTab[]>([]);
  const [blocks, setBlocks] = useState<InfoBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setLoading(true);
      infoContentApi.getAll().then((res) => {
        setTabs(res.data?.tabs || []);
        setBlocks(res.data?.blocks || []);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [isOpen, defaultTab]);

  const currentTab = tabs.find(t => t.key === activeTab) || DEFAULT_INFO_TABS.find(t => t.key === activeTab);
  let currentBlocks = currentTab ? blocks.filter(b => b.tabId === (currentTab as any).id).sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0)) : [];

  if (currentBlocks.length === 0) {
    currentBlocks = DEFAULT_INFO_BLOCKS.filter(b => b.tabKey === activeTab).sort((a,b) => a.sortOrder - b.sortOrder).map(b => ({
      id: `default-${Math.random()}`,
      tabId: (currentTab as any)?.id || activeTab,
      labelAr: b.labelAr,
      labelEn: b.labelEn,
      textAr: b.textAr,
      textEn: b.textEn,
      sortOrder: b.sortOrder
    })) as any;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-[2rem] gap-0 outline-none" dir="rtl">
        {/* Header / Tabs */}
        <div className={`bg-slate-900 px-6 pt-6 ${hideTabs ? 'pb-6' : 'pb-0'} flex flex-col items-center relative overflow-hidden shrink-0`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500 rounded-full blur-[100px]" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500 rounded-full blur-[100px]" />
          </div>

          <div className={`flex items-center gap-3 relative z-10 ${hideTabs ? '' : 'mb-6'}`}>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-white tracking-tight">السياسات والأحكام</DialogTitle>
              <DialogDescription className="text-xs font-bold text-slate-400 mt-1">منصة الوساطة الرقمية</DialogDescription>
            </div>
          </div>

          {!hideTabs && (
            <div className="flex gap-2 relative z-10">
              {[
                { id: "terms", label: "شروط الاستخدام", icon: FileText },
                { id: "privacy", label: "سياسة الخصوصية", icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-t-2xl text-sm font-black uppercase tracking-widest transition-all",
                      isActive
                        ? "bg-white text-slate-900 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
                        : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Wrapper for Fixed Background */}
        <div 
          className="relative w-full overflow-hidden"
          style={{
            backgroundImage: "url('/cover.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Subtle overlay to guarantee readability of text */}
          <div className="absolute inset-0 bg-white/20 pointer-events-none z-0" />
          
          {/* Scrollable Content Area */}
          <div className="p-8 pb-10 max-h-[70vh] overflow-y-auto w-full custom-scrollbar relative z-10 bg-transparent">
            <AnimatePresence mode="wait">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                </div>
              ) : currentBlocks.length > 0 ? (
                <motion.div
                  key={activeTab}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="max-w-3xl mx-auto"
                >
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-slate-900 mb-2">
                      {currentTab?.titleAr || (activeTab === "terms" ? "شروط الاستخدام" : "سياسة الخصوصية")}
                    </h1>
                  </div>

                  {currentBlocks.map((block) => (
                    <div key={block.id}>
                      {block.labelAr && <SectionHeader title={block.labelAr} icon={FileText} />}
                      {block.textAr.split('\n').map((line, idx) => {
                        if (!line.trim()) return null;
                        if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                          return <List key={idx} items={[line.replace(/^[-*]/, '').trim()]} />;
                        }
                        return <Paragraph key={idx}>{line}</Paragraph>;
                      })}
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="max-w-3xl mx-auto text-center text-slate-500 py-10"
                >
                  لا يوجد محتوى متاح حالياً.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            إغلاق
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
