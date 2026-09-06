import fs from "node:fs";
import path from "node:path";
import { buildSeed } from "./seed";
import type {
  AITags,
  AnchorPointId,
  CasePage,
  CasePageId,
  ConfirmationRecord,
  NeedCard,
  NeedCardId,
  Pledge,
  PledgeId,
  StoreData,
  TimelineEntry,
  User,
  UserId,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

let cachePromise: Promise<StoreData> | null = null;
let writeQueue: Promise<unknown> = Promise.resolve();

async function load(): Promise<StoreData> {
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    try {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw) as StoreData;
    } catch {
      const seed = buildSeed();
      await persist(seed);
      return seed;
    }
  })();
  return cachePromise;
}

function persist(data: StoreData): Promise<void> {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  return Promise.resolve();
}

function mutate<T>(fn: (data: StoreData) => T): Promise<T> {
  const op = writeQueue.then(async () => {
    const data = await load();
    const result = fn(data);
    await persist(data);
    return result;
  });
  writeQueue = op.catch(() => undefined);
  return op;
}

export const cuid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;

// ---------- reads ----------

export async function getStore(): Promise<StoreData> {
  return load();
}

export async function getUser(id: UserId): Promise<User | undefined> {
  const d = await load();
  return d.users.find((u) => u.id === id);
}

export async function getCasePage(id: CasePageId): Promise<CasePage | undefined> {
  const d = await load();
  return d.case_pages.find((c) => c.id === id);
}

export async function getTimeline(caseId: CasePageId): Promise<TimelineEntry[]> {
  const d = await load();
  return d.timeline
    .filter((t) => t.case_page_id === caseId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function getNeeds(): Promise<NeedCard[]> {
  const d = await load();
  return [...d.needs].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getNeed(id: NeedCardId): Promise<NeedCard | undefined> {
  const d = await load();
  return d.needs.find((n) => n.id === id);
}

export async function getPledgesForNeed(needId: NeedCardId): Promise<Pledge[]> {
  const d = await load();
  return d.pledges.filter((p) => p.need_card_id === needId);
}

export async function getPledge(id: PledgeId): Promise<Pledge | undefined> {
  const d = await load();
  return d.pledges.find((p) => p.id === id);
}

export async function getAnchorPoints() {
  const d = await load();
  return d.anchor_points;
}

export async function getConfirmations() {
  const d = await load();
  return d.confirmations;
}

export async function getShares() {
  const d = await load();
  return d.shares;
}

// ---------- mutations ----------

export async function createCase(data: {
  alias: string;
  broad_area: string;
  intro_text: string;
  steward_id: UserId;
  consent_clip: boolean;
}): Promise<CasePage> {
  const id = `c-${cuid()}`;
  const now = new Date().toISOString();
  const page: CasePage = {
    id,
    alias: data.alias,
    broad_area: data.broad_area,
    intro_media: id,
    intro_text: data.intro_text,
    stewards: [data.steward_id],
    status: "active",
    consent_clip: data.consent_clip,
    blur_public: true,
    created_at: now,
    last_update_at: now,
  };
  await mutate((d) => {
    d.case_pages.push(page);
    d.timeline.push({
      id: `t-${cuid()}`,
      case_page_id: id,
      kind: "intro",
      text: "Page opened for this beneficiary.",
      author_id: data.steward_id,
      created_at: now,
    });
  });
  return page;
}

export async function addCaseUpdate(params: {
  case_page_id: CasePageId;
  author_id: UserId;
  text: string;
}): Promise<TimelineEntry> {
  const entry: TimelineEntry = {
    id: `t-${cuid()}`,
    case_page_id: params.case_page_id,
    kind: "update",
    text: params.text,
    author_id: params.author_id,
    created_at: new Date().toISOString(),
  };
  await mutate((d) => {
    d.timeline.push(entry);
    const c = d.case_pages.find((x) => x.id === params.case_page_id);
    if (c) c.last_update_at = entry.created_at;
  });
  return entry;
}

export async function addSteward(params: {
  case_page_id: CasePageId;
  steward_id: UserId;
}): Promise<void> {
  await mutate((d) => {
    const c = d.case_pages.find((x) => x.id === params.case_page_id);
    if (c && !c.stewards.includes(params.steward_id)) {
      c.stewards.push(params.steward_id);
    }
  });
}

export async function createNeed(params: {
  caption: string;
  ai_tags: AITags;
  quantity: string;
  area: string;
  owner_type: "self" | "case_page";
  owner_id: UserId | CasePageId;
}): Promise<NeedCard> {
  const need: NeedCard = {
    id: `n-${cuid()}`,
    media_key: `n-${cuid()}`,
    ai_tags: params.ai_tags,
    caption: params.caption,
    owner_type: params.owner_type,
    owner_id: params.owner_id,
    area: params.area,
    status: "open",
    quantity: params.quantity,
    created_at: new Date().toISOString(),
  };
  await mutate((d) => {
    d.needs.push(need);
    if (params.owner_type === "case_page") {
      const c = d.case_pages.find((x) => x.id === params.owner_id);
      if (c) c.last_update_at = need.created_at;
      d.timeline.push({
        id: `t-${cuid()}`,
        case_page_id: params.owner_id as CasePageId,
        kind: "need",
        text: `New need posted: ${need.caption}`,
        author_id: params.owner_id as UserId,
        need_card_id: need.id,
        created_at: need.created_at,
      });
    }
  });
  return need;
}

export async function createPledge(params: {
  need_card_id: NeedCardId;
  giver_id: UserId;
  portion: string;
  anchor_point_id: AnchorPointId | null;
}): Promise<Pledge> {
  const pledge: Pledge = {
    id: `pl-${cuid()}`,
    need_card_id: params.need_card_id,
    giver_id: params.giver_id,
    portion: params.portion,
    status: "pledged",
    anchor_point_id: params.anchor_point_id,
    created_at: new Date().toISOString(),
    handed_off_at: null,
    confirmed_at: null,
  };
  await mutate((d) => {
    d.pledges.push(pledge);
    const need = d.needs.find((n) => n.id === params.need_card_id);
    if (need && need.status === "open") need.status = "partially_fulfilled";
  });
  return pledge;
}

export async function markHandedOff(pledgeId: PledgeId): Promise<Pledge | undefined> {
  const now = new Date().toISOString();
  let out: Pledge | undefined;
  await mutate((d) => {
    const p = d.pledges.find((x) => x.id === pledgeId);
    if (p && p.status === "pledged") {
      p.status = "handed_off";
      p.handed_off_at = now;
      out = p;
    }
  });
  return out;
}

export async function confirmPledge(params: {
  pledge_id: PledgeId;
  steward_id: UserId;
}): Promise<{ pledge: Pledge; record: ConfirmationRecord } | undefined> {
  const now = new Date().toISOString();
  let out: { pledge: Pledge; record: ConfirmationRecord } | undefined;
  await mutate((d) => {
    const p = d.pledges.find((x) => x.id === params.pledge_id);
    if (!p || p.status !== "handed_off") return;

    p.status = "confirmed";
    p.confirmed_at = now;

    const record: ConfirmationRecord = {
      id: `cn-${cuid()}`,
      pledge_id: p.id,
      need_card_id: p.need_card_id,
      giver_id: p.giver_id,
      steward_id: params.steward_id,
      confirmed_at: now,
      on_chain_ref: null,
      mismatch_flag: false,
    };
    d.confirmations.push(record);

    const giver = d.users.find((u) => u.id === p.giver_id);
    if (giver) {
      giver.badge += 1;
      giver.rank_points += 1;
    }

    // Collusion guard (problems.md #4): flag when the same steward-giver pair
    // confirms many times within an hour.
    const HOUR_MS = 3600000;
    const recentSamePair = d.confirmations.filter(
      (r) =>
        r.steward_id === params.steward_id &&
        r.giver_id === p.giver_id &&
        Date.now() - new Date(r.confirmed_at).getTime() < HOUR_MS
    ).length;
    record.mismatch_flag = recentSamePair >= 5;

    const need = d.needs.find((n) => n.id === p.need_card_id);
    if (need) {
      const confirmed = d.pledges.filter(
        (x) => x.need_card_id === need.id && x.status === "confirmed"
      ).length;
      if (confirmed >= 1) need.status = "fulfilled";
    }

    if (need && need.owner_type === "case_page") {
      const page = d.case_pages.find((c) => c.id === need.owner_id);
      if (page) {
        page.last_update_at = now;
        d.timeline.push({
          id: `t-${cuid()}`,
          case_page_id: page.id,
          kind: "fulfillment",
          text: `Confirmed: a pledge for this need was received.`,
          author_id: params.steward_id,
          need_card_id: need.id,
          created_at: now,
        });
      }
    }

    out = { pledge: p, record };
  });
  return out;
}

export async function logShare(params: {
  need_card_id: NeedCardId;
  sharer_id: UserId;
}): Promise<void> {
  await mutate((d) => {
    d.shares.push({
      id: `s-${cuid()}`,
      need_card_id: params.need_card_id,
      sharer_id: params.sharer_id,
      at: new Date().toISOString(),
    });
  });
}

export async function cancelPledge(pledgeId: PledgeId): Promise<void> {
  await mutate((d) => {
    const p = d.pledges.find((x) => x.id === pledgeId);
    if (p && (p.status === "pledged" || p.status === "handed_off")) p.status = "cancelled";
  });
}