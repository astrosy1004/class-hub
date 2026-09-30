// Open-Meteo 호출 전담 파일.
// 날씨 서비스를 바꾸게 되면 이 파일만 고치면 된다 (다른 파일은 이 모듈의 함수 시그니처만 안다).

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// 0건일 때 다시 붙여서 검색해 볼 접미사들 (실측: 서울 0건 → 서울특별시 1건 등).
// ""(원본 검색어)를 가장 먼저 시도한다.
const RETRY_SUFFIXES = ["", "특별시", "광역시", "시"];

function log(...args) {
  console.log("[WEATHER]", ...args);
}

async function fetchGeocode(name) {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(name)}&language=ko&count=10`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`지명 검색 요청 실패 (HTTP ${res.status})`);
  }
  const data = await res.json();
  // 결과가 0건이면 응답에 results 키 자체가 없다 (실측 확인). 없으면 빈 배열로 처리.
  return data.results ?? [];
}

/**
 * 도시 이름으로 검색한다. 0건이면 "특별시" → "광역시" → "시"를 차례로 붙여 재검색한다.
 * @param {string} query 사용자가 입력한 검색어
 * @returns {Promise<Array>} geocoding 결과 배열 (0건이면 빈 배열)
 */
export async function searchCity(query) {
  for (const suffix of RETRY_SUFFIXES) {
    const name = `${query}${suffix}`;
    log("지명 검색 시도:", name);
    const results = await fetchGeocode(name);
    if (results.length > 0) {
      return results;
    }
  }
  return [];
}

/**
 * 위도/경도로 현재 날씨 + 5일 예보를 가져온다.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<object>} Open-Meteo forecast 응답
 */
export async function getForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: "5",
  });
  const url = `${FORECAST_URL}?${params.toString()}`;
  log("날씨 조회:", url);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`날씨 조회 요청 실패 (HTTP ${res.status})`);
  }
  return res.json();
}
