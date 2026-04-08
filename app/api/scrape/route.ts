import { classifyPage } from "@/lib/classifier";

export const maxDuration = 300;

export interface ScrapedPage {
  url: string;
  title: string;
  text: string;
  section: string;
}

const APIFY_BASE = "https://api.apify.com/v2";

export async function POST(request: Request) {
  const { url } = (await request.json()) as { url: string };

  if (!url) {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }

  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return Response.json({ error: "APIFY_API_TOKEN is not configured" }, { status: 500 });
  }

  // Start the actor run
  const runRes = await fetch(
    `${APIFY_BASE}/acts/apify~website-content-crawler/runs?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startUrls: [{ url }],
        maxCrawlDepth: 3,
        maxCrawlPages: 50,
        crawlerType: "cheerio",
      }),
    }
  );

  if (!runRes.ok) {
    const err = await runRes.text();
    return Response.json({ error: `Apify run failed: ${err}` }, { status: 500 });
  }

  const { data: runData } = await runRes.json() as { data: { id: string; defaultDatasetId: string; status: string } };

  // Poll until the run finishes
  let status = runData.status;
  while (status !== "SUCCEEDED" && status !== "FAILED" && status !== "ABORTED" && status !== "TIMED-OUT") {
    await new Promise((r) => setTimeout(r, 3000));
    const statusRes = await fetch(`${APIFY_BASE}/actor-runs/${runData.id}?token=${token}`);
    const { data } = await statusRes.json() as { data: { status: string } };
    status = data.status;
  }

  if (status !== "SUCCEEDED") {
    return Response.json({ error: `Apify run ended with status: ${status}` }, { status: 500 });
  }

  // Fetch dataset items
  const datasetRes = await fetch(
    `${APIFY_BASE}/datasets/${runData.defaultDatasetId}/items?token=${token}&limit=200`
  );
  const items = await datasetRes.json() as Record<string, unknown>[];

  // Deduplicate by URL
  const seen = new Set<string>();
  const pages: ScrapedPage[] = [];

  for (const item of items) {
    const pageUrl = (item.url as string) ?? "";
    if (seen.has(pageUrl)) continue;
    seen.add(pageUrl);

    const title =
      (item.metadata as Record<string, string> | undefined)?.title ??
      (item.title as string) ??
      "";
    const rawText = (item.text as string) ?? "";
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
