# NeedFeed

Hyperlocal in-kind giving. Post a need, anyone can pledge a piece of it into an open pool,
a steward confirms the handoff, and the giver earns a verifiable badge — no money, no tagging
of vulnerable people.

Product thinking lives in `plan.md` and `problems.md` (at repo root, `..`).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

The app works with zero API keys. Local auto-tagging stands in for Google AI and the
Snowflake dashboard falls back to computing the same metrics locally.

## Demo script (2–3 min)

1. **Reel** (`/`) — filter by category/area, open a need.
2. **Case Page** (`/cases/c-arjun`) — multi-entry timeline, recorded-consent badge, steward tools.
3. **Pledge** — on a need card, pledge a portion → “Mark handed off”.
4. **Confirm** — on the Case Page, steward tools → “Confirm received” → giver badge increments (see `/` toolbar is per-user; badge lives in `store.json`).
5. **Snowflake HQ** (`/dashboard`) — categories/areas/urgency, stale pages (steward health), top givers, 7-day handoffs.

## Integration points (fill keys in `.env`, copy from `.env.example`)

| Integration | Env vars | Where it plugs in |
|---|---|---|
| **Snowflake** | `SNOWFLAKE_*` | `lib/snowflake.ts` — sync (`POST /api/sync`), dashboard reads mint `metricsFromSnowflake()` with a local fallback. Full hostname `<account>.<region>.snowflakecomputing.com` required. |
| **Google AI** | `GOOGLE_AI_API_KEY`, `GOOGLE_AI_MODEL` | `lib/auto-tag.ts` — replace the local keyword tagger with a real Gemini call (upload form still shows the result as editable tags). |
| **ElevenLabs** | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | Add a steward voice-update → transcript input and TTS narration for timeline entries. |
| **Solana** | `SOLANA_RPC_URL`, `SOLANA_PROGRAM_ID`, `SOLANA_PRIVATE_KEY` | `lib/store.ts confirmPledge()` already creates a `ConfirmationRecord` with `on_chain_ref` — write that event on-chain and store the signature. |

## Structure

```
lib/               types, categories, store (JSON-file DB), seed, auto-tag, snowflake, utils
app/               App Router pages + API routes (adapted for API)
components/        feed, need-card, pledge pool, steward tools, upload/case forms, dashboard
data/store.json    generated on first run (gitignored) — delete it to reseed
```
