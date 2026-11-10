// 자리잡소 AI 전문가 의견 중계: 앱이 보낸 분석 요약 → OpenRouter LLM → 검증된 의견. 플랫폼에 묶이지 않는 순수 함수.
// Vercel 은 api/opinion.js 가 이 함수를 감싼다. 키는 서버 환경변수에만 있고, 코드 · 로그 · 응답에 절대 넣지 않는다.
//   OPENROUTER_API_KEY   (필수) OpenRouter 키
//   OPENROUTER_MODEL     (선택) 기본 openai/gpt-4o-mini
//   ALLOWED_ORIGINS      (선택) 쉼표로 구분한 허용 출처. 기본은 자리잡소 사이트 + 로컬 확인 주소
//   RATE_LIMIT_PER_HOUR  (선택) 한 IP 당 시간당 호출 수. 기본 40 (의견 1번 + 질문 3개 = 결과 하나에 4번)
import { allowedNumbers, validateOpinion, validateAnswer, parseJsonLoose } from "./guard.js";

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

// "이 결과에 물어보기": 질문은 이 세 가지로만 받는다 (자유 입력 없음). 질문별 지시문은 서버에 고정
export const QUESTIONS = {
  risk: "이 자리에서 가장 큰 위험 한두 가지를 근거 숫자와 함께 설명하고, 그 위험을 줄이려면 무엇을 확인해야 하는지 알려 주세요.",
  differentiate: "경쟁 점포 수와 고객층 근거를 바탕으로, 이 업종이 이 동네에서 차별화할 수 있는 방향 두세 가지를 제안해 주세요.",
  checklist: "계약 전에 현장에서 직접 확인해야 할 것 서너 가지를 알려 주세요. 각 항목이 왜 필요한지 근거 숫자와 연결해 주세요.",
};

const RULES = [
    "당신은 서울 소상공인 창업 입지를 상담하는 컨설턴트입니다.",
    "아래 JSON 의 숫자와 사실만 근거로 의견을 씁니다. JSON 에 없는 숫자(매출, 임대료, 인구 수 등)는 절대 만들어 쓰지 않습니다.",
    "생활인구는 그 시간 그 동네에 머문 사람 수의 추정치입니다. 매출, 수익, 방문객, 손님 수로 바꿔 말하지 않습니다. 매출 · 임대료 자료는 없습니다.",
    "items 의 name 은 점수 항목, basis 는 그 항목의 근거입니다. 근거 숫자는 그 항목에만 쓰고, 다른 항목에 붙이지 않습니다.",
    "숫자를 쓸 때는 basis 에 적힌 대상 · 기간 · 단위를 그대로 붙입니다. 예: '생활인구 직전 3개월 대비 -1.4%'를 '3년간'이나 '매출 감소'로 바꾸지 않습니다.",
    "'서울 행정동 중간'은 평균이 아니라 중간값입니다. '매출', '수익', '방문객', '임대료'라는 낱말은 쓰지 않습니다.",
    "성공을 보장하거나 단정하는 표현(반드시, 무조건, 확실히 성공 등)을 쓰지 않습니다.",
];

export function buildAnswerMessages(s, q) {
  const system = [...RULES, "질문에 3~4문장 이내의 한국어 존댓말로 답합니다.", '응답은 JSON 하나만: {"answer":"3~4문장 답변"}'].join("\n");
  return [{ role: "system", content: system }, { role: "user", content: `분석 요약: ${JSON.stringify(s)}\n질문: ${QUESTIONS[q]}` }];
}

export function buildMessages(s) {
  const system = [
    "당신은 서울 소상공인 창업 입지를 상담하는 컨설턴트입니다.",
    "아래 JSON 의 숫자와 사실만 근거로 의견을 씁니다. JSON 에 없는 숫자(매출, 임대료, 인구 수 등)는 절대 만들어 쓰지 않습니다.",
    "생활인구는 그 시간 그 동네에 머문 사람 수의 추정치입니다. 매출, 수익, 방문객, 손님 수로 바꿔 말하지 않습니다. 매출 · 임대료 자료는 없습니다.",
    "items 의 name 은 점수 항목, basis 는 그 항목의 근거입니다. 근거 숫자는 그 항목에만 쓰고, 다른 항목에 붙이지 않습니다.",
    "숫자를 쓸 때는 basis 에 적힌 대상 · 기간 · 단위를 그대로 붙입니다. 예: '생활인구 직전 3개월 대비 -1.4%'를 '3년간'이나 '매출 감소'로 바꾸지 않습니다.",
    "'서울 행정동 중간'은 평균이 아니라 중간값입니다. '매출', '수익', '방문객', '임대료'라는 낱말은 쓰지 않습니다.",
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
  if (limited(req.ip || "unknown", Number(env.RATE_LIMIT_PER_HOUR) || 40, now)) return out(429, { error: "rate_limited" });

  const summary = sanitize(req.body);
  if (!summary) return out(400, { error: "bad_request" });
  const q = req.body?.question;
  if (q !== undefined && !Object.hasOwn(QUESTIONS, q)) return out(400, { error: "bad_question" });

  const model = env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  // 검사에 걸리면 걸린 표현을 알려 주고 한 번만 다시 묻는다 (두 번째도 걸리면 422 → 앱은 규칙 기반 의견을 보여 줌)
  const allowed = allowedNumbers(summary), source = JSON.stringify(summary);
  const messages = q ? buildAnswerMessages(summary, q) : buildMessages(summary);
  const check = (raw) => (q ? validateAnswer(raw, allowed, source) : validateOpinion(raw, allowed, source));
  let v;
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: ctrl.signal,
        headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, "Content-Type": "application/json", "HTTP-Referer": origin, "X-Title": "jarijapso" },
        body: JSON.stringify({ model, messages, max_tokens: MAX_TOKENS, temperature: 0.2, response_format: { type: "json_object" } }),
      });
      if (!r.ok) return out(502, { error: "upstream_error", status: r.status });
      const j = await r.json();
      const content = j?.choices?.[0]?.message?.content;
      v = check(parseJsonLoose(content));
      if (v.ok || v.reason === "shape") break;
      messages.push({ role: "assistant", content: String(content || "").slice(0, 2000) });
      messages.push({ role: "user", content: `다음 표현은 입력 자료에 없으니 빼고, 같은 JSON 형식으로 다시 써 주세요: ${v.bad.length ? v.bad.join(", ") : "단정 표현"}` });
    }
  } catch (e) {
    return out(e?.name === "AbortError" ? 504 : 502, { error: e?.name === "AbortError" ? "timeout" : "upstream_error" });
  } finally {
    clearTimeout(timer);
  }

  if (!v.ok) return out(422, { error: v.reason, bad: v.bad });
  if (q) return out(200, { answer: v.answer, question: q, model, asOf: summary.asOf });
  return out(200, { opinion: v.opinion, model, asOf: summary.asOf });
}
