// ===== 설정 데이터 (여기만 고치면 목록·기본값이 바뀝니다) =====

// 채팅 모델: 설정 창에서 직접 다른 이름을 입력해도 됩니다.
const chatModels = ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini", "gpt-4o", "gpt-5-mini", "gpt-5"];

// 음성 인식(STT) 모델
const sttModels = [
  { id: "gpt-4o-mini-transcribe", label: "gpt-4o-mini-transcribe (빠르고 저렴)" },
  { id: "gpt-4o-transcribe", label: "gpt-4o-transcribe (정확도 높음)" },
  { id: "whisper-1", label: "whisper-1" },
];

// 음성 합성(TTS) 모델
const ttsModels = [
  { id: "gpt-4o-mini-tts", label: "gpt-4o-mini-tts (자연스러움)" },
  { id: "tts-1", label: "tts-1 (빠름)" },
  { id: "tts-1-hd", label: "tts-1-hd (고음질)" },
];

// TTS 목소리
const ttsVoices = [
  { id: "coral", label: "Coral · 밝은 여성" },
  { id: "nova", label: "Nova · 차분한 여성" },
  { id: "shimmer", label: "Shimmer · 부드러운 여성" },
  { id: "sage", label: "Sage · 또렷한 여성" },
  { id: "alloy", label: "Alloy · 중성적" },
  { id: "ash", label: "Ash · 남성" },
  { id: "echo", label: "Echo · 남성" },
  { id: "onyx", label: "Onyx · 낮은 남성" },
  { id: "fable", label: "Fable · 이야기꾼" },
];

const ttsSpeeds = [
  { id: 0.8, label: "느리게 (0.8x)" },
  { id: 1, label: "보통 (1x)" },
  { id: 1.2, label: "조금 빠르게 (1.2x)" },
  { id: 1.5, label: "빠르게 (1.5x)" },
];

// 첫 화면 예시 질문
const suggestions = [
  "오늘 저녁 메뉴 3가지만 추천해 줘",
  "영어 회화 연습 상대가 되어 줘",
  "자바스크립트 Promise를 쉽게 설명해 줘",
  "주말 서울 근교 나들이 코스 짜 줘",
];

const defaultSettings = {
  chatModel: "gpt-4.1-mini",
  systemPrompt: "너는 친절하고 똑똑한 한국어 AI 비서야. 핵심부터 간결하게 답해.",
  sttModel: "gpt-4o-mini-transcribe",
  ttsModel: "gpt-4o-mini-tts",
  ttsVoice: "coral",
  ttsSpeed: 1,
  autoSend: true,
  autoSpeak: false,
};

const API_BASE = "https://api.openai.com/v1";
const STORE = {
  key: "mychatApiKey",
  settings: "mychatSettings",
  convs: "mychatConversations",
  current: "mychatCurrent",
  theme: "mychatTheme",
};

// ===== 상태 =====
const $ = (id) => document.getElementById(id);
const els = {
  sidebar: $("sidebar"), backdrop: $("sidebarBackdrop"), convList: $("convList"),
  messages: $("messages"), empty: $("emptyState"), chatTitle: $("chatTitle"), modelChip: $("modelChip"),
  input: $("input"), composer: $("composer"), send: $("sendButton"), stop: $("stopButton"),
  mic: $("micButton"), status: $("status"), keyBanner: $("keyBanner"), dialog: $("settingsDialog"),
};

let settings = { ...defaultSettings, ...readJSON(STORE.settings, {}) };
let conversations = readJSON(STORE.convs, []);
let currentId = localStorage.getItem(STORE.current);
let abortCtrl = null;
let recorder = null;
let player = { audio: null, button: null, url: null };

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveConvs() {
  try { localStorage.setItem(STORE.convs, JSON.stringify(conversations)); } catch { setStatus("저장 공간이 부족해요. 오래된 대화를 지워 주세요."); }
  localStorage.setItem(STORE.current, currentId || "");
}
const getKey = () => (localStorage.getItem(STORE.key) || "").trim();
const current = () => conversations.find((c) => c.id === currentId);
const setStatus = (text) => { els.status.textContent = text || ""; };

// ===== 테마 =====
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $("themeIcon").textContent = theme === "dark" ? "☀" : "☾";
}
applyTheme(localStorage.getItem(STORE.theme) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("themeToggle").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(STORE.theme, next);
  applyTheme(next);
});

// ===== 간단한 마크다운 =====
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function renderMarkdown(src) {
  return src.split("```").map((part, i) => {
    if (i % 2 === 1) {
      const nl = part.indexOf("\n");
      const code = nl >= 0 ? part.slice(nl + 1) : part;
      return `<pre><code>${escapeHtml(code.replace(/\n$/, ""))}</code></pre>`;
    }
    return escapeHtml(part)
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
      .replace(/^#{1,6} (.+)$/gm, '<strong class="md-h">$1</strong>')
      .replace(/^\s*[-*] /gm, "• ")
      .replace(/\n/g, "<br>");
  }).join("");
}

// ===== 대화 목록 =====
function renderConvList() {
  els.convList.innerHTML = "";
  conversations.forEach((c) => {
    const li = document.createElement("li");
    li.className = "conv-item" + (c.id === currentId ? " active" : "");
    const open = document.createElement("button");
    open.type = "button";
    open.className = "conv-open";
    open.textContent = c.title;
    open.addEventListener("click", () => { selectConv(c.id); closeSidebar(); });
    const del = document.createElement("button");
    del.type = "button";
    del.className = "conv-delete";
    del.setAttribute("aria-label", "대화 삭제");
    del.textContent = "✕";
    del.addEventListener("click", () => {
      if (!confirm(`"${c.title}" 대화를 삭제할까요?`)) return;
      conversations = conversations.filter((x) => x.id !== c.id);
      if (currentId === c.id) currentId = null;
      saveConvs();
      renderAll();
    });
    li.append(open, del);
    els.convList.append(li);
  });
}

function selectConv(id) {
  if (abortCtrl) abortCtrl.abort();
  stopSpeaking();
  currentId = id;
  saveConvs();
  renderAll();
}

function renderMessages() {
  els.messages.querySelectorAll(".msg").forEach((n) => n.remove());
  const conv = current();
  const list = conv ? conv.messages : [];
  els.empty.hidden = list.length > 0;
  els.chatTitle.textContent = conv ? conv.title : "새 대화";
  list.forEach((m) => addMessageEl(m.role, m.content));
  scrollBottom();
}

function renderAll() {
  renderConvList();
  renderMessages();
  els.modelChip.textContent = settings.chatModel;
  els.keyBanner.hidden = !!getKey();
}

function addMessageEl(role, content) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  if (role === "assistant") bubble.innerHTML = renderMarkdown(content);
  else bubble.textContent = content;
  wrap.append(bubble);
  if (role === "assistant" && content) wrap.append(makeTools(content));
  els.messages.append(wrap);
  return { wrap, bubble };
}

function makeTools(text) {
  const tools = document.createElement("div");
  tools.className = "msg-tools";
  const speak = document.createElement("button");
  speak.type = "button";
  speak.className = "tool";
  speak.textContent = "🔊 듣기";
  speak.addEventListener("click", () => toggleSpeak(text, speak));
  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "tool";
  copy.textContent = "📋 복사";
  copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(text); copy.textContent = "✓ 복사됨"; }
    catch { copy.textContent = "복사 실패"; }
    setTimeout(() => (copy.textContent = "📋 복사"), 1500);
  });
  tools.append(speak, copy);
  return tools;
}

const scrollBottom = () => { els.messages.scrollTop = els.messages.scrollHeight; };

// ===== OpenAI API =====
async function apiError(res) {
  let msg = `${res.status} 오류`;
  try { const j = await res.json(); if (j.error?.message) msg = j.error.message; } catch {}
  if (res.status === 401) msg = "API 키가 올바르지 않아요. 설정에서 다시 확인해 주세요.";
  if (res.status === 429) msg = "요청 한도 또는 크레딧을 초과했어요. (" + msg + ")";
  return new Error(msg);
}

async function streamChat(messages, onDelta, signal) {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify({ model: settings.chatModel, messages, stream: true }),
    signal,
  });
  if (!res.ok) throw await apiError(res);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const data = t.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content;
        if (delta) onDelta(delta);
      } catch {}
    }
  }
}

async function transcribe(blob) {
  const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : "webm";
  const form = new FormData();
  form.append("file", blob, `speech.${ext}`);
  form.append("model", settings.sttModel);
  form.append("language", "ko");
  const res = await fetch(`${API_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getKey()}` },
    body: form,
  });
  if (!res.ok) throw await apiError(res);
  return (await res.json()).text || "";
}

async function synthesize(text) {
  const body = {
    model: settings.ttsModel,
    voice: settings.ttsVoice,
    input: text.replace(/```[\s\S]*?```/g, " (코드 생략) ").replace(/[*#`]/g, "").slice(0, 4000),
    speed: Number(settings.ttsSpeed),
    response_format: "mp3",
  };
  if (settings.ttsModel === "gpt-4o-mini-tts") body.instructions = "자연스럽고 따뜻한 한국어 말투로 읽어 줘.";
  const res = await fetch(`${API_BASE}/audio/speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await apiError(res);
  return res.blob();
}

// ===== 메시지 보내기 =====
async function sendMessage(text) {
  text = text.trim();
  if (!text || abortCtrl) return;
  if (!getKey()) { openSettings(); return; }
  stopSpeaking();

  let conv = current();
  if (!conv) {
    conv = { id: Date.now().toString(36), title: text.slice(0, 30), messages: [], createdAt: Date.now() };
    conversations.unshift(conv);
    currentId = conv.id;
  } else {
    // 최근 대화를 목록 맨 위로
    conversations = [conv, ...conversations.filter((c) => c.id !== conv.id)];
  }
  conv.messages.push({ role: "user", content: text });
  saveConvs();
  renderConvList();
  els.empty.hidden = true;
  els.chatTitle.textContent = conv.title;
  addMessageEl("user", text);

  const { wrap, bubble } = addMessageEl("assistant", "");
  bubble.classList.add("cursor");
  scrollBottom();
  setBusy(true);

  const history = [{ role: "system", content: settings.systemPrompt }, ...conv.messages.slice(-30)];
  let answer = "";
  abortCtrl = new AbortController();
  try {
    await streamChat(history, (delta) => {
      answer += delta;
      bubble.innerHTML = renderMarkdown(answer);
      scrollBottom();
    }, abortCtrl.signal);
  } catch (err) {
    if (err.name !== "AbortError") {
      wrap.classList.add("error");
      bubble.textContent = "⚠ " + err.message;
      answer = "";
    }
  } finally {
    bubble.classList.remove("cursor");
    abortCtrl = null;
    setBusy(false);
  }

  if (answer) {
    conv.messages.push({ role: "assistant", content: answer });
    saveConvs();
    const tools = makeTools(answer);
    wrap.append(tools);
    if (settings.autoSpeak) toggleSpeak(answer, tools.querySelector(".tool"));
  } else if (!wrap.classList.contains("error")) {
    wrap.remove();
  }
  scrollBottom();
}

function setBusy(busy) {
  els.send.hidden = busy;
  els.stop.hidden = !busy;
  setStatus(busy ? "답변을 쓰는 중…" : "");
}

// ===== TTS 재생 =====
function stopSpeaking() {
  if (player.audio) player.audio.pause();
  if (player.url) URL.revokeObjectURL(player.url);
  if (player.button) { player.button.classList.remove("playing"); player.button.textContent = "🔊 듣기"; }
  player = { audio: null, button: null, url: null };
}

async function toggleSpeak(text, button) {
  const wasMine = player.button === button;
  stopSpeaking();
  if (wasMine) return;
  player.button = button;
  button.classList.add("playing");
  button.textContent = "⏳ 준비 중";
  try {
    const blob = await synthesize(text);
    if (player.button !== button) return; // 기다리는 사이 다른 걸 눌렀음
    player.url = URL.createObjectURL(blob);
    player.audio = new Audio(player.url);
    player.audio.addEventListener("ended", stopSpeaking);
    button.textContent = "⏹ 멈추기";
    await player.audio.play();
  } catch (err) {
    if (player.button === button) stopSpeaking();
    setStatus("음성 재생 실패: " + err.message);
  }
}

// ===== STT 녹음 =====
async function toggleRecording() {
  if (recorder && recorder.state === "recording") { recorder.stop(); return; }
  if (!getKey()) { openSettings(); return; }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    setStatus("이 브라우저는 음성 녹음을 지원하지 않아요. (Chrome/Edge/Safari 최신 버전 권장)");
    return;
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    setStatus("마이크 권한이 필요해요. 주소창의 🔒 아이콘에서 마이크를 허용해 주세요.");
    return;
  }
  stopSpeaking();
  const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported(t));
  recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  const chunks = [];
  const startedAt = Date.now();
  recorder.addEventListener("dataavailable", (e) => e.data.size && chunks.push(e.data));
  recorder.addEventListener("stop", async () => {
    stream.getTracks().forEach((t) => t.stop());
    els.mic.classList.remove("recording");
    if (Date.now() - startedAt < 500) { setStatus("너무 짧아요. 버튼을 누르고 말한 뒤 다시 눌러 주세요."); return; }
    els.mic.classList.add("busy");
    els.mic.disabled = true;
    setStatus("말씀하신 내용을 글자로 바꾸는 중…");
    try {
      const text = (await transcribe(new Blob(chunks, { type: recorder.mimeType }))).trim();
      setStatus("");
      if (!text) { setStatus("인식된 말이 없어요. 다시 시도해 주세요."); return; }
      if (settings.autoSend && !els.input.value.trim()) {
        sendMessage(text);
      } else {
        els.input.value = (els.input.value ? els.input.value + " " : "") + text;
        autoGrow();
        els.input.focus();
      }
    } catch (err) {
      setStatus("음성 인식 실패: " + err.message);
    } finally {
      els.mic.classList.remove("busy");
      els.mic.disabled = false;
    }
  });
  recorder.start();
  els.mic.classList.add("recording");
  setStatus("🎙 듣고 있어요… 다 말했으면 버튼을 한 번 더 누르세요.");
}

// ===== 설정 창 =====
function fillSelect(id, items) {
  $(id).innerHTML = items.map((it) => `<option value="${it.id}">${escapeHtml(it.label)}</option>`).join("");
}
fillSelect("sttModel", sttModels);
fillSelect("ttsModel", ttsModels);
fillSelect("ttsVoice", ttsVoices);
fillSelect("ttsSpeed", ttsSpeeds);
$("chatModelList").innerHTML = chatModels.map((m) => `<option value="${m}"></option>`).join("");

function openSettings() {
  $("apiKey").value = getKey();
  $("apiKey").type = "password";
  $("toggleKey").textContent = "보기";
  ["chatModel", "systemPrompt", "sttModel", "ttsModel", "ttsVoice", "ttsSpeed"].forEach((k) => ($(k).value = settings[k]));
  $("autoSend").checked = settings.autoSend;
  $("autoSpeak").checked = settings.autoSpeak;
  els.dialog.showModal();
  if (!getKey()) $("apiKey").focus();
}

els.dialog.addEventListener("close", () => {
  if (els.dialog.returnValue !== "save") return;
  localStorage.setItem(STORE.key, $("apiKey").value.trim());
  settings = {
    chatModel: $("chatModel").value.trim() || defaultSettings.chatModel,
    systemPrompt: $("systemPrompt").value.trim() || defaultSettings.systemPrompt,
    sttModel: $("sttModel").value,
    ttsModel: $("ttsModel").value,
    ttsVoice: $("ttsVoice").value,
    ttsSpeed: Number($("ttsSpeed").value),
    autoSend: $("autoSend").checked,
    autoSpeak: $("autoSpeak").checked,
  };
  localStorage.setItem(STORE.settings, JSON.stringify(settings));
  renderAll();
  setStatus("설정을 저장했어요.");
});

$("toggleKey").addEventListener("click", () => {
  const show = $("apiKey").type === "password";
  $("apiKey").type = show ? "text" : "password";
  $("toggleKey").textContent = show ? "숨기기" : "보기";
});

$("clearAll").addEventListener("click", () => {
  if (!confirm("저장된 모든 대화를 삭제할까요? 되돌릴 수 없어요.")) return;
  conversations = [];
  currentId = null;
  saveConvs();
  renderAll();
  els.dialog.close();
});

$("openSettings").addEventListener("click", openSettings);
document.querySelectorAll("[data-open-settings]").forEach((b) => b.addEventListener("click", openSettings));

// ===== 입력 이벤트 =====
function autoGrow() {
  els.input.style.height = "auto";
  els.input.style.height = Math.min(els.input.scrollHeight, 200) + "px";
}

els.composer.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = els.input.value;
  if (!text.trim() || abortCtrl) return;
  els.input.value = "";
  autoGrow();
  sendMessage(text);
});
els.input.addEventListener("input", autoGrow);
els.input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    els.composer.requestSubmit();
  }
});
els.stop.addEventListener("click", () => abortCtrl && abortCtrl.abort());
els.mic.addEventListener("click", toggleRecording);

$("newChat").addEventListener("click", () => { selectConv(null); closeSidebar(); els.input.focus(); });

// 모바일 사이드바
function closeSidebar() { els.sidebar.classList.remove("open"); els.backdrop.hidden = true; }
$("menuToggle").addEventListener("click", () => { els.sidebar.classList.add("open"); els.backdrop.hidden = false; });
els.backdrop.addEventListener("click", closeSidebar);

// 예시 질문
suggestions.forEach((q) => {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = q;
  b.addEventListener("click", () => sendMessage(q));
  $("suggestions").append(b);
});

if (currentId && !current()) currentId = null;
renderAll();
if (!getKey()) openSettings();
