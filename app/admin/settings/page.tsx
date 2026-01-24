
"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
    const [price, setPrice] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                 const token = localStorage.getItem('token');
                // First try to fetch public, if fail then admin
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/public/appointment_price`, {
                     headers: { 'Authorization': `Bearer ${token}`}
                });
                if (res.ok) {
                    const data = await res.json();
                    if(data.value) setPrice(data.value);
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    key: 'appointment_price',
                    value: price,
                    description: 'Price for booking an appointment'
                })
            });

            if (res.ok) {
                setMessage("تم تحديث الإعدادات بنجاح");
            } else {
                setMessage("فشل التحديث");
            }
        } catch (error) {
            setMessage("حدث خطأ أثناء الحفظ");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">جاري التحميل...</div>;

    return (
        <div className="max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">الإعدادات</h1>
            
            <div className="bg-white rounded-xl shadow p-6">
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            سعر حجز الموعد (ريال سعودي)
                        </label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="0"
                        />
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg ${message.includes("نجاح") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving && <Loader2 className="animate-spin w-4 h-4" />}
                        حفظ التغييرات
                    </button>
                </form>
            </div>
        </div>
    );
}
