// 화면 그리기 전담 파일. DOM 조작만 하고, fetch는 하지 않는다.
// API나 공유 링크에서 온 글자(지역 이름 등)는 반드시 esc()를 거치거나 textContent로 넣는다.

import { getWeatherInfo } from "./weather-codes.js?v=2";
import { LEVELS, CATEGORIES, BASIC_RULES, getCategory, getDustGrade } from "./safety-rules.js?v=2";
import { icon, art, illo, workerArt } from "./icons.js?v=2";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// "YYYY-MM-DD..." 문자열의 요일. new Date("YYYY-MM-DD")는 UTC로 해석되어 날짜가 밀릴 수 있어
// Date.UTC로 직접 만든다.
function getWeekdayLabel(dateStr) {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return WEEKDAY_LABELS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** "2026-10-15T14:25" → "10월 15일 (목)" */
export function formatDate(dateTimeStr) {
  const [, m, d] = dateTimeStr.slice(0, 10).split("-").map(Number);
  return `${m}월 ${d}일 (${getWeekdayLabel(dateTimeStr)})`;
}

/** "2026-10-15T14:25" → "10월 15일 (목) 14:25 기준" (그 지역 현지 시각) */
export function formatUpdatedAt(dateTimeStr) {
  return `${formatDate(dateTimeStr)} ${dateTimeStr.slice(11, 16)} 기준`;
}

/**
 * 지역 이름. 국내는 "서울특별시 강남구"처럼 도 + 이름, 해외는 "이름 · 도 · 국가".
 * 공유 링크로 열린 경우처럼 label이 이미 있으면 그대로 쓴다.
 */
export function formatPlaceLabel(place) {
  if (place.label) return place.label;
  const isKorea = place.country_code === "KR" || place.country === "대한민국";
  if (isKorea) {
    return [place.admin1, place.name].filter((v, i, arr) => v && arr.indexOf(v) === i).join(" ");
  }
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

let toastTimer = null;

export function showToast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
  }, 2500);
}

export function clearSearchResults(el) {
  el.innerHTML = "";
}

/**
 * 검색 결과 목록을 그린다. 결과가 여러 건일 때만 호출된다.
 * @param {HTMLElement} el
 * @param {Array} results 지역 검색 결과 배열
 * @param {(place: object) => void} onSelect 사용자가 항목을 고르면 호출
 */
export function renderSearchResults(el, results, onSelect) {
  el.innerHTML = "";
  for (const place of results) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = icon("pin", "result-icon");

    const nameSpan = document.createElement("span");
    nameSpan.className = "result-name";
    nameSpan.textContent = place.name;

    const adminSpan = document.createElement("span");
    adminSpan.className = "result-admin";
    adminSpan.textContent = [place.admin1, place.admin2, place.country].filter(Boolean).join(" · ");

    btn.append(nameSpan, adminSpan);
    btn.addEventListener("click", () => onSelect(place));
    li.appendChild(btn);
    el.appendChild(li);
  }
}

/**
 * 지역 칩 목록 (최근 조회 · 즐겨찾기 현장).
 * @param {HTMLElement} el
 * @param {Array} places
 * @param {(place: object) => void} onSelect
 * @param {((place: object) => void)|null} onRemove 있으면 칩마다 삭제(×) 버튼을 붙인다
 */
export function renderPlaceChips(el, places, onSelect, onRemove = null) {
  el.innerHTML = "";
  for (const place of places) {
    const li = document.createElement("li");
    li.className = "chip-item";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = formatPlaceLabel(place);
    btn.addEventListener("click", () => onSelect(place));
    li.appendChild(btn);

    if (onRemove) {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "chip-remove";
      removeBtn.textContent = "×";
      removeBtn.setAttribute("aria-label", `${formatPlaceLabel(place)} 즐겨찾기 삭제`);
      removeBtn.addEventListener("click", () => onRemove(place));
      li.appendChild(removeBtn);
    }
    el.appendChild(li);
  }
}

function levelBadge(level) {
  const lv = LEVELS[level];
  return `<span class="level-badge tone-${lv.tone}">${lv.label}</span>`;
}

// 가장 위험한 단계 한 줄 요약 (도시 카드 · 공유 미리보기용)
function hazardSummary(hazards) {
  if (hazards.length === 0) return "안전";
  const top = hazards[0];
  return `${getCategory(top.id).tab} ${LEVELS[top.level].label}${hazards.length > 1 ? ` 외 ${hazards.length - 1}` : ""}`;
}

/**
 * 메인 화면 "지금 전국 현장 날씨" 카드. 원티드의 회사 카드처럼 큰 이름 + 한 줄 요약.
 * @param {HTMLElement} el
 * @param {Array<{city: object, forecast: object|null, hazards: Array}>} items forecast가 null이면 불러오는 중
 * @param {(city: object) => void} onSelect
 */
export function renderCityCards(el, items, onSelect) {
  el.innerHTML = "";
  for (const { city, forecast, hazards } of items) {
    const btn = document.createElement("button");
    btn.type = "button";
    if (!forecast) {
      btn.className = "city-card is-loading";
      btn.innerHTML = `<span class="city-name">${esc(city.short)}</span><span class="city-sub">불러오는 중…</span>`;
    } else {
      const info = getWeatherInfo(forecast.current.weather_code);
      const top = hazards[0];
      btn.className = `city-card sky-${info.tone}`;
      btn.innerHTML = `
        ${art(info.art, "city-art")}
        <span class="city-name">${esc(city.short)}</span>
        <span class="city-temp">${Math.round(forecast.current.temperature_2m)}° <small>${esc(info.desc)}</small></span>
        <span class="city-sub">
          <span class="city-dot ${top ? `tone-${LEVELS[top.level].tone}` : "tone-safe"}"></span>
          ${esc(hazardSummary(hazards))}
        </span>`;
    }
    btn.setAttribute("aria-label", `${city.short} 날씨 보기`);
    btn.addEventListener("click", () => onSelect(city));
    el.appendChild(btn);
  }
}

/** 메인 화면 "날씨별 안전수칙 가이드" 배너 카드 */
export function renderGuideCards(el) {
  el.innerHTML = CATEGORIES.map(
    (cat) => `
      <a href="#rule/${cat.id}" class="guide-card cat-bg-${cat.id}">
        <span class="guide-kicker">${esc(cat.subtitle)}</span>
        <strong class="guide-title">${esc(cat.title)}</strong>
        <span class="guide-sub">핵심 수칙 ${cat.rules.length}가지 ${icon("arrowRight", "guide-arrow")}</span>
        <span class="guide-icon">${illo(cat.icon)}</span>
      </a>`
  ).join("");
}

/**
 * 날씨 화면의 "오늘 주의할 기상" 띠. 위험이 없으면 "안전" 한 줄.
 * @param {HTMLElement} el
 * @param {Array} hazards evaluateHazards() 결과
 */
export function renderHazardBanner(el, hazards) {
  if (hazards.length === 0) {
    el.innerHTML = `
      <div class="hazard-banner tone-safe">
        <span class="hazard-title">${icon("shield")}오늘은 특별한 기상 위험이 없어요</span>
      </div>`;
    return;
  }
  const top = LEVELS[hazards[0].level];
  const items = hazards
    .map((h) => {
      const cat = getCategory(h.id);
      return `<a href="#rule/${h.id}" class="hazard-chip">${illo(cat.icon, "chip-illo")}${esc(cat.tab)} ${levelBadge(h.level)}</a>`;
    })
    .join("");
  el.innerHTML = `
    <div class="hazard-banner tone-${top.tone}">
      <span class="hazard-title">${icon("alert")}오늘 주의할 기상</span>
      <div class="hazard-chips">${items}</div>
    </div>`;
}

/**
 * 현재 날씨 큰 카드 (날씨 · 기온 · 체감 · 미세먼지 등급).
 */
export function renderCurrentWeather(el, forecast, air) {
  const { current, current_units: units } = forecast;
  const info = getWeatherInfo(current.weather_code);
  const grade = air ? getDustGrade(air.pm10, air.pm25) : null;
  const dustHtml = grade
    ? `<span class="dust-badge">미세먼지 <b class="dust-${grade.rank}">${grade.label}</b></span>`
    : `<span class="dust-badge">미세먼지 정보 없음</span>`;

  el.className = `current-card sky-${info.tone}`;
  el.innerHTML = `
    <div class="current-body">
      <p class="current-desc">${esc(info.desc)}</p>
      <p class="current-temp">${Math.round(current.temperature_2m)}<span>${esc(units.temperature_2m)}</span></p>
      <p class="current-feels">체감온도 ${Math.round(current.apparent_temperature)}${esc(units.apparent_temperature)}</p>
      ${dustHtml}
    </div>
    ${art(info.art, "current-art")}`;
}

// 현재 시각에 해당하는 hourly 인덱스 (current.time "…T14:15" → "…T14:00" 이후 첫 칸)
function currentHourIndex(forecast) {
  const hourKey = `${forecast.current.time.slice(0, 13)}:00`;
  const idx = forecast.hourly.time.findIndex((t) => t >= hourKey);
  return idx < 0 ? 0 : idx;
}

/** 현재 시각의 강수확률 (%) */
export function getCurrentRainChance(forecast) {
  return forecast.hourly.precipitation_probability[currentHourIndex(forecast)] ?? 0;
}

/** 습도 · 강수확률 · 바람 세 칸 */
export function renderCurrentStats(el, forecast) {
  const { current } = forecast;
  const stats = [
    { icon: "droplet", label: "습도", value: `${current.relative_humidity_2m}%` },
    { icon: "umbrella", label: "강수확률", value: `${getCurrentRainChance(forecast)}%` },
    { icon: "wind", label: "바람(풍속)", value: `${current.wind_speed_10m.toFixed(1)} m/s` },
  ];
  el.innerHTML = stats
    .map(
      (s) => `
      <div class="stat">
        ${icon(s.icon, "stat-icon")}
        <span class="stat-label">${s.label}</span>
        <span class="stat-value">${s.value}</span>
      </div>`
    )
    .join("");
}

/** 지금부터 6시간 예보 */
export function renderHourly(el, forecast) {
  const start = currentHourIndex(forecast);
  const { hourly } = forecast;
  const items = [];
  for (let i = start; i < Math.min(start + 6, hourly.time.length); i++) {
    const info = getWeatherInfo(hourly.weather_code[i]);
    const label = i === start ? "지금" : `${Number(hourly.time[i].slice(11, 13))}시`;
    items.push(`
      <li${i === start ? ' class="is-now"' : ""}>
        <span class="hour">${label}</span>
        <span title="${esc(info.desc)}">${art(info.art, "small-art")}</span>
        <span class="temp">${Math.round(hourly.temperature_2m[i])}°</span>
        <span class="rain">${hourly.precipitation_probability[i] ?? 0}%</span>
      </li>`);
  }
  el.innerHTML = items.join("");
}

/** 7일 예보 */
export function renderDaily(el, forecast) {
  const { daily } = forecast;
  el.innerHTML = daily.time
    .map((dateStr, i) => {
      const info = getWeatherInfo(daily.weather_code[i]);
      const day = Number(dateStr.slice(8, 10));
      const label = i === 0 ? `오늘 ${day} (${getWeekdayLabel(dateStr)})` : `${day} (${getWeekdayLabel(dateStr)})`;
      return `
        <li${i === 0 ? ' class="is-today"' : ""}>
          <span class="day">${label}</span>
          <span title="${esc(info.desc)}">${art(info.art, "small-art")}</span>
          <span class="rain">${daily.precipitation_probability_max[i] ?? 0}%</span>
          <span class="temps"><b>${Math.round(daily.temperature_2m_max[i])}°</b> ${Math.round(daily.temperature_2m_min[i])}°</span>
        </li>`;
    })
    .join("");
}

/**
 * 안전수칙 화면 위쪽 요약 박스.
 * @param {HTMLElement} el
 * @param {Array} hazards
 * @param {{desc: string, art: string}} weatherInfo 현재 날씨 (getWeatherInfo 결과)
 */
export function renderRulesSummary(el, hazards, weatherInfo) {
  if (hazards.length === 0) {
    el.innerHTML = `
      <div class="summary-box tone-safe">
        ${art(weatherInfo.art, "summary-art")}
        <div>
          <strong>현재는 ${esc(weatherInfo.desc)}, 비교적 안전한 날씨입니다.</strong>
          <p>그래도 기본 안전수칙은 꼭 지켜주세요!</p>
        </div>
      </div>`;
    return;
  }
  const top = hazards[0];
  const names = hazards.map((h) => `${getCategory(h.id).tab}(${LEVELS[h.level].label})`).join(", ");
  el.innerHTML = `
    <div class="summary-box tone-${LEVELS[top.level].tone}">
      <span class="summary-icon">${icon("alert")}</span>
      <div>
        <strong>오늘은 ${esc(names)} 단계의 기상이 예상됩니다.</strong>
        <p>${hazards.map((h) => esc(h.reason)).join(" · ")}</p>
      </div>
    </div>`;
}

/**
 * 전체 · 더위 · 추위 · 강수 · 강풍 · 미세먼지 탭. 오늘 해당하는 분류에는 점을 찍는다.
 */
export function renderRulesTabs(el, activeTab, hazards, onSelect) {
  const activeIds = new Set(hazards.map((h) => h.id));
  const tabs = [{ id: "all", tab: "전체" }, ...CATEGORIES];
  el.innerHTML = "";
  for (const t of tabs) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab";
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", String(t.id === activeTab));
    btn.textContent = t.tab;
    if (activeIds.has(t.id)) {
      const dot = document.createElement("span");
      dot.className = "tab-dot";
      dot.setAttribute("aria-label", "오늘 해당");
      btn.appendChild(dot);
    }
    btn.addEventListener("click", () => onSelect(t.id));
    el.appendChild(btn);
  }
}

function ruleCard(rule, categoryId) {
  return `
    <a href="#rule/${categoryId}" class="rule-card">
      <span class="rule-icon cat-soft-${categoryId}">${illo(rule.icon)}</span>
      <span class="rule-text">
        <strong>${esc(rule.title)}</strong>
        <span>${esc(rule.desc)}</span>
      </span>
      ${icon("chevronRight", "rule-chevron")}
    </a>`;
}

/**
 * 안전수칙 카드 목록.
 * - "전체" 탭: 오늘 해당하는 분류별로 핵심 수칙 3개씩 (해당 없으면 기본 안전수칙)
 * - 분류 탭: 그 분류의 수칙 전부
 * @returns {string} 목록 제목
 */
export function renderRulesList(el, activeTab, hazards, weatherDesc) {
  if (activeTab === "all") {
    if (hazards.length === 0) {
      el.innerHTML = `<div class="rule-list">${BASIC_RULES.rules.map((r) => ruleCard(r, "basic")).join("")}</div>`;
      return `오늘의 주요 안전수칙 (${weatherDesc} / 보통)`;
    }
    el.innerHTML = hazards
      .map((h) => {
        const cat = getCategory(h.id);
        return `
          <div class="rule-group">
            <div class="rule-group-head">
              <span class="rule-group-title">${illo(cat.icon, "title-illo")}${esc(cat.title)}</span>${levelBadge(h.level)}
            </div>
            <div class="rule-list">${cat.rules.slice(0, 3).map((r) => ruleCard(r, cat.id)).join("")}</div>
            <a href="#rule/${cat.id}" class="more-link">${esc(cat.tab)} 안전수칙 자세히 보기 ${icon("arrowRight")}</a>
          </div>`;
      })
      .join("");
    return "오늘의 주요 안전수칙";
  }

  const cat = getCategory(activeTab);
  const hazard = hazards.find((h) => h.id === cat.id);
  const note = hazard
    ? `<p class="tab-note">오늘 ${levelBadge(hazard.level)} ${esc(hazard.reason)}</p>`
    : `<p class="tab-note">오늘은 해당 기상이 예보되지 않았습니다. 미리 알아두세요.</p>`;
  el.innerHTML = `${note}<div class="rule-list">${cat.rules.map((r) => ruleCard(r, cat.id)).join("")}</div>`;
  return `${cat.title} (${cat.subtitle})`;
}

/**
 * 상세 안전수칙 화면.
 * @param {HTMLElement} el
 * @param {object} cat 분류 데이터 (CATEGORIES 항목 또는 BASIC_RULES)
 * @param {object|undefined} hazard 오늘 이 분류가 해당하면 판정 결과
 */
export function renderRuleDetail(el, cat, hazard) {
  const status = hazard
    ? `<p class="detail-status">오늘 ${levelBadge(hazard.level)} ${esc(hazard.reason)}</p>`
    : "";
  el.innerHTML = `
    <div class="detail-hero cat-bg-${cat.id}">
      <span class="detail-kicker">${esc(cat.subtitle)}</span>
      <h1>${esc(cat.title)}</h1>
      <p>${esc(cat.intro)}</p>
      <span class="detail-icon">${workerArt(cat.id)}</span>
    </div>
    ${status}
    <div class="risk-box">
      <strong>${icon("alert")}이런 위험이 있어요!</strong>
      <ul>${cat.risks.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
    </div>
    <div class="section-head"><h2>주요 안전수칙</h2></div>
    <ol class="step-list">
      ${cat.rules
        .map(
          (r, i) => `
        <li>
          <span class="step-num cat-soft-${cat.id}">${i + 1}</span>
          <span class="step-body">
            <strong>${esc(r.title)}</strong>
            <span>${esc(r.desc)}</span>
          </span>
          <span class="step-icon">${illo(r.icon)}</span>
        </li>`
        )
        .join("")}
    </ol>
    <p class="detail-basis">참고: ${esc(cat.basis)}</p>`;
}

/**
 * 알림 받을 분류 체크박스 목록.
 * @param {(id: string, checked: boolean) => void} onChange
 */
export function renderAlertCategories(el, settings, onChange) {
  el.innerHTML = "";
  for (const cat of CATEGORIES) {
    const li = document.createElement("li");
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = settings.categories[cat.id];
    input.disabled = !settings.enabled;
    input.addEventListener("change", () => onChange(cat.id, input.checked));
    const iconWrap = document.createElement("span");
    iconWrap.className = "check-icon";
    iconWrap.innerHTML = illo(cat.icon);
    const text = document.createElement("span");
    text.textContent = cat.alertLabel;
    label.append(iconWrap, text, input);
    li.appendChild(label);
    el.appendChild(li);
  }
}

/** 공유 미리보기 카드 */
export function renderSharePreview(el, label, forecast, hazards) {
  const info = getWeatherInfo(forecast.current.weather_code);
  el.innerHTML = `
    ${art(info.art, "preview-art")}
    <span class="preview-body">
      <strong>${esc(label)}</strong>
      <span class="preview-date">${formatDate(forecast.current.time)}</span>
      <span class="preview-weather">${Math.round(forecast.current.temperature_2m)}℃ ${esc(info.desc)} · ${esc(hazardSummary(hazards))}</span>
    </span>
    ${icon("chevronRight", "preview-arrow")}`;
}

/**
 * 로그아웃 상태: 머리글에 테두리 "로그인" 버튼(원티드의 "회원가입" 자리), 메뉴에 안내 + 버튼.
 */
export function renderSignedOut(headerEl, menuEl, onLogin) {
  headerEl.innerHTML = "";
  const headerBtn = document.createElement("button");
  headerBtn.type = "button";
  headerBtn.className = "outline-btn";
  headerBtn.textContent = "로그인";
  headerBtn.addEventListener("click", onLogin);
  headerEl.appendChild(headerBtn);

  menuEl.innerHTML = "";
  const hint = document.createElement("p");
  hint.className = "menu-hint";
  hint.textContent = "로그인하면 최근 조회 지역이 다른 기기에서도 보입니다.";
  const menuBtn = document.createElement("button");
  menuBtn.type = "button";
  menuBtn.className = "menu-login-btn";
  menuBtn.textContent = "Google로 로그인";
  menuBtn.addEventListener("click", onLogin);
  menuEl.append(hint, menuBtn);
}

/**
 * 로그인 상태: 머리글에 프로필 사진, 메뉴에 이름 + 로그아웃.
 */
export function renderSignedIn(headerEl, menuEl, user, onLogout) {
  const displayName = user.displayName ?? user.email ?? "사용자";

  headerEl.innerHTML = "";
  if (user.photoURL) {
    const img = document.createElement("img");
    img.className = "header-avatar";
    img.src = user.photoURL;
    img.alt = displayName;
    img.referrerPolicy = "no-referrer";
    headerEl.appendChild(img);
  } else {
    const fallback = document.createElement("span");
    fallback.className = "header-avatar";
    fallback.innerHTML = icon("user");
    headerEl.appendChild(fallback);
  }

  menuEl.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "user-profile";
  const name = document.createElement("span");
  name.className = "user-name";
  name.textContent = displayName;
  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button";
  logoutBtn.className = "logout-btn";
  logoutBtn.textContent = "로그아웃";
  logoutBtn.addEventListener("click", onLogout);
  wrap.append(name, logoutBtn);
  menuEl.appendChild(wrap);
}

/**
 * Firebase SDK를 불러오지 못했을 때.
 */
export function renderAuthUnavailable(headerEl, menuEl) {
  headerEl.innerHTML = "";
  menuEl.innerHTML = '<p class="menu-hint">로그인을 불러오지 못했습니다</p>';
}
