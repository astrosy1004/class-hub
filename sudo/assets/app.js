/* ============================================================
   라즈베리파이 프로젝트 전시관
   ▼ 팀 정보는 이 배열만 고치면 됩니다. (README.md 참고)
   - video : 동작 영상. "./assets/media/t1.mp4" 같은 파일 경로 또는 YouTube 주소. 비워두면 안내/데모가 나옵니다.
   - slides: 발표 자료. 이미지 배열(["./assets/media/t1/1.png", ...]) 또는 PDF 경로/임베드 주소.
             비워두면 아래 outline 으로 자동 생성된 슬라이드가 나옵니다.
   - icon  : 기술 카드 아이콘 (chip / motor / ir / line / matrix)
   ============================================================ */
const TEAMS = [
  {
    team: "1팀",
    title: "애슐리퀸즈 음식 서빙 로봇",
    tagline: "라인트레이싱으로 테이블까지 음식을 나르는 서빙 로봇",
    accent: "#d9363e",
    exhibit: "robot",
    members: ["팀원 이름 1", "팀원 이름 2", "팀원 이름 3"],
    desc: "주방에서 출발해 바닥의 검은 라인을 따라 테이블에 도착하면 멈춰 서서 도트 매트릭스로 안내하는 서빙 로봇입니다.",
    parts: [
      { name: "라즈베리파이", icon: "chip", text: "GPIO로 센서를 읽고 모터와 디스플레이를 제어하는 로봇의 두뇌" },
      { name: "DC모터", icon: "motor", text: "모터 드라이버와 PWM으로 좌우 바퀴 속도·방향을 조절" },
      { name: "적외선 센서", icon: "ir", text: "바닥 라인의 반사율 차이로 검은 선의 위치를 감지" },
      { name: "라인트레이싱", icon: "line", text: "센서 값에 따라 좌·우 모터 속도를 보정해 라인을 추종" },
      { name: "도트 매트릭스", icon: "matrix", text: "출발·주행·도착 상태와 안내 표정을 점으로 표시" },
    ],
    video: "",
    slides: "",
    demo: "linetrace",
    outline: [
      { h: "프로젝트 개요", b: ["애슐리퀸즈 매장을 모티브로 한 음식 서빙 로봇", "주방 → 테이블 자동 이동, 도착 안내"] },
      { h: "하드웨어 구성", b: ["라즈베리파이 : 전체 제어", "DC모터 + 모터 드라이버 : 구동", "적외선 센서 : 라인 감지", "도트 매트릭스 : 상태 표시"] },
      { h: "동작 원리 · 라인트레이싱", b: ["센서 3개가 바닥 라인의 반사값을 읽음", "라인이 왼쪽이면 왼쪽 바퀴 감속, 오른쪽이면 오른쪽 바퀴 감속", "테이블 정지선 감지 시 정지 후 도트 매트릭스 안내"] },
      { h: "시연 시나리오", b: ["① 주방에서 음식 적재 → 출발", "② 라인을 따라 주행", "③ 테이블 도착 · 정지 · 안내 표시", "④ 주방으로 복귀"] },
    ],
  },
  { team: "2팀", title: "2팀 프로젝트", tagline: "주제를 입력해 주세요", accent: "#1f6feb", exhibit: "chip", members: [], desc: "app.js 의 TEAMS 배열에서 2팀 정보를 채우면 이 전시실이 완성됩니다.", parts: [], video: "", slides: "", outline: [] },
  { team: "3팀", title: "3팀 프로젝트", tagline: "주제를 입력해 주세요", accent: "#18a999", exhibit: "chip", members: [], desc: "app.js 의 TEAMS 배열에서 3팀 정보를 채우면 이 전시실이 완성됩니다.", parts: [], video: "", slides: "", outline: [] },
  {
    team: "4팀",
    title: "실시간 격자형 보안 CCTV",
    tagline: "컴퓨터 비전 기반 지능형 보안 시스템",
    intro: "카메라 영상을 격자로 나눠 금지 구역에 들어온 사람을 실시간으로 잡아내고, 경고음과 스마트폰 알림으로 알려 주는 보안 CCTV입니다. 격자는 3×3~10×10으로 바꿀 수 있습니다.",
    link: "https://kimgudam-lab.github.io/duJJonku/",
    accent: "#8b5cf6",
    exhibit: "chip",
    members: ["김구담 (조장)", "김범규", "김현우", "어준", "정지우"],
    desc: "라즈베리파이 카메라 영상을 실시간으로 격자 분할하고, 금지 구역에 들어간 객체를 탐지하면 화면 경고와 DFPlayer 음성으로 즉시 알려 줍니다. 스마트폰 앱에서 게임 시작·정지, 난이도 변경, 점수·체력 확인이 가능합니다.",
    parts: [
      { name: "Raspberry Pi 4", icon: "chip", text: "카메라 영상을 실시간 연산해 객체 좌표를 계산하고 충돌을 판정" },
      { name: "Pi Camera v2", icon: "ir", text: "시스템의 눈. 실시간 영상을 입력해 OpenCV로 객체를 탐지" },
      { name: "동적 격자", icon: "matrix", text: "난이도별 3×3 ~ 10×10 격자를 실시간으로 생성하고 금지 구역 행렬로 판정" },
      { name: "DFPlayer Mini", icon: "motor", text: "시스템의 입. UART 통신으로 경고음·MP3 재생" },
      { name: "앱인벤터 원격 제어", icon: "line", text: "Wi-Fi로 연결해 시작/정지 · 난이도 변경 · 점수·HP 대시보드 · 랭킹" },
    ],
    video: "https://kimgudam-lab.github.io/duJJonku/video_1.mp4",
    slides: "",
    outline: [
      { h: "작품 설명", b: ["라즈베리파이 카메라로 실시간 영상 격자 분할 + 위험 구역 객체 탐지", "쉬움/보통/어려움 난이도, 격자 정밀도 조정", "위험 구역 탐지 시 시각 경고 + DFPlayer 음성 알림"] },
      { h: "하드웨어 구성", b: ["Raspberry Pi 4 : 영상 연산 · 충돌 판정", "Pi Camera v2 : 실시간 영상 입력", "내장 Wi-Fi : 앱인벤터 앱과 무선 연결", "DFPlayer Mini : UART 사운드 재생"] },
      { h: "모바일 앱 원격 제어", b: ["IP 접속 후 게임 시작/정지 · 난이도 변경", "점수 · 생존 시간 · 체력(HP) 실시간 대시보드", "충돌 시 진동 · 사운드, 최고 기록 랭킹"] },
      { h: "기술적 차별점", b: ["난이도별 3×3 ~ 10×10 동적 격자 생성", "객체 중심점 좌표 기반 금지 구역 충돌 감지", "OpenCV 영상 처리 + UART 통신 연동"] },
      { h: "발전 가능성", b: ["AI 방범 카메라 : 배회·침입 패턴 인식", "가상 안전 펜스 : 공장 지게차·로봇 팔 작업 구역 사고 예방", "공공장소 인파 밀집도 계산 · 긴급 대응"] },
    ],
  },
  { team: "5팀", title: "5팀 프로젝트", tagline: "주제를 입력해 주세요", accent: "#e08a00", exhibit: "chip", members: [], desc: "app.js 의 TEAMS 배열에서 5팀 정보를 채우면 이 전시실이 완성됩니다.", parts: [], video: "", slides: "", outline: [] },
  { team: "6팀", title: "6팀 프로젝트", tagline: "주제를 입력해 주세요", accent: "#d6336c", exhibit: "chip", members: [], desc: "app.js 의 TEAMS 배열에서 6팀 정보를 채우면 이 전시실이 완성됩니다.", parts: [], video: "", slides: "", outline: [] },
];

/* ---------- 아이콘 ---------- */
const SVG_OPEN = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
const ICONS = {
  chip: SVG_OPEN + '<rect x="16" y="16" width="32" height="32" rx="4"/><rect x="26" y="26" width="12" height="12"/><path d="M24 8v8M32 8v8M40 8v8M24 48v8M32 48v8M40 48v8M8 24h8M8 32h8M8 40h8M48 24h8M48 32h8M48 40h8"/></svg>',
  motor: SVG_OPEN + '<circle cx="26" cy="32" r="16"/><circle cx="26" cy="32" r="5"/><path d="M42 32h14M26 12v4M26 48v4M6 32h4M12 18l3 3M12 46l3-3M40 18l-3 3M40 46l-3-3"/></svg>',
  ir: SVG_OPEN + '<rect x="8" y="38" width="22" height="14" rx="3"/><path d="M19 38v-8"/><path d="M34 22a12 12 0 0 1 0 18M42 16a20 20 0 0 1 0 30M50 10a28 28 0 0 1 0 42"/></svg>',
  line: SVG_OPEN + '<path d="M6 54c16 0 8-22 24-22s8-22 28-22" stroke-dasharray="6 5"/><circle cx="30" cy="32" r="6" fill="currentColor"/></svg>',
  matrix: SVG_OPEN.replace('fill="none"', 'fill="currentColor"').replace('stroke-width="3"', 'stroke-width="0"') +
    [0, 1, 2].map((r) => [0, 1, 2].map((c) => `<circle cx="${14 + c * 18}" cy="${14 + r * 18}" r="${(r + c) % 2 ? 4 : 6}"/>`).join("")).join("") + "</svg>",
  robot: SVG_OPEN + '<rect x="16" y="20" width="32" height="26" rx="6"/><circle cx="26" cy="33" r="3"/><circle cx="38" cy="33" r="3"/><path d="M32 20v-8M28 12h8M20 46v6M44 46v6"/></svg>',
};

/* ---------- 전시물: 서빙 로봇 일러스트 ---------- */
const SMILE = ["0000000000", "0010000100", "0010000100", "0000000000", "0100000010", "0011111100"];
function dotMatrix(x, y, pattern, size, gap, color) {
  let out = "";
  pattern.forEach((row, r) => [...row].forEach((v, c) => {
    const eye = r >= 1 && r <= 2 && (c === 2 || c === 7);
    out += `<circle cx="${x + c * gap}" cy="${y + r * gap}" r="${size}" fill="${v === "1" ? color : "#1a2230"}"${v === "1" && eye ? ' class="blink"' : ""}/>`;
  }));
  return out;
}
function robotSVG(accent) {
  return `<svg viewBox="0 0 300 340" aria-hidden="true">
    <rect x="50" y="252" width="200" height="44" rx="14" fill="#2b313b"/>
    <circle cx="82" cy="300" r="28" fill="#11151b" stroke="#6a7280" stroke-width="4"/><circle cx="82" cy="300" r="9" fill="#6a7280"/>
    <circle cx="218" cy="300" r="28" fill="#11151b" stroke="#6a7280" stroke-width="4"/><circle cx="218" cy="300" r="9" fill="#6a7280"/>
    <rect x="124" y="284" width="14" height="8" rx="2" fill="#4cf2a0" class="blink"/><rect x="143" y="284" width="14" height="8" rx="2" fill="#4cf2a0"/><rect x="162" y="284" width="14" height="8" rx="2" fill="#4cf2a0" class="blink"/>
    <rect x="86" y="98" width="128" height="160" rx="18" fill="#f2f4f7" stroke="#c4c9d1" stroke-width="3"/>
    <rect x="98" y="112" width="104" height="72" rx="8" fill="#0b1018"/>
    ${dotMatrix(110, 124, SMILE, 4, 9.6, accent)}
    <rect x="86" y="206" width="128" height="12" fill="${accent}"/>
    <text x="150" y="240" text-anchor="middle" font-size="15" font-weight="800" fill="#1c2128" letter-spacing="2">SERVING BOT</text>
    <ellipse cx="150" cy="92" rx="104" ry="14" fill="#d3d7dd" stroke="#a9afb8" stroke-width="2"/>
    <ellipse cx="108" cy="82" rx="30" ry="9" fill="#fff" stroke="#c4c9d1"/><circle cx="100" cy="76" r="9" fill="#e9a13b"/><circle cx="117" cy="78" r="7" fill="#6cc04a"/>
    <path d="M178 84h24l-3 -22h-18z" fill="#fff" stroke="#c4c9d1"/><rect x="182" y="66" width="16" height="8" fill="${accent}" opacity="0.8"/>
  </svg>`;
}
function chipExhibit(accent, n) {
  return `<svg viewBox="0 0 300 340" aria-hidden="true">
    <rect x="60" y="100" width="180" height="180" rx="22" fill="#20262f" stroke="${accent}" stroke-width="6"/>
    <rect x="100" y="140" width="100" height="100" rx="10" fill="${accent}" opacity="0.9"/>
    <text x="150" y="208" text-anchor="middle" font-size="64" font-weight="800" fill="#fff">${n}</text>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${86 + i * 32}" y="76" width="10" height="24" fill="#aab1bc"/><rect x="${86 + i * 32}" y="280" width="10" height="24" fill="#aab1bc"/><rect x="36" y="${126 + i * 32}" width="24" height="10" fill="#aab1bc"/><rect x="240" y="${126 + i * 32}" width="24" height="10" fill="#aab1bc"/>`).join("")}
  </svg>`;
}

/* ---------- 장면 HTML ---------- */
const P_COUNT = TEAMS.length;
const $ = (id) => document.getElementById(id);
const rnd = (seed) => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };

const LOBBY_N = TEAMS.length + 1; // 수업 전시실 1 + 팀 전시실
function lobbyHTML() {
  const step = 360 / LOBBY_N;
  const classPortal = `<button class="portal class" type="button" data-act="enterclass" style="--accent:${CLASS_INFO.accent};transform:rotateY(0deg) translateZ(calc(var(--R) * -1))" aria-label="수업 전시실 입장">
      <div class="portal-face">
        <div class="num">수업</div>
        <div class="ico">${ICONS.chip}</div>
        <h3>${CLASS_INFO.org} ${CLASS_INFO.title}</h3><p>${CLASS_INFO.sub}</p>
        <div class="tags"><span>학습 로드맵</span><span>미션 진행표</span><span>실습 자료</span></div>
        <div class="enter">수업 전시실 입장 →</div>
      </div></button>`;
  const portals = TEAMS.map((t, i) => {
    const a = (i + 1) * step;
    const tags = t.parts.slice(0, 3).map((p) => `<span>${p.name}</span>`).join("");
    return `<button class="portal" type="button" data-act="enter" data-i="${i}" style="--accent:${t.accent};transform:rotateY(${a}deg) translateZ(calc(var(--R) * -1))" aria-label="${t.team} ${t.title} 입장">
      <div class="portal-face">
        <div class="num">0${i + 1}</div>
        <div class="ico">${ICONS[t.parts[0] ? "robot" : "chip"]}</div>
        <h3>${t.title}</h3><p>${t.tagline}</p>
        ${t.intro ? `<p class="intro">${t.intro}</p>` : ""}
        <div class="tags">${tags}</div>
        <div class="enter">전시실 입장 →${t.link ? `<span class="site" data-act="site" data-url="${t.link}" role="link">프로젝트 사이트 ↗</span>` : ""}</div>
      </div></button>`;
  }).join("");
  return `<div class="face lobby-ceil"></div><div class="face lobby-floor"></div>${classPortal}${portals}`;
}

/* ---------- 수업 전시실 ---------- */
function raspbotSVG(accent) {
  return `<svg viewBox="0 0 300 340" aria-hidden="true">
    <rect x="144" y="40" width="12" height="150" rx="5" fill="#9aa3af"/>
    <rect x="112" y="18" width="76" height="46" rx="10" fill="#20262f" stroke="#6a7280" stroke-width="3"/>
    <circle cx="150" cy="41" r="15" fill="#0b1018" stroke="${accent}" stroke-width="4"/><circle cx="150" cy="41" r="5" fill="${accent}"/>
    <rect x="40" y="190" width="220" height="86" rx="16" fill="#2b313b"/>
    <rect x="62" y="150" width="176" height="52" rx="8" fill="#1d7a4f" stroke="#58c98f" stroke-width="2"/>
    <rect x="86" y="160" width="36" height="30" rx="3" fill="#cfd5dc"/><rect x="132" y="160" width="26" height="30" rx="3" fill="#8e99a6"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${170 + (i % 4) * 14}" y="${160 + Math.floor(i / 4) * 14}" width="9" height="9" fill="#d9c34a"/>`).join("")}
    <circle cx="68" cy="292" r="26" fill="#11151b" stroke="#6a7280" stroke-width="4"/><circle cx="68" cy="292" r="8" fill="#6a7280"/>
    <circle cx="232" cy="292" r="26" fill="#11151b" stroke="#6a7280" stroke-width="4"/><circle cx="232" cy="292" r="8" fill="#6a7280"/>
    <rect x="132" y="262" width="12" height="8" rx="2" fill="#4cf2a0" class="blink"/><rect x="150" y="262" width="12" height="8" rx="2" fill="#4cf2a0"/><rect x="168" y="262" width="12" height="8" rx="2" fill="#4cf2a0" class="blink"/>
  </svg>`;
}
function classRoomHTML() {
  const C = CLASS_INFO;
  const spots = [0, 1, 2].map((a) => [0, 1, 2].map((b) => `<div class="spot" style="left:${340 + a * 440}px;top:${340 + b * 440}px"></div>`).join("")).join("");
  const stats = C.stats.map((x) => `<div class="stat"><b>${x.n}</b><span>${x.l}</span></div>`).join("");
  const kw = C.keywords.map((k) => `<span>${k}</span>`).join("");
  const cards = TOPICS.map((t, i) => `<button class="tcard topic" type="button" data-act="class" data-i="${i}">
      <div class="ico">${ICONS[t.icon] || ICONS.chip}</div><div class="no">STEP ${t.no}</div><h4>${t.title}</h4><p>${t.summary}</p></button>`).join("");
  const rows = C.board.map((r) => `<button class="brow" type="button" data-act="class" data-i="${r.topic}"><span class="bn">${r.name}</span><span class="bc">${r.c5}</span><span class="bc">${r.c6}</span></button>`).join("");
  return `
    <div class="face ceiling"><div class="slab"></div>
      <div class="led" style="top:300px"></div><div class="led" style="top:790px"></div><div class="led" style="top:1280px"></div>${spots}</div>
    <div class="face floor"><div class="disc"></div></div>

    <div class="face wall wall-back">
      <div class="sign"><small>${C.org} · CLASS ROOM</small><h2>${C.title}</h2><p>${C.sub}</p></div>
      <div class="screen statboard"><div class="screen-inner"><div class="screen-grid"></div><div class="stats">${stats}</div></div></div>
      <a class="padlet-link" href="${C.padlet}" target="_blank" rel="noopener">패들렛 원본 열기 ↗</a>
      <button class="slides-panel" type="button" data-act="class" data-i="0" aria-label="수업 자료 보기">
        <div class="card"><b>STEP 01</b>${TOPICS[0].title}</div><div class="card"><b>STEP 02</b>${TOPICS[1].title}</div><div class="card"><b>STEP 03</b>${TOPICS[2].title}</div></button>
      <div class="slides-label">수업 자료 보기</div>
      <div class="spec-panel"><h3>키워드</h3><div class="kw">${kw}</div></div>
    </div>

    <div class="face wall wall-left">
      <div class="wall-title"><small>LEARNING ROADMAP</small><h3>학습 로드맵</h3></div>
      <div class="cards roadmap">${cards}</div>
    </div>

    <div class="face wall wall-right">
      <div class="board"><div class="board-title"><small>MISSION BOARD</small><h3>미션 진행표</h3></div>
        <div class="bhead"><span>주제</span><span>5반</span><span>6반</span></div>${rows}
        <div class="bfoot">행을 누르면 해당 단계의 상세 자료가 열립니다.</div></div>
    </div>

    <div class="face wall wall-front">
      <button class="door main" type="button" data-act="lobby"><small>EXIT</small>로비로 나가기</button>
      <button class="door side l" type="button" data-act="class" data-i="6"><small>EXAM</small>시험 · 프로젝트</button>
      <a class="door side r" href="${C.padlet}" target="_blank" rel="noopener"><small>PADLET</small>패들렛 원본 ↗</a>
    </div>

    <div class="box desk">
      <div class="f">CLASS · ${C.title}</div><div class="b"></div><div class="l"></div><div class="r"></div><div class="t"></div>
    </div>
    <div class="exhibit" style="width:210px;height:238px;left:-105px;top:-119px;transform:translate3d(0,261px,-430px) rotateY(calc(var(--yaw) * -1))">${raspbotSVG(C.accent)}<div class="glow"></div></div>`;
}

function roomHTML(t, i) {
  const n = i + 1;
  const r = rnd(n + 3);
  const spots = [0, 1, 2].map((a) => [0, 1, 2].map((b) => `<div class="spot" style="left:${340 + a * 440}px;top:${340 + b * 440}px"></div>`).join("")).join("");
  const tiles = Array.from({ length: 60 }, () => {
    const v = r();
    return `<i style="transform:translateZ(${Math.round(v * 44)}px);${v < 0.18 ? "visibility:hidden" : ""}"></i>`;
  }).join("");
  const cards = (t.parts.length ? t.parts : [0, 1, 2].map(() => null)).map((p, k) => p
    ? `<div class="tcard"><div class="ico">${ICONS[p.icon] || ICONS.chip}</div><div class="no">PART 0${k + 1}</div><h4>${p.name}</h4><p>${p.text}</p></div>`
    : `<div class="tcard ghost"><div class="ico">${ICONS.chip}</div><div class="no">PART 0${k + 1}</div><h4>준비 중</h4><p>app.js 의 parts 에 기술 구성을 추가하세요.</p></div>`).join("");
  const spec = t.parts.length ? t.parts.map((p) => `<li>${p.name}</li>`).join("") : "<li>기술 구성 준비 중</li>";
  const members = (t.members.length ? t.members : ["팀원 입력 예정"]).map((m) => `<span>${m}</span>`).join("");
  const prev = TEAMS[(i + P_COUNT - 1) % P_COUNT], next = TEAMS[(i + 1) % P_COUNT];
  const rolls = Array.from({ length: 8 }, () => "<i></i>").join("");
  const outline = (t.outline.length ? t.outline : [{ h: "발표 자료" }, { h: "개요" }, { h: t.title }]);
  const miniCards = [outline[0], outline[1] || outline[0], outline[2] || outline[0]]
    .map((s, k) => `<div class="card"><b>SLIDE 0${k + 1}</b>${s.h}</div>`).join("");

  return `
    <div class="face ceiling"><div class="slab"></div>
      <div class="led" style="top:300px"></div><div class="led" style="top:790px"></div><div class="led" style="top:1280px"></div>${spots}</div>
    <div class="face floor"><div class="disc"></div></div>

    <div class="face wall wall-back">
      <div class="sign"><small>${t.team} · PROJECT ROOM</small><h2>${t.title}</h2><p>${t.tagline}</p></div>
      <button class="screen" type="button" data-act="video" aria-label="동작 영상 보기">
        <div class="screen-inner"><div class="screen-grid"></div><div class="play"></div><div class="screen-cap">동작 영상 보기</div></div>
      </button>
      <button class="slides-panel" type="button" data-act="slides" aria-label="발표 PPT 보기">${miniCards}</button>
      <div class="slides-label">발표 PPT 보기</div>
      <div class="spec-panel"><h3>핵심 기술</h3><ul>${spec}</ul></div>
    </div>

    <div class="face wall wall-left">
      <div class="wall-title"><small>TECH STACK</small><h3>기술 구성</h3></div>
      <div class="cards">${cards}</div>
    </div>

    <div class="face wall wall-right">
      <div class="relief">${tiles}</div>
      <div class="plaque"><small>${t.team.toUpperCase()} · TEAM</small><h3>${t.title}</h3><p>${t.desc}</p><div class="members">${members}</div>${t.link ? `<a class="site-link" href="${t.link}" target="_blank" rel="noopener">프로젝트 사이트 열기 ↗</a>` : ""}</div>
      <div class="rolls">${rolls}</div>
    </div>

    <div class="face wall wall-front">
      <button class="door side l" type="button" data-act="prev"><small>PREV</small>◀ ${prev.team}<span style="font-size:15px;font-weight:600;color:var(--muted)">${prev.title}</span></button>
      <button class="door main" type="button" data-act="lobby"><small>EXIT</small>로비로 나가기</button>
      <button class="door side r" type="button" data-act="next"><small>NEXT</small>${next.team} ▶<span style="font-size:15px;font-weight:600;color:var(--muted)">${next.title}</span></button>
    </div>

    <div class="box desk">
      <div class="f">${t.team.toUpperCase()} · ${t.title}</div><div class="b"></div><div class="l"></div><div class="r"></div><div class="t"></div>
    </div>
    <div class="exhibit">${t.exhibit === "robot" ? robotSVG(t.accent) : chipExhibit(t.accent, n)}<div class="glow"></div></div>`;
}

/* ---------- 카메라 / 상태 ---------- */
const stage = $("stage"), world = $("world"), fade = $("fade");
const state = { mode: "lobby", idx: 0 };
let lobbyPos = 0; // 로비에서 정면에 보일 입구 번호 (0 = 수업 전시실)
const cam = { yaw: 0, pitch: 0, dz: 0, tYaw: 0, tPitch: 0, tDz: 0, P: 900, auto: true, ready: true };

function sizeStage() {
  cam.P = Math.max(420, Math.min(1100, innerWidth * 0.7));
  stage.style.perspective = cam.P + "px";
  world.style.setProperty("--R", Math.max(560, Math.min(900, cam.P * 1.1)) + "px");
}
function frame() {
  if (state.mode === "lobby" && cam.auto) cam.tYaw -= 0.05;
  cam.yaw += (cam.tYaw - cam.yaw) * 0.16;
  cam.pitch += (cam.tPitch - cam.pitch) * 0.16;
  cam.dz += (cam.tDz - cam.dz) * 0.16;
  world.style.transform = `translateZ(${cam.P + cam.dz}px) rotateX(${cam.pitch}deg) rotateY(${cam.yaw}deg)`;
  world.style.setProperty("--yaw", cam.yaw + "deg");
  requestAnimationFrame(frame);
}

function render() {
  const t = TEAMS[state.idx];
  const lobby = state.mode === "lobby", cls = state.mode === "class", team = state.mode === "room";
  const accent = lobby ? "#1f6feb" : cls ? CLASS_INFO.accent : t.accent;
  world.innerHTML = lobby ? lobbyHTML() : cls ? classRoomHTML() : roomHTML(t, state.idx);
  document.documentElement.style.setProperty("--accent", accent);
  world.style.setProperty("--accent", accent);
  $("where").textContent = lobby ? "로비 · 수업 전시실 + 6개 프로젝트 룸" : cls ? `수업 전시실 · ${CLASS_INFO.title}` : `${t.team} · ${t.title}`;
  ["navPrev", "navVideo", "navSlides", "navNext"].forEach((id) => ($(id).hidden = !team));
  $("navClass").hidden = !cls;
  $("navClassLobby").hidden = !lobby;
  document.title = lobby ? "라즈베리파이 프로젝트 전시관" : cls ? "수업 전시실 · 라즈봇 & 앱인벤터" : `${t.team} ${t.title} · 전시관`;
  cam.auto = lobby;
  cam.yaw = cam.tYaw = lobby ? -lobbyPos * (360 / LOBBY_N) : 0;
  cam.pitch = cam.tPitch = 0;
  cam.dz = cam.tDz = 0;
}

function go(hash) {
  if (location.hash === hash || (!hash && !location.hash)) { route(); return; }
  location.hash = hash;
}
function route() {
  const m = /^#t(\d+)$/.exec(location.hash);
  const idx = m ? Number(m[1]) - 1 : -1;
  const toClass = location.hash === "#class";
  fade.classList.add("on");
  setTimeout(() => {
    closeViewer();
    if (toClass) { state.mode = "class"; lobbyPos = 0; }
    else if (idx >= 0 && idx < P_COUNT) { state.mode = "room"; state.idx = idx; lobbyPos = idx + 1; }
    else state.mode = "lobby";
    render();
    fade.classList.remove("on");
  }, 360);
}
window.addEventListener("hashchange", route);

/* ---------- 입력: 드래그 / 휠 / 키보드 ---------- */
let drag = null, moved = 0;
stage.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY }; moved = 0; });
window.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.x = e.clientX; drag.y = e.clientY;
  moved += Math.abs(dx) + Math.abs(dy);
  if (moved > 6) { stage.classList.add("dragging"); cam.auto = false; $("hint").classList.add("gone"); }
  cam.tYaw -= dx * 0.18;
  cam.tPitch = Math.max(-28, Math.min(28, cam.tPitch + dy * 0.12));
});
window.addEventListener("pointerup", () => { drag = null; stage.classList.remove("dragging"); });
stage.addEventListener("click", (e) => {
  if (moved > 6) return;
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;
  if (act === "site") window.open(el.dataset.url, "_blank", "noopener");
  else if (act === "enter") go("#t" + (Number(el.dataset.i) + 1));
  else if (act === "enterclass") go("#class");
  else if (act === "class") openClass(Number(el.dataset.i));
  else if (act === "lobby") go("");
  else if (act === "prev") step(-1);
  else if (act === "next") step(1);
  else if (act === "video" || act === "slides") openViewer(act);
});
stage.addEventListener("wheel", (e) => {
  e.preventDefault();
  cam.tDz = Math.max(-120, Math.min(100, cam.tDz - e.deltaY * 0.4));
}, { passive: false });
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeViewer(); return; }
  if (!$("modal").hidden) return;
  if (e.key === "ArrowLeft" || e.key === "a") { cam.tYaw -= 8; cam.auto = false; }
  else if (e.key === "ArrowRight" || e.key === "d") { cam.tYaw += 8; cam.auto = false; }
  else if (e.key === "ArrowUp" || e.key === "w") cam.tDz = Math.min(100, cam.tDz + 40);
  else if (e.key === "ArrowDown" || e.key === "s") cam.tDz = Math.max(-120, cam.tDz - 40);
});

function step(d) { go("#t" + (((state.idx + d + P_COUNT) % P_COUNT) + 1)); }

/* ---------- 하단 메뉴 / 테마 ---------- */
$("dock").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.nav === "lobby") go("");
  else if (b.dataset.nav === "prev") step(-1);
  else if (b.dataset.nav === "next") step(1);
  else if (b.dataset.nav === "class") go("#class");
  else if (b.dataset.open === "class") openClass(0);
  else if (b.dataset.open) openViewer(b.dataset.open);
});
$("brand").addEventListener("click", (e) => { e.preventDefault(); go(""); });
$("fsToggle").addEventListener("click", () => {
  try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (_) {}
});
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  $("themeIcon").textContent = t === "dark" ? "☀" : "☾";
}
let theme = "light";
try { theme = localStorage.getItem("expoTheme") || "light"; } catch (_) {}
applyTheme(theme);
$("themeToggle").addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  applyTheme(theme);
  try { localStorage.setItem("expoTheme", theme); } catch (_) {}
});

/* ---------- 뷰어: 동작 영상 / 발표 PPT ---------- */
const modal = $("modal"), mbody = $("modalBody");
let tab = "video", slideNo = 0, stopDemo = null;

function openViewer(which) {
  if (state.mode !== "room") return;
  tab = which;
  modal.hidden = false;
  paint();
}
function closeViewer() {
  if (stopDemo) { stopDemo(); stopDemo = null; }
  mbody.innerHTML = "";
  modal.hidden = true;
  modal.dataset.kind = "";
}
$("modalClose").addEventListener("click", closeViewer);
modal.addEventListener("click", (e) => { if (e.target === modal) closeViewer(); });
modal.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; paint(); }));

function embedURL(url) {
  const y = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/.exec(url);
  return y ? `https://www.youtube.com/embed/${y[1]}` : url;
}

function paint() {
  if (stopDemo) { stopDemo(); stopDemo = null; }
  const t = TEAMS[state.idx];
  $("modalTitle").textContent = `${t.team} · ${t.title}`;
  modal.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
  if (tab === "video") paintVideo(t); else { slideNo = 0; paintSlides(t); }
}

function paintVideo(t) {
  if (/\.(mp4|webm|ogg)$/i.test(t.video)) {
    mbody.innerHTML = `<div class="frame"><video src="${t.video}" controls autoplay playsinline></video></div>`;
  } else if (t.video) {
    mbody.innerHTML = `<div class="frame"><iframe src="${embedURL(t.video)}" allow="autoplay; fullscreen" allowfullscreen title="동작 영상"></iframe></div>`;
  } else if (t.demo === "linetrace") {
    mbody.innerHTML = `<div class="frame"><canvas width="960" height="540"></canvas></div>
      <p class="note">실제 촬영 영상이 아직 등록되지 않아 <b>동작 원리 시뮬레이션</b>을 보여줍니다. 영상 파일을 <code>assets/media/</code>에 넣고 <code>app.js</code>의 <code>video</code>에 경로를 적으면 교체됩니다.</p>`;
    stopDemo = runLineTraceDemo(mbody.querySelector("canvas"), t.accent);
  } else {
    mbody.innerHTML = `<div class="frame"><div class="slide" style="--accent:${t.accent}"><small>${t.team}</small><h3>동작 영상 준비 중</h3><ul><li>영상 파일을 <b>assets/media/</b> 폴더에 넣으세요.</li><li><b>app.js</b> 의 ${t.team} <b>video</b> 항목에 경로(또는 YouTube 주소)를 적으세요.</li></ul></div></div>`;
  }
}

function paintSlides(t) {
  const s = t.slides;
  let total = 1, inner = "";
  if (Array.isArray(s) && s.length) {
    total = s.length;
    inner = `<div class="frame"><img class="slide" style="border:0" src="${s[slideNo]}" alt="${t.team} 발표 자료 ${slideNo + 1}쪽" /></div>`;
  } else if (typeof s === "string" && s) {
    mbody.innerHTML = `<div class="frame"><iframe src="${s}" allowfullscreen title="발표 자료"></iframe></div>`;
    return;
  } else {
    const o = t.outline.length ? t.outline : [{ h: "발표 자료 준비 중", b: ["app.js 의 slides 에 이미지 배열 또는 PDF 경로를 적으세요."] }];
    total = o.length;
    const c = o[slideNo];
    inner = `<div class="frame"><div class="slide" style="--accent:${t.accent}"><small>${t.team} · SLIDE ${slideNo + 1}</small><h3>${c.h}</h3><ul>${(c.b || []).map((x) => `<li>${x}</li>`).join("")}</ul></div></div>`;
  }
  mbody.innerHTML = inner + `<div class="slidebar"><button class="hud-btn" data-s="-1" type="button">◀</button><span>${slideNo + 1} / ${total}</span><button class="hud-btn" data-s="1" type="button">▶</button></div>`;
  mbody.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", () => {
    slideNo = (slideNo + Number(b.dataset.s) + total) % total;
    paintSlides(t);
  }));
}

/* ---------- 수업 전시실 뷰어 ---------- */
const esc = (x) => String(x).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
function openClass(i) {
  if (state.mode !== "class") return;
  modal.dataset.kind = "class";
  modal.hidden = false;
  paintClass(i);
}
function paintClass(i) {
  const t = TOPICS[i];
  $("modalTitle").textContent = `수업 전시실 · ${CLASS_INFO.title}`;
  const nav = TOPICS.map((x, k) => `<button type="button" class="cn${k === i ? " on" : ""}" data-k="${k}"><b>${x.no}</b>${x.title}</button>`).join("");
  const steps = t.steps.map((x) => `<li>${esc(x)}</li>`).join("");
  const items = t.items.map((x) => `<article class="citem"><span class="ctag">${x.tag || ""}</span><h4>${esc(x.h)}</h4>${x.b ? `<p>${esc(x.b).replace(/\n/g, "<br>")}</p>` : ""}${x.code ? `<pre>${esc(x.code)}</pre>` : ""}</article>`).join("");
  const links = t.links.length ? `<div class="clinks">${t.links.map((l) => `<a href="${l.u}" target="_blank" rel="noopener">${l.t} ↗</a>`).join("")}</div>` : "";
  mbody.innerHTML = `<div class="cls">
    <nav class="cls-nav">${nav}</nav>
    <div class="cls-main">
      <div class="chead"><small>STEP ${t.no}</small><h3>${t.title}</h3><p>${t.summary}</p></div>
      <h5>배우는 순서</h5><ol class="csteps">${steps}</ol>
      <h5>자료 · 실습 · 미션</h5><div class="citems">${items}</div>
      ${links}
      <a class="cpadlet" href="${CLASS_INFO.padlet}" target="_blank" rel="noopener">패들렛 원본에서 첨부파일 받기 ↗</a>
    </div></div>`;
  mbody.querySelectorAll(".cn").forEach((b) => b.addEventListener("click", () => paintClass(Number(b.dataset.k))));
  mbody.scrollTop = 0;
}

/* ---------- 데모: 라인트레이싱 서빙 로봇 시뮬레이션 ---------- */
function runLineTraceDemo(canvas, accent) {
  const ctx = canvas.getContext("2d");
  const pts = [[120, 440], [120, 130], [480, 130], [480, 310], [820, 310], [820, 440], [120, 440]];
  const lens = [], cum = [0];
  for (let i = 1; i < pts.length; i++) {
    lens.push(Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    cum.push(cum[i - 1] + lens[i - 1]);
  }
  const total = cum[cum.length - 1];
  const at = (s) => {
    s = ((s % total) + total) % total;
    let i = 1; while (s > cum[i]) i++;
    const k = (s - cum[i - 1]) / lens[i - 1];
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, a: Math.atan2(y1 - y0, x1 - x0) };
  };
  const stops = [{ s: 520, name: "테이블 1", dy: 78 }, { s: 1030, name: "테이블 2", dy: -78 }, { s: total - 1, name: "주방", dy: 0 }];
  const ARROW = ["00010000", "00001000", "11111100", "11111110", "11111100", "00001000", "00010000", "00000000"];
  const FACE = ["00000000", "01100110", "01100110", "00000000", "10000001", "01000010", "00111100", "00000000"];
  let s = 0, wait = 0, cur = null, last = performance.now(), raf = 0, tm = 0;

  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; tm += dt;
    if (wait > 0) { wait -= dt; if (wait <= 0) { cur = null; s += 4; } }
    else {
      const prev = s; s += 170 * dt;
      const hit = stops.find((p) => prev % total < p.s && s % total >= p.s);
      if (hit) { s = hit.s + Math.floor(prev / total) * total; wait = 2; cur = hit; }
    }
    draw();
    raf = requestAnimationFrame(loop);
  };
  function draw() {
    ctx.fillStyle = "#f2f4f7"; ctx.fillRect(0, 0, 960, 540);
    ctx.fillStyle = "rgba(0,0,0,0.07)";
    for (let x = 20; x < 960; x += 40) for (let y = 20; y < 540; y += 40) ctx.fillRect(x, y, 2, 2);
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.strokeStyle = "#171a20"; ctx.lineWidth = 16; ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.font = "700 20px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    stops.slice(0, 2).forEach((p) => {
      const q = at(p.s);
      ctx.fillStyle = "#fff"; ctx.strokeStyle = accent; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(q.x - 52, q.y + p.dy - 24, 104, 48, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#1c2128"; ctx.fillText(p.name, q.x, q.y + p.dy);
      ctx.fillStyle = "#e8eaee"; ctx.fillRect(q.x - 8, q.y - 11 * Math.sign(p.dy) - 4, 16, 8);
    });
    ctx.fillStyle = accent; ctx.beginPath(); ctx.roundRect(70, 400, 100, 80, 10); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText("주방", 120, 440);

    const q = at(s), moving = wait <= 0;
    ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a);
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "#2b313b"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(-30, -22, 60, 44, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(-4, 0, 11, 0, 7); ctx.fill();
    const w = moving ? Math.sin(tm * 9) : 0;
    [-12, 0, 12].forEach((o, i) => {
      const on = i === 1 || (i === 0 && w > 0.4) || (i === 2 && w < -0.4);
      ctx.fillStyle = on ? "#27d07c" : "#9aa3af";
      ctx.shadowColor = on ? "#27d07c" : "transparent"; ctx.shadowBlur = on ? 10 : 0;
      ctx.beginPath(); ctx.arc(34, o, 4, 0, 7); ctx.fill();
    });
    ctx.restore(); ctx.shadowBlur = 0;

    ctx.fillStyle = "#0b1018"; ctx.beginPath(); ctx.roundRect(740, 28, 190, 190, 14); ctx.fill();
    const pat = moving ? ARROW : FACE;
    pat.forEach((row, r) => [...row].forEach((v, c) => {
      ctx.fillStyle = v === "1" ? accent : "#1d2636";
      ctx.beginPath(); ctx.arc(762 + c * 20.5, 50 + r * 20.5, 7, 0, 7); ctx.fill();
    }));
    ctx.textAlign = "left"; ctx.fillStyle = "#1c2128"; ctx.font = "700 22px sans-serif";
    ctx.fillText(moving ? "▶ 라인트레이싱 주행 중" : `● ${cur ? cur.name : ""} 도착 · 서빙 중`, 30, 36);
    ctx.font = "500 16px sans-serif"; ctx.fillStyle = "#5b6470";
    ctx.fillText("초록 점 = 적외선 센서가 라인을 감지한 상태", 30, 66);
    ctx.fillText("오른쪽 도트 매트릭스 = 로봇 상태 표시", 30, 90);
  }
  if (!ctx.roundRect) ctx.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

/* ---------- 시작 ---------- */
sizeStage();
window.addEventListener("resize", sizeStage);
state.mode = "lobby";
if (location.hash === "#class") state.mode = "class";
else if (/^#t\d+$/.test(location.hash)) { const i = Number(location.hash.slice(2)) - 1; if (i >= 0 && i < P_COUNT) { state.mode = "room"; state.idx = i; lobbyPos = i + 1; } }
render();
requestAnimationFrame(frame);
setTimeout(() => $("hint").classList.add("gone"), 9000);
