// Kakao 지도 SDK 불러오기 · 지도 그리기. 키가 없거나 불러오지 못하면 예시 지도(SVG)로 대신한다.
// ※ 실제 Kakao 호출은 JS 키를 넣은 뒤 확인해야 한다 (키 없이 시험한 것은 예시 지도뿐).
import { CONFIG } from "./config.js";

let loading = null;
export const kakaoState = { error: "" }; // SDK 를 못 불러온 이유 (화면 안내용)

export function ensureKakao() {
  if (!CONFIG.KAKAO_JS_KEY) return Promise.resolve(false);
  if (window.kakao?.maps?.services) return Promise.resolve(true);
  if (loading) return loading;
  loading = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(CONFIG.KAKAO_JS_KEY)}&libraries=services&autoload=false`;
    s.onload = () => window.kakao.maps.load(() => resolve(true));
    s.onerror = () => {
      kakaoState.error = "Kakao 지도 SDK를 불러오지 못했어요. JavaScript 키와 허용 도메인(" + location.origin + ") 등록, 네트워크를 확인하세요.";
      resolve(false);
    };
    document.head.appendChild(s);
  });
  return loading;
}

export const kakaoReady = () => !!window.kakao?.maps?.services;

// 반경 내 검색을 Promise로 (카테고리 또는 키워드, 최대 3쪽 = 45곳)
export function searchAround({ category, keyword }, lat, lng, radius) {
  const { maps } = window.kakao;
  const ps = new maps.services.Places();
  const center = new maps.LatLng(lat, lng);
  return new Promise((resolve) => {
    const items = [];
    let pages = 0;
    const cb = (data, status, pagination) => {
      if (status === maps.services.Status.OK) {
        data.forEach((d) => items.push({ id: d.id, name: d.place_name, lat: Number(d.y), lng: Number(d.x), dist: Number(d.distance) }));
        pages += 1;
        if (pagination.hasNextPage && pages < 3) return pagination.nextPage();
        return resolve({ items, capped: pagination.hasNextPage || items.length >= 45 });
      }
      resolve({ items, capped: false });
    };
    const opt = { location: center, radius, sort: maps.services.SortBy.DISTANCE };
    if (category) ps.categorySearch(category, cb, opt);
    else ps.keywordSearch(keyword, cb, opt);
  });
}

// 장소 이름 → 좌표 → 행정동 (Kakao). 동 이름은 주소 검색이 동의 중심 좌표를 주므로 먼저 쓰고, 없으면 키워드(장소) 검색.
export function findPlace(text) {
  const { maps } = window.kakao;
  const geo = new maps.services.Geocoder();
  const ps = new maps.services.Places();
  const toPlace = (x, y, label) => new Promise((resolve) => {
    geo.coord2RegionCode(x, y, (res, st) => {
      if (st !== maps.services.Status.OK) return resolve(null);
      const h = res.find((r) => r.region_type === "H") || res[0];
      resolve({ name: h.region_3depth_name, guName: h.region_2depth_name, gu: String(h.code).slice(0, 5), dongCode: h.code, lat: Number(y), lng: Number(x), label });
    });
  });
  const byAddress = new Promise((resolve) => {
    geo.addressSearch(text, (data, status) => {
      if (status !== maps.services.Status.OK || !data.length) return resolve(null);
      const seoul = data.find((d) => (d.address?.region_1depth_name || "").startsWith("서울")) || data[0];
      resolve(toPlace(seoul.x, seoul.y, seoul.address_name));
    });
  });
  return byAddress.then((r) => r || new Promise((resolve) => {
    ps.keywordSearch(text, (data, status) => {
      if (status !== maps.services.Status.OK || !data.length) return resolve(null);
      resolve(toPlace(data[0].x, data[0].y, data[0].place_name));
    });
  }));
}

// ── 지도 그리기 ───────────────────────────────────────
// 진짜 지도(Kakao) 또는 예시 지도. 둘 다 같은 모양으로 돌려준다.
export async function drawMap(el, place, comps, radius, industryIcon) {
  const ok = await ensureKakao();
  if (ok) {
    el.innerHTML = "";
    const { maps } = window.kakao;
    const center = new maps.LatLng(place.lat, place.lng);
    const map = new maps.Map(el, { center, level: 4 });
    new maps.Circle({ center, radius, strokeWeight: 2, strokeColor: "#2563eb", strokeStyle: "dashed", fillColor: "#2563eb", fillOpacity: 0.07 }).setMap(map);
    new maps.CustomOverlay({ position: center, yAnchor: 1.6, content: `<div class="pin-label">${place.name}</div>` }).setMap(map);
    new maps.Marker({ position: center, map });
    comps.items.slice(0, 80).forEach((c) => new maps.CustomOverlay({ position: new maps.LatLng(c.lat, c.lng), content: `<div class="pin">${industryIcon}</div>`, map }));
    return "kakao";
  }
  el.innerHTML = demoMapSvg(place, comps, industryIcon);
  return "demo";
}

function demoMapSvg(place, comps, icon) {
  // 위·경도 차이를 화면 좌표로 바꿔 점포를 찍는 예시 지도 (실제 지도 아님)
  const cx = 180, cy = 170, scale = 28000;
  const pts = comps.items.slice(0, 45).map((c) => {
    const x = cx + (c.lng - place.lng) * scale * 0.85;
    const y = cy - (c.lat - place.lat) * scale;
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="10" class="mk"/><text y="3.5" text-anchor="middle" class="mk-t">${icon}</text></g>`;
  }).join("");
  return `<svg viewBox="0 0 360 330" preserveAspectRatio="xMidYMid slice" aria-label="예시 지도">
  <defs><radialGradient id="hm"><stop offset="0" class="hm-a" stop-opacity=".55"/><stop offset="1" class="hm-a" stop-opacity="0"/></radialGradient></defs>
  <path d="M-10 250 C80 210 150 260 250 190 S360 150 380 140" class="river" stroke-width="26" fill="none"/>
  <g class="road"><line x1="0" y1="90" x2="360" y2="70"/><line x1="0" y1="200" x2="360" y2="215"/><line x1="60" y1="0" x2="90" y2="330"/><line x1="210" y1="0" x2="190" y2="330"/><line x1="300" y1="0" x2="320" y2="330"/></g>
  <circle cx="150" cy="130" r="90" fill="url(#hm)"/><circle cx="235" cy="215" r="70" fill="url(#hm)"/><circle cx="90" cy="235" r="60" fill="url(#hm)"/>
  <circle cx="${cx}" cy="${cy}" r="${Math.round((CONFIG.RADIUS_M / 111000) * scale)}" class="radius"/>
  ${pts}
  <circle cx="${cx}" cy="${cy}" r="9" class="me"/>
  <rect x="${cx - 34}" y="${cy - 48}" width="68" height="21" rx="10" class="lab"/><text x="${cx}" y="${cy - 34}" text-anchor="middle" class="lab-t">${place.name}</text>
  <text x="12" y="322" class="demo-t">예시 지도 · Kakao 키를 설정하면 실제 지도가 표시됩니다</text></svg>`;
}
