import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";
import { AuthModalProvider } from "@/providers/auth-modal-provider";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "پنل مدیریت فروشگاه",
  description: "سیستم مدیریت فروشگاه",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full`}>
      <body className="min-h-full antialiased" style={{ fontFamily: "var(--font-vazirmatn), sans-serif" }}>
        <QueryProvider>
          <AuthModalProvider>
            {children}
          </AuthModalProvider>
          <Toaster richColors position="top-center" />
        </QueryProvider>
      </body>
    </html>
  );
}
