"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";
import { CartSidebar } from "./cart-sidebar";
import { useCartCount } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

const W = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

export function StoreHeader() {
  const [cartOpen, setCartOpen] = useState(false);
  const count = useCartCount();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-zinc-100">
        <div className={`${W} h-14 grid grid-cols-3 items-center`}>
          <div className="flex items-center gap-1 justify-start">
            <button className="p-2 rounded-lg hover:bg-zinc-100 transition-colors lg:hidden" aria-label="منو">
              <span className="block w-5 h-0.5 bg-zinc-800 mb-1" />
              <span className="block w-4 h-0.5 bg-zinc-800 mb-1" />
              <span className="block w-5 h-0.5 bg-zinc-800" />
            </button>
            <nav className="hidden lg:flex items-center gap-0.5 text-sm text-zinc-600">
              {["فروشگاه", "ست‌ها", "جدیدترین‌ها"].map((item) => (
                <Link key={item} href="/products" className="px-3 py-1.5 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition-colors whitespace-nowrap">
                  {item}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex justify-center">
            <Link href="/" className="text-2xl font-bold tracking-[0.25em] text-zinc-900">
              YUZ
            </Link>
          </div>

          <div className="flex items-center gap-1 justify-end">
            <Link href="/orders" className="hidden sm:block px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors text-sm text-zinc-500 hover:text-zinc-800 whitespace-nowrap">
              سفارشات
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-lg hover:bg-zinc-100 transition-colors"
              aria-label="سبد خرید"
            >
              <ShoppingCart className="h-5 w-5 text-zinc-800" />
              {count > 0 && (
                <span className={cn(
                  "absolute -top-1 -start-1 min-w-[1.2rem] h-5 rounded-full bg-zinc-900 text-white",
                  "text-[10px] font-bold flex items-center justify-center px-1"
                )}>
                  {count > 99 ? "۹۹+" : count.toLocaleString("fa-IR")}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className={`${W} pb-3`}>
          <Link href="/products" className="flex items-center gap-2 w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-400 hover:border-zinc-300 transition-colors">
            <Search className="h-4 w-4 shrink-0" />
            جستجو در YUZ...
          </Link>
        </div>
      </header>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
