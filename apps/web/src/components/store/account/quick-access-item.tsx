import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Row-style navigation item for the account page. Icon in a soft primary
 * chip, title + description stacked, chevron pointing toward the target
 * page (left in RTL = "forward").
 */
export function QuickAccessItem({
  href,
  icon: Icon,
  label,
  description,
  className,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-primary/40 hover:bg-accent/40",
        className,
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-4.5 w-4.5" />
      </span>

      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="block text-sm font-semibold leading-tight text-foreground">
          {label}
        </span>
        {description && (
          <span className="block truncate text-xs text-muted-foreground">
            {description}
          </span>
        )}
      </span>

      <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:-translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
