// 엔진 검증 데이터. 기획서 관문: "명식 30건(절기 경계일·윤달·시간 모름 포함)이 기존 앱과 일치".
// 기존 만세력 앱에서 확인한 명식을 CASES에 한 줄씩 추가하면 check.html이 자동으로 비교한다.
//
// CASES 항목
//   label   : 사례 이름
//   date    : "YYYY-MM-DD"   time: "HH:mm" (시간 모름이면 null)   gender: "M" | "F"
//   calendar: (선택) "lunar"면 date를 음력으로 본다. leap: (선택) 음력 윤달이면 true
//   expect  : 연·월·일·시 순서 한자 네 기둥 ("丙辰 辛丑 癸酉 辛酉"). 시간 모름이면 세 기둥만.
//   daeun   : (선택) 기존 앱의 대운수
//   source  : 기대값을 어디서 가져왔는지. "앱:" 으로 시작하는 것만 관문 30건에, "엔진:" 은 외부 엔진 대조에 센다.

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
  // ↓ 외부 만세력 엔진 대조 30건 (2026-11-03). 기준: 6tail lunar_python 1.4.8 (중국 · 한국 만세력 앱이 널리 쓰는 공개 엔진).
  //   연주 · 월주는 같은 절대 시각을 베이징 시각으로, 일주 · 시주는 같은 지방시(서울 경도)로 넣고 23시 이후는 다음 날(sect 1)로 맞췄다.
  //   서머타임 · UTC+8:30 · 지방시 같은 한국 보정은 이 앱이 계산한 시각을 그대로 넘겼으므로, 이 30건은 절기 · 간지 · 음력 계산을 검증한다.
  //   생년월일은 모두 가상(실존 인물 아님). 대운수는 기준이 달라(반올림 vs 년 · 개월) 비교하지 않는다.
  { label: "예시 홍길동", date: "1990-03-15", time: "10:30", gender: "M", expect: "庚午 己卯 己卯 己巳", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "일반 1985", date: "1985-07-22", time: "14:20", gender: "F", expect: "乙丑 癸未 壬戌 丁未", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "일반 1975", date: "1975-11-03", time: "06:45", gender: "M", expect: "乙卯 丙戌 癸丑 乙卯", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "일반 2011", date: "2011-09-15", time: "13:10", gender: "M", expect: "辛卯 丁酉 癸酉 戊午", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "일반 1969", date: "1969-02-20", time: "19:00", gender: "F", expect: "己酉 丙寅 丙寅 丁酉", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "2001 입춘 -15분", date: "2001-02-04", time: "03:13", gender: "M", expect: "庚辰 己丑 戊戌 癸丑", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "2001 입춘 +15분", date: "2001-02-04", time: "03:43", gender: "F", expect: "辛巳 庚寅 戊戌 甲寅", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "2010 입하 -15분", date: "2010-05-05", time: "23:29", gender: "F", expect: "庚寅 庚辰 乙卯 丁亥", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "1993 입추 +15분", date: "1993-08-07", time: "21:32", gender: "M", expect: "癸酉 庚申 庚申 丙戌", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "2016 입동 -15분", date: "2016-11-07", time: "08:32", gender: "M", expect: "丙申 戊戌 癸巳 丙辰", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "1972 대설 +15분", date: "1972-12-07", time: "09:33", gender: "F", expect: "壬子 壬子 壬申 乙巳", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "자시 00:10", date: "2000-01-01", time: "00:10", gender: "F", expect: "己卯 丙子 戊午 壬子", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "자시 00:40 (지방시 경계 뒤)", date: "1996-06-06", time: "00:40", gender: "M", expect: "丙子 甲午 甲戌 甲子", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "야자시 23:40", date: "1982-10-10", time: "23:40", gender: "M", expect: "壬戌 庚戌 丁卯 庚子", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "야자시 23:59", date: "2099-12-30", time: "23:59", gender: "F", expect: "己未 丙子 壬寅 庚子", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "시간 모름 1978", date: "1978-08-08", time: null, gender: "F", expect: "戊午 庚申 壬寅", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "시간 모름 2005", date: "2005-12-25", time: null, gender: "M", expect: "乙酉 戊子 癸未", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "음력 1980-08-15", calendar: "lunar", date: "1980-08-15", time: "08:00", gender: "M", expect: "庚申 乙酉 己亥 戊辰", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "음력 윤4월 2020", calendar: "lunar", leap: true, date: "2020-04-15", time: "16:30", gender: "F", expect: "庚子 壬午 庚辰 甲申", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "음력 윤8월 1995", calendar: "lunar", leap: true, date: "1995-08-10", time: "21:15", gender: "M", expect: "乙亥 乙酉 戊辰 壬戌", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "음력 윤2월 2023", calendar: "lunar", leap: true, date: "2023-02-05", time: "05:20", gender: "F", expect: "癸卯 乙卯 癸未 甲寅", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "서머타임 1987", date: "1987-07-15", time: "15:00", gender: "M", expect: "丁卯 丁未 乙丑 癸未", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "서머타임 1988", date: "1988-06-01", time: "08:30", gender: "F", expect: "戊辰 丁巳 丁亥 癸卯", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "서머타임 1955", date: "1955-08-10", time: "12:00", gender: "M", expect: "乙未 甲申 癸卯 丁巳", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "UTC+8:30 1958", date: "1958-04-10", time: "09:00", gender: "F", expect: "戊戌 丙辰 丁巳 甲辰", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "UTC+8:30 1960", date: "1960-01-20", time: "22:00", gender: "M", expect: "己亥 丁丑 丁未 辛亥", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "1910년", date: "1910-05-05", time: "05:05", gender: "M", expect: "庚戌 庚辰 庚午 己卯", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "1935년", date: "1935-09-09", time: "19:19", gender: "F", expect: "乙亥 乙酉 戊子 辛酉", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "2050년", date: "2050-06-15", time: "11:11", gender: "M", expect: "庚午 壬午 丙寅 癸巳", source: "엔진: 6tail lunar_python 1.4.8" },
  { label: "2077년", date: "2077-03-01", time: "03:33", gender: "F", expect: "丁酉 壬寅 壬寅 壬寅", source: "엔진: 6tail lunar_python 1.4.8" },
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
