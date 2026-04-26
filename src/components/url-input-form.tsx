"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function isYouTubeUrl(url: string) {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url.trim());
}

type Stage = "idle" | "uploading" | "analyzing";

export function UrlInputForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [stage, setStage] = useState<Stage>("idle");

  // Pre-fill + auto-submit if redirected back from login with a pending URL
  useEffect(() => {
    const pending = searchParams.get("url");
    if (pending) {
      setUrl(pending);
      setTimeout(() => {
        document.getElementById("analyze-btn")?.click();
      }, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitToIngest(body: Record<string, string>) {
    setStage("analyzing");
    const res = await fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.status === 401) {
      if (body.youtube_url) sessionStorage.setItem("pending_url", body.youtube_url);
      router.push("/login");
      return;
    }

    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      setStage("idle");
      return;
    }

    router.push(`/notebook/${data.notebook_id}`);
  }

  async function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!url.trim()) { setError("Please enter a YouTube URL."); return; }
    if (!isYouTubeUrl(url)) { setError("Please enter a valid YouTube URL."); return; }

    await submitToIngest({ youtube_url: url.trim() });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Client-side size check — Gemini Files API hard limit is 2 GB
    const TWO_GB = 2 * 1024 * 1024 * 1024;
    if (file.size > TWO_GB) {
      setError("File too large (max 2 GB — Gemini's limit). Compress your video to 720p first, or upload it to YouTube and paste the URL.");
      return;
    }

    // Step 1: Request a presigned upload URL from our server
    setStage("uploading");
    const initRes = await fetch("/api/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, fileSize: file.size, mimeType: file.type }),
    });

    if (initRes.status === 401) {
      router.push("/login");
      return;
    }

    const initData = await initRes.json();
    if (!initRes.ok) {
      setError(initData.error || "Failed to start upload.");
      setStage("idle");
      return;
    }

    const { storagePath, token } = initData;

    // Step 2: Upload directly to Supabase Storage via the signed URL
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("videos")
      .uploadToSignedUrl(storagePath, token, file);

    if (uploadError) {
      setError(uploadError.message || "Upload failed. Please try again.");
      setStage("idle");
      return;
    }

    // Step 3: Trigger Gemini analysis
    await submitToIngest({ storage_path: storagePath });
  }

  const loading = stage !== "idle";

  const statusLabel =
    stage === "uploading" ? "Uploading…" :
    stage === "analyzing" ? "Analyzing…" :
    "Analyze";

  return (
    <div className="w-full flex flex-col gap-4">
      <form onSubmit={handleUrlSubmit} className="flex gap-2 w-full">
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
          id="analyze-btn"
          type="submit"
          disabled={loading}
          className="h-12 px-6 font-semibold bg-white text-zinc-950 hover:bg-zinc-100"
        >
          {stage === "analyzing" ? "Analyzing…" : "Analyze"}
        </Button>
      </form>

      {error && <p className="text-sm text-red-400 text-left">{error}</p>}

      {loading && (
        <p className="text-sm text-zinc-500 text-center animate-pulse">
          {stage === "uploading"
            ? "Uploading video…"
            : "Analyzing with Gemini — this takes 30–90 seconds…"}
        </p>
      )}

      <div className="flex items-center gap-3 text-zinc-600 text-sm">
        <div className="flex-1 h-px bg-zinc-800" />
        <span>or</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/mpeg,video/x-matroska,.mp4,.webm,.mov,.avi,.mpeg,.mkv"
        className="hidden"
        onChange={handleFileChange}
        disabled={loading}
      />

      <Button
        type="button"
        variant="outline"
        className="w-full h-12 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600"
        disabled={loading}
        onClick={() => fileInputRef.current?.click()}
      >
        {loading && stage === "uploading" ? statusLabel : "Upload a video file"}
      </Button>

      <p className="text-center text-zinc-600 text-xs">
        MP4, WebM, MOV, MKV · up to 2 GB
      </p>
    </div>
  );
}
