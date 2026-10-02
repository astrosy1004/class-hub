// 만세력 엔진: 양력 생년월일시 → 네 기둥(연·월·일·시), 십신, 지장간, 12운성, 대운, 올해 세운.
// 표(천간·지지·십신 등)는 saju-data.js, 절기 시각은 solar-terms.js가 맡고 여기서는 계산 순서만 다룬다.
//
// 기준 요약
// - 연주: 입춘 시각 기준으로 해가 바뀐다.  월주: 12절(입춘·경칩·청명…) 시각 기준으로 달이 바뀐다.
// - 일주: 출생지 지방시(경도 보정한 시각)로 날짜를 정하고, 23시(자시 시작)부터 다음 날로 본다.
//   nightZi(야자시) 옵션을 켜면 23~24시는 일주를 그날로 두고, 시주만 다음 날 자시로 계산한다.
// - 시주: 지방시 기준 2시간 단위(자시 23~01시 …).

import { STEMS, BRANCHES, TEN_GODS, TWELVE_STAGES, CHANGSAENG, KOREA_STANDARD_TIME, SETTINGS } from "./saju-data.js";
import { jdFromMs, msFromJd, sunLongitude, surroundingJie } from "./solar-terms.js";

const HOUR_MS = 3600000;

// 60갑자 순번(0=甲子) → { stem, branch } 순번
function ganzhi(index) {
  const i = ((index % 60) + 60) % 60;
  return { stem: i % 10, branch: i % 12 };
}

// 천간 순번 + 지지 순번 → 60갑자 순번
function ganzhiIndex(stem, branch) {
  for (let i = 0; i < 60; i++) if (i % 10 === stem && i % 12 === branch) return i;
  return -1;
}

export function pillarText(p) {
  return p ? STEMS[p.stem].han + BRANCHES[p.branch].han : "";
}

export function pillarKo(p) {
  return p ? STEMS[p.stem].ko + BRANCHES[p.branch].ko : "";
}

// 일간(dayStem) 기준으로 다른 천간(stem)의 십신 이름
export function tenGod(dayStem, stem) {
  const me = STEMS[dayStem];
  const other = STEMS[stem];
  const relation = (other.element - me.element + 5) % 5;
  return TEN_GODS[relation][me.yang === other.yang ? 0 : 1];
}

// 일간 기준으로 지지의 12운성
export function twelveStage(dayStem, branch) {
  const start = CHANGSAENG[dayStem];
  const step = STEMS[dayStem].yang ? branch - start : start - branch;
  return TWELVE_STAGES[((step % 12) + 12) % 12];
}

// 양력 날짜의 율리우스 적일(JDN, 정수)
function julianDayNumber(year, month, day) {
  return Math.round(jdFromMs(Date.UTC(year, month - 1, day)) + 0.5);
}

// 그 날짜에 쓰던 한국 표준시(UTC+시간)
export function koreaUtcOffset(dateStr) {
  let offset = 9;
  for (const row of KOREA_STANDARD_TIME) if (dateStr >= row.from) offset = row.utcOffset;
  return offset;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

// 밀리초(UTC 기준 시계값)를 "YYYY-MM-DD HH:mm" 문자열로
export function formatClock(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/**
 * 사주 계산
 * @param {object} input
 *   date: "YYYY-MM-DD" (양력), time: "HH:mm" 또는 null(시간 모름), gender: "M" | "F",
 *   longitude: 출생지 경도(기본 서울), nightZi: 야자시 사용 여부(기본 false), today: 기준일 Date(기본 지금)
 */
export function calculateSaju(input) {
  const { date, time = null, gender, longitude = SETTINGS.defaultLongitude, nightZi = false, today = new Date() } = input;
  const [year, month, day] = date.split("-").map(Number);
  const hasTime = Boolean(time);
  const [hour, minute] = hasTime ? time.split(":").map(Number) : [12, 0]; // 시간 모름이면 정오로 연·월주를 정한다

  // 1) 출생 순간(UTC)과 지방시
  const utcOffset = koreaUtcOffset(date);
  const clockMs = Date.UTC(year, month - 1, day, hour, minute);
  const instantMs = clockMs - utcOffset * HOUR_MS;
  const jd = jdFromMs(instantMs);
  const localMeanMs = instantMs + (longitude / 15) * HOUR_MS; // 경도 15°당 1시간
  const lmt = new Date(localMeanMs);
  const lmtHour = lmt.getUTCHours();

  // 2) 연주 · 월주: 태양 황경으로 몇 번째 절기 달인지 정한다 (0=寅월 … 11=丑월)
  const lon = sunLongitude(jd);
  const monthOrder = Math.floor((((lon - 315) % 360) + 360) % 360 / 30);
  // 1·2월인데 아직 子·丑월이면 입춘 전이므로 사주상 전년도
  const sajuYear = month <= 2 && monthOrder >= 10 ? year - 1 : year;
  const yearPillar = ganzhi(sajuYear - 4); // 1984년 = 甲子
  const monthStem = ((yearPillar.stem % 5) * 2 + 2 + monthOrder) % 10; // 甲己년 → 丙寅월 시작
  const monthPillar = { stem: monthStem, branch: (monthOrder + 2) % 12 };

  // 3) 일주: 지방시 날짜 기준, 23시부터 다음 날
  const lmtDateJdn = julianDayNumber(lmt.getUTCFullYear(), lmt.getUTCMonth() + 1, lmt.getUTCDate());
  const isLateZi = hasTime && lmtHour >= 23;
  const dayJdn = isLateZi && !nightZi ? lmtDateJdn + 1 : lmtDateJdn;
  const dayPillar = ganzhi(dayJdn + 49); // 2000-01-01(JDN 2451545) = 戊午

  // 4) 시주: 甲己일 → 甲子시 시작. 야자시는 다음 날 일간으로 시간을 정한다
  let hourPillar = null;
  if (hasTime) {
    const hourBranch = Math.floor((lmtHour + 1) / 2) % 12;
    const baseStem = isLateZi && nightZi ? (dayPillar.stem + 1) % 10 : dayPillar.stem;
    hourPillar = { stem: ((baseStem % 5) * 2 + hourBranch) % 10, branch: hourBranch };
  }

  // 5) 기둥별 십신 · 지장간 · 12운성
  const dayStem = dayPillar.stem;
  const describe = (p, isDay = false) =>
    p && {
      ...p,
      text: pillarText(p),
      ko: pillarKo(p),
      stemGod: isDay ? "일간" : tenGod(dayStem, p.stem),
      branchGod: tenGod(dayStem, BRANCHES[p.branch].hidden.at(-1)),
      hidden: BRANCHES[p.branch].hidden.map((s) => ({ stem: s, han: STEMS[s].han, god: tenGod(dayStem, s) })),
      stage: twelveStage(dayStem, p.branch),
    };

  // 6) 대운: 양남음녀 순행, 음남양녀 역행. 대운수 = 절입까지 날수 / 3
  const forward = STEMS[yearPillar.stem].yang === (gender === "M");
  const jie = surroundingJie(jd);
  const days = forward ? jie.next.jd - jd : jd - jie.prev.jd;
  const exactYears = days / 3;
  const daeunNumber = SETTINGS.daeunRound(exactYears);
  const monthIndex = ganzhiIndex(monthPillar.stem, monthPillar.branch);
  const koreanAge = today.getFullYear() - year + 1; // 대운 나이는 세는 나이로 표기
  const daeunList = [];
  for (let k = 1; k <= SETTINGS.daeunCount; k++) {
    const p = ganzhi(monthIndex + (forward ? k : -k));
    const startAge = daeunNumber + (k - 1) * 10;
    daeunList.push({
      ...p,
      text: pillarText(p),
      ko: pillarKo(p),
      startAge,
      startYear: year + startAge - 1,
      stemGod: tenGod(dayStem, p.stem),
      branchGod: tenGod(dayStem, BRANCHES[p.branch].hidden.at(-1)),
      current: koreanAge >= startAge && koreanAge < startAge + 10,
    });
  }

  // 7) 올해 세운
  const thisYear = today.getFullYear();
  const seunPillar = ganzhi(thisYear - 4);

  return {
    input: { date, time, gender, longitude, nightZi },
    utcOffset,
    birthClock: formatClock(clockMs),
    localMeanTime: hasTime ? formatClock(localMeanMs) : null,
    sunLongitude: lon,
    pillars: {
      hour: describe(hourPillar),
      day: describe(dayPillar, true),
      month: describe(monthPillar),
      year: describe(yearPillar),
    },
    dayMaster: dayStem,
    jie: {
      prev: { name: jie.prev.name, kst: formatClock(msFromJd(jie.prev.jd) + 9 * HOUR_MS) },
      next: { name: jie.next.name, kst: formatClock(msFromJd(jie.next.jd) + 9 * HOUR_MS) },
    },
    daeun: { forward, days, exactYears, number: daeunNumber, list: daeunList },
    koreanAge,
    seun: { year: thisYear, ...seunPillar, text: pillarText(seunPillar), ko: pillarKo(seunPillar), stemGod: tenGod(dayStem, seunPillar.stem) },
  };
}

// 연월일시 네 기둥을 "丙辰 辛丑 癸酉 辛酉"처럼 연→시 순서 문자열로 (검증 비교용)
export function fourPillarsText(result) {
  const { year, month, day, hour } = result.pillars;
  return [year, month, day, hour].filter(Boolean).map((p) => p.text).join(" ");
}
