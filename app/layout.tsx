import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Header from "./src/components/Header";
import PageWrapper from "./src/components/PageWrapper";
import { LanguageProvider } from "@/context/LanguageContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { Toaster as SonnerToaster } from "sonner";
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
      settings.find((s) => s.key === "theme_appName")?.value || "دير عقارك";
    const description =
      settings.find((s) => s.key === "theme_description")?.value ||
      "دير عقارك - منصة عقارية شاملة";

    return {
      title: appName,
      description,
    };
  } catch {
    // Fall back to static metadata when the API is unavailable at build time.
  }

  return {
    title: "دير عقارك",
    description: "دير عقارك - منصة عقارية شاملة",
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
        <SettingsProvider>
          <LanguageProvider>
            <NotificationProvider>
              <TooltipProvider>
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <PageWrapper>
                    {children}
                  </PageWrapper>
                </div>
                <Toaster />
                <SonnerToaster richColors />
                <HotToaster position="top-center" />
              </TooltipProvider>
            </NotificationProvider>
          </LanguageProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
