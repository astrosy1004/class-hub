// 날씨 · 미세먼지 · 위치 이름 조회 전담 파일 (전부 API 키가 필요 없는 무료 API).
// 날씨 서비스를 바꾸게 되면 이 파일만 고치면 된다 (다른 파일은 이 모듈의 함수 시그니처만 안다).

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const REVERSE_GEOCODE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

// 0건일 때 다시 붙여서 검색해 볼 접미사들 (실측: 서울 0건 → 서울특별시 1건 등).
// ""(원본 검색어)를 가장 먼저 시도한다.
const RETRY_SUFFIXES = ["", "특별시", "광역시", "시"];

function log(...args) {
  console.log("[WEATHER]", ...args);
}

async function fetchJson(url, what) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${what} 요청 실패 (HTTP ${res.status})`);
  }
  return res.json();
}

async function fetchGeocode(name) {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(name)}&language=ko&count=10`;
  const data = await fetchJson(url, "지명 검색");
  // 결과가 0건이면 응답에 results 키 자체가 없다 (실측 확인). 없으면 빈 배열로 처리.
  return data.results ?? [];
}

// 국내 지역(한글 검색어)은 OpenStreetMap Nominatim으로 찾는다. Open-Meteo 지명 검색은
// "강남구", "분당구", "해운대구" 같은 구 단위를 모르거나 엉뚱한 곳(충남의 "강남구렁고개")을 준다(실측).
// Nominatim 이용 정책: 초당 1회 이하, 대량 조회 금지 — 사람이 직접 검색할 때만 부르므로 해당 없음.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const HANGUL = /[가-힣]/;

async function searchKorea(query) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    "accept-language": "ko",
    countrycodes: "kr",
    addressdetails: "1",
    limit: "6",
  });
  const data = await fetchJson(`${NOMINATIM_URL}?${params.toString()}`, "지역 검색");
  const seen = new Set();
  const places = [];
  for (const r of data) {
    const a = r.address ?? {};
    const name = r.name || a.borough || a.city || a.county || a.town;
    if (!name) continue;
    // 구(borough)의 상위는 시(city), 시·군의 상위는 도(province/state)
    const parent = r.addresstype === "borough" ? a.city : a.province || a.state || a.city;
    const key = `${parent}|${name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    places.push({
      id: `osm-${r.osm_type}-${r.osm_id}`,
      name,
      admin1: parent && parent !== name ? parent : null,
      country: a.country ?? "대한민국",
      country_code: "KR",
      latitude: Number(r.lat),
      longitude: Number(r.lon),
    });
  }
  return places;
}

/**
 * 지역 이름으로 검색한다. 한글이면 Nominatim(국내 구·시·군 단위)을 먼저 쓰고, 못 찾거나 실패하면
 * Open-Meteo로 찾는다. Open-Meteo는 0건이면 "특별시" → "광역시" → "시"를 차례로 붙여 재검색한다.
 * @param {string} query 사용자가 입력한 검색어
 * @returns {Promise<Array>} 지역 배열 (0건이면 빈 배열)
 */
export async function searchCity(query) {
  if (HANGUL.test(query)) {
    try {
      log("국내 지역 검색:", query);
      const places = await searchKorea(query);
      if (places.length > 0) return places;
    } catch (err) {
      log("국내 지역 검색 실패, Open-Meteo로 재시도:", err);
    }
  }

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
 * 위도/경도로 현재 날씨 + 시간별 + 7일 예보를 가져온다. 풍속 단위는 m/s
 * (공사 현장 작업 중지 기준이 m/s라서).
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<object>} Open-Meteo forecast 응답
 */
export async function getForecast(lat, lon) {
  const url = `${FORECAST_URL}?${forecastParams(lat, lon)}`;
  log("날씨 조회:", url);
  return fetchJson(url, "날씨 조회");
}

/**
 * 여러 지역의 날씨를 한 번에 가져온다 (메인 화면 "지금 전국 현장 날씨" 카드용).
 * Open-Meteo는 좌표를 쉼표로 이어 보내면 같은 순서의 배열로 돌려준다 (실측 확인).
 * @param {Array<{latitude: number, longitude: number}>} places
 * @returns {Promise<Array<object>>} places와 같은 순서의 forecast 응답 배열
 */
export async function getForecastMany(places) {
  const lats = places.map((p) => p.latitude).join(",");
  const lons = places.map((p) => p.longitude).join(",");
  const data = await fetchJson(`${FORECAST_URL}?${forecastParams(lats, lons)}`, "여러 지역 날씨 조회");
  return Array.isArray(data) ? data : [data];
}

function forecastParams(lat, lon) {
  return new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code,precipitation",
    hourly: "temperature_2m,weather_code,precipitation_probability",
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "apparent_temperature_max",
      "apparent_temperature_min",
      "precipitation_sum",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
    ].join(","),
    timezone: "auto",
    forecast_days: "7",
    wind_speed_unit: "ms",
  }).toString();
}

/**
 * 오늘의 미세먼지(PM10)·초미세먼지(PM2.5) 현재값과 오늘 최고값을 가져온다.
 * @returns {Promise<{pm10: number|null, pm25: number|null, pm10Max: number|null, pm25Max: number|null}>}
 */
export async function getAirQuality(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "pm10,pm2_5",
    hourly: "pm10,pm2_5",
    timezone: "auto",
    forecast_days: "1",
  });
  const data = await fetchJson(`${AIR_QUALITY_URL}?${params.toString()}`, "미세먼지 조회");
  const max = (arr) => {
    const nums = (arr ?? []).filter((v) => typeof v === "number");
    return nums.length ? Math.max(...nums) : null;
  };
  return {
    pm10: data.current?.pm10 ?? null,
    pm25: data.current?.pm2_5 ?? null,
    pm10Max: max(data.hourly?.pm10),
    pm25Max: max(data.hourly?.pm2_5),
  };
}

/**
 * 좌표를 "서울특별시 강남구" 같은 이름으로 바꾼다 (현재 위치로 조회할 때).
 * 실패하면 null을 돌려주고, 부르는 쪽이 "현재 위치"로 대신 표시한다.
 * @returns {Promise<{name: string, admin1: string|null, country: string|null, country_code: string|null}|null>}
 */
export async function reverseGeocode(lat, lon) {
  try {
    const params = new URLSearchParams({ latitude: lat, longitude: lon, localityLanguage: "ko" });
    const data = await fetchJson(`${REVERSE_GEOCODE_URL}?${params.toString()}`, "위치 이름 조회");
    const admins = data.localityInfo?.administrative ?? [];
    // adminLevel 6 = 시·군·구 (실측: 2 대한민국, 4 서울특별시, 6 강남구, 8 역삼1동)
    const district = admins.find((a) => a.adminLevel === 6)?.name;
    const name = district || data.city || data.locality;
    if (!name) return null;
    return {
      name,
      admin1: data.principalSubdivision || null,
      country: data.countryName || null,
      country_code: data.countryCode || null,
    };
  } catch (err) {
    log("위치 이름 조회 실패:", err);
    return null;
  }
}
