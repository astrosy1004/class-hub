// WMO 날씨 코드(weather_code) → 한글 설명 + 이모지 매핑
// 참고: https://open-meteo.com/en/docs (WMO Weather interpretation codes)

const WEATHER_CODES = {
  0: { desc: "맑음", emoji: "☀️" },
  1: { desc: "대체로 맑음", emoji: "🌤️" },
  2: { desc: "부분적으로 흐림", emoji: "⛅" },
  3: { desc: "흐림", emoji: "☁️" },
  45: { desc: "안개", emoji: "🌫️" },
  48: { desc: "서리 안개", emoji: "🌫️" },
  51: { desc: "가벼운 이슬비", emoji: "🌦️" },
  53: { desc: "이슬비", emoji: "🌦️" },
  55: { desc: "강한 이슬비", emoji: "🌧️" },
  56: { desc: "어는 이슬비(약)", emoji: "🌧️" },
  57: { desc: "어는 이슬비(강)", emoji: "🌧️" },
  61: { desc: "약한 비", emoji: "🌧️" },
  63: { desc: "비", emoji: "🌧️" },
  65: { desc: "강한 비", emoji: "🌧️" },
  66: { desc: "어는 비(약)", emoji: "🌧️" },
  67: { desc: "어는 비(강)", emoji: "🌧️" },
  71: { desc: "약한 눈", emoji: "🌨️" },
  73: { desc: "눈", emoji: "🌨️" },
  75: { desc: "강한 눈", emoji: "❄️" },
  77: { desc: "싸락눈", emoji: "🌨️" },
  80: { desc: "약한 소나기", emoji: "🌦️" },
  81: { desc: "소나기", emoji: "🌧️" },
  82: { desc: "강한 소나기", emoji: "⛈️" },
  85: { desc: "약한 눈소나기", emoji: "🌨️" },
  86: { desc: "강한 눈소나기", emoji: "❄️" },
  95: { desc: "뇌우", emoji: "⛈️" },
  96: { desc: "우박 동반 뇌우(약)", emoji: "⛈️" },
  99: { desc: "우박 동반 뇌우(강)", emoji: "⛈️" },
};

// 알 수 없는 코드가 오더라도 화면이 깨지지 않도록 기본값을 둔다.
const DEFAULT_INFO = { desc: "알 수 없음", emoji: "❓" };

export function getWeatherInfo(code) {
  return WEATHER_CODES[code] ?? DEFAULT_INFO;
}
