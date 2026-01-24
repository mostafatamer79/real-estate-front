
"use client";
import React, { useEffect, useState } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header({ onSignUp }: { onSignUp: () => void }) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            setUser(JSON.parse(storedUser));
        } catch (e) {
            console.error("Invalid user data");
        }
    }
  }, []);

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      router.push('/');
      window.location.reload(); 
  };

  return (
    <header className="w-full h-16 bg-slate-900 border-b border-white/10 flex items-center justify-between px-6 z-50">
      <div className="text-white font-bold text-lg">
        <Link href="/">عقاراتي</Link>
      </div>

       <div className="flex gap-4 items-center">
            {user && (
                <div className="text-white text-sm bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                     مرحباً، {user.firstName || user.email}
                </div>
            )}
             
            {user?.role === 'ADMIN' && (
                <Link href="/admin/dashboard" className="text-emerald-400 hover:text-emerald-300 font-medium text-sm">
                    لوحة التحكم
                </Link>
            )}

            {user ? (
                 <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all"
                >
                  تسجيل خروج
                </button>
            ) : (
                <button
                  onClick={onSignUp}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all"
                >
                  تسجيل دخول
                </button>
            )}
      </div>
    </header>
  );
}
