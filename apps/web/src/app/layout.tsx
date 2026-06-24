import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";
import { AuthModalProvider } from "@/providers/auth-modal-provider";
import "./globals.css";

const vazirmatn = localFont({
  src: "../../public/fonts/Vazirmatn.woff2",
  display: "swap",
  preload: true,
  variable: "--font-vazirmatn",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://elinaclothes.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "الینا",
  title: {
    default: "الینا | فروشگاه آنلاین لباس زنانه",
    template: "%s | الینا",
  },
  description:
    "خرید آنلاین پوشاک زنانه الینا؛ جدیدترین مانتو، تیشرت، ست، شلوار و استایل‌های روز با ارسال سریع و ضمانت بازگشت.",
  keywords: [
    "فروشگاه لباس زنانه",
    "خرید لباس زنانه",
    "مانتو زنانه",
    "تیشرت زنانه",
    "ست زنانه",
    "پوشاک الینا",
  ],
  authors: [{ name: "Elina" }],
  creator: "Elina",
  publisher: "Elina",
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "/",
    siteName: "الینا",
    title: "الینا | فروشگاه آنلاین لباس زنانه",
    description:
      "جدیدترین پوشاک و استایل‌های زنانه با ارسال سریع و ضمانت بازگشت.",
    images: [
      {
        url: "/elina/elina-logo-full.png",
        width: 1254,
        height: 1254,
        alt: "لوگوی فروشگاه آنلاین پوشاک زنانه الینا",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "الینا | فروشگاه آنلاین لباس زنانه",
    description:
      "جدیدترین پوشاک و استایل‌های زنانه با ارسال سریع و ضمانت بازگشت.",
    images: ["/elina/elina-logo-full.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "الینا",
      alternateName: "Elina",
      url: siteUrl,
      logo: `${siteUrl}/elina/elina-logo-full.png`,
      email: "info@elinaclothes.com",
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "فروشگاه آنلاین الینا",
      inLanguage: "fa-IR",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/products?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fa-IR"
      dir="rtl"
      className={`${vazirmatn.variable} h-full`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full antialiased">
        <a className="skip-link" href="#main-content">
          رفتن به محتوای اصلی
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <QueryProvider>
          <AuthModalProvider>{children}</AuthModalProvider>
          <Toaster richColors position="top-center" />
        </QueryProvider>
      </body>
    </html>
  );
}
