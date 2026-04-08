"use client";

import { useState } from "react";
import SectionAccordion from "@/components/SectionAccordion";
import VideoAccordion from "@/components/VideoAccordion";
import type { ScrapedPage } from "@/app/api/scrape/route";
import type { VideoTranscript } from "@/app/api/youtube/route";
import { SECTION_ORDER } from "@/lib/classifier";

type Tab = "website" | "youtube";
type Status = "idle" | "loading" | "done" | "error";

export default function Home() {
  const [tab, setTab] = useState<Tab>("website");

  // Website scraper state
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteStatus, setWebsiteStatus] = useState<Status>("idle");
  const [pages, setPages] = useState<ScrapedPage[]>([]);
  const [websiteError, setWebsiteError] = useState("");
  const [websiteCopied, setWebsiteCopied] = useState(false);

  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeStatus, setYoutubeStatus] = useState<Status>("idle");
  const [videos, setVideos] = useState<VideoTranscript[]>([]);
  const [youtubeError, setYoutubeError] = useState("");
  const [youtubeCopied, setYoutubeCopied] = useState(false);

  // ── Website scraper ──────────────────────────────────────────────────────
  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    if (!websiteUrl.trim()) return;

    setWebsiteStatus("loading");
    setPages([]);
    setWebsiteError("");
    setWebsiteCopied(false);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scrape failed");
      setPages(data.pages);
      setWebsiteStatus("done");
    } catch (err) {
      setWebsiteError(err instanceof Error ? err.message : "Something went wrong");
      setWebsiteStatus("error");
    }
  }

  const grouped = SECTION_ORDER.reduce<Record<string, ScrapedPage[]>>((acc, label) => {
    const matching = pages.filter((p) => p.section === label);
    if (matching.length > 0) acc[label] = matching;
    return acc;
  }, {});

  function handleCopyWebsite() {
    const lines: string[] = [];
    for (const label of SECTION_ORDER) {
      const sectionPages = grouped[label];
      if (!sectionPages) continue;
      lines.push(`${"=".repeat(60)}`);
      lines.push(`  ${label.toUpperCase()}`);
      lines.push(`${"=".repeat(60)}`);
      for (const page of sectionPages) {
        lines.push("");
        lines.push(`--- ${page.title || "Untitled"} ---`);
        lines.push(page.url);
        lines.push("");
        lines.push(page.text);
      }
      lines.push("");
    }
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setWebsiteCopied(true);
      setTimeout(() => setWebsiteCopied(false), 2000);
    });
  }

  // ── YouTube scraper ──────────────────────────────────────────────────────
  async function handleYoutube(e: React.FormEvent) {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    setYoutubeStatus("loading");
    setVideos([]);
    setYoutubeError("");
    setYoutubeCopied(false);

    try {
      const res = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "YouTube scrape failed");
      setVideos(data.videos);
      setYoutubeStatus("done");
    } catch (err) {
      setYoutubeError(err instanceof Error ? err.message : "Something went wrong");
      setYoutubeStatus("error");
    }
  }

  function handleCopyYoutube() {
    const lines: string[] = [];
    for (const video of videos) {
      lines.push(`${"=".repeat(60)}`);
      lines.push(`  ${video.title.toUpperCase()}`);
      lines.push(`  ${video.url}`);
      lines.push(`${"=".repeat(60)}`);
      lines.push("");
      lines.push(video.transcript || "(no transcript)");
      lines.push("");
    }
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setYoutubeCopied(true);
      setTimeout(() => setYoutubeCopied(false), 2000);
    });
  }

  const websiteDomain = (() => {
    try { return new URL(websiteUrl).hostname; } catch { return websiteUrl; }
  })();

  const youtubeDomain = (() => {
    try { return new URL(youtubeUrl).hostname + new URL(youtubeUrl).pathname; } catch { return youtubeUrl; }
  })();

  return (
    <main className="min-h-screen px-4 py-16">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Outreach Research</h1>
          <p className="text-[#6b6760] text-sm">
            Scrape website content or YouTube transcripts — ready for outreach research.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[#f0ede4] rounded-xl mb-8">
          {(["website", "youtube"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                tab === t
                  ? "bg-white text-[#1a1a1a] shadow-sm"
                  : "text-[#6b6760] hover:text-[#1a1a1a]"
              }`}
            >
              {t === "website" ? "Website" : "YouTube Channel"}
            </button>
          ))}
        </div>

        {/* ── WEBSITE TAB ────────────────────────────────────────────────── */}
        {tab === "website" && (
          <>
            <form onSubmit={handleScrape} className="flex gap-3 mb-10">
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                required
                disabled={websiteStatus === "loading"}
                className="flex-1 px-4 py-3 rounded-xl border border-[#e0dbd4] bg-white text-sm text-[#1a1a1a] placeholder-[#a09d96] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/20 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={websiteStatus === "loading" || !websiteUrl.trim()}
                className="px-6 py-3 rounded-xl bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {websiteStatus === "loading" ? "Scraping…" : "Scrape"}
              </button>
            </form>

            {websiteStatus === "loading" && (
              <div className="flex flex-col items-center gap-4 py-16 fade-up">
                <div className="w-8 h-8 rounded-full border-2 border-[#e0dbd4] border-t-[#1a1a1a] spin-slow" />
                <p className="text-sm text-[#6b6760]">Scraping <span className="font-medium text-[#1a1a1a]">{websiteDomain}</span>…</p>
                <p className="text-xs text-[#a09d96]">This can take up to 2 minutes depending on the site size.</p>
              </div>
            )}

            {websiteStatus === "error" && (
              <div className="fade-up bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
                <span className="font-semibold">Error: </span>{websiteError}
              </div>
            )}

            {websiteStatus === "done" && pages.length === 0 && (
              <div className="text-center py-12 text-[#6b6760] text-sm fade-up">
                No pages found. The site may require JavaScript rendering — try a different URL.
              </div>
            )}

            {websiteStatus === "done" && pages.length > 0 && (
              <div className="fade-up">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-[#6b6760]">
                    Found <span className="font-semibold text-[#1a1a1a]">{pages.length}</span> pages across{" "}
                    <span className="font-semibold text-[#1a1a1a]">{Object.keys(grouped).length}</span> sections
                  </p>
                  <button
                    onClick={handleCopyWebsite}
                    className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e0dbd4] bg-white hover:bg-[#f7f4ef] transition-colors text-[#3a3733]"
                  >
                    {websiteCopied ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy All</>}
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {SECTION_ORDER.map((label) => {
                    const sectionPages = grouped[label];
                    if (!sectionPages) return null;
                    return <SectionAccordion key={label} label={label} pages={sectionPages} />;
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── YOUTUBE TAB ────────────────────────────────────────────────── */}
        {tab === "youtube" && (
          <>
            <form onSubmit={handleYoutube} className="flex gap-3 mb-10">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/@channelname"
                required
                disabled={youtubeStatus === "loading"}
                className="flex-1 px-4 py-3 rounded-xl border border-[#e0dbd4] bg-white text-sm text-[#1a1a1a] placeholder-[#a09d96] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/20 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={youtubeStatus === "loading" || !youtubeUrl.trim()}
                className="px-6 py-3 rounded-xl bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {youtubeStatus === "loading" ? "Fetching…" : "Fetch"}
              </button>
            </form>

            {youtubeStatus === "loading" && (
              <div className="flex flex-col items-center gap-4 py-16 fade-up">
                <div className="w-8 h-8 rounded-full border-2 border-[#e0dbd4] border-t-[#1a1a1a] spin-slow" />
                <p className="text-sm text-[#6b6760]">Fetching transcripts from <span className="font-medium text-[#1a1a1a]">{youtubeDomain}</span>…</p>
                <p className="text-xs text-[#a09d96]">Grabbing the 10 most recent videos. This may take a couple of minutes.</p>
              </div>
            )}

            {youtubeStatus === "error" && (
              <div className="fade-up bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
                <span className="font-semibold">Error: </span>{youtubeError}
              </div>
            )}

            {youtubeStatus === "done" && videos.length === 0 && (
              <div className="text-center py-12 text-[#6b6760] text-sm fade-up">
                No videos found. Check the channel URL and try again.
              </div>
            )}

            {youtubeStatus === "done" && videos.length > 0 && (
              <div className="fade-up">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-[#6b6760]">
                    Found <span className="font-semibold text-[#1a1a1a]">{videos.length}</span> videos
                  </p>
                  <button
                    onClick={handleCopyYoutube}
                    className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e0dbd4] bg-white hover:bg-[#f7f4ef] transition-colors text-[#3a3733]"
                  >
                    {youtubeCopied ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy All</>}
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {videos.map((video) => (
                    <VideoAccordion key={video.url} video={video} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
