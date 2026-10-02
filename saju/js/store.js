// localStorage 저장 전담 (키 앞머리 saju:). 로그인 · Firestore 저장은 6단계에서 붙인다.
// 저장소를 못 쓰는 환경(사생활 보호 창 등)에서도 화면이 깨지지 않도록 모두 try/catch로 감싼다.

const KEY = {
  profile: "saju:profile", // 지금 보고 있는 명식 입력값 { name, gender, calendar, leap, date, time, city, longitude, nightZi, applyDst }
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
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장 못 해도 이번 화면은 그대로 동작 */
  }
}

export const loadProfile = () => read(KEY.profile, null);
export const saveProfile = (p) => write(KEY.profile, p);
export const loadChartMode = () => read(KEY.chartMode, "table");
export const saveChartMode = (m) => write(KEY.chartMode, m);
export const loadTheme = () => read(KEY.theme, "lavender");
export const saveTheme = (t) => write(KEY.theme, t);
