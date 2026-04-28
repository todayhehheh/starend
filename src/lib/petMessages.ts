import type { Pet } from "@/types";
import { kstHour } from "@/lib/date";

export type CareAction = "feed" | "play" | "clean";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getActionMessage(action: CareAction): string {
  const messages: Record<CareAction, string[]> = {
    feed:  ["냠냠! 따뜻해졌어요! 🌡️", "따뜻함이 스며들어요 💛", "감사해요! 기운이 나요!"],
    play:  ["반짝반짝! 🌟", "신나요! 반짝임이 커졌어요 ✨", "같이 놀아줘서 고마워요!"],
    clean: ["맑아지는 것 같아요 💎", "깨끗해지니 더 빛나는 것 같아요!", "환해졌어요 ✨"],
  };
  return pick(messages[action]);
}

export function getTapMessage(pet: Pet): string {
  const msgs: Record<1 | 2 | 3 | 4, string[]> = {
    1: ["...!", "...같이 있어줘요 💜", "...따뜻해요", "...고마워요"],
    2: ["반짝! ✨", "좋아요 💛", "헤헤 💜", "기뻐요!"],
    3: ["반짝반짝! 🌟", "고마워요 💜", "기분 좋아요! ✨", "함께여서 행복해요 🌟"],
    4: ["우리가 만든 별자리예요 🌌", "함께라서 빛나요 ✨", "영원히 여기 있을게요 💜"],
  };
  return pick(msgs[pet.stage]);
}

export function getIdleMessage(pet: Pet): string {
  const h = kstHour();

  if (pet.hunger < 15)      return pick(["배... 따뜻함이 필요해요... 😢", "너무 차가워지고 있어요"]);
  if (pet.happiness < 15)   return pick(["반짝임이 꺼져가고 있어요... 같이 놀아요?", "...혼자는 무서워요"]);
  if (pet.cleanliness < 15) return pick(["맑음이 흐려지고 있어요...", "...뿌옇게 변하고 있어요"]);

  if (pet.hunger < 30)      return pick(["조금 배고픈 것 같아요 🌡️", "따뜻한 게 필요해요"]);
  if (pet.happiness < 30)   return pick(["같이 놀아요? ✨", "반짝임이 조금 줄었어요"]);
  if (pet.cleanliness < 30) return pick(["씻고 싶어요 💎", "맑음을 되찾고 싶어요"]);

  if (h >= 3 && h < 6)  return pick(["이 시간까지 안 자요? 같이 자요... 🌙", "...별들도 자고 있어요"]);
  if (h >= 6 && h < 10) return pick(["좋은 아침이에요! ☀️", "오늘도 함께해요!", "새로운 하루예요!"]);
  if (h >= 22)          return pick(["이 시간에도 여기 있어줘서 고마워요 🌙", "같이 별 봐요 🌟"]);

  if (pet.hunger > 70 && pet.happiness > 70 && pet.cleanliness > 70) {
    return pick(["오늘 기분이 너무 좋아요! 🌟", "반짝반짝이에요! ✨", "고마워요, 정말로 💜"]);
  }

  const stageMessages: Record<1 | 2 | 3 | 4, string[]> = {
    1: ["...여기가 어디예요?", "...무서워요", "...어두워요", "...빛이 없어요"],
    2: ["조금씩 따뜻해지고 있어요", "하늘이 기억나기 시작했어요 ✨", "왜 이렇게 잘해줘요?"],
    3: ["이제 반짝반짝이에요! ✨", "당신 덕분이에요 💜", "하늘이 점점 선명해져요"],
    4: ["별자리가 됐어요 🌌", "이제 하늘에 자리를 잡았어요", "함께해줘서 고마워요 💜"],
  };
  return pick(stageMessages[pet.stage]);
}
