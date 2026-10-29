// 임대료 부담: 사용자가 알아본 매물(보증금 · 월세 · 관리비)과 예상 월매출로 계산한다. 금액 단위는 만원.
// 공개 임대료 자료(한국부동산원 임대동향)가 연결되면 이 동네 평균과의 비교를 더한다 (README "점수 신뢰도" 참고).
import { RENT_RULES as RR } from "./score-rules.js";

const KEY = "rentInputs";
const num = (v) => { const n = Number(String(v ?? "").replace(/[^0-9.]/g, "")); return Number.isFinite(n) && n > 0 ? n : 0; };

// 입력 → { 환산 월 임대료, 매출 대비 부담률, 점수 } (예상 매출이 없으면 점수는 null)
export function rentInfo(input) {
  if (!input) return null;
  const deposit = num(input.deposit), monthly = num(input.monthly), fee = num(input.fee), sales = num(input.sales);
  if (!monthly && !deposit) return null;
  const total = Math.round((monthly + fee + (deposit * RR.depositRate) / 12) * 10) / 10;
  const burden = sales ? total / sales : null;
  const score = burden == null ? null : RR.bands.find(([max]) => burden <= max)[1];
  return { deposit, monthly, fee, sales, total, burden, score, source: "input" };
}

export function loadRentInput(key) {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}")[key] || null; } catch (e) { return null; }
}
export function saveRentInput(key, input) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (input) all[key] = input;
    else delete all[key];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch (e) { /* 저장 불가(사생활 보호 모드 등) — 이번 화면에서만 반영 */ }
}

// ── 공개 임대료(한국부동산원 상권 평균) 참고 ─────────────────────
// 자료는 행정동이 아니라 상권 단위(예: 서울>도심>광화문)라, 동 이름이 상권 이름과 겹칠 때만 그 상권을 보여 주고 아니면 시도 평균으로 대신한다.
const SIDO = { 11: ["서울"], 26: ["부산"], 27: ["대구"], 28: ["인천"], 29: ["전남광주"], 30: ["대전"], 31: ["울산"], 36: ["세종"], 41: ["경기"], 42: ["강원"], 43: ["충북"], 44: ["충남"], 45: ["전북"], 46: ["전남광주"], 47: ["경북"], 48: ["경남"], 50: ["제주"], 51: ["강원"], 52: ["전북"] };
const stem = (name) => String(name || "").replace(/\d+가?\d*동$|동$/u, "").replace(/\d+$/u, "");
const PY = 3.3058; // 1평 = 3.3058㎡

export function matchRentRef(ref, place) {
  const sido = SIDO[String(place?.dongCode || "").slice(0, 2)]?.[0];
  if (!ref?.areas?.length || !sido) return null;
  const inSido = ref.areas.filter((x) => x.n.split(">")[0] === sido);
  const dong = stem(place.name);
  const near = dong.length >= 2
    ? inSido.filter((x) => { const t = x.n.split(">").pop(); return t.includes(dong) || (t.length >= 2 && dong.includes(t)); }).slice(0, 3)
    : [];
  const avg = inSido.length ? Math.round((inSido.reduce((s, x) => s + x.v, 0) / inSido.length) * 10) / 10 : null;
  return { asOf: ref.asOf, unit: ref.unit, near, sidoName: sido, sidoAvg: avg, sidoN: inSido.length, national: ref.national };
}

// 천원/㎡ → "㎡당 19.0천원 (평당 약 6.3만원)"
export function fmtRentUnit(v) {
  return `㎡당 ${v.toFixed(1)}천원 (평당 약 ${((v * PY) / 10).toFixed(1)}만원)`;
}
