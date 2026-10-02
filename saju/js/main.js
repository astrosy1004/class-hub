// 화면 전환(#주소) · 명식 계산 묶음(model) · 이벤트 연결 전담.
// 주소: #home · #fortune · #monthly/<영역> · #life · #job · #me · #chart · #manse

import { calculateSaju } from "./manse.js";
import { CITIES } from "./saju-data.js";
import { analyzeNatal, lifeGraph, yearFlow } from "./score.js";
import { loadProfile, saveProfile, loadChartMode, saveChartMode, loadTheme, saveTheme } from "./store.js";
import { renderHome, renderFortune, renderMonthly, renderLife, renderJob, renderMe, renderChart, renderManse, themeButtons } from "./ui.js";
import { icon } from "./icons.js";

// 저장된 명식이 없을 때 보여주는 예시 (기획서 예시 명식: 병진·신축·계유·신유)
const SAMPLE = { sample: true, name: "홍길동", gender: "F", calendar: "solar", leap: false, date: "1990-03-15", time: "18:30", city: "서울", longitude: 126.98, applyDst: true, nightZi: false };

const TAB_OF = { home: "home", fortune: "fortune", monthly: "fortune", life: "home", job: "home", me: "me", chart: "chart", manse: "chart" };
const views = Object.fromEntries([...document.querySelectorAll("[data-view]")].map((el) => [el.dataset.view, el]));

let model = null;
let lifeSelected = -1;
let navCount = 0; // 앱 안에서 화면을 옮긴 횟수 (0이면 뒤로 갈 곳이 없으니 홈으로)

function buildModel(profile) {
  const today = new Date();
  const saju = calculateSaju({ ...profile, today });
  if (saju.error) return { error: saju.error };
  const natal = analyzeNatal(saju);
  return { profile, today, saju, natal, life: lifeGraph(saju, natal), year: yearFlow(natal, today.getFullYear()) };
}

function currentModel() {
  if (!model) {
    model = buildModel(loadProfile() || SAMPLE);
    if (model.error) model = buildModel(SAMPLE); // 저장된 값이 깨졌으면 예시로
  }
  return model;
}

function parseRoute() {
  const [name, arg] = (location.hash.slice(1) || "home").split("/");
  return { name: views[name] ? name : "home", arg };
}

function render() {
  const { name, arg } = parseRoute();
  const m = currentModel();
  const html = {
    home: () => renderHome(m),
    fortune: () => renderFortune(m),
    monthly: () => renderMonthly(m, arg || "total"),
    life: () => renderLife(m, lifeSelected),
    job: () => renderJob(m),
    me: () => renderMe(m, loadTheme()),
    chart: () => renderChart(m, loadChartMode()),
    manse: () => renderManse(loadProfile()),
  }[name]();

  for (const [key, el] of Object.entries(views)) el.hidden = key !== name;
  views[name].innerHTML = html;
  document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === TAB_OF[name]));
  if (name === "manse") wireManseForm();
}

// ── 만세력 입력 ─────────────────────────────
function wireManseForm() {
  const form = document.getElementById("manseForm");
  const lonField = form.querySelector("[data-lon]");
  form.elements.unknownTime.addEventListener("change", (e) => {
    form.elements.time.disabled = e.target.checked;
  });
  form.elements.city.addEventListener("change", (e) => {
    const city = CITIES.find((c) => c.name === e.target.value);
    lonField.hidden = Boolean(city);
    if (city) form.elements.longitude.value = city.lon;
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = form.elements;
    const cal = f.calendar.value;
    const city = CITIES.find((c) => c.name === f.city.value);
    const profile = {
      name: f.name.value.trim(),
      gender: f.gender.value,
      calendar: cal === "solar" ? "solar" : "lunar",
      leap: cal === "leap",
      date: f.date.value,
      time: f.unknownTime.checked ? null : f.time.value || null,
      city: city ? city.name : "",
      longitude: city ? city.lon : Number(f.longitude.value) || 126.98,
      applyDst: f.applyDst.checked,
      nightZi: f.nightZi.checked,
    };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.date) || profile.date < "1900-01-01" || profile.date > "2100-12-31") {
      return showFormError("생년월일을 1900~2100년 사이로 입력해 주세요.");
    }
    if (!f.unknownTime.checked && !profile.time) return showFormError("태어난 시각을 넣거나 '시간을 몰라요'를 체크해 주세요.");
    const next = buildModel(profile);
    if (next.error) return showFormError(next.error);
    saveProfile(profile);
    model = next;
    lifeSelected = -1;
    location.hash = "#chart";
  });
}

function showFormError(text) {
  const form = document.getElementById("manseForm");
  let p = form.querySelector(".form-error");
  if (!p) {
    p = document.createElement("p");
    p.className = "form-error";
    form.querySelector("button[type=submit]").before(p);
  }
  p.textContent = text;
}

// ── 테마 ─────────────────────────────
function applyTheme(id) {
  if (id === "lavender") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = id;
  const top = getComputedStyle(document.documentElement).getPropertyValue("--bg-top").trim();
  document.querySelector('meta[name="theme-color"]').content = top;
}

const sheet = document.getElementById("themeSheet");
function openThemeSheet() {
  document.getElementById("themeButtons").innerHTML = themeButtons(loadTheme());
  sheet.hidden = false;
}
sheet.addEventListener("click", (e) => {
  if (e.target === sheet) sheet.hidden = true;
});

// ── 클릭 (이벤트 위임) ─────────────────────────────
document.addEventListener("click", (e) => {
  const hit = e.target.closest(".chart-hit");
  if (hit && hit.closest('[data-chart="life"]')) {
    lifeSelected = Number(hit.dataset.i);
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
    return;
  }
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === "back") {
    if (navCount > 0) {
      navCount -= 2; // 뒤로 가기로 생기는 hashchange(+1)를 빼고 한 칸 줄인다
      history.back();
    }
    else location.hash = "#home";
  } else if (action === "theme") {
    openThemeSheet();
  } else if (action === "set-theme") {
    const id = btn.dataset.themeId;
    saveTheme(id);
    applyTheme(id);
    document.querySelectorAll('[data-action="set-theme"]').forEach((b) => b.classList.toggle("on", b.dataset.themeId === id));
    if (!sheet.hidden) setTimeout(() => (sheet.hidden = true), 180);
  } else if (action === "chart-mode") {
    saveChartMode(btn.dataset.mode);
    render();
  }
});

window.addEventListener("hashchange", () => {
  navCount++;
  if (parseRoute().name !== "life") lifeSelected = -1;
  render();
  window.scrollTo(0, 0);
});

// 탭바 아이콘
document.querySelectorAll("[data-icon]").forEach((el) => (el.outerHTML = icon(el.dataset.icon)));
applyTheme(loadTheme());
render();
