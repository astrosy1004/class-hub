// 화면 전환(#주소) · 검색 · 이벤트. 계산은 analysis.js, 그리기는 ui.js.
// 주소 형식: #home · #result/연남동/cafe (분석 결과) → #map/… · #analysis/… · #trend/… · #report/… (4단계) · #compare · #me
import { INDUSTRIES, industryByKey } from "./area-data.js";
import { parseQuery, resolvePlace, resolveCurrent } from "./place.js";
import { analyze, applyRent } from "./analysis.js";
import { drawMap, ensureKakao, kakaoReady, kakaoState } from "./kmap.js";
import { probeConnections } from "./fetchers.js";
import { CONFIG } from "./config.js";
import { getRecent, addRecent, removeRecent, clearRecent, getSaved, toggleSaved, isSaved, getTheme, setTheme, getIndustryKey, setIndustryKey, getAutoLocate, setAutoLocate, setSavedList, setRecentList, clearUserLists } from "./store.js";
import { initAuth, signIn, signOutUser, authErrorMessage } from "./auth.js";
import * as cloud from "./cloud.js";
import { mergeLists } from "./sync.js";
import * as ui from "./ui.js";
import { explainHtml } from "./explain.js";
import { pdfReportHtml, reportFileName } from "./pdf-report.js";

const $ = (s, el = document) => el.querySelector(s);
const views = Object.fromEntries([...document.querySelectorAll(".view")].map((v) => [v.dataset.view, v]));
const state = { industryKey: industryByKey(getIndustryKey()).key, hourMode: "weekday", range: 0, current: null, error: "", moreOpen: false, autoTried: false, locating: false, user: null, authOk: true, syncing: false };

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
  const tab = name === "home" ? "home" : name === "compare" ? "compare" : name === "me" ? "me" : "result";
  document.querySelectorAll("#tabbar a").forEach((a) => {
    a.classList.toggle("on", a.dataset.tab === tab);
    if (a.dataset.tab === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  updateSavedBadge();
  document.getElementById("app").classList.toggle("wide", name === "pdf"); // 보고서는 A4 폭으로 넓게 미리보기
  window.scrollTo(0, 0);
}

// 하단 메뉴 "후보 비교"에 담은 후보 수 표시
function updateSavedBadge() {
  const n = getSaved().length, b = document.getElementById("savedN");
  if (!b) return;
  b.textContent = n;
  b.hidden = !n;
  b.closest("a")?.setAttribute("aria-label", n ? `후보 비교, 담은 후보 ${n}곳` : "후보 비교");
}

// ── 로그인 · 계정 동기화 ─────────────────────────
// 내 정보 화면을 그린 뒤 연결 상태를 실제로 읽어 채운다
const setConn = (id, ok, text) => { const el = document.getElementById(id); if (!el) return; el.textContent = (ok ? "✔ " : "✖ ") + text; el.className = ok ? "cn-ok" : "cn-bad"; };
async function runProbes() {
  const [res, kakao] = await Promise.all([
    probeConnections(),
    CONFIG.KAKAO_JS_KEY ? ensureKakao().then((ok) => ({ ok, text: ok ? "연결됨" : kakaoState.error || "SDK를 불러오지 못했어요" })) : Promise.resolve({ ok: false, text: "키가 없어요 (예시 지도 · 예시 점포)" }),
  ]);
  setConn("cn-pop", res.pop.ok, res.pop.text);
  setConn("cn-base", res.baseline.ok, res.baseline.text);
  setConn("cn-kakao", kakao.ok && kakaoReady(), kakao.text);
}
const showMe = () => { show("me", meHtml()); runProbes(); };
const meHtml = () => ui.meHtml({ saved: getSaved(), theme: getTheme(), autoLocate: getAutoLocate(), user: state.user, authOk: state.authOk, syncing: state.syncing });
const refreshMe = () => { updateSavedBadge(); if (views.me.classList.contains("on")) showMe(); };

// 이 기기 목록을 계정에 맞춘다 (로그인 중일 때만, 실패해도 앱은 계속 동작)
function pushToCloud(kind) {
  if (!state.user) return;
  const list = kind === "saved" ? getSaved() : getRecent();
  cloud.replaceKind(state.user.uid, kind, list).catch(() => toast("계정에 저장하지 못했어요 (이 기기에는 저장됨)"));
}

// 로그인 직후: 계정 목록과 이 기기 목록을 합쳐 양쪽을 같게 맞춘다
async function syncOnLogin(user) {
  state.syncing = true;
  refreshMe();
  try {
    const remote = await cloud.fetchAll(user.uid);
    const savedM = mergeLists(getSaved(), remote.saved, 3);
    const recentM = mergeLists(getRecent(), remote.recent, 8);
    setSavedList(savedM.merged);
    setRecentList(recentM.merged);
    await Promise.all([cloud.replaceKind(user.uid, "saved", savedM.merged), cloud.replaceKind(user.uid, "recent", recentM.merged)]);
    toast("로그인했어요 · 후보지를 동기화했어요");
  } catch (e) {
    toast("계정과 동기화하지 못했어요. 이 기기 목록은 그대로예요.");
  } finally {
    state.syncing = false;
    refreshMe();
    if (views.home.classList.contains("on")) renderHome();
  }
}

function startAuth() {
  initAuth((user, ok) => {
    const wasLoggedIn = !!state.user;
    state.authOk = ok;
    state.user = user;
    if (user && !wasLoggedIn) syncOnLogin(user);
    else refreshMe();
  });
}

const summary = (a) => ({ key: a.key, place: a.place, industryKey: a.industry.key, industryName: a.industry.name, total: a.score.total, grade: a.score.grade?.name || "" });

// ── 검색 · 분석 ──────────────────────────────────
// 공통 흐름: (장소 확인) → 생활인구 · 경쟁 점포 조회 → 점수. resolver 가 장소를 돌려준다 (지역 검색 또는 현재 위치).
async function startFlow(resolver, ind, firstLabel) {
  const steps = [
    { name: firstLabel, state: "run" }, { name: "생활인구 조회", state: "wait" },
    { name: "경쟁 점포 조회", state: "wait" }, { name: "점수 계산", state: "wait" },
  ];
  let errMsg = "";
  const paint = () => { const box = $("#progress"); if (box) box.innerHTML = ui.progressHtml(steps) + (errMsg ? `<div class="err-box">${errMsg}</div>` : ""); };
  const setStep = (i, st) => { steps[i].state = st; paint(); };
  state.locating = true;
  paint();
  try {
    const place = await resolver();
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
    pushToCloud("recent");
    location.hash = `#result/${encodeURIComponent(place.name)}/${ind.key}`;
  } catch (e) {
    const cur = steps.findIndex((s) => s.state === "run");
    if (cur >= 0) steps[cur].state = "err";
    errMsg = e.message;
    paint();
  } finally {
    state.locating = false;
    document.querySelector("[data-locate]")?.removeAttribute("disabled");
  }
}

async function runSearch(text) {
  const parsed = parseQuery(text);
  const ind = parsed.industry || industryByKey(state.industryKey);
  const placeText = parsed.placeText || text.trim();
  if (!placeText) return;
  await startFlow(async () => {
    const place = await resolvePlace(placeText);
    if (!place) throw new Error(`'${placeText}' 지역을 찾지 못했어요. ${CONFIG.KAKAO_JS_KEY ? "다른 이름으로 검색해 보세요." : "예시 모드에서는 연남동 · 합정동 · 성수동 · 역삼동 등 일부 지역만 검색됩니다."}`);
    return place;
  }, ind, "지역(행정동) 확인");
}

// 현재 위치로 찾기 (버튼 또는 앱을 열 때 자동)
async function runLocate() {
  document.querySelector("[data-locate]")?.setAttribute("disabled", "");
  await startFlow(resolveCurrent, industryByKey(state.industryKey), "현재 위치 확인");
}

// 앱을 열자마자 현재 위치로 검색 (설정이 켜져 있고, 위치 권한이 거부 상태가 아닐 때 한 번만)
async function autoLocateOnce() {
  if (state.autoTried) return;
  state.autoTried = true;
  if (!getAutoLocate() || !navigator.geolocation) return;
  try {
    const perm = await navigator.permissions?.query({ name: "geolocation" });
    if (perm?.state === "denied") return; // 이미 거부했다면 조용히 건너뜀 (버튼으로는 계속 시도 가능)
  } catch (e) { /* Permissions API 없음 — 그냥 진행 */ }
  runLocate();
}

// 주소로 들어왔을 때 분석 결과 찾기 (현재 → 최근 기록 → 다시 검색)
async function ensureAnalysis(name, indKey) {
  const ind = industryByKey(indKey);
  if (state.current && state.current.place.name === name && state.current.industry.key === ind.key) return state.current;
  const known = getRecent().find((r) => r.place.name === name && r.industryKey === ind.key) || getSaved().find((r) => r.place.name === name && r.industryKey === ind.key);
  const place = known ? await placeFor(known) : await resolvePlace(name);
  if (!place) return null;
  state.current = await analyze(place, ind);
  return state.current;
}

// 저장된 항목의 장소: 좌표가 있으면 그대로, 없으면(계정에서 온 현재 위치 항목 등) 구 + 행정동 이름으로 다시 찾는다
async function placeFor(item) {
  const p = item.place;
  if (p && p.lat != null && p.lng != null) return p;
  return (await resolvePlace(`${p.guName || ""} ${p.name}`.trim())) || null;
}

// ── 라우터 ───────────────────────────────────────
async function route() {
  const [view = "home", rawName, indKey] = location.hash.replace(/^#/, "").split("/");
  const name = rawName ? decodeURIComponent(rawName) : "";
  try {
    if (view === "home" || !views[view]) { renderHome(); if (!location.hash || location.hash === "#home") autoLocateOnce(); return; }
    if (view === "compare") return renderCompare();
    if (view === "me") return showMe();
    // 결과 화면
    let a = null;
    if (name) a = await ensureAnalysis(name, indKey);
    else a = state.current;
    if (!a && name) return renderHome(`'${name}' 지역을 찾지 못했어요. 주소가 잘못됐거나 지원하지 않는 지역일 수 있어요.`);
    if (!a) {
      // 하단 메뉴 "분석 결과": 이번에 본 결과가 없으면 가장 최근 분석을 연다
      const last = getRecent()[0];
      if (last) return location.replace(`#${view}/${encodeURIComponent(last.place.name)}/${last.industryKey}`);
      return renderHome("먼저 지역과 업종을 검색해 주세요");
    }
    renderResult(view, a);
  } catch (e) {
    renderHome(e.message);
  }
}

function renderHome(error = "") {
  const q = document.getElementById("q")?.value || "";
  show("home", ui.homeHtml({ recent: getRecent(), industryKey: state.industryKey, error, moreOpen: state.moreOpen, q, locating: state.locating }));
}

function renderResult(view, a) {
  if (view === "map") {
    show("map", ui.mapHtml(a));
    const icon = a.industry.icon;
    state.mapCtrl = null;
    drawMap($("#mapBox"), a.place, a.comp, CONFIG.RADIUS_M, icon, { onSelect: showStore }).then((ctrl) => { state.mapCtrl = ctrl; });
  } else if (view === "result") show("result", ui.resultHtml(a, isSaved(a.key)));
  else if (view === "analysis") show("analysis", ui.analysisHtml(a, state));
  else if (view === "trend") show("trend", ui.trendHtml(a, state));
  else if (view === "report") show("report", ui.reportHtml(a));
  else if (view === "pdf") {
    show("pdf", `<div class="pdf-bar"><a class="ib" href="${`#report/${encodeURIComponent(a.place.name)}/${a.industry.key}`}" aria-label="뒤로">‹</a><b>결과 보고서 미리보기</b><button type="button" class="pdf-go" data-pdf-print>📄 PDF로 저장</button></div>
      <div class="pdf-tip">‘PDF로 저장’을 누르면 인쇄 창이 열려요. 대상(프린터)을 <b>PDF로 저장</b>으로 고르고, 더 많은 설정에서 <b>배경 그래픽</b>을 켜면 색이 그대로 나와요.</div>
      ${pdfReportHtml(a)}`);
  }
}

// 같은 동네에서 주요 업종 7개를 차례로 분석해 점수 순위를 보여준다 (눌렀을 때만 · 업종마다 점포 검색 1회씩)
const COMPARE_KEYS = ["cafe", "restaurant", "bar", "cvs", "hospital", "salon", "bakery"];
async function compareIndustries(btn) {
  const a = state.current, box = document.getElementById("indCmp");
  if (!a || !box || btn.disabled) return;
  btn.disabled = true;
  const rows = [];
  try {
    for (let i = 0; i < COMPARE_KEYS.length; i++) {
      box.innerHTML = `<div class="cap" style="margin-top:8px">${i + 1}/${COMPARE_KEYS.length} 업종 분석 중…</div>`;
      const ind = industryByKey(COMPARE_KEYS[i]);
      rows.push(ind.key === a.industry.key ? a : await analyze(a.place, ind));
    }
    box.innerHTML = ui.industryCompareHtml(rows, a.industry.key);
    btn.hidden = true;
  } catch (e) {
    box.innerHTML = `<div class="err-box" style="margin-top:8px">업종 비교를 불러오지 못했어요. ${e.message || ""}</div>`;
    btn.disabled = false;
  }
}

// 결과 링크 공유: 휴대폰은 공유 창, 그 외에는 주소 복사 (주소만으로 같은 결과가 열린다)
async function shareResult() {
  const a = state.current;
  if (!a) return;
  const url = `${location.origin}${location.pathname}#result/${encodeURIComponent(a.place.name)}/${a.industry.key}`;
  const title = `${a.place.name} ${a.industry.name} 입지 분석`;
  try {
    if (navigator.share) { await navigator.share({ title, text: `${title} · 입지 적합도 ${a.score.total ?? "-"}점`, url }); return; }
  } catch (e) { if (e.name === "AbortError") return; /* 공유 창 실패 → 복사로 */ }
  try { await navigator.clipboard.writeText(url); toast("결과 링크를 복사했어요"); }
  catch (e) { window.prompt("이 주소를 복사해 공유하세요", url); }
}

// 지도의 점포를 누르면 상세 카드, 빈 곳을 누르면 닫기
function showStore(item, i) {
  const box = document.getElementById("storeCard");
  if (!box) return;
  document.querySelectorAll(".store-li").forEach((b) => b.classList.toggle("on", item && Number(b.dataset.store) === i));
  if (!item) { box.hidden = true; return; }
  box.innerHTML = ui.storeCardHtml(item, state.current.industry);
  box.hidden = false;
  // 작은 지도에서는 상세 카드가 지도를 다 가리므로 크게 펼친다
  const wrap = document.getElementById("mapWrap");
  if (wrap?.classList.contains("small")) document.querySelector("[data-mapbig]")?.click();
}

async function renderCompare() {
  const saved = getSaved();
  show("compare", ui.compareHtml([]));
  if (!saved.length) return;
  const list = [];
  for (const s of saved) {
    try { const place = await placeFor(s); if (place) list.push(await analyze(place, industryByKey(s.industryKey))); } catch (e) { /* 한 곳 실패해도 나머지는 비교 */ }
  }
  show("compare", ui.compareHtml(list));
}

// ── 이벤트 ───────────────────────────────────────
document.addEventListener("submit", (e) => {
  if (e.target.id === "searchForm") {
    e.preventDefault();
    runSearch($("#q").value);
  } else if (e.target.id === "rentForm") {
    // 알아본 매물 월세 → 임대료 점수 반영 (보증금 또는 월세 중 하나는 있어야 함)
    e.preventDefault();
    if (!state.current) return;
    const input = Object.fromEntries(new FormData(e.target));
    if (!Number(String(input.deposit).replace(/[^0-9.]/g, "")) && !Number(String(input.monthly).replace(/[^0-9.]/g, ""))) return toast("보증금이나 월세를 넣어 주세요");
    applyRent(state.current, input);
    renderResult("result", state.current);
    toast(state.current.rent?.score != null ? `임대료를 반영했어요 · 종합 ${state.current.score.total ?? "-"}점` : "매물을 저장했어요. 예상 매출을 넣으면 점수에 반영돼요");
  } else if (e.target.id === "customForm") {
    // 직접 입력한 업종: "마라탕" → 키워드 검색 업종으로 적용
    e.preventDefault();
    const kw = $("#customInd").value.trim().replace(/\s+/g, " ");
    if (!kw) return;
    state.industryKey = industryByKey(`custom:${encodeURIComponent(kw)}`).key;
    setIndustryKey(state.industryKey);
    state.moreOpen = false;
    renderHome();
    toast(`업종을 '${kw}'(으)로 바꿨어요`);
  }
});

document.addEventListener("click", (e) => {
  const t = e.target.closest("button, a");
  if (!t) return;
  if (t.dataset.ind) {
    state.industryKey = t.dataset.ind;
    setIndustryKey(state.industryKey);
    state.moreOpen = false; // 업종을 고르면 드롭다운을 닫는다
    renderHome();
  } else if (t.dataset.more !== undefined) {
    state.moreOpen = !state.moreOpen;
    renderHome();
    if (state.moreOpen) $("#morePanel .dd-row.on, #morePanel .dd-row")?.focus();
  } else if (t.dataset.locate !== undefined) {
    runLocate();
  } else if (t.dataset.auto !== undefined && t.closest("#autoChips")) {
    setAutoLocate(t.dataset.auto === "1");
    showMe();
  } else if (t.dataset.area) {
    // 인기 지역: 검색창에 넣고 하단 분석 버튼을 연다 (분석은 버튼으로 시작)
    $("#q").value = t.dataset.area;
    updateHomeCta();
    document.querySelectorAll("[data-area]").forEach((b) => b.classList.toggle("on", b === t));
  } else if (t.dataset.h) {
    state.hourMode = t.dataset.h;
    renderResult("analysis", state.current);
  } else if (t.dataset.r !== undefined) {
    state.range = Number(t.dataset.r);
    renderResult("trend", state.current);
  } else if (t.dataset.conf !== undefined) {
    // 신뢰도 배지: 이유 펼치기 / 접기
    const box = document.getElementById("confBox");
    if (!box) return;
    box.hidden = !box.hidden;
    t.setAttribute("aria-expanded", String(!box.hidden));
  } else if (t.dataset.mapgo !== undefined) {
    // "지도 · 경쟁 점포" 타일: 주소(#)를 바꾸지 않고 아래 지도로 내려간다
    e.preventDefault();
    document.getElementById("mapSec")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (t.dataset.mapbig !== undefined) {
    const wrap = document.getElementById("mapWrap");
    if (!wrap) return;
    const big = wrap.classList.toggle("big");
    wrap.classList.toggle("small", !big);
    t.textContent = big ? "지도 작게 보기" : "지도 크게 보기";
    t.setAttribute("aria-expanded", String(big));
    state.mapCtrl?.relayout?.();
  } else if (t.dataset.storeClose !== undefined) {
    state.mapCtrl?.clear();
  } else if (t.dataset.stores !== undefined) {
    const box = document.getElementById("storeList");
    if (!box || !state.current) return;
    const open = box.hidden;
    if (open && !box.innerHTML) box.innerHTML = ui.storeListHtml(state.current.comp.items);
    box.hidden = !open;
    t.setAttribute("aria-expanded", String(open));
  } else if (t.dataset.store !== undefined) {
    state.mapCtrl?.select(Number(t.dataset.store));
    document.getElementById("mapSec")?.scrollIntoView({ behavior: "smooth", block: "start" }); // 지도와 상세 카드가 보이도록
  } else if (t.dataset.indcmp !== undefined) {
    compareIndustries(t);
  } else if (t.dataset.probe !== undefined) {
    document.querySelectorAll("#connBox b[id]").forEach((b) => { b.textContent = "확인 중…"; b.className = "cn-wait"; });
    runProbes();
  } else if (t.dataset.share !== undefined) {
    shareResult();
  } else if (t.dataset.recentDel) {
    removeRecent(t.dataset.recentDel);
    pushToCloud("recent");
    renderHome();
  } else if (t.dataset.recentClear !== undefined) {
    clearRecent();
    pushToCloud("recent");
    renderHome();
    toast("최근 검색을 모두 지웠어요");
  } else if (t.dataset.unsave) {
    // 후보 비교: 담은 후보에서 빼기 (목록과 비교표를 다시 그린다)
    toggleSaved({ key: t.dataset.unsave });
    pushToCloud("saved");
    toast("후보지에서 뺐어요");
    renderCompare();
  } else if (t.dataset.signin !== undefined) {
    // 팝업은 클릭 처리 안에서 바로 열어야 하므로 이 호출 앞에 await 를 두지 않는다
    signIn().catch((err) => { const m = authErrorMessage(err); if (m) toast(m); });
  } else if (t.dataset.signout !== undefined) {
    signOutUser().then(() => {
      // 공용 기기에서 다음 사람에게 보이지 않도록 이 기기의 후보지 · 최근 검색을 비운다 (계정에는 남아 있음)
      clearUserLists();
      state.user = null;
      toast("로그아웃했어요 · 이 기기의 목록을 비웠어요");
      refreshMe();
    }).catch(() => toast("로그아웃하지 못했어요"));
  } else if (t.dataset.explain) {
    // 점수 항목 · 종합 점수: 산출 근거 펼치기 / 접기
    const box = document.getElementById(t.dataset.box || `d-${t.dataset.explain}`);
    if (!box || !state.current) return;
    const open = box.hidden;
    if (open && !box.innerHTML) box.innerHTML = explainHtml(state.current, t.dataset.explain);
    box.hidden = !open;
    t.setAttribute("aria-expanded", String(open));
    t.classList.toggle("open", open);
  } else if (t.dataset.allitems !== undefined) {
    const box = document.getElementById("allItems");
    if (!box) return;
    box.hidden = !box.hidden;
    t.setAttribute("aria-expanded", String(!box.hidden));
    t.textContent = box.hidden ? "항목별 점수 전체 보기 ›" : "항목별 점수 접기";
  } else if (t.dataset.rentopen !== undefined) {
    const f = document.getElementById("rentForm");
    if (!f) return;
    f.hidden = !f.hidden;
    t.setAttribute("aria-expanded", String(!f.hidden));
    if (!f.hidden) f.querySelector("input")?.focus();
  } else if (t.dataset.rentclear !== undefined) {
    if (!state.current) return;
    applyRent(state.current, null);
    renderResult("result", state.current);
    toast("매물 정보를 지웠어요");
  } else if (t.id === "saveBtn") {
    const r = toggleSaved(summary(state.current));
    if (!r.ok) return toast(r.msg);
    t.textContent = r.saved ? "★" : "☆";
    t.classList.toggle("on", r.saved);
    t.setAttribute("aria-pressed", String(r.saved));
    pushToCloud("saved");
    updateSavedBadge();
    toast(r.saved ? "후보지에 담았어요" : "후보지에서 뺐어요");
  } else if (t.dataset.pdfPrint !== undefined) {
    // 인쇄 대화상자의 기본 파일 이름이 되도록 문서 제목을 잠시 바꾼다
    const prev = document.title;
    document.title = state.current ? reportFileName(state.current) : prev;
    window.addEventListener("afterprint", () => { document.title = prev; }, { once: true });
    window.print();
  } else if (t.id === "printBtn") {
    window.print();
  } else if (t.dataset.theme !== undefined && t.closest("#themeChips")) {
    setTheme(t.dataset.theme);
    applyTheme(t.dataset.theme);
    showMe();
  }
});

// 홈: 지역을 입력하는 대로 하단 분석 버튼 문구를 맞춘다
function updateHomeCta() {
  const btn = document.getElementById("homeCta");
  if (!btn) return;
  const c = ui.homeCtaLabel($("#q")?.value || "", state.industryKey);
  btn.textContent = c.text;
  btn.disabled = !c.ready;
}
document.addEventListener("input", (e) => { if (e.target.id === "q") updateHomeCta(); });

// 더보기 드롭다운: 바깥을 누르거나 Esc 를 누르면 닫는다
// (위의 click 처리 다음에 실행되므로, 다른 버튼의 동작을 끝낸 뒤 닫힌다)
function closeMore(focus) {
  if (!state.moreOpen || location.hash.replace(/^#/, "").split("/")[0] !== "home" && location.hash) return;
  state.moreOpen = false;
  renderHome();
  if (focus) $("[data-more]")?.focus();
}
document.addEventListener("click", (e) => { if (state.moreOpen && !e.target.closest("#morePanel, [data-more]")) closeMore(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMore(true); });
window.addEventListener("hashchange", route);
applyTheme(getTheme());
route();
startAuth();

// 개발 편의: 콘솔에서 상태를 볼 수 있게
window.__loc = { state, INDUSTRIES };
