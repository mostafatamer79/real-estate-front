"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Property, Unit, CreateUnitDto } from "@/types/api";
import { propertiesApi } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2, Plus, Trash2, Home, Building, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PropertyDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: Property | null;
    onUpdate?: () => void;
}

export default function PropertyDetailsModal({ isOpen, onClose, property, onUpdate }: PropertyDetailsModalProps) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("units");
    const [units, setUnits] = useState<Unit[]>([]);
    const [loadingUnits, setLoadingUnits] = useState(false);
    
    // Create Unit State
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
                description: "Unit created successfully"
            });
            fetchUnits();
            // Reset form
             setNewUnit({
                unitNumber: '',
                roomsCount: 1,
                bathroomsCount: 1,
                area: 0,
                type: 'apartment',
                occupancyStatus: 'vacant',
                expectedVacancyDate: ''
            });
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
        if(!confirm(t('common.deleteConfirm'))) return;
        try {
            await propertiesApi.updateUnit(id, { propertyId: property?.id }); // Fallback as delete might not exist, but let's assume we want to remove linkage or we need a real delete endpoint
             // propertiesApi.deleteUnit(id) // If I added it.. I didn't add deleteUnit yet.
             // For now just toast
             toast({ title: "Delete Unit Not Implemented" });
        } catch(e){
            console.error(e);
        }
    };

    if (!isOpen || !property) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5 text-blue-600" />
                        {property.name}
                    </DialogTitle>
                    <DialogDescription>
                        {property.type} - {property.deedNumber || "---"}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="units">{t('pm.tab.units')}</TabsTrigger>
                        <TabsTrigger value="details">{t('offer.details')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="units" className="space-y-4 py-4">
                        <div className="bg-slate-50 p-4 rounded-lg flex items-end gap-3 border">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                                <div>
                                    <Label>{t('pm.unit.number')}</Label>
                                    <Input 
                                        value={newUnit.unitNumber} 
                                        onChange={(e) => setNewUnit({...newUnit, unitNumber: e.target.value})} 
                                        placeholder="Unit 101"
                                    />
                                </div>
                                <div>
                                    <Label>{t('pm.field.unitType')}</Label>
                                     <select 
                                        className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
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
                                    <Label>{t('offer.rooms')}</Label>
                                    <Input 
                                        type="number"
                                        value={newUnit.roomsCount} 
                                        onChange={(e) => setNewUnit({...newUnit, roomsCount: parseInt(e.target.value)})} 
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Label>{t('offer.area')} (m²)</Label>
                                    <Input 
                                        type="number"
                                        value={newUnit.area} 
                                        onChange={(e) => setNewUnit({...newUnit, area: parseInt(e.target.value)})} 
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Label>{t('bm.field.occupancyStatus')}</Label>
                                    <select 
                                        className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                        value={newUnit.occupancyStatus}
                                        onChange={(e) => setNewUnit({...newUnit, occupancyStatus: e.target.value as any})}
                                    >
                                        <option value="vacant">{t('bm.status.vacant')}</option>
                                        <option value="rented">{t('bm.status.rented')}</option>
                                        <option value="reserved">{t('bm.status.reserved')}</option>
                                        <option value="maintenance">{t('bm.status.maintenance')}</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <Label>{t('pm.field.expectedVacancyDate')}</Label>
                                    <Input 
                                        type="date"
                                        value={newUnit.expectedVacancyDate} 
                                        onChange={(e) => setNewUnit({...newUnit, expectedVacancyDate: e.target.value})} 
                                    />
                                </div>
                            </div>
                            <Button onClick={handleCreateUnit} disabled={isCreatingUnit}>
                                {isCreatingUnit ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                <span className="sr-only">Add</span>
                            </Button>
                        </div>

                        {loadingUnits ? (
                             <div className="text-center py-8"><Loader2 className="animate-spin w-8 h-8 text-blue-500 mx-auto" /></div>
                        ) : units.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">{t('bm.list.empty')}</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                                {units.map(unit => (
                                    <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 text-blue-600 rounded">
                                                <Home className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm">Unit {unit.unitNumber}</h4>
                                                <p className="text-xs text-gray-500">
                                                    {t(`property.type.${unit.type}`) || unit.type} • {unit.roomsCount} Rooms • {unit.area}m²
                                                    {unit.expectedVacancyDate && ` • ${t('pm.field.expectedVacancyDate')}: ${unit.expectedVacancyDate}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                unit.occupancyStatus === 'rented' ? 'bg-green-100 text-green-700' : 
                                                unit.occupancyStatus === 'reserved' ? 'bg-amber-100 text-amber-700' :
                                                unit.occupancyStatus === 'maintenance' ? 'bg-rose-100 text-rose-700' :
                                                'bg-slate-100 text-gray-700'
                                            }`}>
                                                {t(`bm.status.${unit.occupancyStatus}`) || unit.occupancyStatus}
                                            </span>
                                            {/* <Button variant="ghost" size="sm" onClick={() => handleDeleteUnit(unit.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button> */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="details">
                         <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 rounded border">
                                    <span className="text-xs text-gray-500 block">{t('offer.type')}</span>
                                    <span className="font-semibold">{property.type}</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border">
                                    <span className="text-xs text-gray-500 block">{t('offer.deed')}</span>
                                    <span className="font-semibold">{property.deedNumber || "---"}</span>
                                </div>
                                 <div className="p-3 bg-slate-50 rounded border">
                                    <span className="text-xs text-gray-500 block">{t('pm.field.purchasePrice')}</span>
                                    <span className="font-semibold">{property.purchasePrice?.toLocaleString() || "---"} SAR</span>
                                </div>
                            </div>
                         </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>{t('common.close')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
