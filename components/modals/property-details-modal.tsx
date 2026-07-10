"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Property, Unit, CreateUnitDto } from "@/types/api";
import { propertiesApi } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2, Plus, Home, Building, FileText, BedDouble, Ruler, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";

interface PropertyDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: Property | null;
    onUpdate?: () => void;
}

export default function PropertyDetailsModal({ isOpen, onClose, property, onUpdate }: PropertyDetailsModalProps) {
    const { t, language } = useLanguage();
    const { toast } = useToast();
    const confirmDialog = useConfirmDialog();
    const [activeTab, setActiveTab] = useState("units");
    const [units, setUnits] = useState<Unit[]>([]);
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [isCreatingUnit, setIsCreatingUnit] = useState(false);
    const [newUnit, setNewUnit] = useState<Partial<CreateUnitDto>>({
        unitNumber: '',
        roomsCount: 1,
        bathroomsCount: 1,
        area: 0,
        type: 'apartment',
        occupancyStatus: 'vacant',
        expectedVacancyDate: ''
    });

    useEffect(() => {
        if (isOpen && property) {
            fetchUnits();
        }
    }, [isOpen, property]);

    const fetchUnits = async () => {
        if (!property) return;
        setLoadingUnits(true);
        try {
            const res = await propertiesApi.getUnits(property.id);
            setUnits(res.data);
        } catch (error) {
            console.error(error);
            toast({
                title: t('common.error'),
                variant: 'destructive'
            });
        } finally {
            setLoadingUnits(false);
        }
    };

    const resetUnitForm = () => {
        setNewUnit({
            unitNumber: '',
            roomsCount: 1,
            bathroomsCount: 1,
            area: 0,
            type: 'apartment',
            occupancyStatus: 'vacant',
            expectedVacancyDate: ''
        });
    };

    const handleCreateUnit = async () => {
        if (!property || !newUnit.unitNumber) return;
        setIsCreatingUnit(true);
        try {
            await propertiesApi.createUnit({
                ...newUnit as CreateUnitDto,
                propertyId: property.id
            });
            toast({
                title: t('bm.request.success'),
                description: language === 'ar' ? 'تمت إضافة الوحدة بنجاح' : 'Unit created successfully'
            });
            await fetchUnits();
            resetUnitForm();
            onUpdate?.();
        } catch (error) {
            console.error(error);
            toast({
                title: t('common.error'),
                variant: 'destructive'
            });
        } finally {
            setIsCreatingUnit(false);
        }
    };

    const handleDeleteUnit = async (id: string) => {
        const ok = await confirmDialog({
            title: t('common.deleteConfirm'),
            confirmLabel: 'حذف',
            cancelLabel: 'إلغاء',
            destructive: true,
        });
        if (!ok) return;
        try {
            await propertiesApi.updateUnit(id, { propertyId: property?.id });
            toast({ title: "Delete Unit Not Implemented" });
        } catch (error) {
            console.error(error);
        }
    };

    if (!isOpen || !property) return null;

    const isRtl = language === 'ar';

    const unitTypeLabel = (type?: string) => {
        const map: Record<string, string> = {
            apartment: t('bm.prop.apt'),
            office: t('bm.prop.office'),
            shop: t('bm.prop.shop'),
            warehouse: t('property.type.warehouse'),
            building: t('property.type.building'),
            compound: t('property.type.compound'),
            land: t('property.type.land'),
        };
        return map[type || ''] || type || "---";
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[980px] max-h-[90vh] overflow-hidden border-none p-0 shadow-2xl" dir={isRtl ? 'rtl' : 'ltr'}>
                <DialogHeader className="border-b border bg-gradient-to-b from-white to-slate-50 px-6 py-5 sm:px-8">
                    <div className="flex items-start gap-4 pe-12">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-slate-700 shadow-sm">
                            <Building className="h-7 w-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="flex flex-wrap items-center gap-3 text-xl sm:text-2xl">
                                <span className="truncate">{property.name}</span>
                                <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-card px-3 py-1 text-sm font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
                                    <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                                    <span className="truncate">{property.deedNumber || "---"}</span>
                                </span>
                            </DialogTitle>
                            <DialogDescription className="mt-2 text-base">
                                {unitTypeLabel(property.type)}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-[1rem] border border bg-muted px-4 py-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t('offer.type')}</p>
                            <p className="mt-2 text-lg font-black text-slate-900">{unitTypeLabel(property.type)}</p>
                        </div>
                        <div className="rounded-[1rem] border border bg-muted px-4 py-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t('offer.deed')}</p>
                            <p className="mt-2 text-lg font-black text-slate-900">{property.deedNumber || "---"}</p>
                        </div>
                        <div className="rounded-[1rem] border border bg-muted px-4 py-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t('pm.field.purchasePrice')}</p>
                            <p className="mt-2 text-lg font-black text-slate-900">
                                {property.purchasePrice != null ? <SaudiRiyalAmount amount={property.purchasePrice} locale="en-US" /> : "---"}
                            </p>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 w-full">
                        <TabsList className="grid h-auto w-full grid-cols-1 md:grid-cols-2 rounded-2xl bg-muted p-1">
                            <TabsTrigger value="units" className="rounded-[1rem] py-3 font-black">{t('pm.tab.units')}</TabsTrigger>
                            <TabsTrigger value="details" className="rounded-[1rem] py-3 font-black">{t('offer.details')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="units" className="space-y-5 pt-5">
                            <div className="rounded-[1.25rem] border border bg-card p-5 shadow-sm">
                                <div className="mb-5 flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900">{t('pm.tab.units')}</h4>
                                        <p className="text-sm font-medium text-slate-500">
                                            {language === 'ar' ? 'تنسيق موحد لإضافة وحدة داخل الإدارة الداخلية.' : 'Unified add-unit popup pattern for internal property pages.'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-900 p-3 text-white">
                                        <Plus className="h-5 w-5" />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <Label className="mb-2 block text-base font-bold">{t('pm.unit.number')}</Label>
                                        <Input
                                            value={newUnit.unitNumber}
                                            onChange={(e) => setNewUnit({...newUnit, unitNumber: e.target.value})}
                                            placeholder="Unit 101"
                                            className="h-14 rounded-2xl border px-4 text-lg"
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-2 block text-base font-bold">{t('pm.field.unitType')}</Label>
                                        <select
                                            className="h-14 w-full rounded-2xl border border bg-card px-4 text-lg outline-none transition focus:border-slate-400"
                                            value={newUnit.type}
                                            onChange={(e) => setNewUnit({...newUnit, type: e.target.value as any})}
                                        >
                                            <option value="apartment">{t('bm.prop.apt')}</option>
                                            <option value="office">{t('bm.prop.office')}</option>
                                            <option value="shop">{t('bm.prop.shop')}</option>
                                            <option value="warehouse">{t('property.type.warehouse')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="mb-2 block text-base font-bold">{t('offer.rooms')}</Label>
                                        <Input
                                            type="number"
                                            value={newUnit.roomsCount}
                                            onChange={(e) => setNewUnit({...newUnit, roomsCount: Number(e.target.value)})}
                                            className="h-14 rounded-2xl border px-4 text-lg"
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-2 block text-base font-bold">{t('offer.area')} (m²)</Label>
                                        <Input
                                            type="number"
                                            value={newUnit.area}
                                            onChange={(e) => setNewUnit({...newUnit, area: Number(e.target.value)})}
                                            className="h-14 rounded-2xl border px-4 text-lg"
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-2 block text-base font-bold">{t('bm.field.occupancyStatus')}</Label>
                                        <select
                                            className="h-14 w-full rounded-2xl border border bg-card px-4 text-lg outline-none transition focus:border-slate-400"
                                            value={newUnit.occupancyStatus}
                                            onChange={(e) => setNewUnit({...newUnit, occupancyStatus: e.target.value as any})}
                                        >
                                            <option value="vacant">{t('bm.status.vacant')}</option>
                                            <option value="rented">{t('bm.status.rented')}</option>
                                            <option value="reserved">{t('bm.status.reserved')}</option>
                                            <option value="maintenance">{t('bm.status.maintenance')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="mb-2 block text-base font-bold">{t('pm.field.expectedVacancyDate')}</Label>
                                        <Input
                                            type="date"
                                            value={newUnit.expectedVacancyDate}
                                            onChange={(e) => setNewUnit({...newUnit, expectedVacancyDate: e.target.value})}
                                            className="h-14 rounded-2xl border px-4 text-lg"
                                        />
                                    </div>
                                    <div className="flex items-end md:col-span-2">
                                        <Button
                                            onClick={handleCreateUnit}
                                            disabled={isCreatingUnit}
                                            className="h-14 w-full rounded-2xl bg-slate-900 text-base font-black text-white hover:bg-slate-800"
                                        >
                                            {isCreatingUnit ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                                            <span>{language === 'ar' ? 'إضافة وحدة' : 'Add unit'}</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {loadingUnits ? (
                                <div className="rounded-[1.25rem] border border bg-card py-8 md:py-16 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-500" />
                                </div>
                            ) : units.length === 0 ? (
                                <div className="rounded-[1.25rem] border border-dashed border bg-muted py-8 md:py-16 text-center text-xl font-medium text-slate-500">
                                    {t('bm.list.empty')}
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {units.map((unit) => (
                                        <div key={unit.id} className="rounded-[1.25rem] border border bg-card p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-slate-700">
                                                        <Home className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-black text-slate-900">{unit.unitNumber}</h4>
                                                        <p className="mt-1 text-sm font-medium text-slate-500">{unitTypeLabel(unit.type)}</p>
                                                    </div>
                                                </div>

                                                <span className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider ${
                                                    unit.occupancyStatus === 'rented' ? 'bg-green-100 text-green-700' :
                                                    unit.occupancyStatus === 'reserved' ? 'bg-amber-100 text-amber-700' :
                                                    unit.occupancyStatus === 'maintenance' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-muted text-slate-700'
                                                }`}>
                                                    {t(`bm.status.${unit.occupancyStatus}`) || unit.occupancyStatus}
                                                </span>
                                            </div>

                                            <div className="mt-5 grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                                <div className="rounded-2xl bg-muted px-4 py-3">
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <BedDouble className="h-4 w-4" />
                                                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t('offer.rooms')}</span>
                                                    </div>
                                                    <p className="mt-2 text-base font-black text-slate-900">{unit.roomsCount || 0}</p>
                                                </div>
                                                <div className="rounded-2xl bg-muted px-4 py-3">
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <Ruler className="h-4 w-4" />
                                                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t('offer.area')}</span>
                                                    </div>
                                                    <p className="mt-2 text-base font-black text-slate-900">{unit.area || 0} m²</p>
                                                </div>
                                                <div className="rounded-2xl bg-muted px-4 py-3">
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <CalendarDays className="h-4 w-4" />
                                                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t('pm.field.expectedVacancyDate')}</span>
                                                    </div>
                                                    <p className="mt-2 text-base font-black text-slate-900">{unit.expectedVacancyDate || "---"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="details" className="pt-5">
                            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                                <div className="rounded-[1.25rem] border border bg-card p-5 shadow-sm">
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t('offer.type')}</span>
                                    <p className="mt-3 text-lg font-black text-slate-900">{unitTypeLabel(property.type)}</p>
                                </div>
                                <div className="rounded-[1.25rem] border border bg-card p-5 shadow-sm">
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t('offer.deed')}</span>
                                    <p className="mt-3 text-lg font-black text-slate-900">{property.deedNumber || "---"}</p>
                                </div>
                                <div className="rounded-[1.25rem] border border bg-card p-5 shadow-sm">
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t('pm.field.purchasePrice')}</span>
                                    <p className="mt-3 text-lg font-black text-slate-900">
                                        {property.purchasePrice != null ? <SaudiRiyalAmount amount={property.purchasePrice} locale="en-US" /> : "---"}
                                    </p>
                                </div>
                                <div className="rounded-[1.25rem] border border bg-card p-5 shadow-sm">
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t('bm.offer.location')}</span>
                                    <p className="mt-3 break-all text-base font-bold text-slate-900">{property.locationUrl || "---"}</p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <DialogFooter className="border-t border bg-card px-6 py-4 sm:px-8">
                    <Button variant="outline" onClick={onClose} className="rounded-2xl px-6 font-bold">
                        {t('common.close')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
