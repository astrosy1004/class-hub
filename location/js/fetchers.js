// 조회 시점에 자료를 가져오는 곳. 모든 호출은 실패해도 화면이 깨지지 않게 "자료 없음/예시"로 돌려준다.
// 생활인구: 수집기가 Firestore 에 쌓은 동 단위 요약(LIVE_POP 켜짐), 아니면 구 단위 표본(data/sample-gu.json).
// 경쟁 점포: Kakao 키가 있으면 실제 검색, 없으면 예시 점포(같은 입력 = 같은 결과).
import { CONFIG } from "./config.js";
import { ensureKakao, searchAround } from "./kmap.js";
import { searchSplit } from "./split-search.js";

let samplePromise = null;
export function loadSample() {
  if (!samplePromise) {
    samplePromise = fetch(CONFIG.SAMPLE_URL).then((r) => {
      if (!r.ok) throw new Error("표본 자료를 불러오지 못했습니다");
      return r.json();
    });
  }
  return samplePromise;
}

// 표본의 구 한 곳을 생활인구 표준 형식으로
export function popFromSample(sample, guCode) {
  const g = sample.gu[guCode];
  if (!g) return null;
  return {
    level: "gu", live: false, source: sample.source, asOf: sample.asOf, months: sample.months,
    weekday: g.weekday, weekend: g.weekend, age: g.age, female: g.female, monthly: g.monthly, ageMonthly: g.ageMonthly,
    guName: g.name,
  };
}

// 동작 모드: LIVE_POP 이 켜져 있고 Firebase 설정이 있으면 "live"(Firestore 요약 문서), 아니면 "sample"(개발용 예시 — 구 단위 표본)
export const popMode = () => (CONFIG.LIVE_POP && CONFIG.FIREBASE?.projectId ? "live" : "sample");

// Firestore REST 응답의 값 형식({integerValue: "1"} 등) → 일반 JS 값
export function fromFs(v) {
  if (v == null) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromFs);
  if ("mapValue" in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, fromFs(x)]));
  return null;
}

// 동 단위 생활인구 요약: 매일 수집기(collector/)가 Firestore livingPop/{행정동 8자리} 에 써 둔 문서를 읽는다
async function popFromFirestore(place) {
  const code = String(place.dongCode || "").trim().slice(0, 8);
  if (!/^\d{8}$/.test(code)) throw new Error("이 지역의 행정동 코드를 알 수 없어요 (Kakao 검색으로 찾은 지역만 동 단위 자료를 볼 수 있습니다)");
  // 서울 열린데이터광장 생활인구는 서울(행정동 코드 11…)만 제공한다
  if (!code.startsWith("11")) throw new Error("서울 밖 지역은 생활인구 자료가 제공되지 않아요 (서울 열린데이터광장은 서울만 제공)");
  const { projectId, apiKey } = CONFIG.FIREBASE;
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/livingPop/${code}?key=${apiKey}`);
  if (r.status === 404) throw new Error(`행정동 ${code} 의 생활인구 요약이 없어요 (서울 자료에 없는 행정동이거나 아직 수집되지 않았습니다).`);
  if (!r.ok) throw new Error(`생활인구 자료를 불러오지 못했습니다 (${r.status}) — Firestore 데이터베이스와 보안 규칙을 확인하세요`);
  const doc = await r.json();
  const pop = fromFs({ mapValue: { fields: doc.fields || {} } });
  return { ...pop, live: true };
}

// 동 단위 기준 분포(수집기가 매일 갱신, 업종 프로필별 문서 livingPopBaseline/{키}에 지표를 정렬해 둔 배열). 못 읽으면 null → 자치구 표본 분포로 대체하고 화면에 알린다
const dongBasePromises = new Map();
export function getDongBaseline(industryKey) {
  if (popMode() !== "live") return Promise.resolve(null);
  if (!dongBasePromises.has(industryKey)) {
    const { projectId, apiKey } = CONFIG.FIREBASE;
    dongBasePromises.set(industryKey, fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/livingPopBaseline/${encodeURIComponent(industryKey)}?key=${apiKey}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return null;
        const b = fromFs({ mapValue: { fields: d.fields || {} } });
        return b?.customer ? { level: "dong", n: b.n, asOf: b.asOf, customer: b.customer, size: b.size, growth: b.growth } : null;
      })
      .catch(() => null));
  }
  return dongBasePromises.get(industryKey);
}

export async function getPop(place) {
  if (popMode() === "live") return popFromFirestore(place); // 실패해도 예시로 몰래 바꾸지 않고 오류를 그대로 알린다
  const pop = popFromSample(await loadSample(), place.gu);
  if (!pop) throw new Error("예시 자료에 없는 지역입니다");
  return { ...pop, note: "동 단위 생활인구 연결 전이라 자치구 단위 예시 표본입니다" };
}

// 같은 문자열이면 같은 숫자 (예시 점포용)
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed) {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function demoCompetitors(place, ind, radius = CONFIG.RADIUS_M) {
  const seed = hash(place.name + ind.key);
  const count = 8 + (seed % 38); // 8~45
  const rand = rng(seed);
  const items = [];
  for (let i = 0; i < Math.min(count, 45); i++) {
    const d = Math.sqrt(rand()) * radius;
    const a = rand() * Math.PI * 2;
    items.push({ name: `${ind.name} ${i + 1}`, lat: place.lat + (d * Math.sin(a)) / 111000, lng: place.lng + (d * Math.cos(a)) / 88000, dist: Math.round(d) });
  }
  return { items, count: items.length, capped: count >= 45, live: false, source: "예시 점포 (Kakao 키 설정 전)" };
}

// 경쟁 점포: Kakao 는 한 번에 45곳까지라, 꽉 차면 반경을 4칸씩 나눠 다시 검색해 합친다 (split-search.js)
export async function getCompetitors(place, ind, radius = CONFIG.RADIUS_M) {
  if (await ensureKakao()) {
    try {
      const r = await searchSplit(async (lat, lng, rad) => {
        const x = await searchAround(ind.kakao, lat, lng, rad);
        return { items: x.items, capped: x.capped };
      }, place.lat, place.lng, radius);
      return { items: r.items, count: r.count, capped: r.capped, calls: r.calls, live: true, source: `Kakao 지도 검색 (${r.calls}회 호출)` };
    } catch (e) {
      /* 실패 → 예시 */
    }
  }
  return demoCompetitors(place, ind, radius);
}

// 임대료: 조회 가능한 동 단위 자료가 확인되기 전까지 "자료 없음" (점수는 4개 항목 기준)
export async function getRent() {
  return null;
}
