// 점수 엔진 규칙표 + 풀이 문구. 기획서 "해석 엔진 로직"을 숫자로 옮긴 초안이다.
// 출시 전 명리 전문가 검수로 숫자·문구를 보정한다(기획서). 고칠 때는 이 파일만 바꾼다.
//
// 원칙: 용신에 가까울수록 높고 기신에 가까울수록 낮다. 0~100점.

// 오행 역할별 값. 용신 1, 희신 0.6, 한신(중립) 0, 기신 -0.8
export const ROLE_VALUE = { yong: 1, hee: 0.6, neutral: 0, gi: -0.8 };
export const ROLE_NAME = { yong: "용신", hee: "희신", neutral: "한신", gi: "기신" };

// 오행이 용신·희신일 때 쉬운 말 (ELEMENTS 순번)
export const ELEMENT_DESC = [
  "막힌 기운을 풀어주는 목(木)",
  "몸을 데워주는 화(火)",
  "중심을 잡아주는 토(土)",
  "단단하게 다듬어주는 금(金)",
  "열을 식혀주는 수(水)",
];

export const SCORE = {
  center: 52, // 용신·기신이 없는 시기의 기본 점수
  spread: 34, // 기본 점수 폭 (천간·지지 값 -1~1 → ±34점)
  stemWeight: 0.4, // 천간 40%
  branchWeight: 0.6, // 지지 60%
  domainSpread: 14, // 영역 가중치 폭
  stemCombineBonus: 8, // 천간합으로 용신이 생기면(무계합화 등) 가점
  min: 8,
  max: 97,
};

// 지장간 비중: 2개면 [여기, 정기], 3개면 [여기, 중기, 정기]
export const HIDDEN_WEIGHT = { 2: [0.3, 0.7], 3: [0.15, 0.25, 0.6] };

// 신강·신약을 볼 때 자리별 무게. 월지(월령)가 가장 크다
export const STRENGTH_WEIGHT = { yearStem: 1, monthStem: 1, hourStem: 1, yearBranch: 1, monthBranch: 3, dayBranch: 1.5, hourBranch: 1 };

// 조후: 월지 계절별로 필요한 오행 (ELEMENTS 순번 0목 1화 2토 3금 4수)
export const JOHU = {
  winter: { branches: [11, 0, 1], element: 1, label: "겨울", need: "몸을 데워주는 화(火)" },
  summer: { branches: [5, 6, 7], element: 4, label: "여름", need: "열을 식혀주는 수(水)" },
};

// 지지 육합 · 충 (BRANCHES 순번 쌍)
export const BRANCH_HARMONY = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
export const BRANCH_CLASH = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]];
// 천간합 → 합화 오행: 甲己土 乙庚金 丙辛水 丁壬木 戊癸火
export const STEM_COMBINE = [[0, 5, 2], [1, 6, 3], [2, 7, 4], [3, 8, 0], [4, 9, 1]];
// 도화: 일지 삼합 그룹 → 도화 지지
export const PEACH = { 8: 9, 0: 9, 4: 9, 2: 3, 6: 3, 10: 3, 5: 6, 9: 6, 1: 6, 11: 0, 3: 0, 7: 0 };

// 영역. plus/minus는 십신별 가중치(-1~1), F/M은 성별에 따라 다른 가중치.
// harmony/clash: 시기 지지가 일지(배우자궁)·시지(자녀궁)와 합하면 가점, 충하면 감점 (점수)
export const DOMAINS = [
  {
    id: "total", name: "종합", short: "종합", color: "accent",
    plus: {}, minus: {},
    dayHarmony: 3, dayClash: -4,
  },
  {
    id: "wealth", name: "재물운", short: "재물", color: "earth",
    plus: { 편재: 1, 정재: 1, 식신: 0.5, 상관: 0.4 }, minus: { 겁재: 1, 비견: 0.6 },
    dayHarmony: 2, dayClash: -3,
  },
  {
    id: "love", name: "연애운", short: "연애", color: "fire",
    plusF: { 정관: 1, 편관: 0.8 }, plusM: { 정재: 1, 편재: 0.8 },
    minusF: { 상관: 0.8 }, minusM: { 겁재: 0.6 },
    peach: 8, dayHarmony: 4, dayClash: -5,
  },
  {
    id: "spouse", name: "배우자", short: "배우자", color: "metal",
    plusF: { 정관: 0.8 }, plusM: { 정재: 0.8 }, minusF: { 상관: 0.6 }, minusM: { 겁재: 0.6 },
    dayHarmony: 10, dayClash: -14,
  },
  {
    id: "children", name: "자식운", short: "자식", color: "wood",
    plusF: { 식신: 1, 상관: 0.8 }, plusM: { 편관: 1, 정관: 0.8 }, minus: { 편인: 1 },
    hourHarmony: 8, hourClash: -10,
  },
  {
    id: "career", name: "직업운", short: "직업", color: "water",
    plus: { 정관: 1, 편관: 0.7, 식신: 0.5, 정인: 0.6, 편인: 0.4 }, minus: { 겁재: 0.6, 상관: 0.5 },
    dayHarmony: 2, dayClash: -3,
  },
  {
    id: "mind", name: "마음", short: "마음", color: "accent",
    plus: { 식신: 0.8, 상관: 0.5, 정인: 0.2 }, minus: { 편인: 0.8, 비견: 0.3 },
    johu: 8, dayHarmony: 2, dayClash: -4,
  },
];

// 점수 구간 → 시기 이름 · 짧은 표현
export const BANDS = [
  { min: 80, name: "전성기", phrase: "가장 힘이 실리는 시기", tone: "best" },
  { min: 65, name: "상승", phrase: "흐름이 좋은 시기", tone: "good" },
  { min: 50, name: "다지기", phrase: "무난하게 다지는 시기", tone: "normal" },
  { min: 38, name: "정비", phrase: "속도를 줄이고 지키는 시기", tone: "care" },
  { min: 0, name: "쉼", phrase: "쉬어 가며 정비하는 시기", tone: "rest" },
];

// 십신이 들어올 때 대운·세운 풀이 키워드
export const GOD_THEME = {
  비견: "동료·독립", 겁재: "경쟁·지출", 식신: "재능·먹거리", 상관: "표현·변화",
  편재: "사업·큰돈", 정재: "월급·저축", 편관: "도전·책임", 정관: "자리·인정",
  편인: "공부·직관", 정인: "배움·도움",
};

// 십성 5그룹 (아이콘 보기 · 직업 풀이)
export const GOD_GROUPS = [
  { id: "self", name: "비겁", gods: ["비견", "겁재"], meaning: "나·동료", icon: "user" },
  { id: "output", name: "식상", gods: ["식신", "상관"], meaning: "표현·재능", icon: "sparkle" },
  { id: "wealth", name: "재성", gods: ["편재", "정재"], meaning: "재물·결과", icon: "coin" },
  { id: "power", name: "관성", gods: ["편관", "정관"], meaning: "직장·책임", icon: "briefcase" },
  { id: "resource", name: "인성", gods: ["편인", "정인"], meaning: "배움·돌봄", icon: "book" },
];

// 일간 본질 (아이콘 보기 · 기질 리포트 제목)
export const DAY_MASTER = [
  { image: "곧게 뻗는 큰 나무", desc: "한번 정한 방향으로 꾸준히 자라요. 앞장서서 길을 여는 힘이 있어요.", keywords: ["추진력", "성장", "곧은 마음"] },
  { image: "바람에 휘어도 꺾이지 않는 풀꽃", desc: "부드럽게 어울리면서도 끝까지 버텨요. 사람 사이를 잇는 재주가 있어요.", keywords: ["유연함", "끈기", "친화력"] },
  { image: "세상을 비추는 한낮의 태양", desc: "밝고 솔직해서 주변을 환하게 만들어요. 숨기지 않고 드러내는 편이에요.", keywords: ["열정", "솔직함", "표현력"] },
  { image: "어둠을 밝히는 따뜻한 촛불", desc: "섬세하고 정이 많아요. 한 번 품은 열정을 오래 지켜요.", keywords: ["섬세함", "따뜻함", "집중력"] },
  { image: "모두를 품는 넓은 산", desc: "묵직하고 믿음직해요. 쉽게 흔들리지 않고 중심을 잡아요.", keywords: ["신뢰", "포용력", "뚝심"] },
  { image: "씨앗을 키우는 기름진 밭", desc: "실속 있고 꼼꼼해요. 사람과 일을 길러 내는 힘이 있어요.", keywords: ["실속", "돌봄", "꼼꼼함"] },
  { image: "단단하게 벼려진 바위", desc: "결단이 빠르고 의리가 있어요. 맺고 끊음이 분명해요.", keywords: ["결단력", "의리", "원칙"] },
  { image: "갈고닦아 빛나는 보석", desc: "기준이 높고 감각이 예민해요. 다듬을수록 빛나는 사람이에요.", keywords: ["완벽주의", "감각", "자존심"] },
  { image: "멀리 흐르는 큰 강", desc: "생각이 넓고 지혜로워요. 막히면 돌아서라도 끝내 나아가요.", keywords: ["지혜", "포용", "자유로움"] },
  { image: "조용히 스며드는 새벽 이슬", desc: "차분하고 생각이 깊어요. 드러나지 않게 주변을 적셔 주는 사람이에요.", keywords: ["차분함", "통찰", "배려"] },
];

// 맞는 직종: gods(십신 보유 가중치) + elements(오행이 용신·희신일 때 가중치, ELEMENTS 순번)
export const JOBS = [
  { name: "교육·강의", gods: { 정인: 1, 편인: 0.6, 식신: 0.8, 상관: 0.5 }, elements: { 0: 0.6, 1: 0.4 } },
  { name: "상담·심리", gods: { 정인: 0.8, 편인: 0.9, 식신: 0.6 }, elements: { 4: 0.6, 0: 0.3 } },
  { name: "의료·보건·돌봄", gods: { 편인: 0.8, 정인: 0.6, 편관: 0.5 }, elements: { 0: 0.5, 4: 0.4 } },
  { name: "공무원·행정", gods: { 정관: 1, 정인: 0.8, 편관: 0.4 }, elements: { 3: 0.5, 2: 0.3 } },
  { name: "금융·회계", gods: { 정재: 1, 정관: 0.5, 편재: 0.4 }, elements: { 3: 0.5, 4: 0.3 } },
  { name: "영업·마케팅", gods: { 편재: 1, 상관: 0.8, 식신: 0.5, 겁재: 0.3 }, elements: { 1: 0.6 } },
  { name: "요식·뷰티", gods: { 식신: 1, 상관: 0.6 }, elements: { 1: 0.4, 2: 0.4 } },
  { name: "IT·기술", gods: { 편인: 0.6, 상관: 0.6, 편관: 0.5 }, elements: { 3: 0.5, 4: 0.4 } },
  { name: "부동산·건설", gods: { 편재: 0.7, 정재: 0.6, 비견: 0.3 }, elements: { 2: 0.8 } },
  { name: "예술·디자인", gods: { 상관: 1, 식신: 0.6, 편인: 0.5 }, elements: { 1: 0.4, 0: 0.4 } },
];

// 맞는 직장 유형: group은 GOD_GROUPS id. 대운의 십신이 이 그룹이면 그 시기에 잘 맞는다
export const WORKPLACES = [
  { name: "안정된 기관·회사", group: "power" },
  { name: "전문 기술·연구", group: "resource" },
  { name: "강의·프리랜서", group: "output" },
  { name: "내 가게·사업", group: "wealth" },
  { name: "동업·팀 프로젝트", group: "self" },
];

// 추천 자격증 (job은 JOBS 이름). 분야 색은 직종 순서를 따른다
export const CERTIFICATES = [
  { name: "요양보호사", job: "의료·보건·돌봄", desc: "교육 240시간, 돌봄 기관 수요가 많아요" },
  { name: "사회복지사 2급", job: "상담·심리", desc: "복지기관·센터로 넓게 쓰여요" },
  { name: "직업상담사 2급", job: "상담·심리", desc: "고용센터·취업지원 기관에서 일해요" },
  { name: "평생교육사", job: "교육·강의", desc: "문화센터·평생학습관 강의 기획" },
  { name: "방과후지도사", job: "교육·강의", desc: "아이들 방과후 수업 강사" },
  { name: "전산회계 1급", job: "금융·회계", desc: "사무·경리 일자리의 기본 자격" },
  { name: "행정사", job: "공무원·행정", desc: "서류·인허가 대행으로 독립 가능" },
  { name: "공인중개사", job: "부동산·건설", desc: "나이 제한 없이 개업할 수 있어요" },
  { name: "한식조리기능사", job: "요식·뷰티", desc: "창업·단체급식 일자리" },
  { name: "컴퓨터활용능력 2급", job: "IT·기술", desc: "사무직 지원 시 기본 자격" },
  { name: "SNS마케팅 실무", job: "영업·마케팅", desc: "작은 가게·1인 사업 홍보" },
  { name: "컬러리스트 산업기사", job: "예술·디자인", desc: "색채 감각을 일로 바꾸는 자격" },
];

// 영역 × 점수 구간별 "지금 할 일" (high: 65↑, mid: 45~64, low: 45 미만)
export const ACTIONS = {
  total: {
    high: "미뤄 둔 큰 결정을 이번 시기에 해 보세요. 사람을 만나는 자리에 적극적으로 나가세요.",
    mid: "새로 벌이기보다 지금 하는 일을 정리하고 다지기 좋은 때예요.",
    low: "무리한 확장은 쉬고, 건강·생활 리듬부터 챙기세요.",
  },
  wealth: {
    high: "들어온 돈의 용도를 먼저 나눠 두세요. 투자라면 이유 · 세금 · 자금 용도를 스스로 점검해 보세요.",
    mid: "고정 지출을 한 번 정리하면 남는 돈이 보여요.",
    low: "큰 지출·보증·빌려주기는 미루고, 비상금을 지키세요.",
  },
  love: {
    high: "소개·모임 자리를 피하지 마세요. 먼저 연락해도 좋은 때예요.",
    mid: "가까운 사람과의 약속을 꾸준히 이어 가세요.",
    low: "서두르지 말고, 나를 돌보는 시간을 먼저 가지세요.",
  },
  spouse: {
    high: "미뤄 둔 대화를 꺼내기 좋은 때예요. 함께하는 계획을 세워 보세요.",
    mid: "작은 고마움을 말로 표현해 보세요.",
    low: "예민한 이야기는 날을 골라서 하고, 한 박자 쉬어 가세요.",
  },
  children: {
    high: "자녀와 함께하는 일정을 잡아 보세요. 좋은 소식이 들리기 쉬워요.",
    mid: "자녀의 이야기를 끝까지 들어 주는 것만으로 충분해요.",
    low: "걱정은 잔소리 대신 응원으로 바꿔 전해 보세요.",
  },
  career: {
    high: "지원서·면접·제안은 이 시기에 내세요. 자격증 시험 접수도 좋아요.",
    mid: "배우고 준비하는 시간으로 쓰세요. 경력을 정리해 두면 좋아요.",
    low: "지금 자리를 지키며 다음 기회를 위한 공부를 하세요.",
  },
  mind: {
    high: "새로운 모임·취미를 시작하기 좋은 때예요.",
    mid: "햇볕 아래 걷기, 가벼운 운동으로 기운을 밖으로 내보내세요.",
    low: "혼자 버티지 마세요. 가까운 사람이나 상담 기관에 이야기해 보세요.",
  },
};

// 실천 가이드: 결정이 걸린 리포트 하단 안내 (외부 기관)
export const GUIDES = {
  career: [
    { name: "고용24", desc: "구직 등록 · 국민내일배움카드 신청", url: "https://www.work24.go.kr" },
    { name: "중장년내일센터", desc: "40세 이상 재취업 · 전직 상담", url: "https://www.work24.go.kr" },
    { name: "큐넷", desc: "국가자격증 시험 일정 · 접수", url: "https://www.q-net.or.kr" },
  ],
  mind: [
    { name: "정신건강 위기상담 1577-0199", desc: "24시간 전화 상담", url: "tel:15770199" },
    { name: "자살예방 상담전화 109", desc: "24시간, 혼자 견디기 힘들 때", url: "tel:109" },
  ],
};

export const DISCLAIMER = "명리 해석을 단순화한 참고용입니다. 중요한 결정은 전문가와 상의하세요.";
