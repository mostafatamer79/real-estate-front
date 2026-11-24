export type CinematicRouteFamily = "public" | "browse" | "workspace" | "support" | "admin" | "internal" | "auth";

export function cinematicRouteFamily(pathname: string | null): CinematicRouteFamily {
  const path = pathname || "/";
  if (path === "/" || path.startsWith("/about") || path.startsWith("/info") || path.startsWith("/share-opinion")) return "public";
  if (/^\/(login|nafath-login|verify-otp|complete-profile)(\/|$)/.test(path)) return "auth";
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/internal") || path.startsWith("/department-hub")) return "internal";
  if (path.startsWith("/customerservice") || path.startsWith("/chat")) return "support";
  if (path.startsWith("/offers") || path.startsWith("/services") || path.startsWith("/service-providers") || path.startsWith("/scan-map")) return "browse";
  return "workspace";
}
