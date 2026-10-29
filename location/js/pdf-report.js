// 결과 보고서(PDF): 분석 결과 한 건을 A4 문서 HTML 로 만든다. 새 숫자를 만들지 않고 이미 계산된 값 · 근거 · 설명을 모아 배치한다.
// 화면에서 미리 보고 "PDF로 저장"(브라우저 인쇄)으로 내보낸다 — 외부 PDF 라이브러리 없이 한글 글꼴을 그대로 쓰기 위해서다.
import { AGE_GROUPS } from "./area-data.js";
import { ITEMS, DISCLAIMER } from "./score-rules.js";
import { fmtPct, fmtAgePct, monthLabel } from "./metrics.js";
import { lineChart, hourBars, stackBars, heatmap, donut } from "./charts.js";
import { explainHtml } from "./explain.js";
import { CONFIG } from "./config.js";

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ageName = (k) => AGE_GROUPS.find((g) => g.key === k)?.name || k;
const pct = (x, d = 0) => `${(x * 100).toFixed(d)}%`;
const catTail = (c) => String(c || "").split(">").map((x) => x.trim()).filter(Boolean).pop() || "";
const dateKo = (d) => `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;

// 저장될 PDF 파일 이름 (인쇄 대화상자의 기본 이름이 된다)
export function reportFileName(a, now = new Date()) {
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `입지분석_${a.place.name}_${a.industry.name}_${ymd}`.replace(/[\\/:*?"<>|\s]+/g, "_");
}

// 현장 답사 체크리스트: 분석 결과에서 "직접 확인해야 할 것"을 뽑는다 (확정 표현 없이 확인 항목으로)
export function checklist(a) {
  const out = [];
  const { metrics: m, pop, comp, industry: ind, score } = a;
  if (pop && !m.noPop) {
    out.push(`영업 시간대 중 가장 붐비는 평일 ${m.openPeakHour}시 · 주말 ${m.openPeakEndHour}시 전후에 현장에서 실제 유동 인구와 대기 줄을 직접 세어 보세요 (생활인구는 추정치입니다).`);
    out.push(`주 방문 연령층(${ageName(m.topAge)} ${fmtAgePct(m.age[m.topAge])})이 실제로 찾는 메뉴 · 가격대 · 이용 시간을 주변 점포에서 조사하세요.`);
    if (m.growth <= -0.03) out.push(`최근 3개월 생활인구가 ${fmtPct(m.growth)} 변했습니다. 원인(행사 · 공사 · 계절)을 인근 상인 · 부동산에 확인하세요.`);
  } else {
    out.push("생활인구 자료가 없는 지역이므로, 시간대별 유동 인구와 고객층을 현장에서 직접 조사해야 합니다.");
  }
  const near = (comp?.items || []).slice(0, 3).map((s) => s.name).filter(Boolean);
  if (near.length) out.push(`가까운 경쟁 점포 ${near.length}곳(${near.join(", ")})을 방문해 메뉴 · 가격 · 좌석 · 대기 상황을 비교하세요.`);
  const c = score.items.find((i) => i.key === "competition")?.score;
  if (c != null && c <= 35) out.push(`반경 내 ${ind.name} 점포가 많은 편입니다. 경쟁 점포와 겹치지 않는 대표 메뉴 · 서비스를 정리해 두세요.`);
  out.push(a.rent?.score != null
    ? "점수에 넣은 매물 외에 권리금 · 인테리어 비용까지 더해 초기 비용을 확인하세요."
    : "월 임대료 · 보증금 · 권리금 · 관리비를 실제 매물로 확인하세요 (이번 점수에는 임대료가 반영되어 있지 않습니다).");
  out.push("영업 시간 · 상권 변화 계획(재개발 · 신규 시설)은 구청 · 관할 기관 자료로 확인하세요.");
  return out;
}

function scoreTable(a) {
  const rows = a.score.items.map((it) => it.score == null
    ? `<tr class="na"><td>${esc(it.name)}</td><td colspan="4">자료 없음 · 종합 점수에서 제외</td></tr>`
    : `<tr><td>${esc(it.name)}</td><td><b>${it.score}</b>점<div class="pd-bar"><i style="width:${it.score}%"></i></div></td><td>${pct(it.weight)}</td><td>${pct(it.effWeight, 1)}</td><td>+${(it.score * it.effWeight).toFixed(1)}</td></tr>`).join("");
  return `<table class="pd-tab"><tr><th>평가 항목</th><th>점수</th><th>기본 비중</th><th>적용 비중</th><th>종합 기여</th></tr>${rows}
  <tr class="sum"><td>종합 (${a.score.used}개 항목 기준)</td><td colspan="3"></td><td><b>${a.score.total ?? "-"}${a.score.total == null ? "" : "점"}</b></td></tr></table>`;
}

function chartsSection(a) {
  const pop = a.pop;
  if (!pop) return `<div class="pd-note">이 지역은 생활인구 자료가 없어 시간대 · 연령 · 추이 그래프를 만들 수 없습니다.${a.popError ? `<br><span>${esc(a.popError)}</span>` : ""}</div>`;
  const m = a.metrics;
  const parts = AGE_GROUPS.map((g, i) => ({ name: g.name, value: pop.age[g.key] || 0, i }));
  const mon = pop.monthly, labels = pop.months.map(monthLabel);
  const slots = [[6, 9], [9, 12], [12, 15], [15, 18], [18, 21], [21, 24]];
  const avg = (arr) => slots.map(([s, e]) => arr.slice(s, e).reduce((x, y) => x + y, 0) / (e - s));
  return `<div class="pd-grid">
    <div class="pd-fig"><h4>평일 시간대별 생활인구 <small>(명/시간)</small></h4>${hourBars({ values: pop.weekday })}</div>
    <div class="pd-fig"><h4>주말 시간대별 생활인구 <small>(명/시간)</small></h4>${hourBars({ values: pop.weekend })}</div>
    <div class="pd-fig"><h4>연령대별 비중 <small>(여성 ${fmtAgePct(m.female)})</small></h4>
      <div class="pd-donut"><div class="pd-dn">${donut({ parts })}</div><div class="legend" style="flex-direction:column;gap:6px;margin:0">${parts.map((p) => `<span><i class="i${p.i + 1}"></i>${p.name} <b>${fmtAgePct(p.value)}</b></span>`).join("")}</div></div></div>
    <div class="pd-fig"><h4>평일 · 주말 × 시간대</h4>${heatmap({ rowsData: [{ label: "평일", values: avg(pop.weekday) }, { label: "주말", values: avg(pop.weekend) }], cols: slots.map(([s, e]) => `${s}~${e}`) })}</div>
    ${mon.length >= 2 ? `<div class="pd-fig"><h4>월별 생활인구 추이 <small>(만 명/시간)</small></h4>${lineChart({ values: mon.map((v) => Math.round(v / 100) / 100), labels, hi: mon.length - 1, fmt: (v) => Number(v).toFixed(Number(v) >= 10 ? 1 : 2) })}</div>
    <div class="pd-fig"><h4>연령대별 월 구성</h4>${stackBars({ rows: pop.ageMonthly || [], labels: labels.map((t) => t.replace("월", "")) })}<div class="legend">${AGE_GROUPS.map((g, i) => `<span><i class="i${i + 1}"></i>${g.name}</span>`).join("")}</div></div>` : ""}
  </div>
  <table class="pd-tab compact"><tr><th>요약 지표</th><th>값</th></tr>
    <tr><td>영업 시간대 평일 평균 생활인구</td><td>${Math.round(m.sizeHours).toLocaleString("ko-KR")}명/시간</td></tr>
    <tr><td>주말 / 평일 생활인구</td><td>${m.weekendRatio.toFixed(2)}배</td></tr>
    <tr><td>평일 · 주말 피크 시간</td><td>${m.peakHour}시 · ${m.peakEndHour}시</td></tr>
    <tr><td>직전 3개월 대비 변화</td><td>${fmtPct(m.growth)} (전월 대비 ${fmtPct(m.mom)})</td></tr>
    <tr><td>주요 연령</td><td>${ageName(m.topAge)} ${fmtAgePct(m.age[m.topAge])}</td></tr></table>`;
}

function storesSection(a) {
  const c = a.comp, items = c.items.slice(0, 20);
  const rows = items.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.name)}</td><td>${esc(catTail(s.category))}</td><td>${esc(s.address || "-")}</td><td>${Math.round(s.dist) || 0}m</td></tr>`).join("");
  return `<p>반경 ${CONFIG.RADIUS_M}m 안의 ${esc(a.industry.name)} 점포는 <b>${c.count}${c.capped ? "곳 이상" : "곳"}</b>입니다 (${esc(c.source)}).${c.capped ? " 조회 한도에 닿아 실제는 더 많을 수 있습니다." : ""}</p>
  ${items.length ? `<table class="pd-tab compact stores"><tr><th>#</th><th>점포</th><th>분류</th><th>주소</th><th>거리</th></tr>${rows}</table><div class="pd-note small">가까운 순 ${items.length}곳만 표시했습니다. 점포 정보는 지도 서비스 검색 결과이며 영업 여부는 직접 확인하세요.</div>` : ""}`;
}

export function pdfReportHtml(a, now = new Date()) {
  const r = a.report, s = a.score, pop = a.pop;
  const place = a.place;
  const where = [place.name, place.guName].filter(Boolean).join(" · ");
  const li = (x) => `<li>${esc(x.text)}<div class="ev">근거 · ${esc(x.ev)}</div></li>`;
  const asOf = pop ? pop.asOf : "-";
  return `<article class="pdfdoc" id="pdfDoc">
  <header class="pd-head">
    <div class="pd-brand">📍 우리 동네 AI 입지 분석</div>
    <h1>입지 분석 결과 보고서</h1>
    <div class="pd-meta"><div><span>대상 지역</span><b>${esc(where)}${place.isCurrent ? " (현재 위치 기준)" : ""}</b></div><div><span>업종</span><b>${esc(a.industry.icon)} ${esc(a.industry.name)}</b></div>
      <div><span>분석일</span><b>${dateKo(now)}</b></div><div><span>자료 기준일</span><b>${esc(asOf)}</b></div></div>
  </header>

  <section class="pd-sec pd-hero">
    <div class="pd-score"><div class="n">${s.total ?? "-"}<small>${s.total == null ? "" : "점"}</small></div>${s.grade ? `<div class="g ${s.grade.cls}">${s.grade.icon} ${esc(s.grade.name)}</div>` : `<div class="g warn">점수 없음</div>`}</div>
    <div class="pd-sumtxt"><h2>한눈에 보기</h2><p class="lead">${esc(r.summary)}</p><p class="cap">${s.used}개 항목 기준${s.used < 5 ? "(자료가 없는 항목은 제외)" : ""} · 자료 기준일 ${esc(asOf)}. 자세한 근거는 아래 장에서 확인하세요.</p></div>
  </section>

  <section class="pd-sec"><h2>1. 항목별 점수</h2>${scoreTable(a)}
    <div class="pd-note small">등급 기준: 85점 이상 추천 · 70~84 조건부 추천 · 55~69 신중 검토 · 55 미만 재검토. 자료가 없는 항목은 제외하고 나머지 비중을 다시 나눠 계산합니다.</div></section>

  <section class="pd-sec pd-break"><h2>2. 항목별 산출 근거</h2>
    ${ITEMS.map((it) => `<div class="pd-item"><h3>${esc(it.name)}${s.items.find((i) => i.key === it.key)?.score != null ? ` <em>${s.items.find((i) => i.key === it.key).score}점</em>` : " <em class=\"na\">자료 없음</em>"}</h3><div class="detail pd-detail">${explainHtml(a, it.key)}</div></div>`).join("")}
  </section>

  <section class="pd-sec pd-break"><h2>3. AI 컨설턴트 의견</h2>
    <div class="pd-tone good"><h3>👍 강점</h3><ul>${r.strengths.map(li).join("")}</ul></div>
    <div class="pd-tone bad"><h3>⚠ 위험 요소</h3><ul>${r.risks.map(li).join("")}</ul></div>
    <div class="pd-tone tip"><h3>💡 추천 전략</h3><ul>${r.strategies.map(li).join("")}</ul></div>
    <div class="pd-tone sum"><h3>🎯 종합 의견</h3><p>${esc(r.overall)}</p></div></section>

  <section class="pd-sec pd-break"><h2>4. 상권 데이터</h2>${chartsSection(a)}</section>

  <section class="pd-sec pd-break"><h2>5. 경쟁 점포 현황</h2>${storesSection(a)}</section>

  <section class="pd-sec pd-break"><h2>6. 현장 답사 체크리스트</h2>
    <ul class="pd-check">${checklist(a).map((t) => `<li>${esc(t)}</li>`).join("")}</ul></section>

  <section class="pd-sec"><h2>7. 분석 방법 · 한계 · 출처</h2>
    <h3>분석 방법</h3>
    <ul class="pd-plain"><li>입지 적합도는 목표 고객 일치 · 유동인구 규모 · 경쟁 강도 · 임대료 부담 · 성장 가능성 5개 항목의 가중합(0~100점)입니다.</li>
      <li>고객 일치 · 규모 · 성장성은 ${pop && pop.level === "dong" ? "서울 행정동 전체" : "비교 대상"} 분포에서의 위치(백분위)로, 경쟁 강도는 반경 내 동종 점포 수를 구간표로 환산합니다.</li>
      <li>같은 입력이면 항상 같은 점수가 나오며, AI 의견의 문장은 계산된 지표에 규칙 템플릿을 적용해 만듭니다 (숫자를 새로 만들지 않습니다).</li></ul>
    <h3>분석의 한계</h3>
    <ul class="pd-plain">${(r.limits.length ? r.limits : ["특별한 한계 항목은 없지만, 임대료 · 현장 상황은 별도로 확인하세요."]).map((l) => `<li>${esc(l)}</li>`).join("")}
      <li>생활인구는 방문객 · 구매자 · 매출과 다른 개념입니다.</li><li>항목 비중 · 업종별 목표 고객 · 경쟁 구간표는 초안이며 전문가 검수 전입니다.</li></ul>
    <h3>자료 출처</h3>
    <ul class="pd-plain"><li>생활인구: ${esc(pop?.source || "자료 없음")}${pop ? ` · ${pop.level === "gu" ? "자치구 단위" : "행정동 단위"} · 기준일 ${esc(pop.asOf)}` : ""}</li>
      <li>경쟁 점포 · 지도: ${esc(a.comp.source)} (Kakao 지도)</li></ul>
    <div class="pd-disc">${esc(DISCLAIMER)}</div></section>
  <footer class="pd-foot">우리 동네 AI 입지 분석 · ${dateKo(now)} 생성 · location-app-sykim.web.app</footer>
</article>`;
}
