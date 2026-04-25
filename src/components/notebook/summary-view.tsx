import { ScrollArea } from "@/components/ui/scroll-area";
import type { GeminiVideoResult } from "@/lib/gemini/ingestVideo";

interface Props {
  gemini: GeminiVideoResult;
  youtubeUrl: string | null;
}

export function SummaryView({ gemini, youtubeUrl }: Props) {
  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="flex flex-col gap-10 pr-4 pb-12 max-w-3xl">

        {/* Overview */}
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            Overview
          </p>
          <p className="text-zinc-100 text-[15px] leading-7">
            {gemini.summary_short}
          </p>
        </div>

        {/* Chapters */}
        <div className="flex flex-col gap-8">
          {gemini.chapters.map((chapter, i) => {
            const chapterUrl = youtubeUrl
              ? timestampUrl(youtubeUrl, chapter.start_sec)
              : null;
            const duration = gemini.chapters[i + 1]
              ? gemini.chapters[i + 1].start_sec - chapter.start_sec
              : gemini.duration_seconds - chapter.start_sec;

            return (
              <div key={i} className="flex flex-col gap-2">
                {/* Chapter heading row */}
                <div className="flex items-baseline justify-between gap-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[11px] font-mono text-zinc-600 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-white font-semibold text-[15px] leading-snug">
                      {chapter.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {duration > 0 && (
                      <span className="text-[11px] text-zinc-600 font-mono">
                        {formatDuration(duration)}
                      </span>
                    )}
                    {chapterUrl && (
                      <a
                        href={chapterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Watch this section"
                      >
                        {formatTime(chapter.start_sec)} ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-zinc-800" />

                {/* Chapter body */}
                <p className="text-zinc-300 text-[14px] leading-7 pt-1">
                  {chapter.summary}
                </p>
              </div>
            );
          })}
        </div>

        {/* Key Insights */}
        {gemini.key_moments && gemini.key_moments.length > 0 && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-4">
              Key Insights
            </p>
            <ul className="flex flex-col gap-3">
              {gemini.key_moments.map((moment, i) => {
                const mUrl = youtubeUrl
                  ? timestampUrl(youtubeUrl, moment.at_sec)
                  : null;
                return (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="text-zinc-600 mt-1 shrink-0">•</span>
                    <span className="text-zinc-300 text-[14px] leading-6 flex-1">
                      {moment.why}
                    </span>
                    {mUrl && (
                      <a
                        href={mUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-zinc-600 hover:text-zinc-400 shrink-0 mt-0.5 transition-colors"
                      >
                        {formatTime(moment.at_sec)} ↗
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

      </div>
    </ScrollArea>
  );
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

function timestampUrl(youtubeUrl: string, seconds: number) {
  try {
    const url = new URL(youtubeUrl);
    url.searchParams.set("t", String(Math.floor(seconds)));
    return url.toString();
  } catch {
    return null;
  }
}
