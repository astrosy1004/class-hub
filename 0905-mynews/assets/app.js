const categories = [
  { id: "all", title: "전체 뉴스", meta: "All News", icon: "📰" },
  { id: "general", title: "종합 일간지", meta: "General", icon: "🗞️" },
  { id: "broadcast", title: "방송 · 통신", meta: "Broadcast", icon: "📺" },
  { id: "economy", title: "경제 · 금융", meta: "Economy", icon: "📈" },
  { id: "tech", title: "IT · 테크", meta: "Tech", icon: "💻" },
  { id: "ai", title: "AI 소식", meta: "AI", icon: "🤖" },
  { id: "world", title: "해외 뉴스", meta: "World", icon: "🌏" },
  { id: "science", title: "과학 · 환경", meta: "Science", icon: "🔬" },
];

const newsSites = [
  { category: "general", title: "네이버 뉴스", url: "https://news.naver.com", icon: "🟢", description: "주요 언론사 기사를 한곳에 모아 보는 포털 뉴스" },
  { category: "general", title: "다음 뉴스", url: "https://news.daum.net", icon: "🔵", description: "카카오 포털의 실시간 종합 뉴스" },
  { category: "general", title: "조선일보", url: "https://www.chosun.com", icon: "📄", description: "종합 일간지 온라인판" },
  { category: "general", title: "한겨레", url: "https://www.hani.co.kr", icon: "📃", description: "종합 일간지 온라인판" },
  { category: "general", title: "중앙일보", url: "https://www.joongang.co.kr", icon: "📑", description: "종합 일간지 온라인판" },
  { category: "broadcast", title: "연합뉴스", url: "https://www.yna.co.kr", icon: "📡", description: "국내 대표 뉴스 통신사 속보" },
  { category: "broadcast", title: "KBS 뉴스", url: "https://news.kbs.co.kr", icon: "📺", description: "공영방송 뉴스와 영상 리포트" },
  { category: "broadcast", title: "SBS 뉴스", url: "https://news.sbs.co.kr", icon: "🎥", description: "지상파 방송 뉴스" },
  { category: "broadcast", title: "MBC 뉴스", url: "https://imnews.imbc.com", icon: "🎬", description: "지상파 방송 뉴스" },
  { category: "broadcast", title: "YTN", url: "https://www.ytn.co.kr", icon: "⏱️", description: "24시간 속보 채널" },
  { category: "economy", title: "매일경제", url: "https://www.mk.co.kr", icon: "💹", description: "경제 · 산업 종합 매체" },
  { category: "economy", title: "한국경제", url: "https://www.hankyung.com", icon: "🏦", description: "경제 · 증시 뉴스" },
  { category: "economy", title: "머니투데이", url: "https://news.mt.co.kr", icon: "💰", description: "금융과 기업 소식" },
  { category: "economy", title: "Bloomberg", url: "https://www.bloomberg.com", icon: "📊", description: "글로벌 금융 · 시장 뉴스" },
  { category: "economy", title: "Investing.com", url: "https://kr.investing.com", icon: "📉", description: "실시간 시세와 시장 지표" },
  { category: "tech", title: "전자신문", url: "https://www.etnews.com", icon: "🔌", description: "국내 IT · 전자 산업 전문지" },
  { category: "tech", title: "ZDNet Korea", url: "https://zdnet.co.kr", icon: "🖥️", description: "IT 기술과 기업 소식" },
  { category: "tech", title: "The Verge", url: "https://www.theverge.com", icon: "🔺", description: "글로벌 테크 · 제품 리뷰" },
  { category: "tech", title: "TechCrunch", url: "https://techcrunch.com", icon: "🚀", description: "스타트업과 투자 소식" },
  { category: "tech", title: "Hacker News", url: "https://news.ycombinator.com", icon: "🟠", description: "개발자 커뮤니티 인기 링크" },
  { category: "tech", title: "GeekNews", url: "https://news.hada.io", icon: "🧑‍💻", description: "국내 개발자 뉴스 큐레이션" },
  { category: "ai", title: "Anthropic 뉴스", url: "https://www.anthropic.com/news", icon: "🤖", description: "Claude 모델과 연구 발표" },
  { category: "ai", title: "OpenAI 블로그", url: "https://openai.com/news", icon: "✨", description: "OpenAI 제품과 연구 소식" },
  { category: "ai", title: "Google AI 블로그", url: "https://blog.google/technology/ai/", icon: "🔷", description: "Google의 AI 연구와 제품 발표" },
  { category: "ai", title: "Hugging Face", url: "https://huggingface.co/blog", icon: "🤗", description: "오픈소스 모델과 커뮤니티 소식" },
  { category: "ai", title: "AI타임스", url: "https://www.aitimes.com", icon: "🧠", description: "국내 AI 산업 전문 매체" },
  { category: "world", title: "BBC News", url: "https://www.bbc.com/news", icon: "🇬🇧", description: "영국 공영방송 국제 뉴스" },
  { category: "world", title: "Reuters", url: "https://www.reuters.com", icon: "🌐", description: "국제 뉴스 통신사" },
  { category: "world", title: "AP News", url: "https://apnews.com", icon: "🗺️", description: "미국 뉴스 통신사 속보" },
  { category: "world", title: "The Guardian", url: "https://www.theguardian.com/international", icon: "🧭", description: "국제 이슈와 심층 보도" },
  { category: "world", title: "NHK World", url: "https://www3.nhk.or.jp/nhkworld/", icon: "🇯🇵", description: "일본 공영방송 국제 뉴스" },
  { category: "science", title: "Nature News", url: "https://www.nature.com/news", icon: "🧪", description: "과학 저널의 연구 뉴스" },
  { category: "science", title: "Science News", url: "https://www.sciencenews.org", icon: "🔬", description: "과학 전반의 최신 소식" },
  { category: "science", title: "동아사이언스", url: "https://www.dongascience.com", icon: "🧬", description: "국내 과학 전문 매체" },
  { category: "science", title: "기상청 날씨누리", url: "https://www.weather.go.kr", icon: "🌤️", description: "날씨 예보와 기상 특보" },
  { category: "science", title: "에어코리아", url: "https://www.airkorea.or.kr", icon: "🌫️", description: "실시간 대기질과 미세먼지" },
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

function getFilteredSites() {
  const query = $("#searchInput").value.trim().toLowerCase();
  return newsSites.filter((site) => {
    const matchesCategory = activeCategory === "all" || site.category === activeCategory;
    const searchable = `${site.title} ${site.description}`.toLowerCase();
    return matchesCategory && (!query || searchable.includes(query));
  });
}

function renderCards() {
  const active = categories.find((category) => category.id === activeCategory);
  const items = getFilteredSites();
  const grid = $("#newsGrid");

  $("#activeTitle").textContent = active.title;
  $("#activeMeta").textContent = active.meta;
  $("#countBadge").textContent = `${items.length}곳`;
  grid.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "news-card";
    card.innerHTML = `
      <span class="card-icon">${item.icon}</span>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <div class="card-actions">
        <a href="${item.url}" target="_blank" rel="noopener noreferrer">바로가기</a>
      </div>
    `;
    grid.append(card);
  });

  $("#emptyState").classList.toggle("hidden", items.length > 0);
}

function setupSearch() {
  $("#searchInput").addEventListener("input", renderCards);
}

function setupTheme() {
  const savedTheme = localStorage.getItem("mynewsTheme") || "light";
  document.documentElement.dataset.theme = savedTheme;
  $("#themeIcon").textContent = savedTheme === "dark" ? "☀" : "☾";

  $("#themeToggle").addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("mynewsTheme", nextTheme);
    $("#themeIcon").textContent = nextTheme === "dark" ? "☀" : "☾";
  });
}

function renderToday() {
  const today = new Date();
  $("#todayLabel").textContent = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

renderNav();
renderCards();
renderToday();
setupSearch();
setupTheme();
