const categories = [
  { id: "all", title: "전체 북마크", meta: "All Links", icon: "⭐" },
  { id: "class", title: "수업 관련", meta: "Class", icon: "🎓" },
  { id: "reference", title: "참고 자료", meta: "Reference", icon: "📚" },
  { id: "chat-ai", title: "채팅형 AI", meta: "Chat AI", icon: "💬" },
  { id: "editor-ai", title: "에디터 내장형", meta: "Editor AI", icon: "⌨️" },
  { id: "terminal", title: "터미널 도구", meta: "Terminal", icon: "▣" },
  { id: "web-env", title: "웹 기반 환경", meta: "Web IDE", icon: "🌐" },
  { id: "builder", title: "UI · 앱 빌더", meta: "Builder", icon: "🧱" },
  { id: "backend", title: "백엔드", meta: "Backend", icon: "🗄️" },
  { id: "automation", title: "AI 에이전트 · 자동화", meta: "Automation", icon: "🔁" },
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

let activeCategory = "all";

const $ = (selector) => document.querySelector(selector);

function renderNav() {
  const nav = $("#sideNav");
  nav.innerHTML = "";

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `nav-button ${category.id === activeCategory ? "active" : ""}`;
    button.innerHTML = `<span class="nav-icon">${category.icon}</span><span>${category.title}</span>`;
    button.addEventListener("click", () => {
      activeCategory = category.id;
      $("#searchInput").value = "";
      renderNav();
      renderCards();
    });
    nav.append(button);
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
  const active = categories.find((category) => category.id === activeCategory);
  const items = getFilteredBookmarks();
  const grid = $("#bookmarkGrid");

  $("#activeTitle").textContent = active.title;
  $("#activeMeta").textContent = active.meta;
  $("#countBadge").textContent = `${items.length}개`;
  grid.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "bookmark-card";
    card.innerHTML = `
      <span class="card-icon">${item.icon}</span>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <div class="card-actions">
        <a href="${item.url}" target="_blank" rel="noopener noreferrer">바로가기</a>
      </div>
    `;
    if (item.secretValue) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item.secretLabel;
      button.addEventListener("click", () => copyToClipboard(item.secretValue, button));
      card.querySelector(".card-actions").append(button);
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

function setupSearch() {
  $("#searchInput").addEventListener("input", renderCards);
}

function setupTheme() {
  const savedTheme = localStorage.getItem("bookmarkTheme") || "light";
  document.documentElement.dataset.theme = savedTheme;
  $("#themeIcon").textContent = savedTheme === "dark" ? "☀" : "☾";

  $("#themeToggle").addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("bookmarkTheme", nextTheme);
    $("#themeIcon").textContent = nextTheme === "dark" ? "☀" : "☾";
  });
}

renderNav();
renderCards();
setupSearch();
setupTheme();
