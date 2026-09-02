// 공개 배포 시 비밀번호/수강코드/초대링크 노출 주의: 민감 정보는 이곳에서 쉽게 수정하거나 제거하세요.
const navItems = [
  { label: "수업 안내", href: "#classroom" },
  { label: "AI 도구", href: "#ai-tools" },
  { label: "학습 자료", href: "#learning" },
  { label: "과제/프로젝트", href: "#projects" },
  { label: "체크리스트", href: "#checklist" },
];

const quickLinks = [
  {
    title: "Zoom 입장",
    description: "실시간 온라인 수업 접속 링크",
    icon: "💻",
    url: "https://goor.me/product02_zoom",
    secretLabel: "PW",
    secretValue: "260826",
    important: true,
  },
  {
    title: "Goorm LMS",
    description: "출석, 평가, 복습용 LMS",
    icon: "🏫",
    url: "https://seoul-ict.goorm.io/",
    secretLabel: "수강코드",
    secretValue: "x353Zi",
    important: true,
  },
  {
    title: "Discord",
    description: "수업 공지와 커뮤니케이션 채널",
    icon: "📱",
    url: "https://discord.gg/gZn75a37bY",
    note: "별명은 실명으로 설정",
    important: true,
  },
];

const toolSections = [
  {
    title: "채팅형 AI",
    tools: [
      { title: "Claude", url: "https://claude.ai", icon: "🤖", description: "긴 문서와 코딩 협업에 강한 AI" },
      { title: "ChatGPT", url: "https://chat.openai.com", icon: "💬", description: "아이디어, 문서, 코딩 보조" },
      { title: "Google Gemini", url: "https://gemini.google.com", icon: "✨", description: "Google 생태계와 연결되는 AI" },
      { title: "Perplexity", url: "https://perplexity.ai", icon: "🔎", description: "최신 정보 검색과 출처 확인" },
    ],
  },
  {
    title: "에디터 내장형",
    tools: [
      { title: "GitHub Copilot", url: "https://github.com/features/copilot", icon: "⌨️", description: "개발 환경 안의 코딩 보조" },
      { title: "Cursor", url: "https://cursor.sh", icon: "🧭", description: "AI 코드 에디터" },
      { title: "Devin Desktop", url: "https://cognition.ai", icon: "🖥️", description: "AI 소프트웨어 에이전트" },
      { title: "Cline", url: "https://github.com/cline/cline", icon: "🧩", description: "VS Code 기반 AI 코딩 도구" },
      { title: "Google Antigravity", url: "https://antigravity.google", icon: "🚀", description: "Google AI 개발 환경" },
    ],
  },
  {
    title: "터미널 도구",
    tools: [
      { title: "Claude Code", url: "https://docs.claude.com/claude-code", icon: "▣", description: "터미널 기반 AI 코딩 도구" },
      { title: "OpenAI Codex CLI", url: "https://github.com/openai/codex", icon: "▤", description: "터미널 기반 코딩 에이전트" },
      { title: "Antigravity CLI", url: "https://antigravity.google", icon: "▲", description: "CLI 기반 개발 도구" },
      { title: "OpenCode", url: "https://opencode.ai", icon: "◆", description: "오픈소스 AI 코딩 도구" },
      { title: "Aider", url: "https://aider.chat", icon: "◇", description: "Git 친화적 AI 코딩 도구" },
      { title: "Kimi Code CLI", url: "https://www.kimi.com/code", icon: "◈", description: "CLI 기반 코드 지원" },
    ],
  },
  {
    title: "웹 기반 환경",
    tools: [
      { title: "Google Colab", url: "https://colab.research.google.com", icon: "📓", description: "Python 실습 노트북" },
      { title: "OpenRouter", url: "https://openrouter.ai", icon: "🔌", description: "여러 AI 모델 API 연결" },
      { title: "GitHub", url: "https://github.com", icon: "🗂️", description: "코드 저장소와 협업" },
      { title: "Streamlit", url: "https://streamlit.io", icon: "📊", description: "빠른 데이터 앱 제작" },
      { title: "Replit", url: "https://replit.com", icon: "🌐", description: "브라우저 기반 개발 환경" },
      { title: "CodePen", url: "https://codepen.io", icon: "🎨", description: "프론트엔드 실험 환경" },
      { title: "StackBlitz", url: "https://stackblitz.com", icon: "⚡", description: "웹 앱 온라인 개발 환경" },
      { title: "GitHub Codespaces", url: "https://github.com/features/codespaces", icon: "☁️", description: "클라우드 개발 환경" },
    ],
  },
  {
    title: "UI · 앱 빌더",
    tools: [
      { title: "v0", url: "https://v0.app", icon: "🧱", description: "프롬프트 기반 UI 생성" },
      { title: "Lovable", url: "https://lovable.dev", icon: "💗", description: "웹 앱 제작 AI 빌더" },
      { title: "Bolt.new", url: "https://bolt.new", icon: "⚙️", description: "브라우저 기반 앱 빌더" },
      { title: "Base44", url: "https://base44.com", icon: "🧰", description: "AI 앱 제작 플랫폼" },
      { title: "Uizard", url: "https://uizard.io", icon: "🪄", description: "디자인과 와이어프레임 제작" },
    ],
  },
  {
    title: "백엔드",
    tools: [
      { title: "Supabase", url: "https://supabase.com", icon: "🟩", description: "오픈소스 백엔드 플랫폼" },
      { title: "Firebase", url: "https://firebase.google.com", icon: "🔥", description: "Google 앱 백엔드" },
      { title: "Xano", url: "https://xano.com", icon: "🔧", description: "노코드 백엔드 빌더" },
    ],
  },
  {
    title: "AI 에이전트 · 자동화",
    tools: [
      { title: "OpenClaw", url: "https://github.com/OpenClaw", icon: "🤖", description: "자율 실행 AI 에이전트" },
      { title: "n8n", url: "https://n8n.io", icon: "🔁", description: "오픈소스 워크플로우 자동화" },
      { title: "Make", url: "https://www.make.com", icon: "🧵", description: "노코드 업무 자동화" },
      { title: "Zapier AI", url: "https://zapier.com", icon: "⚡", description: "업무 자동화 연결 플랫폼" },
    ],
  },
];

const learningCards = [
  { title: "강의 자료", description: "수업 슬라이드와 문서 링크를 추가하세요.", icon: "📚" },
  { title: "실습 파일", description: "Colab, GitHub, 예제 파일을 모아두세요.", icon: "🧪" },
  { title: "복습 링크", description: "녹화나 보충 자료 링크를 추가하세요.", icon: "▶️" },
  { title: "참고 자료", description: "수업 이해를 돕는 외부 자료를 정리하세요.", icon: "🔖" },
  { title: "추천 아티클", description: "최신 AI 프로덕트 사례를 모아두세요.", icon: "📰" },
];

const projectCards = [
  { title: "과제 제출", description: "제출 폼 또는 LMS 과제 링크를 추가하세요.", icon: "✅" },
  { title: "프로젝트 가이드", description: "팀 프로젝트 진행 기준을 정리하세요.", icon: "🧭" },
  { title: "팀별 작업 공간", description: "팀 Notion, GitHub, 문서 링크를 연결하세요.", icon: "👥" },
  { title: "발표 자료", description: "최종 발표 템플릿과 산출물을 모아두세요.", icon: "🎤" },
];

const checklistItems = [
  "LMS 등록 완료",
  "Discord 입장 완료",
  "Discord 별명 실명으로 변경",
  "Zoom 접속 테스트",
  "GitHub 계정 준비",
  "Google 계정 준비",
];

const $ = (selector) => document.querySelector(selector);

function createCard(item, options = {}) {
  const card = document.createElement("article");
  card.className = `link-card searchable ${item.important ? "important" : ""}`;
  card.dataset.search = `${item.title} ${item.description || ""} ${item.note || ""}`.toLowerCase();

  card.innerHTML = `
    <span class="card-icon">${item.icon || "🔗"}</span>
    <h3>${item.title}</h3>
    <p>${item.description || item.note || "추후 링크를 추가하세요."}</p>
    <div class="card-actions"></div>
  `;

  const actions = card.querySelector(".card-actions");
  if (item.url) {
    const link = document.createElement("a");
    link.className = options.primary ? "primary" : "";
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "바로가기";
    actions.append(link);
  }

  if (item.secretValue) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${item.secretLabel} 복사`;
    button.addEventListener("click", () => copyToClipboard(item.secretValue, button));
    actions.append(button);
  }

  return card;
}

function createResourceCard(item) {
  const card = document.createElement("article");
  card.className = "resource-card searchable";
  card.dataset.search = `${item.title} ${item.description}`.toLowerCase();
  card.innerHTML = `
    <span class="card-icon">${item.icon}</span>
    <h3>${item.title}</h3>
    <p>${item.description}</p>
  `;
  return card;
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

function render() {
  const nav = $("#navLinks");
  navItems.forEach((item) => {
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.label;
    nav.append(link);
  });

  quickLinks.forEach((item) => $("#quickLinks").append(createCard(item, { primary: true })));

  toolSections.forEach((section) => {
    const wrapper = document.createElement("div");
    wrapper.className = "tool-group";
    wrapper.innerHTML = `<h3>${section.title}</h3><div class="tool-grid"></div>`;
    section.tools.forEach((tool) => wrapper.querySelector(".tool-grid").append(createCard(tool)));
    $("#toolSections").append(wrapper);
  });

  learningCards.forEach((item) => $("#learningCards").append(createResourceCard(item)));
  projectCards.forEach((item) => $("#projectCards").append(createResourceCard(item)));

  checklistItems.forEach((label, index) => {
    const item = document.createElement("label");
    item.className = "check-item";
    item.innerHTML = `<input type="checkbox" data-check="${index}" /><span>${label}</span>`;
    $("#checklistItems").append(item);
  });
}

function setupSearch() {
  const input = $("#searchInput");
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    const cards = document.querySelectorAll(".searchable");
    cards.forEach((card) => {
      card.classList.toggle("hidden", query && !card.dataset.search.includes(query));
    });
  });
}

function setupTheme() {
  const savedTheme = localStorage.getItem("classHubTheme") || "light";
  document.documentElement.dataset.theme = savedTheme;
  $("#themeIcon").textContent = savedTheme === "dark" ? "☀" : "☾";

  $("#themeToggle").addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("classHubTheme", nextTheme);
    $("#themeIcon").textContent = nextTheme === "dark" ? "☀" : "☾";
  });
}

function setupChecklist() {
  const saved = JSON.parse(localStorage.getItem("classHubChecklist") || "{}");
  document.querySelectorAll("[data-check]").forEach((checkbox) => {
    checkbox.checked = Boolean(saved[checkbox.dataset.check]);
    checkbox.addEventListener("change", () => {
      saved[checkbox.dataset.check] = checkbox.checked;
      localStorage.setItem("classHubChecklist", JSON.stringify(saved));
    });
  });
}

render();
setupSearch();
setupTheme();
setupChecklist();
