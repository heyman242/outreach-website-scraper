"use client";

import { useState } from "react";
import type { VideoTranscript } from "@/app/api/youtube/route";

interface VideoAccordionProps {
  video: VideoTranscript;
}

export default function VideoAccordion({ video }: VideoAccordionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[#e0dbd4] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between px-5 py-4 bg-white hover:bg-[#faf8f5] transition-colors text-left gap-4"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1a1a1a] truncate">
            {video.title || "Untitled Video"}
          </p>
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-[#6b6760] hover:text-[#1a1a1a] underline underline-offset-2 break-all"
          >
            {video.url}
          </a>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="px-5 pb-5 bg-[#fdfcfa] border-t border-[#f0ede4]">
          {video.transcript ? (
            <pre className="text-xs text-[#3a3733] bg-[#f0ede4] rounded-lg p-4 overflow-auto max-h-96 whitespace-pre-wrap font-[inherit] leading-relaxed mt-4">
              {video.transcript}
            </pre>
          ) : (
            <p className="text-xs text-[#a09d96] mt-4 italic">
              No transcript available for this video.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-[#a09d96] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
