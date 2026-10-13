// 입지 적합도 규칙표 (초안 — 출시 전 창업 상담사 검수로 보정). 숫자 수정은 이 파일만.

// 5개 평가항목과 초기 비중 (합 1)
export const ITEMS = [
  { key: "customer", name: "목표 고객 일치도", short: "고객 일치", weight: 0.25 },
  { key: "size", name: "유동인구 규모", short: "유동인구", weight: 0.2 },
  { key: "competition", name: "경쟁 강도", short: "경쟁 강도", weight: 0.2 },
  { key: "rent", name: "임대료 부담", short: "임대료", weight: 0.2 },
  { key: "growth", name: "성장 가능성", short: "성장성", weight: 0.15 },
];

// 등급 구간 (점수 이상)
export const GRADES = [
  { min: 85, name: "추천", cls: "up", icon: "🌟" },
  { min: 70, name: "조건부 추천", cls: "up", icon: "🌱" },
  { min: 55, name: "신중 검토", cls: "warn", icon: "🔎" },
  { min: 0, name: "재검토", cls: "now", icon: "⚠" },
];

// 리포트 문장 규칙의 기준값
export const REPORT_RULES = {
  strongScore: 75, // 이 점수 이상이면 강점 후보
  weakScore: 35, // 이 점수 이하이면 위험 후보
  weekendHeavy: 1.5, // 주말/평일 생활인구 비율
  weekdayHeavy: 0.85,
  growthUp: 0.03, // 직전 3개월 대비 증가율
  growthDown: -0.03,
};

// 금지 표현 (리포트 문장에 들어가면 안 되는 단정어) — check.html 에서 일괄 검사
export const FORBIDDEN = ["반드시", "무조건", "확실히 성공", "100% 성공", "실패 없", "보장합니다"];

export const DISCLAIMER = "이 결과는 공공데이터 기반 의사결정 참고자료이며 성공을 보장하지 않습니다. 현장 답사 후 최종 판단하세요.";
