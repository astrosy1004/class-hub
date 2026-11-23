// AI 원고 작성: 수집한 숫자·뉴스 제목만 근거로 리포트 문장을 쓰게 한다.
// 숫자는 AI가 쓰지 않는다 — 종목 이름만 고르게 하고, 등락률·거래대금은 화면에서 데이터로 채운다.
const { claudeJSON } = require('./lib');

const str = { type: 'string' };
const arr = (items) => ({ type: 'array', items });
const obj = (props) => ({ type: 'object', additionalProperties: false, required: Object.keys(props), properties: props });

// 응답 문법(스키마)이 너무 커지면 API 가 거절하므로, 근거 번호·확신도·상태는 가벼운 문자열로 받고 아래 validate 에서 점검한다.
const ids = str; // "3,17" 처럼 콤마로 구분한 헤드라인 id
const conf = str; // direct | inferred | unknown
const fuStatus = str; // continued | weakened | resolved | unknown

const SCHEMA = obj({
  headline: str,
  lead: str,
  key_points: arr(str),
  trend_summary: str,
  market_summary: str,
  sectors: arr(obj({ title: str, hashtags: arr(str), items: arr(obj({ stocks: arr(str), text: str, ids, confidence: conf })) })),
  issues: arr(obj({ tags: arr(str), body: str, impact: str, ids })),
  followup: arr(obj({ item: str, result: str, status: fuStatus, ids })),
  leaders: arr(obj({ name: str, reason: str, ids, confidence: conf })),
  after_market: arr(obj({ name: str, reason: str, ids, confidence: conf })),
  overnight: arr(str),
  schedule: arr(obj({ date: str, events: arr(obj({ text: str, star: { type: 'boolean' } })) })),
  checks: arr(str),
  news_sections: arr(obj({ title: str, ids: arr({ type: 'integer' }) })),
  study_notes: arr(obj({ title: str, body: str })),
});

const SYSTEM = `너는 한국 주식시장을 매일 정리하는 리포트 작가다. 독자는 주식 공부를 막 시작한 개인 투자자다.
리포트의 목적: "어떤 종목이 왜 움직였는지"를 섹터·재료 단위로 묶어 기억하게 하고, 다음 거래일을 준비하게 하는 것.

반드시 지킬 규칙:
1. 숫자: 입력 JSON에 있는 숫자만 쓴다. 입력에 없는 주가·목표가·실적·금액·비율을 만들지 않는다. 헤드라인 제목에 들어 있는 숫자는 인용해도 된다.
2. 종목 이름: stocks·leaders·after_market 의 이름은 입력 JSON의 종목 이름을 글자 그대로 쓴다. 입력에 없는 종목은 넣지 않는다.
3. 이유: 등락의 이유는 입력 헤드라인에서만 찾는다. 근거가 없으면 "뚜렷한 재료 확인 안 됨"이라고 쓴다. 추측을 사실처럼 쓰지 않는다.
4. 매수·매도·목표가 제시 같은 투자 권유를 하지 않는다.
5. 쉬운 한국어로, 전문용어는 처음 나올 때 괄호로 짧게 풀어 쓴다. 문장은 간결하게.
6. 근거 표시: sectors.items·issues·leaders·after_market·followup 의 ids 에는 그 문장의 근거가 된 헤드라인 id 를 1~3개, 콤마로 구분한 문자열로 넣는다(예 "3,17". 근거가 없으면 빈 문자열).
   confidence 는 direct(헤드라인이 그 종목·재료와 등락을 직접 연결해 언급) / inferred(직접 언급은 없고 같은 날 헤드라인 정황으로 추정 — 문장을 "~로 보인다"로 끝낸다) /
   unknown(재료 확인 안 됨 — 이때 문장은 "뚜렷한 재료 확인 안 됨"). direct 인데 ids 가 비면 안 된다.

각 필드:
- headline: 하루를 요약하는 제목 (30자 이내). lead: 부제 한 줄.
- key_points: 리포트 맨 위에 강조할 "오늘 꼭 알아야 할 것" 정확히 3개. 각 한 문장(60자 이내).
  ①시장 전체 방향과 원인 ②돈이 몰린 곳/빠진 곳 ③다음 거래일에 확인할 것.
- trend_summary: 입력 recent_reports(지난 리포트)와 recurring(반복 재료·종목)을 보고, 여러 날에 걸친 흐름을 2~3문장으로.
  어떤 재료가 계속 이어지는지, 새로 등장했는지, 힘이 빠지는지. 지난 리포트가 없으면 빈 문자열.
- market_summary: 지수·수급·주도 섹터를 담은 3~4문장.
- sectors: 6~10개 묶음. 크게 움직인 섹터(상승·하락 모두)와 급락장 속 역행 섹터를 고른다. title 은 섹터명, hashtags 는 재료 2~3개.
  items 는 1~3개: stocks 는 같은 이유로 움직인 종목 2~6개, text 는 그 이유 1~2문장.
- issues: TODAY ISSUE 3~4개. 하루를 압축하는 핵심 이슈. tags 2~3개, body 2~4문장, impact 는 시장 영향 한 문장.
- leaders: 거래대금 상위와 역행 강세 종목 중 12~15개, 각 이유 한 줄.
- after_market: 입력 after_market 종목 각각의 이유 (헤드라인 근거, 없으면 "확인 안 됨").
- overnight: 장 마감 후~리포트 작성 시점 사이의 해외 시장·주말 소식 3~5개.
- schedule: 헤드라인에서 날짜가 확인되는 앞으로 7일 이내 일정만. date 는 "MM/DD (요일)". 시장 전체에 영향이 큰 것은 star=true.
- checks: 재료가 계속 살아 있는지 추적할 이슈 4~7개.
- news_sections: 12~16개 분야(경제 일반, 미중 관계, 국제-미국, 국제-유럽·아시아, 원자재·코인, 정부 정책, 반도체, 전력·에너지, AI·로봇, 이차전지, 바이오, 조선·방산, 엔터·게임·화장품, IPO, 공시 등). 분야마다 관련 헤드라인 id 2~4개.
- followup: 입력 previous_report.checks 의 항목마다 하나씩, 그 이슈가 오늘 어떻게 됐는지. item 은 어제 항목을 그대로, result 는 오늘 시세·헤드라인으로 확인된 결과 1~2문장
  (근거가 없으면 "오늘 뉴스에서 확인 안 됨"). status: continued(이어짐) / weakened(약해짐) / resolved(마무리·해소) / unknown(확인 안 됨). previous_report 가 null 이면 빈 배열.
- study_notes: 오늘 리포트 내용으로 배울 수 있는 개념 3~4개. 오늘 실제 사례를 들어 설명.`;

const SIMPLE = (r) => ({ name: r.name, market: r.mkt, sector: r.sector, change_pct: r.d0.r, trading_value_eok: r.d0.tv });

function buildInput(ctx) {
  const { date, sendDate, idx, globals, mv, after, scr, headlines, stockNews } = ctx;
  const withNews = (r) => ({ ...SIMPLE(r), headline_ids: stockNews[r.code] || [] });
  return {
    trading_date: date,
    report_written: sendDate + ' 아침',
    korea: idx,
    globals,
    stocks: {
      top_trading_value: mv.topTv.slice(0, 30).map(withNews),
      gainers: mv.gainers.map(withNews),
      losers: mv.losers.slice(0, 30).map(withNews),
      big_candle_previous_day: scr.d1.map((r) => ({ name: r.name, prev_day_change_pct: r.d1.r, change_pct: r.d0.r })),
    },
    after_market: after.slice(0, 10).map((r) => ({ name: r.name, regular_change_pct: r.d0.r, after_market_change_pct: r.nxt, headline_ids: stockNews[r.code] || [] })),
    recent_reports: ctx.recentReports || [],
    previous_report: ctx.previousReport
      ? { date: ctx.previousReport.date, headline: ctx.previousReport.headline, checks: ctx.previousReport.checks || [], issues: (ctx.previousReport.issues || []).map((i) => ({ tags: i.tags, impact: i.impact })) }
      : null,
    recurring: ctx.recurringBefore || { tags: [], stocks: [] },
    headlines: headlines.map((h) => ({ id: h.id, title: h.title, source: h.source, time: h.when, topic: h.topic })),
  };
}

// AI가 쓴 이름을 실제 종목과 대조해 없는 것은 버리고, 근거 번호(ids)·확신도를 점검한다.
function validate(draft, names, headlineIds, hasPrev = true) {
  const ok = (n) => names.has(n);
  const toIds = (v) => (Array.isArray(v) ? v : String(v == null ? '' : v).split(/[^0-9]+/).filter(Boolean)).map(Number);
  const fixIds = (x) => toIds(x.ids).filter((i) => headlineIds.has(i)).slice(0, 3);
  const CONF = new Set(['direct', 'inferred', 'unknown']);
  const FU = new Set(['continued', 'weakened', 'resolved', 'unknown']);
  // direct 인데 근거 번호가 없으면 inferred 로 낮춘다.
  const withEvidence = (x) => {
    const ids = fixIds(x);
    let confidence = CONF.has(x.confidence) ? x.confidence : 'unknown';
    if (confidence === 'direct' && !ids.length) confidence = 'inferred';
    return { ...x, ids, confidence };
  };
  draft.sectors = (draft.sectors || []).map((s) => ({
    ...s,
    items: (s.items || []).map((it) => withEvidence({ ...it, stocks: (it.stocks || []).filter(ok) })).filter((it) => it.stocks.length || it.text),
  })).filter((s) => s.items.length);
  draft.issues = (draft.issues || []).map((i) => ({ ...i, ids: fixIds(i) }));
  draft.leaders = (draft.leaders || []).filter((l) => ok(l.name)).map(withEvidence);
  draft.after_market = (draft.after_market || []).filter((l) => ok(l.name)).map(withEvidence);
  draft.followup = hasPrev ? (draft.followup || []).filter((f) => f.item && f.result).map((f) => ({ ...f, ids: fixIds(f), status: FU.has(f.status) ? f.status : 'unknown' })) : [];
  draft.news_sections = (draft.news_sections || []).map((s) => ({ ...s, ids: (s.ids || []).filter((i) => headlineIds.has(i)) })).filter((s) => s.ids.length);
  return draft;
}

async function writeReport(ctx) {
  const input = buildInput(ctx);
  const draft = await claudeJSON({
    system: SYSTEM,
    user: '아래 데이터로 ' + ctx.date + ' 장 분석 리포트 원고를 JSON으로 작성해 줘.\n\n' + JSON.stringify(input),
    schema: SCHEMA,
  });
  if (draft.error) return draft;
  return validateDraft(draft, ctx);
}

const validateDraft = (draft, ctx) => validate(draft, new Set(ctx.rows.map((r) => r.name)), new Set(ctx.headlines.map((h) => h.id)), !!ctx.previousReport);

module.exports = { writeReport, validateDraft, buildInput, SYSTEM };
