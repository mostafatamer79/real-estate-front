"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Megaphone, FileText, Tag, Plus, PlusCircle, X } from "lucide-react";
import { useState } from "react";

export default function PropertyInfoCards() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const handleCardClick = (cardType: string) => {
    setSelectedCard(cardType);
  };

  const handleCloseModal = () => {
    setSelectedCard(null);
  };

  const getCardTitle = (cardType: string) => {
    switch (cardType) {
      case "operations":
        return "العمليات السابقة";
      case "ads":
        return "الاعلانات";
      case "deals":
        return "الصفقات";
      default:
        return "";
    }
  };

  return (
    <>
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6" dir="rtl">
      <Card 
        className="bg-gray-800 border-2 border-gray-700 hover:border-gray-600 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-white cursor-pointer"
        onClick={() => handleCardClick("operations")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-0">
          <div className="flex items-center gap-4">
          <FileText className="h-8 w-8 text-gray-200" />
            <CardTitle className="text-xl font-bold">العمليات السابقة</CardTitle>
            
          </div>
          <div className="relative group" onClick={(e) => e.stopPropagation()}>
            <PlusCircle className="h-8 w-8 text-gray-200 hover:text-white cursor-pointer transition-colors" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-sm py-1 px-3 rounded-lg whitespace-nowrap shadow-lg z-10">
              اضافة عملية
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-gray-100">
              <p className="font-semibold mb-1">بيع - 2024</p>
              <p className="text-gray-200">عقار في الرياض</p>
            </div>
            <div className="text-sm text-gray-100">
              <p className="font-semibold mb-1">إيجار - 2023</p>
              <p className="text-gray-200">شقة في جدة</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <button 
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            عرض الكل
          </button>
        </CardFooter>
      </Card>
      <Card 
        className="bg-gray-800 border-2 border-gray-700 hover:border-gray-600 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-white cursor-pointer"
        onClick={() => handleCardClick("ads")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-0">
          <div className="flex items-center gap-4">
          <Megaphone className="h-8 w-8 text-gray-200" />
            <CardTitle className="text-xl font-bold">الاعلانات</CardTitle>
          </div>
          <div className="relative group" onClick={(e) => e.stopPropagation()}>
            <PlusCircle className="h-8 w-8 text-gray-200 hover:text-white cursor-pointer transition-colors" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-sm py-1 px-3 rounded-lg whitespace-nowrap shadow-lg z-10">
              اضافة عملية
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-gray-100">
              <p className="font-semibold mb-1">إعلان مميز</p>
              <p className="text-gray-200">عرض خاص على العقارات</p>
            </div>
            <div className="text-sm text-gray-100">
              <p className="font-semibold mb-1">إعلان جديد</p>
              <p className="text-gray-200">وحدات متاحة للبيع</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <button 
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            عرض الكل
          </button>
        </CardFooter>
      </Card>

      <Card 
        className="bg-gray-800 border-2 border-gray-700 hover:border-gray-600 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-white cursor-pointer"
        onClick={() => handleCardClick("deals")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-0">
          <div className="flex items-center gap-4">
          <Tag className="h-8 w-8 text-gray-200" />
            <CardTitle className="text-xl font-bold">الصفقات</CardTitle>
          </div>
          <div className="relative group" onClick={(e) => e.stopPropagation()}>
            <PlusCircle className="h-8 w-8 text-gray-200 hover:text-white cursor-pointer transition-colors" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-sm py-1 px-3 rounded-lg whitespace-nowrap shadow-lg z-10">
              اضافة عملية
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-gray-100">
              <p className="font-semibold mb-1">خصم 20%</p>
              <p className="text-gray-200">عرض محدود لفترة محدودة</p>
            </div>
            <div className="text-sm text-gray-100">
              <p className="font-semibold mb-1">عرض خاص</p>
              <p className="text-gray-200">تمويل ميسر للعملاء</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <button 
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            عرض الكل
          </button>
        </CardFooter>
      </Card>
    </div>

    {selectedCard && (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={handleCloseModal}
        dir="rtl"
      >
          <div 
            className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[95vh] overflow-y-auto mx-4 my-4 text-slate-950"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">{getCardTitle(selectedCard)}</h2>
            <button
              onClick={handleCloseModal}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          <div className="p-6">
            {selectedCard === "operations" && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">تفاصيل العمليات السابقة</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-1">بيع - 2024</p>
                    <p className="text-gray-600">عقار في الرياض</p>
                    <p className="text-sm text-gray-500 mt-2">تاريخ العملية: 15 يناير 2024</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-1">إيجار - 2023</p>
                    <p className="text-gray-600">شقة في جدة</p>
                    <p className="text-sm text-gray-500 mt-2">تاريخ العملية: 10 مارس 2023</p>
                  </div>
                </div>
              </div>
            )}

            {selectedCard === "ads" && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">تفاصيل الاعلانات</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-1">إعلان مميز</p>
                    <p className="text-gray-600">عرض خاص على العقارات</p>
                    <p className="text-sm text-gray-500 mt-2">تاريخ النشر: 20 فبراير 2024</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-1">إعلان جديد</p>
                    <p className="text-gray-600">وحدات متاحة للبيع</p>
                    <p className="text-sm text-gray-500 mt-2">تاريخ النشر: 5 يناير 2024</p>
                  </div>
                </div>
              </div>
            )}

            {selectedCard === "deals" && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">تفاصيل الصفقات</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-1">خصم 20%</p>
                    <p className="text-gray-600">عرض محدود لفترة محدودة</p>
                    <p className="text-sm text-gray-500 mt-2">تاريخ الصفقة: 1 مارس 2024</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-1">عرض خاص</p>
                    <p className="text-gray-600">تمويل ميسر للعملاء</p>
                    <p className="text-sm text-gray-500 mt-2">تاريخ الصفقة: 15 فبراير 2024</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

