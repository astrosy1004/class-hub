// 엔진 검증 데이터. 기획서 관문: "명식 30건(절기 경계일·윤달·시간 모름 포함)이 기존 앱과 일치".
// 기존 만세력 앱에서 확인한 명식을 CASES에 한 줄씩 추가하면 check.html이 자동으로 비교한다.
//
// CASES 항목
//   label   : 사례 이름
//   date    : 양력 "YYYY-MM-DD"   time: "HH:mm" (시간 모름이면 null)   gender: "M" | "F"
//   expect  : 연·월·일·시 순서 한자 네 기둥 ("丙辰 辛丑 癸酉 辛酉"). 시간 모름이면 세 기둥만.
//   daeun   : (선택) 기존 앱의 대운수
//   source  : 기대값을 어디서 가져왔는지. "앱:" 으로 시작하는 것만 관문 30건에 센다.

export const CASES = [
  { label: "2000년 첫날 정오", date: "2000-01-01", time: "12:00", gender: "M", expect: "己卯 丙子 戊午 戊午", source: "손계산(2000-01-01 = 戊午일)" },
  { label: "2024년 첫날(甲子일)", date: "2024-01-01", time: "12:00", gender: "M", expect: "癸卯 甲子 甲子 庚午", source: "손계산" },
  { label: "2024 입춘(17:27) 직전", date: "2024-02-04", time: "17:00", gender: "M", expect: "癸卯 乙丑 戊戌 庚申", source: "손계산(절기 경계)" },
  { label: "2024 입춘(17:27) 직후", date: "2024-02-04", time: "18:00", gender: "M", expect: "甲辰 丙寅 戊戌 辛酉", source: "손계산(절기 경계)" },
  { label: "자시(23:40) → 다음 날 일주", date: "2024-02-04", time: "23:40", gender: "M", expect: "甲辰 丙寅 己亥 甲子", source: "손계산(자시 경계)" },
  { label: "기획서 예시 명식", date: "1990-03-15", time: "18:30", gender: "F", expect: "丙辰 辛丑 癸酉 辛酉", source: "기획서(병진·신축·계유·신유)" },
  { label: "시간 모름", date: "1985-07-15", time: null, gender: "F", expect: "乙丑 癸未 乙卯", source: "손계산" },
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
