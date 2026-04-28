import type { Pet } from "@/types";

export type Mood = "happy" | "normal" | "sad" | "critical";

export function getMood(pet: Pet): Mood {
  const avg = (pet.hunger + pet.happiness + pet.cleanliness) / 3;
  if (avg >= 70) return "happy";
  if (avg >= 40) return "normal";
  if (avg >= 20) return "sad";
  return "critical";
}

export function getMoodLabel(mood: Mood): string {
  const labels: Record<Mood, string> = {
    happy: "반짝반짝이에요 ✨",
    normal: "잔잔해요",
    sad: "빛이 줄었어요 😢",
    critical: "빛을 잃고 있어요 😵",
  };
  return labels[mood];
}

export function getMoodColor(mood: Mood): string {
  const colors: Record<Mood, string> = {
    happy: "var(--color-success)",
    normal: "var(--color-muted)",
    sad: "#3b82f6",
    critical: "var(--color-danger)",
  };
  return colors[mood];
}

export function getStatColor(value: number): string {
  if (value >= 60) return "var(--color-success)";
  if (value >= 30) return "var(--color-warning)";
  return "var(--color-danger)";
}
