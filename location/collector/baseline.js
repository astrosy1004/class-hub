// 동 단위 기준 분포: 수집된 모든 행정동의 지표를 업종별로 정렬해 둔 배열 (점수의 "백분위" 눈금).
// 브라우저 점수 엔진(js/score.js)이 이 분포에서 한 동의 위치를 0~100으로 바꾼다. 순수 함수 — 시험 가능.
import { BASELINE_PROFILES } from "../js/area-data.js";
import { computeMetrics } from "../js/metrics.js";

const round = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
const sortedBy = (rows, f, d) => rows.map(f).filter(Number.isFinite).map((x) => round(x, d)).sort((a, b) => a - b);

// pops: buildPop() 결과 배열(행정동마다 하나). 데이터가 너무 적은 동(minDays 미만)은 제외
export function buildBaselines(pops, asOf, { minDays = 14 } = {}) {
  const ok = pops.filter((p) => p && p.days >= minDays && p.weekday.some((v) => v > 0));
  const industries = {};
  for (const ind of BASELINE_PROFILES) {
    const rows = ok.map((p) => computeMetrics(p, ind, null));
    industries[ind.key] = {
      customer: sortedBy(rows, (r) => r.customerMatch, 4),
      size: sortedBy(rows, (r) => r.sizeHours, 0),
      growth: sortedBy(rows, (r) => r.growth, 4),
    };
  }
  return { level: "dong", n: ok.length, asOf, industries, updatedAt: Date.now() };
}
