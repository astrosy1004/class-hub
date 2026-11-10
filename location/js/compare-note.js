// 후보 비교 해설: 담은 후보들의 점수 · 근거 수치로 짧은 문장을 만든다.
// 규칙 기반이라 서버 · LLM 호출이 없고, 같은 입력이면 늘 같은 문장이 나온다.
import { AGE_GROUPS } from "./area-data.js";
import { fmtPct, fmtAgePct } from "./metrics.js";

export const NEAR_GAP = 5; // 점수 차가 이 값 이하면 "비슷해요"
// 해설 순서 (임대료는 선택 항목이라 비교에서 뺀다)
export const NOTE_ITEMS = [
  { key: "customer", name: "고객 일치" },
  { key: "size", name: "유동인구" },
  { key: "closure", name: "폐업 위험" },
  { key: "competition", name: "경쟁 강도" },
  { key: "growth", name: "성장성" },
];
// 항목에서 앞선 후보를 고를 때 상황별 한 줄 추천
const REC = {
  customer: "목표 고객층과 잘 맞는 곳을 먼저 본다면",
  size: "오가는 사람이 많은 곳을 중시한다면",
  closure: "오래 버틴 가게가 많은 안정적인 곳을 원한다면",
  competition: "동종 가게가 적은 곳을 원한다면",
  growth: "생활인구가 늘고 있는 곳을 원한다면",
};

const ageName = (k) => AGE_GROUPS.find((g) => g.key === k)?.name || k;
// 받침 유무로 조사 고르기 (한글이 아니면 받침 없음으로 본다)
export function josa(word, withBatchim, without) {
  const c = String(word).trim().slice(-1).charCodeAt(0);
  const has = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 !== 0 : /[0-9]$/.test(word) ? "013678".includes(String(word).slice(-1)) : false;
  return `${word}${has ? withBatchim : without}`;
}
const scoreOf = (a, key) => a.score?.items?.find((x) => x.key === key)?.score ?? null;

// 항목별 근거 수치 (없으면 null → 칩을 "자료 적음"으로)
function evidence(a, key) {
  const m = a.metrics || {};
  if (m.noPop && key !== "competition" && key !== "closure") return null;
  if (key === "customer") {
    // 업종의 핵심 고객층(목표 비중 × 지역 비중이 가장 큰 층) 비중 — 리포트 전략과 같은 기준
    if (!m.age) return null;
    const t = a.industry?.target || {};
    const focus = AGE_GROUPS.map((g) => g.key).filter((k) => m.age[k] != null).sort((x, y) => m.age[y] * (t[y] || 0) - m.age[x] * (t[x] || 0))[0];
    return focus ? `${ageName(focus)} ${fmtAgePct(m.age[focus])}` : null;
  }
  if (key === "size") return m.sizeHours != null ? `시간당 ${Math.round(m.sizeHours).toLocaleString("ko-KR")}명` : null;
  if (key === "closure") return a.closure && a.closure.rate != null ? `폐업률 ${(a.closure.rate * 100).toFixed(1)}%` : null;
  if (key === "competition") return a.comp ? `동종 ${a.comp.count}${a.comp.capped ? "곳 이상" : "곳"}` : null;
  if (key === "growth") return m.growth != null ? `3개월 변화 ${fmtPct(m.growth)}` : null;
  return null;
}

// list: analyze() 결과 배열. 반환 { single } 또는 { mixed, total, rows[], recs[] }
export function compareNarrative(list) {
  if (!list || list.length < 2) return { single: true, hint: "후보를 2곳 이상 담으면 비교 해설이 나와요." };
  const mixed = new Set(list.map((a) => a.industry.key)).size > 1;
  const label = (a) => (mixed ? `${a.place.name} ${a.industry.name}` : a.place.name);
  // 같은 이름이 둘이면(같은 동 다른 업종 등) 업종까지 붙인다
  const names = list.map(label);
  const nameOf = (a) => (names.filter((n) => n === label(a)).length > 1 ? `${a.place.name} ${a.industry.name}` : label(a));

  const rows = NOTE_ITEMS.map((it) => {
    const vals = list.map((a) => ({ a, s: scoreOf(a, it.key), ev: evidence(a, it.key) }));
    const chips = vals.map((v) => ({ who: nameOf(v.a), text: v.ev ?? "자료 적음", score: v.s, low: v.s == null }));
    const ok = vals.filter((v) => v.s != null).sort((x, y) => y.s - x.s);
    if (ok.length < 2) return { key: it.key, name: it.name, kind: "few", text: "자료가 적은 후보가 있어 비교하기 어려워요.", chips };
    const gap = ok[0].s - ok[1].s;
    if (mixed) return { key: it.key, name: it.name, kind: "mixed", text: "업종 기준이 달라 수치만 나란히 보여드려요.", chips };
    if (gap <= NEAR_GAP) return { key: it.key, name: it.name, kind: "near", gap, text: `비슷해요 (차이 ${gap}점).`, chips };
    return { key: it.key, name: it.name, kind: "lead", gap, leader: nameOf(ok[0].a), text: `${josa(nameOf(ok[0].a), "이", "가")} ${gap}점 앞서요 (${ok[0].s}점 vs ${ok[1].s}점).`, chips };
  });

  // 한 줄 총평
  let total;
  if (mixed) total = "업종이 달라 점수를 직접 비교하기 어려워요. 같은 업종끼리 담으면 더 정확하게 비교할 수 있어요.";
  else {
    const rank = list.filter((a) => a.score?.total != null).sort((x, y) => y.score.total - x.score.total);
    if (rank.length < 2) total = "종합 점수가 없는 후보가 있어 항목별로만 비교해요.";
    else {
      const [t1, t2] = rank;
      const gap = t1.score.total - t2.score.total;
      const scores = rank.map((a) => `${nameOf(a)} ${a.score.total}점`).join(" · ");
      const leads = rows.filter((r) => r.kind === "lead" && r.leader === nameOf(t1)).map((r) => r.name);
      const others = rows.filter((r) => r.kind === "lead" && r.leader !== nameOf(t1));
      // 앞선 후보별로 묶기: "고객 일치 · 성장성은 합정동이, 유동인구는 성수동이"
      const by = (rs) => [...new Set(rs.map((r) => r.leader))].map((who) => {
        const ns = rs.filter((r) => r.leader === who).map((r) => r.name);
        return `${ns.slice(0, -1).map((n) => `${n} · `).join("")}${josa(ns.at(-1), "은", "는")} ${josa(who, "이", "가")}`;
      }).join(", ");
      if (gap <= NEAR_GAP) {
        const all = rows.filter((r) => r.kind === "lead");
        total = `${josa(nameOf(t1), "과", "와")} ${nameOf(t2)}의 종합 점수가 비슷해요 (${scores}).`;
        total += all.length ? ` 항목별로 보면 ${by(all)} 나아요.` : " 항목별 차이를 보고 판단해 보세요.";
      } else {
        total = `종합 점수는 ${josa(nameOf(t1), "이", "가")} ${list.length > 2 ? "가장 높아요" : `${gap}점 높아요`} (${scores}).`;
        if (leads.length) total += ` 특히 ${leads.join(" · ")}에서 앞서요.`;
        if (others.length) total += ` 다만 ${by(others)} 나아요.`;
      }
    }
  }

  // 상황별 한 줄 추천: 점수 차가 큰(5점 초과) 항목만, 최대 3줄
  const recs = [];
  if (!mixed) {
    // 서로 다른 후보가 앞선 항목을 먼저 (한 후보만 세 번 나오지 않게), 남는 자리는 순서대로
    const lead = rows.filter((r) => r.kind === "lead");
    const seen = new Set(), pick = [];
    for (const r of lead) if (!seen.has(r.leader)) { seen.add(r.leader); pick.push(r); }
    for (const r of lead) if (!pick.includes(r)) pick.push(r);
    for (const r of pick.slice(0, 3).sort((x, y) => rows.indexOf(x) - rows.indexOf(y))) recs.push(`${REC[r.key]} ${josa(r.leader, "을", "를")} 검토해 보세요.`);
    if (!recs.length) recs.push("항목별 차이가 크지 않아요. 임대료 · 접근성 · 가게 자리는 현장에서 비교해 보세요.");
  }
  return { single: false, mixed, total, rows, recs };
}
