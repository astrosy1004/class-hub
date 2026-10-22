/* =========================================================
   Life Compass — 데이터
   문항·가치 카드·삶의 모델·수정 이력은 아래 배열만 고치면 됩니다.
   ========================================================= */

// 성향 축 (레이더 차트 순서)
const AXES = [
  { id: "autonomy", name: "자율성", high: "스스로 방향을 정하고 자기 방식대로 일할 때 힘이 나는 경향", low: "명확한 방향과 함께 움직일 때 더 편안한 경향" },
  { id: "relation", name: "관계", high: "사람과의 교류에서 에너지를 얻고 관계를 중요하게 고려하는 경향", low: "소수와 깊게, 또는 혼자 있는 시간으로 회복하는 경향" },
  { id: "change", name: "변화", high: "새로움과 가능성에서 흥미를 느끼고 변화를 반기는 경향", low: "익숙함과 예측 가능성에서 안정감을 얻는 경향" },
  { id: "structure", name: "구조", high: "계획·절차·검증된 사실에 기대어 움직이는 경향", low: "유연하고 즉흥적으로 상황에 맞춰 움직이는 경향" },
  { id: "focus", name: "몰입", high: "한 가지에 깊이 오래 빠져들며 혼자 있는 시간이 중요한 경향", low: "여러 일을 넓게 오가며 주의를 나누는 경향" },
];

// 근거 층위
const BASIS = {
  research: { label: "연구 근거", desc: "Big Five·기질·가치관 연구의 공개된 개념을 참고해 자체 작성한 문항" },
  prelim: { label: "예비 근거", desc: "자체 개발 문항. 아직 시범 표본 검증 전" },
  reflect: { label: "성찰 제안", desc: "점수가 아니라 스스로 돌아보기 위한 질문" },
};

const LIKERT = ["전혀 아니다", "아니다", "보통이다", "그렇다", "매우 그렇다"];

// 8단계 탐색. type: likert(5점 척도) · values(가치 카드) · direction(삶의 모델)
// 문항의 reverse: true 는 역채점 문항(응답 일관성 계산에도 사용)
const STEPS = [
  {
    id: 1, title: "에너지", desc: "사람·혼자 있는 시간에서 회복하는 방식", type: "likert",
    questions: [
      { id: "e1", text: "여러 사람과 함께 보낸 하루가 끝나면 오히려 에너지가 차오른다.", axis: "relation", basis: "research", ref: "Big Five 외향성(사교성) 개념" },
      { id: "e2", text: "방해받지 않고 혼자 보내는 시간이 있어야 회복된다.", axis: "focus", basis: "prelim", ref: "자체 문항" },
      { id: "e3", text: "새로운 사람을 만나는 자리는 되도록 피하고 싶다.", axis: "relation", reverse: true, basis: "research", ref: "Big Five 외향성(사교성) 개념" },
      { id: "e4", text: "한 가지 일에 몇 시간씩 빠져 있어도 지루하지 않다.", axis: "focus", basis: "research", ref: "몰입(Flow) 연구 개념" },
    ],
  },
  {
    id: 2, title: "자극과 감정", desc: "변화·갈등·압박에 대한 반응", type: "likert",
    questions: [
      { id: "s1", text: "익숙한 방식이 갑자기 바뀌면 불안하기보다 흥미롭다.", axis: "change", basis: "research", ref: "기질 연구의 새로움 추구 개념" },
      { id: "s2", text: "예상치 못한 일정 변경이 생기면 하루 종일 신경이 쓰인다.", axis: "change", reverse: true, basis: "research", ref: "기질 연구의 위험 회피 개념" },
      { id: "s3", text: "압박이 커질수록 누군가와 이야기하며 푸는 편이다.", axis: "relation", basis: "prelim", ref: "자체 문항" },
      { id: "s4", text: "갈등이 생기면 바로 풀기보다 혼자 정리할 시간이 필요하다.", axis: "autonomy", basis: "prelim", ref: "자체 문항" },
    ],
  },
  {
    id: 3, title: "정보 처리", desc: "사실과 가능성 중 주로 의지하는 방식", type: "likert",
    questions: [
      { id: "i1", text: "검증된 사실과 구체적인 경험을 가장 믿는다.", axis: "structure", basis: "prelim", ref: "자체 문항" },
      { id: "i2", text: "아직 없는 가능성을 상상하는 일이 즐겁다.", axis: "change", basis: "research", ref: "Big Five 개방성(상상력) 개념" },
      { id: "i3", text: "새 주제를 만나면 깊이 파고들어 원리를 알아내고 싶다.", axis: "focus", basis: "research", ref: "Big Five 개방성(지적 호기심) 개념" },
      { id: "i4", text: "정해진 절차가 있으면 그대로 따르는 것이 편하다.", axis: "structure", basis: "research", ref: "Big Five 성실성(질서) 개념" },
    ],
  },
  {
    id: 4, title: "의사 결정", desc: "논리·효율과 관계·가치의 균형", type: "likert",
    questions: [
      { id: "d1", text: "중요한 결정은 다른 사람의 허락 없이 스스로 내리고 싶다.", axis: "autonomy", basis: "research", ref: "Schwartz 가치 이론의 자기주도 개념" },
      { id: "d2", text: "결정할 때 관계에 미칠 영향을 가장 먼저 생각한다.", axis: "relation", basis: "research", ref: "Big Five 우호성 개념" },
      { id: "d3", text: "누군가 정해준 방향을 따를 때 더 편안하다.", axis: "autonomy", reverse: true, basis: "research", ref: "Schwartz 가치 이론의 순응 개념" },
      { id: "d4", text: "효율이 떨어지더라도 내 방식대로 하는 것이 중요하다.", axis: "autonomy", basis: "prelim", ref: "자체 문항" },
    ],
  },
  {
    id: 5, title: "생활 리듬", desc: "계획·구조와 유연성·즉흥성", type: "likert",
    questions: [
      { id: "r1", text: "하루 일정을 미리 계획해 두어야 마음이 놓인다.", axis: "structure", basis: "research", ref: "Big Five 성실성(질서) 개념" },
      { id: "r2", text: "계획 없이 그날 기분에 따라 움직이는 날이 좋다.", axis: "structure", reverse: true, basis: "research", ref: "Big Five 성실성(신중성) 개념" },
      { id: "r3", text: "같은 루틴이 몇 주 이어지면 변화를 주고 싶어진다.", axis: "change", basis: "prelim", ref: "자체 문항" },
      { id: "r4", text: "마감보다 한참 전에 일을 끝내 두는 편이다.", axis: "structure", basis: "research", ref: "Big Five 성실성(자기 훈련) 개념" },
    ],
  },
  {
    id: 6, title: "핵심 가치", desc: "포기하고 싶지 않은 것과 원하는 삶", type: "values",
    notes: [
      { key: "keep", label: "어떤 상황에서도 포기하고 싶지 않은 것은?", placeholder: "예: 저녁 시간의 여유, 배우는 즐거움" },
      { key: "wish", label: "원하는 삶을 한 문장으로 적는다면?", placeholder: "예: 좋아하는 일을 깊게 하며 가까운 사람과 천천히 사는 삶" },
      { key: "constraints", label: "지금 고려해야 할 현실 조건은? (시간·돈·책임 등)", placeholder: "예: 평일 저녁 2시간만 쓸 수 있음, 가족 돌봄" },
    ],
  },
  {
    id: 7, title: "강점 패턴", desc: "자연스럽게 잘하는 것과 반복되는 어려움", type: "likert",
    questions: [
      { id: "p1", text: "남들이 금방 포기하는 일도 끝까지 붙잡고 있는 편이다.", axis: "focus", basis: "research", ref: "끈기(Grit) 연구 개념" },
      { id: "p2", text: "주의가 자주 흩어져 한 가지를 오래 하지 못한다.", axis: "focus", reverse: true, basis: "prelim", ref: "자체 문항" },
      { id: "p3", text: "사람들 사이를 연결하거나 분위기를 맞추는 역할을 자주 맡는다.", axis: "relation", basis: "prelim", ref: "자체 문항" },
      { id: "p4", text: "누가 시키지 않아도 스스로 일을 찾아 시작한다.", axis: "autonomy", basis: "research", ref: "자기결정성 이론의 자율성 개념" },
      { id: "p5", text: "새로운 방법을 먼저 시도해 보는 역할을 자주 맡는다.", axis: "change", basis: "prelim", ref: "자체 문항" },
    ],
    notes: [
      { key: "strength", label: "애쓰지 않아도 자연스럽게 잘하는 것은?", placeholder: "예: 복잡한 내용을 쉽게 정리하기" },
      { key: "struggle", label: "반복해서 부딪히는 어려움은?", placeholder: "예: 마감이 다가와야 시작하게 됨" },
    ],
  },
  { id: 8, title: "삶의 방향", desc: "가능한 삶의 모델과 다음 실험", type: "direction" },
];

// 6단계 가치 카드 (3~5개 선택)
const VALUES = [
  { id: "freedom", name: "자유", desc: "내 시간과 선택의 주도권" },
  { id: "growth", name: "성장", desc: "어제보다 나아지는 감각" },
  { id: "stability", name: "안정", desc: "예측 가능하고 흔들리지 않는 삶" },
  { id: "family", name: "가족", desc: "가까운 사람과 보내는 시간" },
  { id: "friendship", name: "우정", desc: "마음을 나누는 관계" },
  { id: "achievement", name: "성취", desc: "목표를 이루는 기쁨" },
  { id: "adventure", name: "모험", desc: "낯선 경험과 도전" },
  { id: "creativity", name: "창의", desc: "새로운 것을 만들어 내기" },
  { id: "health", name: "건강", desc: "몸과 마음의 컨디션" },
  { id: "learning", name: "배움", desc: "알고 이해하는 즐거움" },
  { id: "contribution", name: "기여", desc: "누군가에게 도움이 되기" },
  { id: "justice", name: "정의", desc: "공정함과 옳음" },
  { id: "leisure", name: "여유", desc: "서두르지 않는 일상" },
  { id: "expertise", name: "전문성", desc: "한 분야를 깊이 아는 것" },
  { id: "recognition", name: "인정", desc: "노력이 보이고 존중받기" },
  { id: "wealth", name: "경제적 여유", desc: "돈 걱정 없는 기반" },
];

// 8단계 삶의 모델. target: 축별 기대 점수(0~100), values: 잘 맞는 가치 카드
const LIFE_MODELS = [
  {
    id: "deep-solo", name: "독립 몰입형",
    target: { autonomy: 80, focus: 80, relation: 40 },
    values: ["freedom", "expertise", "learning", "achievement"],
    condition: "자율성이 있고, 깊이 몰입할 시간이 보장되며, 관계는 소수와 깊게 유지되는 환경",
    hypothesis: "자율성과 깊은 몰입이 있는 환경에서 더 잘 기능할 것이다.",
    actions: ["주 2회, 2시간짜리 독립 프로젝트 시간 확보", "하루 30분 방해 없는 혼자 있는 시간", "알림을 끄고 한 가지 일에만 몰입하는 블록 만들기"],
  },
  {
    id: "connector", name: "연결 협업형",
    target: { relation: 80, autonomy: 45, change: 55 },
    values: ["friendship", "family", "contribution", "recognition"],
    condition: "사람과 자주 교류하고, 함께 결과를 만들어 가는 팀 환경",
    hypothesis: "사람들과 함께 일하고 교류할 때 에너지가 회복될 것이다.",
    actions: ["주 1회 새로운 모임·스터디 참여", "혼자 하던 일 하나를 누군가와 함께 해보기", "하루 한 번 안부 연락하기"],
  },
  {
    id: "explorer", name: "탐험 실험형",
    target: { change: 85, structure: 30, autonomy: 65 },
    values: ["adventure", "creativity", "growth", "freedom"],
    condition: "새로운 시도가 허용되고 변화가 잦은 프로젝트형 환경",
    hypothesis: "변화와 새로운 시도가 있는 환경에서 더 살아 있다고 느낄 것이다.",
    actions: ["매주 처음 해보는 일 한 가지 시도", "익숙한 동선·루틴 하나 바꿔보기", "작은 사이드 프로젝트 1개 시작"],
  },
  {
    id: "architect", name: "안정 설계형",
    target: { structure: 85, change: 30, focus: 60 },
    values: ["stability", "health", "expertise", "wealth"],
    condition: "역할과 기대가 명확하고, 예측 가능한 리듬이 있는 환경",
    hypothesis: "예측 가능한 루틴과 명확한 계획이 있을 때 스트레스가 줄어들 것이다.",
    actions: ["매일 같은 시간에 자고 일어나기", "일요일 저녁 15분 동안 주간 계획 세우기", "하루 할 일을 3개만 정해 끝내기"],
  },
  {
    id: "contributor", name: "의미 기여형",
    target: { relation: 70, focus: 65, structure: 55 },
    values: ["contribution", "justice", "learning", "family"],
    condition: "누군가에게 실질적인 도움이 되고, 그 영향이 눈에 보이는 역할",
    hypothesis: "내 일이 누군가에게 도움이 된다고 느낄 때 지속할 힘이 생길 것이다.",
    actions: ["주 1회 누군가를 돕는 시간(멘토링·봉사 등)", "도움이 된 순간을 매일 한 줄 기록", "가르치거나 설명해 보는 기회 만들기"],
  },
  {
    id: "balancer", name: "균형 조율형",
    target: { autonomy: 50, relation: 50, change: 50, structure: 50, focus: 50 },
    values: ["leisure", "health", "family", "growth"],
    condition: "한쪽으로 치우치지 않고, 상황에 따라 모드를 바꿀 수 있는 유연한 환경",
    hypothesis: "혼자와 함께, 계획과 즉흥을 의도적으로 섞을 때 가장 안정적일 것이다.",
    actions: ["하루를 '혼자 몰입' 블록과 '함께 교류' 블록으로 나누기", "주 1회 계획 없는 반나절 두기", "매일 저녁 오늘의 에너지 패턴 한 줄 기록"],
  },
];

// 실험 기록 항목 (1~10점)
const LOG_METRICS = [
  { key: "focus", name: "몰입도" },
  { key: "recovery", name: "회복감" },
  { key: "stress", name: "스트레스" },
  { key: "sustain", name: "지속 가능성" },
];

const EXPERIMENT_DAYS = 28;

// 문항·해석 수정 이력 (근거·안내 화면에 공개)
const CHANGELOG = [
  { version: "v0.1", date: "2026-10-22", note: "MVP 공개. 5개 축 · 25개 예비 문항 · 가치 카드 16종 · 삶의 모델 6종." },
];

// 소개(랜딩) 화면 문구
const LANDING = {
  badge: "근거를 공개하는 단계적 자기이해 웹앱",
  title: "유형을 정하지 않고,<br>나를 실험하는 나침반",
  lead: "성향 × 가치관 × 현실 조건을 8단계로 살펴보고, 나에게 맞을 가능성이 높은 삶의 조건을 4주 실험으로 직접 확인합니다.",
  showcaseTitle: "대시보드 예시 화면",
  statsTitle: "근거와 실험으로<br>만드는 자기이해",
};

// 소개 화면 숫자 카드. value 는 위 데이터에서 계산
const LANDING_STATS = [
  { icon: "↗", value: () => STEPS.length, unit: "단계", title: "세분화된 탐색", desc: "에너지부터 삶의 방향까지, 한 번에 하나씩 살펴봅니다." },
  { icon: "Aa", value: () => allQuestions().length, unit: "문항", title: "출처를 공개한 문항", desc: "모든 문항에 근거 층위와 참고 개념을 표시합니다." },
  { icon: "◎", value: () => AXES.length, unit: "축", title: "성향 지도", desc: "자율성·관계·변화·구조·몰입의 방향과 편향 정도." },
  { icon: "%", value: () => EXPERIMENT_DAYS / 7, unit: "주", title: "삶의 실험", desc: "작고 측정 가능한 행동으로 가설을 직접 검증합니다." },
  { icon: "✦", value: () => LIFE_MODELS.length, unit: "개", title: "삶의 모델", desc: "성향과 가치관으로 계산한 적합도 순으로 제안합니다." },
  { icon: "⌂", value: () => 0, unit: "건", title: "서버 전송", desc: "응답과 기록은 내 브라우저에만 저장됩니다." },
];

// 소개 화면 대시보드 미리보기용 예시 데이터
const SHOWCASE_RECOVERY = [38, 44, 41, 52, 49, 61, 57, 70, 64, 78, 69, 84];

const STORAGE_KEY = "compassState";
const THEME_KEY = "compassTheme";

/* =========================================================
   상태 저장
   ========================================================= */

const emptyState = () => ({ answers: {}, values: [], notes: {}, snapshots: [], experiments: [] });

let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? { ...emptyState(), ...saved } : emptyState();
  } catch {
    return emptyState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    toast("이 브라우저에서는 저장할 수 없어요.");
  }
  updateBrandStatus();
}

/* =========================================================
   유틸
   ========================================================= */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const app = $("#app");

function esc(text) {
  return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function todayStr(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function daysBetween(from, to) {
  const a = new Date(from + "T00:00:00");
  const b = new Date(to + "T00:00:00");
  return Math.round((b - a) / 86400000);
}

const avg = (list) => (list.length ? list.reduce((s, v) => s + v, 0) / list.length : null);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const axisName = (id) => AXES.find((a) => a.id === id)?.name ?? id;
const valueName = (id) => VALUES.find((v) => v.id === id)?.name ?? id;

let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2200);
}

/* =========================================================
   점수 계산
   ========================================================= */

const allQuestions = () => STEPS.flatMap((s) => s.questions || []);

// 역채점을 반영한 1~5점
function adjusted(q) {
  const raw = state.answers[q.id];
  if (raw == null) return null;
  return q.reverse ? 6 - raw : raw;
}

// 축별 점수(0~100)와 응답 변동 범위
function computeScores() {
  const result = {};
  AXES.forEach((axis) => {
    const items = allQuestions().filter((q) => q.axis === axis.id);
    const values = items.map(adjusted).filter((v) => v != null).map((v) => ((v - 1) / 4) * 100);
    if (!values.length) {
      result[axis.id] = null;
      return;
    }
    const mean = avg(values);
    const sd = Math.sqrt(avg(values.map((v) => (v - mean) ** 2)));
    const margin = values.length > 1 ? (1.96 * sd) / Math.sqrt(values.length) : 25;
    result[axis.id] = { score: Math.round(mean), margin: Math.round(margin), answered: values.length, total: items.length };
  });
  return result;
}

// 응답 일관성: 같은 축의 정채점 문항 평균과 역채점 문항 평균의 차이
function computeConsistency() {
  const gaps = [];
  AXES.forEach((axis) => {
    const items = allQuestions().filter((q) => q.axis === axis.id);
    const forward = items.filter((q) => !q.reverse).map(adjusted).filter((v) => v != null);
    const reverse = items.filter((q) => q.reverse).map(adjusted).filter((v) => v != null);
    if (forward.length && reverse.length) gaps.push(Math.abs(avg(forward) - avg(reverse)) / 4);
  });
  return gaps.length ? Math.round((1 - avg(gaps)) * 100) : null;
}

// 응답 편향: 한 값으로 몰아 답하기 · 양 끝 응답 · 중간값 위주
function computeBias() {
  const raws = Object.values(state.answers);
  if (raws.length < 8) return null;
  const counts = [1, 2, 3, 4, 5].map((v) => raws.filter((r) => r === v).length / raws.length);
  const same = Math.max(...counts);
  const extreme = counts[0] + counts[4];
  const middle = counts[2];
  if (same > 0.6) return { level: "높음", note: "한 가지 응답에 몰려 있어요" };
  if (extreme > 0.7) return { level: "높음", note: "양 끝 응답이 많아요" };
  if (middle > 0.5) return { level: "보통", note: "'보통이다' 응답이 많아요" };
  if (same > 0.45 || extreme > 0.5) return { level: "보통", note: "응답이 다소 치우쳐 있어요" };
  return { level: "낮음", note: "응답이 고르게 분포해요" };
}

function levelOf(score) {
  if (score >= 70) return { text: "강함", cls: "strong" };
  if (score >= 60) return { text: "약간 강함", cls: "strong" };
  if (score > 40) return { text: "중립", cls: "neutral" };
  if (score > 30) return { text: "약간 약함", cls: "weak" };
  return { text: "약함", cls: "weak" };
}

function rankModels(scores) {
  return LIFE_MODELS.map((model) => {
    const keys = Object.keys(model.target).filter((k) => scores[k]);
    const diff = avg(keys.map((k) => Math.abs(scores[k].score - model.target[k]))) ?? 50;
    const overlap = model.values.filter((v) => state.values.includes(v));
    const match = clamp(Math.round(100 - diff + overlap.length * 3), 0, 99);
    return { ...model, match, overlap };
  }).sort((a, b) => b.match - a.match);
}

/* =========================================================
   진행 상황
   ========================================================= */

function isStepDone(step) {
  if (step.type === "likert") return step.questions.every((q) => state.answers[q.id] != null);
  if (step.type === "values") return state.values.length >= 3;
  if (step.type === "direction") return state.experiments.length > 0;
  return false;
}

const doneCount = () => STEPS.filter(isStepDone).length;
const nextStep = () => STEPS.find((s) => !isStepDone(s));
const likertDone = () => STEPS.filter((s) => s.type === "likert").every(isStepDone);
const hasAnswers = () => Object.keys(state.answers).length > 0;
const activeExperiment = () => state.experiments.find((e) => e.status === "active");

function updateBrandStatus() {
  const el = $("#brandStatus");
  const done = doneCount();
  if (activeExperiment()) el.textContent = "실험 중";
  else if (done === STEPS.length) el.textContent = "탐색 완료";
  else if (done > 0 || hasAnswers()) el.textContent = `탐색 중 ${done}/${STEPS.length}`;
  else el.textContent = "탐색 전";
}

/* =========================================================
   공통 조각
   ========================================================= */

function axisRows(scores, { showRange = false } = {}) {
  return AXES.map((axis) => {
    const s = scores[axis.id];
    if (!s) return `<div class="axis-row"><label>${axis.name}</label><div class="track"></div><span class="score">–</span><span class="level neutral">미응답</span></div>`;
    const lv = levelOf(s.score);
    const range = showRange
      ? `<i class="range" style="left:${clamp(s.score - s.margin, 0, 100)}%;width:${clamp(s.score + s.margin, 0, 100) - clamp(s.score - s.margin, 0, 100)}%"></i>`
      : "";
    return `<div class="axis-row"><label>${axis.name}</label><div class="track">${range}<div class="fill" style="width:${s.score}%"></div></div><span class="score">${s.score}</span><span class="level ${lv.cls}">${lv.text}</span></div>`;
  }).join("");
}

function radarSVG(scores, prevScores) {
  const cx = 210, cy = 180, R = 125, n = AXES.length;
  const point = (i, ratio) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(angle) * R * ratio, cy + Math.sin(angle) * R * ratio];
  };
  const poly = (ratios) => ratios.map((r, i) => point(i, r).map((v) => v.toFixed(1)).join(",")).join(" ");
  const ratiosOf = (sc) => AXES.map((a) => (sc[a.id]?.score ?? sc[a.id] ?? 0) / 100);

  const grids = [1, 0.75, 0.5, 0.25].map((r) => `<polygon class="grid-line" points="${poly(AXES.map(() => r))}"/>`).join("");
  const spokes = AXES.map((_, i) => { const [x, y] = point(i, 1); return `<line class="spoke" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`; }).join("");
  const labels = AXES.map((a, i) => {
    const [x, y] = point(i, 1.17);
    const anchor = Math.abs(x - cx) < 5 ? "middle" : x > cx ? "start" : "end";
    return `<text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="${anchor}">${a.name}</text>`;
  }).join("");
  const ratios = ratiosOf(scores);
  const dots = ratios.map((r, i) => { const [x, y] = point(i, r); return `<circle class="dot" cx="${x}" cy="${y}" r="4"/>`; }).join("");
  const prev = prevScores ? `<polygon class="prev" points="${poly(ratiosOf(prevScores))}"/>` : "";

  return `<svg class="radar" viewBox="0 0 420 360" role="img" aria-label="성향 레이더 차트: ${AXES.map((a) => `${a.name} ${scores[a.id]?.score ?? "미응답"}`).join(", ")}">
    ${grids}${spokes}${prev}<polygon class="shape" points="${poly(ratios)}"/>${dots}${labels}</svg>`;
}

function basisTag(key) {
  return `<span class="tag ${key}" title="${esc(BASIS[key].desc)}">${BASIS[key].label}</span>`;
}

function weeklyRecovery(exp) {
  const today = todayStr();
  const inRange = (from, to) => exp.logs.filter((l) => { const d = daysBetween(l.date, today); return d >= from && d <= to; }).map((l) => l.recovery);
  return { thisWeek: avg(inRange(0, 6)), lastWeek: avg(inRange(7, 13)) };
}

/* =========================================================
   화면: 대시보드
   ========================================================= */

/* =========================================================
   화면: 소개(랜딩) — 히어로 · 대시보드 미리보기 · 숫자 카드
   ========================================================= */

// 히어로 배경: 타원을 따라 비틀려 도는 막대들. 오른쪽 아래만 보라색
function spiralSVG() {
  const count = 46, cx = 500, cy = 330;
  const slats = Array.from({ length: count }, (_, i) => {
    const t = (i / count) * Math.PI * 2;
    const x = cx + Math.cos(t) * 440;
    const y = cy + Math.sin(t) * 300;
    const near = Math.cos(t - Math.PI / 4); // 오른쪽 아래일수록 1에 가까움 (가깝고 크게)
    const purple = near > 0.55;
    const len = 120 + near * 50;
    const width = 15 + near * 6;
    const angle = (t * 180) / Math.PI + 90 + 38;
    return `<rect x="${(-width / 2).toFixed(1)}" y="${(-len / 2).toFixed(1)}" width="${width.toFixed(1)}" height="${len.toFixed(1)}" rx="${(width / 2).toFixed(1)}"
      transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})" fill="url(#${purple ? "slatViolet" : "slatGrey"})" opacity="${(0.55 + Math.max(near, 0) * 0.45).toFixed(2)}"/>`;
  }).join("");
  return `<svg class="spiral" viewBox="0 0 1000 680" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="slatGrey" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--slat-light)"/><stop offset="1" stop-color="var(--slat-dark)"/></linearGradient>
      <linearGradient id="slatViolet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1e4ff"/><stop offset=".45" stop-color="#a45cf5"/><stop offset="1" stop-color="#5a17b8"/></linearGradient>
    </defs>
    <g class="spiral-ring">${slats}</g></svg>`;
}

// 점 배열 → 부드러운 곡선 경로
function smoothPath(values, w, h, pad = 6) {
  const max = Math.max(...values), min = Math.min(...values) - 10;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, pad + (1 - (v - min) / (max - min)) * (h - pad * 2)]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1] || pts[i], [x1, y1] = pts[i], [x2, y2] = pts[i + 1], [x3, y3] = pts[i + 2] || pts[i + 1];
    d += ` C${(x1 + (x2 - x0) / 6).toFixed(1)},${(y1 + (y2 - y0) / 6).toFixed(1)} ${(x2 - (x3 - x1) / 6).toFixed(1)},${(y2 - (y3 - y1) / 6).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return d;
}

function showcaseMock() {
  const w = 520, h = 150;
  const line = smoothPath(SHOWCASE_RECOVERY, w, h);
  const bars = [["자율성", 78], ["몰입", 73], ["관계", 64], ["변화", 54], ["구조", 41]];
  return `
    <div class="mock" aria-label="대시보드 예시 화면">
      <aside class="mock-side" aria-hidden="true"><img src="./assets/logo.svg" alt="" width="20" height="20" /><i>◔</i><i>≡</i><i>◎</i><i>⚗</i><i>⚙</i></aside>
      <div class="mock-main">
        <div class="mock-head"><span class="seg on">탐색</span><span class="seg">실험</span><span class="mock-user">나</span></div>
        <h3 class="mock-title">나침반 대시보드 <span class="mono-tag">예시 화면</span></h3>
        <div class="mock-grid">
          <div class="mock-card span-2"><div class="mock-label">회복감 추이 <span>12회 기록</span></div>
            <svg viewBox="0 0 ${w} ${h}" class="area" preserveAspectRatio="none">
              <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a3ffc"/><stop offset="1" stop-color="#8a3ffc" stop-opacity=".05"/></linearGradient></defs>
              <path d="${line} L${w},${h} L0,${h} Z" fill="url(#areaFill)"/><path d="${line}" fill="none" stroke="#6d28d9" stroke-width="2"/>
            </svg></div>
          <div class="mock-card"><div class="mock-label">하루 평균 몰입 시간</div><div class="mock-metric">2h 08m</div><p class="mock-note">↗ 지난주보다 24분 늘었어요</p></div>
          <div class="mock-card"><div class="mock-label">응답 일관성</div><div class="mock-metric">86%</div><p class="mock-note">역문항과 정문항의 차이가 작아요</p></div>
          <div class="mock-card span-2 orb-card"><div class="orb" aria-hidden="true"></div>
            <div><div class="mock-label">다음 삶의 실험</div><p class="mock-note">자율성과 깊은 몰입이 있는 환경에서 더 잘 기능할 것이다 — 주 2회 독립 프로젝트, 하루 30분 혼자 있는 시간.</p><span class="mock-chip">실험 진행 중 · 2주차</span></div></div>
          <div class="mock-card span-3"><div class="mock-label">성향 분포</div>
            ${bars.map(([n, v]) => `<div class="hbar"><span>${n}</span><i style="width:${v}%"></i><b>${v}</b></div>`).join("")}</div>
        </div>
      </div>
    </div>`;
}

function renderLanding() {
  app.innerHTML = `
    <section class="hero">
      ${spiralSVG()}
      <div class="hero-inner">
        <span class="hero-badge mono"><i></i>${LANDING.badge}</span>
        <h1 class="hero-title">${LANDING.title}</h1>
        <p class="hero-lead">${LANDING.lead}</p>
        <div class="hero-actions">
          <button class="btn-pill mono" type="button" data-action="scroll" data-target="#showcase">어떻게 작동하나요</button>
          <a class="btn-pill glow mono" href="${hasAnswers() ? "#/home" : "#/step/1"}">${hasAnswers() ? "내 대시보드" : "탐색 시작하기"}</a>
        </div>
      </div>
    </section>

    <section class="showcase" id="showcase" aria-label="${LANDING.showcaseTitle}">
      ${showcaseMock()}
    </section>

    <section class="stats">
      <div class="stats-head">
        <span class="mono-tag">PRINCIPLES</span>
        <h2 class="display">${LANDING.statsTitle}</h2>
        <div class="stats-nav"><button type="button" data-action="stats-scroll" data-dir="-1" aria-label="이전 카드">‹</button><button type="button" data-action="stats-scroll" data-dir="1" aria-label="다음 카드">›</button></div>
      </div>
      <div class="stats-track" id="statsTrack">
        ${LANDING_STATS.map((s) => `
          <article class="stat-card"><div class="stat-inner">
            <span class="stat-icon mono" aria-hidden="true">${s.icon}</span>
            <div class="stat-value">${s.value()}<small>${s.unit}</small></div>
            <h3>${s.title}</h3><p>${s.desc}</p>
          </div></article>`).join("")}
      </div>
    </section>

    <section class="closing">
      <p class="display">“당신의 본질은 이것”이 아니라<br>“이 조건을 실험해볼 수 있다”라고 안내합니다.</p>
      <div class="hero-actions"><a class="btn-pill mono" href="#/trust">근거와 한계 보기</a><a class="btn-pill glow mono" href="#/step/1">첫 질문 시작하기</a></div>
    </section>`;
}

function renderHome() {
  if (!hasAnswers()) return renderLanding();

  const scores = computeScores();
  const consistency = computeConsistency();
  const bias = computeBias();
  const top = rankModels(scores)[0];
  const exp = activeExperiment();
  const next = nextStep();
  const done = doneCount();

  let recoveryCard = `<h3>이번 주 회복감</h3><p class="muted">삶의 실험을 시작하면 매일의 회복감이 여기에 쌓입니다.</p><a class="btn line" href="#/step/8">실험 고르기</a>`;
  if (exp) {
    const { thisWeek, lastWeek } = weeklyRecovery(exp);
    const recent = exp.logs.slice(-6);
    const diff = thisWeek != null && lastWeek != null ? Math.round((thisWeek - lastWeek) * 10) : null;
    recoveryCard = `<h3>이번 주 회복감</h3>
      <div class="metric">${thisWeek != null ? Math.round(thisWeek * 10) : "–"}<small> / 100</small></div>
      <p class="small">${diff == null ? "지난주와 비교할 기록이 아직 없어요" : diff >= 0 ? `지난주보다 ${diff}점 상승` : `지난주보다 ${-diff}점 하락`}</p>
      ${recent.length ? `<div class="mini-bars">${recent.map((l) => `<div><i style="height:${l.recovery * 10}%"></i><span>${l.date.slice(5)}</span></div>`).join("")}</div>` : `<a class="btn line" href="#/experiment">오늘 기록하기</a>`}`;
  }

  app.innerHTML = `
    <div class="eyebrow">Dashboard · <a href="#/intro">서비스 소개</a></div>
    <h1 class="page-title">나의 나침반</h1>
    <div class="grid grid-3">
      <div class="card span-2"><h3>현재 나의 성향 지도</h3>${axisRows(scores)}
        <div class="actions"><a class="btn line" href="#/result">자세한 결과 보기</a></div></div>
      <div class="card">${recoveryCard}</div>
      <div class="card"><h3>응답 편향</h3>
        <div class="metric">${bias ? bias.level : "–"}</div>
        <p class="small">${consistency != null ? `응답 일관성 ${consistency}%` : "일관성은 역문항에 답하면 계산돼요"}</p>
        <p class="small">${bias ? bias.note : "8문항 이상 답하면 계산돼요"}</p>
        ${!likertDone() ? `<span class="pill">추가 탐색 권장</span>` : ""}</div>
      <div class="card span-2"><h3>나에게 맞을 가능성이 높은 조건</h3>
        <p><b>${esc(top.name)}</b> <span class="pill">적합도 ${top.match}</span></p>
        <p class="muted">${esc(top.condition)}</p>
        <a class="btn" href="${exp ? "#/experiment" : "#/step/8"}">${exp ? "진행 중인 실험 보기" : "다음 삶의 실험 보기"} →</a></div>
      <div class="card"><h3>진행 상황</h3>
        <div class="metric">${done}<small> / ${STEPS.length} 단계</small></div>
        <div class="progress"><i style="width:${(done / STEPS.length) * 100}%"></i></div>
        <p class="small">${next ? `${next.id}단계 ${next.title} 탐색 예정` : "모든 단계를 마쳤어요"}</p>
        <a class="btn" href="${next ? `#/step/${next.id}` : "#/explore"}">${next ? "계속하기" : "다시 보기"}</a></div>
    </div>`;
}

/* =========================================================
   화면: 탐색 단계 목록
   ========================================================= */

function renderExplore() {
  app.innerHTML = `
    <div class="eyebrow">Experience · 8 Steps</div>
    <h1 class="page-title">세분화된 8단계 탐색</h1>
    <p class="lead">순서대로 해도 좋고, 마음이 가는 단계부터 해도 괜찮아요. 응답은 바로 이 브라우저에 저장됩니다.</p>
    <div class="progress"><i style="width:${(doneCount() / STEPS.length) * 100}%"></i></div>
    <p class="small">${doneCount()} / ${STEPS.length} 단계 완료</p>
    <div class="step-list" style="margin-top:18px">
      ${STEPS.map((s) => {
        const locked = s.type === "direction" && !likertDone();
        const count = s.questions ? `${s.questions.length}문항` : s.type === "values" ? "가치 카드" : "모델 비교";
        return `<a class="card step-card ${isStepDone(s) ? "done" : ""} ${locked ? "locked" : ""}" href="#/step/${s.id}">
          <span class="num">${String(s.id).padStart(2, "0")}</span><h3>${s.title}</h3>
          <span class="muted">${s.desc}</span><span class="small">${count}${locked ? " · 성향 단계를 먼저 마쳐 주세요" : ""}</span></a>`;
      }).join("")}
    </div>`;
}

/* =========================================================
   화면: 단계 진행
   ========================================================= */

function stepper(current) {
  return `<nav class="stepper" aria-label="단계 진행">${STEPS.map((s) =>
    `<a href="#/step/${s.id}" class="${s.id === current ? "current" : isStepDone(s) ? "done" : ""}" title="${s.id}. ${s.title}" aria-label="${s.id}단계 ${s.title}"></a>`).join("")}</nav>`;
}

function notesFields(notes) {
  return notes.map((n) => `<label class="field"><span>${n.label}</span>
    <textarea rows="2" data-note="${n.key}" placeholder="${esc(n.placeholder)}">${esc(state.notes[n.key])}</textarea></label>`).join("");
}

function stepNav(step) {
  const prev = step.id > 1 ? `<a class="btn line" href="#/step/${step.id - 1}">← 이전</a>` : `<a class="btn line" href="#/explore">단계 목록</a>`;
  const nextLabel = step.id < STEPS.length ? "다음 단계 →" : "결과 보기 →";
  return `<div class="actions">${prev}<button class="btn" type="button" data-action="next-step" data-step="${step.id}">${nextLabel}</button></div>`;
}

function renderStep(id) {
  const step = STEPS.find((s) => s.id === id);
  if (!step) return renderExplore();
  const head = `${stepper(step.id)}<div class="eyebrow">Step ${step.id} / ${STEPS.length}</div>
    <h1 class="page-title">${step.title}</h1><p class="lead">${step.desc}</p>`;

  if (step.type === "likert") {
    app.innerHTML = `${head}
      <div class="card">
        ${step.questions.map((q, i) => `
          <fieldset class="question" style="border:0;margin:0;padding-left:0;padding-right:0">
            <div class="question-head"><p>${i + 1}. ${esc(q.text)}</p>${basisTag(q.basis)}</div>
            <div class="likert">${LIKERT.map((label, v) => `
              <label><input type="radio" name="q-${q.id}" value="${v + 1}" ${state.answers[q.id] === v + 1 ? "checked" : ""} data-question="${q.id}" /><span>${label}</span></label>`).join("")}
            </div>
          </fieldset>`).join("")}
        ${step.notes ? `<div style="margin-top:12px">${basisTag("reflect")}${notesFields(step.notes)}</div>` : ""}
      </div>
      ${stepNav(step)}`;
    return;
  }

  if (step.type === "values") {
    app.innerHTML = `${head}
      <div class="card">
        <h3>가장 중요한 가치를 3~5개 골라 주세요 <span class="pill" id="valueCount">${state.values.length} / 5</span></h3>
        <div class="value-cards">${VALUES.map((v) => `
          <button type="button" class="value-card" data-value="${v.id}" aria-pressed="${state.values.includes(v.id)}"><strong>${v.name}</strong><span>${v.desc}</span></button>`).join("")}
        </div>
      </div>
      <div class="card" style="margin-top:16px">${basisTag("reflect")}${notesFields(step.notes)}</div>
      ${stepNav(step)}`;
    return;
  }

  renderDirection(head);
}

function renderDirection(head) {
  if (!likertDone()) {
    const missing = STEPS.filter((s) => s.type === "likert" && !isStepDone(s));
    app.innerHTML = `${head}<div class="card empty"><div class="metric">🔒</div>
      <p>삶의 모델을 비교하려면 성향 단계를 먼저 마쳐 주세요.</p>
      <div class="actions" style="justify-content:center">${missing.map((s) => `<a class="btn line" href="#/step/${s.id}">${s.id}. ${s.title}</a>`).join("")}</div></div>`;
    return;
  }
  const scores = computeScores();
  const models = rankModels(scores);
  const exp = activeExperiment();
  app.innerHTML = `${head}
    <p class="quote">아래 모델은 정답이 아니라 <b>실험해 볼 수 있는 가설</b>입니다. 끌리는 것을 하나 골라 4주 동안 확인해 보세요.</p>
    ${exp ? `<div class="card" style="margin-bottom:16px"><b>진행 중인 실험이 있어요:</b> ${esc(exp.title)} · <a href="#/experiment">기록하러 가기</a></div>` : ""}
    <div class="grid grid-auto">
      ${models.map((m, i) => `
        <article class="card model-card ${i === 0 ? "picked" : ""}">
          <div class="match"><b>${m.match}</b><span class="small">적합도</span>${i < 3 ? `<span class="pill">추천 ${i + 1}</span>` : ""}</div>
          <h3>${m.name}</h3>
          <p class="muted">${esc(m.condition)}</p>
          <p class="small">가설: “${esc(m.hypothesis)}”</p>
          <ul>${m.actions.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
          ${m.overlap.length ? `<p class="small">겹치는 가치: ${m.overlap.map(valueName).join(", ")}</p>` : ""}
          <a class="btn ${i === 0 ? "" : "line"}" href="#/experiment/new/${m.id}">이 실험 설계하기</a>
        </article>`).join("")}
    </div>
    <p class="small">적합도 = 100 − (내 축 점수와 모델 기대 점수의 평균 차이) + 겹치는 가치 1개당 3점. 표본 기준이 없는 예비 계산입니다.</p>`;
}

/* =========================================================
   화면: 결과 리포트
   ========================================================= */

function renderResult() {
  if (!hasAnswers()) {
    app.innerHTML = `<div class="card empty"><div class="metric">🧭</div><p>아직 응답이 없어요. 첫 단계부터 시작해 볼까요?</p><a class="btn" href="#/step/1">탐색 시작하기</a></div>`;
    return;
  }
  const scores = computeScores();
  const consistency = computeConsistency();
  const bias = computeBias();
  const prev = state.snapshots[state.snapshots.length - 1];
  const models = rankModels(scores).slice(0, 3);
  const answered = Object.keys(state.answers).length;

  app.innerHTML = `
    <div class="eyebrow">Result Report</div>
    <h1 class="page-title">성향의 방향과 편향의 정도</h1>
    ${!likertDone() ? `<p class="quote">아직 답하지 않은 문항이 있어 결과가 불안정할 수 있어요. (${answered} / ${allQuestions().length}문항) <a href="#/explore">이어서 하기</a></p>` : ""}
    <div class="grid grid-2">
      <div class="card">${radarSVG(scores, prev?.scores)}
        <p class="small" style="text-align:center">중심에서 멀수록 해당 경향이 강합니다.${prev ? ` 점선은 ${prev.date} 저장 결과.` : ""}</p></div>
      <div class="card"><h3>축별 점수</h3>${axisRows(scores, { showRange: true })}
        <p class="small">연한 띠는 응답 변동 범위(문항 간 차이로 계산한 참고용 95% 범위)입니다. 띠가 넓을수록 같은 축 안에서도 답이 엇갈렸다는 뜻이에요.</p>
        <div class="grid grid-2" style="margin-top:12px">
          <div><div class="small">응답 일관성</div><div class="metric">${consistency ?? "–"}<small>%</small></div></div>
          <div><div class="small">응답 편향</div><div class="metric">${bias?.level ?? "–"}</div><div class="small">${bias?.note ?? ""}</div></div>
        </div></div>
    </div>

    <h2 style="margin-top:32px">현재 응답에서 나타난 경향</h2>
    <div class="grid grid-auto">
      ${AXES.map((a) => {
        const s = scores[a.id];
        if (!s) return "";
        const lv = levelOf(s.score);
        const text = s.score >= 60 ? a.high : s.score <= 40 ? a.low : "뚜렷한 편향이 적고 상황에 따라 유연하게 바뀔 수 있는 경향";
        return `<div class="card"><h3>${a.name} <span class="level ${lv.cls}">${s.score} · ${lv.text}</span></h3><p class="muted">${text}이 나타났어요.</p><p class="small">응답 ${s.answered} / ${s.total}문항 기준</p></div>`;
      }).join("")}
    </div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card"><h3>나의 핵심 가치</h3>
        ${state.values.length ? `<p>${state.values.map((v) => `<span class="pill">${valueName(v)}</span>`).join(" ")}</p>` : `<p class="muted">아직 고르지 않았어요. <a href="#/step/6">가치 카드 고르기</a></p>`}
        ${state.notes.keep ? `<p class="small"><b>포기하고 싶지 않은 것</b> · ${esc(state.notes.keep)}</p>` : ""}
        ${state.notes.wish ? `<p class="small"><b>원하는 삶</b> · ${esc(state.notes.wish)}</p>` : ""}
        ${state.notes.constraints ? `<p class="small"><b>현실 조건</b> · ${esc(state.notes.constraints)}</p>` : ""}
        ${state.notes.strength ? `<p class="small"><b>자연스러운 강점</b> · ${esc(state.notes.strength)}</p>` : ""}
        ${state.notes.struggle ? `<p class="small"><b>반복되는 어려움</b> · ${esc(state.notes.struggle)}</p>` : ""}</div>
      <div class="card"><h3>맞을 가능성이 높은 조건 Top 3</h3>
        ${models.map((m) => `<p><b>${m.name}</b> <span class="pill">${m.match}</span><br><span class="small">${esc(m.condition)}</span></p>`).join("")}
        <a class="btn" href="#/step/8">삶의 실험 고르기 →</a></div>
    </div>

    <div class="card" style="margin-top:16px"><h3>결과 기록</h3>
      <p class="small">지금 결과를 저장해 두면 몇 주 뒤 다시 응답했을 때 변화를 비교할 수 있어요. (레이더 차트의 점선)</p>
      <div class="actions"><button class="btn" type="button" data-action="snapshot">현재 결과 저장</button>
        <button class="btn line" type="button" data-action="retake">응답 지우고 다시 하기</button></div>
      ${state.snapshots.length ? `<div class="history" style="margin-top:12px">${state.snapshots.slice().reverse().map((s, i) => `
        <div><span>${s.date}</span><span class="small">${AXES.map((a) => `${a.name} ${s.scores[a.id] ?? "–"}`).join(" · ")}</span>
        <button class="btn ghost" type="button" data-action="delete-snapshot" data-index="${state.snapshots.length - 1 - i}">삭제</button></div>`).join("")}</div>` : ""}
    </div>
    <p class="small">차트는 진단이나 능력의 우열이 아니라 응답 경향을 표현합니다. 현재는 표본 기준(규준)이 없는 예비 버전이에요. <a href="#/trust">근거와 한계 보기</a></p>`;
}

/* =========================================================
   화면: 삶의 실험
   ========================================================= */

function renderNewExperiment(modelId) {
  const model = LIFE_MODELS.find((m) => m.id === modelId) || LIFE_MODELS[0];
  const exp = activeExperiment();
  app.innerHTML = `
    <div class="eyebrow">Action Experiment · 설계</div>
    <h1 class="page-title">${model.name} 실험 설계</h1>
    <p class="lead">가설과 행동을 내 상황에 맞게 고쳐 주세요. 작고, 4주 동안 지킬 수 있을 만큼이 좋아요.</p>
    ${exp ? `<p class="quote">진행 중인 실험(${esc(exp.title)})이 있어요. 새 실험을 시작하면 기존 실험은 ‘중단’으로 정리됩니다.</p>` : ""}
    ${state.notes.constraints ? `<p class="small">내가 적은 현실 조건 · ${esc(state.notes.constraints)}</p>` : ""}
    <form class="card" id="newExperiment">
      <input type="hidden" name="modelId" value="${model.id}" />
      <label class="field"><span>실험 이름</span><input type="text" name="title" value="${esc(model.name)} 4주 실험" required /></label>
      <label class="field"><span>01 · 가설</span><textarea name="hypothesis" rows="2" required>${esc(model.hypothesis)}</textarea></label>
      <label class="field"><span>02 · 4주 동안 할 행동 (한 줄에 하나)</span><textarea name="actions" rows="4" required>${esc(model.actions.join("\n"))}</textarea></label>
      <label class="field"><span>시작일</span><input type="date" name="start" value="${todayStr()}" required /></label>
      <p class="small">03 · 매일 몰입도·회복감·스트레스·지속 가능성을 1~10점으로 기록하고, 04 · 4주 뒤 유지·수정·중단을 정합니다.</p>
      <div class="actions"><a class="btn line" href="#/step/8">← 다른 모델 보기</a><button class="btn" type="submit">실험 시작하기</button></div>
    </form>`;
}

function renderExperiment() {
  const exp = activeExperiment();
  const past = state.experiments.filter((e) => e.status !== "active").slice().reverse();
  const pastHtml = past.length ? `
    <h2 style="margin-top:32px">지난 실험</h2>
    <div class="grid grid-auto">${past.map((e) => {
      const decision = { keep: "유지", modify: "수정", drop: "중단" }[e.reflection?.decision] || "중단";
      const rec = avg(e.logs.map((l) => l.recovery));
      return `<div class="card"><h3>${esc(e.title)} <span class="pill">${decision}</span></h3>
        <p class="small">${e.start} 시작 · 기록 ${e.logs.length}회 · 평균 회복감 ${rec != null ? Math.round(rec * 10) : "–"}</p>
        <p class="muted">“${esc(e.hypothesis)}”</p>
        ${e.reflection?.note ? `<p class="small">회고 · ${esc(e.reflection.note)}</p>` : ""}</div>`;
    }).join("")}</div>` : "";

  if (!exp) {
    app.innerHTML = `
      <div class="eyebrow">Action Experiment</div>
      <h1 class="page-title">결과를 삶으로 검증합니다</h1>
      <div class="grid grid-auto">
        <div class="card"><div class="metric" style="color:var(--accent)">01</div><h3>가설 선택</h3><p class="muted">나에게 맞을 것 같은 삶의 조건을 하나 고릅니다.</p></div>
        <div class="card"><div class="metric" style="color:var(--accent)">02</div><h3>4주 실험</h3><p class="muted">작고 측정 가능한 행동을 정해 실천합니다.</p></div>
        <div class="card"><div class="metric" style="color:var(--accent)">03</div><h3>기록</h3><p class="muted">몰입도·회복감·스트레스·지속 가능성을 간단히 남깁니다.</p></div>
        <div class="card"><div class="metric" style="color:var(--accent)">04</div><h3>재해석</h3><p class="muted">결과를 유지하거나 수정하고 다음 실험을 고릅니다.</p></div>
      </div>
      <div class="card empty" style="margin-top:16px"><p>진행 중인 실험이 없어요.</p>
        <a class="btn" href="#/step/8">삶의 모델 보고 실험 고르기</a></div>
      ${pastHtml}`;
    return;
  }

  const day = clamp(daysBetween(exp.start, todayStr()) + 1, 0, 999);
  const week = clamp(Math.ceil(day / 7), 1, 4);
  const todayLog = exp.logs.find((l) => l.date === todayStr());
  const weekly = [1, 2, 3, 4].map((w) => {
    const logs = exp.logs.filter((l) => { const d = daysBetween(exp.start, l.date); return d >= (w - 1) * 7 && d < w * 7; });
    return { w, recovery: avg(logs.map((l) => l.recovery)), count: logs.length };
  });
  const ended = day > EXPERIMENT_DAYS;
  const metricAvg = (key) => { const v = avg(exp.logs.map((l) => l[key])); return v == null ? "–" : v.toFixed(1); };

  app.innerHTML = `
    <div class="eyebrow">Action Experiment · ${day < 1 ? "시작 전" : ended ? "기간 종료" : `${week}주차`}</div>
    <h1 class="page-title">${esc(exp.title)}</h1>
    <p class="quote">“${esc(exp.hypothesis)}”</p>
    <div class="grid grid-3">
      <div class="card span-2"><h3>진행</h3>
        <div class="metric">${day < 1 ? 0 : Math.min(day, EXPERIMENT_DAYS)}<small> / ${EXPERIMENT_DAYS}일</small></div>
        <div class="progress"><i style="width:${clamp((day / EXPERIMENT_DAYS) * 100, 0, 100)}%"></i></div>
        <p class="small">${exp.start} 시작 · 기록 ${exp.logs.length}회</p>
        <h3 style="margin-top:16px">실천할 행동</h3>
        <ul class="plain-list">${exp.actions.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></div>
      <div class="card"><h3>주차별 회복감</h3>
        <div class="mini-bars">${weekly.map((w) => `<div><i style="height:${(w.recovery ?? 0) * 10}%"></i><span>${w.w}주 ${w.recovery != null ? Math.round(w.recovery * 10) : "–"}</span></div>`).join("")}</div>
        <p class="small" style="margin-top:10px">${LOG_METRICS.map((m) => `${m.name} ${metricAvg(m.key)}`).join(" · ")} (평균, 10점 만점)</p></div>
    </div>

    <form class="card" id="logForm" style="margin-top:16px">
      <h3>${todayLog ? "오늘 기록 고치기" : "오늘 기록하기"}</h3>
      <label class="field"><span>날짜</span><input type="date" name="date" value="${todayStr()}" max="${todayStr()}" /></label>
      ${LOG_METRICS.map((m) => {
        const v = todayLog?.[m.key] ?? 5;
        return `<div class="slider-row"><label for="m-${m.key}">${m.name}</label>
          <input type="range" id="m-${m.key}" name="${m.key}" min="1" max="10" value="${v}" data-output="o-${m.key}" />
          <output id="o-${m.key}">${v}</output></div>`;
      }).join("")}
      <label class="field"><span>한 줄 메모</span><input type="text" name="note" value="${esc(todayLog?.note)}" placeholder="예: 오전 몰입 블록 2시간 성공, 오후엔 회의로 지침" /></label>
      <div class="actions"><button class="btn" type="submit">기록 저장</button></div>
    </form>

    ${exp.logs.length ? `<div class="card" style="margin-top:16px"><h3>기록</h3><div class="table-wrap"><table class="log-table">
      <thead><tr><th>날짜</th>${LOG_METRICS.map((m) => `<th>${m.name}</th>`).join("")}<th>메모</th><th></th></tr></thead>
      <tbody>${exp.logs.slice().sort((a, b) => b.date.localeCompare(a.date)).map((l) => `<tr><td>${l.date}</td>${LOG_METRICS.map((m) => `<td>${l[m.key]}</td>`).join("")}<td>${esc(l.note)}</td>
        <td><button class="btn ghost" type="button" data-action="delete-log" data-date="${l.date}" aria-label="${l.date} 기록 삭제">✕</button></td></tr>`).join("")}</tbody>
    </table></div></div>` : ""}

    <form class="card" id="reflectForm" style="margin-top:16px">
      <h3>재해석 ${ended ? `<span class="pill">4주가 지났어요</span>` : `<span class="small">· 4주 전에도 언제든 정리할 수 있어요</span>`}</h3>
      <p class="small">기록을 보고 가설이 맞았는지 돌아보세요. 회복감과 지속 가능성이 높았다면 유지, 일부만 맞았다면 수정, 맞지 않았다면 중단하고 다른 모델을 실험해 보세요.</p>
      <div class="choice-row">
        <label><input type="radio" name="decision" value="keep" required /> 유지 — 이 조건이 나에게 맞다</label>
        <label><input type="radio" name="decision" value="modify" /> 수정 — 일부만 맞다</label>
        <label><input type="radio" name="decision" value="drop" /> 중단 — 맞지 않는다</label>
      </div>
      <label class="field"><span>회고 메모</span><textarea name="note" rows="2" placeholder="예: 몰입 시간은 좋았지만 혼자 있는 시간이 길어지면 외로움이 컸다"></textarea></label>
      <div class="actions"><button class="btn line" type="submit">실험 마무리하기</button></div>
    </form>
    ${pastHtml}`;
}

/* =========================================================
   화면: 근거·안내
   ========================================================= */

function renderTrust() {
  const questions = allQuestions();
  const counts = Object.keys(BASIS).map((k) => [k, questions.filter((q) => q.basis === k).length]);
  app.innerHTML = `
    <div class="eyebrow">Assessment Model · Trust</div>
    <h1 class="page-title">근거의 층위를 구분합니다</h1>
    <div class="grid grid-auto">
      <div class="card">${basisTag("research")}<h3 style="margin-top:10px">검증된 성격·기질 개념</h3><p class="muted">Big Five, 기질 연구, 가치관 연구의 공개된 개념을 참고해 문항을 작성했습니다. 원 척도를 그대로 쓴 것은 아니므로 원 척도의 신뢰도가 그대로 적용되지는 않습니다.</p></div>
      <div class="card">${basisTag("prelim")}<h3 style="margin-top:10px">자체 문항 검증</h3><p class="muted">자체 문항은 시범 표본으로 문항 변별도, 내적 일관성, 재검사 신뢰도를 분석할 예정입니다. 현재는 검증 전입니다.</p></div>
      <div class="card">${basisTag("reflect")}<h3 style="margin-top:10px">개인화 해석</h3><p class="muted">점수와 가치·현실 조건을 연결해 질문과 행동 실험을 제안합니다. 판단의 근거가 아니라 성찰의 재료입니다.</p></div>
    </div>
    <p class="quote">“당신의 본질은 이것”이 아니라 “현재 응답에서 이런 경향이 나타났으며, 이 조건을 실험해볼 수 있다”라고 안내합니다.</p>

    <div class="grid grid-2">
      <div class="card"><h3>안전장치</h3><ul class="plain-list">
        <li>Life Compass는 <b>임상 진단 도구가 아닙니다.</b> 우울·불안 등 정신건강 상태를 판단하지 않습니다.</li>
        <li>진로·관계·이사 같은 중요한 결정을 단정하지 않습니다. 결과는 실험할 가설일 뿐입니다.</li>
        <li>마음이 많이 힘들거나 일상이 어렵다면 전문가와 이야기해 주세요. 자살예방상담 <a href="tel:109">109</a>, 정신건강위기상담 <a href="tel:15770199">1577-0199</a> (24시간)</li>
      </ul></div>
      <div class="card"><h3>해석의 한계</h3><ul class="plain-list">
        <li>표본 기준(규준)이 없어 점수는 “다른 사람과 비교한 위치”가 아니라 내 응답의 평균입니다.</li>
        <li>축마다 문항이 5개뿐이라 그날의 기분에 따라 결과가 달라질 수 있어요.</li>
        <li>응답 변동 범위는 문항 간 차이로 계산한 참고값이며 통계적 신뢰구간과 다릅니다.</li>
        <li>삶의 모델 적합도는 규칙 기반 예비 계산입니다.</li>
      </ul></div>
    </div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card"><h3>검증 계획</h3><ul class="plain-list">
        <li>시범 응답자 100~300명 모집</li><li>문항 분석: 변별도·내적 일관성(Cronbach α)</li>
        <li>2~4주 간격 재검사 신뢰도</li><li>관련 척도와의 수렴·변별 타당도 검토</li><li>전문가 감수 후 문항 수정 이력 공개</li></ul></div>
      <div class="card"><h3>수정 이력</h3><div class="history">${CHANGELOG.map((c) => `<div><b>${c.version}</b><span class="small">${c.date}</span><span class="small">${esc(c.note)}</span></div>`).join("")}</div>
        <p class="small" style="margin-top:10px">현재 문항 ${questions.length}개 · ${counts.map(([k, n]) => `${BASIS[k].label} ${n}`).join(" · ")} · 표본 수 0 (검증 전)</p></div>
    </div>

    <div class="card" style="margin-top:16px"><h3>문항 출처</h3><div class="table-wrap"><table class="log-table">
      <thead><tr><th>단계</th><th>문항</th><th>축</th><th>근거</th><th>참고 개념</th></tr></thead>
      <tbody>${STEPS.filter((s) => s.questions).flatMap((s) => s.questions.map((q) => `<tr><td>${s.id}. ${s.title}</td><td>${esc(q.text)}${q.reverse ? ` <span class="small">(역채점)</span>` : ""}</td><td>${axisName(q.axis)}</td><td>${basisTag(q.basis)}</td><td class="small">${esc(q.ref)}</td></tr>`)).join("")}</tbody>
    </table></div></div>

    <div class="card" style="margin-top:16px"><h3>내 데이터</h3>
      <p class="muted">모든 응답과 기록은 서버로 보내지 않고 <b>이 브라우저(localStorage)에만</b> 저장됩니다. 다른 기기로 옮기려면 내보내기·가져오기를 쓰세요.</p>
      <div class="actions">
        <button class="btn line" type="button" data-action="export">JSON 내보내기</button>
        <label class="btn line" style="cursor:pointer">JSON 가져오기<input type="file" accept="application/json,.json" id="importFile" hidden /></label>
        <button class="btn danger" type="button" data-action="reset">모든 데이터 지우기</button>
      </div>
      <p class="small">기획서: <a href="./life-compass-webapp-plan.html">Life Compass 웹앱 개발 기획서</a></p></div>`;
}

/* =========================================================
   라우터
   ========================================================= */

function route() {
  const parts = (location.hash.replace(/^#\/?/, "") || "home").split("/");
  const [page, a, b] = parts;
  const tab = page === "step" ? "explore" : page;
  $$(".tabs a").forEach((link) => link.classList.toggle("active", link.dataset.route === tab));

  if (page === "intro") renderLanding();
  else if (page === "explore") renderExplore();
  else if (page === "step") renderStep(Number(a));
  else if (page === "result") renderResult();
  else if (page === "experiment" && a === "new") renderNewExperiment(b);
  else if (page === "experiment") renderExperiment();
  else if (page === "trust") renderTrust();
  else renderHome();

  app.classList.toggle("wide", !!$(".hero", app));
  updateBrandStatus();
  window.scrollTo(0, 0);
}

/* =========================================================
   이벤트
   ========================================================= */

function setupEvents() {
  app.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.question) {
      state.answers[t.dataset.question] = Number(t.value);
      saveState();
    }
    if (t.id === "importFile" && t.files[0]) importData(t.files[0]);
  });

  app.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.note) {
      state.notes[t.dataset.note] = t.value;
      saveState();
    }
    if (t.dataset.output) $("#" + t.dataset.output).textContent = t.value;
  });

  app.addEventListener("click", (e) => {
    const valueBtn = e.target.closest("[data-value]");
    if (valueBtn) return toggleValue(valueBtn);
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === "scroll") $(btn.dataset.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (action === "stats-scroll") {
      const track = $("#statsTrack");
      const card = $(".stat-card", track);
      const before = track.scrollLeft;
      const left = Number(btn.dataset.dir) * (card.offsetWidth + 16);
      track.scrollBy({ left, behavior: "smooth" });
      // 부드러운 스크롤이 꺼진 환경에서는 바로 이동
      setTimeout(() => { if (track.scrollLeft === before) track.scrollBy({ left }); }, 400);
    }
    if (action === "next-step") {
      const step = STEPS.find((s) => s.id === Number(btn.dataset.step));
      if (step.type === "likert" && !isStepDone(step)) {
        const first = step.questions.find((q) => state.answers[q.id] == null);
        toast("아직 답하지 않은 문항이 있어요.");
        $(`input[name="q-${first.id}"]`)?.closest("fieldset").scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (step.type === "values" && state.values.length < 3) return toast("가치를 3개 이상 골라 주세요.");
      location.hash = step.id < STEPS.length ? `#/step/${step.id + 1}` : "#/result";
    }
    if (action === "snapshot") {
      const scores = computeScores();
      state.snapshots.push({ date: todayStr(), scores: Object.fromEntries(AXES.map((a) => [a.id, scores[a.id]?.score ?? null])), consistency: computeConsistency() });
      saveState();
      toast("현재 결과를 저장했어요.");
      renderResult();
    }
    if (action === "delete-snapshot") {
      state.snapshots.splice(Number(btn.dataset.index), 1);
      saveState();
      renderResult();
    }
    if (action === "retake") {
      if (!confirm("성향 문항 응답을 지우고 다시 할까요? 저장한 결과·가치·실험 기록은 남습니다.")) return;
      if (!state.snapshots.length && confirm("저장한 결과가 없어요. 지우기 전에 현재 결과를 저장할까요?")) {
        const scores = computeScores();
        state.snapshots.push({ date: todayStr(), scores: Object.fromEntries(AXES.map((a) => [a.id, scores[a.id]?.score ?? null])), consistency: computeConsistency() });
      }
      state.answers = {};
      saveState();
      location.hash = "#/step/1";
    }
    if (action === "delete-log") {
      const exp = activeExperiment();
      exp.logs = exp.logs.filter((l) => l.date !== btn.dataset.date);
      saveState();
      renderExperiment();
    }
    if (action === "export") exportData();
    if (action === "reset") {
      if (!confirm("모든 응답·결과·실험 기록을 지울까요? 되돌릴 수 없어요.")) return;
      state = emptyState();
      saveState();
      toast("모든 데이터를 지웠어요.");
      location.hash = "#/home";
    }
  });

  app.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));

    if (form.id === "newExperiment") {
      const current = activeExperiment();
      if (current) {
        current.status = "done";
        current.reflection = { decision: "drop", note: "새 실험을 시작하며 중단", date: todayStr() };
      }
      state.experiments.push({
        id: Date.now().toString(36),
        modelId: data.modelId,
        title: data.title.trim(),
        hypothesis: data.hypothesis.trim(),
        actions: data.actions.split("\n").map((s) => s.trim()).filter(Boolean),
        start: data.start,
        logs: [],
        status: "active",
      });
      saveState();
      toast("4주 실험을 시작했어요!");
      location.hash = "#/experiment";
    }

    if (form.id === "logForm") {
      const exp = activeExperiment();
      const entry = { date: data.date || todayStr(), note: data.note.trim() };
      LOG_METRICS.forEach((m) => (entry[m.key] = Number(data[m.key])));
      exp.logs = exp.logs.filter((l) => l.date !== entry.date).concat(entry);
      saveState();
      toast(`${entry.date} 기록을 저장했어요.`);
      renderExperiment();
    }

    if (form.id === "reflectForm") {
      const exp = activeExperiment();
      exp.status = "done";
      exp.reflection = { decision: data.decision, note: data.note.trim(), date: todayStr() };
      saveState();
      toast("실험을 마무리했어요. 다음 실험을 골라 보세요.");
      location.hash = data.decision === "keep" ? "#/experiment" : "#/step/8";
    }
  });
}

function toggleValue(btn) {
  const id = btn.dataset.value;
  if (state.values.includes(id)) state.values = state.values.filter((v) => v !== id);
  else if (state.values.length >= 5) return toast("가치는 5개까지 고를 수 있어요.");
  else state.values.push(id);
  btn.setAttribute("aria-pressed", state.values.includes(id));
  $("#valueCount").textContent = `${state.values.length} / 5`;
  saveState();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `life-compass-${todayStr()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (typeof data !== "object" || !data.answers) throw new Error("형식 오류");
      if (!confirm("가져온 데이터로 현재 데이터를 바꿀까요?")) return;
      state = { ...emptyState(), ...data };
      saveState();
      toast("데이터를 가져왔어요.");
      location.hash = "#/home";
    } catch {
      toast("Life Compass에서 내보낸 JSON 파일이 아니에요.");
    }
  };
  reader.readAsText(file);
}

function setupTheme() {
  let savedTheme = "light";
  try {
    savedTheme = localStorage.getItem(THEME_KEY) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  } catch {}
  const apply = (theme) => {
    document.documentElement.dataset.theme = theme;
    $("#themeIcon").textContent = theme === "dark" ? "☀" : "☾";
  };
  apply(savedTheme);

  $("#themeToggle").addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    apply(nextTheme);
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch {}
  });
}

setupTheme();
setupEvents();
window.addEventListener("hashchange", route);
route();
