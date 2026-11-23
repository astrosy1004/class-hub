// 전 종목 스캔: 마지막 거래일의 등락률·거래대금·이동평균 + 차트 관심주 분류
const { pool, listing, yahooHistory, naverDaily } = require('./lib');
const { SCREEN } = require('./config');

const tvOf = (b) => Math.round(((b.h + b.l + b.c) / 3) * b.v / 1e8); // 억원 (추정)

function dayInfo(bars, k) {
  const q = bars[bars.length - 1 - k];
  const p = bars[bars.length - 2 - k];
  if (!q || !p) return null;
  return { d: q.d, r: +((q.c / p.c - 1) * 100).toFixed(2), tv: tvOf(q), up: q.c > q.o };
}

function ma(closes, n, end = closes.length) {
  if (end < n) return null;
  let s = 0;
  for (let i = end - n; i < end; i++) s += closes[i];
  return s / n;
}

// date: 분석할 거래일 (코스피 마지막 봉 날짜)
async function scanMarket(date, log = console.log) {
  const list = await listing();
  log(`종목 ${list.length}개 시세 수집…`);
  let fails = 0;
  const hist = await pool(list, 6, async (x) => {
    try {
      return await yahooHistory(x.code + (x.mkt === 'KOSPI' ? '.KS' : '.KQ'), '6mo');
    } catch (e) {
      fails++;
      return null;
    }
  });

  const rows = [];
  list.forEach((x, k) => {
    const b = hist[k];
    if (!b) return;
    const i = b.findIndex((q) => q.d === date);
    if (i < 1) return;
    const bars = b.slice(0, i + 1);
    const closes = bars.map((q) => q.c);
    const off = Math.max(0, closes.length - 40);
    rows.push({
      ...x,
      c: closes[closes.length - 1],
      d0: dayInfo(bars, 0), d1: dayInfo(bars, 1), d2: dayInfo(bars, 2),
      ma5: ma(closes, 5), ma8: ma(closes, 8), ma15: ma(closes, 15), ma20: ma(closes, 20),
      ma33: ma(closes, 33), ma45: ma(closes, 45), ma120: ma(closes, 120),
      // 미니 차트용: 최근 40거래일 종가와 20일선
      spark: closes.slice(-40),
      sparkMa: closes.slice(off).map((_, j) => ma(closes, 20, off + j + 1)),
      bars,
    });
  });
  log(`분석 대상 ${rows.length}개 (실패 ${fails}개)`);
  return { rows, fails, total: list.length };
}

// 정규장 종가 대비 시간외(NXT) 최종가 — 거래대금이 있는 종목만 확인한다.
async function afterMarket(rows, date) {
  const targets = rows.filter((r) => r.d0.tv >= SCREEN.afterMinTv);
  const res = await pool(targets, 6, async (r) => {
    try {
      const d = (await naverDaily(r.code)).find((q) => q.d === date);
      return d ? +((d.c / r.c - 1) * 100).toFixed(2) : null;
    } catch (e) {
      return null;
    }
  });
  targets.forEach((r, k) => { r.nxt = res[k]; });
  return targets.filter((r) => r.nxt != null && Math.abs(r.nxt) >= SCREEN.afterMinMove).sort((a, b) => Math.abs(b.nxt) - Math.abs(a.nxt));
}

// 차트상 관심주 분류
function screens(rows) {
  const minTv = (r) => (r.mkt === 'KOSPI' ? SCREEN.bigTvKospi : SCREEN.bigTvKosdaq);
  const big = (r, d) => d && d.up && d.r >= SCREEN.bigCandle && d.tv >= minTv(r);
  // 최근 from~to 거래일 사이에 +10% 큰 양봉이 있었는지
  const hadBig = (r, from, to) => {
    const b = r.bars;
    for (let k = from; k <= to; k++) {
      const q = b[b.length - 1 - k], p = b[b.length - 2 - k];
      if (q && p && q.c > q.o && q.c / p.c - 1 >= 0.10 && tvOf(q) >= minTv(r)) return q.d;
    }
    return null;
  };
  const near = (c, m) => m && Math.abs(c / m - 1) <= SCREEN.maBand;
  const top = (a, key = (r) => r.d0.tv) => a.sort((x, y) => key(y) - key(x)).slice(0, SCREEN.perGroup);
  return {
    d0: top(rows.filter((r) => big(r, r.d0))),
    d1: top(rows.filter((r) => big(r, r.d1)), (r) => r.d1.tv),
    d2: top(rows.filter((r) => big(r, r.d2)), (r) => r.d2.tv),
    ma58: top(rows.filter((r) => (near(r.c, r.ma5) || near(r.c, r.ma8)) && hadBig(r, 3, 10))),
    ma15: top(rows.filter((r) => near(r.c, r.ma15) && hadBig(r, 8, 20))),
    ma3345: top(rows.filter((r) => (near(r.c, r.ma33) || near(r.c, r.ma45)) && hadBig(r, 20, 45))),
    ma120: top(rows.filter((r) => near(r.c, r.ma120) && r.d0.tv >= 100 && hadBig(r, 30, 110))),
    crash: rows.filter((r) => r.d0.r <= -15 && r.d0.tv >= 100).sort((a, b) => a.d0.r - b.d0.r).slice(0, 12),
  };
}

// AI에게 넘길 후보 종목들
function movers(rows) {
  const minTv = (r) => (r.mkt === 'KOSPI' ? 100 : 30);
  return {
    gainers: rows.filter((r) => r.d0.r >= 5 && r.d0.tv >= minTv(r)).sort((a, b) => b.d0.r - a.d0.r).slice(0, 40),
    losers: rows.filter((r) => r.d0.r <= -8 && r.d0.tv >= 100).sort((a, b) => a.d0.r - b.d0.r).slice(0, 40),
    topTv: [...rows].sort((a, b) => b.d0.tv - a.d0.tv).slice(0, 40),
  };
}

module.exports = { scanMarket, afterMarket, screens, movers };
