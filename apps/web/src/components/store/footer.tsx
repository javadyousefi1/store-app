import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

const W = "mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.04 2a9.82 9.82 0 0 0-8.46 14.8L2 22l5.34-1.53A9.98 9.98 0 1 0 12.04 2Zm0 17.96a8.02 8.02 0 0 1-4.09-1.12l-.29-.17-3.17.91.94-3.08-.19-.31a8 8 0 1 1 6.8 3.77Zm4.4-5.99c-.24-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2a7.25 7.25 0 0 1-1.34-1.67c-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46a.88.88 0 0 0-.64.3c-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.43-.59 1.63-1.15.2-.56.2-1.04.14-1.15-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M21.73 2.27a1.1 1.1 0 0 0-1.13-.16L2.62 9.05c-.78.3-.83 1.38-.08 1.75l4.57 2.24 1.77 5.57c.25.78 1.25.98 1.78.35l2.53-3 4.82 3.55c.62.46 1.5.12 1.65-.64L22 3.3a1.1 1.1 0 0 0-.27-1.03ZM9.62 13.78l-.43 3.17-1.23-3.88 9.43-6.59-7.77 7.3Zm1.14 3.24.3-2.17 1.17 1.07-1.47 1.1Z" />
    </svg>
  );
}

const socialLinks = [
  { label: "اینستاگرام", Icon: InstagramIcon },
  { label: "واتساپ", Icon: WhatsAppIcon },
  { label: "تلگرام", Icon: TelegramIcon },
];

export function StoreFooter() {
  return (
    <footer
      id="footer"
      className="border-t border-border bg-white text-[#514a5c]"
    >
      <div
        className={`${W} pt-10 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-10`}
      >
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4 lg:gap-8">
          <div>
            <Link
              href="/"
              className="mb-4 block h-14 w-36 overflow-hidden"
              aria-label="صفحه اصلی الینا"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/elina/elina-logo.png"
                alt="Elina"
                className="h-full w-full object-contain object-right"
              />
            </Link>
            <h3 className="mb-3 font-semibold text-[#2f263c]">درباره ما</h3>
            <p className="text-xs leading-6 sm:text-sm sm:leading-7">
              الینا؛ انتخابی برای استایل راحت، شیک و زنانه با تمرکز بر کیفیت
              پارچه و جزئیات دوخت.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-[#2f263c]">دسترسی سریع</h3>
            <ul className="space-y-2 text-xs sm:space-y-3 sm:text-sm">
              <li>
                <Link href="/products" className="hover:text-primary">
                  محصولات ما
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-primary">
                  جدیدترین‌ها
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-primary">
                  استایل‌های لینن
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  مجله الینا
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-[#2f263c]">خدمات مشتریان</h3>
            <ul className="space-y-2 text-xs sm:space-y-3 sm:text-sm">
              <li>
                <Link href="#" className="hover:text-primary">
                  سوالات متداول
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  راهنمای سایز
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  شرایط بازگشت
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  حریم خصوصی
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-[#2f263c]">تماس با ما</h3>
            <ul className="space-y-2 break-words text-[11px] sm:space-y-3 sm:text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-600" />
                ۰۲۱-۸۸۴۵۶۷۸
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-600" />
                info@elinaclothes.com
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                تهران، خیابان ولیعصر، پلاک ۱۲۱
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-9 flex flex-col items-center justify-between gap-4 border-t border-border pt-5 sm:flex-row">
          <p className="text-xs text-[#91899a]">
            تمامی حقوق برای Elina محفوظ است.
          </p>
          <div className="flex gap-2">
            {socialLinks.map(({ label, Icon }) => (
              <Link
                href="#"
                key={label}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-brand-600 transition hover:bg-secondary"
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
