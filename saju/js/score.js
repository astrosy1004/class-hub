// 점수 엔진: 원국 분석(신강·신약, 조후, 용신·희신·기신) → 기간(대운·세운·월운·일진)별 영역 점수 0~100.
// 규칙·문구는 score-rules.js, 사주 계산은 manse.js가 맡는다. 같은 명식이면 항상 같은 점수가 나온다.

import { STEMS, BRANCHES, ELEMENTS } from "./saju-data.js";
import { calculateSaju, tenGod, pillarText, pillarKo } from "./manse.js";
import {
  ROLE_VALUE, SCORE, HIDDEN_WEIGHT, STRENGTH_WEIGHT, JOHU, BRANCH_HARMONY, BRANCH_CLASH, STEM_COMBINE, PEACH,
  DOMAINS, BANDS, GOD_THEME, GOD_GROUPS, JOBS, CERTIFICATES, ELEMENT_DESC, WORKPLACES, ORGANS, LIFE_EVENTS,
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
  const add = (element, weight) => {
    total += weight;
    if (element === rel.self || element === rel.resource) support += weight;
  };
  for (const [slot, p] of slots) {
    if (slot !== "day") add(STEMS[p.stem].element, STRENGTH_WEIGHT[`${slot}Stem`]);
    for (const h of hiddenWeighted(p.branch)) add(STEMS[h.stem].element, STRENGTH_WEIGHT[`${slot}Branch`] * h.weight);
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

  // 5) 쉬운 말 요약
  const dmName = `${STEMS[dm].ko}${ELEMENTS[me].ko}(${STEMS[dm].han}${ELEMENTS[me].han})`;
  const opener = johu
    ? `${johu.label === "겨울" ? "차가운 겨울" : "뜨거운 여름"}에 태어난 ${dmName} 사주라`
    : `${strong ? "기운이 넉넉한" : "기운이 여린"} ${dmName} 사주라`;
  const summary = `${opener}, ${josa(ELEMENT_DESC[yong], "과/와")} ${josa(ELEMENT_DESC[hee], "이/가")} 오는 시기에 크게 피어나요.`;

  return {
    dm, rel, elementCount, godCount, strong, strengthRatio, johu, yong, hee,
    gi: [...giSet], roles, summary, dmName,
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

/** 한 기둥 × 한 영역 점수 { score, reason } */
export function scorePillar(natal, p, domainId = "total") {
  const domain = DOMAINS.find((d) => d.id === domainId);
  const { value, stemEl, branchEl } = pillarValue(natal, p);
  let score = SCORE.center + SCORE.spread * value;
  const reasons = [];

  // 영역 가중치: 천간 십신 40% + 지장간 십신 60%
  const stemGod = tenGod(natal.dm, p.stem);
  const branchGod = tenGod(natal.dm, BRANCHES[p.branch].hidden.at(-1));
  let dw = SCORE.stemWeight * godWeight(domain, natal.gender, stemGod);
  for (const h of hiddenWeighted(p.branch)) dw += SCORE.branchWeight * h.weight * godWeight(domain, natal.gender, tenGod(natal.dm, h.stem));
  score += SCORE.domainSpread * dw;
  if (Math.abs(dw) >= 0.3) reasons.push(`${GOD_THEME[stemGod]} ${dw > 0 ? "기운" : "주의"}`);

  // 관계 보정: 일지(배우자궁) · 시지(자녀궁)와 합·충
  if (pairIn(BRANCH_HARMONY, p.branch, natal.dayBranch) && domain.dayHarmony) {
    score += domain.dayHarmony;
    reasons.push("일지와 합");
  }
  if (pairIn(BRANCH_CLASH, p.branch, natal.dayBranch) && domain.dayClash) {
    score += domain.dayClash;
    reasons.push("일지와 충");
  }
  if (natal.hourBranch != null) {
    if (pairIn(BRANCH_HARMONY, p.branch, natal.hourBranch) && domain.hourHarmony) {
      score += domain.hourHarmony;
      reasons.push("시지(자녀궁)와 합");
    }
    if (pairIn(BRANCH_CLASH, p.branch, natal.hourBranch) && domain.hourClash) {
      score += domain.hourClash;
      reasons.push("시지(자녀궁)와 충");
    }
  }
  // 천간합으로 용신·희신이 생기면 가점 (예: 무계합화 → 火)
  const combine = STEM_COMBINE.find(([a, b]) => (a === p.stem && b === natal.dm) || (b === p.stem && a === natal.dm));
  if (combine && ["yong", "hee"].includes(natal.roles[combine[2]])) {
    score += SCORE.stemCombineBonus;
    reasons.push(`${STEMS[p.stem].ko}${STEMS[natal.dm].ko}합으로 ${ELEMENTS[combine[2]].ko}(${ELEMENTS[combine[2]].han}) 생김`);
  }
  if (domain.peach && PEACH[natal.dayBranch] === p.branch) {
    score += domain.peach;
    reasons.push("도화");
  }
  if (domain.johu && natal.johu && (stemEl === natal.johu.element || branchEl === natal.johu.element)) {
    score += domain.johu;
    reasons.push("조후 충족");
  }
  // 오행 균형: 원국에 없는 오행이 들어오면 가점, 이미 3개 이상인 오행이 더 들어오면 감점
  if (domain.balance) {
    for (const e of new Set([stemEl, branchEl])) {
      if (natal.elementCount[e] === 0) {
        score += domain.balance;
        reasons.push(`비어 있던 ${ELEMENTS[e].ko}(${ELEMENTS[e].han}) 채움`);
      } else if (natal.elementCount[e] >= 3) {
        score -= domain.balance;
        reasons.push(`넘치는 ${ELEMENTS[e].ko}(${ELEMENTS[e].han}) 더해짐`);
      }
    }
  }

  // 대표 근거: 용신·기신 여부를 맨 앞에
  const lead = natal.roles[stemEl] === "yong" || natal.roles[branchEl] === "yong"
    ? `용신 ${josa(elementLabel(natal.yong), "이/가")} 들어와요`
    : natal.roles[stemEl] === "gi" && natal.roles[branchEl] === "gi"
      ? `기신 ${josa(elementLabel(stemEl), "이/가")} 겹쳐요`
      : natal.roles[stemEl] === "hee" || natal.roles[branchEl] === "hee"
        ? `희신 ${josa(elementLabel(natal.hee), "이/가")} 도와요`
        : `${GOD_THEME[stemGod]}의 기운`;
  return { score: clamp(score), stemGod, branchGod, reason: [lead, ...reasons.slice(0, 1)].join(" · ") };
}

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

/** 맞는 직종 적합도 (높은 순) */
export function jobFit(natal) {
  const roleBonus = { yong: 1, hee: 0.7, neutral: 0.2, gi: -0.4 };
  return JOBS.map((job) => {
    let raw = 0;
    for (const [god, w] of Object.entries(job.gods)) raw += w * Math.min(natal.godCount[god] || 0, 2) / 2;
    for (const [el, w] of Object.entries(job.elements)) raw += w * roleBonus[natal.roles[el]];
    return { name: job.name, score: Math.round(Math.min(96, Math.max(25, 42 + raw * 22))) };
  }).sort((a, b) => b.score - a.score);
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
    if (natal.roles[e] === "gi") value += 12;
    if (natal.johu && natal.johu.element === e && n === 0) value += 10; // 조후가 비면 더 살핀다
    const state = n === 0 ? "부족" : n >= 3 ? "많음" : "보통";
    return { element: e, label: `${el.ko} · ${ORGANS[e].organs}`, value: Math.min(95, value), state, tip: ORGANS[e].tip };
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
      let score = ev.domains.reduce((acc, id) => acc + 0.4 * ds[id] + 0.6 * ss[id], 0) / ev.domains.length;
      const god = tenGod(natal.dm, seun.stem);
      const reasons = [`${pillarKo(seun)}년 · ${god}`];
      const bonus = (ev[`bonusGods${natal.gender}`] || ev.bonusGods || {})[god];
      if (bonus) score += bonus;
      if (ev.dayHarmony && pairIn(BRANCH_HARMONY, seun.branch, natal.dayBranch)) {
        score += ev.dayHarmony;
        reasons.push("일지(배우자궁)와 합");
      }
      if (ev.peach && PEACH[natal.dayBranch] === seun.branch) {
        score += ev.peach;
        reasons.push("도화");
      }
      if (ev.agePrime && age >= ev.agePrime[0] && age <= ev.agePrime[1]) score += ev.agePrime[2];
      candidates.push({ year, age, score: clamp(score), ko: pillarKo(seun), reason: reasons.join(" · "), past: year < thisYear, now: year === thisYear });
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
