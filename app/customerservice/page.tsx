"use client";

import React, { useEffect, useState } from "react";
import {
  Twitter, Mail, MessageCircle, Phone,
  Send,
  X,
  ChevronLeft, ArrowRight, CheckCircle2, AlertCircle, MessageSquare
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { customerServiceFeedbackApi, type CustomerServiceFeedback } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";

function getXProfileUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "#";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://x.com/${trimmed.replace(/^@/, "")}`;
}

function getXDisplayHandle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const path = trimmed.replace(/\/+$/, "").split("/").pop();
    return path ? `@${path}` : trimmed;
  }
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export function CustomerServicePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { isOpen, message, isAdmin } = useSectionGuard('customerservice');
  const { settings } = useSettings();

  const [question, setQuestion] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");
  const [type, setType] = useState<"complaint" | "inquiry" | "suggestion">("inquiry");
  const [name, setName] = useState("");
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARACTERS = 200;

  const [tickets, setTickets] = useState<CustomerServiceFeedback[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<CustomerServiceFeedback | null>(null);
  const [ticketReplyDrafts, setTicketReplyDrafts] = useState<Record<string, string>>({});
  const [replyingTicketId, setReplyingTicketId] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showSubmitNotice = (type: "success" | "error", message: string) => {
    setSubmitNotice({ type, message });
    window.setTimeout(() => setSubmitNotice(null), 4500);
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/details");
  };

  useEffect(() => {
    if (!user) return;
    setName((current) => current || `${user.firstName || ""} ${user.lastName || ""}`.trim());
    setEmail((current) => current || user.email || "");
    setPhoneNumber((current) => current || user.phone || "");
    if (user.email) setContactMethod("email");
    else if (user.phone) setContactMethod("phone");
  }, [user]);

  const refreshTickets = async () => {
    if (!isAuthenticated) return;
    setTicketsLoading(true);
    try {
      const res = await customerServiceFeedbackApi.listMine();
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    refreshTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Admin management is now in /admin/customer-service

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARACTERS) {
      setQuestion(text);
      setCharCount(text.length);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      try {
        await customerServiceFeedbackApi.create({
          name,
          contactMethod,
          email: contactMethod === 'email' ? email : undefined,
          phoneNumber: contactMethod === 'phone' ? phoneNumber : undefined,
          type,
          question,
          pagePath: '/customerservice',
        });
        showSubmitNotice("success", t('cs.alert.success'));
        setQuestion("");
        if (!user) {
          setEmail("");
          setPhoneNumber("");
          setName("");
        }
        setCharCount(0);
        await refreshTickets();
      } catch (err: any) {
        showSubmitNotice("error", language === 'ar' ? 'فشل إرسال الرسالة. حاول مرة أخرى.' : 'Failed to send. Please try again.');
      }
    })();
  };

  const submitTicketReply = async (ticketId: string) => {
    const reply = (ticketReplyDrafts[ticketId] || "").trim();
    if (!reply) return;
    setReplyingTicketId(ticketId);
    try {
      await customerServiceFeedbackApi.replyAsUser(ticketId, reply);
      setTicketReplyDrafts((current) => ({ ...current, [ticketId]: "" }));
      await refreshTickets();
    } finally {
      setReplyingTicketId(null);
    }
  };

  const ticketStatusLabel = (status: CustomerServiceFeedback["status"]) => {
    if (status === "resolved") return language === "ar" ? "تم الحل" : "resolved";
    if (status === "replied") return language === "ar" ? "تم الرد" : "replied";
    if (status === "customer_replied") return language === "ar" ? "تم ردك" : "your reply sent";
    return language === "ar" ? "جديد" : "new";
  };

  const ticketStatusStyle = (status: CustomerServiceFeedback["status"]) => {
    if (status === "resolved") return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (status === "replied") return "bg-blue-50 text-blue-700 border-blue-100";
    if (status === "customer_replied") return "bg-indigo-50 text-indigo-700 border-indigo-100";
    return "bg-amber-50 text-amber-700 border-amber-100";
  };

  if (!isOpen) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-3 sm:p-6">
        <ComingSoonOverlay sectionName={t('cs.title')} message={message} isAdmin={isAdmin} />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-muted/50 pb-12 overflow-x-hidden" 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      style={{
        backgroundColor: settings.csBg || undefined,
        fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined
      }}
    >
      <AnimatePresence>
        {submitNotice && (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            className="fixed left-1/2 top-5 z-[10000] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
          >
            <div className={`flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-2xl shadow-stone-400 ${
              submitNotice.type === "success" ? "border-emerald-100" : "border-red-100"
            }`} style={{ backgroundColor: settings.csCardBg || undefined }}>
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                submitNotice.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              }`}>
                {submitNotice.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-950">
                  {submitNotice.type === "success" ? (language === "ar" ? "تم الإرسال" : "Sent") : (language === "ar" ? "تعذر الإرسال" : "Failed")}
                </p>
                <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{submitNotice.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitNotice(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-muted hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Header Container */}
      <section className="bg-card border-b border mb-12 p-4 sm:p-8 md:p-12 rounded-b-[1.25rem] text-slate-900 shadow-sm relative overflow-hidden" style={{ backgroundColor: settings.csCardBg || undefined }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <button
                type="button"
                onClick={handleBack}
                className="mb-8 inline-flex h-11 items-center gap-2 rounded-2xl border border bg-muted px-4 text-[11px] font-black text-slate-700 transition-all hover:border hover:bg-card hover:text-slate-950"
              >
                {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                {language === 'ar' ? 'رجوع' : 'Back'}
              </button>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-3">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted border border text-[9px] font-black uppercase tracking-[0.2em] text-slate-600"
                      >

                      </motion.div>
                      <motion.h1
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-2xl md:text-2xl sm:text-4xl font-black tracking-tight leading-tight text-slate-950"
                      >
                          {t('cs.title')}
                      </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                      className="text-slate-500 font-medium text-sm md:text-base leading-relaxed"
                  >
                        نحن هنا للإجابة على جميع استفساراتكم. فريقنا المختص جاهز لتقديم الدعم العقاري على مدار الساعة.
                      </motion.p>
                  </div>


              </div>
          </div>
      </section>

      <div className="max-w-7xl mx-auto px-6">
          {/* Contact Channels Grid */}
          {settings.uiFlags?.show_cs_channels !== false && (
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              {[
                settings.contactPhone?.trim()
                  ? { id: 'phone', href: `tel:${settings.contactPhone}`, icon: Phone, color: 'text-slate-900', bg: 'bg-muted', title: t('cs.contactNum'), val: settings.contactPhone }
                  : null,
                { id: 'email', href: `mailto:${settings.contactEmail}`, icon: Mail, color: 'text-slate-900', bg: 'bg-muted', title: t('cs.email'), val: settings.contactEmail },
                { id: 'x', href: getXProfileUrl(settings.contactTwitter), icon: X, color: 'text-slate-900', bg: 'bg-muted', title: 'X', val: getXDisplayHandle(settings.contactTwitter) }
              ].filter((item): item is NonNullable<typeof item> => Boolean(item)).map((item) => {
                const Icon = item.icon;
                return (
                  <motion.a
                    key={item.id}
                    whileHover={{ y: -5 }}
                    href={item.href}
                    className="group flex-1 min-w-[250px] max-w-[350px] p-4 sm:p-8 rounded-3xl bg-card border border shadow-sm flex flex-col items-center text-center transition-all"
                    style={{ backgroundColor: settings.csCardBg || undefined }}
                  >
                    <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-4 transition-all`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-400 font-bold font-mono" dir="ltr">{item.val}</p>
                  </motion.a>
                );
              })}
            </div>
          )}

          {!isAuthenticated && (
            <section className="mb-12 rounded-[1.25rem] border border bg-card p-4 sm:p-8 shadow-sm flex flex-col items-center text-center justify-center py-6 sm:py-12" style={{ backgroundColor: settings.csCardBg || undefined }}>
              <div className="w-14 h-14 rounded-2xl bg-muted text-slate-400 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-slate-700" />
              </div>
              <h2 className="text-sm font-black text-slate-900 mb-1">
                {language === "ar" ? "عرض رسائلك واستفساراتك" : "View your messages & inquiries"}
              </h2>
              <p className="text-xs text-slate-400 font-bold max-w-sm mb-5">
                {language === "ar" 
                  ? "يرجى تسجيل الدخول لمتابعة الردود ومراسلة الدعم الفني بشكل مباشر." 
                  : "Please log in to track replies and message customer support directly."}
              </p>
              <Button
                type="button"
                className="h-11 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest px-6"
                onClick={() => router.push(`/login?redirect=/customerservice`)}
              >
                {language === "ar" ? "تسجيل الدخول" : "Log In"}
              </Button>
            </section>
          )}

          {isAuthenticated && (
            <section className="mb-12 rounded-[1.25rem] border border bg-card p-3 sm:p-6 shadow-sm" style={{ backgroundColor: settings.csCardBg || undefined }}>
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900" style={{ color: settings.csTextColor || undefined, fontFamily: settings.csFontFamily || undefined }}>
                    {language === "ar" ? "الرسائل والاستفسارات" : "Messages & Inquiries"}
                  </h2>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {language === "ar" ? "تابع رسائلك واستفساراتك مع خدمة العملاء والردود عليها" : "Track your messages and inquiries with customer service"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  onClick={refreshTickets}
                  disabled={ticketsLoading}
                >
                  {ticketsLoading ? (language === "ar" ? "جار التحديث" : "Loading") : (language === "ar" ? "تحديث" : "Refresh")}
                </Button>
              </div>

              {ticketsLoading ? (
                <div className="rounded-2xl bg-muted py-10 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                  {language === "ar" ? "جار تحميل التذاكر..." : "Loading tickets..."}
                </div>
              ) : tickets.length === 0 ? (
                <div className="rounded-2xl bg-muted py-10 text-center text-xs font-black uppercase tracking-widest text-slate-300" style={{ backgroundColor: settings.csBg || undefined }}>
                  {language === "ar" ? "لا توجد رسائل بعد" : "No messages yet"}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-1 md:grid-cols-2">
                  {tickets.map((ticket) => (
                    <button
                      type="button"
                      key={ticket.id} 
                      onClick={() => setSelectedTicket(ticket)}
                      className="group rounded-2xl border border p-5 text-start transition-all hover:-translate-y-0.5 hover:border hover:shadow-lg hover:shadow-stone-400" 
                      style={{ 
                        backgroundColor: settings.csBg || undefined,
                        color: settings.csTextColor || undefined,
                        fontFamily: settings.csFontFamily || undefined
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-black text-slate-900">#{ticket.id.slice(0, 8)}</p>
                            <span className="text-[9px] font-black uppercase tracking-widest rounded bg-muted text-slate-500 px-1.5 py-0.5">
                              {ticket.type === 'complaint' ? (language === 'ar' ? 'شكوى' : 'Complaint') : ticket.type === 'suggestion' ? (language === 'ar' ? 'اقتراح' : 'Suggestion') : (language === 'ar' ? 'استفسار' : 'Inquiry')}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-sm font-bold leading-6 text-slate-500">{ticket.question}</p>
                        </div>
                        <MessageSquare className="h-5 w-5 shrink-0 text-slate-300 transition-colors group-hover:text-slate-600" />
                      </div>
                      <div className="mt-5 flex items-center justify-between gap-3 border-t border pt-4">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${ticketStatusStyle(ticket.status)}`}>
                          {ticketStatusLabel(ticket.status)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          <Dialog open={Boolean(selectedTicket)} onOpenChange={(open) => !open && setSelectedTicket(null)}>
            <DialogContent className="max-h-[85vh] w-[95vw] sm:max-w-2xl overflow-y-auto rounded-[1.25rem] p-0">
              {selectedTicket && (
                <>
                  <DialogHeader className="border-b border p-3 sm:p-6 text-start">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <DialogTitle className="text-lg font-black text-slate-950 flex items-center gap-2">
                          {language === "ar" ? "تذكرة الدعم" : "Support ticket"} #{selectedTicket.id.slice(0, 8)}
                          <span className="text-[9px] font-black uppercase tracking-widest rounded bg-muted text-slate-500 px-2 py-0.5 ml-2 border border">
                            {selectedTicket.type === 'complaint' ? (language === 'ar' ? 'شكوى' : 'Complaint') : selectedTicket.type === 'suggestion' ? (language === 'ar' ? 'اقتراح' : 'Suggestion') : (language === 'ar' ? 'استفسار' : 'Inquiry')}
                          </span>
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-xs font-bold text-slate-400">
                          {new Date(selectedTicket.createdAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                        </DialogDescription>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${ticketStatusStyle(selectedTicket.status)}`}>
                        {ticketStatusLabel(selectedTicket.status)}
                      </span>
                    </div>
                  </DialogHeader>

                  <div className="space-y-4 p-3 sm:p-6">
                    <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-muted p-4">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{language === "ar" ? "أنت" : "You"}</p>
                      <p className="whitespace-pre-wrap text-sm font-bold leading-7 text-slate-700">{selectedTicket.question}</p>
                    </div>
                    {selectedTicket.adminReply && (
                      <div className="ms-auto max-w-[88%] rounded-2xl rounded-tl-sm bg-blue-50 p-4">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-blue-600">{language === "ar" ? "خدمة العملاء" : "Customer service"}</p>
                        <p className="whitespace-pre-wrap text-sm font-bold leading-7 text-slate-700">{selectedTicket.adminReply}</p>
                        {selectedTicket.adminRepliedAt && <p className="mt-2 text-[10px] font-bold text-blue-400">{new Date(selectedTicket.adminRepliedAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}</p>}
                      </div>
                    )}
                    {selectedTicket.userReply && (
                      <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-muted p-4">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{language === "ar" ? "ردك الأخير" : "Your latest reply"}</p>
                        <p className="whitespace-pre-wrap text-sm font-bold leading-7 text-slate-700">{selectedTicket.userReply}</p>
                      </div>
                    )}
                  </div>

                  {selectedTicket.status !== "resolved" && (
                    <DialogFooter className="border-t border p-3 sm:p-6">
                      <div className="w-full rounded-2xl bg-muted p-3">
                        <Textarea
                          value={ticketReplyDrafts[selectedTicket.id] || ""}
                          onChange={(event) => setTicketReplyDrafts((current) => ({ ...current, [selectedTicket.id]: event.target.value }))}
                          className="min-h-24 rounded-xl border bg-card text-sm font-bold"
                          placeholder={language === "ar" ? "اكتب رسالة لخدمة العملاء..." : "Write a message to customer service..."}
                        />
                        <div className="mt-3 flex justify-end">
                          <Button
                            type="button"
                            disabled={replyingTicketId === selectedTicket.id || !(ticketReplyDrafts[selectedTicket.id] || "").trim()}
                            onClick={async () => {
                              await submitTicketReply(selectedTicket.id);
                              const refreshed = (await customerServiceFeedbackApi.listMine()).data;
                              setTickets(refreshed);
                              setSelectedTicket(refreshed.find((ticket) => ticket.id === selectedTicket.id) || null);
                            }}
                            className="h-10 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-black"
                          >
                            {replyingTicketId === selectedTicket.id ? (language === "ar" ? "جار الإرسال" : "Sending") : (language === "ar" ? "إرسال الرسالة" : "Send message")}
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </DialogFooter>
                  )}
                </>
              )}
            </DialogContent>
          </Dialog>

          <div className={`grid grid-cols-1 ${settings.uiFlags?.show_cs_form !== false && settings.uiFlags?.show_cs_faq !== false ? 'lg:grid-cols-2' : ''} gap-12`}>
              {/* Contact Form */}
              {settings.uiFlags?.show_cs_form !== false && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <h2 
                    className="text-lg font-black flex items-center gap-3"
                    style={{
                      color: settings.csTextColor || undefined,
                      fontFamily: settings.csFontFamily || undefined,
                    }}
                  >
                      <div 
                        className="p-2 rounded-xl text-white shadow-sm"
                        style={{
                          backgroundColor: settings.csTextColor || '#0f172a',
                        }}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      {t('cs.service')}
                  </h2>
                  <form 
                    onSubmit={handleSubmit} 
                    className="bg-card p-4 sm:p-8 rounded-3xl border border shadow-sm space-y-6" 
                    style={{ 
                      backgroundColor: settings.csCardBg || undefined,
                      color: settings.csTextColor || undefined,
                      fontFamily: settings.csFontFamily || undefined,
                    }}
                  >
                      <div className="space-y-2">
                          <Label 
                            className="text-[10px] font-black uppercase tracking-widest px-1 opacity-60"
                            style={{ color: settings.csTextColor || undefined }}
                          >
                            {t('cs.name')}
                          </Label>
                          <div className="relative group">
                              <Input
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  className="h-12 rounded-xl border bg-muted focus:border-slate-900 px-4 transition-all font-bold placeholder:text-slate-300"
                                  style={{
                                    color: settings.csTextColor || undefined,
                                    fontFamily: settings.csFontFamily || undefined,
                                    fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined,
                                  }}
                                  placeholder={t('cs.name')}
                              />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <Label 
                            className="text-[10px] font-black uppercase tracking-widest px-1 opacity-60"
                            style={{ color: settings.csTextColor || undefined }}
                          >
                            {language === 'ar' ? 'نوع الرسالة' : 'Message Type'}
                          </Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 bg-muted p-1.5 rounded-xl border border">
                              <button
                                  type="button"
                                  onClick={() => setType("inquiry")}
                                  className={`flex items-center justify-center gap-2 h-10 rounded-lg font-black text-[10px] uppercase transition-all`}
                                  style={{
                                      fontFamily: settings.csFontFamily || undefined,
                                      backgroundColor: type === "inquiry" ? (settings.csTextColor || '#0f172a') : 'transparent',
                                      color: type === "inquiry" ? (settings.csBg || '#ffffff') : undefined,
                                  }}
                              >
                                  {language === 'ar' ? 'استفسار' : 'Inquiry'}
                              </button>
                              <button
                                  type="button"
                                  onClick={() => setType("complaint")}
                                  className={`flex items-center justify-center gap-2 h-10 rounded-lg font-black text-[10px] uppercase transition-all`}
                                  style={{
                                      fontFamily: settings.csFontFamily || undefined,
                                      backgroundColor: type === "complaint" ? (settings.csTextColor || '#0f172a') : 'transparent',
                                      color: type === "complaint" ? (settings.csBg || '#ffffff') : undefined,
                                  }}
                              >
                                  {language === 'ar' ? 'شكوى' : 'Complaint'}
                              </button>
                              <button
                                  type="button"
                                  onClick={() => setType("suggestion")}
                                  className={`flex items-center justify-center gap-2 h-10 rounded-lg font-black text-[10px] uppercase transition-all`}
                                  style={{
                                      fontFamily: settings.csFontFamily || undefined,
                                      backgroundColor: type === "suggestion" ? (settings.csTextColor || '#0f172a') : 'transparent',
                                      color: type === "suggestion" ? (settings.csBg || '#ffffff') : undefined,
                                  }}
                              >
                                  {language === 'ar' ? 'اقتراح' : 'Suggestion'}
                              </button>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <Label 
                            className="text-[10px] font-black uppercase tracking-widest px-1 opacity-60"
                            style={{ color: settings.csTextColor || undefined }}
                          >
                            طريقة التواصل المفضلة
                          </Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-muted p-1.5 rounded-xl border border">
                              <button
                                  type="button"
                                  onClick={() => setContactMethod("email")}
                                  className={`flex items-center justify-center gap-2 h-10 rounded-lg font-black text-[10px] uppercase transition-all`}
                                  style={{
                                      fontFamily: settings.csFontFamily || undefined,
                                      backgroundColor: contactMethod === "email" ? (settings.csTextColor || '#0f172a') : 'transparent',
                                      color: contactMethod === "email" ? (settings.csBg || '#ffffff') : undefined,
                                  }}
                              >
                                  <Mail className="w-3.5 h-3.5" />
                                  البريد
                              </button>
                              <button
                                  type="button"
                                  onClick={() => setContactMethod("phone")}
                                  className={`flex items-center justify-center gap-2 h-10 rounded-lg font-black text-[10px] uppercase transition-all`}
                                  style={{
                                      fontFamily: settings.csFontFamily || undefined,
                                      backgroundColor: contactMethod === "phone" ? (settings.csTextColor || '#0f172a') : 'transparent',
                                      color: contactMethod === "phone" ? (settings.csBg || '#ffffff') : undefined,
                                  }}
                              >
                                  <Phone className="w-3.5 h-3.5" />
                                  الجوال
                              </button>
                          </div>
                      </div>

                      {contactMethod === "email" ? (
                          <div className="space-y-3">
                              <Label 
                                className="text-xs font-black uppercase tracking-widest px-1 opacity-60"
                                style={{ color: settings.csTextColor || undefined }}
                              >
                                {t('cs.email')}
                              </Label>
                              <Input
                                  type="email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="h-16 rounded-[1rem] border bg-muted/50 focus:ring-4 focus:ring-indigo-100 px-6 transition-all font-bold"
                                  style={{
                                    color: settings.csTextColor || undefined,
                                    fontFamily: settings.csFontFamily || undefined,
                                    fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined,
                                  }}
                                  placeholder="name@example.com"
                                  dir="ltr"
                              />
                          </div>
                      ) : (
                          <div className="space-y-3">
                              <Label 
                                className="text-xs font-black uppercase tracking-widest px-1 opacity-60"
                                style={{ color: settings.csTextColor || undefined }}
                              >
                                {t('cs.phone')}
                              </Label>
                              <Input
                                  type="tel"
                                  value={phoneNumber}
                                  onChange={(e) => setPhoneNumber(e.target.value)}
                                  className="h-16 rounded-[1rem] border bg-muted/50 focus:ring-4 focus:ring-indigo-100 px-6 transition-all font-bold"
                                  style={{
                                    color: settings.csTextColor || undefined,
                                    fontFamily: settings.csFontFamily || undefined,
                                    fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined,
                                  }}
                                  placeholder="05xxxxxxxx"
                                  dir="ltr"
                              />
                          </div>
                      )}

                      <div className="space-y-2">
                          <Label 
                            className="text-[10px] font-black uppercase tracking-widest px-1 opacity-60"
                            style={{ color: settings.csTextColor || undefined }}
                          >
                            {type === 'complaint' 
                              ? (language === 'ar' ? 'تفاصيل الشكوى...' : 'Complaint details...') 
                              : type === 'suggestion' 
                                ? (language === 'ar' ? 'اكتب اقتراحك هنا...' : 'Write your suggestion here...')
                                : t('cs.placeholder.inquiry')}
                          </Label>
                          <div className="relative">
                            <Textarea
                                value={question}
                                onChange={handleQuestionChange}
                                className="min-h-[120px] rounded-xl border bg-muted focus:border-slate-900 p-4 transition-all font-bold resize-none"
                                style={{
                                  color: settings.csTextColor || undefined,
                                  fontFamily: settings.csFontFamily || undefined,
                                  fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined,
                                }}
                            />
                            <div className="absolute bottom-3 left-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                {charCount}/{MAX_CHARACTERS}
                             </div>
                          </div>
                      </div>

                      <Button
                          type="submit"
                          disabled={!question.trim() || !name.trim() || (contactMethod === "email" ? !email.trim() : !phoneNumber.trim()) || charCount > MAX_CHARACTERS}
                          className="w-full h-12 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all active:scale-[0.98] gap-2"
                          style={{
                            backgroundColor: settings.csTextColor || '#0f172a',
                            color: settings.csBg || '#ffffff',
                            fontFamily: settings.csFontFamily || undefined,
                          }}
                      >
                          {t('cs.submit')}
                          <Send className="w-3.5 h-3.5 ml-2" />
                      </Button>
                  </form>
                </motion.div>
              )}
          </div>
      </div>

      {/* FAQ admin management moved to /admin/customer-service */}

      {/* Navigation Floating Button */}
      {user?.role === "admin" && (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => router.push('/details')}
        className="fixed bottom-8 left-8 w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-2xl z-50 group border border-white/10"
      >
        <div className="absolute inset-0 bg-indigo-600 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 -z-10" />
        <ChevronLeft className={`w-8 h-8 ${language === 'ar' ? 'rotate-180' : ''}`} />
      </motion.button>
      )}
    </div>
  );
}

export default function CustomerService() {
  return <CustomerServicePage />;
}
