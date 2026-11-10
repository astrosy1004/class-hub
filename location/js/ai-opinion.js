// AI 전문가 의견: 이미 계산된 분석 요약만 중계 서버(location-ai, Vercel)로 보내 LLM 의견을 받는다.
// 키는 서버에만 있다. 서버 주소(CONFIG.AI_URL)가 비어 있으면 기능을 숨긴다. 좌표 · 개인정보는 보내지 않는다.
import { CONFIG } from "./config.js";
import { AGE_GROUPS } from "./area-data.js";
import { fmtPct, fmtAgePct } from "./metrics.js";
import { allowedNumbers, validateOpinion, validateAnswer } from "./ai-guard.js";

const CACHE_KEY = "aiOpinion";
const CACHE_MS = 6 * 3600000; // 같은 결과는 6시간 동안 다시 묻지 않는다
const TIMEOUT_MS = 25000;

// 서버 주소: config 값. 로컬 확인(localhost)에서만 개발용으로 localStorage "dev:aiUrl" 을 쓸 수 있다
export function aiUrl() {
  if (CONFIG.AI_URL) return CONFIG.AI_URL;
  try { return location.hostname === "localhost" ? localStorage.getItem("dev:aiUrl") || "" : ""; } catch (e) { return ""; }
}

const r1 = (x) => Math.round(x * 1000) / 10; // 0.0427 → 4.3 (%)

// 분석 결과 → 서버로 보낼 요약 (숫자는 화면에 나온 값과 같은 반올림)
export function buildPayload(a) {
  const m = a.metrics, s = a.score;
  const topAge = a.pop ? AGE_GROUPS.find((g) => g.key === m.topAge) : null;
  const basis = {
    customer: topAge ? `생활인구 연령 중 가장 많은 층 ${topAge.name} ${fmtAgePct(m.age[m.topAge])}` : "",
    size: a.pop ? `생활인구 기준 영업시간 중 평일 ${m.openPeakHour}시가 가장 붐빔` : "",
    competition: `반경 ${CONFIG.RADIUS_M}m 동종 점포 ${a.comp.count}${a.comp.capped ? "곳 이상" : "곳"}`,
    closure: a.closure ? `최근 4분기 폐업률 ${r1(a.closure.rate)}% (서울 행정동 중간 ${r1(a.closure.median ?? 0)}%)` : "",
    growth: a.pop ? `생활인구 직전 3개월 대비 ${fmtPct(m.growth)}` : "",
  };
  return {
    place: a.place.name, gu: a.place.guName || "", industry: a.industry.name,
    asOf: a.pop?.asOf || "", total: s.total, grade: s.grade?.name || "",
    items: s.items.filter((it) => it.score != null && it.key !== "rent").map((it) => ({ name: it.short, score: it.score, basis: basis[it.key] || "" })),
    facts: {
      ...(a.pop ? { weekendRatio: Math.round(m.weekendRatio * 100) / 100, peakHour: m.openPeakHour } : {}),
      competitors: a.comp.count,
      ...(a.closure ? { closurePeriod: `${String(a.closure.quarters?.[0] ?? "").slice(0, 4)}년 ${String(a.closure.quarters?.[0] ?? "").slice(4)}분기 ~ ${String(a.closure.asOf).slice(0, 4)}년 ${String(a.closure.asOf).slice(4)}분기`, franchiseStores: a.closure.frc } : {}),
    },
  };
}

function readCache(key) {
  try {
    const v = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}")[key];
    return v && Date.now() - v.at < CACHE_MS ? v.data : null;
  } catch (e) { return null; }
}
function writeCache(key, data) {
  try {
    const all = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    for (const k of Object.keys(all)) if (Date.now() - all[k].at >= CACHE_MS) delete all[k];
    all[key] = { at: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch (e) { /* 저장 못 해도 결과는 보여 준다 */ }
}

// { ok: true, opinion, model, cached } 또는 { ok: false, reason }. 예외를 던지지 않는다
export async function requestOpinion(a) {
  const url = aiUrl();
  if (!url) return { ok: false, reason: "off" };
  const payload = buildPayload(a);
  const key = `${a.key}|${payload.asOf}|${payload.total}`;
  const hit = readCache(key);
  if (hit) return { ...hit, cached: true };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: ctrl.signal });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, reason: j.error || `http_${r.status}` };
    // 서버가 검사했더라도 앱에서 한 번 더 확인한다 (입력에 없는 숫자가 있으면 버림)
    const v = validateOpinion(j.opinion, allowedNumbers(payload), JSON.stringify(payload));
    if (!v.ok) return { ok: false, reason: v.reason };
    const data = { ok: true, opinion: v.opinion, model: j.model || "" };
    writeCache(key, data);
    return data;
  } catch (e) {
    return { ok: false, reason: e?.name === "AbortError" ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

// "이 결과에 물어보기": 질문은 서버에 고정된 세 가지 키로만 보낸다 (자유 입력 없음)
export const ASK_KEYS = ["risk", "differentiate", "checklist"];
export function askLabels(a) {
  const comp = a.score.items.find((i) => i.key === "competition")?.score;
  return {
    risk: "이 자리에서 가장 큰 위험은 뭐예요?",
    differentiate: comp != null && comp < 50 ? "경쟁이 치열한데 어떻게 차별화할까요?" : "어떤 점으로 차별화하면 좋을까요?",
    checklist: "계약 전에 현장에서 뭘 확인해야 하나요?",
  };
}

// { ok: true, answer, model, cached } 또는 { ok: false, reason }. 예외를 던지지 않는다
export async function requestAnswer(a, question) {
  const url = aiUrl();
  if (!url) return { ok: false, reason: "off" };
  if (!ASK_KEYS.includes(question)) return { ok: false, reason: "bad_question" };
  const payload = buildPayload(a);
  const key = `${a.key}|${payload.asOf}|${payload.total}|q:${question}`;
  const hit = readCache(key);
  if (hit) return { ...hit, cached: true };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, question }), signal: ctrl.signal });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, reason: j.error || `http_${r.status}` };
    const v = validateAnswer(j, allowedNumbers(payload), JSON.stringify(payload));
    if (!v.ok) return { ok: false, reason: v.reason };
    const data = { ok: true, answer: v.answer, model: j.model || "" };
    writeCache(key, data);
    return data;
  } catch (e) {
    return { ok: false, reason: e?.name === "AbortError" ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

// 실패 사유 → 화면 문장
export const failText = (reason) => ({
  rate_limited: "잠시 후 다시 시도해 주세요 (시간당 요청 수를 넘었어요).",
  unverified_numbers: "AI 답변에 분석에 없는 숫자가 섞여 있어 보여 드리지 않았어요.",
  forbidden_words: "AI 답변에 단정적인 표현이 있어 보여 드리지 않았어요.",
  unverified_concepts: "AI 답변에 분석 자료에 없는 내용(매출 등)이 섞여 있어 보여 드리지 않았어요.",
  timeout: "응답이 늦어 중단했어요. 잠시 후 다시 시도해 주세요.",
  not_configured: "AI 서버 설정이 아직 끝나지 않았어요.",
}[reason] || "AI 의견을 받지 못했어요.");
