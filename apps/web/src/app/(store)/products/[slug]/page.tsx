import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/server-fetch";
import { ProductDetailClient } from "@/components/store/product-detail-client";
import type { Attribute, ProductDetail } from "@/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://elinaclothes.com";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await apiFetch<ProductDetail>(`/products/by-slug/${slug}`);
    const description =
      product.description?.slice(0, 155) ||
      `خرید ${product.name} از فروشگاه آنلاین الینا`;

    return {
      title: product.name,
      description,
      alternates: {
        canonical: `/products/${encodeURIComponent(slug)}`,
      },
      openGraph: {
        type: "website",
        title: product.name,
        description,
        url: `/products/${encodeURIComponent(slug)}`,
        images: product.coverUrl ? [{ url: product.coverUrl }] : undefined,
      },
    };
  } catch {
    return {
      title: "محصول",
      robots: {
        index: false,
        follow: true,
      },
    };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  let product: ProductDetail;
  try {
    product = await apiFetch<ProductDetail>(`/products/by-slug/${slug}`);
  } catch {
    notFound();
  }

  const attributes = await apiFetch<Attribute[]>("/attributes").catch(
    () => [] as Attribute[],
  );

  // Build value → label lookup for all attributes that have a label
  const valueLabels: Record<string, string> = {};
  for (const attr of attributes) {
    for (const v of attr.values) {
      if (v.label) valueLabels[v.value] = v.label;
    }
  }

  const canonicalUrl = `${siteUrl}/products/${encodeURIComponent(slug)}`;
  const categorySlug = product.category?.slug;
  const categoryHref = categorySlug
    ? `${siteUrl}/category/${encodeURIComponent(categorySlug)}`
    : `${siteUrl}/products?categoryId=${product.categoryId}`;

  const totalStock = product.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
  const availability =
    totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  const variantPrices = product.variants
    .map((v) => Number(v.price))
    .filter((p) => !Number.isNaN(p) && p > 0);
  const minPrice = variantPrices.length ? Math.min(...variantPrices) : undefined;
  const maxPrice = variantPrices.length ? Math.max(...variantPrices) : undefined;

  // Valid-until date for Offer — Google warns without it. Roll a year out.
  const priceValidUntil = new Date();
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);

  const productImages = product.coverUrl ? [product.coverUrl] : [];
  for (const v of product.variants) {
    for (const url of v.imageUrls ?? []) {
      if (url && !productImages.includes(url)) productImages.push(url);
    }
  }

  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonicalUrl}#product`,
    name: product.name,
    description: product.description ?? undefined,
    sku: product.variants[0]?.sku ?? undefined,
    image: productImages.length ? productImages : undefined,
    url: canonicalUrl,
    brand: {
      "@type": "Brand",
      name: "الینا",
    },
    category: product.category?.name,
  };

  if (minPrice != null) {
    productLd.offers =
      variantPrices.length > 1 && maxPrice !== minPrice
        ? {
            "@type": "AggregateOffer",
            priceCurrency: "IRR",
            lowPrice: minPrice,
            highPrice: maxPrice,
            offerCount: variantPrices.length,
            availability,
            url: canonicalUrl,
            priceValidUntil: priceValidUntil.toISOString().slice(0, 10),
          }
        : {
            "@type": "Offer",
            price: minPrice,
            priceCurrency: "IRR",
            availability,
            url: canonicalUrl,
            priceValidUntil: priceValidUntil.toISOString().slice(0, 10),
          };
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "محصولات", item: `${siteUrl}/products` },
      ...(product.category?.name
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: product.category.name,
              item: categoryHref,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.category?.name ? 4 : 3,
        name: product.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/products"
          className="hover:text-foreground flex items-center gap-1"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          محصولات
        </Link>
        {product.category?.name && (
          <>
            <span>/</span>
            <Link
              href={
                categorySlug
                  ? `/category/${encodeURIComponent(categorySlug)}`
                  : `/products?categoryId=${product.categoryId}`
              }
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      <ProductDetailClient
        product={
          product as Parameters<typeof ProductDetailClient>[0]["product"]
        }
        valueLabels={valueLabels}
      />
    </div>
  );
}
