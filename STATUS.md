# NeedReel — Status Summary

Date: Sept 6, 2026

## Done (fully built & verified)

- `tsc --noEmit`, `eslint`, `next build` — all pass.
- Every API flow tested live (`pledge → handoff → confirm → badge`, plus authorization guards).

### Core loop
- **Reel feed** (`/`) — filterable by category + area, need cards with an open pledge pool, no tagging.
- **Case Pages** (`/cases/:id`) — append-only timeline, stewards, recorded-consent badge, needs list.
- **Upload** (`/upload`) — local auto-tagging proposes category / item type / urgency, editable before publish.
- **Pledge → Handoff → Confirm → Badge**:
  - Two-party rule enforced — confirm before handoff is blocked (409).
  - Non-steward confirm is blocked (403).
  - Giver badge/rank increments on steward-confirmed handoff.
- **Share logging** — counted as a first-class action on every card.
- **Snowflake HQ** (`/dashboard`) — categories / areas / urgency, stale case pages (steward health),
  top givers, 7-day handoffs. Sync via `POST /api/sync`. Auto-falls back to local computation
  if Snowflake is unreachable, so the demo never breaks.
- **Seed data** — 3 Case Pages with realistic history, 10 needs, anchor points, confirmations.
  Local state lives in `data/store.json` (gitignored); delete it to reseed.

## Remaining

1. **Live Snowflake connection** — blocked on the full account hostname
   (`<account>.<region>.snowflakecomputing.com`). The bare account id `yOPMPYNQ-BM61774`
   404s on `https://yOPMPYNQ-BM61774.snowflakecomputing.com/login-request`.
   Everything else already degrades gracefully when unreachable.
2. **Real API keys** — integration points documented in `.env`, `.env.example`, and README:
   - Google AI → replace the keyword tagger in `lib/auto-tag.ts` with a real Gemini call.
   - ElevenLabs → steward voice update → transcript and timeline TTS narration.
   - Solana → write `ConfirmationRecord.on_chain_ref` on-chain inside
     `lib/store.ts confirmPledge()`.
3. **Optional polish** — co-steward invite flow, richer anchor-point selection UI, freeze/report flows.

## Security follow-ups

- **Rotate the Snowflake password** — it was shared in plaintext during setup.
- `.env*` and `data/` are gitignored — nothing leaks if the project is later committed.