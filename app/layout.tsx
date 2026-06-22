import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog-provider";
import Header from "./src/components/Header";
import PageWrapper from "./src/components/PageWrapper";
import AdminImpersonationReturn from "./src/components/AdminImpersonationReturn";
import { LanguageProvider } from "@/context/LanguageContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fetchPublicSettings } from "@/lib/runtime-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await fetchPublicSettings();
    const appName =
      settings.find((s) => s.key === "theme_appName")?.value || "الوساطة الرقمية";
    const description =
      settings.find((s) => s.key === "theme_description")?.value ||
      "الوساطة الرقمية - منصة عقارية شاملة";

    return {
      title: appName,
      description,
    };
  } catch {
    // Fall back to static metadata when the API is unavailable at build time.
  }

  return {
    title: "الوساطة الرقمية",
    description: "الوساطة الرقمية - منصة عقارية شاملة",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none">
          {Array.from({ length: 30 }).map((_, i) => {
            const left = `${(i * 137) % 100}%`;
            const size = 30 + (i % 4) * 15; // 30px to 75px
            const delay = `${i * -1.2}s`;
            const duration = `${22 + (i % 3) * 8}s`;
            const maxOpacity = 0.06 + (i % 3) * 0.03; // 0.06 to 0.12
            const drift = `${-50 + (i % 3) * 50}px`;
            const rotate = `${180 + (i % 3) * 90}deg`;
            
            return (
              <div
                key={i}
                className="absolute animate-float-particle dark:invert"
                style={{
                  left,
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundImage: "url('/icons/black.png')",
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  ["--duration" as any]: duration,
                  ["--delay" as any]: delay,
                  ["--max-opacity" as any]: maxOpacity,
                  ["--drift" as any]: drift,
                  ["--rotate" as any]: rotate,
                } as React.CSSProperties}
              />
            );
          })}
        </div>
        <SettingsProvider>
          <LanguageProvider>
            <NotificationProvider>
              <ConfirmDialogProvider>
                <TooltipProvider>
                  <div className="flex flex-col min-h-screen">
                    <Header />
                    <PageWrapper>
                      {children}
                    </PageWrapper>
                    <AdminImpersonationReturn />
                  </div>
                  <Toaster />
                  <SonnerToaster richColors position="top-center" />
                  <HotToaster
                    position="top-center"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        borderRadius: "24px",
                        background: "rgba(255,255,255,0.96)",
                        color: "rgb(15 23 42)",
                        border: "1px solid rgb(226 232 240)",
                        boxShadow: "0 20px 60px rgba(15, 23, 42, 0.16)",
                        backdropFilter: "blur(18px)",
                        padding: "14px 16px",
                        fontWeight: "700",
                      },
                      success: {
                        iconTheme: {
                          primary: "#10b981",
                          secondary: "#ffffff",
                        },
                      },
                      error: {
                        iconTheme: {
                          primary: "#ef4444",
                          secondary: "#ffffff",
                        },
                      },
                    }}
                  />
                </TooltipProvider>
              </ConfirmDialogProvider>
            </NotificationProvider>
          </LanguageProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
