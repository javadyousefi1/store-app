import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import type { Product } from "@/types";

interface Props {
  products: Product[];
  categoryName?: string;
  categorySlug?: string;
  categoryId?: string;
}

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://elinaclothes.com";

/**
 * "محصولات مشابه" rail rendered at the bottom of the PDP. Horizontal
 * snap-scroll on mobile so the shopper can flick through a few peers
 * without scrolling the whole page, promotes to a 3/4-column grid at
 * ≥sm/lg. Also emits an ItemList JSON-LD so Google can render a
 * carousel-style rich result if it decides to.
 */
export function RelatedProducts({
  products,
  categoryName,
  categorySlug,
  categoryId,
}: Props) {
  if (!products.length) return null;

  const seeAllHref = categorySlug
    ? `/category/${encodeURIComponent(categorySlug)}`
    : categoryId
      ? `/products?categoryId=${categoryId}`
      : "/products";

  const heading = categoryName
    ? `محصولات مشابه در دسته «${categoryName}»`
    : "محصولات مشابه";

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: heading,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl}/products/${encodeURIComponent(p.slug)}`,
      name: p.name,
    })),
  };

  return (
    <section
      aria-labelledby="related-products-heading"
      className="mt-10 border-t pt-8 sm:mt-14 sm:pt-10"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
        <div className="min-w-0">
          <h2
            id="related-products-heading"
            className="truncate text-lg font-bold text-foreground sm:text-xl"
          >
            {heading}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            پیشنهاد ما بر اساس دستهٔ همین محصول
          </p>
        </div>
        <Link
          href={seeAllHref}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-brand-700 sm:text-sm"
        >
          مشاهده همه
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Mobile: horizontal snap rail with edge-bleed. Desktop: standard grid. */}
      <ul
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {products.map((product) => (
          <li
            key={product.id}
            className="w-44 shrink-0 snap-start sm:w-auto"
            style={{ scrollSnapAlign: "start" }}
          >
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
