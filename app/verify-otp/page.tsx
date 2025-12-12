// app/verify-otp/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [inputIndex, setInputIndex] = useState(0); // Track current input index
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const router = useRouter();

  useEffect(() => {
    // Get email/phone from localStorage
    const pendingVerification = localStorage.getItem('pendingVerification');
    if (!pendingVerification) {
      router.push('/signin');
      return;
    }
    setEmail(pendingVerification);

    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-focus first input on mount
    const firstInput = document.getElementById(`otp-0`);
    firstInput?.focus();

    return () => clearInterval(interval);
  }, [router]);

  const handleOtpChange = (index: number, value: string) => {
    // Allow only digits
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input if value entered
      if (value && index < 5) {
        const nextIndex = index + 1;
        setInputIndex(nextIndex);
        const nextInput = document.getElementById(`otp-${nextIndex}`);
        nextInput?.focus();
      }
      
      // Auto-focus previous input if value deleted and not first input
      if (!value && index > 0 && inputIndex === index) {
        const prevIndex = index - 1;
        setInputIndex(prevIndex);
        const prevInput = document.getElementById(`otp-${prevIndex}`);
        prevInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
      setInputIndex(index - 1);
    }
    
    // Handle arrow keys for navigation
    if (e.key === 'ArrowRight' && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
      setInputIndex(index + 1);
    }
    
    if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
      setInputIndex(index - 1);
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const pastedDigits = text.replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];
        pastedDigits.split('').forEach((digit, idx) => {
          if (idx < 6) {
            newOtp[idx] = digit;
          }
        });
        setOtp(newOtp);
        
        // Focus the next empty input after paste
        const nextEmptyIndex = newOtp.findIndex((digit, idx) => idx >= pastedDigits.length && idx < 6);
        const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
        setInputIndex(focusIndex);
        const focusInput = document.getElementById(`otp-${focusIndex}`);
        focusInput?.focus();
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.includes('@') ? email : undefined,
          phone: !email.includes('@') ? email : undefined,
          otp: otpCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل التحقق من الرمز');
      }

      console.log('OTP verified successfully:', data);
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Clear pending verification
      localStorage.removeItem('pendingVerification');
      
      // Redirect to dashboard or home page
      router.push('/details');
      
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError(err.message || 'رمز التحقق غير صحيح أو انتهت صلاحيته');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.includes('@') ? email : undefined,
          phone: !email.includes('@') ? email : undefined 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل إعادة إرسال الرمز');
      }

      setTimer(300); // Reset timer to 5 minutes
      setError(null);
      setOtp(["", "", "", "", "", ""]);
      setInputIndex(0);
      
      // Focus first input again
      const firstInput = document.getElementById(`otp-0`);
      firstInput?.focus();
      
    } catch (err: any) {
      setError(err.message || "فشل إعادة إرسال الرمز");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-white/80 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          رجوع
        </button>

        <h1 className="text-2xl font-bold mb-2 text-center">تحقق من رمز التحقق</h1>
        <p className="text-white/60 text-center mb-8">
          تم إرسال رمز مكون من 6 أرقام إلى{" "}
          <span className="text-white font-medium">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onFocus={() => setInputIndex(index)}
                  disabled={isLoading}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-slate-800 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none disabled:opacity-50 transition-all"
                  dir="ltr" // Force LTR for OTP inputs
                  autoComplete="one-time-code"
                  style={{ 
                    textAlign: 'center',
                    direction: 'ltr',
                    unicodeBidi: 'bidi-override'
                  }}
                />
              ))}
            </div>

            <div className="text-center">
              <p className="text-white/60 text-sm mb-2">
                أدخل الرمز من اليسار إلى اليمين
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}

            <div className="text-center">
              <p className="text-white/60">
                الوقت المتبقي:{" "}
                <span className={`font-medium ${timer < 60 ? "text-red-400" : "text-green-400"}`}>
                  {formatTime(timer)}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || otp.join('').length !== 6}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التحقق...
                </span>
              ) : (
                "تأكيد الرمز"
              )}
            </button>

            {timer === 0 && (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري إعادة الإرسال...
                  </span>
                ) : (
                  "إعادة إرسال الرمز"
                )}
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-white/60">
          <p>لم تتلقَ الرمز؟ تأكد من مجلد الرسائل المزعجة أو المحاولة مرة أخرى</p>
        </div>
      </div>
    </div>
  );
}