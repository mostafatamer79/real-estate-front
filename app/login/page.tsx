"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Phone,
  ChevronDown,
  Info,
  Smartphone,
  X,
  Mail,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Header from "../src/components/Header";

interface SignInProps {
  onClose?: () => void;
}

export default function SignIn({ onClose }: SignInProps) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isPhoneMode, setIsPhoneMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/auth/register`;
      const payload = isPhoneMode 
        ? { phone,  } // You might want to add password field
        : { email,  };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let data;

      try {
        data = await response.json();
      } catch {
        data = null; // response was empty or not JSON
      }
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      console.log('Registration successful:', data);
      
      // Store user email/phone for OTP verification page
      const userIdentifier = isPhoneMode ? phone : email;
      localStorage.setItem('pendingVerification', userIdentifier);
      
      // Redirect to OTP verification page
      router.push('/verify-otp');
      
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = isPhoneMode 
    ? phone.trim().length > 0 
    : email.trim().length > 0;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 bg-slate-950 text-white z-50 flex flex-col"
    >
      <Header showSignUp={false} />
      
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="flex items-center gap-2 text-white/80 hover:text-white bg-slate-800/50 backdrop-blur-sm rounded-full p-2 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
        <h2 className="text-xl font-medium text-white mb-8">
          {isPhoneMode 
            ? "أدخل رقم جوالك لتسجيل الدخول" 
            : "أدخل بريدك الإلكتروني لتسجيل الدخول"
          }
        </h2>

        <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-lg ${
          isPhoneMode ? "bg-gray-700" : "bg-gray-700"
        }`}>
          {isPhoneMode ? (
            <Smartphone className="w-16 h-16 text-white" />
          ) : (
            <Mail className="w-16 h-16 text-white" />
          )}
        </div>

        <div className="w-full max-w-sm mb-6">
          <div className="flex items-center justify-center bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setIsPhoneMode(true)}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md ${
                isPhoneMode
                  ? "bg-gray-500 text-white"
                  : "text-slate-400 hover:text-white"
              } disabled:opacity-50`}
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">رقم الجوال</span>
            </button>
            <button
              onClick={() => setIsPhoneMode(false)}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md ${
                !isPhoneMode
                  ? "bg-gray-500 text-white"
                  : "text-slate-400 hover:text-white"
              } disabled:opacity-50`}
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">البريد الإلكتروني</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-sm mb-10">
          {isPhoneMode ? (
            <div className="relative mb-4">
              <div className="flex items-center border border-slate-400 rounded-lg px-4 py-3 bg-white">
                <div className="flex items-center space-x-reverse space-x-2 text-slate-950">
                  <ChevronDown className="w-4 h-4" />
                  <span className="text-lg">🇸🇦</span>
                </div>
                <input
                  type="tel"
                  dir="rtl"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 mr-3 outline-none text-black placeholder-gray-600 text-right disabled:opacity-50"
                  placeholder="5XXXXXXXX"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="relative mb-4">
              <div className="flex items-center border border-slate-400 rounded-lg px-4 py-3 bg-white">
                <div className="flex items-center space-x-reverse space-x-2 text-slate-950">
                  <ChevronDown className="w-4 h-4" />
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  dir="rtl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 mr-3 outline-none text-black placeholder-gray-600 text-right disabled:opacity-50"
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-start mb-6 space-x-reverse space-x-2">
            <Info className={`w-4 h-4 mt-1 shrink-0 ${
              isPhoneMode ? "text-gray-600" : "text-gray-600"
            }`} />
            <p className="text-sm text-white/80 text-right">
              {isPhoneMode 
                ? "سيتم إرسال رمز التحقق إلى رقم جوالك" 
                : "سيتم إرسال رمز التحقق إلى بريدك الإلكتروني"
              }
            </p>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-base font-medium shadow-lg w-full ${
              isFormValid && !isLoading
                ? isPhoneMode 
                  ? "bg-gray-500 hover:bg-gray-700 text-white"
                  : "bg-gray-500 hover:bg-gray-700 text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            } disabled:opacity-50`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4" />
                {isPhoneMode ? "إرسال رمز التحقق" : "إرسال رمز التحقق"}
              </>
            )}
          </button>
        </form>

        <div className="mt-4">
          <p className="text-sm text-white/60">
            {isPhoneMode 
              ? "سوف تتلقى رسالة نصية قصيرة برمز التحقق"
              : "سوف تتلقى رسالة بريد إلكتروني برمز التحقق"
            }
          </p>
        </div>
      </div>
    </div>
  );
}