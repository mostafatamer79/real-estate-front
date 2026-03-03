"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  User, 
  Filter,
  ShoppingBag
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

export default function OrdersPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAllOrders();
      if (res.data) {
        setOrders(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch orders", error);
      toast.error(t('admin.error.fetch_failed') || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => 
    (filterType === "all" || order.type === filterType) &&
    (
        order.offer?.propertyType?.toLowerCase().includes(search.toLowerCase()) ||
        order.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        order.id.includes(search)
    )
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <Badge className="bg-green-100 text-green-700">Confirmed</Badge>;
      case 'paid': return <Badge className="bg-blue-100 text-blue-700">Paid</Badge>;
      case 'completed': return <Badge className="bg-purple-100 text-purple-700">Completed</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 mb-2">
            {t('admin.orders.title') || "All Orders"}
          </h1>
          <p className="text-slate-500 font-medium">
            {t('admin.orders.desc') || "View all purchase and visit orders"}
          </p>
        </div>
        <div className="flex gap-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder={t('admin.search') || "Search..."} 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 w-64"
                />
            </div>
            <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
                <option value="all">All Types</option>
                <option value="purchase">Purchase</option>
                <option value="visit">Visit</option>
            </select>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="py-5 font-black text-slate-900">Order ID</TableHead>
              <TableHead className="py-5 font-black text-slate-900">Type</TableHead>
              <TableHead className="py-5 font-black text-slate-900">User</TableHead>
              <TableHead className="py-5 font-black text-slate-900">Property</TableHead>
              <TableHead className="py-5 font-black text-slate-900">Amount</TableHead>
              <TableHead className="py-5 font-black text-slate-900">Status</TableHead>
              <TableHead className="py-5 font-black text-slate-900">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">Loading...</TableCell>
                </TableRow>
            ) : filteredOrders.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-500">No orders found</TableCell>
                </TableRow>
            ) : (
                filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50/50 group whitespace-nowrap">
                    <TableCell className="font-mono text-xs text-slate-500">#{order.id.substring(0, 8)}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className={`capitalize ${order.type === 'purchase' ? 'text-purple-600 border-purple-200 bg-purple-50' : 'text-blue-600 border-blue-200 bg-blue-50'}`}>
                            {order.type}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <User className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-700">{order.user?.firstName} {order.user?.lastName}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-900">{order.offer?.propertyType} - {order.offer?.city}</span>
                        </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">
                        {order.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(Number(order.price)) : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-slate-500 text-xs">
                        {new Date(order.createdAt).toLocaleDateString()}
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
