// 화면 그리기 전담 파일. DOM 조작만 하고, fetch는 하지 않는다.

import { getWeatherInfo } from "./weather-codes.js";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// "YYYY-MM-DD" 문자열을 그대로 요일로 바꾼다.
// new Date("YYYY-MM-DD")는 UTC 자정으로 해석되어 브라우저 타임존에 따라
// 날짜가 하루 밀릴 수 있으므로, Date.UTC로 직접 만들어 그 위험을 피한다.
function getWeekdayLabel(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return WEEKDAY_LABELS[date.getUTCDay()];
}

/**
 * 검색 결과 표시용 라벨을 만든다. "이름 · 도(admin1) · 국가" 형태이며,
 * admin1/country가 없는 결과(예: 싱가포르)는 있는 부분만 이어붙인다.
 */
export function formatPlaceLabel(place) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(" · ");
}

export function showStatus(el, message, isError = false) {
  el.textContent = message;
  el.classList.toggle("is-error", isError);
}

export function clearStatus(el) {
  el.textContent = "";
  el.classList.remove("is-error");
}

export function clearSearchResults(el) {
  el.innerHTML = "";
}

/**
 * 검색 결과 목록을 그린다. 결과가 여러 건일 때만 호출된다.
 * @param {HTMLElement} el
 * @param {Array} results geocoding 결과 배열
 * @param {(place: object) => void} onSelect 사용자가 항목을 고르면 호출
 */
export function renderSearchResults(el, results, onSelect) {
  el.innerHTML = "";
  for (const place of results) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";

    const nameSpan = document.createElement("span");
    nameSpan.className = "result-name";
    nameSpan.textContent = place.name;

    const adminSpan = document.createElement("span");
    adminSpan.className = "result-admin";
    const adminText = [place.admin1, place.country].filter(Boolean).join(" · ");
    adminSpan.textContent = adminText ? ` (${adminText})` : "";

    btn.append(nameSpan, adminSpan);
    btn.addEventListener("click", () => onSelect(place));
    li.appendChild(btn);
    el.appendChild(li);
  }
}

export function showWeatherSection(sectionEl) {
  sectionEl.hidden = false;
}

/**
 * 현재 날씨를 그린다.
 * @param {HTMLElement} el
 * @param {object} place geocoding 결과 항목 (name, admin1, country 등)
 * @param {object} current forecast 응답의 current 객체
 * @param {object} currentUnits forecast 응답의 current_units 객체
 */
export function renderCurrentWeather(el, place, current, currentUnits) {
  const info = getWeatherInfo(current.weather_code);
  const updatedAt = current.time.replace("T", " ");

  el.innerHTML = "";

  const title = document.createElement("h2");
  title.textContent = formatPlaceLabel(place);
  el.appendChild(title);

  const updated = document.createElement("p");
  updated.className = "updated-at";
  updated.textContent = `${updatedAt} 기준`;
  el.appendChild(updated);

  const main = document.createElement("div");
  main.className = "current-main";
  main.innerHTML = `
    <span class="emoji">${info.emoji}</span>
    <span class="temp">${Math.round(current.temperature_2m)}${currentUnits.temperature_2m}</span>
    <span class="desc">${info.desc}</span>
  `;
  el.appendChild(main);

  const details = document.createElement("div");
  details.className = "current-details";
  details.innerHTML = `
    <span>체감 ${Math.round(current.apparent_temperature)}${currentUnits.apparent_temperature}</span>
    <span>습도 ${current.relative_humidity_2m}${currentUnits.relative_humidity_2m}</span>
    <span>바람 ${current.wind_speed_10m}${currentUnits.wind_speed_10m}</span>
  `;
  el.appendChild(details);
}

/**
 * 머리글 로그인 자리에 "Google로 로그인" 버튼을 그린다.
 * @param {HTMLElement} el
 * @param {() => void} onClick
 */
export function renderLoginButton(el, onClick) {
  el.innerHTML = "";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "login-btn";
  btn.textContent = "Google로 로그인";
  btn.addEventListener("click", onClick);
  el.appendChild(btn);
}

/**
 * 머리글 로그인 자리에 프로필 사진 · 이름 · 로그아웃 버튼을 그린다.
 * @param {HTMLElement} el
 * @param {object} user Firebase User 객체
 * @param {() => void} onLogoutClick
 */
export function renderUserProfile(el, user, onLogoutClick) {
  el.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "user-profile";

  if (user.photoURL) {
    const img = document.createElement("img");
    img.className = "user-photo";
    img.src = user.photoURL;
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    wrap.appendChild(img);
  }

  const name = document.createElement("span");
  name.className = "user-name";
  name.textContent = user.displayName ?? user.email ?? "사용자";
  wrap.appendChild(name);

  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button";
  logoutBtn.className = "logout-btn";
  logoutBtn.textContent = "로그아웃";
  logoutBtn.addEventListener("click", onLogoutClick);
  wrap.appendChild(logoutBtn);

  el.appendChild(wrap);
}

/**
 * Firebase SDK를 불러오지 못했을 때 로그인 자리에 표시한다.
 * @param {HTMLElement} el
 */
export function renderAuthUnavailable(el) {
  el.innerHTML = "";
  const span = document.createElement("span");
  span.className = "auth-unavailable";
  span.textContent = "로그인을 불러오지 못했습니다";
  el.appendChild(span);
}

/**
 * 5일 예보를 그린다.
 * @param {HTMLElement} el
 * @param {object} daily forecast 응답의 daily 객체 (배열들이 인덱스로 대응)
 * @param {object} dailyUnits forecast 응답의 daily_units 객체
 */
export function renderForecast(el, daily, dailyUnits) {
  el.innerHTML = "";
  daily.time.forEach((dateStr, i) => {
    const info = getWeatherInfo(daily.weather_code[i]);
    const isToday = i === 0;
    const dayLabel = isToday ? "오늘" : getWeekdayLabel(dateStr);
    const [, month, day] = dateStr.split("-");

    const li = document.createElement("li");
    li.innerHTML = `
      <div class="day${isToday ? " is-today" : ""}">${dayLabel}</div>
      <div class="date">${month}/${day}</div>
      <div class="emoji">${info.emoji}</div>
      <div class="temps">
        <span class="temp-max">${Math.round(daily.temperature_2m_max[i])}°</span>
        /
        <span class="temp-min">${Math.round(daily.temperature_2m_min[i])}°</span>
      </div>
    `;
    el.appendChild(li);
  });
}
