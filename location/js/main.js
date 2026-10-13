// 화면 전환(#주소) · 검색 · 이벤트. 계산은 analysis.js, 그리기는 ui.js.
// 주소 형식: #home · #map/연남동/cafe · #analysis/… · #trend/… · #report/… · #compare · #me
import { INDUSTRIES, industryByKey } from "./area-data.js";
import { parseQuery, resolvePlace } from "./place.js";
import { analyze } from "./analysis.js";
import { drawMap } from "./kmap.js";
import { CONFIG } from "./config.js";
import { getRecent, addRecent, getSaved, toggleSaved, isSaved, getTheme, setTheme } from "./store.js";
import * as ui from "./ui.js";

const $ = (s, el = document) => el.querySelector(s);
const views = Object.fromEntries([...document.querySelectorAll(".view")].map((v) => [v.dataset.view, v]));
const state = { industryKey: "cafe", hourMode: "weekday", range: 0, current: null, error: "" };

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(toast.id);
  toast.id = setTimeout(() => t.classList.remove("on"), 2200);
}

function applyTheme(t) {
  if (t) document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

function show(name, html) {
  Object.entries(views).forEach(([k, v]) => v.classList.toggle("on", k === name));
  views[name].innerHTML = html;
  const tab = name === "home" ? "home" : name === "compare" ? "compare" : name === "me" ? "me" : "map";
  document.querySelectorAll("#tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === tab));
  window.scrollTo(0, 0);
}

const summary = (a) => ({ key: a.key, place: a.place, industryKey: a.industry.key, industryName: a.industry.name, total: a.score.total, grade: a.score.grade?.name || "" });

// ── 검색 · 분석 ──────────────────────────────────
async function runSearch(text) {
  const parsed = parseQuery(text);
  const ind = parsed.industry || industryByKey(state.industryKey);
  const placeText = parsed.placeText || text.trim();
  if (!placeText) return;
  const steps = [
    { name: "지역(행정동) 확인", state: "run" }, { name: "생활인구 조회", state: "wait" },
    { name: "경쟁 점포 조회", state: "wait" }, { name: "점수 계산", state: "wait" },
  ];
  let errMsg = "";
  const paint = () => { $("#progress").innerHTML = ui.progressHtml(steps) + (errMsg ? `<div class="err-box">${errMsg}</div>` : ""); };
  const setStep = (i, s) => { steps[i].state = s; paint(); };
  paint();
  try {
    const place = await resolvePlace(placeText);
    if (!place) throw new Error(`'${placeText}' 지역을 찾지 못했어요. ${CONFIG.KAKAO_JS_KEY ? "다른 이름으로 검색해 보세요." : "예시 모드에서는 연남동 · 합정동 · 성수동 · 역삼동 등 일부 지역만 검색됩니다."}`);
    setStep(0, "done");
    setStep(1, "run"); setStep(2, "run");
    const a = await analyze(place, ind, (e) => {
      if (e === "pop-done") setStep(1, "done");
      if (e === "pop-missing") setStep(1, "skip");
      if (e === "comp-done") setStep(2, "done");
      if (e === "score") setStep(3, "run");
    });
    setStep(3, "done");
    state.current = a;
    addRecent({ ...summary(a) });
    location.hash = `#map/${encodeURIComponent(place.name)}/${ind.key}`;
  } catch (e) {
    const cur = steps.findIndex((s) => s.state === "run");
    if (cur >= 0) steps[cur].state = "err";
    errMsg = e.message;
    paint();
  }
}

// 주소로 들어왔을 때 분석 결과 찾기 (현재 → 최근 기록 → 다시 검색)
async function ensureAnalysis(name, indKey) {
  const ind = industryByKey(indKey);
  if (state.current && state.current.place.name === name && state.current.industry.key === ind.key) return state.current;
  const known = getRecent().find((r) => r.place.name === name && r.industryKey === ind.key) || getSaved().find((r) => r.place.name === name && r.industryKey === ind.key);
  const place = known ? known.place : await resolvePlace(name);
  if (!place) return null;
  state.current = await analyze(place, ind);
  return state.current;
}

// ── 라우터 ───────────────────────────────────────
async function route() {
  const [view = "home", rawName, indKey] = location.hash.replace(/^#/, "").split("/");
  const name = rawName ? decodeURIComponent(rawName) : "";
  try {
    if (view === "home" || !views[view]) return renderHome();
    if (view === "compare") return renderCompare();
    if (view === "me") return show("me", ui.meHtml({ saved: getSaved(), theme: getTheme() }));
    // 결과 화면
    let a = null;
    if (name) a = await ensureAnalysis(name, indKey);
    else a = state.current;
    if (!a) return renderHome("먼저 지역과 업종을 검색해 주세요");
    renderResult(view, a);
  } catch (e) {
    renderHome(e.message);
  }
}

function renderHome(error = "") {
  show("home", ui.homeHtml({ recent: getRecent(), industryKey: state.industryKey, error }));
}

function renderResult(view, a) {
  if (view === "map") {
    show("map", ui.mapHtml(a, isSaved(a.key)));
    const icon = a.industry.icon;
    drawMap($("#mapBox"), a.place, a.comp, CONFIG.RADIUS_M, icon);
  } else if (view === "analysis") show("analysis", ui.analysisHtml(a, state));
  else if (view === "trend") show("trend", ui.trendHtml(a, state));
  else if (view === "report") show("report", ui.reportHtml(a));
}

async function renderCompare() {
  const saved = getSaved();
  show("compare", ui.compareHtml([]));
  if (!saved.length) return;
  const list = [];
  for (const s of saved) {
    try { list.push(await analyze(s.place, industryByKey(s.industryKey))); } catch (e) { /* 한 곳 실패해도 나머지는 비교 */ }
  }
  show("compare", ui.compareHtml(list));
}

// ── 이벤트 ───────────────────────────────────────
document.addEventListener("submit", (e) => {
  if (e.target.id === "searchForm") {
    e.preventDefault();
    runSearch($("#q").value);
  }
});

document.addEventListener("click", (e) => {
  const t = e.target.closest("button, a");
  if (!t) return;
  if (t.dataset.ind) {
    state.industryKey = t.dataset.ind;
    document.querySelectorAll("#indChips .c").forEach((c) => c.classList.toggle("on", c.dataset.ind === state.industryKey));
  } else if (t.dataset.suggest) {
    $("#q").value = t.dataset.suggest;
    runSearch(t.dataset.suggest);
  } else if (t.dataset.h) {
    state.hourMode = t.dataset.h;
    renderResult("analysis", state.current);
  } else if (t.dataset.r !== undefined) {
    state.range = Number(t.dataset.r);
    renderResult("trend", state.current);
  } else if (t.id === "saveBtn") {
    const r = toggleSaved(summary(state.current));
    if (!r.ok) return toast(r.msg);
    t.textContent = r.saved ? "★" : "☆";
    toast(r.saved ? "후보지에 담았어요" : "후보지에서 뺐어요");
  } else if (t.id === "printBtn") {
    window.print();
  } else if (t.dataset.theme !== undefined && t.closest("#themeChips")) {
    setTheme(t.dataset.theme);
    applyTheme(t.dataset.theme);
    show("me", ui.meHtml({ saved: getSaved(), theme: t.dataset.theme }));
  }
});

window.addEventListener("hashchange", route);
applyTheme(getTheme());
route();

// 개발 편의: 콘솔에서 상태를 볼 수 있게
window.__loc = { state, INDUSTRIES };
