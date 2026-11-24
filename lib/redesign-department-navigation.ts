/**
 * Navigation and permission helpers for department workspaces and the department hub.
 * Enforces canonical initial navigation, supported workspace sections, financial subtab mappings,
 * and server-authoritative department access rules.
 */

export const SUPPORTED_WORKSPACE_SECTIONS = [
  "properties",
  "financial",
  "legal",
  "marketing",
  "users",
  "offers",
  "orders",
  "subscriptions",
  "service-requests",
] as const;

export type SupportedWorkspaceSection = (typeof SUPPORTED_WORKSPACE_SECTIONS)[number];

export const DEPARTMENT_DEFAULT_SECTIONS: Record<string, string> = {
  properties: "properties",
  legal: "legal",
  marketing: "marketing",
  employees: "users",
  finance: "financial",
};

export const FINANCIAL_TAB_MAP: Record<string, string> = {
  financial: "dashboard",
  dashboard: "dashboard",
  transactions: "transactions",
  payments: "payments",
  expenses: "expenses",
  reports: "reports",
  settlements: "settlements",
  service_requests: "service_requests",
  "service-requests": "service_requests",
};

export const DEPARTMENT_HUB_LINKS: Record<string, { href: string; section: string }> = {
  properties: {
    href: "/internal/properties?view=properties&section=properties",
    section: "properties",
  },
  finance: {
    href: "/internal/finance?view=financial&section=financial",
    section: "financial",
  },
  legal: {
    href: "/internal/legal?view=legal&section=legal",
    section: "legal",
  },
  marketing: {
    href: "/internal/marketing?view=marketing&section=marketing",
    section: "marketing",
  },
  employees: {
    href: "/internal/employees?view=employees&section=users",
    section: "users",
  },
};

/**
 * Normalizes a raw department slug to its canonical identifier.
 */
export function canonicalDeptSlug(slug: string | null | undefined): string {
  const s = String(slug || "").toLowerCase().trim();
  if (!s) return "";
  if (s === "financial" || s === "finance") return "finance";
  if (s === "employee" || s === "employees") return "employees";
  if (s === "property" || s === "property_management" || s === "pm" || s === "properties") return "properties";
  if (s === "legal") return "legal";
  if (s === "marketing") return "marketing";
  return s;
}

/**
 * Returns the default workspace section for a department.
 */
export function getDefaultSectionForDept(dept: string | null | undefined): string {
  const canonical = canonicalDeptSlug(dept);
  return DEPARTMENT_DEFAULT_SECTIONS[canonical] || "properties";
}

/**
 * Checks whether a given section string is supported by BuildingManagementWorkspace.
 */
export function isSupportedWorkspaceSection(section: string | null | undefined): boolean {
  if (!section) return false;
  return (SUPPORTED_WORKSPACE_SECTIONS as readonly string[]).includes(section);
}

/**
 * Normalizes financial tab names.
 */
export function normalizeFinancialTab(rawTabOrSection: string | null | undefined): string {
  if (!rawTabOrSection) return "dashboard";
  const key = String(rawTabOrSection).toLowerCase().trim();
  return FINANCIAL_TAB_MAP[key] || "dashboard";
}

export interface ResolvedDepartmentNavigation {
  canonicalDept: string;
  canonicalSection: string;
  canonicalFinancialTab?: string;
  targetUrl: string;
  needsReplace: boolean;
}

function toSearchParams(params?: URLSearchParams | Record<string, unknown> | string | null): URLSearchParams {
  if (!params) return new URLSearchParams();
  if (typeof params === "string") return new URLSearchParams(params.startsWith("?") ? params.slice(1) : params);
  if (params instanceof URLSearchParams) return new URLSearchParams(params.toString());
  if (typeof (params as { toString?: () => string }).toString === "function" && typeof (params as { get?: unknown }).get === "function") {
    return new URLSearchParams((params as { toString: () => string }).toString());
  }
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        for (const v of value) sp.append(key, String(v));
      } else {
        sp.set(key, String(value));
      }
    }
  }
  return sp;
}

/**
 * Resolves department navigation input into canonical workspace props and URL replacement parameters.
 * Normalizes unsupported aliases (such as section=dashboard or raw section=payments) safely.
 */
export function resolveDepartmentNavigation(
  rawDept: string | null | undefined,
  rawSearchParams?: URLSearchParams | Record<string, unknown> | string | null
): ResolvedDepartmentNavigation {
  const canonicalDept = canonicalDeptSlug(rawDept);
  const originalParams = toSearchParams(rawSearchParams);
  const workingParams = new URLSearchParams(originalParams.toString());

  const originalSection = originalParams.get("section");
  const originalTab = originalParams.get("tab");

  let canonicalSection: string;
  let canonicalFinancialTab: string | undefined;

  if (canonicalDept === "finance") {
    canonicalSection = "financial";
    if (originalTab && FINANCIAL_TAB_MAP[originalTab]) {
      canonicalFinancialTab = FINANCIAL_TAB_MAP[originalTab];
    } else if (originalSection && originalSection !== "financial" && FINANCIAL_TAB_MAP[originalSection]) {
      canonicalFinancialTab = FINANCIAL_TAB_MAP[originalSection];
    } else {
      canonicalFinancialTab = "dashboard";
    }
  } else if (canonicalDept === "properties") {
    if (originalSection === "dashboard") {
      canonicalSection = "properties";
    } else if (originalSection && isSupportedWorkspaceSection(originalSection)) {
      canonicalSection = originalSection;
    } else {
      canonicalSection = "properties";
    }
  } else if (canonicalDept === "employees") {
    if (originalSection === "employees" || originalSection === "employee") {
      canonicalSection = "users";
    } else if (originalSection && isSupportedWorkspaceSection(originalSection)) {
      canonicalSection = originalSection;
    } else {
      canonicalSection = "users";
    }
  } else if (canonicalDept === "legal") {
    if (originalSection && isSupportedWorkspaceSection(originalSection)) {
      canonicalSection = originalSection;
    } else {
      canonicalSection = "legal";
    }
  } else if (canonicalDept === "marketing") {
    if (originalSection && isSupportedWorkspaceSection(originalSection)) {
      canonicalSection = originalSection;
    } else {
      canonicalSection = "marketing";
    }
  } else {
    canonicalSection = originalSection && isSupportedWorkspaceSection(originalSection) ? originalSection : "properties";
  }

  let needsReplace = false;

  // 1. Dept slug mismatch
  if (rawDept && canonicalDept && rawDept !== canonicalDept) {
    needsReplace = true;
  }

  // 2. Query param normalization
  if (canonicalDept === "finance") {
    if (originalSection && originalSection !== "financial") {
      needsReplace = true;
      workingParams.set("section", "financial");
      workingParams.set("tab", canonicalFinancialTab || "dashboard");
    }
    if (originalTab && FINANCIAL_TAB_MAP[originalTab] && originalTab !== FINANCIAL_TAB_MAP[originalTab]) {
      needsReplace = true;
      workingParams.set("tab", FINANCIAL_TAB_MAP[originalTab]);
    }
  } else if (canonicalDept === "properties") {
    if (originalSection === "dashboard") {
      needsReplace = true;
      workingParams.set("section", "properties");
    } else if (originalSection && !isSupportedWorkspaceSection(originalSection)) {
      needsReplace = true;
      workingParams.set("section", "properties");
    }
  } else if (canonicalDept === "employees") {
    if (originalSection === "employees" || originalSection === "employee") {
      needsReplace = true;
      workingParams.set("section", "users");
    } else if (originalSection && !isSupportedWorkspaceSection(originalSection)) {
      needsReplace = true;
      workingParams.set("section", "users");
    }
  } else {
    if (originalSection && !isSupportedWorkspaceSection(originalSection)) {
      needsReplace = true;
      workingParams.set("section", canonicalSection);
    }
  }

  const qs = workingParams.toString();
  const targetUrl = qs ? `/internal/${canonicalDept}?${qs}` : `/internal/${canonicalDept}`;

  return {
    canonicalDept,
    canonicalSection,
    canonicalFinancialTab,
    targetUrl,
    needsReplace,
  };
}

/**
 * Checks if a user has access to a department.
 * Honors role=admin, department arrays, and granular departmentPermissions.
 * Ensures aliases (finance/financial, properties/offers/orders) are respected,
 * and explicit denies ('none' or false) stay strictly denied.
 */
export function canAccessDepartment(
  user: {
    role?: string;
    departments?: unknown;
    departmentPermissions?: Record<string, unknown>;
  } | null | undefined,
  dept: string
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;

  const canonical = canonicalDeptSlug(dept);
  const rawDepts = Array.isArray(user.departments) ? user.departments : [];
  const depts = new Set(rawDepts.map((d: unknown) => String(d || "").toLowerCase().trim()));
  const perms = (user.departmentPermissions || {}) as Record<string, unknown>;

  const isExplicitlyDenied = (key: string): boolean => {
    const val = perms[key];
    return val === "none" || val === false;
  };

  const isExplicitlyGranted = (key: string): boolean => {
    const val = perms[key];
    return val !== undefined && val !== null && val !== "none" && val !== false;
  };

  if (canonical === "finance") {
    if (isExplicitlyDenied("finance") || isExplicitlyDenied("financial")) {
      return false;
    }
    const hasDept = depts.has("finance") || depts.has("financial");
    const hasPerm = isExplicitlyGranted("finance") || isExplicitlyGranted("financial");
    return hasDept || hasPerm;
  }

  if (canonical === "properties") {
    if (isExplicitlyDenied("properties")) {
      const hasSubDept = depts.has("offers") || depts.has("orders");
      const hasSubPerm =
        (!isExplicitlyDenied("offers") && isExplicitlyGranted("offers")) ||
        (!isExplicitlyDenied("orders") && isExplicitlyGranted("orders"));
      return hasSubDept || hasSubPerm;
    }
    const hasDept =
      depts.has("properties") ||
      depts.has("property") ||
      depts.has("pm") ||
      depts.has("offers") ||
      depts.has("orders");
    const hasPerm =
      isExplicitlyGranted("properties") ||
      isExplicitlyGranted("property") ||
      isExplicitlyGranted("pm") ||
      isExplicitlyGranted("offers") ||
      isExplicitlyGranted("orders");
    return hasDept || hasPerm;
  }

  if (canonical === "employees") {
    if (isExplicitlyDenied("employees") || isExplicitlyDenied("employee")) {
      return false;
    }
    const hasDept = depts.has("employees") || depts.has("employee");
    const hasPerm = isExplicitlyGranted("employees") || isExplicitlyGranted("employee");
    return hasDept || hasPerm;
  }

  if (canonical === "legal") {
    if (isExplicitlyDenied("legal")) {
      return false;
    }
    const hasDept = depts.has("legal");
    const hasPerm = isExplicitlyGranted("legal");
    return hasDept || hasPerm;
  }

  if (canonical === "marketing") {
    if (isExplicitlyDenied("marketing")) {
      return false;
    }
    const hasDept = depts.has("marketing");
    const hasPerm = isExplicitlyGranted("marketing");
    return hasDept || hasPerm;
  }

  return false;
}

/**
 * Normalizes summary statistic values: if failed or unavailable, returns null instead of a false zero.
 */
export function formatSummaryStat(
  value: number | null | undefined,
  isError: boolean
): { displayValue: string | null; isUnavailable: boolean } {
  if (isError || value === null || value === undefined || isNaN(value)) {
    return { displayValue: null, isUnavailable: true };
  }
  return { displayValue: Number(value).toLocaleString("en-US"), isUnavailable: false };
}
