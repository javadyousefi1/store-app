import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface HomeCatalogGatewayProps {
  products: Product[];
}

export function HomeCatalogGateway({ products }: HomeCatalogGatewayProps) {
  const tiles = products.slice(0, 12);
  if (tiles.length === 0) return null;

  return (
    <section
      aria-labelledby="home-gateway-heading"
      className="pb-10 sm:pb-14"
    >
      <h2 id="home-gateway-heading" className="sr-only">
        ورود به فروشگاه الینا
      </h2>

      <div className="flex items-stretch gap-3 sm:gap-4">
        {/* Threshold card — first in DOM (right side in RTL), fixed width, does NOT scroll.
            Anchors the rail; products drift past it. */}
        <Link
          href="/products"
          aria-label="مشاهده همه محصولات فروشگاه الینا"
          className="group relative flex w-40 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-l from-brand-400 via-brand-500 to-brand-700 p-5 shadow-[0_18px_40px_rgba(83,58,147,0.18)] transition duration-300 hover:shadow-[0_24px_50px_rgba(83,58,147,0.24)] sm:w-56 sm:p-6 lg:w-72 lg:p-7"
        >
          {/* Ambient top-right glow — one restrained atmospheric accent. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-14 -right-14 h-36 w-36 rounded-full bg-white/10 blur-2xl"
          />
          {/* Thin hairline at the bottom — the "threshold" signature. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-5 bottom-0 h-px bg-gradient-to-l from-transparent via-white/30 to-transparent sm:inset-x-6 lg:inset-x-7"
          />

          <div className="relative flex w-full flex-col justify-between gap-6 text-white">
            <div>
              {/* Logo as the brand eyebrow — clean, upright, sized like a wordmark.
                  brightness-0 invert forces the PNG to solid white. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/elina/elina-logo-full.png"
                alt="الینا"
                className="h-9 w-9 object-contain opacity-90 [filter:brightness(0)_invert(1)] sm:h-11 sm:w-11 lg:h-12 lg:w-12"
              />
              <p className="mt-4 text-lg font-bold leading-[1.3] sm:text-[22px] sm:leading-[1.25] lg:text-[26px] lg:leading-[1.2]">
                همه‌ی کالکشن
                <span className="mt-0.5 block text-white/85">اینجاست</span>
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold transition-transform duration-300 group-hover:-translate-x-1 sm:text-sm">
              <span>دیدن همه محصولات</span>
              <ArrowLeft
                className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
                aria-hidden="true"
              />
            </div>
          </div>
        </Link>

        {/* Horizontal product rail — products drift past the fixed threshold card.
            Inner flex has pt-1 pb-4 so hover-lift + shadow have breathing room without clipping. */}
        <div
          className="min-w-0 flex-1 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x mandatory" }}
        >
          <div className="flex gap-3 pb-5 pt-2 sm:gap-4 sm:pb-6">
            {tiles.map((product) => {
              const outOfStock = !product.inStock;
              return (
                <article
                  key={product.id}
                  className={cn(
                    "group relative w-36 shrink-0 overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(42,31,65,0.05)] transition duration-300 sm:w-44 lg:w-52",
                    outOfStock
                      ? "hover:shadow-[0_10px_26px_rgba(42,31,65,0.08)]"
                      : "hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(42,31,65,0.12)]",
                  )}
                  style={{ scrollSnapAlign: "start" }}
                >
                  <Link
                    href={`/products/${product.slug}`}
                    className="relative block aspect-[3/4] overflow-hidden bg-muted"
                    aria-label={
                      outOfStock
                        ? `مشاهده ${product.name} — ناموجود`
                        : `مشاهده ${product.name}`
                    }
                  >
                    {product.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.coverUrl}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className={cn(
                          "absolute inset-0 h-full w-full object-cover transition duration-500",
                          outOfStock
                            ? "grayscale opacity-75"
                            : "group-hover:scale-[1.035]",
                        )}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-brand-200" />
                    )}
                    {outOfStock && (
                      <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-[#2f2938]/85 py-1.5 text-[11px] font-semibold tracking-wide text-white backdrop-blur-sm">
                        ناموجود
                      </span>
                    )}
                  </Link>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <h3 className="min-w-0 truncate text-right text-xs font-medium text-[#37303d] sm:text-sm">
                      {product.name}
                    </h3>
                    {product.minPrice != null && (
                      <p
                        className={cn(
                          "shrink-0 text-xs font-bold sm:text-sm",
                          outOfStock
                            ? "text-muted-foreground line-through decoration-1"
                            : "text-primary",
                        )}
                      >
                        <span className="sr-only">قیمت </span>
                        {formatPrice(product.minPrice)}
                        <span className="mr-0.5 text-[10px] font-normal">ت</span>
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
