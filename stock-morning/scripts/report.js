// 전체 장 분석 리포트 (웹 페이지 / 메일 첨부용 HTML)
// 구성: 전일 시장 정리 → TODAY ISSUE → 주도 종목 → After market → 주간 일정 → 일정 Check
//       → 차트상 관심주 → 섹터별 뉴스 → 공부 노트
// 숫자는 전부 수집 데이터에서 채운다. AI 원고(draft)가 없으면 데이터만으로 그린다.
const { SCREEN } = require('./config');

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sign = (v, d = 2) => (v > 0 ? '+' : '') + Number(v).toFixed(d);
const cls = (v) => (v > 0 ? 'up' : v < 0 ? 'dn' : 'flat');
const pct = (v) => (typeof v === 'number' ? `<span class="${cls(v)}">${sign(v)}%</span>` : '<span class="muted">-</span>');
const won = (v) => Number(v).toLocaleString('ko-KR');
// 12682 → "1조2,682억"
const eok = (v) => {
  const a = Math.abs(v), s = v > 0 ? '+' : v < 0 ? '-' : '';
  const jo = Math.floor(a / 10000), rest = a % 10000;
  return s + (jo ? jo + '조' + (rest ? won(rest) + '억' : '') : won(rest) + '억');
};
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const dayLabel = (d) => `${d.replace(/-/g, '.')}.(${WD[new Date(d + 'T00:00:00Z').getUTCDay()]})`;

function spark(r) {
  const c = r.spark, m = r.sparkMa;
  const vals = c.concat(m.filter((v) => v != null));
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const W = 150, H = 44;
  const x = (k) => (k / Math.max(1, c.length - 1)) * W;
  const y = (v) => H - 3 - ((v - lo) / (hi - lo || 1)) * (H - 6);
  const line = (a) => a.map((v, k) => (v == null ? null : `${x(k).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline class="ma" points="${line(m)}"/><polyline class="px" points="${line(c)}"/><circle class="dot" cx="${x(c.length - 1)}" cy="${y(c[c.length - 1])}" r="2.6"/></svg>`;
}

// 차트상 관심주 위에 붙는 "보는 법" 안내 (매일 같은 내용)
const CHART_GUIDE = (siteUrl) => `<div class="blk"><h3>📖 미니 차트 읽는 법</h3>
  <p style="margin:0 0 6px;font-size:14.5px">이 코너는 사라고 고른 목록이 아니라, 크게 오른 종목이 그 뒤 며칠·몇 주 동안 어떻게 움직이는지 관찰하는 <b>공부 일지</b>입니다. 늘 두 가지를 함께 물어보세요 — <b>① 재료가 아직 살아 있나?</b> (오르게 한 뉴스가 계속 나오나) <b>② 가격이 어디서 버티나?</b> (어느 이동평균선에서 멈추나)</p>
  <ul class="hl">
    <li><b>파란 실선</b> 최근 40거래일 종가 · <b>주황 점선</b> 20일 이동평균선(최근 한 달 평균 가격) · <b>끝의 점</b> 리포트 날짜 종가</li>
    <li><b>위치</b> — 점이 20일선 위면 최근 한 달 산 사람들이 대체로 수익, 아래면 대체로 손실 상태</li>
    <li><b>기울기</b> — 20일선이 올라가면 상승 추세, 내려가면 하락 추세</li>
    <li><b>거리(이격)</b> — "20일선 대비 +50%"처럼 평균에서 너무 멀면 단기 과열 신호</li>
    <li><b>그룹</b> — 0일차(큰 양봉 당일) → 1·2일차(다음 날 버텼나) → 5~8·15·33~45·120일선(조정 때 어느 평균선에서 멈추나) 순서로 같은 종목을 따라가 보세요</li>
  </ul>
  <p class="muted" style="margin:6px 0 0;font-size:13px">미니 차트에는 캔들·거래량이 없으니 궁금한 종목은 증권 앱 일봉 차트로 함께 확인하세요. 이평선 지지는 "그런 경향"일 뿐 규칙이 아니며, 시장 전체가 급락하는 날엔 대부분 무너집니다.</p>
  <p style="margin:10px 0 0"><a class="sheet-link" href="${siteUrl}chart.html" target="_blank" rel="noopener">📈 차트 공부 시트로 차근차근 배우기 →</a></p>
</div>`;

// 오늘 데이터로 만든 연습 문제 (예측이 아니라 관찰·기록 과제)
function practice(scr, idx) {
  const items = [];
  const d0 = scr.d0.filter((r) => r.ma20);
  if (d0.length >= 2) {
    const gap = (r) => (r.c / r.ma20 - 1) * 100;
    const far = d0.reduce((a, b) => (gap(b) > gap(a) ? b : a));
    const near = d0.reduce((a, b) => (Math.abs(gap(b)) < Math.abs(gap(a)) ? b : a));
    items.push([far.name, `0일차 · 20일선 대비 ${sign(gap(far), 1)}%`, '평균 가격에서 가장 멀리 올라간 양봉입니다. 이런 과열이 며칠 동안 어떻게 식는지(옆으로 쉬나, 20일선 쪽으로 내려오나) 1~2주 관찰해 보세요.']);
    if (near !== far) items.push([near.name, `0일차 · 20일선 대비 ${sign(gap(near), 1)}%`, `평균 가격 근처에서 출발한 양봉입니다. ${far.name}과 앞으로의 흐름을 나란히 비교해 보세요.`]);
  }
  if (scr.d1.length >= 2) {
    const best = scr.d1.reduce((a, b) => (b.d0.r > a.d0.r ? b : a));
    const worst = scr.d1.reduce((a, b) => (b.d0.r < a.d0.r ? b : a));
    items.push([best.name, `1일차 · ${sign(best.d1.r)}% → ${sign(best.d0.r)}%`, `큰 양봉 다음 날 가장 잘 버틴 종목입니다. 같은 날 코스피 ${sign(idx.kospi.chg)}%와 비교해 시장보다 강했는지 기록해 두세요.`]);
    if (worst !== best) items.push([worst.name, `1일차 · ${sign(worst.d1.r)}% → ${sign(worst.d0.r)}%`, '큰 양봉 다음 날 상승분을 가장 많이 내준 종목입니다. 재료가 약했던 건지, 시장 악재에 눌린 건지 "전일 시장 정리"에서 이유를 찾아 적어 보세요.']);
  }
  if (!items.length) return '';
  return `<div class="blk"><h3>✍️ 이 리포트로 연습해 보기</h3>
  <ul class="hl">${items.map(([n, tag, text]) => `<li><b>${esc(n)}</b> <span class="muted">(${esc(tag)})</span> — ${esc(text)}</li>`).join('')}</ul>
  <div class="guide" style="margin-bottom:0"><b>기록 양식</b> 날짜 / 종목 / 재료 한 줄 / 20일선 위·아래 / 내 예상(버틴다·밀린다) → 3~5거래일 뒤 같은 종목을 다시 보고 맞았는지, 이유는 무엇인지 한 줄 남기기</div>
</div>`;
}

// AI가 없을 때 데이터만으로 만드는 핵심 3줄
function dataPoints(ctx) {
  const { idx, mv } = ctx;
  const t = mv.topTv[0];
  const g = mv.gainers[0];
  return [
    `코스피 ${sign(idx.kospi.chg)}%, 코스닥 ${sign(idx.kosdaq.chg)}%`,
    t ? `거래대금 1위 ${t.name} ${sign(t.d0.r)}% (${won(t.d0.tv)}억)` : '',
    g ? `상승률 상위 ${g.name} ${sign(g.d0.r)}%` : '',
  ].filter(Boolean);
}

// 리포트 맨 위 "핵심 요약" — 오늘 꼭 알아야 할 3가지 + 여러 날 반복되는 재료·종목
function keyBox(ctx) {
  const { draft, recur } = ctx;
  const hasAi = draft && !draft.error;
  const points = hasAi && draft.key_points && draft.key_points.length ? draft.key_points : dataPoints(ctx);
  const trend = hasAi && draft.trend_summary ? `<p class="trend">${esc(draft.trend_summary)}</p>` : '';
  const tags = recur && recur.tags.length ? `<div class="rk"><b>반복되는 재료</b> ${recur.tags.map((t) => `<span class="rt">#${esc(t.tag)} <i>${t.count}일</i></span>`).join('')}</div>` : '';
  const stocks = recur && recur.stocks.length ? `<div class="rk"><b>계속 등장하는 종목</b> ${recur.stocks.map((s) => `<span class="rs">${esc(s.name)} <i>${s.count}일</i>${s.since != null ? ` <small>${s.first.slice(5)} 이후 ${pct(s.since)}</small>` : ''}</span>`).join('')}</div>` : '';
  const recurBlock = trend || tags || stocks
    ? `<div class="key-sub"><h3>🔁 ${recur.days >= 2 ? `최근 ${recur.days}개 리포트에서 ` : ''}이어지는 흐름</h3>${trend}${tags}${stocks}</div>`
    : '';
  return `<section class="key"><h2>📌 오늘 꼭 알아야 할 3가지</h2><ol>${points.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>${recurBlock}</section>`;
}

function renderFull(ctx) {
  const { date, sendDate, idx, globals, mv, after, scr, headlines, draft, study, siteUrl, rows, fails, total } = ctx;
  const hasAi = draft && !draft.error;
  const by = {};
  for (const r of rows) by[r.name] = r;
  const H = {};
  for (const h of headlines) H[h.id] = h;

  const chip = (name) => {
    const r = by[name];
    if (!r) return '';
    return `<span class="chip"><b>${esc(name)}</b> ${pct(r.d0.r)}<span class="tv">${won(r.d0.tv)}</span></span>`;
  };
  const card = (r, note) => `<a class="cc" href="https://finance.naver.com/item/fchart.naver?code=${esc(r.code)}" target="_blank" rel="noopener" title="네이버 차트 열기"><div class="cc-h"><b>${esc(r.name)}</b><span>${pct(r.d0.r)}</span></div>${spark(r)}<div class="cc-n">${note}</div></a>`;
  const CONF = { direct: ['직접 언급', 'b-direct'], inferred: ['추정', 'b-inf'], unknown: ['재료 불명', 'b-unk'] };
  const badge = (c) => (CONF[c] ? `<span class="cb ${CONF[c][1]}">${CONF[c][0]}</span>` : '');
  const refs = (ids) => (ids || []).map((i) => H[i]).filter(Boolean).slice(0, 3)
    .map((h) => `<a class="ref" href="${esc(h.link)}" target="_blank" rel="noopener" title="${esc(h.source + ' — ' + h.title)}">[${h.id}]</a>`).join('');
  const hlList = (ids) => '<ul class="hl">' + ids.map((i) => H[i]).filter(Boolean).map((h) =>
    `<li><a href="${esc(h.link)}" target="_blank" rel="noopener">${esc(h.title)}</a> <span class="src">${esc(h.source)}</span></li>`).join('') + '</ul>';

  // ---- 상단 지표
  const k = idx.kospi, q = idx.kosdaq;
  const fx = globals.find((g) => g.symbol === 'KRW=X');
  const flowLine = (name, f) => (f ? `${name} 외국인 <span class="${cls(f.foreign)}">${eok(f.foreign)}</span> · 기관 <span class="${cls(f.institution)}">${eok(f.institution)}</span> · 개인 <span class="${cls(f.personal)}">${eok(f.personal)}</span>` : '');
  const breadth = (f) => (f ? `상승 ${f.rise}(상한 ${f.upper}) · 하락 ${f.fall}(하한 ${f.lower})` : '');
  const kpi = `<div class="kpi">
    <div><span>코스피</span><b>${k.close.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}</b>${pct(k.chg)}</div>
    <div><span>코스닥</span><b>${q.close.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}</b>${pct(q.chg)}</div>
    ${fx ? `<div><span>원/달러 (해외 시세 기준)</span><b>${won(fx.close.toFixed(1))}원</b>${pct(fx.chg)}</div>` : ''}
  </div>
  ${(k.flow || q.flow) ? `<div class="flow"><b>수급(억원)</b> ${flowLine('코스피', k.flow)}<br>${flowLine('코스닥', q.flow)}<br><b>등락 종목 수</b> 코스피 ${breadth(k.flow)} · 코스닥 ${breadth(q.flow)}</div>` : ''}`;

  // ---- 전일 시장 정리
  const recap = hasAi
    ? draft.sectors.map((s) => `<section class="blk"><h3>${esc(s.title)}</h3><div class="tags">${s.hashtags.map((t) => `<span>#${esc(String(t).replace(/^#/, ''))}</span>`).join('')}</div>${s.items.map((it) => `<div class="it"><div class="chips">${it.stocks.map(chip).join('')}</div><p>${esc(it.text)}${badge(it.confidence)}${refs(it.ids)}</p></div>`).join('')}</section>`).join('')
    : `<section class="blk"><h3>상승 상위</h3><div class="chips">${mv.gainers.slice(0, 20).map((r) => chip(r.name)).join('')}</div></section><section class="blk"><h3>하락 상위</h3><div class="chips">${mv.losers.slice(0, 20).map((r) => chip(r.name)).join('')}</div></section>`;

  const issues = hasAi ? draft.issues.map((i) => `<div class="issue"><h3>${i.tags.map((t) => '#' + esc(String(t).replace(/^#/, ''))).join(' ')}</h3><p>${esc(i.body)}${refs(i.ids)}</p><p><b>시장 영향</b> ${esc(i.impact)}</p></div>`).join('') : '<p class="muted">AI 해설을 만들지 못한 날입니다. 아래 데이터를 참고하세요.</p>';

  // ---- 어제 확인할 것 → 오늘 결과
  const FU = { continued: ['이어짐', 'fu-c'], weakened: ['약해짐', 'fu-w'], resolved: ['해소', 'fu-r'], unknown: ['확인 안 됨', 'fu-u'] };
  const followup = hasAi && draft.followup && draft.followup.length
    ? `<h2 id="followup">어제 확인할 것 → 오늘 결과<small>${esc(ctx.previousReport ? ctx.previousReport.date : '')} 리포트가 "계속 추적하자"고 한 이슈가 오늘 어떻게 됐는지</small></h2>
  <div class="blk"><ul class="fu">${draft.followup.map((f) => `<li><span class="cb ${(FU[f.status] || FU.unknown)[1]}">${(FU[f.status] || FU.unknown)[0]}</span> <b>${esc(f.item)}</b><br>${esc(f.result)}${refs(f.ids)}</li>`).join('')}</ul></div>`
    : '';

  // ---- 주도 종목
  const leaderList = hasAi && draft.leaders.length ? draft.leaders : mv.topTv.slice(0, 15).map((r) => ({ name: r.name, reason: '' }));
  const leaderRows = leaderList.map((l) => {
    const r = by[l.name];
    return `<tr><td><b>${esc(l.name)}</b><div class="mkt">${r.mkt}</div></td><td class="num">${pct(r.d0.r)}</td><td class="num">${won(r.d0.tv)}</td><td>${esc(l.reason)}${badge(l.confidence)}${refs(l.ids)}</td></tr>`;
  }).join('');

  // ---- 애프터마켓
  const amWhy = {};
  const amConf = {}, amIds = {};
  if (hasAi) for (const a of draft.after_market) { amWhy[a.name] = a.reason; amConf[a.name] = a.confidence; amIds[a.name] = a.ids; }
  const afterRows = after.slice(0, 10).map((r) => `<tr><td><b>${esc(r.name)}</b></td><td class="num">${pct(r.d0.r)}</td><td class="num">${pct(r.nxt)}</td><td>${esc(amWhy[r.name] || '')}${badge(amConf[r.name])}${refs(amIds[r.name])}</td></tr>`).join('');

  const gtbl = (group) => {
    const rowsG = globals.filter((g) => g.group === group);
    if (!rowsG.length) return '';
    return '<table class="mini"><tbody>' + rowsG.map((g) => {
      const close = g.unit === '$' ? '$' + won(g.close.toFixed(2)) : g.unit === '%' ? g.close.toFixed(2) + '%' : won(g.close.toFixed(2)) + (g.unit === '원' ? '원' : '');
      const chg = g.diff ? `<span class="${cls(g.diffPt)}">${sign(g.diffPt)}%p</span>` : pct(g.chg);
      return `<tr><td>${esc(g.name)}<div class="mkt">${g.date.slice(5)}</div></td><td class="num">${close}</td><td class="num">${chg}</td></tr>`;
    }).join('') + '</tbody></table>';
  };

  const overnight = hasAi && draft.overnight.length ? `<div class="blk"><ul class="hl">${draft.overnight.map((o) => `<li>${esc(o)}</li>`).join('')}</ul></div>` : '';
  const schedule = hasAi && draft.schedule.length ? `<dl class="sched">${draft.schedule.map((s) => `<dt>${esc(s.date)}</dt><dd>${s.events.map((e) => esc(e.text) + (e.star ? ' <span class="star">★</span>' : '')).join(' · ')}</dd>`).join('')}</dl>` : '<p class="muted">확인된 일정이 없습니다.</p>';
  const checks = hasAi && draft.checks.length ? `<div class="blk"><ul class="hl">${draft.checks.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>` : '';

  // ---- 차트상 관심주
  const grp = (title, list, note) => (list.length ? `<h3 class="sub">${title}</h3><div class="cards">${list.map((r) => card(r, note(r))).join('')}</div>` : '');
  const charts = [
    grp(`[0일차] ${date.slice(5)} 큰 양봉`, scr.d0, (r) => `거래대금 ${won(r.d0.tv)}억 · 20일선 대비 ${r.ma20 ? sign((r.c / r.ma20 - 1) * 100, 1) + '%' : '-'}`),
    grp('[1일차] 전 거래일 큰 양봉 → 다음 날', scr.d1, (r) => `${r.d1.d.slice(5)} ${pct(r.d1.r)} · ${won(r.d1.tv)}억 → ${pct(r.d0.r)}`),
    grp('[2일차] 이틀 전 큰 양봉 → 이틀간 흐름', scr.d2, (r) => `${pct(r.d2.r)} → ${pct(r.d1.r)} → ${pct(r.d0.r)}`),
    grp('[5~8일선]', scr.ma58, () => '큰 양봉 뒤 5~8일선 부근'),
    grp('[15일선]', scr.ma15, () => '15일선 부근'),
    grp('[33~45일선]', scr.ma3345, () => '33~45일선 부근'),
    grp('[120일선]', scr.ma120, () => '120일선 부근'),
  ].join('') + (scr.crash.length ? `<h3 class="sub">[급락]</h3><div class="chips">${scr.crash.map((r) => chip(r.name)).join('')}</div>` : '');

  // ---- 섹터별 뉴스
  const newsHtml = hasAi
    ? draft.news_sections.map((s) => `<section class="blk"><h3>${esc(s.title)}</h3>${hlList(s.ids)}</section>`).join('')
    : [...new Set(headlines.map((h) => h.topic))].map((t) => `<section class="blk"><h3>${esc(t)}</h3>${hlList(headlines.filter((h) => h.topic === t).slice(0, 6).map((h) => h.id))}</section>`).join('');

  const studyNotes = hasAi && draft.study_notes.length ? `<dl class="study">${draft.study_notes.map((n, i) => `<dt>${'①②③④⑤'[i] || '·'} ${esc(n.title)}</dt><dd>${esc(n.body)}</dd>`).join('')}</dl>` : '';
  const s = study.lesson;
  const studyPlan = `<div class="study"><b>📚 주식 공부 30일 전략 · ${study.round > 1 ? study.round + '회독 ' : ''}${s.day}일차 / 30 — ${esc(s.title)}</b><p class="muted">${study.week.week}주차 ${esc(study.week.theme)} · 목표: ${esc(s.goal)}</p><ul>${s.learn.map((l) => `<li>${esc(l)}</li>`).join('')}</ul><div class="guide">✍️ <b>오늘의 실습</b> ${esc(s.practice)}</div><a href="${esc(siteUrl)}#study">30일 전체 계획 보기 →</a></div>`;

  const title = `${dayLabel(date)} 장 분석 리포트`;
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>
:root{--bg:#f3f4f7;--card:#fff;--text:#1d2230;--sub:#667085;--line:#e6e8ee;--accent:#3b5bdb;--soft:#eef2ff;--up:#e03131;--dn:#1c7ed6;--note:#fff4e6;--ma:#f08c00}
[data-theme="dark"]{--bg:#12151c;--card:#1b1f29;--text:#e8eaf0;--sub:#9aa3b5;--line:#2c3240;--accent:#7c95ff;--soft:#252c45;--up:#ff6b6b;--dn:#4dabf7;--note:#3a2f1f;--ma:#ffa94d}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif;line-height:1.6;font-size:15px}
.wrap{max-width:820px;margin:0 auto;padding:0 16px}
header.top{background:var(--card);border-bottom:1px solid var(--line);padding:20px 0 14px}
.date{color:var(--sub);font-size:13px}
h1{font-size:24px;margin:2px 0 6px}
.lead{margin:0;color:var(--sub);font-size:14px}
.theme{float:right;border:1px solid var(--line);background:var(--bg);color:var(--text);border-radius:999px;width:38px;height:38px;cursor:pointer;font-size:17px}
nav.toc{display:flex;gap:6px;overflow-x:auto;padding:10px 0 2px;scrollbar-width:none}
nav.toc a{white-space:nowrap;font-size:13px;color:var(--accent);background:var(--soft);padding:5px 10px;border-radius:999px;text-decoration:none;font-weight:600}
h2{font-size:19px;margin:30px 0 4px;padding-top:8px}
h2 small{display:block;font-size:13px;color:var(--sub);font-weight:400;margin-top:2px}
h3.sub{font-size:15px;margin:14px 0 6px}
.guide{background:var(--note);border-radius:10px;padding:10px 12px;font-size:14px;margin:8px 0 12px}
.kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:14px 0 6px}
.kpi div{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.kpi b{display:block;font-size:18px}
.kpi span{font-size:12px;color:var(--sub)}
.kpi span.up{color:var(--up)}.kpi span.dn{color:var(--dn)}
.key{background:var(--soft);border:2px solid var(--accent);border-radius:16px;padding:16px 18px;margin:16px 0 8px}
.key h2{margin:0 0 6px;padding:0;font-size:18px}
.key ol{margin:0;padding-left:22px}
.key ol li{font-size:16px;font-weight:700;margin:5px 0;line-height:1.5}
.key-sub{border-top:1px dashed var(--accent);margin-top:12px;padding-top:10px}
.key-sub h3{margin:0 0 6px;font-size:15px}
.trend{margin:0 0 8px;font-size:14.5px}
.rk{font-size:13.5px;margin:6px 0;line-height:2}
.rk b{margin-right:6px}
.rt,.rs{display:inline-block;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:1px 10px;margin:0 4px 0 0;white-space:nowrap}
.rt i,.rs i{font-style:normal;color:var(--accent);font-weight:700}
.rs small{color:var(--sub)}
.sheet-link{display:inline-block;background:var(--accent);color:#fff;font-weight:700;text-decoration:none;border-radius:10px;padding:9px 14px;font-size:14px}
.flow{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-size:14px}
.blk{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:10px 0}
.blk h3{margin:0 0 6px;font-size:16px}
.tags{margin:0 0 8px}
.tags span{display:inline-block;font-size:12.5px;color:var(--accent);background:var(--soft);border-radius:999px;padding:2px 9px;margin:0 5px 5px 0;font-weight:600}
.it{border-top:1px dashed var(--line);padding:8px 0 2px}
.it:first-of-type{border-top:0}
.it p{margin:4px 0;font-size:14.5px}
.chips{display:flex;flex-wrap:wrap;gap:5px}
.chip{font-size:13.5px;background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:2px 8px;white-space:nowrap}
.chip .tv{color:var(--sub);font-size:12px;margin-left:4px}
.chip .tv::before{content:'('}.chip .tv::after{content:'억)'}
.up{color:var(--up);font-weight:700}.dn{color:var(--dn);font-weight:700}.flat,.muted{color:var(--sub)}
.issue{background:var(--card);border-left:4px solid var(--accent);border-radius:10px;padding:12px 14px;margin:10px 0}
.issue h3{margin:0 0 4px;font-size:16px}
.issue p{margin:4px 0;font-size:14.5px}
table{width:100%;border-collapse:collapse;background:var(--card);font-size:14px}
th,td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
th{font-size:12.5px;color:var(--sub);font-weight:600;background:var(--bg)}
td.num,th.num{text-align:right;white-space:nowrap}
td:first-child b{white-space:nowrap}
.mkt{font-size:11px;color:var(--sub)}
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px}
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}
.grid3 .mini{border:1px solid var(--line);border-radius:12px}
.sched{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:6px 14px}
.sched dt{font-weight:800;margin-top:10px}
.sched dd{margin:2px 0 8px 0;font-size:14.5px}
.star{color:var(--up);font-weight:700}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;margin:8px 0}
.cc{display:block;color:inherit;text-decoration:none;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:8px 10px}
.cc:hover{border-color:var(--accent)}
.cc-h{display:flex;justify-content:space-between;font-size:13.5px;gap:6px}
.cc-n{font-size:12px;color:var(--sub);margin-top:2px}
.spark{width:100%;height:44px;display:block;margin-top:4px}
.spark .px{fill:none;stroke:var(--accent);stroke-width:1.6}
.spark .ma{fill:none;stroke:var(--ma);stroke-width:1.2;stroke-dasharray:3 2}
.spark .dot{fill:var(--accent)}
.legend{font-size:12px;color:var(--sub)}
.legend i{display:inline-block;width:14px;height:2px;vertical-align:middle;margin:0 4px 0 8px}
ul.hl{margin:0;padding-left:18px}
ul.hl li{margin:3px 0;font-size:14px}
ul.hl a{color:var(--text);text-decoration:none}
ul.hl a:hover{color:var(--accent);text-decoration:underline}
.src{color:var(--sub);font-size:12px}
.ref{font-size:11px;color:var(--accent);text-decoration:none;margin-left:3px;vertical-align:super}
.cb{display:inline-block;font-size:11px;font-weight:700;border-radius:999px;padding:1px 7px;margin-left:4px;white-space:nowrap;vertical-align:1px}
.b-direct,.fu-c{background:rgba(47,158,68,.16);color:#2f9e44}
.b-inf,.fu-w{background:rgba(240,140,0,.16);color:#e67700}
.b-unk,.fu-u{background:rgba(134,142,150,.2);color:var(--sub)}
.fu-r{background:rgba(59,91,219,.16);color:var(--accent)}
ul.fu{margin:0;padding-left:0;list-style:none}
ul.fu li{margin:8px 0;font-size:14px;line-height:1.6}
.study{background:var(--card);border:2px solid var(--accent);border-radius:14px;padding:14px 16px;margin:10px 0}
.study dt{font-weight:800;margin-top:8px}
.study dd{margin:2px 0 0;font-size:14.5px}
.study a{color:var(--accent);font-weight:700;text-decoration:none}
footer{color:var(--sub);font-size:12px;padding:24px 0 36px;line-height:1.7}
/* 가독성: Pretendard · 한글 단어 단위 줄바꿈 · 넉넉한 행간 */
body{font-size:16px;line-height:1.75;letter-spacing:-.012em;word-break:keep-all;overflow-wrap:break-word;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
p,li,dd{text-wrap:pretty}
h1{font-size:26px;line-height:1.35;letter-spacing:-.025em;font-weight:800}
h2{font-size:21px;line-height:1.4;letter-spacing:-.02em;font-weight:800;margin-top:38px}
h2 small{font-size:13.5px;line-height:1.6;letter-spacing:-.01em}
h3{letter-spacing:-.015em}
.lead{font-size:15.5px}
.it p,.issue p,.trend,.sched dd{font-size:15.5px;line-height:1.8}
.issue p{margin:6px 0}
ul.hl li,ul.fu li{font-size:15px;line-height:1.7;margin:5px 0}
table{font-size:14.5px}
td{line-height:1.65}
th,td{padding:10px 12px}
.guide{font-size:14.5px;line-height:1.7}
.chip{font-size:14px}
.cc-n,.mkt{line-height:1.5}
.num,.kpi b,.chip,.up,.dn,.flat,.cc-h span{font-variant-numeric:tabular-nums}
.key ol li{font-size:17px;line-height:1.6}
.wrap{padding:0 18px}
@media (max-width:480px){h1{font-size:23px}h2{font-size:19px}body{font-size:15.5px}}
@media print{.theme,nav.toc{display:none}body{background:#fff}}
</style>
</head>
<body>
<header class="top"><div class="wrap">
  <button class="theme" id="theme" type="button" aria-label="다크 모드 전환">🌙</button>
  <div class="date">${esc(sendDate)} 아침 작성 · ${esc(date)} 장 기준</div>
  <h1>${esc(title)}</h1>
  <p class="lead">${hasAi ? esc(draft.headline + ' — ' + draft.lead) : '시세·뉴스 데이터 정리'}</p>
  <nav class="toc">
    <a href="#recap">전일 시장 정리</a><a href="#issue">TODAY ISSUE</a>${followup ? '<a href="#followup">어제 이슈 결과</a>' : ''}<a href="#leaders">주도 종목</a><a href="#after">After market</a>
    <a href="#week">주간 일정</a><a href="#check">일정 Check</a><a href="#chart">차트상 관심주</a><a href="#news">섹터별 뉴스</a><a href="#study">공부</a>
  </nav>
</div></header>
<main class="wrap">
  ${keyBox(ctx)}
  ${kpi}
  ${hasAi ? `<p>${esc(draft.market_summary)}</p>` : ''}

  <h2 id="recap">전일 시장 정리<small>섹터별로 "무엇이 움직였고, 왜 움직였나". 괄호 안은 등락률과 거래대금(억원, 추정).</small></h2>
  <div class="guide">💡 <b>읽는 법</b> — 주가를 움직인 재료는 하루로 끝나지 않고 반복됩니다. 해시태그를 기억해 두면 같은 뉴스가 다시 나올 때 어떤 종목이 움직일지 먼저 떠올릴 수 있습니다.</div>
  ${recap}

  <h2 id="issue">TODAY ISSUE<small>시간이 없다면 이 부분만이라도</small></h2>
  ${issues}

  ${followup}

  <h2 id="leaders">전일 시장 주도 종목<small>거래대금이 큰 종목이 그날 시장의 주인공입니다.</small></h2>
  <div class="tablewrap"><table><thead><tr><th>종목</th><th class="num">등락률</th><th class="num">거래대금(억)</th><th>이유</th></tr></thead><tbody>${leaderRows}</tbody></table></div>

  <h2 id="after">After market &amp; 해외 시장<small>장 마감 뒤 움직임 — 다음 거래일 시초가의 단서</small></h2>
  ${afterRows ? `<h3 class="sub">NXT 애프터마켓 (정규장 종가 대비 시간외 최종가, ±${SCREEN.afterMinMove}% 이상)</h3><div class="tablewrap"><table><thead><tr><th>종목</th><th class="num">정규장</th><th class="num">애프터마켓</th><th>재료</th></tr></thead><tbody>${afterRows}</tbody></table></div>` : ''}
  <h3 class="sub">해외 시장</h3>
  <div class="grid3">${gtbl('us')}${gtbl('stock')}${gtbl('asia')}${gtbl('etc')}</div>
  ${overnight ? `<h3 class="sub">장 마감 이후 소식</h3>${overnight}` : ''}

  <h2 id="week">주간 일정<small><span class="star">★</span> 표시는 시장 전체에 영향이 큰 일정 (뉴스에서 확인된 일정만)</small></h2>
  ${schedule}

  <h2 id="check">테마·개별 일정 Check<small>재료가 "살아 있는지" 계속 추적할 이슈</small></h2>
  ${checks}

  <h2 id="chart">차트상 관심주<small>매매 추천이 아니라 공부용 관찰 목록입니다.</small></h2>
  <div class="guide">📐 <b>선정 기준</b> — 상승봉: 양봉 +${SCREEN.bigCandle}% 이상, 거래대금 코스피 ${SCREEN.bigTvKospi}억·코스닥 ${SCREEN.bigTvKosdaq}억 이상 · 이평선 구간: 최근 큰 양봉(+10%) 뒤 종가가 이평선 ±${SCREEN.maBand * 100}% 안 · 급락: -15% 이하, 거래대금 100억 이상<br><span class="legend">차트 = 최근 40거래일<i style="background:var(--accent)"></i>종가<i style="background:var(--ma)"></i>20일선</span></div>
  ${CHART_GUIDE(siteUrl)}
  ${practice(scr, idx)}
  ${charts}

  <h2 id="news">섹터별 뉴스<small>제목을 누르면 원문 기사로 이동합니다.</small></h2>
  ${newsHtml}

  <h2 id="study">공부 노트</h2>
  ${studyNotes}
  ${studyPlan}
</main>
<footer class="wrap">
  <b>데이터 출처</b> 종목 등락률·거래대금: Yahoo Finance 일봉(KRX 정규장 종가) 기반 자체 계산, 거래대금은 (고가+저가+종가)/3 × 거래량 추정${fails ? ` (전체 ${total}개 중 ${fails}개 수집 실패)` : ''} · 수급·등락 종목 수: 네이버 증권 · 애프터마켓: 네이버 증권 통합 시세와 정규장 종가 비교 · 해외: Yahoo Finance · 뉴스: Google 뉴스 검색 · 해설: AI 자동 작성(입력 데이터와 뉴스 제목만 근거)<br>
  이 리포트는 공부용 시장 정리이며 특정 종목의 매수·매도 권유가 아닙니다. 투자 판단과 책임은 본인에게 있습니다.
</footer>
<script>
(function(){var k='stockMorningTheme',b=document.getElementById('theme'),s=null;try{s=localStorage.getItem(k)}catch(e){}
if(s)document.documentElement.setAttribute('data-theme',s);
function f(){b.textContent=document.documentElement.getAttribute('data-theme')==='dark'?'☀️':'🌙'}
b.addEventListener('click',function(){var n=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',n);try{localStorage.setItem(k,n)}catch(e){}f()});f()})();
</script>
</body>
</html>
`;
}

module.exports = { renderFull, dayLabel };
