import { GoogleGenAI } from "@google/genai";

let _ai: GoogleGenAI | null = null;
function getAI() {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  return _ai;
}

const VIDEO_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "The video title or best-guess title" },
    language: { type: "string" },
    duration_seconds: { type: "number" },
    summary_short: { type: "string", description: "2-3 sentence TL;DR" },
    chapters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          start_sec: { type: "number" },
          end_sec: { type: "number" },
          title: { type: "string" },
          summary: { type: "string" },
        },
        required: ["start_sec", "end_sec", "title", "summary"],
      },
    },
    transcript: {
      type: "array",
      items: {
        type: "object",
        properties: {
          start_sec: { type: "number" },
          end_sec: { type: "number" },
          speaker: { type: "string" },
          text: { type: "string" },
        },
        required: ["start_sec", "end_sec", "text"],
      },
    },
    key_moments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          at_sec: { type: "number" },
          why: { type: "string" },
        },
      },
    },
    visual_events: {
      type: "array",
      items: {
        type: "object",
        properties: {
          at_sec: { type: "number" },
          kind: { type: "string", enum: ["slide", "code", "diagram", "equation", "whiteboard", "demo", "face"] },
          description: { type: "string" },
          extract_recommended: { type: "boolean" },
        },
      },
    },
  },
  required: ["title", "language", "duration_seconds", "summary_short", "chapters", "transcript"],
};

const PROMPT = `You are watching a video to help a user study, work, or repurpose it.
Your output drives every downstream artifact (mind map, slides, recall pack, clips).

For the video provided:
1. Detect language and duration.
2. Infer or extract the video title.
3. Write a 2–3 sentence TL;DR.
4. Identify natural chapters (3–15 chapters depending on length).
5. Produce a sentence-level transcript with start/end timestamps. Tag speakers if multiple.
6. Mark KEY MOMENTS — quotable, surprising, decision points, demo highlights.
7. Mark VISUAL EVENTS — every time a new slide appears, code is shown,
   a diagram/whiteboard appears, an equation is on screen, or a notable demo runs.
   For each, set extract_recommended=true if the visual content is rich enough
   that a user would want it pulled out as a downloadable artifact.

Be precise on timestamps (±2 seconds). Do not invent content not in the video.
Respond ONLY in the JSON schema provided.`;

// HTTP status codes that are worth retrying (transient server errors only — not 429 quota)
const RETRYABLE_STATUSES = [503, 504];

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface GeminiVideoResult {
  title?: string;
  language: string;
  duration_seconds: number;
  summary_short: string;
  chapters: Array<{
    start_sec: number;
    end_sec: number;
    title: string;
    summary: string;
  }>;
  transcript: Array<{
    start_sec: number;
    end_sec: number;
    speaker?: string;
    text: string;
  }>;
  key_moments?: Array<{ at_sec: number; why: string }>;
  visual_events?: Array<{
    at_sec: number;
    kind: string;
    description: string;
    extract_recommended: boolean;
  }>;
}

export async function ingestVideo(input: {
  youtubeUrl?: string;
  fileUri?: string;
  language?: string;
}): Promise<GeminiVideoResult> {
  const videoPart = input.youtubeUrl
    ? { fileData: { fileUri: input.youtubeUrl, mimeType: "video/*" } }
    : { fileData: { fileUri: input.fileUri!, mimeType: "video/mp4" } };

  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await getAI().models.generateContent({
        model: "gemini-1.5-pro",
        contents: [{ role: "user", parts: [videoPart, { text: PROMPT }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: VIDEO_SCHEMA,
          temperature: 0.2,
        },
      });

      return JSON.parse(response.text!) as GeminiVideoResult;
    } catch (err: unknown) {
      const httpStatus = (err as { status?: number }).status;
      const isRetryable = httpStatus !== undefined && RETRYABLE_STATUSES.includes(httpStatus);

      if (!isRetryable || attempt === MAX_RETRIES - 1) throw err;

      const delay = 2 ** attempt * 1000 + Math.random() * 500;
      await sleep(delay);
    }
  }

  throw new Error("ingestVideo: exhausted retries");
}
