"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const canonicalDeptSlug = (slug: string) => {
  const s = String(slug || "").toLowerCase().trim();
  if (!s) return "";
  if (s === "financial") return "finance";
  if (s === "employee") return "employees";
  if (s === "property" || s === "property_management" || s === "pm") return "properties";
  return s;
};

export default function DepartmentHub() {
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(storedUser);
    const departmentsRaw = Array.isArray(user.departments) ? user.departments : [];
    const departments = departmentsRaw.map((d: any) => canonicalDeptSlug(d)).filter(Boolean);
    const permissionDepartments = Object.entries(user.departmentPermissions || {})
      .filter(([, value]) => value === true || value === 'manage' || value === 'view')
      .map(([key]) => canonicalDeptSlug(key))
      .filter(Boolean);
    const availableDepartments = Array.from(new Set([...departments, ...permissionDepartments]));
    const roleMap: Record<string, string> = {
      marketing: 'marketing',
      legal: 'legal',
      finance: 'finance',
      manager: availableDepartments[0] || '',
      admin: '/admin/dashboard',
      owner: 'properties',
      broker: 'properties',
      agent: 'properties',
      user: 'properties',
    };

    if (user.role === 'admin') {
      router.push('/details');
      return;
    }

    const target = availableDepartments[0] || roleMap[user.role] || '';
    if (!target) {
      router.push('/details');
      return;
    }
    router.push(`/internal/${target}`);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  );
}
