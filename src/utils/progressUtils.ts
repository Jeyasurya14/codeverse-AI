/**
 * Shared progress calculations from completion timestamps.
 */

export const XP_PER_ARTICLE = 100;

export type CompletedArticle = {
  articleId: string;
  completedAt: string;
};

function toDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getStreakFromCompletedArticles(completedArticles: { completedAt: string }[]): number {
  if (completedArticles.length === 0) return 0;
  const today = toDateKey(new Date().toISOString());
  const completedDates = [...new Set(completedArticles.map((c) => toDateKey(c.completedAt)))].sort().reverse();
  if (!completedDates.includes(today)) return 0;
  let streak = 0;
  let d = new Date();
  const check = (dateKey: string) => completedDates.includes(dateKey);
  while (check(toDateKey(d.toISOString()))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function getLast7DaysCompleted(completedArticles: { completedAt: string }[]): boolean[] {
  const byDate = new Set(completedArticles.map((c) => toDateKey(c.completedAt)));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return byDate.has(toDateKey(d.toISOString()));
  });
}

export function getLast30DaysXP(completedArticles: CompletedArticle[]): number[] {
  const byDate: Record<string, number> = {};
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    byDate[toDateKey(d.toISOString())] = 0;
  }
  for (const c of completedArticles) {
    const key = toDateKey(c.completedAt);
    if (key in byDate) byDate[key] += XP_PER_ARTICLE;
  }
  return Object.keys(byDate)
    .sort()
    .map((k) => byDate[k]);
}
