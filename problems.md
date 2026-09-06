# NeedReel — Problems & Mitigations

Each entry: the problem, why it's real (not hypothetical), and a concrete way to neutralize it — either a design change, a process change, or an honest scope limitation.

---

### 1. Beneficiary safety, consent, and privacy
**Problem:** A Case Page exists *for* someone who, by definition, can't fully control their own online representation — a homeless individual, an elderly person, someone without literacy. Posting their face, situation, and location publicly without genuinely informed consent is exploitative, even with good intentions. Exact location data also creates a stalking/safety risk.
**Mitigation:**
- Require a recorded verbal consent clip (or a guardian/advocate's consent for anyone unable to give it clearly) as a mandatory step before a Case Page can be published — not just a checkbox the steward ticks.
- Use **alias names**, not legal names, and **broad area tags** (a neighborhood, not a street/GPS pin) on anything public-facing.
- Give the beneficiary (or their steward acting for them) a one-tap takedown/freeze request that works immediately, no review delay.
- Default to blurring faces optionally in public feed thumbnails, full media visible only after a viewer engages (opens the Case Page), reducing casual scraping.

---

### 2. Steward accountability and misrepresentation
**Problem:** A steward could exaggerate a need, misrepresent a situation for attention, or — worse — claim items given "for the case" and keep them personally.
**Mitigation:**
- Require **at least two co-stewards** before a Case Page can go public (not a solo-run page) once it exists past a short grace period — one person alone speaking for another is the exact risk you're flagging.
- Every confirmation of a fulfilled need is logged with *who* confirmed it, timestamped, ideally on the immutable Solana record — so a pattern of one steward always confirming their own pledges is detectable and auditable later, even without real-time enforcement.
- Community reporting/flagging on any Case Page, with a quick-freeze (not instant delete) so disputes can be reviewed rather than needs vanishing.

---

### 3. Steward abandonment
**Problem:** A steward opens a page, posts once, then disappears — the person they represent is left with a stale, unmaintained page that looks active but isn't.
**Mitigation:**
- Snowflake-driven staleness detection: flag any Case Page with no update in N days as "needs a steward check-in," surfaced to co-stewards or the community.
- Allow a **stewardship transfer request**: another verified community member can request to take over an inactive page after a defined inactivity window, with the original steward notified and able to object within a window before transfer completes.
- This is explicitly a **should-have**, not required for the hackathon MVP demo — but the plan.md build order should leave the data model open to it (stewards[] as a list, not a single field) so it isn't a rewrite later.

---

### 4. Badge gaming / collusion
**Problem:** A giver and a steward (or a giver and themselves via a second account) could fake a pledge-and-confirm cycle purely to inflate badge rank, since there's no money involved to create a real cost to lying.
**Mitigation:**
- Require **two-party confirmation**: both the giver marks "handed off" and the steward marks "received," not steward-only. A mismatch (steward confirms something the giver never marked) is flagged.
- Rate-limit how many confirmed pledges a single giver–steward pair can log in a short window — a real generosity relationship rarely produces 10 confirmed handoffs in an hour.
- Treat badges as a nice-to-have signal, not a hard currency — this only matters if the product later tries to gate anything valuable behind badge rank, which it currently doesn't (this is a design constraint to keep, not just a mitigation).

---

### 5. Consent and safety at the point of physical handoff
**Problem:** Connecting a stranger (giver) directly to a vulnerable person (beneficiary) for handoff, even without "tagging," still has a residual real-world safety question if the steward isn't present.
**Mitigation:**
- Prefer **Anchor Points** (a known local shop, community hub, place of worship) as the default handoff mechanism over direct meetups — the giver drops the item at a place that already exists and is trusted in the neighborhood, and the steward collects it separately.
- If a direct meetup does happen, it should be steward-coordinated and, ideally, steward-present — this should be a stated norm in the product's guidance text, not left to assumption.

---

### 6. Duplicate or competing Case Pages
**Problem:** Two different community members could independently create a Case Page for the same person, splitting their history and confusing givers about which page is "real."
**Mitigation:**
- Google AI visual-similarity + area-match check at Case Page creation time: if a plausible match exists, prompt "this looks similar to an existing page — request to become a co-steward instead?" rather than silently allowing a duplicate.
- This won't be perfect for a hackathon MVP (it's a stretch check, not a guarantee) — state that limitation openly rather than claiming duplicate-proof matching.

---

### 7. Anchor Point reliability
**Problem:** An anchor point (a shop, a community hub) is being trusted to hold items safely until the steward collects them — but it's not vetted the way an NGO drop-off center would be.
**Mitigation:**
- For the hackathon/MVP, use a **small, manually curated set** of anchor points (people you or the steward personally know and trust), not open self-registration.
- Track anchor point handoff success/failure over time (Snowflake) as a longer-term trust signal, before ever opening anchor point registration to the public.

---

### 8. Item quality or appropriateness mismatch
**Problem:** A pledged item might not actually be usable or appropriate (e.g. someone pledges a torn jacket for a "needs winter clothing" post).
**Mitigation:**
- Steward reviews a photo of the actual item before confirming the pledge as fulfilled, not just confirming blindly. This is a manual review step, cheap to add, and avoids overengineering an "item quality classifier" that isn't worth building for a hackathon.

---

### 9. Fake or exploitative pages, and minors
**Problem:** Someone could create a Case Page as a scam, or represent a minor without proper guardian consent, which raises real legal/safety concerns.
**Mitigation:**
- Hard rule, not a toggle: **no Case Page for a minor without an identifiable guardian as a listed co-steward.**
- Clear, visible reporting/flagging on every page, with a fast freeze (not deletion) path pending review — the same mechanism as #2, reused here.
- State plainly in the product's terms that this is a community-trust system with real limitations, not a fully verified institution — honesty about that boundary is part of the product's credibility, not a weakness to hide.

---

### 10. Google AI misclassification
**Problem:** Auto-tagging a reel's category/urgency could get it wrong (e.g. tags a "needs medical supplies" post as "clothing").
**Mitigation:**
- Auto-tags are always **editable by the steward before publishing** — AI proposes, human confirms. Never auto-publish without a review step.

---

### 11. Solana integration risk within hackathon time
**Problem:** A real on-chain write (wallet setup, devnet config, transaction signing) is a nontrivial engineering lift, and if attempted last, it can eat the time needed to make the core loop solid.
**Mitigation:**
- Build the **ConfirmationRecord** as a normal database row first — the whole product works end-to-end without the chain.
- Add the Solana write as a **stretch goal layered on top** of an already-working confirmation flow, so if it's cut for time, the demo still works, just without the on-chain proof shown live.

---

### 12. ElevenLabs cost/latency at scale
**Problem:** Auto-narrating every single reel/update in multiple languages in real time isn't necessary to prove the concept and could slow the demo down.
**Mitigation:**
- Pre-generate narration only for the 2–3 cards actually used in the demo walkthrough, rather than building a live full-pipeline for every post.

---

### 13. Feed/page spam or low-effort fake needs
**Problem:** Without any institutional gatekeeper, someone could post fake or low-effort needs to farm attention or shares.
**Mitigation:**
- Rate-limit how many Case Pages / need cards a single account can create in a given window.
- Community flagging (same mechanism as #2/#9) with a quick-freeze, reviewed rather than instantly deleted — mistakes and disputes should be reversible.

---

### 14. Data access and visibility boundaries
**Problem:** Full case detail (exact situation, more identifying media) shouldn't be equally visible to a casual scroller and to someone who has actually engaged (pledged, or is a steward).
**Mitigation:**
- Public feed shows an abstracted, alias-based view; full Case Page detail (fuller media, more specific context) is shown only once a viewer takes an action (opens the page, pledges) — a small but real friction that limits casual over-exposure of the beneficiary's situation.

---

## How to use this list during the hackathon

Not everything here needs to be *built* this weekend — several are process/policy mitigations (consent capture, co-steward requirement, rate limits) that cost almost nothing to state and design for, even if the enforcement isn't fully automated yet. Build the ones that are cheap and structural (co-stewards as a list not a single field, two-party confirmation, editable AI tags, abstracted public feed) into the MVP from the start, since retrofitting them later is expensive. Treat the rest (stewardship transfer, anchor point vetting infra, duplicate detection) as documented known limitations you can speak to honestly if a judge asks "what about X" — that's a stronger answer than pretending the MVP has already solved them.
