import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";

interface NotFoundPageProps {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export function NotFoundPage({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref = "/",
  secondaryLabel = "صفحه اصلی",
}: NotFoundPageProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      {/* 404 number */}
      <p
        className="select-none text-[120px] font-black leading-none tracking-tighter text-brand-100 sm:text-[160px]"
        aria-hidden="true"
      >
        ۴۰۴
      </p>

      <div className="-mt-4 space-y-3 sm:-mt-6">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          {title}
        </h1>
        <p className="mx-auto max-w-sm text-sm leading-7 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={primaryHref}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          {primaryLabel}
          <ArrowRight className="h-4 w-4 rotate-180" />
        </Link>
        <Link
          href={secondaryHref}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Home className="h-4 w-4" />
          {secondaryLabel}
        </Link>
      </div>
    </div>
  );
}
