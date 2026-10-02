// 화면 전환(#주소) · 명식 목록/계산 묶음(model) · 로그인 · 이벤트 연결 전담.
// 주소: #home · #fortune · #monthly/<영역> · #life · #job · #me · #chart · #charts · #manse/<new|edit>

import { calculateSaju } from "./manse.js";
import { CITIES } from "./saju-data.js";
import { analyzeNatal, lifeGraph, yearFlow } from "./score.js";
import {
  loadLocalCharts, saveLocalChart, deleteLocalChart, newChartId, loadCurrentId, saveCurrentId,
  loadChartMode, saveChartMode, loadTheme, saveTheme,
} from "./store.js";
import {
  renderHome, renderFortune, renderMonthly, renderLife, renderJob, renderMe, renderChart, renderManse, renderCharts, themeButtons,
} from "./ui.js";
import { icon } from "./icons.js";

// 저장된 명식이 없을 때 보여주는 가상의 예시 (실제 인물 아님: 경오·기묘·기묘·기사)
const SAMPLE = { sample: true, id: "sample", name: "홍길동", relation: "예시", gender: "M", calendar: "solar", leap: false, date: "1990-03-15", time: "10:30", city: "서울", longitude: 126.98, applyDst: true, nightZi: false };

const TAB_OF = { home: "home", fortune: "fortune", monthly: "fortune", life: "home", job: "home", me: "me", chart: "chart", charts: "chart", manse: "chart" };
const views = Object.fromEntries([...document.querySelectorAll("[data-view]")].map((el) => [el.dataset.view, el]));

// 로그인 · 계정 명식 상태
const account = {
  ready: false, // 로그인 모듈을 불러와 첫 상태를 받았는지
  user: null, // { uid, displayName, photoURL, email }
  error: "", // 로그인 모듈을 못 불러왔을 때 문구
  charts: null, // 계정 명식 목록 (null이면 불러오는 중)
};
let authApi = null;
let cloudApi = null;
let unsubscribeCharts = null;

let model = null;
let modelKey = "";
let lifeSelected = -1;
let navCount = 0; // 앱 안에서 화면을 옮긴 횟수 (0이면 뒤로 갈 곳이 없으니 홈으로)

// ── 명식 목록 ─────────────────────────────
function chartList() {
  return account.user ? account.charts || [] : loadLocalCharts();
}

function currentChart() {
  const list = chartList();
  const id = loadCurrentId();
  return list.find((c) => c.id === id) || list[0] || SAMPLE;
}

function buildModel(chart) {
  const today = new Date();
  const saju = calculateSaju({ ...chart, today });
  if (saju.error) return { error: saju.error };
  const natal = analyzeNatal(saju);
  return { profile: chart, today, saju, natal, life: lifeGraph(saju, natal), year: yearFlow(natal, today.getFullYear()) };
}

function currentModel() {
  const chart = currentChart();
  const key = JSON.stringify([chart.id, chart.date, chart.time, chart.calendar, chart.leap, chart.gender, chart.longitude, chart.applyDst, chart.nightZi, chart.name]);
  if (!model || key !== modelKey) {
    model = buildModel(chart);
    if (model.error) model = buildModel(SAMPLE); // 저장된 값이 깨졌으면 예시로
    modelKey = key;
  }
  return model;
}

async function persistChart(chart) {
  if (account.user && cloudApi) await cloudApi.saveCloudChart(account.user.uid, chart);
  else saveLocalChart(chart);
}

async function removeChart(id) {
  if (account.user && cloudApi) await cloudApi.deleteCloudChart(account.user.uid, id);
  else deleteLocalChart(id);
  if (loadCurrentId() === id) saveCurrentId(null);
}

// ── 화면 그리기 ─────────────────────────────
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
    me: () => renderMe(m, loadTheme(), account),
    chart: () => renderChart(m, loadChartMode()),
    charts: () => renderCharts(chartList(), currentChart().id, account),
    manse: () => renderManse(arg === "new" || currentChart().sample ? null : currentChart()),
  }[name]();

  for (const [key, el] of Object.entries(views)) el.hidden = key !== name;
  views[name].innerHTML = html;
  document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === TAB_OF[name]));
  if (name === "manse") wireManseForm(arg === "new" || currentChart().sample ? null : currentChart());
}

function rerenderKeepScroll() {
  const y = window.scrollY;
  render();
  window.scrollTo(0, y);
}

let toastTimer = null;
function toast(text) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.append(el);
  }
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2600);
}

// ── 만세력 입력 (새 명식 / 수정) ─────────────────────────────
function wireManseForm(editing) {
  const form = document.getElementById("manseForm");
  const f = form.elements;
  const lonField = form.querySelector("[data-lon]");
  const consentField = form.querySelector("[data-consent]");
  f.unknownTime.addEventListener("change", (e) => {
    f.time.disabled = e.target.checked;
  });
  f.city.addEventListener("change", (e) => {
    const city = CITIES.find((c) => c.name === e.target.value);
    lonField.hidden = Boolean(city);
    if (city) f.longitude.value = city.lon;
  });
  f.relation.addEventListener("change", (e) => {
    consentField.hidden = e.target.value === "본인";
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cal = f.calendar.value;
    const city = CITIES.find((c) => c.name === f.city.value);
    const chart = {
      id: editing ? editing.id : newChartId(),
      name: f.name.value.trim(),
      relation: f.relation.value,
      gender: f.gender.value,
      calendar: cal === "solar" ? "solar" : "lunar",
      leap: cal === "leap",
      date: f.date.value,
      time: f.unknownTime.checked ? null : f.time.value || null,
      city: city ? city.name : "",
      longitude: city ? city.lon : Number(f.longitude.value) || 126.98,
      applyDst: f.applyDst.checked,
      nightZi: f.nightZi.checked,
      consent: f.relation.value === "본인" || f.consent.checked,
    };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(chart.date) || chart.date < "1900-01-01" || chart.date > "2100-12-31") {
      return showFormError("생년월일을 1900~2100년 사이로 입력해 주세요.");
    }
    if (!f.unknownTime.checked && !chart.time) return showFormError("태어난 시각을 넣거나 '시간을 몰라요'를 체크해 주세요.");
    if (chart.relation !== "본인" && !f.consent.checked) return showFormError("가족·지인 명식은 본인 동의를 받았는지 체크해 주세요.");
    const check = buildModel(chart);
    if (check.error) return showFormError(check.error);

    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      await persistChart(chart);
    } catch (err) {
      console.error("[CHARTS] 저장 실패", err);
      button.disabled = false;
      return showFormError("계정에 저장하지 못했어요. 인터넷 연결을 확인해 주세요.");
    }
    saveCurrentId(chart.id);
    lifeSelected = -1;
    toast(account.user ? "내 계정에 저장했어요" : "이 기기에 저장했어요");
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

// ── 로그인 ─────────────────────────────
function authErrorMessage(err) {
  switch (err?.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    case "auth/popup-blocked":
      return "팝업이 막혔어요. 브라우저에서 팝업을 허용해 주세요.";
    case "auth/unauthorized-domain":
      return "이 주소에서는 로그인할 수 없어요 (Firebase 승인된 도메인 확인).";
    case "auth/operation-not-allowed":
    case "auth/configuration-not-found":
      return "구글 로그인이 아직 켜져 있지 않아요 (Firebase 콘솔 설정 필요).";
    case "auth/network-request-failed":
      return "인터넷 연결을 확인해 주세요.";
    default:
      return "로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요.";
  }
}

function startChartSync(uid) {
  unsubscribeCharts?.();
  let first = true;
  unsubscribeCharts = cloudApi.subscribeCloudCharts(
    uid,
    (list) => {
      account.charts = list;
      // 처음 받을 때 이 기기에만 있는 명식을 계정으로 올린다 (같은 id면 겹치지 않음)
      if (first) {
        first = false;
        const missing = loadLocalCharts().filter((c) => !list.some((x) => x.id === c.id));
        if (missing.length) {
          Promise.all(missing.map((c) => cloudApi.saveCloudChart(uid, c)))
            .then(() => toast(`이 기기의 명식 ${missing.length}개를 계정에 올렸어요`))
            .catch((err) => console.error("[CHARTS] 올리기 실패", err));
        }
      }
      rerenderKeepScroll();
    },
    (err) => {
      console.error("[CHARTS] 구독 오류", err);
      account.charts = account.charts || [];
      toast("계정 명식을 불러오지 못했어요");
      rerenderKeepScroll();
    },
  );
}

// 로그인 모듈은 앱 시작 때 한 번만 불러온다 (클릭 때 불러오면 팝업이 막힌다)
Promise.all([import("./auth.js"), import("./cloud.js")])
  .then(([authMod, cloudMod]) => {
    authApi = authMod;
    cloudApi = cloudMod;
    authApi.subscribeAuthState((user) => {
      account.ready = true;
      account.user = user ? { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL, email: user.email } : null;
      if (user) {
        account.charts = null;
        startChartSync(user.uid);
      } else {
        unsubscribeCharts?.();
        unsubscribeCharts = null;
        account.charts = null;
      }
      rerenderKeepScroll();
    });
  })
  .catch((err) => {
    console.error("[AUTH] 로그인 모듈을 불러오지 못함", err);
    account.ready = true;
    account.error = "로그인을 불러오지 못했어요. 명식은 이 기기에 저장돼요.";
    rerenderKeepScroll();
  });

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
    rerenderKeepScroll();
    return;
  }
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;

  if (action === "back") {
    if (navCount > 0) {
      navCount -= 2; // 뒤로 가기로 생기는 hashchange(+1)를 빼고 한 칸 줄인다
      history.back();
    } else location.hash = "#home";
  } else if (action === "theme") {
    openThemeSheet();
  } else if (action === "set-theme") {
    const themeId = btn.dataset.themeId;
    saveTheme(themeId);
    applyTheme(themeId);
    document.querySelectorAll('[data-action="set-theme"]').forEach((b) => b.classList.toggle("on", b.dataset.themeId === themeId));
    if (!sheet.hidden) setTimeout(() => (sheet.hidden = true), 180);
  } else if (action === "chart-mode") {
    saveChartMode(btn.dataset.mode);
    render();
  } else if (action === "login") {
    if (!authApi) return;
    // 팝업이 막히지 않도록 다른 await 없이 바로 부른다
    authApi.signInWithGoogle().catch((err) => {
      console.error("[AUTH] 로그인 실패", err);
      const message = authErrorMessage(err);
      if (message) toast(message);
    });
  } else if (action === "logout") {
    authApi?.signOutUser().then(() => toast("로그아웃했어요"));
  } else if (action === "select-chart") {
    saveCurrentId(id);
    lifeSelected = -1;
    const chart = chartList().find((c) => c.id === id);
    toast(`${chart?.name || "이름 없는"} 명식으로 바꿨어요`);
    location.hash = "#home";
  } else if (action === "edit-chart") {
    saveCurrentId(id);
    location.hash = "#manse/edit";
  } else if (action === "delete-chart") {
    const chart = chartList().find((c) => c.id === id);
    if (!confirm(`${chart?.name || "이름 없는"} 명식을 지울까요? 되돌릴 수 없어요.`)) return;
    removeChart(id)
      .then(() => {
        toast("명식을 지웠어요");
        rerenderKeepScroll();
      })
      .catch((err) => {
        console.error("[CHARTS] 삭제 실패", err);
        toast("지우지 못했어요. 인터넷 연결을 확인해 주세요.");
      });
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
