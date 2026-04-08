"use client";

import { useState } from "react";
import type { ScrapedPage } from "@/app/api/scrape/route";

interface SectionAccordionProps {
  label: string;
  pages: ScrapedPage[];
}

export default function SectionAccordion({ label, pages }: SectionAccordionProps) {
  const [open, setOpen] = useState(true);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  function togglePage(url: string) {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  return (
    <div className="border border-[#e0dbd4] rounded-xl overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-[#faf8f5] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-[#1a1a1a]">{label}</span>
          <span className="text-xs font-medium bg-[#f0ede4] text-[#6b6760] px-2 py-0.5 rounded-full">
            {pages.length} {pages.length === 1 ? "page" : "pages"}
          </span>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="divide-y divide-[#f0ede4]">
          {pages.map((page) => {
            const isExpanded = expandedPages.has(page.url);
            return (
              <div key={page.url} className="bg-[#fdfcfa]">
                {/* Page header */}
                <button
                  onClick={() => togglePage(page.url)}
                  className="w-full flex items-start justify-between px-5 py-3 hover:bg-[#f7f4ef] transition-colors text-left gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1a1a1a] truncate">
                      {page.title || "Untitled Page"}
                    </p>
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-[#6b6760] hover:text-[#1a1a1a] underline underline-offset-2 break-all"
                    >
                      {page.url}
                    </a>
                  </div>
                  <ChevronIcon open={isExpanded} small />
                </button>

                {/* Page content */}
                {isExpanded && (
                  <div className="px-5 pb-4">
                    <pre className="text-xs text-[#3a3733] bg-[#f0ede4] rounded-lg p-4 overflow-auto max-h-80 whitespace-pre-wrap font-[inherit] leading-relaxed">
                      {page.text || "No text content found."}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open, small }: { open: boolean; small?: boolean }) {
  const size = small ? "w-4 h-4" : "w-5 h-5";
  return (
    <svg
      className={`${size} text-[#a09d96] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
