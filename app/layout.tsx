import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Header from "./src/components/Header";
import PageWrapper from "./src/components/PageWrapper";
import { LanguageProvider } from "@/context/LanguageContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "دير عقارك",
  description: "دير عقارك - منصة عقارية شاملة",
};

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
              <HotToaster position="top-center" />
            </TooltipProvider>
          </NotificationProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
