# Video Summary — Team Skills

These are the 8 project-specific skills (your "team") for building Video Summary. Each one is a focused specialist you can call by name.

## Roster

| Skill file | Name | Role | Model |
|---|---|---|---|
| `video-summary-pm/` | **Maya** | Project Manager | Opus (planning) |
| `notebook-data-model/` | **Cora** | Data Architect | Sonnet (delivery) |
| `gemini-video-pipeline/` | **Rex** | Video Pipeline Engineer | Sonnet (delivery) |
| `oss-worker-deploy/` | **Hugo** | DevOps / Infra | Sonnet (delivery) |
| `inngest-pipeline-orchestrator/` | **Otto** | Backend Orchestration | Sonnet (delivery) |
| `studio-artifact-builder/` | **Iris** | Studio Artifact Engineer | Sonnet (delivery) |
| `cogs-monitor/` | **Penny** | Cost / Finance Analyst | Opus (planning) |
| `launch-checklist/` | **Felix** | Release Manager | Opus (planning) |

**Convention:** planning skills (analysis, judgment, synthesis) run on Opus. Delivery skills (execution, code, deployment) run on Sonnet. The `model:` field in each SKILL.md frontmatter sets this.

## How to call them

Just use the name in chat:

- *"Maya, give me a status update"* → invokes `video-summary-pm`
- *"Cora, add a `language` column to sources"* → invokes `notebook-data-model`
- *"Rex, the transcript is bad on long videos"* → invokes `gemini-video-pipeline`
- *"Hugo, deploy Kokoro to Modal"* → invokes `oss-worker-deploy`
- *"Otto, retry policy for the audio overview is wrong"* → invokes `inngest-pipeline-orchestrator`
- *"Iris, add a Persona switcher option for 'Marketer'"* → invokes `studio-artifact-builder`
- *"Penny, what's our COGS this week?"* → invokes `cogs-monitor`
- *"Felix, are we ready to ship Phase 2?"* → invokes `launch-checklist`

## Recurring schedules (recommended)

Pair these with the `schedule` skill:

| Who | When | Purpose |
|---|---|---|
| Maya | Monday 9am | Weekly status update |
| Penny | Friday 4pm | Weekly cost review |
| Felix | Before each Phase deploy | Launch readiness |

## How they work together

```
                       ┌──────────┐
                       │   Maya   │  ← orchestrates, reports
                       │  (PM)    │
                       └─────┬────┘
            ┌────────────────┼────────────────┐
            │                │                │
       ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
       │   Cora  │      │  Felix  │     │  Penny  │
       │ (data)  │      │(release)│     │ (cost)  │
       └────┬────┘      └─────────┘     └─────────┘
            │
   ┌────────┼────────┬────────┬────────┐
   │        │        │        │        │
┌──▼──┐ ┌──▼──┐ ┌───▼───┐ ┌──▼──┐ ┌───▼───┐
│ Rex │ │Hugo │ │ Otto  │ │Iris │ │       │
│Gemini│ │Modal│ │Inngest│ │Studio│
└─────┘ └─────┘ └───────┘ └─────┘
```

- **Rex** owns the Gemini call (the input to everything)
- **Hugo** runs the OSS workers (the muscle)
- **Otto** wires it all together (the conductor)
- **Iris** builds the artifacts users see (the output)
- **Cora** holds the schema underneath (the foundation)
- **Penny** counts what it costs (the accountant)
- **Felix** decides if it ships (the gatekeeper)
- **Maya** tells you the truth about it all (the PM)

## Reference docs

- **Master plan:** [`../../Video-Summary-PRD.md`](../../Video-Summary-PRD.md)
- **Built-in skills you'll use alongside these:** `nextjs-react-typescript`, `nextjs-supabase-auth`, `capacitor-best-practices`, `claude-api`, `stripe-integration`, `verification-before-completion`, `engineering:code-review`, `engineering:debug`, `engineering:deploy-checklist`, `product-management:*`

## Iterating on the team

- To **add a new specialist**, create a new folder under `.claude/skills/<name>/SKILL.md` with the same shape (frontmatter + instructions).
- To **rename someone**, change the `name:` field in their SKILL.md and update this README.
- To **change a model assignment**, edit the `model:` field in the SKILL.md frontmatter.
- To **retire a skill**, delete the folder.
