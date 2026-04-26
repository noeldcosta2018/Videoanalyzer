import { GoogleGenAI, FileState } from "@google/genai";

let _ai: GoogleGenAI | null = null;
function getAI() {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  return _ai;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function uploadFileToGemini(blob: Blob, mimeType: string): Promise<string> {
  const ai = getAI();

  let file = await ai.files.upload({ file: blob, config: { mimeType } });

  // Poll until the file is done processing (usually 10–60s)
  while (file.state === FileState.PROCESSING) {
    await sleep(3000);
    file = await ai.files.get({ name: file.name! });
  }

  if (file.state === FileState.FAILED) {
    throw new Error(`Gemini file processing failed: ${file.error?.message ?? "unknown"}`);
  }

  return file.uri!;
}
