// 한국부동산원 R-ONE 통계 Open API 도우미 (임대료 자료 찾기 · 확인용). 외부 패키지 없이 Node 20 만으로 동작한다.
// 키: RONE_API_KEY (R-ONE 누리집에서 발급). 브라우저 코드에는 넣지 않는다 (R-ONE 은 CORS 를 지원하지 않아 서버에서만 호출).
//
//   node collector/rone.js list                  통계표 전체 중 "임대" · "공실" · "상가" 가 들어간 표 (ID · 이름 · 주기)
//   node collector/rone.js list 키워드           키워드가 들어간 표
//   node collector/rone.js data <통계표ID> [주기] [시점]   그 표의 자료 앞부분을 출력 (주기 기본 QY · 시점은 생략하면 최근 분기 후보를 차례로 시도)
//
// 요청 규격 (R-ONE 개발 안내 기준): 기본 주소 https://www.reb.or.kr/r-one/openapi/
//   SttsApiTbl.do      통계표 목록        SttsApiTblData.do   통계표 자료
//   공통 파라미터 KEY · Type(json) · pIndex · pSize / 자료: STATBL_ID · DTACYCLE_CD(MM · QY · YY) · WRTTIME_IDTFR_ID · CLS_ID · ITM_ID
// 키가 없으면 맛보기 모드(5건)로만 동작한다.
const BASE = process.env.RONE_BASE_URL || "https://www.reb.or.kr/r-one/openapi/";
const KEY = process.env.RONE_API_KEY || "";

export async function call(path, params) {
  const qs = new URLSearchParams({ Type: "json", ...(KEY ? { KEY } : {}), ...params });
  const res = await fetch(`${BASE}${path}?${qs}`, { headers: { Accept: "application/json" } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} 응답 ${res.status}: ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch (e) { throw new Error(`${path} 응답이 JSON 이 아니에요 (키 · 규격 확인): ${text.slice(0, 200).replace(/\s+/g, " ")}`); }
}

// 응답 모양이 서비스마다 달라도 읽도록: { 서비스명: [ {head:[…]}, {row:[…]} ] } 형태에서 row · 전체 건수를 찾는다
export function unpack(json) {
  const out = { rows: [], total: null, message: "" };
  const walk = (v) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v.row)) out.rows.push(...v.row);
    if (Array.isArray(v.head)) v.head.forEach((h) => { if (h?.list_total_count != null) out.total = Number(h.list_total_count); });
    if (v.RESULT?.MESSAGE) out.message = `${v.RESULT.CODE || ""} ${v.RESULT.MESSAGE}`.trim();
    Object.values(v).forEach((x) => { if (x && typeof x === "object") walk(x); });
  };
  walk(json);
  return out;
}

const pick = (o, names) => { for (const n of names) if (o[n] != null && o[n] !== "") return o[n]; return ""; };

async function list(words) {
  const PAGE = 1000;
  const all = [];
  for (let page = 1; page <= 50; page++) {
    const r = unpack(await call("SttsApiTbl.do", { pIndex: page, pSize: PAGE }));
    if (r.message && !r.rows.length) { console.error("응답 메시지:", r.message); break; }
    all.push(...r.rows);
    if (!KEY) { console.error("※ 키가 없어 맛보기 5건만 받았어요. RONE_API_KEY 를 설정하세요."); break; }
    if (r.rows.length < PAGE || (r.total != null && all.length >= r.total)) break;
  }
  if (!all.length) return console.log("받은 통계표가 없어요. 키 · 기본 주소(RONE_BASE_URL) · 응답을 확인하세요.");
  console.log(`통계표 ${all.length}개를 받았어요. 필드 예시:`, Object.keys(all[0]).join(", "));
  const hit = all.filter((t) => words.some((w) => JSON.stringify(t).includes(w)));
  console.log(`\n"${words.join(" · ")}" 가 들어간 표 ${hit.length}개`);
  hit.forEach((t) => console.log(`${pick(t, ["STATBL_ID", "STATBL_CD"])}\t${pick(t, ["STATBL_NM", "TBL_NM"])}\t주기 ${pick(t, ["DTACYCLE_NM", "DTACYCLE_CD"])}\t${pick(t, ["UI_NM"])}`));
}

async function data(id, cycle, time) {
  if (!KEY) console.error("※ RONE_API_KEY 가 이 창에 설정돼 있지 않아요. 같은 창에서 set RONE_API_KEY=키 를 먼저 실행하세요 (키 없이는 ERROR-300 이 날 수 있어요).");
  // 필수 값(주기 · 시점)이 빠지면 ERROR-300 이 나므로 기본값 QY(분기)와 시점 후보를 차례로 시도한다
  const cyc = cycle || "QY";
  const times = time ? [time] : ["20263", "202603", "2026Q3", "20262", "202602", "2026Q2"];
  let last = null;
  for (const t of times) {
    const r = unpack(await call("SttsApiTblData.do", { STATBL_ID: id, DTACYCLE_CD: cyc, WRTTIME_IDTFR_ID: t, pIndex: 1, pSize: 30 }));
    last = r;
    if (!r.rows.length) { console.log(`시점 ${t}: ${r.message || "자료 없음"}`); continue; }
    console.log(`주기 ${cyc} · 시점 ${t} · 전체 ${r.total ?? "?"}건 중 ${r.rows.length}건. 필드:`, Object.keys(r.rows[0]).join(", "));
    r.rows.forEach((x) => console.log([pick(x, ["WRTTIME_DESC", "WRTTIME_IDTFR_ID"]), pick(x, ["CLS_FULLNM", "CLS_NM"]), pick(x, ["ITM_NM"]), `${pick(x, ["DTA_VAL"])}${pick(x, ["UI_NM"])}`].join("\t")));
    return;
  }
  console.log("자료가 없어요.", last?.message || "(주기 · 시점 · 통계표 ID 를 확인하세요)");
}

if (process.argv[1]?.endsWith("rone.js")) {
const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === "list") await list(args.length ? args : ["임대", "공실", "상가"]);
  else if (cmd === "data" && args[0]) await data(args[0], args[1], args[2]);
  else console.log("사용법: node collector/rone.js list [키워드…] | data <통계표ID> [주기] [시점]");
} catch (e) {
  console.error("실패:", e.message);
  process.exitCode = 1;
}
}
