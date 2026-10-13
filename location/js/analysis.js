// 한 번의 분석: 장소 + 업종 → 자료 조회(병렬) → 지표 → 점수 → 리포트. 같은 장소·업종은 세션 안에서 다시 계산하지 않는다.
import { getPop, getCompetitors, getRent, loadSample } from "./fetchers.js";
import { computeMetrics } from "./metrics.js";
import { buildBaseline, computeScore } from "./score.js";
import { buildReport } from "./report.js";
import { placeKey } from "./place.js";

const cache = new Map();

export async function analyze(place, industry, onStep = () => {}) {
  const key = placeKey(place, industry);
  if (cache.has(key)) return cache.get(key);
  onStep("pop");
  const popP = getPop(place).then((v) => { onStep("pop-done"); return v; });
  onStep("comp");
  const compP = getCompetitors(place, industry).then((v) => { onStep("comp-done"); return v; });
  const [pop, comp, rent] = await Promise.all([popP, compP, getRent(place)]);
  const baseline = buildBaseline(await loadSample(), industry);
  onStep("score");
  const metrics = computeMetrics(pop, industry, comp);
  const score = computeScore(metrics, industry, baseline, pop, rent);
  const result = { key, place, industry, pop, comp, rent, metrics, score, baseline, at: Date.now() };
  result.report = buildReport(result);
  cache.set(key, result);
  return result;
}
