import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ingestVideo } from "@/lib/gemini/ingestVideo";

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

export async function POST(req: NextRequest) {
  try {
    const { youtube_url } = await req.json();

    if (!youtube_url || !isYouTubeUrl(youtube_url)) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    const url = youtube_url.trim() as string;

    // Identify the calling user
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

    // Deduplicate: return existing ready notebook for this URL
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

    // Create notebook (pending)
    const { data: notebook, error: nbError } = await db
      .from("notebooks")
      .insert({ user_id: user.id, youtube_url: url })
      .select("id")
      .single();

    if (nbError || !notebook) {
      return NextResponse.json({ error: "Failed to create notebook" }, { status: 500 });
    }

    // Create source row (pending)
    const { data: source, error: srcError } = await db
      .from("sources")
      .insert({ notebook_id: notebook.id, kind: "youtube_url", url })
      .select("id")
      .single();

    if (srcError || !source) {
      await db.from("notebooks").update({ status: "failed" }).eq("id", notebook.id);
      return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
    }

    // Call Gemini — the expensive step
    let geminiResult;
    try {
      geminiResult = await ingestVideo({ youtubeUrl: url });
    } catch (err) {
      await db.from("notebooks").update({ status: "failed" }).eq("id", notebook.id);
      await db.from("sources").update({ status: "failed" }).eq("id", source.id);
      console.error("Gemini ingestion failed:", err);
      return NextResponse.json({ error: "Video processing failed" }, { status: 502 });
    }

    // Derive title: Gemini result → first chapter title → first 8 words of summary
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
