// 화면 흐름 조율 전담 파일. 이벤트를 받아 weather-api.js를 호출하고 ui.js로 그린다.

import { searchCity, getForecast } from "./weather-api.js";
import * as ui from "./ui.js";

const STORAGE_KEY = "weatherApp:lastCity";
const NOT_FOUND_MESSAGE =
  "찾을 수 없습니다. '서울특별시'처럼 전체 이름이나 영어(Seoul)로 검색해 보세요.";
const NETWORK_ERROR_MESSAGE =
  "정보를 불러오지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.";

function log(...args) {
  console.log("[WEATHER]", ...args);
}

function logAuth(...args) {
  console.log("[AUTH]", ...args);
}

const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const quickCities = document.getElementById("quickCities");
const statusEl = document.getElementById("statusMessage");
const resultsEl = document.getElementById("searchResults");
const weatherSection = document.getElementById("weatherSection");
const currentWeatherEl = document.getElementById("currentWeather");
const forecastListEl = document.getElementById("forecastList");
const loginSlot = document.getElementById("loginSlot");
const authStatusEl = document.getElementById("authStatus");

function setBusy(isBusy) {
  searchBtn.disabled = isBusy;
  if (isBusy) {
    ui.showStatus(statusEl, "불러오는 중…");
  }
}

function saveLastCity(place) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        name: place.name,
        admin1: place.admin1 ?? null,
        country: place.country ?? null,
        latitude: place.latitude,
        longitude: place.longitude,
      })
    );
  } catch (err) {
    log("localStorage 저장 실패:", err);
  }
}

function loadLastCity() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    log("localStorage 읽기 실패:", err);
    return null;
  }
}

async function showWeatherFor(place) {
  ui.clearSearchResults(resultsEl);
  setBusy(true);
  try {
    const data = await getForecast(place.latitude, place.longitude);
    ui.renderCurrentWeather(currentWeatherEl, place, data.current, data.current_units);
    ui.renderForecast(forecastListEl, data.daily, data.daily_units);
    ui.showWeatherSection(weatherSection);
    ui.clearStatus(statusEl);
    saveLastCity(place);
  } catch (err) {
    log("날씨 조회 오류:", err);
    ui.showStatus(statusEl, NETWORK_ERROR_MESSAGE, true);
  } finally {
    setBusy(false);
  }
}

async function handleSearch(query) {
  const trimmed = query.trim();
  if (!trimmed) return;

  ui.clearSearchResults(resultsEl);
  setBusy(true);
  try {
    const results = await searchCity(trimmed);
    if (results.length === 0) {
      ui.showStatus(statusEl, NOT_FOUND_MESSAGE, true);
      setBusy(false);
      return;
    }
    if (results.length === 1) {
      await showWeatherFor(results[0]);
      return;
    }
    ui.clearStatus(statusEl);
    ui.renderSearchResults(resultsEl, results, (place) => {
      showWeatherFor(place);
    });
    setBusy(false);
  } catch (err) {
    log("검색 오류:", err);
    ui.showStatus(statusEl, NETWORK_ERROR_MESSAGE, true);
    setBusy(false);
  }
}

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleSearch(cityInput.value);
});

quickCities.addEventListener("click", (e) => {
  const btn = e.target.closest(".quick-city-btn");
  if (!btn) return;
  cityInput.value = btn.dataset.city;
  handleSearch(btn.dataset.city);
});

// --- 로그인 -----------------------------------------------------------
// auth.js는 앱 시작 때 한 번만 동적 import한다 (클릭 시점에 import하면 안 됨.
// 클릭과 팝업 사이에 비동기 작업이 끼면 브라우저가 팝업을 막는다).
// Firebase CDN을 못 불러와도 날씨 기능은 그대로 동작해야 하므로 실패를 잡아
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
    ui.showStatus(authStatusEl, message, true);
  }
}

// 클릭 이벤트 처리 안에서 signInWithPopup까지 다른 await 없이 바로 이어져야 한다.
function handleLoginClick() {
  if (!authApi) return;
  ui.clearStatus(authStatusEl);
  authApi.signInWithGoogle().catch(handleAuthError);
}

function handleLogoutClick() {
  if (!authApi) return;
  authApi.signOutUser().catch((err) => {
    logAuth("로그아웃 오류:", err);
  });
}

import("./auth.js")
  .then((mod) => {
    authApi = mod;
    logAuth("auth.js 로드 완료");
    authApi.subscribeAuthState((user) => {
      if (user) {
        ui.renderUserProfile(loginSlot, user, handleLogoutClick);
      } else {
        ui.renderLoginButton(loginSlot, handleLoginClick);
      }
    });
  })
  .catch((err) => {
    logAuth("auth.js 로드 실패:", err);
    ui.renderAuthUnavailable(loginSlot);
  });

// 마지막으로 본 도시가 있으면 재검색 없이 바로 그 좌표로 날씨를 불러온다.
function init() {
  const last = loadLastCity();
  if (last) {
    log("마지막으로 본 도시 복원:", last.name);
    showWeatherFor(last);
  }
}

// setBusy(true)가 "불러오는 중…"을 표시했다가 성공/실패 모두 setBusy(false)에서
// disabled만 풀고 메시지 자체는 각 분기(성공 시 clearStatus, 실패 시 showStatus)가 정리한다.
init();
