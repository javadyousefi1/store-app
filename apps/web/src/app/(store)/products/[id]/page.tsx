import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/server-fetch";
import { ProductDetailClient } from "@/components/store/product-detail-client";
import type { Attribute, ProductDetail } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const [product, attributes] = await Promise.all([
    apiFetch<ProductDetail>(`/products/${id}`),
    apiFetch<Attribute[]>("/attributes").catch(() => [] as Attribute[]),
  ]);

  // Build value → label lookup for all attributes that have a label
  const valueLabels: Record<string, string> = {};
  for (const attr of attributes) {
    for (const v of attr.values) {
      if (v.label) valueLabels[v.value] = v.label;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground flex items-center gap-1">
          <ArrowRight className="h-3.5 w-3.5" />
          محصولات
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
      </nav>

      <ProductDetailClient
        product={product as Parameters<typeof ProductDetailClient>[0]["product"]}
        valueLabels={valueLabels}
      />
    </div>
  );
}
