"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart, LogIn, LogOut, Package, SearchCheck, Settings2, ShieldCheck, UserRound,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AUTH_SESSION_QUERY_KEY, useAuthSession, useLogout } from "@/hooks/use-auth";
import { QuickAccessItem } from "@/components/store/account/quick-access-item";

const accountLinks = [
  { href: "/orders",                 label: "سفارش‌های من",   description: "سوابق خرید و وضعیت سفارش‌ها",       icon: Package },
  { href: "/orders?view=tracking",   label: "پیگیری سفارش",   description: "بررسی آخرین وضعیت ارسال",            icon: SearchCheck },
  { href: "/favorites",              label: "علاقه‌مندی‌ها",   description: "محصولاتی که ذخیره کرده‌اید",         icon: Heart },
] as const;

const ROLE_LABEL: Record<string, string> = { admin: "مدیر", user: "کاربر" };

export default function AccountPage() {
  const { data: session, isLoading } = useAuthSession();
  const queryClient = useQueryClient();
  const logout = useLogout();
  const [logoutOpen, setLogoutOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, null);
      queryClient.removeQueries({ queryKey: ["user-orders"] });
      setLogoutOpen(false);
      toast.success("با موفقیت خارج شدید");
    } catch {
      toast.error("خروج از حساب انجام نشد");
    }
  }

  if (isLoading) return <AccountSkeleton />;
  if (!session) return <UnauthenticatedState />;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      {/* ── Profile card (plain, no gradient) ──────────────────────── */}
      <Card>
        <CardContent className="flex items-center gap-3.5">
          <Avatar size="lg" className="size-12">
            <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
              <UserRound className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm font-semibold text-foreground" dir="ltr">
                {session.phone}
              </p>
              {session.role === "admin" && (
                <Badge
                  variant="secondary"
                  className="h-5 gap-1 border-0 bg-primary/10 px-1.5 text-[10px] font-bold text-primary"
                >
                  <ShieldCheck className="h-3 w-3" />
                  {ROLE_LABEL[session.role]}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">حساب کاربری فعال</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Quick access ────────────────────────────────────────────── */}
      <section className="space-y-3" aria-label="دسترسی سریع">
        <p className="px-1 text-xs font-semibold text-muted-foreground">دسترسی سریع</p>
        <div className="space-y-2.5">
          {accountLinks.map((item) => (
            <QuickAccessItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              description={item.description}
            />
          ))}
        </div>
      </section>

      {/* ── Account settings (logout lives here) ────────────────────── */}
      <section className="space-y-3" aria-label="تنظیمات حساب">
        <p className="px-1 text-xs font-semibold text-muted-foreground">تنظیمات حساب</p>
        <Card>
          <CardContent className="p-0">
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              disabled={logout.isPending}
              className="flex w-full items-center gap-3 px-3.5 text-start transition-colors hover:bg-accent/40 disabled:opacity-60"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/70">
                <LogOut className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1 space-y-0.5">
                <span className="block text-sm font-semibold leading-tight text-foreground">
                  خروج از حساب
                </span>
                <span className="block text-xs text-muted-foreground">
                  {logout.isPending ? "در حال خروج..." : "خارج شدن از حساب کاربری"}
                </span>
              </span>
            </button>
          </CardContent>
        </Card>
      </section>

      {/* Logout confirm — Dialog styled as AlertDialog (destructive) */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">آیا مطمئنید می‌خواهید خارج شوید؟</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-6 text-muted-foreground">
            برای ورود مجدد به کد تأیید که به شماره‌ی
            <span className="mx-1 font-mono font-semibold text-foreground" dir="ltr">{session.phone}</span>
            ارسال می‌شود نیاز خواهید داشت.
          </p>
          <DialogFooter className="flex-row justify-end gap-2">
            <DialogClose
              render={<Button variant="outline" disabled={logout.isPending}>انصراف</Button>}
            />
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={logout.isPending}
              className="gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              {logout.isPending ? "در حال خروج..." : "خروج"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────────────────── States ─────────────────────────── */

function AccountSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <Skeleton className="h-[80px] rounded-xl" />
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-[70px] rounded-lg" />
        <Skeleton className="h-[70px] rounded-lg" />
        <Skeleton className="h-[70px] rounded-lg" />
      </div>
      <Separator />
      <Skeleton className="h-[70px] rounded-lg" />
    </div>
  );
}

function UnauthenticatedState() {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-128px)] max-w-lg items-center justify-center px-5 pb-6 md:min-h-[55svh] md:pb-0">
      <Card className="w-full">
        <CardHeader className="items-center pb-2 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Settings2 className="h-7 w-7 text-primary" />
          </span>
          <CardTitle className="text-lg">حساب کاربری</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm leading-6 text-muted-foreground">
            برای مشاهده‌ی سفارش‌ها، پیگیری ارسال و ذخیره‌ی علاقه‌مندی‌ها وارد شوید.
          </p>
          <Link
            href="/login?from=/account"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <LogIn className="h-4 w-4" />
            ورود | ثبت‌نام
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
