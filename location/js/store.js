// 이 기기 저장 (localStorage). 접근이 막혀도 앱이 멈추지 않게 모든 읽기/쓰기를 감쌌다.
const K = { recent: "loc:recent", saved: "loc:saved", theme: "locTheme" };

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
    list.push(item);
  }
  write(K.saved, list);
  return { ok: true, saved: list.some((s) => s.key === item.key) };
}

export const getTheme = () => read(K.theme, "");
export const setTheme = (t) => write(K.theme, t);
