// 공통 수집 함수 (Node 20+ 내장 fetch만 사용, 외부 패키지 없음)
//   - 상장 종목 목록: KRX KIND (실패하면 저장해 둔 data/listing.json 사용)
//   - 정규장 일봉: Yahoo Finance (KRX 종가 기준)
//   - 수급·등락 종목 수: 네이버 증권 지수 API
//   - 시간외(NXT) 반영 최종가: 네이버 증권 일별 시세
//   - 뉴스: Google 뉴스 RSS 검색
//   - 해설: Claude API
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (compatible; stock-morning/1.0; +https://github.com/astrosy1004/class-hub)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: { 'user-agent': UA, ...(options.headers || {}) },
        signal: AbortSignal.timeout(options.timeout || 20000),
      });
      if (res.status === 404) return res;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      if (attempt >= retries) throw e;
      await sleep(attempt * 2500);
    }
  }
}

// KST 기준 YYYY-MM-DD
const kstDate = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
const kstHour = () => new Date(Date.now() + 9 * 3600e3).getUTCHours();
const num = (s) => (typeof s === 'number' ? s : Number(String(s).replace(/[,+]/g, '')));

// 여러 작업을 동시에 n개씩 처리
async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const k = i++;
      out[k] = await fn(items[k], k);
    }
  }));
  return out;
}

// ---------------------------------------------------------------- 상장 종목 목록

const LISTING_CACHE = path.join(__dirname, '..', 'data', 'listing.json');

async function listing() {
  try {
    const out = [];
    for (const [type, mkt] of [['stockMkt', 'KOSPI'], ['kosdaqMkt', 'KOSDAQ']]) {
      const res = await fetchWithRetry(`https://kind.krx.co.kr/corpgeneral/corpList.do?method=download&searchType=13&marketType=${type}`, { timeout: 60000 });
      const html = new TextDecoder('euc-kr').decode(await res.arrayBuffer());
      const rows = html.match(/<tr>[\s\S]*?<\/tr>/g) || [];
      for (const r of rows.slice(1)) {
        const td = (r.match(/<td[^>]*>[\s\S]*?<\/td>/g) || []).map((x) => x.replace(/<[^>]+>/g, '').trim());
        if (td.length >= 4 && /^[0-9A-Z]{6}$/.test(td[2])) out.push({ name: td[0], code: td[2], sector: td[3], mkt });
      }
    }
    if (out.length < 2000) throw new Error('목록이 너무 짧음 ' + out.length);
    fs.writeFileSync(LISTING_CACHE, JSON.stringify(out));
    return out;
  } catch (e) {
    console.warn('KIND 목록 실패, 저장본 사용:', e.message);
    return JSON.parse(fs.readFileSync(LISTING_CACHE, 'utf8'));
  }
}

// ---------------------------------------------------------------- 시세

// Yahoo 일봉. 한국장 마감(16시) 전이면 오늘 날짜 봉은 미완성이라 제외한다.
async function yahooHistory(symbol, range = '6mo') {
  const res = await fetchWithRetry(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`);
  if (res.status === 404) throw new Error('404');
  const j = await res.json();
  const r = j.chart && j.chart.result && j.chart.result[0];
  if (!r || !r.timestamp) throw new Error('결과 없음');
  const q = r.indicators.quote[0];
  const off = r.meta.gmtoffset || 0;
  const today = kstDate(Date.now());
  return r.timestamp
    .map((t, i) => ({ d: new Date((t + off) * 1000).toISOString().slice(0, 10), o: q.open[i], h: q.high[i], l: q.low[i], c: q.close[i], v: q.volume[i] }))
    .filter((b) => b.c != null && b.o != null)
    .filter((b) => !(symbol.endsWith('.KS') || symbol.endsWith('.KQ') || symbol.startsWith('^K')) || !(b.d >= today && kstHour() < 16));
}

// 네이버 일별 시세 (시간외 거래까지 반영된 최종가)
async function naverDaily(code) {
  const res = await fetchWithRetry(`https://m.stock.naver.com/api/stock/${code}/price?pageSize=3&page=1`);
  const j = await res.json();
  return j.map((d) => ({ d: d.localTradedAt, c: num(d.closePrice) }));
}

// 네이버 지수: 투자자별 순매수(억원), 등락 종목 수
async function naverIndex(code) {
  const j = await (await fetchWithRetry(`https://m.stock.naver.com/api/index/${code}/integration`)).json();
  const t = j.dealTrendInfo || {};
  const u = j.upDownStockInfo || {};
  return {
    bizdate: t.bizdate ? `${t.bizdate.slice(0, 4)}-${t.bizdate.slice(4, 6)}-${t.bizdate.slice(6, 8)}` : null,
    personal: num(t.personalValue), foreign: num(t.foreignValue), institution: num(t.institutionalValue),
    upper: num(u.upperCount), rise: num(u.riseCount), steady: num(u.steadyCount), fall: num(u.fallCount), lower: num(u.lowerCount),
  };
}

// ---------------------------------------------------------------- 뉴스

function decode(s) {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}
const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1]) : '';
};

// Google 뉴스 RSS. after/before 는 YYYY-MM-DD (before 는 그 날짜 미포함)
async function news(query, { after, before, limit = 15 } = {}) {
  let q = query;
  if (after) q += ' after:' + after;
  if (before) q += ' before:' + before;
  const url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(q) + '&hl=ko&gl=KR&ceid=KR:ko';
  try {
    const xml = await (await fetchWithRetry(url)).text();
    return (xml.match(/<item>[\s\S]*?<\/item>/g) || []).map((x) => {
      const source = tag(x, 'source');
      let title = tag(x, 'title');
      if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
      const t = Date.parse(tag(x, 'pubDate'));
      return { title, link: tag(x, 'link'), source, time: Number.isNaN(t) ? null : t };
    }).filter((i) => i.title).slice(0, limit);
  } catch (e) {
    return [];
  }
}

// ---------------------------------------------------------------- Claude

// 429·5xx·네트워크 오류만 재시도하고, 4xx는 API가 돌려준 오류 내용을 그대로 남긴다.
async function claudeJSON({ system, user, schema, maxTokens = 32000, effort = 'low' }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { error: 'ANTHROPIC_API_KEY 없음' };
  const body = JSON.stringify({
    // 비용이 가장 낮은 모델. 품질을 높이려면 'claude-sonnet-5-5' 또는 'claude-opus-5-5' 로 바꾼다.
    model: 'claude-haiku-5-5',
    max_tokens: maxTokens,
    output_config: { effort, format: { type: 'json_schema', schema } },
    system,
    messages: [{ role: 'user', content: user }],
  });
  try {
    for (let attempt = 1; ; attempt++) {
      let res;
      try {
        res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          signal: AbortSignal.timeout(900000),
          headers: {
            'content-type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2026-10-21',
            // 워크스페이스에 묶이지 않은 키는 워크스페이스 ID(wrkspc_...)를 헤더로 보내야 한다.
            ...(process.env.ANTHROPIC_WORKSPACE_ID ? { 'anthropic-workspace-id': process.env.ANTHROPIC_WORKSPACE_ID } : {}),
          },
          body,
        });
      } catch (e) {
        if (attempt >= 3) throw e;
        await sleep(attempt * 5000);
        continue;
      }
      const msg = await res.json().catch(() => ({}));
      if (res.ok) {
        if (msg.stop_reason === 'refusal') return { error: '요청이 거절됨' };
        if (msg.usage) console.log('Claude 사용량:', JSON.stringify(msg.usage), 'stop:', msg.stop_reason);
        if (msg.stop_reason === 'max_tokens') return { error: '응답이 잘림' };
        const text = (msg.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
        return JSON.parse(text);
      }
      const detail = `HTTP ${res.status} ${(msg.error && msg.error.type) || ''}: ${(msg.error && msg.error.message) || ''}`;
      console.error('Claude API 오류 —', detail);
      if ((res.status === 429 || res.status >= 500) && attempt < 3) {
        await sleep(attempt * 10000);
        continue;
      }
      throw new Error(detail);
    }
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { sleep, pool, kstDate, kstHour, listing, yahooHistory, naverDaily, naverIndex, news, claudeJSON };
