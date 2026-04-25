"use client";

import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryView } from "./summary-view";
import { DetailedView } from "./detailed-view";
import type { GeminiVideoResult } from "@/lib/gemini/ingestVideo";

const MindMap = dynamic(
  () => import("./mind-map").then((m) => m.MindMap),
  { ssr: false }
);

interface Notebook {
  id: string;
  title: string;
  youtube_url: string | null;
  status: "pending" | "processing" | "ready" | "failed";
}

interface Source {
  id: string;
  status: string;
  gemini_response_json: GeminiVideoResult | null;
  duration_seconds: number | null;
  language: string | null;
}

interface Props {
  notebook: Notebook;
  source: Source | null;
}

export function NotebookView({ notebook, source }: Props) {
  const gemini = source?.gemini_response_json ?? null;
  const isProcessing = notebook.status === "processing" || notebook.status === "pending";
  const isFailed = notebook.status === "failed";

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-semibold leading-tight line-clamp-1">
            {notebook.title}
          </h1>
          {notebook.youtube_url && (
            <a
              href={notebook.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-zinc-300 truncate max-w-xs"
            >
              {notebook.youtube_url}
            </a>
          )}
        </div>
        {gemini?.duration_seconds && (
          <span className="text-xs text-zinc-500 shrink-0">
            {formatDuration(gemini.duration_seconds)}
          </span>
        )}
      </header>

      {/* Body */}
      <main className="flex-1 px-4 py-6 w-full max-w-[1400px] mx-auto">
        {isFailed && (
          <div className="rounded-lg border border-red-800 bg-red-950/30 p-4 text-red-400 text-sm">
            Processing failed. Please try submitting the video again.
          </div>
        )}

        {isProcessing && (
          <div className="text-center py-24 text-zinc-500">
            <div className="animate-pulse text-4xl mb-4">⚙️</div>
            <p>Analyzing video…</p>
            <p className="text-xs mt-1">This takes 30–90 seconds depending on video length.</p>
          </div>
        )}

        {!isProcessing && !isFailed && gemini && (
          <Tabs defaultValue="summary">
            <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
              <TabsTrigger value="summary" className="data-[state=active]:bg-zinc-700">
                Summary
              </TabsTrigger>
              <TabsTrigger value="detailed" className="data-[state=active]:bg-zinc-700">
                Detailed
              </TabsTrigger>
              <TabsTrigger value="mindmap" className="data-[state=active]:bg-zinc-700">
                Mind Map
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <div className="max-w-4xl">
                <SummaryView gemini={gemini} youtubeUrl={notebook.youtube_url} />
              </div>
            </TabsContent>

            <TabsContent value="detailed">
              <div className="max-w-4xl">
                <DetailedView gemini={gemini} youtubeUrl={notebook.youtube_url} />
              </div>
            </TabsContent>

            <TabsContent value="mindmap">
              <MindMap
                gemini={gemini}
                title={notebook.title}
                youtubeUrl={notebook.youtube_url}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}
