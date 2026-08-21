import Link from "next/link";
import { ImageIcon, Clock, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { Article } from "@/types";

interface Props {
  article: Article;
  /** When true, use a larger, hero-style card. */
  featured?: boolean;
}

export function ArticleCard({ article, featured = false }: Props) {
  const href = `/articles/${article.slug}`;
  const coverAlt = article.coverAlt || article.title;

  return (
    <article
      className={
        featured
          ? "group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg md:flex-row"
          : "group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      }
    >
      <Link
        href={href}
        aria-label={article.title}
        className={
          featured
            ? "block aspect-[16/9] overflow-hidden bg-muted/50 md:aspect-auto md:w-1/2"
            : "block aspect-[16/10] overflow-hidden bg-muted/50"
        }
      >
        {article.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverUrl}
            alt={coverAlt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
      </Link>

      <div
        className={
          featured
            ? "flex flex-1 flex-col gap-3 p-5 md:p-6"
            : "flex flex-1 flex-col gap-2 p-4"
        }
      >
        {article.category?.name && (
          <div>
            <Badge variant="secondary" className="text-[11px]">
              {article.category.name}
            </Badge>
          </div>
        )}

        <Link href={href} className="block">
          <h3
            className={
              featured
                ? "line-clamp-2 text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary md:text-xl"
                : "line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary md:text-base"
            }
          >
            {article.title}
          </h3>
        </Link>

        <p
          className={
            featured
              ? "line-clamp-3 text-sm leading-7 text-muted-foreground md:text-[15px]"
              : "line-clamp-2 text-xs leading-6 text-muted-foreground"
          }
        >
          {article.excerpt}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-[11px] text-muted-foreground">
          {article.publishedAt && (
            <time
              dateTime={article.publishedAt}
              className="inline-flex items-center gap-1"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(article.publishedAt)}
            </time>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {article.readTimeMinutes.toLocaleString("fa-IR")} دقیقه مطالعه
          </span>
        </div>
      </div>
    </article>
  );
}

export function ArticleCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={
        featured
          ? "flex animate-pulse flex-col overflow-hidden rounded-2xl border bg-card md:flex-row"
          : "animate-pulse overflow-hidden rounded-2xl border bg-card"
      }
    >
      <div
        className={
          featured ? "aspect-[16/9] bg-muted md:aspect-auto md:w-1/2" : "aspect-[16/10] bg-muted"
        }
      />
      <div className="flex-1 space-y-2 p-4">
        <div className="h-4 w-16 rounded-full bg-muted" />
        <div className="h-5 w-full rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
      </div>
    </div>
  );
}
