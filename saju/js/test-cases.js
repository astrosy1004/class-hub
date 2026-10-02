// 엔진 검증 데이터. 기획서 관문: "명식 30건(절기 경계일·윤달·시간 모름 포함)이 기존 앱과 일치".
// 기존 만세력 앱에서 확인한 명식을 CASES에 한 줄씩 추가하면 check.html이 자동으로 비교한다.
//
// CASES 항목
//   label   : 사례 이름
//   date    : "YYYY-MM-DD"   time: "HH:mm" (시간 모름이면 null)   gender: "M" | "F"
//   calendar: (선택) "lunar"면 date를 음력으로 본다. leap: (선택) 음력 윤달이면 true
//   expect  : 연·월·일·시 순서 한자 네 기둥 ("丙辰 辛丑 癸酉 辛酉"). 시간 모름이면 세 기둥만.
//   daeun   : (선택) 기존 앱의 대운수
//   source  : 기대값을 어디서 가져왔는지. "앱:" 으로 시작하는 것만 관문 30건에 센다.

export const CASES = [
  { label: "2000년 첫날 정오", date: "2000-01-01", time: "12:00", gender: "M", expect: "己卯 丙子 戊午 戊午", source: "손계산(2000-01-01 = 戊午일)" },
  { label: "2024년 첫날(甲子일)", date: "2024-01-01", time: "12:00", gender: "M", expect: "癸卯 甲子 甲子 庚午", source: "손계산" },
  { label: "2024 입춘(17:27) 직전", date: "2024-02-04", time: "17:00", gender: "M", expect: "癸卯 乙丑 戊戌 庚申", source: "손계산(절기 경계)" },
  { label: "2024 입춘(17:27) 직후", date: "2024-02-04", time: "18:00", gender: "M", expect: "甲辰 丙寅 戊戌 辛酉", source: "손계산(절기 경계)" },
  { label: "자시(23:40) → 다음 날 일주", date: "2024-02-04", time: "23:40", gender: "M", expect: "甲辰 丙寅 己亥 甲子", source: "손계산(자시 경계)" },
  { label: "앱 예시 명식(홍길동, 가상)", date: "1990-03-15", time: "10:30", gender: "M", expect: "庚午 己卯 己卯 己巳", source: "손계산(경칩 뒤 卯월, 지방시 09:57 巳시)" },
  { label: "시간 모름", date: "1985-07-15", time: null, gender: "F", expect: "乙丑 癸未 乙卯", source: "손계산" },
  { label: "음력 입력(홍길동과 같은 날)", calendar: "lunar", date: "1990-02-19", time: "10:30", gender: "M", expect: "庚午 己卯 己卯 己巳", source: "음력 1990-02-19 = 양력 1990-03-15 (1990 설날 1/27 기준)" },
  { label: "서머타임(1시간 보정)", date: "1988-07-01", time: "10:00", gender: "M", expect: "戊辰 戊午 丁巳 甲辰", source: "손계산(10:00 → 09:00 → 지방시 08:28 辰시)" },
  // ↓ 기존 만세력 앱에서 확인한 명식을 여기에 추가하세요. 예)
  // { label: "본인", date: "1970-05-05", time: "07:30", gender: "M", expect: "○○ ○○ ○○ ○○", daeun: 5, source: "앱: ○○만세력" },
];

// 절기 시각 검증: 공개된 절입 시각(한국시간, 분 단위)
export const TERM_CHECKS = [
  { year: 2023, index: 2, kst: "2023-02-04 11:42" },
  { year: 2024, index: 2, kst: "2024-02-04 17:27" },
  { year: 2024, index: 5, kst: "2024-03-20 12:06" },
  { year: 2024, index: 11, kst: "2024-06-21 05:51" },
  { year: 2024, index: 17, kst: "2024-09-22 21:44" },
  { year: 2024, index: 23, kst: "2024-12-21 18:21" },
  { year: 2025, index: 2, kst: "2025-02-03 23:10" },
  { year: 2026, index: 2, kst: "2026-02-04 05:02" },
];

// 음력 변환 검증: 양력 ↔ 음력 (설날 · 추석 · 윤달)
export const LUNAR_CHECKS = [
  { solar: "1966-01-22", lunar: "1966-01-01", note: "한국 설날 (합삭 한국시간 00:46 → 중국은 1/21)" },
  { solar: "1977-02-18", lunar: "1977-01-01", note: "설날" },
  { solar: "2000-02-05", lunar: "2000-01-01", note: "설날" },
  { solar: "2023-01-22", lunar: "2023-01-01", note: "설날" },
  { solar: "2024-02-10", lunar: "2024-01-01", note: "설날" },
  { solar: "2025-01-29", lunar: "2025-01-01", note: "설날" },
  { solar: "2026-02-17", lunar: "2026-01-01", note: "설날" },
  { solar: "2024-09-17", lunar: "2024-08-15", note: "추석" },
  { solar: "2025-10-06", lunar: "2025-08-15", note: "추석" },
  { solar: "2026-09-25", lunar: "2026-08-15", note: "추석" },
  { solar: "2023-03-22", lunar: "2023-02-01", leap: true, note: "윤2월 초하루" },
  { solar: "2025-07-25", lunar: "2025-06-01", leap: true, note: "윤6월 초하루" },
];
