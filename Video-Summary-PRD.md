# Video Summary — Master Plan (PRD v1.0)

> **Status:** Approved for build · **Owner:** Noel · **Last updated:** 2026-04-25

---

## TL;DR

A **video-first NotebookLM**, built mobile + web, that turns any uploaded video or YouTube URL into a rich, interactive **Notebook** with a Summary view, a Detailed view, and a "Studio" of generated artifacts: mind maps, slides extracted from frames, code snippets, recall packs, audio podcast overviews, animated video overviews, action items, and short social clips. **Free + Pro ($9.99/mo) + Team ($19/seat)** — half the price of NotebookLM Plus, with the things NotebookLM doesn't ship: native video-frame intelligence, creator workflows, and an action layer for meetings.

Stack: **Next.js + Capacitor + Supabase + Cloudflare R2 + Inngest + Modal**. AI: **Gemini 2.5 Flash** (the only paid model in the hot path) + **Claude Sonnet 4.6** (Pro tier reasoning) + an **open-source heavy** layer (Kokoro, Chatterbox, faster-whisper, Florence-2, DeepSeek V3) running serverless. **COGS ~$0.05–0.15 per video.** Pro margin ~95%.

---

## 1. The Problem

People consume more long-form video than they have time for — lectures, tutorials, recorded meetings, podcasts, conference talks, YouTube essays. Existing summarizers (Eightify, NoteGPT, tl;dv, Otter, Fireflies) treat video as a transcript: they spit out bullet points and call it done. NotebookLM redefined the bar with a notebook + studio model, but it's **document-first** — video is a second-class source.

**The gap:** nobody is building a *video-first* notebook product that:
- Sees the video (slides, code, diagrams, equations on screen — not just speech)
- Turns it into things you'd actually use afterwards (study materials, action items, social clips)
- Costs a fraction of NotebookLM Plus

---

## 2. Positioning

> **"NotebookLM treats your video like a transcript. We treat it like video — and turn it into everything you'd actually do with what you watched: ship the action items, post the clips, run the study session, build the deck."**

Tagline candidates (resolve in branding sprint):
- *"The notebook that actually watches the video."*
- *"Watch less. Learn more. Do more."*
- *"Your videos, but useful."*

---

## 3. Target Users

| Persona | Job-to-be-done | Why we win |
|---|---|---|
| **Developer learner** | Watch a 1-hour tutorial → walk away with runnable code + the slide deck | Multi-modal frame extraction (no one does this well) |
| **Student** | Turn a 2-hour lecture into flashcards before the exam | Recall pack + audio overview to listen while walking |
| **Creator / podcaster** | Turn one long video into 5 short social clips | Auto-clip generator with vertical reframe + captions |
| **Knowledge worker** | Recorded meeting → action items in Linear/Notion | Meeting Mode + integrations |
| **Researcher / journalist** | Process interview footage with citations + fact-check | Critical-viewing layer + cross-source chat |
| **Casual viewer** | "Should I watch this?" before committing 90 min | Pre-watch screener (P1) |

**Wedge to launch on: Developers** (HN/Product Hunt). Multi-modal code+slide extraction is the most defensible "Google can't ship this tomorrow" win.

---

## 4. Competitive Landscape (April 2026)

| Tool | Free | Paid entry | Pro/Top | What they do | What they don't |
|---|---|---|---|---|---|
| Eightify | Trial | $4.99/mo | — | Chrome ext, YouTube summaries | No notebook, no studio, no upload |
| NoteGPT | 15 quotas/mo | $9.99/mo | $19 / $29 | Summary + mind map + Q&A | Weak video frame intelligence |
| Notta | 120 min/mo | $13.99/mo | $27.99 | Transcription | No studio artifacts |
| Otter | 300 min/mo | $16.99/mo | $30 | Meetings | Meetings-only, no learning UX |
| Fireflies | 800 min once | $18/mo | $29–39 | Meetings | Same |
| tl;dv | 10 sums/mo | $18/mo | $98 | Sales meetings | Same |
| **NotebookLM** | 100 notebooks, 3 audio/day | **Plus $19.99/mo** | Ultra $249.99/mo | Multi-source notebooks, audio overview, cinematic video overview (Ultra only) | **Document-first, no video-frame intelligence, no creator/action layer** |

**Our slot:** between Eightify (too light) and NotebookLM Plus (too generic, too expensive). Specialize on video, undercut on price, beat on artifacts.

---

## 5. Goals & Non-Goals

### Goals (v1)
1. Process a 60-min video into a complete notebook in **under 3 minutes** (P50).
2. Default user (free) reaches "wow" — mind map + audio overview + recall pack — within **90 seconds** of first sign-up.
3. **40% week-2 retention** on free tier; **5% free→Pro** within 30 days.
4. **COGS per processed video ≤ $0.15** (verified at launch).
5. **Mobile and web at parity** on day 1 (Capacitor wraps Next.js).

### Non-Goals (v1)
- Real-time / live transcription (out: different problem)
- Live meeting bot (joins Zoom/Meet/Teams) — P2
- Public SEO summary pages — P2 (notebook sharing covers it)
- Voice-cloned narration of arbitrary voices — legal/ethical risk; only opt-in self-cloning
- API for developers — P2
- Enterprise compliance (HIPAA, SOC 2, on-prem) — defer until Team traction

---

## 6. Architecture: The Notebook Model

We adopt NotebookLM's mental model because users already understand it. Every video lands in a **Notebook**, which has three panels:

```
┌──────────────┬─────────────────────────────┬──────────────┐
│   SOURCES    │           STUDIO            │     CHAT     │
│              │                             │              │
│ ▣ Video.mp4  │  ┌────────┐  ┌───────────┐ │  Ask the     │
│ ▣ slides.pdf │  │Summary │  │Mind Map   │ │  notebook    │
│ ▣ notes.md   │  └────────┘  └───────────┘ │  anything.   │
│ + Add        │  ┌────────┐  ┌───────────┐ │              │
│              │  │Audio   │  │Video      │ │  Citations   │
│              │  │Overview│  │Overview   │ │  link to the │
│              │  └────────┘  └───────────┘ │  exact second│
│              │  ┌────────┐  ┌───────────┐ │  / page.     │
│              │  │Recall  │  │Action List│ │              │
│              │  │Pack    │  │           │ │              │
│              │  └────────┘  └───────────┘ │              │
│              │  ┌────────┐  ┌───────────┐ │              │
│              │  │Slides  │  │Code Pack  │ │              │
│              │  │Deck    │  │           │ │              │
│              │  └────────┘  └───────────┘ │              │
│              │  ┌────────┐  ┌───────────┐ │              │
│              │  │Clips   │  │Fact-Check │ │              │
│              │  └────────┘  └───────────┘ │              │
└──────────────┴─────────────────────────────┴──────────────┘
```

- **Sources:** videos (YouTube URL or upload), PDFs, articles, audio, user notes. Mix freely.
- **Studio:** one-click artifact generators (12 at launch).
- **Chat:** ask across all sources; citations seek to the exact second in video / exact page in PDF.
- **Templates:** preset notebooks for common jobs (Course, Sales Deal, Lit Review, Sermon Series, Interview Prep, Podcast Production).

**Default landing on a new notebook:** Summary view (loads first, fastest to render) → toggle to Detailed.

---

## 7. Feature Set

### P0 — Ship at Launch (v1)

#### Ingestion
- Paste YouTube URL (validated, public videos only)
- Upload MP4 / MOV / WebM up to 2 GB / 2 hours
- Mobile share-sheet ingest (iOS + Android — share from YouTube app)
- Browser extension: hover preview on YouTube thumbnails; "Send to my notebook" button

#### Notebook
- Multi-source containers (videos + PDFs + articles + notes)
- Sharing via read-only public link
- 6 templates at launch: Course, Sales Deal, Lit Review, Sermon Series, Interview Prep, Podcast Production
- History of all past notebooks
- Export: Markdown, PDF, ZIP-of-everything

#### Studio Artifacts (12)
1. **Summary** — TL;DR + bullets + key takeaways. Persona switcher: ELI12, Engineer, Executive, Designer, Custom.
2. **Detailed Transcript** — chapters, key moments, speaker labels, click-to-seek on every sentence.
3. **Mind Map** — interactive (React Flow), editable, every node seeks to the source second.
4. **Slide Deck** — reconstructed from extracted video frames, exported as PPTX/PDF.
5. **Code Pack** — OCR'd snippets, language-detected, syntax-highlighted, downloadable as files.
6. **Diagram & Equation Pack** — extracted images + LaTeX equations.
7. **Audio Overview** — multi-format (5 presets): 2-host podcast, solo lecture, debate, ELI12, language-learning dialogue.
8. **Video Overview** — animated slide-driven explainer (NOT Veo — built from extracted slides + Ken Burns + voiceover).
9. **Recall Pack** — flashcards (Anki export), quiz with answers, glossary.
10. **Action List** — decisions, action items with assignees + due dates, push to Linear / Notion / Slack / Calendar.
11. **Short Clips** — top 3 social-ready vertical clips with animated captions.
12. **Critical Viewing Layer** — claims tagged (factual / opinion / prediction), web evidence pulled, confidence scores.

#### Chat
- Cross-source semantic search with citations to exact timestamp / page
- Time-aware summary modes: 1-min / 5-min / 30-min toggle

#### Languages
- English at launch + Spanish, French, German, Hindi, Mandarin (Gemini handles all natively, same cost)

#### Platform parity
- Web: Next.js 15 (App Router)
- Mobile: Capacitor wrapping Next.js → iOS + Android
- Mobile-optimized layouts: portrait mind map (pinch-zoom), walk-and-listen audio queue, share-sheet ingest

### P1 — Fast follow (v1.5, weeks 8–14)
- Knowledge graph linking concepts across user's library
- Pre-watch screener ("Should you watch this?")
- Public shareable summary pages with SEO (acquisition loop)
- Audio overview with **Interactive Mode** (talk to the hosts mid-podcast)
- Browser extension full features (sync notebooks across browser + app)

### P2 — Future (v2+)
- Live meeting bot (Zoom/Meet/Teams)
- Voice-cloned narration (opt-in, self-clone only)
- Marketplace of community templates
- Public API for developers
- Enterprise compliance (HIPAA, SOC 2)
- Custom domains for shared notebooks

---

## 8. The Moat — Where We Beat NotebookLM

| # | NotebookLM gap | Our wedge |
|---|---|---|
| 1 | Doesn't extract slides/code/diagrams from video frames | **Multi-modal extraction is the hero feature** |
| 2 | Click-to-seek on video sources is rough | Every artifact seeks to the **exact second**, every node, every bullet |
| 3 | Zero short-form clip generation | **Auto-clip generator** with vertical reframe + captions |
| 4 | Built for content consumers, not creators | **Creator Mode** — repurpose-focused workflow |
| 5 | No action layer / integrations | **Push to Linear / Notion / Slack / Calendar** |
| 6 | Cinematic Video Overview gated at $250/mo Ultra | **We ship video overview at $9.99 Pro** (cheap pipeline, not Veo) |
| 7 | Audio overview = one format only | **5 audio formats** + opt-in voice cloning |
| 8 | Mobile is decent but not central | Native share-sheet, portrait mind map, audio queue |
| 9 | Privacy concerns (Google AI) | "Notebooks never train on your data" + EU residency option |

---

## 9. UX Flow (Critical Paths)

### First-time user → "wow" in 90 seconds
1. Land on hero ("Paste a YouTube link →") with a 6-sec demo loop showing mind map + extracted slides flying out
2. Paste URL → no signup yet → instant processing starts (free trial of one notebook)
3. Live progress: *Watching video... extracting frames... building mind map... generating audio...*
4. Land on Summary view (default) — TL;DR + bullets render first
5. Studio sidebar populates as artifacts complete (mind map → audio → slides → recall)
6. CTA: "Save this notebook (free account)"

### Returning user
1. Notebooks list (most recent first)
2. Click → Summary view loads in <500ms (cached)
3. Toggle Detailed / Studio panel / Chat
4. "+ Add source" or "+ New notebook" always visible

### Mobile-specific
- Share from YouTube app → notebook created in background → push notification when done
- Audio Overview tab is prominent (mobile = walking/commuting context)
- Portrait mind map with pinch-zoom + click-to-play

---

## 10. Technical Architecture

### Web + Mobile
| Layer | Tech | Why |
|---|---|---|
| Web framework | **Next.js 15 + App Router + TypeScript** | User's call. Modern, fast, batteries-included. |
| UI | **Tailwind + shadcn/ui** | Standard, looks great, ships fast |
| Mobile shell | **Capacitor 6** wrapping the Next.js web app | One codebase → iOS + Android + Web. Native share-sheet + push via Capacitor plugins. |
| State | React Query + Zustand | Lightweight |
| Mind map | **React Flow** (xyflow) | OSS, mature, click-to-seek trivial |
| Video player | **react-player** | Handles YouTube embeds + uploaded MP4 in one component |

### Backend
| Layer | Tech | Why |
|---|---|---|
| API | Next.js API routes + Edge functions | Lives next to the frontend |
| Background jobs | **Inngest** | Generous free tier; perfect for "process this video" workflows |
| Database | **Supabase Postgres** | Free tier, includes Auth + Storage + pgvector |
| Auth | **Supabase Auth** (email + Google + Apple) | Drops in, handles RLS |
| Object storage | **Cloudflare R2** | **Zero egress fees** — critical for streaming video back |
| Vector store | **pgvector** in Supabase | Free, in the same DB |
| Hosting | **Vercel** for Next.js + **Modal** for GPU jobs + **Fly.io** for any persistent worker | All have free/cheap tiers |

### AI Stack — the cost-critical layer

#### Paid (where quality matters)
| Job | Model | Cost |
|---|---|---|
| Watch the video natively (audio + frames in one call) | **Gemini 2.5 Flash** (YouTube URL or uploaded file) | ~$0.05–0.15 / hr of video |
| Hardest reasoning (mind map, fact-check, knowledge graph) — **Pro tier only** | **Claude Sonnet 4.6** | ~$0.03 / video |

#### Open-source self-hosted (on Modal — pay per second of GPU)
| Job | Model | Repo / Cost |
|---|---|---|
| TTS for audio overview | **Kokoro-82M** (Apache 2.0) — default voices, runs on CPU | [hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) — ~$0.002/overview |
| TTS premium / emotional voices | **Chatterbox** (Resemble, MIT) | [resemble-ai/chatterbox](https://github.com/resemble-ai/chatterbox) |
| Voice cloning (opt-in self-clone only) | **OpenVoice v2** (MIT) | [myshell-ai/OpenVoice](https://github.com/myshell-ai/OpenVoice) |
| Fallback transcription (uploaded files Gemini can't take) | **faster-whisper** + **WhisperX** + **pyannote-audio** | [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) — ~$0.005/hr |
| OCR for slides / general | **Florence-2** (Microsoft, MIT) + **PaddleOCR** for multilingual | [microsoft/Florence-2](https://huggingface.co/microsoft/Florence-2-large), [PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) |
| Equation OCR → LaTeX | **pix2tex (LaTeX-OCR)** | [lukas-blecher/LaTeX-OCR](https://github.com/lukas-blecher/LaTeX-OCR) |
| Document OCR (PDF sources) | **Surya** | [VikParuchuri/surya](https://github.com/VikParuchuri/surya) |
| Slide reconstruction → PPTX | **python-pptx** + **WeasyPrint** for PDF | Free |
| Vertical reframe for short clips | **ffmpeg** + AutoFlip-style smart crop | Free |
| Caption burn-in | **whisper.cpp** + ffmpeg subtitle overlay | Free |
| Background music for podcasts | **MusicGen** (Meta AudioCraft) | [facebookresearch/audiocraft](https://github.com/facebookresearch/audiocraft) |
| Cheap LLM (free-tier summary, persona, quiz) | **DeepSeek V3** via OpenRouter or **Qwen 2.5 72B** via Groq | ~$0.001 / video |
| Mind map markdown render fallback | **Markmap** | [markmap/markmap](https://github.com/markmap/markmap) |

### How it fits together (per-video pipeline)

```
User pastes URL or uploads video
      │
      ▼
Inngest job: createNotebook
      │
      ├──► Gemini 2.5 Flash watches video (URL or signed R2 URL)
      │     returns: transcript + chapters + frame descriptions + key moments
      │
      ├──► Modal worker: extract frames at chapter boundaries
      │     ├─ Florence-2 → OCR slides + classify content
      │     ├─ pix2tex   → equations to LaTeX
      │     └─ python-pptx → reconstruct slide deck
      │
      ├──► DeepSeek V3 (free) or Sonnet 4.6 (Pro) generate:
      │     summary, persona reframes, quiz, flashcards, mind map JSON,
      │     action items, audio script
      │
      ├──► Modal worker: Kokoro/Chatterbox renders audio script
      │     → ffmpeg mixes with MusicGen intro → audio overview MP3
      │
      ├──► Modal worker: ffmpeg builds video overview from slide deck
      │     + voiceover + Ken Burns motion
      │
      ├──► Modal worker: ffmpeg picks 3 clips, vertical reframes,
      │     burns captions → MP4 short clips
      │
      └──► Supabase: store all artifacts; pgvector embeds chunks for chat
```

---

## 11. Pricing

| Tier | Price | Annual | What you get |
|---|---|---|---|
| **Free** | $0 | — | 60 min video/month or 5 notebooks (whichever first), all 12 artifacts, watermarked clips, low-res video overview |
| **Pro** | **$9.99/mo** | **$83/yr ($6.99/mo)** | 30 hrs video/month, no watermarks, all artifacts at full quality, integrations (Linear/Notion/Slack/Calendar), Sonnet-quality reasoning, ElevenLabs voices add-on $2/mo |
| **Team** | **$19/seat/mo** (min 3) | **$14/seat/mo** | Everything in Pro + shared notebooks + admin + SSO + 100 hrs/seat |

**Pricing page hook:**
> *"Get NotebookLM-grade studio outputs — built for video — at half the price. Video overviews shouldn't cost $250/month."*

**Why this works:**
- Matches NoteGPT Pro at $9.99 → easy mental anchor
- Half of NotebookLM Plus ($19.99) → clear value
- Way under Otter/Fireflies/tl;dv ($17–30) → consumer wedge
- Team tier undercuts Fireflies Business ($19) at parity → opens that lane

---

## 12. Unit Economics

| Per video | Cost |
|---|---|
| Gemini 2.5 Flash (watch video) | $0.10 |
| Cheap LLM (DeepSeek) for summary/persona/quiz | $0.005 |
| Sonnet 4.6 (Pro tier only — mind map + fact-check) | $0.03 (Pro only) |
| TTS audio overview (Kokoro on Modal) | $0.002 |
| Video overview (Modal ffmpeg pipeline) | $0.02 |
| OCR (Florence-2 on Modal) | $0 (CPU) |
| Fallback transcription (faster-whisper) | $0.005 / hr (only when needed) |
| **Total per video — Free tier** | **~$0.13** |
| **Total per video — Pro tier** | **~$0.16** |

**Margin math:**
- Free user @ 60 min/mo (avg ~5 videos): ~$0.65/month cost. Sustainable up to ~10× current free-trial conversion benchmarks.
- Pro user @ 30 hrs/mo (avg ~30 videos): ~$5/month cost vs $9.99 revenue → **50% gross margin** at heavy use; **95%+ at typical use** (most Pro users process <10 hrs/mo).
- Team seat @ $14/seat annual, ~50 hrs/seat avg: ~$8 cost vs $14 revenue → ~43% margin at heavy use.

---

## 13. Content Rights & Legal

**Position (locked):** the system *watches* videos as a viewer would — no download, no rehosting → no copyright claim against us.

**Implementation:**
- **YouTube:** pass URL directly to Gemini's native YouTube ingestion (Google itself runs the playback). Embed via official YouTube IFrame Player API in UI. We never download, store, or rehost.
- **User uploads:** ToS makes user affirm they own / have rights to the content.
- **Outputs (transcripts, summaries, mind maps, clips):** treated as user-generated derivative works, owned by the user.

**Residual risks (manageable):**
- Short clips of copyrighted content for social → fair-use guardrails: 30-sec max, attribution required, watermark on free tier, warning banner on export.
- DMCA reporting flow on user uploads (cheap to add; removes 95% of risk).
- ToS pages: clear "you affirm rights on upload" + "we don't claim ownership of your outputs."

---

## 14. Success Metrics

### Leading indicators (first 30 days post-launch)
- **Activation:** ≥60% of signups complete a first notebook
- **Time-to-first-notebook (P50):** <3 min
- **Studio engagement:** ≥3 artifacts opened per notebook on avg
- **Mind-map interaction rate:** ≥35% of notebook sessions click a node
- **Multi-modal artifact downloads:** ≥1.5 per video on avg
- **Click-to-seek rate:** ≥40% of sessions
- **Persona-switch usage:** ≥25% of users try a second persona

### Lagging indicators (90 days)
- **Week-2 retention:** ≥40%
- **Free → Pro conversion:** ≥5%
- **NPS:** ≥40
- **Virality coefficient (k):** ≥0.4 (driven by short-clip exports + shared notebooks)
- **COGS per video:** ≤$0.15 (verified, not estimated)

---

## 15. Go-to-Market

### Wedge sequence
1. **Wedge 1 — Developers (Weeks 0–8 post-launch)**
   - Hero: multi-modal code + slide extraction
   - Channels: Hacker News, Product Hunt, dev Twitter, r/programming
   - Hook: "Turned a 1-hour Fireship/Theo/Primeagen tutorial into the runnable code + the slide deck. Live demo →"
2. **Wedge 2 — Creators (Weeks 8–16)**
   - Hero: short-clip generator
   - Channels: TikTok ads, YouTube Shorts ads, creator newsletters
   - Hook: "One YouTube video → 5 social posts in 60 seconds. Watermarked clips on every free export = built-in viral loop."
3. **Wedge 3 — Students (Weeks 16+)**
   - Hero: Recall Pack (flashcards + quiz + glossary)
   - Channels: TikTok / IG ads timed to finals season; .edu email Pro discount
   - Hook: "I turned a 2-hour lecture into Anki flashcards in 90 seconds."

### Acquisition loops (built-in)
- **Watermarked clips on free tier** → every share is an ad
- **Public notebook share links** → SEO + social distribution (P1)
- **Browser extension hover preview** → top-of-funnel on every YouTube watch
- **Anki / Notion / Linear integrations** → presence in users' existing tools

---

## 16. Phased Roadmap

### Phase 1: MVP (Weeks 0–6)
**Goal:** ship the smallest thing that demonstrates the wedge.
- Web only (Next.js + Vercel + Supabase + R2 + Inngest + Modal)
- YouTube URL + file upload
- Gemini-driven Summary + Detailed views
- Mind Map (React Flow)
- Multi-modal extraction (Florence-2 → slides PPTX, code snippets)
- Audio Overview (Kokoro, 2-host preset only)
- Account + history
- Markdown / PDF export
- Free tier only (no payments yet — validate retention first)

### Phase 2: Notebook Architecture (Weeks 6–10)
- Notebook container, multi-source support
- Studio panel UI
- Cross-source chat with citations
- All 12 Studio artifacts shipping
- 6 templates
- Sharing via read-only link
- Stripe + Pro tier launch

### Phase 3: Mobile + Distribution (Weeks 10–14)
- Capacitor wrap → iOS + Android apps in stores
- Mobile share-sheet ingest
- Browser extension (Chrome first)
- Public launch on Hacker News + Product Hunt (Wedge 1: developers)
- Team tier launch

### Phase 4: P1 Features (Weeks 14–20)
- Knowledge graph
- Pre-watch screener
- Audio overview interactive mode
- Public SEO summary pages
- Wedge 2 launch (creators)

### Phase 5: P2 Foundations (Weeks 20+)
- Live meeting bot (Zoom/Meet/Teams)
- Public API
- Marketplace
- Enterprise compliance work

---

## 17. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| **Google adds video-frame intelligence to NotebookLM** | High over 12 months | Ship first; build creator + action moats they won't tune for; specialize on niches |
| **YouTube changes ToS / blocks third-party processing** | Medium | Use Gemini's native YouTube ingestion (Google's own pathway); fall back to user-supplied transcript downloads if needed |
| **OSS audio quality lags ElevenLabs noticeably** | Medium | Offer ElevenLabs as $2/mo add-on; most users won't notice or care |
| **Modal cold starts hurt UX** | Medium | Pre-warm workers during peak hours; show progress UI honestly; aim for P50 under 3 min |
| **Gemini cost spikes on heavy users** | Low–Medium | Hard rate-limit free tier; meter Pro fairly; consider caching repeat YouTube URLs across users |
| **Mobile UX via Capacitor feels off** | Low–Medium | Acceptable for v1; revisit Expo/React Native if retention shows mobile-specific drop-off |
| **Legal pushback on short-clip generation of copyrighted content** | Medium | Fair-use guardrails: 30-sec max, attribution, watermark on free, DMCA flow, no automated bulk export |

---

## 18. Open Questions

| # | Question | Owner | Resolve by |
|---|---|---|---|
| Q1 | Product name (current "Video Summary" is descriptive, not memorable) | Brand sprint | Before public launch |
| Q2 | Default Studio panel layout: side-by-side (NotebookLM-style) vs single-column flow | Design | End of Phase 1 |
| Q3 | Capacitor mobile UX acceptable, or invest in Expo/React Native for v1.5? | Engineering + Product | After Phase 3 user data |
| Q4 | Audio Overview: ship 5 formats at launch or just 2-host + solo, expand in P1? | Product | End of Phase 2 |
| Q5 | Pricing: should annual discount be 30% (NoteGPT) or 40% (Fireflies)? | Product | Before Stripe launch |
| Q6 | Free tier limit: 60 min/mo vs 5 notebooks/mo — which is the gating one? | Product + data | After 30 days of free-only Phase 1 |

---

## 19. Tech Reference (Appendix)

**Open-source repos to track / vendor:**
- TTS: [hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), [resemble-ai/chatterbox](https://github.com/resemble-ai/chatterbox), [myshell-ai/OpenVoice](https://github.com/myshell-ai/OpenVoice)
- Speech-to-text: [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper), [m-bain/whisperX](https://github.com/m-bain/whisperX), [pyannote/pyannote-audio](https://github.com/pyannote/pyannote-audio)
- OCR + vision: [microsoft/Florence-2](https://huggingface.co/microsoft/Florence-2-large), [PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR), [VikParuchuri/surya](https://github.com/VikParuchuri/surya), [lukas-blecher/LaTeX-OCR](https://github.com/lukas-blecher/LaTeX-OCR)
- Audio generation: [facebookresearch/audiocraft](https://github.com/facebookresearch/audiocraft) (MusicGen)
- Mind maps: [xyflow/xyflow](https://github.com/xyflow/xyflow), [markmap/markmap](https://github.com/markmap/markmap)
- Video processing: ffmpeg + Google AutoFlip patterns

**Hosted services:**
- LLM APIs: Google AI Studio (Gemini), Anthropic (Claude), OpenRouter (DeepSeek/Qwen), Groq (low-latency)
- GPU serverless: Modal, Replicate, fal.ai, Beam
- App: Vercel, Supabase, Cloudflare R2, Inngest

---

## 20. Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-25 | Adopt notebook + studio model from NotebookLM | Pattern is proven; adopt the mental model, beat them on video |
| 2026-04-25 | Default view = Summary, then Detailed | User explicitly chose this |
| 2026-04-25 | Web (Next.js) + Mobile (Capacitor wrap) | User specified Next.js; Capacitor is the cheapest mobile path |
| 2026-04-25 | Gemini 2.5 Flash as the only paid model in the hot path | Native video understanding aligns with "we just watch like a viewer" framing; no OSS competitor |
| 2026-04-25 | OSS-heavy stack (Kokoro, Florence-2, faster-whisper, DeepSeek) | "Simple and cheap" principle; cuts COGS 3–4× |
| 2026-04-25 | Pricing: Free / $9.99 Pro / $19 Team | Anchored on NoteGPT Pro; half NotebookLM Plus; undercuts meeting tools |
| 2026-04-25 | Wedge: Developers first, Creators second, Students third | Multi-modal extraction is the most defensible win + HN/PH crowd amplifies |
| 2026-04-25 | Content rights: "we watch like a viewer" — Gemini native YouTube ingestion | Cleanest legal posture; Google itself runs the playback path |
| 2026-04-25 | All previous P1 features promoted to P0 | User direction; the moat *is* the differentiators |

---

*End of PRD v1.0. Iterate this document as the product evolves.*
