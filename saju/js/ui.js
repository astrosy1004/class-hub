// 화면 그리기 전담. 각 함수는 model(명식 계산 결과 묶음)을 받아 HTML 문자열을 돌려준다.
// 계산은 manse.js · score.js, 그래프는 charts.js, 문구는 score-rules.js에 있다.

import { STEMS, BRANCHES, ELEMENTS } from "./saju-data.js";
import { solarTermsOfYear, msFromJd, jdFromMs, surroundingJie } from "./solar-terms.js";
import { pillarKo, calculateSaju, fourPillarsText, tenGod, twelveStage } from "./manse.js";
import {
  bandOf, elementLabel, josa, scorePillar, dayScore, godGroups, jobFit, certificates, healthCheck, workplaceFit, dateKey, pillarsOfDate,
  analyzeNatal, topicFlow, riskAppetite, matchScore, childStar, majorFit, formatPoints,
} from "./score.js";
import {
  DOMAINS, ACTIONS, GUIDES, DISCLAIMER, DAY_MASTER, GOD_THEME, JOHU, HEALTH_NOTICE, TOPICS, DIRECTIONS, STUDY_STYLE, STUDY_WEAK,
  ROLE_VALUE, ROLE_NAME, SCORE, HIDDEN_WEIGHT, STRENGTH_WEIGHT, TEN_GOD_MEANING,
  ELEMENT_LIFE, STRENGTH_GUIDE, GROUP_GUIDE, GOD_MONTH_ACTION,
} from "./score-rules.js";
import { lunarMonthDays, leapMonthOf, solarToLunar, lunarToSolar } from "./lunar.js";
import { lineChart, barChart, radarChart, donutChart, gaugeChart, hBars, compareBars } from "./charts.js";
import { icon, ELEMENT_ICONS } from "./icons.js";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const RELATIONS = ["본인", "배우자", "자녀", "부모", "형제자매", "지인"];
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

// 탭 안의 하위 메뉴. 운세 탭은 시간 순서(오늘 → 올해(월별 흐름 포함) → 인생 포인트). 인생 그래프 · 대운은 홈에 바로 보인다, 나 탭은 기질 · 생활 가이드 · 맞는 일
const SUBNAV = {
  fortune: [["today", "#today", "오늘"], ["fortune", "#fortune", "올해"], ["life", "#life", "인생"]],
  me: [["me", "#me", "나의 기질"], ["guide", "#guide", "생활 가이드"], ["job", "#job", "맞는 일"]],
};
function subnav(on, group = "fortune") {
  const items = SUBNAV[group];
  return `<nav class="subnav" style="grid-template-columns:repeat(${items.length},1fr)" aria-label="${group === "me" ? "나" : "운세"} 메뉴">${items.map(([id, href, label]) => `<a href="${href}" class="${on === id ? "on" : ""}" ${on === id ? 'aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`;
}

// 지금 보고 있는 명식 요약 (제목 오른쪽). 누르면 명식 목록으로 가서 바꿀 수 있다
function whoChip(model) {
  const { profile, saju, natal } = model;
  const e = STEMS[natal.dm].element;
  const [y, m, d] = profile.date.split("-");
  const date = `${profile.calendar === "lunar" ? "음" : ""}${y}.${m}.${d}`;
  return `<a class="who-chip" href="#charts" aria-label="지금 보는 명식: ${esc(profile.name || "이름 없음")}, 명식 바꾸기">
      <span class="who-orb bg-${e} el-${e}">${STEMS[natal.dm].han}</span>
      <span class="who-text"><b>${esc(profile.name || "이름 없음")}</b><small>${profile.sample ? "예시" : esc(profile.relation || "본인")} · ${date} · ${profile.gender === "M" ? "남" : "여"} · ${saju.koreanAge}세</small></span>
    </a>`;
}
const actionText = (domainId, score) => ACTIONS[domainId][score >= 65 ? "high" : score >= 45 ? "mid" : "low"];
const ageRange = (d) => `${d.startAge}~${d.startAge + 9}세`;
const elementGroupId = (natal, e) => Object.keys(natal.rel).find((k) => natal.rel[k] === e);

// 명리 근거 상자: factors [{ what, why, pts }] 를 표로. 접혀 있다가 누르면 펼쳐진다
function basisBox(factors, { title = "명리 근거 보기", note = "", total = null, raw = false } = {}) {
  if (!factors || !factors.length) return "";
  const sum = total ?? Math.round(factors.reduce((a, f) => a + f.pts, 0));
  const pts = (f) => (raw ? `${f.pts}${f.weight ? ` <small>×${f.weight}</small>` : ""}` : f.what === "기본 점수" ? Math.round(f.pts) : formatPoints(f.pts));
  return `<details class="basis">
      <summary>${icon("book")}${title}</summary>
      ${note ? `<p class="basis-note">${note}</p>` : ""}
      <table class="basis-table">
        <tr><th>글자 · 요소</th><th>왜 그렇게 보나</th><th>점수</th></tr>
        ${factors.map((f) => `<tr><td>${f.what}</td><td>${f.why}</td><td class="${!raw && f.pts < -0.05 ? "minus" : !raw && f.pts > 0.05 && f.what !== "기본 점수" ? "plus" : ""}">${pts(f)}</td></tr>`).join("")}
        <tr class="sum"><td colspan="2">${raw ? "가중 평균" : "합계"}</td><td>${sum}점</td></tr>
      </table>
      <a class="basis-link" href="#basis">해석 기준 전체 보기 ›</a>
    </details>`;
}

// 근거 문장 목록용 상자 (인생 주요 포인트 · 건강 체크처럼 표보다 문장이 맞을 때)
function basisList(items, { title = "명리 근거 보기", note = "" } = {}) {
  if (!items.length) return "";
  return `<details class="basis">
      <summary>${icon("book")}${title}</summary>
      ${note ? `<p class="basis-note">${note}</p>` : ""}
      <ul class="basis-ul">${items.map((t) => `<li>${t}</li>`).join("")}</ul>
      <a class="basis-link" href="#basis">해석 기준 전체 보기 ›</a>
    </details>`;
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

// 로고(여덟 칸 그래프). 색은 테마 변수 --logo-a · --logo-b(바탕 그라디언트) · --logo-peak(정점 칸)를 따른다.
// 파비콘처럼 페이지 CSS를 못 읽는 곳에는 실제 색을 넘긴다
export function logoMark({ a = "var(--logo-a)", b = "var(--logo-b)", peak = "var(--logo-peak)", id = "lgBg", attrs = "" } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" ${attrs}>
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:${a}"/><stop offset="1" style="stop-color:${b}"/></linearGradient></defs>
      <rect width="64" height="64" rx="15" fill="url(#${id})"/>
      <g fill="#fff"><rect x="11" y="44" width="8" height="8" rx="2.5" fill-opacity=".45"/><rect x="11" y="34" width="8" height="8" rx="2.5" fill-opacity=".92"/><rect x="23" y="38" width="8" height="8" rx="2.5" fill-opacity=".45"/><rect x="23" y="28" width="8" height="8" rx="2.5" fill-opacity=".92"/><rect x="35" y="41" width="8" height="8" rx="2.5" fill-opacity=".45"/><rect x="35" y="31" width="8" height="8" rx="2.5" fill-opacity=".92"/><rect x="47" y="32" width="8" height="8" rx="2.5" fill-opacity=".45"/></g>
      <rect x="47" y="22" width="8" height="8" rx="2.5" style="fill:${peak}"/>
      <path d="M15 27 27 21 39 24 51 14" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" stroke-opacity=".9"/>
    </svg>`;
}

// 워드마크: 로고 + "팔자도" 글씨 + 글씨 밑을 오르는 그래프 선과 정점. 페이지 글꼴(Pretendard)과 테마 색으로 그린다
export function wordmark(height = 32) {
  return `<svg class="wordmark" viewBox="0 0 136 40" style="height:${height}px" role="img" aria-label="팔자도">
      ${logoMark({ id: "wmBg", attrs: 'x="0" y="0" width="40" height="40"' })}
      <text x="48" y="28" font-size="25" font-weight="900" letter-spacing="-1.2" fill="currentColor">팔자도</text>
      <path d="M49 36.5 67 34.5 85 35.5 110 30.5" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="117" cy="28" r="3.6" style="fill:var(--logo-peak)" stroke="var(--surface)" stroke-width="1.6"/>
    </svg>`;
}

// ── 0. 인트로 (#intro): 자리잡소 소개 화면처럼 넘기는 4장 + 아래 시작 버튼 ─────────────────────────────
export function renderIntro(model) {
  const { natal, today, life } = model;
  const pts = life.points;
  const day = dayScore(natal, today);
  const ps = pillarsOfDate(dateKey(today));
  const dRes = scorePillar(natal, ps.day, "total");
  const rows = dRes.factors.filter((f) => f.what !== "기본 점수" && Math.abs(f.pts) >= 0.5).sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts)).slice(0, 3);
  const domains = ["wealth", "love", "career", "health"].map((id) => ({ id, s: dayScore(natal, today, id).score }));
  const slides = [
    {
      art: `<div class="card pj-graph">
          <p class="sub">예시 · ${esc(model.profile.name)}님의 인생 그래프</p>
          ${lineChart({ values: pts.map((p) => p.score), labels: pts.map((p) => p.startAge), current: life.currentIndex, peak: pts.indexOf(life.peak), height: 150, caption: "예시 인생 그래프" })}
        </div>`,
      title: `내 팔자를<br><em>그래프</em>로 봅니다`,
      text: `생년월일시만 입력하면 10년마다 바뀌는 운을<br>점수로 이어 그려, 오르막과 쉼표를 보여 드려요.`,
    },
    {
      art: `<div class="card">
          <div class="pj-score"><div><p class="sub">오늘 · ${day.ko}일 (${day.stemGod})</p><b>${day.score}<small>점</small></b></div><span class="chip ${day.score >= 65 ? "up" : day.score < 45 ? "warn" : ""}">${bandOf(day.score).name}</span></div>
          ${hBars(domains.map(({ id, s }) => ({ label: domainOf(id).name, value: s, right: `${s}` })))}
        </div>`,
      title: `<em>오늘 · 월별 · 올해</em><br>운세를 점수로`,
      text: `재물 · 연애 · 직업 · 건강을 나눠 보고,<br>좋은 날과 좋은 시간대까지 골라 드려요.`,
    },
    {
      art: `<div class="card pj-basis">
          <p class="sub">오늘 일진 ${day.text}(${day.ko}) 점수 근거</p>
          <table>${rows.map((f) => `<tr><td>${f.what}</td><td class="${f.pts < 0 ? "minus" : "plus"}">${formatPoints(f.pts)}</td></tr>`).join("")}</table>
          <span class="basis-link">왜 그렇게 보는지 한 줄씩 설명해요 ›</span>
        </div>`,
      title: `모든 점수에<br><em>명리 근거</em>를 보여줘요`,
      text: `어느 글자가 용신이라 더했는지, 무엇과 충이라<br>뺐는지 계산표를 그대로 펼쳐 볼 수 있어요.`,
    },
    {
      art: `<div class="pj-topics">${TOPICS.map((t) => `<span class="card"><i class="ico fill-${topicColor[t.color]}">${icon(t.icon)}</i>${t.short}</span>`).join("")}</div>`,
      title: `궁금한 일은 <em>상담</em>,<br>사는 법은 <em>생활 가이드</em>`,
      text: `이사 · 투자 · 취업 · 궁합 · 진로의 좋은 때와<br>나에게 맞는 색 · 방향 · 습관까지 알려 드려요.`,
    },
  ];
  const n = slides.length;
  return `
    <main class="pj-intro" aria-label="팔자도 소개">
      <div class="pj-top">
        ${wordmark(30)}
        <button class="pj-skip" data-action="intro-browse">건너뛰기</button>
      </div>
      <div class="pj-slides" data-intro-slides aria-roledescription="carousel">
        ${slides.map((sl, k) => `<section class="pj-slide" aria-roledescription="slide" aria-label="${k + 1} / ${n}">
          <div class="pj-art"><div class="pj-mock" aria-hidden="true">${sl.art}</div></div>
          <div class="pj-copy">${k === 0 ? `<h1>${sl.title}</h1>` : `<h2>${sl.title}</h2>`}<p>${sl.text}</p></div>
        </section>`).join("")}
      </div>
      <div class="pj-foot">
        <div class="pj-dots" data-intro-dots aria-label="소개 페이지">${slides.map((_, k) => `<button type="button" class="${k ? "" : "on"}" aria-label="${k + 1}번째 소개"></button>`).join("")}</div>
        <div class="pj-count" data-intro-count aria-live="polite">01 / 0${n}</div>
        <button class="btn pj-start" data-action="intro-start">내 명식 입력하고 시작하기</button>
        <p class="pj-privacy">명식은 이 기기 또는 내 구글 계정에만 저장돼요</p>
      </div>
    </main>`;
}

// ── 1. 홈 ─────────────────────────────
export function renderHome(model, lifeSelected = -1) {
  const { today, natal, year, life, profile } = model;
  // 지금 보는 사람 한 줄: 이름 · 관계 · 성별 · 나이 · 생년월일시 (입력한 그대로: 양력 · 음력 · 윤달)
  const [by, bm, bd] = profile.date.split("-").map(Number);
  const [bh, bmin] = profile.time ? profile.time.split(":").map(Number) : [];
  const calName = profile.calendar === "lunar" ? (profile.leap ? "음력(윤달)" : "음력") : "양력";
  const birthLine = `${calName} ${by}.${String(bm).padStart(2, "0")}.${String(bd).padStart(2, "0")} ${profile.time ? `${String(bh).padStart(2, "0")}:${String(bmin).padStart(2, "0")}` : "시간 모름"}`;
  const m = sajuMonth(today); // 절기 월
  const reports = [
    { href: "#monthly/wealth", name: "재물운", icon: "coin", cls: "fill-2", sub: `올해 ${year.scores.wealth}점` },
    { href: "#monthly/love", name: "연애·배우자", icon: "heart", cls: "fill-1", sub: `${bestWorst(year.months, m, "love").best.month}월 최고` },
    { href: "#job", name: "맞는 일", icon: "briefcase", cls: "fill-dark", sub: `추천 자격증 ${certificates(natal).length}개` },
    { href: "#monthly/health", name: "건강운", icon: "pulse", cls: "fill-4", sub: `올해 ${year.scores.health}점` },
    { href: "#ask/match", name: "궁합", icon: "sparkle", cls: "fill-accent", sub: "저장한 명식과 비교" },
    { href: "#ask/move", name: "이사", icon: "move", cls: "fill-0", sub: `올해 ${topicFlow(natal, "move", year.year).score}점` },
  ];

  return `
    <div class="home-top">
      <a class="brand" href="#intro" aria-label="팔자도 앱 소개">${wordmark(26)}<small>그래프로 보는 사주</small></a>
      <nav class="home-tools" aria-label="명식">
        <a class="icon-btn" href="#manse/new" aria-label="새 명식 입력" title="새 명식 입력">${icon("plus")}</a>
        <a class="icon-btn" href="#charts" aria-label="명식 바꾸기" title="명식 바꾸기">${icon("list")}</a>
      </nav>
    </div>
    <header class="greet">
      <h1>${esc(profile.name || "나")}님</h1>
      <span class="greet-meta">${profile.sample ? "예시" : esc(profile.relation || "본인")} · ${profile.gender === "M" ? "남" : "여"} · ${model.saju.koreanAge}세</span>
      <span class="greet-birth">${birthLine}</span>
    </header>
    ${lifeSections(model, lifeSelected)}

    <h2 class="section-title">바로가기 <a href="#ask">상담 전체</a></h2>
    <nav class="report-grid">
      ${reports.map((r) => `<a href="${r.href}"><span class="ico ${r.cls}">${icon(r.icon)}</span><b>${r.name}</b><small>${r.sub}</small></a>`).join("")}
    </nav>

    ${disclaimer()}`;
}

// ── 2-0. 오늘의 운세 — 하루 단위로 넘겨 볼 수 있다 (#today/2026-11-01) ─────────────────────────────
// 시진(2시간)의 시작 시각: 자시 23시, 축시 1시 … 해시 21시
const hourStart = (b) => (23 + 2 * b) % 24;
const hourRange = (b) => `${hourStart(b)}~${(hourStart(b) + 2) % 24}시`;

export function renderToday(model, dateArg) {
  const { today, natal } = model;
  const todayKey = dateKey(today);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateArg || "");
  const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const key = dateKey(date);
  const shift = (n) => dateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + n));
  const gap = Math.round((date - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
  const when = gap === 0 ? "오늘" : gap === -1 ? "어제" : gap === 1 ? "내일" : gap < 0 ? `${-gap}일 전` : `${gap}일 뒤`;
  const href = (k) => (k === todayKey ? "#today" : `#today/${k}`);

  const ps = pillarsOfDate(key);
  const day = dayScore(natal, date);
  const dRes = scorePillar(natal, ps.day, "total");
  const mRes = scorePillar(natal, ps.month, "total");
  const stemEl = STEMS[ps.day.stem].element;
  const domains = ["wealth", "love", "career", "health"].map((id) => ({ id, s: dayScore(natal, date, id).score }));
  const top = domains.reduce((a, b) => (b.s > a.s ? b : a));
  const low = domains.reduce((a, b) => (b.s < a.s ? b : a));
  const word = (GOD_MONTH_ACTION[day.stemGod] || "").replace(/달/g, "날");

  // 시간대별: 그날 일간으로 시주를 세워 (시주 50% + 그날 점수 50%)
  const hours = BRANCHES.map((b, i) => {
    const p = { stem: ((ps.day.stem % 5) * 2 + i) % 10, branch: i };
    const r = scorePillar(natal, p, "total");
    return { i, p, god: r.stemGod, score: Math.round(0.5 * r.score + 0.5 * day.score) };
  });
  const ordered = [...hours.slice(1), hours[0]]; // 하루 순서대로: 축시(1시) … 해시, 자시(23시)
  const nowBranch = Math.floor(((new Date().getHours() + 1) % 24) / 2);
  const topHours = [...hours].sort((a, b) => b.score - a.score).slice(0, 2);
  const lowHour = [...hours].sort((a, b) => a.score - b.score)[0];

  // 좋은 점 · 조심할 점: 일진 근거 중 가장 크게 더하고 뺀 것
  const signed = dRes.factors.filter((f) => f.what !== "기본 점수");
  const goods = signed.filter((f) => f.pts > 0.5).sort((a, b) => b.pts - a.pts).slice(0, 3);
  const cares = signed.filter((f) => f.pts < -0.5).sort((a, b) => a.pts - b.pts).slice(0, 3);

  // 행운 포인트: 용신 오행
  const yl = ELEMENT_LIFE[natal.yong];
  const pick = (list) => list[(ps.day.stem + ps.day.branch) % list.length];

  // 앞뒤 7일
  const week = Array.from({ length: 7 }, (_, i) => dayScore(natal, new Date(date.getFullYear(), date.getMonth(), date.getDate() - 3 + i)));
  const lv = (s) => (s >= 68 ? 4 : s >= 56 ? 3 : s >= 45 ? 2 : 1);

  return `
    ${topbar("오늘의 운세", whoChip(model))}
    ${subnav("today")}
    <div class="year-nav">
      <a class="icon-btn" href="${href(shift(-1))}" aria-label="전날 보기">${icon("chevronLeft")}</a>
      <div class="yn-mid"><b>${date.getMonth() + 1}월 ${date.getDate()}일 ${DOW[date.getDay()]}요일</b><small>${when} · ${day.text}(${day.ko})일</small></div>
      <a class="icon-btn" href="${href(shift(1))}" aria-label="다음날 보기">${icon("chevronRight")}</a>
    </div>
    ${key !== todayKey ? `<p class="yn-back"><a href="#today">오늘로 돌아가기</a></p>` : ""}

    <section class="card" style="text-align:center">
      ${gaugeChart({ value: day.score, caption: `${when}의 종합운` })}
      <p style="font-weight:700;margin-top:4px"><span class="pill-han bg-${stemEl} el-${stemEl}">${day.text}</span> ${day.stemGod}의 날 · ${GOD_THEME[day.stemGod]}</p>
      <p style="font-weight:800;color:var(--accent)">${word}</p>
      ${basisBox(
        [
          { what: `일진 ${day.text}(${day.ko})`, why: `그날의 기둥. ${dRes.reason}`, pts: dRes.score, weight: 0.7 },
          { what: `월운 ${pillarKo(ps.month)}`, why: `그날이 속한 절기 달의 기둥. ${mRes.reason}`, pts: mRes.score, weight: 0.3 },
        ],
        { raw: true, total: day.score, note: "하루 점수는 그날의 일진(70%)과 그 달의 월운(30%)을 섞어 매겨요. 일진 한 기둥의 자세한 근거는 아래에 있어요." },
      )}
      ${basisBox(dRes.factors, { title: "일진 근거 자세히", note: `일진 <b>${day.text}(${day.ko})</b>의 천간 · 지지를 내 원국의 용신 · 기신, 일지와의 합 · 충에 비춰 매긴 점수예요.` })}
    </section>

    <section class="card">
      <div class="card-head"><h2>영역별 운</h2><span class="sub">100점 기준</span></div>
      ${hBars(domains.map(({ id, s }) => ({ label: domainOf(id).name, value: s, right: `${s}점`, rightClass: s >= 65 ? "up" : s < 45 ? "down" : "" })))}
      <p class="note">${top.s - low.s < 3 ? "영역별 차이가 크지 않은 날이에요." : `${josa(domainOf(top.id).name, "이/가")} 가장 좋고, ${josa(domainOf(low.id).name, "은/는")} 조금 아껴 두세요.`}</p>
    </section>

    <section class="card">
      <div class="card-head"><h2>시간대별 흐름</h2><span class="sub">시진(2시간) 기준</span></div>
      <p class="lead"><b>${topHours.map((h) => `${BRANCHES[h.i].ko}시(${hourRange(h.i)})`).join(", ")}</b>가 가장 좋아요</p>
      ${barChart({ bars: ordered.map((h) => ({ label: BRANCHES[h.i].ko, value: h.score, state: key === todayKey && h.i === nowBranch ? "now" : "future", show: topHours.includes(h) || (key === todayKey && h.i === nowBranch) })), height: 150, caption: "시간대별 점수" })}
      <p class="note">${BRANCHES[lowHour.i].ko}시(${hourRange(lowHour.i)})는 ${lowHour.god} 기운이 들어와 가장 낮아요. 중요한 연락 · 결정은 좋은 시간대로 옮기세요.</p>
      ${basisList(
        topHours.map((h) => `${BRANCHES[h.i].ko}시 시주 <b>${STEMS[h.p.stem].han}${BRANCHES[h.i].han}</b>: 천간이 ${h.god}, 오행 ${elementLabel(STEMS[h.p.stem].element)} → 내 사주의 ${ROLE_NAME[natal.roles[STEMS[h.p.stem].element]]}`),
        { note: "시주는 그날 일간에서 정해져요(갑·기일은 갑자시, 을·경일은 병자시 …). 시주 점수 50%와 그날 점수 50%를 섞었어요." },
      )}
    </section>

    <section class="card">
      <div class="card-head"><h2>${when}의 좋은 점 · 조심할 점</h2></div>
      <div class="rows">
        ${goods.map((f) => `<div class="row"><span class="badge bg-0 el-0">+</span><span class="body"><b>${f.what}</b><small>${f.why}</small></span><span class="score" style="color:var(--up)">${formatPoints(f.pts)}</span></div>`).join("")}
        ${cares.map((f) => `<div class="row"><span class="badge bg-1 el-1">!</span><span class="body"><b>${f.what}</b><small>${f.why}</small></span><span class="score" style="color:var(--warn)">${formatPoints(f.pts)}</span></div>`).join("")}
        ${!goods.length && !cares.length ? `<p class="note">크게 돕거나 막는 글자가 없는 무난한 날이에요.</p>` : ""}
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h2>행운 포인트</h2><span class="sub">용신 ${elementLabel(natal.yong)}</span></div>
      <div class="lucky">
        <div><small>색</small><b>${yl.color}</b></div>
        <div><small>방향</small><b>${DIRECTIONS[natal.yong]}</b></div>
        <div><small>맛</small><b>${yl.taste}</b></div>
        <div><small>해 볼 일</small><b>${pick(yl.activities)}</b></div>
      </div>
      <p class="note">내 사주에 가장 필요한 기운(용신)을 생활에서 채우는 방법이에요. <a href="#guide" style="color:var(--accent)">생활 가이드 보기 ›</a></p>
    </section>

    <section class="card">
      <div class="card-head"><h2>앞뒤 7일</h2><span class="sub">눌러서 그날 보기</span></div>
      <div class="day-strip">
        ${week.map((d) => `<a class="lv${lv(d.score)} ${dateKey(d.date) === key ? "on" : ""}" href="${href(dateKey(d.date))}"><small>${DOW[d.date.getDay()]}</small><b>${d.date.getDate()}</b><span>${d.score}</span></a>`).join("")}
      </div>
    </section>
    ${disclaimer()}`;
}

// ── 2. 운세 (한 해 한눈에) — 지난해 · 다음해도 볼 수 있다 ─────────────────────────────
export function renderFortune(model, yf, domainId = "total") {
  const { today, natal } = model;
  const thisYear = today.getFullYear();
  const isCur = yf.year === thisYear;
  const isPast = yf.year < thisYear;
  const m = isCur ? sajuMonth(today) : isPast ? 13 : 0; // 이 달보다 앞은 "지난 달"
  const { best, worst } = bestWorst(yf.months, isCur ? m : 1, "total");
  const strongest = ["wealth", "love", "career", "health"].reduce((a, b) => (yf.scores[b] > yf.scores[a] ? b : a));
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
    ${topbar("올해 운세", whoChip(model))}
    ${subnav("fortune")}
    ${yearNav(domainId === "total" ? "#fortune" : `#monthly/${domainId}`, yf, model)}
    <section class="card" style="text-align:center">
      ${gaugeChart({ value: yf.scores.total, caption: `${yf.year}년 종합운` })}
      <p style="font-weight:700;margin-top:4px">${line1}</p>
      <p style="font-weight:800;color:var(--accent)">${line2}</p>
      <div class="mini3">
        ${["wealth", "love", "health"].map((id) => `<div>${domainOf(id).short}<b>${yf.scores[id]}</b>${miniNote(id, yf.scores[id])}</div>`).join("")}
      </div>
      ${basisBox(scorePillar(natal, yf.pillar, "total").factors, { note: `${yf.year}년 세운 <b>${yf.text}(${yf.ko})</b> 한 기둥을 내 원국의 용신 · 기신에 비춰 매긴 종합 점수예요.` })}
    </section>
    ${eventCard}

    ${monthlySection(model, domainId, yf)}

    ${disclaimer()}`;
}

// 이번 달 남은 날 중 직업 · 배우자 · 재물 점수가 가장 높은 날 (서로 다른 날)
function monthPlans(model) {
  const { today, natal } = model;
  const y = today.getFullYear();
  const mo = today.getMonth();
  const last = new Date(y, mo + 1, 0).getDate();
  const days = Array.from({ length: last - today.getDate() + 1 }, (_, i) => new Date(y, mo, today.getDate() + i));
  const used = new Set();
  const upcoming = (domain) => {
    const pick = days
      .filter((d) => !used.has(d.getDate()))
      .map((d) => ({ date: d, s: dayScore(natal, d, domain) }))
      .sort((a, b) => b.s.score - a.s.score)[0];
    if (pick) used.add(pick.date.getDate());
    return pick;
  };
  const plans = [
    { d: upcoming("career"), title: "면접·지원서 제출", why: (d) => `${d.s.stemGod}일 · ${GOD_THEME[d.s.stemGod]}` },
    { d: upcoming("spouse"), title: "배우자·가족과 깊은 대화", why: (d) => `${d.s.stemGod}일 · 마음이 가까워지는 날` },
    { d: upcoming("wealth"), title: "가계부·지출 점검", why: (d) => `${d.s.stemGod}일 · 돈 흐름이 보이는 날` },
  ].filter((p) => p.d);
  if (!plans.length) return "";
  return `<h2 class="section-title">이번 달 추천 일정</h2>
    ${plans.map((p) => `<a class="card plan" href="#today/${dateKey(p.d.date)}"><span class="date"><span><small>${mo + 1}월</small><b>${p.d.date.getDate()}</b></span></span><div><p>${p.title}</p><small>${p.d.s.ko}일 · ${p.why(p.d)}</small></div></a>`).join("")}`;
}

// ── 3. 월별 흐름 (영역 탭): 올해 화면 아래에 붙는다. 주소 #monthly/<영역>[/연도]도 올해 화면으로 그린다 ─────────────────────────────
function monthlySection(model, domainId = "total", yf) {
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
    <h2 class="section-title" id="monthFlow" data-month-flow>월별 흐름 <span class="sub">영역을 골라 보세요 · 절기 기준</span></h2>
    <nav class="tabs">${tabs}</nav>
    <p class="eyebrow">${isCur ? `지금 ${m}월 ${now.ko}월 · ${domain.short} ${now.scores[id]}점` : `${yf.year} ${yf.ko}년 · ${domain.short} ${yf.scores[id]}점`}</p>
    <p class="headline">${headline}</p>
    <section class="card">
      ${barChart({ bars: yf.months.map((mo) => ({ label: mo.month, value: mo.scores[id], state: stateOf(mo), show: mo.month === m || mo === peak || mo === best })), caption: `${yf.year}년 ${domain.name} 월별 점수` })}
      <div class="legend">${isCur ? `<span><i class="past"></i>지난 달</span><span><i class="now"></i>지금</span><span><i class="future"></i>남은 달</span>` : `<span><i class="${isPast ? "past" : "future"}"></i>${yf.year}년 월별 점수</span>`}</div>
      ${(() => {
        const mo = isCur ? now : best;
        const mf = scorePillar(model.natal, mo.pillar, id);
        const yfac = scorePillar(model.natal, yf.pillar, id).score;
        return basisBox(mf.factors, {
          title: `${mo.month}월 점수 근거 보기`,
          note: `${mo.month}월 점수 = 세운 ${yf.ko} ${yfac}점 × 35% + 월운 <b>${mo.ko}</b> ${mf.score}점 × 65% = <b>${mo.scores[id]}점</b>. 아래는 월운 ${mo.ko}의 계산이에요.`,
          total: mf.score,
        });
      })()}
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
    ${isCur ? monthPlans(model) : ""}
    ${id === "career" ? guideCard(GUIDES.career, "실천 가이드") : ""}
    ${id === "health" ? `<p class="note">${HEALTH_NOTICE}</p>${guideCard(GUIDES.health, "건강 챙기기")}` : ""}
    ${id === "wealth" ? `<section class="card"><div class="card-head"><h2>스스로 점검할 것</h2></div><p style="font-size:14px">특정 종목·매수·매도를 추천하지 않아요. 돈이 움직이는 달에는 <b>투자 이유</b>, <b>세금</b>, <b>자금 용도</b>를 먼저 적어 보세요.</p></section>` : ""}`;
}

// 인생 그래프 본체: 대운 꺾은선 (+ 인생 주요 포인트 표시 · 범례). 홈은 표시 없이, 운세 › 인생은 표시와 함께. 점을 누르면 main.js가 selected를 바꾼다
function lifeChart(model, selected = -1, height = 200, withMarkers = true, hint = "점을 누르면 풀이가 나와요") {
  const { life, events } = model;
  const pts = life.points;
  const ci = life.currentIndex;
  const peakIndex = pts.indexOf(life.peak);
  // 그래프 아래 줄마다 이벤트 표시 (대운 시작 나이 → 그래프 가로 위치)
  const first = pts[0].startAge;
  const markers = !withMarkers ? [] : events.flatMap((ev, lane) =>
    ev.items.map((it) => ({
      pos: Math.min(pts.length - 1, Math.max(0, (it.age - first) / 10)),
      lane,
      cls: `mk-${ev.id}`,
      label: ev.short.slice(0, 1),
      past: it.past,
      title: `${it.year}년 ${it.age}세 · ${ev.name} ${it.score}점`,
    })),
  );
  return `<div class="legend" style="margin:0 0 4px"><span><i class="future"></i>대운 흐름</span><span><i class="now"></i>지금</span><span>${hint}</span></div>
      <div data-chart="life">${lineChart({
        values: pts.map((p) => p.score),
        labels: pts.map((p) => p.startAge),
        current: ci,
        peak: peakIndex,
        selected,
        futureFrom: ci > 0 ? ci : null,
        band: peakIndex !== ci ? [peakIndex, peakIndex, "가장 좋은 10년"] : null,
        markers,
        height,
        caption: "대운별 인생 점수와 인생 주요 포인트",
      })}</div>
      ${withMarkers ? `<div class="legend mk-legend">${events.map((ev) => `<span><i class="mkbg-${ev.id}"></i>${ev.name}</span>`).join("")}<span class="muted-past">흐린 점 = 지난 해</span></div>` : ""}`;
}

// 인생 그래프에서 고른 대운(없으면 지금 대운)의 자세한 풀이. 점을 누르면 main.js가 이 칸으로 스크롤한다
function lifeDetail(model, selected = -1) {
  const { life, natal, events } = model;
  const pts = life.points;
  const ci = life.currentIndex;
  const i = selected >= 0 ? selected : Math.max(ci, 0);
  const p = pts[i];
  const se = STEMS[p.stem].element;
  const be = BRANCHES[p.branch].element;
  const when = i === ci ? "지금" : i < ci ? "지나온" : "다가올";
  const prev = pts[i - 1];
  const diff = prev ? p.score - prev.score : null;
  const doms = ["wealth", "career", "love", "spouse", "children", "health"].map((id) => ({ id, v: p.domains[id] }));
  const best = doms.reduce((a, b) => (b.v > a.v ? b : a));
  const worst = doms.reduce((a, b) => (b.v < a.v ? b : a));
  const hits = events.flatMap((ev) => ev.items.filter((it) => it.age >= p.startAge && it.age < p.startAge + 10).map((it) => ({ ev, it })));
  const thisYear = model.today.getFullYear();
  const act = (GOD_MONTH_ACTION[p.stemGod] || "").replace(/달/g, "시기");
  const roleChip = (e) => `<span class="chip ${natal.roles[e] === "yong" || natal.roles[e] === "hee" ? "up" : natal.roles[e] === "gi" ? "warn" : ""}">${ROLE_NAME[natal.roles[e]]}</span>`;
  return `<div class="life-detail" id="lifeDetail">
      <div class="ld-head">
        <span class="ld-pillar"><i class="tile bg-${se} el-${se}">${STEMS[p.stem].han}</i><i class="tile bg-${be} el-${be}">${BRANCHES[p.branch].han}</i></span>
        <div class="grow"><b>${ageRange(p)} · ${p.ko} 대운</b><small>${when} 대운 · ${p.startYear}~${p.startYear + 9}년</small></div>
        <span class="ld-score">${p.score}<small>점</small></span>
      </div>
      <p class="ld-band"><span class="chip ${p.score >= 65 ? "up" : p.score < 45 ? "warn" : ""}">${p.band.name}</span> ${p.band.phrase}${diff !== null ? ` · 앞 대운보다 <b class="${diff >= 0 ? "up" : "down"}">${diff >= 0 ? "+" : ""}${diff}점</b>` : ""}</p>
      <ul class="ld-list">
        <li><b>천간 ${STEMS[p.stem].han}(${STEMS[p.stem].ko}${ELEMENTS[se].ko}) · ${p.stemGod}</b> ${roleChip(se)}<br>${GOD_THEME[p.stemGod]}의 기운이 앞에 드러나요. 오행 ${elementLabel(se)}${josa(elementLabel(se), "은/는").slice(-1)} 내 사주의 ${ROLE_NAME[natal.roles[se]]}이에요.</li>
        <li><b>지지 ${BRANCHES[p.branch].han}(${BRANCHES[p.branch].ko}${ELEMENTS[be].ko}) · ${p.branchGod}</b> ${roleChip(be)}<br>${GOD_THEME[p.branchGod]}의 기운이 바탕에 깔려요. 10년 내내 힘이 더 큰 쪽이에요.</li>
        <li><b>한 줄 풀이</b><br>${p.reason}</li>
      </ul>
      <p class="ld-sub">이 10년의 영역별 운</p>
      <div class="ld-doms">${doms.map((d) => `<div class="${d === best ? "up" : d === worst ? "down" : ""}"><small>${domainOf(d.id).short}</small><b>${d.v}</b></div>`).join("")}</div>
      <p class="note">${josa(domainOf(best.id).short, "이/가")} 가장 잘 풀리고, ${josa(domainOf(worst.id).short, "은/는")} 조심해서 다룰 시기예요.</p>
      ${hits.length ? `<p class="ld-sub">이 10년의 인생 포인트</p>
      <div class="chips">${hits.map(({ ev, it }) => `<a class="chip ${it.past ? "past" : ev.pick === "low" ? "warn" : "up"}" href="#fortune${it.year === thisYear ? "" : `/${it.year}`}">${it.year}년 ${it.age}세 · ${ev.short}${ev.pick === "low" ? " 주의" : ""} ${it.score}점</a>`).join("")}</div>` : ""}
      <p class="ld-sub">이 시기 이렇게 보내세요</p>
      <p class="ld-act">${act} ${actionText("total", p.score)}</p>
    </div>`;
}

// ── 4. 인생 그래프 묶음 (홈): 그래프(점을 누르면 운세 › 인생의 그 대운 풀이로), 한 줄 요약, 시기별 풀이, 영역별 레이더, 다음 대운 비교 ─────────────────────────────
function lifeSections(model) {
  const { life, natal } = model;
  const pts = life.points;
  const ci = life.currentIndex;
  const cur = pts[ci] || pts[0];
  const peakIndex = pts.indexOf(life.peak);
  const headline = peakIndex === ci
    ? `지금이 인생의 <b>정점</b>이에요`
    : `지금은 ${cur.band.name === "전성기" ? "전성기" : cur.band.phrase}, <b>${life.peak.startAge}세 ${life.peak.score}점</b>이 정점이에요`;
  const summary = natal.summary
    .replace(elementLabel(natal.yong), `<b class="el-${natal.yong}">${elementLabel(natal.yong)}</b>`)
    .replace(elementLabel(natal.hee), `<b class="el-${natal.hee}">${elementLabel(natal.hee)}</b>`);

  const next = pts[ci + 1];
  const radarIds = ["wealth", "career", "spouse", "children", "love", "health"];
  const axes = radarIds.map((id) => ({ label: domainOf(id).short, value: cur.domains[id] }));
  const lowAxis = axes.reduce((a, b) => (b.value < a.value ? b : a));
  const highAxis = axes.reduce((a, b) => (b.value > a.value ? b : a));
  return `
    <section class="card home-life">
      <div class="card-head"><h2>인생 그래프</h2><span class="sub">지금 ${ageRange(cur)} · ${cur.ko} 대운</span></div>
      <p class="lead">${headline}</p>
      ${lifeChart(model, -1, 190, false, "점을 누르면 운세 › 인생에서 자세히 봐요")}
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
    <section class="card">
      <div class="card-head"><h2>지금 대운의 영역별 운</h2></div>
      <p class="lead">${cur.ko} 대운 ${ageRange(cur)} · 100점 기준</p>
      ${radarChart({ axes })}
      ${basisList(radarIds.map((id) => { const r = scorePillar(natal, cur, id); return `<b>${domainOf(id).short} ${r.score}점</b> · ${r.reason} (대운 ${cur.text} = 천간 ${r.stemGod} · 지지 ${r.branchGod})`; }), { title: "영역별 근거 보기", note: `모두 지금 대운 <b>${cur.text}(${cur.ko})</b> 한 기둥을 영역마다 다른 십신 가중치로 매긴 점수예요.` })}
      <p class="note">${josa(highAxis.label, "은/는")} 잘 풀리는데 <b>${lowAxis.label}</b>${josa(lowAxis.label, "이/가").slice(-1)} 가장 낮아요. ${actionText(radarIds[axes.indexOf(lowAxis)], lowAxis.value)}</p>
    </section>
    ${next ? `<section class="card">
      <div class="card-head"><h2>지금 vs 다음 대운</h2></div>
      <div class="legend" style="margin:0 0 12px"><span><i class="past"></i>지금 ${cur.ko}</span><span><i class="future"></i>${next.startAge}세 ${next.ko}</span></div>
      ${compareBars(["wealth", "career", "children", "spouse"].map((id) => ({ label: domainOf(id).short, a: cur.domains[id], b: next.domains[id] })))}
    </section>` : ""}`;
}

// ── 4-1. 운세 › 인생 (#life): 인생 주요 포인트를 그래프와 함께 자세히 ─────────────────────────────
export function renderLife(model, selected = -1) {
  const { events, today, natal, life } = model;
  const sel = life.points[selected >= 0 ? selected : Math.max(life.currentIndex, 0)];
  const thisYear = today.getFullYear();
  const upcoming = events
    .flatMap((ev) => ev.items.filter((it) => !it.past).map((it) => ({ ev, it })))
    .sort((a, b) => a.it.year - b.it.year);
  const first = upcoming[0];
  const yearHref = (y) => `#fortune${y === thisYear ? "" : `/${y}`}`;

  return `
    ${topbar("인생 포인트", whoChip(model))}
    ${subnav("life")}
    <p class="eyebrow">결혼 · 취업 · 재물 · 건강 · 해마다 대운 40% + 세운 60%</p>
    <p class="headline">${first ? `다음 포인트는<br><em>${first.it.year}년(${first.it.age}세) ${first.ev.name}</em>` : "지나온 포인트를<br>돌아봐요"}</p>
    <section class="card">
      ${lifeChart(model, selected, 210, true)}
      ${lifeDetail(model, selected)}
      ${basisBox(scorePillar(natal, sel, "total").factors, { title: `${sel.ko} 대운 점수 근거 보기`, note: `${ageRange(sel)} 대운 <b>${sel.text}(${sel.ko})</b>을 내 원국의 용신 · 기신에 비춰 매긴 점수예요. 그래프의 다른 점을 누르면 그 대운의 근거로 바뀌어요.` })}
      <p class="note">그래프 아래 줄마다 결 · 취 · 재 · 건 표시가 그 포인트가 오는 나이예요. 흐린 표시는 지난 해예요.</p>
    </section>

    ${upcoming.length ? `<h2 class="section-title">다가오는 포인트</h2>
    <section class="card"><div class="rows">
      ${upcoming.slice(0, 8).map(({ ev, it }) => `
        <a class="row ${it.now ? "now" : ""}" href="${yearHref(it.year)}">
          <span class="badge mkbg-${ev.id}">${icon(ev.icon)}</span>
          <span class="body"><b>${it.year}년 · ${it.age}세 · ${ev.name}${ev.pick === "low" ? " 주의" : ""}${it.now ? " (올해)" : ""}</b><small>${it.reason}</small></span>
          <span class="score" style="color:${ev.pick === "low" ? "var(--warn)" : "var(--up)"}">${it.score}</span>
        </a>`).join("")}
    </div></section>` : ""}

    <h2 class="section-title">포인트별 모든 해</h2>
    <section class="card">
      ${events.map((ev) => `
        <div class="event-row">
          <span class="badge mkbg-${ev.id}">${icon(ev.icon)}</span>
          <div class="grow"><b>${ev.name}</b><small>${ev.phrase}</small>
            <div class="chips">${ev.items.map((it) => `<a class="chip ${it.past ? "past" : it.now ? "now" : ev.pick === "low" ? "warn" : "up"}" href="#fortune${it.year === today.getFullYear() ? "" : `/${it.year}`}">${it.year}년 · ${it.age}세 · ${it.score}점${it.past ? " (지남)" : it.now ? " (올해)" : ""}</a>`).join("")}</div>
          </div>
        </div>`).join("")}
      <p class="note">해마다 대운(40%)과 그해 세운(60%)의 영역 점수에 그해 십신·일지 합·도화를 더해 고른 해예요. 누르면 그해 운세로 가요. ${HEALTH_NOTICE}</p>
      ${basisList(events.flatMap((ev) => ev.items.map((it) => `<b>${ev.short} ${it.year}년(${it.age}세)</b> · ${it.basis} → ${it.score}점`)), { title: "포인트별 계산 근거 보기", note: "결혼은 연애 · 배우자, 취업은 직업, 재물은 재물, 건강은 건강 영역 점수를 썼어요. 건강은 가장 낮은 해를 골라요." })}
    </section>

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
    ${topbar("맞는 일", whoChip(model))}
    ${subnav("job", "me")}
    <section class="card hero">
      <span class="chip">${top.name} ${top.count}개 · ${top.meaning}의 사주</span>
      <p class="headline" style="color:#fff;margin:12px 0 8px">${fit[0].name},<br>${fit[1].name} 쪽이 잘 맞아요</p>
      <p class="sub">지금은 ${GOD_THEME[cur.stemGod]}의 시기${next ? `, ${next.startAge}세부터는 ${GOD_THEME[next.stemGod]}로 넓혀 가요.` : "예요."}</p>
    </section>
    <section class="card">
      <div class="card-head"><h2>직종 적합도</h2><span class="sub">100점 기준</span></div>
      ${hBars(fit.slice(0, 6).map((j, i) => ({ label: j.name, value: j.score, fillClass: i < 2 ? "" : i < 4 ? "weak" : "soft-only" })))}
      <p class="note">${josa(`${top.name}(${top.meaning})`, "이/가")} 가장 많아서 ${fit[0].name} 계열 점수가 높게 나왔어요.</p>
      ${basisBox(fit[0].factors, { title: `1위 ${fit[0].name} 근거 보기`, note: "직종마다 중요한 십신을 몇 개 가졌는지(2개까지)와, 관련 오행이 내 용신 · 희신인지로 매겨요.", total: fit[0].score })}
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

// ── 6. 나의 기질 (나 탭): 타고난 성향 + 맨 아래 설정 ─────────────────────────────
export function renderMe(model, theme, account) {
  const { natal, saju } = model;
  const dmInfo = DAY_MASTER[natal.dm];
  const dmEl = STEMS[natal.dm].element;
  const total = natal.elementCount.reduce((a, b) => a + b, 0);
  const order = [0, 1, 2, 3, 4].sort((a, b) => natal.elementCount[b] - natal.elementCount[a]);
  const topEl = order[0];
  const zeros = order.filter((e) => natal.elementCount[e] === 0);
  const monthBranch = BRANCHES[saju.pillars.month.branch];
  const season = Object.values(JOHU).find((j) => j.branches.includes(saju.pillars.month.branch));
  const groups = godGroups(natal);
  const topGroup = [...groups].sort((a, b) => b.count - a.count)[0];
  const keywords = [...dmInfo.keywords, topGroup.meaning.split("·")[0] + " 중심", natal.strong ? "주관 뚜렷" : "협력형", natal.johu ? `${natal.johu.label}생` : "온화한 계절"];
  const health = healthCheck(natal);
  const watch = [...health].sort((a, b) => b.value - a.value).slice(0, 2);
  const cur = model.life.points[model.life.currentIndex] || model.life.points[0];

  return `
    ${topbar("나의 기질", whoChip(model))}
    ${subnav("me", "me")}
    <p class="eyebrow">${natal.dmName} 일간 · ${season ? season.label + " " : ""}${monthBranch.ko}월생 · ${natal.strong ? "신강" : "신약"}</p>
    <p class="headline">${dmInfo.image} 같은 사람</p>

    <section class="card">
      <div class="essence"><span class="orb bg-${dmEl} el-${dmEl}">${icon(ELEMENT_ICONS[dmEl])}</span>
        <div><p class="sub">나의 본질 · ${natal.dmName}</p><h2>${dmInfo.image}</h2><p>${dmInfo.desc}</p></div></div>
      <div class="chips" style="margin-top:12px">${keywords.map((k) => `<span class="chip">${k}</span>`).join("")}</div>
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
      <div class="card-head"><h2>십성 5그룹</h2><span class="sub">일간을 뺀 글자 수</span></div>
      <div class="five">${groups.map((g) => `<div class="${g.count ? "" : "zero"}"><span class="orb" style="background:var(--accent-soft);color:var(--accent)">${icon(g.icon)}</span><small>${g.name}·${g.meaning.split("·")[0]}</small><b>${g.count}</b></div>`).join("")}</div>
      <p class="note">${josa(`${topGroup.name}(${topGroup.meaning})`, "이/가")} ${topGroup.count}개로 가장 많아요. <a href="#job" style="color:var(--accent)">맞는 일 보기 ›</a></p>
    </section>

    <section class="card" id="health">
      <div class="card-head"><h2>타고난 건강 체크</h2><span class="sub">높을수록 신경 쓸 곳</span></div>
      ${hBars(health.map((h) => ({ label: `${h.label}`, value: h.value, right: `${h.state} · ${h.value}`, fillClass: h.value >= 60 ? "now" : h.value >= 40 ? "" : "weak" })))}
      <p class="note">${watch.map((h) => `<b>${ELEMENTS[h.element].ko}(${h.state})</b> ${h.tip}.`).join(" ")} 지금 대운 건강운은 ${cur.domains.health}점이에요. ${actionText("health", cur.domains.health)}</p>
      <p class="note">${HEALTH_NOTICE}</p>
      ${basisList(health.map((h) => `<b>${ELEMENTS[h.element].ko}(${ELEMENTS[h.element].han}) ${h.value}</b> · ${h.why}`), { note: "오행이 원국에 없거나(0개) 몰려 있으면(3개 이상), 그리고 기신 오행이면 그 오행에 대응하는 몸을 더 살펴보라고 봐요 (명리의 오행 · 장부 대응)." })}
    </section>
    ${guideCard(GUIDES.health, "건강 챙기기")}

    <h2 class="section-title">설정</h2>
    <section class="card">
      <div class="card-head"><h2>화면 테마</h2><span class="sub">그래프 색이 함께 바뀌어요</span></div>
      <div class="themes">${themeButtons(theme)}</div>
    </section>
    ${accountCard(account)}
    <a class="btn soft" href="#charts">${icon("list", 'style="width:18px;height:18px"')}명식 목록 · 가족 명식 관리</a>
    <a class="btn soft" href="#intro" style="margin-top:8px">${icon("sparkle", 'style="width:18px;height:18px"')}앱 소개 다시 보기</a>
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

// ── 7. 만세력 (명식표 · 대운 · 세운 · 월운 · 일진 달력) ─────────────────────────────
export function renderChart(model, calOffset = 0) {
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
    ${notices.length ? `<ul class="notices">${notices.map((n) => `<li class="warn">${esc(n.text)}</li>`).join("")}</ul>` : ""}`;

  const links = `
    <a class="btn soft" href="#basis">${icon("book", 'style="width:18px;height:18px"')}해석 기준 · 점수 계산법 보기</a>
    <p class="disclaimer">${profile.time ? "" : "시간을 모르면 시주를 비워두고 세 기둥으로 해석해요. "}${DISCLAIMER}</p>`;

  const tile = (p, part) => {
    if (!p) return `<div class="tile empty">?</div>`;
    const idx = part === "stem" ? p.stem : p.branch;
    const info = part === "stem" ? STEMS[idx] : BRANCHES[idx];
    const e = info.element;
    return `<div class="tile bg-${e} el-${e}">${info.han}<small>${info.ko}${ELEMENTS[e].ko}</small></div>`;
  };
  const cell = (p, fn, cls = "sm") => `<div class="${cls}">${p ? fn(p) : "·"}</div>`;
  const daeunDesc = [...saju.daeun.list].reverse();

  return head + dayMasterCard(model) + `
    <section class="card">
      <div class="pillar-table">
        <span></span>${order.map(([, n]) => `<div class="h">${n}</div>`).join("")}
        <span class="h">십성</span>${order.map(([k]) => cell(P[k], (p) => `<span class="god ${k === "day" ? "me" : ""}">${k === "day" ? "일간(나)" : p.stemGod}</span>`)).join("")}
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
    ${seunCard(model)}
    ${wolunCard(model)}
    ${calendarCard(model, calOffset)}
    <div class="pair">
      <section class="card"><span class="sub">지금 대운 ${cur ? ageRange(cur) : ""}</span><b>${cur ? `${cur.ko} · ${cur.stemGod}` : "-"}</b><span class="sub">${cur ? `${GOD_THEME[cur.stemGod]}이 커지는 10년` : ""}</span></section>
      <section class="card"><span class="sub">올해 ${year.year}</span><b>${saju.seun.ko} · ${saju.seun.stemGod}</b><span class="sub">${GOD_THEME[saju.seun.stemGod]} · 종합 ${year.scores.total}점</span></section>
    </div>` + links;
}

// 세운: 지금 대운 10년(대운 전이면 올해 앞뒤 10년)의 해마다 들어오는 간지. 대운 칸처럼 최근 해가 왼쪽
function seunCard(model) {
  const { saju, natal, today } = model;
  const thisYear = today.getFullYear();
  const birth = birthYearOf(model);
  const cur = saju.daeun.list.find((d) => d.current);
  const from = cur ? cur.startYear : thisYear - 4;
  const years = Array.from({ length: 10 }, (_, i) => from + 9 - i).filter((y) => y >= birth && y <= 2100);
  const cells = years.map((y) => {
    const idx = (((y - 4) % 60) + 60) % 60;
    const stem = idx % 10;
    const branch = idx % 12;
    const se = STEMS[stem].element;
    const be = BRANCHES[branch].element;
    return `<a class="col ${y === thisYear ? "now" : ""}" href="#fortune${y === thisYear ? "" : `/${y}`}" title="${y}년 ${STEMS[stem].ko}${BRANCHES[branch].ko} · ${tenGod(natal.dm, stem)}">
        <div class="age">${String(y).slice(2)}년</div>
        <div class="cell bg-${se} el-${se}">${STEMS[stem].ko}</div>
        <div class="cell bg-${be} el-${be}">${BRANCHES[branch].ko}</div>
        <div class="god-sm">${tenGod(natal.dm, stem)}</div>
        <div class="age">${y - birth + 1}세</div>
      </a>`;
  });
  return `<section class="card">
      <div class="card-head"><h2>세운</h2><span class="sub">${cur ? `${cur.ko} 대운 ${from}~${from + 9}년` : `${from}~${from + 9}년`} · 누르면 그해 운세</span></div>
      <div class="daeun-strip seun-strip">${cells.join("")}</div>
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
    ${topbar(chart ? "명식 수정" : "새 명식 입력")}
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
      <details class="more-opt"><summary>보정 설정</summary>
        <div class="form">
          <label class="check"><input type="checkbox" name="applyDst" ${p.applyDst !== false ? "checked" : ""}> 서머타임 기간(1948~51·55~60·87~88)이면 1시간 빼기</label>
          <label class="check"><input type="checkbox" name="nightZi" ${p.nightZi ? "checked" : ""}> 야자시 사용 (23시대 일주를 그날로)</label>
        </div>
      </details>
      <p class="sub" style="font-size:12px;color:var(--muted)">절기 경계일·서머타임은 자동으로 보정하고(시주는 서울 기준 지방시), 결과가 갈릴 수 있으면 안내해 드려요.</p>
      ${error ? `<p class="form-error">${esc(error)}</p>` : ""}
      <button class="btn" type="submit">${icon("trend", 'style="width:18px;height:18px"')}그래프로 보는 사주</button>
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

// 고른 시각이 대략 어느 시(時)인지 (서울 경도로 지방시를 맞춘 값, 서머타임·옛 표준시는 결과 화면에서 보정)
export function timeHint(hour, minute, longitude) {
  if (hour == null || hour < 0 || Number.isNaN(hour)) return "";
  const lmt = (hour * 60 + minute + Math.round((longitude / 15 - 9) * 60) + 1440) % 1440;
  const branch = Math.floor((lmt / 60 + 1) / 2) % 12;
  const shift = Math.round((9 - longitude / 15) * 60);
  return `${BRANCHES[branch].ko}시(${BRANCHES[branch].han}時) · 서울 기준 ${shift}분을 뺀 지방시 ${String(Math.floor(lmt / 60)).padStart(2, "0")}:${String(lmt % 60).padStart(2, "0")} 기준`;
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
    <p class="note">새 명식은 <a href="#home" style="color:var(--accent)">홈 화면</a> 오른쪽 위 ＋ 버튼으로 추가해요.</p>
    <p class="disclaimer">가족·지인 명식은 본인 동의를 받은 뒤 저장해 주세요. 생년월일시는 로그인한 본인만 읽을 수 있게 저장돼요.</p>`;
}

const GOOGLE_LOGO = `<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;

// ── 만세력: 나의 일간 카드 ─────────────────────────────
function dayMasterCard(model) {
  const { natal } = model;
  const stem = STEMS[natal.dm];
  const e = stem.element;
  const info = DAY_MASTER[natal.dm];
  return `<section class="card dm-card">
      <span class="tile bg-${e} el-${e}">${stem.han}<small>${stem.ko}${ELEMENTS[e].ko}</small></span>
      <div class="grow">
        <p class="sub">나의 일간 · 일주의 천간 = 나 자신</p>
        <b>${natal.dmName} · ${stem.yang ? "양" : "음"}${ELEMENTS[e].ko}</b>
        <p>${info.image} — ${info.desc}</p>
        <div class="chips">
          <span class="chip">${natal.strong ? "신강" : "신약"}</span>
          <span class="chip up">용신 ${elementLabel(natal.yong)}</span>
          <span class="chip">희신 ${elementLabel(natal.hee)}</span>
          <span class="chip warn">기신 ${natal.gi.map((g) => ELEMENTS[g].ko).join("·")}</span>
        </div>
        <a class="basis-link" href="#basis">왜 이렇게 보나요? 해석 기준 보기 ›</a>
      </div>
    </section>`;
}

// ── 10. 상세 문의 ─────────────────────────────
const topicOf = (id) => TOPICS.find((t) => t.id === id);
const topicColor = { water: 4, fire: 1, earth: 2, metal: 3, wood: 0 };

export function renderAsk(model, topicId, yearArg, ctx) {
  const topic = topicOf(topicId);
  if (!topic) return renderAskHub(model, ctx);
  if (topic.kind === "match") return renderMatch(model, topic, ctx);
  if (topic.kind === "aptitude") return renderPath(model, topic);
  return renderTopic(model, topic, yearArg);
}

function renderAskHub(model, ctx) {
  const thisYear = model.today.getFullYear();
  const others = ctx.charts.filter((c) => c.id !== model.profile.id).length;
  return `
    ${topbar("상담", whoChip(model))}
    <p class="headline">궁금한 일을<br><em>자세히</em> 살펴보세요</p>
    <div class="topic-grid">
      ${TOPICS.map((t) => {
        const sub = t.kind === "match"
          ? (others ? `저장된 명식 ${others}개와 비교` : "비교할 명식을 먼저 입력")
          : t.kind === "aptitude"
            ? `1위 ${majorFit(model.natal)[0].name}`
            : `${thisYear}년 ${topicFlow(model.natal, t.id, thisYear).score}점`;
        return `<a class="card topic-card" href="#ask/${t.id}">
          <span class="ico fill-${topicColor[t.color]}">${icon(t.icon)}</span>
          <b>${t.name}</b><small>${t.question}</small><span class="chip">${sub}</span>
        </a>`;
      }).join("")}
    </div>
    ${disclaimer()}`;
}

function renderTopic(model, topic, yearArg) {
  const { natal, today } = model;
  const thisYear = today.getFullYear();
  const y = Number(yearArg) >= 1900 && Number(yearArg) <= 2100 ? Number(yearArg) : thisYear;
  const flow = topicFlow(natal, topic.id, y);
  const isCur = y === thisYear;
  const isPast = y < thisYear;
  const m = isCur ? sajuMonth(today) : isPast ? 13 : 0;
  const stateOf = (mo) => (isCur ? (mo.month < m ? "past" : mo.month === m ? "now" : "future") : isPast ? "past" : "future");
  const ranked = [...flow.months].filter((mo) => !isCur || mo.month >= m).sort((a, b) => b.score - a.score);
  // 좋은 달은 피할 달(가장 낮은 달)을 빼고 최대 3개
  const worst = ranked.length > 1 ? ranked[ranked.length - 1] : null;
  const best = ranked.slice(0, Math.min(3, ranked.length - (worst ? 1 : 0))).sort((a, b) => a.month - b.month);
  const bestYear = flow.decade.reduce((a, b) => (b.score > a.score ? b : a));
  const advice = flow.score >= 65 ? topic.high : flow.score >= 45 ? topic.mid : topic.low;
  const col = topicColor[topic.color];

  let extra = "";
  if (topic.id === "move") {
    extra = `<section class="card">
      <div class="card-head"><h2>방향</h2><span class="sub">용신 · 희신 · 기신 오행의 방위</span></div>
      <div class="dir-grid">
        <div class="dir good"><small>좋은 방향</small><b>${DIRECTIONS[natal.yong]}</b><span>용신 ${elementLabel(natal.yong)}</span></div>
        <div class="dir good"><small>그다음</small><b>${DIRECTIONS[natal.hee]}</b><span>희신 ${elementLabel(natal.hee)}</span></div>
        <div class="dir bad"><small>피하면 좋은 방향</small><b>${natal.gi.map((g) => DIRECTIONS[g]).join(" · ")}</b><span>기신 ${natal.gi.map((g) => ELEMENTS[g].ko).join("·")}</span></div>
      </div>
      <p class="note">지금 사는 곳을 기준으로 한 방향이에요. 거리보다 생활(직장 · 학교 · 병원)이 먼저예요.</p>
    </section>`;
  }
  if (topic.money) {
    const risk = riskAppetite(natal);
    extra = `<section class="card">
      <div class="card-head"><h2>타고난 투자 성향</h2><span class="sub">편재 · 겁재 · 인성으로 본 성향</span></div>
      ${hBars([{ label: risk >= 65 ? "공격형 — 크게 벌고 크게 잃기 쉬움" : risk >= 40 ? "균형형 — 나눠서 천천히" : "안정형 — 지키는 쪽이 편함", value: risk, right: `${risk}`, fillClass: risk >= 65 ? "now" : "" }])}
      <p class="note">특정 종목 · 매물 · 매수 · 매도 시점을 추천하지 않아요. 흐름이 좋은 때에도 아래 점검 목록을 먼저 확인하세요.</p>
    </section>`;
  }

  return `
    ${topbar(topic.name, whoChip(model))}
    ${yearNav(`#ask/${topic.id}`, { year: y, ko: flow.ko }, model)}
    <section class="card" style="text-align:center">
      ${gaugeChart({ value: flow.score, caption: `${y}년 ${topic.short}운` })}
      <p style="font-weight:700;margin-top:4px">${topic.question}</p>
      <p style="font-weight:800;color:var(--accent)">${isPast ? "지난 해 기록이에요" : advice}</p>
      <p class="sub" style="margin-top:6px">${flow.ko}년 · ${flow.reason}</p>
      ${basisBox(flow.factors, { note: `${y}년 세운 <b>${flow.ko}</b>을 ${topic.name}에 맞춘 십신 가중치로 매긴 점수예요. 달마다 점수는 세운 35% + 월운 65%로 섞어요.` })}
    </section>

    <section class="card">
      <div class="card-head"><h2>달마다 ${topic.short}운</h2><span class="sub">절기 기준</span></div>
      <p class="lead">${isPast ? "가장 좋았던 달" : `좋은 달${isCur ? "(남은 달 기준)" : ""}`}: <b>${best.map((b) => `${b.month}월`).join(" · ")}</b>${worst ? ` · ${isPast ? "힘들었던" : "피할"} 달: ${worst.month}월` : ""}</p>
      ${barChart({ bars: flow.months.map((mo) => ({ label: mo.month, value: mo.score, state: stateOf(mo), show: best.includes(mo) || mo.month === m })), caption: `${y}년 ${topic.name} 월별 점수` })}
      <div class="chips" style="margin-top:10px">${best.map((b) => `<span class="chip up">${b.month}월 ${b.ko}월 ${b.score}점</span>`).join("")}</div>
    </section>

    <section class="card">
      <div class="card-head"><h2>앞으로 10년</h2><span class="sub">${y}~${y + 9}년</span></div>
      <p class="lead">가장 좋은 해는 <b>${bestYear.year}년(${bestYear.ko}) ${bestYear.score}점</b></p>
      ${barChart({ bars: flow.decade.map((d) => ({ label: String(d.year).slice(2), value: d.score, state: d.year === thisYear ? "now" : d.year < thisYear ? "past" : "future", show: d === bestYear || d.year === thisYear })), caption: `${topic.name} 10년 점수` })}
    </section>

    ${extra}

    <section class="card">
      <div class="card-head"><h2>스스로 점검할 것</h2></div>
      <ul class="checklist">${topic.checklist.map((c) => `<li>${c}</li>`).join("")}</ul>
    </section>
    ${topic.guides ? guideCard(topic.guides, "도움 받을 곳") : ""}
    ${topic.link ? `<a class="btn soft" href="${topic.link.href}">${topic.link.label}</a>` : ""}
    <p class="disclaimer">${topic.money ? "투자 판단과 책임은 본인에게 있어요. " : ""}${DISCLAIMER}</p>`;
}

function renderMatch(model, topic, ctx) {
  const isChild = topic.id === "child";
  const list = ctx.charts.filter((c) => c.id !== model.profile.id);
  const sorted = isChild ? [...list.filter((c) => c.relation === "자녀"), ...list.filter((c) => c.relation !== "자녀")] : list;
  const partnerChart = sorted.find((c) => c.id === ctx.partnerId) || sorted[0];
  const head = `
    ${topbar(topic.name, whoChip(model))}`;

  if (!partnerChart) {
    return head + `
      <section class="card">
        <div class="card-head"><h2>비교할 명식이 없어요</h2></div>
        <p style="font-size:15px">홈 화면 오른쪽 위 ＋ 버튼(새 명식 입력)으로 ${isChild ? "자녀의" : "상대의"} 생년월일을 먼저 저장해 주세요. 관계를 "${isChild ? "자녀" : "배우자 · 지인"}"로 고르고, 본인 동의를 받은 뒤 저장하면 여기서 바로 비교할 수 있어요.</p>
      </section>
      <a class="btn soft" href="#home">${icon("home", 'style="width:18px;height:18px"')}홈으로 가기</a>
      ${disclaimer()}`;
  }

  const me = { saju: model.saju, natal: model.natal };
  const ps = calculateSaju({ ...partnerChart, today: model.today });
  const partner = { saju: ps, natal: analyzeNatal(ps) };
  const r = matchScore(me, partner);
  const band = r.total >= 75 ? "서로 힘이 되는 사이" : r.total >= 60 ? "노력하면 잘 맞는 사이" : r.total >= 45 ? "다름을 인정하면 편해지는 사이" : "부딪힐 때 한 박자 쉬어 가는 사이";
  const weakest = [...r.parts].sort((a, b) => a.score - b.score)[0];
  const tips = {
    dm: "말하는 방식이 달라요. 결론부터 말하기 전에 상대의 이야기를 끝까지 들어 주세요.",
    day: "생활 리듬이 달라요. 집안일 · 휴식 시간을 미리 정해 두면 다툼이 줄어요.",
    zodiac: "첫인상 · 가치관에서 엇갈리기 쉬워요. 큰 결정은 하루 미뤄 두고 다시 이야기하세요.",
    fill: "서로의 부족한 기운을 채워 주기 어려워요. 각자 좋아하는 활동 시간을 존중해 주세요.",
  };
  const pe = STEMS[partner.natal.dm].element;
  const myE = STEMS[model.natal.dm].element;
  const pick = `<label class="field partner-pick"><span>${isChild ? "자녀 고르기" : "비교할 사람"}</span>
      <select class="input" data-partner>${sorted.map((c) => `<option value="${esc(c.id)}" ${c.id === partnerChart.id ? "selected" : ""}>${esc(c.name || "이름 없음")} · ${esc(c.relation || "")} · ${esc(c.date)}</option>`).join("")}</select>
    </label>`;

  let childCard = "";
  if (isChild) {
    const cs = childStar(me, partner);
    const parentTips = [
      "친구 같은 관계예요. 다정하되 부모로서 지킬 선은 분명히 해 주세요.",
      "아이를 아끼고 챙겨 주는 관계예요. 다 해 주기보다 스스로 해 볼 기회를 주세요.",
      "부모가 아이를 이끌려 하기 쉬워요. 잔소리 대신 기다려 주고 선택지를 주세요.",
      "아이의 주장이 강하게 느껴질 수 있어요. 규칙은 아이와 함께 정해 보세요.",
      "아이가 부모에게 힘이 되는 관계예요. 작은 일에도 칭찬을 자주 해 주세요.",
    ];
    childCard = `<section class="card">
      <div class="card-head"><h2>부모 · 자녀로 보면</h2></div>
      <p style="font-size:15px">${parentTips[r.rel]}</p>
      <p class="note">${model.natal.gender === "F" ? "엄마" : "아빠"} 사주의 자녀성은 <b>${elementLabel(cs.star)}</b>이고, 아이의 일간은 ${josa(elementLabel(pe), "이에요/예요")}. ${cs.match ? "자녀성과 같아서 서로 마음이 잘 통하기 쉬워요." : "자녀성과 달라서 아이만의 방식을 인정해 주면 더 가까워져요."}</p>
    </section>`;
  }

  return head + `
    ${pick}
    <section class="card" style="text-align:center">
      <div class="vs">
        <div><span class="who-orb bg-${myE} el-${myE}">${STEMS[model.natal.dm].han}</span><small>${esc(model.profile.name || "나")}</small></div>
        <span class="vs-mark">${icon("heart")}</span>
        <div><span class="who-orb bg-${pe} el-${pe}">${STEMS[partner.natal.dm].han}</span><small>${esc(partnerChart.name || "상대")}</small></div>
      </div>
      ${gaugeChart({ value: r.total, caption: `${topic.short} 점수` })}
      <p style="font-weight:800;color:var(--accent)">${band}</p>
    </section>
    <section class="card">
      <div class="card-head"><h2>어디가 잘 맞을까</h2><span class="sub">100점 기준</span></div>
      ${hBars(r.parts.map((p) => ({ label: `${p.label} · ${p.note}`, value: p.score, right: `${p.score}`, fillClass: p.score >= 70 ? "" : p.score >= 50 ? "weak" : "now" })))}
      <p class="note"><b>${weakest.label}</b>${josa(weakest.label.replace(/\s*\(.*\)/, ""), "이/가").slice(-1)} 가장 낮아요. ${tips[weakest.id]}</p>
      ${basisBox(r.basis, { raw: true, total: r.total, note: "종합 = 성격 30% + 생활 25% + 띠 15% + 오행 보완 30%. 일간은 오행의 생극(상생 · 상극)과 천간합, 일지 · 띠는 지지의 육합 · 삼합 / 충 · 원진으로 봐요." })}
    </section>
    ${childCard}
    <p class="disclaimer">궁합은 관계의 정답이 아니라 서로를 이해하는 참고 자료예요. ${DISCLAIMER}</p>`;
}

// ── 상세 문의: 진로 · 적성 (학생용) ─────────────────────────────
function renderPath(model, topic) {
  const { natal, today, saju } = model;
  const thisYear = today.getFullYear();
  const majors = majorFit(natal);
  const jobs = jobFit(natal).slice(0, 5);
  const groups = godGroups(natal).sort((a, b) => b.count - a.count);
  const top = groups[0];
  const empty = groups.filter((g) => g.count === 0);
  const style = STUDY_STYLE[top.id];
  const exam = topicFlow(natal, "exam", thisYear);
  const birth = birthYearOf(model);
  const bestExam = exam.decade.reduce((a, b) => (b.score > a.score ? b : a));
  const dm = DAY_MASTER[natal.dm];

  return `
    ${topbar(topic.name, whoChip(model))}
    <p class="eyebrow">${natal.dmName} 일간 · ${top.name}(${top.meaning}) ${top.count}개 · ${saju.koreanAge}세</p>
    <p class="headline"><em>${majors[0].name}</em>,<br>${majors[1].name} 계열이 잘 맞아요</p>

    <section class="card">
      <div class="card-head"><h2>맞는 학과 계열</h2><span class="sub">100점 기준</span></div>
      ${hBars(majors.map((mj, i) => ({ label: `${mj.name} <small class="muted-inline">${mj.examples}</small>`, value: mj.score, fillClass: i < 2 ? "" : i < 4 ? "weak" : "soft-only" })))}
      <p class="note">${josa(majors[0].name, "은/는")} ${Object.keys(majors[0].gods).join(" · ")}이 있을수록 높아요. 내 사주에는 ${Object.keys(majors[0].gods).map((g) => `${g} ${natal.godCount[g] || 0}개`).join(", ")}가 있어요.</p>
      ${basisBox(majors[0].factors, { title: `1위 ${majors[0].name} 근거 보기`, total: majors[0].score })}
      ${basisBox(majors[1].factors, { title: `2위 ${majors[1].name} 근거 보기`, total: majors[1].score })}
    </section>

    <section class="card">
      <div class="card-head"><h2>나에게 맞는 공부 방법</h2></div>
      <div class="study">
        <span class="ico fill-0">${icon("book")}</span>
        <div><b>${style.title}</b><p>${style.tip}</p></div>
      </div>
      <p class="note"><b>타고난 기질</b> · ${dm.image} — ${dm.desc}</p>
      ${empty.length ? `<p class="note"><b>보완할 점</b> · ${empty.map((g) => STUDY_WEAK[g.id]).join(" ")}</p>` : ""}
    </section>

    <section class="card">
      <div class="card-head"><h2>시험 · 입시 흐름</h2><span class="sub">${thisYear}~${thisYear + 9}년</span></div>
      <p class="lead">공부한 만큼 결과가 잘 나는 해: <b>${bestExam.year}년(${bestExam.year - birth + 1}세) ${bestExam.score}점</b></p>
      ${barChart({ bars: exam.decade.map((d) => ({ label: `${d.year - birth + 1}세`, value: d.score, state: d.year === thisYear ? "now" : "future", show: d === bestExam || d.year === thisYear })), caption: "앞으로 10년 시험운" })}
      <a class="more" href="#ask/exam">시험 · 합격 달마다 보기</a>
    </section>

    <section class="card">
      <div class="card-head"><h2>나중에 잘 맞을 일</h2><span class="sub">직종 적합도</span></div>
      <div class="chips">${jobs.map((j) => `<span class="chip">${j.name} ${j.score}</span>`).join("")}</div>
      <a class="more" href="#job">맞는 일 · 자격증 자세히</a>
    </section>

    ${guideCard(topic.guides, "진로 검사 · 학과 정보")}
    <p class="disclaimer">진로는 흥미 · 성적 · 적성검사와 함께 정하세요. 사주는 방향을 생각해 보는 참고 자료예요. ${DISCLAIMER}</p>`;
}

// ── 11. 해석 기준 (#basis): 내 원국을 어떻게 분석했고 점수를 어떻게 매기는지 ─────────────────────────────
export function renderBasis(model) {
  const { natal, saju } = model;
  const b = natal.basis;
  const P = saju.pillars;
  const order = [["year", "연주"], ["month", "월주"], ["day", "일주"], ["hour", "시주"]];
  const roleChip = (e) => `<span class="chip ${natal.roles[e] === "yong" || natal.roles[e] === "hee" ? "up" : natal.roles[e] === "gi" ? "warn" : ""}">${ROLE_NAME[natal.roles[e]]}</span>`;
  const relName = { self: "비겁 (나와 같은 오행)", output: "식상 (내가 생하는 오행)", wealth: "재성 (내가 극하는 오행)", power: "관성 (나를 극하는 오행)", resource: "인성 (나를 생하는 오행)" };
  return `
    ${topbar("해석 기준", whoChip(model))}
    <p class="lead" style="margin-top:4px!important">이 앱의 모든 점수는 아래 순서로 계산해요. 자평명리의 일반 원칙을 단순화한 규칙이며, 학파마다 판단이 다를 수 있어요.</p>

    <section class="card">
      <div class="card-head"><h2>① 원국의 글자와 오행</h2><span class="sub">천간 + 지지 본기</span></div>
      <table class="basis-table">
        <tr><th>자리</th><th>천간</th><th>지지</th><th>지장간</th></tr>
        ${order.map(([k, n]) => P[k] ? `<tr><td>${n}</td><td>${STEMS[P[k].stem].han} ${ELEMENTS[STEMS[P[k].stem].element].ko}</td><td>${BRANCHES[P[k].branch].han} ${ELEMENTS[BRANCHES[P[k].branch].element].ko}</td><td>${P[k].hidden.map((h) => h.han).join(" ")}</td></tr>` : `<tr><td>${n}</td><td colspan="3">시간 모름</td></tr>`).join("")}
      </table>
      <p class="note">오행 개수: ${ELEMENTS.map((el, e) => `${el.ko} ${natal.elementCount[e]}`).join(" · ")}. 일간 <b>${natal.dmName}</b>을 "나"로 두고 나머지 글자와의 관계(십신)를 봐요.</p>
      <table class="basis-table">
        <tr><th>오행</th><th>나와의 관계</th><th>역할</th></tr>
        ${Object.keys(natal.rel).map((k) => `<tr><td>${elementLabel(natal.rel[k])}</td><td>${relName[k]}</td><td>${roleChip(natal.rel[k])}</td></tr>`).join("")}
      </table>
    </section>

    <section class="card">
      <div class="card-head"><h2>② 신강 · 신약</h2><span class="sub">나를 돕는 기운의 비율</span></div>
      <p class="lead">나를 돕는 기운(비겁 · 인성) <b>${b.support.toFixed(1)}</b> / 전체 <b>${b.total.toFixed(1)}</b> = <b>${b.pct}%</b> → ${natal.strong ? "50% 이상이라 <b>신강</b>" : "50% 미만이라 <b>신약</b>"}</p>
      <table class="basis-table">
        <tr><th>자리 · 글자</th><th>오행</th><th>무게</th><th>나를 돕나</th></tr>
        ${b.strengthRows.map((r) => `<tr><td>${r.pos}</td><td>${elementLabel(r.element)}</td><td>${r.weight.toFixed(2)}</td><td>${r.helps ? "돕는다" : "-"}</td></tr>`).join("")}
      </table>
      <p class="note">무게: 천간 1, 연지 1, <b>월지 3</b>(태어난 계절 · 월령이 가장 큼), 일지 1.5, 시지 1. 지지는 속에 든 지장간 비중(${Object.entries(HIDDEN_WEIGHT).map(([n, w]) => `${n}개면 ${w.map((x) => Math.round(x * 100) + "%").join(" · ")}`).join(", ")})으로 나눠요.</p>
    </section>

    <section class="card">
      <div class="card-head"><h2>③ 용신 · 희신 · 기신</h2></div>
      <ul class="basis-ul">
        ${natal.johu ? `<li><b>조후</b> · ${BRANCHES[P.month.branch].han}월(${natal.johu.label})생은 계절의 온도를 먼저 맞춰요. 겨울(亥子丑)은 화(火), 여름(巳午未)은 수(水).</li>` : `<li><b>조후</b> · 봄 · 가을생이라 온도보다 강약을 먼저 봐요.</li>`}
        <li><b>용신 ${elementLabel(natal.yong)}</b> · ${b.yongWhy}</li>
        <li><b>희신 ${elementLabel(natal.hee)}</b> · ${b.heeWhy}</li>
        <li><b>기신 ${natal.gi.map((g) => elementLabel(g)).join(" · ")}</b> · ${b.giWhy}</li>
      </ul>
    </section>

    <section class="card">
      <div class="card-head"><h2>④ 점수 계산</h2><span class="sub">대운 · 세운 · 월운 · 일진 공통</span></div>
      <ol class="basis-ol">
        <li><b>기본 ${SCORE.center}점</b>에서 시작해요.</li>
        <li><b>천간 40% + 지지 60%</b>: 들어오는 글자의 오행이 용신이면 더하고 기신이면 빼요. 역할값 ${Object.entries(ROLE_VALUE).map(([k, v]) => `${ROLE_NAME[k]} ${v}`).join(" · ")} × ${SCORE.spread}점. 지지는 지장간마다 비중을 나눠 계산해요.</li>
        <li><b>영역 가중치</b>: 재물이면 재성 · 식상, 직업이면 관성 · 인성처럼 영역에 중요한 십신이면 가점, 방해하면 감점 (±${SCORE.domainSpread}점 × 가중치).</li>
        <li><b>관계 보정</b>: 일지(나 · 배우자 자리) · 시지(자녀 자리)와 육합이면 가점, 충이면 감점. 천간합으로 용신이 생기면 +${SCORE.stemCombineBonus}. 도화(인연) · 역마(이동) · 재고(창고) · 조후 충족도 주제에 따라 더해요.</li>
        <li><b>섞기</b>: 달 점수 = 세운 35% + 월운 65%, 하루 점수 = 일진 70% + 월운 30%, 인생 포인트 = 대운 40% + 세운 60%.</li>
        <li>마지막에 ${SCORE.min}~${SCORE.max}점 안으로 맞춰요.</li>
      </ol>
    </section>

    <section class="card">
      <div class="card-head"><h2>⑤ 십신의 뜻</h2><span class="sub">일간 기준 다른 글자와의 관계</span></div>
      <table class="basis-table">
        <tr><th>십신</th><th>관계</th><th>상징</th></tr>
        ${TEN_GOD_MEANING.map((g) => `<tr><td><b>${g.name}</b></td><td>${g.rel}</td><td>${g.meaning}</td></tr>`).join("")}
      </table>
    </section>

    <section class="card">
      <div class="card-head"><h2>⑥ 합 · 충과 신살</h2></div>
      <ul class="basis-ul">
        <li><b>육합</b> 子丑 · 寅亥 · 卯戌 · 辰酉 · 巳申 · 午未 — 손을 잡아 순하게 풀림</li>
        <li><b>충</b> 子午 · 丑未 · 寅申 · 卯酉 · 辰戌 · 巳亥 — 마주 보고 부딪혀 흔들림 · 변동</li>
        <li><b>삼합</b> 申子辰 · 寅午戌 · 巳酉丑 · 亥卯未 — 같은 방향으로 모임 (궁합)</li>
        <li><b>원진</b> 子未 · 丑午 · 寅酉 · 卯申 · 辰亥 · 巳戌 — 서운함이 쌓임 (궁합)</li>
        <li><b>천간합</b> 甲己(토) · 乙庚(금) · 丙辛(수) · 丁壬(목) · 戊癸(화) — 합해 새 오행이 생김</li>
        <li><b>도화</b> 일지 기준 子 · 午 · 卯 · 酉 — 매력 · 인연 &nbsp; <b>역마</b> 寅 · 申 · 巳 · 亥 — 이동 &nbsp; <b>재고</b> 辰 · 戌 · 丑 · 未 — 창고</li>
      </ul>
    </section>
    <p class="disclaimer">규칙의 숫자는 초안이며 명리 전문가 검수로 보정할 예정이에요. ${DISCLAIMER}</p>`;
}

// ── 만세력: 월운 12개월 (절기 기준, 寅월부터) ─────────────────────────────
function wolunCard(model) {
  const { natal, today } = model;
  const y = today.getFullYear();
  const m = sajuMonth(today);
  // 사주 한 해 = 2월(寅월) ~ 다음 해 1월(丑월). 오른쪽에서 왼쪽으로 흐르게 최근 달이 왼쪽
  const months = [];
  for (let k = 0; k < 12; k++) {
    const cm = ((1 + k) % 12) + 1; // 2,3,…,12,1
    const yy = cm === 1 ? y + 1 : y;
    const p = pillarsOfDate(`${yy}-${String(cm).padStart(2, "0")}-15`).month;
    months.push({ cm, yy, p });
  }
  const cells = months.reverse().map(({ cm, yy, p }) => {
    const se = STEMS[p.stem].element;
    const be = BRANCHES[p.branch].element;
    const now = yy === y && cm === m;
    return `<a class="col ${now ? "now" : ""}" href="#monthly/total${yy === y ? "" : `/${yy}`}" title="${yy}년 ${cm}월 ${pillarKo(p)}월">
        <div class="age">${cm}월</div>
        <div class="god-sm">${tenGod(natal.dm, p.stem)}</div>
        <div class="cell bg-${se} el-${se}">${STEMS[p.stem].ko}</div>
        <div class="cell bg-${be} el-${be}">${BRANCHES[p.branch].ko}</div>
        <div class="god-sm">${tenGod(natal.dm, BRANCHES[p.branch].hidden.at(-1))}</div>
        <div class="age">${twelveStage(natal.dm, p.branch)}</div>
      </a>`;
  });
  return `<section class="card">
      <div class="card-head"><h2>월운</h2><span class="sub">${y}년 2월(寅월) ~ ${y + 1}년 1월(丑월) · 절기 기준</span></div>
      <div class="daeun-strip seun-strip wolun-strip">${cells.join("")}</div>
    </section>`;
}

// ── 만세력: 일진 달력 (절기 한 달 단위로 넘기기) ─────────────────────────────
const kstOf = (jd) => new Date(msFromJd(jd) + 9 * 3600000);
const fmtJie = (jd) => {
  const d = kstOf(jd);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
};
const localDateOfJd = (jd) => {
  const d = kstOf(jd);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

function calendarCard(model, offset = 0) {
  const { natal, today } = model;
  // 지금이 속한 절기 달에서 offset만큼 옮긴 달의 시작 절(節)과 끝(다음 절)
  const base = surroundingJie(jdFromMs(Date.now())).prev.jd;
  const span = surroundingJie(base + offset * 30.4369 + 2);
  const start = span.prev;
  const end = span.next;
  const before = surroundingJie(start.jd - 1).prev;
  const startDay = localDateOfJd(start.jd);
  const endDay = localDateOfJd(end.jd); // 다음 절이 드는 날부터는 다음 달
  const gridStart = new Date(startDay);
  gridStart.setDate(startDay.getDate() - startDay.getDay());
  const gridEnd = new Date(endDay);
  gridEnd.setDate(endDay.getDate() - 1 + (6 - new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate() - 1).getDay()));
  const days = [];
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) days.push(new Date(d));
  const monthPillar = pillarsOfDate(dateKey(new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + 3))).month;
  const todayKey = dateKey(today);
  const mini = (stem, branch) => {
    const se = STEMS[stem].element;
    const be = BRANCHES[branch].element;
    return `<span class="mt bg-${se} el-${se}">${STEMS[stem].ko}</span><span class="mt bg-${be} el-${be}">${BRANCHES[branch].ko}</span>`;
  };
  return `<section class="card cal-card">
      <div class="jie-nav">
        <button class="jie-btn" data-action="cal-move" data-step="-1" aria-label="이전 절기 달"><span>← ${before.name}</span><small>${fmtJie(before.jd)}</small></button>
        <div class="jie-now"><b>${icon("calendar")}${start.name}</b><small>${fmtJie(start.jd)} · ${pillarKo(monthPillar)}월</small></div>
        <button class="jie-btn" data-action="cal-move" data-step="1" aria-label="다음 절기 달"><span>${end.name} →</span><small>${fmtJie(end.jd)}</small></button>
      </div>
      ${offset ? `<p class="yn-back"><button class="link-btn" data-action="cal-move" data-step="0">이번 절기 달로</button></p>` : ""}
      <div class="ilji-cal">
        ${DOW.map((d, i) => `<span class="dow ${i === 0 ? "sun" : ""}">${d}</span>`).join("")}
        ${days.map((d) => {
          const inside = d >= startDay && d < endDay;
          const p = pillarsOfDate(dateKey(d)).day;
          return `<div class="ilji ${inside ? "" : "out"} ${dateKey(d) === todayKey ? "today" : ""}" title="${dateKey(d)} ${pillarKo(p)}일">
            <div class="ilji-top"><b class="${d.getDay() === 0 ? "sun" : ""}">${d.getDate()}</b><small>${tenGod(natal.dm, p.stem)}</small></div>
            ${mini(p.stem, p.branch)}
            <small class="bgod">${tenGod(natal.dm, BRANCHES[p.branch].hidden.at(-1))}</small>
          </div>`;
        }).join("")}
      </div>
      <p class="note">흐린 날은 이 절기 달 밖의 날이에요. 월주는 달력의 1일이 아니라 절입 시각(${start.name})에 바뀌어요.</p>
    </section>`;
}

// ── 12. 생활 가이드 (#guide): 내 만세력을 이해하고 행동 지침으로 ─────────────────────────────
export function renderGuide(model) {
  const { natal, saju, today, life } = model;
  const dm = DAY_MASTER[natal.dm];
  const st = natal.strong ? STRENGTH_GUIDE.strong : STRENGTH_GUIDE.weak;
  const groups = godGroups(natal);
  const many = groups.filter((g) => g.count >= 3);
  const none = groups.filter((g) => g.count === 0);
  const top = [...groups].sort((a, b) => b.count - a.count)[0];
  const yong = ELEMENT_LIFE[natal.yong];
  const hee = ELEMENT_LIFE[natal.hee];
  const ps = pillarsOfDate(dateKey(today));
  const monthGod = tenGod(natal.dm, ps.month.stem);
  const cur = life.points[life.currentIndex] || life.points[0];
  const missing = [0, 1, 2, 3, 4].filter((e) => natal.elementCount[e] === 0);
  const principles = [
    { t: `${natal.dmName} 일간답게`, d: dm.act, why: `일간 ${josa(`${STEMS[natal.dm].ko}(${STEMS[natal.dm].han})`, "은/는")} 나 자신. ${dm.image}의 성질을 살리는 쪽으로 행동하면 편해요.` },
    { t: st.title, d: st.act, why: `나를 돕는 기운(비겁 · 인성)이 ${natal.basis.pct}% → ${natal.strong ? "50% 이상 신강" : "50% 미만 신약"}.` },
    { t: `용신 ${josa(elementLabel(natal.yong), "을/를")} 생활에`, d: `${yong.activities.slice(0, 2).join(", ")}처럼 ${ELEMENTS[natal.yong].ko}의 기운을 일부러 채우세요.`, why: natal.basis.yongWhy },
    { t: `강점: ${top.name}(${top.meaning})`, d: top.count >= 3 ? GROUP_GUIDE[top.id].many : `${josa(top.meaning.split("·").pop(), "이/가").replace(top.meaning.split("·").pop(), top.meaning)} 내 무기예요. 이 힘을 쓰는 일을 맡으세요.`, why: `원국에서 ${top.name}이 ${top.count}개로 가장 많아요.` },
    none.length
      ? { t: `보완: ${none.map((g) => g.name).join(" · ")}`, d: none.map((g) => GROUP_GUIDE[g.id].none).join(" "), why: `원국에 ${none.map((g) => `${g.name}(${g.meaning})`).join(" · ")}이 0개예요.` }
      : { t: "균형 지키기", d: "다섯 십성 그룹이 고르게 있어요. 한쪽으로 쏠리지 않게 일 · 쉼 · 관계를 골고루 챙기세요.", why: "원국에 비어 있는 십성 그룹이 없어요." },
  ];
  const rows = [
    ["색", yong.color, hee.color],
    ["방향", DIRECTIONS[natal.yong], DIRECTIONS[natal.hee]],
    ["시간대", yong.time, hee.time],
    ["계절", yong.season, hee.season],
    ["음식 (맛)", yong.taste, hee.taste],
  ];
  return `
    ${topbar("생활 가이드", whoChip(model))}
    ${subnav("guide", "me")}
    <p class="eyebrow">내 만세력 이해하기 → 이렇게 살면 좋아요</p>
    <p class="headline"><em>${dm.image}</em>,<br>이렇게 살면 더 빛나요</p>

    <section class="card">
      <div class="card-head"><h2>나를 이해하기</h2></div>
      <ul class="basis-ul understand">
        <li><b>나 (일간)</b> · ${natal.dmName} — ${dm.desc}</li>
        <li><b>힘의 크기</b> · ${st.title}. 나를 돕는 기운이 ${natal.basis.pct}%예요.</li>
        <li><b>필요한 기운 (용신)</b> · ${elementLabel(natal.yong)}. ${natal.basis.yongWhy}</li>
        <li><b>도와주는 기운 (희신)</b> · ${elementLabel(natal.hee)}, <b>줄일 기운 (기신)</b> · ${natal.gi.map((g) => elementLabel(g)).join(" · ")}</li>
        ${missing.length ? `<li><b>비어 있는 오행</b> · ${missing.map((e) => elementLabel(e)).join(" · ")} — 생활 습관으로 채워 주면 좋아요.</li>` : ""}
      </ul>
    </section>

    <h2 class="section-title">나의 행동 원칙 5가지</h2>
    <section class="card principles">
      ${principles.map((p, i) => `<div class="principle"><span class="num fill-accent">${i + 1}</span>
        <div><b>${p.t}</b><p>${p.d}</p><small class="why">근거 · ${p.why}</small></div></div>`).join("")}
    </section>

    <section class="card">
      <div class="card-head"><h2>오행 생활 처방</h2><span class="sub">용신 · 희신을 생활에 더하기</span></div>
      <table class="basis-table life-table">
        <tr><th></th><th>용신 ${elementLabel(natal.yong)}</th><th>희신 ${elementLabel(natal.hee)}</th></tr>
        ${rows.map(([k, a, b]) => `<tr><td>${k}</td><td>${a}</td><td>${b}</td></tr>`).join("")}
      </table>
      <div class="chips" style="margin-top:12px">${[...yong.activities, ...hee.activities.slice(0, 2)].map((a) => `<span class="chip up">${a}</span>`).join("")}</div>
      <p class="note"><b>줄이면 좋은 것</b> · ${natal.gi.map((g) => `${ELEMENTS[g].ko}(기신): ${ELEMENT_LIFE[g].avoid}`).join(" / ")}</p>
    </section>

    <section class="card">
      <div class="card-head"><h2>하루 루틴 예시</h2></div>
      <ul class="routine">
        <li><span>아침</span>${natal.yong === 0 || natal.hee === 0 ? "산책 · 스트레칭으로 목(木)의 기운 깨우기" : "물 한 잔 · 가벼운 정리로 하루 시작"}</li>
        <li><span>낮</span>${natal.yong === 1 || natal.hee === 1 ? "햇볕 아래 15분 걷기 · 사람 만나기" : "집중이 필요한 일 먼저 처리하기"}</li>
        <li><span>오후</span>${natal.yong === 3 || natal.hee === 3 ? "책상 정리 · 마감 확인 · 근력 운동" : "규칙적인 식사와 짧은 휴식"}</li>
        <li><span>밤</span>${natal.yong === 4 || natal.hee === 4 ? "일찍 쉬고 하루를 글로 정리하기" : "화면 끄고 잠자리 준비, 내일 할 일 3개 적기"}</li>
      </ul>
    </section>

    <section class="card">
      <div class="card-head"><h2>이번 달 행동 지침</h2><span class="sub">월운 ${pillarKo(ps.month)} · ${monthGod}</span></div>
      <p style="font-size:15px">${GOD_MONTH_ACTION[monthGod]}</p>
      <p class="note">지금 대운 ${cur.ko}(${cur.stemGod})의 10년 동안: ${actionText("total", cur.score)}</p>
      ${basisList([
        `월운 천간 ${STEMS[ps.month.stem].han} = 일간 ${STEMS[natal.dm].han} 기준 ${monthGod} (${GOD_THEME[monthGod]})`,
        `월운 오행 ${elementLabel(STEMS[ps.month.stem].element)} · ${elementLabel(BRANCHES[ps.month.branch].element)} → 내 사주의 ${ROLE_NAME[natal.roles[STEMS[ps.month.stem].element]]} · ${ROLE_NAME[natal.roles[BRANCHES[ps.month.branch].element]]}`,
        `대운 ${cur.text} ${cur.score}점 (${cur.reason})`,
      ])}
    </section>
    ${basisList([
      `생활 처방의 색 · 방향 · 시간 · 계절 · 맛은 명리의 전통 오행 대응(목 = 청 · 동 · 봄 · 신맛, 화 = 적 · 남 · 여름 · 쓴맛, 토 = 황 · 중앙 · 환절기 · 단맛, 금 = 백 · 서 · 가을 · 매운맛, 수 = 흑 · 북 · 겨울 · 짠맛)을 따랐어요.`,
      `용신 · 희신 쪽 기운을 늘리고 기신 쪽 기운을 줄이는 것이 기본 원칙이에요.`,
      `행동 원칙은 일간(나) · 신강/신약 · 용신 · 가장 많은 십성 · 비어 있는 십성 순서로 골랐어요.`,
    ], { title: "가이드를 만든 기준 보기" })}
    <p class="disclaimer">생활 습관 제안은 참고용이에요. 건강 · 식단은 몸 상태에 맞게, 필요하면 전문가와 상의하세요. ${DISCLAIMER}</p>`;
}
