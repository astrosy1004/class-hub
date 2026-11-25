// 명리 30일 — 화면 그리기와 사주 분석.
// 강의 내용·해석 문구는 data.js, 만세력 계산은 manse.js(window.Manse)가 맡는다.

const THEME_KEY = "myeongri30Theme";
const PROGRESS_KEY = "myeongri30Progress"; // { done: [day...], quiz: { day: 고른 번호 } }
const PROFILE_KEY = "myeongri30Profile"; // 생년월일 입력값 (이 브라우저에만 저장)
const START_KEY = "myeongri30Start"; // 공부 시작일 "YYYY-MM-DD"

const M = window.Manse;
const EL_ID = ["wood", "fire", "earth", "metal", "water"];
const EL_KO = ["목", "화", "토", "금", "수"];
const EL_HAN = ["木", "火", "土", "金", "水"];
const POS = ["hour", "day", "month", "year"]; // 화면 표시 순서 (오른쪽이 연주)
const POS_KO = { year: "연주", month: "월주", day: "일주", hour: "시주" };
const GROUP_ORDER = ["비겁", "식상", "재성", "관성", "인성"];

const $ = (sel, root = document) => root.querySelector(sel);
const app = $("#app");

function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ───────── 테마 ─────────

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  $("#themeIcon").textContent = theme === "dark" ? "☀" : "☾";
}
applyTheme(localStorage.getItem(THEME_KEY) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("#themeToggle").addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

// ───────── 진도 ─────────

let progress = load(PROGRESS_KEY, { done: [], quiz: {} });
if (!Array.isArray(progress.done)) progress = { done: [], quiz: {} };
if (!localStorage.getItem(START_KEY)) localStorage.setItem(START_KEY, todayStr());

const isDone = (day) => progress.done.includes(day);

function toggleDone(day) {
  progress.done = isDone(day) ? progress.done.filter((d) => d !== day) : [...progress.done, day].sort((a, b) => a - b);
  save(PROGRESS_KEY, progress);
}

// 시작일로부터 오늘이 며칠째인지 (1~30)
function studyDayNo() {
  const start = new Date(localStorage.getItem(START_KEY) + "T00:00:00");
  const now = new Date(todayStr() + "T00:00:00");
  const diff = Math.round((now - start) / 86400000);
  return Math.min(30, Math.max(1, diff + 1));
}

const nextUndone = () => DAYS.find((d) => !isDone(d.day)) || null;

// ───────── 사주 분석 ─────────

function tenGodOf(dayStem, stem) {
  return M.tenGod(dayStem, stem);
}

function groupOf(god) {
  return TEN_GOD_TEXT[god] ? TEN_GOD_TEXT[god].group : "비겁";
}

const branchStem = (b) => M.BRANCHES[b].hidden[M.BRANCHES[b].hidden.length - 1];

function analyze(profile) {
  const r = M.calculateSaju({
    calendar: profile.calendar,
    date: profile.date,
    leap: profile.leap,
    time: profile.time || null,
    gender: profile.gender,
    longitude: Number(profile.longitude),
  });
  if (r.error) return { error: r.error };

  const ds = r.dayMaster;
  const dmEl = M.STEMS[ds].element;
  const chars = []; // 여덟 글자 (시간 모름이면 여섯)
  for (const pos of ["year", "month", "day", "hour"]) {
    const p = r.pillars[pos];
    if (!p) continue;
    chars.push({ pos, kind: "stem", idx: p.stem, han: M.STEMS[p.stem].han, el: M.STEMS[p.stem].element, yang: M.STEMS[p.stem].yang, god: pos === "day" ? "일간" : p.stemGod });
    chars.push({ pos, kind: "branch", idx: p.branch, han: M.BRANCHES[p.branch].han, el: M.BRANCHES[p.branch].element, yang: p.branch % 2 === 0, god: p.branchGod });
  }

  const elCount = [0, 0, 0, 0, 0];
  chars.forEach((c) => elCount[c.el]++);
  const yang = chars.filter((c) => c.yang).length;

  const groupCount = Object.fromEntries(GROUP_ORDER.map((g) => [g, 0]));
  const godCount = {};
  chars.filter((c) => c.god !== "일간").forEach((c) => {
    groupCount[groupOf(c.god)]++;
    godCount[c.god] = (godCount[c.god] || 0) + 1;
  });

  // 강약: 월지 3 · 일지 2 · 나머지 1 가중치로 나를 돕는(비겁·인성) 글자의 비율
  const helps = (el) => el === dmEl || el === (dmEl + 4) % 5;
  let score = 0;
  let total = 0;
  chars.forEach((c) => {
    if (c.pos === "day" && c.kind === "stem") return;
    const w = c.pos === "month" && c.kind === "branch" ? 3 : c.pos === "day" && c.kind === "branch" ? 2 : 1;
    total += w;
    if (helps(c.el)) score += w;
  });
  const ratio = score / total;
  const monthBranch = r.pillars.month.branch;
  const dayBranch = r.pillars.day.branch;
  const strength = {
    ratio,
    deukryeong: helps(M.BRANCHES[monthBranch].element),
    deukji: helps(M.BRANCHES[dayBranch].element),
    label: ratio >= 0.6 ? "신강" : ratio <= 0.4 ? "신약" : "중화",
    detail: ratio >= 0.6 ? "일간의 힘이 넉넉한 편" : ratio <= 0.4 ? "일간의 힘이 부족한 편" : ratio >= 0.5 ? "균형에 가깝고 약간 강한 편" : "균형에 가깝고 약간 약한 편",
  };

  // 억부 용신(간이): 강하면 힘을 빼는 기운 중 적은 것, 약하면 돕는 기운 중 적은 것
  const rel = (k) => (dmEl + k) % 5; // 0 비겁 1 식상 2 재성 3 관성 4 인성
  const pickLeast = (els) => els.slice().sort((a, b) => elCount[a] - elCount[b])[0];
  let yongsin;
  if (strength.label === "신강" || (strength.label === "중화" && ratio >= 0.5)) {
    const cands = [rel(1), rel(2), rel(3)];
    yongsin = { dir: "덜어내기", cands, pick: pickLeast(cands), why: "일간이 강하므로 힘을 써서 내보내는 식상·재성·관성이 균형을 잡아 줍니다." };
  } else {
    const cands = [rel(4), rel(0)];
    yongsin = { dir: "보태기", cands, pick: pickLeast(cands), why: "일간이 약하므로 나를 돕는 인성·비겁이 균형을 잡아 줍니다." };
  }

  // 조후: 월지 계절
  const seasonOf = (b) => (b >= 2 && b <= 4 ? "봄" : b >= 5 && b <= 7 ? "여름" : b >= 8 && b <= 10 ? "가을" : "겨울");
  const season = seasonOf(monthBranch);
  const johuMap = {
    봄: { need: monthBranch === 2 ? 1 : null, text: monthBranch === 2 ? "이른 봄(寅월)이라 아직 찬 기운이 남아 있어 火의 온기가 도움이 됩니다." : "봄은 온화한 계절이라 조후보다 억부(강약 조절)를 먼저 봅니다." },
    여름: { need: 4, text: "덥고 메마른 여름생이라 시원하게 식혀 주는 水가 조후상 필요합니다." },
    가을: { need: monthBranch === 8 ? 4 : null, text: monthBranch === 8 ? "초가을(申월)은 늦더위가 남아 水가 열기를 식혀 줍니다." : "가을은 서늘하고 건조해지는 계절이라 조후보다 억부를 먼저 보되, 늦가을은 火의 온기도 반깁니다." },
    겨울: { need: 1, text: "차갑고 습한 겨울생이라 따뜻하게 데워 주는 火가 조후상 필요합니다." },
  };
  const johu = { season, ...johuMap[season], has: johuMap[season].need != null ? elCount[johuMap[season].need] : null };

  // 합 · 충 · 형
  const branches = chars.filter((c) => c.kind === "branch");
  const stems = chars.filter((c) => c.kind === "stem");
  const pairs = (list) => {
    const out = [];
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) out.push([list[i], list[j]]);
    return out;
  };
  const label = (c) => `${POS_KO[c.pos]} ${c.han}`;
  const combos = [];
  const clashes = [];
  pairs(stems).forEach(([a, b]) => {
    if (Math.abs(a.idx - b.idx) === 5) combos.push({ type: "천간합", text: `${label(a)} + ${label(b)}`, note: `${EL_KO[(Math.min(a.idx, b.idx) % 5 + 2) % 5]}(으)로 합화하려는 성질` });
    const lo = Math.min(a.idx, b.idx);
    const hi = Math.max(a.idx, b.idx);
    if (hi - lo === 6 && lo <= 3) clashes.push({ type: "천간충", text: `${label(a)} ↔ ${label(b)}` });
  });
  pairs(branches).forEach(([a, b]) => {
    if ((a.idx + b.idx) % 12 === 1) combos.push({ type: "육합", text: `${label(a)} + ${label(b)}`, note: "두 자리가 짝을 이루어 협력·인연" });
    if (Math.abs(a.idx - b.idx) === 6) clashes.push({ type: "지지충", text: `${label(a)} ↔ ${label(b)}` });
    const ab = [a.idx, b.idx].sort((x, y) => x - y).join(",");
    if (ab === "0,3") clashes.push({ type: "형(子卯)", text: `${label(a)} · ${label(b)}` });
    if (a.idx === b.idx && [4, 6, 9, 11].includes(a.idx)) clashes.push({ type: "자형", text: `${label(a)} · ${label(b)}` });
  });
  const present = new Set(branches.map((c) => c.idx));
  const SAMHAP = [
    { set: [8, 0, 4], el: 4 }, { set: [11, 3, 7], el: 0 }, { set: [2, 6, 10], el: 1 }, { set: [5, 9, 1], el: 3 },
  ];
  SAMHAP.forEach(({ set, el }) => {
    const n = set.filter((b) => present.has(b)).length;
    if (n === 3) combos.push({ type: "삼합", text: set.map((b) => M.BRANCHES[b].han).join(""), note: `${EL_KO[el]}국(局) 완성 — ${EL_KO[el]} 기운이 크게 강해짐` });
    else if (n === 2 && present.has(set[1])) combos.push({ type: "반합", text: set.filter((b) => present.has(b)).map((b) => M.BRANCHES[b].han).join(""), note: `${EL_KO[el]} 기운으로 기울어짐` });
  });
  const BANGHAP = [{ set: [2, 3, 4], el: 0 }, { set: [5, 6, 7], el: 1 }, { set: [8, 9, 10], el: 3 }, { set: [11, 0, 1], el: 4 }];
  BANGHAP.forEach(({ set, el }) => {
    if (set.every((b) => present.has(b))) combos.push({ type: "방합", text: set.map((b) => M.BRANCHES[b].han).join(""), note: `같은 계절이 모여 ${EL_KO[el]} 기운이 매우 강함` });
  });
  [[2, 5, 8], [1, 10, 7]].forEach((set) => {
    const n = set.filter((b) => present.has(b)).length;
    if (n >= 2) clashes.push({ type: n === 3 ? "삼형" : "형(일부)", text: set.filter((b) => present.has(b)).map((b) => M.BRANCHES[b].han).join("") });
  });

  // 신살: 연지·일지 삼합 기준
  const sinsal = [];
  const SINSAL = { 도화: [9, 6, 3, 0], 역마: [2, 11, 8, 5], 화개: [4, 1, 10, 7] };
  ["year", "day"].forEach((basePos) => {
    const base = r.pillars[basePos].branch;
    const g = base % 4;
    Object.entries(SINSAL).forEach(([name, targets]) => {
      branches.forEach((c) => {
        if (c.pos !== basePos && c.idx === targets[g]) {
          if (!sinsal.some((s) => s.name === name && s.pos === c.pos)) sinsal.push({ name, pos: c.pos, han: c.han, base: POS_KO[basePos] });
        }
      });
    });
  });

  // 격국(간이): 월지 지장간 중 천간에 드러난 것 우선(정기 > 중기 > 여기), 없으면 정기
  const hidden = M.BRANCHES[monthBranch].hidden;
  const otherStems = stems.filter((c) => c.pos !== "day").map((c) => c.idx);
  const tougan = hidden.slice().reverse().find((s) => otherStems.includes(s));
  const gyeokStem = tougan ?? hidden[hidden.length - 1];
  const gyeokGod = tenGodOf(ds, gyeokStem);
  const gyeokName = gyeokGod === "비견" ? "건록격" : gyeokGod === "겁재" ? (M.STEMS[ds].yang ? "양인격" : "월겁격") : gyeokGod === "편관" ? "편관격(칠살격)" : `${gyeokGod}격`;
  const gyeok = { name: gyeokName, god: gyeokGod, stem: gyeokStem, tougan: tougan != null };

  // 세운: 올해 간지와 원국의 관계
  const seun = r.seun;
  const seunBranchGod = tenGodOf(ds, branchStem(seun.branch));
  const seunLinks = [];
  branches.forEach((c) => {
    if ((c.idx + seun.branch) % 12 === 1) seunLinks.push(`${label(c)}와 육합`);
    if (Math.abs(c.idx - seun.branch) === 6) seunLinks.push(`${label(c)}와 충`);
  });
  stems.forEach((c) => {
    if (Math.abs(c.idx - seun.stem) === 5) seunLinks.push(`${label(c)}와 천간합`);
  });

  return { r, ds, dmEl, chars, elCount, yang, groupCount, godCount, strength, yongsin, johu, combos, clashes, sinsal, gyeok, seun: { ...seun, branchGod: seunBranchGod, links: seunLinks } };
}

let cachedKey = "";
let cachedModel = null;
function currentModel() {
  const profile = load(PROFILE_KEY, null);
  if (!profile) return null;
  const key = JSON.stringify(profile);
  if (key !== cachedKey) {
    cachedKey = key;
    cachedModel = analyze(profile);
  }
  return cachedModel;
}

// ───────── 공통 조각 ─────────

const elTag = (el, text) => `<span class="el el-${EL_ID[el]}">${esc(text ?? EL_KO[el])}</span>`;
const charTag = (c) => `<span class="ch el-${EL_ID[c.el]}">${esc(c.han)}</span>`;

function pillarTable(m) {
  const cols = POS.map((pos) => ({ pos, p: m.r.pillars[pos] }));
  const cell = (fn) => cols.map(({ p, pos }) => `<td>${p ? fn(p, pos) : '<span class="muted">—</span>'}</td>`).join("");
  return `
    <div class="table-wrap"><table class="pillars">
      <thead><tr>${cols.map(({ pos }) => `<th>${POS_KO[pos]}</th>`).join("")}</tr></thead>
      <tbody>
        <tr class="row-god">${cell((p, pos) => (pos === "day" ? '<b class="me">일간(나)</b>' : esc(p.stemGod)))}</tr>
        <tr class="row-char">${cell((p) => `<span class="big el-${EL_ID[M.STEMS[p.stem].element]}">${M.STEMS[p.stem].han}<small>${M.STEMS[p.stem].ko}${EL_KO[M.STEMS[p.stem].element]}</small></span>`)}</tr>
        <tr class="row-char">${cell((p) => `<span class="big el-${EL_ID[M.BRANCHES[p.branch].element]}">${M.BRANCHES[p.branch].han}<small>${M.BRANCHES[p.branch].ko}${EL_KO[M.BRANCHES[p.branch].element]}</small></span>`)}</tr>
        <tr class="row-god">${cell((p) => esc(p.branchGod))}</tr>
        <tr class="row-sub">${cell((p) => p.hidden.map((h) => `<span title="${esc(h.god)}">${h.han}</span>`).join(" "))}</tr>
        <tr class="row-sub">${cell((p) => esc(p.stage))}</tr>
      </tbody>
    </table></div>
    <p class="legend">위에서부터 천간 십신 · 천간 · 지지 · 지지 십신 · 지장간 · 12운성</p>`;
}

function elementBars(m) {
  const max = Math.max(...m.elCount, 1);
  return `<div class="bars">${m.elCount
    .map((n, i) => `<div class="bar-row"><span class="bar-label">${elTag(i, `${EL_HAN[i]} ${EL_KO[i]}`)}</span><span class="bar-track"><span class="bar-fill el-bg-${EL_ID[i]}" style="width:${(n / max) * 100}%"></span></span><b>${n}</b></div>`)
    .join("")}</div>`;
}

function groupBars(m) {
  const max = Math.max(...Object.values(m.groupCount), 1);
  return `<div class="bars">${GROUP_ORDER.map((g, k) => {
    const el = (m.dmEl + k) % 5;
    const n = m.groupCount[g];
    return `<div class="bar-row"><span class="bar-label">${elTag(el, g)}</span><span class="bar-track"><span class="bar-fill el-bg-${EL_ID[el]}" style="width:${(n / max) * 100}%"></span></span><b>${n}</b></div>`;
  }).join("")}</div>`;
}

// ───────── '내 사주에 적용해 보기' ─────────

const APPLY = {
  pillars: (m) => `${pillarTable(m)}<p>내 일간은 <b>${charTag(m.chars.find((c) => c.god === "일간"))} ${M.STEMS[m.ds].ko}${EL_KO[m.dmEl]}</b>입니다. ${m.r.pillars.hour ? "" : "시간을 몰라 시주가 비어 있어 여섯 글자로 봅니다."}</p>`,
  yinyang: (m) => {
    const n = m.chars.length;
    const yin = n - m.yang;
    const tilt = m.yang >= n - 2 ? "양이 크게 많아 외향적이고 직선적인 경향이 강합니다. 쉼과 갈무리를 의식하면 좋습니다." : yin >= n - 2 ? "음이 크게 많아 신중하고 내면적인 경향이 강합니다. 표현하고 움직이는 연습이 도움이 됩니다." : "음양이 비교적 고르게 섞여 있습니다.";
    return `${Charts.yinyang(m.yang, yin)}<div class="chips">${m.chars.map((c) => `<span class="chip ${c.yang ? "yang" : "yin"}">${c.han} ${c.yang ? "양" : "음"}</span>`).join("")}</div><p>${tilt}</p>`;
  },
  elements: (m) => `${Charts.wuxing({ counts: m.elCount, caption: "원 크기 = 글자 수" })}${Charts.stack(m.elCount)}<p>가장 많은 오행은 ${maxEls(m).map((e) => elTag(e)).join(" ")}${missingEls(m).length ? `, 없는 오행은 ${missingEls(m).map((e) => elTag(e)).join(" ")}` : ", 다섯 오행이 모두 있습니다"}.</p><p class="muted">천간·지지 겉글자 기준으로 센 값입니다. 지장간은 Day 9에서 다룹니다.</p>`,
  cycle: (m) => {
    const e = m.dmEl;
    const rows = [
      ["나를 생하는 오행(인성)", (e + 4) % 5], ["나와 같은 오행(비겁)", e], ["내가 생하는 오행(식상)", (e + 1) % 5], ["내가 극하는 오행(재성)", (e + 2) % 5], ["나를 극하는 오행(관성)", (e + 3) % 5],
    ];
    return `<p>내 일간 ${elTag(e)}을(를) 기준으로 한 생극 관계입니다. 시계 방향 실선이 상생, 별 모양 점선이 상극입니다.</p>${Charts.wuxing({ counts: m.elCount, dm: e, caption: "원 안 = 일간 기준 십신 묶음과 개수" })}<ul class="kv">${rows.map(([k, el]) => `<li><span>${k}</span>${elTag(el)} <span class="muted">${m.elCount[el]}개</span></li>`).join("")}</ul>`;
  },
  stems: (m) => `<ul class="kv">${m.chars.filter((c) => c.kind === "stem").map((c) => `<li><span>${POS_KO[c.pos]}</span>${charTag(c)} ${M.STEMS[c.idx].ko}${EL_KO[c.el]} · ${DAY_MASTER_TEXT[c.idx].img}</li>`).join("")}</ul>`,
  branches: (m) => {
    const seasonName = (b) => (b >= 2 && b <= 4 ? "봄" : b >= 5 && b <= 7 ? "여름" : b >= 8 && b <= 10 ? "가을" : "겨울");
    const hourRange = (b) => `${String((b * 2 + 23) % 24).padStart(2, "0")}~${String((b * 2 + 1) % 24).padStart(2, "0")}시`;
    return `<ul class="kv">${m.chars.filter((c) => c.kind === "branch").map((c) => `<li><span>${POS_KO[c.pos]}</span>${charTag(c)} ${M.BRANCHES[c.idx].ko}(${M.BRANCHES[c.idx].animal}) · ${seasonName(c.idx)} · ${hourRange(c.idx)}</li>`).join("")}</ul><p>나의 띠는 <b>${M.BRANCHES[m.r.pillars.year.branch].animal}띠</b>(입춘 기준)입니다.</p>`;
  },
  ganzhi: (m) => `<ul class="kv">${["year", "month", "day", "hour"].filter((p) => m.r.pillars[p]).map((p) => `<li><span>${POS_KO[p]}</span><b>${m.r.pillars[p].text}</b> ${m.r.pillars[p].ko}</li>`).join("")}</ul><p>태어난 무렵의 절기: <b>${esc(m.r.jie.prev.name)}</b>(${esc(m.r.jie.prev.kst)}) 이후, 다음 절기 ${esc(m.r.jie.next.name)}(${esc(m.r.jie.next.kst)}) 이전이라 월주가 <b>${m.r.pillars.month.text}</b>가 되었습니다.</p>${noticeList(m)}`,
  dayMaster: (m) => {
    const t = DAY_MASTER_TEXT[m.ds];
    return `<div class="hero-char el-${EL_ID[m.dmEl]}">${M.STEMS[m.ds].han}</div><h4>${M.STEMS[m.ds].ko}${EL_KO[m.dmEl]} · ${t.img} — ${t.key}</h4><p>${t.text}</p><p>일주는 <b>${m.r.pillars.day.text}(${m.r.pillars.day.ko})</b>, 일지(배우자궁)는 ${charTag(m.chars.find((c) => c.pos === "day" && c.kind === "branch"))}입니다.</p>`;
  },
  hidden: (m) => {
    const rows = ["year", "month", "day", "hour"].filter((p) => m.r.pillars[p]).map((p) => {
      const pl = m.r.pillars[p];
      const tougan = pl.hidden.filter((h) => m.chars.some((c) => c.kind === "stem" && c.pos !== "day" && c.idx === h.stem));
      return `<li><span>${POS_KO[p]} ${pl.text.slice(1)}</span>${pl.hidden.map((h, i) => `<span class="ch el-${EL_ID[M.STEMS[h.stem].element]}" title="${i === pl.hidden.length - 1 ? "정기" : i === 0 ? "여기" : "중기"}">${h.han}</span><small class="muted">${esc(h.god)}</small>`).join(" ")}${tougan.length ? ` <em class="tag">투간: ${tougan.map((h) => h.han).join("")}</em>` : ""}</li>`;
    });
    return `<ul class="kv">${rows.join("")}</ul><p class="muted">각 줄의 마지막 글자가 정기입니다. '투간'은 그 글자가 천간에도 드러나 힘이 강하게 쓰인다는 뜻입니다.</p>`;
  },
  tenGods: (m, focus, compact) => {
    const list = Object.entries(m.godCount).sort((a, b) => b[1] - a[1]);
    const focusGods = focus ? Object.keys(TEN_GOD_TEXT).filter((g) => TEN_GOD_TEXT[g].group === focus) : null;
    const body = focus
      ? `<p><b>${focus}</b>: ${GROUP_TEXT[focus]}</p><ul class="kv">${focusGods.map((g) => `<li><span>${g} ${m.godCount[g] || 0}개</span>${esc(TEN_GOD_TEXT[g].text)}</li>`).join("")}</ul><p>${focusComment(m, focus)}</p>`
      : `<ul class="kv">${list.map(([g, n]) => `<li><span>${g} ×${n}</span>${esc(TEN_GOD_TEXT[g].key)} — ${esc(TEN_GOD_TEXT[g].text)}</li>`).join("")}</ul>`;
    return `${compact ? "" : Charts.wuxing({ counts: m.elCount, dm: m.dmEl, highlight: focus ? [(m.dmEl + GROUP_ORDER.indexOf(focus)) % 5] : [], caption: focus ? `${focus} 강조` : "일간 기준 십신 묶음" })}${groupBars(m)}${body}`;
  },
  season: (m) => {
    const mb = m.chars.find((c) => c.pos === "month" && c.kind === "branch");
    return `<p>월지는 ${charTag(mb)} (${m.johu.season}, ${EL_KO[mb.el]})입니다. 일간 ${elTag(m.dmEl)} 기준 <b>${m.r.pillars.month.branchGod}</b>의 달입니다.</p><p class="stat">${m.strength.deukryeong ? "득령 ✓ — 계절의 도움을 받습니다." : "실령 — 계절의 직접적인 도움은 받지 못합니다."}</p><p>${m.strength.deukji ? "일지에서도 힘을 얻습니다(득지)." : "일지에서는 힘을 얻지 못합니다."}</p>`;
  },
  strength: (m) => `${Charts.gauge(m.strength.ratio, m.strength.label)}<p class="stat center">${m.strength.detail}</p><ul class="kv"><li><span>득령(월지)</span>${m.strength.deukryeong ? "○" : "×"}</li><li><span>득지(일지)</span>${m.strength.deukji ? "○" : "×"}</li><li><span>비겁+인성</span>${m.groupCount.비겁 + m.groupCount.인성}개 / 나머지 ${m.chars.length - 1 - m.groupCount.비겁 - m.groupCount.인성}개</li></ul><p class="muted">월지 3 · 일지 2 · 나머지 1의 가중치로 센 학습용 간이 판단입니다.</p>`,
  balance: (m, _f, compact) => {
    const lines = m.elCount.map((n, i) => (n >= 3 ? `<li>${elTag(i)} ${n}개 — ${ELEMENT_TEXT[i].many}</li>` : n === 0 ? `<li>${elTag(i)} 없음 — ${ELEMENT_TEXT[i].none} <span class="muted">보완: ${ELEMENT_TEXT[i].tip}</span></li>` : "")).join("");
    return `${compact ? Charts.stack(m.elCount) : Charts.wuxing({ counts: m.elCount, highlight: m.elCount.map((n, i) => (n === 0 || n >= 3 ? i : -1)).filter((i) => i >= 0), caption: "점선 고리 = 많거나 없는 오행" })}${lines ? `<ul class="plain">${lines}</ul>` : "<p>3개 이상 몰리거나 빠진 오행 없이 고른 편입니다.</p>"}`;
  },
  stages: (m) => `<ul class="kv">${["year", "month", "day", "hour"].filter((p) => m.r.pillars[p]).map((p) => `<li><span>${POS_KO[p]} ${m.r.pillars[p].text.slice(1)}</span><b>${m.r.pillars[p].stage}</b> — ${STAGE_TEXT[m.r.pillars[p].stage]}</li>`).join("")}</ul><p class="muted">일간 ${M.STEMS[m.ds].han}이(가) 각 지지에서 어떤 상태인지 본 것입니다.</p>`,
  combos: (m) => (m.combos.length ? `<ul class="kv">${m.combos.map((c) => `<li><span>${c.type}</span><b>${esc(c.text)}</b> — ${esc(c.note)}</li>`).join("")}</ul>` : "<p>원국에 뚜렷한 합이 없습니다. 운에서 들어오는 글자와의 합을 보게 됩니다.</p>"),
  clashes: (m) => (m.clashes.length ? `<ul class="kv">${m.clashes.map((c) => `<li><span>${c.type}</span><b>${esc(c.text)}</b></li>`).join("")}</ul><p>충·형이 있는 자리(궁)는 변화와 조정이 잦은 영역으로 읽습니다.</p>` : "<p>원국에 충·형이 없어 비교적 안정된 구조입니다. 운에서 오는 충을 살펴보세요.</p>"),
  yongsin: (m, _f, compact) => `${compact ? "" : Charts.wuxing({ counts: m.elCount, dm: m.dmEl, highlight: [m.yongsin.pick], caption: `점선 고리 = 간이 용신 후보 ${EL_KO[m.yongsin.pick]}` })}<p class="stat">${m.strength.label} → <b>${m.yongsin.dir}</b></p><p>${m.yongsin.why}</p><p>후보: ${m.yongsin.cands.map((e) => `${elTag(e)} <span class="muted">${m.elCount[e]}개</span>`).join(" · ")}</p><p>이 중 원국에 가장 적은 ${elTag(m.yongsin.pick)}을(를) 간이 용신 후보로 볼 수 있습니다. 생활 팁: ${ELEMENT_TEXT[m.yongsin.pick].tip}.</p><p class="muted">실제 용신은 조후·합충·격국까지 봐야 하며 학파마다 다릅니다.</p>`,
  johu: (m) => `${seasonWheel(m.r.pillars.month.branch)}<p class="stat">${m.johu.season}생 · 월지 ${m.r.pillars.month.text.slice(1)}</p><p>${m.johu.text}</p>${m.johu.need != null ? `<p>조후 오행 ${elTag(m.johu.need)} — 원국에 <b>${m.johu.has}개</b> ${m.johu.has ? "있어 어느 정도 조절됩니다." : "없어 운에서 들어올 때 반갑습니다."}</p>` : ""}`,
  daeun: (m) => `<p>대운수 <b>${m.r.daeun.number}</b> · ${m.r.daeun.forward ? "순행" : "역행"} · 현재 ${m.r.koreanAge}세(세는 나이)</p>${Charts.timeline(m.r.daeun.list.map((d) => ({ ...d, stemEl: M.STEMS[d.stem].element, branchEl: M.BRANCHES[d.branch].element, stemHan: M.STEMS[d.stem].han, branchHan: M.BRANCHES[d.branch].han })), m.r.koreanAge)}${currentDaeunText(m)}`,
  seun: (m) => `<p class="stat">${m.seun.year}년 <b>${m.seun.text}</b>(${m.seun.ko})</p><ul class="kv"><li><span>천간 ${M.STEMS[m.seun.stem].han}</span>${m.seun.stemGod} — ${esc(TEN_GOD_TEXT[m.seun.stemGod].key)}</li><li><span>지지 ${M.BRANCHES[m.seun.branch].han}</span>${m.seun.branchGod} — ${esc(TEN_GOD_TEXT[m.seun.branchGod].key)}</li></ul><p>올해의 주제는 <b>${groupOf(m.seun.stemGod)}</b>(${GROUP_TEXT[groupOf(m.seun.stemGod)]}) 쪽으로 읽을 수 있습니다.${m.seun.links.length ? ` 원국과는 ${m.seun.links.join(", ")}이 있어 해당 자리의 변화가 예상됩니다.` : ""}</p>`,
  sinsal: (m) => (m.sinsal.length ? `<ul class="kv">${m.sinsal.map((s) => `<li><span>${s.name}</span>${POS_KO[s.pos]} ${s.han} <span class="muted">(${s.base} 기준)</span></li>`).join("")}</ul><p class="muted">도화=매력·인기, 역마=이동·활동, 화개=학문·예술. 보조 지표로만 참고하세요.</p>` : "<p>연지·일지 기준으로 도화·역마·화개가 원국에 보이지 않습니다.</p>"),
  gyeok: (m) => `<p class="stat"><b>${m.gyeok.name}</b></p><p>월지 ${m.r.pillars.month.text.slice(1)}의 지장간 중 ${M.STEMS[m.gyeok.stem].han}${m.gyeok.tougan ? "이(가) 천간에 드러나(투간)" : "(정기)을 기준으로"} 일간에게 <b>${m.gyeok.god}</b>이 되므로 ${m.gyeok.name}으로 봅니다.</p><p>${esc(TEN_GOD_TEXT[m.gyeok.god].text)}의 틀로 사회 활동을 펼치는 구조입니다.</p><p class="muted">간이 판정입니다. 격의 성패와 상신까지는 판단하지 않습니다.</p>`,
  palaces: (m) => `<ul class="kv">${["year", "month", "day", "hour"].map((p) => {
    const pl = m.r.pillars[p];
    if (!pl) return `<li><span>${PALACE_TEXT[p].name}</span><span class="muted">시간 모름</span></li>`;
    return `<li><span>${PALACE_TEXT[p].name} · ${PALACE_TEXT[p].seed}</span><b>${pl.text}</b> ${PALACE_TEXT[p].role} — ${p === "day" ? "나(일간)와" : esc(pl.stemGod) + " ·"} ${esc(pl.branchGod)}</li>`;
  }).join("")}</ul>`,
  summary: (m) => summaryHtml(m),
};

const seasonWheel = (monthBranch) => Charts.seasons(monthBranch, M.BRANCHES.map((b) => b.han));

function maxEls(m) {
  const max = Math.max(...m.elCount);
  return m.elCount.map((n, i) => (n === max ? i : -1)).filter((i) => i >= 0);
}
function missingEls(m) {
  return m.elCount.map((n, i) => (n === 0 ? i : -1)).filter((i) => i >= 0);
}

function focusComment(m, g) {
  const n = m.groupCount[g];
  if (n === 0) return `원국에 ${g}이(가) 없습니다. 이 영역은 운에서 ${g}이(가) 들어올 때 경험하게 됩니다.`;
  if (n >= 3) return `${g}이(가) ${n}개로 많아 이 기운이 삶의 큰 주제가 됩니다. 장점은 살리고 과한 면은 조절해 보세요.`;
  return `${g}이(가) ${n}개로 적당히 있습니다.`;
}

function currentDaeunText(m) {
  const cur = m.r.daeun.list.find((d) => d.current);
  if (!cur) return "";
  return `<p>지금은 <b>${cur.text} 대운</b>(${cur.startAge}~${cur.startAge + 9}세)으로 천간 ${cur.stemGod}·지지 ${cur.branchGod}의 시기입니다. ${GROUP_TEXT[groupOf(cur.stemGod)]}의 주제가 두드러집니다.${m.yongsin.cands.includes(M.STEMS[cur.stem].element) ? " 대운 천간이 간이 용신 쪽 기운이라 균형에 도움이 되는 흐름입니다." : ""}</p>`;
}

function noticeList(m) {
  if (!m.r.notices.length) return "";
  return `<ul class="notices">${m.r.notices.map((n) => `<li class="${n.level}">${esc(n.text)}</li>`).join("")}</ul>`;
}

function summaryHtml(m) {
  const t = DAY_MASTER_TEXT[m.ds];
  const topGroup = GROUP_ORDER.slice().sort((a, b) => m.groupCount[b] - m.groupCount[a])[0];
  const miss = missingEls(m);
  const steps = [
    ["① 일간", `${M.STEMS[m.ds].han} ${M.STEMS[m.ds].ko}${EL_KO[m.dmEl]}(${t.img}) — ${t.key}`],
    ["② 계절", `${m.johu.season}생, 월지 ${m.r.pillars.month.text.slice(1)} · ${m.strength.deukryeong ? "득령" : "실령"}`],
    ["③ 강약", `${m.strength.label} (${m.strength.detail})`],
    ["④ 십신", `가장 많은 십신 ${topGroup} ${m.groupCount[topGroup]}개 — ${GROUP_TEXT[topGroup]}`],
    ["⑤ 합충", `${m.combos.length ? m.combos.map((c) => c.type).join("·") : "합 없음"} / ${m.clashes.length ? m.clashes.map((c) => c.type).join("·") : "충·형 없음"}`],
    ["⑥ 균형", `간이 용신 ${EL_KO[m.yongsin.pick]}${m.johu.need != null ? ` · 조후 ${EL_KO[m.johu.need]}` : ""}${miss.length ? ` · 없는 오행 ${miss.map((e) => EL_KO[e]).join("")}` : ""}`],
    ["⑦ 격국", m.gyeok.name],
    ["⑧ 시기", `${m.r.daeun.list.find((d) => d.current)?.text || "—"} 대운 · ${m.seun.year} ${m.seun.text}년(${m.seun.stemGod})`],
  ];
  return `<ul class="kv summary">${steps.map(([k, v]) => `<li><span>${k}</span>${esc(v)}</li>`).join("")}</ul>
    <div class="story"><p>${t.text}</p><p>${topGroup}(${GROUP_TEXT[topGroup].split(" — ")[1]})의 기운이 두드러집니다. 강점으로 쓰기 좋은 것은 '${esc(TEN_GOD_TEXT[Object.keys(TEN_GOD_TEXT).filter((g) => TEN_GOD_TEXT[g].group === topGroup).sort((a, b) => (m.godCount[b] || 0) - (m.godCount[a] || 0))[0]].text)}'입니다.</p><p>균형을 위해서는 ${elTag(m.yongsin.pick)}의 기운(${ELEMENT_TEXT[m.yongsin.pick].tip})을 생활에서 의식해 보세요.</p></div>`;
}

// ───────── 화면: 오늘 ─────────

function renderToday() {
  const no = studyDayNo();
  const today = DAYS[no - 1];
  const next = nextUndone();
  const done = progress.done.length;
  const m = currentModel();
  app.innerHTML = `
    <section class="hero">
      <h1>사주를 읽는 법,<br>하루 한 강씩</h1>
      <p class="sub">추천 영상으로 듣고, 핵심을 정리하고, 바로 내 사주에 적용해 보는 30일 명리 공부.</p>
      <div class="pill-cta">
        <span class="pill-text">오늘 · Day ${today.day} ${esc(today.title.split(" — ")[0])}</span>
        <a class="btn" href="#day-${today.day}">강의 시작</a>
      </div>
      <a class="btn ghost sm" href="#list">커리큘럼 보기 ↗</a>
      <div class="preview">
        <div class="preview-side">
          <div class="pv-brand"><span class="seal" aria-hidden="true">命</span>명리 30일</div>
          ${["오늘", "커리큘럼", "내 사주"].map((t, i) => `<span class="pv-nav ${i === 0 ? "on" : ""}">${t}</span>`).join("")}
          <span class="pv-sep">이번 주</span>
          ${DAYS.filter((d) => d.week === today.week).map((d) => `<span class="pv-nav ${isDone(d.day) ? "done" : ""}">Day ${d.day}</span>`).join("")}
        </div>
        <div class="preview-main">
          <p class="pv-hello">공부 ${no}일째, 오늘도 한 강 해 볼까요?</p>
          <div class="pv-grid">
            <div class="pv-card pv-ring">
              <p class="pv-label">30일 진도</p>
              ${Charts.ring({ done: progress.done, today: no })}
              <p class="pv-foot">${esc(localStorage.getItem(START_KEY))} 시작</p>
            </div>
            <a class="pv-card pv-today" href="#day-${today.day}">
              <p class="pv-label">오늘의 강의 · Day ${today.day}</p>
              <h3>${esc(today.title)}</h3>
              <p>${esc(today.goal)}</p>
              <ol>${today.points.slice(0, 3).map((p) => `<li>${esc(p.length > 46 ? p.slice(0, 46) + "…" : p)}</li>`).join("")}</ol>
            </a>
          </div>
        </div>
      </div>
    </section>
    <section class="intro">
      <div>
        <h2>다섯 기운이 서로 돕고<br>견제하는 방식을 읽습니다</h2>
        <p>목·화·토·금·수는 시계 방향으로 서로를 낳고(상생), 별 모양으로 서로를 누릅니다(상극). 30일 동안 이 관계 위에 십신, 강약, 용신, 대운을 차례로 얹어 갑니다.</p>
        <p class="muted small">${m && !m.error ? "오른쪽 그림은 입력한 내 사주의 오행 개수와 일간 기준 십신입니다." : "생년월일을 입력하면 이 그림이 내 사주의 오행 분포로 바뀝니다."}</p>
        <div class="row"><a class="btn sm ghost" href="#day-4">Day 4 상생과 상극 ↗</a>${m && !m.error ? "" : '<a class="btn sm" href="#saju">생년월일 입력</a>'}</div>
      </div>
      ${m && !m.error ? Charts.wuxing({ counts: m.elCount, dm: m.dmEl }) : Charts.wuxing()}
    </section>
    <div class="band" aria-hidden="true"></div>
    <section class="grid2 cards-home">
      <a class="card today-card" href="#day-${today.day}">
        <span class="badge solid">오늘의 강의 · Day ${today.day}</span>
        <h2>${esc(today.title)}</h2>
        <p>${esc(today.goal)}</p>
        <span class="go">${isDone(today.day) ? "✓ 완료 — 다시 보기" : "공부 시작 →"}</span>
      </a>
      ${next && next.day !== today.day ? `<a class="card" href="#day-${next.day}"><span class="badge soft">이어서 공부하기 · Day ${next.day}</span><h2>${esc(next.title)}</h2><p>${esc(next.goal)}</p><span class="go">이어서 →</span></a>` : ""}
      ${!next ? `<div class="card done-card"><span class="badge solid">30강 완주</span><h2>모든 강의를 마쳤습니다</h2><p>Day 29 종합 실습을 다시 보며 가족의 사주도 풀어 보세요.</p></div>` : ""}
      <a class="card" href="#saju">
        <span class="badge soft">내 사주 해석</span>
        ${m && !m.error ? `<h2>${m.r.pillars.year.text} ${m.r.pillars.month.text} ${m.r.pillars.day.text} ${m.r.pillars.hour ? m.r.pillars.hour.text : ""}</h2><p>${M.STEMS[m.ds].ko}${EL_KO[m.dmEl]} 일간 · ${m.strength.label} · ${m.gyeok.name}</p><span class="go">해석 보기 →</span>` : `<h2>생년월일을 입력해 주세요</h2><p>입력하면 매일 강의에서 내 사주로 실습할 수 있습니다.</p><span class="go">입력하기 →</span>`}
      </a>
    </section>
    ${weekGrid()}`;
}

function weekGrid() {
  const no = studyDayNo();
  return WEEKS.map((w) => `
    <section class="week">
      <div class="week-head"><h3>${esc(w.name)}</h3><p>${esc(w.desc)}</p></div>
      <div class="days">${DAYS.filter((d) => d.week === w.no).map((d) => `<a class="day ${isDone(d.day) ? "done" : ""} ${d.day === no ? "is-today" : ""}" href="#day-${d.day}"><b>${d.day}</b><span>${esc(d.title.split(" — ")[0])}</span></a>`).join("")}</div>
    </section>`).join("");
}

// ───────── 화면: 커리큘럼 ─────────

function renderList() {
  app.innerHTML = `
    <section class="page-head split"><div><p class="eyebrow">Curriculum</p><h1>30일 커리큘럼</h1><p class="lead">4주 동안 재료 → 관계 → 구조 → 흐름 순서로 쌓아 올립니다.</p>
      <div class="row"><label class="muted small">공부 시작일 <input type="date" id="startDate" value="${esc(localStorage.getItem(START_KEY))}"></label><button class="btn sm ghost" id="resetProgress" type="button">진도 초기화</button></div></div>
      ${Charts.ring({ done: progress.done, today: studyDayNo(), size: 168 })}
    </section>
    <div class="band" aria-hidden="true"></div>
    ${weekGrid()}`;
  $("#startDate").addEventListener("change", (e) => {
    if (e.target.value) localStorage.setItem(START_KEY, e.target.value);
  });
  $("#resetProgress").addEventListener("click", () => {
    if (!confirm("완료 표시와 퀴즈 기록을 모두 지울까요?")) return;
    progress = { done: [], quiz: {} };
    save(PROGRESS_KEY, progress);
    renderList();
  });
}

// ───────── 화면: 강의 ─────────

function youtubeId(v) {
  if (!v) return "";
  const m = String(v).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  if (m) return m[1];
  return /^[\w-]{11}$/.test(v) ? v : "";
}

function renderDay(n) {
  const d = DAYS[n - 1];
  if (!d) return renderToday();
  const week = WEEKS[d.week - 1];
  const vid = youtubeId(d.video);
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(d.query)}`;
  const [applyKey, focus] = d.apply.split(":");
  const m = currentModel();
  const chosen = progress.quiz[d.day];
  app.innerHTML = `
    <nav class="crumbs"><a href="#list">커리큘럼</a> › ${esc(week.name)}</nav>
    <article class="lesson">
      <header>
        <span class="badge">DAY ${d.day} / 30 · ${esc(week.name.split(" · ")[1])}</span>
        <h1>${esc(d.title)}</h1>
        <p class="lead">${esc(d.goal)}</p>
      </header>

      <section class="card">
        <h2><span class="step">01</span>추천 영상</h2>
        ${vid
          ? `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${vid}" title="${esc(d.title)}" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div><p class="video-meta">${d.videoTitle ? `<b>${esc(d.videoTitle)}</b>` : ""}${d.videoChannel ? ` <span class="muted">· ${esc(d.videoChannel)}</span>` : ""}</p><p class="muted small"><a href="https://www.youtube.com/watch?v=${vid}" target="_blank" rel="noopener">유튜브에서 열기 ↗</a> · <a href="${searchUrl}" target="_blank" rel="noopener">같은 주제 다른 영상 찾기</a> · 영상은 각 채널의 강의이며, 아래 핵심 정리는 이 사이트가 따로 정리한 내용입니다.</p>`
          : `<p>오늘 주제에 맞춘 검색어로 강의 영상을 찾아 10~20분 분량 하나를 골라 보세요.</p><a class="btn" href="${searchUrl}" target="_blank" rel="noopener">▶ 유튜브에서 “${esc(d.query)}” 찾기</a><p class="muted small">마음에 드는 영상을 찾으면 <code>assets/data.js</code>의 Day ${d.day} <code>video</code> 칸에 주소를 넣어 두세요. 다음부터 이 자리에 바로 재생됩니다.</p>`}
      </section>

      <section class="card">
        <h2><span class="step">02</span>오늘의 핵심 정리</h2>
        <ol class="points">${d.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ol>
        <h3>용어</h3>
        <dl class="terms">${d.terms.map(([t, v]) => `<dt>${esc(t)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      </section>

      <section class="card apply">
        <h2><span class="step">03</span>내 사주에 적용해 보기</h2>
        ${m && !m.error ? APPLY[applyKey](m, focus) : `<p>생년월일을 입력하면 오늘 배운 내용을 내 사주로 바로 확인할 수 있습니다.</p><a class="btn" href="#saju">생년월일 입력하기</a>`}
      </section>

      <section class="card quiz">
        <h2><span class="step">04</span>확인 문제</h2>
        <p class="q">${esc(d.quiz.q)}</p>
        <div class="options">${d.quiz.options.map((o, i) => `<button type="button" class="opt ${chosen != null ? (i === d.quiz.answer ? "right" : i === chosen ? "wrong" : "") : ""}" data-opt="${i}" ${chosen != null ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>
        ${chosen != null ? `<p class="explain">${chosen === d.quiz.answer ? "정답입니다! " : "아쉬워요. "}${esc(d.quiz.explain)}</p><button type="button" class="link" id="retry">다시 풀기</button>` : ""}
      </section>

      <div class="lesson-foot">
        ${d.day > 1 ? `<a class="btn ghost" href="#day-${d.day - 1}">← Day ${d.day - 1}</a>` : "<span></span>"}
        <button type="button" class="btn ${isDone(d.day) ? "ghost" : ""}" id="doneBtn">${isDone(d.day) ? "✓ 완료됨 (취소)" : "오늘 공부 완료"}</button>
        ${d.day < 30 ? `<a class="btn ghost" href="#day-${d.day + 1}">Day ${d.day + 1} →</a>` : "<span></span>"}
      </div>
    </article>`;

  app.querySelectorAll("[data-opt]").forEach((b) =>
    b.addEventListener("click", () => {
      progress.quiz[d.day] = Number(b.dataset.opt);
      save(PROGRESS_KEY, progress);
      renderDay(n);
    }),
  );
  $("#retry")?.addEventListener("click", () => {
    delete progress.quiz[d.day];
    save(PROGRESS_KEY, progress);
    renderDay(n);
  });
  $("#doneBtn").addEventListener("click", () => {
    toggleDone(d.day);
    renderDay(n);
  });
}

// ───────── 화면: 내 사주 ─────────

function renderSaju() {
  const p = load(PROFILE_KEY, null) || { calendar: "solar", date: "", leap: false, time: "", gender: "F", longitude: 126.98 };
  const [y, mo, da] = p.date ? p.date.split("-").map(Number) : ["", "", ""];
  const m = currentModel();
  app.innerHTML = `
    <section class="page-head"><p class="eyebrow">My Saju</p><h1>내 사주 해석</h1><p class="lead">생년월일시를 넣으면 만세력으로 네 기둥을 세우고, 30일 강의 순서대로 풀어 줍니다.</p></section>
    <form class="card form" id="sajuForm" autocomplete="off">
      <div class="seg" role="radiogroup" aria-label="달력">
        <label><input type="radio" name="calendar" value="solar" ${p.calendar !== "lunar" ? "checked" : ""}> 양력</label>
        <label><input type="radio" name="calendar" value="lunar" ${p.calendar === "lunar" ? "checked" : ""}> 음력</label>
        <label class="leap" ${p.calendar === "lunar" ? "" : "hidden"}><input type="checkbox" name="leap" ${p.leap ? "checked" : ""}> 윤달</label>
      </div>
      <div class="fields">
        <label>년 <input type="number" name="y" min="1900" max="2100" required value="${y}" placeholder="1990"></label>
        <label>월 <input type="number" name="m" min="1" max="12" required value="${mo}" placeholder="3"></label>
        <label>일 <input type="number" name="d" min="1" max="31" required value="${da}" placeholder="15"></label>
      </div>
      <div class="fields">
        <label>태어난 시각 <input type="time" name="time" value="${esc(p.time || "")}" ${p.time ? "" : "disabled"}></label>
        <label class="check"><input type="checkbox" name="noTime" ${p.time ? "" : "checked"}> 시간 모름</label>
      </div>
      <div class="fields">
        <div class="seg" role="radiogroup" aria-label="성별">
          <label><input type="radio" name="gender" value="F" ${p.gender !== "M" ? "checked" : ""}> 여성</label>
          <label><input type="radio" name="gender" value="M" ${p.gender === "M" ? "checked" : ""}> 남성</label>
        </div>
        <label>출생지 <select name="city">${M.CITIES.map((c) => `<option value="${c.lon}" ${Number(p.longitude) === c.lon ? "selected" : ""}>${c.name}</option>`).join("")}</select></label>
      </div>
      <p class="error" id="formError" hidden></p>
      <div class="row">
        <button class="btn" type="submit">사주 풀기</button>
        ${load(PROFILE_KEY, null) ? '<button class="btn ghost" type="button" id="clearProfile">입력 정보 삭제</button>' : ""}
      </div>
      <p class="muted small">입력한 정보는 서버로 보내지 않고 이 브라우저(localStorage)에만 저장됩니다. 성별은 대운 방향(순행·역행)에만 쓰입니다.</p>
    </form>
    <div id="result">${m ? (m.error ? `<p class="error">${esc(m.error)}</p>` : resultHtml(m)) : ""}</div>`;

  const form = $("#sajuForm");
  form.calendar.forEach((r) => r.addEventListener("change", () => (form.querySelector(".leap").hidden = form.calendar.value !== "lunar")));
  form.noTime.addEventListener("change", () => {
    form.time.disabled = form.noTime.checked;
    if (!form.noTime.checked && !form.time.value) form.time.value = "12:00";
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const err = $("#formError");
    const yy = Number(form.y.value);
    const mm = Number(form.m.value);
    const dd = Number(form.d.value);
    const isLunar = form.calendar.value === "lunar";
    if (!isLunar) {
      const test = new Date(yy, mm - 1, dd);
      if (test.getFullYear() !== yy || test.getMonth() !== mm - 1 || test.getDate() !== dd) {
        err.textContent = "없는 날짜입니다. 년·월·일을 확인해 주세요.";
        err.hidden = false;
        return;
      }
    }
    if (yy < 1900 || yy > 2100) {
      err.textContent = "1900~2100년 사이만 계산할 수 있습니다.";
      err.hidden = false;
      return;
    }
    const profile = {
      calendar: form.calendar.value,
      leap: isLunar && form.leap.checked,
      date: `${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`,
      time: form.noTime.checked ? "" : form.time.value,
      gender: form.gender.value,
      longitude: Number(form.city.value),
    };
    const test = analyze(profile);
    if (test.error) {
      err.textContent = test.error;
      err.hidden = false;
      return;
    }
    save(PROFILE_KEY, profile);
    renderSaju();
    $("#result").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#clearProfile")?.addEventListener("click", () => {
    if (!confirm("저장된 생년월일 정보를 삭제할까요?")) return;
    localStorage.removeItem(PROFILE_KEY);
    renderSaju();
  });
}

function resultHtml(m) {
  const sec = (title, day, body) => `<section class="card"><h2>${title} ${day ? `<a class="day-link" href="#day-${day}">Day ${day}에서 배우기 →</a>` : ""}</h2>${body}</section>`;
  const r = m.r;
  return `
    <section class="card">
      <h2>사주 원국</h2>
      <p class="muted">양력 ${esc(r.solarDate)}${r.input.time ? ` ${esc(r.input.time)}` : " (시간 모름)"} · 음력 ${r.lunar ? `${r.lunar.year}.${r.lunar.month}.${r.lunar.day}${r.lunar.leap ? "(윤)" : ""}` : "—"}</p>
      ${pillarTable(m)}
      ${noticeList(m)}
    </section>
    ${sec("한눈에 보는 해석", 29, `<div class="viz-row">${Charts.wuxing({ counts: m.elCount, dm: m.dmEl, highlight: [m.yongsin.pick], caption: `점선 고리 = 간이 용신 ${EL_KO[m.yongsin.pick]}` })}${seasonWheel(m.r.pillars.month.branch)}</div>${summaryHtml(m)}`)}
    <div class="grid2">
      ${sec("일간 — 나", 8, APPLY.dayMaster(m))}
      ${sec("오행 분포", 18, APPLY.balance(m, null, true))}
      ${sec("신강·신약", 17, APPLY.strength(m))}
      ${sec("십신 분포", 10, APPLY.tenGods(m, null, true))}
      ${sec("합", 20, APPLY.combos(m))}
      ${sec("충·형", 21, APPLY.clashes(m))}
      ${sec("용신(억부)", 22, APPLY.yongsin(m, null, true))}
      ${sec("조후", 23, APPLY.johu(m).replace(seasonWheel(m.r.pillars.month.branch), ""))}
      ${sec("격국", 27, APPLY.gyeok(m))}
      ${sec("신살", 26, APPLY.sinsal(m))}
    </div>
    ${sec("대운 흐름", 24, APPLY.daeun(m))}
    <div class="grid2">
      ${sec(`${m.seun.year}년 세운`, 25, APPLY.seun(m))}
      ${sec("궁위", 28, APPLY.palaces(m))}
    </div>
    <p class="disclaimer">이 해석은 명리학 학습을 돕기 위한 간이 분석이며, 재미와 자기 이해를 위한 참고 자료입니다. 건강·법률·재정 등 중요한 결정의 근거로 쓰지 마세요.</p>`;
}

// ───────── 라우터 ─────────

function route() {
  const h = location.hash.replace("#", "");
  document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === (h.startsWith("day-") ? "list" : h || "today")));
  if (h.startsWith("day-")) renderDay(Number(h.slice(4)));
  else if (h === "list") renderList();
  else if (h === "saju") renderSaju();
  else renderToday();
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
route();
