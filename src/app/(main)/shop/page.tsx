import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ShopItemCard from "@/components/shop/ShopItemCard";
import CoinDisplay from "@/components/ui/CoinDisplay";
import type { ShopItem, Profile, Pet } from "@/types";

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: items }, { data: profile }, { data: inventory }, { data: pet }] = await Promise.all([
    supabase.from("shop_items").select("*").eq("is_active", true).order("type").order("price"),
    supabase.from("profiles").select("coins").eq("id", user.id).single(),
    supabase.from("inventory").select("item_id, quantity").eq("user_id", user.id),
    supabase.from("pets").select("stage").eq("user_id", user.id).single(),
  ]);

  const coins = (profile as Pick<Profile, "coins"> | null)?.coins ?? 0;
  const petStage = ((pet as Pick<Pet, "stage"> | null)?.stage ?? 1) as Pet["stage"];
  const seenTypes = new Set<string>();
  const allItems = ((items ?? []) as ShopItem[]).filter(item => {
    if (seenTypes.has(item.type)) return false;
    seenTypes.add(item.type);
    return true;
  });
  const ownedMap = new Map((inventory ?? []).map((i) => [i.item_id, i.quantity as number]));

  const groups = [
    { key: "food", label: "따뜻하게",   emoji: "🌡️", desc: "따뜻함 스탯 회복" },
    { key: "toy",  label: "같이 놀기",  emoji: "✨",  desc: "반짝임 스탯 회복" },
    { key: "bath", label: "맑게 해주기", emoji: "💎",  desc: "맑음 스탯 회복" },
  ] as const;

  return (
    <div className="p-4">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-extrabold text-[var(--color-primary)]">상점</h1>
        <CoinDisplay coins={coins} />
      </header>

      <p className="text-xs text-[var(--color-muted)] mb-5">
        미션을 완료해서 코인을 모아 별을 돌봐주세요!
        <br />
        구매한 아이템은 홈에서 직접 사용할 수 있어요 🌟
      </p>

      {groups.map(({ key, label, emoji, desc }) => {
        const group = allItems.filter((i) => i.type === key);
        if (group.length === 0) return null;
        return (
          <div key={key} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{emoji}</span>
              <div>
                <span className="text-sm font-extrabold">{label}</span>
                <span className="text-xs text-[var(--color-muted)] ml-2">{desc}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {group.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  userCoins={coins}
                  ownedCount={ownedMap.get(item.id) ?? 0}
                  currentPetStage={petStage}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
