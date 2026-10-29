// 점수 항목별 "산출 근거" 설명: 분석 결과(a)에서 숫자를 꺼내 쉬운 문장과 작은 표로 풀어 쓴다. 새 숫자를 만들지 않는다.
// 반환은 HTML 문자열이고, 지도 화면의 항목을 눌렀을 때 펼쳐진다. (ui.js 에서 사용)
import { AGE_GROUPS } from "./area-data.js";
import { monthLabel } from "./metrics.js";
import { RENT_RULES } from "./score-rules.js";

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pct = (x, d = 0) => `${(x * 100).toFixed(d)}%`;
const num = (n) => Math.round(n).toLocaleString("ko-KR");
const stat = (arr) => (arr && arr.length ? { min: arr[0], mid: arr[Math.floor(arr.length / 2)], max: arr[arr.length - 1], n: arr.length } : null);
const top = (score) => `상위 약 ${Math.max(1, 100 - score)}%`;
const unitName = (b) => (b?.level === "dong" ? "서울 행정동" : "서울 자치구");

// 이 항목이 종합 점수에 얼마나 기여했는지 (모든 항목 공통 맨 아래 줄)
function contribution(it) {
  if (it.score == null) return `<div class="dnote">이 항목은 자료가 없어 종합 점수에서 <b>제외</b>되었고, 남은 항목의 비중이 다시 나뉘었어요.</div>`;
  return `<div class="dcalc">기본 비중 <b>${pct(it.weight)}</b> → 이번 적용 <b>${pct(it.effWeight, 1)}</b> · 종합에 <b>+${(it.score * it.effWeight).toFixed(1)}점</b> (${it.score}점 × ${pct(it.effWeight, 1)})</div>`;
}

function ranking(label, value, score, base, fmt) {
  const s = stat(base?.[label]);
  if (!s || score == null) return "";
  return `<div class="dnote">비교 대상 <b>${unitName(base)} ${s.n}곳</b> 중 <b>${top(score)}</b> 수준이에요 (${score}점).<br>
  <span class="cap">분포: 가장 낮은 곳 ${fmt(s.min)} · 중간 ${fmt(s.mid)} · 가장 높은 곳 ${fmt(s.max)} / 이 지역 ${fmt(value)}</span></div>`;
}

function customer(a, it) {
  const m = a.metrics, ind = a.industry;
  if (!a.pop) return `<div class="dnote">이 지역은 생활인구 자료가 없어 고객 구성을 알 수 없어요.</div>${contribution(it)}`;
  const rows = AGE_GROUPS.map((g) => {
    const t = ind.target[g.key] || 0, r = a.pop.age[g.key] || 0;
    return `<div class="drow"><span>${g.name}</span>
      <div class="dbar"><i class="t" style="width:${Math.round(t * 100)}%"></i><i class="r" style="width:${Math.round(r * 100)}%"></i></div>
      <span class="dnum">${pct(t)} · ${pct(r)}</span></div>`;
  }).join("");
  const level = it.score >= 75 ? "잘 맞는 편" : it.score <= 35 ? "다소 어긋나는 편" : "보통";
  return `<p class="dtxt">${esc(ind.name)}의 <b>주 고객층 구성(목표)</b>과 이 지역 <b>생활인구의 연령 구성</b>이 얼마나 겹치는지 봅니다.</p>
  <div class="dleg"><i class="t"></i>목표 고객 비중 <i class="r"></i>이 지역 비중</div>${rows}
  <div class="dcalc">일치도 = 연령별 (목표 × 지역 비중) 합 = <b>${(m.customerMatch * 100).toFixed(1)}%</b> → ${level}</div>
  ${ranking("customer", m.customerMatch, it.score, a.baseline, (v) => pct(v, 1))}
  <div class="dnote cap">${ind.custom ? "직접 입력한 업종이라 일반적인 고객 구성(전 연령)을 기준으로 계산했어요." : "목표 고객 비중은 업종별 초안 값이에요 (검수 전)."}${a.baseline && a.baseline.level !== a.pop.level ? " 비교 기준이 자치구 표본이라 눈금이 다를 수 있어요." : ""}</div>
  ${contribution(it)}`;
}

function size(a, it) {
  const m = a.metrics, ind = a.industry;
  if (!a.pop) return `<div class="dnote">이 지역은 생활인구 자료가 없어 유동인구 규모를 알 수 없어요.</div>${contribution(it)}`;
  const hrs = ind.hours;
  const span = `${hrs[0]}시~${hrs[hrs.length - 1]}시`;
  if (it.score == null) return `<p class="dtxt">영업 시간대(${span})의 평균 생활인구는 <b>${num(m.sizeHours)}명/시간</b>이에요.</p>
  <div class="dnote">다만 비교할 <b>기준 분포의 단위</b>(자치구/행정동)가 이 자료와 달라 점수에는 넣지 않았어요.</div>${contribution(it)}`;
  return `<p class="dtxt">${esc(ind.name)} 영업 시간대(<b>${span}</b>) 평일 평균 생활인구를 봅니다.</p>
  <div class="dcalc">평균 <b>${num(m.sizeHours)}명/시간</b></div>
  ${ranking("size", m.sizeHours, it.score, a.baseline, (v) => `${num(v)}명`)}
  <div class="dnote cap">생활인구는 그 시간에 그 지역에 머무른 추정 인구예요. 방문객 · 구매자 · 매출과는 다릅니다.</div>
  ${contribution(it)}`;
}

function competition(a, it) {
  const ind = a.industry, c = a.comp, count = c.count;
  let prev = -1;
  const rows = ind.bands.map(([max, sc]) => {
    const lo = prev + 1;
    prev = max;
    const label = max === Infinity ? `${lo}곳 이상` : `${lo}~${max}곳`;
    const on = count >= lo && count <= max;
    return `<div class="drow band ${on ? "on" : ""}"><span>${label}</span><div class="dbar"><i class="${on ? "r" : "t"}" style="width:${sc}%"></i></div><span class="dnum">${sc}점</span></div>`;
  }).join("");
  return `<p class="dtxt">반경 <b>500m 안의 동종 점포(${esc(ind.name)}) 수</b>가 적을수록 높은 점수예요. 구간표로 점수를 정합니다.</p>
  <div class="dcalc">현재 <b>${count}${c.capped ? "곳 이상" : "곳"}</b> → <b>${it.score}점</b></div>${rows}
  <div class="dnote cap">${c.live ? "Kakao 지도 검색 결과예요." : "예시 점포 값이에요 (Kakao 키 설정 전)."} ${c.capped ? "조회 한도에 닿아 실제 점포는 더 많을 수 있어요. 그만큼 실제 점수는 더 낮을 수 있어요." : ""} 구간별 점수는 초안이에요 (검수 전).</div>
  ${contribution(it)}`;
}

function rent(a, it) {
  const r = a.rent;
  const rows = RENT_RULES.bands.map(([max, sc], i) => {
    const lo = i ? RENT_RULES.bands[i - 1][0] : 0;
    const label = max === Infinity ? `${Math.round(lo * 100)}% 초과` : `${Math.round(max * 100)}% 이하`;
    const on = r?.burden != null && r.burden > lo && r.burden <= max;
    return `<div class="drow band ${on ? "on" : ""}"><span>${label}</span><div class="dbar"><i class="${on ? "r" : "t"}" style="width:${sc}%"></i></div><span class="dnum">${sc}점</span></div>`;
  }).join("");
  if (!r) return `<p class="dtxt">알아본 매물의 <b>월 임대료가 예상 월매출의 몇 %인지</b>로 점수를 매겨요. 낮을수록 높은 점수예요.</p>
  <div class="dnote">아직 매물 정보가 없어 점수에서 제외했어요. 아래 <b>알아본 매물 월세 넣기</b>에 보증금 · 월세 · 예상 월매출을 넣으면 바로 반영돼요. 나머지 항목의 비중은 합 100%가 되도록 다시 나뉘어 있어요.</div>
  ${contribution(it)}`;
  const w = (n) => n.toLocaleString("ko-KR");
  const calc = `월세 ${w(r.monthly)}만원${r.fee ? ` + 관리비 ${w(r.fee)}만원` : ""}${r.deposit ? ` + 보증금 ${w(r.deposit)}만원 × 12% ÷ 12` : ""} = 환산 월 <b>${w(r.total)}만원</b>`;
  if (r.burden == null) return `<p class="dtxt">${calc}</p>
  <div class="dnote">예상 월매출을 넣지 않아 점수에서는 제외했어요. 매출을 넣으면 <b>매출 대비 임대료 비율</b>로 점수를 매겨요.</div>${contribution(it)}`;
  return `<p class="dtxt">월 임대료가 <b>예상 월매출의 몇 %인지</b>로 점수를 매겨요. 통상 10% 안팎이면 무리가 적은 편이에요.</p>
  <div class="dcalc">${calc}<br>÷ 예상 월매출 ${w(r.sales)}만원 → <b>${Math.round(r.burden * 100)}%</b> → <b>${it.score}점</b></div>${rows}
  <div class="dnote cap">보증금은 연 12%로 월세에 환산했어요 (서울시 우리마을가게 방식). 직접 넣은 값이라 이 기기에만 저장돼요. 구간별 점수는 초안이에요 (검수 전).</div>
  ${contribution(it)}`;
}

function growth(a, it) {
  const m = a.metrics, pop = a.pop;
  if (!pop) return `<div class="dnote">이 지역은 생활인구 자료가 없어 추이를 알 수 없어요.</div>${contribution(it)}`;
  const months = pop.months;
  const recent = months.slice(-3).map(monthLabel).join("·");
  const before = months.slice(-6, -3).map(monthLabel).join("·") || "-";
  return `<p class="dtxt"><b>최근 3개월</b> 월평균 생활인구가 <b>직전 3개월</b>보다 얼마나 늘었는지 봅니다.</p>
  <div class="dcalc">최근 ${recent}월 ÷ 직전 ${before}월 → <b>${m.growth >= 0 ? "+" : ""}${(m.growth * 100).toFixed(1)}%</b></div>
  ${ranking("growth", m.growth, it.score, a.baseline, (v) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`)}
  <div class="dnote cap">자료 기간이 ${months.length}개월이라 짧아요. 마지막 달은 일부 날짜만 포함될 수 있고, 계절 영향도 섞여 있어요. 기간이 쌓이면 더 정확해집니다.</div>
  ${contribution(it)}`;
}

function total(a) {
  const s = a.score;
  if (s.total == null) return `<div class="dnote">종합 점수는 <b>2개 이상 항목</b>의 점수가 있어야 계산해요. 지금은 ${s.used}개뿐이라 점수를 내지 않았어요.</div>`;
  const rows = s.items.map((it) => it.score == null
    ? `<tr class="na"><td>${it.short}</td><td colspan="3">자료 없음 · 제외</td></tr>`
    : `<tr><td>${it.short}</td><td>${it.score}점</td><td>${pct(it.effWeight, 1)}</td><td>+${(it.score * it.effWeight).toFixed(1)}</td></tr>`).join("");
  return `<p class="dtxt">종합 점수는 <b>항목 점수 × 적용 비중</b>을 모두 더한 값이에요. 자료가 없는 항목은 빼고 나머지 비중을 다시 나눕니다.</p>
  <table class="dtab"><tr><th>항목</th><th>점수</th><th>적용 비중</th><th>기여</th></tr>${rows}
  <tr class="sum"><td>종합</td><td colspan="2"></td><td><b>${s.total}점</b></td></tr></table>
  <div class="dnote cap">등급: 85점 이상 추천 · 70~84 조건부 추천 · 55~69 신중 검토 · 55 미만 재검토. 항목 비중과 구간은 초안이며 상담사 검수로 보정할 예정이에요.</div>`;
}

const BUILDERS = { customer, size, competition, rent, growth };

// key: "customer" | "size" | "competition" | "rent" | "growth" | "total"
export function explainHtml(a, key) {
  if (key === "total") return total(a);
  const it = a.score.items.find((i) => i.key === key);
  return it ? BUILDERS[key](a, it) : "";
}
