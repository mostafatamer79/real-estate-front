import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const app = path.join(root, "app");
const output = import.meta.dirname;

function pages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return pages(file);
    return entry.name === "page.tsx" ? [file] : [];
  });
}

const names = {
  admin: "الإدارة", customerservice: "خدمة العملاء", financial: "المالية",
  details: "لوحة المعلومات", profile: "الملف الشخصي", offers: "العروض العقارية",
  orders: "الطلبات", services: "الخدمات العقارية", wallet: "المحفظة",
  marketing: "التسويق العقاري", buildingmanagement: "إدارة المباني",
  disputes: "النزاعات", chat: "المحادثات", about: "عن المنصة",
  info: "معلومات المنصة", login: "تسجيل الدخول", "nafath-login": "الدخول عبر نفاذ",
  "verify-otp": "رمز التحقق", "complete-profile": "إكمال الملف الشخصي",
  "share-opinion": "شارك رأيك", "scan-map": "الخريطة", "service-providers": "مقدمو الخدمات",
  "department-hub": "مركز الأقسام", internal: "مساحة العمل", subscriptions: "الاشتراكات",
  checkout: "الدفع", contact: "تواصل معنا", faq: "الأسئلة الشائعة",
  support: "الدعم الفني", legal: "الخدمات القانونية", "legal-requests": "الطلبات القانونية",
  "my-requests": "طلباتي", "provider-requests": "طلبات مقدمي الخدمات",
  form: "نموذج الخدمة", new: "جديد", dashboard: "لوحة التحكم",
  "customer-service": "خدمة العملاء", "info-content": "المحتوى التعريفي",
  "map-control": "إدارة الخريطة", operations: "العمليات", opinions: "الآراء",
  packages: "الباقات", "properties-management": "إدارة العقارات",
  "purchase-requests": "طلبات الشراء", "service-requests": "طلبات الخدمات",
  settings: "الإعدادات", transactions: "المعاملات", trends: "الاتجاهات",
  users: "المستخدمون", "visit-requests": "طلبات الزيارة", "renew-subscription": "تجديد الاشتراك",
  "[id]": "التفاصيل", "[dept]": "القسم", "[roomId]": "المحادثة",
  home: "الرئيسية",
};

function kind(route) {
  if (route === "/") return "public";
  if (route === "/profile") return "account";
  if (route.endsWith("/[id]")) return "detail";
  if (/\/(login|nafath-login|verify-otp|complete-profile)$/.test(route)) return "auth";
  if (/\/(new|form|contact|support|share-opinion|checkout|settings|renew-subscription)$/.test(route)) return "form";
  if (route.includes("chat")) return "chat";
  if (route.includes("map")) return "map";
  if (/\/(about|info|faq)$/.test(route)) return "article";
  if (route === "/admin" || route === "/internal/[dept]" || /\/(details|home|dashboard|department-hub|internal|financial|wallet|marketing|buildingmanagement)$/.test(route)) return "dashboard";
  if (/\/(services|offers|service-providers|legal)$/.test(route)) return "catalog";
  return "records";
}

const routes = pages(app).map((file) => {
  const route = "/" + path.relative(app, path.dirname(file)).replaceAll(path.sep, "/");
  const url = route === "/." ? "/" : route;
  const parts = url.split("/").filter(Boolean);
  return {
    route: url,
    title: url === "/" ? "الصفحة الرئيسية" : parts.map((part) => names[part] || part).join(" / "),
    group: names[parts[0]] || "الصفحات العامة",
    kind: kind(url),
  };
}).sort((a, b) => a.route.localeCompare(b.route));

const template = fs.readFileSync(path.join(output, "preview-template.html"), "utf8");
const style = fs.readFileSync(path.join(output, "preview-style.css"), "utf8");
const script = fs.readFileSync(path.join(output, "preview-app.js"), "utf8");
const variants = [
  ["01-calm-platform.html", "canvas", "الصفحة البيضاء", "تكوين معماري واسع، صورة رئيسية، وحركة دخول سينمائية."],
  ["02-guided-workspace.html", "command", "مساحة القيادة", "شريط جانبي فحمي، بيانات مركزة، وانتقالات عملية سريعة."],
  ["03-editorial-atlas.html", "edition", "النسخة التحريرية", "عناوين جريئة، تخطيط غير متماثل، وحركة تكشف المحتوى تدريجيًا."],
];
for (const [filename, variant, name, description] of variants) {
  fs.writeFileSync(path.join(output, filename), template
    .replaceAll("__VARIANT__", variant)
    .replaceAll("__NAME__", name)
    .replaceAll("__DESCRIPTION__", description)
    .replace("__ROUTES__", JSON.stringify(routes).replaceAll("<", "\\u003c"))
    .replace("__STYLE__", style)
    .replace("__SCRIPT__", script.replaceAll("__VARIANT__", variant).replaceAll("__NAME__", name)));
}
fs.copyFileSync(path.join(root, "public/icons/black.png"), path.join(output, "brand.png"));
console.log(`Generated ${variants.length} HTML previews, each covering ${routes.length} routes.`);
