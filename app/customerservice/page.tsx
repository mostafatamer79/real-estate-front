"use client";

import React, { useState } from "react";
import Header from "../src/components/Header";
import {
  Twitter,
  Mail,
  MessageCircle,
  Phone,
  HelpCircle,
  Share2,
  ChevronDown,
  X,
  User,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/app/src/components/ui/card";

export default function CustomerService() {
  const [question, setQuestion] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");
  const [name, setName] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    communication: false,
    customerService: false,
    contact: false,
    inquiries: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <section className="w-full min-h-screen bg-slate-950 text-white flex flex-col" dir="rtl">
      <Header />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 items-start justify-items-center">
        <Card className={`bg-gray-800 border-2 border-gray-600 hover:border-gray-500 flex flex-col items-center text-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-white rounded-full w-56 sm:w-60 lg:w-64 p-4 sm:p-5 lg:p-6 justify-start overflow-y-auto hide-scrollbar relative ${
          expandedSections.communication ? "h-[460px] sm:h-[490px] lg:h-[520px]" : "h-56 sm:h-60 lg:h-64"
        }`}>
          <CardHeader className="w-full px-0 pb-1">
            <button
              onClick={() => toggleSection("communication")}
              className="cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg mb-3 mx-auto flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-gray-600 hover:bg-gray-500 shadow-md"
            >
              <Mail className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
            </button>
            <CardTitle className="text-sm sm:text-base lg:text-lg font-bold mb-3 text-gray-100 tracking-tight">قنوات التواصل</CardTitle>
          </CardHeader>
          <CardContent
            className={`transition-all duration-500 ease-in-out w-full px-0 ${
              expandedSections.communication ? "opacity-100 mt-2 block pb-12" : "max-h-0 opacity-0 hidden"
            }`}
          >
            <div className="space-y-2.5 w-full py-1">
              <a
                href=""
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-gray-600 hover:bg-gray-500 transition-all duration-200 rounded-full px-3 py-2.5 text-xs shadow-md hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-700">
                    <X className="w-3 h-3 text-white" />
                  </div>
                  <span>حساب </span>
                </div>
                <span className="text-xs text-slate-300">فتح</span>
              </a>
              <a href=""
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-gray-600 hover:bg-gray-500 transition-all duration-200 rounded-full px-3 py-2.5 text-xs shadow-md hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-700">
                    <Mail className="w-3 h-3 text-white" />
                  </div>
                  <span>البريد</span>
                </div>
                <span className="text-xs text-slate-300">فتح</span>
              </a>
            </div>
          </CardContent>
          <CardFooter className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-full justify-center px-0">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-600 hover:bg-gray-500 shadow-md hover:shadow-lg transition-all duration-200">
              <ChevronDown
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-white transition-transform duration-500 ${
                  expandedSections.communication ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardFooter>
        </Card>

         <Card className={`bg-gray-800 border-2 border-gray-600 hover:border-gray-500 flex flex-col items-center text-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-white rounded-full w-56 sm:w-60 lg:w-64 p-4 sm:p-5 lg:p-6 justify-start overflow-y-auto hide-scrollbar relative ${
          expandedSections.contact ? "h-[460px] sm:h-[490px] lg:h-[520px]" : "h-56 sm:h-60 lg:h-64"
        }`}>
          <CardHeader className="w-full px-0 pb-1">
            <button
              onClick={() => toggleSection("contact")}
              className="cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg mb-3 mx-auto flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-gray-600 hover:bg-gray-500 shadow-md"
            >
              <Phone className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
            </button>
            <CardTitle className="text-sm sm:text-base lg:text-lg font-bold mb-3 text-gray-100 tracking-tight">رقم التواصل</CardTitle>
          </CardHeader>
          <CardContent
            className={`transition-all duration-500 ease-in-out w-full px-0 ${
              expandedSections.contact ? "opacity-100 mt-2 block pb-12" : "max-h-0 opacity-0 hidden"
            }`}
          >
            <div className="w-full flex items-center justify-center bg-gray-600 hover:bg-gray-500 transition-all duration-200 rounded-full px-4 py-3.5 shadow-md hover:shadow-lg hover:scale-105">
              <span className="text-sm sm:text-base font-semibold text-gray-100">+966 5 5555 5555</span>
            </div>
          </CardContent>
          <CardFooter className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-full justify-center px-0">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-600 hover:bg-gray-500 shadow-md hover:shadow-lg transition-all duration-200">
              <ChevronDown
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-white transition-transform duration-500 ${
                  expandedSections.contact ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardFooter>
        </Card>

        <Card className={`bg-gray-800 border-2 border-gray-600 hover:border-gray-500 flex flex-col items-center text-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-white rounded-full w-56 sm:w-60 lg:w-64 p-4 sm:p-5 lg:p-6 justify-start overflow-y-auto hide-scrollbar relative ${
          expandedSections.customerService ? "h-[520px] sm:h-[560px] lg:h-[600px]" : "h-56 sm:h-60 lg:h-64"
        }`}>
          <CardHeader className="w-full px-0 pb-1">
            <button
              onClick={() => toggleSection("customerService")}
              className="cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg mb-3 mx-auto flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-gray-600 hover:bg-gray-500 shadow-md"
            >
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
            </button>
            <CardTitle className="text-sm sm:text-base lg:text-lg font-bold mb-3 text-gray-100 tracking-tight">خدمة عملاء</CardTitle>
          </CardHeader>
          <CardContent
            className={`transition-all duration-500 ease-in-out w-full px-0 ${
              expandedSections.customerService ? "opacity-100 mt-2 block pb-14" : "max-h-0 opacity-0 hidden"
            }`}
          >
            <p className="text-xs sm:text-sm text-slate-300 mb-4 font-medium text-center">
              اكتب استفسارك وسنرد عليك في أقرب وقت ممكن
            </p>
            <div className="space-y-3 w-full py-1">
              <div className="bg-white rounded-full flex items-center p-3.5 shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-gray-400 focus-within:shadow-lg">
                <User className="w-5 h-5 text-slate-700 ml-2 " />
                <input
                  type="text"
                  value={name || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  dir="rtl"
                  placeholder="الاسم"
                  className="flex-1 outline-none text-black placeholder-slate-500 text-right text-sm bg-transparent focus:ring-0"
                />
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setContactMethod("email");
                    setPhoneNumber("");
                  }}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    contactMethod === "email"
                      ? "bg-gray-600 text-white shadow-md"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  <Mail className="w-4 h-4 inline ml-1" />
                  البريد
                </button>
                <button
                  onClick={() => {
                    setContactMethod("phone");
                    setEmail("");
                  }}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    contactMethod === "phone"
                      ? "bg-gray-600 text-white shadow-md"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  <Phone className="w-4 h-4 inline ml-1" />
                  الجوال
                </button>
              </div>

              {contactMethod === "email" && (
                <div className="bg-white rounded-full flex items-center p-3.5 shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-gray-400 focus-within:shadow-lg">
                  <Mail className="w-5 h-5 text-slate-700 ml-2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    dir="rtl"
                    placeholder="البريد الإلكتروني"
                    className="flex-1 outline-none text-black placeholder-slate-500 text-right text-sm bg-transparent focus:ring-0"
                  />
                </div>
              )}

              {contactMethod === "phone" && (
                <div className="bg-white rounded-full flex items-center p-3.5 shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-gray-400 focus-within:shadow-lg">
                  <Phone className="w-5 h-5 text-slate-700 ml-2" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    dir="rtl"
                    placeholder="رقم الجوال"
                    className="flex-1 outline-none text-black placeholder-slate-500 text-right text-sm bg-transparent focus:ring-0"
                  />
                </div>
              )}
              
              <div className="bg-white rounded-full flex items-center p-3.5 shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-gray-400 focus-within:shadow-lg">
                <MessageCircle className="w-5 h-5 text-slate-700 ml-2" />
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  dir="rtl"
                  placeholder="اكتب استفسارك هنا..."
                  className="flex-1 outline-none text-black placeholder-slate-500 text-right text-sm bg-transparent focus:ring-0"
                />
              </div>
              <button
                disabled={!question.trim() || !name.trim() || (contactMethod === "email" ? !email.trim() : !phoneNumber.trim())}
                className={`w-full rounded-full px-5 py-3 text-sm sm:text-base font-semibold transition-all duration-200 shadow-md mt-2 mb-12 ${
                  question.trim() && name.trim() && (contactMethod === "email" ? email.trim() : phoneNumber.trim())
                    ? "bg-gray-600 hover:bg-gray-500 text-white hover:shadow-lg hover:scale-105"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
                onClick={() => {
                  alert("تم إرسال سؤالك، وسيتم الرد خلال ٢٤ ساعة إن شاء الله");
                  setQuestion("");
                  setEmail("");
                  setPhoneNumber("");
                  setName("");
                }}
              >
                إرسال السؤال
              </button>
            </div>
          </CardContent>
          <CardFooter className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-full justify-center px-0 z-10">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-600 hover:bg-gray-500 shadow-md hover:shadow-lg transition-all duration-200">
              <ChevronDown
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-white transition-transform duration-500 ${
                  expandedSections.customerService ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardFooter>
        </Card>

  

        <Card className={`bg-gray-800 border-2 border-gray-600 hover:border-gray-500 flex flex-col items-center text-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-white rounded-full w-56 sm:w-60 lg:w-64 p-4 sm:p-5 lg:p-6 justify-start overflow-y-auto hide-scrollbar relative ${
          expandedSections.inquiries ? "h-[460px] sm:h-[490px] lg:h-[520px]" : "h-56 sm:h-60 lg:h-64"
        }`}>
          <CardHeader className="w-full px-0 pb-1">
            <button
              onClick={() => toggleSection("inquiries")}
              className="cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg mb-3 mx-auto flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-gray-600 hover:bg-gray-500 shadow-md"
            >
              <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
            </button>
            <CardTitle className="text-sm sm:text-base lg:text-lg font-bold mb-3 text-gray-100 tracking-tight">الاستفسارات</CardTitle>
          </CardHeader>
          <CardContent
            className={`transition-all duration-500 ease-in-out w-full px-0 ${
              expandedSections.inquiries ? "opacity-100 mt-2 block pb-12" : "max-h-0 opacity-0 hidden"
            }`}
          >
            <ul className="space-y-2.5 w-full py-1">
              {["كيف أضيف عقار؟", "كيف اتواصل مع المعلن؟", "هل توجد عمولة؟"].map(
                (q, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-center bg-gray-600 hover:bg-gray-500 transition-all duration-200 rounded-full px-4 py-2.5 shadow-md hover:shadow-lg hover:scale-105 cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm text-center font-medium text-gray-100">{q}</span>
                  </li>
                )
              )}
            </ul>
          </CardContent>
          <CardFooter className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-full justify-center px-0">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-600 hover:bg-gray-500 shadow-md hover:shadow-lg transition-all duration-200">
              <ChevronDown
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-white transition-transform duration-500 ${
                  expandedSections.inquiries ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardFooter>
        </Card>
      </main>
    </section>
  );
}


