// 엔진 검증 페이지: 자료 형식 · 점수 · 문장 규칙을 한 번에 점검한다. (개발용, 배포 제외)
import { INDUSTRIES, DEMO_PLACES, GU, AGE_GROUPS } from "./area-data.js";
import { parseQuery } from "./place.js";
import { loadSample, demoCompetitors, popFromSample } from "./fetchers.js";
import { computeMetrics } from "./metrics.js";
import { percentile, competitionScore, buildBaseline, computeScore } from "./score.js";
import { ITEMS, FORBIDDEN } from "./score-rules.js";
import { buildReport, reportLines } from "./report.js";
import { searchSplit, distanceM } from "./split-search.js";
import { buildBaselines } from "../collector/baseline.js";

const out = document.getElementById("out");
const results = [];
const check = (group, name, ok, detail = "") => results.push({ group, name, ok: !!ok, detail });
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;

async function run() {
  // 1. 검색어 해석
  const q = [["연남동 카페", "연남동", "cafe"], ["성수동 술집", "성수동", "bar"], ["합정동 맛집", "합정동", "restaurant"], ["망원동 편의점", "망원동", "cvs"], ["강남 치과", "강남", "hospital"]];
  for (const [text, place, ind] of q) {
    const p = parseQuery(text);
    check("검색어 해석", text, p.placeText === place && p.industry?.key === ind, `→ ${p.placeText} / ${p.industry?.key}`);
  }
  check("검색어 해석", "업종 없는 검색어는 업종 null", parseQuery("연남동").industry === null);

  // 2. 규칙표
  check("규칙표", "항목 비중 합 = 1", near(ITEMS.reduce((s, i) => s + i.weight, 0), 1));
  INDUSTRIES.forEach((i) => {
    check("규칙표", `${i.name}: 목표 고객 비중 합 = 1`, near(Object.values(i.target).reduce((a, b) => a + b, 0), 1, 1e-9));
    check("규칙표", `${i.name}: 경쟁 구간표가 점수 내림차순`, i.bands.every((b, k) => k === 0 || b[1] <= i.bands[k - 1][1]));
  });
  check("규칙표", "예시 행정동의 구 코드가 25개 구에 있음", DEMO_PLACES.every((p) => GU[p.gu]));

  // 3. 예시 표본 자료 형식
  const sample = await loadSample();
  const codes = Object.keys(sample.gu);
  check("표본 자료", "25개 구", codes.length === 25 && codes.every((c) => GU[c]), `${codes.length}개`);
  check("표본 자료", "시간대 배열 24칸(평일·주말)", codes.every((c) => sample.gu[c].weekday.length === 24 && sample.gu[c].weekend.length === 24));
  check("표본 자료", "연령 비중 합 ≈ 1", codes.every((c) => near(Object.values(sample.gu[c].age).reduce((a, b) => a + b, 0), 1, 0.01)));
  check("표본 자료", "월별 연령 비중 합 ≈ 1", codes.every((c) => sample.gu[c].ageMonthly.every((r) => near(r.reduce((a, b) => a + b, 0), 1, 0.01))));
  check("표본 자료", "월 수 일치", codes.every((c) => sample.gu[c].monthly.length === sample.months.length && sample.gu[c].ageMonthly.length === sample.months.length), `${sample.months.length}개월`);
  check("표본 자료", "음수·결측 없음", codes.every((c) => [...sample.gu[c].weekday, ...sample.gu[c].weekend, ...sample.gu[c].monthly].every((v) => Number.isFinite(v) && v >= 0)));

  // 4. 점수 계산
  check("점수", "백분위: 최소값 → 낮음, 최대값 → 높음", percentile([1, 2, 3, 4], 1) < 20 && percentile([1, 2, 3, 4], 4) > 80);
  const ind = INDUSTRIES[0];
  check("점수", "경쟁 점수: 점포가 적을수록 높음", competitionScore(5, ind.bands) > competitionScore(25, ind.bands) && competitionScore(25, ind.bands) > competitionScore(80, ind.bands));
  const base = buildBaseline(sample, ind);
  const place = DEMO_PLACES[0];
  const pop = popFromSample(sample, place.gu);
  const comp = demoCompetitors(place, ind);
  const m1 = computeMetrics(pop, ind, comp);
  const s1 = computeScore(m1, ind, base, pop, null);
  const s2 = computeScore(computeMetrics(pop, ind, demoCompetitors(place, ind)), ind, base, pop, null);
  check("점수", "같은 입력 = 같은 점수", s1.total === s2.total, `${s1.total}점`);
  check("점수", "임대료 없음 → 4개 항목 기준, 비중 재배분 합 = 1", s1.used === 4 && near(s1.items.filter((i) => i.score != null).reduce((a, i) => a + i.effWeight, 0), 1));
  const s3 = computeScore(m1, ind, base, pop, 50);
  check("점수", "임대료가 있으면 5개 항목", s3.used === 5);
  check("점수", "점수 범위 0~100", s1.total >= 0 && s1.total <= 100);
  check("점수", "자료가 전혀 없으면 점수 null", computeScore({ ...m1, compCount: null }, ind, null, pop, null).total === null);
  check("점수", "예시 점포 수 ≤ 45 · 같은 입력 같은 결과", comp.count <= 45 && comp.count === demoCompetitors(place, ind).count);

  // 5. 리포트 문장: 금지어 · 근거 · 고지
  let bad = [], noEv = 0, total = 0;
  for (const pl of DEMO_PLACES) for (const id of INDUSTRIES) {
    const p = popFromSample(sample, pl.gu), c = demoCompetitors(pl, id), mm = computeMetrics(p, id, c);
    const sc = computeScore(mm, id, buildBaseline(sample, id), p, null);
    const rep = buildReport({ place: pl, industry: id, pop: p, comp: c, metrics: mm, score: sc });
    total += 1;
    reportLines(rep).forEach((l) => FORBIDDEN.forEach((w) => l.includes(w) && bad.push(`${pl.name}/${id.name}: ${w}`)));
    [...rep.strengths, ...rep.risks, ...rep.strategies].forEach((x) => !x.ev && (noEv += 1));
    if (!rep.overall.includes("보장하지 않")) bad.push(`${pl.name}/${id.name}: 고지 없음`);
  }
  check("리포트", `금지어 · 고지 점검 (${total}개 조합)`, bad.length === 0, bad.slice(0, 3).join(", "));
  check("리포트", "모든 문장에 근거 지표", noEv === 0, `근거 없는 문장 ${noEv}개`);
  // 6. 반경 분할 검색 (가짜 검색 함수: 한 번에 45곳, 가까운 순)
  const mk = (n, seedLat = 37.5, seedLng = 127.0, spread = 480) => {
    let s = 7;
    const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    return Array.from({ length: n }, (_, i) => {
      const d = Math.sqrt(rnd()) * spread, a = rnd() * 2 * Math.PI;
      return { id: String(i), name: "p" + i, lat: seedLat + (d * Math.sin(a)) / 111000, lng: seedLng + (d * Math.cos(a)) / (111000 * Math.cos(seedLat * Math.PI / 180)) };
    });
  };
  const fake = (pts) => async (lat, lng, rad) => {
    const inside = pts.map((p) => ({ ...p, dist: distanceM(lat, lng, p.lat, p.lng) })).filter((p) => p.dist <= rad).sort((a, b) => a.dist - b.dist);
    return { items: inside.slice(0, 45), capped: inside.length > 45 };
  };
  const few = await searchSplit(fake(mk(30)), 37.5, 127.0, 500);
  check("분할 검색", "45곳 미만이면 1회 호출로 끝", few.count === 30 && few.calls === 1 && !few.capped, `${few.count}곳 · ${few.calls}회`);
  const mid = await searchSplit(fake(mk(120)), 37.5, 127.0, 500);
  check("분할 검색", "120곳 → 나눠 검색해 전부 찾음 (중복 없음)", mid.count === 120 && new Set(mid.items.map((i) => i.id)).size === 120 && !mid.capped, `${mid.count}곳 · ${mid.calls}회`);
  check("분할 검색", "모든 결과가 반경 안", mid.items.every((i) => i.dist <= 500));
  const many = await searchSplit(fake(mk(900)), 37.5, 127.0, 500);
  check("분할 검색", "아주 밀집(900곳) → 호출 한도 안에서 멈추고 capped 표시", many.capped && many.calls <= 30 && many.count > 120, `${many.count}곳 · ${many.calls}회`);
  const calls2 = await searchSplit(fake(mk(120)), 37.5, 127.0, 500, { maxCalls: 3 });
  check("분할 검색", "호출 한도(maxCalls)를 넘지 않음", calls2.calls <= 3 && calls2.capped);
  // 7. 동 단위 기준 분포 (수집기가 만드는 baseline) — 자치구 표본을 "동"처럼 취급해 형식만 점검
  const pops = codes.map((c) => ({ ...popFromSample(sample, c), level: "dong", days: 30 }));
  const bl = buildBaselines(pops, "2026-10-09");
  const cafeB = bl.industries.cafe;
  check("기준 분포", "행정동 수 · 업종 5개", bl.n === 25 && Object.keys(bl.industries).length === 5, `n=${bl.n}`);
  check("기준 분포", "업종별 3개 배열 · 오름차순 정렬", INDUSTRIES.every((i) => ["customer", "size", "growth"].every((k) => { const a = bl.industries[i.key][k]; return a.length === 25 && a.every((v, n) => n === 0 || a[n - 1] <= v); })));
  check("기준 분포", "데이터가 짧은 동(14일 미만)은 제외", buildBaselines([{ ...pops[0], days: 5 }, pops[1]], "x").n === 1);
  const dBase = { level: "dong", ...cafeB };
  const dPop = pops[0];
  const dScore = computeScore(computeMetrics(dPop, ind, comp), ind, dBase, dPop, null);
  check("기준 분포", "동 기준 분포 + 동 자료 → 규모 항목 포함(4개 항목)", dScore.used === 4 && dScore.items.find((i) => i.key === "size").score != null, `${dScore.used}개`);
  const gScore = computeScore(computeMetrics(dPop, ind, comp), ind, base, dPop, null);
  check("기준 분포", "자치구 기준 분포 + 동 자료 → 규모 제외(3개 항목)", gScore.used === 3 && gScore.items.find((i) => i.key === "size").score == null, `${gScore.used}개`);
  // 8. 생활인구 자료가 없는 동네: 지도 · 경쟁 점포는 보여주고 점수는 내지 않는다
  const mNo = computeMetrics(null, ind, comp);
  const sNo = computeScore(mNo, ind, null, null, null);
  check("자료 없는 동네", "지표는 경쟁 점포만 계산", mNo.noPop === true && mNo.compCount === comp.count);
  check("자료 없는 동네", "항목 1개뿐이면 종합 점수 없음 (경쟁만 점수)", sNo.total === null && sNo.used === 1 && sNo.items.find((i) => i.key === "competition").score != null, `${sNo.used}개 항목`);
  const rNo = buildReport({ place: DEMO_PLACES[0], industry: ind, pop: null, popError: "행정동 99999999 의 요약이 없어요", comp, metrics: mNo, score: sNo, baseline: null });
  const linesNo = reportLines(rNo);
  check("자료 없는 동네", "리포트: 금지어 없음 · 고지 포함 · 근거 포함", !linesNo.some((l) => FORBIDDEN.some((w) => l.includes(w))) && rNo.overall.includes("보장하지 않") && [...rNo.strengths, ...rNo.risks, ...rNo.strategies].every((x) => x.ev));
  check("자료 없는 동네", "한계에 사유와 '점수 미계산' 안내", rNo.limits.some((l) => l.includes("99999999")) && rNo.limits.some((l) => l.includes("점수는 계산하지 않았습니다")));
}

run().then(() => {
  const groups = [...new Set(results.map((r) => r.group))];
  const pass = results.filter((r) => r.ok).length;
  out.innerHTML = `<h2 class="${pass === results.length ? "ok" : "ng"}">${pass} / ${results.length} 통과</h2>` + groups.map((g) => `<h3>${g}</h3>` + results.filter((r) => r.group === g).map((r) => `<div class="r ${r.ok ? "ok" : "ng"}">${r.ok ? "✔" : "✖"} ${r.name}<small>${r.detail}</small></div>`).join("")).join("");
}).catch((e) => { out.innerHTML = `<div class="r ng">검증 실행 오류: ${e.message}</div>`; });
