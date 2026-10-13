// 엔진 검증 페이지: 자료 형식 · 점수 · 문장 규칙을 한 번에 점검한다. (개발용, 배포 제외)
import { INDUSTRIES, EXTRA_INDUSTRIES, EXTRA_GROUPS, BASELINE_PROFILES, industryByKey, makeCustomIndustry, DEMO_PLACES, GU, AGE_GROUPS } from "./area-data.js";
import { parseQuery, nearestDemo, placeKey } from "./place.js";
import { loadSample, demoCompetitors, popFromSample } from "./fetchers.js";
import { computeMetrics } from "./metrics.js";
import { percentile, competitionScore, buildBaseline, computeScore } from "./score.js";
import { ITEMS, FORBIDDEN } from "./score-rules.js";
import { buildReport, reportLines } from "./report.js";
import { searchSplit, distanceM } from "./split-search.js";
import { buildBaselines } from "../collector/baseline.js";
import { explainHtml } from "./explain.js";

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
  check("기준 분포", "행정동 수 · 업종(세부·직접입력 포함) 프로필별 분포", bl.n === 25 && Object.keys(bl.industries).length === BASELINE_PROFILES.length, `n=${bl.n}, 프로필 ${Object.keys(bl.industries).length}개`);
  check("기준 분포", "업종별 3개 배열 · 오름차순 정렬", BASELINE_PROFILES.every((i) => ["customer", "size", "growth"].every((k) => { const a = bl.industries[i.key][k]; return a.length === 25 && a.every((v, n) => n === 0 || a[n - 1] <= v); })));
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
  // 9. 점수 산출 근거 설명: 모든 항목 · 종합이 깨지지 않고, 새 숫자를 만들어 내지 않는다
  const full = { place: DEMO_PLACES[0], industry: ind, pop: dPop, comp, metrics: computeMetrics(dPop, ind, comp), score: dScore, baseline: dBase };
  const keys = ["customer", "size", "competition", "rent", "growth", "total"];
  const htmls = keys.map((k) => explainHtml(full, k));
  check("점수 설명", "자료 있는 동네: 6개 설명 모두 생성 · undefined/NaN 없음", htmls.every((h) => h.length > 40 && !/undefined|NaN|\[object/.test(h)), htmls.map((h) => h.length).join("/"));
  check("점수 설명", "종합 설명에 각 항목의 기여 점수 합이 종합과 일치", (() => { const sum = dScore.items.filter((i) => i.score != null).reduce((a, i) => a + i.score * i.effWeight, 0); return Math.abs(sum - dScore.total) <= 0.5; })(), `${dScore.total}점`);
  check("점수 설명", "경쟁 설명에 현재 구간이 강조됨(on)", explainHtml(full, "competition").includes("band on"));
  check("점수 설명", "임대료: 자료 없음 이유와 비중 재배분 설명", explainHtml(full, "rent").includes("제외") && explainHtml(full, "rent").includes("다시 나뉘"));
  const noPopFull = { place: DEMO_PLACES[0], industry: ind, pop: null, comp, metrics: mNo, score: sNo, baseline: null };
  const noPopHtmls = keys.map((k) => explainHtml(noPopFull, k));
  check("점수 설명", "자료 없는 동네: 6개 설명도 오류 없이 생성", noPopHtmls.every((h) => h.length > 20 && !/undefined|NaN|\[object/.test(h)));
  // 10. 세부 업종 · 직접 입력 · 현재 위치
  const all = [...INDUSTRIES, ...EXTRA_INDUSTRIES];
  check("세부 업종", `업종 키 중복 없음 (${all.length}개)`, new Set(all.map((i) => i.key)).size === all.length);
  check("세부 업종", "목표 고객 비중 합 = 1 · 영업 시간 있음", EXTRA_INDUSTRIES.every((i) => Math.abs(Object.values(i.target).reduce((a, b) => a + b, 0) - 1) < 1e-9 && i.hours.length > 0));
  check("세부 업종", "경쟁 구간표: 점수 내림차순 · 경계 오름차순", EXTRA_INDUSTRIES.every((i) => i.bands.every((b, k) => k === 0 || (b[1] <= i.bands[k - 1][1] && b[0] > i.bands[k - 1][0]))));
  check("세부 업종", "검색 방식(카테고리/키워드) 지정", EXTRA_INDUSTRIES.every((i) => i.kakao.category || i.kakao.keyword));
  check("세부 업종", "메뉴 묶음의 모든 키가 존재", EXTRA_GROUPS.every((g) => g.keys.every((k) => EXTRA_INDUSTRIES.some((i) => i.key === k))));
  check("세부 업종", "모든 세부 업종에 기준 분포 프로필 있음 (+ 직접 입력용 custom)", EXTRA_INDUSTRIES.every((i) => BASELINE_PROFILES.some((p) => p.key === i.key)) && BASELINE_PROFILES.some((p) => p.key === "custom"));
  const q2 = [["연남동 한식", "korean"], ["합정동 약국", "pharmacy"], ["성수동 빵집", "bakery"], ["망원동 피트니스", "gym"]];
  check("세부 업종", "검색어로 세부 업종 인식", q2.every(([t, k]) => parseQuery(t).industry?.key === k), q2.map(([t]) => parseQuery(t).industry?.key).join(","));
  const cu = makeCustomIndustry("마라탕");
  check("직접 입력", "키 왕복(인코딩) · 검색 키워드 · 일반 프로필", industryByKey(cu.key).name === "마라탕" && industryByKey(cu.key).kakao.keyword === "마라탕" && cu.baseKey === "custom" && industryByKey("custom:%EB%A7%88%EB%9D%BC%ED%83%95").name === "마라탕");
  check("직접 입력", "키에 '/' 가 없어 주소(#)로 안전", !industryByKey("custom:" + encodeURIComponent("a/b")).key.includes("/"));
  // 직접 입력 업종도 점수 · 리포트가 깨지지 않는다
  const cPop = pops[0], cComp = demoCompetitors(DEMO_PLACES[0], cu), cM = computeMetrics(cPop, cu, cComp);
  const cS = computeScore(cM, cu, { level: "dong", ...bl.industries.custom }, cPop, null);
  const cR = buildReport({ place: DEMO_PLACES[0], industry: cu, pop: cPop, comp: cComp, metrics: cM, score: cS, baseline: { level: "dong" } });
  check("직접 입력", "점수 · 리포트 생성 (금지어 없음, 문장마다 근거)", cS.total != null && !reportLines(cR).some((l) => FORBIDDEN.some((w) => l.includes(w))) && [...cR.strengths, ...cR.risks, ...cR.strategies].every((x) => x.ev), `${cS.total}점`);
  check("현재 위치", "가장 가까운 예시 행정동(5km 안) · 먼 곳은 없음", nearestDemo(37.5640, 126.9225)?.name === "연남동" && nearestDemo(35.1, 129.0) === null);
  check("현재 위치", "내 위치 분석은 같은 동 검색과 캐시 키가 다름", placeKey({ name: "연남동", isCurrent: true }, ind) !== placeKey({ name: "연남동" }, ind));
}

run().then(() => {
  const groups = [...new Set(results.map((r) => r.group))];
  const pass = results.filter((r) => r.ok).length;
  out.innerHTML = `<h2 class="${pass === results.length ? "ok" : "ng"}">${pass} / ${results.length} 통과</h2>` + groups.map((g) => `<h3>${g}</h3>` + results.filter((r) => r.group === g).map((r) => `<div class="r ${r.ok ? "ok" : "ng"}">${r.ok ? "✔" : "✖"} ${r.name}<small>${r.detail}</small></div>`).join("")).join("");
}).catch((e) => { out.innerHTML = `<div class="r ng">검증 실행 오류: ${e.message}</div>`; });
