// 지표 계산: 생활인구 · 경쟁 점포 응답 → 화면과 점수에 쓰는 숫자. 순수 함수 (같은 입력 = 같은 결과).
import { AGE_GROUPS } from "./area-data.js";

const sum = (a) => a.reduce((x, y) => x + y, 0);
const avg = (a) => (a.length ? sum(a) / a.length : 0);
const pct = (x) => Math.round(x * 1000) / 10;

export function computeMetrics(pop, ind, comp) {
  // 생활인구 자료가 없는 동네: 경쟁 점포 지표만 계산한다
  if (!pop) return { noPop: true, compCount: comp ? comp.count : null, compCapped: comp ? comp.capped : false };
  const hoursAvg = (arr) => avg(ind.hours.map((h) => arr[h % 24]));
  const dayTotal = sum(pop.weekday);
  const endTotal = sum(pop.weekend);
  const peakHour = pop.weekday.indexOf(Math.max(...pop.weekday));
  const peakEndHour = pop.weekend.indexOf(Math.max(...pop.weekend));
  // 업종 영업 시간대 안에서 가장 붐비는 시각 (술집이면 17시~새벽 1시 중에서) — 현장 방문 · 운영 안내에 쓴다
  const openPeak = (arr) => ind.hours.reduce((b, h) => (arr[h % 24] > arr[b % 24] ? h : b), ind.hours[0]) % 24;

  const m = pop.monthly;
  const last3 = avg(m.slice(-3));
  const prev3 = avg(m.slice(-6, -3));
  const growth = prev3 ? last3 / prev3 - 1 : 0;
  const mom = m.length > 1 && m[m.length - 2] ? m[m.length - 1] / m[m.length - 2] - 1 : 0;
  const mean = avg(m);
  const vol = mean ? Math.sqrt(avg(m.map((v) => (v - mean) ** 2))) / mean : 0;
  const busiest = m.indexOf(Math.max(...m));

  const age = pop.age;
  const topAge = AGE_GROUPS.map((g) => g.key).sort((a, b) => age[b] - age[a])[0];
  const customerMatch = sum(AGE_GROUPS.map((g) => (age[g.key] || 0) * (ind.target[g.key] || 0)));

  return {
    sizeHours: hoursAvg(pop.weekday), // 업종 영업 시간대 평균 생활인구 (명/시간)
    weekendRatio: dayTotal ? endTotal / dayTotal : 1,
    peakHour, peakEndHour, // 하루 전체에서 가장 붐비는 시각
    openPeakHour: openPeak(pop.weekday), openPeakEndHour: openPeak(pop.weekend), // 영업 시간대 안에서
    growth, mom, volatility: vol, busiestMonth: busiest,
    age, topAge, share2030: (age.g20 || 0) + (age.g30 || 0), female: pop.female,
    customerMatch,
    compCount: comp ? comp.count : null,
    compCapped: comp ? comp.capped : false,
  };
}

export const fmtPct = (x, plus = true) => `${plus && x > 0 ? "+" : ""}${pct(x)}%`;
export const fmtAgePct = (x) => `${Math.round(x * 100)}%`;
export const fmtMan = (n) => `${(n / 10000).toFixed(1)}만`;
export const monthLabel = (ym) => `${Number(ym.slice(4))}월`;
