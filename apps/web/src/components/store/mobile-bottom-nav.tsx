"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  LayoutGrid,
  ShoppingBag,
  Store,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CartCountBadge } from "./cart-count-badge";

const MobileCategoryDrawer = dynamic(
  () =>
    import("./mobile-nav-overlays").then((mod) => mod.MobileCategoryDrawer),
  { ssr: false },
);

const navItems = [
  {
    href: "/",
    label: "خانه",
    icon: House,
    isActive: (path: string, hash: string) =>
      path === "/" && hash !== "#home-categories",
  },
  {
    action: "categories" as const,
    label: "دسته‌بندی",
    icon: LayoutGrid,
    isActive: () => false,
  },
  {
    href: "/products",
    label: "فروشگاه",
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
  const [hash, setHash] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    setCategoriesOpen(false);
  }, [pathname]);

  const goHome = (event: React.MouseEvent<HTMLAnchorElement>) => {
    setCategoriesOpen(false);
    if (pathname !== "/") return;
    event.preventDefault();
    window.history.replaceState(null, "", "/");
    setHash("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <nav
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-[100] isolate border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_rgba(42,31,65,0.1)] backdrop-blur-xl lg:hidden"
        aria-label="منوی اصلی موبایل"
      >
        <div className="mx-auto grid h-[68px] max-w-xl grid-cols-5">
          {navItems.map((item) => {
            const active = item.isActive(pathname, hash);
            const className = cn(
              "flex min-w-0 touch-manipulation flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition",
              active ? "text-primary" : "text-[#656771] hover:text-primary",
            );
            const content = (
              <>
                {/* Active = color + heavier stroke only. No background pill. */}
                <span className="relative flex h-8 w-12 items-center justify-center">
                  <item.icon
                    className="h-5 w-5"
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  {"href" in item && item.href === "/cart" && (
                    <CartCountBadge className="-top-0.5 left-1/2 -translate-x-1/2" />
                  )}
                </span>
                <span className="max-w-full truncate px-1">{item.label}</span>
              </>
            );

            if ("action" in item) {
              return (
                <button
                  key={item.action}
                  type="button"
                  onClick={() => setCategoriesOpen(true)}
                  className={className}
                  aria-haspopup="dialog"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={
                  item.href === "/"
                    ? goHome
                    : () => setCategoriesOpen(false)
                }
                className={className}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>

      <MobileCategoryDrawer
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
      />
    </>
  );
}
