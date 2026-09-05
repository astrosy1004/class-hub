// RSS 수집 공통 로직 (Node 20+ 내장 fetch만 사용, 외부 패키지 없음)
const { CATEGORIES } = require('./feeds');

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
  // CDATA 를 먼저 벗겨야 한다. 태그 제거를 먼저 하면 <![CDATA[제목]]> 이 통째로 지워진다.
  const unwrapped = String(s).replace(/<!\[CDATA\[([^]*?)\]\]>/g, '$1');
  // 일부 언론사 피드는 &amp;apos; 처럼 두 번 인코딩돼 오므로 두 번 디코딩한다.
  const text = decodeEntities(decodeEntities(unwrapped.replace(/<[^>]*>/g, ' ')));
  return text.replace(/\s+/g, ' ').trim();
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

// 언론사/기관마다 날짜 형식이 제각각이라 표준 형식으로 맞춘다.
// - 20260904130656 (중소벤처기업부)      → KST 로 해석
// - FRI, 04 SEP 2026 18:00:00 KST (행안부) → KST 약어를 +0900 으로 치환
function parseDate(raw) {
  const text = stripTags(raw);
  if (!text) return null;

  const digits = text.match(/^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?$/);
  if (digits) {
    const [, y, mo, d, h, mi, sec] = digits;
    const ms = Date.UTC(+y, +mo - 1, +d, +(h || 0) - 9, +(mi || 0), +(sec || 0));
    return Number.isNaN(ms) ? null : new Date(ms).toISOString();
  }

  const t = Date.parse(text.replace(/KST/i, '+0900'));
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

// 일반 RSS 2.0 / Atom
function parseRss(xml, feed) {
  const nodes = blocks(xml, 'item').concat(blocks(xml, 'entry'));
  const items = [];
  for (const node of nodes) {
    const title = stripTags(tag(node, 'title'));
    let link = stripTags(tag(node, 'link')) || attr(node, 'link', 'href');
    const raw = tag(node, 'pubDate') || tag(node, 'updated') || tag(node, 'published') || tag(node, 'dc:date');
    const date = parseDate(raw);
    const desc = stripTags(tag(node, 'description') || tag(node, 'summary') || tag(node, 'content:encoded'));
    if (!title) continue;
    items.push({
      title,
      link: link || '',
      date,
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
  const first = blocks(xml, 'item')[0] || xml;
  const region = stripTags(tag(first, 'category')) || '';
  const link = stripTags(tag(first, 'link')) || stripTags(tag(xml, 'link')) || '';
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

async function collectFeed(feed, category) {
  const take = feed.take || category.perFeed || 10;
  const spec = { ...feed, limit: take };
  const info = { source: feed.source, url: feed.url, count: 0, error: null };
  let items = [];
  try {
    const xml = await fetchText(feed.url);
    items = feed.type === 'kma-forecast' ? parseKmaForecast(xml, spec) : parseRss(xml, spec);
    if (items.length === 0) info.error = '항목 없음';
    info.count = items.length;
  } catch (e) {
    info.error = e && e.message ? e.message : String(e);
  }
  return { info, items };
}

function dedupeKey(item) {
  return item.title.toLowerCase().replace(/[^0-9a-z가-힣]/g, '').slice(0, 60) || item.link;
}

async function collectCategory(category) {
  const results = await Promise.all(category.feeds.map((f) => collectFeed(f, category)));

  const seen = new Set();
  const merged = [];
  for (const r of results) {
    for (const item of r.items) {
      const key = dedupeKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  // 날씨는 시간순(가까운 예보 먼저), 뉴스는 최신순
  if (category.id === 'weather') merged.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  else merged.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  const feedsInfo = results.map((r) => r.info);
  const failed = feedsInfo.filter((f) => f.error);

  return {
    id: category.id,
    emoji: category.emoji,
    name: category.name,
    color: category.color,
    feeds: feedsInfo,
    error: failed.length === feedsInfo.length ? failed.map((f) => `${f.source}: ${f.error}`).join(' / ') : null,
    items: merged.slice(0, category.limit),
  };
}

async function collectAll() {
  const categories = [];
  for (const category of CATEGORIES) {
    const result = await collectCategory(category);
    categories.push(result);
    const bad = result.feeds.filter((f) => f.error);
    console.log(`${result.error ? '✗' : '✓'} ${result.emoji} ${result.name} — ${result.items.length}건 (출처 ${result.feeds.length}곳${bad.length ? ', 실패 ' + bad.map((f) => f.source).join('/') : ''})`);
  }
  return { updatedAt: new Date().toISOString(), categories };
}

function kst(iso, opts) {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', ...opts }).format(new Date(iso));
}

module.exports = { collectAll, collectCategory, kst, stripTags, parseDate };
