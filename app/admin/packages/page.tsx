"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface ManagementPackage {
  id: string;
  name: string;
  yearlyPrice: number;
  monthlyPrice: number;
  discount: number;
  description: string;
  administrations: string[];
  isActive: boolean;
}

const AVAILABLE_ADMINISTRATIONS = [
  "admin.dept.real_estate", // Real Estate Management
  "admin.dept.marketing",   // Marketing Management
  "admin.dept.legal",       // Legal Management
  "admin.dept.finance",     // Financial Management
  "admin.dept.hr"           // HR Management
];

export default function AdminPackagesPage() {
  const { t, language } = useLanguage();
  const [packages, setPackages] = useState<ManagementPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ManagementPackage | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    yearlyPrice: "",
    monthlyPrice: "",
    discount: "0",
    description: "",
    administrations: [] as string[],
    isActive: true
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await api.get('/management-packages');
      setPackages(response.data);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error(t('admin.packages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pkg?: ManagementPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        yearlyPrice: pkg.yearlyPrice.toString(),
        monthlyPrice: pkg.monthlyPrice.toString(),
        discount: pkg.discount.toString(),
        description: pkg.description || "",
        administrations: pkg.administrations || [],
        isActive: pkg.isActive
      });
    } else {
      setEditingPackage(null);
      setFormData({
        name: "",
        yearlyPrice: "",
        monthlyPrice: "",
        discount: "0",
        description: "",
        administrations: [],
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        yearlyPrice: parseFloat(formData.yearlyPrice),
        monthlyPrice: parseFloat(formData.monthlyPrice),
        discount: parseFloat(formData.discount),
      };

      if (editingPackage) {
        await api.patch(`/management-packages/${editingPackage.id}`, payload);
        toast.success(t('admin.packages.saveSuccess'));
      } else {
        await api.post('/management-packages', payload);
        toast.success(t('admin.packages.saveSuccess'));
      }
      setIsModalOpen(false);
      fetchPackages();
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error(t('admin.packages.saveError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.packages.confirmDelete'))) return;
    try {
      await api.delete(`/management-packages/${id}`);
      toast.success(t('admin.packages.deleteSuccess'));
      fetchPackages();
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error(t('admin.packages.deleteError'));
    }
  };

  const toggleAdministration = (admin: string) => {
    setFormData(prev => {
      const exists = prev.administrations.includes(admin);
      if (exists) {
        return { ...prev, administrations: prev.administrations.filter(a => a !== admin) };
      } else {
        return { ...prev, administrations: [...prev.administrations, admin] };
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.packages.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.packages.subtitle')}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>{t('admin.packages.add')}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                {!pkg.isActive && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold">{t('admin.packages.inactive')}</div>
                )}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                  <div className="mt-1 space-y-1">
                      <p className="text-xl font-black text-blue-600">
                          {pkg.yearlyPrice} <span className="text-xs font-normal text-gray-500">{t('admin.packages.currencyPerYear')}</span>
                      </p>
                      <p className="text-sm font-bold text-gray-700">
                          {pkg.monthlyPrice} <span className="text-xs font-normal text-gray-500">{t('admin.packages.currencyPerMonth')}</span>
                      </p>
                      {pkg.discount > 0 && (
                          <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-md font-medium">
                              {pkg.discount}% {t('admin.packages.discount')}
                          </span>
                      )}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(pkg)} className="p-2 hover:bg-slate-100 rounded-lg text-gray-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(pkg.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-6 line-clamp-2">{pkg.description}</p>

              <div className="space-y-4">
                {/* Administrations Preview */}
                {pkg.administrations && pkg.administrations.length > 0 && (
                   <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-500 uppercase">{t('admin.packages.administrations')}</p>
                      <div className="flex flex-wrap gap-1">
                        {pkg.administrations.slice(0, 3).map((admin, idx) => (
                          <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{t(admin)}</span>
                        ))}
                         {pkg.administrations.length > 3 && (
                            <span className="text-xs text-gray-400 px-1">+{pkg.administrations.length - 3}</span>
                         )}
                      </div>
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold">{editingPackage ? t('admin.packages.modal.edit') : t('admin.packages.modal.new')}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('admin.packages.info')}</h3>
                         <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t('admin.packages.form.name')}</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder={t('admin.packages.form.namePlaceholder')}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('admin.packages.form.yearlyPrice')}</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.yearlyPrice}
                                    onChange={(e) => setFormData({...formData, yearlyPrice: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('admin.packages.form.monthlyPrice')}</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.monthlyPrice}
                                    onChange={(e) => setFormData({...formData, monthlyPrice: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t('admin.packages.form.discount')} (%)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                max="100"
                                value={formData.discount}
                                onChange={(e) => setFormData({...formData, discount: e.target.value})}
                                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t('admin.packages.form.desc')}</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                placeholder={t('admin.packages.form.descPlaceholder')}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Administrations */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('admin.packages.administrations')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                                {AVAILABLE_ADMINISTRATIONS.map(admin => (
                                    <div 
                                        key={admin}
                                        onClick={() => toggleAdministration(admin)}
                                        className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-sm ${
                                            formData.administrations.includes(admin)
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                        }`}
                                    >
                                        <span className="font-medium">{t(admin)}</span>
                                        {formData.administrations.includes(admin) && <Check className="w-4 h-4" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="w-5 h-5 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">{t('admin.packages.form.active')}</label>
                </div>

                <div className="pt-2 flex justify-end gap-3 save-btn">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 font-medium hover:bg-slate-50">{t('admin.packages.form.cancel')}</button>
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800">{t('admin.packages.form.save')}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
