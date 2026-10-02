// tone: styles.css 의 --tone-<이름> 색상과 연결됩니다.
const categories = [
  { id: "all", title: "전체 북마크", meta: "All Links", icon: "⭐", tone: "slate" },
  { id: "class", title: "수업 관련", meta: "Zoom · LMS · Discord", icon: "🎓", tone: "blue" },
  { id: "reference", title: "참고 자료", meta: "강의 자료와 복습", icon: "📚", tone: "violet" },
  { id: "chat-ai", title: "채팅형 AI", meta: "대화로 묻고 답하기", icon: "💬", tone: "teal" },
  { id: "editor-ai", title: "에디터 내장형", meta: "코드 에디터 속 AI", icon: "⌨️", tone: "lime" },
  { id: "terminal", title: "터미널 도구", meta: "CLI 코딩 에이전트", icon: "🖥️", tone: "slate" },
  { id: "web-env", title: "웹 기반 환경", meta: "브라우저에서 바로 개발", icon: "🌐", tone: "sky" },
  { id: "builder", title: "UI · 앱 빌더", meta: "프롬프트로 만드는 앱", icon: "🧱", tone: "pink" },
  { id: "backend", title: "백엔드", meta: "DB · 인증 · 서버", icon: "🗄️", tone: "orange" },
  { id: "automation", title: "AI 에이전트 · 자동화", meta: "워크플로우 연결", icon: "🔁", tone: "amber" },
];

// 내 프로그램 분류
const programTypes = [
  { id: "all", title: "전체" },
  { id: "webapp", title: "웹앱" },
  { id: "game", title: "게임" },
  { id: "plan", title: "기획서" },
  { id: "portfolio", title: "포트폴리오" },
  { id: "landing", title: "랜딩 페이지" },
  { id: "etc", title: "기타" },
];

const programStatuses = [
  { id: "live", title: "배포됨" },
  { id: "local", title: "로컬 확인" },
  { id: "draft", title: "기획 중" },
];

const toneOptions = [
  { id: "orange", title: "주황" },
  { id: "amber", title: "노랑" },
  { id: "lime", title: "연두" },
  { id: "teal", title: "청록" },
  { id: "sky", title: "하늘" },
  { id: "blue", title: "파랑" },
  { id: "violet", title: "보라" },
  { id: "pink", title: "분홍" },
  { id: "slate", title: "회색" },
];

// 기본 프로그램 목록. 화면의 "프로그램 등록" 으로 추가한 항목은 이 브라우저(localStorage)에 따로 저장됩니다.
// url 은 https 주소 또는 이 폴더 기준 상대 경로(../폴더/index.html)를 씁니다.
const programs = [
  {
    id: "saju",
    type: "webapp",
    status: "live",
    title: "사주 시각화",
    icon: "🔮",
    tone: "violet",
    url: "https://saju-app-sykim.web.app",
    description: "생년월일시로 사주 명식을 계산하고 인생 흐름을 그래프로 보여주는 웹앱",
    features: ["음력 · 서머타임 보정 명식 계산", "기질 점수와 인생 흐름 그래프", "구글 로그인으로 가족 · 지인 명식 저장", "파스텔 테마 4종"],
    tags: ["사주", "Firebase"],
  },
  {
    id: "pet-care",
    type: "webapp",
    status: "live",
    title: "행복한 집사 생활",
    icon: "🐱",
    tone: "orange",
    url: "https://happy-mypet.vercel.app/",
    description: "고양이 울음소리와 행동 신호를 해석하고 식사 · 건강을 기록하는 반려동물 케어 서비스",
    features: ["울음 · 꼬리 · 귀 · 자세로 감정 해석", "식사 · 배변 · 건강 기록", "AI 맞춤 케어 안내"],
    tags: ["고양이", "Vercel"],
  },
  {
    id: "mynews",
    type: "webapp",
    status: "live",
    title: "나의 뉴스 모음",
    icon: "📰",
    tone: "sky",
    url: "https://astrosy1004.github.io/class-hub/mynews-2609/",
    description: "RSS 뉴스를 2시간마다 자동으로 모아 한 화면에 보여주는 뉴스 모음",
    features: ["2시간마다 RSS 자동 수집", "카테고리별 뉴스 목록", "매일 오전 9시 디스코드 요약 발송"],
    tags: ["뉴스", "자동화", "Discord"],
  },
  {
    id: "youtube-trend",
    type: "webapp",
    status: "live",
    title: "유튜브 트렌드 분석",
    icon: "📈",
    tone: "pink",
    url: "https://youtube-ai-agent-trend-app.vercel.app/",
    description: "유튜브의 AI 에이전트 관련 트렌드를 분석해 보여주는 웹앱",
    features: ["AI 에이전트 유튜브 트렌드 분석"],
    tags: ["유튜브", "AI 에이전트", "Vercel"],
  },
  {
    id: "game-hub",
    type: "game",
    status: "live",
    title: "게임 허브",
    icon: "🎮",
    tone: "lime",
    url: "../game01/index.html",
    description: "수업 시간에 함께 즐기는 브라우저 미니 게임 모음",
    features: ["테트리스 · 공 피하기 · 두더지 잡기", "사다리 타기 · 칭찬 게임", "VR 직업 퀘스트 · XR 면접 체험"],
    tags: ["HTML5", "게임"],
  },
  {
    id: "weather-safety",
    type: "webapp",
    status: "live",
    title: "현장 날씨 안전도우미",
    icon: "⛑️",
    tone: "amber",
    url: "https://weath-app-sykim.web.app",
    description: "지역 날씨에 맞춰 공사 현장 안전수칙을 안내해 사고를 예방하는 웹앱",
    features: ["현재 · 시간별 · 주간 날씨와 미세먼지", "더위 · 추위 · 강풍 등 분류별 안전수칙", "위험 기상 알림과 QR · 링크 공유"],
    tags: ["날씨", "안전", "Firebase"],
  },
  {
    id: "funcode",
    type: "portfolio",
    status: "live",
    title: "FunCode 즐거운 코딩",
    icon: "💻",
    tone: "blue",
    url: "https://astrosy1004.github.io/",
    description: "코딩강사 포트폴리오 사이트",
    features: ["소개 · 강의 철학 · 강의 분야", "저서 8권과 강의 경력", "자료실 · 수업 사진 · 후기"],
    tags: ["포트폴리오"],
  },
  {
    id: "landing-compare",
    type: "landing",
    status: "live",
    title: "같은 브리프, 다른 랜딩",
    icon: "🧪",
    tone: "teal",
    url: "../landing-compare/index.html",
    description: "창고 · 물류 SaaS 랜딩 두 종과 둘을 나란히 비교하는 페이지",
    features: ["랜딩 페이지 Loop", "랜딩 페이지 Palletto", "배경색 · 서체 · 여백 비교"],
    tags: ["랜딩", "SaaS"],
  },
  {
    id: "my-bookmark",
    type: "webapp",
    status: "live",
    title: "나의 북마크",
    icon: "🔖",
    tone: "blue",
    url: "https://astrosy1004.github.io/class-hub/bookmark/",
    description: "AI 도구 북마크와 내가 만든 프로그램을 한곳에 모은 개인 페이지",
    features: ["카테고리별 AI 도구 북마크", "내 프로그램 등록 · 수정 · 삭제", "수업 링크 비밀번호 · 수강코드 복사"],
    tags: ["북마크", "GitHub Pages"],
  }
];

const bookmarks = [
  {
    category: "class",
    title: "Zoom 입장",
    url: "https://goor.me/product02_zoom",
    icon: "💻",
    description: "실시간 온라인 수업 접속 링크",
    secretLabel: "PW 복사",
    secretValue: "260826",
  },
  {
    category: "class",
    title: "Goorm LMS",
    url: "https://seoul-ict.goorm.io/",
    icon: "🏫",
    description: "출석, 평가, 복습용 LMS",
    secretLabel: "수강코드 복사",
    secretValue: "x353Zi",
  },
  {
    category: "class",
    title: "Discord",
    url: "https://discord.gg/gZn75a37bY",
    icon: "📱",
    description: "수업 공지와 커뮤니케이션 채널",
  },
  {
    category: "reference",
    title: "강의 자료",
    url: "https://app.notion.com/p/26-2-AI-3ca7d480b5938006b091c14932f747f6",
    icon: "📘",
    description: "수업 강의 자료와 정리 문서",
  },
  {
    category: "reference",
    title: "복습 링크",
    url: "https://seoul-ict.goorm.io/learn/lecture/66153/%EC%83%9D%EC%84%B1%ED%98%95-ai-%ED%94%84%EB%A1%9C%EB%8D%95%ED%8A%B8-%EB%A7%88%EC%8A%A4%ED%84%B0-2%EA%B8%B0",
    icon: "▶️",
    description: "LMS 강의 복습 페이지",
  },
  { category: "chat-ai", title: "Claude", url: "https://claude.ai", icon: "🤖", description: "긴 문서와 코딩 협업에 강한 AI" },
  { category: "chat-ai", title: "ChatGPT", url: "https://chat.openai.com", icon: "💬", description: "아이디어, 문서, 코딩 보조" },
  { category: "chat-ai", title: "Google Gemini", url: "https://gemini.google.com", icon: "✨", description: "Google 생태계와 연결되는 AI" },
  { category: "chat-ai", title: "Perplexity", url: "https://perplexity.ai", icon: "🔎", description: "최신 정보 검색과 출처 확인" },
  { category: "editor-ai", title: "GitHub Copilot", url: "https://github.com/features/copilot", icon: "⌨️", description: "개발 환경 안의 코딩 보조" },
  { category: "editor-ai", title: "Cursor", url: "https://cursor.sh", icon: "🧭", description: "AI 코드 에디터" },
  { category: "editor-ai", title: "Devin Desktop", url: "https://cognition.ai", icon: "🖥️", description: "AI 소프트웨어 에이전트" },
  { category: "editor-ai", title: "Cline", url: "https://github.com/cline/cline", icon: "🧩", description: "VS Code 기반 AI 코딩 도구" },
  { category: "editor-ai", title: "Google Antigravity", url: "https://antigravity.google", icon: "🚀", description: "Google AI 개발 환경" },
  { category: "terminal", title: "Claude Code", url: "https://docs.claude.com/claude-code", icon: "▣", description: "터미널 기반 AI 코딩 도구" },
  { category: "terminal", title: "OpenAI Codex CLI", url: "https://github.com/openai/codex", icon: "▤", description: "터미널 기반 코딩 에이전트" },
  { category: "terminal", title: "Antigravity CLI", url: "https://antigravity.google", icon: "▲", description: "CLI 기반 개발 도구" },
  { category: "terminal", title: "OpenCode", url: "https://opencode.ai", icon: "◆", description: "오픈소스 AI 코딩 도구" },
  { category: "terminal", title: "Aider", url: "https://aider.chat", icon: "◇", description: "Git 친화적 AI 코딩 도구" },
  { category: "terminal", title: "Kimi Code CLI", url: "https://www.kimi.com/code", icon: "◈", description: "CLI 기반 코드 지원" },
  { category: "web-env", title: "Google Colab", url: "https://colab.research.google.com", icon: "📓", description: "Python 실습 노트북" },
  { category: "web-env", title: "OpenRouter", url: "https://openrouter.ai", icon: "🔌", description: "여러 AI 모델 API 연결" },
  { category: "web-env", title: "GitHub", url: "https://github.com", icon: "🗂️", description: "코드 저장소와 협업" },
  { category: "web-env", title: "Streamlit", url: "https://streamlit.io", icon: "📊", description: "빠른 데이터 앱 제작" },
  { category: "web-env", title: "Replit", url: "https://replit.com", icon: "🌐", description: "브라우저 기반 개발 환경" },
  { category: "web-env", title: "CodePen", url: "https://codepen.io", icon: "🎨", description: "프론트엔드 실험 환경" },
  { category: "web-env", title: "StackBlitz", url: "https://stackblitz.com", icon: "⚡", description: "웹 앱 온라인 개발 환경" },
  { category: "web-env", title: "GitHub Codespaces", url: "https://github.com/features/codespaces", icon: "☁️", description: "클라우드 개발 환경" },
  { category: "builder", title: "v0", url: "https://v0.app", icon: "🧱", description: "프롬프트 기반 UI 생성" },
  { category: "builder", title: "Lovable", url: "https://lovable.dev", icon: "💗", description: "웹 앱 제작 AI 빌더" },
  { category: "builder", title: "Bolt.new", url: "https://bolt.new", icon: "⚙️", description: "브라우저 기반 앱 빌더" },
  { category: "builder", title: "Base44", url: "https://base44.com", icon: "🧰", description: "AI 앱 제작 플랫폼" },
  { category: "builder", title: "Uizard", url: "https://uizard.io", icon: "🪄", description: "디자인과 와이어프레임 제작" },
  { category: "backend", title: "Supabase", url: "https://supabase.com", icon: "🟩", description: "오픈소스 백엔드 플랫폼" },
  { category: "backend", title: "Firebase", url: "https://firebase.google.com", icon: "🔥", description: "Google 앱 백엔드" },
  { category: "backend", title: "Xano", url: "https://xano.com", icon: "🔧", description: "노코드 백엔드 빌더" },
  { category: "automation", title: "OpenClaw", url: "https://github.com/OpenClaw", icon: "🤖", description: "자율 실행 AI 에이전트" },
  { category: "automation", title: "n8n", url: "https://n8n.io", icon: "🔁", description: "오픈소스 워크플로우 자동화" },
  { category: "automation", title: "Make", url: "https://www.make.com", icon: "🧵", description: "노코드 업무 자동화" },
  { category: "automation", title: "Zapier AI", url: "https://zapier.com", icon: "⚡", description: "업무 자동화 연결 플랫폼" },
];

const PROGRAM_KEY = "bookmarkPrograms";

const searchSuggestions = {
  bookmarks: ["Claude", "자동화", "코딩", "Zoom"],
  programs: ["사주", "게임", "날씨", "고양이"],
};

let activeCategory = "all";
let searchMode = "bookmarks";
let editingId = null;

const $ = (selector) => document.querySelector(selector);
const findCategory = (id) => categories.find((category) => category.id === id);
const titleOf = (list, id) => (list.find((item) => item.id === id) || list[list.length - 1]).title;

// 화면에서 입력한 값은 HTML 로 해석되지 않도록 바꿔서 넣습니다.
function esc(value = "") {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value).replace(/[&<>"']/g, (char) => map[char]);
}

// https 주소와 상대 경로만 허용합니다. (javascript: 같은 주소 차단)
function safeUrl(url) {
  const value = String(url || "").trim();
  if (/^https?:\/\/\S+$/i.test(value) || /^(\.{1,2}\/|\/)\S*$/.test(value)) return value;
  return "";
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("visible"), 2200);
}

/* ---------- 프로그램 저장소 ---------- */
function loadUserPrograms() {
  try {
    const list = JSON.parse(localStorage.getItem(PROGRAM_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveUserPrograms(list) {
  try {
    localStorage.setItem(PROGRAM_KEY, JSON.stringify(list));
    return true;
  } catch {
    showToast("이 브라우저에서는 저장할 수 없습니다.");
    return false;
  }
}

function allPrograms() {
  return [...programs, ...loadUserPrograms().map((program) => ({ ...program, custom: true }))];
}

function programText(program) {
  return [program.title, program.description, (program.features || []).join(" "), (program.tags || []).join(" ")]
    .join(" ")
    .toLowerCase();
}

/* ---------- 빠른 메뉴 ---------- */
function renderQuickMenu() {
  const items = categories
    .filter((category) => category.id !== "all")
    .map((category) => ({ id: category.id, icon: category.icon, title: category.title, tone: category.tone }));
  items.push({ id: "programs", icon: "🚀", title: "내 프로그램", tone: "orange" });

  $("#quickMenu").innerHTML = items
    .map(
      (item) => `
      <button class="quick-item" type="button" data-quick="${item.id}">
        <span class="quick-icon tone-${item.tone}" aria-hidden="true">${item.icon}</span>
        <span>${item.title}</span>
      </button>`
    )
    .join("");

  $("#quickMenu").addEventListener("click", (event) => {
    const button = event.target.closest("[data-quick]");
    if (!button) return;
    if (button.dataset.quick === "programs") $("#programs").scrollIntoView({ behavior: "smooth" });
    else selectCategory(button.dataset.quick);
  });
}

/* ---------- 상단 메뉴 ---------- */
function renderMenus() {
  $("#categoryMenu").innerHTML = categories
    .map(
      (category) =>
        `<button type="button" class="menu-item" data-category="${category.id}"><span aria-hidden="true">${category.icon}</span>${category.title}<em>${
          category.id === "all" ? bookmarks.length : bookmarks.filter((bookmark) => bookmark.category === category.id).length
        }</em></button>`
    )
    .join("");

  const items = allPrograms()
    .map((program) => {
      const url = safeUrl(program.url);
      return `<a class="menu-item" href="${esc(url || "#programs")}" ${url ? 'target="_blank" rel="noopener noreferrer"' : ""}><span aria-hidden="true">${esc(program.icon || "✦")}</span>${esc(program.title)}</a>`;
    })
    .join("");
  $("#programMenu").innerHTML = `${items}<hr /><button type="button" class="menu-item menu-register" data-register>＋ 프로그램 등록</button>`;
}

function closeDropdowns(except) {
  document.querySelectorAll(".dropdown").forEach((dropdown) => {
    if (dropdown === except) return;
    dropdown.querySelector(".dropdown-panel").hidden = true;
    dropdown.querySelector(".dropdown-trigger").setAttribute("aria-expanded", "false");
  });
}

function setupMenus() {
  document.querySelectorAll(".dropdown").forEach((dropdown) => {
    const trigger = dropdown.querySelector(".dropdown-trigger");
    const panel = dropdown.querySelector(".dropdown-panel");
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      closeDropdowns(dropdown);
      closeSearch();
      panel.hidden = !panel.hidden;
      trigger.setAttribute("aria-expanded", String(!panel.hidden));
    });
  });

  $("#categoryMenu").addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (button) selectCategory(button.dataset.category);
  });
  $("#navLinks").addEventListener("click", (event) => {
    if (event.target.closest(".dropdown-panel a, .dropdown-panel button")) closeDropdowns();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".dropdown")) closeDropdowns();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDropdowns();
      closeSearch();
    }
  });
}

/* ---------- 헤더 검색창 ---------- */
function openSearch() {
  closeDropdowns();
  $("#searchLayer").hidden = false;
  $("#searchOpen").setAttribute("aria-expanded", "true");
  renderSearch();
  $("#layerQuery").focus();
}

function closeSearch() {
  $("#searchLayer").hidden = true;
  $("#searchOpen").setAttribute("aria-expanded", "false");
}

function searchMatches(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  if (searchMode === "bookmarks") {
    return bookmarks
      .filter((bookmark) => `${bookmark.title} ${bookmark.description}`.toLowerCase().includes(q))
      .map((bookmark) => ({ icon: bookmark.icon, title: bookmark.title, sub: bookmark.description, url: bookmark.url }));
  }
  return allPrograms()
    .filter((program) => programText(program).includes(q))
    .map((program) => ({ icon: program.icon || "✦", title: program.title, sub: program.description || "", url: program.url }));
}

function renderSearch() {
  document.querySelectorAll(".search-tab").forEach((tab) => {
    const active = tab.dataset.mode === searchMode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  const query = $("#layerQuery").value;
  $("#searchSuggest").innerHTML = query.trim()
    ? ""
    : `<span>추천 검색어</span>${searchSuggestions[searchMode]
        .map((word) => `<button type="button" data-suggest="${esc(word)}">${esc(word)}</button>`)
        .join("")}`;

  const results = searchMatches(query);
  $("#searchResults").innerHTML = query.trim()
    ? results.length
      ? results
          .slice(0, 8)
          .map((item) => {
            const url = safeUrl(item.url);
            return `<li><a href="${esc(url || "#")}" target="_blank" rel="noopener noreferrer"><span class="result-icon" aria-hidden="true">${esc(item.icon)}</span><span><strong>${esc(item.title)}</strong><small>${esc(item.sub)}</small></span><span class="result-go" aria-hidden="true">↗</span></a></li>`;
          })
          .join("") + (results.length > 8 ? `<li class="result-more">외 ${results.length - 8}개 · Enter 로 전체 보기</li>` : "")
      : `<li class="result-empty">검색 결과가 없습니다.</li>`
    : "";
}

function setupSearchLayer() {
  $("#searchOpen").addEventListener("click", (event) => {
    event.stopPropagation();
    $("#searchLayer").hidden ? openSearch() : closeSearch();
  });
  $("#searchClose").addEventListener("click", closeSearch);
  $("#layerQuery").addEventListener("input", renderSearch);
  document.querySelectorAll(".search-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      searchMode = tab.dataset.mode;
      renderSearch();
      $("#layerQuery").focus();
    });
  });
  $("#searchSuggest").addEventListener("click", (event) => {
    const button = event.target.closest("[data-suggest]");
    if (!button) return;
    $("#layerQuery").value = button.dataset.suggest;
    renderSearch();
  });
  $("#searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const query = $("#layerQuery").value.trim();
    closeSearch();
    if (searchMode === "bookmarks") {
      activeCategory = "all";
      $("#searchInput").value = query;
      renderChips();
      renderCards();
      $("#board").scrollIntoView({ behavior: "smooth" });
    } else {
      $("#programs").scrollIntoView({ behavior: "smooth" });
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-layer, #searchOpen")) closeSearch();
  });
}

/* ---------- 가로 캐러셀 ---------- */
function updateArrows(track) {
  const group = document.querySelector(`[data-carousel="${track.id}"]`);
  if (!group) return;
  const [prev, next] = group.querySelectorAll(".arrow");
  const expanded = track.classList.contains("expanded");
  prev.disabled = expanded || track.scrollLeft <= 2;
  next.disabled = expanded || track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
}

function setupCarousels() {
  document.querySelectorAll("[data-carousel]").forEach((group) => {
    const track = document.getElementById(group.dataset.carousel);
    group.addEventListener("click", (event) => {
      const arrow = event.target.closest(".arrow");
      if (!arrow) return;
      track.scrollBy({ left: Number(arrow.dataset.dir) * track.clientWidth * 0.9, behavior: "smooth" });
    });
    track.addEventListener("scroll", () => updateArrows(track), { passive: true });
    window.addEventListener("resize", () => updateArrows(track));
    updateArrows(track);
  });
}

/* ---------- 내 프로그램 ---------- */
function programCard(program) {
  const url = safeUrl(program.url);
  const features = program.features || [];
  const status = programStatuses.find((item) => item.id === program.status) ? program.status : "local";
  return `
    <article class="program-card tone-${esc(program.tone || "slate")}">
      <div class="program-cover">
        <span class="program-type">${esc(titleOf(programTypes, program.type))}</span>
        <span class="program-icon" aria-hidden="true">${esc(program.icon || "✦")}</span>
        <h3>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(program.title)}</a>` : esc(program.title)}</h3>
        <p class="program-meta">기능 ${features.length}개 · <span class="status-${status}">${titleOf(programStatuses, status)}</span></p>
      </div>
      <div class="program-body">
        <p class="program-desc">${esc(program.description || "")}</p>
        ${features.length ? `<p class="program-features">${features.slice(0, 3).map(esc).join(" · ")}${features.length > 3 ? ` 외 ${features.length - 3}개` : ""}</p>` : ""}
        <div class="program-foot">
          <span class="tag-row">${(program.tags || []).map((tag) => `#${esc(tag)}`).join(" ")}</span>
          ${
            program.custom
              ? `<span class="custom-tools"><button type="button" data-edit="${esc(program.id)}">수정</button><button type="button" data-delete="${esc(program.id)}">삭제</button></span>`
              : ""
          }
        </div>
      </div>
    </article>
  `;
}

function renderPrograms() {
  const list = allPrograms();
  $("#programCount").textContent = list.length;
  $("#programTrack").innerHTML =
    list.map(programCard).join("") +
    `<button class="program-add" type="button" data-register><span aria-hidden="true">＋</span>새 프로그램 등록<small>이름 · 주소 · 기능을 적으면 카드가 생겨요</small></button>`;
  updateArrows($("#programTrack"));
}

function refreshPrograms() {
  renderPrograms();
  renderMenus();
  if (!$("#searchLayer").hidden) renderSearch();
}

function setupPrograms() {
  $("#programTrack").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-edit]");
    const remove = event.target.closest("[data-delete]");
    if (edit) openDialog(edit.dataset.edit);
    if (remove) deleteProgram(remove.dataset.delete);
  });

  $("#programExpand").addEventListener("click", () => {
    const track = $("#programTrack");
    const expanded = track.classList.toggle("expanded");
    $("#programExpand").textContent = expanded ? "접기" : "전체보기";
    $("#programExpand").setAttribute("aria-pressed", String(expanded));
    updateArrows(track);
  });

  $("#exportPrograms").addEventListener("click", exportPrograms);
}

function deleteProgram(id) {
  const list = loadUserPrograms();
  const target = list.find((program) => program.id === id);
  if (!target || !confirm(`‘${target.title}’ 을(를) 목록에서 삭제할까요?`)) return;
  if (saveUserPrograms(list.filter((program) => program.id !== id))) {
    refreshPrograms();
    showToast("삭제했습니다.");
  }
}

async function exportPrograms() {
  const list = loadUserPrograms();
  if (!list.length) {
    showToast("화면에서 등록한 프로그램이 아직 없습니다.");
    return;
  }
  const json = JSON.stringify(list, null, 2);
  try {
    await navigator.clipboard.writeText(json);
    showToast(`${list.length}개를 복사했습니다. app.js 의 programs 에 붙여 넣으세요.`);
  } catch {
    prompt("아래 내용을 복사하세요", json);
  }
}

/* ---------- 수업 바로가기 ---------- */
function renderClasses() {
  const items = bookmarks.filter((bookmark) => bookmark.category === "class" || bookmark.category === "reference");
  $("#classTrack").innerHTML = items
    .map((item, index) => {
      const category = findCategory(item.category);
      return `
      <article class="class-card tone-${category.tone}">
        <a class="class-cover" href="${item.url}" target="_blank" rel="noopener noreferrer">
          <span class="class-label">${category.title}</span>
          <strong>${item.title}</strong>
          <span class="class-icon" aria-hidden="true">${item.icon}</span>
        </a>
        <div class="class-body">
          <p>${item.description}</p>
          ${item.secretValue ? `<button type="button" class="copy-button" data-secret="${index}">${item.secretLabel}</button>` : ""}
        </div>
      </article>`;
    })
    .join("");

  $("#classTrack").addEventListener("click", (event) => {
    const button = event.target.closest("[data-secret]");
    if (button) copyToClipboard(items[Number(button.dataset.secret)].secretValue, button);
  });
}

/* ---------- 등록 대화상자 ---------- */
function fillOptions(select, list) {
  select.innerHTML = list.map((item) => `<option value="${item.id}">${item.title}</option>`).join("");
}

function setupDialog() {
  fillOptions($("#typeSelect"), programTypes.filter((type) => type.id !== "all"));
  fillOptions($("#statusSelect"), programStatuses);
  fillOptions($("#toneSelect"), toneOptions);

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-register]")) {
      closeDropdowns();
      openDialog();
    }
  });

  const dialog = $("#programDialog");
  $("#dialogClose").addEventListener("click", () => dialog.close());
  $("#dialogCancel").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  $("#programForm").addEventListener("submit", (event) => {
    event.preventDefault();
    submitProgram();
  });
}

function openDialog(id = null) {
  const form = $("#programForm");
  const fields = form.elements;
  const program = id ? loadUserPrograms().find((item) => item.id === id) : null;
  editingId = program ? program.id : null;
  form.reset();
  $("#formError").textContent = "";
  $("#dialogTitle").textContent = program ? "프로그램 수정" : "프로그램 등록";
  $("#dialogSubmit").textContent = program ? "저장하기" : "등록하기";

  if (program) {
    fields.title.value = program.title || "";
    fields.url.value = program.url || "";
    fields.description.value = program.description || "";
    fields.type.value = program.type || "etc";
    fields.status.value = program.status || "local";
    fields.icon.value = program.icon || "";
    fields.tone.value = program.tone || "orange";
    fields.features.value = (program.features || []).join("\n");
    fields.tags.value = (program.tags || []).join(", ");
  }
  $("#programDialog").showModal();
  fields.title.focus();
}

function submitProgram() {
  const fields = $("#programForm").elements;
  const title = fields.title.value.trim();
  const url = safeUrl(fields.url.value);

  if (!title) {
    $("#formError").textContent = "이름을 입력하세요.";
    fields.title.focus();
    return;
  }
  if (!url) {
    $("#formError").textContent = "주소는 https:// 로 시작하거나 ../폴더/index.html 같은 경로로 입력하세요.";
    fields.url.focus();
    return;
  }

  const program = {
    id: editingId || `custom-${Date.now()}`,
    type: fields.type.value,
    status: fields.status.value,
    title,
    icon: fields.icon.value.trim() || "✦",
    tone: fields.tone.value,
    url,
    description: fields.description.value.trim(),
    features: fields.features.value.split("\n").map((line) => line.trim()).filter(Boolean),
    tags: fields.tags.value.split(",").map((tag) => tag.trim()).filter(Boolean),
  };

  const list = loadUserPrograms();
  const next = editingId ? list.map((item) => (item.id === editingId ? program : item)) : [...list, program];
  if (!saveUserPrograms(next)) return;

  $("#programDialog").close();
  refreshPrograms();
  showToast(editingId ? "수정했습니다." : `‘${title}’ 을(를) 등록했습니다.`);
  $("#programs").scrollIntoView({ behavior: "smooth" });
  if (!editingId) {
    const track = $("#programTrack");
    setTimeout(() => track.scrollTo({ left: track.scrollWidth, behavior: "smooth" }), 300);
  }
}

/* ---------- 전체 북마크 ---------- */
function selectCategory(id) {
  activeCategory = id;
  $("#searchInput").value = "";
  renderChips();
  renderCards();
  $("#board").scrollIntoView({ behavior: "smooth" });
}

function renderChips() {
  const chips = $("#chips");
  chips.innerHTML = "";
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(category.id === activeCategory));
    button.className = `tab ${category.id === activeCategory ? "active" : ""}`;
    button.textContent = category.title;
    button.addEventListener("click", () => {
      activeCategory = category.id;
      renderChips();
      renderCards();
    });
    chips.append(button);
  });
}

function getFilteredBookmarks() {
  const query = $("#searchInput").value.trim().toLowerCase();
  return bookmarks.filter((bookmark) => {
    const matchesCategory = activeCategory === "all" || bookmark.category === activeCategory;
    const searchable = `${bookmark.title} ${bookmark.description} ${bookmark.secretLabel || ""}`.toLowerCase();
    return matchesCategory && (!query || searchable.includes(query));
  });
}

function renderCards() {
  const active = findCategory(activeCategory);
  const items = getFilteredBookmarks();
  const grid = $("#bookmarkGrid");

  $("#activeTitle").textContent = active.title;
  $("#countBadge").textContent = items.length;
  grid.innerHTML = "";

  items.forEach((item) => {
    const category = findCategory(item.category);
    const card = document.createElement("article");
    card.className = "bookmark-card";
    card.innerHTML = `
      <span class="tone-icon tone-${category.tone}" aria-hidden="true">${item.icon}</span>
      <div class="bookmark-text">
        <h3><a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.title}</a></h3>
        <p>${item.description}</p>
        <span class="card-tag">${category.title}</span>
      </div>
    `;
    if (item.secretValue) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-button";
      button.textContent = item.secretLabel;
      button.addEventListener("click", () => copyToClipboard(item.secretValue, button));
      card.append(button);
    }
    grid.append(card);
  });

  $("#emptyState").classList.toggle("hidden", items.length > 0);
}

async function copyToClipboard(value, button) {
  try {
    await navigator.clipboard.writeText(value);
    const original = button.textContent;
    button.textContent = "복사 완료";
    setTimeout(() => {
      button.textContent = original;
    }, 1300);
  } catch {
    alert(`복사할 값: ${value}`);
  }
}

/* ---------- 기타 ---------- */
function setupFab() {
  const fab = $("#fab");
  const update = () => fab.classList.toggle("visible", window.scrollY > 400);
  window.addEventListener("scroll", update, { passive: true });
  fab.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  update();
}

function setupTheme() {
  let savedTheme = "light";
  try {
    savedTheme = localStorage.getItem("bookmarkTheme") || "light";
  } catch {}
  const apply = (theme) => {
    document.documentElement.dataset.theme = theme;
    $("#themeIcon").textContent = theme === "dark" ? "☀" : "☾";
  };
  apply(savedTheme);

  $("#themeToggle").addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    apply(nextTheme);
    try {
      localStorage.setItem("bookmarkTheme", nextTheme);
    } catch {}
  });
}

renderQuickMenu();
renderMenus();
setupMenus();
setupSearchLayer();
renderPrograms();
setupPrograms();
renderClasses();
setupCarousels();
setupDialog();
renderChips();
renderCards();
$("#searchInput").addEventListener("input", renderCards);
setupFab();
setupTheme();
