// 이 기기 저장 (localStorage). 접근이 막혀도 앱이 멈추지 않게 모든 읽기/쓰기를 감쌌다.
const K = { recent: "loc:recent", saved: "loc:saved", theme: "locTheme", industry: "loc:industry", autoLocate: "loc:autoLocate" };

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* 저장 불가 — 무시 */
  }
}

export const getRecent = () => read(K.recent, []);
export function addRecent(item) {
  const list = getRecent().filter((r) => r.key !== item.key);
  list.unshift({ ...item, at: Date.now() });
  write(K.recent, list.slice(0, 8));
}

export const getSaved = () => read(K.saved, []);
export const isSaved = (key) => getSaved().some((s) => s.key === key);
export function toggleSaved(item) {
  let list = getSaved();
  if (list.some((s) => s.key === item.key)) list = list.filter((s) => s.key !== item.key);
  else {
    if (list.length >= 3) return { ok: false, msg: "후보지는 최대 3곳까지 담을 수 있어요" };
    list.push({ ...item, at: Date.now() });
  }
  write(K.saved, list);
  return { ok: true, saved: list.some((s) => s.key === item.key) };
}

export const getTheme = () => read(K.theme, "");
export const setTheme = (t) => write(K.theme, t);

// 마지막으로 고른 업종 · 시작할 때 현재 위치로 검색할지 (기본 켜짐)
export const getIndustryKey = () => read(K.industry, "cafe");
export const setIndustryKey = (k) => write(K.industry, k);
export const getAutoLocate = () => read(K.autoLocate, true);
export const setAutoLocate = (v) => write(K.autoLocate, !!v);

// 로그인 동기화용: 목록을 통째로 바꾸기 · 로그아웃할 때 이 기기의 목록 지우기
export const setSavedList = (list) => write(K.saved, list);
export const setRecentList = (list) => write(K.recent, list);
export function clearUserLists() {
  write(K.saved, []);
  write(K.recent, []);
}
