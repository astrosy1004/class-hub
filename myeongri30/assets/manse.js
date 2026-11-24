// 만세력 엔진 (saju/js 의 saju-data · solar-terms · lunar · manse 를 일반 스크립트로 묶은 사본).
// file:// 에서 동작하도록 ES 모듈 대신 window.Manse 하나로 내보낸다. 계산 로직은 원본과 동일하다.
(function () {
  "use strict";
// ===== saju-data.js =====
const DATA = (function () {
  // 사주 계산에 쓰는 기본 표(천간·지지·오행·십신·지장간·12운성·절기·표준시) 전담 파일.
  // 학파마다 다를 수 있는 선택(대운수 반올림, 나이 기준 등)도 맨 아래 SETTINGS에 모아 둔다.
  // 내용을 고칠 때는 이 파일만 바꾸면 되고, 계산 코드(manse.js)는 손대지 않는다.

  // 오행. 순서가 상생 순서(목→화→토→금→수)라서 십신 계산이 이 순서에 기대고 있다. 순서를 바꾸지 말 것.
  const ELEMENTS = [
    { id: "wood", han: "木", ko: "목" },
    { id: "fire", han: "火", ko: "화" },
    { id: "earth", han: "土", ko: "토" },
    { id: "metal", han: "金", ko: "금" },
    { id: "water", han: "水", ko: "수" },
  ];

  // 천간 10개. element는 ELEMENTS 순번, yang은 양간 여부.
  const STEMS = [
    { han: "甲", ko: "갑", element: 0, yang: true },
    { han: "乙", ko: "을", element: 0, yang: false },
    { han: "丙", ko: "병", element: 1, yang: true },
    { han: "丁", ko: "정", element: 1, yang: false },
    { han: "戊", ko: "무", element: 2, yang: true },
    { han: "己", ko: "기", element: 2, yang: false },
    { han: "庚", ko: "경", element: 3, yang: true },
    { han: "辛", ko: "신", element: 3, yang: false },
    { han: "壬", ko: "임", element: 4, yang: true },
    { han: "癸", ko: "계", element: 4, yang: false },
  ];

  // 지지 12개. hidden은 지장간(STEMS 순번) [여기, 중기, 정기] 순서이고 중기가 없으면 2개.
  // 마지막 값(정기)이 지지의 십신을 정할 때 쓰는 대표 천간이다. (子=癸, 午=丁, 巳=丙, 亥=壬)
  const BRANCHES = [
    { han: "子", ko: "자", animal: "쥐", element: 4, hidden: [8, 9] },
    { han: "丑", ko: "축", animal: "소", element: 2, hidden: [9, 7, 5] },
    { han: "寅", ko: "인", animal: "호랑이", element: 0, hidden: [4, 2, 0] },
    { han: "卯", ko: "묘", animal: "토끼", element: 0, hidden: [0, 1] },
    { han: "辰", ko: "진", animal: "용", element: 2, hidden: [1, 9, 4] },
    { han: "巳", ko: "사", animal: "뱀", element: 1, hidden: [4, 6, 2] },
    { han: "午", ko: "오", animal: "말", element: 1, hidden: [2, 5, 3] },
    { han: "未", ko: "미", animal: "양", element: 2, hidden: [3, 1, 5] },
    { han: "申", ko: "신", animal: "원숭이", element: 3, hidden: [4, 8, 6] },
    { han: "酉", ko: "유", animal: "닭", element: 3, hidden: [6, 7] },
    { han: "戌", ko: "술", animal: "개", element: 2, hidden: [7, 3, 4] },
    { han: "亥", ko: "해", animal: "돼지", element: 4, hidden: [4, 0, 8] },
  ];

  // 십신. 행 = 일간 기준 상대 오행 관계(0 같음, 1 내가 생함, 2 내가 극함, 3 나를 극함, 4 나를 생함),
  // 열 = [음양이 같을 때, 다를 때]
  const TEN_GODS = [
    ["비견", "겁재"],
    ["식신", "상관"],
    ["편재", "정재"],
    ["편관", "정관"],
    ["편인", "정인"],
  ];

  // 12운성 이름과 천간별 장생 자리(BRANCHES 순번). 양간은 순행, 음간은 역행한다.
  const TWELVE_STAGES = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"];
  const CHANGSAENG = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3]; // 甲亥 乙午 丙寅 丁酉 戊寅 己酉 庚巳 辛子 壬申 癸卯

  // 24절기. 순번 0 = 소한(태양 황경 285°)부터 15°씩. 짝수 순번이 달이 바뀌는 절(節)이다.
  const SOLAR_TERMS = [
    "소한", "대한", "입춘", "우수", "경칩", "춘분", "청명", "곡우", "입하", "소만", "망종", "하지",
    "소서", "대서", "입추", "처서", "백로", "추분", "한로", "상강", "입동", "소설", "대설", "동지",
  ];

  // 한국 표준시 변천. from(포함)부터 다음 줄 from 전까지 utcOffset(시간)을 쓴다.
  const KOREA_STANDARD_TIME = [
    { from: "1908-04-01", utcOffset: 8.5 },
    { from: "1912-01-01", utcOffset: 9 },
    { from: "1954-03-21", utcOffset: 8.5 },
    { from: "1961-08-10", utcOffset: 9 },
  ];

  // 한국 서머타임(일광절약시간) 기간. 이 기간의 시계는 1시간 빨랐으므로 계산할 때 1시간을 뺀다.
  // start(포함) ~ end(미포함)는 당시 시계(서머타임 적용된 시각) 기준. 출처: tz database Asia/Seoul
  const KOREA_DST = [
    { start: "1948-06-01 00:00", end: "1948-09-13 00:00" },
    { start: "1949-04-03 00:00", end: "1949-09-11 00:00" },
    { start: "1950-04-01 00:00", end: "1950-09-10 00:00" },
    { start: "1951-05-06 00:00", end: "1951-09-09 00:00" },
    { start: "1955-05-05 00:00", end: "1955-09-09 00:00" },
    { start: "1956-05-20 00:00", end: "1956-09-30 00:00" },
    { start: "1957-05-05 00:00", end: "1957-09-22 00:00" },
    { start: "1958-05-04 00:00", end: "1958-09-21 00:00" },
    { start: "1959-05-03 00:00", end: "1959-09-20 00:00" },
    { start: "1960-05-01 00:00", end: "1960-09-18 00:00" },
    { start: "1987-05-10 03:00", end: "1987-10-11 03:00" },
    { start: "1988-05-08 03:00", end: "1988-10-09 03:00" },
  ];

  // 출생지 선택 목록. lon = 동경(도). 시주를 정하는 지방시 보정에만 쓴다.
  const CITIES = [
    { name: "서울", lon: 126.98 },
    { name: "인천", lon: 126.7 },
    { name: "수원", lon: 127.03 },
    { name: "춘천", lon: 127.73 },
    { name: "강릉", lon: 128.9 },
    { name: "청주", lon: 127.49 },
    { name: "대전", lon: 127.38 },
    { name: "세종", lon: 127.29 },
    { name: "전주", lon: 127.15 },
    { name: "광주", lon: 126.85 },
    { name: "목포", lon: 126.39 },
    { name: "대구", lon: 128.6 },
    { name: "안동", lon: 128.73 },
    { name: "포항", lon: 129.37 },
    { name: "울산", lon: 129.31 },
    { name: "부산", lon: 129.08 },
    { name: "창원", lon: 128.68 },
    { name: "제주", lon: 126.53 },
    { name: "평양", lon: 125.75 },
  ];

  const SETTINGS = {
    // 시주를 정할 때 쓰는 출생지 경도(동경). 서울 126.98° → 표준시 135°보다 약 32분 늦게 시(時)가 바뀐다.
    defaultLongitude: 126.98,
    // 대운수 = (출생 ~ 절입까지 날수) / 3. 소수점은 반올림하고 최소 1로 둔다.
    daeunRound: (years) => Math.max(1, Math.round(years)),
    daeunUntilAge: 100, // 대운은 시작 나이가 이 나이 이하인 것까지 (인생 그래프를 100세까지)
    // 결과가 갈릴 수 있어 안내를 띄우는 기준
    jieBoundaryHours: 2, // 절입 시각과 이 시간 안이면 안내
    hourBoundaryMinutes: 10, // 시주가 바뀌는 시각과 이 분 안이면 안내
  };

  return { ELEMENTS, STEMS, BRANCHES, TEN_GODS, TWELVE_STAGES, CHANGSAENG, SOLAR_TERMS, KOREA_STANDARD_TIME, KOREA_DST, CITIES, SETTINGS };
})();

// ===== solar-terms.js =====
const SOLAR = (function () {
  // 태양 황경과 절기 시각 계산 전담 파일. 외부 데이터 없이 천문 공식으로 구한다.
  // 공식: Jean Meeus, Astronomical Algorithms 25장 고정밀 방법(VSOP87 축약 계수 + 장동 · 광행차),
  //       ΔT는 Espenak·Meeus 다항식. 1900~2100년 절입 시각 오차 약 1분 이내.
  // 시각은 모두 율리우스일(JD, 세계시 UT 기준)로 주고받는다.
  
  const { SOLAR_TERMS } = DATA;
  
  const RAD = Math.PI / 180;
  const DAY_MS = 86400000;
  
  function jdFromMs(ms) {
    return ms / DAY_MS + 2440587.5;
  }
  
  function msFromJd(jd) {
    return (jd - 2440587.5) * DAY_MS;
  }
  
  function normalizeDeg(deg) {
    return ((deg % 360) + 360) % 360;
  }
  
  // 세계시와 역학시의 차이(초). 1860~2150년 범위.
  function deltaT(year) {
    if (year < 1900) {
      const t = year - 1860;
      return 7.62 + 0.5737 * t - 0.251754 * t ** 2 + 0.01680668 * t ** 3 - 0.0004473624 * t ** 4 + t ** 5 / 233174;
    }
    if (year < 1920) {
      const t = year - 1900;
      return -2.79 + 1.494119 * t - 0.0598939 * t ** 2 + 0.0061966 * t ** 3 - 0.000197 * t ** 4;
    }
    if (year < 1941) {
      const t = year - 1920;
      return 21.2 + 0.84493 * t - 0.0761 * t ** 2 + 0.0020936 * t ** 3;
    }
    if (year < 1961) {
      const t = year - 1950;
      return 29.07 + 0.407 * t - t ** 2 / 233 + t ** 3 / 2547;
    }
    if (year < 1986) {
      const t = year - 1975;
      return 45.45 + 1.067 * t - t ** 2 / 260 - t ** 3 / 718;
    }
    if (year < 2005) {
      const t = year - 2000;
      return 63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5;
    }
    if (year < 2050) {
      const t = year - 2000;
      return 62.92 + 0.32217 * t + 0.005589 * t ** 2;
    }
    return -20 + 32 * ((year - 1820) / 100) ** 2 - 0.5628 * (2150 - year);
  }
  
  // 지구 일심 황경 VSOP87 축약 계수 (Meeus 부록 III). 각 줄 [A, B, C] → A·cos(B + C·τ), 단위 1e-8 rad
  const EARTH_L = [
    [
      [175347046, 0, 0], [3341656, 4.6692568, 6283.07585], [34894, 4.6261, 12566.1517], [3497, 2.7441, 5753.3849],
      [3418, 2.8289, 3.5231], [3136, 3.6277, 77713.7715], [2676, 4.4181, 7860.4194], [2343, 6.1352, 3930.2097],
      [1324, 0.7425, 11506.7698], [1273, 2.0371, 529.691], [1199, 1.1096, 1577.3435], [990, 5.233, 5884.927],
      [902, 2.045, 26.298], [857, 3.508, 398.149], [780, 1.179, 5223.694], [753, 2.533, 5507.553],
      [505, 4.583, 18849.228], [492, 4.205, 775.523], [357, 2.92, 0.067], [317, 5.849, 11790.629],
      [284, 1.899, 796.298], [271, 0.315, 10977.079], [243, 0.345, 5486.778], [206, 4.806, 2544.314],
      [205, 1.869, 5573.143], [202, 2.458, 6069.777], [156, 0.833, 213.299], [132, 3.411, 2942.463],
      [126, 1.083, 20.775], [115, 0.645, 0.98], [103, 0.636, 4694.003], [102, 0.976, 15720.839],
      [102, 4.267, 7.114], [99, 6.21, 2146.17], [98, 0.68, 155.42], [86, 5.98, 161000.69],
      [85, 1.3, 6275.96], [85, 3.67, 71430.7], [80, 1.81, 17260.15], [79, 3.04, 12036.46],
      [75, 1.76, 5088.63], [74, 3.5, 3154.69], [74, 4.68, 801.82], [70, 0.83, 9437.76],
      [62, 3.98, 8827.39], [61, 1.82, 7084.9], [57, 2.78, 6286.6], [56, 4.39, 14143.5],
      [56, 3.47, 6279.55], [52, 0.19, 12139.55], [52, 1.33, 1748.02], [51, 0.28, 5856.48],
      [49, 0.49, 1194.45], [41, 5.37, 8429.24], [41, 2.4, 19651.05], [39, 6.17, 10447.39],
      [37, 6.04, 10213.29], [37, 2.57, 1059.38], [36, 1.71, 2352.87], [36, 1.78, 6812.77],
      [33, 0.59, 17789.85], [30, 0.44, 83996.85], [30, 2.74, 1349.87], [25, 3.16, 4690.48],
    ],
    [
      [628331966747, 0, 0], [206059, 2.678235, 6283.07585], [4303, 2.6351, 12566.1517], [425, 1.59, 3.523],
      [119, 5.796, 26.298], [109, 2.966, 1577.344], [93, 2.59, 18849.23], [72, 1.14, 529.69],
      [68, 1.87, 398.15], [67, 4.41, 5507.55], [59, 2.89, 5223.69], [56, 2.17, 155.42],
      [45, 0.4, 796.3], [36, 0.47, 775.52], [29, 2.65, 7.11], [21, 5.34, 0.98],
      [19, 1.85, 5486.78], [19, 4.97, 213.3], [17, 2.99, 6275.96], [16, 0.03, 2544.31],
      [16, 1.43, 2146.17], [15, 1.21, 10977.08], [12, 2.83, 1748.02], [12, 3.26, 5088.63],
      [12, 5.27, 1194.45], [12, 2.08, 4694.0], [11, 0.77, 553.57], [10, 1.3, 6286.6],
      [10, 4.24, 1349.87], [9, 2.7, 242.73], [9, 5.64, 951.72], [8, 5.3, 2352.87],
      [6, 2.65, 9437.76], [6, 4.67, 4690.48],
    ],
    [
      [52919, 0, 0], [8720, 1.0721, 6283.0758], [309, 0.867, 12566.152], [27, 0.05, 3.52],
      [16, 5.19, 26.3], [16, 3.68, 155.42], [10, 0.76, 18849.23], [9, 2.06, 77713.77],
      [7, 0.83, 775.52], [5, 4.66, 1577.34], [4, 1.03, 7.11], [4, 3.44, 5573.14],
      [3, 5.14, 796.3], [3, 6.05, 5507.55], [3, 1.19, 242.73], [3, 6.12, 529.69],
      [3, 0.31, 398.15], [3, 2.28, 553.57], [2, 4.38, 5223.69], [2, 3.75, 0.98],
    ],
    [
      [289, 5.844, 6283.076], [35, 0, 0], [17, 5.49, 12566.15], [3, 5.2, 155.42],
      [1, 4.72, 3.52], [1, 5.3, 18849.23], [1, 5.97, 242.73],
    ],
    [[114, 3.142, 0], [8, 4.13, 6283.08], [1, 3.84, 12566.15]],
    [[1, 3.14, 0]],
  ];
  
  // 세계시 JD → 태양 겉보기 황경(도). 지구 일심 황경 + 180° 에 FK5 보정 · 장동 · 광행차를 더한다.
  function sunLongitude(jdUt) {
    const year = 2000 + (jdUt - 2451545) / 365.25;
    const jde = jdUt + deltaT(year) / 86400;
    const T = (jde - 2451545) / 36525;
    const tau = T / 10;
    let L = 0;
    EARTH_L.forEach((series, power) => {
      const sum = series.reduce((acc, [a, b, c]) => acc + a * Math.cos(b + c * tau), 0);
      L += sum * tau ** power;
    });
    const sunGeo = L / 1e8 / RAD + 180;
    const M = (357.52911 + 35999.05029 * T) * RAD; // 태양 평균 근점이각
    const R = 1.000140 - 0.016708 * Math.cos(M) - 0.000139 * Math.cos(2 * M); // 지구-태양 거리(AU), 광행차용
    const omega = (125.04452 - 1934.136261 * T) * RAD;
    const sunMean = (280.4665 + 36000.7698 * T) * RAD;
    const moonMean = (218.3165 + 481267.8813 * T) * RAD;
    const nutation = -17.2 * Math.sin(omega) - 1.32 * Math.sin(2 * sunMean) - 0.23 * Math.sin(2 * moonMean) + 0.21 * Math.sin(2 * omega);
    const fk5 = -0.09033;
    const aberration = -20.4898 / R;
    return normalizeDeg(sunGeo + (fk5 + nutation + aberration) / 3600);
  }
  
  // guessJd 근처에서 태양 황경이 targetDeg가 되는 시각(세계시 JD)
  function findLongitudeJd(targetDeg, guessJd) {
    let jd = guessJd;
    for (let i = 0; i < 50; i++) {
      const diff = ((targetDeg - sunLongitude(jd) + 540) % 360) - 180; // -180 ~ 180
      if (Math.abs(diff) < 1e-7) break;
      jd += diff / 0.9856473; // 태양은 하루에 약 0.9856° 움직인다
    }
    return jd;
  }
  
  // 그 해(양력)의 24절기 중 index번째(0=소한 … 23=동지) 시각
  function solarTermJd(year, index) {
    const target = normalizeDeg(285 + 15 * index);
    const guess = jdFromMs(Date.UTC(year, 0, 6)) + index * 15.2;
    return findLongitudeJd(target, guess);
  }
  
  // 그 해 24절기 전체 [{ index, name, jd, isJie }]
  function solarTermsOfYear(year) {
    return SOLAR_TERMS.map((name, index) => ({
      index,
      name,
      jd: solarTermJd(year, index),
      isJie: index % 2 === 0,
    }));
  }
  
  // jd 바로 앞(이전)과 바로 뒤(다음)의 절(節, 달이 바뀌는 절기) 시각과 이름
  function surroundingJie(jd) {
    const lon = sunLongitude(jd);
    const offset = normalizeDeg(lon - 285) % 30; // 직전 절에서 지난 각도
    const prevLon = normalizeDeg(lon - offset);
    const prevJd = findLongitudeJd(prevLon, jd - offset / 0.9856473);
    const nextJd = findLongitudeJd(normalizeDeg(prevLon + 30), jd + (30 - offset) / 0.9856473);
    const nameOf = (deg) => SOLAR_TERMS[Math.round(normalizeDeg(deg - 285) / 15) % 24];
    return {
      prev: { name: nameOf(prevLon), jd: prevJd },
      next: { name: nameOf(prevLon + 30), jd: nextJd },
    };
  }

  return { jdFromMs, msFromJd, deltaT, sunLongitude, findLongitudeJd, solarTermJd, solarTermsOfYear, surroundingJie };
})();

// ===== lunar.js =====
const LUNAR = (function () {
  // 한국 음력 ↔ 양력 변환 전담 파일. 음력표 데이터 없이 천문 계산으로 만든다.
  // - 합삭(새달) 시각: Jean Meeus, Astronomical Algorithms 49장 (오차 1분 안팎)
  // - 달 구성: 합삭이 든 날(한국 표준시 날짜)이 초하루. 동지가 든 달이 11월.
  //   동지~다음 동지 사이에 달이 13개면 중기(우수·춘분·곡우…)가 없는 첫 달이 윤달.
  // 중국 음력표(UTC+8 기준)를 쓰면 합삭이 자정 근처일 때 한국 음력과 하루·한 달이 어긋나므로 직접 계산한다.
  
  const { jdFromMs, msFromJd, findLongitudeJd, deltaT } = SOLAR;
  const { KOREA_STANDARD_TIME } = DATA;
  
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
  function solarToLunar(year, month, day) {
    const n = dayNumber(year, month, day);
    for (const sui of [year, year + 1]) {
      const m = monthsOfSui(sui).find((x) => n >= x.start && n < x.start + x.days);
      if (m) return { year: m.lunarYear, month: m.month, day: n - m.start + 1, leap: m.leap };
    }
    return null;
  }
  
  /** 음력 → 양력. 그런 날짜가 없으면(윤달이 없는 해, 30일이 없는 달) null */
  function lunarToSolar(year, month, day, leap = false) {
    for (const sui of [year, year + 1]) {
      const m = monthsOfSui(sui).find((x) => x.lunarYear === year && x.month === month && x.leap === leap);
      if (m) return day >= 1 && day <= m.days ? dateFromDayNumber(m.start + day - 1) : null;
    }
    return null;
  }
  
  /** 그 음력 해의 윤달 번호(없으면 0) */
  function leapMonthOf(year) {
    for (const sui of [year, year + 1]) {
      const m = monthsOfSui(sui).find((x) => x.lunarYear === year && x.leap);
      if (m) return m.month;
    }
    return 0;
  }
  
  /** 음력 그 달의 날수(29 또는 30, 없는 달이면 0) */
  function lunarMonthDays(year, month, leap = false) {
    for (const sui of [year, year + 1]) {
      const m = monthsOfSui(sui).find((x) => x.lunarYear === year && x.month === month && x.leap === leap);
      if (m) return m.days;
    }
    return 0;
  }

  return { solarToLunar, lunarToSolar, leapMonthOf, lunarMonthDays };
})();

// ===== manse.js =====
const ENGINE = (function () {
  // 만세력 엔진: 양력 생년월일시 → 네 기둥(연·월·일·시), 십신, 지장간, 12운성, 대운, 올해 세운.
  // 표(천간·지지·십신 등)는 saju-data.js, 절기 시각은 solar-terms.js가 맡고 여기서는 계산 순서만 다룬다.
  //
  // 기준 요약
  // - 연주: 입춘 시각 기준으로 해가 바뀐다.  월주: 12절(입춘·경칩·청명…) 시각 기준으로 달이 바뀐다.
  // - 일주: 출생지 지방시(경도 보정한 시각)로 날짜를 정하고, 23시(자시 시작)부터 다음 날로 본다.
  //   nightZi(야자시) 옵션을 켜면 23~24시는 일주를 그날로 두고, 시주만 다음 날 자시로 계산한다.
  // - 시주: 지방시 기준 2시간 단위(자시 23~01시 …).
  // - 음력 입력은 lunar.js로 양력으로 바꾼 뒤 계산한다. 서머타임 기간이면 1시간을 빼고 계산한다.
  // - 절기 경계 · 시주 경계 · 서머타임 · 표준시 변경처럼 결과가 갈릴 수 있는 경우는 notices로 안내한다.

  const { STEMS, BRANCHES, TEN_GODS, TWELVE_STAGES, CHANGSAENG, KOREA_STANDARD_TIME, KOREA_DST, SETTINGS } = DATA;
  const { jdFromMs, msFromJd, sunLongitude, surroundingJie } = SOLAR;
  const { lunarToSolar, solarToLunar } = LUNAR;

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

  function pillarText(p) {
    return p ? STEMS[p.stem].han + BRANCHES[p.branch].han : "";
  }

  function pillarKo(p) {
    return p ? STEMS[p.stem].ko + BRANCHES[p.branch].ko : "";
  }

  // 일간(dayStem) 기준으로 다른 천간(stem)의 십신 이름
  function tenGod(dayStem, stem) {
    const me = STEMS[dayStem];
    const other = STEMS[stem];
    const relation = (other.element - me.element + 5) % 5;
    return TEN_GODS[relation][me.yang === other.yang ? 0 : 1];
  }

  // 일간 기준으로 지지의 12운성
  function twelveStage(dayStem, branch) {
    const start = CHANGSAENG[dayStem];
    const step = STEMS[dayStem].yang ? branch - start : start - branch;
    return TWELVE_STAGES[((step % 12) + 12) % 12];
  }

  // 양력 날짜의 율리우스 적일(JDN, 정수)
  function julianDayNumber(year, month, day) {
    return Math.round(jdFromMs(Date.UTC(year, month - 1, day)) + 0.5);
  }

  // 그 날짜에 쓰던 한국 표준시(UTC+시간)
  function koreaUtcOffset(dateStr) {
    let offset = 9;
    for (const row of KOREA_STANDARD_TIME) if (dateStr >= row.from) offset = row.utcOffset;
    return offset;
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  // 밀리초(UTC 기준 시계값)를 "YYYY-MM-DD HH:mm" 문자열로
  function formatClock(ms) {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  }

  // 당시 시계 "YYYY-MM-DD HH:mm"이 서머타임 기간인지
  function isDst(clockText) {
    return KOREA_DST.some((p) => clockText >= p.start && clockText < p.end);
  }

  function minutesText(min) {
    const m = Math.round(Math.abs(min));
    return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`;
  }

  /**
   * 사주 계산
   * @param {object} input
   *   calendar: "solar" | "lunar" (기본 solar), date: "YYYY-MM-DD" (calendar 기준), leap: 음력 윤달 여부,
   *   time: "HH:mm" 또는 null(시간 모름), gender: "M" | "F", longitude: 출생지 경도(기본 서울),
   *   nightZi: 야자시 사용 여부(기본 false), applyDst: 서머타임 기간이면 1시간 빼기(기본 true), today: 기준일 Date(기본 지금)
   * @returns 계산 결과, 또는 없는 날짜(윤달이 없는 해 등)이면 { error }
   */
  function calculateSaju(input) {
    const {
      calendar = "solar",
      leap = false,
      time = null,
      gender,
      longitude = SETTINGS.defaultLongitude,
      nightZi = false,
      applyDst = true,
      today = new Date(),
    } = input;
    const notices = []; // { level: "info" | "warn", text }

    // 0) 음력이면 양력으로 바꾼다
    let date = input.date;
    if (calendar === "lunar") {
      const [ly, lm, ld] = input.date.split("-").map(Number);
      const s = lunarToSolar(ly, lm, ld, leap);
      if (!s) return { error: leap ? `음력 ${ly}년에는 윤${lm}월 ${ld}일이 없습니다.` : `음력 ${ly}년 ${lm}월 ${ld}일은 없는 날짜입니다.` };
      date = `${s.year}-${pad(s.month)}-${pad(s.day)}`;
    }
    const [year, month, day] = date.split("-").map(Number);
    const lunar = solarToLunar(year, month, day);
    const hasTime = Boolean(time);
    const [hour, minute] = hasTime ? time.split(":").map(Number) : [12, 0]; // 시간 모름이면 정오로 연·월주를 정한다

    // 1) 출생 순간(UTC)과 지방시. 서머타임이면 시계가 1시간 빨랐으므로 UTC 차이를 1시간 늘린다
    const standardOffset = koreaUtcOffset(date);
    const dst = hasTime && isDst(`${date} ${time}`);
    const dstApplied = dst && applyDst;
    const utcOffset = standardOffset + (dstApplied ? 1 : 0);
    const clockMs = Date.UTC(year, month - 1, day, hour, minute);
    const instantMs = clockMs - utcOffset * HOUR_MS;
    const jd = jdFromMs(instantMs);
    const localMeanMs = instantMs + (longitude / 15) * HOUR_MS; // 경도 15°당 1시간
    const lmt = new Date(localMeanMs);
    const lmtHour = lmt.getUTCHours();

    if (dst) {
      notices.push(
        dstApplied
          ? { level: "warn", text: "서머타임 기간에 태어나 당시 시계가 1시간 빨랐습니다. 1시간을 빼고 계산했습니다." }
          : { level: "warn", text: "서머타임 기간에 태어났지만 보정하지 않았습니다. 당시 시계 기준이라면 보정을 켜세요." },
      );
    }
    if (standardOffset !== 9) {
      notices.push({ level: "info", text: "이 시기 한국 표준시는 지금보다 30분 늦은 UTC+8:30(동경 127.5°)이었고, 그대로 반영했습니다." });
    }
    if (hasTime) {
      const shift = (longitude / 15 - utcOffset) * 60;
      notices.push({
        level: "info",
        text: `지방시 보정(동경 ${longitude}°${longitude === SETTINGS.defaultLongitude ? ", 서울 기준" : ""}): 시계보다 ${minutesText(shift)} ${shift < 0 ? "늦어" : "빨라"} ${formatClock(localMeanMs).slice(11)}로 시주를 정했습니다.`,
      });
      // 시주가 바뀌는 홀수 시 정각(지방시)과의 거리
      const lmtMinutes = lmtHour * 60 + lmt.getUTCMinutes();
      const r = (((lmtMinutes - 60) % 120) + 120) % 120;
      const toBoundary = Math.min(r, 120 - r);
      if (toBoundary <= SETTINGS.hourBoundaryMinutes) {
        notices.push({ level: "warn", text: `시주가 바뀌는 시각과 ${toBoundary}분 차이입니다. 출생 시각이 몇 분만 달라도 시주가 바뀔 수 있습니다.` });
      }
    }

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
    if (isLateZi) {
      notices.push(
        nightZi
          ? { level: "warn", text: "23시대(야자시) 출생: 일주는 그날로 두고 시주만 다음 날 기준으로 계산했습니다." }
          : { level: "warn", text: "23시대(자시 앞부분) 출생: 일주를 다음 날로 봤습니다. 야자시를 쓰는 앱에서는 일주가 다르게 나옵니다." },
      );
    }

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
    const nearest = jd - jie.prev.jd < jie.next.jd - jd ? jie.prev : jie.next;
    const gapHours = Math.abs(jd - nearest.jd) * 24;
    const nearestKst = formatClock(msFromJd(nearest.jd) + 9 * HOUR_MS);
    if (!hasTime && nearestKst.slice(0, 10) === date) {
      notices.push({ level: "warn", text: `절입일(${nearest.name} ${nearestKst})에 태어났는데 시간을 모릅니다. 태어난 시각에 따라 월주${nearest.name === "입춘" ? "·연주" : ""}가 달라집니다.` });
    } else if (hasTime && gapHours < SETTINGS.jieBoundaryHours) {
      notices.push({ level: "warn", text: `${nearest.name} 절입(${nearestKst})과 ${minutesText(gapHours * 60)} 차이입니다. 월주${nearest.name === "입춘" ? "·연주" : ""}가 바뀌는 경계라 출생 시각을 확인하세요.` });
    }
    const days = forward ? jie.next.jd - jd : jd - jie.prev.jd;
    const exactYears = days / 3;
    const daeunNumber = SETTINGS.daeunRound(exactYears);
    const monthIndex = ganzhiIndex(monthPillar.stem, monthPillar.branch);
    const koreanAge = today.getFullYear() - year + 1; // 대운 나이는 세는 나이로 표기
    const daeunList = [];
    for (let k = 1; daeunNumber + (k - 1) * 10 <= SETTINGS.daeunUntilAge; k++) {
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
      input: { calendar, date: input.date, leap, time, gender, longitude, nightZi, applyDst },
      solarDate: date,
      lunar,
      dst: dstApplied,
      notices,
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
  function fourPillarsText(result) {
    const { year, month, day, hour } = result.pillars;
    return [year, month, day, hour].filter(Boolean).map((p) => p.text).join(" ");
  }

  return { pillarText, pillarKo, tenGod, twelveStage, koreaUtcOffset, formatClock, calculateSaju, fourPillarsText };
})();

  window.Manse = Object.assign({}, DATA, SOLAR, LUNAR, ENGINE);
})();
