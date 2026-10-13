// 한 번의 분석: 장소 + 업종 → 자료 조회(병렬) → 지표 → 점수 → 리포트. 같은 장소·업종은 세션 안에서 다시 계산하지 않는다.
import { getPop, getCompetitors, getRent, getDongBaseline, loadSample } from "./fetchers.js";
import { computeMetrics } from "./metrics.js";
import { buildBaseline, computeScore } from "./score.js";
import { buildReport } from "./report.js";
import { placeKey } from "./place.js";

const cache = new Map();

export async function analyze(place, industry, onStep = () => {}) {
  const key = placeKey(place, industry);
  if (cache.has(key)) return cache.get(key);
  onStep("pop");
  // 생활인구 자료가 없는 동네(서울 밖 · 수집 전 등)도 지도와 경쟁 점포는 보여준다: 실패해도 분석을 멈추지 않고 사유를 남긴다
  const popP = getPop(place).then((v) => { onStep("pop-done"); return v; }).catch((e) => { onStep("pop-missing"); return { missing: true, reason: e.message }; });
  onStep("comp");
  const compP = getCompetitors(place, industry).then((v) => { onStep("comp-done"); return v; });
  const [popRes, comp, rent] = await Promise.all([popP, compP, getRent(place)]);
  const pop = popRes.missing ? null : popRes;
  const popError = popRes.missing ? popRes.reason : "";
  // 기준 분포: 동 단위 자료면 수집된 전 행정동 분포, 없으면 자치구 표본 분포(눈금이 달라 화면에 알림)
  const baseline = !pop ? null : (pop.level === "dong" && (await getDongBaseline(industry.key))) || buildBaseline(await loadSample(), industry);
  onStep("score");
  const metrics = computeMetrics(pop, industry, comp);
  const score = computeScore(metrics, industry, baseline, pop, rent);
  const result = { key, place, industry, pop, popError, comp, rent, metrics, score, baseline, at: Date.now() };
  result.report = buildReport(result);
  cache.set(key, result);
  return result;
}
