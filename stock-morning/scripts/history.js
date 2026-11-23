// 지난 리포트 누적 분석: 여러 날 반복해서 나온 재료(해시태그)와 종목을 찾는다.
// 매일 저장되는 AI 원고(analysis/YYYY-MM-DD.json)를 읽는다.
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'analysis');
const norm = (t) => String(t).replace(/^#/, '').replace(/\s+/g, ' ').trim();

// date 이전 리포트 최대 n개 (최신순)
function loadHistory(date, n = 10) {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f.slice(0, 10) < date)
    .sort().reverse().slice(0, n)
    .map((f) => {
      try {
        return { date: f.slice(0, 10), ...JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) };
      } catch (e) {
        return null;
      }
    })
    .filter((d) => d && !d.error);
}

function tagsOf(d) {
  const t = new Set();
  for (const s of d.sectors || []) for (const h of s.hashtags || []) t.add(norm(h));
  for (const i of d.issues || []) for (const h of i.tags || []) t.add(norm(h));
  return [...t];
}
function stocksOf(d) {
  const s = new Set();
  for (const sec of d.sectors || []) for (const it of sec.items || []) for (const n of it.stocks || []) s.add(n);
  for (const l of d.leaders || []) s.add(l.name);
  return [...s];
}

// 오늘 원고(today)까지 합쳐 2일 이상 반복된 재료·종목을 센다.
// rows: 오늘 스캔 결과 — 처음 언급된 날 이후 주가 변화를 계산하는 데 쓴다.
function recurring(history, today, rows) {
  const days = [...(today && !today.error ? [{ date: '오늘', ...today }] : []), ...history];
  const tagCount = new Map();
  const stockDays = new Map();
  for (const d of days) {
    for (const t of tagsOf(d)) tagCount.set(t, [...(tagCount.get(t) || []), d.date]);
    for (const s of stocksOf(d)) stockDays.set(s, [...(stockDays.get(s) || []), d.date]);
  }
  const by = {};
  for (const r of rows) by[r.name] = r;
  const tags = [...tagCount].filter(([, ds]) => ds.length >= 2).sort((a, b) => b[1].length - a[1].length).slice(0, 10)
    .map(([tag, ds]) => ({ tag, count: ds.length }));
  const stocks = [...stockDays].filter(([n, ds]) => ds.length >= 2 && by[n]).sort((a, b) => b[1].length - a[1].length).slice(0, 10)
    .map(([name, ds]) => {
      const first = ds.filter((x) => x !== '오늘').sort()[0];
      const r = by[name];
      const bar = first && r.bars.find((b) => b.d === first);
      return { name, count: ds.length, first, since: bar ? +((r.c / bar.c - 1) * 100).toFixed(2) : null, today: r.d0.r };
    });
  return { days: days.length, tags, stocks };
}

// AI에게 넘길 지난 리포트 요약
const briefHistory = (history) => history.slice(0, 7).map((d) => ({
  date: d.date,
  headline: d.headline,
  key_points: d.key_points || [],
  issues: (d.issues || []).map((i) => (i.tags || []).map(norm).join(' ')),
}));

module.exports = { loadHistory, recurring, briefHistory };
