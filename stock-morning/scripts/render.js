// 메일 본문용 요약 HTML. 메일 앱(Gmail 등)은 <style>·CSS 변수·SVG·JS를 대부분 무시하므로
// 모든 스타일을 인라인으로 넣고 600px 단일 컬럼으로 그린다.
// 전체 리포트(차트 포함)는 첨부 파일과 웹 링크로 함께 보낸다.

const C = {
  bg: '#f3f4f7', card: '#ffffff', text: '#1d2230', sub: '#667085', line: '#e6e8ee',
  accent: '#3b5bdb', up: '#e03131', down: '#1c7ed6', soft: '#eef2ff', warn: '#fff4e6',
};

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function pct(v) {
  if (typeof v !== 'number') return `<span style="color:${C.sub}">-</span>`;
  const color = v > 0 ? C.up : v < 0 ? C.down : C.sub;
  const sign = v > 0 ? '▲' : v < 0 ? '▼' : '';
  return `<span style="color:${color};font-weight:700">${sign} ${Math.abs(v).toFixed(2)}%</span>`;
}

const card = (inner, extra = '') =>
  `<tr><td style="padding:0 16px 14px"><div style="background:${C.card};border:1px solid ${C.line};border-radius:14px;padding:18px 18px 16px;${extra}">${inner}</div></td></tr>`;
const h2 = (t) => `<div style="font-size:17px;font-weight:800;color:${C.text};margin:0 0 10px">${t}</div>`;
const button = (href, label) => `<a href="${esc(href)}" style="display:inline-block;background:${C.accent};color:#fff;text-decoration:none;font-weight:700;font-size:15px;border-radius:10px;padding:12px 18px">${label}</a>`;

function renderEmail({ date, sendDate, idx, globals, draft, study, siteUrl, fullUrl, rows, recur, headlines = [], previousReport }) {
  const hasAi = draft && !draft.error;
  const H = {};
  for (const h of headlines) H[h.id] = h;
  const BADGE = { direct: ['직접 언급', '#2f9e44'], inferred: ['추정', '#e67700'], unknown: ['재료 불명', '#868e96'], continued: ['이어짐', '#2f9e44'], weakened: ['약해짐', '#e67700'], resolved: ['해소', '#3b5bdb'] };
  const badge = (c) => (BADGE[c] ? `<span style="display:inline-block;font-size:11px;font-weight:700;color:${BADGE[c][1]};border:1px solid ${BADGE[c][1]};border-radius:999px;padding:0 6px;margin-left:4px;white-space:nowrap">${BADGE[c][0]}</span>` : '');
  const refs = (ids) => (ids || []).map((i) => H[i]).filter(Boolean).slice(0, 3)
    .map((h) => `<a href="${esc(h.link)}" style="color:${C.accent};text-decoration:none;font-size:12px;margin-left:3px">[${h.id}]</a>`).join('');

  // 맨 위 핵심 요약: 오늘 꼭 알아야 할 3가지 + 여러 날 반복되는 재료
  const points = hasAi && draft.key_points && draft.key_points.length ? draft.key_points : [];
  const pill = (t) => `<span style="display:inline-block;background:#fff;border:1px solid ${C.line};border-radius:999px;padding:2px 10px;margin:0 5px 6px 0;font-size:13px;color:${C.text}">${t}</span>`;
  const recurTags = recur && recur.tags.length ? `<div style="margin:12px 0 0;font-size:13px;color:${C.sub};font-weight:700">🔁 최근 ${recur.days}일 반복 재료</div><div style="margin-top:6px">${recur.tags.slice(0, 6).map((t) => pill(`#${esc(t.tag)} <b style="color:${C.accent}">${t.count}일</b>`)).join('')}</div>` : '';
  const recurStocks = recur && recur.stocks.length ? `<div style="margin:6px 0 0;font-size:13px;color:${C.sub};font-weight:700">계속 등장하는 종목</div><div style="margin-top:6px">${recur.stocks.slice(0, 6).map((s) => pill(`${esc(s.name)} <b style="color:${C.accent}">${s.count}일</b>${s.since != null ? ` <span style="color:${C.sub}">${esc(s.first.slice(5))} 이후</span> ${pct(s.since)}` : ''}`)).join('')}</div>` : '';
  const trend = hasAi && draft.trend_summary ? `<p style="margin:12px 0 0;font-size:14.5px;line-height:1.65;color:${C.text}">${esc(draft.trend_summary)}</p>` : '';
  const keyCard = points.length || recurTags ? `<tr><td style="padding:0 16px 14px"><div style="background:${C.soft};border:2px solid ${C.accent};border-radius:14px;padding:18px">
    <div style="font-size:17px;font-weight:800;color:${C.text};margin:0 0 8px">📌 오늘 꼭 알아야 할 3가지</div>
    <ol style="margin:0;padding-left:22px">${points.map((p) => `<li style="font-size:16px;font-weight:700;line-height:1.5;margin:5px 0;color:${C.text}">${esc(p)}</li>`).join('')}</ol>
    ${trend}${recurTags}${recurStocks}
  </div></td></tr>` : '';
  const by = {};
  for (const r of rows) by[r.name] = r;

  const line = (name, close, chg) => `
    <tr>
      <td style="padding:7px 0;border-bottom:1px solid ${C.line};font-size:14px;color:${C.text}">${esc(name)}</td>
      <td style="padding:7px 0;border-bottom:1px solid ${C.line};font-size:14px;color:${C.text};text-align:right">${esc(close)}</td>
      <td style="padding:7px 0 7px 10px;border-bottom:1px solid ${C.line};font-size:14px;text-align:right;white-space:nowrap">${chg}</td>
    </tr>`;
  const g = (sym) => globals.find((x) => x.symbol === sym);
  const gl = [g('^IXIC'), g('^SOX'), g('KRW=X')].filter(Boolean);
  const indexRows = line('코스피', idx.kospi.close.toLocaleString('ko-KR', { minimumFractionDigits: 2 }), pct(idx.kospi.chg)) +
    line('코스닥', idx.kosdaq.close.toLocaleString('ko-KR', { minimumFractionDigits: 2 }), pct(idx.kosdaq.chg)) +
    gl.map((x) => line(x.name, x.close.toLocaleString('ko-KR', { maximumFractionDigits: 2 }), pct(x.chg))).join('');

  const f = idx.kospi.flow;
  const flow = f ? `<p style="margin:10px 0 0;font-size:14px;color:${C.sub}">코스피 수급(억원) 외국인 ${f.foreign.toLocaleString('ko-KR')} · 기관 ${f.institution.toLocaleString('ko-KR')} · 개인 ${f.personal.toLocaleString('ko-KR')}</p>` : '';
  const summary = hasAi
    ? `<p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${C.text}">${esc(draft.market_summary)}</p>`
    : `<p style="margin:12px 0 0;font-size:14px;color:${C.sub}">AI 해설을 만들지 못해 데이터만 보내 드립니다. (${esc(draft && draft.error)})</p>`;

  const issues = hasAi ? card(`${h2('📌 TODAY ISSUE')}${draft.issues.map((i) => `
    <div style="margin:0 0 12px">
      <div style="font-size:15px;font-weight:800;color:${C.accent}">${i.tags.map((t) => '#' + esc(String(t).replace(/^#/, ''))).join(' ')}</div>
      <div style="font-size:15px;line-height:1.65;color:${C.text}">${esc(i.body)}${refs(i.ids)}</div>
    </div>`).join('')}`) : '';
  const followup = hasAi && draft.followup && draft.followup.length ? card(`${h2('🔎 어제 확인할 것 → 오늘 결과')}${draft.followup.map((f) => `
    <div style="margin:0 0 10px;font-size:14.5px;line-height:1.6;color:${C.text}"><b>${esc(f.item)}</b>${badge(f.status)}<br>${esc(f.result)}${refs(f.ids)}</div>`).join('')}`) : '';

  const stockLine = (n) => (by[n] ? `<span style="white-space:nowrap;margin-right:10px;font-size:14px"><b>${esc(n)}</b> ${pct(by[n].d0.r)}</span> ` : '');
  const sectors = hasAi ? draft.sectors.map((s) => card(`
    <div style="font-size:16px;font-weight:800;color:${C.text};margin:0 0 6px">${esc(s.title)}</div>
    <div style="margin:0 0 6px">${s.hashtags.map((t) => `<span style="display:inline-block;background:${C.soft};color:${C.accent};font-size:13px;font-weight:600;border-radius:999px;padding:2px 9px;margin:0 5px 5px 0">#${esc(String(t).replace(/^#/, ''))}</span>`).join('')}</div>
    ${s.items.map((it) => `<div style="margin:8px 0 0">${it.stocks.map(stockLine).join('')}<div style="font-size:14.5px;line-height:1.6;color:${C.text};margin-top:3px">${esc(it.text)}${badge(it.confidence)}${refs(it.ids)}</div></div>`).join('')}
  `)).join('') : '';

  const s = study.lesson;
  const studyCard = card(`
    <div style="font-size:13px;font-weight:700;color:${C.accent};margin:0 0 4px">📚 주식 공부 30일 전략 · ${study.round > 1 ? study.round + '회독 ' : ''}${s.day}일차 / 30</div>
    <div style="font-size:13px;color:${C.sub};margin:0 0 8px">${esc(study.week.week)}주차 — ${esc(study.week.theme)}</div>
    <div style="font-size:19px;font-weight:800;color:${C.text};margin:0 0 4px">${esc(s.title)}</div>
    <div style="font-size:14px;color:${C.sub};margin:0 0 10px">목표: ${esc(s.goal)}</div>
    <ul style="margin:0 0 12px;padding-left:18px;font-size:15px;line-height:1.7;color:${C.text}">${s.learn.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
    <div style="background:${C.warn};border-radius:10px;padding:12px 14px;font-size:15px;line-height:1.6;color:${C.text}"><b>✍️ 오늘의 실습</b><br>${esc(s.practice)}</div>
    <div style="margin:12px 0 0;font-size:14px"><a href="${esc(siteUrl)}#study" style="color:${C.accent};text-decoration:none;font-weight:700">30일 전체 계획 보기 →</a></div>
  `, `border:2px solid ${C.accent}`);

  const title = hasAi ? draft.headline : '전일 시장 정리';
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(date)} 모닝 마켓 브리핑</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
  <tr><td style="padding:22px 16px 14px">
    <div style="font-size:13px;color:${C.sub}">${esc(sendDate)} 아침 · ${esc(date)} 장 기준</div>
    <div style="font-size:24px;font-weight:800;color:${C.text};margin:4px 0 0">☀️ ${esc(title)}</div>
    <div style="margin:14px 0 0">${button(fullUrl, '📊 전체 리포트 보기 (차트·일정·뉴스)')}</div>
  </td></tr>
  ${keyCard}
  ${card(`${h2('📈 시장 한눈에')}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${indexRows}</table>${flow}${summary}`)}
  ${issues}
  ${followup}
  ${studyCard}
  ${sectors ? `<tr><td style="padding:6px 16px 10px"><div style="font-size:18px;font-weight:800;color:${C.text}">🗂️ 섹터별 정리</div></td></tr>${sectors}` : ''}
  <tr><td style="padding:4px 16px 18px" align="center">${button(fullUrl, '전체 리포트에서 주도 종목·애프터마켓·주간 일정·차트 보기')}</td></tr>
  <tr><td style="padding:4px 20px 28px;font-size:12px;line-height:1.6;color:${C.sub}">
    전체 리포트는 첨부한 HTML 파일로도 열어 볼 수 있습니다.<br>
    시세: Yahoo Finance(KRX 정규장 종가) · 수급: 네이버 증권 · 뉴스: Google 뉴스 · 해설: AI 자동 작성<br>
    이 메일은 공부용 정보 정리이며 투자 권유가 아닙니다. 투자 판단과 책임은 본인에게 있습니다.<br>
    <a href="${esc(siteUrl)}" style="color:${C.sub}">지난 보고서 모아보기</a>
  </td></tr>
</table></td></tr></table>
</body></html>
`;
}

module.exports = { renderEmail };
