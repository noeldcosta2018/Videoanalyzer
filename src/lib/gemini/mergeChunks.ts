import type { GeminiVideoResult } from "./ingestVideo";

export function mergeChunks(
  chunks: Array<{ result: GeminiVideoResult; offsetSec: number }>
): GeminiVideoResult {
  if (chunks.length === 0) throw new Error("No chunks to merge");
  if (chunks.length === 1) return chunks[0].result;

  const first = chunks[0].result;
  const last = chunks[chunks.length - 1];

  return {
    title: first.title,
    language: first.language,
    duration_seconds: last.offsetSec + last.result.duration_seconds,
    summary_short: first.summary_short,
    chapters: chunks.flatMap(({ result, offsetSec }) =>
      result.chapters.map(ch => ({
        ...ch,
        start_sec: ch.start_sec + offsetSec,
        end_sec: ch.end_sec + offsetSec,
      }))
    ),
    transcript: chunks.flatMap(({ result, offsetSec }) =>
      result.transcript.map(t => ({
        ...t,
        start_sec: t.start_sec + offsetSec,
        end_sec: t.end_sec + offsetSec,
      }))
    ),
    key_moments: chunks.flatMap(({ result, offsetSec }) =>
      (result.key_moments ?? []).map(km => ({
        ...km,
        at_sec: km.at_sec + offsetSec,
      }))
    ),
    visual_events: chunks.flatMap(({ result, offsetSec }) =>
      (result.visual_events ?? []).map(ve => ({
        ...ve,
        at_sec: ve.at_sec + offsetSec,
      }))
    ),
  };
}
