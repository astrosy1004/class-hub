// 한국부동산원 R-ONE 임대동향 → Firestore rentRef/smallShop (분기 갱신). 참고용 "상권 평균 임대료"로만 쓴다 (점수 계산에는 넣지 않음).
// 지역 구분이 행정동이 아니라 상권(예: 서울>도심>광화문)이라 앱에서 이름으로 맞춰 보여 준다.
//   node collector/rent.js           받아서 요약만 출력 (Firestore 에 쓰지 않음)
// collect.js 가 RONE_API_KEY 가 있을 때 매일 한 번 확인해 저장한다 (분기 자료라 값이 같으면 그대로 덮어씀).
import { call, unpack } from "./rone.js";

// 임대동향 지역별 임대료(2026년3분기~)_소규모 상가. 새 기간 표가 나오면 RONE_RENT_TABLE 로 바꾼다.
const TABLE = process.env.RONE_RENT_TABLE || "T269273143698159";

// 분기 시점 코드는 YYYY0Q (예: 202603 = 2026년 3분기). 최근 분기부터 거꾸로 시도한다.
export function quarterCodes(now = new Date(), n = 6) {
  let y = now.getFullYear(), q = Math.floor(now.getMonth() / 3) + 1;
  const out = [];
  for (let i = 0; i < n; i++) { out.push(`${y}0${q}`); if (--q === 0) { q = 4; y--; } }
  return out;
}

export function buildRentRef(rows) {
  const items = rows
    .map((r) => ({ n: String(r.CLS_FULLNM || r.CLS_NM || "").trim(), v: Number(r.DTA_VAL), t: r.WRTTIME_DESC }))
    .filter((x) => x.n && Number.isFinite(x.v) && x.v > 0);
  if (!items.length) return null;
  const national = items.find((x) => x.n === "전국");
  const names = items.map((x) => x.n);
  const areas = items
    .filter((x) => x.n !== "전국" && x.n.includes(">") && !names.some((o) => o.startsWith(`${x.n}>`)))   // 맨 아래 단계(상권)만
    .map((x) => ({ n: x.n, v: Math.round(x.v * 10) / 10 }));
  return { asOf: items[0].t || "", unit: "천원/㎡", national: national ? Math.round(national.v * 10) / 10 : null, areas };
}

export async function fetchRentRef(callImpl = call) {
  for (const t of quarterCodes()) {
    const rows = [];
    for (let page = 1; page <= 5; page++) {
      const r = unpack(await callImpl("SttsApiTblData.do", { STATBL_ID: TABLE, DTACYCLE_CD: "QY", WRTTIME_IDTFR_ID: t, pIndex: page, pSize: 1000 }));
      rows.push(...r.rows);
      if (r.rows.length < 1000 || (r.total != null && rows.length >= r.total)) break;
    }
    const ref = rows.length ? buildRentRef(rows) : null;
    if (ref?.areas.length) return ref;
  }
  return null;
}

export async function syncRent(db) {
  const ref = await fetchRentRef();
  if (!ref) { console.log("임대료(R-ONE): 받은 자료가 없어 건너뜀"); return; }
  await db.doc("rentRef/smallShop").set({ ...ref, updatedAt: Date.now() });
  console.log(`임대료(R-ONE) 저장: ${ref.asOf} · 상권 ${ref.areas.length}곳 · 전국 ${ref.national}${ref.unit}`);
}

if (process.argv[1]?.endsWith("rent.js")) {
  fetchRentRef().then((ref) => {
    if (!ref) return console.log("자료가 없어요. RONE_API_KEY · 통계표 ID(RONE_RENT_TABLE)를 확인하세요.");
    console.log(`${ref.asOf} · 상권 ${ref.areas.length}곳 · 전국 ${ref.national}${ref.unit}`);
    ref.areas.filter((a) => a.n.startsWith("서울")).slice(0, 8).forEach((a) => console.log(`${a.n}\t${a.v}`));
  }).catch((e) => { console.error("실패:", e.message); process.exitCode = 1; });
}
