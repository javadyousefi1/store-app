"use client";

import Link from "next/link";
import { Heart, LogIn, Package, SearchCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/use-auth";
import { triggerAuthModal } from "@/lib/auth-modal-trigger";

const accountLinks = [
  {
    href: "/orders",
    label: "سفارش‌های من",
    description: "مشاهده سوابق خرید و وضعیت سفارش‌ها",
    icon: Package,
  },
  {
    href: "/orders?view=tracking",
    label: "پیگیری سفارش",
    description: "بررسی آخرین وضعیت ارسال سفارش",
    icon: SearchCheck,
  },
  {
    href: "/favorites",
    label: "علاقه‌مندی‌ها",
    description: "محصولاتی که ذخیره کرده‌اید",
    icon: Heart,
  },
] as const;

export default function AccountPage() {
  const { data: session, isLoading } = useAuthSession();

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100svh-128px)] items-center justify-center pb-4 md:min-h-[45svh] md:pb-0">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto flex min-h-[calc(100svh-128px)] max-w-lg flex-col items-center justify-center px-5 pb-4 text-center md:min-h-[55svh] md:pb-0">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <UserRound className="h-9 w-9 text-primary" />
        </div>
        <h1 className="mt-5 text-xl font-bold">حساب کاربری</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          برای مشاهده سفارش‌ها و اطلاعات حساب وارد شوید.
        </p>
        <Button
          type="button"
          onClick={triggerAuthModal}
          className="mt-5 h-11 gap-2 px-6"
        >
          <LogIn className="h-4 w-4" />
          ورود یا ثبت‌نام
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-7 sm:px-6 sm:py-10">
      <section className="rounded-2xl bg-gradient-to-l from-brand-700 to-brand-500 p-5 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
            <UserRound className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-lg font-bold">حساب من</h1>
            <p className="mt-1 font-mono text-sm" dir="ltr">
              {session.phone}
            </p>
          </div>
        </div>
      </section>

      <nav className="mt-5 space-y-2" aria-label="بخش‌های حساب کاربری">
        {accountLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-primary/30 hover:bg-brand-50"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">{item.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
}
