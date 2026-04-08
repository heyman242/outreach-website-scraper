import { ApifyClient } from "apify-client";
import { classifyPage } from "@/lib/classifier";

export const maxDuration = 300;

export interface ScrapedPage {
  url: string;
  title: string;
  text: string;
  section: string;
}

export async function POST(request: Request) {
  const { url } = await request.json() as { url: string };

  if (!url) {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }

  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return Response.json({ error: "APIFY_API_TOKEN is not configured" }, { status: 500 });
  }

  const client = new ApifyClient({ token });

  const run = await client.actor("apify/website-content-crawler").call({
    startUrls: [{ url }],
    maxCrawlDepth: 3,
    maxCrawlPages: 50,
    crawlerType: "cheerio",
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  // Deduplicate by URL
  const seen = new Set<string>();
  const pages: ScrapedPage[] = [];

  for (const item of items) {
    const pageUrl = (item.url as string) ?? "";
    if (seen.has(pageUrl)) continue;
    seen.add(pageUrl);

    const title = (item.metadata as Record<string, string> | undefined)?.title ?? (item.title as string) ?? "";
    const rawText = (item.text as string) ?? "";

    // Clean up excessive whitespace
    const text = rawText.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();

    pages.push({
      url: pageUrl,
      title,
      text,
      section: classifyPage(pageUrl, title),
    });
  }

  return Response.json({ pages });
}
