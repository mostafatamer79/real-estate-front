"use client";
import { useRouter } from "next/navigation";
import Header from "../src/components/Header";
import { ArrowRight } from "lucide-react";
import {
  ShoppingBag,
  Scale,
  Hammer,
  MoreHorizontal,
} from "lucide-react";

export default function Services() {
  const router = useRouter();

  const serviceCards = [
    {
      id: "postPurchase",
      title: "خدمات ما بعد الشراء",
      icon: ShoppingBag,
    },
    {
      id: "legal",
      title: "الخدمات القانونية",
      icon: Scale,
    },
    {
      id: "construction",
      title: "أعمال البناء",
      icon: Hammer,
    },
    {
      id: "other",
      title: "خدمات أخرى",
      icon: MoreHorizontal,
    },
  ];

  const handleCardClick = (cardId: string) => {
    router.push(`/services/form?type=${cardId}`);
  };

  return (
    <section className="w-full min-h-screen bg-slate-950 text-white flex flex-col" dir="rtl">
      <Header />

      {/* Navigation Arrow */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-6">
        <button
          onClick={() => router.push("/details")}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          الصفحة الرئيسية   
               </button>
      </div>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center justify-items-center">
        {serviceCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className="bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-500 flex flex-col items-center text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white w-56 p-6 justify-center cursor-pointer h-56"
            >
              <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-gray-700">
                <IconComponent className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {card.title}
              </h3>
              <p className="text-gray-400 text-sm">انقر للاطلاع على الخدمات</p>
            </div>
          );
        })}
      </main>
    </section>
  );
}