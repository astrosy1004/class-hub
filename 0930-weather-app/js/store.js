// 이 기기(localStorage)에 저장하는 값 전담 파일: 마지막 지역 · 최근 조회 · 즐겨찾기 현장 · 알림 설정.
// 로그인한 사용자의 최근 조회는 history.js(Firestore)가 따로 맡는다.

const KEYS = {
  lastPlace: "siteSafety:lastPlace",
  recent: "siteSafety:recent",
  favorites: "siteSafety:favorites",
  alertSettings: "siteSafety:alertSettings",
  notified: "siteSafety:notified",
};

const MAX_RECENT = 5;
const MAX_FAVORITES = 10;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.log("[STORE] 읽기 실패:", key, err);
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.log("[STORE] 저장 실패:", key, err);
  }
}

// 같은 지역인지 판단하는 키. 좌표를 소수 둘째 자리(약 1km)로 반올림해 비교한다.
export function placeKey(place) {
  return `${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}`;
}

// 저장할 때 필요한 필드만 남긴다.
export function toStoredPlace(place) {
  return {
    id: place.id ?? null,
    name: place.name,
    admin1: place.admin1 ?? null,
    country: place.country ?? null,
    country_code: place.country_code ?? null,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

export function loadLastPlace() {
  return read(KEYS.lastPlace, null);
}

export function saveLastPlace(place) {
  write(KEYS.lastPlace, toStoredPlace(place));
}

export function loadRecent() {
  return read(KEYS.recent, []);
}

export function addRecent(place) {
  const key = placeKey(place);
  const list = loadRecent().filter((p) => placeKey(p) !== key);
  list.unshift(toStoredPlace(place));
  write(KEYS.recent, list.slice(0, MAX_RECENT));
}

export function loadFavorites() {
  return read(KEYS.favorites, []);
}

export function isFavorite(place) {
  const key = placeKey(place);
  return loadFavorites().some((p) => placeKey(p) === key);
}

/** 즐겨찾기에 있으면 빼고, 없으면 맨 앞에 넣는다. @returns {boolean} 넣은 뒤 즐겨찾기 상태 */
export function toggleFavorite(place) {
  const key = placeKey(place);
  const list = loadFavorites();
  const exists = list.some((p) => placeKey(p) === key);
  const next = exists
    ? list.filter((p) => placeKey(p) !== key)
    : [toStoredPlace(place), ...list].slice(0, MAX_FAVORITES);
  write(KEYS.favorites, next);
  return !exists;
}

export function removeFavorite(place) {
  const key = placeKey(place);
  write(KEYS.favorites, loadFavorites().filter((p) => placeKey(p) !== key));
}

// 알림 설정 기본값: 꺼짐, 켜면 모든 분류를 받는다.
export function loadAlertSettings(categoryIds) {
  const saved = read(KEYS.alertSettings, null);
  const categories = {};
  for (const id of categoryIds) {
    categories[id] = saved?.categories?.[id] ?? true;
  }
  return { enabled: saved?.enabled ?? false, categories };
}

export function saveAlertSettings(settings) {
  write(KEYS.alertSettings, settings);
}

// 같은 날 같은 지역의 같은 위험으로 알림을 두 번 보내지 않도록, 이미 보낸 단계를 기억한다.
// 오늘 날짜 것만 남겨서 값이 계속 쌓이지 않게 한다.
export function shouldNotify(place, dateStr, categoryId, level) {
  const all = read(KEYS.notified, {});
  const today = Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith(`${dateStr}|`)));
  const key = `${dateStr}|${placeKey(place)}|${categoryId}`;
  if ((today[key] ?? 0) >= level) return false;
  today[key] = level;
  write(KEYS.notified, today);
  return true;
}
