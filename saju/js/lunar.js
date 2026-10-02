// 한국 음력 ↔ 양력 변환 전담 파일. 음력표 데이터 없이 천문 계산으로 만든다.
// - 합삭(새달) 시각: Jean Meeus, Astronomical Algorithms 49장 (오차 1분 안팎)
// - 달 구성: 합삭이 든 날(한국 표준시 날짜)이 초하루. 동지가 든 달이 11월.
//   동지~다음 동지 사이에 달이 13개면 중기(우수·춘분·곡우…)가 없는 첫 달이 윤달.
// 중국 음력표(UTC+8 기준)를 쓰면 합삭이 자정 근처일 때 한국 음력과 하루·한 달이 어긋나므로 직접 계산한다.

import { jdFromMs, msFromJd, findLongitudeJd, deltaT } from "./solar-terms.js";
import { KOREA_STANDARD_TIME } from "./saju-data.js";

const RAD = Math.PI / 180;
const HOUR_MS = 3600000;

// k번째 합삭(k=0 → 2000-01-06 무렵) 시각, 역학시 JDE
function newMoonJde(k) {
  const T = k / 1236.85;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  const M = (2.5534 + 29.1053567 * k - 0.0000014 * T * T - 0.00000011 * T ** 3) * RAD;
  const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T ** 3 - 0.000000058 * T ** 4) * RAD;
  const F = (160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T ** 3 + 0.000000011 * T ** 4) * RAD;
  const O = (124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T ** 3) * RAD;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
  jde +=
    -0.4072 * Math.sin(Mp) +
    0.17241 * E * Math.sin(M) +
    0.01608 * Math.sin(2 * Mp) +
    0.01039 * Math.sin(2 * F) +
    0.00739 * E * Math.sin(Mp - M) -
    0.00514 * E * Math.sin(Mp + M) +
    0.00208 * E * E * Math.sin(2 * M) -
    0.00111 * Math.sin(Mp - 2 * F) -
    0.00057 * Math.sin(Mp + 2 * F) +
    0.00056 * E * Math.sin(2 * Mp + M) -
    0.00042 * Math.sin(3 * Mp) +
    0.00042 * E * Math.sin(M + 2 * F) +
    0.00038 * E * Math.sin(M - 2 * F) -
    0.00024 * E * Math.sin(2 * Mp - M) -
    0.00017 * Math.sin(O) -
    0.00007 * Math.sin(Mp + 2 * M) +
    0.00004 * Math.sin(2 * Mp - 2 * F) +
    0.00004 * Math.sin(3 * M) +
    0.00003 * Math.sin(Mp + M - 2 * F) +
    0.00003 * Math.sin(2 * Mp + 2 * F) -
    0.00003 * Math.sin(Mp + M + 2 * F) +
    0.00003 * Math.sin(Mp - M + 2 * F) -
    0.00002 * Math.sin(Mp - M - 2 * F) -
    0.00002 * Math.sin(3 * Mp + M) +
    0.00002 * Math.sin(4 * Mp);
  // 행성 섭동 보정
  const A = [
    [299.77 + 0.107408 * k - 0.009173 * T * T, 0.000325],
    [251.88 + 0.016321 * k, 0.000165],
    [251.83 + 26.651886 * k, 0.000164],
    [349.42 + 36.412478 * k, 0.000126],
    [84.66 + 18.206239 * k, 0.00011],
    [141.74 + 53.303771 * k, 0.000062],
    [207.14 + 2.453732 * k, 0.00006],
    [154.84 + 7.30686 * k, 0.000056],
    [34.52 + 27.261239 * k, 0.000047],
    [207.19 + 0.121824 * k, 0.000042],
    [291.34 + 1.844379 * k, 0.00004],
    [161.72 + 24.198154 * k, 0.000037],
    [239.56 + 25.513099 * k, 0.000035],
    [331.55 + 3.592518 * k, 0.000023],
  ];
  for (const [deg, coef] of A) jde += coef * Math.sin(deg * RAD);
  return jde;
}

// k번째 합삭 시각, 세계시 JD
function newMoonJd(k) {
  const jde = newMoonJde(k);
  return jde - deltaT(2000 + (jde - 2451545) / 365.25) / 86400;
}

// 세계시 JD → 그 순간의 한국 표준시 날짜의 일련번호(JDN)
function koreaDayNumber(jd) {
  const ms = msFromJd(jd);
  let offset = 9;
  const dateStr = new Date(ms + 9 * HOUR_MS).toISOString().slice(0, 10);
  for (const row of KOREA_STANDARD_TIME) if (dateStr >= row.from) offset = row.utcOffset;
  const local = new Date(ms + offset * HOUR_MS);
  return dayNumber(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate());
}

function dayNumber(year, month, day) {
  return Math.round(jdFromMs(Date.UTC(year, month - 1, day)) + 0.5);
}

function dateFromDayNumber(n) {
  const d = new Date(msFromJd(n - 0.5));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

// 그 해 동지의 한국 날짜(JDN)
function winterSolsticeDay(year) {
  return koreaDayNumber(findLongitudeJd(270, jdFromMs(Date.UTC(year, 11, 21))));
}

// dayNo 이하에서 가장 가까운 초하루(합삭일)의 k
function newMoonKOnOrBefore(dayNo) {
  let k = Math.floor((dayNo - 2451550.5) / 29.530588861) + 1;
  while (koreaDayNumber(newMoonJd(k)) > dayNo) k--;
  return k;
}

const cache = new Map();

// 동지(year-1)가 든 달(11월)부터 동지(year)가 든 달 직전까지의 음력 달 목록
// [{ start(JDN), days, month, leap, lunarYear }]
function monthsOfSui(year) {
  if (cache.has(year)) return cache.get(year);
  const startK = newMoonKOnOrBefore(winterSolsticeDay(year - 1));
  const endK = newMoonKOnOrBefore(winterSolsticeDay(year));
  const starts = [];
  for (let k = startK; k <= endK + 1; k++) starts.push(koreaDayNumber(newMoonJd(k)));
  const count = endK - startK; // 11월 ~ 다음 11월 직전까지 달 수 (12 또는 13)

  // 이 기간의 중기(태양 황경 30°의 배수) 날짜
  const zhongqi = [];
  for (let i = 0; i < 13; i++) {
    const lon = (270 + 30 * i) % 360;
    const guess = jdFromMs(Date.UTC(year - 1, 11, 21)) + 30.44 * i;
    zhongqi.push(koreaDayNumber(findLongitudeJd(lon, guess)));
  }
  const hasZhongqi = (from, to) => zhongqi.some((d) => d >= from && d < to);

  const months = [];
  let month = 11;
  let leapUsed = count === 12; // 12달이면 윤달 없음
  for (let i = 0; i < count; i++) {
    const start = starts[i];
    const next = starts[i + 1];
    let leap = false;
    if (!leapUsed && i > 0 && !hasZhongqi(start, next)) {
      leap = true;
      leapUsed = true;
    }
    if (!leap && i > 0) month = (month % 12) + 1;
    months.push({ start, days: next - start, month, leap, lunarYear: month >= 11 ? year - 1 : year });
  }
  cache.set(year, months);
  return months;
}

/** 양력 → 음력. { year, month, day, leap } */
export function solarToLunar(year, month, day) {
  const n = dayNumber(year, month, day);
  for (const sui of [year, year + 1]) {
    const m = monthsOfSui(sui).find((x) => n >= x.start && n < x.start + x.days);
    if (m) return { year: m.lunarYear, month: m.month, day: n - m.start + 1, leap: m.leap };
  }
  return null;
}

/** 음력 → 양력. 그런 날짜가 없으면(윤달이 없는 해, 30일이 없는 달) null */
export function lunarToSolar(year, month, day, leap = false) {
  for (const sui of [year, year + 1]) {
    const m = monthsOfSui(sui).find((x) => x.lunarYear === year && x.month === month && x.leap === leap);
    if (m) return day >= 1 && day <= m.days ? dateFromDayNumber(m.start + day - 1) : null;
  }
  return null;
}

/** 그 음력 해의 윤달 번호(없으면 0) */
export function leapMonthOf(year) {
  for (const sui of [year, year + 1]) {
    const m = monthsOfSui(sui).find((x) => x.lunarYear === year && x.leap);
    if (m) return m.month;
  }
  return 0;
}

/** 음력 그 달의 날수(29 또는 30, 없는 달이면 0) */
export function lunarMonthDays(year, month, leap = false) {
  for (const sui of [year, year + 1]) {
    const m = monthsOfSui(sui).find((x) => x.lunarYear === year && x.month === month && x.leap === leap);
    if (m) return m.days;
  }
  return 0;
}
