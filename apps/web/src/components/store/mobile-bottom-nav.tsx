"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  LayoutGrid,
  ShoppingBag,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MobileCategoryDrawer,
  MobileProductFilterDialog,
} from "./mobile-nav-overlays";

const navItems = [
  {
    href: "/",
    label: "خانه",
    icon: House,
    isActive: (path: string, hash: string) =>
      path === "/" && hash !== "#home-categories",
  },
  {
    action: "categories",
    label: "دسته‌بندی",
    icon: LayoutGrid,
    isActive: () => false,
  },
  {
    action: "filters",
    label: "فیلتر",
    icon: SlidersHorizontal,
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
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const goHome = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return;
    event.preventDefault();
    window.history.replaceState(null, "", "/");
    setHash("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <nav
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-[80] isolate border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_rgba(42,31,65,0.1)] backdrop-blur-xl lg:hidden"
        aria-label="منوی اصلی موبایل"
      >
        <div className="mx-auto grid h-[68px] max-w-xl grid-cols-5">
          {navItems.map((item) => {
            const active = item.isActive(pathname, hash);
            const className = cn(
              "flex min-w-0 touch-manipulation flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition",
              active ? "text-primary" : "text-[#777982] hover:text-primary",
            );
            const content = (
              <>
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition",
                    active && "bg-secondary",
                  )}
                >
                  <item.icon
                    className={cn("h-5 w-5", active && "fill-primary/10")}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                </span>
                <span className="max-w-full truncate px-1">{item.label}</span>
              </>
            );

            if ("action" in item) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (item.action === "categories") setCategoriesOpen(true);
                    if (item.action === "filters") setFiltersOpen(true);
                  }}
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
                onClick={item.href === "/" ? goHome : undefined}
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
      <MobileProductFilterDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
      />
    </>
  );
}
