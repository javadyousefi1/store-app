"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Package,
  Search,
  SearchCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { triggerAuthModal } from "@/lib/auth-modal-trigger";
import { registerCartSidebarTrigger } from "@/lib/cart-sidebar-trigger";
import {
  AUTH_SESSION_QUERY_KEY,
  useAuthSession,
  useLogout,
} from "@/hooks/use-auth";

const W = "mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8";
const CartSidebar = dynamic(
  () => import("./cart-sidebar").then((mod) => mod.CartSidebar),
  { ssr: false },
);

const desktopLinks = [
  { href: "/products", label: "فروشگاه", icon: ShoppingBag },
  { href: "/products", label: "جدیدترین‌ها", icon: Sparkles },
  { href: "/#season-picks", label: "منتخب فصل", icon: Star },
] as const;

function SearchBox({ compact = false }: { compact?: boolean }) {
  return (
    <form action="/products" className="relative min-w-0 flex-1">
      <Search
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#81858b] ${
          compact ? "right-3 h-[18px] w-[18px]" : "right-4 h-6 w-6"
        }`}
        strokeWidth={2}
      />
      <input
        type="search"
        name="search"
        placeholder="جستجو"
        aria-label="جستجو در محصولات"
        className={`w-full rounded-xl border-0 bg-[#f0f0f1] text-[#3f4064] outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-primary/20 ${
          compact ? "h-10 pr-10 pl-4 text-xs" : "h-12 pr-12 pl-5 text-sm"
        }`}
      />
    </form>
  );
}

export function StoreHeader() {
  const pathname = usePathname();
  const [cartOpen, setCartOpen] = useState(false);
  const [desktopNavVisible, setDesktopNavVisible] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { data: session } = useAuthSession();
  const logout = useLogout();

  useEffect(() => registerCartSidebarTrigger(() => setCartOpen(true)), []);

  useEffect(() => {
    if (!userMenuOpen) return;

    const closeMenu = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", closeMenu);
    return () => window.removeEventListener("pointerdown", closeMenu);
  }, [userMenuOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    let previousY = window.scrollY;
    let frameId: number | null = null;
    let heroEndY = 180;
    let navVisible = true;
    let direction: "up" | "down" | null = null;
    let directionDistance = 0;
    let lastToggleAt = 0;
    const jitterThreshold = 4;
    const hideDistance = 18;
    const revealDistance = 28;
    const toggleCooldownMs = 180;

    const setNavVisibility = (visible: boolean) => {
      if (navVisible === visible) return;
      navVisible = visible;
      direction = null;
      directionDistance = 0;
      lastToggleAt = performance.now();
      setDesktopNavVisible(visible);
    };

    const measureHeroEnd = () => {
      const heroEnd = document.querySelector<HTMLElement>(
        "[data-home-hero-end]",
      );
      heroEndY = heroEnd
        ? heroEnd.getBoundingClientRect().top + window.scrollY
        : 180;
    };

    const updateNav = () => {
      frameId = null;

      if (!desktopQuery.matches) {
        setNavVisibility(true);
        previousY = window.scrollY;
        direction = null;
        directionDistance = 0;
        return;
      }

      const currentY = window.scrollY;
      const pastHero = currentY > heroEndY - 196;
      const delta = currentY - previousY;
      const coolingDown = performance.now() - lastToggleAt < toggleCooldownMs;

      if (!pastHero || currentY < 40) {
        setNavVisibility(true);
        direction = null;
        directionDistance = 0;
      } else if (coolingDown) {
        direction = null;
        directionDistance = 0;
      } else if (Math.abs(delta) > jitterThreshold) {
        const nextDirection = delta > 0 ? "down" : "up";

        if (direction !== nextDirection) {
          direction = nextDirection;
          directionDistance = 0;
        }

        directionDistance += Math.abs(delta);

        if (nextDirection === "down" && directionDistance >= hideDistance) {
          setNavVisibility(false);
        } else if (
          nextDirection === "up" &&
          directionDistance >= revealDistance
        ) {
          setNavVisibility(true);
        }
      }

      previousY = currentY;
    };

    const handleScroll = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(updateNav);
      }
    };

    const handleViewportChange = () => {
      measureHeroEnd();
      handleScroll();
    };

    measureHeroEnd();
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleViewportChange, { passive: true });
    desktopQuery.addEventListener("change", handleViewportChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleViewportChange);
      desktopQuery.removeEventListener("change", handleViewportChange);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, null);
      queryClient.removeQueries({ queryKey: ["user-orders"] });
      setUserMenuOpen(false);
      toast.success("با موفقیت خارج شدید");
    } catch {
      toast.error("خروج از حساب انجام نشد");
    }
  };

  return (
    <>
      {pathname === "/" && (
        <div className="flex w-full justify-center overflow-hidden bg-[#0038a8] md:hidden">
          <Image
            src="/elina/top-sale-banner.webp"
            alt="بفرمایید تخفیف؛ ارسال رایگان برای خریدهای بالای ۲.۵ میلیون تومان"
            width={866}
            height={90}
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="h-auto w-full max-w-[1100px] object-contain"
          />
        </div>
      )}

      <div className="max-md:sticky max-md:top-0 max-md:z-50 lg:sticky lg:top-0 lg:z-50">
        <div
          className="hidden min-h-11 w-full items-center justify-center overflow-hidden bg-[#ead8c8] px-5 py-1.5 md:flex lg:min-h-[58px] lg:px-6"
          role="region"
          aria-label="پیشنهاد ویژه خرید"
        >
          <div className="promo-message flex items-center justify-center gap-2 text-center text-[#3f332d] sm:gap-3">
            <Sparkles
              className="promo-sparkle hidden h-6 w-6 shrink-0 fill-[#a9413b] text-[#a9413b] sm:block lg:h-8 lg:w-8"
              strokeWidth={2.4}
              aria-hidden="true"
            />
            <strong className="promo-highlight shrink-0 text-xs font-extrabold text-[#a9413b] sm:text-sm lg:text-lg">
              بفرمایید تخفیف
            </strong>
            <span
              className="h-4 w-px shrink-0 bg-[#cdbeb2] sm:h-5"
              aria-hidden="true"
            />
            <span className="text-[11px] font-semibold leading-5 sm:text-sm lg:text-base">
              ارسال رایگان برای خریدهای بالای ۲.۵ میلیون تومان
            </span>
          </div>
        </div>

        <header className="sticky top-0 z-50 border-b border-[#e8e8eb] bg-white text-[#3f4064] shadow-[0_2px_10px_rgba(31,35,48,0.04)] max-md:static lg:static">
          <div className={`${W} hidden h-[76px] items-center gap-6 lg:flex`}>
            <Link
              href="/"
              className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden"
              aria-label="صفحه اصلی الینا"
            >
              <Image
                src="/elina/elina-logo-full.png"
                alt="Elina"
                width={1254}
                height={1254}
                loading="eager"
                fetchPriority="high"
                className="h-full w-full object-contain"
              />
            </Link>

            <div className="max-w-[760px] flex-1">
              <SearchBox />
            </div>

            <div className="mr-auto flex shrink-0 items-center gap-3">
              {session ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((open) => !open)}
                    className="flex h-12 min-w-20 items-center justify-center gap-2 rounded-xl border border-border px-4 text-[#2f3045] transition-colors hover:border-primary/40 hover:bg-brand-50"
                    aria-label="باز کردن منوی حساب کاربری"
                    aria-expanded={userMenuOpen}
                  >
                    <UserRound className="h-5 w-5" strokeWidth={2} />
                    <ChevronDown
                      className={`h-4 w-4 text-[#81858b] transition-transform ${
                        userMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute left-0 top-[calc(100%+8px)] z-[70] w-64 overflow-hidden rounded-2xl border border-[#e8e8eb] bg-white p-2 shadow-[0_16px_42px_rgba(31,35,48,0.18)]">
                      <div
                        dir="ltr"
                        className="border-b border-[#eeeeF0] px-3 py-3 text-right text-sm font-bold text-[#3f4064]"
                      >
                        {session.phone}
                      </div>

                      <nav className="py-1" aria-label="منوی حساب کاربری">
                        <Link
                          href="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-[#4a4d68] transition-colors hover:bg-brand-50 hover:text-primary"
                        >
                          <Package className="h-5 w-5" strokeWidth={1.8} />
                          سفارش‌های من
                        </Link>
                        <Link
                          href="/orders?view=tracking"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-[#4a4d68] transition-colors hover:bg-brand-50 hover:text-primary"
                        >
                          <SearchCheck className="h-5 w-5" strokeWidth={1.8} />
                          پیگیری سفارش
                        </Link>
                        <Link
                          href="/favorites"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-[#4a4d68] transition-colors hover:bg-brand-50 hover:text-primary"
                        >
                          <Heart className="h-5 w-5" strokeWidth={1.8} />
                          علاقه‌مندی‌ها
                        </Link>
                      </nav>

                      <div className="border-t border-[#eeeeF0] pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          disabled={logout.isPending}
                          className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                        >
                          <LogOut className="h-5 w-5" strokeWidth={1.8} />
                          {logout.isPending ? "در حال خروج..." : "خروج"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={triggerAuthModal}
                  className="flex h-12 cursor-pointer items-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold text-[#2f3045] transition-colors hover:border-primary/40 hover:bg-brand-50"
                >
                  <UserRound className="h-5 w-5" strokeWidth={2} />
                  ورود
                  <span className="text-[#a1a3a8]">|</span>
                  ثبت‌نام
                </button>
              )}

              <span className="h-7 w-px bg-[#e0e0e2]" aria-hidden="true" />

              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl transition-colors hover:bg-secondary hover:text-primary"
                aria-label="سبد خرید"
              >
                <ShoppingCart className="h-6 w-6" strokeWidth={1.8} />
              </button>
            </div>
          </div>

          <div
            data-desktop-store-nav
            className={`hidden overflow-hidden transition-[height,opacity] duration-150 ease-out motion-reduce:transition-none lg:block ${
              desktopNavVisible
                ? "h-12 opacity-100"
                : "pointer-events-none h-0 opacity-0"
            }`}
            aria-hidden={!desktopNavVisible}
          >
            <div
              className={`${W} flex h-12 items-center gap-1 transition-transform duration-150 ease-out motion-reduce:transition-none ${
                desktopNavVisible ? "translate-y-0" : "-translate-y-1"
              }`}
            >
              <Link
                href="/#home-categories"
                className="flex h-9 cursor-pointer items-center gap-2 border-l border-[#e0e0e2] pl-4 text-sm font-bold text-[#2f3045] transition-colors hover:text-primary"
              >
                <Menu className="h-5 w-5" />
                دسته‌بندی کالاها
              </Link>

              {desktopLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex h-9 cursor-pointer items-center gap-1.5 px-3 text-xs text-[#62666d] transition-colors hover:text-primary"
                >
                  <item.icon
                    className="h-[18px] w-[18px] text-[#8a8d91]"
                    strokeWidth={1.8}
                  />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className={`${W} lg:hidden`}>
            <div className="flex h-[60px] items-center gap-3 py-2">
              <Link
                href="/"
                className="flex h-11 w-11 shrink-0 items-center overflow-hidden"
                aria-label="صفحه اصلی الینا"
              >
                <Image
                  src="/elina/elina-logo-full.png"
                  alt="Elina"
                  width={1254}
                  height={1254}
                  loading="eager"
                  fetchPriority="high"
                  className="h-full w-full object-contain"
                />
              </Link>

              <SearchBox compact />
            </div>
          </div>
        </header>
      </div>

      {cartOpen && (
        <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
      )}
    </>
  );
}
