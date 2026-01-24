
"use client";

import { useEffect, useState } from "react";
import { offersApi } from "@/lib/api";
import { Offer } from "@/types/api";

export default function TransactionsPage() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const res = await offersApi.findAll();
                setOffers(res.data);
            } catch (error) {
                console.error("Failed to fetch offers", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOffers();
    }, []);

    const handleStatusUpdate = async (id: string, status: string) => {
        if (!confirm('هل أنت متأكد من تغيير حالة العرض؟')) return;
        try {
            await offersApi.updateStatus(id, status);
            setOffers(offers.map(offer => offer.id === id ? { ...offer, status } : offer));
        } catch (error) {
            console.error("Failed to update status", error);
            alert("فشل تحديث الحالة");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف العرض نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.')) return;
        try {
            await offersApi.delete(id);
            setOffers(offers.filter(offer => offer.id !== id));
        } catch (error) {
            console.error("Failed to delete offer", error);
            alert("فشل حذف العرض");
        }
    };

    if (loading) return <div className="p-8">جاري التحميل...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">المعاملات العقارية</h1>
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العنوان/الوصف</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">النوع</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المدينة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {offers.map((offer) => (
                            <tr key={offer.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(offer.createdAt).toLocaleDateString('ar-SA')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {offer.additionalNotes ? offer.additionalNotes.substring(0, 30) + '...' : `${offer.propertyType} - ${offer.city}`}
                                </td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {offer.propertyType}
                                </td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {offer.city}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {offer.price?.toLocaleString()} ر.س
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        offer.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 
                                        offer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                                        offer.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {offer.status || 'نشط'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        {offer.status !== 'ACCEPTED' && (
                                            <button
                                                onClick={() => handleStatusUpdate(offer.id, 'ACCEPTED')}
                                                className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md"
                                            >
                                                قبول
                                            </button>
                                        )}
                                        {offer.status !== 'REJECTED' && (
                                            <button
                                                onClick={() => handleStatusUpdate(offer.id, 'REJECTED')}
                                                className="text-orange-600 hover:text-orange-900 bg-orange-50 px-3 py-1 rounded-md"
                                            >
                                                رفض
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(offer.id)}
                                            className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md"
                                        >
                                            حذف
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
               {offers.length === 0 && <div className="p-8 text-center text-gray-500">لا توجد معاملات حالياً</div>}
            </div>
        </div>
    );
}
