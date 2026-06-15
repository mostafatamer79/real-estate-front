"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  MapPin, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle, 
  FileText,
  Eye,
  Key,
  Users,
  MessageSquare
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { adminApi } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

export default function VisitRequestsPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const isRtl = language === "ar";

  const handleOpenChat = async (targetUserId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/rooms/direct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/chat/${data.id}`);
      } else {
        toast.error(isRtl ? "فشل فتح المحادثة" : "Failed to open chat");
      }
    } catch (error) {
      console.error(error);
      toast.error(isRtl ? "حدث خطأ أثناء فتح المحادثة" : "Error opening chat");
    }
  };

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visitTypeFilter, setVisitTypeFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getVisitRequests();
      if (res.data) {
        setRequests(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch visit requests", error);
      toast.error(t('admin.error.fetch_failed') || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await adminApi.updateVisitStatus(id, status);
      toast.success(t('admin.success.update_status') || "Status updated successfully");
      fetchRequests();
    } catch (error) {
      console.error("Failed to update status", error);
      toast.error(t('admin.error.update_failed') || "Failed to update status");
    }
  };

  const filteredRequests = requests.filter(req => {
    const query = search.trim().toLowerCase();
    const createdAt = req.createdAt ? new Date(req.createdAt) : null;
    const matchesSearch = !query ||
      req.offer?.propertyType?.toLowerCase().includes(query) ||
      req.offer?.city?.toLowerCase().includes(query) ||
      req.user?.firstName?.toLowerCase().includes(query) ||
      req.user?.lastName?.toLowerCase().includes(query) ||
      req.id?.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const matchesVisitType = visitTypeFilter === "all" || req.visitType === visitTypeFilter;
    const matchesAssignment =
      assignmentFilter === "all" ||
      (assignmentFilter === "assigned" && Boolean(req.agent)) ||
      (assignmentFilter === "unassigned" && !req.agent);
    const matchesFrom = !dateFrom || (createdAt && createdAt >= new Date(dateFrom));
    const matchesTo = !dateTo || (createdAt && createdAt <= new Date(`${dateTo}T23:59:59`));
    return matchesSearch && matchesStatus && matchesVisitType && matchesAssignment && matchesFrom && matchesTo;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Scheduled</Badge>;
      case 'completed': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Completed</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Cancelled</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 mb-2">
            {t('admin.visits.title') || "Visit Requests"}
          </h1>
          <p className="text-slate-500 font-medium">
            {t('admin.visits.desc') || "Manage property visit requests"}
          </p>
        </div>
        <div className="grid w-full gap-3 md:w-auto md:grid-cols-6">
        <div className="relative md:col-span-2">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
                type="text" 
                placeholder={t('admin.search') || "Search..."} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 w-full md:w-64"
             />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold">
          <option value="all">كل الحالات</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={visitTypeFilter} onChange={(e) => setVisitTypeFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold">
          <option value="all">كل الزيارات</option>
          <option value="agent">Agent</option>
          <option value="self">Self</option>
        </select>
        <select value={assignmentFilter} onChange={(e) => setAssignmentFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold">
          <option value="all">كل التعيينات</option>
          <option value="assigned">Assigned</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); setVisitTypeFilter("all"); setAssignmentFilter("all"); setDateFrom(""); setDateTo(""); }} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-black">
          مسح
        </button>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold" />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="py-5 font-black text-slate-900">ID</TableHead>
              <TableHead className="py-5 font-black text-slate-900">User</TableHead>
              <TableHead className="py-5 font-black text-slate-900">Property</TableHead>
              <TableHead className="py-5 font-black text-slate-900">Visit Type</TableHead>
              <TableHead className="py-5 font-black text-slate-900">Agent</TableHead>
              <TableHead className="py-5 font-black text-slate-900">Status</TableHead>
              <TableHead className="py-5 font-black text-slate-900">Date</TableHead>
              <TableHead className="text-right py-5 font-black text-slate-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">Loading...</TableCell>
                </TableRow>
            ) : filteredRequests.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-slate-500">No requests found</TableCell>
                </TableRow>
            ) : (
                filteredRequests.map((req) => (
                <TableRow key={req.id} className="hover:bg-slate-50/50 group whitespace-nowrap">
                    <TableCell className="font-mono text-xs text-slate-500">#{req.id.substring(0, 8)}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <User className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-700">{req.user?.firstName} {req.user?.lastName}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-900">{req.offer?.propertyType} - {req.offer?.city}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                         <div className="flex items-center gap-2">
                             {req.visitType === 'agent' ? <Users className="w-4 h-4 text-purple-500" /> : <Key className="w-4 h-4 text-slate-500" />}
                             <span className="text-sm font-bold capitalize">{req.visitType || 'Self'}</span>
                         </div>
                    </TableCell>
                    <TableCell>
                        {req.agent ? (
                            <span className="text-slate-700 font-medium">{req.agent.firstName} {req.agent.lastName}</span>
                        ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                        )}
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-slate-500 text-xs">
                        {new Date(req.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                             {req.status === 'pending' && (
                                <>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full text-green-600 hover:bg-green-50" onClick={() => handleStatusUpdate(req.id, 'accepted')}>
                                        <CheckCircle className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full text-red-600 hover:bg-red-50" onClick={() => handleStatusUpdate(req.id, 'rejected')}>
                                        <XCircle className="w-4 h-4" />
                                    </Button>
                                </>
                             )}
                             {(req.user?.id || req.userId) && (
                                 <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-500 hover:bg-slate-100" onClick={() => handleOpenChat(req.user?.id || req.userId)} title={isRtl ? "مراسلة العميل" : "Message Client"}>
                                     <MessageSquare className="w-4 h-4" />
                                 </Button>
                             )}
                             <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-400 hover:bg-slate-100">
                                 <Eye className="w-4 h-4" />
                             </Button>
                        </div>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
