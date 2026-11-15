import type { SectionId } from "./types";

/** To'liq testdagi savollar soni (bo'lim bo'yicha) */
export const sectionQuestionCount: Record<SectionId, number> = { rw: 54, math: 44 };

/**
 * Taxminiy “raw → scaled” egri chiziq: [to'g'ri javoblar ulushi, 200–800 shkaladagi ulush].
 * College Board amaliy testlari shkalalariga yaqinlashtirilgan; rasmiy jadval emas.
 */
const curve: [number, number][] = [
  [0, 0],
  [0.1, 0.06],
  [0.25, 0.2],
  [0.4, 0.35],
  [0.5, 0.47],
  [0.6, 0.57],
  [0.75, 0.72],
  [0.85, 0.83],
  [0.95, 0.95],
  [1, 1],
];

function interpolate(points: [number, number][], x: number) {
  const v = Math.max(points[0][0], Math.min(points[points.length - 1][0], x));
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (v <= x1) return y0 + ((v - x0) / (x1 - x0)) * (y1 - y0);
  }
  return points[points.length - 1][1];
}

const roundTo10 = (n: number) => Math.round(n / 10) * 10;

/** To'g'ri javoblar ulushidan (0–1) bo'lim balli (200–800) */
export function scaleSection(accuracy: number) {
  return roundTo10(200 + 600 * interpolate(curve, accuracy));
}

/** Bo'lim balli (200–800) uchun kerakli to'g'ri javoblar ulushi (0–1) */
export function requiredAccuracy(sectionScore: number) {
  const target = (Math.max(200, Math.min(800, sectionScore)) - 200) / 600;
  return interpolate(curve.map(([a, b]) => [b, a]), target);
}

const percentiles: [number, number][] = [
  [400, 1],
  [800, 10],
  [1000, 40],
  [1100, 58],
  [1200, 74],
  [1300, 86],
  [1400, 94],
  [1500, 98],
  [1600, 99],
];

/** Umumiy ball uchun taxminiy persentil */
export function estimatePercentile(total: number) {
  return Math.round(interpolate(percentiles, total));
}

export type ScoreBandId = "elite" | "excellent" | "good" | "average" | "starter";

export function scoreBandOf(total: number): ScoreBandId {
  if (total >= 1500) return "elite";
  if (total >= 1400) return "excellent";
  if (total >= 1200) return "good";
  if (total >= 1000) return "average";
  return "starter";
}
