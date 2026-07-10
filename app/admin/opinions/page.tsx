"use client";

import React, { useState, useEffect } from "react";
import { MessageSquareHeart, Check, Loader2, RefreshCw } from "lucide-react";
import { opinionApi, type Opinion } from "@/lib/api";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

export default function AdminOpinionsPage() {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchOpinions = async () => {
    setLoading(true);
    try {
      const data = await opinionApi.findAll();
      setOpinions(data);
    } catch (err) {
      toast.error("فشل في تحميل الآراء");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpinions();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    setMarkingId(id);
    try {
      await opinionApi.markAsRead(id);
      setOpinions(opinions.map(op => op.id === id ? { ...op, isRead: true } : op));
      toast.success("تم تحديد الرأي كمقروء");
    } catch (err) {
      toast.error("حدث خطأ أثناء التحديث");
    } finally {
      setMarkingId(null);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOpinions = opinions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(opinions.length / itemsPerPage);

  return (
    <div className="p-6 md:p-10 space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center">
            <MessageSquareHeart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">آراء العملاء</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">
              اطلع على آراء ومقترحات العملاء التي تم إرسالها عبر الموقع
            </p>
          </div>
        </div>
        <button
          onClick={fetchOpinions}
          className="flex items-center gap-2 px-4 py-2 bg-muted border border rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-muted transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="font-bold text-sm uppercase tracking-widest">جاري التحميل...</p>
        </div>
      ) : opinions.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3 bg-card rounded-3xl border border border-dashed">
          <MessageSquareHeart className="w-10 h-10 opacity-50" />
          <p className="font-bold text-sm">لا توجد آراء مسجلة حتى الآن</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentOpinions.map((opinion, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={opinion.id}
              className={`p-6 rounded-3xl border ${opinion.isRead ? 'bg-muted/50 border' : 'bg-card border shadow-md shadow-slate-50'} flex flex-col gap-4 relative overflow-hidden`}
            >
              {!opinion.isRead && (
                <div className="absolute top-0 right-0 w-2 h-full bg-slate-500"></div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">{opinion.name}</h3>
                  <p className="text-xs font-bold text-slate-500 mt-1" dir="ltr">{opinion.email || 'بدون بريد إلكتروني'}</p>
                </div>
                <div className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-muted px-2 py-1 rounded-lg">
                  {new Date(opinion.createdAt).toLocaleString('ar-SA')}
                </div>
              </div>
              <div className="flex-1 bg-muted rounded-2xl p-4 border border">
                <p className="text-sm font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {opinion.message}
                </p>
              </div>
              {!opinion.isRead && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleMarkAsRead(opinion.id)}
                    disabled={markingId === opinion.id}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {markingId === opinion.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    تحديد كمقروء
                  </button>
                </div>
              )}
            </motion.div>
          ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6 pb-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-5 py-2.5 bg-card border border rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                السابق
              </button>
              <div className="px-4 py-2.5 bg-muted rounded-xl text-xs font-black text-slate-700">
                الصفحة {currentPage} من {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 bg-card border border rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
