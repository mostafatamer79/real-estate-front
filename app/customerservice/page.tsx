"use client";

import React, { useState } from "react";
import {
  Twitter, Mail, MessageCircle, Phone,
  HelpCircle, ChevronDown, Send,
  User, ExternalLink, X, Building2, Sparkles,
  ChevronLeft, ArrowRight, ShieldCheck, Headphones,
  Search, Home, BadgeDollarSign, Tag
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqData } from "./faq-data";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomerService() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const categoryIcons: Record<string, React.ElementType> = {
    "أسئلة عامة": HelpCircle,
    "أسئلة البحث والعرض": Search,
    "أسئلة الشراء": ShieldCheck,
    "أسئلة الإيجار": Home,
    "أسئلة البيع": Tag,
    "أسئلة الدفع": BadgeDollarSign,
    "أسئلة الدعم": Headphones,
  };
 
  const [question, setQuestion] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");
  const [name, setName] = useState("");
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARACTERS = 200;

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARACTERS) {
      setQuestion(text);
      setCharCount(text.length);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t('cs.alert.success'));
    setQuestion("");
    setEmail("");
    setPhoneNumber("");
    setName("");
    setCharCount(0);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 overflow-x-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Premium Header Container */}
      <section className="bg-white border-b border-gray-100 mb-12 p-8 md:p-12 rounded-b-[3rem] text-slate-900 shadow-sm relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-3">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600"
                      >
                      
                      </motion.div>
                      <motion.h1 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-2xl md:text-4xl font-black tracking-tight leading-tight text-slate-950"
                      >
                          {t('cs.title')}
                      </motion.h1>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                          className="text-slate-500 font-medium text-sm md:text-base leading-relaxed whitespace-nowrap"
                      >
                        نحن هنا للإجابة على جميع استفساراتكم. فريقنا المختص جاهز لتقديم الدعم العقاري على مدار الساعة.
                      </motion.p>
                  </div>
                  
             
              </div>
          </div>
      </section>

      <div className="max-w-7xl mx-auto px-6">
          {/* Contact Channels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { id: 'phone', href: "tel:+966555555555", icon: Phone, color: 'text-slate-900', bg: 'bg-slate-50', title: t('cs.contactNum'), val: '+966 5 5555 5555' },
              { id: 'email', href: "mailto:Info@Deer_Aqarak.com", icon: Mail, color: 'text-slate-900', bg: 'bg-slate-50', title: t('cs.email'), val: 'Info@Deer_Aqarak.com' },
              { id: 'x', href: "https://x.com/Deer_Aqarak", icon: X, color: 'text-slate-900', bg: 'bg-slate-50', title: 'X', val: '@Deer_Aqarak' }
            ].map((item) => (
              <motion.a 
                key={item.id}
                whileHover={{ y: -5 }}
                href={item.href}
                className="group p-8 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center transition-all"
              >
                <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-4 transition-all`}>
                    <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-1">{item.title}</h3>
                <p className="text-xs text-slate-400 font-bold font-mono" dir="ltr">{item.val}</p>
              </motion.a>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900 text-white shadow-sm">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    {t('cs.service')}
                </h2>
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('cs.name')}</Label>
                        <div className="relative group">
                            <Input 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:border-slate-900 px-4 transition-all text-sm font-bold placeholder:text-slate-300"
                                placeholder={t('cs.name')}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">طريقة التواصل المفضلة</Label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                            <button
                                type="button"
                                onClick={() => setContactMethod("email")}
                                className={`flex items-center justify-center gap-2 h-10 rounded-lg font-black text-[10px] uppercase transition-all ${
                                    contactMethod === "email" 
                                    ? "bg-slate-900 text-white shadow-sm" 
                                    : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                <Mail className="w-3.5 h-3.5" />
                                البريد
                            </button>
                            <button
                                type="button"
                                onClick={() => setContactMethod("phone")}
                                className={`flex items-center justify-center gap-2 h-10 rounded-lg font-black text-[10px] uppercase transition-all ${
                                    contactMethod === "phone" 
                                    ? "bg-slate-900 text-white shadow-sm" 
                                    : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                <Phone className="w-3.5 h-3.5" />
                                الجوال
                            </button>
                        </div>
                    </div>

                    {contactMethod === "email" ? (
                        <div className="space-y-3">
                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('cs.email')}</Label>
                            <Input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-16 rounded-[1.5rem] border-slate-100 bg-slate-50/50 focus:ring-4 focus:ring-indigo-100 px-6 transition-all font-bold text-indigo-600"
                                placeholder="name@example.com"
                                dir="ltr"
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('cs.phone')}</Label>
                            <Input 
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="h-16 rounded-[1.5rem] border-slate-100 bg-slate-50/50 focus:ring-4 focus:ring-indigo-100 px-6 transition-all font-bold text-indigo-600"
                                placeholder="05xxxxxxxx"
                                dir="ltr"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('cs.placeholder.inquiry')}</Label>
                        <div className="relative">
                          <Textarea 
                              value={question}
                              onChange={handleQuestionChange}
                              className="min-h-[120px] rounded-xl border-slate-100 bg-slate-50 focus:border-slate-900 p-4 transition-all text-sm font-bold resize-none"
                          />
                          <div className="absolute bottom-3 left-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                              {charCount}/{MAX_CHARACTERS}
                          </div>
                        </div>
                    </div>

                    <Button 
                        type="submit"
                        disabled={!question.trim() || !name.trim() || (contactMethod === "email" ? !email.trim() : !phoneNumber.trim()) || charCount > MAX_CHARACTERS}
                        className="w-full h-12 bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all active:scale-[0.98] gap-2"
                    >
                        {t('cs.submit')}
                        <Send className="w-3.5 h-3.5 ml-2" />
                    </Button>
                </form>
              </motion.div>

              {/* FAQ Section */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900 text-white shadow-sm">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    الأسئلة المتكررة
                </h2>
                <div className="glass p-6 md:p-10 rounded-[3rem] bg-white/60 border-none shadow-2xl shadow-slate-200/50 space-y-8">
                  <Accordion type="multiple" className="w-full space-y-6">
                    {faqData.map((section, idx) => {
                      const CategoryIcon = categoryIcons[section.category] ?? Sparkles;
                      return (
                        <AccordionItem
                          key={idx}
                          value={`section-${idx}`}
                          className="border-none glass bg-white/50 rounded-[2.5rem] px-6 md:px-8 transition-all hover:bg-white"
                        >
                          <AccordionTrigger className="text-slate-600 font-black hover:no-underline text-right py-6 group">
                            <span className="flex items-center gap-3 flex-1 text-right ">
                              <CategoryIcon className="w-4 h-4" />
                              {section.category}
                            </span>
                            <span className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-all group-data-[state=open]:rotate-180">
                              <ChevronDown className="h-4 w-4" />
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-6">
                            <Accordion type="single" collapsible className="w-full space-y-4">
                              {section.items.map((item, itemIdx) => (
                                <AccordionItem
                                  key={itemIdx}
                                  value={`item-${idx}-${itemIdx}`}
                                  className="border-none glass bg-white/40 rounded-3xl px-6 transition-all hover:bg-white"
                                >
                                  <AccordionTrigger className="text-slate-900 font-bold hover:no-underline text-right py-6 group">
                                    <span className="flex-1 text-right">{item.question}</span>
                                    <span className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-all group-data-[state=open]:rotate-180">
                                      <ChevronDown className="h-4 h-4" />
                                    </span>
                                  </AccordionTrigger>
                                  <AccordionContent className="text-slate-500 font-medium leading-[1.8] text-right pb-6">
                                    {item.answer}
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              </motion.div>
          </div>
      </div>

      {/* Navigation Floating Button */}
      {user?.role === "admin" && (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => router.push('/admin/dashboard')}
        className="fixed bottom-8 left-8 w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-2xl z-50 group border border-white/10"
      >
        <div className="absolute inset-0 bg-indigo-600 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 -z-10" />
        <ChevronLeft className={`w-8 h-8 ${language === 'ar' ? 'rotate-180' : ''}`} />
      </motion.button>
      )}
    </div>
  );
}
