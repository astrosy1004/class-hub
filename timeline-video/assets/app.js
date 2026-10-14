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
const state = {
  person: DEFAULT_PROJECT.person,
  subtitle: DEFAULT_PROJECT.subtitle,
  ratio: "16:9",
  transition: "fade",
  slideSec: 4,
  slides: DEFAULT_PROJECT.slides.map(makeSlide),
};
let uid = 0;
function makeSlide(s = {}) {
  return { id: ++uid, year: "", age: "", title: "", desc: "", source: "", img: null, ...s };
}

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
    if (years.length > 1) {
      c.fillStyle = "#cbd5e1"; c.font = font(30, 500);
      c.fillText(`${years[0]} → ${years[years.length - 1]}`, W / 2, H / 2 + 150 * s);
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
  c.fillStyle = "rgba(0,0,0,.45)"; c.fillRect(m - 14 * s, 36 * s, c.measureText(state.person).width + 28 * s + 10, 44 * s);
  c.font = font(26); c.fillStyle = "#fff"; c.fillText(state.person, m, 44 * s);
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
    c.fillText(`출처: ${sl.source}`, m, H - 52 * s);
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
let curT = 0, playing = false, wallStart = 0, raf = 0;
let recording = false, recorder = null, chunks = [];

function tick(now) {
  curT = (now - wallStart) / 1000;
  if (curT >= total) { curT = total; render(curT); updateSeek(); finishPlayback(); return; }
  render(curT); updateSeek();
  raf = requestAnimationFrame(tick);
}
function play() {
  if (playing) return;
  if (curT >= total - 0.05) curT = 0;
  playing = true;
  wallStart = performance.now() - curT * 1000;
  $("playBtn").textContent = "⏸ 일시정지";
  startAudio(curT);
  raf = requestAnimationFrame(tick);
}
function pause() {
  playing = false; cancelAnimationFrame(raf);
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
    img.src = URL.createObjectURL(file);
  });
}

function refresh() { buildTimeline(); render(curT); }

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
      el.addEventListener("input", () => { sl[key] = el.value; refresh(); });
      l.append(el);
      f.append(l);
    };
    field("연도", "year"); field("나이/시기", "age");
    field("제목", "title", "wide"); field("설명(기사 요약)", "desc", "wide", "textarea");
    field("출처", "source", "wide");

    const pic = document.createElement("label");
    pic.className = "wide"; pic.append("사진");
    const fi = document.createElement("input");
    fi.type = "file"; fi.accept = "image/*";
    fi.addEventListener("change", async () => {
      if (!fi.files[0]) return;
      sl.img = await loadImage(fi.files[0]);
      renderList(); refresh();
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

function setRatio() {
  const [W, H] = SETTINGS.sizes[state.ratio];
  canvas.width = W; canvas.height = H;
  refresh();
}

function bind() {
  const sync = (id, key, conv = (v) => v, after = refresh) =>
    $(id).addEventListener("input", (e) => { state[key] = conv(e.target.value); after(); });
  $("person").value = state.person; $("subtitle").value = state.subtitle;
  $("ratio").value = state.ratio; $("transition").value = state.transition; $("slideSec").value = state.slideSec;
  sync("person", "person"); sync("subtitle", "subtitle");
  sync("ratio", "ratio", (v) => v, setRatio);
  sync("transition", "transition");
  sync("slideSec", "slideSec", (v) => Math.min(15, Math.max(2, Number(v) || 4)));
  $("bgm").addEventListener("change", (e) => loadBgm(e.target.files[0]));

  $("addBtn").addEventListener("click", () => { state.slides.push(makeSlide()); renderList(); refresh(); });
  $("bulk").addEventListener("change", async (e) => {
    const files = [...e.target.files].sort((a, b) => a.name.localeCompare(b.name, "ko", { numeric: true }));
    for (const f of files) state.slides.push(makeSlide({ img: await loadImage(f) }));
    e.target.value = "";
    renderList(); refresh();
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
