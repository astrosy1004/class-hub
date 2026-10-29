// 검색어("연남동 카페") → 행정동 + 업종. Kakao 키가 있으면 전국 검색, 없으면 예시 행정동 표에서 찾는다.
import { DEMO_PLACES, GU, allIndustries } from "./area-data.js";
import { ensureKakao, findPlace, placeFromCoords } from "./kmap.js";
import { distanceM } from "./split-search.js";

const norm = (t) => t.replace(/\s+/g, "").toLowerCase();

// "연남동 카페" → { placeText: "연남동", industry }
export function parseQuery(text) {
  let rest = text.trim();
  let industry = null;
  for (const ind of allIndustries()) {
    for (const w of [ind.name, ...ind.alias]) {
      if (rest.includes(w)) {
        industry = ind;
        rest = rest.replace(w, " ");
        break;
      }
    }
    if (industry) break;
  }
  return { placeText: rest.trim(), industry };
}

function demoFind(text) {
  const t = norm(text);
  if (!t) return null;
  return DEMO_PLACES.find((p) => [p.name, ...p.alias].some((n) => norm(n) === t))
    || DEMO_PLACES.find((p) => [p.name, ...p.alias].some((n) => norm(n).includes(t) || t.includes(norm(n))))
    || null;
}

// 반환: { name, gu, guName, lat, lng, source: "kakao" | "demo" } 또는 null
export async function resolvePlace(placeText) {
  if (await ensureKakao()) {
    const r = await findPlace(placeText);
    if (r) return { ...r, source: "kakao" };
  }
  const d = demoFind(placeText);
  return d ? { ...d, guName: GU[d.gu], source: "demo" } : null;
}

// 현재 위치(내 위치)는 같은 동 이름이라도 지도 중심이 다르므로 키를 따로 둔다
export const placeKey = (p, ind) => `${p.name}|${ind.key}${p.isCurrent ? "|me" : ""}`;

// ── 현재 위치 ────────────────────────────────────
// 위치는 이 브라우저에서만 쓰고 저장하지 않는다. 좌표는 행정동 확인을 위해 Kakao 지도 API 호출에만 전달된다.
const geoMessage = (e) => (e.code === 1
  ? "위치 권한이 꺼져 있어요. 주소창의 위치 권한을 허용하거나, 지역을 직접 검색해 주세요."
  : e.code === 2 ? "현재 위치를 확인하지 못했어요. 지역을 직접 검색해 주세요."
    : "위치 확인 시간이 초과되었어요. 다시 시도하거나 지역을 직접 검색해 주세요.");

export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("이 브라우저는 위치 기능을 지원하지 않아요. 지역을 직접 검색해 주세요."));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(new Error(geoMessage(e))),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });
}

// 키 없이 시험하는 예시 모드: 가장 가까운 예시 행정동 (5km 안일 때만)
export function nearestDemo(lat, lng, maxM = 5000) {
  const best = DEMO_PLACES.map((p) => ({ p, d: distanceM(lat, lng, p.lat, p.lng) })).sort((a, b) => a.d - b.d)[0];
  return best && best.d <= maxM ? best.p : null;
}

export async function resolveCurrent() {
  const { lat, lng } = await getPosition();
  if (await ensureKakao()) {
    const p = await placeFromCoords(lat, lng);
    if (p) return { ...p, isCurrent: true, source: "kakao" };
    throw new Error("현재 위치의 행정동을 확인하지 못했어요. 지역을 직접 검색해 주세요.");
  }
  const d = nearestDemo(lat, lng);
  if (d) return { ...d, guName: GU[d.gu], lat, lng, isCurrent: true, source: "demo" };
  throw new Error("현재 위치로 찾으려면 Kakao 지도 연결이 필요해요 (예시 모드는 일부 지역만 지원). 지역을 직접 검색해 주세요.");
}
