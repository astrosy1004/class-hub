// 매일 아침(평일 07시 KST) 실행: 전 종목 시세·수급·뉴스 수집 → AI 원고 → 전체 리포트 + 메일 본문 저장.
// 메일 발송은 워크플로의 다음 단계가 이 스크립트가 만든 파일을 그대로 보낸다.
//
//   node stock-morning/scripts/daily.js                    # 실제 실행 (ANTHROPIC_API_KEY 필요)
//   node stock-morning/scripts/daily.js --dry              # AI 없이 데이터만으로 미리보기 생성
//   node stock-morning/scripts/daily.js --force            # 같은 거래일 보고서가 있어도 다시 생성
//   node stock-morning/scripts/daily.js --date 2026-11-20  # 지난 거래일 리포트 다시 만들기
//   node stock-morning/scripts/daily.js --draft 원고.json  # 저장해 둔 AI 원고로 다시 그리기
//   node stock-morning/scripts/daily.js --dump-input 입력.json  # AI 에게 넘길 입력만 저장하고 끝내기 (API 없이 원고를 따로 쓸 때)
const fs = require('fs');
const path = require('path');
const { SITE_URL, STUDY_START, GLOBALS, NEWS_TOPICS } = require('./config');
const { STUDY_WEEKS, STUDY_PLAN } = require('../data/study');
const { pool, kstDate, yahooHistory, naverIndex, naverIndexDaily, news } = require('./lib');
const { scanMarket, afterMarket, screens, movers } = require('./scan');
const { writeReport, buildInput, SYSTEM } = require('./writer');
const { renderFull } = require('./report');
const { renderEmail } = require('./render');
const { loadHistory, recurring, briefHistory } = require('./history');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);
const DRY = flag('--dry');
const FORCE = flag('--force');
const DATE = opt('--date');
const DRAFT = opt('--draft');
const DUMP = opt('--dump-input');
const HL_FILE = opt('--headlines'); // --dump-input 이 저장한 뉴스 스냅샷을 그대로 써서 헤드라인 번호를 고정한다

const addDays = (d, n) => {
  const t = new Date(d + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};
const nextWeekday = (d) => {
  let n = addDays(d, 1);
  while ([0, 6].includes(new Date(n + 'T00:00:00Z').getUTCDay())) n = addDays(n, 1);
  return n;
};

// 시작일부터 오늘까지의 평일 수 → 공부 일차 (30일이 지나면 1일차부터 복습)
function studyFor(today) {
  let n = 0;
  for (let d = STUDY_START; d <= today; d = addDays(d, 1)) {
    const wd = new Date(d + 'T00:00:00Z').getUTCDay();
    if (wd !== 0 && wd !== 6) n++;
  }
  n = Math.max(n, 1);
  const idx = (n - 1) % STUDY_PLAN.length;
  return { lesson: STUDY_PLAN[idx], round: Math.floor((n - 1) / STUDY_PLAN.length) + 1, week: STUDY_WEEKS[Math.floor(idx / 5)] };
}

function output(key, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}
const rel = (p) => path.relative(process.cwd(), p).split(path.sep).join('/');

// 일봉 배열(오래된 날 → 최신)에서 date(없으면 마지막 거래일)의 종가와 전일 대비 등락률을 뽑는다.
function pickDay(b, date) {
  const i = date ? b.findIndex((q) => q.d === date) : b.length - 1;
  if (i < 1) return null;
  return { date: b[i].d, close: b[i].c, chg: +((b[i].c / b[i - 1].c - 1) * 100).toFixed(2) };
}

// 지수 시세는 네이버 증권을 우선 쓰고(국내 출처, 마감 직후에도 값이 있음), 실패하면 Yahoo 를 쓴다.
// 두 출처가 다르면 경고를 남겨 어느 쪽이 이상한지 로그에서 바로 보이게 한다.
const NAVER_INDEX = { '^KS11': 'KOSPI', '^KQ11': 'KOSDAQ' };
async function indexOf(symbol, date) {
  let nv = null, yh = null;
  try { nv = pickDay(await naverIndexDaily(NAVER_INDEX[symbol]), date); } catch (e) { console.warn('네이버 지수 실패', symbol, e.message); }
  try { yh = pickDay(await yahooHistory(symbol, '1mo'), date); } catch (e) { console.warn('Yahoo 지수 실패', symbol, e.message); }
  if (nv && yh && (nv.date !== yh.date || Math.abs(nv.chg - yh.chg) > 0.2)) {
    console.warn(`지수 출처 불일치 ${symbol}: 네이버 ${nv.date} ${nv.close} (${nv.chg}%) / Yahoo ${yh.date} ${yh.close} (${yh.chg}%) → 네이버 사용`);
  }
  const r = nv || yh;
  if (!r) throw new Error(symbol + ' 시세 없음');
  console.log(`${symbol} ${r.date} ${r.close} (${r.chg}%) · 출처 ${nv ? '네이버' : 'Yahoo'}`);
  return r;
}

async function main() {
  console.log('지수 확인…');
  const kospi = await indexOf('^KS11', DATE);
  const date = kospi.date; // 보고서 날짜 = 실제 마지막 거래일
  const sendDate = DATE ? nextWeekday(DATE) : kstDate(Date.now());
  const kosdaq = await indexOf('^KQ11', date);

  const mailFile = path.join(ROOT, 'reports', date + '.html');
  if (fs.existsSync(mailFile) && !FORCE && !DRY && !DATE) {
    // 한국장 휴장일: 마지막 거래일이 이미 보고된 날이면 메일을 보내지 않는다.
    console.log(`${date} 보고서가 이미 있습니다 (이미 발송했거나 한국장 휴장일). 건너뜁니다.`);
    output('skip', 'true');
    return;
  }

  // 수급·등락 종목 수 (네이버는 가장 최근 거래일 값만 주므로 날짜가 맞을 때만 쓴다)
  for (const [code, target] of [['KOSPI', kospi], ['KOSDAQ', kosdaq]]) {
    try {
      const f = await naverIndex(code);
      if (f.bizdate === date) target.flow = f;
    } catch (e) {
      console.warn('수급 실패', code, e.message);
    }
  }

  console.log('해외 시세…');
  const globals = (await pool(GLOBALS, 4, async (g) => {
    try {
      const b = (await yahooHistory(g.symbol, '1mo')).filter((q) => q.d < sendDate);
      const [p, t] = b.slice(-2);
      return { ...g, date: t.d, close: t.c, chg: +((t.c / p.c - 1) * 100).toFixed(2), diffPt: +(t.c - p.c).toFixed(2) };
    } catch (e) {
      return null;
    }
  })).filter(Boolean);

  const { rows, fails, total } = await scanMarket(date);
  const mv = movers(rows);
  const scr = screens(rows);
  console.log('애프터마켓 확인…');
  const after = await afterMarket(rows, date);

  console.log('뉴스 수집…');
  const after1 = addDays(date, -1);
  const before1 = addDays(sendDate, 1);
  const from = Date.parse(date + 'T00:00:00+09:00') - 6 * 3600e3;
  const to = Date.parse(sendDate + 'T09:00:00+09:00');
  let headlines = [];
  const seen = new Map();
  const add = (items, topic) => {
    const ids = [];
    for (const it of items) {
      if (it.time && (it.time < from || it.time > to)) continue;
      if (!seen.has(it.title)) {
        const id = headlines.length + 1;
        seen.set(it.title, id);
        const w = it.time ? new Date(it.time + 9 * 3600e3).toISOString() : '';
        headlines.push({ id, topic, title: it.title, source: it.source, link: it.link, when: w ? w.slice(5, 10) + ' ' + w.slice(11, 16) : '' });
      }
      ids.push(seen.get(it.title));
    }
    return ids;
  };
  if (!HL_FILE) for (const [topic, q] of NEWS_TOPICS) {
    add(await news(q, { after: after1, before: before1, limit: 12 }), topic);
  }
  // 크게 움직인 종목은 종목명으로 따로 검색해 등락 이유의 근거를 모은다.
  const notable = [...new Map([...mv.gainers.slice(0, 15), ...mv.losers.slice(0, 10), ...mv.topTv.slice(0, 12), ...after.slice(0, 8)].map((r) => [r.code, r])).values()];
  let stockNews = {};
  if (!HL_FILE) for (const r of notable) {
    stockNews[r.code] = add(await news(`"${r.name}"`, { after: after1, before: before1, limit: 4 }), '종목');
  }
  if (HL_FILE) ({ headlines, stockNews } = JSON.parse(fs.readFileSync(HL_FILE, 'utf8')).news);
  console.log(`헤드라인 ${headlines.length}건`);

  const idx = { kospi, kosdaq };
  const ctx = { date, sendDate, idx, globals, mv, after, scr, headlines, stockNews, rows, fails, total, siteUrl: SITE_URL };
  // 지난 리포트 누적: 반복된 재료·종목
  const hist = loadHistory(date);
  ctx.recentReports = briefHistory(hist);
  ctx.previousReport = hist[0] || null;
  ctx.recurringBefore = recurring(hist, null, rows);

  if (DUMP) {
    fs.writeFileSync(DUMP, JSON.stringify({ system: SYSTEM, input: buildInput(ctx), news: { headlines, stockNews } }, null, 1));
    console.log('AI 입력 저장:', DUMP);
    return;
  }

  let draft;
  if (DRAFT) draft = JSON.parse(fs.readFileSync(DRAFT, 'utf8'));
  else if (DRY) draft = { error: '미리보기(--dry) 모드' };
  else {
    console.log('AI 원고 작성…');
    draft = await writeReport(ctx);
    if (draft.error) console.warn('AI 원고 실패:', draft.error);
  }
  if (DRAFT && !draft.error) draft = require('./writer').validateDraft(draft, ctx);
  ctx.draft = draft;
  ctx.recur = recurring(hist, draft, rows);
  ctx.study = studyFor(sendDate);

  const fullName = DRY ? 'preview.html' : date + '.html';
  const fullFile = path.join(ROOT, 'analysis', fullName);
  const fullUrl = SITE_URL + 'analysis/' + fullName;
  const outMail = DRY ? path.join(ROOT, 'reports', 'preview.html') : mailFile;
  fs.mkdirSync(path.dirname(fullFile), { recursive: true });
  fs.mkdirSync(path.dirname(outMail), { recursive: true });
  fs.writeFileSync(fullFile, renderFull(ctx));
  fs.writeFileSync(outMail, renderEmail({ ...ctx, fullUrl }));
  if (!DRY && !draft.error) fs.writeFileSync(path.join(ROOT, 'analysis', date + '.json'), JSON.stringify(draft, null, 1));
  console.log('저장:', rel(fullFile), rel(outMail));

  const headline = (draft && !draft.error ? draft.headline : '전일 시장 정리').replace(/\s+/g, ' ').trim();
  if (!DRY) {
    const listFile = path.join(ROOT, 'data', 'reports.js');
    let list = [];
    try { list = JSON.parse(fs.readFileSync(listFile, 'utf8').replace(/^[\s\S]*?=\s*/, '').replace(/;\s*$/, '')); } catch (e) {}
    const ok = draft && !draft.error;
    const entry = {
      date, headline, kospi: kospi.chg, kosdaq: kosdaq.chg,
      points: ok ? draft.key_points || [] : [],
      tags: ok ? [...new Set((draft.issues || []).flatMap((i) => i.tags || []).map((t) => String(t).replace(/^#/, '')))].slice(0, 5) : [],
    };
    list = [entry, ...list.filter((r) => r.date !== date)].sort((a, b) => (a.date < b.date ? 1 : -1));
    fs.writeFileSync(listFile, '// 자동 생성 파일 — daily.js 가 매일 갱신합니다.\nvar REPORTS = ' + JSON.stringify(list, null, 1) + ';\n');
  }

  output('skip', 'false');
  output('file', rel(outMail));
  output('attach', rel(fullFile));
  output('subject', `☀️ [${date.slice(5).replace('-', '/')} 장 정리] ${headline}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
