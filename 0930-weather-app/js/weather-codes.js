// WMO 날씨 코드(weather_code) → 한글 설명 + 일러스트(icons.js의 ART 키) + 카드 배경 톤
// 참고: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
// tone은 메인 화면 도시 카드의 배경 그라디언트 class(sky-*)로 쓴다.

const WEATHER_CODES = {
  0: { desc: "맑음", art: "sun", tone: "clear" },
  1: { desc: "대체로 맑음", art: "partly", tone: "clear" },
  2: { desc: "구름 조금", art: "partly", tone: "clear" },
  3: { desc: "흐림", art: "cloud", tone: "cloudy" },
  45: { desc: "안개", art: "fog", tone: "cloudy" },
  48: { desc: "서리 안개", art: "fog", tone: "cloudy" },
  51: { desc: "가벼운 이슬비", art: "rain", tone: "rain" },
  53: { desc: "이슬비", art: "rain", tone: "rain" },
  55: { desc: "강한 이슬비", art: "rain", tone: "rain" },
  56: { desc: "어는 이슬비(약)", art: "rain", tone: "rain" },
  57: { desc: "어는 이슬비(강)", art: "rain", tone: "rain" },
  61: { desc: "약한 비", art: "rain", tone: "rain" },
  63: { desc: "비", art: "rain", tone: "rain" },
  65: { desc: "강한 비", art: "rain", tone: "rain" },
  66: { desc: "어는 비(약)", art: "rain", tone: "rain" },
  67: { desc: "어는 비(강)", art: "rain", tone: "rain" },
  71: { desc: "약한 눈", art: "snow", tone: "snow" },
  73: { desc: "눈", art: "snow", tone: "snow" },
  75: { desc: "강한 눈", art: "snow", tone: "snow" },
  77: { desc: "싸락눈", art: "snow", tone: "snow" },
  80: { desc: "약한 소나기", art: "rain", tone: "rain" },
  81: { desc: "소나기", art: "rain", tone: "rain" },
  82: { desc: "강한 소나기", art: "storm", tone: "rain" },
  85: { desc: "약한 눈소나기", art: "snow", tone: "snow" },
  86: { desc: "강한 눈소나기", art: "snow", tone: "snow" },
  95: { desc: "뇌우", art: "storm", tone: "storm" },
  96: { desc: "우박 동반 뇌우(약)", art: "storm", tone: "storm" },
  99: { desc: "우박 동반 뇌우(강)", art: "storm", tone: "storm" },
};

// 알 수 없는 코드가 오더라도 화면이 깨지지 않도록 기본값을 둔다.
const DEFAULT_INFO = { desc: "알 수 없음", art: "unknown", tone: "cloudy" };

export function getWeatherInfo(code) {
  return WEATHER_CODES[code] ?? DEFAULT_INFO;
}
