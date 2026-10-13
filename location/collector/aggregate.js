// 순수 계산: 동 하나의 "일별 요약" 여러 날 → 화면이 쓰는 생활인구 형식. (Firebase · 네트워크와 무관, 단위 시험 가능)
//
// 일별 요약(day): { date: "YYYYMMDD", hours: [24 시간대 합계], bands: [5 연령 묶음의 하루 합], female, all }
//   hours[h]   = 그날 h시의 생활인구 합계(명)
//   bands[0~4] = 10대이하 · 20대 · 30대 · 40대 · 50대+ 의 24시간 합
//   female/all = 여성 합 / 남녀 합 (24시간 합)
const AGE_KEYS = ["g10m", "g20", "g30", "g40", "g50p"];
const r4 = (x) => Math.round(x * 10000) / 10000;

const isWeekend = (date) => {
  const d = new Date(Number(date.slice(0, 4)), Number(date.slice(4, 6)) - 1, Number(date.slice(6)));
  return d.getDay() === 0 || d.getDay() === 6;
};
const avgHours = (days) => Array.from({ length: 24 }, (_, h) => Math.round(days.reduce((s, d) => s + d.hours[h], 0) / (days.length || 1)));

export function buildPop(dong, days, { minMonthDays = 7 } = {}) {
  if (!days.length) return null;
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-28); // 시간대 패턴 · 연령은 최근 4주 기준
  const wd = recent.filter((d) => !isWeekend(d.date));
  const we = recent.filter((d) => isWeekend(d.date));
  const bands = recent.reduce((a, d) => a.map((v, i) => v + d.bands[i]), [0, 0, 0, 0, 0]);
  const bsum = bands.reduce((a, b) => a + b, 0) || 1;
  const fem = recent.reduce((s, d) => s + d.female, 0);
  const all = recent.reduce((s, d) => s + d.all, 0) || 1;

  // 월별: 그 달에 저장된 날이 minMonthDays 일 이상인 달만 (평균이므로 부분 달도 쓸 수 있다)
  const byMonth = new Map();
  for (const d of sorted) {
    const m = d.date.slice(0, 6);
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m).push(d);
  }
  const months = [...byMonth.keys()].filter((m) => byMonth.get(m).length >= minMonthDays);
  const mean = (d) => d.hours.reduce((a, b) => a + b, 0) / 24;
  const last = sorted[sorted.length - 1].date;
  return {
    level: "dong",
    source: `서울 열린데이터광장 [내국인] 행정동별 서울 생활인구(250m) · 행정동 ${dong}`,
    asOf: `${last.slice(0, 4)}-${last.slice(4, 6)}-${last.slice(6)}`,
    days: sorted.length,
    months,
    weekday: avgHours(wd.length ? wd : recent),
    weekend: avgHours(we.length ? we : recent),
    age: Object.fromEntries(AGE_KEYS.map((k, i) => [k, r4(bands[i] / bsum)])),
    female: r4(fem / all),
    monthly: months.map((m) => Math.round(byMonth.get(m).reduce((s, d) => s + mean(d), 0) / byMonth.get(m).length)),
    ageMonthly: months.map((m) => {
      const b = byMonth.get(m).reduce((a, d) => a.map((v, i) => v + d.bands[i]), [0, 0, 0, 0, 0]);
      const t = b.reduce((x, y) => x + y, 0) || 1;
      return b.map((v) => r4(v / t));
    }),
    note: months.length < 3 ? `저장된 자료가 ${sorted.length}일치라 추이 기간이 짧습니다 (매일 수집되며 늘어납니다)` : "",
  };
}

// (일자) 한 날의 전 행정동 → 동별 일별 요약. hourMaps: { "00": Map<dong, normalizedRow>, … } (없는 시각은 빠짐)
export function summarizeDay(date, hourMaps) {
  const out = new Map();
  for (const [hh, map] of Object.entries(hourMaps)) {
    const h = Number(hh);
    for (const [dong, row] of map) {
      if (!out.has(dong)) out.set(dong, { date, hours: Array(24).fill(0), bands: [0, 0, 0, 0, 0], female: 0, all: 0, n: 0 });
      const d = out.get(dong);
      d.hours[h] = row.total;
      row.bands.forEach((v, i) => (d.bands[i] += v));
      d.female += row.female;
      d.all += row.male + row.female;
      d.n += 1;
    }
  }
  return out;
}
