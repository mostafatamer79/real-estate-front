"use client";

import React, { useState, useEffect } from "react";
import { Send, CheckCircle2, ChevronRight, MessageSquareHeart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { opinionApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function ShareOpinionPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(`${user.firstName || ""} ${user.lastName || ""}`.trim());
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await opinionApi.create({ name, email, message });
      setIsSuccess(true);
      toast.success("تم إرسال رأيك بنجاح، شكراً لك!");
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err: any) {
      toast.error("فشل إرسال رأيك، يرجى المحاولة لاحقاً.");
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const inputClass = "w-full h-14 rounded-2xl border border bg-muted focus:bg-card focus:border-slate-900 px-5 text-sm font-bold text-slate-900 placeholder:text-slate-900 transition-all outline-none";
  const labelClass = "text-[10px] font-black uppercase tracking-widest text-slate-900 px-1";

  return (
    <section className="w-full min-h-screen bg-muted text-slate-950 flex flex-col font-sans overflow-x-hidden selection:bg-muted" dir="rtl">
      {/* Back nav */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-7xl mx-auto w-full px-6 pt-10"
      >
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-3 text-slate-500 hover:text-slate-950 transition-colors text-[10px] font-black uppercase tracking-[0.25em]"
        >
          <div className="w-8 h-8 rounded-full border border group-hover:border-slate-400 flex items-center justify-center transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
          العودة
        </button>
      </motion.div>

      {/* Hero */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pt-12 pb-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center mb-6 shadow-md">
            <MessageSquareHeart className="w-6 h-6" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] leading-[0.9] text-slate-950 mb-4">
            شاركنا رأيك
          </h1>
          <p className="text-slate-600 text-sm max-w-md leading-relaxed font-bold">
            ملاحظاتك ومقترحاتك تهمنا لتطوير تجربة أفضل لك ولجميع عملائنا في المنصة.
          </p>
        </motion.div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pb-24">
        {isSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card p-12 rounded-[1rem] border border shadow-sm text-center flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">شكراً لمشاركتنا رأيك!</h2>
            <p className="text-slate-500 font-bold mb-8">نحن نقدر وقتك واهتمامك، رأيك يساعدنا على تحسين خدماتنا باستمرار.</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative bg-card border border rounded-[1rem] p-8 sm:p-12 overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            <form onSubmit={handleSubmit} className="relative space-y-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className={labelClass}>
                    الاسم الكريم
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="الاسم الكامل"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>
                    البريد الإلكتروني (اختياري)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    className={`${inputClass} text-left`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>
                  رأيك أو مقترحك
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب رسالتك وتفاصيل مقترحك هنا..."
                  className="w-full min-h-[160px] rounded-2xl border border bg-muted focus:bg-card focus:border-slate-900 p-5 text-sm font-bold text-slate-900 placeholder:text-slate-900 transition-all outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !message.trim()}
                  className="h-14 px-8 bg-slate-950 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "جاري الإرسال..." : "إرسال الرأي"}
                  {!isSubmitting && <Send className="w-4 h-4 rtl:-scale-x-100" />}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </section>
  );
}
