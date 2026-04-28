// ─── 사용자 ───────────────────────────────────────────────────────────────────

export type UserRole = "participant" | "manager";

export interface Profile {
  id: string;
  nickname: string;
  role: UserRole;
  coins: number;
  created_at: string;
}

// ─── 다마고치 ─────────────────────────────────────────────────────────────────

export type PetStage = 1 | 2 | 3 | 4;

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  stage: PetStage;
  hunger: number;      // 0~100 (낮을수록 배고픔)
  happiness: number;   // 0~100
  cleanliness: number; // 0~100
  last_fed_at: string | null;
  last_played_at: string | null;
  last_cleaned_at: string | null;
  updated_at: string;
}

// ─── 미션 ─────────────────────────────────────────────────────────────────────

export type MissionDifficulty = "easy" | "medium" | "hard";

export interface Mission {
  id: string;
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  coins: number;
  emoji: string;
  is_active: boolean;
  requires_approval: boolean;
  created_by: string | null;
  assigned_to: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface MissionLog {
  id: string;
  user_id: string;
  mission_id: string;
  content: string;
  emoji: string;
  coins_earned: number;
  photo_url: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  mission?: Mission;
  profile?: Pick<Profile, "id" | "nickname">;
}

export interface FeedLog {
  id: string;
  content: string;
  photo_url: string;
  coins_earned: number;
  created_at: string;
  user_id: string;
  profiles: Pick<Profile, "nickname"> | null;
  missions: Pick<Mission, "title" | "emoji"> | null;
  reactions: Array<Pick<Reaction, "id" | "user_id" | "type">>;
}

// ─── 리액션 ───────────────────────────────────────────────────────────────────

export type ReactionType = "like" | "cheer";

export interface Reaction {
  id: string;
  user_id: string;
  mission_log_id: string;
  type: ReactionType;
  created_at: string;
}

// ─── 상점 ─────────────────────────────────────────────────────────────────────

export type ItemType = "food" | "toy" | "bath";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: ItemType;
  price: number;
  stat_value: number; // 스탯 회복량
  is_active: boolean;
}

export interface Inventory {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  updated_at: string;
  shop_items?: Pick<ShopItem, "type">;
}

export interface MoodCheckin {
  id: string;
  user_id: string;
  mood: number; // 1~5
  created_at: string;
}

export interface PurchaseLog {
  id: string;
  user_id: string;
  item_id: string;
  coins_spent: number;
  created_at: string;
  item?: ShopItem;
}

