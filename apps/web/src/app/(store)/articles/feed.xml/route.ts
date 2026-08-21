import { apiFetch } from "@/lib/server-fetch";
import type { Article, PaginatedResponse } from "@/types";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://elinaclothes.com";

// Cache the whole feed for 15 min at the Next.js layer.
export const revalidate = 900;

/** Escape a string for safe inclusion inside RSS XML text nodes / attrs. */
function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Wrap HTML content in CDATA so we can ship the full article body safely. */
function cdata(html: string): string {
  return `<![CDATA[${html.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

/**
 * Pull the most recent published articles. We cap at 50 (the backend's
 * per-page max) which is more than enough for a feed reader — older
 * items scroll off the RSS anyway.
 */
async function fetchLatestArticles(): Promise<Article[]> {
  try {
    const res = await apiFetch<PaginatedResponse<Article>>(
      "/articles?page=1&limit=50",
      { revalidate: 900 },
    );
    return res.data;
  } catch {
    return [];
  }
}

export async function GET() {
  const articles = await fetchLatestArticles();
  const feedUrl = `${siteUrl}/articles/feed.xml`;
  const lastBuild = new Date(
    articles[0]?.updatedAt ?? articles[0]?.publishedAt ?? Date.now(),
  ).toUTCString();

  const items = articles
    .map((article) => {
      const url = `${siteUrl}/articles/${article.slug}`;
      const pub = new Date(
        article.publishedAt ?? article.createdAt,
      ).toUTCString();
      const category = article.category?.name
        ? `\n      <category>${escapeXml(article.category.name)}</category>`
        : "";
      const enclosure = article.coverUrl
        ? `\n      <enclosure url="${escapeXml(article.coverUrl)}" type="image/jpeg" />`
        : "";
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pub}</pubDate>
      <author>${escapeXml(article.authorName)}</author>${category}${enclosure}
      <description>${escapeXml(article.excerpt)}</description>
      <content:encoded>${cdata(article.content)}</content:encoded>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>مجله الینا</title>
    <link>${escapeXml(`${siteUrl}/articles`)}</link>
    <description>راهنمای انتخاب استایل، ترندهای مد و آموزش‌های کاربردی درباره پوشاک زنانه.</description>
    <language>fa-IR</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
}
