// 화면 그리기: 분석 결과 · 상태를 받아 HTML 문자열을 돌려준다 (이벤트 처리는 main.js).
import { aiUrl, ASK_KEYS, askLabels, cachedOpinion } from "./ai-opinion.js";
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
const itemColor = ["var(--c2)", "var(--c3)", "var(--warn)", "var(--now)", "#8a96a8", "var(--c4)"]; // ITEMS 순서: 고객 · 유동 · 경쟁 · 폐업 · 임대료 · 성장
const brandMark = `<img class="brand-mark" src="./assets/jarijapso-logo.png" alt="자리잡소 로고">`;

// 기준일 · 출처 · 단위 표기 (모든 결과 화면 하단)
function sourceFoot(a) {
  const { pop, comp } = a;
  const capNote = comp.capped ? " · 조회 한도에 닿아 실제는 더 많을 수 있음" : ""; // 예전 "분석의 한계" 상자의 점포 한도 안내를 출처 줄로
  if (!pop) return `<div class="foot">생활인구: 자료 없음<br>경쟁 점포: ${esc(comp.source)}${capNote}</div>`;
  const unit = pop.level === "gu" ? "자치구 단위" : "행정동 단위";
  const cl = a.closure ? `<br>개폐업: 서울시 상권분석서비스(점포-행정동) · ${String(a.closure.asOf).slice(0, 4)}년 ${String(a.closure.asOf).slice(4)}분기까지 4분기` : "";
  return `<div class="foot">생활인구: ${esc(pop.source || "서울 열린데이터광장")} · ${unit} · 기준일 ${esc(pop.asOf)}<br>경쟁 점포: ${esc(comp.source)}${capNote}${cl}<br>생활인구는 방문객 · 구매자 · 매출과 다른 개념입니다</div>`;
}
const modeBanner = () => (popMode() === "sample"
  ? `<div class="banner soft">예시 자료로 계산한 결과예요. 동 단위 생활인구가 연결되면 실제 값으로 바뀌어요.</div>`
  : "") + (kakaoState.error ? `<div class="banner">${kakaoState.error}</div>` : "");

// eyebrow: 제목 위 작은 표시 (결과 화면에서 "분석 결과"임을 알려 준다)
export function head(title, { back = true, backHref = "#home", backLabel = "홈으로", right = "", eyebrow = "" } = {}) {
  const t = eyebrow ? `<div class="head-t"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2></div>` : `<h2>${title}</h2>`;
  return `<div class="head">${back ? `<a class="ib" href="${backHref}" aria-label="${backLabel}"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></a>` : ""}${t}${right}</div>`;
}
const RESULT_MARK = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16"/><path d="M7 16v-5M12 16V7M17 16v-8"/></svg>`;
const resultEyebrow = (a, sub = "", label = "분석 결과") => `${RESULT_MARK}${label}${sub ? ` · ${esc(sub)}` : ""}`;
const placeLine = (a) => `${a.place.name} ${a.industry.name}`;

// 자세히 보기 단계 메뉴: 아이콘 + 이름 (지금 화면은 채운 아이콘)
// 아이콘: Lucide (lucide.dev, ISC) map · gauge · chart-no-axes-column · trending-up · bot
const SUB_ICONS = {
  map: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
  result: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  analysis: '<line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>',
  trend: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  report: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>', // bot
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
  // AI 의견 화면: Lucide (lucide.dev, ISC) thumbs-up · triangle-alert · lightbulb · target · file-text
  good: '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  idea: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  doc: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  // 분석 결과 화면: Lucide (lucide.dev, ISC) users · footprints · wallet · trending-up · circle-check-big · circle-alert · circle-x · shield-check · minus · map-pin-check · scale · layers-3 · star · share
  customer: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  size: '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/>',
  rent: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  growth: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  ok: '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
  caution: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  no: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  minus: '<path d="M5 12h14"/>',
  visit: '<path d="M19.43 12.935c.357-.967.57-1.955.57-2.935a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 32.197 32.197 0 0 0 .813-.728"/><circle cx="12" cy="10" r="3"/><path d="m16 18 2 2 4-4"/>',
  scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m6.08 9.5-3.5 1.6a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.5-1.59"/><path d="m6.08 14.5-3.5 1.6a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.5-1.59"/>',
  competition: '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" x2="9" y1="14" y2="18"/><line x1="7" x2="4" y1="17" y2="20"/><line x1="3" x2="5" y1="19" y2="21"/>', // Lucide swords
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/>', // Lucide message-square-text
  crown: '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>', // Lucide crown (유료 기능 표시)
  bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>', // Lucide lightbulb
  compass: '<path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/>', // Lucide compass (자리잡소 한 줄 결론)
  expert: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>', // Lucide graduation-cap (전문가 의견)
  ask: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>', // Lucide message-circle-question
  user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>', // Lucide user-round
  spin: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>', // Lucide loader-circle
  closure: '<path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 20h20"/><path d="M14 12v.01"/>', // Lucide door-closed
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  // 홈 카드 머리 아이콘: Lucide (lucide.dev, ISC) store · map-pin
  store: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
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
  <div class="brand-head"><a class="brand-logo" href="./intro.html" aria-label="자리잡소 소개 보기">${brandMark}</a></div>
  <h1 class="step-title">어떤 가게를, 어디에서 시작하시나요?</h1>
  ${modeBanner()}
  <section class="step done" aria-labelledby="st1">
    <div class="step-h"><span class="step-i">${icon("store")}</span><h2 id="st1">업종 선택</h2><span class="cap">${esc(cur.name)} 선택됨</span></div>
    <div class="tiles" id="indChips">${tiles.map((i) => `<button type="button" class="tile ${i.key === cur.key ? "on" : ""}" data-ind="${i.key}" aria-pressed="${i.key === cur.key}">${indIcon(i)}${esc(i.name)}</button>`).join("")}<button type="button" class="tile more ${moreOpen ? "open" : ""} ${!inTiles ? "on" : ""}" data-more aria-haspopup="listbox" aria-expanded="${moreOpen}" aria-controls="morePanel"><span class="dd-label">${!inTiles ? esc(cur.name) : "더보기"}</span><svg class="ico dd-caret" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>
    ${!inTiles && !moreOpen && cur.alias?.length ? `<div class="more-hint">${esc(cur.name)} · ${esc(cur.alias.join(", "))} 점포와 비교해요</div>` : ""}
    ${moreOpen ? morePanelHtml(industryKey) : ""}
  </section>
  <section class="step active" aria-labelledby="st2">
    <div class="step-h"><span class="step-i">${icon("pin")}</span><h2 id="st2">지역 선택</h2></div>
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
const SHARE_ICO = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>`; // Lucide share
const shareBtn = `<button type="button" class="ib" data-share aria-label="결과 링크 공유">${SHARE_ICO}</button>`;
const saveBtn = (saved) => `<button class="ib save-star ${saved ? "on" : ""}" id="saveBtn" aria-label="후보지에 담기" aria-pressed="${saved}">${icon("star")}</button>`;
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
  closure: ["문 닫는 가게가 적은 동네예요", "문 닫는 가게가 많은 편이에요", "폐업은 서울 평균 수준이에요"],
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
    closure: a.closure ? `최근 1년 폐업률 ${(a.closure.rate * 100).toFixed(1)}% (서울 중간 ${((a.closure.median ?? 0) * 100).toFixed(1)}%)` : "",
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

// 결론 제목: 가장 좋은 항목과 가장 약한 항목으로 한 줄 요약 (등급 이름을 되풀이하지 않는다)
const HL_GOOD = { customer: "손님층은 잘 맞", size: "오가는 사람은 많", competition: "경쟁 가게는 적", closure: "문 닫는 가게는 적", rent: "임대료 부담은 적", growth: "사람은 늘고 있" };
const HL_GOOD_FULL = { customer: "손님층이 잘 맞아요", size: "오가는 사람이 많아요", competition: "경쟁 가게가 적어요", closure: "문 닫는 가게가 적어요", rent: "임대료 부담이 적어요", growth: "사람이 늘고 있어요" };
const HL_BAD = { customer: "손님층이 잘 안 맞아요", size: "오가는 사람이 적어요", competition: "경쟁 가게가 많아요", closure: "문 닫는 가게가 많아요", rent: "임대료 부담이 커요", growth: "사람이 줄고 있어요" };
function headline(score) {
  const s = score.items.filter((i) => i.score != null);
  if (score.total == null || !s.length) return "자료가 부족해<br>점수를 내지 못했어요";
  const best = s.reduce((x, y) => (y.score > x.score ? y : x)), worst = s.reduce((x, y) => (y.score < x.score ? y : x));
  if (best.score >= 70 && worst.score < 50) return `${HL_GOOD[best.key]}지만<br>${HL_BAD[worst.key]}`;
  if (worst.score >= 50) return `${HL_GOOD_FULL[best.key]}<br>${score.total >= 85 ? "해볼 만한 자리예요" : "큰 약점은 없어요"}`;
  return `${HL_BAD[worst.key]}<br>다른 후보와 비교해 보세요`;
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
  const mark = { good: icon("ok"), bad: icon("caution"), mid: icon("minus") };
  const gradeIco = { up: "ok", ok: "ok", warn: "caution", now: "no" };
  return `
  ${head(`${esc(a.place.name)} · ${esc(ind)}`, { eyebrow: resultEyebrow(a, ""), right: `<span class="head-r">${shareBtn}${saveBtn(saved)}</span>` })}
  ${modeBanner()}
  ${noPopBanner(a)}
  <section class="answer" aria-label="분석 결론">
    <p class="an-q">이 자리, ${esc(roJosa(ind))} 괜찮을까요?</p>
    <h3 class="an-h">${headline(score)}</h3>
    <div class="an-row">
      <div class="an-g ${grade?.cls || ""}">${gauge(score.total)}<b>${score.total ?? "-"}<small>점</small></b></div>
      <div class="an-b">${grade ? `<span class="v-grade ${grade.cls}">${icon(gradeIco[grade.cls] || "caution")}${grade.name}</span>` : `<span class="v-grade warn">${icon("caution")}점수 없음</span>`}
        <button type="button" class="v-conf ${conf.level}" data-conf aria-expanded="false" aria-controls="confBox">${icon("shield")}신뢰도 ${conf.name} · 왜요? ›</button>
        <span class="an-cap">${score.total == null ? "점수에 쓸 자료가 부족해요" : `${score.used}개 항목으로 계산 · 55 신중 · 70 조건부 · 85 추천부터`}</span></div>
    </div>
    <ul class="an-chips" aria-label="항목별 점수">${score.items.filter((it) => it.key !== "rent").map((it) => { const w = itemWord(it.score); return it.score == null ? `<li class="na">${icon(it.key)}<span>${it.short}</span><b>-</b></li>` : `<li class="${w.cls || ""}">${icon(it.key)}<span>${it.short}</span><b>${it.score}</b></li>`; }).join("")}</ul>
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
  </section>
  <section class="card next-card" aria-labelledby="nextH">
    <h3 id="nextH">다음에 할 일</h3>
    <ol class="todo">
      <li><span class="tn">${icon("visit")}</span><div><b>${a.pop ? `평일 ${a.metrics.openPeakHour}시 전후에 직접 가 보기` : "영업할 시간대에 직접 가 보기"}</b><small>${worst && worst.score < 60 ? (worst.key === "closure" ? "최근 문 닫은 가게 자리와 이유를 둘러보며 확인해요" : `점수가 가장 낮은 ${esc(josa(worst.short, "을", "를"))} 눈으로 확인해요`) : "가게 앞 사람 흐름과 동선을 눈으로 확인해요"}</small></div></li>
      <li><span class="tn">${icon("rent")}</span><div><b>알아본 매물이 있나요?</b><small>보증금 · 월세 · 관리비 · 권리금을 실제 매물로 확인하세요</small>${rentRefHtml(a.rentRef)}</div></li>
      <li><span class="tn">${icon("scale")}</span><div><b>다른 동네 1~2곳과 비교하기</b><small>${saved ? "후보에 담았어요. 다른 동네도 검색해서 담은 뒤 아래 메뉴 후보 비교에서 봐요" : "오른쪽 위 ☆로 담아 두면 후보 비교에서 나란히 볼 수 있어요"}</small></div></li>
    </ol>
  </section>
  <section class="card ind-card" aria-labelledby="indH">
    <h3 id="indH"><span class="h-i">${icon("layers")}같은 동네, 다른 업종은?</span></h3>
    <div class="cap">${esc(a.place.name)}에서 주요 업종의 입지 점수를 나란히 봐요.</div>
    <button type="button" class="explain-link" data-indcmp aria-expanded="false">업종별 점수 비교하기 ›</button>
    <div id="indCmp" aria-live="polite"></div>
  </section>
  <section class="card go-card" aria-labelledby="goH">
    <h3 id="goH">자세히 보기</h3>
    <nav class="go-row" aria-label="자세히 보기">${FLOW.map(([v, t]) => `<a class="go go-${v}" href="${hashOf(v, a)}"><span class="go-i">${subIcon(v)}</span><b>${t}</b></a>`).join("")}</nav>
  </section>
  <div class="foot data-date" style="margin-top:10px">${a.pop?.asOf ? `<b>자료 기준일 ${esc(a.pop.asOf)}</b> · 생활인구` : "<b>생활인구 자료 없음</b>"}${a.closure ? ` · 개폐업 ${String(a.closure.asOf).slice(0, 4)}년 ${String(a.closure.asOf).slice(4)}분기까지` : ""} · 경쟁 점포는 조회 시점<br>${DISCLAIMER}</div>`;
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
    <div class="rb-top"><div><b>${r ? "넣은 매물 기준" : "알아본 매물이 있나요?"}</b><span>${line}</span></div>
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
  return `
  ${head("추이 통계", { eyebrow: resultEyebrow(a, placeLine(a)), backHref: hashOf("result", a), backLabel: "분석 결과로" })}
  ${subnav(a, "trend")}
  ${modeBanner()}
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
  ${head("AI 컨설턴트 의견", { eyebrow: resultEyebrow(a, placeLine(a)), backHref: hashOf("result", a), backLabel: "분석 결과로", right: `<a class="ib" href="${hashOf("pdf", a)}" aria-label="결과 보고서(PDF) 만들기">${icon("doc")}</a>` })}
  ${subnav(a, "report")}
  ${modeBanner()}
  ${reportHero(a)}
  ${reportTabs(a)}
  <a class="btn" href="${hashOf("pdf", a)}">${icon("doc")}결과 보고서(PDF) 만들기</a>
  <div class="cap" style="text-align:center;margin:6px 0 10px">항목별 산출 근거 · 그래프 · 점포 목록 · 현장 답사 체크리스트까지 담은 A4 보고서예요</div>
  ${sourceFoot(a)}`;
}

// AI 의견 화면 (탭 정리형): 위에 점수 링 + 등급 + 한 줄 결론 고정, 아래 [강점 | 위험 | 전략 | AI 대화] 탭
function reportHero(a) {
  const g = a.score.grade;
  return `<div class="card rhero">
    <div class="rh-b">${g ? `<span class="v-grade ${g.cls}">${g.name}</span>` : `<span class="v-grade warn">점수 없음</span>`}<p>${esc(a.report.summary)}</p></div>
    <small class="rh-d">${esc(DISCLAIMER)}</small></div>`;
}
const RTABS = [["good", "강점", "good", "strengths"], ["bad", "위험", "alert", "risks"], ["tip", "전략", "bulb", "strategies"]];
function reportTabs(a) {
  const r = a.report, ai = !!aiUrl(), sel = rtabOf(a);
  const row = (x, cls) => `<li class="ri"><span class="rdot ${cls}">${icon(cls === "good" ? "good" : cls === "bad" ? "alert" : "bulb")}</span><div><p>${esc(x.text)}</p><span class="ev">근거 · ${esc(x.ev)}</span></div></li>`;
  const tabs = [...RTABS.map(([k, name, ic, key]) => ({ k, label: name, n: r[key].length, ic })), ...(ai ? [{ k: "ai", label: "AI 대화", ic: "expert", pro: true, dot: !!cachedOpinion(a) }] : [])];
  return `<div class="rtabs" role="tablist" aria-label="AI 의견 보기">${tabs.map((x) => `<button type="button" role="tab" id="rt-${x.k}" aria-controls="rp-${x.k}" aria-selected="${x.k === sel}" tabindex="${x.k === sel ? 0 : -1}" data-rtab="${x.k}">${icon(x.ic)}${x.label}${x.n != null ? `<span class="cnt">${x.n}</span>` : ""}${x.pro ? `<span class="crown" title="유료 기능 예정" aria-label="유료 기능 예정">${icon("crown")}</span>` : ""}${x.dot ? '<i class="rdotmark" aria-label="받은 의견 있음"></i>' : ""}</button>`).join("")}</div>
  ${RTABS.map(([k, , , key]) => `<section class="card rpanel" role="tabpanel" id="rp-${k}" aria-labelledby="rt-${k}" ${k === sel ? "" : "hidden"}><ul class="rlist">${r[key].length ? r[key].map((x) => row(x, k)).join("") : `<li class="empty">해당 항목이 없어요</li>`}</ul></section>`).join("")}
  ${ai ? `<section class="rpanel" role="tabpanel" id="rp-ai" aria-labelledby="rt-ai" ${sel === "ai" ? "" : "hidden"}>${askHtml(a)}</section>` : ""}`;
}
// 선택한 탭은 같은 결과를 보는 동안 유지 (다른 동네 · 업종이면 "강점"부터)
let rtabState = { key: "", tab: "good" };
const rtabOf = (a) => (rtabState.key === a.key ? rtabState.tab : "good");
export function setReportTab(a, tab) { rtabState = { key: a.key, tab }; }

// AI 대화: 맨 위 "전문가 의견 받기" → 첫 말풍선에 전문가 의견, 이어서 정해진 질문 칩 3개 (자유 입력 없음)
// 답은 조회된 분석 숫자만 근거로 한다. 이미 받은 의견(기기에 6시간 저장)은 화면에 들어올 때 바로 보여 준다
export const opinionFail = (text) => `<div class="msg ai fail expert"><span class="av">${icon("expert")}</span><p>${esc(text)} 위의 규칙 기반 의견을 참고하세요.</p></div>`;
export const opinionBubble = (res) => `<div class="msg ai wide expert"><span class="av">${icon("expert")}</span><div class="mb">${aiOpinionHtml(res, () => "")}</div></div>`;
function askHtml(a) {
  const labels = askLabels(a);
  const saved = cachedOpinion(a);
  return `<section class="card ask-card" aria-labelledby="askH"><div class="ai-h"><span class="ai-mark ask">${icon("ask")}</span><div><h3 id="askH">AI 컨설턴트에게 묻기</h3><small>이 동네 분석 숫자만 근거로 답해요 · AI가 작성 · 참고용</small></div></div>
    ${saved ? "" : `<button type="button" class="btn" data-ai>${icon("expert")}전문가 의견 받기</button>`}
    <div class="chat" id="chatLog" aria-live="polite">${saved ? opinionBubble(saved) : ""}<div class="msg ai"><span class="av">${subIcon("report")}</span><p>${esc(a.place.name)} ${esc(a.industry.name)} 결과에 대해 궁금한 점을 골라 주세요.</p></div></div>
    <div class="chips sticky" id="askChips">${ASK_KEYS.map((k) => `<button type="button" class="chip" data-ask="${k}">${esc(labels[k])}</button>`).join("")}</div></section>`;
}
export const chatUser = (text) => `<div class="msg me"><p>${esc(text)}</p><span class="av">${icon("user")}</span></div>`;
export const chatTyping = () => `<div class="msg ai typing"><span class="av">${subIcon("report")}</span><p><i></i><i></i><i></i><span class="sr">입력 중…</span></p></div>`;
export function chatAnswer(res) {
  if (!res.ok) return `<div class="msg ai fail"><span class="av">${subIcon("report")}</span><p>지금은 답변을 불러오지 못했어요. 위의 규칙 기반 의견을 참고하세요.</p></div>`;
  return `<div class="msg ai"><span class="av">${subIcon("report")}</span><p>${esc(res.answer)}<small>AI가 작성 · 참고용${res.cached ? " · 저장된 답변" : ""}</small></p></div>`;
}

// AI 전문가 의견 결과 (ai-opinion.js 의 requestOpinion 결과). 실패면 안내만 하고 위의 규칙 기반 의견은 그대로 둔다
export function aiOpinionHtml(res, failText) {
  if (res === "loading") return `<div class="ai-wait">${icon("spin")}분석 숫자로 의견을 쓰는 중이에요…</div>`;
  if (!res.ok) return `<div class="ai-fail">${icon("caution")}${esc(failText(res.reason))} 위의 기본 의견을 참고해 주세요.</div>`;
  const o = res.opinion;
  const ul = (arr) => `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  return `<div class="ai-res">
    ${o.strengths.length ? `<h4>${icon("good")}강점</h4>${ul(o.strengths)}` : ""}
    ${o.cautions.length ? `<h4>${icon("alert")}주의할 점</h4>${ul(o.cautions)}` : ""}
    ${o.strategies.length ? `<h4>${icon("idea")}추천 전략</h4>${ul(o.strategies)}` : ""}
    <h4>${icon("target")}종합 의견</h4><p>${esc(o.overall)}</p>
    <div class="ai-tag">${subIcon("report")}AI가 작성 · 참고용${res.model ? ` · ${esc(res.model)}` : ""}${res.cached ? " · 저장된 의견" : ""}</div>
  </div>`;
}

// ── 후보 비교 ────────────────────────────────────
export function compareHtml(list) {
  if (!list.length) {
    return `${head("후보 비교", { back: false })}<div class="card"><div class="empty">후보지가 없어요.<br>분석 결과 화면 오른쪽 위 ☆를 눌러 최대 3곳을 담아 보세요.</div></div><a class="btn ghost" href="#home">지역 검색하러 가기</a>`;
  }
  const CMP = ITEMS.filter((it) => it.key !== "rent"); // 임대료는 선택 항목이라 비교에서 뺀다
  const names = CMP.map((i) => i.short);
  const cls = ["r1", "r2", "r3"];
  const lcls = ["i2", "i3", "i5"];
  // 항목은 key 로 찾는다 (예전에 담은 후보는 항목 수 · 순서가 다를 수 있다)
  const sOf = (a, key) => a.score.items.find((x) => x.key === key)?.score ?? null;
  const best = CMP.map((it) => Math.max(...list.map((a) => sOf(a, it.key) ?? -1)));
  return `
  ${head("후보 비교", { back: false, right: `<button class="ib" id="printBtn" aria-label="PDF로 저장">${icon("doc")}</button>` })}
  ${modeBanner()}
  <section class="card cand-card" aria-labelledby="candH">
    <h3 id="candH">담은 후보 <span class="cap">${list.length}곳 · 최대 3곳</span></h3>
    ${list.map((a, i) => `<div class="cand"><a class="cand-l" href="${hashOf("result", a)}"><span class="score-dot">${a.score.total ?? "-"}</span><b>${esc(a.place.name)} ${esc(a.industry.name)}<small>${a.score.grade ? esc(a.score.grade.name) : "점수 없음"} · 결과 보기 ›</small></b></a><button type="button" class="cand-x" data-unsave="${esc(a.key)}" aria-label="${esc(a.place.name)} ${esc(a.industry.name)} 후보에서 빼기">✕</button></div>`).join("")}
    ${list.length < 2 ? `<div class="cap" style="margin-top:8px">다른 동네도 담으면 아래에서 나란히 비교해요. 검색하기에서 검색한 뒤 결과 화면 오른쪽 위 ☆를 눌러 보세요.</div>` : ""}
  </section>
  <div class="card"><h3>항목별 레이더</h3><div style="width:260px;max-width:100%;margin:6px auto 0">${radar({ names, sets: list.map((a, i) => ({ values: CMP.map((it) => sOf(a, it.key)), cls: cls[i] })) })}</div>
    <div class="legend" style="justify-content:center">${list.map((a, i) => `<span><i class="${lcls[i]}"></i>${esc(a.place.name)} ${esc(a.industry.name)} ${a.score.total ?? "-"}</span>`).join("")}</div></div>
  <div class="card"><h3>항목별 비교</h3><table class="cmp"><tr><th></th>${list.map((a) => `<th>${esc(a.place.name)}<br>${esc(a.industry.name)}</th>`).join("")}</tr>
    ${CMP.map((it, i) => `<tr><td>${it.short}</td>${list.map((a) => { const s = sOf(a, it.key); return `<td>${s == null ? "<span class='cap'>자료 없음</span>" : s === best[i] && list.length > 1 ? `<b class="best">${s}</b>` : s}</td>`; }).join("")}</tr>`).join("")}
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
    <button type="button" class="btn gbtn" data-signin><svg class="gmark" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>구글로 로그인</button>
    <div class="cap" style="margin-top:8px;line-height:1.5">저장되는 것은 후보지 · 최근 검색(지역 이름, 업종, 점수)뿐이고, 현재 위치의 정확한 좌표는 올리지 않아요.</div></div>`;
}

export function meHtml({ saved, theme, autoLocate = true, user = null, authOk = true, syncing = false }) {
  return `
  ${head("내 정보", { back: false })}
  ${accountHtml({ user, authOk, syncing })}
  <div class="card"><h3>담아 둔 후보지 <span class="cap">${saved.length}곳 · 최대 3곳</span></h3>${saved.length ? saved.map((s) => `
    <a class="li" href="#result/${encodeURIComponent(s.place.name)}/${s.industryKey}"><div class="score-dot">${s.total ?? "-"}</div><b>${esc(s.place.name)} ${esc(s.industryName)}<small>${esc(s.grade || "")}</small></b>›</a>`).join("") : `<div class="empty">담아 둔 후보지가 없어요</div>`}
    ${saved.length ? `<a class="btn" href="#compare">후보지 비교하기</a>` : ""}</div>
  <div class="card"><h3>화면 테마</h3><div class="chips flat" id="themeChips" style="margin-bottom:0"><button class="c ${theme !== "dark" ? "on" : ""}" data-theme="">화이트</button><button class="c ${theme === "dark" ? "on" : ""}" data-theme="dark">다크</button></div></div>
  <div class="card"><h3>시작할 때 현재 위치로 검색</h3><div class="chips flat" id="autoChips" style="margin-bottom:0"><button class="c ${autoLocate ? "on" : ""}" data-auto="1">켜기</button><button class="c ${!autoLocate ? "on" : ""}" data-auto="0">끄기</button></div>
    <div class="cap" style="margin-top:8px;line-height:1.5">앱을 열면 브라우저의 위치 권한을 요청하고, 지금 있는 동네를 바로 분석해요. 위치는 이 기기에서만 쓰고 저장하지 않으며, 행정동 확인을 위해 좌표가 Kakao 지도 서비스에 전달돼요.</div></div>
  <div class="card"><h3>연결 상태 <button type="button" class="explain-link" data-probe style="margin:0 0 0 auto">다시 확인</button></h3><div class="conn" id="connBox">
    <div class="conn-r"><span>생활인구</span><b id="cn-pop" class="cn-wait">확인 중…</b></div>
    <div class="conn-r"><span>동 단위 기준 분포</span><b id="cn-base" class="cn-wait">확인 중…</b></div>
    <div class="conn-r"><span>Kakao 지도 · 점포 검색</span><b id="cn-kakao" class="cn-wait">확인 중…</b></div>
    <div class="conn-r"><span>임대료</span><b class="cn-no">직접 넣은 매물 기준 (공개 자료 연결 전)</b></div></div></div>
  <div class="foot">${DISCLAIMER}</div>`;
}
