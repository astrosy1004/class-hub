// 한 번의 분석: 장소 + 업종 → 자료 조회(병렬) → 지표 → 점수 → 리포트. 같은 장소·업종은 세션 안에서 다시 계산하지 않는다.
import { getPop, getCompetitors, getRent, getRentRef, getDongBaseline, loadSample } from "./fetchers.js";
import { computeMetrics } from "./metrics.js";
import { buildBaseline, computeScore } from "./score.js";
import { buildReport } from "./report.js";
import { placeKey } from "./place.js";
import { rentInfo, loadRentInput, saveRentInput, matchRentRef } from "./rent.js";

const cache = new Map();

export async function analyze(place, industry, onStep = () => {}) {
  const key = placeKey(place, industry);
  if (cache.has(key)) return cache.get(key);
  onStep("pop");
  // 생활인구 자료가 없는 동네(서울 밖 · 수집 전 등)도 지도와 경쟁 점포는 보여준다: 실패해도 분석을 멈추지 않고 사유를 남긴다
  const popP = getPop(place).then((v) => { onStep("pop-done"); return v; }).catch((e) => { onStep("pop-missing"); return { missing: true, reason: e.message }; });
  onStep("comp");
  const compP = getCompetitors(place, industry).then((v) => { onStep("comp-done"); return v; });
  const [popRes, comp, rentData, rentRefDoc] = await Promise.all([popP, compP, getRent(place), getRentRef()]);
  // 임대료: 사용자가 넣어 둔 매물 값이 있으면 그것을, 없으면 공개 자료(연결 전에는 없음)
  const rent = rentInfo(loadRentInput(key)) || rentData;
  const pop = popRes.missing ? null : popRes;
  const popError = popRes.missing ? popRes.reason : "";
  // 기준 분포: 동 단위 자료면 수집된 전 행정동 분포, 없으면 자치구 표본 분포(눈금이 달라 화면에 알림)
  const baseline = !pop ? null : (pop.level === "dong" && (await getDongBaseline(industry.baseKey || industry.key))) || buildBaseline(await loadSample(), industry);
  onStep("score");
  const metrics = computeMetrics(pop, industry, comp);
  const score = computeScore(metrics, industry, baseline, pop, rent?.score ?? null);
  const result = { key, place, industry, pop, popError, comp, rent, rentRef: matchRentRef(rentRefDoc, place), metrics, score, baseline, at: Date.now() };
  result.report = buildReport(result);
  cache.set(key, result);
  return result;
}

// 결과 화면에서 매물 월세를 넣거나 지웠을 때: 점수 · 리포트만 다시 계산한다 (자료는 다시 받지 않음)
export function applyRent(a, input) {
  saveRentInput(a.key, input);
  a.rent = rentInfo(input);
  a.score = computeScore(a.metrics, a.industry, a.baseline, a.pop, a.rent?.score ?? null);
  a.report = buildReport(a);
  return a;
}
