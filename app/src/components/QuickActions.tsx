"use client";

import { CreditCard, Building2 , Tag, FileText, Warehouse, Wallet, Building } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickActionItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  bgGradient: string;
}

export default function QuickActions() {
  const router = useRouter();
  
  const actions: QuickActionItem[] = [
    {
      id: "buildingmanagement",
      title: "ادارة العقار",
      icon: <Warehouse className="h-10 w-10" />,
      color: "text-white",
      hoverColor: "hover:text-white",
      bgGradient: "from-gray-600/20 to-gray-800/20",
    },
    {
      id: "wallet",
      title: "المحفظة",
      icon: <Wallet className="h-10 w-10" />,
      color: "text-white",
      hoverColor: "hover:text-white",
      bgGradient: "from-gray-600/20 to-gray-800/20",
    },
    {
      id: "services",
      title: "الخدمات",
      icon: <Building2  className="h-10 w-10" />,
      color: "text-white",
      hoverColor: "hover:text-white",
      bgGradient: "from-gray-600/20 to-gray-800/20",
    },
    {
      id: "offers",
      title: "العروض",
      icon: <Tag className="h-10 w-10" />,
      color: "text-white",
      hoverColor: "hover:text-white",
      bgGradient: "from-gray-600/20 to-gray-800/20",
    },
    {
      id: "requests",
      title: "الطلبات",
      icon: <FileText className="h-10 w-10" />,
      color: "text-white",
      hoverColor: "hover:text-white",
      bgGradient: "from-gray-600/20 to-gray-800/20",
    },
    {
      id: "ادارة الاملاك",
      title: "ادارة الاملاك",
      icon: <Building className="h-10 w-10" />,
      color: "text-white",
      hoverColor: "hover:text-white",
      bgGradient: "from-gray-600/20 to-gray-800/20",
    },
  ];

  return (
    <div className="w-full" dir="rtl">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              if (action.id === "services") {
                router.push("/services");
              }
              if (action.id === "wallet") {
                router.push("/wallet");
              }
              if (action.id === "offers") {
                router.push("/offers");
              }
              if (action.id === "requests") {
                router.push("/orders");
              }
              if (action.id === "buildingmanagement") {
                router.push("/buildingmanagement");
              }
             
            }}
            className={`
              group relative bg-gray-800 border-2 border-gray-700 rounded-xl p-6
              hover:border-gray-600 shadow-lg hover:shadow-xl
              transition-all duration-300 hover:scale-105
              flex flex-col items-center justify-center gap-3
               ${action.bgGradient}
            `}
          >
            <div className={`${action.color} ${action.hoverColor} transition-colors`}>
              {action.icon}
            </div>
            <h3 className="text-white font-semibold text-sm md:text-base text-center">
              {action.title}
            </h3>
          </button>
        ))}
      </div>
    </div>
  );
}

