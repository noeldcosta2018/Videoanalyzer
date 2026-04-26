import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDB = any;

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB
const ALLOWED_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/mpeg",
  "video/x-matroska",
]);

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileSize, mimeType } = await req.json();

    if (!fileName || typeof fileSize !== "number" || !mimeType) {
      return NextResponse.json({ error: "Missing fileName, fileSize, or mimeType" }, { status: 400 });
    }
    if (fileSize > MAX_BYTES) {
      return NextResponse.json({ error: "File too large. Maximum size is 500 MB." }, { status: 413 });
    }
    if (!ALLOWED_TYPES.has(mimeType)) {
      return NextResponse.json({ error: "Unsupported file type. Please upload an MP4, WebM, MOV, or MKV." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient<AnyDB>(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Path: {userId}/{timestamp}-{random}.{ext}
    const ext = fileName.split(".").pop()?.toLowerCase() || "mp4";
    const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("videos")
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      console.error("createSignedUploadUrl error:", error);
      return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
    }

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      storagePath,
      token: data.token,
    });
  } catch (err) {
    console.error("POST /api/upload-url error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
