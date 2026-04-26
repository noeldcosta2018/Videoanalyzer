import { execFile } from "child_process";
import { promisify } from "util";
import { rm } from "fs/promises";
import ffmpegPath from "ffmpeg-static";

const exec = promisify(execFile);

// 50 minutes — safe buffer below Gemini's ~64-min (1M token) limit
export const CHUNK_SECONDS = 50 * 60;

// Get video duration in seconds by probing via ffmpeg stderr output.
// ffmpeg -i <url> always exits non-zero (no output file) but writes duration to stderr.
export async function getVideoDuration(r2Url: string): Promise<number> {
  if (!ffmpegPath) throw new Error("ffmpeg-static not found");
  try {
    await exec(ffmpegPath, ["-i", r2Url, "-hide_banner"], { timeout: 45_000 });
  } catch (err: unknown) {
    const stderr = (err as { stderr?: string }).stderr ?? "";
    const m = /Duration:\s+(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
    if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  }
  return 0;
}

// Extract one time segment from the R2 signed URL into /tmp.
// Uses fast HTTP seek — ffmpeg fetches only the required bytes via Range requests.
export async function extractChunk(
  r2Url: string,
  startSec: number,
  durationSec: number,
  ext: string
): Promise<string> {
  if (!ffmpegPath) throw new Error("ffmpeg-static not found");
  const tmpPath = `/tmp/${Date.now()}-${startSec}.${ext}`;
  await exec(ffmpegPath, [
    "-ss", String(startSec),
    "-i", r2Url,
    "-t", String(durationSec),
    "-c", "copy",
    "-movflags", "+faststart",
    "-y",
    tmpPath,
  ], { timeout: 300_000, maxBuffer: 10 * 1024 * 1024 });
  return tmpPath;
}

export async function cleanupTmp(path: string): Promise<void> {
  await rm(path, { force: true });
}
