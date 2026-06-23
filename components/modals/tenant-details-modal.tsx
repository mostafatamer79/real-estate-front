"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TenantProfile, Lease, Payment } from "@/types/api";
import { useLanguage } from "@/context/LanguageContext";
import { User, Phone, Mail, Building, FileText, Calendar, Hash } from "lucide-react";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";

interface TenantDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: TenantProfile | null;
    leases: Lease[];
    payments: Payment[];
}

export default function TenantDetailsModal({ isOpen, onClose, tenant, leases, payments }: TenantDetailsModalProps) {
    const { t, language } = useLanguage();

    if (!isOpen || !tenant) return null;

    const tenantLeases = leases.filter(l => l.tenantId === tenant.id);
    const tenantPayments = payments.filter(p => p.lease?.tenantId === tenant.id);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-blue-600">
                            <User className="w-6 h-6" />
                        </div>
                        {tenant.fullName}
                    </DialogTitle>
                    <DialogDescription>
                        {tenant.phoneNumber} - {tenant.email || t('chat.noEmail')}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 border-b pb-2">{t('bm.legal.serviceDesc')}</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-gray-100">
                                <Phone className="w-4 h-4 text-blue-500" />
                                <div>
                                    <p className="text-xs text-gray-400 font-bold">{t('bm.offer.phone')}</p>
                                    <p className="font-semibold text-gray-900">{tenant.phoneNumber}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-gray-100">
                                <Mail className="w-4 h-4 text-blue-500" />
                                <div>
                                    <p className="text-xs text-gray-400 font-bold">{t('chat.email')}</p>
                                    <p className="font-semibold text-gray-900">{tenant.email || '---'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-gray-100">
                                <Hash className="w-4 h-4 text-blue-500" />
                                <div>
                                    <p className="text-xs text-gray-400 font-bold">{t('bm.users.idNumber') || 'ID Number'}</p>
                                    <p className="font-semibold text-gray-900">{tenant.idNumber || '---'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lease Info Summary */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 border-b pb-2">{t('pm.tab.leases')}</h3>
                        {tenantLeases.length === 0 ? (
                            <p className="text-gray-500 italic text-sm py-4">{t('bm.list.empty')}</p>
                        ) : (
                            <div className="space-y-3">
                                {tenantLeases.map(lease => (
                                    <div key={lease.id} className="p-3 bg-slate-50 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Building className="w-4 h-4 text-blue-600" />
                                            <p className="font-bold text-blue-900 text-sm">{lease.unit?.property?.name || '---'} - Unit {lease.unit?.unitNumber}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <p className="text-blue-500 font-bold uppercase">{t('pm.field.rentAmount')}</p>
                                                <p className="font-black text-blue-800">{lease.annualRent != null ? <SaudiRiyalAmount amount={lease.annualRent} locale="en-US" /> : null}</p>
                                            </div>
                                            <div>
                                                <p className="text-blue-500 font-bold uppercase">{t('pm.field.leaseEnd')}</p>
                                                <p className="font-black text-blue-800">{new Date(lease.endDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Payments History */}
                <div className="space-y-4 py-4">
                    <h3 className="text-lg font-bold text-gray-900 border-b pb-2">{t('pm.financial.desc')}</h3>
                    <div className="max-h-[200px] overflow-y-auto space-y-2">
                        {tenantPayments.length === 0 ? (
                            <p className="text-gray-500 italic text-sm py-4">{t('bm.list.empty')}</p>
                        ) : (
                            tenantPayments.map(payment => (
                                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${payment.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold">{new Date(payment.dueDate).toLocaleDateString()}</p>
                                            <p className="font-bold text-gray-900"><SaudiRiyalAmount amount={payment.amount} locale="en-US" /></p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${payment.status === 'paid' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-100'}`}>
                                        {t(`pm.status.${payment.status}`)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={onClose} className="rounded-xl px-8 h-12 font-bold">{t('common.close')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
