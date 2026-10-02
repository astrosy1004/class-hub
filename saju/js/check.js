// 엔진 검증 페이지(check.html) 화면 그리기 전담. 계산은 manse.js · solar-terms.js가 한다.

import { STEMS, BRANCHES, ELEMENTS, SOLAR_TERMS } from "./saju-data.js";
import { calculateSaju, fourPillarsText, formatClock } from "./manse.js";
import { solarTermsOfYear, solarTermJd, msFromJd } from "./solar-terms.js";
import { CASES, TERM_CHECKS } from "./test-cases.js";

const $ = (sel) => document.querySelector(sel);
const KST_MS = 9 * 3600000;

function esc(text) {
  return String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

const elementClass = (index) => `el-${ELEMENTS[index].id}`;

// ── 직접 조회 ─────────────────────────────
function renderResult(r) {
  const order = [
    ["시주", r.pillars.hour],
    ["일주", r.pillars.day],
    ["월주", r.pillars.month],
    ["연주", r.pillars.year],
  ];
  const cell = (p, fn) => (p ? fn(p) : '<span class="muted">-</span>');
  const row = (title, fn, cls = "") =>
    `<tr><th>${title}</th>${order.map(([, p]) => `<td class="${cls}">${cell(p, fn)}</td>`).join("")}</tr>`;

  const pillarsTable = `
    <table class="pillars">
      <tr><th></th>${order.map(([name]) => `<th>${name}</th>`).join("")}</tr>
      ${row("천간 십신", (p) => `<span class="god">${p.stemGod}</span>`)}
      ${row("천간", (p) => `<span class="${elementClass(STEMS[p.stem].element)}">${STEMS[p.stem].han}</span><div class="god">${STEMS[p.stem].ko}·${ELEMENTS[STEMS[p.stem].element].ko}</div>`, "big")}
      ${row("지지", (p) => `<span class="${elementClass(BRANCHES[p.branch].element)}">${BRANCHES[p.branch].han}</span><div class="god">${BRANCHES[p.branch].ko}·${BRANCHES[p.branch].animal}</div>`, "big")}
      ${row("지지 십신", (p) => `<span class="god">${p.branchGod}</span>`)}
      ${row("지장간", (p) => p.hidden.map((h) => h.han).join(" "))}
      ${row("12운성", (p) => p.stage)}
    </table>`;

  const daeun = r.daeun.list
    .map((d) => `<div class="${d.current ? "now" : ""}">${d.startAge}세<strong>${d.text}</strong>${d.stemGod}<br>${d.branchGod}</div>`)
    .join("");

  const lmt = r.localMeanTime ? `${r.localMeanTime} (경도 보정)` : "시간 모름 → 시주 없이 세 기둥";
  $("#result").innerHTML = `
    ${pillarsTable}
    <div class="meta">
      <div><b>네 기둥 (연·월·일·시)</b>${fourPillarsText(r)}</div>
      <div><b>입력 시각 (UTC+${r.utcOffset})</b>${r.birthClock}</div>
      <div><b>지방시</b>${lmt}</div>
      <div><b>태양 황경</b>${r.sunLongitude.toFixed(4)}°</div>
      <div><b>직전 절기</b>${r.jie.prev.name} ${r.jie.prev.kst}</div>
      <div><b>다음 절기</b>${r.jie.next.name} ${r.jie.next.kst}</div>
      <div><b>대운</b>${r.daeun.forward ? "순행" : "역행"} · 대운수 ${r.daeun.number} (${r.daeun.days.toFixed(2)}일 ÷ 3 = ${r.daeun.exactYears.toFixed(2)})</div>
      <div><b>${r.seun.year} 세운 · 나이(세는 나이)</b>${r.seun.text} (${r.seun.ko}) · ${r.seun.stemGod} · ${r.koreanAge}세</div>
    </div>
    <div class="daeun">${daeun}</div>
    <p class="notice">대운 나이는 세는 나이 기준이며, 주황 칸이 현재 대운입니다. 명리 해석을 단순화한 참고용입니다.</p>`;
}

function readForm() {
  const f = new FormData($("#form"));
  const unknown = f.get("unknownTime") === "on";
  return {
    date: f.get("date"),
    time: unknown ? null : f.get("time") || null,
    gender: f.get("gender"),
    longitude: Number(f.get("longitude")) || undefined,
    nightZi: f.get("nightZi") === "on",
  };
}

$("#form").addEventListener("submit", (e) => {
  e.preventDefault();
  renderResult(calculateSaju(readForm()));
});

$("#form").elements.unknownTime.addEventListener("change", (e) => {
  $("#form").elements.time.disabled = e.target.checked;
});

// ── 검증 사례 ─────────────────────────────
function renderCases() {
  let pass = 0;
  let appTotal = 0;
  let appPass = 0;
  const rows = CASES.map((c) => {
    const r = calculateSaju({ date: c.date, time: c.time, gender: c.gender });
    const got = fourPillarsText(r);
    const pillarOk = got === c.expect;
    const daeunOk = c.daeun == null || c.daeun === r.daeun.number;
    const ok = pillarOk && daeunOk;
    if (ok) pass++;
    if (c.source.startsWith("앱:")) {
      appTotal++;
      if (ok) appPass++;
    }
    const daeunCell = c.daeun == null ? r.daeun.number : `${r.daeun.number} / 기대 ${c.daeun}`;
    return `<tr class="${ok ? "" : "row-ng"}">
      <td class="left">${esc(c.label)}</td>
      <td>${c.date} ${c.time ?? "시간 모름"} ${c.gender === "M" ? "남" : "여"}</td>
      <td>${got}</td>
      <td>${esc(c.expect)}</td>
      <td>${daeunCell}</td>
      <td class="${ok ? "ok" : "ng"}">${ok ? "일치" : "불일치"}</td>
      <td class="left muted">${esc(c.source)}</td>
    </tr>`;
  }).join("");
  $("#caseTable").innerHTML = `
    <tr><th class="left">사례</th><th>입력</th><th>계산</th><th>기대</th><th>대운수</th><th>결과</th><th class="left">출처</th></tr>${rows}`;
  $("#caseSummary").textContent = `${pass}/${CASES.length} 일치 · 관문 ${appPass}/30`;
}

// ── 절기 시각 ─────────────────────────────
const kst = (jd) => formatClock(msFromJd(jd) + KST_MS);

function renderTerms(year) {
  const rows = solarTermsOfYear(year)
    .map((t) => `<tr><td>${t.isJie ? "<b>" + t.name + "</b>" : t.name}</td><td>${(285 + 15 * t.index) % 360}°</td><td>${kst(t.jd)}</td><td>${t.isJie ? "월 바뀜" : ""}</td></tr>`)
    .join("");
  $("#termTable").innerHTML = `<tr><th>절기</th><th>태양 황경</th><th>절입 시각(한국시간)</th><th></th></tr>${rows}`;
}

function renderTermCheck() {
  const diffs = TERM_CHECKS.map((c) => {
    const got = msFromJd(solarTermJd(c.year, c.index)) + KST_MS;
    const expected = Date.parse(c.kst.replace(" ", "T") + ":00Z");
    return { ...c, minutes: (got - expected) / 60000 };
  });
  const worst = Math.max(...diffs.map((d) => Math.abs(d.minutes)));
  const ok = worst < 1.5;
  $("#termCheck").innerHTML = `<span class="${ok ? "ok" : "ng"}">${diffs.length}건 중 최대 오차 ${worst.toFixed(1)}분</span> (${diffs
    .map((d) => `${d.year} ${SOLAR_TERMS[d.index]} ${d.minutes >= 0 ? "+" : ""}${d.minutes.toFixed(1)}분`)
    .join(", ")})`;
}

$("#termForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const year = Number(new FormData(e.target).get("year"));
  if (year >= 1900 && year <= 2100) renderTerms(year);
});

renderResult(calculateSaju(readForm()));
renderCases();
renderTerms(new Date().getFullYear());
renderTermCheck();
