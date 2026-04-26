import { GoogleGenAI, FileState } from "@google/genai";

let _ai: GoogleGenAI | null = null;
function getAI() {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  return _ai;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Streams a file from an R2 signed URL directly to the Gemini Files API
// using the resumable upload protocol — never loads the full file into RAM.
export async function uploadFileToGemini(r2Url: string, mimeType: string, fileSize: number): Promise<string> {
  if (!fileSize) throw new Error("fileSize is required for Gemini resumable upload");

  // Step 1: Initiate a resumable upload session with Gemini
  const initRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(fileSize),
        "X-Goog-Upload-Header-Content-Type": mimeType,
      },
      body: JSON.stringify({ file: { display_name: "video" } }),
    }
  );
  if (!initRes.ok) throw new Error(`Gemini upload init failed: ${initRes.status}`);

  const uploadUrl = initRes.headers.get("x-goog-upload-url");
  if (!uploadUrl) throw new Error("Missing x-goog-upload-url from Gemini");

  // Step 2: Stream from R2 directly to Gemini — no Blob in RAM
  const r2Res = await fetch(r2Url);
  if (!r2Res.ok || !r2Res.body) throw new Error(`R2 stream failed: ${r2Res.status}`);

  const finalRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(fileSize),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: r2Res.body,
    // Required in Node.js 18+ to allow a streaming request body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(({ duplex: "half" } as any)),
  });
  if (!finalRes.ok) {
    const detail = await finalRes.text().catch(() => "");
    throw new Error(`Gemini upload finalize failed: ${finalRes.status} ${detail}`);
  }

  const fileJson = await finalRes.json() as { file?: { name?: string; uri?: string } };
  const fileName = fileJson.file?.name;
  if (!fileName) throw new Error("No file name in Gemini upload response");

  // Step 3: Poll until Gemini finishes processing the file
  const ai = getAI();
  let fileInfo = await ai.files.get({ name: fileName });
  while (fileInfo.state === FileState.PROCESSING) {
    await sleep(3000);
    fileInfo = await ai.files.get({ name: fileName });
  }
  if (fileInfo.state === FileState.FAILED) {
    throw new Error(`Gemini file processing failed: ${fileInfo.error?.message ?? "unknown"}`);
  }

  return fileInfo.uri!;
}
