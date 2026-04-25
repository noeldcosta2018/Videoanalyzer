import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { GeminiVideoResult } from "@/lib/gemini/ingestVideo";

interface Props {
  gemini: GeminiVideoResult;
  youtubeUrl: string | null;
}

export function SummaryView({ gemini, youtubeUrl }: Props) {
  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="flex flex-col gap-8 pr-4">
        {/* TL;DR */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            TL;DR
          </h2>
          <p className="text-zinc-200 leading-relaxed text-[15px]">
            {gemini.summary_short}
          </p>
        </section>

        <Separator className="bg-zinc-800" />

        {/* Chapters */}
        {gemini.chapters.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
              Chapters
            </h2>
            <ol className="flex flex-col gap-4">
              {gemini.chapters.map((chapter, i) => (
                <li key={i} className="flex gap-4">
                  <a
                    href={youtubeUrl ? timestampUrl(youtubeUrl, chapter.start_sec) : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-500 font-mono pt-0.5 hover:text-zinc-300 shrink-0 w-12 text-right"
                    title="Jump to timestamp"
                  >
                    {formatTime(chapter.start_sec)}
                  </a>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-white text-sm">
                      {chapter.title}
                    </span>
                    <span className="text-zinc-400 text-sm leading-relaxed">
                      {chapter.summary}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <Separator className="bg-zinc-800" />

        {/* Key moments */}
        {gemini.key_moments && gemini.key_moments.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
              Key Moments
            </h2>
            <ul className="flex flex-col gap-3">
              {gemini.key_moments.map((moment, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <a
                    href={youtubeUrl ? timestampUrl(youtubeUrl, moment.at_sec) : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-500 font-mono pt-0.5 hover:text-zinc-300 shrink-0 w-12 text-right"
                  >
                    {formatTime(moment.at_sec)}
                  </a>
                  <span className="text-zinc-300 text-sm leading-relaxed">{moment.why}</span>
                </li>
              ))}
            </ul>
          </section>
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

function timestampUrl(youtubeUrl: string, seconds: number) {
  try {
    const url = new URL(youtubeUrl);
    url.searchParams.set("t", String(Math.floor(seconds)));
    return url.toString();
  } catch {
    return youtubeUrl;
  }
}
