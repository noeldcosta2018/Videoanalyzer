import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ingestVideo } from "@/lib/gemini/ingestVideo";
import { uploadFileToGemini } from "@/lib/gemini/uploadFile";
import { downloadFromR2, deleteFromR2 } from "@/lib/r2";

// Allow up to 5 minutes — R2 download + Gemini upload + analysis
export const maxDuration = 300;

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
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mpeg: "video/mpeg",
    mpg: "video/mpeg",
    mkv: "video/x-matroska",
  };
  return map[ext ?? ""] ?? "video/mp4";
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
      console.error("[ingest] auth failed:", authError?.message ?? "no user");
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

      if (existing) {
        return NextResponse.json({ notebook_id: existing.id });
      }
    }

    // Create notebook (pending)
    const notebookInsert = isYouTube
      ? { user_id: user.id, youtube_url: youtube_url.trim() }
      : { user_id: user.id };

    const { data: notebook, error: nbError } = await db
      .from("notebooks")
      .insert(notebookInsert)
      .select("id")
      .single();

    if (nbError || !notebook) {
      return NextResponse.json({ error: "Failed to create notebook" }, { status: 500 });
    }

    // Create source row (pending)
    const sourceInsert = isYouTube
      ? { notebook_id: notebook.id, kind: "youtube_url", url: youtube_url.trim() }
      : { notebook_id: notebook.id, kind: "upload_video", r2_key: storage_path };

    const { data: source, error: srcError } = await db
      .from("sources")
      .insert(sourceInsert)
      .select("id")
      .single();

    if (srcError || !source) {
      await db.from("notebooks").update({ status: "failed" }).eq("id", notebook.id);
      return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
    }

    // For uploaded files: download from R2 → upload to Gemini Files API
    let fileUri: string | undefined;
    if (isUpload) {
      try {
        const fileBlob = await downloadFromR2(storage_path);
        const mimeType = mimeFromPath(storage_path);
        fileUri = await uploadFileToGemini(fileBlob, mimeType);
        // Delete from R2 immediately — Gemini has it now, no need to keep the copy
        deleteFromR2(storage_path).catch(() => {}); // fire-and-forget, non-critical
      } catch (err) {
        await db.from("notebooks").update({ status: "failed" }).eq("id", notebook.id);
        await db.from("sources").update({ status: "failed" }).eq("id", source.id);
        console.error("File upload to Gemini failed:", err);
        return NextResponse.json({ error: "Failed to upload video for processing" }, { status: 502 });
      }
    }

    // Call Gemini — the expensive step
    let geminiResult;
    try {
      geminiResult = isYouTube
        ? await ingestVideo({ youtubeUrl: youtube_url.trim() })
        : await ingestVideo({ fileUri });
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
        ? "Video is too long for AI processing — Gemini's limit is ~60 minutes. Try a shorter clip."
        : "Video processing failed";
      return NextResponse.json({ error: userMessage }, { status: 502 });
    }

    // Derive title
    const title =
      geminiResult.title ||
      geminiResult.chapters?.[0]?.title ||
      geminiResult.summary_short?.split(" ").slice(0, 8).join(" ") + "…" ||
      "Untitled Notebook";

    // Persist results
    await Promise.all([
      db.from("sources").update({
        status: "ready",
        gemini_response_json: geminiResult,
        duration_seconds: Math.round(geminiResult.duration_seconds),
        language: geminiResult.language,
      }).eq("id", source.id),

      db.from("notebooks").update({
        status: "ready",
        title,
      }).eq("id", notebook.id),
    ]);

    return NextResponse.json({ notebook_id: notebook.id });
  } catch (err) {
    console.error("POST /api/ingest error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
