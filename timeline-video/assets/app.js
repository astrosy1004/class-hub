/* ===== 초기 예시 데이터 (내용 수정은 여기서) ===== */
const DEFAULT_PROJECT = {
  person: "홍길동",
  subtitle: "주요 연혁 한눈에 보기",
  slides: [
    { year: "1985", age: "만 30세", title: "정계 입문", desc: "처음 국회의원에 당선되며 정치 활동을 시작했다.", source: "예시 · 출처를 적어 주세요" },
    { year: "1998", age: "만 43세", title: "장관 취임", desc: "경제 부처 장관으로 임명되어 구조 개혁을 이끌었다.", source: "" },
    { year: "2010", age: "만 55세", title: "당 대표 선출", desc: "치열한 경선 끝에 당 대표로 선출됐다.", source: "" },
    { year: "2026", age: "만 71세", title: "현재", desc: "지금도 활발히 활동하며 정책 현안에 목소리를 내고 있다.", source: "" },
  ],
};

const SETTINGS = {
  fps: 30,
  introSec: 3,
  transitionSec: 1,
  accent: "#ffd23f",
  themeKey: "timelineVideoTheme",
  sizes: { "16:9": [1280, 720], "9:16": [720, 1280] },
};

/* ===== 상태 ===== */
let uid = 0;
function makeSlide(s = {}) {
  return { id: ++uid, year: "", age: "", title: "", desc: "", source: "", img: null, photoKey: "", ...s };
}

const state = {
  person: DEFAULT_PROJECT.person,
  subtitle: DEFAULT_PROJECT.subtitle,
  infoLine: "",
  ratio: "16:9",
  transition: "fade",
  slideSec: 4,
  slides: DEFAULT_PROJECT.slides.map((s) => makeSlide(s)),
  isSample: true,   // 예시 장면 그대로인지 (덮어쓸 때 확인 생략)
  lookup: null,     // 불러온 인물 정보 (WikiLookup.load 결과)
};

const $ = (id) => document.getElementById(id);
const canvas = $("stage");
const ctx = canvas.getContext("2d");

/* ===== 타임라인 ===== */
let timeline = [];
let total = 0;
function buildTimeline() {
  const tr = state.transition === "cut" ? 0 : Math.min(SETTINGS.transitionSec, state.slideSec - 0.5);
  const list = [{ type: "intro", dur: SETTINGS.introSec }]
    .concat(state.slides.map((s) => ({ type: "slide", slide: s, dur: state.slideSec })));
  let start = 0;
  list.forEach((seg, i) => {
    seg.start = start;
    start += seg.dur - (i < list.length - 1 ? tr : 0);
  });
  const last = list[list.length - 1];
  total = last.start + last.dur;
  timeline = list;
  timeline.tr = tr;
  $("timeLabel").textContent = `${fmt(curT)} / ${fmt(total)}`;
}
const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const ease = (p) => p * p * (3 - 2 * p);

/* ===== 그리기 ===== */
function wrap(c, text, maxW, maxLines) {
  const lines = [];
  let line = "";
  for (const ch of String(text)) {
    if (ch === "\n") { lines.push(line); line = ""; continue; }
    if (c.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; }
    else line += ch;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].replace(/.$/, "…");
  }
  return lines;
}

function drawCover(c, img, W, H, zoom) {
  const r = Math.max(W / img.width, H / img.height) * zoom;
  const w = img.width * r, h = img.height * r;
  c.drawImage(img, (W - w) / 2, (H - h) * 0.25, w, h); // 얼굴이 잘리지 않도록 위쪽 기준
}

function drawSegment(c, seg, local, W, H) {
  const s = Math.min(W, H) / 720;
  const k = Math.min(1, local / seg.dur);
  const font = (px, weight = 700) => `${weight} ${Math.round(px * s)}px "Pretendard","Malgun Gothic",sans-serif`;
  const m = 56 * s;

  if (seg.type === "intro") {
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#0b1020"); g.addColorStop(1, "#1d2b53");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const years = state.slides.map((x) => x.year).filter(Boolean);
    const e = ease(Math.min(1, local / 0.8));
    c.globalAlpha = e;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillStyle = "#fff"; c.font = font(96);
    wrap(c, state.person, W - m * 2, 2).forEach((l, i, a) => c.fillText(l, W / 2, H / 2 - (a.length - 1) * 55 * s + i * 110 * s - 20 * s));
    c.fillStyle = SETTINGS.accent; c.font = font(40, 600);
    c.fillText(state.subtitle, W / 2, H / 2 + 90 * s);
    let ly = H / 2 + 150 * s;
    if (state.infoLine) {
      c.fillStyle = "#fff"; c.font = font(30, 500);
      c.fillText(wrap(c, state.infoLine, W - m * 2, 1)[0], W / 2, ly);
      ly += 50 * s;
    }
    if (years.length > 1) {
      c.fillStyle = "#cbd5e1"; c.font = font(30, 500);
      c.fillText(`${years[0]} → ${years[years.length - 1]}`, W / 2, ly);
    }
    c.globalAlpha = 1;
    return;
  }

  const sl = seg.slide;
  if (sl.img) {
    c.fillStyle = "#000"; c.fillRect(0, 0, W, H);
    drawCover(c, sl.img, W, H, 1 + 0.07 * k); // 천천히 확대
  } else {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#26304f"); g.addColorStop(1, "#0d1222");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = "rgba(255,255,255,.06)"; c.font = font(320, 800);
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(sl.year || "", W / 2, H / 2);
  }
  const shade = c.createLinearGradient(0, H * 0.35, 0, H);
  shade.addColorStop(0, "rgba(0,0,0,0)"); shade.addColorStop(1, "rgba(0,0,0,.88)");
  c.fillStyle = shade; c.fillRect(0, 0, W, H);

  // 상단 라벨
  c.textBaseline = "top"; c.textAlign = "left";
  c.font = font(26);
  c.fillStyle = "rgba(0,0,0,.45)"; c.fillRect(m - 14 * s, 36 * s, c.measureText(state.person).width + 28 * s, 44 * s);
  c.fillStyle = "#fff"; c.fillText(state.person, m, 44 * s);
  const idx = state.slides.indexOf(sl) + 1;
  c.textAlign = "right"; c.font = font(24, 600); c.fillStyle = "#e5e7eb";
  c.fillText(`${idx} / ${state.slides.length}`, W - m, 46 * s);

  // 하단 텍스트 (아래에서 올라오며 등장)
  const e = ease(Math.min(1, local / 0.7));
  c.globalAlpha = e;
  const dy = (1 - e) * 28 * s;
  const maxW = W - m * 2;
  c.font = font(30, 500);
  const descLines = sl.desc ? wrap(c, sl.desc, maxW, 4) : [];
  c.font = font(50);
  const titleLines = sl.title ? wrap(c, sl.title, maxW, 2) : [];
  const yearH = 120 * s, titleH = titleLines.length * 62 * s, descH = descLines.length * 42 * s;
  let y = H - 64 * s - (sl.source ? 30 * s : 0) - yearH - titleH - descH + dy;

  c.textBaseline = "top"; c.textAlign = "left";
  c.font = font(112, 800); c.fillStyle = SETTINGS.accent;
  const yw = c.measureText(sl.year).width;
  c.fillText(sl.year, m, y);
  if (sl.age) {
    c.font = font(34, 600); c.fillStyle = "#fff";
    c.fillText(sl.age, m + yw + 22 * s, y + 66 * s);
  }
  y += yearH;
  c.font = font(50); c.fillStyle = "#fff";
  titleLines.forEach((l) => { c.fillText(l, m, y); y += 62 * s; });
  c.font = font(30, 500); c.fillStyle = "#e5e7eb";
  descLines.forEach((l) => { c.fillText(l, m, y); y += 42 * s; });
  if (sl.source) {
    c.font = font(20, 400); c.fillStyle = "rgba(255,255,255,.65)";
    c.fillText(wrap(c, `출처: ${sl.source}`, maxW, 1)[0], m, H - 52 * s);
  }
  c.globalAlpha = 1;
}

function applyTransition(c, type, p, W, H) {
  const e = ease(p);
  if (p >= 1) return;
  if (type === "fade") c.globalAlpha = e;
  else if (type === "wipe") { c.beginPath(); c.rect(0, 0, W * e, H); c.clip(); }
  else if (type === "slide") c.translate((1 - e) * W, 0);
}

function render(t) {
  const [W, H] = SETTINGS.sizes[state.ratio];
  t = Math.min(Math.max(0, t), total - 0.001);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  timeline.forEach((seg, i) => {
    const local = t - seg.start;
    if (local < 0 || local >= seg.dur) return;
    const p = i > 0 && timeline.tr > 0 && local < timeline.tr ? local / timeline.tr : 1;
    ctx.save();
    applyTransition(ctx, state.transition, p, W, H);
    drawSegment(ctx, seg, local, W, H);
    ctx.restore();
  });
  // 진행 바 + 장면 마커
  const s = Math.min(W, H) / 720;
  ctx.fillStyle = "rgba(255,255,255,.2)"; ctx.fillRect(0, H - 6 * s, W, 6 * s);
  ctx.fillStyle = SETTINGS.accent; ctx.fillRect(0, H - 6 * s, W * (t / total), 6 * s);
  ctx.fillStyle = "#fff";
  timeline.slice(1).forEach((seg) => ctx.fillRect(W * (seg.start / total) - s, H - 6 * s, 2 * s, 6 * s));
}

/* ===== 재생 / 녹화 ===== */
// requestAnimationFrame 은 탭이 가려지면 멈추므로, 실제 경과 시간 기준 타이머로 재생
let curT = 0, playing = false, wallStart = 0, timer = 0;
let recording = false, recorder = null, chunks = [];

function tick() {
  curT = (performance.now() - wallStart) / 1000;
  if (curT >= total) { curT = total; render(curT); updateSeek(); finishPlayback(); return; }
  render(curT); updateSeek();
}
function play() {
  if (playing) return;
  if (curT >= total - 0.05) curT = 0;
  playing = true;
  wallStart = performance.now() - curT * 1000;
  $("playBtn").textContent = "⏸ 일시정지";
  startAudio(curT);
  timer = setInterval(tick, 1000 / SETTINGS.fps);
}
function pause() {
  playing = false; clearInterval(timer);
  $("playBtn").textContent = "▶ 미리보기";
  stopAudio();
}
function finishPlayback() {
  pause();
  if (recording) setTimeout(() => recorder && recorder.state !== "inactive" && recorder.stop(), 400);
}
function updateSeek() {
  $("seek").value = String(Math.round((curT / total) * 1000));
  $("timeLabel").textContent = `${fmt(curT)} / ${fmt(total)}`;
}

function startRecording() {
  if (!window.MediaRecorder) { alert("이 브라우저는 녹화를 지원하지 않습니다. 최신 Chrome/Edge를 사용하세요."); return; }
  pause(); curT = 0;
  const stream = canvas.captureStream(SETTINGS.fps);
  if (audio.dest) audio.dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
  const mime = ["video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m));
  recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  chunks = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.onstop = () => {
    recording = false;
    setUiBusy(false);
    const ext = mime.startsWith("video/mp4") ? "mp4" : "webm";
    const url = URL.createObjectURL(new Blob(chunks, { type: mime }));
    const a = $("downloadLink");
    a.href = url; a.download = `${state.person}_연혁영상.${ext}`; a.hidden = false;
    $("recStatus").textContent = "완료! 아래 버튼으로 저장하세요.";
  };
  recording = true;
  setUiBusy(true);
  $("downloadLink").hidden = true;
  $("recStatus").textContent = "녹화 중… 끝날 때까지 기다려 주세요.";
  if (audio.ctx) audio.preview.gain.value = 0;
  recorder.start(250);
  play();
}
function setUiBusy(b) {
  $("recBtn").disabled = b; $("playBtn").disabled = b; $("seek").disabled = b;
  if (!b && audio.ctx) audio.preview.gain.value = 1;
}

/* ===== 배경음악 ===== */
const audio = { el: null, ctx: null, dest: null, preview: null };
function loadBgm(file) {
  if (!file) return;
  if (!audio.ctx) {
    audio.ctx = new AudioContext();
    audio.el = new Audio();
    audio.el.loop = true;
    const src = audio.ctx.createMediaElementSource(audio.el);
    audio.dest = audio.ctx.createMediaStreamDestination();
    audio.preview = audio.ctx.createGain();
    src.connect(audio.dest);
    src.connect(audio.preview);
    audio.preview.connect(audio.ctx.destination);
  }
  audio.el.src = URL.createObjectURL(file);
}
function startAudio(t) {
  if (!audio.el || !audio.el.src) return;
  audio.ctx.resume();
  try { audio.el.currentTime = audio.el.duration ? t % audio.el.duration : 0; } catch (_) {}
  audio.el.play().catch(() => {});
}
function stopAudio() { if (audio.el) audio.el.pause(); }

/* ===== 편집 UI ===== */
function loadImage(file) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = URL.createObjectURL(file);
  });
}

// 공용 사진은 녹화(captureStream)가 막히지 않도록 crossOrigin 으로 불러옴
const urlImages = new Map();
function loadUrlImage(url) {
  if (!urlImages.has(url)) {
    urlImages.set(url, new Promise((res) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = () => { urlImages.delete(url); res(null); };
      img.src = url;
    }));
  }
  return urlImages.get(url);
}

const photoByKey = (key) => (state.lookup && key ? state.lookup.photos.find((p) => p.key === key) : null);
const photoCredit = (p) => `사진: ${p.artist || "작자 미상"}${p.license ? ` (${p.license})` : ""}, Wikimedia Commons`;
const composeSource = (p) => `위키백과${p ? ` · ${photoCredit(p)}` : ""}`;

async function setSlidePhoto(sl, photo) {
  sl.photoKey = photo ? photo.key : "";
  sl.source = composeSource(photo);
  sl.img = null;
  if (photo) {
    const img = await loadUrlImage(photo.thumb);
    if (sl.photoKey !== photo.key) return; // 그 사이 다른 사진을 고른 경우
    if (!img) alert("사진을 불러오지 못했습니다. 다른 사진을 골라 주세요.");
    sl.img = img;
  }
  renderList(); refresh(); showSlide(sl);
}

function refresh() { buildTimeline(); render(curT); }

// 해당 장면이 화면에 다 나온 시점으로 미리보기를 옮김
function showSlide(sl) {
  const seg = timeline.find((x) => x.slide === sl);
  if (!seg) return;
  if (playing) pause();
  curT = Math.min(total, seg.start + timeline.tr + 0.8);
  render(curT); updateSeek();
}

function renderList() {
  const box = $("slideList");
  box.innerHTML = "";
  state.slides.forEach((sl, i) => {
    const card = document.createElement("div");
    card.className = "card";

    const thumb = document.createElement(sl.img ? "img" : "div");
    thumb.className = "thumb";
    if (sl.img) thumb.src = sl.img.src; else thumb.textContent = "사진 없음";

    const f = document.createElement("div");
    f.className = "fields";
    const field = (label, key, cls = "", tag = "input") => {
      const l = document.createElement("label");
      if (cls) l.className = cls;
      l.append(label);
      const el = document.createElement(tag);
      if (tag === "input") el.type = "text";
      el.value = sl[key];
      el.addEventListener("input", () => { sl[key] = el.value; state.isSample = false; refresh(); });
      l.append(el);
      f.append(l);
    };
    field("연도", "year"); field("나이/시기", "age");
    field("제목", "title", "wide"); field("설명(기사 요약)", "desc", "wide", "textarea");
    field("출처", "source", "wide");

    if (state.lookup && state.lookup.photos.length) {
      const pl = document.createElement("label");
      pl.className = "wide"; pl.append("후보 사진에서 고르기");
      const sel = document.createElement("select");
      sel.add(new Option(sl.img && !sl.photoKey ? "직접 올린 사진" : "사진 없음", ""));
      state.lookup.photos.forEach((p) => sel.add(new Option(`${p.year || "연도 미상"} · ${p.title.slice(0, 40)}`, p.key)));
      sel.value = sl.photoKey;
      sel.addEventListener("change", () => {
        state.isSample = false;
        if (!sel.value && sl.img && !sl.photoKey) return; // 직접 올린 사진 유지
        setSlidePhoto(sl, photoByKey(sel.value));
      });
      pl.append(sel); f.append(pl);
    }

    const pic = document.createElement("label");
    pic.className = "wide"; pic.append("내 사진 올리기");
    const fi = document.createElement("input");
    fi.type = "file"; fi.accept = "image/*";
    fi.addEventListener("change", async () => {
      if (!fi.files[0]) return;
      const img = await loadImage(fi.files[0]);
      if (!img) { alert("이 사진 형식은 열 수 없습니다. JPG 또는 PNG로 바꿔서 올려 주세요. (아이폰 HEIC 등)"); fi.value = ""; return; }
      sl.img = img; sl.photoKey = ""; state.isSample = false;
      renderList(); refresh(); showSlide(sl);
    });
    pic.append(fi); f.append(pic);

    const tools = document.createElement("div");
    tools.className = "tools";
    const idx = document.createElement("span");
    idx.className = "idx"; idx.textContent = `장면 ${i + 1}`;
    const btns = document.createElement("div");
    const mk = (txt, fn, cls = "") => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = txt; if (cls) b.className = cls;
      b.addEventListener("click", fn); return b;
    };
    btns.append(
      mk("↑", () => move(i, -1)), " ", mk("↓", () => move(i, 1)), " ",
      mk("삭제", () => { state.slides.splice(i, 1); renderList(); refresh(); }, "del"),
    );
    tools.append(idx, btns);

    card.append(thumb, f, tools);
    box.append(card);
  });
}
function move(i, d) {
  const j = i + d;
  if (j < 0 || j >= state.slides.length) return;
  [state.slides[i], state.slides[j]] = [state.slides[j], state.slides[i]];
  renderList(); refresh();
}

/* ===== 인물 불러오기 ===== */
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  Object.assign(el, props);
  kids.flat(Infinity).forEach((k) => k != null && k !== false && el.append(k));
  return el;
}
function setStatus(msg, isError = false) {
  const el = $("qStatus");
  el.textContent = msg; el.classList.toggle("error", isError);
}

async function doSearch(e) {
  e.preventDefault();
  const name = $("qName").value.trim();
  if (!name) return;
  $("qCands").innerHTML = "";
  setStatus("검색 중…");
  try {
    const list = await WikiLookup.search(name);
    if (!list.length) { setStatus("찾는 인물이 없습니다. 이름을 정확히 입력해 보세요.", true); return; }
    setStatus(`${list.length}명이 검색됐습니다. 맞는 인물을 고르세요.`);
    list.forEach((c) => $("qCands").append(
      h("button", { type: "button", className: "cand", onclick: () => pickCandidate(c) },
        h("span", {}, h("b", { textContent: c.label }), " ", h("span", { className: "desc", textContent: c.description })),
        c.kowiki ? null : h("span", { className: "nowiki", textContent: "위키백과 문서 없음" })),
    ));
  } catch (err) {
    setStatus(`불러오지 못했습니다: ${err.message}`, true);
  }
}

async function pickCandidate(c) {
  $("qCands").innerHTML = "";
  setStatus(`‘${c.label}’ 정보와 사진을 불러오는 중… (몇 초 걸립니다)`);
  try {
    state.lookup = await WikiLookup.load(c);
    renderLookup();
    setStatus("불러왔습니다. 연혁·사진을 확인하고 ‘장면 만들기’를 누르세요. 만든 뒤에도 아래에서 고칠 수 있습니다.");
  } catch (err) {
    setStatus(`불러오지 못했습니다: ${err.message}`, true);
  }
}

function renderLookup() {
  const d = state.lookup;
  const fd = WikiLookup.fmtDate;
  const main = d.photos.find((p) => p.key === d.mainImage) || d.photos[d.photos.length - 1];
  const rows = [
    ["생년월일", d.birth ? `${fd(d.birth)}${d.death ? "" : d.age != null ? ` (만 ${d.age}세)` : ""}` : "정보 없음"],
    d.death && ["사망", `${fd(d.death)} (향년 ${d.age}세)`],
    d.birthPlace && ["출생지", d.birthPlace],
    d.party && ["정당", d.party],
    d.education && ["학력", d.education],
  ].filter(Boolean);
  $("profile").replaceChildren(
    main ? h("img", { src: main.thumb, alt: d.name }) : h("div", { className: "noimg" }),
    h("div", {},
      h("h4", { textContent: d.name }),
      h("div", { className: "muted", textContent: d.description }),
      h("dl", {}, rows.map(([k, v]) => [h("dt", { textContent: k }), h("dd", { textContent: v })])),
      d.summary && h("p", { textContent: d.summary }),
      h("div", { className: "links" },
        d.wikiUrl && h("a", { href: d.wikiUrl, target: "_blank", rel: "noopener", textContent: "위키백과 문서" }),
        h("a", { href: d.wikidataUrl, target: "_blank", rel: "noopener", textContent: "위키데이터" })),
    ),
  );

  $("evList").replaceChildren(...d.events.map((ev) => {
    const cb = h("input", { type: "checkbox", checked: ev.checked });
    const row = h("label", { className: "ev" + (ev.checked ? "" : " off") },
      cb,
      h("span", { className: "y" }, String(ev.date.y), h("small", { textContent: ev.age != null ? `만 ${ev.age}세` : "" })),
      h("span", { className: "t" },
        h("b", {}, ev.title, h("span", { className: "tag", textContent: ev.kind })),
        h("span", { textContent: ev.desc })),
    );
    cb.addEventListener("change", () => { ev.checked = cb.checked; row.classList.toggle("off", !cb.checked); });
    return row;
  }));

  $("photoCount").textContent = `(${d.photos.length}장)`;
  $("photoGrid").replaceChildren(...d.photos.map((p) =>
    h("a", { href: p.page, target: "_blank", rel: "noopener", title: `${p.title}\n${photoCredit(p)}` },
      h("img", { src: p.thumb, loading: "lazy", alt: p.title }),
      h("span", { textContent: `${p.year || "연도?"}${p.license ? ` · ${p.license}` : ""}` })),
  ));
  if (!d.photos.length) $("photoGrid").append(h("p", { className: "muted small", textContent: "공용에 등록된 사진이 없습니다. 장면마다 직접 올려 주세요." }));
  $("qResult").hidden = false;
}

// 연도가 ±3년 안이거나 재임 기간 안인 사진 중 시작 연도에 가장 가까운 것 (이미 쓴 사진은 피함)
function pickPhoto(d, ev, used) {
  const take = (p) => { if (p) used.add(p.key); return p || null; };
  if (ev.kind === "현재") {
    const main = d.photos.find((p) => p.key === d.mainImage && !used.has(p.key));
    if (main) return take(main);
  }
  const y = ev.date.y;
  const endY = ev.end ? ev.end.y : y;
  const near = d.photos
    .filter((p) => p.year && (Math.abs(p.year - y) <= 3 || (p.year >= y && p.year <= endY)) && !used.has(p.key))
    .sort((a, b) => Math.abs(a.year - y) - Math.abs(b.year - y) || b.year - a.year);
  if (near.length) return take(near[0]);
  if (ev.kind === "현재") return take([...d.photos].reverse().find((p) => p.year && !used.has(p.key)));
  return null;
}

async function applyLookup() {
  const d = state.lookup;
  const evs = d.events.filter((e) => e.checked);
  if (!evs.length) { alert("체크한 연혁이 없습니다."); return; }
  if (!state.isSample && state.slides.length && !confirm("지금 편집 중인 장면을 지우고 새로 만들까요?")) return;
  const fd = WikiLookup.fmtDate;
  state.person = d.name;
  state.infoLine = [
    d.birth && `${fd(d.birth)}생`,
    d.death ? `${fd(d.death)} 별세` : d.age != null && `만 ${d.age}세`,
    d.party,
  ].filter(Boolean).join(" · ");
  const used = new Set();
  state.slides = evs.map((ev) => {
    const ph = pickPhoto(d, ev, used);
    return makeSlide({
      year: String(ev.date.y), age: ev.age != null ? `만 ${ev.age}세` : "",
      title: ev.title, desc: ev.desc, source: composeSource(ph), photoKey: ph ? ph.key : "",
    });
  });
  state.isSample = false;
  syncInputs(); renderList(); refresh();
  $("slideList").scrollIntoView({ behavior: "smooth", block: "start" });

  const withPhoto = state.slides.filter((sl) => sl.photoKey);
  let done = 0;
  setStatus(`장면 ${state.slides.length}개를 만들었습니다. 사진 불러오는 중… 0/${withPhoto.length}`);
  await Promise.all(withPhoto.map(async (sl) => {
    const img = await loadUrlImage(photoByKey(sl.photoKey).thumb);
    if (img && sl.photoKey) sl.img = img;
    setStatus(`장면 ${state.slides.length}개를 만들었습니다. 사진 불러오는 중… ${++done}/${withPhoto.length}`);
  }));
  renderList(); refresh(); showSlide(state.slides[0]);
  setStatus(`장면 ${state.slides.length}개를 만들었습니다. 아래에서 내용과 사진을 고친 뒤 영상을 만드세요.`);
}

function syncInputs() {
  $("person").value = state.person; $("subtitle").value = state.subtitle; $("infoLine").value = state.infoLine;
}

function setRatio() {
  const [W, H] = SETTINGS.sizes[state.ratio];
  canvas.width = W; canvas.height = H;
  refresh();
}

function bind() {
  const sync = (id, key, conv = (v) => v, after = refresh) =>
    $(id).addEventListener("input", (e) => { state[key] = conv(e.target.value); after(); });
  syncInputs();
  $("ratio").value = state.ratio; $("transition").value = state.transition; $("slideSec").value = state.slideSec;
  sync("person", "person"); sync("subtitle", "subtitle"); sync("infoLine", "infoLine");

  $("qForm").addEventListener("submit", doSearch);
  $("applyBtn").addEventListener("click", applyLookup);
  const checkAll = (v) => { state.lookup.events.forEach((ev) => (ev.checked = v)); renderLookup(); };
  $("evAll").addEventListener("click", () => checkAll(true));
  $("evNone").addEventListener("click", () => checkAll(false));
  sync("ratio", "ratio", (v) => v, setRatio);
  sync("transition", "transition");
  sync("slideSec", "slideSec", (v) => Math.min(15, Math.max(2, Number(v) || 4)));
  $("bgm").addEventListener("change", (e) => loadBgm(e.target.files[0]));

  $("addBtn").addEventListener("click", () => { state.slides.push(makeSlide()); renderList(); refresh(); });
  $("bulk").addEventListener("change", async (e) => {
    const files = [...e.target.files].sort((a, b) => a.name.localeCompare(b.name, "ko", { numeric: true }));
    let first = null, failed = 0;
    for (const f of files) {
      const img = await loadImage(f);
      if (!img) { failed++; continue; }
      const sl = makeSlide({ img });
      state.slides.push(sl);
      first = first || sl;
    }
    e.target.value = "";
    renderList(); refresh();
    if (first) showSlide(first);
    if (failed) alert(`${failed}장은 열 수 없는 형식이라 건너뛰었습니다. JPG 또는 PNG로 바꿔서 올려 주세요.`);
  });

  $("playBtn").addEventListener("click", () => (playing ? pause() : play()));
  $("seek").addEventListener("input", (e) => {
    const was = playing;
    if (was) pause();
    curT = (Number(e.target.value) / 1000) * total;
    render(curT); updateSeek();
  });
  $("recBtn").addEventListener("click", startRecording);

  const root = document.documentElement;
  try { root.dataset.theme = localStorage.getItem(SETTINGS.themeKey) || "light"; } catch (_) {}
  $("themeBtn").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(SETTINGS.themeKey, root.dataset.theme); } catch (_) {}
  });
}

bind();
renderList();
setRatio();
