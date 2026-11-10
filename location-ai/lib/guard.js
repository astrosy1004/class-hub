// AI 의견 안전장치: 문장에 들어간 숫자가 모두 입력(분석 요약)에 있던 숫자인지 확인한다.
// 앱 쪽 location/js/ai-guard.js 와 같은 규칙이다 (서버 · 앱 두 번 검사). 바꿀 때는 두 파일을 함께 고친다.

// 1~5 같은 작은 수는 "1~2곳 더 비교" 같은 표현에 쓰여 허용한다
const SMALL = ["0", "1", "2", "3", "4", "5"];

const norm = (s) => {
  const n = Number(String(s).replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  return String(Math.round(n * 10) / 10);
};
const numbersIn = (text) => (String(text).match(/\d[\d,]*(?:\.\d+)?/g) || []).map(norm).filter((x) => x != null);

// 입력 요약에서 허용 숫자 집합을 만든다 (소수는 반올림한 정수도 허용: 36.4% → "36")
export function allowedNumbers(payload) {
  const set = new Set(SMALL);
  for (const n of numbersIn(JSON.stringify(payload))) {
    set.add(n);
    set.add(String(Math.round(Number(n))));
  }
  return set;
}

// 입력 자료에 없는 개념: 생활인구는 매출 · 방문객이 아니고, 추이는 몇 달 단위다. 입력 요약에 없는데 답변에 나오면 거부한다
// ("2026년" 같은 연도는 허용, "3년간"처럼 1~2자리 숫자 + 년은 기간으로 본다)
const CONCEPTS = /매출|수익|순이익|영업이익|객단가|방문객|손님 수|임대료|권리금|월세|연간|년간|작년|지난해|(?<!\d)\d{1,2}\s*년(?!\d)/g;
export function unknownConcepts(text, source) {
  const src = String(source || "");
  return [...new Set(String(text).match(CONCEPTS) || [])].filter((w) => !src.includes(w));
}

// AI 응답 모양 + 숫자 검사. 통과하면 { ok: true, opinion }, 아니면 { ok: false, reason, bad }
export function validateOpinion(raw, allowed, source = "") {
  const list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).slice(0, 4).map((x) => x.trim().slice(0, 240)) : []);
  if (!raw || typeof raw !== "object") return { ok: false, reason: "shape", bad: [] };
  const opinion = {
    strengths: list(raw.strengths),
    cautions: list(raw.cautions),
    strategies: list(raw.strategies),
    overall: typeof raw.overall === "string" ? raw.overall.trim().slice(0, 600) : "",
  };
  if (!opinion.overall || (!opinion.strengths.length && !opinion.cautions.length)) return { ok: false, reason: "shape", bad: [] };
  const text = [...opinion.strengths, ...opinion.cautions, ...opinion.strategies, opinion.overall].join(" ");
  const bad = [...new Set(numbersIn(text).filter((n) => !allowed.has(n)))];
  if (bad.length) return { ok: false, reason: "unverified_numbers", bad };
  if (/반드시|무조건|확실히 성공|100% 성공|보장합니다/.test(text)) return { ok: false, reason: "forbidden_words", bad: [] };
  const off = unknownConcepts(text, source);
  if (off.length) return { ok: false, reason: "unverified_concepts", bad: off };
  return { ok: true, opinion };
}

// 모델 응답 문자열에서 JSON 을 꺼낸다 (```json 울타리가 붙어 와도)
export function parseJsonLoose(content) {
  const s = String(content || "").replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try { return JSON.parse(s); } catch (e) { /* 아래에서 중괄호 구간만 다시 시도 */ }
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; } }
  return null;
}
