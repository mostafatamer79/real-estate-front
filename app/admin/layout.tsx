
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard" className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            الرئيسية
          </Link>
          <Link href="/admin/transactions" className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            المعاملات
          </Link>
          <Link href="/admin/users" className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            المستخدمين
          </Link>
          <Link href="/admin/settings" className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            الإعدادات
          </Link>
             <Link href="/" className="block px-4 py-2 text-blue-600 hover:bg-gray-100 rounded-lg mt-8">
            العودة للموقع
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
