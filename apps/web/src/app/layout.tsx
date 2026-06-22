import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";
import { AuthModalProvider } from "@/providers/auth-modal-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elina | فروشگاه آنلاین لباس زنانه",
  description: "فروشگاه آنلاین پوشاک زنانه الینا",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className="h-full" data-scroll-behavior="smooth">
      <body className="min-h-full antialiased">
        <QueryProvider>
          <AuthModalProvider>{children}</AuthModalProvider>
          <Toaster richColors position="top-center" />
        </QueryProvider>
      </body>
    </html>
  );
}
