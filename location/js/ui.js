// 화면 그리기: 분석 결과 · 상태를 받아 HTML 문자열을 돌려준다 (이벤트 처리는 main.js).
import { AGE_GROUPS, INDUSTRIES, SUGGESTIONS } from "./area-data.js";
import { ITEMS, DISCLAIMER } from "./score-rules.js";
import { fmtPct, fmtAgePct, fmtMan, monthLabel } from "./metrics.js";
import { lineChart, hourBars, stackBars, heatmap, donut, radar } from "./charts.js";
import { CONFIG } from "./config.js";
import { popMode } from "./fetchers.js";
import { kakaoState } from "./kmap.js";

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const when = (ts) => {
  const d = Math.floor((Date.now() - ts) / 86400000);
  return d <= 0 ? "오늘" : d === 1 ? "어제" : `${d}일 전`;
};
const hashOf = (view, a) => `#${view}/${encodeURIComponent(a.place.name)}/${a.industry.key}`;
const itemColor = ["var(--c2)", "var(--c3)", "var(--warn)", "var(--now)", "var(--c4)"];

// 기준일 · 출처 · 단위 표기 (모든 결과 화면 하단)
function sourceFoot(a) {
  const { pop, comp } = a;
  if (!pop) return `<div class="foot">생활인구: 자료 없음<br>경쟁 점포: ${esc(comp.source)}</div>`;
  const unit = pop.level === "gu" ? "자치구 단위" : "행정동 단위";
  return `<div class="foot">생활인구: ${esc(pop.source || "서울 열린데이터광장")} · ${unit} · 기준일 ${esc(pop.asOf)}<br>경쟁 점포: ${esc(comp.source)}<br>생활인구는 방문객 · 구매자 · 매출과 다른 개념입니다</div>`;
}
const modeBanner = () => (popMode() === "sample"
  ? `<div class="banner">⚠ 개발용 예시 모드 — 동 단위 생활인구가 아직 연결되지 않아 자치구 단위 예시 표본으로 계산합니다. (수집기 실행 후 config.js 의 LIVE_POP 을 true 로)</div>`
  : "") + (kakaoState.error ? `<div class="banner">${kakaoState.error}</div>` : "");

export function head(title, { back = true, right = "" } = {}) {
  return `<div class="head">${back ? `<a class="ib" href="#home" aria-label="홈으로">‹</a>` : ""}<h2>${title}</h2>${right}</div>`;
}

export function subnav(a, active) {
  const items = [["map", "지도 · 적합도"], ["analysis", "데이터 분석"], ["trend", "추이 통계"], ["report", "AI 의견"]];
  return `<div class="subnav">${items.map(([v, t]) => `<a href="${hashOf(v, a)}" class="${v === active ? "on" : ""}">${t}</a>`).join("")}</div>`;
}

// ── 홈 ──────────────────────────────────────────
export function homeHtml({ recent, industryKey, error }) {
  return `
  <div class="head"><h1>📍 우리 동네 <em>AI 입지 분석</em></h1></div>
  ${modeBanner()}
  <form class="search" id="searchForm" autocomplete="off">
    <input id="q" type="search" placeholder="지역 + 업종 (예: 연남동 카페)" aria-label="지역과 업종 검색" enterkeyhint="search">
    <button type="submit">분석</button>
  </form>
  <div class="chips" id="indChips">${INDUSTRIES.map((i) => `<button type="button" class="c ${i.key === industryKey ? "on" : ""}" data-ind="${i.key}">${i.icon} ${i.name}</button>`).join("")}</div>
  <div id="progress"></div>
  ${error ? `<div class="err-box">${esc(error)}</div>` : ""}
  <div class="card"><h3>추천 검색어</h3><div class="chips flat" style="margin:8px 0 0">${SUGGESTIONS.map((s) => `<button type="button" class="c" data-suggest="${esc(s)}">${esc(s)}</button>`).join("")}</div></div>
  <div class="card"><h3>최근 검색</h3>${recent.length ? recent.map((r) => `
    <a class="li" href="#map/${encodeURIComponent(r.place.name)}/${r.industryKey}"><div class="score-dot">${r.total ?? "-"}</div><b>${esc(r.place.name)} ${esc(r.industryName)}<small>${esc(r.grade || "점수 없음")} · ${when(r.at)}</small></b>›</a>`).join("") : `<div class="empty">아직 검색 기록이 없어요</div>`}</div>
  <div class="foot">${DISCLAIMER}</div>`;
}

export function progressHtml(steps) {
  const done = steps.filter((s) => s.state === "done" || s.state === "skip").length;
  return `<div class="card"><h3>분석 진행 <span class="chip ${steps.some((s) => s.state === "err") ? "now" : ""}">${done}/${steps.length}</span></h3>
  <div class="prog"><i style="width:${(done / steps.length) * 100}%"></i></div>
  <div class="steps">${steps.map((s) => `<div class="${s.state}">${s.state === "done" ? "✔" : s.state === "skip" ? "–" : s.state === "err" ? "✖" : s.state === "run" ? "◔" : "○"} ${esc(s.name)}${s.state === "skip" ? " (자료 없음 · 지도는 계속 보여드려요)" : ""}</div>`).join("")}</div></div>`;
}

// ── 상권 지도 · 적합도 ─────────────────────────────
export function mapHtml(a, saved) {
  const { score } = a;
  const grade = score.grade;
  return `
  ${head(`${esc(a.place.name)} · ${esc(a.industry.name)}`, { right: `<button class="ib" id="saveBtn" aria-label="후보지 담기">${saved ? "★" : "☆"}</button>` })}
  ${subnav(a, "map")}
  ${modeBanner()}
  ${a.pop ? "" : `<div class="banner">이 지역은 생활인구 자료가 없어 지도와 경쟁 점포만 보여드려요.${a.popError ? `<br><span style="font-weight:500">${esc(a.popError)}</span>` : ""}</div>`}
  <div class="map" id="mapBox" aria-label="상권 지도"></div>
  <div class="sheet"><div class="grab"></div>
    <div class="row" style="align-items:center">
      <div style="flex:1"><div class="cap">입지 적합도 ${score.total == null ? "· 자료 부족" : `(${score.used}개 항목 기준)`}</div><div class="big">${score.total ?? "-"}<small>점</small></div></div>
      ${grade ? `<span class="chip ${grade.cls}" style="font-size:14px;padding:9px 14px">${grade.icon} ${grade.name}</span>` : `<span class="chip warn" style="font-size:13px;padding:8px 12px">점수 없음</span>`}
    </div>
    ${score.items.map((it, i) => it.score == null
      ? `<div class="mini na"><span>${it.short}</span><span class="cap">자료 없음 · 점수에서 제외</span><b>-</b></div>`
      : `<div class="mini"><span>${it.short}</span><div class="t"><i style="width:${it.score}%;background:${itemColor[i]}"></i></div><b>${it.score}</b></div>`).join("")}
    <div class="cap" style="margin-top:8px">반경 ${CONFIG.RADIUS_M}m ${esc(a.industry.name)} ${a.comp.count}${a.comp.capped ? "곳 이상" : "곳"}</div>
    <div class="foot" style="margin-top:6px">${DISCLAIMER}</div>
    <a class="btn" href="${hashOf("report", a)}">AI 컨설턴트 의견 보기</a>
  </div>`;
}

// ── 상권 데이터 분석 ──────────────────────────────
// 생활인구 자료가 없는 동네의 분석 · 추이 화면
function noPopHtml(a, view, title) {
  return `
  ${head(title)}
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
  ${head("상권 데이터 분석")}
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
  ${head("추이 통계")}
  ${subnav(a, "trend")}
  ${modeBanner()}${small}
  <div class="card"><h3>월별 생활인구 추이 <span class="seg" id="rangeSeg">${[[3, "3개월"], [6, "6개월"], [0, "전체"]].map(([v, t]) => `<button data-r="${v}" class="${(state.range || 0) === v ? "on" : ""}">${t}</button>`).join("")}</span></h3>
    <div class="cap">월 평균 (만 명/시간) · 전월 대비 ${fmtPct(m.mom)}</div>
    <div style="margin-top:8px">${lineChart({ values: vals.map((v) => Math.round(v / 100) / 100), labels: labels.map((t, i) => (vals.length <= 6 || i % 2 === 0 ? t : "")), hi: vals.length - 1, fmt: (v) => Number(v).toFixed(1) })}</div>
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
  ${head("AI 컨설턴트 의견", { right: `<button class="ib" id="printBtn" aria-label="PDF로 저장">📄</button>` })}
  ${subnav(a, "report")}
  ${modeBanner()}
  <div class="bubble"><div class="bot">🤖</div><p>${esc(r.summary)}</p></div>
  <div class="tone good"><h3>👍 강점</h3><ul>${r.strengths.map(li).join("")}</ul></div>
  <div class="tone bad"><h3>⚠ 위험 요소</h3><ul>${r.risks.map(li).join("")}</ul></div>
  <div class="tone tip"><h3>💡 추천 전략</h3><ul>${r.strategies.map(li).join("")}</ul></div>
  <div class="card" style="background:var(--accent-soft);box-shadow:none"><h3 style="color:var(--accent)">🎯 종합 의견</h3><div style="font-size:13px;line-height:1.6;margin-top:4px">${esc(r.overall)}</div></div>
  ${r.limits.length ? `<div class="card"><h3>분석의 한계</h3><ul style="margin:6px 0 0;padding-left:18px;font-size:13px;line-height:1.6;color:var(--muted)">${r.limits.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : ""}
  ${sourceFoot(a)}`;
}

// ── 후보 비교 ────────────────────────────────────
export function compareHtml(list) {
  if (!list.length) {
    return `${head("후보지 비교", { back: false })}<div class="card"><div class="empty">후보지가 없어요.<br>분석 화면 오른쪽 위 ☆ 를 눌러 최대 3곳을 담아 보세요.</div></div><a class="btn ghost" href="#home">지역 검색하러 가기</a>`;
  }
  const names = ITEMS.map((i) => i.short);
  const cls = ["r1", "r2", "r3"];
  const lcls = ["i2", "i3", "i5"];
  const best = ITEMS.map((_, i) => Math.max(...list.map((a) => a.score.items[i].score ?? -1)));
  return `
  ${head("후보지 비교", { back: false, right: `<button class="ib" id="printBtn" aria-label="PDF로 저장">📄</button>` })}
  ${modeBanner()}
  <div class="card"><h3>5개 항목 레이더</h3><div style="width:260px;max-width:100%;margin:6px auto 0">${radar({ names, sets: list.map((a, i) => ({ values: a.score.items.map((it) => it.score), cls: cls[i] })) })}</div>
    <div class="legend" style="justify-content:center">${list.map((a, i) => `<span><i class="${lcls[i]}"></i>${esc(a.place.name)} ${esc(a.industry.name)} ${a.score.total ?? "-"}</span>`).join("")}</div></div>
  <div class="card"><h3>항목별 비교</h3><table class="cmp"><tr><th></th>${list.map((a) => `<th>${esc(a.place.name)}<br>${esc(a.industry.name)}</th>`).join("")}</tr>
    ${ITEMS.map((it, i) => `<tr><td>${it.short}</td>${list.map((a) => { const s = a.score.items[i].score; return `<td>${s == null ? "<span class='cap'>자료 없음</span>" : s === best[i] && list.length > 1 ? `<b class="best">${s}</b>` : s}</td>`; }).join("")}</tr>`).join("")}
    <tr><td>종합</td>${list.map((a) => `<td><b>${a.score.total ?? "-"}</b></td>`).join("")}</tr>
    <tr><td>등급</td>${list.map((a) => `<td>${a.score.grade ? `<span class="chip ${a.score.grade.cls}">${a.score.grade.name}</span>` : "-"}</td>`).join("")}</tr></table></div>
  <div class="foot">자료가 없는 항목은 점수에서 제외됩니다 · ${DISCLAIMER}</div>`;
}

// ── 내 분석 ──────────────────────────────────────
export function meHtml({ saved, theme }) {
  return `
  ${head("내 분석", { back: false })}
  <div class="card"><h3>담아 둔 후보지 <span class="cap">${saved.length}/3</span></h3>${saved.length ? saved.map((s) => `
    <a class="li" href="#map/${encodeURIComponent(s.place.name)}/${s.industryKey}"><div class="score-dot">${s.total ?? "-"}</div><b>${esc(s.place.name)} ${esc(s.industryName)}<small>${esc(s.grade || "")}</small></b>›</a>`).join("") : `<div class="empty">담아 둔 후보지가 없어요</div>`}
    ${saved.length ? `<a class="btn" href="#compare">후보지 비교하기</a>` : ""}</div>
  <div class="card"><h3>화면 테마</h3><div class="chips flat" id="themeChips" style="margin-bottom:0"><button class="c ${theme !== "dark" ? "on" : ""}" data-theme="">블루</button><button class="c ${theme === "dark" ? "on" : ""}" data-theme="dark">다크</button></div></div>
  <div class="card"><h3>연결 상태</h3><div style="font-size:13px;line-height:1.7;margin-top:6px">
    생활인구: ${popMode() === "live" ? "API 연결됨" : "<span class='down'>미연결 (개발용 예시)</span>"}<br>
    Kakao 지도: ${CONFIG.KAKAO_JS_KEY ? "키 설정됨" : "<span class='down'>키 없음 (예시 지도)</span>"}<br>
    임대료: <span class='down'>자료 확인 전</span></div></div>
  <div class="foot">${DISCLAIMER}</div>`;
}
