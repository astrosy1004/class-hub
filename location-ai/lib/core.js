// 자리잡소 AI 전문가 의견 중계: 앱이 보낸 분석 요약 → OpenRouter LLM → 검증된 의견. 플랫폼에 묶이지 않는 순수 함수.
// Vercel 은 api/opinion.js 가 이 함수를 감싼다. 키는 서버 환경변수에만 있고, 코드 · 로그 · 응답에 절대 넣지 않는다.
//   OPENROUTER_API_KEY   (필수) OpenRouter 키
//   OPENROUTER_MODEL     (선택) 기본 openai/gpt-4o-mini
//   ALLOWED_ORIGINS      (선택) 쉼표로 구분한 허용 출처. 기본은 자리잡소 사이트 + 로컬 확인 주소
//   RATE_LIMIT_PER_HOUR  (선택) 한 IP 당 시간당 호출 수. 기본 20
import { allowedNumbers, validateOpinion, parseJsonLoose } from "./guard.js";

const DEFAULT_ORIGINS = ["https://location-app-sykim.web.app", "https://location-app-sykim.firebaseapp.com", "http://localhost:5530"];
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const TIMEOUT_MS = 20000;
const MAX_TOKENS = 700;

// 인스턴스 메모리 기반의 간단한 호출 제한 (서버리스라 인스턴스마다 따로 센다 — 대략적인 남용 방지용)
const hits = new Map();
function limited(ip, perHour, now) {
  const from = now - 3600000;
  const list = (hits.get(ip) || []).filter((t) => t > from);
  if (list.length >= perHour) { hits.set(ip, list); return true; }
  list.push(now);
  hits.set(ip, list);
  return false;
}

// 받은 요약에서 쓰는 칸만 남긴다 (좌표 · 개인정보 칸은 애초에 받지 않음)
const str = (v, n = 80) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v * 10) / 10 : null);
export function sanitize(body) {
  const b = body && typeof body === "object" ? body : {};
  const out = {
    place: str(b.place, 30), gu: str(b.gu, 20), industry: str(b.industry, 30), asOf: str(b.asOf, 20),
    total: num(b.total), grade: str(b.grade, 20),
    items: (Array.isArray(b.items) ? b.items : []).slice(0, 8).map((it) => ({ name: str(it?.name, 20), score: num(it?.score), basis: str(it?.basis, 120) })).filter((it) => it.name),
    facts: Object.fromEntries(Object.entries(b.facts && typeof b.facts === "object" ? b.facts : {}).slice(0, 16)
      .map(([k, v]) => [str(k, 30), typeof v === "number" ? num(v) : str(v, 80)]).filter(([k, v]) => k && v !== null && v !== "")),
  };
  return out.place && out.industry ? out : null;
}

export function buildMessages(s) {
  const system = [
    "당신은 서울 소상공인 창업 입지를 상담하는 컨설턴트입니다.",
    "아래 JSON 의 숫자와 사실만 근거로 의견을 씁니다. JSON 에 없는 숫자(매출, 임대료, 인구 수 등)는 절대 만들어 쓰지 않습니다.",
    "성공을 보장하거나 단정하는 표현(반드시, 무조건, 확실히 성공 등)을 쓰지 않습니다.",
    "자료 기준일을 한 번 언급하고, 현장 확인을 권합니다. 한국어 존댓말로 짧고 구체적으로 씁니다.",
    '응답은 JSON 하나만: {"strengths":[문장 1~3개],"cautions":[문장 1~3개],"strategies":[문장 2~3개],"overall":"3문장 이내 종합 의견"}',
  ].join("\n");
  return [{ role: "system", content: system }, { role: "user", content: JSON.stringify(s) }];
}

export async function handle(req, { env = {}, fetchImpl = fetch, now = Date.now() } = {}) {
  const origins = (env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(",") : DEFAULT_ORIGINS).map((x) => x.trim()).filter(Boolean);
  const origin = req.origin || "";
  const allowedOrigin = origins.includes(origin);
  const headers = allowedOrigin
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }
    : {};
  const out = (status, json) => ({ status, headers, json });

  if (!allowedOrigin) return out(403, { error: "origin_not_allowed" });
  if (req.method === "OPTIONS") return out(204, null);
  if (req.method !== "POST") return out(405, { error: "method_not_allowed" });
  if (!env.OPENROUTER_API_KEY) return out(503, { error: "not_configured" });
  if (limited(req.ip || "unknown", Number(env.RATE_LIMIT_PER_HOUR) || 20, now)) return out(429, { error: "rate_limited" });

  const summary = sanitize(req.body);
  if (!summary) return out(400, { error: "bad_request" });

  const model = env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let content;
  try {
    const r = await fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, "Content-Type": "application/json", "HTTP-Referer": origin, "X-Title": "jarijapso" },
      body: JSON.stringify({ model, messages: buildMessages(summary), max_tokens: MAX_TOKENS, temperature: 0.3, response_format: { type: "json_object" } }),
    });
    if (!r.ok) return out(502, { error: "upstream_error", status: r.status });
    const j = await r.json();
    content = j?.choices?.[0]?.message?.content;
  } catch (e) {
    return out(e?.name === "AbortError" ? 504 : 502, { error: e?.name === "AbortError" ? "timeout" : "upstream_error" });
  } finally {
    clearTimeout(timer);
  }

  const v = validateOpinion(parseJsonLoose(content), allowedNumbers(summary));
  if (!v.ok) return out(422, { error: v.reason, bad: v.bad });
  return out(200, { opinion: v.opinion, model, asOf: summary.asOf });
}
