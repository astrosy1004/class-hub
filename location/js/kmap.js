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

// Kakao 장소 문서 → 점포 정보 (지도 마커 · 상세 카드에 쓰는 필드만)
export function toStore(d) {
  return {
    id: d.id, name: d.place_name, lat: Number(d.y), lng: Number(d.x), dist: Number(d.distance),
    category: d.category_name || "", address: d.road_address_name || d.address_name || "", phone: d.phone || "", url: d.place_url || "",
  };
}

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

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
        data.forEach((d) => items.push(toStore(d)));
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

// 좌표 → 행정동 (현재 위치 검색용)
export function placeFromCoords(lat, lng) {
  const { maps } = window.kakao;
  const geo = new maps.services.Geocoder();
  return new Promise((resolve) => {
    geo.coord2RegionCode(lng, lat, (res, st) => {
      if (st !== maps.services.Status.OK) return resolve(null);
      const h = res.find((r) => r.region_type === "H") || res[0];
      resolve({ name: h.region_3depth_name, guName: h.region_2depth_name, gu: String(h.code).slice(0, 5), dongCode: h.code, lat, lng, label: "현재 위치" });
    });
  });
}

// ── 지도 그리기 ───────────────────────────────────────
// 진짜 지도(Kakao) 또는 예시 지도. 둘 다 같은 조작 객체를 돌려준다: { mode, select(i), clear(), relayout?() }
// 점포 마커를 누르면 onSelect(점포, 순번) 이 불리고, 지도의 빈 곳을 누르거나 clear() 하면 onSelect(null).
export const MAX_MARKERS = 80;

export async function drawMap(el, place, comps, radius, industryIcon, { onSelect = () => {} } = {}) {
  const items = comps.items.slice(0, MAX_MARKERS);
  const ok = await ensureKakao();
  if (ok) {
    el.innerHTML = "";
    const { maps } = window.kakao;
    const center = new maps.LatLng(place.lat, place.lng);
    const map = new maps.Map(el, { center, level: 4 });
    new maps.Circle({ center, radius, strokeWeight: 2, strokeColor: "#2563eb", strokeStyle: "dashed", fillColor: "#2563eb", fillOpacity: 0.07 }).setMap(map);
    new maps.CustomOverlay({ position: center, yAnchor: 1.6, content: `<div class="pin-label">${place.isCurrent ? "📍 현재 위치" : esc(place.name)}</div>` }).setMap(map);
    new maps.Marker({ position: center, map });
    const pins = items.map((c, i) => {
      const pin = document.createElement("div");
      pin.className = "pin";
      pin.textContent = industryIcon;
      pin.setAttribute("role", "button");
      pin.setAttribute("aria-label", `${c.name} 상세 보기`);
      pin.tabIndex = 0;
      pin.addEventListener("click", (ev) => { ev.stopPropagation(); ctrl.select(i); });
      pin.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); ctrl.select(i); } });
      new maps.CustomOverlay({ position: new maps.LatLng(c.lat, c.lng), content: pin, map, clickable: true, zIndex: 3 });
      return pin;
    });
    let cur = -1;
    const ctrl = {
      mode: "kakao",
      select(i) {
        if (cur >= 0) pins[cur]?.classList.remove("sel");
        cur = i;
        pins[i]?.classList.add("sel");
        const c = items[i];
        if (c) {
          // 상세 카드가 지도 아래쪽을 가리므로, 선택한 점포가 카드 위쪽에 오도록 중심을 점포보다 아래로 둔다
          const ll = new maps.LatLng(c.lat, c.lng);
          try {
            const proj = map.getProjection();
            const pt = proj.containerPointFromCoords(ll);
            map.panTo(proj.coordsFromContainerPoint(new maps.Point(pt.x, pt.y + 95)));
          } catch (e) {
            map.panTo(ll);
          }
        }
        onSelect(c || null, i);
      },
      clear() {
        if (cur >= 0) pins[cur]?.classList.remove("sel");
        cur = -1;
        onSelect(null, -1);
      },
      // 지도 상자 크기가 바뀐 뒤(작게 ↔ 크게) 타일을 다시 그리고 중심을 맞춘다
      relayout() {
        map.relayout();
        map.setCenter(center);
      },
    };
    maps.event.addListener(map, "click", () => ctrl.clear());
    return ctrl;
  }
  // 예시 지도(SVG): 점포 원을 누르면 같은 방식으로 선택
  el.innerHTML = demoMapSvg(place, { ...comps, items }, industryIcon);
  const gs = [...el.querySelectorAll("g[data-i]")];
  let cur = -1;
  const ctrl = {
    mode: "demo",
    select(i) {
      if (cur >= 0) gs[cur]?.classList.remove("sel");
      cur = i;
      gs[i]?.classList.add("sel");
      onSelect(items[i] || null, i);
    },
    clear() {
      if (cur >= 0) gs[cur]?.classList.remove("sel");
      cur = -1;
      onSelect(null, -1);
    },
  };
  gs.forEach((g) => g.addEventListener("click", (ev) => { ev.stopPropagation(); ctrl.select(Number(g.dataset.i)); }));
  el.querySelector("svg")?.addEventListener("click", () => ctrl.clear());
  return ctrl;
}

function demoMapSvg(place, comps, icon) {
  // 위·경도 차이를 화면 좌표로 바꿔 점포를 찍는 예시 지도 (실제 지도 아님)
  const cx = 180, cy = 170, scale = 28000;
  const pts = comps.items.slice(0, 45).map((c, i) => {
    const x = cx + (c.lng - place.lng) * scale * 0.85;
    const y = cy - (c.lat - place.lat) * scale;
    return `<g data-i="${i}" class="store-g" role="button" tabindex="0" aria-label="${esc(c.name)} 상세 보기" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="10" class="mk"/><text y="3.5" text-anchor="middle" class="mk-t">${icon}</text></g>`;
  }).join("");
  return `<svg viewBox="0 0 360 330" preserveAspectRatio="xMidYMid slice" aria-label="예시 지도">
  <defs><radialGradient id="hm"><stop offset="0" class="hm-a" stop-opacity=".55"/><stop offset="1" class="hm-a" stop-opacity="0"/></radialGradient></defs>
  <path d="M-10 250 C80 210 150 260 250 190 S360 150 380 140" class="river" stroke-width="26" fill="none"/>
  <g class="road"><line x1="0" y1="90" x2="360" y2="70"/><line x1="0" y1="200" x2="360" y2="215"/><line x1="60" y1="0" x2="90" y2="330"/><line x1="210" y1="0" x2="190" y2="330"/><line x1="300" y1="0" x2="320" y2="330"/></g>
  <circle cx="150" cy="130" r="90" fill="url(#hm)"/><circle cx="235" cy="215" r="70" fill="url(#hm)"/><circle cx="90" cy="235" r="60" fill="url(#hm)"/>
  <circle cx="${cx}" cy="${cy}" r="${Math.round((CONFIG.RADIUS_M / 111000) * scale)}" class="radius"/>
  ${pts}
  <circle cx="${cx}" cy="${cy}" r="9" class="me"/>
  <rect x="${cx - 34}" y="${cy - 48}" width="68" height="21" rx="10" class="lab"/><text x="${cx}" y="${cy - 34}" text-anchor="middle" class="lab-t">${place.isCurrent ? "현재 위치" : esc(place.name)}</text>
  <text x="12" y="322" class="demo-t">예시 지도 · Kakao 키를 설정하면 실제 지도가 표시됩니다</text></svg>`;
}
