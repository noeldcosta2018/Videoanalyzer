"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function isYouTubeUrl(url: string) {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url.trim());
}

export function UrlInputForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Please enter a YouTube URL.");
      return;
    }
    if (!isYouTubeUrl(url)) {
      setError("Please enter a valid YouTube URL.");
      return;
    }

    setLoading(true);
    // TODO: POST to /api/ingest → get notebook id → redirect
    // For now redirect to a placeholder notebook route
    router.push(`/notebook/demo?url=${encodeURIComponent(url.trim())}`);
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        <Input
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(""); }}
          className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 flex-1 h-12"
          disabled={loading}
          aria-label="YouTube URL"
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-12 px-6 font-semibold bg-white text-zinc-950 hover:bg-zinc-100"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </Button>
      </form>

      {error && <p className="text-sm text-red-400 text-left">{error}</p>}

      <div className="flex items-center gap-3 text-zinc-600 text-sm">
        <div className="flex-1 h-px bg-zinc-800" />
        <span>or</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <Button
        variant="outline"
        className="w-full h-12 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600"
        onClick={() => {/* TODO: file upload */}}
      >
        Upload a video file
      </Button>
    </div>
  );
}
