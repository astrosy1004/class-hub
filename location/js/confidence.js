// 점수 신뢰도: 이번 분석에 쓰인 자료의 범위 · 단위 · 검증 여부를 보고 높음/보통/낮음을 정한다.
// 점수 자체를 바꾸지 않고, 점수를 얼마나 믿어도 되는지와 그 이유를 화면에 함께 보여주기 위한 것.
// 감점 숫자는 초안이다 (백테스트 결과로 보정 예정 — README "점수 신뢰도" 참고).

// 실제 개폐업 · 생존율과 맞대 본 검증(백테스트)이 끝나기 전에는 "높음"을 주지 않는다
export const SCORE_VALIDATED = false;
// 경쟁 구간표를 실제 표본으로 맞춘 업종 (area-data.js bands 주석 참고)
const CALIBRATED_BANDS = ["cafe"];

export function confidenceOf(a) {
  const reasons = [];
  let pts = 100;
  const minus = (n, text) => { pts -= n; reasons.push({ text, minus: n }); };
  const { score, pop, comp, baseline, industry } = a;

  const missing = score.items.filter((i) => i.score == null);
  if (missing.length) minus(10 * missing.length, `${missing.map((i) => i.short).join(" · ")} 자료가 없어 ${score.used}개 항목으로 계산했어요`);
  if (!pop) minus(40, "생활인구 자료가 없어 고객 · 유동인구 · 성장성을 볼 수 없어요");
  else if (pop.level === "gu") minus(25, "생활인구가 동이 아닌 자치구 단위예요 (예시 표본)");
  else if (baseline?.level === "gu") minus(10, "비교 기준이 동 단위가 아닌 자치구 표본이에요");
  if (pop && (pop.monthly?.length || 0) < 6) minus(5, `추이 자료가 ${pop.monthly?.length || 0}개월분이라 성장성이 흔들릴 수 있어요`);
  if (!CALIBRATED_BANDS.includes(industry.baseKey || industry.key)) minus(15, `${industry.name}의 경쟁 기준표는 실측 표본이 아닌 초안이에요`);
  if (!comp.live) minus(15, "경쟁 점포가 실제 검색이 아닌 예시예요");
  else if (comp.capped) minus(5, "점포 검색이 한도에 닿아 실제보다 적게 셌을 수 있어요");
  if (a.rent?.source === "input" && a.rent.score != null) minus(5, "임대료는 직접 넣은 매물 값이고, 매출 대비 부담 기준표는 초안이에요");
  if (!SCORE_VALIDATED) reasons.push({ text: "점수 규칙을 실제 개폐업 결과로 검증하기 전이에요", minus: 0 });

  let level = pts >= 80 ? "high" : pts >= 55 ? "mid" : "low";
  if (!SCORE_VALIDATED && level === "high") level = "mid";
  if (score.total == null) level = "low";
  const name = { high: "높음", mid: "보통", low: "낮음" }[level];
  return { level, name, points: Math.max(0, pts), reasons };
}

// 항목 점수 → 쉬운 말 (결과 화면의 좋음 · 보통 · 주의)
export const itemWord = (s) => (s == null ? null : s >= 70 ? { t: "좋음", cls: "up" } : s >= 40 ? { t: "보통", cls: "" } : { t: "주의", cls: "warn" });
