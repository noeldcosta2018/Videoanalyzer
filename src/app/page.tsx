import { UrlInputForm } from "@/components/url-input-form";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 py-24">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl text-center">
        <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-xs px-3 py-1">
          Phase 1 MVP — Free Beta
        </Badge>

        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Watch less. Understand more.
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Paste a YouTube URL or upload a video — get a rich interactive notebook with summaries,
            transcripts, mind maps, extracted slides, and more.
          </p>
        </div>

        <UrlInputForm />

        <p className="text-xs text-zinc-600">
          Free tier: 60 minutes/month · No credit card required
        </p>
      </div>
    </main>
  );
}
