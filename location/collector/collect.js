// 생활인구 일별 수집기 (GitHub Actions 에서 매일 실행). 서버(Cloud Functions) 없이 Firestore 에 동별 요약을 쌓는다.
//
// 하는 일
//   1. 서울 API 로 최신 자료가 있는 날짜를 찾고, 아직 수집하지 않은 날만 (일자 × 24시각) = 24회씩 호출해 전 행정동을 받는다.
//   2. 동별 "일별 요약"을 livingPopDays/{행정동8} 문서(날짜 → 요약 맵)에 합친다. (읽기 427건 · 쓰기 427건 안팎, 과거 채우기도 한 번에)
//   3. 동별 화면용 요약(buildPop)을 livingPop/{행정동8} 에 쓴다. 브라우저는 이 문서 1건만 읽는다.
//   4. 수집한 날짜는 livingPopMeta/state 에 기록해 다음 실행에서 건너뛴다.
//   5. 모든 동의 지표 분포(점수의 백분위 눈금)를 livingPopBaseline/{프로필} 에 쓴다. 브라우저 점수 엔진이 읽는다.
//
// 사용 (환경변수: SEOUL_API_KEY, FIREBASE_SERVICE_ACCOUNT = 서비스 계정 JSON 전체 문자열)
//   node collector/collect.js              최신 2일치
//   node collector/collect.js --days 60    최근 60일 (과거 채우기, API 가 주는 범위 안에서)
//   node collector/collect.js --days 0     API 호출 없이, 저장된 일별 자료로 요약 · 기준 분포만 다시 계산
//   node collector/collect.js --dry        Firestore 에 쓰지 않고 요약만 출력 (키 확인용)
import { fetchHourAll, pool, env } from "./seoul.js";
import { buildPop, summarizeDay } from "./aggregate.js";
import { buildBaselines } from "./baseline.js";

const WRITE_CHUNK = 15; // 한 번에 쓰는 행정동 수 (동 하나가 날짜 맵 + 요약 2문서, 일수가 많으면 문서가 커서 묶음 용량 제한을 넘지 않게 작게)
const MAX_KEEP_DAYS = 400; // 동 문서에 보관하는 최대 일수 (문서 1MB 제한 안)
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? (process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true) : fallback;
};
const ymd = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

async function latestDate() {
  for (let back = 1; back <= 12; back++) {
    const d = new Date(Date.now() - back * 86400000);
    if (await fetchHourAll(ymd(d), "12")) return d;
  }
  return null;
}

// 하루치: 24시각 호출 → 동별 일별 요약 Map. 24시각이 다 없으면 null (미완성 날은 저장하지 않음)
async function collectDay(date) {
  const hourMaps = {};
  await pool(Array.from({ length: 24 }, (_, h) => async () => {
    const hh = String(h).padStart(2, "0");
    const m = await fetchHourAll(date, hh);
    if (m) hourMaps[hh] = m;
  }), 6);
  if (Object.keys(hourMaps).length < 24) {
    console.log(`  ${date}: ${Object.keys(hourMaps).length}/24 시각만 있어 건너뜀`);
    return null;
  }
  const out = summarizeDay(date, hourMaps);
  for (const d of out.values()) delete d.n;
  return out;
}

// 순수 함수: 기존 날짜 맵에 새 날짜들을 합치고 오래된 날을 지운다 (check 에서 시험)
export function mergeDays(existing, added, keep = MAX_KEEP_DAYS) {
  const merged = { ...existing, ...added };
  const dates = Object.keys(merged).sort();
  for (const d of dates.slice(0, Math.max(0, dates.length - keep))) delete merged[d];
  return merged;
}

async function main() {
  const dry = arg("--dry", false);
  const daysArg = Number(arg("--days", 2));
  const rebuild = daysArg === 0; // API 호출 없이 저장된 자료로 요약 · 기준 분포만 다시 계산
  const days = rebuild ? 0 : daysArg || 2;
  if (!rebuild && !env().key) throw new Error("SEOUL_API_KEY 가 없습니다");

  let db = null, state = { dates: [] };
  if (!dry) {
    const { initializeApp, cert } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) throw new Error("FIREBASE_SERVICE_ACCOUNT 가 없습니다");
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
    db = getFirestore();
    const snap = await db.doc("livingPopMeta/state").get();
    if (snap.exists) state = snap.data();
  }

  // 임대료 참고 자료(분기 갱신): 키가 있을 때만, 실패해도 생활인구 수집은 계속한다
  if (db && process.env.RONE_API_KEY) await (await import("./rent.js")).syncRent(db).catch((e) => console.log("임대료(R-ONE) 건너뜀:", e.message));

  if (rebuild) {
    if (!db) throw new Error("--days 0 은 Firestore 연결이 필요합니다 (--dry 와 함께 쓸 수 없음)");
    const snap = await db.collection("livingPopDays").get();
    const pops = snap.docs.map((d) => buildPop(d.id, Object.entries(d.data().days || {}).map(([date, x]) => ({ date, ...x }))));
    const asOf = pops.map((p) => p?.asOf).filter(Boolean).sort().pop();
    await writeBaseline(db, pops, asOf);
    return;
  }

  const last = await latestDate();
  if (!last) throw new Error("최근 12일 안에 서울 생활인구 자료를 찾지 못했습니다");
  const wanted = Array.from({ length: days }, (_, i) => ymd(new Date(last.getTime() - i * 86400000)));
  const todo = wanted.filter((d) => !state.dates.includes(d));
  console.log(`최신 자료일 ${ymd(last)} · 요청 ${days}일 · 수집할 날 ${todo.length}개: ${todo.join(", ") || "(없음)"}`);
  if (!todo.length) return;

  // dong → { 날짜: 요약 }
  const added = new Map();
  const doneDates = [];
  for (const date of todo) {
    const t0 = Date.now();
    const day = await collectDay(date);
    if (!day) continue;
    for (const [dong, d] of day) {
      if (!added.has(dong)) added.set(dong, {});
      const { date: _d, ...rest } = d;
      added.get(dong)[date] = rest;
    }
    doneDates.push(date);
    console.log(`  ${date}: 행정동 ${day.size}곳 (${Math.round((Date.now() - t0) / 1000)}초)`);
  }
  if (!doneDates.length) { console.log("저장할 날이 없습니다"); return; }

  if (dry) {
    const [dong, map] = [...added.entries()].find(([k]) => k === "11440710") || [...added.entries()][0];
    const pop = buildPop(dong, Object.entries(map).map(([date, d]) => ({ date, ...d })));
    console.log("\n[dry] 예시 요약:", dong, JSON.stringify({ asOf: pop.asOf, days: pop.days, weekday12: pop.weekday[12], weekend12: pop.weekend[12], age: pop.age, note: pop.note }));
    return;
  }

  // Firestore: 동별로 기존 날짜 맵을 읽어 합치고, 요약과 함께 저장
  const dongs = [...added.keys()];
  const refs = dongs.map((d) => db.doc(`livingPopDays/${d}`));
  const existing = [];
  for (let i = 0; i < refs.length; i += 300) existing.push(...(await db.getAll(...refs.slice(i, i + 300))));
  let batch = db.batch(), n = 0, ops = 0;
  const commits = [];
  const pops = [];
  dongs.forEach((dong, i) => {
    const old = existing[i].exists ? existing[i].data().days || {} : {};
    const merged = mergeDays(old, added.get(dong));
    const list = Object.entries(merged).map(([date, d]) => ({ date, ...d }));
    const pop = buildPop(dong, list);
    pops.push(pop);
    batch.set(refs[i], { days: merged, updatedAt: Date.now() });
    batch.set(db.doc(`livingPop/${dong}`), { ...pop, updatedAt: Date.now() });
    ops += 2;
    if (++n % WRITE_CHUNK === 0) { commits.push(batch.commit()); batch = db.batch(); }
  });
  commits.push(batch.commit());
  await Promise.all(commits);
  const all = [...new Set([...state.dates, ...doneDates])].sort();
  await db.doc("livingPopMeta/state").set({ dates: all, updatedAt: Date.now() });
  console.log(`저장 완료: 행정동 ${dongs.length}곳 · 문서 ${ops}건 · 누적 ${all.length}일`);
  await writeBaseline(db, pops, pops.map((p) => p?.asOf).filter(Boolean).sort().pop());
}

// 모든 동의 지표 분포 → livingPopBaseline/{프로필 키}  (프로필마다 문서 1개: 한 문서에 배열을 모두 넣으면 Firestore 색인 항목 한도를 넘는다)
async function writeBaseline(db, pops, asOf) {
  const base = buildBaselines(pops.filter(Boolean), asOf);
  const keys = Object.keys(base.industries);
  let batch = db.batch(), n = 0;
  for (const key of keys) {
    batch.set(db.doc(`livingPopBaseline/${key}`), { level: base.level, n: base.n, asOf: base.asOf, updatedAt: base.updatedAt, ...base.industries[key] });
    if (++n % 10 === 0) { await batch.commit(); batch = db.batch(); }
  }
  batch.delete(db.doc("livingPopBaseline/all")); // 예전 방식(문서 1개)의 잔재
  await batch.commit();
  const c = base.industries.cafe;
  console.log(`기준 분포 저장: 행정동 ${base.n}곳 · 프로필 ${keys.length}개 (카페 고객일치 ${c.customer[0]}~${c.customer.at(-1)}, 규모 ${c.size[0]}~${c.size.at(-1)}, 성장률 ${c.growth[0]}~${c.growth.at(-1)})`);
}

// 직접 실행했을 때만 main (다른 파일에서 import 해도 실행되지 않게)
if (process.argv[1]?.endsWith("collect.js")) {
  main().catch((e) => { console.error("수집 실패:", e.message); process.exit(1); });
}
