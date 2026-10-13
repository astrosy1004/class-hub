// AI 컨설턴트 리포트: 계산된 지표와 점수에서 규칙 템플릿으로 문장을 만든다 (숫자는 만들어 내지 않음).
// 문장마다 근거(ev)를 붙인다. 2단계에서 LLM 다듬기를 붙이더라도 이 구조(지표 → 문장)를 입력으로 쓴다.
import { AGE_GROUPS } from "./area-data.js";
import { REPORT_RULES as R, DISCLAIMER } from "./score-rules.js";
import { fmtPct, fmtAgePct } from "./metrics.js";

const ageName = (k) => AGE_GROUPS.find((g) => g.key === k).name;
const sc = (score, key) => score.items.find((i) => i.key === key)?.score;

// 생활인구 자료가 없는 동네: 경쟁 점포 정보만으로 만든 짧은 리포트 (점수 · 고객층 분석은 하지 않는다)
function buildReportNoPop(a) {
  const { score, industry: ind, comp, place, popError } = a;
  const strengths = [], risks = [], strategies = [];
  const c = score.items.find((i) => i.key === "competition")?.score;
  const cnt = comp ? `${comp.count}${comp.capped ? "곳 이상" : "곳"}` : "";
  if (comp && c != null && c >= R.strongScore) strengths.push({ text: "반경 내 동종 점포가 많지 않아 경쟁 부담이 낮은 편입니다.", ev: `반경 500m ${ind.name} ${cnt}` });
  if (comp && c != null && c <= R.weakScore) {
    risks.push({ text: "반경 내 동종 점포가 많아 경쟁이 치열합니다.", ev: `반경 500m ${ind.name} ${cnt}` });
    strategies.push({ text: "경쟁 점포와 겹치지 않는 대표 메뉴 · 서비스로 차별화하세요.", ev: "경쟁 강도" });
  }
  if (!strengths.length) strengths.push({ text: "생활인구 자료가 없어 강점을 판단할 지표가 부족합니다.", ev: "생활인구 자료 없음" });
  if (!risks.length) risks.push({ text: "경쟁 점포 외의 위험 요소는 자료가 없어 판단하지 못했습니다.", ev: "생활인구 자료 없음" });
  strategies.push({ text: "현장 답사로 시간대별 유동 인구와 주요 고객층을 직접 확인하세요.", ev: "자료 부족" });
  const limits = [popError || "이 지역의 생활인구 자료가 없습니다.", "자료가 부족해 입지 적합도 점수는 계산하지 않았습니다."];
  if (comp && !comp.live) limits.push("경쟁 점포는 예시 값입니다 (Kakao 키 설정 전).");
  if (comp && comp.capped) limits.push("경쟁 점포 수가 조회 한도에 닿아 실제는 더 많을 수 있습니다.");
  return {
    summary: "생활인구 자료가 없어 지도와 경쟁 점포 정보만 보여드려요.",
    strengths, risks, strategies,
    overall: `${place.name} ${ind.name}은(는) 생활인구 자료가 없어 입지 적합도 점수를 내지 못했습니다. ${DISCLAIMER}`,
    limits, asOf: "", disclaimer: DISCLAIMER,
  };
}

export function buildReport(a) {
  if (!a.pop) return buildReportNoPop(a);
  const { metrics: m, score, industry: ind, pop, comp } = a;
  const asOf = pop.asOf;
  const strengths = [];
  const risks = [];
  const strategies = [];
  // 전략의 중심 연령층: 이 업종의 목표 고객 비중 × 지역 비중이 가장 큰 층 (가장 많은 층과 다를 수 있음)
  const focus = AGE_GROUPS.map((g) => g.key).sort((x, y) => m.age[y] * ind.target[y] - m.age[x] * ind.target[x])[0];
  const unit = pop.level === "gu" ? "자치구" : "행정동";

  const cust = sc(score, "customer");
  if (cust != null && cust >= R.strongScore) {
    strengths.push({ text: `${ind.name}의 목표 고객층과 이 지역 생활인구 구성이 잘 맞습니다.`, ev: `고객 일치 ${cust}점 · ${ageName(m.topAge)} ${fmtAgePct(m.age[m.topAge])}` });
  } else if (cust != null && cust <= R.weakScore) {
    risks.push({ text: `${ind.name}의 목표 고객층과 지역 생활인구 구성이 다소 어긋납니다.`, ev: `고객 일치 ${cust}점` });
  }
  if (m.share2030 >= 0.45) {
    strengths.push({ text: "20~30대 생활인구 비중이 높아 트렌드에 민감한 수요를 기대할 수 있습니다.", ev: `20~30대 ${fmtAgePct(m.share2030)}` });
  }
  const size = sc(score, "size");
  if (size != null && size >= R.strongScore) strengths.push({ text: "영업 시간대 생활인구 규모가 큰 편입니다.", ev: `유동인구 ${size}점 (${unit} 기준 분포)` });
  if (size != null && size <= R.weakScore) risks.push({ text: "영업 시간대 생활인구 규모가 작은 편입니다.", ev: `유동인구 ${size}점` });

  if (m.growth >= R.growthUp) strengths.push({ text: "최근 3개월 생활인구가 직전 3개월보다 늘었습니다.", ev: `직전 3개월 대비 ${fmtPct(m.growth)}` });
  if (m.growth <= R.growthDown) risks.push({ text: "최근 3개월 생활인구가 직전 3개월보다 줄었습니다.", ev: `직전 3개월 대비 ${fmtPct(m.growth)}` });

  if (comp) {
    const c = sc(score, "competition");
    const cnt = `${comp.count}${comp.capped ? "곳 이상" : "곳"}`;
    if (c != null && c <= R.weakScore) risks.push({ text: "반경 내 동종 점포가 많아 경쟁이 치열합니다.", ev: `반경 500m ${ind.name} ${cnt}` });
    else if (c != null && c >= R.strongScore) strengths.push({ text: "반경 내 동종 점포가 많지 않아 경쟁 부담이 낮은 편입니다.", ev: `반경 500m ${ind.name} ${cnt}` });
  }
  if (m.weekendRatio >= R.weekendHeavy) risks.push({ text: "주말에 생활인구가 몰려 평일 매출 편차가 클 수 있습니다.", ev: `주말/평일 ${m.weekendRatio.toFixed(2)}배` });
  else if (m.weekendRatio <= R.weekdayHeavy) risks.push({ text: "평일 생활인구가 주말보다 많아 주말 수요가 약할 수 있습니다.", ev: `주말/평일 ${m.weekendRatio.toFixed(2)}배` });

  // 전략: 업종 × 가장 큰 연령층
  const tip = ind.tips[focus];
  if (tip) strategies.push({ text: `${ageName(focus)} 방문층을 고려해 ${tip}을(를) 검토하세요.`, ev: `${ageName(focus)} ${fmtAgePct(m.age[focus])}` });
  if (m.weekendRatio >= R.weekendHeavy) strategies.push({ text: "주말 방문객을 위한 테이크아웃 · 예약 프로모션을 검토하세요.", ev: `주말/평일 ${m.weekendRatio.toFixed(2)}배` });
  if (risks.some((r) => r.text.includes("경쟁"))) strategies.push({ text: "경쟁 점포와 겹치지 않는 대표 메뉴 · 서비스로 차별화하세요.", ev: "경쟁 강도" });
  strategies.push({ text: `생활인구가 가장 많은 ${m.peakHour}시 전후에 인력 · 재고를 맞추는 운영을 검토하세요.`, ev: `평일 피크 ${m.peakHour}시` });

  if (!strengths.length) strengths.push({ text: "뚜렷하게 두드러진 강점 지표는 아직 확인되지 않았습니다.", ev: "기준일 " + asOf });
  if (!risks.length) risks.push({ text: "뚜렷하게 두드러진 위험 지표는 확인되지 않았지만, 임대료 · 현장 상황은 별도로 확인하세요.", ev: "기준일 " + asOf });

  const summary = score.total == null ? "점수를 계산할 자료가 부족합니다."
    : strengths.length >= risks.length
      ? `강점 지표가 더 많은 지역입니다. ${ageName(focus)} 중심 전략을 먼저 검토해 보세요.`
      : "위험 지표를 먼저 점검한 뒤 입지를 판단하는 것이 좋습니다.";
  const overall = `${a.place.name} ${ind.name}은(는) ${score.grade ? `'${score.grade.name}' 등급(${score.total}점)` : "점수 계산 불가"}입니다. ${score.used}개 항목 기준이며${score.used < 5 ? "(자료가 없는 항목은 제외)" : ""}, ${DISCLAIMER}`;

  const limits = [];
  if (a.baseline && a.baseline.level !== pop.level) limits.push("점수의 비교 기준이 자치구 표본 분포라 동 단위 값과 눈금이 다를 수 있습니다.");
  if (pop.level === "gu") limits.push("생활인구는 동이 아니라 자치구 단위 표본입니다.");
  if (!sc(score, "rent") && sc(score, "rent") !== 0) limits.push("임대료 자료가 없어 점수에서 제외했습니다.");
  if (comp && !comp.live) limits.push("경쟁 점포는 예시 값입니다 (Kakao 키 설정 전).");
  if (comp && comp.capped) limits.push("경쟁 점포 수가 조회 한도(45곳)에 닿아 실제는 더 많을 수 있습니다.");

  return { summary, strengths, risks, strategies, overall, limits, asOf, disclaimer: DISCLAIMER };
}

// 리포트 전체 문장을 한 줄씩 (금지어 검사 · PDF용)
export function reportLines(r) {
  return [r.summary, r.overall, ...r.strengths.map((s) => s.text), ...r.risks.map((s) => s.text), ...r.strategies.map((s) => s.text)];
}
