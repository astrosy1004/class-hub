// SVG 아이콘 모음 (이모지 대신 쓰는 모던 아이콘). 직접 그린 경로라 외부 라이브러리가 필요 없다.
// - LINE: 24x24 선 아이콘. 색은 currentColor라 CSS color로 바뀐다.
// - ART: 64x64 그라디언트 일러스트(날씨·빠른 메뉴). 그라디언트는 index.html의 <defs>에 한 번만 정의해 두고
//   url(#g-...)로 참조한다 (아이콘을 여러 번 그려도 같은 id가 중복 정의되지 않게).

const LINE = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5 21 21"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  home: '<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>',
  cloud: '<path d="M7 18.5h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.1 11.6 3.5 3.5 0 0 0 7 18.5z"/>',
  shield: '<path d="M12 3 19.5 6v6c0 4.5-3.2 8.2-7.5 9-4.3-.8-7.5-4.5-7.5-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
  chevronLeft: '<path d="m15 5-7 7 7 7"/>',
  chevronRight: '<path d="m9 5 7 7-7 7"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM18 18h2v2h-2zM20 14v1.5M14 20h1.5"/>',
  chat: '<path d="M4 11.5C4 7.4 7.6 4 12 4s8 3.4 8 7.5S16.4 19 12 19c-1 0-2-.2-2.9-.5L5 20l1.2-3.4A7.2 7.2 0 0 1 4 11.5z"/>',
  droplet: '<path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z"/>',
  umbrella: '<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v6.5a2 2 0 0 1-4 0M12 3v0"/>',
  wind: '<path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7"/>',
  alert: '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>',
  thermometer: '<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
  pause: '<circle cx="12" cy="12" r="8.5"/><path d="M10 9v6M14 9v6"/>',
  shirt: '<path d="m8 4-5 3 2 4 2-1v10h10V10l2 1 2-4-5-3a4 4 0 0 1-8 0z"/>',
  shelter: '<path d="M3 11 12 5l9 6"/><path d="M6 10v9M18 10v9M3 19h18"/>',
  heartPulse: '<path d="M12 20s-7.5-4.4-7.5-10A4 4 0 0 1 12 7.4 4 4 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/><path d="M7.5 12.5h2.5l1-2 2 4 1-2h2.5"/>',
  hand: '<path d="M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6 7-3 0-4.5-1.7-6-4.3l-2-3.3a1.5 1.5 0 0 1 2.6-1.5L8 13"/>',
  cup: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5v2M11 3v2.5M14 3.5v2"/>',
  snowflake: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2"/>',
  flame: '<path d="M12 21a6 6 0 0 0 6-6c0-3.5-2.5-5.5-3.5-8.5-.8 2-2 3-3 3.3.2-2.3-.7-4.5-2.5-6.3C9 7 6 9.5 6 15a6 6 0 0 0 6 6z"/>',
  brick: '<path d="M3 6h18v12H3zM3 12h18M10 6v6M14 12v6"/>',
  crane: '<path d="M6 21V4M3 21h6M6 4h14M6 8.5 10.5 4M17 4v5"/><path d="M15 9h4v3h-4z"/>',
  zap: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
  slope: '<path d="m3 20 6-9 4 5 3-3 5 7z"/><path d="M9 11V7M16 13V9"/>',
  boot: '<path d="M7 3h5v8l6 2.5a2 2 0 0 1 1.5 1.9V19h-15v-5L7 11z"/><path d="M4.5 17h15"/>',
  storm: '<path d="M7 16a4 4 0 0 1-.9-7.9A6 6 0 0 1 17.6 8 4 4 0 0 1 17 16"/><path d="m12.5 12-2.5 4h3l-2 4"/>',
  harness: '<circle cx="12" cy="5.5" r="2.5"/><path d="M8 21v-7a4 4 0 0 1 8 0v7M8.5 14.5l7 5M15.5 14.5l-7 5"/>',
  strap: '<path d="M3 9h18v9H3zM7 9V6M17 9V6M3 13.5h18"/>',
  cone: '<path d="M9.5 3h5l4 16h-13z"/><path d="M8 9h8M6.7 14h10.6M3 21h18"/>',
  vest: '<path d="m8 3 4 5 4-5 3 2v15H5V5z"/><path d="M5 13.5h14M12 8v12"/>',
  mask: '<path d="M4 9c3-1 5-2 8-2s5 1 8 2v4c0 3-4 6-8 6s-8-3-8-6z"/><path d="M2 9h2M20 9h2M8 12h8M9 15h6"/>',
  timer: '<circle cx="12" cy="13" r="7.5"/><path d="M12 13V9.5M10 3h4M18 6.5l1.5-1.5"/>',
  spray: '<path d="M8 21a3 3 0 0 1-3-3c0-2 3-5 3-5s3 3 3 5a3 3 0 0 1-3 3zM16 12a3 3 0 0 1-3-3c0-2 3-5 3-5s3 3 3 5a3 3 0 0 1-3 3zM17 21a2 2 0 0 1-2-2c0-1.3 2-3.3 2-3.3s2 2 2 3.3a2 2 0 0 1-2 2z"/>',
  lungs: '<path d="M9.5 7C6.5 7 4 11 4 16c0 2 1 4 3 4 2.5 0 2.5-2 2.5-4V9M14.5 7c3 0 5.5 4 5.5 9 0 2-1 4-3 4-2.5 0-2.5-2-2.5-4V9M12 3v7l-2.5 1.5M12 10l2.5 1.5"/>',
  sparkles: '<path d="m11 3 1.6 4.4L17 9l-4.4 1.6L11 15l-1.6-4.4L5 9l4.4-1.6zM18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9z"/>',
  helmet: '<path d="M5 16.5V15a7 7 0 0 1 14 0v1.5"/><path d="M10 8.3V12M14 8.3V12M3 16.5h18v1.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
  bottle: '<path d="M10 3h4v3h-4z"/><path d="M8.5 6h7l1 3v11a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V9zM10 13h4"/>',
  wrench: '<path d="M14.7 6.3a4.5 4.5 0 0 0 5.9 5.9L12 20.8a2.1 2.1 0 0 1-3-3l8.6-8.6"/><path d="M14.7 6.3 17 4l3 3-2.3 2.3"/>',
  clipboard: '<path d="M9 3.5h6v3H9z"/><path d="M9 5H6v15.5h12V5h-3M9 13l2 2 4-4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  rain: '<path d="M7 15a4 4 0 0 1-.9-7.9A6 6 0 0 1 17.6 7 4 4 0 0 1 17 15z"/><path d="m8 18-1 2.5M12 18l-1 2.5M16 18l-1 2.5"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.3L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.3 4.3L20 15.5M20 20v-4.5h-4.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
};

// 일러스트용 공통 조각
const CLOUD = (y = 0, fill = "url(#g-cloud)") =>
  `<path transform="translate(0 ${y})" d="M17 49h31a11 11 0 0 0 1.4-21.9A15 15 0 0 0 20.6 30 9.5 9.5 0 0 0 17 49z" fill="${fill}" stroke="#9fb0c9" stroke-width="1.6"/>`;
// 해: 주황 원 + 둥근 햇살 8개 (첨부 이미지처럼 멀리서도 해로 읽히게)
const SUN = (cx, cy, r) => {
  const rays = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i;
    const x1 = (cx + Math.cos(a) * (r + 4)).toFixed(1);
    const y1 = (cy + Math.sin(a) * (r + 4)).toFixed(1);
    const x2 = (cx + Math.cos(a) * (r + 9)).toFixed(1);
    const y2 = (cy + Math.sin(a) * (r + 9)).toFixed(1);
    rays.push(`M${x1} ${y1}L${x2} ${y2}`);
  }
  return (
    `<path d="${rays.join("")}" stroke="#ffa21f" stroke-width="${Math.max(3, r / 4).toFixed(1)}" stroke-linecap="round"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#g-sun)"/>`
  );
};
// 빗방울: 목록 크기(34px)에서도 보이도록 큼직하게
const DROPS = '<path d="M22 47c-2.2 3.6-3.8 6.2-3.8 8.3a3.8 3.8 0 0 0 7.6 0c0-2.1-1.6-4.7-3.8-8.3zM33 50c-2.2 3.6-3.8 6.2-3.8 8.3a3.8 3.8 0 0 0 7.6 0c0-2.1-1.6-4.7-3.8-8.3zM44 47c-2.2 3.6-3.8 6.2-3.8 8.3a3.8 3.8 0 0 0 7.6 0c0-2.1-1.6-4.7-3.8-8.3z" fill="url(#g-drop)"/>';

const ART = {
  sun: SUN(32, 32, 15),
  partly: `${SUN(25, 24, 12)}${CLOUD(4)}`,
  cloud: `${CLOUD(-4, "url(#g-cloud-dark)")}${CLOUD(2)}`,
  fog: `${CLOUD(-6)}<rect x="12" y="48" width="40" height="4" rx="2" fill="#c3cfe0"/><rect x="18" y="55" width="30" height="4" rx="2" fill="#d6dfeb"/>`,
  rain: `${CLOUD(-6, "url(#g-cloud-dark)")}${DROPS}`,
  snow: `${CLOUD(-6)}<g fill="#9cc3ff"><circle cx="24" cy="54" r="2.6"/><circle cx="34" cy="57" r="2.6"/><circle cx="44" cy="54" r="2.6"/></g>`,
  storm: `${CLOUD(-6, "url(#g-cloud-dark)")}<path d="M34 42 26 54h7l-3 9 10-13h-7l3-8z" fill="url(#g-bolt)"/>`,
  unknown: CLOUD(0),

  // 빠른 메뉴 (원티드 스타일의 겹친 그라디언트 도형)
  quickWeather: `${SUN(26, 22, 11)}${CLOUD(6)}`,
  quickRules:
    '<path d="M36 10 54 17v13c0 11-7.6 19.5-18 22-2-.5-4-1.3-5.7-2.3" fill="#c9d8ff"/>' +
    '<path d="M28 8 46 15v13c0 11-7.6 19.5-18 22C17.6 47.5 10 39 10 28V15z" fill="url(#g-blue)"/>' +
    '<path d="m20 28 6 6 11-12" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>',
  quickAlert:
    '<circle cx="46" cy="16" r="7" fill="#ff5a5f"/>' +
    '<path d="M16 42V29a16 16 0 0 1 32 0v13l4 5H12z" fill="url(#g-orange)"/>' +
    '<path d="M26 50a6 6 0 0 0 12 0z" fill="#ff8a3d"/>' +
    '<path d="M22 28a10 10 0 0 1 8-9.6" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>',
  quickShare:
    '<circle cx="32" cy="32" r="24" fill="#efeaff"/><circle cx="32" cy="32" r="17" fill="none" stroke="url(#g-violet)" stroke-width="4"/>' +
    '<circle cx="32" cy="32" r="9" fill="url(#g-violet)"/>' +
    '<path d="M32 32 50 14M44 12h8v8" fill="none" stroke="#5b3fd6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',

  // 로고 마크 (안전모)
  brand:
    '<path d="M9 42a23 23 0 0 1 46 0z" fill="url(#g-yellow)"/>' +
    '<path d="M28 19.4a23 23 0 0 1 8 0V42h-8z" fill="#ffffff" fill-opacity=".55"/>' +
    '<path d="M5 41h50c4.4 0 8 1.8 8 4.5S59.4 50 55 50H5a4.5 4.5 0 0 1 0-9z" fill="url(#g-blue)"/>' +
    '<path d="M16 35a17 17 0 0 1 7-11" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>',
};

// --- 안전수칙용 컬러 일러스트 (64x64) -----------------------------------------
// 첨부 이미지처럼 색을 채운 그림이라 작은 크기에서도 무엇인지 바로 읽힌다.
// 키는 safety-rules.js의 icon 이름과 같다.

// 작업자 캐릭터(상반신). extra는 얼굴 위에 겹칠 소품, body는 옷 색.
const WORKER = (extra = "", body = "#3f6fe8") =>
  `<path d="M10 64c0-12.5 9.8-21 22-21s22 8.5 22 21z" fill="${body}"/>` +
  '<path d="M15 51c3.5-3.8 8-6.2 13-7v20H13z M49 51c-3.5-3.8-8-6.2-13-7v20h15z" fill="#ff8a3d"/>' +
  '<path d="M13.5 56h14.5v3H13zM36 56h14.5l.5 3H36z" fill="#eef3fa"/>' +
  '<circle cx="32" cy="31" r="11" fill="#ffd9b8"/>' +
  '<circle cx="28" cy="32" r="1.5" fill="#3a2e28"/><circle cx="36" cy="32" r="1.5" fill="#3a2e28"/>' +
  '<path d="M29.5 36.5a3.5 3.5 0 0 0 5 0" fill="none" stroke="#c9775a" stroke-width="1.5" stroke-linecap="round"/>' +
  '<path d="M19 28a13 13 0 0 1 26 0z" fill="url(#g-yellow)"/>' +
  '<rect x="16" y="26.5" width="32" height="4" rx="2" fill="#f5a524"/>' +
  '<path d="M30 16.2h4V27h-4z" fill="#ffffff" fill-opacity=".5"/>' +
  extra;

const ILLO = {
  // 분류 대표 그림
  sun: SUN(32, 32, 13),
  snowflake:
    '<g stroke="#3b8ef3" stroke-width="5" stroke-linecap="round"><path d="M32 8v48M11.2 20l41.6 24M52.8 20 11.2 44"/></g>' +
    '<g stroke="#8cc4ff" stroke-width="3.5" stroke-linecap="round" fill="none"><path d="m25 11 7 6 7-6M25 53l7-6 7 6"/></g>' +
    '<circle cx="32" cy="32" r="6" fill="#ffffff" stroke="#3b8ef3" stroke-width="3"/>',
  rain: `${CLOUD(-8, "#8fa6c6")}${DROPS}`,
  wind:
    '<g fill="none" stroke-linecap="round" stroke-width="5">' +
    '<path d="M8 24h30a7 7 0 1 0-7-7" stroke="#14b8a6"/>' +
    '<path d="M8 36h40a7 7 0 1 1-7 7" stroke="#2dd4bf"/>' +
    '<path d="M8 48h18" stroke="#99f0e2"/></g>',
  mask:
    '<path d="M6 26c3 0 5 .5 7 1.5M58 26c-3 0-5 .5-7 1.5" stroke="#5b8cff" stroke-width="3" stroke-linecap="round" fill="none"/>' +
    '<path d="M13 24c6-3 12-4.5 19-4.5S45 21 51 24v11c0 8-9 14-19 14s-19-6-19-14z" fill="#e3edff" stroke="#6f88b3" stroke-width="2.2"/>' +
    '<path d="M18 30h28M19 36h26M22 42h20" stroke="#a9bde0" stroke-width="2.5" stroke-linecap="round"/>' +
    '<rect x="26" y="12" width="12" height="5" rx="2.5" fill="#5b8cff"/>',
  helmet:
    '<path d="M11 42a21 21 0 0 1 42 0z" fill="url(#g-yellow)"/>' +
    '<path d="M28 21.4a21 21 0 0 1 8 0V42h-8z" fill="#ffffff" fill-opacity=".55"/>' +
    '<path d="M6 41h48c4.5 0 8 1.8 8 4.5S58.5 50 54 50H6a4.5 4.5 0 0 1 0-9z" fill="#f5a524"/>' +
    '<path d="M17 36a16 16 0 0 1 6-10" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="3" stroke-linecap="round"/>',

  // 더위
  droplet:
    '<rect x="20" y="16" width="24" height="42" rx="8" fill="url(#g-drop)"/>' +
    '<rect x="24" y="8" width="16" height="9" rx="3" fill="#2f5cf5"/>' +
    '<rect x="20" y="30" width="24" height="12" fill="#ffffff" fill-opacity=".85"/>' +
    '<path d="M32 32.5c-1.8 2.4-3 4-3 5.3a3 3 0 0 0 6 0c0-1.3-1.2-2.9-3-5.3z" fill="#3366ff"/>' +
    '<rect x="24" y="20" width="3" height="8" rx="1.5" fill="#ffffff" fill-opacity=".6"/>',
  pause:
    '<circle cx="30" cy="32" r="21" fill="#ffffff" stroke="#ff8a3d" stroke-width="5"/>' +
    '<path d="M30 20v12l8 5" fill="none" stroke="#46474c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="48" cy="48" r="11" fill="#ff6a1f"/>' +
    '<path d="M45 43.5v9M51 43.5v9" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>',
  shirt:
    '<path d="M22 8 6 17l6 13 6-3v31h28V27l6 3 6-13-16-9c-1.5 5-5.5 8-10 8s-8.5-3-10-8z" fill="#5b8cff"/>' +
    '<path d="M22 8c1.5 5 5.5 8 10 8s8.5-3 10-8" fill="none" stroke="#2f5cf5" stroke-width="3"/>' +
    '<g fill="#dfe8ff"><circle cx="26" cy="32" r="2"/><circle cx="32" cy="38" r="2"/><circle cx="38" cy="32" r="2"/><circle cx="26" cy="44" r="2"/><circle cx="38" cy="44" r="2"/></g>',
  shelter:
    '<ellipse cx="32" cy="57" rx="22" ry="4" fill="#dfe3ea"/>' +
    '<path d="M31 30h3v27h-3z" fill="#8b5a2b"/>' +
    '<path d="M6 32a26 26 0 0 1 52 0z" fill="#ff7043"/>' +
    '<path d="M24 32a8 26 0 0 1 16 0z" fill="#ffffff"/>' +
    '<path d="M6 32a26 26 0 0 1 52 0" fill="none" stroke="#e5543a" stroke-width="2"/>',
  heartPulse:
    '<path d="M32 56S7 42 7 24a12 12 0 0 1 25-7 12 12 0 0 1 25 7c0 18-25 32-25 32z" fill="#ff5a6a"/>' +
    '<path d="M14 31h9l4-7 6 13 4-6h13" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>',

  // 추위
  hand:
    '<path d="M16 36V20a5 5 0 0 1 10 0v4-9a5 5 0 0 1 10 0v12-6a5 5 0 0 1 10 0v17c0 11-6 16-14 16h-2c-6 0-10-3-13-8l-6-9a4 4 0 0 1 6.5-4.6z" fill="#ff8a3d"/>' +
    '<rect x="18" y="50" width="28" height="10" rx="4" fill="#ffc27a"/>' +
    '<path d="M20 54h24" stroke="#ff8a3d" stroke-width="2" stroke-dasharray="3 3"/>',
  cup:
    '<path d="M12 24h32v18a12 12 0 0 1-12 12h-8a12 12 0 0 1-12-12z" fill="#e5484d"/>' +
    '<path d="M44 28h4a7 7 0 0 1 0 14h-4" fill="none" stroke="#e5484d" stroke-width="5"/>' +
    '<rect x="12" y="24" width="32" height="5" fill="#ff8a8f"/>' +
    '<path d="M20 8c-3 3 3 6 0 10M28 6c-3 3 3 6 0 10M36 8c-3 3 3 6 0 10" fill="none" stroke="#b9c6da" stroke-width="3" stroke-linecap="round"/>',
  flame:
    '<path d="M32 60c-11 0-18-7.5-18-17 0-9.5 7-14 9-23 3 3 4 7 4 10 3-2 6-8 5-18 11 7 16 18 16 30 0 10-6.5 18-16 18z" fill="url(#g-orange)"/>' +
    '<path d="M32 60c-5 0-9-3.5-9-8.5 0-5 4-7.5 5.5-12 3 3 3.5 5 3.5 7 2-1 3.5-3.5 3.5-6.5 4 3 5.5 7 5.5 11.5 0 5-4 8.5-9 8.5z" fill="#ffd166"/>',
  brick:
    '<g fill="#e07a4f" stroke="#fff" stroke-width="2.5">' +
    '<rect x="6" y="14" width="26" height="12" rx="2"/><rect x="32" y="14" width="26" height="12" rx="2"/>' +
    '<rect x="-7" y="26" width="26" height="12" rx="2"/><rect x="19" y="26" width="26" height="12" rx="2"/><rect x="45" y="26" width="26" height="12" rx="2"/>' +
    '<rect x="6" y="38" width="26" height="12" rx="2"/><rect x="32" y="38" width="26" height="12" rx="2"/></g>' +
    '<circle cx="50" cy="52" r="9" fill="#3b8ef3"/><path d="M50 46v12M44.8 49l10.4 6M55.2 49l-10.4 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',

  // 강수
  crane:
    '<rect x="20" y="16" width="8" height="42" fill="#f5b01e"/>' +
    '<path d="M20 16l8 7-8 7 8 7-8 7 8 7-8 7" fill="none" stroke="#c98a00" stroke-width="1.8"/>' +
    '<rect x="8" y="12" width="52" height="6" rx="1" fill="#f5b01e"/>' +
    '<path d="M24 4 12 12h24z" fill="#f5b01e"/>' +
    '<rect x="8" y="18" width="8" height="8" fill="#6b7384"/>' +
    '<rect x="28" y="18" width="7" height="7" rx="1" fill="#3366ff"/>' +
    '<path d="M50 18v20" stroke="#46474c" stroke-width="1.8"/>' +
    '<rect x="44" y="38" width="12" height="9" rx="1.5" fill="#8a94a6"/>' +
    '<rect x="12" y="58" width="24" height="4" rx="1" fill="#6b7384"/>',
  zap:
    '<rect x="10" y="10" width="44" height="44" rx="12" fill="#fff4cc"/>' +
    '<path d="M35 8 16 36h13l-4 20 21-30H33z" fill="url(#g-bolt)" stroke="#d98200" stroke-width="2" stroke-linejoin="round"/>',
  slope:
    '<path d="M4 56 22 26l10 10 8-10 20 30z" fill="#b07a45"/>' +
    '<path d="M22 26l10 10 8-10" fill="none" stroke="#6cc070" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="m27 40 4 5-3 4 4 6" fill="none" stroke="#5a3a1b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M50 8 38 30h24z" fill="#ffc233"/><path d="M50 16v7M50 26.5v.5" stroke="#3a2e28" stroke-width="3" stroke-linecap="round"/>',
  boot:
    '<path d="M14 8h18v22l16 7c5 2 8 5.5 8 10v5H10V34l4-4z" fill="#8b5a2b"/>' +
    '<rect x="8" y="52" width="50" height="7" rx="3" fill="#3a2e28"/>' +
    '<path d="M44 36c5 2 12 4 12 12v4H38V38z" fill="#a0a9b8"/>' +
    '<path d="M18 16h10M18 22h10" stroke="#c99a67" stroke-width="3" stroke-linecap="round"/>',
  storm: `${CLOUD(-10, "url(#g-cloud-dark)")}<path d="M34 38 25 52h8l-4 11 12-16h-8l4-9z" fill="url(#g-bolt)" stroke="#d98200" stroke-width="1.5" stroke-linejoin="round"/>`,

  // 강풍
  harness: WORKER(
    '<path d="M16 50 44 64M48 50 20 64" stroke="#e5484d" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="32" cy="57" r="4" fill="#8a94a6" stroke="#46474c" stroke-width="1.5"/>'
  ),
  strap:
    '<rect x="8" y="26" width="48" height="30" rx="3" fill="#c58b52"/>' +
    '<rect x="14" y="12" width="36" height="16" rx="3" fill="#d9a26b"/>' +
    '<path d="M8 40h48M31 26v30" stroke="#a36d38" stroke-width="2"/>' +
    '<path d="M22 10v48M42 10v48" stroke="#3366ff" stroke-width="4.5"/>' +
    '<rect x="18" y="36" width="8" height="8" rx="2" fill="#1f4fe0"/><rect x="38" y="36" width="8" height="8" rx="2" fill="#1f4fe0"/>',
  cone:
    '<path d="M27 6h10l12 46H15z" fill="#ff7a1a"/>' +
    '<path d="M24.4 16h15.2l2.2 9H22.2zM20.6 32h22.8l2.1 8H18.5z" fill="#ffffff"/>' +
    '<rect x="8" y="52" width="48" height="7" rx="2" fill="#46474c"/>',
  vest:
    '<path d="M22 6 32 20 42 6l12 7v45H10V13z" fill="#ff8a3d"/>' +
    '<path d="M32 20v38" stroke="#e5652a" stroke-width="2.5"/>' +
    '<rect x="10" y="34" width="44" height="5" fill="#eef3fa"/><rect x="10" y="44" width="44" height="5" fill="#eef3fa"/>' +
    '<path d="M22 6 32 20 42 6" fill="none" stroke="#e5652a" stroke-width="2.5" stroke-linejoin="round"/>',

  // 미세먼지
  timer:
    '<circle cx="32" cy="36" r="22" fill="#ffffff" stroke="#7c4dff" stroke-width="5"/>' +
    '<rect x="26" y="4" width="12" height="6" rx="2" fill="#7c4dff"/><path d="M32 10v4" stroke="#7c4dff" stroke-width="4"/>' +
    '<path d="M32 36V22" stroke="#46474c" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M32 36 32 14A22 22 0 0 1 51 25z" fill="#b39cff" fill-opacity=".45"/>' +
    '<circle cx="32" cy="36" r="3.5" fill="#46474c"/>',
  spray:
    '<path d="M18 38c-3.5 5-6 8.5-6 11.5a6 6 0 0 0 12 0c0-3-2.5-6.5-6-11.5zM44 14c-3.5 5-6 8.5-6 11.5a6 6 0 0 0 12 0c0-3-2.5-6.5-6-11.5zM46 40c-2.7 3.8-4.5 6.4-4.5 8.7a4.5 4.5 0 0 0 9 0c0-2.3-1.8-4.9-4.5-8.7z" fill="url(#g-drop)"/>' +
    '<path d="M10 22c4-6 10-9 18-9" fill="none" stroke="#8cc8ff" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="1 7"/>',
  lungs:
    '<path d="M32 8v20" stroke="#e5627a" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M28 20C19 18 8 28 8 44c0 7 3 12 9 12 8 0 11-5 11-11z" fill="#ff8fa3"/>' +
    '<path d="M36 20c9-2 20 8 20 24 0 7-3 12-9 12-8 0-11-5-11-11z" fill="#ff8fa3"/>' +
    '<path d="M32 26l-8 6M32 26l8 6" stroke="#e5627a" stroke-width="3.5" stroke-linecap="round"/>',
  sparkles:
    '<rect x="8" y="34" width="34" height="20" rx="7" fill="#ff9ec4"/>' +
    '<rect x="13" y="38" width="12" height="4" rx="2" fill="#ffffff" fill-opacity=".7"/>' +
    '<g fill="#dff0ff" stroke="#8cc8ff" stroke-width="2"><circle cx="44" cy="22" r="9"/><circle cx="30" cy="20" r="6"/><circle cx="52" cy="40" r="5"/></g>' +
    '<circle cx="41" cy="19" r="2.5" fill="#ffffff"/>',

  // 기본
  bottle:
    '<rect x="22" y="4" width="20" height="10" rx="3" fill="#2f5cf5"/>' +
    '<path d="M18 14h28l-2 44H20z" fill="#ffc233"/>' +
    '<circle cx="32" cy="34" r="7" fill="#ff8a3d"/>' +
    '<path d="M32 22v4M32 42v4M20 34h4M40 34h4" stroke="#ff8a3d" stroke-width="2.5" stroke-linecap="round"/>',
  wrench:
    '<circle cx="42" cy="42" r="15" fill="#5b8cff"/><circle cx="42" cy="42" r="6" fill="#eaf0ff"/>' +
    '<path d="M42 24v5M42 55v5M24 42h5M55 42h5M29.3 29.3l3.5 3.5M51.2 51.2l3.5 3.5M29.3 54.7l3.5-3.5M51.2 32.8l3.5-3.5" stroke="#5b8cff" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M22 6a12 12 0 0 0-11 16L4 29l7 7 7-7a12 12 0 0 0 16-11l-6 3-6-6 3-6a12 12 0 0 0-3-3z" fill="#8a94a6"/>',
  clipboard:
    '<rect x="10" y="8" width="44" height="52" rx="5" fill="#c58b52"/>' +
    '<rect x="15" y="14" width="34" height="42" rx="2" fill="#ffffff"/>' +
    '<rect x="22" y="4" width="20" height="9" rx="3" fill="#8a94a6"/>' +
    '<path d="m19 25 3 3 5-6M19 37l3 3 5-6M19 49l3 3 5-6" fill="none" stroke="#00a86b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M31 26h13M31 38h13M31 50h10" stroke="#d5deec" stroke-width="3" stroke-linecap="round"/>',
};

// 상세 화면 머리 그림: 분류별로 소품이 다른 작업자 캐릭터
const WORKERS = {
  heat: WORKER(
    '<g transform="rotate(-35 46 30)"><rect x="42" y="20" width="9" height="18" rx="3" fill="url(#g-drop)"/><rect x="43.5" y="16" width="6" height="5" rx="1.5" fill="#2f5cf5"/></g>' +
      '<path d="M17 34c-1.3 1.8-2 3-2 4a2 2 0 0 0 4 0c0-1-.7-2.2-2-4z" fill="#6fb6ff"/>'
  ),
  cold: WORKER(
    '<rect x="21" y="41" width="22" height="6" rx="3" fill="#e5484d"/><rect x="36" y="44" width="5" height="12" rx="2" fill="#e5484d"/>' +
      '<circle cx="20.5" cy="32" r="4" fill="#e5484d"/><circle cx="43.5" cy="32" r="4" fill="#e5484d"/>',
    "#2f5cf5"
  ),
  rain: WORKER(
    '<path d="M8 12c-1.3 1.8-2 3-2 4a2 2 0 0 0 4 0c0-1-.7-2.2-2-4zM56 8c-1.3 1.8-2 3-2 4a2 2 0 0 0 4 0c0-1-.7-2.2-2-4zM54 26c-1.3 1.8-2 3-2 4a2 2 0 0 0 4 0c0-1-.7-2.2-2-4z" fill="#3366ff"/>',
    "#ffc233"
  ),
  wind: WORKER(
    '<path d="M2 14h10a3 3 0 1 0-3-3M2 22h14M52 40h10" fill="none" stroke="#14b8a6" stroke-width="3" stroke-linecap="round"/>'
  ),
  dust: WORKER(
    '<path d="M24 33c2.5-1 5-1.5 8-1.5s5.5.5 8 1.5v4c0 3-3.5 5.5-8 5.5s-8-2.5-8-5.5z" fill="#e3edff" stroke="#6f88b3" stroke-width="1.5"/>' +
      '<path d="M21 31.5l3 2M43 31.5l-3 2" stroke="#5b8cff" stroke-width="1.5"/>'
  ),
  basic: WORKER(
    '<circle cx="51" cy="14" r="9" fill="#00a86b"/><path d="m46.5 14 3 3 6-6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
};

/**
 * 안전수칙용 컬러 일러스트 SVG 문자열 (64x64).
 * @param {string} name ILLO의 키 (safety-rules.js의 icon 이름)
 * @param {string} [cls] 추가 class
 */
export function illo(name, cls = "") {
  const body = ILLO[name] ?? ILLO.helmet;
  return `<svg class="illo ${cls}" viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
}

/** 상세 화면 머리의 작업자 캐릭터 (분류 id별) */
export function workerArt(categoryId, cls = "") {
  const body = WORKERS[categoryId] ?? WORKERS.basic;
  return `<svg class="illo ${cls}" viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
}

/**
 * 선 아이콘 SVG 문자열.
 * @param {string} name LINE의 키
 * @param {string} [cls] 추가 class
 */
export function icon(name, cls = "") {
  const body = LINE[name] ?? LINE.alert;
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/**
 * 그라디언트 일러스트 SVG 문자열 (64x64).
 * @param {string} name ART의 키
 * @param {string} [cls] 추가 class
 */
export function art(name, cls = "") {
  const body = ART[name] ?? ART.unknown;
  return `<svg class="art ${cls}" viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
}

// index.html의 data-icon / data-art 자리 표시를 실제 SVG로 바꾼다 (정적인 마크업의 아이콘용).
export function hydrateIcons(root = document) {
  for (const el of root.querySelectorAll("[data-icon]")) {
    el.innerHTML = icon(el.dataset.icon);
  }
  for (const el of root.querySelectorAll("[data-art]")) {
    el.innerHTML = art(el.dataset.art);
  }
}
