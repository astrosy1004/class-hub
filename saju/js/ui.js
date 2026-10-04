// 화면 그리기 전담. 각 함수는 model(명식 계산 결과 묶음)을 받아 HTML 문자열을 돌려준다.
// 계산은 manse.js · score.js, 그래프는 charts.js, 문구는 score-rules.js에 있다.

import { STEMS, BRANCHES, ELEMENTS, CITIES } from "./saju-data.js";
import { solarTermsOfYear, msFromJd } from "./solar-terms.js";
import { pillarKo, calculateSaju, fourPillarsText } from "./manse.js";
import {
  bandOf, elementLabel, josa, scorePillar, dayScore, godGroups, jobFit, certificates, healthCheck, workplaceFit, dateKey,
} from "./score.js";
import { DOMAINS, ACTIONS, GUIDES, DISCLAIMER, DAY_MASTER, GOD_THEME, JOHU, HEALTH_NOTICE } from "./score-rules.js";
import { lunarMonthDays, leapMonthOf, solarToLunar, lunarToSolar } from "./lunar.js";
import { lineChart, barChart, radarChart, donutChart, gaugeChart, hBars, compareBars } from "./charts.js";
import { icon, ELEMENT_ICONS } from "./icons.js";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const RELATIONS = ["본인", "배우자", "자녀", "부모", "형제자매", "지인"];
const COLOR_WORD = ["푸른", "붉은", "누런", "흰", "검은"];
const PILLAR_ROLE = { year: "연주 · 뿌리, 어린 시절", month: "월주 · 사회, 부모", day: "일주 · 나 자신, 배우자", hour: "시주 · 자녀, 말년" };
const DOMAIN_CARE = { total: "지키기", wealth: "아껴 쓰기", love: "천천히 가기", spouse: "말 아끼기", children: "지켜보기", career: "준비하기", health: "몸 챙기기" };
const STRONG_WORD = { wealth: "재물이 들어오는", love: "인연이 닿는", career: "자리가 서는", health: "몸이 가벼운" };
// 오행 → 일간 기준 십성 그룹의 짧은 뜻 (도넛 범례)
const GROUP_WORD = { self: "나", output: "표현", wealth: "재물", power: "책임", resource: "생각" };

export function esc(text) {
  return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

const disclaimer = () => `<p class="disclaimer">${DISCLAIMER}</p>`;
const topbar = (title, right = "") =>
  `<header class="topbar"><button class="icon-btn" data-action="back" aria-label="뒤로">${icon("back")}</button><h1>${title}</h1>${right}</header>`;
const domainOf = (id) => DOMAINS.find((d) => d.id === id);
const actionText = (domainId, score) => ACTIONS[domainId][score >= 65 ? "high" : score >= 45 ? "mid" : "low"];
const ageRange = (d) => `${d.startAge}~${d.startAge + 9}세`;
const elementGroupId = (natal, e) => Object.keys(natal.rel).find((k) => natal.rel[k] === e);

function sampleBanner(model) {
  return model.profile.sample
    ? `<div class="empty-banner"><span>예시 명식(${esc(model.profile.name)})으로 보고 있어요</span><a href="#manse/new">내 명식 넣기</a></div>`
    : "";
}

function actionCard(domainId, score, title = "지금 할 일") {
  return `<section class="card"><div class="card-head"><h2>${title}</h2><span class="chip ${score >= 65 ? "up" : score < 45 ? "warn" : ""}">${bandOf(score).name}</span></div>
    <p style="font-size:15px">${actionText(domainId, score)}</p></section>`;
}

function guideCard(list, title) {
  return `<section class="card"><div class="card-head"><h2>${title}</h2></div>${list
    .map((g) => `<a class="guide" href="${g.url}" ${g.url.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}><span><b>${g.name}</b><small>${g.desc}</small></span>${icon(g.url.startsWith("tel") ? "phone" : "external")}</a>`)
    .join("")}</section>`;
}

// 달력 월 m의 절입일 (그 달 월주가 시작하는 날)
function jieStart(year, m) {
  const t = solarTermsOfYear(year)[(m - 1) * 2];
  const d = new Date(msFromJd(t.jd) + 9 * 3600000);
  return { month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

// 절기 기준 "지금 달": 그 달 절입일 전이면 아직 지난달 월주다 (10/2는 한로 10/8 전 → 9월 정유월)
function sajuMonth(today) {
  const m = today.getMonth() + 1;
  const start = jieStart(today.getFullYear(), m);
  return today.getDate() < start.day && m > 1 ? m - 1 : m;
}

// 보는 해가 올해와 얼마나 떨어졌는지
function yearLabel(y, thisYear) {
  const d = y - thisYear;
  return d === 0 ? "올해" : d === -1 ? "작년" : d === 1 ? "내년" : d < 0 ? `${-d}년 전` : `${d}년 뒤`;
}

const birthYearOf = (model) => Number(model.saju.solarDate.slice(0, 4));

// ‹ 2025 · 2026 · 2027 › 연도 넘기기. base는 "#fortune" · "#monthly/wealth" 처럼 연도를 뺀 주소
function yearNav(base, yf, model) {
  const thisYear = model.today.getFullYear();
  const birth = birthYearOf(model);
  const min = Math.max(1900, birth);
  const link = (y, dir, label) =>
    y < min || y > 2100
      ? `<span class="icon-btn disabled" aria-hidden="true">${icon(dir)}</span>`
      : `<a class="icon-btn" href="${y === thisYear ? base : `${base}/${y}`}" aria-label="${label} ${y}년 보기">${icon(dir)}</a>`;
  return `<div class="year-nav">
      ${link(yf.year - 1, "chevronLeft", "이전 해")}
      <div class="yn-mid"><b>${yf.year} ${yf.ko}년</b><small>${yearLabel(yf.year, thisYear)} · ${yf.year - birth + 1}세</small></div>
      ${link(yf.year + 1, "chevronRight", "다음 해")}
    </div>
    ${yf.year !== thisYear ? `<p class="yn-back"><a href="${base}">올해(${thisYear}년)로 돌아가기</a></p>` : ""}`;
}

// 그해에 걸린 인생 주요 포인트 [{ ev, item }]
function eventsInYear(model, y) {
  return model.events.flatMap((ev) => ev.items.filter((it) => it.year === y).map((item) => ({ ev, item })));
}

function bestWorst(months, from, domainId) {
  const rest = months.filter((m) => m.month >= from);
  const best = rest.reduce((a, b) => (b.scores[domainId] > a.scores[domainId] ? b : a), rest[0]);
  const worst = rest.reduce((a, b) => (b.scores[domainId] < a.scores[domainId] ? b : a), rest[0]);
  return { best, worst };
}

// ── 1. 홈 ─────────────────────────────
export function renderHome(model) {
  const { today, natal, year, life, profile } = model;
  const hour = new Date().getHours();
  const greet = hour < 11 ? "좋은 아침이에요" : hour < 18 ? "좋은 오후예요" : "편안한 저녁이에요";
  const todayScore = dayScore(natal, today);
  const yesterday = dayScore(natal, new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));
  const delta = todayScore.score - yesterday.score;
  const cm = today.getMonth() + 1; // 달력 월
  const m = sajuMonth(today); // 절기 월
  const { best, worst } = bestWorst(year.months, m, "total");
  const bestStart = jieStart(year.year, best.month);
  const cur = life.points[life.currentIndex];
  const nextEvent = model.events
    .filter((ev) => ev.id !== "health")
    .flatMap((ev) => ev.items.filter((it) => it.year >= today.getFullYear()).map((it) => ({ ev, it })))
    .sort((a, b) => a.it.year - b.it.year)[0];

  // 다음 주 월~일
  const monday = new Date(today);
  monday.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7));
  const week = Array.from({ length: 7 }, (_, i) => dayScore(natal, new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)));
  const top2 = [...week].sort((a, b) => b.score - a.score).slice(0, 2).sort((a, b) => a.date - b.date);
  const sunday = week[6].date;

  const reports = [
    { href: "#life", name: "인생 그래프", icon: "trend", cls: "fill-accent", sub: "무료" },
    { href: "#monthly/wealth", name: "재물운", icon: "coin", cls: "fill-2", sub: `올해 ${year.scores.wealth}점` },
    { href: "#monthly/love", name: "연애·배우자", icon: "heart", cls: "fill-1", sub: `${bestWorst(year.months, m, "love").best.month}월 최고` },
    { href: "#job", name: "직업·자격증", icon: "briefcase", cls: "fill-dark", sub: `추천 ${certificates(natal).length}개` },
    { href: "#monthly/children", name: "자식운", icon: "sprout", cls: "fill-0", sub: `올해 ${year.scores.children}점` },
    { href: "#monthly/health", name: "건강운", icon: "pulse", cls: "fill-4", sub: `올해 ${year.scores.health}점` },
  ];

  return `
    <header class="greet">
      <div><small>${cm}월 ${today.getDate()}일 ${DOW[today.getDay()]}요일 · ${todayScore.ko}일</small>
      <h1>${esc(profile.name || "나")}님, ${greet}</h1>
      <a class="switch" href="#charts">${profile.sample ? "예시 명식" : esc(profile.relation || "본인")} · 명식 바꾸기 ${icon("next")}</a></div>
      <button class="icon-btn" data-action="theme" aria-label="화면 테마">${icon("palette")}</button>
    </header>
    ${sampleBanner(model)}
    <a class="ask" href="#fortune">${icon("search")}<span>올해 운세부터 확인해 보세요</span>${icon("plus")}</a>
    <div class="swipe">
      <article class="card score-card">
        <span class="ico">${icon("gem")}</span>
        <div><p class="sub">오늘의 운 · ${todayScore.ko}일 (${todayScore.stemGod})</p>
        <div class="big">${todayScore.score}<small>점</small></div>
        <span class="delta ${delta >= 0 ? "up" : "down"}">어제보다 ${delta >= 0 ? "+" : ""}${delta}</span></div>
      </article>
      <a class="card score-card" href="#monthly/total">
        <span class="ico" style="background:var(--now-soft);color:var(--now)">${icon("leaf")}</span>
        <div><p class="sub">${best.month === m ? "이번 달" : `${bestStart.month}월 ${bestStart.day}일부터`}</p>
        <div class="big text">올해 최고의 달</div>
        <span class="delta up" style="color:var(--accent)">${best.ko}월 ${best.scores.total}점 · 자세히</span></div>
      </a>
      <a class="card score-card" href="#life">
        <span class="ico" style="background:var(--wood-soft);color:var(--wood)">${icon("trend")}</span>
        <div><p class="sub">지금 대운 · ${cur ? ageRange(cur) : "-"}</p>
        <div class="big text">${cur ? cur.ko : "-"} 대운</div>
        <span class="delta" style="color:var(--accent)">${cur ? `${cur.score}점 · ${cur.band.name}` : ""}</span></div>
      </a>
      ${nextEvent ? `<a class="card score-card" href="#fortune/${nextEvent.it.year}">
        <span class="ico fill-${nextEvent.ev.color === "fire" ? 1 : nextEvent.ev.color === "water" ? 4 : 2}" style="color:#fff">${icon(nextEvent.ev.icon)}</span>
        <div><p class="sub">다가오는 인생 포인트 · ${nextEvent.it.year}년 (${nextEvent.it.age}세)</p>
        <div class="big text">${nextEvent.ev.name}</div>
        <span class="delta" style="color:var(--accent)">${nextEvent.it.score}점 · 그해 운세 보기</span></div>
      </a>` : ""}
    </div>

    <h2 class="section-title">나를 위한 리포트 <a href="#me">전체 보기</a></h2>
    <nav class="report-grid">
      ${reports.map((r) => `<a href="${r.href}"><span class="ico ${r.cls}">${icon(r.icon)}</span><b>${r.name}</b><small>${r.sub}</small></a>`).join("")}
    </nav>

    <h2 class="section-title">이번 달 꼭 알아둘 것</h2>
    <section class="card">
      <div class="rows">
        <a class="row" href="#monthly/total"><span class="badge bg-${STEMS[best.pillar.stem].element} el-${STEMS[best.pillar.stem].element}">${ELEMENTS[STEMS[best.pillar.stem].element].ko}</span>
          <span class="body"><b>${best.month === m ? `지금 ${best.ko}월` : `${bestStart.month}월 ${bestStart.day}일, ${best.ko}월 시작`}</b><small>${best.reason}</small></span><span class="score" style="color:var(--up)">${best.scores.total}점</span></a>
        <a class="row" href="#monthly/total"><span class="badge bg-${STEMS[worst.pillar.stem].element} el-${STEMS[worst.pillar.stem].element}">${ELEMENTS[STEMS[worst.pillar.stem].element].ko}</span>
          <span class="body"><b>${jieStart(year.year, worst.month).month}월 ${jieStart(year.year, worst.month).day}일 이후, ${worst.ko}월</b><small>${actionText("total", worst.scores.total)}</small></span><span class="score" style="color:var(--warn)">주의</span></a>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h2>다음 주 일진</h2><span class="sub">${week[0].date.getMonth() + 1}/${week[0].date.getDate()} ~ ${sunday.getMonth() + 1}/${sunday.getDate()}</span></div>
      <p class="lead">${top2.map((d) => DOW[d.date.getDay()]).join("·")}(${top2.map((d) => d.ko).join("·")})${josa(DOW[top2[1].date.getDay()], "이/가").slice(-1)} 가장 좋은 날이에요</p>
      ${barChart({ bars: week.map((d) => ({ label: DOW[d.date.getDay()], value: d.score, state: top2.includes(d) ? "future" : "past", show: top2.includes(d) })), height: 140, caption: "다음 주 일진 점수" })}
    </section>
    ${disclaimer()}`;
}

// ── 2. 운세 (한 해 한눈에) — 지난해 · 다음해도 볼 수 있다 ─────────────────────────────
export function renderFortune(model, yf) {
  const { today, natal } = model;
  const thisYear = today.getFullYear();
  const isCur = yf.year === thisYear;
  const isPast = yf.year < thisYear;
  const m = isCur ? sajuMonth(today) : isPast ? 13 : 0; // 이 달보다 앞은 "지난 달"
  const { best, worst } = bestWorst(yf.months, isCur ? m : 1, "total");
  const peakMonth = yf.months.reduce((a, b) => (b.scores.total > a.scores.total ? b : a));
  const strongest = ["wealth", "love", "career", "health"].reduce((a, b) => (yf.scores[b] > yf.scores[a] ? b : a));
  const stateOf = (mo) => (isCur ? (mo.month < m ? "past" : mo.month === m ? "now" : "future") : isPast ? "past" : "future");
  const [line1, line2] = isCur
    ? [`${STRONG_WORD[strongest]} 해, 남은 ${13 - m}달은`, `${best.month}월에 거두고 ${worst.month}월은 ${DOMAIN_CARE.total}`]
    : isPast
      ? [`${STRONG_WORD[strongest]} 해였어요`, `${best.month}월이 가장 좋았고 ${worst.month}월이 힘들었어요`]
      : [`${STRONG_WORD[strongest]} 해가 될 거예요`, `${best.month}월에 거두고 ${worst.month}월은 ${DOMAIN_CARE.total}`];

  // 그해부터 10년 중 재물 최고인지
  const decade = Array.from({ length: 10 }, (_, i) => {
    const idx = (((yf.year + i - 4) % 60) + 60) % 60;
    return scorePillar(natal, { stem: idx % 10, branch: idx % 12 }, "wealth").score;
  });
  const miniNote = (id, v) => {
    if (id === "wealth" && v >= Math.max(...decade)) return `<span class="up">10년 중 최고</span>`;
    if (v >= 75) return `<span class="up">아주 좋음</span>`;
    if (v >= 60) return `<span class="good">좋음</span>`;
    if (v >= 45) return `<span>보통</span>`;
    return `<span class="down">${id === "health" ? "검진 챙기기" : "관리 필요"}</span>`;
  };

  // 일진 달력: 올해면 이번 달, 다른 해면 그해 가장 좋은 달
  const calMonth = isCur ? today.getMonth() + 1 : best.month;
  const first = new Date(yf.year, calMonth - 1, 1);
  const last = new Date(yf.year, calMonth, 0).getDate();
  const days = Array.from({ length: last }, (_, i) => dayScore(natal, new Date(yf.year, calMonth - 1, i + 1)));
  const lv = (s) => (s >= 68 ? 4 : s >= 56 ? 3 : s >= 45 ? 2 : 1);
  const bestDays = [...days].sort((a, b) => b.score - a.score).slice(0, 4).sort((a, b) => a.date - b.date);
  const careDays = days.filter((d) => d.score < 40).slice(0, 3);
  const bestGods = [...new Set(bestDays.map((d) => d.stemGod))].slice(0, 2);
  const startDay = isCur ? new Date(today.getFullYear(), today.getMonth(), today.getDate()) : first;

  // 추천 일정: 직업 · 배우자 · 재물 점수가 가장 높은 날 (서로 다른 날)
  const used = new Set();
  const upcoming = (domain) => {
    const pick = days
      .filter((d) => d.date >= startDay && !used.has(d.date.getDate()))
      .map((d) => ({ ...d, s: dayScore(natal, d.date, domain) }))
      .sort((a, b) => b.s.score - a.s.score)[0];
    if (pick) used.add(pick.date.getDate());
    return pick;
  };
  const plans = [
    { d: upcoming("career"), title: "면접·지원서 제출", why: (d) => `${d.s.stemGod}일 · ${GOD_THEME[d.s.stemGod]}` },
    { d: upcoming("spouse"), title: "배우자·가족과 깊은 대화", why: (d) => `${d.s.stemGod}일 · 마음이 가까워지는 날` },
    { d: upcoming("wealth"), title: "가계부·지출 점검", why: (d) => `${d.s.stemGod}일 · 돈 흐름이 보이는 날` },
  ].filter((p) => p.d);

  // 그해의 인생 주요 포인트
  const hits = eventsInYear(model, yf.year);
  const eventCard = hits.length
    ? `<section class="card event-card">
        <div class="card-head"><h2>${yearLabel(yf.year, thisYear)}의 인생 포인트</h2><a class="sub" href="#life" style="color:var(--accent)">전체 보기</a></div>
        ${hits.map(({ ev, item }) => `<div class="event-hit"><span class="badge mkbg-${ev.id}">${icon(ev.icon)}</span><span><b>${ev.name} ${ev.pick === "low" ? "주의" : "가능성이 높은 해"}</b><small>${ev.phrase} · ${item.reason}</small></span><span class="score">${item.score}</span></div>`).join("")}
        ${hits.some((h) => h.ev.id === "health") ? `<p class="note">${HEALTH_NOTICE}</p>` : ""}
      </section>`
    : "";

  return `
    ${topbar("한 해 운세 한눈에")}
    ${sampleBanner(model)}
    ${yearNav("#fortune", yf, model)}
    <section class="card" style="text-align:center">
      ${gaugeChart({ value: yf.scores.total, caption: `${yf.year}년 종합운` })}
      <p style="font-weight:700;margin-top:4px">${line1}</p>
      <p style="font-weight:800;color:var(--accent)">${line2}</p>
      <div class="mini3">
        ${["wealth", "love", "health"].map((id) => `<div>${domainOf(id).short}<b>${yf.scores[id]}</b>${miniNote(id, yf.scores[id])}</div>`).join("")}
      </div>
    </section>
    ${eventCard}

    <section class="card">
      <div class="card-head"><h2>월별 종합운</h2><span class="sub">절기 기준</span></div>
      <p class="lead">${isCur ? `${peakMonth.month}월 정점, 남은 기회는 <b>${best.month}월 ${best.scores.total}점</b>` : `<b>${best.month}월 ${best.scores.total}점</b>이 가장 높고 ${worst.month}월이 가장 낮아요`}</p>
      ${barChart({ bars: yf.months.map((mo) => ({ label: mo.month, value: mo.scores.total, state: stateOf(mo), show: mo.month === m || mo === peakMonth || mo === best })), caption: `${yf.year}년 월별 종합운` })}
      <div class="legend">${isCur ? `<span><i class="past"></i>지난 달</span><span><i class="now"></i>지금 (${yf.months[m - 1].ko}월)</span><span><i class="future"></i>남은 달</span>` : `<span><i class="${isPast ? "past" : "future"}"></i>${isPast ? "지난 해" : "다가올 해"} 월별 점수</span>`}</div>
      <a class="more" href="#monthly/total${isCur ? "" : `/${yf.year}`}">영역별 월 흐름 보기</a>
    </section>

    <section class="card">
      <div class="card-head"><h2>${isCur ? "" : `${yf.year}년 `}${calMonth}월 일진 달력</h2><span class="sub">${isCur ? "진할수록 좋은 날" : "그해 가장 좋은 달"}</span></div>
      <div class="cal">
        ${DOW.map((d) => `<span class="dow">${d}</span>`).join("")}
        ${"<span></span>".repeat(first.getDay())}
        ${days.map((d) => `<span class="d lv${lv(d.score)} ${isCur && dateKey(d.date) === dateKey(today) ? "today" : ""}" title="${d.ko}일 ${d.score}점">${d.date.getDate()}<small>${d.ko}</small></span>`).join("")}
      </div>
      <div class="cal-legend"><span>주의 <i style="background:var(--surface-2)"></i><i style="background:var(--bar)"></i><i style="background:var(--bar-strong)"></i><i style="background:var(--accent)"></i> 최고</span>${isCur ? `<span><i style="width:10px;height:10px;border-radius:50%;border:2px solid var(--now)"></i> 오늘</span>` : ""}</div>
      <p class="note">${bestGods.join("·")} 날이 가장 좋아요. ${bestDays.map((d) => `${d.date.getDate()}일`).join(", ")}에 중요한 약속을 잡으세요.${careDays.length ? ` ${careDays.map((d) => `${d.date.getDate()}일`).join(", ")}은 큰 결정을 미루세요.` : ""}</p>
    </section>

    ${plans.length ? `<h2 class="section-title">${isCur ? "이번 달" : `${yf.year}년 ${calMonth}월`} 추천 일정</h2>
    ${plans.map((p) => `<section class="card plan"><span class="date"><span><small>${calMonth}월</small><b>${p.d.date.getDate()}</b></span></span><div><p>${p.title}</p><small>${p.d.ko}일 · ${p.why(p.d)}</small></div></section>`).join("")}` : ""}
    ${disclaimer()}`;
}

// ── 3. 월별 흐름 (영역 탭) — 연도 선택 ─────────────────────────────
export function renderMonthly(model, domainId = "total", yf) {
  const { today } = model;
  const thisYear = today.getFullYear();
  const isCur = yf.year === thisYear;
  const isPast = yf.year < thisYear;
  const domain = domainOf(domainId) || domainOf("total");
  const id = domain.id;
  const m = isCur ? sajuMonth(today) : isPast ? 13 : 0;
  const now = isCur ? yf.months[m - 1] : null;
  const { best, worst } = bestWorst(yf.months, isCur ? m : 1, id);
  const peak = yf.months.reduce((a, b) => (b.scores[id] > a.scores[id] ? b : a));
  const bs = jieStart(yf.year, best.month);
  const ws = jieStart(yf.year, worst.month);
  const ySuffix = isCur ? "" : `/${yf.year}`;
  const tabs = DOMAINS.map((d) => `<a href="#monthly/${d.id}${ySuffix}" class="${d.id === id ? "on" : ""}">${d.short}</a>`).join("");
  const stateOf = (mo) => (isCur ? (mo.month < m ? "past" : mo.month === m ? "now" : "future") : isPast ? "past" : "future");

  const tagOf = (mo) => {
    if (isCur && mo.month === m) return `<span class="chip now">지금</span>`;
    if (mo === peak) return `<span class="chip up">${isPast ? "가장 좋았던 달" : "그해 정점"}</span>`;
    if (mo === best) return `<span class="chip up">적극적으로</span>`;
    if (mo === worst) return `<span class="chip warn">${isPast ? "힘들었던 달" : DOMAIN_CARE[id]}</span>`;
    return `<span class="chip">${mo.scores[id]}점</span>`;
  };
  const headline = isCur
    ? `${best.month === m ? "지금이 남은 해의 최고점," : `한 번 더 오르는 ${best.month}월,`}<br>${worst.month}월은 <em>${DOMAIN_CARE[id]}</em>`
    : isPast
      ? `${best.month}월이 가장 좋았고,<br>${worst.month}월은 <em>힘들었어요</em>`
      : `${best.month}월에 힘을 싣고,<br>${worst.month}월은 <em>${DOMAIN_CARE[id]}</em>`;

  return `
    ${topbar("월별 흐름")}
    ${yearNav(`#monthly/${id}`, yf, model)}
    <nav class="tabs">${tabs}</nav>
    <p class="eyebrow">${isCur ? `지금 ${m}월 ${now.ko}월 · ${domain.short} ${now.scores[id]}점` : `${yf.year} ${yf.ko}년 · ${domain.short} ${yf.scores[id]}점`}</p>
    <p class="headline">${headline}</p>
    <section class="card">
      ${barChart({ bars: yf.months.map((mo) => ({ label: mo.month, value: mo.scores[id], state: stateOf(mo), show: mo.month === m || mo === peak || mo === best })), caption: `${yf.year}년 ${domain.name} 월별 점수` })}
      <div class="legend">${isCur ? `<span><i class="past"></i>지난 달</span><span><i class="now"></i>지금</span><span><i class="future"></i>남은 달</span>` : `<span><i class="${isPast ? "past" : "future"}"></i>${yf.year}년 월별 점수</span>`}</div>
    </section>
    <div class="pair">
      <section class="card"><span class="sub">${isPast ? "좋았던 달" : "상승 기회"}</span><b>${best.month}월 ${best.ko}월</b><span class="sub">${bs.month}월 ${bs.day}일부터 · ${best.scores[id]}점</span></section>
      <section class="card"><span class="sub">${isPast ? "힘들었던 달" : "조심할 때"}</span><b>${worst.month}월 ${worst.ko}월</b><span class="sub">${ws.month}월 ${ws.day}일부터 · ${worst.scores[id]}점</span></section>
    </div>
    <h2 class="section-title">${isPast ? "달마다 이랬어요" : "달마다 이렇게 보내세요"}</h2>
    ${yf.months.filter((mo) => !isCur || mo.month >= m).map((mo) => `
      <article class="month-card ${isCur && mo.month === m ? "now" : ""}">
        <div class="top"><b>${mo.month}월 · ${mo.ko}${isCur && mo.month === m ? " (지금)" : ""}</b>${tagOf(mo)}</div>
        <p>${mo.reason}.${isPast ? "" : ` ${actionText(id, mo.scores[id])}`}</p>
      </article>`).join("")}
    ${isPast ? "" : actionCard(id, isCur ? now.scores[id] : yf.scores[id], isCur ? "지금 할 일" : `${yf.year}년에 할 일`)}
    ${id === "career" ? guideCard(GUIDES.career, "실천 가이드") : ""}
    ${id === "health" ? `<p class="note">${HEALTH_NOTICE}</p>${guideCard(GUIDES.health, "건강 챙기기")}` : ""}
    ${id === "wealth" ? `<section class="card"><div class="card-head"><h2>스스로 점검할 것</h2></div><p style="font-size:14px">특정 종목·매수·매도를 추천하지 않아요. 돈이 움직이는 달에는 <b>투자 이유</b>, <b>세금</b>, <b>자금 용도</b>를 먼저 적어 보세요.</p></section>` : ""}
    ${disclaimer()}`;
}

// ── 4. 인생 그래프 + 인생 주요 포인트 ─────────────────────────────
export function renderLife(model, selected = -1) {
  const { life, natal, events, today } = model;
  const pts = life.points;
  const ci = life.currentIndex;
  const cur = pts[ci] || pts[0];
  const peakIndex = pts.indexOf(life.peak);
  const sel = selected >= 0 ? pts[selected] : cur;
  const headline = peakIndex === ci
    ? `지금이 인생의<br><em>정점</em>이에요`
    : `지금은 ${cur.band.name === "전성기" ? "전성기" : cur.band.phrase},<br><em>${life.peak.startAge}세</em>에 정점을 찍어요`;
  const summary = natal.summary
    .replace(elementLabel(natal.yong), `<b class="el-${natal.yong}">${elementLabel(natal.yong)}</b>`)
    .replace(elementLabel(natal.hee), `<b class="el-${natal.hee}">${elementLabel(natal.hee)}</b>`);

  // 그래프 아래 줄마다 이벤트 표시 (대운 시작 나이 → 그래프 가로 위치)
  const first = pts[0].startAge;
  const markers = events.flatMap((ev, lane) =>
    ev.items.map((it) => ({
      pos: Math.min(pts.length - 1, Math.max(0, (it.age - first) / 10)),
      lane,
      cls: `mk-${ev.id}`,
      label: ev.short.slice(0, 1),
      past: it.past,
      title: `${it.year}년 ${it.age}세 · ${ev.name} ${it.score}점`,
    })),
  );
  const upcoming = events
    .flatMap((ev) => ev.items.filter((it) => !it.past).map((it) => ({ ev, it })))
    .sort((a, b) => a.it.year - b.it.year);

  return `
    ${topbar("인생 그래프")}
    ${sampleBanner(model)}
    <p class="eyebrow">지금 ${ageRange(cur)} · ${cur.ko} 대운</p>
    <p class="headline">${headline}</p>
    <section class="card">
      <div class="legend" style="margin:0 0 4px"><span><i class="future"></i>대운 흐름</span><span><i class="now"></i>지금</span><span>점을 누르면 풀이가 나와요</span></div>
      <div data-chart="life">${lineChart({
        values: pts.map((p) => p.score),
        labels: pts.map((p) => p.startAge),
        current: ci,
        peak: peakIndex,
        selected,
        futureFrom: ci > 0 ? ci : null,
        band: peakIndex !== ci ? [peakIndex, peakIndex, "가장 좋은 10년"] : null,
        markers,
        height: 200,
        caption: "대운별 인생 점수와 인생 주요 포인트",
      })}</div>
      <div class="legend mk-legend">${events.map((ev) => `<span><i class="mkbg-${ev.id}"></i>${ev.name}</span>`).join("")}<span class="muted-past">흐린 점 = 지난 해</span></div>
      <div class="chart-tip"><b>${ageRange(sel)} ${sel.ko}</b> · ${sel.score}점 · ${sel.band.name}<br>${sel.reason}</div>
    </section>

    <h2 class="section-title">인생 주요 포인트</h2>
    ${upcoming.length ? `<p class="lead" style="margin:-4px 0 10px!important">다음 포인트는 <b>${upcoming[0].it.year}년(${upcoming[0].it.age}세) ${upcoming[0].ev.name}</b>이에요</p>` : ""}
    <section class="card">
      ${events.map((ev) => `
        <div class="event-row">
          <span class="badge mkbg-${ev.id}">${icon(ev.icon)}</span>
          <div class="grow"><b>${ev.name}</b><small>${ev.phrase}</small>
            <div class="chips">${ev.items.map((it) => `<a class="chip ${it.past ? "past" : it.now ? "now" : ev.pick === "low" ? "warn" : "up"}" href="#fortune${it.year === today.getFullYear() ? "" : `/${it.year}`}">${it.year}년 · ${it.age}세 · ${it.score}점${it.past ? " (지남)" : it.now ? " (올해)" : ""}</a>`).join("")}</div>
          </div>
        </div>`).join("")}
      <p class="note">해마다 대운(40%)과 그해 세운(60%)의 영역 점수에 그해 십신·일지 합·도화를 더해 고른 해예요. 누르면 그해 운세로 가요. ${HEALTH_NOTICE}</p>
    </section>

    <section class="card" style="background:var(--accent-soft)">
      <p class="sub" style="margin-bottom:6px">한 줄 요약</p>
      <p style="font-size:15px;font-weight:600">${summary}</p>
    </section>
    <h2 class="section-title">시기별 풀이</h2>
    <section class="card"><div class="rows">
      ${pts.map((p, i) => `
        <div class="row ${i === ci ? "now" : ""}"><span class="when">${ageRange(p)}</span>
          <span class="body"><b>${p.ko} · ${GOD_THEME[p.stemGod]}${i === ci ? ", 지금" : ""}</b><small>${p.band.phrase} · ${p.reason}</small></span>
          <span class="score" style="${i === peakIndex ? "color:var(--accent)" : ""}">${p.score}</span></div>`).join("")}
    </div></section>
    ${actionCard("total", cur.score)}
    <a class="btn soft" href="#monthly/total">이 시기 더 알아보기 (월별 흐름)</a>
    ${disclaimer()}`;
}

// ── 5. 맞는 일 ─────────────────────────────
export function renderJob(model) {
  const { natal, life } = model;
  const fit = jobFit(natal);
  const certs = certificates(natal, 5);
  const groups = godGroups(natal).sort((a, b) => b.count - a.count);
  const top = groups[0];
  const cur = life.points[life.currentIndex] || life.points[0];
  const next = life.points[life.currentIndex + 1];
  const wpNow = workplaceFit(natal, cur);
  const wpNext = next ? workplaceFit(natal, next) : null;
  const jobColor = (name) => `fill-${fit.findIndex((j) => j.name === name) % 5}`;

  return `
    ${topbar("나에게 맞는 일")}
    ${sampleBanner(model)}
    <section class="card hero">
      <span class="chip">${top.name} ${top.count}개 · ${top.meaning}의 사주</span>
      <p class="headline" style="color:#fff;margin:12px 0 8px">${fit[0].name},<br>${fit[1].name} 쪽이 잘 맞아요</p>
      <p class="sub">지금은 ${GOD_THEME[cur.stemGod]}의 시기${next ? `, ${next.startAge}세부터는 ${GOD_THEME[next.stemGod]}로 넓혀 가요.` : "예요."}</p>
    </section>
    <section class="card">
      <div class="card-head"><h2>직종 적합도</h2><span class="sub">100점 기준</span></div>
      ${hBars(fit.slice(0, 6).map((j, i) => ({ label: j.name, value: j.score, fillClass: i < 2 ? "" : i < 4 ? "weak" : "soft-only" })))}
      <p class="note">${josa(`${top.name}(${top.meaning})`, "이/가")} 가장 많아서 ${fit[0].name} 계열 점수가 높게 나왔어요.</p>
    </section>
    ${wpNext ? `<section class="card">
      <div class="card-head"><h2>맞는 직장 유형</h2><span class="sub">지금 ${cur.ko} → ${next.startAge}세 ${next.ko}</span></div>
      ${compareBars(wpNow.map((w, i) => ({ label: w.name, a: w.score, b: wpNext[i].score })))}
      <div class="legend"><span><i class="past"></i>지금 대운</span><span><i class="future"></i>다음 대운</span></div>
    </section>` : ""}
    <section class="card">
      <div class="card-head"><h2>추천 자격증</h2><span class="sub">직종 적합도 순</span></div>
      <div class="rows">${certs.map((c, i) => `
        <div class="row"><span class="num ${jobColor(c.job)}" style="color:#fff">${i + 1}</span>
          <span class="body"><b>${c.name}</b><small>${c.job} · ${c.desc}</small></span><span class="score">${c.score}</span></div>`).join("")}
      </div>
    </section>
    ${guideCard(GUIDES.career, "실천 가이드")}
    ${disclaimer()}`;
}

// ── 6. 나의 기질 리포트 ─────────────────────────────
export function renderMe(model, theme, account) {
  const { natal, life, saju } = model;
  const dmInfo = DAY_MASTER[natal.dm];
  const cur = life.points[life.currentIndex] || life.points[0];
  const next = life.points[life.currentIndex + 1];
  const radarIds = ["wealth", "career", "spouse", "children", "love", "health"];
  const axes = radarIds.map((id) => ({ label: domainOf(id).short, value: cur.domains[id] }));
  const low = axes.reduce((a, b) => (b.value < a.value ? b : a));
  const high = axes.reduce((a, b) => (b.value > a.value ? b : a));
  const total = natal.elementCount.reduce((a, b) => a + b, 0);
  const order = [0, 1, 2, 3, 4].sort((a, b) => natal.elementCount[b] - natal.elementCount[a]);
  const topEl = order[0];
  const zeros = order.filter((e) => natal.elementCount[e] === 0);
  const monthBranch = BRANCHES[saju.pillars.month.branch];
  const season = Object.values(JOHU).find((j) => j.branches.includes(saju.pillars.month.branch));
  const health = healthCheck(natal);
  const watch = [...health].sort((a, b) => b.value - a.value).slice(0, 2);

  return `
    ${topbar("나의 기질 리포트", `<button class="icon-btn" data-action="theme" aria-label="화면 테마">${icon("palette")}</button>`)}
    ${sampleBanner(model)}
    <p class="eyebrow">${natal.dmName} 일간 · ${season ? season.label + " " : ""}${monthBranch.ko}월생 · ${natal.strong ? "신강" : "신약"}</p>
    <p class="headline">${dmInfo.image} 같은 사람</p>

    <section class="card">
      <div class="card-head"><h2>지금 대운의 영역별 운</h2></div>
      <p class="lead">${cur.ko} 대운 ${ageRange(cur)} · 100점 기준</p>
      ${radarChart({ axes })}
      <p class="note">${josa(high.label, "은/는")} 잘 풀리는데 <b>${low.label}</b>${josa(low.label, "이/가").slice(-1)} 가장 낮아요. ${actionText(radarIds[axes.indexOf(low)], low.value)}</p>
    </section>

    <section class="card">
      <div class="card-head"><h2>타고난 오행 비율</h2><span class="sub">겉으로 드러난 ${total}글자</span></div>
      <div class="donut-wrap">
        ${donutChart({ segs: order.map((e) => ({ value: natal.elementCount[e], cls: `stroke-${e}` })), center: ["가장 많은", `${ELEMENTS[topEl].ko} ${natal.elementCount[topEl]}개`] })}
        <ul class="donut-legend">${order.map((e) => `<li class="${natal.elementCount[e] ? "" : "zero"}"><i class="fill-${e}"></i><span>${ELEMENTS[e].ko} · ${GROUP_WORD[elementGroupId(natal, e)]}</span><b>${Math.round((natal.elementCount[e] / total) * 100)}%</b></li>`).join("")}</ul>
      </div>
      <p class="note">${josa(`${GROUP_WORD[elementGroupId(natal, topEl)]}(${ELEMENTS[topEl].ko})`, "이/가")} 가장 많고${zeros.length ? ` ${josa(zeros.map((e) => `${GROUP_WORD[elementGroupId(natal, e)]}(${ELEMENTS[e].ko})`).join("·"), "이/가")} 비어 있어요` : " 다섯 기운이 모두 있어요"}. 용신은 <b>${elementLabel(natal.yong)}</b>, 희신은 ${josa(elementLabel(natal.hee), "이에요/예요")}.</p>
    </section>

    <section class="card">
      <div class="card-head"><h2>인생 흐름</h2><a class="sub" href="#life" style="color:var(--accent)">자세히</a></div>
      <p class="lead">지금(${cur.score})에서 <b>${life.peak.startAge}세 ${life.peak.score}점</b>까지 ${life.peak.score > cur.score ? "계속 올라가요" : "이어져요"}</p>
      ${lineChart({ values: life.points.map((p) => p.score), labels: life.points.map((p) => p.startAge), current: life.currentIndex, peak: life.points.indexOf(life.peak), futureFrom: life.currentIndex > 0 ? life.currentIndex : null, height: 150, caption: "인생 흐름" })}
    </section>

    ${next ? `<section class="card">
      <div class="card-head"><h2>지금 vs 다음 대운</h2></div>
      <div class="legend" style="margin:0 0 12px"><span><i class="past"></i>지금 ${cur.ko}</span><span><i class="future"></i>${next.startAge}세 ${next.ko}</span></div>
      ${compareBars(["wealth", "career", "children", "spouse"].map((id) => ({ label: domainOf(id).short, a: cur.domains[id], b: next.domains[id] })))}
    </section>` : ""}

    <section class="card" id="health">
      <div class="card-head"><h2>타고난 건강 체크</h2><span class="sub">높을수록 신경 쓸 곳</span></div>
      ${hBars(health.map((h) => ({ label: `${h.label}`, value: h.value, right: `${h.state} · ${h.value}`, fillClass: h.value >= 60 ? "now" : h.value >= 40 ? "" : "weak" })))}
      <p class="note">${watch.map((h) => `<b>${ELEMENTS[h.element].ko}(${h.state})</b> ${h.tip}.`).join(" ")} 지금 대운 건강운은 ${cur.domains.health}점이에요. ${actionText("health", cur.domains.health)}</p>
      <p class="note">${HEALTH_NOTICE}</p>
    </section>
    ${guideCard(GUIDES.health, "건강 챙기기")}

    <section class="card">
      <div class="card-head"><h2>화면 테마</h2><span class="sub">그래프 색이 함께 바뀌어요</span></div>
      <div class="themes">${themeButtons(theme)}</div>
    </section>
    ${accountCard(account)}
    <a class="btn soft" href="#charts">${icon("list", 'style="width:18px;height:18px"')}명식 목록 · 가족 명식 관리</a>
    ${disclaimer()}`;
}

export function themeButtons(theme) {
  return [
    { id: "lavender", name: "라벤더", sw: "linear-gradient(135deg,#e3dcfa,#5b3fd9)" },
    { id: "mint", name: "민트", sw: "linear-gradient(135deg,#d3f1e6,#138a72)" },
    { id: "peach", name: "피치", sw: "linear-gradient(135deg,#ffdcd5,#df4f68)" },
    { id: "dark", name: "다크", sw: "linear-gradient(135deg,#1d2370,#0d1030)" },
  ].map((t) => `<button data-action="set-theme" data-theme-id="${t.id}" class="${t.id === theme ? "on" : ""}"><span class="sw" style="background:${t.sw}"></span>${t.name}</button>`).join("");
}

// ── 7. 명식 결과 (표 보기 / 아이콘 보기) ─────────────────────────────
export function renderChart(model, mode = "table") {
  const { saju, natal, profile, year } = model;
  const P = saju.pillars;
  const order = [["hour", "시주"], ["day", "일주"], ["month", "월주"], ["year", "연주"]];
  const lunar = saju.lunar;
  const [sy, sm, sd] = saju.solarDate.split("-");
  const dateLine = `양 ${sy}.${sm}.${sd} · 음 ${String(lunar.month).padStart(2, "0")}.${String(lunar.day).padStart(2, "0")}${lunar.leap ? "(윤)" : ""} · ${profile.time || "시간 모름"}`;
  const cur = saju.daeun.list.find((d) => d.current);
  const notices = saju.notices.filter((n) => n.level === "warn");

  const head = `
    <header class="profile">
      <button class="icon-btn" data-action="back" aria-label="뒤로">${icon("back")}</button>
      <div class="grow"><h1><span class="age">${saju.koreanAge}세</span> ${esc(profile.name || "이름 없음")}</h1><small>${dateLine}</small></div>
      <a class="icon-btn" href="#manse/edit" aria-label="이 명식 수정">${icon("edit")}</a>
      <a class="icon-btn" href="#charts" aria-label="명식 목록">${icon("list")}</a>
    </header>
    ${sampleBanner(model)}
    <div class="toggle" role="tablist">
      <button data-action="chart-mode" data-mode="table" class="${mode === "table" ? "on" : ""}" role="tab" aria-selected="${mode === "table"}">${icon("table")}표 보기</button>
      <button data-action="chart-mode" data-mode="icon" class="${mode === "icon" ? "on" : ""}" role="tab" aria-selected="${mode === "icon"}">${icon("apps")}아이콘 보기</button>
    </div>
    ${notices.length ? `<ul class="notices">${notices.map((n) => `<li class="warn">${esc(n.text)}</li>`).join("")}</ul>` : ""}`;

  const links = `
    <div class="link-row">
      <a class="btn small" href="#life">인생 그래프</a>
      <a class="btn small soft" href="#monthly/total">올해 월별 흐름</a>
      <a class="btn small soft" href="#job">맞는 직업</a>
    </div>
    <p class="disclaimer">${profile.time ? "" : "시간을 모르면 시주를 비워두고 세 기둥으로 해석해요. "}${DISCLAIMER}</p>`;

  if (mode === "icon") return head + renderChartIcons(model) + links;

  const tile = (p, part) => {
    if (!p) return `<div class="tile empty">?</div>`;
    const idx = part === "stem" ? p.stem : p.branch;
    const info = part === "stem" ? STEMS[idx] : BRANCHES[idx];
    const e = info.element;
    return `<div class="tile bg-${e} el-${e}">${info.han}<small>${info.ko}${ELEMENTS[e].ko}</small></div>`;
  };
  const cell = (p, fn, cls = "sm") => `<div class="${cls}">${p ? fn(p) : "·"}</div>`;
  const daeunDesc = [...saju.daeun.list].reverse();

  return head + `
    <section class="card">
      <div class="pillar-table">
        <span></span>${order.map(([, n]) => `<div class="h">${n}</div>`).join("")}
        <span class="h">십성</span>${order.map(([k]) => cell(P[k], (p) => `<span class="god ${k === "day" ? "me" : ""}">${k === "day" ? "본원" : p.stemGod}</span>`)).join("")}
        <span class="h">천간</span>${order.map(([k]) => tile(P[k], "stem")).join("")}
        <span class="h">지지</span>${order.map(([k]) => tile(P[k], "branch")).join("")}
        <span class="h">십성</span>${order.map(([k]) => cell(P[k], (p) => `<span class="god">${p.branchGod}</span>`)).join("")}
        <span class="h">지장간</span>${order.map(([k]) => cell(P[k], (p) => p.hidden.map((h) => h.han).join(""))).join("")}
        <span class="h">12운성</span>${order.map(([k]) => cell(P[k], (p) => p.stage)).join("")}
      </div>
    </section>
    <section class="card">
      <div class="card-head"><h2>대운</h2><span class="sub">대운수 ${saju.daeun.number} · ${saju.daeun.forward ? "순행" : "역행"}</span></div>
      <div class="daeun-strip">${daeunDesc.map((d) => `
        <div class="col ${d.current ? "now" : ""}"><div class="age">${d.startAge}</div>
          <div class="cell bg-${STEMS[d.stem].element} el-${STEMS[d.stem].element}">${STEMS[d.stem].ko}</div>
          <div class="cell bg-${BRANCHES[d.branch].element} el-${BRANCHES[d.branch].element}">${BRANCHES[d.branch].ko}</div></div>`).join("")}
      </div>
    </section>
    <div class="pair">
      <section class="card"><span class="sub">지금 대운 ${cur ? ageRange(cur) : ""}</span><b>${cur ? `${cur.ko} · ${cur.stemGod}` : "-"}</b><span class="sub">${cur ? `${GOD_THEME[cur.stemGod]}이 커지는 10년` : ""}</span></section>
      <section class="card"><span class="sub">올해 ${year.year}</span><b>${saju.seun.ko} · ${saju.seun.stemGod}</b><span class="sub">${GOD_THEME[saju.seun.stemGod]} · 종합 ${year.scores.total}점</span></section>
    </div>` + links;
}

function renderChartIcons(model) {
  const { saju, natal } = model;
  const P = saju.pillars;
  const dmEl = STEMS[natal.dm].element;
  const info = DAY_MASTER[natal.dm];
  const groups = godGroups(natal);
  const total = natal.elementCount.reduce((a, b) => a + b, 0);
  const many = [0, 1, 2, 3, 4].filter((e) => natal.elementCount[e] >= 3);
  const none = [0, 1, 2, 3, 4].filter((e) => natal.elementCount[e] === 0);
  const topGroup = [...groups].sort((a, b) => b.count - a.count)[0];
  const keywords = [...info.keywords, topGroup.meaning.split("·")[0] + " 중심", natal.strong ? "주관 뚜렷" : "협력형", natal.johu ? `${natal.johu.label}생` : "온화한 계절"];

  const pillarCard = (key) => {
    const p = P[key];
    if (!p) return `<section class="card"><small>${PILLAR_ROLE[key]}</small><div class="icons"><span class="bg-3">?</span><span class="bg-3">?</span></div><b>시간 모름</b><small>시간을 알면 채워져요</small></section>`;
    const se = STEMS[p.stem].element;
    const be = BRANCHES[p.branch].element;
    return `<section class="card ${key === "day" ? "me" : ""}"><small>${PILLAR_ROLE[key]}</small>
      <div class="icons"><span class="bg-${se} el-${se}">${icon(ELEMENT_ICONS[se])}</span><span class="bg-${be} el-${be}">${icon(ELEMENT_ICONS[be])}</span></div>
      <b>${pillarKo(p)} · ${COLOR_WORD[se]} ${BRANCHES[p.branch].animal}</b><small>${key === "day" ? "본원" : p.stemGod} · ${p.branchGod}</small></section>`;
  };

  return `
    <section class="card">
      <div class="essence"><span class="orb bg-${dmEl} el-${dmEl}">${icon(ELEMENT_ICONS[dmEl])}</span>
        <div><p class="sub">나의 본질 · ${natal.dmName}</p><h2>${info.image}</h2><p>${info.desc}</p></div></div>
    </section>
    <h2 class="section-title">네 기둥</h2>
    <div class="pillar-cards">${["year", "month", "day", "hour"].map(pillarCard).join("")}</div>
    <section class="card" style="margin-top:14px">
      <div class="card-head"><h2>오행 균형</h2><span class="sub">겉으로 드러난 ${total}글자</span></div>
      <div class="five">${ELEMENTS.map((el, e) => `<div class="${natal.elementCount[e] ? "" : "zero"}"><span class="orb bg-${e} el-${e}">${icon(ELEMENT_ICONS[e])}</span><small>${el.ko}</small><b class="el-${e}">${natal.elementCount[e]}</b></div>`).join("")}</div>
      <p class="note">${many.length ? `${many.map((e) => josa(ELEMENTS[e].ko, "이/가")).join(" ")} 강하고` : "고르게 퍼져 있고"}${none.length ? ` ${none.map((e) => ELEMENTS[e].ko).join("·")}${josa(none.map((e) => ELEMENTS[e].ko).at(-1), "이/가").slice(-1)} 비어 있어요.` : " 비어 있는 기운이 없어요."} 부족한 기운은 생활 습관으로 채워 주세요.</p>
    </section>
    <section class="card">
      <div class="card-head"><h2>십성 5그룹</h2><span class="sub">일간을 뺀 글자 수</span></div>
      <div class="five">${groups.map((g) => `<div class="${g.count ? "" : "zero"}"><span class="orb" style="background:var(--accent-soft);color:var(--accent)">${icon(g.icon)}</span><small>${g.name}·${g.meaning.split("·")[0]}</small><b>${g.count}</b></div>`).join("")}</div>
    </section>
    <section class="card">
      <div class="card-head"><h2>기질 키워드</h2></div>
      <div class="chips">${keywords.map((k) => `<span class="chip">${k}</span>`).join("")}</div>
    </section>`;
}

// ── 8. 만세력 입력 ─────────────────────────────
export function renderManse(chart, error = "") {
  const p = chart || { relation: "본인", gender: "F", calendar: "solar", date: "", time: "", city: "서울", longitude: 126.98, applyDst: true };
  const calValue = p.calendar === "lunar" ? (p.leap ? "leap" : "lunar") : "solar";
  const [y, mo, d] = p.date ? p.date.split("-").map(Number) : [0, 0, 0];
  const unknown = p.time === null && Boolean(p.date);
  const [hh, mm] = p.time ? p.time.split(":").map(Number) : [-1, 0];
  const radio = (name, value, label, checked) => `<label><input type="radio" name="${name}" value="${value}" ${checked ? "checked" : ""}><span>${label}</span></label>`;
  return `
    ${topbar(chart ? "명식 수정" : "새 명식 추가")}
    <p class="headline">태어난 날을 알려주세요</p>
    <p class="lead" style="margin-top:-12px!important">시간을 몰라도 연·월·일 세 기둥으로 풀어드려요</p>
    <form class="form" id="manseForm" novalidate>
      <div class="two">
        <label class="field"><span>이름 (선택)</span><input class="input" name="name" maxlength="20" value="${esc(p.name || "")}" placeholder="이름 또는 별명"></label>
        <label class="field"><span>나와의 관계</span><select class="input" name="relation">${RELATIONS.map((r) => `<option ${r === (p.relation || "본인") ? "selected" : ""}>${r}</option>`).join("")}</select></label>
      </div>
      <label class="check consent" data-consent ${(p.relation || "본인") === "본인" ? "hidden" : ""}><input type="checkbox" name="consent" ${p.consent ? "checked" : ""}> 이 명식의 주인에게 생년월일시 저장 동의를 받았어요</label>
      <fieldset class="field"><legend>성별</legend><div class="seg">${radio("gender", "M", "남자", p.gender === "M")}${radio("gender", "F", "여자", p.gender !== "M")}</div></fieldset>
      <fieldset class="field"><legend>달력</legend><div class="seg">${radio("calendar", "solar", "양력", calValue === "solar")}${radio("calendar", "lunar", "음력", calValue === "lunar")}${radio("calendar", "leap", "음력 윤달", calValue === "leap")}</div></fieldset>
      <fieldset class="field"><legend>생년월일</legend>
        <div class="ymd">
          <select class="input" name="year" aria-label="태어난 해">${yearOptions(y)}</select>
          <select class="input" name="month" aria-label="태어난 달"><option value="">월</option>${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${i + 1 === mo ? "selected" : ""}>${i + 1}월</option>`).join("")}</select>
          <select class="input" name="day" aria-label="태어난 날">${dayOptions(calValue, y, mo, d)}</select>
        </div>
        <p class="date-hint" data-date-hint>${dateHint(calValue, y, mo, d)}</p>
      </fieldset>
      <fieldset class="field"><legend>태어난 시각</legend>
        <div class="two">
          <select class="input" name="hour" aria-label="시" ${unknown ? "disabled" : ""}><option value="">시</option>${Array.from({ length: 24 }, (_, h) => `<option value="${h}" ${h === hh ? "selected" : ""}>${h < 12 ? "오전" : "오후"} ${h % 12 === 0 ? 12 : h % 12}시 (${String(h).padStart(2, "0")}시)</option>`).join("")}</select>
          <select class="input" name="minute" aria-label="분" ${unknown ? "disabled" : ""}>${Array.from({ length: 60 }, (_, mi) => `<option value="${mi}" ${mi === mm ? "selected" : ""}>${String(mi).padStart(2, "0")}분</option>`).join("")}</select>
        </div>
        <p class="date-hint" data-time-hint>${unknown ? "" : timeHint(hh, mm, p.longitude ?? 126.98)}</p>
      </fieldset>
      <label class="check"><input type="checkbox" name="unknownTime" ${unknown ? "checked" : ""}> 태어난 시간을 몰라요</label>
      <label class="field"><span>출생지 (시주 경도 보정)</span>
        <select class="input" name="city">${CITIES.map((c) => `<option value="${c.name}" ${c.name === p.city ? "selected" : ""}>${c.name}</option>`).join("")}<option value="" ${p.city ? "" : "selected"}>직접 입력 (경도)</option></select>
      </label>
      <label class="field" data-lon ${p.city ? "hidden" : ""}><span>경도 (동경, 도)</span><input class="input" type="number" name="longitude" step="0.01" min="120" max="135" value="${p.longitude ?? 126.98}"></label>
      <details class="more-opt"><summary>보정 설정</summary>
        <div class="form">
          <label class="check"><input type="checkbox" name="applyDst" ${p.applyDst !== false ? "checked" : ""}> 서머타임 기간(1948~51·55~60·87~88)이면 1시간 빼기</label>
          <label class="check"><input type="checkbox" name="nightZi" ${p.nightZi ? "checked" : ""}> 야자시 사용 (23시대 일주를 그날로)</label>
        </div>
      </details>
      <p class="sub" style="font-size:12px;color:var(--muted)">절기 경계일·서머타임·출생지 시차는 자동으로 보정하고, 결과가 갈릴 수 있으면 안내해 드려요.</p>
      ${error ? `<p class="form-error">${esc(error)}</p>` : ""}
      <button class="btn" type="submit">만세력 보기</button>
    </form>
    ${disclaimer()}`;
}

// ── 만세력 입력 도우미 (main.js가 값이 바뀔 때마다 다시 부른다) ─────────────────────────────
// 연도 목록: 올해부터 1900년까지, 10년 단위로 묶고 띠를 함께 보여준다 (띠는 입춘 기준이라 1~2월생은 다를 수 있음)
export function yearOptions(selected) {
  const thisYear = new Date().getFullYear();
  let html = `<option value="">연도</option>`;
  for (let decade = Math.floor(thisYear / 10) * 10; decade >= 1900; decade -= 10) {
    html += `<optgroup label="${decade}년대">`;
    for (let yy = Math.min(thisYear, decade + 9); yy >= decade; yy--) {
      html += `<option value="${yy}" ${yy === selected ? "selected" : ""}>${yy}년 (${BRANCHES[(((yy - 4) % 12) + 12) % 12].animal}띠)</option>`;
    }
    html += `</optgroup>`;
  }
  return html;
}

// 그 달의 날짜 목록: 양력은 실제 날수, 음력은 그 음력 달의 날수(29·30일)
export function dayOptions(cal, year, month, selected) {
  let days = 31;
  if (year && month) {
    days = cal === "solar" ? new Date(year, month, 0).getDate() : lunarMonthDays(year, month, cal === "leap") || 30;
  }
  let html = `<option value="">일</option>`;
  for (let dd = 1; dd <= days; dd++) {
    const dow = cal === "solar" && year && month ? ` (${DOW[new Date(year, month - 1, dd).getDay()]})` : "";
    html += `<option value="${dd}" ${dd === selected ? "selected" : ""}>${dd}일${dow}</option>`;
  }
  return html;
}

// 고른 날짜 확인 문구: 양력이면 요일 · 음력, 음력이면 양력으로 바꾼 날짜
export function dateHint(cal, year, month, day) {
  if (!year) return "연도 · 월 · 일을 차례로 골라 주세요";
  const leap = leapMonthOf(year);
  const leapText = leap ? `이 해 음력 윤달은 윤${leap}월이에요` : "이 해 음력에는 윤달이 없어요";
  if (!month || !day) return cal === "solar" ? "" : leapText;
  if (cal === "solar") {
    const l = solarToLunar(year, month, day);
    return `${year}년 ${month}월 ${day}일 ${DOW[new Date(year, month - 1, day).getDay()]}요일 · 음력 ${l.leap ? "윤" : ""}${l.month}월 ${l.day}일`;
  }
  if (cal === "leap" && leap !== month) return `<b class="warn-text">${year}년에는 윤${month}월이 없어요.</b> ${leapText}`;
  const s = lunarToSolar(year, month, day, cal === "leap");
  if (!s) return `<b class="warn-text">음력 ${year}년 ${month}월에는 ${day}일이 없어요.</b>`;
  return `양력으로 ${s.year}년 ${s.month}월 ${s.day}일 ${DOW[new Date(s.year, s.month - 1, s.day).getDay()]}요일이에요`;
}

// 고른 시각이 대략 어느 시(時)인지 (출생지 경도로 지방시를 맞춘 값, 서머타임·옛 표준시는 결과 화면에서 보정)
export function timeHint(hour, minute, longitude) {
  if (hour == null || hour < 0 || Number.isNaN(hour)) return "";
  const lmt = (hour * 60 + minute + Math.round((longitude / 15 - 9) * 60) + 1440) % 1440;
  const branch = Math.floor((lmt / 60 + 1) / 2) % 12;
  const shift = Math.round((9 - longitude / 15) * 60);
  return `${BRANCHES[branch].ko}시(${BRANCHES[branch].han}時) · 출생지 시차 ${shift}분을 뺀 지방시 ${String(Math.floor(lmt / 60)).padStart(2, "0")}:${String(lmt % 60).padStart(2, "0")} 기준`;
}

// ── 9. 로그인 카드 · 명식 목록 ─────────────────────────────
export function accountCard(account) {
  if (!account.ready) return `<section class="card account"><p class="sub">로그인 상태를 확인하는 중…</p></section>`;
  if (account.error) return `<section class="card account"><p class="sub">${esc(account.error)}</p></section>`;
  if (!account.user) {
    return `<section class="card account">
      <div class="card-head"><h2>내 계정에 저장하기</h2></div>
      <p class="sub" style="margin-bottom:12px">로그인하면 명식 목록이 계정에 저장돼 다른 기기에서도 볼 수 있어요. 지금은 이 기기에만 저장돼요.</p>
      <button class="btn google" data-action="login">${GOOGLE_LOGO}Google로 로그인</button>
    </section>`;
  }
  const u = account.user;
  const photo = u.photoURL
    ? `<img class="avatar" src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">`
    : `<span class="avatar">${esc((u.displayName || "?").slice(0, 1))}</span>`;
  return `<section class="card account">
    <div class="me-row">${photo}<span class="grow"><b>${esc(u.displayName || "이름 없음")}</b><small>${esc(u.email || "")} · 명식이 계정에 저장돼요</small></span>
    <button class="btn small soft" data-action="logout">로그아웃</button></div>
  </section>`;
}

export function renderCharts(list, currentId, account) {
  const where = account.user ? "내 계정 (다른 기기에서도 보여요)" : "이 기기";
  const loading = account.user && account.charts === null;
  const rows = list.map((c) => {
    const r = calculateSaju({ ...c, today: new Date() });
    const e = r.error ? 3 : STEMS[r.pillars.day.stem].element;
    const pillars = r.error ? r.error : fourPillarsText(r);
    const date = `${c.calendar === "lunar" ? `음력${c.leap ? "(윤)" : ""} ` : ""}${c.date.replaceAll("-", ".")} · ${c.time || "시간 모름"} · ${c.gender === "M" ? "남" : "여"}`;
    return `<article class="chart-item ${c.id === currentId ? "on" : ""}">
      <button class="pick" data-action="select-chart" data-id="${esc(c.id)}">
        <span class="orb bg-${e} el-${e}">${r.error ? "?" : STEMS[r.pillars.day.stem].han}</span>
        <span class="grow"><b>${esc(c.name || "이름 없음")} <span class="chip">${esc(c.relation || "본인")}</span>${c.id === currentId ? ' <span class="chip now">보는 중</span>' : ""}</b>
        <small>${date}</small><small class="pillars">${pillars}</small></span>
      </button>
      <div class="item-actions">
        <button class="icon-btn" data-action="edit-chart" data-id="${esc(c.id)}" aria-label="수정">${icon("edit")}</button>
        <button class="icon-btn" data-action="delete-chart" data-id="${esc(c.id)}" aria-label="삭제">${icon("trash")}</button>
      </div>
    </article>`;
  }).join("");

  return `
    ${topbar("명식 목록")}
    ${accountCard(account)}
    <p class="eyebrow" style="margin:6px 0 10px">저장 위치 · ${where}</p>
    ${loading ? `<section class="card"><p class="sub">계정 명식을 불러오는 중…</p></section>` : ""}
    ${!loading && !list.length ? `<section class="card"><p style="font-size:15px">아직 저장한 명식이 없어요. 지금은 예시 명식(홍길동)을 보여주고 있어요.</p></section>` : ""}
    <div class="chart-list">${rows}</div>
    <a class="btn" href="#manse/new">${icon("plus", 'style="width:18px;height:18px"')}새 명식 추가</a>
    <p class="disclaimer">가족·지인 명식은 본인 동의를 받은 뒤 저장해 주세요. 생년월일시는 로그인한 본인만 읽을 수 있게 저장돼요.</p>`;
}

const GOOGLE_LOGO = `<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;
