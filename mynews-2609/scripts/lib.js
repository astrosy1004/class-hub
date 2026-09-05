// RSS 수집 공통 로직 (Node 20+ 내장 fetch만 사용, 외부 패키지 없음)
const { FEEDS } = require('./feeds');

const UA = 'Mozilla/5.0 (compatible; mynews-2609/1.0; +https://github.com/astrosy1004/class-hub)';
const TIMEOUT_MS = 20000;

function decodeEntities(s) {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function stripTags(s) {
  return decodeEntities(String(s).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}[^>]*>([^]*?)</${name}>`, 'i'));
  return m ? m[1] : '';
}

function attr(xml, name, key) {
  const m = xml.match(new RegExp(`<${name}[^>]*[ ]${key}="([^"]*)"`, 'i'));
  return m ? decodeEntities(m[1]) : '';
}

function blocks(xml, name) {
  return xml.match(new RegExp(`<${name}[^>]*>[^]*?</${name}>`, 'gi')) || [];
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'application/rss+xml, application/xml, text/xml, */*' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// 일반 RSS 2.0 / Atom
function parseRss(xml, feed) {
  const nodes = blocks(xml, 'item').concat(blocks(xml, 'entry'));
  const items = [];
  for (const node of nodes) {
    const title = stripTags(tag(node, 'title'));
    let link = stripTags(tag(node, 'link')) || attr(node, 'link', 'href');
    const raw = tag(node, 'pubDate') || tag(node, 'updated') || tag(node, 'published') || tag(node, 'dc:date');
    const t = Date.parse(stripTags(raw));
    const desc = stripTags(tag(node, 'description') || tag(node, 'summary') || tag(node, 'content:encoded'));
    if (!title) continue;
    items.push({
      title,
      link: link || '',
      date: Number.isNaN(t) ? null : new Date(t).toISOString(),
      summary: desc.slice(0, 180),
      source: stripTags(tag(node, 'source')) || feed.source,
    });
  }
  items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return items.slice(0, feed.limit);
}

const SKY = { 1: '맑음', 3: '구름많음', 4: '흐림' };

// 기상청 1시간 동네예보: <description> 안의 <data> 블록을 읽을 수 있는 문장으로 변환
function parseKmaForecast(xml, feed) {
  const region = stripTags(tag(xml, 'category')) || '';
  const link = stripTags(tag(xml, 'link')) || '';
  const base = stripTags(tag(xml, 'tm'));
  const baseDate = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(base);
  const items = [];
  for (const d of blocks(xml, 'data')) {
    const hour = Number(stripTags(tag(d, 'hour')));
    const day = Number(stripTags(tag(d, 'day')));
    const temp = stripTags(tag(d, 'temp'));
    const wf = stripTags(tag(d, 'wfKor')) || SKY[stripTags(tag(d, 'sky'))] || '';
    const pop = stripTags(tag(d, 'pop'));
    const wd = stripTags(tag(d, 'wdKor'));
    const ws = stripTags(tag(d, 'ws'));
    const reh = stripTags(tag(d, 'reh'));
    if (Number.isNaN(hour)) continue;
    const when = day === 0 ? '오늘' : day === 1 ? '내일' : '모레';
    const parts = [`${temp}℃`, wf, `강수확률 ${pop}%`];
    if (wd && ws) parts.push(`${wd}풍 ${Number(ws).toFixed(1)}m/s`);
    if (reh) parts.push(`습도 ${reh}%`);
    let iso = null;
    if (baseDate) {
      const dt = new Date(Date.UTC(+baseDate[1], +baseDate[2] - 1, +baseDate[3] + day, hour - 9, 0, 0));
      iso = dt.toISOString();
    }
    items.push({
      title: `${when} ${String(hour).padStart(2, '0')}시 · ${parts.join(' · ')}`,
      link,
      date: iso,
      summary: region,
      source: feed.source,
    });
  }
  return items.slice(0, feed.limit);
}

async function collectFeed(feed) {
  const out = { id: feed.id, emoji: feed.emoji, name: feed.name, source: feed.source, url: feed.url, color: feed.color, items: [], error: null };
  try {
    const xml = await fetchText(feed.url);
    out.items = feed.type === 'kma-forecast' ? parseKmaForecast(xml, feed) : parseRss(xml, feed);
    if (out.items.length === 0) out.error = '항목을 찾지 못했습니다';
  } catch (e) {
    out.error = e && e.message ? e.message : String(e);
  }
  return out;
}

async function collectAll() {
  const sources = await Promise.all(FEEDS.map(collectFeed));
  for (const s of sources) {
    console.log(`${s.error ? '✗' : '✓'} ${s.name} — ${s.error || s.items.length + '건'}`);
  }
  return { updatedAt: new Date().toISOString(), sources };
}

function kst(iso, opts) {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', ...opts }).format(new Date(iso));
}

module.exports = { collectAll, collectFeed, kst, stripTags };
