// 화면 흐름 조율 전담 파일. 이벤트를 받아 weather-api.js를 호출하고 ui.js로 그린다.
// 화면 5개(메인 · 날씨 정보 · 안전수칙 · 상세 안전수칙 · 알림/공유)는 주소의 # 뒷부분으로 바꾼다
// (#home, #weather, #rules, #rule/heat, #alerts). 그래서 휴대폰 뒤로가기 버튼이 그대로 동작한다.

import { searchCity, getForecast, getForecastMany, getAirQuality, reverseGeocode } from "./weather-api.js";
import { getWeatherInfo } from "./weather-codes.js";
import { CATEGORIES, LEVELS, getCategory, evaluateHazards } from "./safety-rules.js";
import * as store from "./store.js";
import * as share from "./share.js";
import * as ui from "./ui.js";
import { hydrateIcons } from "./icons.js";

// 메인 화면 "지금 전국 현장 날씨" 카드에 보여줄 도시 (좌표는 시청 기준)
const FEATURED_CITIES = [
  { short: "서울", name: "서울특별시", country: "대한민국", country_code: "KR", latitude: 37.5665, longitude: 126.978 },
  { short: "부산", name: "부산광역시", country: "대한민국", country_code: "KR", latitude: 35.1796, longitude: 129.0756 },
  { short: "인천", name: "인천광역시", country: "대한민국", country_code: "KR", latitude: 37.4563, longitude: 126.7052 },
  { short: "대구", name: "대구광역시", country: "대한민국", country_code: "KR", latitude: 35.8714, longitude: 128.6014 },
  { short: "대전", name: "대전광역시", country: "대한민국", country_code: "KR", latitude: 36.3504, longitude: 127.3845 },
  { short: "광주", name: "광주광역시", country: "대한민국", country_code: "KR", latitude: 35.1595, longitude: 126.8526 },
  { short: "제주", name: "제주시", admin1: "제주특별자치도", country: "대한민국", country_code: "KR", latitude: 33.4996, longitude: 126.5312 },
];

const NOT_FOUND_MESSAGE =
  "찾을 수 없습니다. '강남구', '서울특별시'처럼 행정구역 이름이나 영어(Seoul)로 검색해 보세요.";
const NETWORK_ERROR_MESSAGE =
  "정보를 불러오지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 화면을 켜 둔 동안 30분마다 날씨를 새로 받아 알림을 다시 판정

function log(...args) {
  console.log("[WEATHER]", ...args);
}

function logAuth(...args) {
  console.log("[AUTH]", ...args);
}

function logHistory(...args) {
  console.log("[HISTORY]", ...args);
}

const $ = (id) => document.getElementById(id);

const els = {
  menuBtn: $("menuBtn"),
  headerSearchBtn: $("headerSearchBtn"),
  headerAuth: $("headerAuth"),
  menuAccount: $("menuAccount"),
  cityCards: $("cityCards"),
  cityRefreshBtn: $("cityRefreshBtn"),
  guideCards: $("guideCards"),
  menu: $("appMenu"),
  searchForm: $("searchForm"),
  cityInput: $("cityInput"),
  searchBtn: $("searchBtn"),
  locateBtn: $("locateBtn"),
  status: $("statusMessage"),
  results: $("searchResults"),
  favoritesWrap: $("favoritesWrap"),
  favoritesList: $("favoritesList"),
  recentTitle: $("recentTitle"),
  recentList: $("recentList"),
  recentEmpty: $("recentEmpty"),
  hazardBanner: $("hazardBanner"),
  currentWeather: $("currentWeather"),
  currentStats: $("currentStats"),
  hourlyList: $("hourlyList"),
  dailyList: $("dailyList"),
  rulesSummary: $("rulesSummary"),
  rulesTabs: $("rulesTabs"),
  rulesHeading: $("rulesHeading"),
  rulesList: $("rulesList"),
  ruleDetail: $("ruleDetail"),
  noPlaceCard: $("noPlaceCard"),
  alertToggle: $("alertToggle"),
  alertCategoryList: $("alertCategoryList"),
  alertStatus: $("alertStatus"),
  shareEmpty: $("shareEmpty"),
  sharePanel: $("sharePanel"),
  qrBox: $("qrBox"),
  qrCode: $("qrCode"),
  sharePreview: $("sharePreview"),
  authStatus: $("authStatus"),
};

// 지금 보고 있는 지역과 그 날씨. 조회할 때마다 통째로 바꾼다.
const state = {
  place: null,
  forecast: null,
  air: null,
  hazards: [],
  rulesTab: "all",
  loading: false,
};

// --- 화면 전환 ------------------------------------------------------------
const VIEWS_NEEDING_PLACE = new Set(["weather", "rules"]);

function parseRoute() {
  const hash = location.hash.replace(/^#/, "");
  if (hash.startsWith("rule/")) {
    return { view: "detail", categoryId: hash.slice(5) };
  }
  if (hash === "share") {
    return { view: "alerts", anchor: "shareTitle" };
  }
  if (["home", "weather", "rules", "alerts"].includes(hash)) {
    return { view: hash };
  }
  return { view: "home" };
}

function go(hash) {
  if (location.hash === `#${hash}`) {
    route();
  } else {
    location.hash = hash;
  }
}

// scrollTop: 화면을 옮길 때는 맨 위로, 자동 새로고침으로 다시 그릴 때는 보던 위치 그대로
function route({ scrollTop = true } = {}) {
  const { view, categoryId, anchor } = parseRoute();
  const missingPlace = VIEWS_NEEDING_PLACE.has(view) && !state.forecast;

  for (const section of document.querySelectorAll(".view")) {
    section.hidden = section.dataset.view !== view || missingPlace;
  }
  // 불러오는 중이면 빈 화면 안내 대신 잠시 기다린다 (끝나면 renderAll → route를 다시 부름)
  els.noPlaceCard.hidden = !missingPlace || state.loading;

  const navKey = view === "detail" ? "rules" : view;
  for (const link of document.querySelectorAll("[data-nav], [data-tab]")) {
    const key = link.dataset.nav ?? link.dataset.tab;
    link.toggleAttribute("aria-current", key === navKey);
  }

  if (view === "detail") {
    const cat = getCategory(categoryId);
    if (!cat) {
      go("rules");
      return;
    }
    ui.renderRuleDetail(els.ruleDetail, cat, state.hazards.find((h) => h.id === cat.id));
  }
  if (scrollTop) {
    closeMenu();
    if (anchor) document.getElementById(anchor).scrollIntoView();
    else window.scrollTo(0, 0);
  }
}

window.addEventListener("hashchange", () => route());

// --- 메뉴 -----------------------------------------------------------------
function closeMenu() {
  els.menu.hidden = true;
  els.menuBtn.setAttribute("aria-expanded", "false");
}

els.menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const willOpen = els.menu.hidden;
  els.menu.hidden = !willOpen;
  els.menuBtn.setAttribute("aria-expanded", String(willOpen));
});

document.addEventListener("click", (e) => {
  if (!els.menu.hidden && !els.menu.contains(e.target)) closeMenu();
});

// 머리글 돋보기: 메인 화면의 검색창으로 이동해 바로 입력할 수 있게
els.headerSearchBtn.addEventListener("click", () => {
  if (parseRoute().view !== "home") go("home");
  els.cityInput.focus();
});

// --- 지역 조회 ------------------------------------------------------------
function setBusy(isBusy, message = "불러오는 중…") {
  state.loading = isBusy;
  els.searchBtn.disabled = isBusy;
  els.locateBtn.disabled = isBusy;
  if (isBusy) ui.showStatus(els.status, message);
}

/**
 * 지역의 날씨 · 미세먼지를 받아 모든 화면을 다시 그린다.
 * @param {object} place
 * @param {object} [opts]
 * @param {string|null} [opts.goTo] 다 불러온 뒤 이동할 화면 (null이면 지금 화면 유지)
 * @param {boolean} [opts.remember] 최근 조회·마지막 지역에 남길지 (자동 새로고침은 false)
 */
async function loadPlace(place, { goTo = "weather", remember = true } = {}) {
  ui.clearSearchResults(els.results);
  setBusy(true);
  try {
    // 미세먼지는 실패해도 날씨·안전수칙은 보여줘야 하므로 따로 잡는다
    const [forecast, air] = await Promise.all([
      getForecast(place.latitude, place.longitude),
      getAirQuality(place.latitude, place.longitude).catch((err) => {
        log("미세먼지 조회 실패:", err);
        return null;
      }),
    ]);
    state.place = place;
    state.forecast = forecast;
    state.air = air;
    state.hazards = evaluateHazards(forecast, air);
    ui.clearStatus(els.status);

    if (remember) {
      store.saveLastPlace(place);
      store.addRecent(place);
      saveCurrentToHistory(place);
    }
    setBusy(false);
    renderAll();
    checkAlerts();
    if (goTo) go(goTo);
  } catch (err) {
    log("날씨 조회 오류:", err);
    ui.showStatus(els.status, NETWORK_ERROR_MESSAGE, true);
    setBusy(false);
    route();
    if (parseRoute().view !== "home") ui.showToast(NETWORK_ERROR_MESSAGE);
  }
}

async function handleSearch(query) {
  const trimmed = query.trim();
  if (!trimmed) return;

  ui.clearSearchResults(els.results);
  setBusy(true);
  try {
    const results = await searchCity(trimmed);
    setBusy(false);
    if (results.length === 0) {
      ui.showStatus(els.status, NOT_FOUND_MESSAGE, true);
      return;
    }
    if (results.length === 1) {
      await loadPlace(results[0]);
      return;
    }
    ui.showStatus(els.status, "여러 지역이 찾아졌습니다. 조회할 지역을 골라 주세요.");
    ui.renderSearchResults(els.results, results, (place) => loadPlace(place));
  } catch (err) {
    log("검색 오류:", err);
    ui.showStatus(els.status, NETWORK_ERROR_MESSAGE, true);
    setBusy(false);
  }
}

els.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleSearch(els.cityInput.value);
});

// --- 지금 전국 현장 날씨 카드 --------------------------------------------------
let cityCardsLoading = false;

async function loadCityCards() {
  if (cityCardsLoading) return;
  cityCardsLoading = true;
  const pick = (city) => loadPlace(city);
  ui.renderCityCards(els.cityCards, FEATURED_CITIES.map((city) => ({ city, forecast: null, hazards: [] })), pick);
  try {
    const forecasts = await getForecastMany(FEATURED_CITIES);
    const items = FEATURED_CITIES.map((city, i) => ({
      city,
      forecast: forecasts[i],
      // 카드는 미세먼지 없이 날씨로만 판정한다 (도시마다 미세먼지 요청을 또 보내지 않으려고)
      hazards: evaluateHazards(forecasts[i], null),
    }));
    ui.renderCityCards(els.cityCards, items, pick);
  } catch (err) {
    log("도시 카드 조회 실패:", err);
    els.cityCards.innerHTML = '<p class="empty-hint">날씨를 불러오지 못했습니다. 새로고침을 눌러 주세요.</p>';
  } finally {
    cityCardsLoading = false;
  }
}

els.cityRefreshBtn.addEventListener("click", loadCityCards);

const GEO_ERRORS = {
  1: "위치 권한이 거부됐습니다. 주소창 왼쪽 아이콘에서 위치 권한을 허용하거나 지역명으로 검색해 주세요.",
  2: "현재 위치를 확인할 수 없습니다. 지역명으로 검색해 주세요.",
  3: "위치 확인 시간이 초과됐습니다. 다시 시도하거나 지역명으로 검색해 주세요.",
};

els.locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    ui.showStatus(els.status, "이 브라우저는 위치 확인을 지원하지 않습니다. 지역명으로 검색해 주세요.", true);
    return;
  }
  setBusy(true, "현재 위치를 확인하는 중…");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      const named = await reverseGeocode(latitude, longitude);
      setBusy(false);
      loadPlace({ ...(named ?? { name: "현재 위치" }), latitude, longitude });
    },
    (err) => {
      setBusy(false);
      ui.showStatus(els.status, GEO_ERRORS[err.code] ?? GEO_ERRORS[2], true);
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
  );
});

// --- 화면 그리기 ------------------------------------------------------------
function currentLabel() {
  return state.place ? ui.formatPlaceLabel(state.place) : "";
}

function renderAll() {
  const { forecast, air, hazards } = state;
  const label = currentLabel();

  for (const el of document.querySelectorAll('[data-bind="placeLabel"]')) el.textContent = label;
  for (const el of document.querySelectorAll('[data-bind="updatedAt"]')) {
    el.textContent = ui.formatUpdatedAt(forecast.current.time);
  }
  for (const el of document.querySelectorAll('[data-bind="dateLabel"]')) {
    el.textContent = ui.formatDate(forecast.current.time);
  }

  renderFavoriteButton();
  ui.renderHazardBanner(els.hazardBanner, hazards);
  ui.renderCurrentWeather(els.currentWeather, forecast, air);
  ui.renderCurrentStats(els.currentStats, forecast);
  ui.renderHourly(els.hourlyList, forecast);
  ui.renderDaily(els.dailyList, forecast);
  renderRules();
  renderSharePanel();
  renderHomeLists();
  route({ scrollTop: false });
}

function renderRules() {
  const info = getWeatherInfo(state.forecast.current.weather_code);
  ui.renderRulesSummary(els.rulesSummary, state.hazards, info);
  ui.renderRulesTabs(els.rulesTabs, state.rulesTab, state.hazards, (tab) => {
    state.rulesTab = tab;
    renderRules();
  });
  els.rulesHeading.textContent = ui.renderRulesList(els.rulesList, state.rulesTab, state.hazards, info.desc);
}

// --- 즐겨찾기 현장 · 최근 조회 ----------------------------------------------
function renderFavoriteButton() {
  const on = state.place ? store.isFavorite(state.place) : false;
  for (const btn of document.querySelectorAll('[data-action="toggle-favorite"]')) {
    btn.classList.toggle("is-on", on); // 별 아이콘은 CSS가 .is-on일 때 채운다
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? "즐겨찾기 현장에서 빼기" : "즐겨찾기 현장에 추가");
  }
}

document.addEventListener("click", (e) => {
  if (!e.target.closest('[data-action="toggle-favorite"]') || !state.place) return;
  const added = store.toggleFavorite(state.place);
  ui.showToast(added ? "즐겨찾기 현장에 추가했습니다." : "즐겨찾기 현장에서 뺐습니다.");
  renderFavoriteButton();
  renderHomeLists();
});

// 로그인했으면 Firestore의 최근 조회, 아니면 이 기기에 저장된 최근 조회를 보여준다.
let cloudHistory = null;

function renderHomeLists() {
  const favorites = store.loadFavorites();
  els.favoritesWrap.hidden = favorites.length === 0;
  ui.renderPlaceChips(
    els.favoritesList,
    favorites,
    (place) => loadPlace(place),
    (place) => {
      store.removeFavorite(place);
      renderHomeLists();
      renderFavoriteButton();
    }
  );

  const recent = cloudHistory ?? store.loadRecent();
  els.recentTitle.textContent = cloudHistory ? "최근 조회 지역 (내 계정)" : "최근 조회 지역";
  els.recentEmpty.hidden = recent.length > 0;
  ui.renderPlaceChips(els.recentList, recent, (place) => loadPlace(place));
}

// --- 위험 기상 알림 ---------------------------------------------------------
const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
let alertSettings = store.loadAlertSettings(CATEGORY_IDS);

function notificationState() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
}

function renderAlertSettings() {
  els.alertToggle.checked = alertSettings.enabled;
  ui.renderAlertCategories(els.alertCategoryList, alertSettings, (id, checked) => {
    alertSettings.categories[id] = checked;
    store.saveAlertSettings(alertSettings);
  });

  let hint;
  if (!alertSettings.enabled) {
    hint = "알림을 켜면 조회한 지역에 위험 기상이 있을 때 알려드립니다.";
  } else {
    const perm = notificationState();
    hint =
      perm === "granted"
        ? "이 화면을 열어 둔 동안 30분마다 날씨를 확인해 위험 기상을 알림으로 보내드립니다."
        : perm === "denied"
          ? "브라우저 알림이 차단돼 있어 앱 화면 안에서만 알려드립니다. 주소창 왼쪽 아이콘에서 알림을 허용할 수 있습니다."
          : "브라우저 알림을 지원하지 않아 앱 화면 안에서만 알려드립니다.";
  }
  els.alertStatus.textContent = hint;
}

els.alertToggle.addEventListener("change", async () => {
  alertSettings.enabled = els.alertToggle.checked;
  store.saveAlertSettings(alertSettings);
  if (alertSettings.enabled && notificationState() === "default") {
    try {
      await Notification.requestPermission();
    } catch (err) {
      log("알림 권한 요청 실패:", err);
    }
  }
  renderAlertSettings();
  if (alertSettings.enabled) checkAlerts();
});

function sendNotification(title, body) {
  if (notificationState() === "granted") {
    try {
      const n = new Notification(title, { body, tag: "site-safety", lang: "ko" });
      n.onclick = () => {
        window.focus();
        go("rules");
        n.close();
      };
      return;
    } catch (err) {
      // 안드로이드 크롬처럼 페이지에서 바로 알림을 못 띄우는 환경은 화면 안 알림으로 대신한다
      log("시스템 알림 실패, 화면 알림으로 대체:", err);
    }
  }
  ui.showToast(`🔔 ${title} — ${body}`);
}

// 알림을 켰고, 체크한 분류에 해당하는 위험이 새로 생겼을 때만(같은 날 같은 단계는 한 번) 보낸다.
function checkAlerts() {
  if (!alertSettings.enabled || !state.forecast) return;
  const today = state.forecast.current.time.slice(0, 10);
  const fresh = state.hazards.filter(
    (h) =>
      alertSettings.categories[h.id] &&
      h.level >= 2 &&
      store.shouldNotify(state.place, today, h.id, h.level)
  );
  if (fresh.length === 0) return;
  const title = `${currentLabel()} 위험 기상 알림`;
  const body = fresh
    .map((h) => `${getCategory(h.id).tab} ${LEVELS[h.level].label} (${h.reason})`)
    .join(", ");
  sendNotification(title, `${body}. 안전수칙을 확인하세요.`);
}

setInterval(() => {
  if (state.place && document.visibilityState === "visible") {
    loadPlace(state.place, { goTo: null, remember: false });
  }
}, REFRESH_INTERVAL_MS);

// --- 공유 -------------------------------------------------------------------
function shareUrl() {
  return share.buildShareUrl(state.place, currentLabel());
}

function renderSharePanel() {
  const hasPlace = Boolean(state.forecast);
  els.shareEmpty.hidden = hasPlace;
  els.sharePanel.hidden = !hasPlace;
  if (!hasPlace) return;
  els.qrBox.hidden = true;
  ui.renderSharePreview(els.sharePreview, currentLabel(), state.forecast, state.hazards);
}

function shareMessage() {
  const info = getWeatherInfo(state.forecast.current.weather_code);
  const weatherLine = `${info.desc} ${Math.round(state.forecast.current.temperature_2m)}℃`;
  const hazardLines = state.hazards.map((h) => `${getCategory(h.id).tab} ${LEVELS[h.level].label}`);
  const topRules = state.hazards.length
    ? state.hazards.map((h) => getCategory(h.id).rules[0].title)
    : getCategory("basic").rules.slice(0, 2).map((r) => r.title);
  return share.buildShareText(currentLabel(), weatherLine, hazardLines, topRules);
}

els.sharePanel.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn || !state.place) return;
  const action = btn.dataset.action;
  try {
    if (action === "copy-link") {
      await share.copyText(shareUrl());
      ui.showToast("링크를 복사했습니다. 단톡방에 붙여넣어 공유하세요.");
    } else if (action === "show-qr") {
      els.qrBox.hidden = false;
      els.qrCode.textContent = "QR코드를 만드는 중…";
      await share.renderQrCode(els.qrCode, shareUrl());
    } else if (action === "native-share") {
      const result = await share.shareNative("현장 날씨 안전도우미", shareMessage(), shareUrl());
      if (result === "copied") {
        ui.showToast("공유 메시지를 복사했습니다. 카카오톡 채팅방에 붙여넣어 주세요.");
      }
    }
  } catch (err) {
    log("공유 오류:", err);
    if (action === "show-qr") els.qrCode.textContent = "QR코드를 만들지 못했습니다. 네트워크를 확인해 주세요.";
    else ui.showToast("공유하지 못했습니다. 다시 시도해 주세요.");
  }
});

// --- 로그인 -----------------------------------------------------------------
// auth.js는 앱 시작 때 한 번만 동적 import한다 (클릭 시점에 import하면 안 됨.
// 클릭과 팝업 사이에 비동기 작업이 끼면 브라우저가 팝업을 막는다).
// Firebase CDN을 못 불러와도 날씨·안전수칙 기능은 그대로 동작해야 하므로 실패를 잡아
// "로그인을 불러오지 못했습니다"로 대체한다.
let authApi = null;

function authErrorMessage(err) {
  switch (err.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null; // 안내 없이 원래 상태로
    case "auth/popup-blocked":
      return "팝업이 차단됐습니다. 주소창 오른쪽의 팝업 차단 아이콘에서 허용해 주세요.";
    case "auth/unauthorized-domain":
      return `이 주소(${location.hostname})가 Firebase 승인된 도메인에 없습니다. 콘솔 → Authentication → 설정 → 승인된 도메인에 추가해 주세요.`;
    case "auth/operation-not-supported-in-this-environment":
      return "파일을 직접 열면 로그인할 수 없습니다. 로컬 서버(http://localhost:5500)로 열어 주세요.";
    case "auth/network-request-failed":
      return "네트워크 연결을 확인해 주세요.";
    default:
      return `로그인 중 오류가 발생했습니다. (${err.code ?? "unknown"})`;
  }
}

function handleAuthError(err) {
  logAuth("오류:", err.code, err);
  const message = authErrorMessage(err);
  if (message) {
    ui.showStatus(els.authStatus, message, true);
  }
}

// 클릭 이벤트 처리 안에서 signInWithPopup까지 다른 await 없이 바로 이어져야 한다.
function handleLoginClick() {
  if (!authApi) return;
  ui.clearStatus(els.authStatus);
  closeMenu();
  authApi.signInWithGoogle().catch(handleAuthError);
}

function handleLogoutClick() {
  if (!authApi) return;
  closeMenu();
  authApi.signOutUser().catch((err) => {
    logAuth("로그아웃 오류:", err);
  });
}

// --- 최근 조회 기록 (로그인한 사용자만 Firestore에) ---------------------------
// history.js도 auth.js와 같은 이유로, 로그인했을 때 딱 한 번만 동적 import한다.
let currentUser = null;
let historyApiPromise = null;
let unsubscribeHistory = null;

function loadHistoryApi() {
  if (!historyApiPromise) {
    historyApiPromise = import("./history.js").catch((err) => {
      historyApiPromise = null;
      logHistory("history.js 로드 실패:", err);
      throw err;
    });
  }
  return historyApiPromise;
}

function startHistorySubscription(uid) {
  loadHistoryApi()
    .then((api) => {
      unsubscribeHistory = api.subscribeHistory(uid, (items) => {
        cloudHistory = items;
        renderHomeLists();
      });
    })
    .catch(() => {
      // 기록 기능만 못 쓰는 것이므로 나머지 화면은 그대로 둔다.
    });
}

function stopHistorySubscription() {
  if (unsubscribeHistory) {
    unsubscribeHistory();
    unsubscribeHistory = null;
  }
  historyApiPromise = null;
  cloudHistory = null;
  renderHomeLists();
}

// 로그인 상태일 때만 Firestore에 남긴다. history.js가 아직 로딩 중이어도
// loadHistoryApi()가 같은 로딩을 기다렸다가 이어서 저장한다.
function saveCurrentToHistory(place) {
  if (!currentUser) return;
  loadHistoryApi()
    .then((api) => api.saveToHistory(currentUser.uid, place))
    .catch((err) => {
      logHistory("저장 오류:", err);
    });
}

import("./auth.js")
  .then((mod) => {
    authApi = mod;
    logAuth("auth.js 로드 완료");
    authApi.subscribeAuthState((user) => {
      currentUser = user;
      if (user) {
        ui.renderSignedIn(els.headerAuth, els.menuAccount, user, handleLogoutClick);
        startHistorySubscription(user.uid);
      } else {
        ui.renderSignedOut(els.headerAuth, els.menuAccount, handleLoginClick);
        stopHistorySubscription();
      }
    });
  })
  .catch((err) => {
    logAuth("auth.js 로드 실패:", err);
    ui.renderAuthUnavailable(els.headerAuth, els.menuAccount);
  });

// --- 시작 -------------------------------------------------------------------
// 공유 링크(?lat=&lon=&name=)로 열었으면 그 지역을, 아니면 마지막으로 본 지역을 불러온다.
function placeFromShareLink() {
  const params = new URLSearchParams(location.search);
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  if (!params.has("lat") || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  const label = (params.get("name") ?? "").slice(0, 40) || "공유된 지역";
  // 주소창을 깔끔하게 (새로고침해도 공유 링크를 다시 처리하지 않게) 쿼리를 지운다
  history.replaceState(null, "", `${location.pathname}${location.hash}`);
  return { name: label, label, latitude: lat, longitude: lon };
}

function init() {
  hydrateIcons();
  ui.renderGuideCards(els.guideCards);
  loadCityCards();
  renderHomeLists();
  renderAlertSettings();
  renderSharePanel();
  route();

  const shared = placeFromShareLink();
  if (shared) {
    loadPlace(shared, { goTo: parseRoute().view === "home" ? "rules" : null });
    return;
  }
  const last = store.loadLastPlace();
  if (last) {
    log("마지막으로 본 지역 복원:", last.name);
    loadPlace(last, { goTo: null, remember: false });
  }
}

init();
