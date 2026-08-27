"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ShoppingBag, Store, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { CartCountBadge } from "./cart-count-badge";

const navItems = [
  {
    href: "/",
    label: "خانه",
    icon: House,
    isActive: (path: string) => path === "/",
  },
  {
    href: "/products",
    label: "محصولات",
    icon: Store,
    isActive: (path: string) => path.startsWith("/products"),
  },
  {
    href: "/cart",
    label: "سبد خرید",
    icon: ShoppingBag,
    isActive: (path: string) =>
      path.startsWith("/cart") || path.startsWith("/checkout"),
  },
  {
    href: "/account",
    label: "حساب من",
    icon: UserRound,
    isActive: (path: string) =>
      path.startsWith("/account") || path.startsWith("/orders"),
  },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const hidden =
    pathname.startsWith("/products") || pathname.startsWith("/articles");

  if (hidden) return null;

  return (
    <nav
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-[100] isolate border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_rgba(42,31,65,0.1)] backdrop-blur-xl lg:hidden"
      aria-label="منوی اصلی موبایل"
    >
      <div className="mx-auto grid h-[68px] max-w-xl grid-cols-4">
        {navItems.map((item) => {
          const active = item.isActive(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 touch-manipulation flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition",
                active ? "text-primary" : "text-[#656771] hover:text-primary",
              )}
            >
              <span className="relative flex h-8 w-12 items-center justify-center">
                <item.icon
                  className="h-5 w-5"
                  strokeWidth={active ? 2.2 : 1.8}
                />
                {item.href === "/cart" && (
                  <CartCountBadge className="-top-0.5 left-1/2 -translate-x-1/2" />
                )}
              </span>
              <span className="max-w-full truncate px-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
