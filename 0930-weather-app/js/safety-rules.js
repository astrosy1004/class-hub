// 날씨별 공사 현장 안전수칙 데이터 (icon은 icons.js의 선 아이콘 이름) + "오늘 어떤 위험이 있는지" 판정 전담 파일.
// 문구·기준값을 고칠 때는 파일 위쪽 데이터(LEVELS, CATEGORIES, BASIC_RULES)만 바꾸면 된다.
//
// 기준값 출처(요약):
// - 폭염: 고용노동부 온열질환 예방 가이드의 체감온도 단계(31 관심 · 33 주의 · 35 경고 · 38 위험)
// - 한파: 기상청 한파특보 최저기온 기준(-12℃ 주의보 · -15℃ 경보), 0℃ 이하는 결빙 관심
// - 강수·강풍: 산업안전보건기준에 관한 규칙 (철골작업 중지: 풍속 10m/s·강우 1mm/h·강설 1cm/h 이상,
//   타워크레인: 순간풍속 10m/s 초과 설치·수리·점검·해체 중지, 20m/s 초과 운전 중지)
// - 미세먼지: 환경부 예보 등급 (PM10 81↑ 나쁨 · 151↑ 매우나쁨, PM2.5 36↑ 나쁨 · 76↑ 매우나쁨)

// 위험 단계. level이 클수록 위험하다.
export const LEVELS = {
  0: { label: "안전", tone: "safe" },
  1: { label: "관심", tone: "lv1" },
  2: { label: "주의", tone: "lv2" },
  3: { label: "경고", tone: "lv3" },
  4: { label: "위험", tone: "lv4" },
};

// 알림 설정 · 안전수칙 탭 · 상세 화면이 모두 이 배열 순서를 따른다.
export const CATEGORIES = [
  {
    id: "heat",
    tab: "더위",
    alertLabel: "폭염 / 고온",
    icon: "sun",
    title: "더운 날씨 안전수칙",
    subtitle: "폭염 / 고온",
    intro: "기온이 높을 때는 열사병, 탈진 등의 위험이 커집니다. 아래 사항을 꼭 지켜주세요.",
    risks: [
      "열사병, 열탈진, 열경련 같은 온열질환",
      "집중력 저하로 인한 추락·끼임 사고 증가",
      "체온 상승으로 인한 어지러움과 실신",
    ],
    rules: [
      { icon: "droplet", title: "충분한 수분 섭취", desc: "목이 마르지 않아도 15~20분마다 물 한 컵씩 마시세요. (이온음료 권장)" },
      { icon: "pause", title: "휴식 시간 확보", desc: "체감온도 33℃ 이상이면 2시간마다 20분 이상 그늘에서 쉬세요. 가장 더운 14~17시에는 무리한 작업을 피합니다." },
      { icon: "shirt", title: "시원한 복장 착용", desc: "통풍이 잘되는 작업복, 쿨토시·냉각조끼를 입고 안전모 안에 땀받이를 쓰세요." },
      { icon: "shelter", title: "그늘 · 휴게시설 마련", desc: "작업 장소 가까이에 햇볕을 가리는 그늘과 시원한 물을 준비하세요." },
      { icon: "heartPulse", title: "작업자 건강 상태 수시 확인", desc: "어지럼증, 두통, 메스꺼움이 있으면 즉시 작업을 멈추고 관리자에게 알리세요. 고령자·신규 작업자는 더 자주 살핍니다." },
    ],
    basis: "고용노동부 온열질환 예방 가이드 (물 · 그늘 · 휴식)",
  },
  {
    id: "cold",
    tab: "추위",
    alertLabel: "한파 / 저온",
    icon: "snowflake",
    title: "추운 날씨 안전수칙",
    subtitle: "한파 / 저온",
    intro: "기온이 낮으면 동상·저체온증과 얼어붙은 바닥에서의 미끄럼 사고가 늘어납니다.",
    risks: [
      "동상, 저체온증",
      "얼어붙은 발판·통로에서 미끄러짐과 넘어짐",
      "밀폐된 공간에서 갈탄·숯 난로로 인한 일산화탄소 중독",
      "콘크리트 동결로 인한 품질 저하와 붕괴",
    ],
    rules: [
      { icon: "hand", title: "방한 보호구 착용", desc: "방한복, 방한장갑, 귀마개를 착용하고 젖은 장갑·양말은 바로 갈아 신으세요." },
      { icon: "cup", title: "따뜻한 쉼터와 음료", desc: "따뜻한 쉼터에서 주기적으로 몸을 녹이고 따뜻한 물을 자주 마시세요." },
      { icon: "snowflake", title: "결빙 구간 제거", desc: "작업 전에 발판, 사다리, 통로의 얼음과 눈을 치우고 모래·염화칼슘을 뿌리세요." },
      { icon: "flame", title: "난방 시 환기 · 가스 측정", desc: "밀폐된 곳에서 갈탄·숯 난로를 피우지 마세요. 들어가기 전 산소·일산화탄소 농도를 측정합니다." },
      { icon: "brick", title: "콘크리트 보온 양생", desc: "하루 평균기온 4℃ 이하에서는 보온·가열 양생으로 콘크리트가 얼지 않게 하세요." },
    ],
    basis: "기상청 한파특보 기준, 콘크리트 표준시방서(한중 콘크리트)",
  },
  {
    id: "rain",
    tab: "강수",
    alertLabel: "강수 (비/눈)",
    icon: "rain",
    title: "비·눈 오는 날 안전수칙",
    subtitle: "강우 / 강설 / 낙뢰",
    intro: "비나 눈이 오면 미끄럼, 감전, 토사 붕괴 위험이 커집니다.",
    risks: [
      "젖은 발판·철골 위에서 미끄러짐과 추락",
      "누전, 전선 침수로 인한 감전",
      "굴착면·흙막이 붕괴와 토사 유출",
      "천둥·번개(낙뢰)",
    ],
    rules: [
      { icon: "crane", title: "철골 · 고소 작업 중지", desc: "시간당 강우량 1mm 이상 또는 강설량 1cm 이상이면 철골 작업을 중지합니다." },
      { icon: "zap", title: "전기 설비 점검", desc: "분전반과 전선이 물에 닿지 않게 하고 누전차단기가 작동하는지 확인하세요. 젖은 손으로 전기기구를 만지지 마세요." },
      { icon: "slope", title: "굴착면 · 흙막이 점검", desc: "비 오기 전후로 균열, 배수 상태를 점검하고 배수로를 확보하세요." },
      { icon: "boot", title: "미끄럼 방지", desc: "미끄럼방지 안전화를 신고 통로의 물기와 눈을 수시로 치우세요." },
      { icon: "storm", title: "낙뢰 시 대피", desc: "천둥소리가 들리면 크레인·고소 작업을 멈추고 건물 안으로 대피하세요." },
    ],
    basis: "산업안전보건기준에 관한 규칙 (철골작업 중지 기준)",
  },
  {
    id: "wind",
    tab: "강풍",
    alertLabel: "강풍",
    icon: "wind",
    title: "강풍 안전수칙",
    subtitle: "강풍 / 돌풍",
    intro: "바람이 강하면 자재가 날아오거나 크레인·고소 작업 중 추락할 위험이 커집니다.",
    risks: [
      "자재·공구가 떨어지거나 날아옴",
      "타워크레인·이동식 크레인 전도",
      "비계, 가설 울타리, 거푸집 붕괴",
      "높은 곳 작업자의 균형 상실과 추락",
    ],
    rules: [
      { icon: "crane", title: "크레인 작업 제한", desc: "순간풍속 10m/s를 넘으면 타워크레인 설치·수리·점검·해체를, 20m/s를 넘으면 운전을 중지합니다." },
      { icon: "harness", title: "고소 작업 중지", desc: "풍속 10m/s 이상이면 철골 등 높은 곳의 작업을 멈추세요." },
      { icon: "strap", title: "자재 결속", desc: "가벼운 자재와 자재 더미를 묶고 덮개를 단단히 고정하세요." },
      { icon: "cone", title: "가설물 점검", desc: "비계, 가설 울타리, 안전망이 단단히 고정됐는지 점검하세요." },
      { icon: "vest", title: "안전대 체결", desc: "높은 곳에서는 반드시 안전대를 걸고 작업하세요." },
    ],
    basis: "산업안전보건기준에 관한 규칙 (크레인·철골작업 풍속 기준)",
  },
  {
    id: "dust",
    tab: "미세먼지",
    alertLabel: "미세먼지 (나쁨 이상)",
    icon: "mask",
    title: "미세먼지 안전수칙",
    subtitle: "미세먼지 / 초미세먼지",
    intro: "미세먼지가 나쁠 때 오래 밖에서 일하면 호흡기·심혈관 질환 위험이 커집니다.",
    risks: [
      "기침, 호흡 곤란 등 호흡기 자극",
      "천식·심혈관 질환 악화",
      "시야가 흐려져 장비와 부딪힘",
    ],
    rules: [
      { icon: "mask", title: "보건용 마스크 착용", desc: "KF80 이상(가능하면 KF94) 마스크를 코와 입에 밀착해 쓰세요." },
      { icon: "timer", title: "실외 작업 시간 조정", desc: "매우 나쁨일 때는 힘든 작업을 줄이고 휴식 시간을 늘리세요." },
      { icon: "spray", title: "비산먼지 억제", desc: "물을 뿌리고 흙더미·자재에 덮개를 씌워 현장 먼지를 줄이세요." },
      { icon: "lungs", title: "민감군 배려", desc: "호흡기·심혈관 질환자와 고령 작업자는 실내 작업에 우선 배치하세요." },
      { icon: "sparkles", title: "작업 후 세척", desc: "작업을 마치면 손과 얼굴을 씻고 작업복의 먼지를 털어 주세요." },
    ],
    basis: "환경부 미세먼지 예보 등급, 고용노동부 미세먼지 대응 건강보호 가이드",
  },
];

// 위험한 날씨가 없을 때(맑음/보통) 보여주는 기본 안전수칙.
export const BASIC_RULES = {
  id: "basic",
  tab: "기본",
  icon: "helmet",
  title: "기본 안전수칙",
  subtitle: "맑음 / 보통",
  intro: "위험한 날씨가 없는 날에도 기본 안전수칙은 꼭 지켜야 합니다.",
  risks: [
    "추락, 낙하, 끼임 같은 일상적인 사고",
    "보호구를 쓰지 않아 부상이 커지는 경우",
  ],
  rules: [
    { icon: "helmet", title: "개인 보호구 착용", desc: "안전모는 턱끈까지 매고, 안전화와 안전대를 착용하세요." },
    { icon: "droplet", title: "충분한 수분 섭취", desc: "맑은 날에도 작업 중간중간 물을 규칙적으로 마시세요." },
    { icon: "bottle", title: "자외선 차단", desc: "장시간 야외 작업 시 모자, 자외선 차단제, 긴 옷을 착용하세요." },
    { icon: "wrench", title: "작업 전 장비 점검", desc: "브레이크, 와이어로프, 방호장치 등 장비 이상 여부를 확인하세요." },
    { icon: "clipboard", title: "작업 전 안전점검 (TBM)", desc: "작업 시작 전 모여서 오늘의 위험 요인과 대책을 함께 확인하세요." },
  ],
  basis: "산업안전보건기준에 관한 규칙 (보호구 · 작업 전 점검)",
};

const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const THUNDER_CODES = new Set([95, 96, 99]);

export function getCategory(id) {
  if (id === BASIC_RULES.id) return BASIC_RULES;
  return CATEGORIES.find((c) => c.id === id) ?? null;
}

/**
 * 미세먼지 등급 (환경부 기준). PM10과 PM2.5 중 더 나쁜 쪽을 쓴다.
 * @returns {{label: string, rank: number}|null} rank 0 좋음 · 1 보통 · 2 나쁨 · 3 매우나쁨
 */
export function getDustGrade(pm10, pm25) {
  const rank10 = pm10 == null ? -1 : pm10 > 150 ? 3 : pm10 > 80 ? 2 : pm10 > 30 ? 1 : 0;
  const rank25 = pm25 == null ? -1 : pm25 > 75 ? 3 : pm25 > 35 ? 2 : pm25 > 15 ? 1 : 0;
  const rank = Math.max(rank10, rank25);
  if (rank < 0) return null;
  return { rank, label: ["좋음", "보통", "나쁨", "매우나쁨"][rank] };
}

/**
 * 오늘(현재 + 오늘 하루 예보) 날씨로 분류별 위험 단계를 판정한다.
 * @param {object} forecast getForecast() 응답
 * @param {object|null} air getAirQuality() 결과 (실패했으면 null)
 * @returns {Array<{id: string, level: number, reason: string}>} level 1 이상인 것만, 위험한 순
 */
export function evaluateHazards(forecast, air) {
  const { current, daily } = forecast;
  const result = [];
  const add = (id, level, reason) => {
    if (level > 0) result.push({ id, level, reason });
  };

  // 더위: 체감온도(현재와 오늘 최고 중 높은 값)
  const feelsMax = Math.max(current.apparent_temperature, daily.apparent_temperature_max[0]);
  add(
    "heat",
    feelsMax >= 38 ? 4 : feelsMax >= 35 ? 3 : feelsMax >= 33 ? 2 : feelsMax >= 31 ? 1 : 0,
    `체감온도 최고 ${Math.round(feelsMax)}℃`
  );

  // 추위: 오늘 최저기온
  const tempMin = Math.min(current.temperature_2m, daily.temperature_2m_min[0]);
  add(
    "cold",
    tempMin <= -15 ? 3 : tempMin <= -12 ? 2 : tempMin <= 0 ? 1 : 0,
    `최저기온 ${Math.round(tempMin)}℃`
  );

  // 강수: 강수량 · 강수확률 · 현재 날씨 코드(비/눈/뇌우)
  const code = current.weather_code;
  const rainSum = daily.precipitation_sum[0] ?? 0;
  const rainProb = daily.precipitation_probability_max[0] ?? 0;
  const wetNow = RAIN_CODES.has(code) || SNOW_CODES.has(code) || THUNDER_CODES.has(code);
  let rainLevel = rainSum >= 70 ? 3 : rainSum >= 30 ? 2 : rainSum >= 1 || rainProb >= 60 || wetNow ? 1 : 0;
  if (THUNDER_CODES.has(code) || THUNDER_CODES.has(daily.weather_code[0])) rainLevel = Math.max(rainLevel, 2);
  const rainReason = THUNDER_CODES.has(code) || THUNDER_CODES.has(daily.weather_code[0])
    ? `뇌우 예보 · 강수량 ${rainSum}mm`
    : `강수확률 ${rainProb}% · 강수량 ${rainSum}mm`;
  add("rain", rainLevel, rainReason);

  // 강풍: 순간풍속(돌풍) 최고와 평균풍속 최고
  const gust = Math.max(current.wind_gusts_10m ?? 0, daily.wind_gusts_10m_max[0] ?? 0);
  const wind = Math.max(current.wind_speed_10m ?? 0, daily.wind_speed_10m_max[0] ?? 0);
  add(
    "wind",
    gust >= 20 || wind >= 14 ? 3 : gust >= 10 || wind >= 10 ? 2 : 0,
    `순간풍속 최고 ${gust.toFixed(1)}m/s`
  );

  // 미세먼지: 오늘 최고값 기준 등급
  if (air) {
    const grade = getDustGrade(air.pm10Max ?? air.pm10, air.pm25Max ?? air.pm25);
    if (grade) {
      add("dust", grade.rank === 3 ? 3 : grade.rank === 2 ? 2 : 0, `미세먼지 ${grade.label}`);
    }
  }

  return result.sort((a, b) => b.level - a.level);
}
