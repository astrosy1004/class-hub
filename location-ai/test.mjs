// 중계 함수 시험 (실제 OpenRouter 를 부르지 않고 모의 응답으로): node test.mjs
import { readFileSync } from "node:fs";
import { handle, sanitize } from "./lib/core.js";
import { allowedNumbers, validateOpinion } from "./lib/guard.js";

let pass = 0, fail = 0;
const check = (name, ok) => { ok ? pass++ : fail++; console.log(`${ok ? "✔" : "✖"} ${name}`); };

const body = {
  place: "연남동", gu: "마포구", industry: "카페", asOf: "2026-10-29", total: 44, grade: "재검토",
  items: [{ name: "고객 일치", score: 93, basis: "주요 고객 50대 이상 36%" }, { name: "폐업 위험", score: 40, basis: "최근 1년 폐업률 4.3% (서울 중간 3.9%)" }],
  facts: { competitors: 247, peakHour: 19 },
  lat: 37.56, lng: 126.92, // 보내지 말아야 할 칸 — 서버가 버리는지 본다
};
const llm = (obj) => async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: typeof obj === "string" ? obj : JSON.stringify(obj) } }] }) });
const good = {
  strengths: ["손님층이 카페와 잘 맞습니다 (고객 일치 93점)."],
  cautions: ["최근 1년 폐업률이 4.3%로 서울 중간 3.9%보다 높습니다."],
  strategies: ["평일 19시 전후에 현장을 확인해 보세요.", "경쟁 점포 247곳과 겹치지 않는 메뉴를 준비하세요."],
  overall: "2026-10-29 기준 자료로 보면 재검토가 필요한 자리입니다. 현장 확인 후 판단하세요.",
};
const env = { OPENROUTER_API_KEY: "test-key-not-real" };
const req = (over = {}) => ({ method: "POST", origin: "https://location-app-sykim.web.app", ip: `1.1.1.${Math.random()}`, body, ...over });

const s = sanitize(body);
check("좌표 칸은 버린다", !("lat" in s) && !("lng" in s));
check("허용 숫자: 입력 숫자는 통과", validateOpinion(good, allowedNumbers(s), JSON.stringify(s)).ok);
const invented = { ...good, cautions: ["예상 월매출은 3200만원입니다."] };
check("입력에 없는 숫자(3200)는 거부", !validateOpinion(invented, allowedNumbers(s)).ok);
const src = JSON.stringify(s);
check("자료에 없는 개념: '매출이 감소세'는 거부", validateOpinion({ ...good, cautions: ["상권 내 매출이 감소세를 보입니다."] }, allowedNumbers(s), src).reason === "unverified_concepts");
check("기간 바꿔치기: '최근 3년간'은 거부", validateOpinion({ ...good, cautions: ["최근 3년간 생활인구가 줄었습니다."] }, allowedNumbers(s), src).reason === "unverified_concepts");
check("연도(2026년)는 허용", validateOpinion({ ...good, overall: "2026년 10월 29일 기준 자료입니다. 현장 확인 후 판단하세요." }, allowedNumbers(s), src).ok);
check("입력에 있는 개념은 허용 (근거에 '방문객'이 있으면 통과)", validateOpinion({ ...good, strengths: ["방문객 흐름이 좋습니다."] }, allowedNumbers(s), src + "방문객").ok);
check("단정 표현은 거부", !validateOpinion({ ...good, overall: "반드시 성공합니다. 2026-10-29 기준." }, allowedNumbers(s)).ok);

let r = await handle(req(), { env, fetchImpl: llm(good) });
check("정상: 200 + 의견", r.status === 200 && r.json.opinion.strategies.length === 2);
r = await handle(req(), { env, fetchImpl: llm("```json\n" + JSON.stringify(good) + "\n```") });
check("```json 울타리가 붙어도 읽음", r.status === 200);
r = await handle(req(), { env, fetchImpl: llm({ ...good, cautions: ["매출이 감소세를 보이고 있습니다."] }) });
check("서버: 매출처럼 자료에 없는 개념이면 422", r.status === 422 && r.json.error === "unverified_concepts" && r.json.bad.includes("매출"));
await handle(req(), { env, fetchImpl: async (url, o) => { const m = JSON.parse(o.body).messages[0].content; r = /매출, 수익, 방문객/.test(m) && /기간/.test(m); return llm(good)(); } });
check("지시문에 생활인구 ≠ 매출 · 기간 그대로 쓰기 규칙이 있음", r === true);
r = await handle(req(), { env, fetchImpl: llm(invented) });
check("지어낸 숫자면 422 (앱은 규칙 의견을 그대로 보여 줌)", r.status === 422 && r.json.bad.includes("3200"));
r = await handle(req({ origin: "https://evil.example" }), { env, fetchImpl: llm(good) });
check("허용되지 않은 출처는 403 · CORS 헤더 없음", r.status === 403 && !r.headers["Access-Control-Allow-Origin"]);
r = await handle(req(), { env: {}, fetchImpl: llm(good) });
check("키가 없으면 503", r.status === 503);
r = await handle(req({ method: "OPTIONS" }), { env, fetchImpl: llm(good) });
check("OPTIONS 는 204 + CORS", r.status === 204 && r.headers["Access-Control-Allow-Origin"] === "https://location-app-sykim.web.app");
let sent;
await handle(req(), { env, fetchImpl: async (url, o) => { sent = JSON.parse(o.body); return llm(good)(); } });
check("LLM 에 보낸 요약에 좌표 없음 · 길이 제한 있음", !JSON.stringify(sent.messages).includes("126.92") && sent.max_tokens === 700);
const ip = "9.9.9.9";
let last;
for (let i = 0; i < 4; i++) last = await handle(req({ ip }), { env: { ...env, RATE_LIMIT_PER_HOUR: "3" }, fetchImpl: llm(good) });
check("호출 제한: 같은 IP 4번째는 429", last.status === 429);
r = await handle(req(), { env, fetchImpl: async () => { const e = new Error("t"); e.name = "AbortError"; throw e; } });
check("시간 초과는 504", r.status === 504);
check("응답 · 코드에 키 값이 나오지 않음", !JSON.stringify(r).includes("test-key-not-real"));

// 앱 쪽 검증기(location/js/ai-guard.js)와 규칙이 같은지
const appGuard = await import(new URL("../location/js/ai-guard.js", import.meta.url));
check("앱 검증기와 결과가 같음", appGuard.validateOpinion(invented, appGuard.allowedNumbers(s)).ok === false && appGuard.validateOpinion(good, appGuard.allowedNumbers(s), src).ok === true && appGuard.validateOpinion({ ...good, cautions: ["매출 감소"] }, appGuard.allowedNumbers(s), src).reason === "unverified_concepts");
check("앱 검증기 파일이 서버와 같은 규칙(본문 동일)", readFileSync(new URL("../location/js/ai-guard.js", import.meta.url), "utf8").split("\n").slice(2).join("\n") === readFileSync(new URL("./lib/guard.js", import.meta.url), "utf8").split("\n").slice(2).join("\n"));

console.log(`\n${pass} 통과 · ${fail} 실패`);
process.exitCode = fail ? 1 : 0;
