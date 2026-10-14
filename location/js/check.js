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
import { toCloudItem, mergeLists, docId } from "./sync.js";
import { authErrorMessage } from "./auth.js";
import { meHtml as meView, storeCardHtml, storeListHtml } from "./ui.js";
import { toStore } from "./kmap.js";

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
  // 11. 로그인 · 계정 동기화 (네트워크 없이 계산 부분만)
  const itemA = { key: "연남동|cafe", place: { name: "연남동", gu: "11440", guName: "마포구", dongCode: "1144071000", lat: 37.56, lng: 126.92, source: "kakao" }, industryKey: "cafe", industryName: "카페", total: 58, grade: "신중 검토", at: 100 };
  const itemMe = { key: "자양4동|cafe|me", place: { name: "자양4동", gu: "11215", guName: "광진구", dongCode: "1121571000", lat: 37.540412, lng: 127.069233, isCurrent: true, source: "kakao" }, industryKey: "cafe", industryName: "카페", total: 51, grade: "재검토", at: 300 };
  const cloudMe = toCloudItem(itemMe);
  check("계정 동기화", "현재 위치 항목은 정확한 좌표 · 현재위치 표시를 계정에 올리지 않음", cloudMe.place.lat === undefined && cloudMe.place.lng === undefined && cloudMe.place.isCurrent === undefined && cloudMe.place.name === "자양4동" && !JSON.stringify(cloudMe).includes("37.54"));
  check("계정 동기화", "일반 검색 항목은 좌표 유지 · 필요한 필드만 올림", toCloudItem(itemA).place.lat === 37.56 && Object.keys(toCloudItem({ ...itemA, extra: "x", secret: "y" })).sort().join() === "at,grade,industryKey,industryName,key,place,total");
  const mg = mergeLists([{ key: "a", at: 5 }, { key: "b", at: 1 }], [{ key: "a", at: 9 }, { key: "c", at: 3 }], 2);
  check("계정 동기화", "합치기: 같은 key 는 더 최근 것, 최근순 · 개수 제한", mg.merged.map((i) => i.key + i.at).join() === "a9,c3" && mg.dropped.join() === "b");
  check("계정 동기화", "합치기: 한쪽이 비어도 동작", mergeLists([], [{ key: "x", at: 1 }], 3).merged.length === 1 && mergeLists([{ key: "y", at: 1 }], [], 3).merged.length === 1 && mergeLists([], [], 3).merged.length === 0);
  check("계정 동기화", "문서 id 에 '/' 없음", !docId("a/b|c").includes("/"));
  check("로그인 오류", "팝업 닫기는 조용히, 나머지는 안내 문장 (미설정 프로젝트 포함)", authErrorMessage({ code: "auth/popup-closed-by-user" }) === null && ["auth/popup-blocked", "auth/operation-not-allowed", "auth/configuration-not-found", "auth/unauthorized-domain", "auth/network-request-failed", "x"].every((c) => (authErrorMessage({ code: c }) || "").length > 5));
  const meOut = meView({ saved: [], theme: "", autoLocate: true, user: null, authOk: true });
  const meIn = meView({ saved: [], theme: "", autoLocate: true, user: { uid: "u", name: "홍길동", email: "a@b.c", photo: "" }, authOk: true });
  const meOff = meView({ saved: [], theme: "", autoLocate: true, user: null, authOk: false });
  check("로그인 화면", "내 분석: 로그아웃 상태엔 로그인 버튼, 로그인 상태엔 이름 · 로그아웃 버튼", meOut.includes("data-signin") && !meOut.includes("data-signout") && meIn.includes("data-signout") && meIn.includes("홍길동") && !meIn.includes("data-signin"));
  check("로그인 화면", "SDK 를 못 불러온 상태: 안내만 (버튼 없음) · undefined 없음", !meOff.includes("data-signin") && meOff.includes("불러오지 못했어요") && ![meOut, meIn, meOff].some((h) => /undefined|NaN|\[object/.test(h)));
  check("로그인 화면", "표시 이름의 HTML 은 이스케이프됨", !meView({ saved: [], user: { uid: "u", name: "<img src=x onerror=alert(1)>", email: "e", photo: "" }, authOk: true }).includes("<img src=x"));
  // 12. 점포 상세 카드 (지도에서 점포를 눌렀을 때)
  const kd = { id: "123", place_name: "수제버거집 <b>", category_name: "음식점 > 양식 > 햄버거", road_address_name: "서울 강남구 광평로51길 1", address_name: "수서동 1", phone: "02-123-4567", place_url: "http://place.map.kakao.com/123", x: "127.1", y: "37.4", distance: "182" };
  const st = toStore(kd);
  check("점포 상세", "Kakao 장소 → 점포 정보 변환 (도로명 주소 우선, 숫자형 좌표 · 거리)", st.address === "서울 강남구 광평로51길 1" && st.lat === 37.4 && st.lng === 127.1 && st.dist === 182 && st.phone === "02-123-4567" && st.url.includes("place.map.kakao.com"));
  const card = storeCardHtml(st, ind);
  check("점포 상세", "카드: 이름 · 업종 분류 · 주소 · 전화 · 거리 · 카카오맵/길찾기 링크", ["수제버거집", "양식", "햄버거", "광평로51길", "tel:021234567", "약 182m", "카카오맵에서 보기", "길찾기"].every((w) => card.includes(w)));
  check("점포 상세", "점포 이름의 HTML 은 이스케이프됨", !card.includes("수제버거집 <b>") && card.includes("수제버거집 &lt;b&gt;"));
  const evil = storeCardHtml({ ...st, url: "javascript:alert(1)", phone: "<script>x</script>" }, ind);
  check("점포 상세", "카카오맵 주소가 아닌 링크 · 이상한 전화번호는 쓰지 않음", !evil.includes("javascript:") && !evil.includes("<script>") && !evil.includes("카카오맵에서 보기"));
  const demoCard = storeCardHtml({ name: "카페 1", lat: 37.5, lng: 127, dist: 120 }, ind);
  check("점포 상세", "예시 점포는 예시라고 알리고 외부 링크를 만들지 않음", demoCard.includes("예시 점포") && !demoCard.includes("href=") && demoCard.includes("120m"));
  const list = storeListHtml(Array.from({ length: 60 }, (_, i) => ({ ...st, name: "점포" + i, dist: i * 5 })));
  check("점포 상세", "점포 목록: 가까운 순 40곳 · 순번이 마커 순번과 일치", (list.match(/data-store="/g) || []).length === 40 && list.includes('data-store="0"') && list.includes('data-store="39"') && !list.includes('data-store="40"'));
  const dc = demoCompetitors(DEMO_PLACES[0], ind);
  check("점포 상세", "예시 점포는 가까운 순으로 정렬됨", dc.items.every((x, k) => k === 0 || dc.items[k - 1].dist <= x.dist));
}

run().then(() => {
  const groups = [...new Set(results.map((r) => r.group))];
  const pass = results.filter((r) => r.ok).length;
  out.innerHTML = `<h2 class="${pass === results.length ? "ok" : "ng"}">${pass} / ${results.length} 통과</h2>` + groups.map((g) => `<h3>${g}</h3>` + results.filter((r) => r.group === g).map((r) => `<div class="r ${r.ok ? "ok" : "ng"}">${r.ok ? "✔" : "✖"} ${r.name}<small>${r.detail}</small></div>`).join("")).join("");
}).catch((e) => { out.innerHTML = `<div class="r ng">검증 실행 오류: ${e.message}</div>`; });
