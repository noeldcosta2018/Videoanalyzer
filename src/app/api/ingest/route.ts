import { NextRequest, NextResponse, after } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { ingestVideo, type GeminiVideoResult } from "@/lib/gemini/ingestVideo";
import { uploadFileToGemini } from "@/lib/gemini/uploadFile";
import { mergeChunks } from "@/lib/gemini/mergeChunks";
import { getR2DownloadUrl, getR2ObjectSize, deleteFromR2 } from "@/lib/r2";
import { getVideoDuration, extractChunk, cleanupTmp, CHUNK_SECONDS } from "@/lib/video/chunk";
import { statSync } from "fs";

// Allow up to 800s — Vercel Pro fluid compute; handles chunked long-video processing
export const maxDuration = 800;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDB = any;

function isYouTubeUrl(url: string) {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url.trim());
}

async function createServiceClient() {
  const cookieStore = await cookies();
  return createServerClient<AnyDB>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

async function createUserClient() {
  const cookieStore = await cookies();
  return createServerClient<AnyDB>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

function mimeFromPath(storagePath: string): string {
  const ext = storagePath.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
    avi: "video/x-msvideo", mpeg: "video/mpeg", mpg: "video/mpeg",
    mkv: "video/x-matroska",
  };
  return map[ext ?? ""] ?? "video/mp4";
}

function extFromPath(storagePath: string): string {
  return storagePath.split(".").pop()?.toLowerCase() ?? "mp4";
}

// Process an uploaded video — with automatic chunking for long files.
// Runs inside after() so it executes after the HTTP response is sent.
// Creates its own Supabase client (cookie-free) since request context is gone.
async function processUpload(
  notebookId: string,
  sourceId: string,
  storagePath: string
) {
  // Service role client — no cookies needed, bypasses RLS
  const db = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const r2Url = await getR2DownloadUrl(storagePath);
    const mimeType = mimeFromPath(storagePath);
    const ext = extFromPath(storagePath);

    // Probe duration to decide whether chunking is needed
    const duration = await getVideoDuration(r2Url);
    const needsChunking = duration > CHUNK_SECONDS;

    let geminiResult: GeminiVideoResult;

    if (!needsChunking) {
      // Short video: stream directly from R2 to Gemini (existing approach)
      const [freshUrl, fileSize] = await Promise.all([
        getR2DownloadUrl(storagePath),
        getR2ObjectSize(storagePath),
      ]);
      const fileUri = await uploadFileToGemini(freshUrl, mimeType, fileSize);
      geminiResult = await ingestVideo({ fileUri });
    } else {
      // Long video: extract 50-min chunks sequentially, process each, merge
      const numChunks = Math.ceil(duration / CHUNK_SECONDS);
      const chunkResults: Array<{ result: GeminiVideoResult; offsetSec: number }> = [];

      for (let i = 0; i < numChunks; i++) {
        const startSec = i * CHUNK_SECONDS;
        const chunkDuration = Math.min(CHUNK_SECONDS, duration - startSec);

        // Extract chunk to /tmp — ffmpeg reads from R2 via HTTP Range
        const tmpPath = await extractChunk(r2Url, startSec, chunkDuration, ext);

        try {
          // Upload chunk to Gemini Files API using streaming
          const chunkSize = statSync(tmpPath).size;
          const chunkR2Url = `file://${tmpPath}`; // local file path for fetch
          // Use a direct file read approach for local tmp files
          const { readFile } = await import("fs/promises");
          const chunkBuffer = await readFile(tmpPath);
          const chunkBlob = new Blob([chunkBuffer], { type: mimeType });

          // Upload via the SDK (blob fits in memory since chunk is ≤50 min)
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
          let uploadedFile = await ai.files.upload({ file: chunkBlob, config: { mimeType } });

          const { FileState } = await import("@google/genai");
          while (uploadedFile.state === FileState.PROCESSING) {
            await new Promise(r => setTimeout(r, 3000));
            uploadedFile = await ai.files.get({ name: uploadedFile.name! });
          }
          if (uploadedFile.state === FileState.FAILED) {
            throw new Error(`Gemini file processing failed for chunk ${i}`);
          }

          const chunkResult = await ingestVideo({ fileUri: uploadedFile.uri! });
          chunkResults.push({ result: chunkResult, offsetSec: startSec });
        } finally {
          await cleanupTmp(tmpPath);
        }
      }

      geminiResult = mergeChunks(chunkResults);
    }

    // Clean up from R2 — Gemini has the data now
    deleteFromR2(storagePath).catch(() => {});

    // Persist results
    const title =
      geminiResult.title ||
      geminiResult.chapters?.[0]?.title ||
      geminiResult.summary_short?.split(" ").slice(0, 8).join(" ") + "…" ||
      "Untitled Notebook";

    await Promise.all([
      db.from("sources").update({
        status: "ready",
        gemini_response_json: geminiResult,
        duration_seconds: Math.round(geminiResult.duration_seconds),
        language: geminiResult.language,
      }).eq("id", sourceId),

      db.from("notebooks").update({
        status: "ready",
        title,
      }).eq("id", notebookId),
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ingest] background processing failed:", msg, err);
    await Promise.all([
      db.from("notebooks").update({ status: "failed" }).eq("id", notebookId),
      db.from("sources").update({ status: "failed" }).eq("id", sourceId),
    ]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { youtube_url, storage_path } = body;

    const isYouTube = !!youtube_url;
    const isUpload = !!storage_path;

    if (!isYouTube && !isUpload) {
      return NextResponse.json({ error: "Provide youtube_url or storage_path" }, { status: 400 });
    }
    if (isYouTube && !isYouTubeUrl(youtube_url)) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    // Auth
    const userClient = await createUserClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", detail: authError?.message ?? "no session" },
        { status: 401 }
      );
    }

    const db = await createServiceClient();

    // Deduplicate: return existing ready notebook for the same YouTube URL
    if (isYouTube) {
      const url = youtube_url.trim() as string;
      const { data: existing } = await db
        .from("notebooks")
        .select("id")
        .eq("user_id", user.id)
        .eq("youtube_url", url)
        .eq("status", "ready")
        .maybeSingle();

      if (existing) return NextResponse.json({ notebook_id: existing.id });
    }

    // Create notebook (processing)
    const notebookInsert = isYouTube
      ? { user_id: user.id, youtube_url: youtube_url.trim(), status: "processing" }
      : { user_id: user.id, status: "processing" };

    const { data: notebook, error: nbError } = await db
      .from("notebooks")
      .insert(notebookInsert)
      .select("id")
      .single();

    if (nbError || !notebook) {
      return NextResponse.json({ error: "Failed to create notebook" }, { status: 500 });
    }

    // Create source row
    const sourceInsert = isYouTube
      ? { notebook_id: notebook.id, kind: "youtube_url", url: youtube_url.trim(), status: "processing" }
      : { notebook_id: notebook.id, kind: "upload_video", r2_key: storage_path, status: "processing" };

    const { data: source, error: srcError } = await db
      .from("sources")
      .insert(sourceInsert)
      .select("id")
      .single();

    if (srcError || !source) {
      await db.from("notebooks").update({ status: "failed" }).eq("id", notebook.id);
      return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
    }

    if (isYouTube) {
      // YouTube: still process synchronously (fast, no chunking needed)
      try {
        const geminiResult = await ingestVideo({ youtubeUrl: youtube_url.trim() });
        const title =
          geminiResult.title ||
          geminiResult.chapters?.[0]?.title ||
          geminiResult.summary_short?.split(" ").slice(0, 8).join(" ") + "…" ||
          "Untitled Notebook";

        await Promise.all([
          db.from("sources").update({
            status: "ready",
            gemini_response_json: geminiResult,
            duration_seconds: Math.round(geminiResult.duration_seconds),
            language: geminiResult.language,
          }).eq("id", source.id),
          db.from("notebooks").update({ status: "ready", title }).eq("id", notebook.id),
        ]);
      } catch (err) {
        await db.from("notebooks").update({ status: "failed" }).eq("id", notebook.id);
        await db.from("sources").update({ status: "failed" }).eq("id", source.id);
        console.error("Gemini ingestion failed:", err);
        const httpStatus = (err as { status?: number }).status;
        const errMsg = (err as { message?: string }).message ?? "";
        const isQuota = httpStatus === 429;
        const isTokenLimit = httpStatus === 400 && errMsg.includes("token");
        const userMessage = isQuota
          ? "Gemini API quota exceeded. Please wait a minute and try again."
          : isTokenLimit
          ? "Video is too long for AI processing — maximum is ~60 minutes. Try a shorter clip."
          : "Video processing failed";
        return NextResponse.json({ error: userMessage }, { status: 502 });
      }
    } else {
      // Uploaded video: process in background after response is sent
      after(async () => {
        await processUpload(notebook.id, source.id, storage_path);
      });
    }

    return NextResponse.json({ notebook_id: notebook.id });
  } catch (err) {
    console.error("POST /api/ingest error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
