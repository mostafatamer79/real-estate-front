
export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">لوحة التحكم</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-2">المسح العقاري</h2>
            <p className="text-gray-600 mb-4">استخدام أداة المسح للعثور على المناطق.</p>
            <a href="/scan-map" className="text-blue-600 hover:underline">الذهاب للمسح &larr;</a>
         </div>
         {/* More widgets can go here */}
      </div>
    </div>
  )
}
