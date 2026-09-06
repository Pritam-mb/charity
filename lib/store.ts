import fs from "node:fs";
import path from "node:path";
import { buildSeed } from "./seed";
import type {
  AITags,
  Achievement,
  AnchorPointId,
  CasePage,
  CasePageId,
  Comment,
  ConfirmationRecord,
  Follow,
  FolloweeType,
  NeedCard,
  NeedCardId,
  Notification,
  NotificationKind,
  Pledge,
  PledgeId,
  StoreData,
  TimelineEntry,
  SupportOffer,
  User,
  UserId,
  Volunteer,
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
      return normalizeStore(JSON.parse(raw) as StoreData);
    } catch {
      const seed = buildSeed();
      const normalized = normalizeStore(seed);
      await persist(normalized);
      return normalized;
    }
  })();
  return cachePromise;
}

function normalizeStore(data: StoreData): StoreData {
  data.reactions ??= [];
  if (!data.donations || data.donations.length === 0) {
    data.donations = buildSeed().donations;
  }
  data.offers ??= [];
  data.case_messages ??= [];
  data.comments ??= [];
  data.votes ??= [];
  data.volunteers ??= [];
  data.follows ??= [];
  data.notifications ??= [];
  data.achievements ??= buildSeed().achievements;
  for (const user of data.users) {
    user.role ??= user.id.includes("steward") ? "steward" : "citizen";
    user.honor_badge ??= user.badge;
    if (user.display_name) {
      user.display_name = user.display_name.replace(/\s*\(Demo\)/gi, "").trim() || "You";
    }
  }
  for (const need of data.needs) {
    need.upvotes ??= 0;
    need.downvotes ??= 0;
  }
  for (const page of data.case_pages) {
    page.location_label ??= `${page.broad_area} community anchor point`;
    page.map_query ??= `${page.broad_area}, Kolkata`;
    page.handler_type ??= "citizen";
    page.handler_name ??= page.stewards.length > 1 ? "Community steward group" : "Local steward";
    page.bank_account_name ??= `${page.alias} Support Fund`;
    page.bank_name ??= "Community verified bank";
    page.bank_account_number ??= "XXXX-XXXX-1208";
    page.bank_ifsc ??= "DEMO0001208";
    page.upi_id ??= `${page.alias.toLowerCase().replaceAll(" ", "")}.support@upi`;
    page.fundraiser_goal ??= 12000;
    page.government_help ??= "Not recorded yet";
    page.current_support ??= "Food, clothing and medicine updates are tracked by stewards.";
  }
  return data;
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

export async function updateUser(
  id: UserId,
  updates: Partial<Pick<User, "display_name" | "role" | "password" | "bio" | "area" | "contact">>
): Promise<User | undefined> {
  let updated: User | undefined;
  await mutate((d) => {
    const u = d.users.find((user) => user.id === id);
    if (u) {
      if (updates.display_name !== undefined) u.display_name = updates.display_name.trim();
      if (updates.role !== undefined) u.role = updates.role;
      if (updates.password !== undefined) u.password = updates.password;
      if (updates.bio !== undefined) u.bio = updates.bio.trim();
      if (updates.area !== undefined) u.area = updates.area.trim();
      if (updates.contact !== undefined) u.contact = updates.contact.trim();
      updated = { ...u };
    }
  });
  return updated;
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

export async function getOffers() {
  const d = await load();
  return d.offers;
}

// ---------- mutations ----------

export async function createUser(params: {
  display_name: string;
  role: "citizen" | "steward" | "ngo";
  password?: string;
}): Promise<User> {
  const id = `u-${cuid()}`;
  const user: User = {
    id,
    display_name: params.display_name,
    role: params.role,
    password: params.password,
    badge: 0,
    honor_badge: 0,
    rank_points: 0,
    created_at: new Date().toISOString(),
  };
  await mutate((d) => {
    d.users.push(user);
  });
  return user;
}

export async function authenticateUser(display_name: string, password?: string): Promise<User | undefined> {
  const d = await load();
  const user = d.users.find(u => u.display_name.toLowerCase() === display_name.toLowerCase());
  if (!user) return undefined;
  if (user.password && user.password !== password) return undefined;
  return user;
}

export async function createCase(data: {
  alias: string;
  broad_area: string;
  location_label?: string;
  map_query?: string;
  intro_text: string;
  steward_id: UserId;
  consent_clip: boolean;
  handler_type?: "citizen" | "ngo" | "group" | "leader";
  handler_name?: string;
  bank_account_name?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  upi_id?: string;
  fundraiser_goal?: number;
  government_help?: string;
  current_support?: string;
}): Promise<CasePage> {
  const id = `c-${cuid()}`;
  const now = new Date().toISOString();
  const page: CasePage = {
    id,
    alias: data.alias,
    broad_area: data.broad_area,
    location_label: data.location_label || `${data.broad_area} community anchor point`,
    map_query: data.map_query || `${data.broad_area}, Kolkata`,
    intro_media: id,
    intro_text: data.intro_text,
    stewards: [data.steward_id],
    handler_type: data.handler_type ?? "citizen",
    handler_name: data.handler_name || "Local steward",
    status: "active",
    consent_clip: data.consent_clip,
    blur_public: true,
    bank_account_name: data.bank_account_name,
    bank_name: data.bank_name,
    bank_account_number: data.bank_account_number,
    bank_ifsc: data.bank_ifsc,
    upi_id: data.upi_id,
    fundraiser_goal: data.fundraiser_goal,
    government_help: data.government_help,
    current_support: data.current_support,
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

    // Notify followers of this case (who opted into updates) and followers of
    // the case's stewards / handling NGOs.
    const stewardIds = c ? new Set(c.stewards) : new Set<string>();
    d.follows
      .filter((f) => f.want_updates)
      .forEach((f) => {
        const matchesCase =
          f.followee_type === "case" && f.followee_id === params.case_page_id;
        const matchesSteward =
          f.followee_type === "user" && stewardIds.has(f.followee_id);
        if (matchesCase || matchesSteward) {
          d.notifications.push({
            id: `nt-${cuid()}`,
            user_id: f.user_id,
            kind: "case_update",
            target_id: params.case_page_id,
            case_page_id: params.case_page_id,
            text: `New update${c ? ` on ${c.alias}'s case` : ""}: ${params.text}`,
            read: false,
            created_at: entry.created_at,
          });
        }
      });
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
  photo_name?: string;
  tagged_org?: string;
}): Promise<NeedCard> {
  const need: NeedCard = {
    id: `n-${cuid()}`,
    media_key: params.photo_name || `n-${cuid()}`,
    photo_name: params.photo_name,
    ai_tags: params.ai_tags,
    caption: params.caption,
    owner_type: params.owner_type,
    owner_id: params.owner_id,
    area: params.area,
    status: "open",
    quantity: params.quantity,
    tagged_org: params.tagged_org,
    upvotes: 0,
    downvotes: 0,
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

    const need = d.needs.find((n) => n.id === p.need_card_id);

    // Notify the giver that their help was confirmed.
    d.notifications.push({
      id: `nt-${cuid()}`,
      user_id: p.giver_id,
      kind: "help_confirmed",
      target_id: p.need_card_id,
      case_page_id: need?.owner_type === "case_page" ? (need.owner_id as CasePageId) : undefined,
      text: `Your pledge (${p.portion}) was confirmed by a steward. Thank you — your help reached someone.`,
      read: false,
      created_at: now,
    });

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

    if (need) {
      const confirmed = d.pledges.filter(
        (x) => x.need_card_id === need.id && x.status === "confirmed"
      ).length;
      if (confirmed >= 1) need.status = "fulfilled";
    }

    // Good news: when a case need becomes fulfilled, celebrate an achievement
    // and notify followers who opted into updates.
    if (need && need.status === "fulfilled" && need.owner_type === "case_page") {
      const page = d.case_pages.find((cp) => cp.id === need.owner_id);
      if (page) {
        d.achievements.push({
          id: `a-${cuid()}`,
          case_page_id: page.id,
          title: `${page.alias} — a need was fulfilled`,
          text: `Confirmed: a pledge for "${need.caption}" was received by a steward. This support made a real difference for ${page.alias}.`,
          by_name: giver?.display_name ?? "A neighbor",
          highlight: page.alias,
          created_at: now,
        });
        d.follows
          .filter((f) => f.want_updates && f.followee_type === "case" && f.followee_id === page.id)
          .forEach((f) => {
            d.notifications.push({
              id: `nt-${cuid()}`,
              user_id: f.user_id,
              kind: "good_news",
              target_id: page.id,
              case_page_id: page.id,
              text: `Great news on ${page.alias}'s case: a need was fulfilled and the support was confirmed.`,
              read: false,
              created_at: now,
            });
          });
      }
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

export async function logReaction(params: {
  need_card_id: NeedCardId;
  user_id: UserId;
  kind: "support" | "urgent" | "pray";
}): Promise<void> {
  await mutate((d) => {
    d.reactions.push({
      id: `r-${cuid()}`,
      need_card_id: params.need_card_id,
      user_id: params.user_id,
      kind: params.kind,
      at: new Date().toISOString(),
    });
  });
}

export async function toggleReaction(params: {
  need_card_id: NeedCardId;
  user_id: UserId;
  kind: "support" | "urgent" | "pray";
}): Promise<{ supported: boolean }> {
  let supported = false;
  await mutate((d) => {
    d.reactions = d.reactions || [];
    const idx = d.reactions.findIndex(
      (r) => r.need_card_id === params.need_card_id && r.user_id === params.user_id && r.kind === params.kind
    );
    if (idx >= 0) {
      d.reactions.splice(idx, 1);
      supported = false;
    } else {
      d.reactions.push({
        id: `r-${cuid()}`,
        need_card_id: params.need_card_id,
        user_id: params.user_id,
        kind: params.kind,
        at: new Date().toISOString(),
      });
      supported = true;
    }
  });
  return { supported };
}

export async function addDonationLog(params: {
  case_page_id: CasePageId;
  donor_id: UserId;
  donor_name: string;
  amount: number;
  method: "cash" | "bank" | "upi" | "other";
  note: string;
}): Promise<void> {
  await mutate((d) => {
    d.donations.push({
      id: `d-${cuid()}`,
      case_page_id: params.case_page_id,
      donor_id: params.donor_id,
      donor_name: params.donor_name,
      amount: params.amount,
      method: params.method,
      note: params.note,
      at: new Date().toISOString(),
    });
    const donor = d.users.find((u) => u.id === params.donor_id);
    if (donor) {
      donor.honor_badge = (donor.honor_badge ?? donor.badge) + 1;
      donor.rank_points += 1;
    }
  });
}

export async function addCaseMessage(params: {
  case_page_id: CasePageId;
  author_id: UserId;
  text: string;
}): Promise<void> {
  await mutate((d) => {
    d.case_messages.push({
      id: `m-${cuid()}`,
      case_page_id: params.case_page_id,
      author_id: params.author_id,
      text: params.text,
      created_at: new Date().toISOString(),
    });
  });
}

export async function createOffer(params: {
  user_id: UserId;
  title: string;
  category: SupportOffer["category"];
  area: string;
  quantity: string;
  contact: string;
}): Promise<SupportOffer> {
  const offer: SupportOffer = {
    id: `o-${cuid()}`,
    user_id: params.user_id,
    title: params.title,
    category: params.category,
    area: params.area,
    quantity: params.quantity,
    contact: params.contact,
    status: "available",
    created_at: new Date().toISOString(),
  };
  await mutate((d) => {
    d.offers.push(offer);
  });
  return offer;
}

export async function cancelPledge(pledgeId: PledgeId): Promise<void> {
  await mutate((d) => {
    const p = d.pledges.find((x) => x.id === pledgeId);
    if (p && (p.status === "pledged" || p.status === "handed_off")) p.status = "cancelled";
  });
}

export async function addComment(params: {
  need_card_id: NeedCardId;
  author_id: UserId;
  text: string;
}): Promise<Comment> {
  const comment: Comment = {
    id: `cm-${cuid()}`,
    need_card_id: params.need_card_id,
    author_id: params.author_id,
    text: params.text,
    created_at: new Date().toISOString(),
  };
  await mutate((d) => {
    d.comments.push(comment);
  });
  return comment;
}

export async function addVote(params: {
  need_card_id: NeedCardId;
  user_id: UserId;
  kind: "up" | "down";
}): Promise<void> {
  await mutate((d) => {
    // Remove existing vote from this user on this need
    const existing = d.votes.find(v => v.need_card_id === params.need_card_id && v.user_id === params.user_id);
    const need = d.needs.find(n => n.id === params.need_card_id);
    if (!need) return;
    if (existing) {
      if (existing.kind === "up") need.upvotes = Math.max(0, need.upvotes - 1);
      else need.downvotes = Math.max(0, need.downvotes - 1);
      d.votes = d.votes.filter(v => v.id !== existing.id);
      if (existing.kind === params.kind) return; // toggle off
    }
    d.votes.push({ id: `v-${cuid()}`, need_card_id: params.need_card_id, user_id: params.user_id, kind: params.kind, at: new Date().toISOString() });
    if (params.kind === "up") need.upvotes += 1;
    else need.downvotes += 1;
  });
}

export async function registerVolunteer(params: {
  user_id: UserId;
  name: string;
  category: Volunteer["category"];
  description: string;
  area: string;
  availability: string;
  contact: string;
}): Promise<Volunteer> {
  const vol: Volunteer = {
    id: `vol-${cuid()}`,
    ...params,
    created_at: new Date().toISOString(),
  };
  await mutate((d) => {
    d.volunteers.push(vol);
  });
  return vol;
}

// ---------- follows ----------

export async function getFollowsForUser(user_id: UserId): Promise<Follow[]> {
  const d = await load();
  return d.follows.filter((f) => f.user_id === user_id);
}

export async function getFollowForUser(
  user_id: UserId,
  followee_type: FolloweeType,
  followee_id: string
): Promise<Follow | undefined> {
  const d = await load();
  return d.follows.find(
    (f) =>
      f.user_id === user_id &&
      f.followee_type === followee_type &&
      f.followee_id === followee_id
  );
}

export async function toggleFollow(params: {
  user_id: UserId;
  followee_type: FolloweeType;
  followee_id: string;
  want_updates: boolean;
}): Promise<{ followed: boolean; follow: Follow | null }> {
  let followed = false;
  let created: Follow | null = null;
  await mutate((d) => {
    d.follows ??= [];
    const idx = d.follows.findIndex(
      (f) =>
        f.user_id === params.user_id &&
        f.followee_type === params.followee_type &&
        f.followee_id === params.followee_id
    );
    if (idx >= 0) {
      d.follows.splice(idx, 1);
      followed = false;
    } else {
      created = {
        id: `f-${cuid()}`,
        user_id: params.user_id,
        followee_type: params.followee_type,
        followee_id: params.followee_id,
        want_updates: params.want_updates,
        created_at: new Date().toISOString(),
      };
      d.follows.push(created);
      followed = true;
    }
  });
  return { followed, follow: created };
}

export async function setFollowUpdates(params: {
  user_id: UserId;
  followee_type: FolloweeType;
  followee_id: string;
  want_updates: boolean;
}): Promise<void> {
  await mutate((d) => {
    const f = d.follows.find(
      (x) =>
        x.user_id === params.user_id &&
        x.followee_type === params.followee_type &&
        x.followee_id === params.followee_id
    );
    if (f) f.want_updates = params.want_updates;
  });
}

// ---------- notifications ----------

export async function getNotificationsForUser(user_id: UserId): Promise<Notification[]> {
  const d = await load();
  return d.notifications
    .filter((n) => n.user_id === user_id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getUnreadNotificationCount(user_id: UserId): Promise<number> {
  const d = await load();
  return d.notifications.filter((n) => n.user_id === user_id && !n.read).length;
}

export async function markNotificationsRead(user_id: UserId): Promise<void> {
  await mutate((d) => {
    d.notifications.forEach((n) => {
      if (n.user_id === user_id) n.read = true;
    });
  });
}

export async function pushNotification(params: {
  user_id: UserId;
  kind: NotificationKind;
  target_id: string;
  case_page_id?: CasePageId;
  text: string;
}): Promise<Notification> {
  const notification: Notification = {
    id: `nt-${cuid()}`,
    user_id: params.user_id,
    kind: params.kind,
    target_id: params.target_id,
    case_page_id: params.case_page_id,
    text: params.text,
    read: false,
    created_at: new Date().toISOString(),
  };
  await mutate((d) => {
    d.notifications.push(notification);
  });
  return notification;
}

// ---------- achievements ----------

export async function getAchievements(): Promise<Achievement[]> {
  const d = await load();
  return [...d.achievements].sort((a, b) => b.created_at.localeCompare(a.created_at));
}
