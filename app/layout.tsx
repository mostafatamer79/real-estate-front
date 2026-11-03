import type { Metadata, Viewport } from "next";
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
import BusinessVerificationFooter from "@/components/BusinessVerificationFooter";
import { SITE_NAME, SITE_DESCRIPTION, getSiteUrl, buildPageMetadata } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
  interactiveWidget: "resizes-content",
};

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateMetadata(): Metadata {
  return {
    ...buildPageMetadata("/", SITE_NAME, SITE_DESCRIPTION, { index: false }),
    metadataBase: new URL(getSiteUrl()),
    applicationName: SITE_NAME,
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icons/icon-512x512.png", apple: "/icons/icon-512x512.png" },
    appleWebApp: { capable: true, statusBarStyle: "default", title: SITE_NAME },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
      other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background overscroll-none`}
        suppressHydrationWarning
      >
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none opacity-15">
          {Array.from({ length: 30 }).map((_, i) => {
            const left = `${(i * 137) % 100}%`;
            const top = `${(i * 93) % 100}%`;
            const size = 30 + (i % 4) * 15; // 30px to 75px
            const maxOpacity = 0.02 + (i % 3) * 0.01; // 0.02 to 0.04
            const rotate = `${180 + (i % 3) * 90}deg`;
            
            return (
              <div
                key={i}
                className="absolute dark:invert"
                style={{
                  left,
                  top,
                  width: `${size}px`,
                  height: `${size}px`,
                  opacity: maxOpacity,
                  transform: `rotate(${rotate})`,
                  backgroundImage: "url('/icons/black.png')",
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
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
                    <BusinessVerificationFooter />
                    <AdminImpersonationReturn />
                  </div>
                  <Toaster />
                  <SonnerToaster
                    richColors
                    position="top-center"
                    toastOptions={{
                      duration: 4000,
                    }}
                    className="md:top-4"
                  />
                  <HotToaster
                    position="top-center"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        borderRadius: "24px",
                        background: "#ffffff",
                        color: "rgb(15 23 42)",
                        border: "1px solid rgb(226 232 240)",
                        boxShadow: "0 20px 60px rgba(15, 23, 42, 0.16)",
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
