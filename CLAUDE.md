# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js)
npm run build    # Production build
npm run lint     # ESLint check
```

There are no automated tests in this project.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase anon key (public)
SUPABASE_SERVICE_ROLE_KEY       # Supabase service role (server-only)
OPENROUTER_API_KEY              # OpenRouter API key (server-only)
```

## Architecture Overview

GoCheck is an AI-powered compliance auditor for DLSU Manila student organizations submitting pre-activity documents to CSO. Users upload documents (PDFs), the app extracts content client-side, runs specialized AI agents per document type, and reports compliance issues with severity ratings.

### Key Data Flow

1. **Upload** (`/app/upload/`) — User selects up to 13 files and assigns each a document type
2. **Extraction** — PDFs rendered client-side: AFORM → images (via pdfjs-dist canvas), all others → text
3. **Job creation** — Extracted content posted to `/api/jobs` → stored in Supabase `jobs` table
4. **Processing** (`/app/check/[jobId]/`) — Browser runs all agents in parallel via `/api/ai` (streaming SSE); Supabase job record updated fire-and-forget
5. **Results** (`/app/results/[jobId]/`) — Aggregated issues displayed by doc type + cross-document coherence findings

**Critical:** Document processing happens entirely client-side in `check/[jobId]/page.tsx` via `runAllAgents()`. The `/api/jobs/[jobId]/process` server route is deprecated.

### AI / LLM Layer

- All AI calls go through the `/api/ai` proxy route (Edge runtime) which adds the OpenRouter auth header and streams SSE back to the browser
- **AFORM** uses `qwen/qwen2.5-vl-72b-instruct` (vision model — PDF pages as base64 images)
- **All other doc types** use `deepseek/deepseek-chat` (text model)
- The proxy enforces an allowlist of exactly these two model IDs

### Skill Agents (`lib/agents/`)

Each agent validates one document type. All agents share the same contract:

```typescript
// Input
{ docType, text?, pages?, onToken?: (token: string) => void }

// Output — must match ISSUE_SCHEMA in lib/agents/types.ts
{
  status: "ok" | "has_issues",
  summary: string,
  issues: Array<{ field, problem, suggestion, severity: "major" | "minor" }>
}
```

- `aform.ts` — AFORM checker (vision)
- `ppr.ts` — PPR checker (text)
- `other-docs.ts` — 11 remaining document type checkers (text)
- `coherence.ts` — Cross-document consistency checker (runs if 2+ docs uploaded)
- `orchestrator.ts` — Coordinates parallel agent execution; called from the check page

### Supabase Schema

The `jobs` table is the sole table:

```
id (UUID) | status | created_at | updated_at
files (JSONB)    -- Array of { docType, fileName, pages?, text? }
results (JSONB)  -- { [docType]: { status, issues, summary } }
progress (JSONB) -- Array of { docType, status, message, timestamp }
error (text)
```

Status progression: `pending → uploading → processing → completed | failed`

### Styling

Tailwind CSS with custom Material Design 3 tokens (primary, tertiary, error, surface variants). Fonts: **Manrope** for headlines, **Inter** for body. Icons: Material Symbols Outlined.

### Vercel Deployment

- `POST /api/jobs` — 60s max duration
- `POST /api/jobs/[jobId]/process` — 300s max duration (deprecated but still configured)
- `/api/ai` runs on the Edge runtime for low-latency streaming

### Document Types

13 supported types: `AFORM`, `PPR`, `LETTER_OF_INVITATION`, `CREDENTIALS`, `VENUE_RESERVATION`, `MEETING_AGENDA`, `RECRUITMENT_MECHANICS`, `LIST_OF_QUESTIONS`, `ELECTION_MECHANICS`, `GENERAL_CONTEST_MECHANICS`, `ACADEMIC_CONTEST_MECHANICS`, `SAMPLE_PUB`, `PRE_REGISTRATION_FORM`
