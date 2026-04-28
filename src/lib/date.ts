const KST_MS = 9 * 60 * 60 * 1000;

/** UTC 밀리초 → KST "YYYY-MM-DD" */
export function kstDateStr(ms: number = Date.now()): string {
  return new Date(ms + KST_MS).toISOString().split("T")[0];
}

/** KST 기준 오늘/내일 날짜 범위 (DB 쿼리용) */
export function getTodayRange() {
  const today = kstDateStr();
  const tomorrow = kstDateStr(Date.now() + 86400000);
  return {
    today,
    tomorrow,
    todayStart: `${today}T00:00:00+09:00`,
    tomorrowStart: `${tomorrow}T00:00:00+09:00`,
  };
}

/** KST 기준 현재 시각 (0~23) */
export function kstHour(): number {
  return new Date(Date.now() + KST_MS).getUTCHours();
}
