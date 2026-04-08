"use client";

import { useState } from "react";
import SectionAccordion from "@/components/SectionAccordion";
import type { ScrapedPage } from "@/app/api/scrape/route";
import { SECTION_ORDER } from "@/lib/classifier";

type Status = "idle" | "loading" | "done" | "error";

export default function Home() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [pages, setPages] = useState<ScrapedPage[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setStatus("loading");
    setPages([]);
    setError("");
    setCopied(false);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scrape failed");
      setPages(data.pages);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  // Group pages by section, in canonical order
  const grouped = SECTION_ORDER.reduce<Record<string, ScrapedPage[]>>((acc, label) => {
    const matching = pages.filter((p) => p.section === label);
    if (matching.length > 0) acc[label] = matching;
    return acc;
  }, {});

  function handleCopyAll() {
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const domain = (() => {
    try { return new URL(url).hostname; } catch { return url; }
  })();

  return (
    <main className="min-h-screen px-4 py-16">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Website Scraper</h1>
          <p className="text-[#6b6760] text-sm">
            Paste a URL and get all page content organized by section — ready for outreach research.
          </p>
        </div>

        {/* Input form */}
        <form onSubmit={handleScrape} className="flex gap-3 mb-10">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            disabled={status === "loading"}
            className="flex-1 px-4 py-3 rounded-xl border border-[#e0dbd4] bg-white text-sm text-[#1a1a1a] placeholder-[#a09d96] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === "loading" || !url.trim()}
            className="px-6 py-3 rounded-xl bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {status === "loading" ? "Scraping…" : "Scrape"}
          </button>
        </form>

        {/* Loading state */}
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-16 fade-up">
            <div className="w-8 h-8 rounded-full border-2 border-[#e0dbd4] border-t-[#1a1a1a] spin-slow" />
            <p className="text-sm text-[#6b6760]">Scraping <span className="font-medium text-[#1a1a1a]">{domain}</span>…</p>
            <p className="text-xs text-[#a09d96]">This can take up to 2 minutes depending on the site size.</p>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="fade-up bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
            <span className="font-semibold">Error: </span>{error}
          </div>
        )}

        {/* Results */}
        {status === "done" && pages.length === 0 && (
          <div className="text-center py-12 text-[#6b6760] text-sm fade-up">
            No pages found. The site may require JavaScript rendering — try a different URL.
          </div>
        )}

        {status === "done" && pages.length > 0 && (
          <div className="fade-up">
            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[#6b6760]">
                Found <span className="font-semibold text-[#1a1a1a]">{pages.length}</span> pages across{" "}
                <span className="font-semibold text-[#1a1a1a]">{Object.keys(grouped).length}</span> sections
              </p>
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e0dbd4] bg-white hover:bg-[#f7f4ef] transition-colors text-[#3a3733]"
              >
                {copied ? (
                  <>
                    <CheckIcon />
                    Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon />
                    Copy All
                  </>
                )}
              </button>
            </div>

            {/* Section accordions */}
            <div className="flex flex-col gap-3">
              {SECTION_ORDER.map((label) => {
                const sectionPages = grouped[label];
                if (!sectionPages) return null;
                return (
                  <SectionAccordion key={label} label={label} pages={sectionPages} />
                );
              })}
            </div>
          </div>
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
