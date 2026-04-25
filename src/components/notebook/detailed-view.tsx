import { ScrollArea } from "@/components/ui/scroll-area";
import type { GeminiVideoResult } from "@/lib/gemini/ingestVideo";

interface Props {
  gemini: GeminiVideoResult;
  youtubeUrl: string | null;
}

export function DetailedView({ gemini, youtubeUrl }: Props) {
  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="flex flex-col gap-1 pr-4">
        {gemini.transcript.map((line, i) => (
          <div
            key={i}
            className="flex gap-4 group py-1.5 rounded hover:bg-zinc-900 px-2 -mx-2 transition-colors"
          >
            <a
              href={youtubeUrl ? timestampUrl(youtubeUrl, line.start_sec) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-600 font-mono pt-0.5 group-hover:text-zinc-400 shrink-0 w-12 text-right transition-colors"
            >
              {formatTime(line.start_sec)}
            </a>
            <div className="flex flex-col gap-0.5 flex-1">
              {line.speaker && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  {line.speaker}
                </span>
              )}
              <span className="text-zinc-300 text-sm leading-relaxed">{line.text}</span>
            </div>
          </div>
        ))}
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
