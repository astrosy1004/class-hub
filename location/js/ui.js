// 화면 그리기: 분석 결과 · 상태를 받아 HTML 문자열을 돌려준다 (이벤트 처리는 main.js).
import { AGE_GROUPS, INDUSTRIES, EXTRA_INDUSTRIES, EXTRA_GROUPS, POPULAR_AREAS, industryByKey } from "./area-data.js";
import { parseQuery } from "./place.js";
import { confidenceOf, itemWord } from "./confidence.js";
import { ITEMS, DISCLAIMER } from "./score-rules.js";
import { fmtPct, fmtAgePct, fmtMan, monthLabel } from "./metrics.js";
import { lineChart, hourBars, stackBars, heatmap, donut, radar } from "./charts.js";
import { CONFIG } from "./config.js";
import { popMode } from "./fetchers.js";
import { fmtRentUnit } from "./rent.js";
import { kakaoState } from "./kmap.js";

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const when = (ts) => {
  const d = Math.floor((Date.now() - ts) / 86400000);
  return d <= 0 ? "오늘" : d === 1 ? "어제" : `${d}일 전`;
};
const hashOf = (view, a) => `#${view}/${encodeURIComponent(a.place.name)}/${a.industry.key}`;
const itemColor = ["var(--c2)", "var(--c3)", "var(--warn)", "var(--now)", "var(--c4)"];
const brandMark = `<img class="brand-mark" src="./assets/jarijapso-logo.png" alt="자리잡소 로고">`;

// 기준일 · 출처 · 단위 표기 (모든 결과 화면 하단)
function sourceFoot(a) {
  const { pop, comp } = a;
  if (!pop) return `<div class="foot">생활인구: 자료 없음<br>경쟁 점포: ${esc(comp.source)}</div>`;
  const unit = pop.level === "gu" ? "자치구 단위" : "행정동 단위";
  return `<div class="foot">생활인구: ${esc(pop.source || "서울 열린데이터광장")} · ${unit} · 기준일 ${esc(pop.asOf)}<br>경쟁 점포: ${esc(comp.source)}<br>생활인구는 방문객 · 구매자 · 매출과 다른 개념입니다</div>`;
}
const modeBanner = () => (popMode() === "sample"
  ? `<div class="banner soft">예시 자료로 계산한 결과예요. 동 단위 생활인구가 연결되면 실제 값으로 바뀌어요.</div>`
  : "") + (kakaoState.error ? `<div class="banner">${kakaoState.error}</div>` : "");

// eyebrow: 제목 위 작은 표시 (결과 화면에서 "분석 결과"임을 알려 준다)
export function head(title, { back = true, backHref = "#home", backLabel = "홈으로", right = "", eyebrow = "" } = {}) {
  const t = eyebrow ? `<div class="head-t"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2></div>` : `<h2>${title}</h2>`;
  return `<div class="head">${back ? `<a class="ib" href="${backHref}" aria-label="${backLabel}">‹</a>` : ""}${t}${right}</div>`;
}
const RESULT_MARK = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16"/><path d="M7 16v-5M12 16V7M17 16v-8"/></svg>`;
const resultEyebrow = (a, sub = "", label = "분석 결과") => `${RESULT_MARK}${label}${sub ? ` · ${esc(sub)}` : ""}`;
const placeLine = (a) => `${a.place.name} ${a.industry.name}`;

// 자세히 보기 단계 메뉴: 아이콘 + 이름 (지금 화면은 채운 아이콘)
const SUB_ICONS = {
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  result: '<path d="M4 15a8 8 0 1 1 16 0"/><path d="m12 15 4-5"/><path d="M4 19h16"/>',
  analysis: '<path d="M4 20h16"/><path d="M7 16v-5M12 16V7M17 16v-8"/>',
  trend: '<path d="m4 17 5-5 4 3 7-8"/><path d="M15 7h5v5"/>',
  report: '<path d="M5 5h14v10H9l-4 4z"/><path d="M12 8v4M10 10h4"/>',
};
const subIcon = (k) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${SUB_ICONS[k]}</svg>`;
export function subnav(a, active) {
  return `<nav class="subnav" aria-label="자세히 보기 단계">${FLOW.map(([v, t]) => `<a href="${hashOf(v, a)}" class="${v === active ? "on" : ""}" ${v === active ? 'aria-current="step"' : ""}><span class="si">${subIcon(v)}</span>${t}</a>`).join("")}</nav>`;
}

// ── 홈 ──────────────────────────────────────────
// 더보기 드롭다운 (1단계 카드 안에서 펼쳐짐): 묶음 제목 + 업종 이름 · 비교 대상 한 줄씩, 맨 아래 직접 입력
// 위 타일에 이미 있는 업종(미용실 · 베이커리)은 다시 보여주지 않는다
const moreGroups = () => EXTRA_GROUPS.map((g) => ({ ...g, keys: g.keys.filter((k) => !TILE_KEYS.includes(k)) }));
function morePanelHtml(industryKey) {
  const cur = industryByKey(industryKey);
  const row = (i) => { const on = i.key === industryKey; return `<button type="button" class="dd-row ${on ? "on" : ""}" role="option" aria-selected="${on}" data-ind="${i.key}"><b>${esc(i.name)}</b><span>${esc((i.alias || []).join(" · "))}</span>${on ? icon("check") : ""}</button>`; };
  return `<div class="dd-list" id="morePanel" role="listbox" aria-label="더 많은 업종">
    ${moreGroups().map((g) => `<div class="dd-group"><div class="dd-h">${esc(g.title)}</div>${g.keys.map((k) => row(industryByKey(k))).join("")}</div>`).join("")}
    <form class="dd-group dd-custom" id="customForm" autocomplete="off"><div class="dd-h">찾는 업종이 없나요?</div>
      <div class="dd-in"><label class="place-in"><input id="customInd" type="text" placeholder="직접 입력 (예: 마라탕, 필라테스)" maxlength="20" aria-label="업종 직접 입력" value="${cur.custom ? esc(cur.name) : ""}"></label><button type="submit" class="more-apply">적용</button></div>
      <div class="more-hint">직접 넣은 업종은 이름으로 점포를 검색하고, 일반적인 고객 구성으로 점수를 계산해요.</div></form>
  </div>`;
}

// 1단계 업종 타일 (나머지는 "더보기"의 세부 업종 메뉴) · 타일 아이콘(선 아이콘, 없으면 업종 이모지)
const TILE_KEYS = ["cafe", "restaurant", "bar", "cvs", "hospital", "salon", "bakery"];
const ICON_PATHS = {
  cafe: '<path d="M5 8h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 9h2a2 2 0 0 1 0 4h-2"/><path d="M8 3v2M11 3v2"/>',
  restaurant: '<path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 3c-2 2-2 6 0 8v10"/>',
  bar: '<path d="M6 3h12l-6 8z"/><path d="M12 11v9M8 21h8"/>',
  cvs: '<path d="M4 9l1.5-5h13L20 9z"/><path d="M5 9v11h14V9"/><path d="M10 20v-5h4v5"/>',
  hospital: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
  salon: '<circle cx="6" cy="7" r="2.5"/><circle cx="6" cy="17" r="2.5"/><path d="M8 8.5 20 18M8 15.5 20 6"/>',
  bakery: '<path d="M5 11a4 4 0 0 1 2-7.5c2 0 3 1 5 1s3-1 5-1A4 4 0 0 1 19 11v8H5z"/>',
  korean: '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M9 7c0-1 1-1 1-2M14 7c0-1 1-1 1-2"/>',
  chinese: '<path d="M5 9h14l-2 11H7z"/><path d="M8 9 7 4M16 9l1-5"/>',
  japanese: '<path d="M3 12c3-5 10-5 14 0-4 5-11 5-14 0z"/><path d="m17 12 4-3v6z"/>',
  western: '<path d="M7 3v18M5 3v5a2 2 0 0 0 4 0V3"/><path d="M17 21V3c-2 1-3 4-3 8h3"/>',
  snack: '<path d="M4 20 20 4"/><circle cx="9" cy="15" r="2"/><circle cx="13" cy="11" r="2"/><circle cx="17" cy="7" r="2"/>',
  chicken: '<path d="M14 4a6 6 0 0 1 6 6c0 4-4 6-7 5l-4 4a2 2 0 1 1-3-3l4-4c-1-3 1-8 4-8z"/>',
  gym: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  pharmacy: '<path d="M10.5 20.5a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7z"/><path d="m8.5 8.5 7 7"/>',
  laundry: '<path d="M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z"/>',
  academy: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  realty: '<path d="M4 10.5 12 4l8 6.5V20H4z"/><path d="M10 20v-6h4v6"/>',
  karaoke: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  pcroom: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  custom: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>',
  more: '<path d="M12 5v14M5 12h14"/>',
  fold: '<path d="m6 15 6-6 6 6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
};
const icon = (k) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICON_PATHS[k]}</svg>`;
const indIcon = (ind) => (ICON_PATHS[ind.key] ? icon(ind.key) : ind.custom ? icon("custom") : `<span class="emo" aria-hidden="true">${esc(ind.icon)}</span>`);

// 하단 분석 버튼 문구: 지역 입력 전에는 잠금, 입력하면 "연남동 · 카페 분석하기" (검색어에 업종이 있으면 그 업종)
export function homeCtaLabel(q, industryKey) {
  const p = parseQuery(q || "");
  const place = p.placeText || (q || "").trim();
  if (!place) return { text: "지역을 고르면 분석할 수 있어요", ready: false };
  return { text: `${place} · ${(p.industry || industryByKey(industryKey)).name} 분석하기`, ready: true };
}

export function homeHtml({ recent, industryKey, error, moreOpen = false, q = "", locating = false }) {
  const cur = industryByKey(industryKey);
  const inTiles = TILE_KEYS.includes(cur.key);
  const tiles = TILE_KEYS.map((k) => industryByKey(k));
  const cta = homeCtaLabel(q, industryKey);
  return `
  <div class="brand-head"><a class="brand-logo" href="./intro.html" aria-label="자리잡소 소개 보기">${brandMark}</a><span class="trust-badge">2단계면 끝나요</span></div>
  <h1 class="step-title">어떤 가게를, 어디에서<br>시작하시나요?</h1>
  ${modeBanner()}
  <section class="step done" aria-labelledby="st1">
    <div class="step-h"><span class="step-n ok">${icon("check")}</span><h2 id="st1">업종 선택</h2><span class="cap">${esc(cur.name)} 선택됨</span></div>
    <div class="tiles" id="indChips">${tiles.map((i) => `<button type="button" class="tile ${i.key === cur.key ? "on" : ""}" data-ind="${i.key}" aria-pressed="${i.key === cur.key}">${indIcon(i)}${esc(i.name)}</button>`).join("")}<button type="button" class="tile more ${moreOpen ? "open" : ""} ${!inTiles ? "on" : ""}" data-more aria-haspopup="listbox" aria-expanded="${moreOpen}" aria-controls="morePanel"><span class="dd-label">${!inTiles ? esc(cur.name) : "더보기"}</span><svg class="ico dd-caret" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>
    ${!inTiles && !moreOpen && cur.alias?.length ? `<div class="more-hint">${esc(cur.name)} · ${esc(cur.alias.join(", "))} 점포와 비교해요</div>` : ""}
    ${moreOpen ? morePanelHtml(industryKey) : ""}
  </section>
  <section class="step active" aria-labelledby="st2">
    <div class="step-h"><span class="step-n">2</span><h2 id="st2">지역 선택</h2></div>
    <form class="place-in" id="searchForm" autocomplete="off">${icon("search")}
      <input id="q" type="search" placeholder="동 이름 검색 (예: 연남동)" aria-label="지역 검색" enterkeyhint="search" value="${esc(q)}">
    </form>
    <button type="button" class="locate-line" data-locate ${locating ? "disabled" : ""}>${icon("locate")}현재 위치로 선택</button>
    <div class="cap area-cap">자주 찾는 지역</div>
    <div class="areas">${POPULAR_AREAS.map((r) => `<button type="button" class="area" data-area="${esc(r.name)}">${esc(r.name)} <span>${esc(r.gu)}</span></button>`).join("")}</div>
  </section>
  <div id="progress"></div>
  ${error ? `<div class="err-box">${esc(error)}</div>` : ""}
  <div class="card"><h3>최근 검색${recent.length ? ` <button type="button" class="explain-link rc-clear" data-recent-clear style="margin:0 0 0 auto">전체 지우기</button>` : ""}</h3>${recent.length ? recent.map((r) => `
    <div class="li rc"><a class="rc-l" href="#result/${encodeURIComponent(r.place.name)}/${r.industryKey}"><div class="score-dot">${r.total ?? "-"}</div><b>${esc(r.place.name)} ${esc(r.industryName)}<small>${esc(r.grade || "점수 없음")} · ${when(r.at)}</small></b></a><button type="button" class="cand-x" data-recent-del="${esc(r.key)}" aria-label="${esc(r.place.name)} ${esc(r.industryName)} 검색 기록 지우기">✕</button></div>`).join("") : `<div class="empty">아직 검색 기록이 없어요</div>`}</div>
  <div class="foot">${DISCLAIMER}</div>
  <div class="home-cta"><button type="submit" form="searchForm" id="homeCta" ${cta.ready ? "" : "disabled"}>${esc(cta.text)}</button></div>`;
}

export function progressHtml(steps) {
  const done = steps.filter((s) => s.state === "done" || s.state === "skip").length;
  return `<div class="card"><h3>분석 진행 <span class="chip ${steps.some((s) => s.state === "err") ? "now" : ""}">${done}/${steps.length}</span></h3>
  <div class="prog"><i style="width:${(done / steps.length) * 100}%"></i></div>
  <div class="steps">${steps.map((s) => `<div class="${s.state}">${s.state === "done" ? "✔" : s.state === "skip" ? "–" : s.state === "err" ? "✖" : s.state === "run" ? "◔" : "○"} ${esc(s.name)}${s.state === "skip" ? " (자료 없음 · 지도는 계속 보여드려요)" : ""}</div>`).join("")}</div></div>`;
}

// ── 분석 결과(답 먼저) → 지도 · 데이터 분석 · 통계 · AI 의견 ─────────────
// 후보 담기: 제목 오른쪽 별 (담으면 채운 별)
const SHARE_ICO = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>`;
const shareBtn = `<button type="button" class="ib" data-share aria-label="결과 링크 공유">${SHARE_ICO}</button>`;
const saveBtn = (saved) => `<button class="ib save-star ${saved ? "on" : ""}" id="saveBtn" aria-label="후보지에 담기" aria-pressed="${saved}">${saved ? "★" : "☆"}</button>`;
const noPopBanner = (a) => (a.pop ? "" : `<div class="banner">이 지역은 생활인구 자료가 없어 지도와 경쟁 점포만 보여드려요.${a.popError ? `<br><span style="font-weight:500">${esc(a.popError)}</span>` : ""}</div>`);
const josa = (w, x, y) => { const c = String(w).charCodeAt(String(w).length - 1); return w + (c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? x : y); };
// "술집으로" · "카페로" (받침 없거나 ㄹ 받침이면 "로")
const roJosa = (w) => { const c = String(w).charCodeAt(String(w).length - 1); const j = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 : 0; return w + (j && j !== 8 ? "으로" : "로"); };

// 자세히 보기 4단계 (순서대로 이어 봄)
const FLOW = [["map", "지도"], ["analysis", "데이터 분석"], ["trend", "통계"], ["report", "AI 의견"]];

// 결과 화면 "왜 이런 결과인가요?": 항목 점수를 쉬운 말로 (좋음 ≥ 60 · 주의 < 50)
const REASON = {
  customer: ["손님층이 {ind} 잘 맞아요", "손님층이 {ind} 잘 맞지 않아요", "손님층은 {ind} 보통으로 맞아요"],
  size: ["오가는 사람이 많은 편이에요", "오가는 사람이 적은 편이에요", "오가는 사람은 보통 수준이에요"],
  competition: ["근처 경쟁 가게가 적은 편이에요", "근처에 경쟁 가게가 많아요", "경쟁 가게는 보통 수준이에요"],
  rent: ["임대료 부담이 적은 편이에요", "임대료 부담이 큰 편이에요", "임대료 부담은 보통이에요"],
  growth: ["최근 사람이 늘고 있어요", "최근 사람이 줄고 있어요", "최근 사람 수는 비슷해요"],
};
function reasonSub(a, it) {
  const m = a.metrics;
  const topAge = a.pop ? AGE_GROUPS.find((g) => g.key === m.topAge) : null;
  const extra = {
    customer: topAge ? `주요 고객 ${topAge.name} ${fmtAgePct(m.age[m.topAge])}` : "",
    size: a.pop ? `영업시간 중 평일 ${m.openPeakHour}시가 가장 붐벼요` : "",
    competition: `반경 ${CONFIG.RADIUS_M}m ${a.comp.count}${a.comp.capped ? "곳+" : "곳"}`,
    rent: a.rent?.burden != null ? `예상 매출의 ${Math.round(a.rent.burden * 100)}%` : "",
    growth: a.pop ? `직전 3개월 대비 ${fmtPct(m.growth)}` : "",
  }[it.key];
  return extra || `${it.short} ${it.score}점`;
}
// 좋은 항목 1개 → 주의 항목(낮은 순) → 나머지로 3개를 채운다
function pickReasons(items) {
  const scored = items.filter((i) => i.score != null);
  const good = scored.filter((i) => i.score >= 60).sort((x, y) => y.score - x.score);
  const bad = scored.filter((i) => i.score < 50).sort((x, y) => x.score - y.score);
  const out = [...good.slice(0, 1), ...bad, ...good.slice(1), ...scored.filter((i) => i.score >= 50 && i.score < 60)];
  return out.slice(0, 3).map((it) => ({ it, kind: it.score >= 60 ? "good" : it.score < 50 ? "bad" : "mid" }));
}

const HEADLINE = { "추천": "이 자리, 해볼 만해요", "조건부 추천": "조건을 확인하면<br>해볼 만해요", "신중 검토": "장단점을 따져 보고<br>신중히 정하세요", "재검토": "지금은 다른 후보와<br>함께 비교해 보세요" };
// 반원 게이지 (pathLength 100 = 100점)
const gauge = (v) => `<svg class="gauge" viewBox="0 0 120 66" role="img" aria-label="입지 적합도 ${v ?? "없음"}${v == null ? "" : "점, 100점 만점"}"><path class="g-bg" d="M10 60a50 50 0 0 1 100 0" pathLength="100"/>${v == null ? "" : `<path class="g-fg" d="M10 60a50 50 0 0 1 100 0" pathLength="100" stroke-dasharray="${v} 100"/>`}</svg>`;

// 분석 결과: 답(점수 · 등급 · 신뢰도) → 이유 3개 → 다음에 할 일 → 지도로 자세히 보기(1단계 지도로 바로)
export function resultHtml(a, saved) {
  const { score } = a;
  const grade = score.grade;
  const conf = confidenceOf(a);
  const scored = score.items.filter((i) => i.score != null);
  const worst = scored.length ? scored.reduce((x, y) => (y.score < x.score ? y : x)) : null;
  const reasons = pickReasons(score.items);
  const ind = a.industry.name;
  const mark = { good: icon("check"), bad: "!", mid: "·" };
  return `
  ${head(`${esc(a.place.name)} · ${esc(ind)}`, { eyebrow: resultEyebrow(a, a.pop?.asOf ? `기준일 ${a.pop.asOf}` : ""), right: `<span class="head-r">${shareBtn}${saveBtn(saved)}</span>` })}
  ${modeBanner()}
  ${noPopBanner(a)}
  <section class="answer" aria-label="분석 결론">
    <p class="an-q">이 자리, ${esc(roJosa(ind))} 괜찮을까요?</p>
    <h3 class="an-h">${grade ? HEADLINE[grade.name] : "자료가 부족해<br>점수를 내지 못했어요"}</h3>
    <div class="an-row">
      <div class="an-g ${grade?.cls || ""}">${gauge(score.total)}<b>${score.total ?? "-"}<small>점</small></b></div>
      <div class="an-b">${grade ? `<span class="v-grade ${grade.cls}">${grade.name}</span>` : `<span class="v-grade warn">점수 없음</span>`}
        <button type="button" class="v-conf ${conf.level}" data-conf aria-expanded="false" aria-controls="confBox">신뢰도 ${conf.name} · 왜요? ›</button>
        <span class="an-cap">${score.total == null ? "점수에 쓸 자료가 부족해요" : `${score.used}개 항목으로 계산했어요`}</span></div>
    </div>
    <div class="an-meter" role="img" aria-label="등급 기준 막대, 현재 ${score.total ?? "없음"}${score.total == null ? "" : "점"}">
      <div class="am-bar"><i class="z-now"></i><i class="z-warn"></i><i class="z-ok"></i><i class="z-up"></i>${score.total == null ? "" : `<b class="am-pin" style="left:${Math.min(98, Math.max(2, score.total))}%"></b>`}</div>
      <div class="am-lab"><span style="left:0">0</span><span style="left:55%">55</span><span style="left:70%">70</span><span style="left:85%">85</span><span style="right:0">100</span></div>
      <div class="am-zone"><span style="width:55%">재검토</span><span style="width:15%">신중</span><span style="width:15%">조건부</span><span style="width:15%">추천</span></div>
    </div>
    <ul class="an-chips" aria-label="항목별 점수">${score.items.map((it) => { const w = itemWord(it.score); return it.score == null ? `<li class="na"><span>${it.short}</span><b>-</b></li>` : `<li class="${w.cls || ""}"><span>${it.short}</span><b>${it.score}</b></li>`; }).join("")}</ul>
    <div class="v-conf-box" id="confBox" hidden>
      <b>왜 신뢰도 ${conf.name}인가요?</b>
      <ul>${conf.reasons.map((x) => `<li>${esc(x.text)}</li>`).join("")}</ul>
      <span>점수는 현장 조사 전에 후보를 좁히는 참고값이에요. 신뢰도가 낮을수록 현장 확인 비중을 높여 주세요.</span>
    </div>
  </section>
  <section class="card why-card" aria-labelledby="whyH">
    <h3 id="whyH">왜 이런 결과인가요?</h3>
    ${reasons.length ? reasons.map(({ it, kind }) => `<button type="button" class="why" data-explain="${it.key}" data-box="r-${it.key}" aria-expanded="false" aria-controls="r-${it.key}"><span class="why-i ${kind}" aria-hidden="true">${mark[kind]}</span><span class="why-t"><b>${esc(REASON[it.key][kind === "good" ? 0 : kind === "bad" ? 1 : 2].replace("{ind}", josa(ind, "과", "와")))}</b><small>${esc(reasonSub(a, it))}</small></span><span class="why-s ${kind}">${it.score}</span><em class="caret">›</em></button>
    <div class="detail" id="r-${it.key}" hidden></div>`).join("") : `<div class="cap">점수를 낼 자료가 아직 없어요.</div>`}
    <button type="button" class="explain-link" data-allitems aria-expanded="false" aria-controls="allItems">항목별 점수 전체 보기 ›</button>
    <div id="allItems" class="all-items" hidden>
      <h4>항목별 점수 <button type="button" class="explain-link" data-explain="total" aria-expanded="false" style="margin:0">계산 방법 ›</button></h4>
      <div class="detail total" id="d-total" hidden></div>
      ${score.items.map((it, i) => { const w = itemWord(it.score); return `${it.score == null
        ? `<button type="button" class="mini na" data-explain="${it.key}" aria-expanded="false" aria-controls="d-${it.key}"><span>${it.short}</span><span class="cap">${it.key === "rent" ? (a.rent ? "예상 매출을 넣으면 계산돼요" : "매물 월세를 넣으면 계산돼요") : "자료 없음 · 점수에서 제외"}</span><b>-</b><em class="word"></em><em class="caret">›</em></button>`
        : `<button type="button" class="mini" data-explain="${it.key}" aria-expanded="false" aria-controls="d-${it.key}"><span>${it.short}</span><div class="t"><i style="width:${it.score}%;background:${itemColor[i]}"></i></div><b>${it.score}</b><em class="word ${w.cls}">${w.t}</em><em class="caret">›</em></button>`}
      <div class="detail" id="d-${it.key}" hidden></div>`; }).join("")}
    </div>
  </section>
  <section class="card next-card" aria-labelledby="nextH">
    <h3 id="nextH">다음에 할 일</h3>
    <ol class="todo">
      <li><span class="tn">1</span><div><b>${a.pop ? `평일 ${a.metrics.openPeakHour}시 전후에 직접 가 보기` : "영업할 시간대에 직접 가 보기"}</b><small>${worst && worst.score < 60 ? `점수가 가장 낮은 ${esc(josa(worst.short, "을", "를"))} 눈으로 확인해요` : "가게 앞 사람 흐름과 동선을 눈으로 확인해요"}</small></div></li>
      <li><span class="tn">2</span><div>${rentBoxHtml(a)}</div></li>
      <li><span class="tn">3</span><div><b>다른 동네 1~2곳과 비교하기</b><small>${saved ? "후보에 담았어요. 다른 동네도 검색해서 담은 뒤 아래 메뉴 후보 비교에서 봐요" : "오른쪽 위 ☆로 담아 두면 후보 비교에서 나란히 볼 수 있어요"}</small></div></li>
    </ol>
  </section>
  <section class="card ind-card" aria-labelledby="indH">
    <h3 id="indH">같은 동네, 다른 업종은?</h3>
    <div class="cap">${esc(a.place.name)}에서 주요 업종의 입지 점수를 나란히 봐요.</div>
    <button type="button" class="explain-link" data-indcmp aria-expanded="false">업종별 점수 비교하기 ›</button>
    <div id="indCmp" aria-live="polite"></div>
  </section>
  <section class="card go-card" aria-labelledby="goH">
    <h3 id="goH">자세히 보기</h3>
    <nav class="go-row" aria-label="자세히 보기">${FLOW.map(([v, t]) => `<a class="go go-${v}" href="${hashOf(v, a)}"><span class="go-i">${subIcon(v)}</span><b>${t}</b></a>`).join("")}</nav>
  </section>
  <div class="foot" style="margin-top:10px">${DISCLAIMER}</div>`;
}

// 1단계 지도: 지도 크게 · 경쟁 점포 요약 · 점포 목록
export function mapHtml(a) {
  const c = a.comp;
  const compIt = a.score.items.find((i) => i.key === "competition");
  const cw = itemWord(compIt?.score);
  const near = c.items[0] ? `${Math.round(c.items[0].dist) || 0}m` : "-";
  return `
  ${head("상권 지도", { eyebrow: resultEyebrow(a, placeLine(a)), backHref: hashOf("result", a), backLabel: "분석 결과로" })}
  ${subnav(a, "map")}
  ${modeBanner()}
  <section id="mapSec" class="map-sec" aria-label="상권 지도">
    <div class="mapwrap big" id="mapWrap"><div class="map" id="mapBox" aria-label="상권 지도"></div><div class="store-card" id="storeCard" hidden></div>
      <span class="map-chip">반경 ${CONFIG.RADIUS_M}m · ${esc(a.industry.name)} ${c.count}${c.capped ? "곳+" : "곳"}</span></div>
  </section>
  <div class="stats3">
    <div><span>반경 ${CONFIG.RADIUS_M}m</span><b>${c.count}${c.capped ? "곳+" : "곳"}</b></div>
    <div><span>가장 가까운 곳</span><b>${near}</b></div>
    <div><span>경쟁 강도</span><b class="${cw?.cls || ""}">${cw ? cw.t : "-"}</b></div>
  </div>
  <section class="card comp-card" aria-label="경쟁 점포">
    <h3>가까운 ${esc(a.industry.name)}</h3>
    <div class="cap" style="margin-top:4px">지도의 점포를 누르면 상세 정보가 보여요${c.live ? "" : " · 예시 점포예요 (Kakao 키 설정 전)"}</div>
    ${c.items.length ? `<button type="button" class="explain-link" data-stores aria-expanded="false">점포 목록 보기 ›</button><div class="detail" id="storeList" hidden></div>` : ""}
  </section>
  ${sourceFoot(a)}`;
}

// 같은 동네 업종별 점수 순위 (rows: 업종마다 분석 결과, cur: 지금 보는 업종 key)
export function industryCompareHtml(rows, cur) {
  const sorted = [...rows].sort((x, y) => (y.score.total ?? -1) - (x.score.total ?? -1));
  return `<ol class="ind-list">${sorted.map((r, i) => {
    const t = r.score.total, g = r.score.grade;
    return `<li><a class="ind-row ${r.industry.key === cur ? "cur" : ""}" href="${hashOf("result", r)}" ${r.industry.key === cur ? 'aria-current="true"' : ""}><span class="ind-rk">${i + 1}</span><span class="ind-n">${indIcon(r.industry)}<b>${esc(r.industry.name)}</b>${r.industry.key === cur ? `<em>지금 보는 업종</em>` : ""}</span><span class="ind-bar"><i style="width:${t ?? 0}%"></i></span><span class="ind-s ${g?.cls || ""}">${t ?? "-"}</span></a></li>`;
  }).join("")}</ol><div class="cap" style="margin-top:6px">누르면 그 업종의 결과로 가요. 점수는 같은 기준으로 계산한 참고값이에요.</div>`;
}

// 공개 자료 참고: 한국부동산원 상권 평균 임대료 (행정동 자료가 아니라 점수에는 넣지 않는다)
function rentRefHtml(f) {
  if (!f || (!f.near.length && f.sidoAvg == null)) return "";
  const rows = [
    ...f.near.map((x) => `<li><span>${esc(x.n.split(">").slice(1).join(" · "))}</span><b>${esc(fmtRentUnit(x.v))}</b></li>`),
    ...(f.sidoAvg != null ? [`<li><span>${esc(f.sidoName)} 상권 ${f.sidoN}곳 평균</span><b>${esc(fmtRentUnit(f.sidoAvg))}</b></li>`] : []),
    ...(f.national != null ? [`<li><span>전국 평균</span><b>${esc(fmtRentUnit(f.national))}</b></li>`] : []),
  ].join("");
  return `<div class="rent-ref"><div class="rr-h">참고 · 이 동네 소규모 상가 임대료</div><ul>${rows}</ul><small>한국부동산원 ${esc(f.asOf)} · 상권 단위 평균이라 이 동네 매물과 다를 수 있어요 (점수에는 반영하지 않아요)</small></div>`;
}

// 알아본 매물 월세 넣기: 임대료 항목을 사용자의 실제 매물로 채운다 (금액 단위 만원, 이 기기에만 저장)
function rentBoxHtml(a) {
  const r = a.rent?.source === "input" ? a.rent : null;
  const v = (k) => (r && r[k] ? r[k] : "");
  const field = (k, label, hint, req = false) => `<label class="rf"><span>${label}${req ? "" : " <em>선택</em>"}</span><span class="rf-in"><input name="${k}" inputmode="decimal" autocomplete="off" value="${v(k)}" placeholder="0"><i>만원</i></span>${hint ? `<small>${hint}</small>` : ""}</label>`;
  const line = r ? `환산 월 <b>${r.total.toLocaleString("ko-KR")}만원</b>${r.burden != null ? ` · 예상 매출의 <b>${Math.round(r.burden * 100)}%</b>` : " · 예상 매출을 넣으면 점수에 반영돼요"}` : "보증금 · 월세 · 예상 월매출을 넣으면 임대료 점수가 바로 반영돼요";
  return `<div class="rent-box">
    <div class="rb-top"><span class="rb-ico" aria-hidden="true">₩</span><div><b>${r ? "넣은 매물 기준" : "알아본 매물이 있나요?"}</b><span>${line}</span></div>
      <button type="button" class="rb-btn" data-rentopen aria-expanded="false" aria-controls="rentForm">${r ? "고치기" : "월세 넣기"}</button></div>
    ${rentRefHtml(a.rentRef)}
    <form id="rentForm" class="rent-form" hidden>
      <div class="rf-grid">${field("deposit", "보증금", "", true)}${field("monthly", "월세", "", true)}${field("fee", "관리비", "")}${field("sales", "예상 월매출", "모르면 비워 두세요")}</div>
      <div class="rf-note">보증금은 연 12%로 월세에 환산해요. 넣은 값은 이 기기에만 저장돼요.</div>
      <div class="rf-act">${r ? `<button type="button" class="btn ghost" data-rentclear>지우기</button>` : ""}<button type="submit" class="btn">점수에 반영</button></div>
    </form>
  </div>`;
}

// ── 점포 상세 카드 · 점포 목록 ─────────────────────
const safePlaceUrl = (u) => (/^https?:\/\/place\.map\.kakao\.com\//.test(u || "") ? u : "");
const safeTel = (t) => (/^[0-9+\-\s()]{5,20}$/.test(t || "") ? t.trim() : "");
const catTail = (c) => String(c || "").split(">").map((x) => x.trim()).filter(Boolean).slice(-2);

export function storeCardHtml(item, ind) {
  const url = safePlaceUrl(item.url), tel = safeTel(item.phone);
  const real = !!(item.address || item.url || item.category); // Kakao 가 준 정보가 있는 점포
  const route = Number.isFinite(item.lat) && Number.isFinite(item.lng) ? `https://map.kakao.com/link/to/${encodeURIComponent(String(item.name).replace(/[,]/g, " "))},${item.lat},${item.lng}` : "";
  return `<div class="sc-head"><b>${esc(item.name)}</b><button type="button" class="sc-x" data-store-close aria-label="닫기">✕</button></div>
  ${catTail(item.category).length ? `<div class="sc-cats">${catTail(item.category).map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>` : ""}
  <div class="sc-rows">
    ${item.address ? `<div>📍 ${esc(item.address)}</div>` : ""}
    ${tel ? `<div>📞 <a href="tel:${esc(tel.replace(/[^0-9+]/g, ""))}">${esc(tel)}</a></div>` : item.address ? `<div class="cap">📞 전화번호 정보가 없어요</div>` : ""}
    <div>📏 중심에서 약 ${Math.round(item.dist) || 0}m</div>
  </div>
  ${real ? `<div class="sc-act">${url ? `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">카카오맵에서 보기</a>` : ""}${route ? `<a class="btn ghost" href="${esc(route)}" target="_blank" rel="noopener noreferrer">길찾기</a>` : ""}</div>
  <div class="cap" style="margin-top:6px">${esc(ind.name)} 검색 결과예요. 영업 여부 · 정확한 업종은 카카오맵에서 확인하세요.</div>` : `<div class="cap" style="margin-top:6px">예시 점포예요 (Kakao 키를 설정하면 실제 점포 정보가 보여요).</div>`}`;
}

// 가까운 순 점포 목록 (순번 = 지도 마커 순번과 같음)
export function storeListHtml(items, limit = 40) {
  const list = items.slice(0, limit);
  return `<div class="cap" style="margin-bottom:6px">가까운 순 ${list.length}곳 · 누르면 지도에서 보여줘요</div>${list.map((it, i) => `<button type="button" class="store-li" data-store="${i}"><span class="n">${i + 1}</span><span class="nm"><b>${esc(it.name)}</b><small>${esc(catTail(it.category).pop() || "")}</small></span><span class="ds">${Math.round(it.dist) || 0}m</span></button>`).join("")}`;
}

// ── 상권 데이터 분석 ──────────────────────────────
// 생활인구 자료가 없는 동네의 분석 · 추이 화면
function noPopHtml(a, view, title) {
  return `
  ${head(title, { eyebrow: resultEyebrow(a, placeLine(a)), backHref: hashOf("result", a), backLabel: "분석 결과로" })}
  ${subnav(a, view)}
  <div class="card"><div class="empty" style="line-height:1.7">📭 이 지역은 생활인구 자료가 없어<br>시간대 · 연령 · 추이 그래프를 그릴 수 없어요.${a.popError ? `<br><span class="cap">${esc(a.popError)}</span>` : ""}</div>
    <a class="btn ghost" href="${hashOf("map", a)}">지도와 경쟁 점포 보기</a></div>
  ${sourceFoot(a)}`;
}

export function analysisHtml(a, state) {
  if (!a.pop) return noPopHtml(a, "analysis", "상권 데이터 분석");
  const m = a.metrics, pop = a.pop;
  const day = state.hourMode || "weekday";
  const values = day === "weekend" ? pop.weekend : pop.weekday;
  const ageParts = AGE_GROUPS.map((g, i) => ({ name: g.name, value: pop.age[g.key] || 0, i }));
  return `
  ${head("상권 데이터 분석", { eyebrow: resultEyebrow(a, placeLine(a)), backHref: hashOf("result", a), backLabel: "분석 결과로" })}
  ${subnav(a, "analysis")}
  ${modeBanner()}
  <div class="card"><h3>시간대별 생활인구 <span class="seg" id="hourSeg"><button data-h="weekday" class="${day === "weekday" ? "on" : ""}">평일</button><button data-h="weekend" class="${day === "weekend" ? "on" : ""}">주말</button></span></h3>
    <div class="cap">명/시간 · ${day === "weekend" ? "주말" : "평일"} 평균</div><div style="margin-top:8px">${hourBars({ values })}</div></div>
  <div class="card"><h3>주요 데이터 요약</h3><div class="row3">
    <div class="kpi"><small>주요 연령</small><b style="color:var(--accent)">${AGE_GROUPS.find((g) => g.key === m.topAge).name} ${fmtAgePct(m.age[m.topAge])}</b></div>
    <div class="kpi"><small>주말 생활인구</small><b style="color:var(--accent)">${m.weekendRatio.toFixed(2)}배</b><em>평일 대비</em></div>
    <div class="kpi"><small>경쟁 점포</small><b style="color:var(--accent)">${a.comp.count}${a.comp.capped ? "+" : ""}개</b><em>반경 ${CONFIG.RADIUS_M}m</em></div></div></div>
  <div class="card"><h3>연령대별 비중 <span class="cap">여성 ${fmtAgePct(m.female)}</span></h3>
    <div class="row" style="align-items:center;gap:14px;margin-top:8px"><div style="width:128px;flex:none">${donut({ parts: ageParts })}</div>
    <div class="legend" style="flex-direction:column;gap:7px;margin:0">${ageParts.map((p) => `<span><i class="i${p.i + 1}"></i>${p.name} <b>${fmtAgePct(p.value)}</b></span>`).join("")}</div></div></div>
  ${a.pop.note ? `<div class="foot">${esc(a.pop.note)}</div>` : ""}
  ${sourceFoot(a)}`;
}

// ── 추이 통계 ────────────────────────────────────
export function trendHtml(a, state) {
  if (!a.pop) return noPopHtml(a, "trend", "추이 통계");
  const m = a.metrics, pop = a.pop;
  const all = pop.monthly.length;
  const range = state.range === 3 || state.range === 6 ? Math.min(state.range, all) : all;
  const from = all - range;
  const vals = pop.monthly.slice(from);
  const labels = pop.months.slice(from).map(monthLabel);
  const ageRows = (pop.ageMonthly || []).slice(from);
  const slots = [[6, 9], [9, 12], [12, 15], [15, 18], [18, 21], [21, 24]];
  const slotAvg = (arr) => slots.map(([s, e]) => arr.slice(s, e).reduce((x, y) => x + y, 0) / (e - s));
  const growthCls = m.growth >= 0 ? "up" : "down";
  const small = all < 6 ? `<div class="banner">추이 자료가 ${all}개월분입니다. (API는 최근 기간만 제공해, 일별 수집이 쌓이면 기간이 늘어납니다)</div>` : "";
  return `
  ${head("추이 통계", { eyebrow: resultEyebrow(a, placeLine(a)), backHref: hashOf("result", a), backLabel: "분석 결과로" })}
  ${subnav(a, "trend")}
  ${modeBanner()}${small}
  <div class="card"><h3>월별 생활인구 추이 <span class="seg" id="rangeSeg">${[[3, "3개월"], [6, "6개월"], [0, "전체"]].map(([v, t]) => `<button data-r="${v}" class="${(state.range || 0) === v ? "on" : ""}">${t}</button>`).join("")}</span></h3>
    <div class="cap">월 평균 (만 명/시간) · 전월 대비 ${fmtPct(m.mom)}</div>
    <div style="margin-top:8px">${lineChart({ values: vals.map((v) => Math.round(v / 100) / 100), labels: labels.map((t, i) => (vals.length <= 6 || i % 2 === 0 ? t : "")), hi: vals.length - 1, fmt: (v) => Number(v).toFixed(Number(v) >= 10 ? 1 : 2) })}</div>
    <div class="row3">
      <div class="kpi"><small>직전 3개월 대비</small><b class="${growthCls}">${fmtPct(m.growth)}</b><em>성장성 ${a.score.items.find((i) => i.key === "growth").score ?? "-"}점</em></div>
      <div class="kpi"><small>가장 붐빈 달</small><b>${monthLabel(pop.months[m.busiestMonth])}</b><em>${fmtMan(pop.monthly[m.busiestMonth])}</em></div>
      <div class="kpi"><small>변동성</small><b>${m.volatility < 0.03 ? "낮음" : m.volatility < 0.06 ? "보통" : "높음"}</b><em>±${(m.volatility * 100).toFixed(1)}%</em></div></div></div>
  <div class="card"><h3>연령대별 월 구성</h3><div class="cap">월별 연령 비중</div>
    <div style="margin-top:8px">${stackBars({ rows: ageRows, labels: labels.map((t) => t.replace("월", "")) })}</div>
    <div class="legend">${AGE_GROUPS.map((g, i) => `<span><i class="i${i + 1}"></i>${g.name}</span>`).join("")}</div></div>
  <div class="card"><h3>평일 · 주말 × 시간대 <span class="cap">진할수록 붐빔</span></h3>
    <div style="margin-top:8px">${heatmap({ rowsData: [{ label: "평일", values: slotAvg(pop.weekday) }, { label: "주말", values: slotAvg(pop.weekend) }], cols: slots.map(([s, e]) => `${s}~${e}`) })}</div>
    <div class="cap" style="margin-top:6px">평일 피크 ${m.peakHour}시 · 주말 피크 ${m.peakEndHour}시 · 주말/평일 ${m.weekendRatio.toFixed(2)}배</div></div>
  ${sourceFoot(a)}`;
}

// ── AI 컨설턴트 ──────────────────────────────────
export function reportHtml(a) {
  const r = a.report;
  const li = (x) => `<li>${esc(x.text)}<br><span class="ev">근거 · ${esc(x.ev)}</span></li>`;
  return `
  ${head("AI 컨설턴트 의견", { eyebrow: resultEyebrow(a, placeLine(a)), backHref: hashOf("result", a), backLabel: "분석 결과로", right: `<a class="ib" href="${hashOf("pdf", a)}" aria-label="결과 보고서(PDF) 만들기">📄</a>` })}
  ${subnav(a, "report")}
  ${modeBanner()}
  <div class="bubble"><div class="bot">🤖</div><p>${esc(r.summary)}</p></div>
  <div class="tone good"><h3>👍 강점</h3><ul>${r.strengths.map(li).join("")}</ul></div>
  <div class="tone bad"><h3>⚠ 위험 요소</h3><ul>${r.risks.map(li).join("")}</ul></div>
  <div class="tone tip"><h3>💡 추천 전략</h3><ul>${r.strategies.map(li).join("")}</ul></div>
  <div class="card" style="background:var(--accent-soft);box-shadow:none"><h3 style="color:var(--accent)">🎯 종합 의견</h3><div style="font-size:13px;line-height:1.6;margin-top:4px">${esc(r.overall)}</div></div>
  <a class="btn" href="${hashOf("pdf", a)}">📄 결과 보고서(PDF) 만들기</a>
  <div class="cap" style="text-align:center;margin:6px 0 10px">항목별 산출 근거 · 그래프 · 점포 목록 · 현장 답사 체크리스트까지 담은 A4 보고서예요</div>
  ${r.limits.length ? `<div class="card"><h3>분석의 한계</h3><ul style="margin:6px 0 0;padding-left:18px;font-size:13px;line-height:1.6;color:var(--muted)">${r.limits.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}
  ${sourceFoot(a)}`;
}

// ── 후보 비교 ────────────────────────────────────
export function compareHtml(list) {
  if (!list.length) {
    return `${head("후보 비교", { back: false })}<div class="card"><div class="empty">후보지가 없어요.<br>분석 결과 화면 오른쪽 위 ☆를 눌러 최대 3곳을 담아 보세요.</div></div><a class="btn ghost" href="#home">지역 검색하러 가기</a>`;
  }
  const names = ITEMS.map((i) => i.short);
  const cls = ["r1", "r2", "r3"];
  const lcls = ["i2", "i3", "i5"];
  const best = ITEMS.map((_, i) => Math.max(...list.map((a) => a.score.items[i].score ?? -1)));
  return `
  ${head("후보 비교", { back: false, right: `<button class="ib" id="printBtn" aria-label="PDF로 저장">📄</button>` })}
  ${modeBanner()}
  <section class="card cand-card" aria-labelledby="candH">
    <h3 id="candH">담은 후보 <span class="cap">${list.length}/3</span></h3>
    ${list.map((a, i) => `<div class="cand"><a class="cand-l" href="${hashOf("result", a)}"><span class="score-dot">${a.score.total ?? "-"}</span><b>${esc(a.place.name)} ${esc(a.industry.name)}<small>${a.score.grade ? esc(a.score.grade.name) : "점수 없음"} · 결과 보기 ›</small></b></a><button type="button" class="cand-x" data-unsave="${esc(a.key)}" aria-label="${esc(a.place.name)} ${esc(a.industry.name)} 후보에서 빼기">✕</button></div>`).join("")}
    ${list.length < 2 ? `<div class="cap" style="margin-top:8px">다른 동네도 담으면 아래에서 나란히 비교해요. 지역 찾기에서 검색한 뒤 결과 화면 오른쪽 위 ☆를 눌러 보세요.</div>` : ""}
  </section>
  <div class="card"><h3>5개 항목 레이더</h3><div style="width:260px;max-width:100%;margin:6px auto 0">${radar({ names, sets: list.map((a, i) => ({ values: a.score.items.map((it) => it.score), cls: cls[i] })) })}</div>
    <div class="legend" style="justify-content:center">${list.map((a, i) => `<span><i class="${lcls[i]}"></i>${esc(a.place.name)} ${esc(a.industry.name)} ${a.score.total ?? "-"}</span>`).join("")}</div></div>
  <div class="card"><h3>항목별 비교</h3><table class="cmp"><tr><th></th>${list.map((a) => `<th>${esc(a.place.name)}<br>${esc(a.industry.name)}</th>`).join("")}</tr>
    ${ITEMS.map((it, i) => `<tr><td>${it.short}</td>${list.map((a) => { const s = a.score.items[i].score; return `<td>${s == null ? "<span class='cap'>자료 없음</span>" : s === best[i] && list.length > 1 ? `<b class="best">${s}</b>` : s}</td>`; }).join("")}</tr>`).join("")}
    <tr><td>종합</td>${list.map((a) => `<td><b>${a.score.total ?? "-"}</b></td>`).join("")}</tr>
    <tr><td>등급</td>${list.map((a) => `<td>${a.score.grade ? `<span class="chip ${a.score.grade.cls}">${a.score.grade.name}</span>` : "-"}</td>`).join("")}</tr></table></div>
  <div class="foot">자료가 없는 항목은 점수에서 제외됩니다 · ${DISCLAIMER}</div>`;
}

// ── 내 정보 ──────────────────────────────────────
// 계정 카드: 로그아웃 상태 / 로그인 상태 / 로그인 기능을 못 불러온 상태
function accountHtml({ user, authOk, syncing }) {
  if (user) {
    const initial = esc((user.name || user.email || "?").trim().charAt(0).toUpperCase());
    return `<div class="card"><h3>계정 <span class="chip up">로그인됨</span></h3>
      <div class="acct"><div class="avatar">${user.photo ? `<img src="${esc(user.photo)}" alt="" referrerpolicy="no-referrer">` : initial}</div>
        <div class="acct-t"><b>${esc(user.name || "사용자")}</b><small>${esc(user.email)}</small></div></div>
      <div class="cap" style="margin-top:8px">${syncing ? "후보지 · 최근 검색을 동기화하는 중…" : "후보지와 최근 검색이 계정에 저장돼 다른 기기에서도 보여요."}</div>
      <button type="button" class="btn ghost" data-signout>로그아웃</button></div>`;
  }
  if (!authOk) return `<div class="card"><h3>계정</h3><div class="cap" style="margin-top:6px;line-height:1.5">로그인 기능을 불러오지 못했어요. 네트워크를 확인하고 새로고침해 주세요. 로그인 없이도 이 기기에서는 모든 기능을 쓸 수 있어요.</div></div>`;
  return `<div class="card"><h3>계정</h3>
    <div class="cap" style="margin-top:6px;line-height:1.5">구글로 로그인하면 후보지와 최근 검색이 계정에 저장돼 다른 기기에서도 볼 수 있어요. 로그인하지 않아도 이 기기에서는 그대로 쓸 수 있어요.</div>
    <button type="button" class="btn" data-signin>G 구글로 로그인</button>
    <div class="cap" style="margin-top:8px;line-height:1.5">저장되는 것은 후보지 · 최근 검색(지역 이름, 업종, 점수)뿐이고, 현재 위치의 정확한 좌표는 올리지 않아요.</div></div>`;
}

export function meHtml({ saved, theme, autoLocate = true, user = null, authOk = true, syncing = false }) {
  return `
  ${head("내 정보", { back: false })}
  ${accountHtml({ user, authOk, syncing })}
  <div class="card"><h3>담아 둔 후보지 <span class="cap">${saved.length}/3</span></h3>${saved.length ? saved.map((s) => `
    <a class="li" href="#result/${encodeURIComponent(s.place.name)}/${s.industryKey}"><div class="score-dot">${s.total ?? "-"}</div><b>${esc(s.place.name)} ${esc(s.industryName)}<small>${esc(s.grade || "")}</small></b>›</a>`).join("") : `<div class="empty">담아 둔 후보지가 없어요</div>`}
    ${saved.length ? `<a class="btn" href="#compare">후보지 비교하기</a>` : ""}</div>
  <div class="card"><h3>화면 테마</h3><div class="chips flat" id="themeChips" style="margin-bottom:0"><button class="c ${theme !== "dark" ? "on" : ""}" data-theme="">블루</button><button class="c ${theme === "dark" ? "on" : ""}" data-theme="dark">다크</button></div></div>
  <div class="card"><h3>시작할 때 현재 위치로 검색</h3><div class="chips flat" id="autoChips" style="margin-bottom:0"><button class="c ${autoLocate ? "on" : ""}" data-auto="1">켜기</button><button class="c ${!autoLocate ? "on" : ""}" data-auto="0">끄기</button></div>
    <div class="cap" style="margin-top:8px;line-height:1.5">앱을 열면 브라우저의 위치 권한을 요청하고, 지금 있는 동네를 바로 분석해요. 위치는 이 기기에서만 쓰고 저장하지 않으며, 행정동 확인을 위해 좌표가 Kakao 지도 서비스에 전달돼요.</div></div>
  <div class="card"><h3>연결 상태 <button type="button" class="explain-link" data-probe style="margin:0 0 0 auto">다시 확인</button></h3><div class="conn" id="connBox">
    <div class="conn-r"><span>생활인구</span><b id="cn-pop" class="cn-wait">확인 중…</b></div>
    <div class="conn-r"><span>동 단위 기준 분포</span><b id="cn-base" class="cn-wait">확인 중…</b></div>
    <div class="conn-r"><span>Kakao 지도 · 점포 검색</span><b id="cn-kakao" class="cn-wait">확인 중…</b></div>
    <div class="conn-r"><span>임대료</span><b class="cn-no">직접 넣은 매물 기준 (공개 자료 연결 전)</b></div></div></div>
  <div class="foot">${DISCLAIMER}</div>`;
}
