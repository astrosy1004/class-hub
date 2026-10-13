// 검색어("연남동 카페") → 행정동 + 업종. Kakao 키가 있으면 전국 검색, 없으면 예시 행정동 표에서 찾는다.
import { DEMO_PLACES, INDUSTRIES, GU } from "./area-data.js";
import { ensureKakao, findPlace } from "./kmap.js";

const norm = (t) => t.replace(/\s+/g, "").toLowerCase();

// "연남동 카페" → { placeText: "연남동", industry }
export function parseQuery(text) {
  let rest = text.trim();
  let industry = null;
  for (const ind of INDUSTRIES) {
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

export const placeKey = (p, ind) => `${p.name}|${ind.key}`;
