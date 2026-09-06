# NeedReel — Plan & PRD

## 0. What changed from the original pitch

Two deliberate breaks from the first draft:

1. **No more direct tagging.** The original mechanic ("tag someone specific who has that item") creates a 1-to-1 link between a stranger and a possibly vulnerable person — that's a safety/privacy hole, not a feature. Replaced with an **open Pledge Pool**: needs sit in a shared pool, anyone can pledge a piece of it, and confirmation happens through the steward — not through a direct DM/tag to the person in need.
2. **Case Pages for people who can't represent themselves online.** A person living on the street, an elderly person with no phone, someone without literacy or connectivity — none of them can "make an account." So a community member (a **Steward**) opens a public page *for* that person. It isn't a one-off post; it's a running case file — every need, every update, every fulfillment gets logged to that same page over time. Stewardship can be shared across multiple people (co-stewards), and it is never a channel for money — only in-kind items, time, or help.

This is the spine of the product now: **Reel (discovery) → Case Page (continuity + trust) → Pledge Pool (fulfillment without tagging) → Confirmation (steward/anchor-verified) → Badge (recognition, not payment).**

---

## 1. Core Entities

| Entity | What it is |
|---|---|
| **Need Card / Reel** | A short video or photo + short auto-tagged description of one specific need. Belongs to either an individual self-posting, or a Case Page. |
| **Case Page** | A persistent public profile representing one beneficiary who can't self-represent. Alias name (not necessarily real name), broad area (not exact address), a timeline of every need/update/fulfillment tied to this person, and a list of Stewards. No payment fields, ever. |
| **Steward** | The community member(s) who create and maintain a Case Page. A page can have 1 or more co-stewards. Stewards post updates, confirm handoffs, and are accountable for the page's accuracy. |
| **Giver** | Any user who pledges to fulfill (all or part of) a need. On confirmed handoff, earns badge/rank credit. |
| **Pledge** | A giver's commitment to a specific need, sitting in an open pool — not a personal assignment. First-confirmed pledge is fulfilled; others in the pool can redirect to still-open needs. |
| **Anchor Point** *(should-have)* | A pre-vetted local drop point (a shop, community hub, place of worship) where a giver can leave an item without ever meeting the beneficiary directly, and the steward collects from there. |
| **Badge / Rank** | A profile-level, non-monetary recognition earned only after a confirmed (not self-reported) handoff. |

---

## 2. Core Flow

```
DISCOVER        a hyperlocal reel feed shows real, specific needs
   ↓
UNDERSTAND      opening a Case Page shows the person's history — not a one-off ask,
                a running record, which builds trust progressively
   ↓
PLEDGE          giver pledges a piece of the need into the open pool
                (no tag, no direct link to the beneficiary)
   ↓
HANDOFF         via anchor point drop, or steward-coordinated handoff
   ↓
CONFIRM         steward (and/or anchor point) confirms the handoff actually happened
   ↓
RECOGNIZE       giver's profile gets a badge/rank point — provably earned, not claimed
   ↓
UPDATE          Case Page timeline updates: need closed, or partially fulfilled
   ↓
AMPLIFY         reel can be shared/re-shared regardless of whether the viewer can give
```

---

## 3. Feature Scope (MVP Rule)

### Must Have (weekend-buildable, proves the concept)
- Reel/photo upload for a need (video or photo + short caption).
- **Google AI auto-tagging**: watches/reads the upload and generates category, item type, and urgency — steward can edit before publishing.
- Feed view, filterable by category and a manually-tagged local area (no real geolocation infra needed for MVP).
- **Case Page creation**: alias, broad area, intro media, and an append-only timeline of needs/updates.
- **Open Pledge Pool** on each need card: any user can pledge; no personal tagging.
- **Steward confirmation flow**: steward marks a pledge as fulfilled once handoff actually happens.
- **Badge/point system**: simple counter on a giver's profile, incremented only by steward-confirmed fulfillments.
- Share button on every reel (counts as a distinct, first-class action — not just a side effect).

### Should Have (if time permits)
- **Anchor Point selection** during pledging, as an alternative to direct handoff.
- **Co-steward invite** flow (one steward invites another; both show on the page).
- **ElevenLabs narration**: steward speaks an update instead of typing it (for beneficiaries/stewards who can't easily type), auto-narrated back for accessibility.
- **Snowflake dashboard**: which categories/areas have the most unfulfilled needs, which Case Pages haven't been updated recently (steward-health signal).
- **Solana confirmation ledger**: writing the steward-confirmed handoff event on-chain, so badge counts are checkable against an immutable record, not just a database row.

### Avoid (explicitly out of scope)
- Any monetary donation or payment flow — the concept is in-kind only, by design, permanently, not just for the MVP.
- Real KYC/identity verification of stewards or beneficiaries (flag as a known limitation — see problems.md).
- Fully automated, production-grade video moderation ML.
- Real-time push infrastructure — simulate "nearby" with manually tagged areas.
- Full production Solana wallet infra — a minimal on-chain write is a stretch goal, not a dependency for the demo to work.

---

## 4. Tech Mapping — where each tool actually does work

| Tool | Role | Why it's not decorative |
|---|---|---|
| **Google AI** | (1) Auto-tags category/urgency/item-type from the uploaded reel/photo so posting is fast — steward films, doesn't type a form. (2) Multimodal content screening — a lightweight stand-in for manual vetting, since there's no NGO gatekeeper approving every post. (3) Dedup check on new Case Page creation (does this beneficiary already have a page?). | Removes the two jobs a human moderator/intake-form would otherwise do: tagging and first-pass scam screening. |
| **Solana** | Writes the **confirmed handoff event** (giver, need, steward-confirmation, timestamp) immutably, underneath the badge system. | Since there's no money changing hands and no NGO vouching for anyone, this is the actual trust mechanism: badges are provably tied to a confirmed event, not self-reported. |
| **ElevenLabs** | Converts steward-spoken updates into text/narrated cards, and narrates Case Page timelines aloud in multiple languages. | Lets a steward without typing fluency (or a beneficiary dictating through them) post updates by voice, and widens who can consume the feed (low literacy, non-native script). |
| **Snowflake** | Aggregates: which need-categories go unfulfilled longest per area, which Case Pages are going stale (no update in N days = steward-health risk). | Turns the app from "a feed" into something that can proactively surface neglect — directly useful for the demo's "and here's what the data shows" moment. |

---

## 5. Data Model (sketch)

```
User
 - id, display_name, badges[], rank_points, created_at

CasePage
 - id, alias, broad_area, intro_media_url, stewards[] (User ids), status (active/inactive), created_at

NeedCard
 - id, media_url, ai_tags {category, item_type, urgency}, caption
 - owner_type (self | case_page), owner_id (User or CasePage)
 - status (open | partially_fulfilled | fulfilled)
 - created_at

Pledge
 - id, need_card_id, giver_id, quantity/portion, status (pledged | handed_off | confirmed | cancelled)
 - anchor_point_id (nullable)
 - created_at, confirmed_at

AnchorPoint
 - id, name, area, vetted_by, active

ConfirmationRecord   (this is the row that maps to a Solana write when built)
 - id, pledge_id, confirmed_by (steward_id), timestamp, on_chain_ref (nullable)
```

---

## 6. Success Metrics for the Demo

- A need is posted (filmed live) → auto-tagged by Google AI → appears in the pool within seconds.
- A pledge is made, handed off (simulated), and confirmed by the steward → giver's badge count updates live.
- A Case Page is shown with a multi-entry timeline (seed 2–3 fake-but-realistic historical entries before the demo so it doesn't look brand-new).
- One need is shared, and the share is logged as its own counted action.
- (Stretch) The confirmation event is visible as an on-chain record, shown briefly to judges.

---

## 7. Weekend Build Order (rough)

**Day 1**
- Data model + basic feed/upload flow.
- Google AI auto-tagging integration on upload.
- Case Page creation + timeline view.
- Pledge Pool UI on need cards (no tagging).

**Day 2**
- Steward confirmation flow → badge increment.
- Share action logging.
- Seed realistic demo data (Case Pages with history, a few open needs across categories).
- Should-have stretch, in priority order: Anchor Point selection → Snowflake stale-need dashboard → ElevenLabs narration → Solana confirmation write.
- Rehearse the demo script end to end at least twice.

---

## 8. Known Open Risks

This plan has real holes — see **problems.md** for the full list and how to neutralize each one before or during the build. The short version: the biggest risks are (1) beneficiary safety/consent/privacy, (2) steward accountability and abandonment, and (3) badge-gaming through collusion. All three are addressed in the companion file with concrete mitigations, not just flagged and left open.
