"use client";

import { useState } from "react";
import {
  ShoppingBag,
  FileText,
  Megaphone,
  DollarSign,
  Scale,
} from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  {
    id: "offers",
    label: "ادارة العروض",
    icon: ShoppingBag,
  },
  {
    id: "orders",
    label: "ادارة الطلبات",
    icon: FileText,
  },
  {
    id: "marketing",
    label: "ادارة التسويق",
    icon: Megaphone,
  },
  {
    id: "financial",
    label: "الادارة المالية",
    icon: DollarSign,
  },
  {
    id: "legal",
    label: "الادارة القانونية",
    icon: Scale,
  },
];

export default function BuildingManagement() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  return (
    <div className="w-full min-h-screen bg-white flex" dir="rtl">
      {/* Fixed Sidebar */}
      <div className="fixed top-0 right-0 h-screen w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">إدارة العقارات</h1>
        
        <div className="space-y-3">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = selectedSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedSection(item.id)}
                className={`w-full p-4 rounded-lg text-right transition-colors ${
                  isSelected
                    ? "bg-gray-700 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="w-5 h-5" />
                  <span className="font-semibold">{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 mr-80 p-6">
        <div className="max-w-4xl">
          {selectedSection ? (
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {sidebarItems.find((item) => item.id === selectedSection)?.label}
              </h2>
              <p className="text-gray-600">
                محتوى قسم {sidebarItems.find((item) => item.id === selectedSection)?.label} سيظهر هنا
              </p>
            </div>
          ) : (
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                إدارة المبنى
              </h2>
              <p className="text-gray-600">
                اختر قسمًا من القائمة الجانبية للبدء
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

