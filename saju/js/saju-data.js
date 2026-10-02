// 사주 계산에 쓰는 기본 표(천간·지지·오행·십신·지장간·12운성·절기·표준시) 전담 파일.
// 학파마다 다를 수 있는 선택(대운수 반올림, 나이 기준 등)도 맨 아래 SETTINGS에 모아 둔다.
// 내용을 고칠 때는 이 파일만 바꾸면 되고, 계산 코드(manse.js)는 손대지 않는다.

// 오행. 순서가 상생 순서(목→화→토→금→수)라서 십신 계산이 이 순서에 기대고 있다. 순서를 바꾸지 말 것.
export const ELEMENTS = [
  { id: "wood", han: "木", ko: "목" },
  { id: "fire", han: "火", ko: "화" },
  { id: "earth", han: "土", ko: "토" },
  { id: "metal", han: "金", ko: "금" },
  { id: "water", han: "水", ko: "수" },
];

// 천간 10개. element는 ELEMENTS 순번, yang은 양간 여부.
export const STEMS = [
  { han: "甲", ko: "갑", element: 0, yang: true },
  { han: "乙", ko: "을", element: 0, yang: false },
  { han: "丙", ko: "병", element: 1, yang: true },
  { han: "丁", ko: "정", element: 1, yang: false },
  { han: "戊", ko: "무", element: 2, yang: true },
  { han: "己", ko: "기", element: 2, yang: false },
  { han: "庚", ko: "경", element: 3, yang: true },
  { han: "辛", ko: "신", element: 3, yang: false },
  { han: "壬", ko: "임", element: 4, yang: true },
  { han: "癸", ko: "계", element: 4, yang: false },
];

// 지지 12개. hidden은 지장간(STEMS 순번) [여기, 중기, 정기] 순서이고 중기가 없으면 2개.
// 마지막 값(정기)이 지지의 십신을 정할 때 쓰는 대표 천간이다. (子=癸, 午=丁, 巳=丙, 亥=壬)
export const BRANCHES = [
  { han: "子", ko: "자", animal: "쥐", element: 4, hidden: [8, 9] },
  { han: "丑", ko: "축", animal: "소", element: 2, hidden: [9, 7, 5] },
  { han: "寅", ko: "인", animal: "호랑이", element: 0, hidden: [4, 2, 0] },
  { han: "卯", ko: "묘", animal: "토끼", element: 0, hidden: [0, 1] },
  { han: "辰", ko: "진", animal: "용", element: 2, hidden: [1, 9, 4] },
  { han: "巳", ko: "사", animal: "뱀", element: 1, hidden: [4, 6, 2] },
  { han: "午", ko: "오", animal: "말", element: 1, hidden: [2, 5, 3] },
  { han: "未", ko: "미", animal: "양", element: 2, hidden: [3, 1, 5] },
  { han: "申", ko: "신", animal: "원숭이", element: 3, hidden: [4, 8, 6] },
  { han: "酉", ko: "유", animal: "닭", element: 3, hidden: [6, 7] },
  { han: "戌", ko: "술", animal: "개", element: 2, hidden: [7, 3, 4] },
  { han: "亥", ko: "해", animal: "돼지", element: 4, hidden: [4, 0, 8] },
];

// 십신. 행 = 일간 기준 상대 오행 관계(0 같음, 1 내가 생함, 2 내가 극함, 3 나를 극함, 4 나를 생함),
// 열 = [음양이 같을 때, 다를 때]
export const TEN_GODS = [
  ["비견", "겁재"],
  ["식신", "상관"],
  ["편재", "정재"],
  ["편관", "정관"],
  ["편인", "정인"],
];

// 12운성 이름과 천간별 장생 자리(BRANCHES 순번). 양간은 순행, 음간은 역행한다.
export const TWELVE_STAGES = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"];
export const CHANGSAENG = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3]; // 甲亥 乙午 丙寅 丁酉 戊寅 己酉 庚巳 辛子 壬申 癸卯

// 24절기. 순번 0 = 소한(태양 황경 285°)부터 15°씩. 짝수 순번이 달이 바뀌는 절(節)이다.
export const SOLAR_TERMS = [
  "소한", "대한", "입춘", "우수", "경칩", "춘분", "청명", "곡우", "입하", "소만", "망종", "하지",
  "소서", "대서", "입추", "처서", "백로", "추분", "한로", "상강", "입동", "소설", "대설", "동지",
];

// 한국 표준시 변천. from(포함)부터 다음 줄 from 전까지 utcOffset(시간)을 쓴다.
// 서머타임은 2단계에서 따로 다룬다.
export const KOREA_STANDARD_TIME = [
  { from: "1908-04-01", utcOffset: 8.5 },
  { from: "1912-01-01", utcOffset: 9 },
  { from: "1954-03-21", utcOffset: 8.5 },
  { from: "1961-08-10", utcOffset: 9 },
];

export const SETTINGS = {
  // 시주를 정할 때 쓰는 출생지 경도(동경). 서울 126.98° → 표준시 135°보다 약 32분 늦게 시(時)가 바뀐다.
  defaultLongitude: 126.98,
  // 대운수 = (출생 ~ 절입까지 날수) / 3. 소수점은 반올림하고 최소 1로 둔다.
  daeunRound: (years) => Math.max(1, Math.round(years)),
  daeunCount: 8,
};
