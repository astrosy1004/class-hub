// 점수 엔진: 원국 분석(신강·신약, 조후, 용신·희신·기신) → 기간(대운·세운·월운·일진)별 영역 점수 0~100.
// 규칙·문구는 score-rules.js, 사주 계산은 manse.js가 맡는다. 같은 명식이면 항상 같은 점수가 나온다.

import { STEMS, BRANCHES, ELEMENTS } from "./saju-data.js";
import { calculateSaju, tenGod, pillarText, pillarKo } from "./manse.js";
import {
  ROLE_VALUE, ROLE_NAME, SCORE, HIDDEN_WEIGHT, STRENGTH_WEIGHT, JOHU, BRANCH_HARMONY, BRANCH_CLASH, STEM_COMBINE, PEACH,
  DOMAINS, BANDS, GOD_THEME, GOD_GROUPS, JOBS, CERTIFICATES, ELEMENT_DESC, WORKPLACES, ORGANS, LIFE_EVENTS,
  TOPICS, YEOKMA, STORAGE_BRANCHES, BRANCH_WONJIN, SAMHAP, MAJORS,
} from "./score-rules.js";

const clamp = (v) => Math.round(Math.min(SCORE.max, Math.max(SCORE.min, v)));
const pairIn = (list, a, b) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

export const elementLabel = (e) => `${ELEMENTS[e].ko}(${ELEMENTS[e].han})`;

// 받침에 맞는 조사 붙이기: josa("화(火)", "이/가") → "화(火)가". 괄호 안 한자는 무시한다
export function josa(word, pair) {
  const [withBatchim, without] = pair.split("/");
  const plain = word.replace(/\(.*?\)/g, "").trim();
  const code = plain.charCodeAt(plain.length - 1) - 0xac00;
  const hasBatchim = code >= 0 && code <= 11171 && code % 28 !== 0;
  return word + (hasBatchim ? withBatchim : without);
}

export function bandOf(score) {
  return BANDS.find((b) => score >= b.min);
}

// 지지의 지장간과 비중 [{ stem, weight }]
function hiddenWeighted(branch) {
  const hidden = BRANCHES[branch].hidden;
  const w = HIDDEN_WEIGHT[hidden.length];
  return hidden.map((stem, i) => ({ stem, weight: w[i] }));
}

/** 원국 분석 */
export function analyzeNatal(saju) {
  const { pillars } = saju;
  const dm = pillars.day.stem;
  const me = STEMS[dm].element;
  const rel = { self: me, output: (me + 1) % 5, wealth: (me + 2) % 5, power: (me + 3) % 5, resource: (me + 4) % 5 };

  // 1) 겉으로 드러난 오행 개수 (천간 + 지지 본기 오행) · 십신 개수(일간 제외, 지지는 정기)
  const elementCount = [0, 0, 0, 0, 0];
  const godCount = {};
  const slots = [
    ["year", pillars.year], ["month", pillars.month], ["day", pillars.day], ["hour", pillars.hour],
  ].filter(([, p]) => p);
  for (const [slot, p] of slots) {
    elementCount[STEMS[p.stem].element]++;
    elementCount[BRANCHES[p.branch].element]++;
    if (slot !== "day") godCount[p.stemGod] = (godCount[p.stemGod] || 0) + 1;
    godCount[p.branchGod] = (godCount[p.branchGod] || 0) + 1;
  }

  // 2) 신강·신약: 자리별 무게 × (지지는 지장간 비중)로 나를 돕는 기운(비겁·인성) 비율
  let support = 0;
  let total = 0;
  const strengthRows = []; // 근거 표: 자리 · 글자 · 오행 · 무게 · 나를 돕는지
  const SLOT_KO = { year: "연", month: "월", day: "일", hour: "시" };
  const add = (element, weight, pos, char) => {
    total += weight;
    const helps = element === rel.self || element === rel.resource;
    if (helps) support += weight;
    strengthRows.push({ pos, char, element, weight, helps });
  };
  for (const [slot, p] of slots) {
    if (slot !== "day") add(STEMS[p.stem].element, STRENGTH_WEIGHT[`${slot}Stem`], `${SLOT_KO[slot]}간`, STEMS[p.stem].han);
    for (const h of hiddenWeighted(p.branch)) {
      add(STEMS[h.stem].element, STRENGTH_WEIGHT[`${slot}Branch`] * h.weight, `${SLOT_KO[slot]}지 ${BRANCHES[p.branch].han} 속 ${STEMS[h.stem].han}`, STEMS[h.stem].han);
    }
  }
  const strengthRatio = support / total;
  const strong = strengthRatio >= 0.5;

  // 3) 조후 (계절)
  const monthBranch = pillars.month.branch;
  const johu = Object.values(JOHU).find((j) => j.branches.includes(monthBranch)) || null;

  // 4) 용신 · 희신 · 기신
  const weighted = [0, 0, 0, 0, 0];
  for (const [slot, p] of slots) {
    if (slot !== "day") weighted[STEMS[p.stem].element] += 1;
    for (const h of hiddenWeighted(p.branch)) weighted[STEMS[h.stem].element] += h.weight;
  }
  let yong;
  if (johu) yong = johu.element;
  else if (strong) yong = [rel.output, rel.wealth, rel.power].sort((a, b) => weighted[a] - weighted[b])[0];
  else yong = weighted[rel.resource] >= 3 ? rel.self : rel.resource;
  const hee = (yong + 4) % 5; // 용신을 생해 주는 오행
  const giSet = new Set(strong ? [rel.resource, rel.self] : [rel.wealth, rel.power]);
  giSet.add((yong + 3) % 5); // 용신을 극하는 오행
  giSet.delete(yong);
  giSet.delete(hee);
  const roles = ELEMENTS.map((_, e) => (e === yong ? "yong" : e === hee ? "hee" : giSet.has(e) ? "gi" : "neutral"));

  // 용신 · 희신 · 기신을 왜 그렇게 골랐는지 (해석 기준 화면 · 근거 상자)
  const L = (e) => elementLabel(e);
  const groupKo = { self: "비겁", output: "식상", wealth: "재성", power: "관성", resource: "인성" };
  const groupOfEl = (e) => groupKo[Object.keys(rel).find((k) => rel[k] === e)];
  const pct = Math.round(strengthRatio * 100);
  const yongWhy = johu
    ? `${BRANCHES[monthBranch].han}(${BRANCHES[monthBranch].ko})월, ${johu.label}에 태어나 ${josa(johu.need, "이/가")} 가장 먼저 필요해요 → 조후 용신 ${L(yong)}.`
    : strong
      ? `나를 돕는 기운이 ${pct}%로 넉넉한 신강이라, 기운을 빼 주는 식상 · 재성 · 관성 중 원국에 가장 적은 ${josa(`${L(yong)} · ${groupOfEl(yong)}`, "을/를")} 용신으로 골랐어요.`
      : weighted[rel.resource] >= 3
        ? `나를 돕는 기운이 ${pct}%로 약한 신약인데 인성이 이미 많아서, 같은 오행인 비겁 ${josa(L(yong), "을/를")} 용신으로 골랐어요.`
        : `나를 돕는 기운이 ${pct}%로 약한 신약이라, 나를 생해 주는 인성 ${josa(L(yong), "을/를")} 용신으로 골랐어요.`;
  const heeWhy = `용신 ${josa(L(yong), "을/를")} 생해 주는(키워 주는) 오행 → 희신 ${L(hee)}.`;
  const giBase = strong ? [rel.resource, rel.self] : [rel.wealth, rel.power];
  const giDropped = giBase.filter((e) => e === yong || e === hee);
  const giWhy = `${strong ? "신강이라 나를 더 세게 만드는 인성 · 비겁" : "신약이라 나를 더 약하게 만드는 재성 · 관성"}과, 용신 ${josa(L(yong), "을/를")} 극하는 ${L((yong + 3) % 5)} → 기신 ${[...giSet].map(L).join(" · ")}.${giDropped.length ? ` (${giDropped.map((e) => `${L(e)}은 ${e === yong ? "용신" : "희신"}이라 기신에서 뺐어요)`).join(" ")}` : ""}`;
  const basis = { strengthRows, support, total, pct, weighted, yongWhy, heeWhy, giWhy, groupOfEl };

  // 5) 쉬운 말 요약
  const dmName = `${STEMS[dm].ko}${ELEMENTS[me].ko}(${STEMS[dm].han}${ELEMENTS[me].han})`;
  const opener = johu
    ? `${johu.label === "겨울" ? "차가운 겨울" : "뜨거운 여름"}에 태어난 ${dmName} 사주라`
    : `${strong ? "기운이 넉넉한" : "기운이 여린"} ${dmName} 사주라`;
  const summary = `${opener}, ${josa(ELEMENT_DESC[yong], "과/와")} ${josa(ELEMENT_DESC[hee], "이/가")} 오는 시기에 크게 피어나요.`;

  return {
    dm, rel, elementCount, godCount, strong, strengthRatio, johu, yong, hee,
    gi: [...giSet], roles, summary, dmName, basis,
    dayBranch: pillars.day.branch,
    hourBranch: pillars.hour ? pillars.hour.branch : null,
    gender: saju.input.gender,
  };
}

// 한 기둥(대운·세운·월운·일진)의 기본값 -1~1과 주된 근거
function pillarValue(natal, p) {
  const stemEl = STEMS[p.stem].element;
  const stemV = ROLE_VALUE[natal.roles[stemEl]];
  const branchV = hiddenWeighted(p.branch).reduce((acc, h) => acc + h.weight * ROLE_VALUE[natal.roles[STEMS[h.stem].element]], 0);
  return { value: SCORE.stemWeight * stemV + SCORE.branchWeight * branchV, stemEl, branchEl: BRANCHES[p.branch].element };
}

function godWeight(domain, gender, god) {
  const plus = domain[`plus${gender}`] || domain.plus || {};
  const minus = domain[`minus${gender}`] || domain.minus || {};
  return (plus[god] || 0) - (minus[god] || 0);
}

const fmt = (n) => (Math.abs(n) < 0.05 ? "±0" : `${n > 0 ? "+" : "−"}${Math.abs(n).toFixed(1)}`);
const charOf = (stem) => `${STEMS[stem].han}(${STEMS[stem].ko}${ELEMENTS[STEMS[stem].element].ko})`;
const HIDDEN_POS = { 2: ["여기", "정기"], 3: ["여기", "중기", "정기"] };

/**
 * 한 기둥 × 한 영역 점수 { score, reason, factors }
 * factors: 명리 근거 [{ what: 글자 · 요소, why: 해석, pts: 점수 }] — 더하면 점수가 된다 (마지막에 8~97로 맞춤)
 */
export function scorePillar(natal, p, domainId = "total") {
  // 영역 id 또는 상세 문의 주제(TOPICS) id, 또는 규칙 객체 그대로
  const domain = typeof domainId === "object" ? domainId : DOMAINS.find((d) => d.id === domainId) || TOPICS.find((t) => t.id === domainId);
  const stemEl = STEMS[p.stem].element;
  const branchEl = BRANCHES[p.branch].element;
  const bHan = BRANCHES[p.branch].han;
  const factors = [{ what: "기본 점수", why: "용신 · 기신이 없는 보통의 시기를 52점에서 시작", pts: SCORE.center }];
  let score = SCORE.center;
  const add = (what, why, pts) => {
    score += pts;
    factors.push({ what, why, pts });
  };
  const reasons = [];

  // 1) 용신 · 기신: 천간 40% + 지지(지장간 비중) 60%
  const role = natal.roles[stemEl];
  add(`천간 ${charOf(p.stem)}`, `${ROLE_NAME[role]} ${elementLabel(stemEl)} (역할값 ${ROLE_VALUE[role]}) × 천간 비중 40%`, SCORE.spread * SCORE.stemWeight * ROLE_VALUE[role]);
  const hw = hiddenWeighted(p.branch);
  hw.forEach((h, i) => {
    const e = STEMS[h.stem].element;
    add(
      `지지 ${bHan} 속 ${charOf(h.stem)}`,
      `${HIDDEN_POS[hw.length][i]} ${Math.round(h.weight * 100)}% · ${ROLE_NAME[natal.roles[e]]} ${elementLabel(e)} (역할값 ${ROLE_VALUE[natal.roles[e]]}) × 지지 비중 60%`,
      SCORE.spread * SCORE.branchWeight * h.weight * ROLE_VALUE[natal.roles[e]],
    );
  });

  // 2) 영역 가중치: 이 영역에서 중요한 십신이면 가점, 방해하는 십신이면 감점
  const stemGod = tenGod(natal.dm, p.stem);
  const branchGod = tenGod(natal.dm, BRANCHES[p.branch].hidden.at(-1));
  const name = domain.name || "종합";
  let dw = 0;
  const gw = godWeight(domain, natal.gender, stemGod);
  if (gw) {
    dw += SCORE.stemWeight * gw;
    add(`천간 ${STEMS[p.stem].han} = ${stemGod}`, `${name}에서 ${josa(`${stemGod}(${GOD_THEME[stemGod]})`, "은/는")} ${gw > 0 ? "돕는" : "방해하는"} 십신 (가중치 ${gw}) × 40%`, SCORE.domainSpread * SCORE.stemWeight * gw);
  }
  for (const h of hw) {
    const god = tenGod(natal.dm, h.stem);
    const w = godWeight(domain, natal.gender, god);
    if (!w) continue;
    dw += SCORE.branchWeight * h.weight * w;
    add(`지지 ${bHan} 속 ${STEMS[h.stem].han} = ${god}`, `${name}에서 ${josa(`${god}(${GOD_THEME[god]})`, "은/는")} ${w > 0 ? "돕는" : "방해하는"} 십신 (가중치 ${w}) × 60% × ${Math.round(h.weight * 100)}%`, SCORE.domainSpread * SCORE.branchWeight * h.weight * w);
  }
  if (Math.abs(dw) >= 0.3) reasons.push(`${GOD_THEME[stemGod]} ${dw > 0 ? "기운" : "주의"}`);

  // 3) 관계 보정: 일지(배우자궁) · 시지(자녀궁)와 합 · 충
  const dHan = BRANCHES[natal.dayBranch].han;
  if (pairIn(BRANCH_HARMONY, p.branch, natal.dayBranch) && domain.dayHarmony) {
    add(`${bHan} ↔ 일지 ${dHan}`, "육합: 나 · 배우자 자리(일지)와 손을 잡아 일이 순하게 풀림", domain.dayHarmony);
    reasons.push("일지와 합");
  }
  if (pairIn(BRANCH_CLASH, p.branch, natal.dayBranch) && domain.dayClash) {
    add(`${bHan} ↔ 일지 ${dHan}`, domain.dayClash > 0 ? "충: 일지가 흔들려 변동 · 이동이 생김 (이사에는 가점)" : "충: 나 · 배우자 자리(일지)와 부딪혀 흔들림", domain.dayClash);
    reasons.push("일지와 충");
  }
  if (natal.hourBranch != null) {
    const hHan = BRANCHES[natal.hourBranch].han;
    if (pairIn(BRANCH_HARMONY, p.branch, natal.hourBranch) && domain.hourHarmony) {
      add(`${bHan} ↔ 시지 ${hHan}`, "육합: 자녀 자리(시지)와 잘 어울림", domain.hourHarmony);
      reasons.push("시지(자녀궁)와 합");
    }
    if (pairIn(BRANCH_CLASH, p.branch, natal.hourBranch) && domain.hourClash) {
      add(`${bHan} ↔ 시지 ${hHan}`, "충: 자녀 자리(시지)와 부딪힘", domain.hourClash);
      reasons.push("시지(자녀궁)와 충");
    }
  }
  // 천간합으로 용신 · 희신이 생기면 가점 (예: 무계합화 → 火)
  const combine = STEM_COMBINE.find(([a, b]) => (a === p.stem && b === natal.dm) || (b === p.stem && a === natal.dm));
  if (combine && ["yong", "hee"].includes(natal.roles[combine[2]])) {
    add(`${STEMS[p.stem].han} + 일간 ${STEMS[natal.dm].han}`, `천간합: 두 글자가 합해 ${ROLE_NAME[natal.roles[combine[2]]]} ${josa(elementLabel(combine[2]), "이/가")} 생김`, SCORE.stemCombineBonus);
    reasons.push(`${STEMS[p.stem].ko}${STEMS[natal.dm].ko}합으로 ${ELEMENTS[combine[2]].ko}(${ELEMENTS[combine[2]].han}) 생김`);
  }
  if (domain.peach && PEACH[natal.dayBranch] === p.branch) {
    add(`${bHan} (일지 ${dHan} 기준)`, "도화: 사람을 끌어당기는 매력 · 인연의 글자", domain.peach);
    reasons.push("도화");
  }
  if (domain.yeokma && YEOKMA[natal.dayBranch] === p.branch) {
    add(`${bHan} (일지 ${dHan} 기준)`, "역마: 움직이고 옮기는 기운 · 이동수", domain.yeokma);
    reasons.push("역마(이동수)");
  }
  if (domain.storage && STORAGE_BRANCHES.includes(p.branch)) {
    add(`${bHan}`, "재고(辰戌丑未): 곳간 · 창고의 글자라 쌓아 두는 재물 · 부동산에 유리", domain.storage);
    reasons.push("재고(辰戌丑未)");
  }
  if (domain.element) {
    for (const e of new Set([stemEl, branchEl])) {
      if (domain.element[e]) add(`${elementLabel(e)} 기운`, `${josa(name, "과/와")} 관련 깊은 오행 (토 = 땅 · 부동산)`, domain.element[e]);
    }
  }
  if (domain.johu && natal.johu && (stemEl === natal.johu.element || branchEl === natal.johu.element)) {
    add(`${elementLabel(natal.johu.element)} 기운`, `조후 충족: ${natal.johu.label}에 태어나 필요한 ${josa(natal.johu.need, "이/가")} 들어옴`, domain.johu);
    reasons.push("조후 충족");
  }
  // 오행 균형: 원국에 없는 오행이 들어오면 가점, 이미 3개 이상인 오행이 더 들어오면 감점
  if (domain.balance) {
    for (const e of new Set([stemEl, branchEl])) {
      if (natal.elementCount[e] === 0) {
        add(`${elementLabel(e)} 기운`, "원국에 0개였던 오행을 채워 균형이 맞음", domain.balance);
        reasons.push(`비어 있던 ${ELEMENTS[e].ko}(${ELEMENTS[e].han}) 채움`);
      } else if (natal.elementCount[e] >= 3) {
        add(`${elementLabel(e)} 기운`, `원국에 이미 ${natal.elementCount[e]}개인 오행이 더해져 한쪽으로 치우침`, -domain.balance);
        reasons.push(`넘치는 ${ELEMENTS[e].ko}(${ELEMENTS[e].han}) 더해짐`);
      }
    }
  }
  const final = clamp(score);
  if (final !== Math.round(score)) factors.push({ what: "점수 범위", why: `${SCORE.min}~${SCORE.max}점 안으로 맞춤`, pts: final - score });

  // 대표 근거: 용신·기신 여부를 맨 앞에
  const lead = natal.roles[stemEl] === "yong" || natal.roles[branchEl] === "yong"
    ? `용신 ${josa(elementLabel(natal.yong), "이/가")} 들어와요`
    : natal.roles[stemEl] === "gi" && natal.roles[branchEl] === "gi"
      ? `기신 ${josa(elementLabel(stemEl), "이/가")} 겹쳐요`
      : natal.roles[stemEl] === "hee" || natal.roles[branchEl] === "hee"
        ? `희신 ${josa(elementLabel(natal.hee), "이/가")} 도와요`
        : `${GOD_THEME[stemGod]}의 기운`;
  return { score: final, stemGod, branchGod, reason: [lead, ...reasons.slice(0, 1)].join(" · "), factors, pillar: p, domainName: name };
}

export { fmt as formatPoints };

/** 모든 영역 점수 { total, wealth, ... } */
export function scoreAll(natal, p) {
  const out = {};
  for (const d of DOMAINS) out[d.id] = scorePillar(natal, p, d.id).score;
  return out;
}

// 그 날짜(정오) 기준 연·월·일 기둥
const pillarCache = new Map();
export function pillarsOfDate(dateStr) {
  if (!pillarCache.has(dateStr)) {
    const r = calculateSaju({ date: dateStr, time: "12:00", gender: "M", longitude: 135, applyDst: false });
    pillarCache.set(dateStr, { year: r.pillars.year, month: r.pillars.month, day: r.pillars.day });
  }
  return pillarCache.get(dateStr);
}

const pad = (n) => String(n).padStart(2, "0");
export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 인생 그래프: 대운 8개 점수 + 현재 위치 */
export function lifeGraph(saju, natal) {
  const points = saju.daeun.list.map((d) => {
    const s = scorePillar(natal, d, "total");
    return {
      ...d,
      score: s.score,
      reason: s.reason,
      domains: scoreAll(natal, d),
      band: bandOf(s.score),
      theme: `${GOD_THEME[d.stemGod]}`,
    };
  });
  const currentIndex = points.findIndex((p) => p.current);
  const futureFrom = currentIndex >= 0 ? currentIndex : 0;
  const peak = points.slice(futureFrom).reduce((a, b) => (b.score > a.score ? b : a), points[futureFrom]);
  return { points, currentIndex, peak };
}

/** 한 해: 세운 점수 + 달력 월 12개(그 달 15일의 월주) 영역 점수 */
export function yearFlow(natal, year) {
  const yp = pillarsOfDate(`${year}-07-01`).year;
  const yearScores = scoreAll(natal, yp);
  const months = [];
  for (let m = 1; m <= 12; m++) {
    const mp = pillarsOfDate(`${year}-${pad(m)}-15`).month;
    const ms = scoreAll(natal, mp);
    const blended = {};
    for (const k of Object.keys(ms)) blended[k] = clamp(0.35 * yearScores[k] + 0.65 * ms[k]);
    const main = scorePillar(natal, mp, "total");
    months.push({ month: m, pillar: mp, text: pillarText(mp), ko: pillarKo(mp), scores: blended, reason: main.reason, stemGod: main.stemGod });
  }
  return { year, pillar: yp, text: pillarText(yp), ko: pillarKo(yp), scores: yearScores, months };
}

/** 하루(일진) 점수: 일진 70% + 그 달 월운 30% */
export function dayScore(natal, date, domainId = "total") {
  const ps = pillarsOfDate(dateKey(date));
  const d = scorePillar(natal, ps.day, domainId);
  const m = scorePillar(natal, ps.month, domainId);
  return { date, pillar: ps.day, text: pillarText(ps.day), ko: pillarKo(ps.day), score: clamp(0.7 * d.score + 0.3 * m.score), stemGod: d.stemGod, reason: d.reason };
}

/** 십성 5그룹 개수 */
export function godGroups(natal) {
  return GOD_GROUPS.map((g) => ({ ...g, count: g.gods.reduce((acc, name) => acc + (natal.godCount[name] || 0), 0) }));
}

// 십신 보유 + 용신 오행으로 본 적합도 (직종 · 학과 계열 공통), 높은 순
function affinity(natal, list) {
  const roleBonus = { yong: 1, hee: 0.7, neutral: 0.2, gi: -0.4 };
  return list.map((item) => {
    let raw = 0;
    const factors = [{ what: "기본 점수", why: "보유 십신 · 용신 오행이 없을 때의 출발점", pts: 42 }];
    for (const [god, w] of Object.entries(item.gods)) {
      const n = natal.godCount[god] || 0;
      const v = (w * Math.min(n, 2)) / 2;
      raw += v;
      if (n) factors.push({ what: `${god} ${n}개`, why: `${josa(`${god}(${GOD_THEME[god]})`, "이/가")} 이 일에 중요 (가중치 ${w}, 2개까지 반영)`, pts: v * 22 });
    }
    for (const [el, w] of Object.entries(item.elements)) {
      const v = w * roleBonus[natal.roles[el]];
      raw += v;
      factors.push({ what: `${elementLabel(Number(el))}`, why: `이 일과 관련 깊은 오행이 내 사주의 ${ROLE_NAME[natal.roles[el]]} (가중치 ${w} × ${roleBonus[natal.roles[el]]})`, pts: v * 22 });
    }
    return { ...item, score: Math.round(Math.min(96, Math.max(25, 42 + raw * 22))), factors };
  }).sort((a, b) => b.score - a.score);
}

/** 맞는 직종 적합도 (높은 순) */
export function jobFit(natal) {
  return affinity(natal, JOBS).map(({ name, score, factors }) => ({ name, score, factors }));
}

/** 맞는 학과 계열 적합도 (높은 순) */
export function majorFit(natal) {
  return affinity(natal, MAJORS);
}

/** 추천 자격증: 직종 적합도를 따라 상위 n개 */
export function certificates(natal, n = 5) {
  const fit = jobFit(natal);
  return CERTIFICATES.map((c) => {
    const job = fit.find((j) => j.name === c.job);
    const rank = fit.indexOf(job);
    return { ...c, score: job.score - (CERTIFICATES.filter((x) => x.job === c.job).indexOf(c) * 3), rank };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/** 맞는 직장 유형: 대운 기둥 하나 기준 점수 [{ name, score }] */
export function workplaceFit(natal, pillar) {
  const groupOf = (god) => GOD_GROUPS.find((g) => g.gods.includes(god)).id;
  const stemGroup = groupOf(tenGod(natal.dm, pillar.stem));
  const branchGroup = groupOf(tenGod(natal.dm, BRANCHES[pillar.branch].hidden.at(-1)));
  const roleBonus = { yong: 10, hee: 6, neutral: 0, gi: -8 };
  const counts = godGroups(natal);
  return WORKPLACES.map((w) => {
    const match = (stemGroup === w.group ? 0.4 : 0) + (branchGroup === w.group ? 0.6 : 0);
    const count = counts.find((g) => g.id === w.group).count;
    const score = 38 + 40 * match + Math.min(count, 3) * 4 + roleBonus[natal.roles[natal.rel[w.group]]];
    return { name: w.name, score: Math.round(Math.min(95, Math.max(15, score))) };
  });
}

/**
 * 타고난 건강 체크: 오행마다 "살펴볼 정도" 0~100 (높을수록 신경 쓸 곳).
 * 없거나(0개) 넘치는(3개 이상) 오행, 기신 오행일수록 높다. 의학적 진단이 아니다.
 */
export function healthCheck(natal) {
  return ELEMENTS.map((el, e) => {
    const n = natal.elementCount[e];
    let value = n === 0 ? 70 : n >= 3 ? 60 + (n - 3) * 10 : n === 2 ? 35 : 25;
    const why = [`원국에 ${el.ko}(${el.han}) ${n}개 → ${n === 0 ? "비어 있음 70" : n >= 3 ? `넘침 ${60 + (n - 3) * 10}` : n === 2 ? "적당 35" : "적당 25"}`];
    if (natal.roles[e] === "gi") {
      value += 12;
      why.push("기신 오행 +12");
    }
    if (natal.johu && natal.johu.element === e && n === 0) {
      value += 10; // 조후가 비면 더 살핀다
      why.push(`조후에 필요한데 없음 +10`);
    }
    const state = n === 0 ? "부족" : n >= 3 ? "많음" : "보통";
    return { element: e, label: `${el.ko} · ${ORGANS[e].organs}`, value: Math.min(95, value), state, tip: ORGANS[e].tip, why: why.join(" · ") };
  });
}

/**
 * 인생 주요 포인트: 해마다 (대운 40% + 세운 60%) 영역 점수에 그해 십신·일지 합·도화 가점을 더해
 * 결혼·취업·재물은 점수가 높은 해, 건강은 낮은 해를 고른다. 같은 명식이면 항상 같은 결과.
 * @returns [{ ...이벤트 정의, items: [{ year, age, score, ko, reason, past }] }]
 */
export function lifeEvents(saju, natal, today = new Date()) {
  const birthYear = Number(saju.solarDate.slice(0, 4));
  const thisYear = today.getFullYear();
  const daeunScores = new Map(); // 대운별 영역 점수 캐시
  const daeunOf = (age) => saju.daeun.list.find((d) => age >= d.startAge && age < d.startAge + 10) || saju.pillars.month;

  return LIFE_EVENTS.map((ev) => {
    const candidates = [];
    for (let age = ev.ages[0]; age <= ev.ages[1]; age++) {
      const year = birthYear + age - 1;
      if (year > 2100) break;
      const idx = (((year - 4) % 60) + 60) % 60;
      const seun = { stem: idx % 10, branch: idx % 12 };
      const daeun = daeunOf(age);
      const key = `${daeun.stem}-${daeun.branch}`;
      if (!daeunScores.has(key)) daeunScores.set(key, scoreAll(natal, daeun));
      const ds = daeunScores.get(key);
      const ss = scoreAll(natal, seun);
      const dAvg = ev.domains.reduce((acc, id) => acc + ds[id], 0) / ev.domains.length;
      const sAvg = ev.domains.reduce((acc, id) => acc + ss[id], 0) / ev.domains.length;
      let score = 0.4 * dAvg + 0.6 * sAvg;
      const god = tenGod(natal.dm, seun.stem);
      const reasons = [`${pillarKo(seun)}년 · ${god}`];
      const dKo = daeun.ko || pillarKo(daeun);
      const basis = [`대운 ${dKo} ${Math.round(dAvg)}점 × 40% + 세운 ${pillarKo(seun)} ${Math.round(sAvg)}점 × 60% = ${Math.round(score)}`];
      const bonus = (ev[`bonusGods${natal.gender}`] || ev.bonusGods || {})[god];
      if (bonus) {
        score += bonus;
        basis.push(`세운 천간 ${STEMS[seun.stem].han} = ${god} +${bonus}`);
      }
      if (ev.dayHarmony && pairIn(BRANCH_HARMONY, seun.branch, natal.dayBranch)) {
        score += ev.dayHarmony;
        reasons.push("일지(배우자궁)와 합");
        basis.push(`${BRANCHES[seun.branch].han} ↔ 일지 ${BRANCHES[natal.dayBranch].han} 육합 +${ev.dayHarmony}`);
      }
      if (ev.peach && PEACH[natal.dayBranch] === seun.branch) {
        score += ev.peach;
        reasons.push("도화");
        basis.push(`${BRANCHES[seun.branch].han} 도화 +${ev.peach}`);
      }
      if (ev.agePrime && age >= ev.agePrime[0] && age <= ev.agePrime[1]) {
        score += ev.agePrime[2];
        basis.push(`${ev.agePrime[0]}~${ev.agePrime[1]}세 +${ev.agePrime[2]}`);
      }
      candidates.push({ year, age, score: clamp(score), ko: pillarKo(seun), reason: reasons.join(" · "), basis: basis.join(" · "), past: year < thisYear, now: year === thisYear });
    }
    candidates.sort((a, b) => (ev.pick === "low" ? a.score - b.score : b.score - a.score));
    const items = [];
    for (const c of candidates) {
      if (items.length >= ev.count) break;
      if (items.some((x) => Math.abs(x.year - c.year) < ev.spacing)) continue;
      items.push(c);
    }
    items.sort((a, b) => a.year - b.year);
    return { ...ev, items };
  });
}

// ── 상세 문의 ─────────────────────────────
const ganzhiOfYear = (y) => {
  const i = (((y - 4) % 60) + 60) % 60;
  return { stem: i % 10, branch: i % 12 };
};

/**
 * 시기 주제(이사 · 주식 · 부동산 · 취업 · 시험) 한 해 흐름: 세운 점수, 달마다(세운 35% + 월운 65%), 그해부터 10년
 * @returns { year, score, reason, months: [{ month, ko, score, reason }], decade: [{ year, ko, score }] }
 */
export function topicFlow(natal, topicId, year) {
  const topic = TOPICS.find((t) => t.id === topicId);
  const yp = ganzhiOfYear(year);
  const ys = scorePillar(natal, yp, topic);
  const months = [];
  for (let m = 1; m <= 12; m++) {
    const mp = pillarsOfDate(`${year}-${pad(m)}-15`).month;
    const ms = scorePillar(natal, mp, topic);
    months.push({ month: m, pillar: mp, ko: pillarKo(mp), score: clamp(0.35 * ys.score + 0.65 * ms.score), reason: ms.reason, stemGod: ms.stemGod });
  }
  const decade = Array.from({ length: 10 }, (_, i) => {
    const p = ganzhiOfYear(year + i);
    return { year: year + i, ko: pillarKo(p), score: scorePillar(natal, p, topic).score };
  });
  return { year, ko: pillarKo(yp), pillar: yp, score: ys.score, reason: ys.reason, stemGod: ys.stemGod, factors: ys.factors, months, decade };
}

/** 투자 성향: 원국의 편재 · 겁재 · 인성으로 본 위험 감수 정도 0~100 (높을수록 공격적) */
export function riskAppetite(natal) {
  const g = natal.godCount;
  const v = 45 + 12 * (g.편재 || 0) + 8 * (g.상관 || 0) + 10 * (g.겁재 || 0) - 8 * (g.정인 || 0) - 6 * (g.정재 || 0);
  return Math.round(Math.min(95, Math.max(5, v)));
}

// 두 지지 관계 점수와 이름
function branchRelation(a, b) {
  if (a === b) return { score: 68, name: "같은 지지 · 비슷한 생활 리듬" };
  if (pairIn(BRANCH_HARMONY, a, b)) return { score: 88, name: "육합 · 서로 끌어당김" };
  if (SAMHAP.some((g) => g.includes(a) && g.includes(b))) return { score: 80, name: "삼합 · 같은 방향을 봄" };
  if (pairIn(BRANCH_CLASH, a, b)) return { score: 35, name: "충 · 부딪히기 쉬움" };
  if (pairIn(BRANCH_WONJIN, a, b)) return { score: 42, name: "원진 · 서운함이 쌓이기 쉬움" };
  return { score: 60, name: "무난함" };
}

/**
 * 궁합: 일간(성격) · 일지(생활 · 배우자궁) · 띠(연지) · 오행 보완(서로의 용신을 채워 주는지)
 * a = 나, b = 상대. 각 { saju, natal }
 */
export function matchScore(a, b) {
  const ea = STEMS[a.natal.dm].element;
  const eb = STEMS[b.natal.dm].element;
  const rel = (eb - ea + 5) % 5; // 0 같음, 1 내가 생함, 2 내가 극함, 3 상대가 나를 극함, 4 상대가 나를 생함
  const dmTable = [
    { score: 70, name: "같은 오행 · 친구처럼 편함" },
    { score: 80, name: "내가 상대를 북돋움" },
    { score: 55, name: "내가 상대를 이끌려 함" },
    { score: 50, name: "상대가 나를 다잡으려 함" },
    { score: 84, name: "상대가 나를 북돋움" },
  ];
  const dm = { ...dmTable[rel] };
  const combine = STEM_COMBINE.find(([x, y]) => (x === a.natal.dm && y === b.natal.dm) || (y === a.natal.dm && x === b.natal.dm));
  if (combine) {
    dm.score = Math.min(95, dm.score + 15);
    dm.name += " · 천간합(끌림)";
  }
  const day = branchRelation(a.natal.dayBranch, b.natal.dayBranch);
  const zodiac = branchRelation(a.saju.pillars.year.branch, b.saju.pillars.year.branch);
  const fill = (x, y) => {
    let v = 50;
    v += 12 * Math.min(2, y.natal.elementCount[x.natal.yong]);
    v += 6 * Math.min(2, y.natal.elementCount[x.natal.hee]);
    for (const g of x.natal.gi) v -= 4 * Math.min(2, y.natal.elementCount[g]);
    return Math.round(Math.min(95, Math.max(15, v)));
  };
  const mine = fill(a, b);
  const theirs = fill(b, a);
  const parts = [
    { id: "dm", label: "성격 (일간)", score: dm.score, note: dm.name },
    { id: "day", label: "생활 (일지)", score: day.score, note: day.name },
    { id: "zodiac", label: "띠 (연지)", score: zodiac.score, note: zodiac.name },
    { id: "fill", label: "오행 보완", score: Math.round((mine + theirs) / 2), note: `상대가 나의 용신을 ${mine >= 65 ? "잘" : mine >= 50 ? "조금" : "거의 못"} 채워 줌 · 내가 상대를 ${theirs >= 65 ? "잘" : theirs >= 50 ? "조금" : "거의 못"} 채워 줌` },
  ];
  const total = Math.round(0.3 * parts[0].score + 0.25 * parts[1].score + 0.15 * parts[2].score + 0.3 * parts[3].score);
  const bH = (x) => BRANCHES[x].han;
  const count = (x, e) => x.natal.elementCount[e];
  const basis = [
    { what: `일간 ${charOf(a.natal.dm)} ↔ ${charOf(b.natal.dm)}`, why: `${["같은 오행", "내가 생함(상생)", "내가 극함(상극)", "상대가 나를 극함", "상대가 나를 생함"][rel]}${combine ? " · 천간합" : ""} → ${dm.name}`, pts: parts[0].score, weight: "30%" },
    { what: `일지 ${bH(a.natal.dayBranch)} ↔ ${bH(b.natal.dayBranch)}`, why: `배우자 · 생활 자리끼리 ${day.name}`, pts: parts[1].score, weight: "25%" },
    { what: `띠 ${bH(a.saju.pillars.year.branch)} ↔ ${bH(b.saju.pillars.year.branch)}`, why: `연지끼리 ${zodiac.name}`, pts: parts[2].score, weight: "15%" },
    { what: "오행 보완", why: `상대 원국에 나의 용신 ${elementLabel(a.natal.yong)} ${count(b, a.natal.yong)}개 · 희신 ${count(b, a.natal.hee)}개 (→ ${mine}점), 내 원국에 상대 용신 ${elementLabel(b.natal.yong)} ${count(a, b.natal.yong)}개 (→ ${theirs}점), 평균`, pts: parts[3].score, weight: "30%" },
  ];
  return { total, parts, rel, mine, theirs, basis };
}

/** 부모와 자녀: 부모 사주의 자녀성(여 식상 · 남 관성) 오행과 자녀 일간 오행이 같은지 */
export function childStar(parent, child) {
  const me = STEMS[parent.natal.dm].element;
  const star = parent.natal.gender === "F" ? (me + 1) % 5 : (me + 3) % 5;
  return { star, match: STEMS[child.natal.dm].element === star };
}
