// 서울시 상권분석서비스(점포-행정동) → Firestore closureRef/{행정동8자리} (분기 갱신). "폐업 위험" 점수의 자료.
// 행정동 × 서비스 업종 × 분기마다 점포 수 · 유사 업종 점포 수 · 개업 · 폐업 수가 있다. 최근 4분기를 합쳐
// 앱 업종별 폐업률을 내고, 같은 업종끼리 서울 행정동 백분위를 미리 계산해 둔다 (앱은 동 문서 1건만 읽는다).
//
//   node collector/closure.js                  API 로 받아 요약만 출력 (Firestore 에 쓰지 않음, SEOUL_API_KEY 필요)
//   node collector/closure.js --csv a.csv ...  열린데이터광장에서 받은 분기 파일(CSV)로 같은 계산을 해 본다 (키 없이 시험)
// collect.js 가 매일 한 번 확인하고, 새 분기가 나왔을 때만 다시 저장한다.
import { readFileSync } from "node:fs";
import { CLOSURE_CODES } from "../js/area-data.js";
import { CLOSURE_RULES } from "../js/score-rules.js";

const BASE = "http://openapi.seoul.go.kr:8088";
const SERVICE = "VwsmAdstrdStorW";
const key = () => process.env.SEOUL_API_KEY || "";

// 분기 코드 YYYYQ (예: 20262 = 2026년 2분기). 최근부터 거꾸로
export function quarterCodes(now = new Date(), n = 8) {
  let y = now.getFullYear(), q = Math.floor(now.getMonth() / 3) + 1;
  const out = [];
  for (let i = 0; i < n; i++) { out.push(`${y}${q}`); if (--q === 0) { q = 4; y--; } }
  return out;
}

const num = (v) => Number(v) || 0;
// 한 행 → 계산에 쓰는 칸만 (API 와 CSV 를 같은 모양으로)
const row = (q, dong, code, stores, similar, opened, closed, frc) => ({ q: String(q), dong: String(dong).slice(0, 8), code, stores: num(stores), similar: num(similar), opened: num(opened), closed: num(closed), frc: num(frc) });

async function fetchQuarter(q) {
  const rows = [];
  for (let start = 1; ; start += 1000) {
    const res = await fetch(`${BASE}/${key()}/json/${SERVICE}/${start}/${start + 999}/${q}`);
    const j = await res.json();
    const body = j[SERVICE];
    if (!body?.row?.length) break;
    body.row.forEach((x) => rows.push(row(x.STDR_YYQU_CD, x.ADSTRD_CD, x.SVC_INDUTY_CD, x.STOR_CO, x.SIMILR_INDUTY_STOR_CO, x.OPBIZ_STOR_CO, x.CLSBIZ_STOR_CO, x.FRC_STOR_CO)));
    if (start + 999 >= body.list_total_count) break;
  }
  return rows;
}

// 자료가 있는 최근 4개 분기를 받는다 (분기 자료는 1~2분기 늦게 나온다)
export async function fetchLatest(nQuarters = 4) {
  const out = [];
  for (const q of quarterCodes()) {
    const r = await fetch(`${BASE}/${key()}/json/${SERVICE}/1/1/${q}`).then((x) => x.json());
    if (!r[SERVICE]?.row?.length) { if (out.length) break; continue; }
    out.push(q);
    if (out.length === nQuarters) break;
  }
  const rows = [];
  for (const q of out) rows.push(...(await fetchQuarter(q)));
  return { quarters: out.sort(), rows };
}

// 열린데이터광장 CSV(cp949): 기준_년분기_코드 · 행정동_코드 · 행정동_코드_명 · 서비스_업종_코드 · 서비스_업종_코드_명 · 점포_수 · 유사_업종_점포_수 · 개업_율 · 개업_점포_수 · 폐업_률 · 폐업_점포_수 · 프랜차이즈_점포_수
export function rowsFromCsv(path) {
  const text = new TextDecoder("euc-kr").decode(readFileSync(path));
  return text.split(/\r?\n/).slice(1).filter(Boolean).map((line) => {
    const c = line.split(",").map((x) => x.replace(/^"|"$/g, ""));
    return row(c[0], c[1], c[3], c[5], c[6], c[8], c[10], c[11]);
  });
}

const pctRank = (sorted, x) => {
  let below = 0, equal = 0;
  for (const v of sorted) { if (v < x) below++; else if (v === x) equal++; }
  return Math.round(((below + equal / 2) / sorted.length) * 100);
};

// 행 목록 → { asOf, quarters, docs: { 동8: { 업종키: { rate, pct, stores, closed, opened, base, frc } } } }
export function buildClosureRef(rows, quarters) {
  const qs = quarters || [...new Set(rows.map((r) => r.q))].sort().slice(-4);
  const last = qs[qs.length - 1];
  const codeToKeys = new Map();
  for (const [k, codes] of Object.entries(CLOSURE_CODES)) codes.forEach((c) => codeToKeys.set(c, [...(codeToKeys.get(c) || []), k]));
  const acc = new Map(); // "동|업종키" → 합계
  for (const r of rows) {
    if (!qs.includes(r.q)) continue;
    for (const k of codeToKeys.get(r.code) || []) {
      const id = `${r.dong}|${k}`;
      const a = acc.get(id) || { closed: 0, opened: 0, base: 0, stores: 0, frc: 0 };
      a.closed += r.closed; a.opened += r.opened; a.base += r.similar || r.stores;
      if (r.q === last) { a.stores += r.stores; a.frc += r.frc; }
      acc.set(id, a);
    }
  }
  // 업종별로 서울 동 분포를 만들고 백분위를 붙인다 (점포가 너무 적은 동은 분포 · 점수에서 제외)
  const byKey = new Map();
  for (const [id, a] of acc) {
    a.rate = a.base ? a.closed / a.base : 0;
    if (a.base >= CLOSURE_RULES.minBase) { const k = id.split("|")[1]; byKey.set(k, [...(byKey.get(k) || []), a.rate]); }
  }
  byKey.forEach((v) => v.sort((x, y) => x - y));
  const docs = {};
  for (const [id, a] of acc) {
    const [dong, k] = id.split("|");
    const dist = byKey.get(k) || [];
    const ok = a.base >= CLOSURE_RULES.minBase && dist.length >= 30;
    (docs[dong] ||= {})[k] = {
      rate: Math.round(a.rate * 10000) / 10000, pct: ok ? pctRank(dist, a.rate) : null, n: dist.length,
      median: dist.length ? Math.round(dist[Math.floor(dist.length / 2)] * 10000) / 10000 : null,
      stores: a.stores, closed: a.closed, opened: a.opened, base: a.base, frc: a.frc,
    };
  }
  return { asOf: last, quarters: qs, docs };
}

// collect.js 에서 호출: 새 분기가 나왔을 때만 동 문서를 다시 쓴다
export async function syncClosure(db) {
  const stateRef = db.doc("livingPopMeta/closure");
  const known = (await stateRef.get()).data()?.asOf;
  const { quarters, rows } = await fetchLatest();
  if (!quarters.length) { console.log("개폐업: 받은 분기가 없어 건너뜀"); return; }
  const ref = buildClosureRef(rows, quarters);
  if (known === ref.asOf) { console.log(`개폐업: ${ref.asOf} 그대로`); return; }
  const ids = Object.keys(ref.docs);
  for (let i = 0; i < ids.length; i += 400) {
    const batch = db.batch();
    ids.slice(i, i + 400).forEach((d) => batch.set(db.doc(`closureRef/${d}`), { asOf: ref.asOf, quarters: ref.quarters, ind: ref.docs[d], updatedAt: Date.now() }));
    await batch.commit();
  }
  await stateRef.set({ asOf: ref.asOf, quarters: ref.quarters, dongs: ids.length, updatedAt: Date.now() });
  console.log(`개폐업 저장: ${ref.quarters.join(" · ")} · 행정동 ${ids.length}곳`);
}

if (process.argv[1]?.endsWith("closure.js")) {
  const csv = process.argv.indexOf("--csv");
  const run = csv > 0
    ? Promise.resolve(process.argv.slice(csv + 1).flatMap(rowsFromCsv)).then((rows) => buildClosureRef(rows))
    : fetchLatest().then(({ quarters, rows }) => buildClosureRef(rows, quarters));
  run.then((ref) => {
    console.log(`분기 ${ref.quarters.join(" · ")} · 행정동 ${Object.keys(ref.docs).length}곳`);
    const show = { 11440710: "연남동", 11200650: "성수1가1동", 11200690: "성수2가3동" };
    for (const [d, name] of Object.entries(show)) {
      const c = ref.docs[d]?.cafe;
      if (c) console.log(`${name} 카페: 폐업률 ${(c.rate * 100).toFixed(2)}% (서울 ${c.n}개 동 중앙 ${(c.median * 100).toFixed(2)}%) · 백분위 ${c.pct} → 점수 ${c.pct == null ? "-" : 100 - c.pct} · 점포 ${c.stores} · 프랜차이즈 ${c.frc}`);
    }
  }).catch((e) => { console.error("실패:", e.message); process.exitCode = 1; });
}
