export const maxDuration = 300;

export interface VideoTranscript {
  url: string;
  title: string;
  transcript: string;
}

const APIFY_BASE = "https://api.apify.com/v2";

function parseSrt(srt: string): string {
  return srt
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return false;
      if (/^\d+$/.test(t)) return false; // sequence numbers
      if (/\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.]\d{3}/.test(t)) return false; // timestamps
      return true;
    })
    .map((line) => line.replace(/<[^>]+>/g, "").trim()) // strip inline HTML tags
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSubtitles(subtitles: unknown): string {
  if (!subtitles) return "";

  // Plain SRT string
  if (typeof subtitles === "string") {
    return parseSrt(subtitles);
  }

  // Array of language tracks
  if (Array.isArray(subtitles)) {
    const track =
      subtitles.find(
        (t: Record<string, unknown>) =>
          t.languageCode === "en" || t.lang === "en"
      ) ?? subtitles[0];

    if (!track) return "";

    const t = track as Record<string, unknown>;

    // subtitlesFormat: "srt" → track.subtitles is the SRT string
    if (typeof t.subtitles === "string") return parseSrt(t.subtitles);
    if (typeof t.srt === "string") return parseSrt(t.srt as string);
    if (typeof t.content === "string") return parseSrt(t.content as string);

    // Segmented format → track.subtitles is an array of { text, start, dur }
    const segments =
      (t.subtitles as Record<string, unknown>[] | undefined) ??
      (t.segments as Record<string, unknown>[] | undefined) ??
      (t.cues as Record<string, unknown>[] | undefined) ??
      [];

    if (Array.isArray(segments)) {
      return segments
        .map((s) =>
          ((s.text ?? s.content ?? "") as string)
            .replace(/<[^>]+>/g, "")
            .replace(/\n/g, " ")
            .trim()
        )
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  return "";
}

export async function POST(request: Request) {
  const { url } = (await request.json()) as { url: string };

  if (!url) {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }

  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return Response.json({ error: "APIFY_API_TOKEN is not configured" }, { status: 500 });
  }

  // Start streamers/youtube-scraper
  const runRes = await fetch(
    `${APIFY_BASE}/acts/streamers~youtube-scraper/runs?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startUrls: [{ url }],
        maxResults: 10,
        downloadSubtitles: true,
        subtitlesLanguage: "en",
        subtitlesFormat: "srt",
        maxResultsShorts: 0,
        maxResultStreams: 0,
      }),
    }
  );

  if (!runRes.ok) {
    const err = await runRes.text();
    return Response.json({ error: `Apify run failed: ${err}` }, { status: 500 });
  }

  const { data: runData } = (await runRes.json()) as {
    data: { id: string; defaultDatasetId: string; status: string };
  };

  // Poll until done
  let status = runData.status;
  while (
    status !== "SUCCEEDED" &&
    status !== "FAILED" &&
    status !== "ABORTED" &&
    status !== "TIMED-OUT"
  ) {
    await new Promise((r) => setTimeout(r, 3000));
    const statusRes = await fetch(
      `${APIFY_BASE}/actor-runs/${runData.id}?token=${token}`
    );
    const { data } = (await statusRes.json()) as { data: { status: string } };
    status = data.status;
  }

  if (status !== "SUCCEEDED") {
    return Response.json(
      { error: `Apify run ended with status: ${status}` },
      { status: 500 }
    );
  }

  // Fetch dataset items
  const datasetRes = await fetch(
    `${APIFY_BASE}/datasets/${runData.defaultDatasetId}/items?token=${token}&limit=10`
  );
  const items = (await datasetRes.json()) as Record<string, unknown>[];

  const videos: VideoTranscript[] = items.map((item) => {
    const title =
      (item.title as string) ?? (item.name as string) ?? "Untitled";
    const videoUrl =
      (item.url as string) ??
      (item.id ? `https://www.youtube.com/watch?v=${item.id as string}` : "");
    const transcript = parseSubtitles(item.subtitles);

    return { url: videoUrl, title, transcript };
  });

  return Response.json({ videos });
}
