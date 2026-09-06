export type UserId = string;
export type CasePageId = string;
export type NeedCardId = string;
export type PledgeId = string;
export type AnchorPointId = string;
export type ConfirmationRecordId = string;
export type TimelineEntryId = string;

export type Category =
  | "shelter"
  | "clothing"
  | "food"
  | "medical"
  | "hygiene"
  | "mobility"
  | "education";

export type Urgency = "low" | "medium" | "high" | "critical";

export type NeedStatus = "open" | "partially_fulfilled" | "fulfilled" | "cancelled";

export type PledgeStatus = "pledged" | "handed_off" | "confirmed" | "cancelled";

export interface User {
  id: UserId;
  display_name: string;
  badge: number;
  rank_points: number;
  created_at: string;
}

export interface CasePage {
  id: CasePageId;
  alias: string;
  broad_area: string;
  intro_media: string; // poster key, maps to deterministic SVG
  intro_text: string;
  stewards: UserId[];
  status: "active" | "inactive" | "frozen";
  consent_clip: boolean; // recorded verbal consent captured → true
  blur_public: boolean;
  created_at: string;
  last_update_at: string;
}

export interface TimelineEntry {
  id: TimelineEntryId;
  case_page_id: CasePageId;
  kind: "intro" | "need" | "update" | "fulfillment";
  text: string;
  author_id: UserId;
  need_card_id?: NeedCardId;
  created_at: string;
}

export interface AITags {
  category: Category;
  item_type: string;
  urgency: Urgency;
}

export interface NeedCard {
  id: NeedCardId;
  media_key: string; // deterministic poster key
  ai_tags: AITags;
  caption: string;
  owner_type: "self" | "case_page";
  owner_id: UserId | CasePageId;
  area: string;
  status: NeedStatus;
  quantity: string;
  created_at: string;
}

export interface Pledge {
  id: PledgeId;
  need_card_id: NeedCardId;
  giver_id: UserId;
  portion: string;
  status: PledgeStatus;
  anchor_point_id: AnchorPointId | null;
  created_at: string;
  handed_off_at: string | null;
  confirmed_at: string | null;
}

export interface AnchorPoint {
  id: AnchorPointId;
  name: string;
  area: string;
  vetted_by: string;
  active: boolean;
}

export interface ConfirmationRecord {
  id: ConfirmationRecordId;
  pledge_id: PledgeId;
  need_card_id: NeedCardId;
  giver_id: UserId;
  steward_id: UserId;
  confirmed_at: string;
  on_chain_ref: string | null;
  mismatch_flag: boolean;
}

export interface ShareEvent {
  id: string;
  need_card_id: NeedCardId;
  sharer_id: UserId;
  at: string;
}

export interface StoreData {
  users: User[];
  case_pages: CasePage[];
  timeline: TimelineEntry[];
  needs: NeedCard[];
  pledges: Pledge[];
  anchor_points: AnchorPoint[];
  confirmations: ConfirmationRecord[];
  shares: ShareEvent[];
}