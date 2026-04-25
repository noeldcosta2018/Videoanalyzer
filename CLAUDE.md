# Videoanalyzer — Project Context

> Claude reads this file at the start of every session. Keep it current.

## What we're building

A **video-first NotebookLM** — paste a YouTube URL or upload a video and get a rich interactive **Notebook** with Summary view, Detailed transcript, and a Studio of 12 generated artifacts: mind maps, extracted slides/code/diagrams, audio podcast overview, video overview, recall pack (flashcards + quiz), action items, short social clips, and a critical-viewing/fact-check layer.

**Positioning:** "NotebookLM treats your video like a transcript. We treat it like video."
**Wedge:** Developers first (multi-modal code+slide extraction), then Creators (clip generator), then Students (recall pack).

## Key documents

- **Full PRD:** `Video-Summary-PRD.md` — read this for full context on features, pricing, stack, roadmap
- **Team skills:** `.claude/skills/README.md` — the 8 project skills and when to use them

## The team (call by name)

| Name | Role | Skill file | Model |
|---|---|---|---|
| **Maya** | Project Manager | `.claude/skills/video-summary-pm/` | Opus |
| **Cora** | Data Architect | `.claude/skills/notebook-data-model/` | Sonnet |
| **Rex** | Video Pipeline Engineer | `.claude/skills/gemini-video-pipeline/` | Sonnet |
| **Hugo** | DevOps / Modal worker deploy | `.claude/skills/oss-worker-deploy/` | Sonnet |
| **Otto** | Backend / Inngest orchestration | `.claude/skills/inngest-pipeline-orchestrator/` | Sonnet |
| **Iris** | Studio artifact builder | `.claude/skills/studio-artifact-builder/` | Sonnet |
| **Penny** | COGS / cost monitor | `.claude/skills/cogs-monitor/` | Opus |
| **Felix** | Release manager / launch checklist | `.claude/skills/launch-checklist/` | Opus |

## Tech stack

- **Web:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Mobile:** Capacitor wrapping the Next.js app (Phase 3)
- **Auth + DB + Storage:** Supabase (Postgres + Auth + pgvector + Storage)
- **Object storage:** Cloudflare R2 (zero egress fees)
- **Background jobs:** Inngest
- **GPU workers:** Modal (serverless, pay-per-second)
- **Video AI:** Gemini 2.5 Flash (native YouTube URL ingestion — our "watching like a viewer" approach)
- **Cheap LLM:** DeepSeek V3 via OpenRouter (free tier), Claude Sonnet 4.6 (Pro tier reasoning)
- **OSS models:** Kokoro TTS, Chatterbox, Florence-2, faster-whisper, MusicGen, pix2tex, OpenVoice v2
- **Mind map:** React Flow
- **Video player:** react-player

## Current phase

**Phase 0 complete:** PRD written, team skills created, repo + Vercel connected.

**Phase 1 (now — Weeks 1–6): MVP Web**
Goal: YouTube URL + file upload → Summary view + Detailed view + Mind Map + Slide/code extraction + Audio Overview. Web only. Free tier only (no payments yet).

Next immediate steps:
1. Scaffold Next.js app (`npx create-next-app@latest`)
2. Wire Supabase (Cora sets up initial schema + auth)
3. Build ingestion API route (Rex — Gemini pipeline)
4. Build Summary + Detailed views
5. Build Mind Map (React Flow)
6. Build Audio Overview (Kokoro on Modal via Hugo)

## Infrastructure

- **Local:** `C:\dev\Videoanalyzer`
- **GitHub:** https://github.com/noeldcosta2018/Videoanalyzer (main branch)
- **Vercel:** https://vercel.com/noeldcosta2018-8336s-projects/videoanalyzer (auto-deploy on push to main, Next.js preset)
- **Git user:** noeldcosta2018 / noeldcosta2018@gmail.com

## Pricing

- Free: 60 min/month or 5 notebooks
- Pro: $9.99/mo ($6.99 annual) — 30 hrs, all features
- Team: $19/seat/mo ($14 annual) — shared library, admin, SSO

## Key decisions (locked)

- Default view = Summary first, then toggle to Detailed
- Mobile via Capacitor wrapping Next.js (not React Native)
- OSS-heavy: Kokoro > ElevenLabs, Florence-2 for OCR, DeepSeek for cheap LLM
- YouTube videos processed via Gemini direct URL (no download, no copyright issue)
- Private GitHub repo (competitive strategy in PRD)
- COGS target: ≤$0.15/video free tier, ≤$0.18/video Pro tier

## How to work with me

- **Call a team member by name** to invoke their skill: "Cora, add a column", "Rex, the pipeline is slow", "Penny, what's our COGS?", "Maya, status update", "Felix, are we ready to ship?"
- **Planning tasks** → Opus. **Delivery / code** → Sonnet (already set per skill)
- **Before claiming done:** run the `verification-before-completion` skill
- **Before shipping a phase:** call Felix
- **Every Monday:** Maya gives a status update (set up with the `schedule` skill)
