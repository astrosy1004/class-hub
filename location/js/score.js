// 입지 적합도 점수 엔진: 지표 → 항목별 0~100 → 가중합 → 등급. 같은 입력이면 항상 같은 점수.
// - 고객 일치 · 유동인구 규모 · 성장성: 기준 분포(지금은 서울 25개 구 표본)에서의 백분위
//   (동 단위 자료는 수집기가 만든 동 기준 분포를 쓴다. 기준 분포 단위가 자료와 다르면 규모는 제외)
// - 경쟁 강도: 반경 내 동종 점포 수를 업종별 구간표로 환산 (낮을수록 높은 점수)
// - 임대료: 자료가 없으면 점수에서 빼고 나머지 비중을 다시 나눔
import { INDUSTRIES } from "./area-data.js";
import { computeMetrics } from "./metrics.js";
import { popFromSample } from "./fetchers.js";
import { ITEMS, GRADES } from "./score-rules.js";

// 업종별 기준 분포: 25개 구의 지표값을 정렬해 둔 배열
const baseCache = new Map();
export function buildBaseline(sample, ind) {
  if (baseCache.has(ind.key + sample.asOf)) return baseCache.get(ind.key + sample.asOf);
  const rows = Object.keys(sample.gu).map((code) => computeMetrics(popFromSample(sample, code), ind, null));
  const sorted = (f) => rows.map(f).sort((a, b) => a - b);
  const b = { n: rows.length, level: "gu", customer: sorted((r) => r.customerMatch), size: sorted((r) => r.sizeHours), growth: sorted((r) => r.growth) };
  baseCache.set(ind.key + sample.asOf, b);
  return b;
}

// 백분위: 기준 분포에서 x 이하인 값의 비율 (0~100)
export function percentile(sorted, x) {
  if (!sorted.length) return null;
  let below = 0;
  for (const v of sorted) if (v < x) below += 1;
  let equal = 0;
  for (const v of sorted) if (v === x) equal += 1;
  return Math.round(((below + equal / 2) / sorted.length) * 100);
}

export function competitionScore(count, bands) {
  for (const [max, score] of bands) if (count <= max) return score;
  return bands[bands.length - 1][1];
}

export const gradeOf = (score) => GRADES.find((g) => score >= g.min);

export function computeScore(metrics, ind, baseline, pop, rent = null) {
  const raw = {
    customer: baseline ? percentile(baseline.customer, metrics.customerMatch) : null,
    size: baseline && baseline.level === pop.level ? percentile(baseline.size, metrics.sizeHours) : null, // 규모는 자료 단위(자치구/동)와 기준 분포 단위가 같을 때만
    competition: metrics.compCount == null ? null : competitionScore(metrics.compCount, ind.bands),
    rent: rent == null ? null : rent,
    growth: baseline ? percentile(baseline.growth, metrics.growth) : null,
  };
  const items = ITEMS.map((it) => ({ ...it, score: raw[it.key] }));
  const usable = items.filter((i) => i.score != null);
  const wsum = usable.reduce((s, i) => s + i.weight, 0);
  const total = wsum ? Math.round(usable.reduce((s, i) => s + i.score * i.weight, 0) / wsum) : null;
  usable.forEach((i) => (i.effWeight = i.weight / wsum));
  return { items, total, used: usable.length, grade: total == null ? null : gradeOf(total) };
}

export { INDUSTRIES };
