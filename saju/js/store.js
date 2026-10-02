// localStorage 저장 전담 (키 앞머리 saju:). 로그인하면 명식 목록은 Firestore(js/cloud.js)가 맡고,
// 이 파일은 로그아웃 상태의 "이 기기" 목록 · 지금 보고 있는 명식 id · 화면 설정만 저장한다.
// 저장소를 못 쓰는 환경(사생활 보호 창 등)에서도 화면이 깨지지 않도록 모두 try/catch로 감싼다.

const KEY = {
  charts: "saju:charts", // 이 기기에 저장한 명식 목록 [{ id, name, relation, gender, calendar, leap, date, time, city, longitude, applyDst, nightZi, consent, updatedAt }]
  currentId: "saju:currentId", // 지금 보고 있는 명식 id
  legacyProfile: "saju:profile", // 5단계까지 쓰던 명식 1개 (목록으로 옮긴 뒤 지운다)
  chartMode: "saju:chartMode", // 명식 결과 "table" | "icon"
  theme: "sajuTheme", // 화면 테마 lavender | mint | peach | dark
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장 못 해도 이번 화면은 그대로 동작 */
  }
}

export function newChartId() {
  return (crypto.randomUUID ? crypto.randomUUID() : `c${Date.now()}${Math.random().toString(16).slice(2)}`).replace(/-/g, "");
}

// ── 이 기기 명식 목록 ─────────────────────────────
export function loadLocalCharts() {
  const list = read(KEY.charts, []);
  // 예전 형식(명식 1개)이 남아 있으면 목록으로 옮긴다
  const legacy = read(KEY.legacyProfile, null);
  if (legacy && !legacy.sample) {
    const chart = { ...legacy, id: newChartId(), relation: "본인", consent: true, updatedAt: Date.now() };
    list.unshift(chart);
    write(KEY.charts, list);
    write(KEY.currentId, chart.id);
    write(KEY.legacyProfile, null);
  }
  return list;
}

export function saveLocalChart(chart) {
  const list = loadLocalCharts().filter((c) => c.id !== chart.id);
  list.unshift({ ...chart, updatedAt: Date.now() });
  write(KEY.charts, list);
}

export function deleteLocalChart(id) {
  write(KEY.charts, loadLocalCharts().filter((c) => c.id !== id));
}

export const loadCurrentId = () => read(KEY.currentId, null);
export const saveCurrentId = (id) => write(KEY.currentId, id);
export const loadChartMode = () => read(KEY.chartMode, "table");
export const saveChartMode = (m) => write(KEY.chartMode, m);
export const loadTheme = () => read(KEY.theme, "lavender");
export const saveTheme = (t) => write(KEY.theme, t);
