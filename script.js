/* =========================================================
   클래스 허브 - script.js

   콘텐츠는 아래 CATEGORIES 데이터만 수정하면 됩니다.
   - 상위 메뉴  = CATEGORIES 항목
   - 하위 메뉴  = 각 항목의 sections
   - 링크 카드  = 각 section 의 links
     · url 이 없으면(null) 클릭 불가 카드로 표시됩니다.
     · desc 는 선택 항목입니다(없으면 제목 + "바로가기"만 표시).
   ========================================================= */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     콘텐츠 데이터
     ------------------------------------------------------------------ */
  var CATEGORIES = [
    {
      id: "ict",
      label: "ICT 수업 관련",
      title: "수업을 여는 도구와 자료",
      desc: "수업에 바로 활용할 수 있는 학습 자료와 실습 도구를 한곳에 모았습니다.",
      sections: [
        {
          id: "ict-materials",
          label: "수업 관련 자료",
          links: [
            {
              title: "학생작품 갤러리",
              url: "https://class-project-gallery-2606.vercel.app/",
              desc: "학생들이 만든 프로젝트와 결과물을 모아 보여주는 갤러리",
            },
            {
              title: "수업용 교안",
              url: "https://note26.colabstart.workers.dev/",
              desc: "수업 진행 순서와 설명을 정리해 둔 교안 노트",
            },
          ],
        },
        {
          id: "ict-tools",
          label: "수업 도구",
          links: [
            {
              title: "URL 줄이기",
              url: "https://biz-link.click/",
              desc: "긴 주소를 짧은 링크로 바꿔주는 단축 도구",
            },
            {
              title: "코드붐",
              url: "https://frontierall.github.io/CodeBom-2608/",
              desc: "수업 실습이나 활동에 쓰는 코딩 도구 (정확한 기능 설명은 추후 업데이트 예정)",
            },
          ],
        },
      ],
    },

    {
      id: "ai",
      label: "생성형 AI 서비스",
      title: "생성형 AI 서비스 모음",
      desc: "채팅부터 이미지·영상 생성까지, 자주 쓰는 생성형 AI 서비스를 정리했습니다.",
      sections: [
        {
          id: "ai-chat",
          label: "채팅 서비스",
          links: [
            { title: "ChatGPT", url: "https://chatgpt.com" },
            { title: "Qwen", url: "https://chat.qwen.ai" },
            { title: "Claude", url: "https://claude.ai" },
            {
              title: "퍼블릭시트",
              url: null,
              desc: "정확한 서비스가 아직 확인되지 않았습니다. (링크 준비 중)",
            },
          ],
        },
        {
          id: "ai-media",
          label: "이미지 · 영상 서비스",
          links: [
            { title: "Grok", url: "https://grok.com" },
            { title: "Flow", url: "https://labs.google/fx/tools/flow" },
            { title: "ChatGPT 이미지", url: "https://chatgpt.com" },
            { title: "Gemini", url: "https://gemini.google.com" },
          ],
        },
      ],
    },

    {
      id: "info",
      label: "정보사이트",
      title: "정보와 트렌드 살펴보기",
      desc: "뉴스와 트렌드, 미디어·엔터 정보를 살펴볼 수 있는 사이트 모음입니다.",
      sections: [
        {
          id: "info-news",
          label: "뉴스 & 트렌드",
          links: [
            { title: "AI 뉴스", url: "https://ai-new.up.railway.app/" },
            { title: "경제", url: "https://biz-news-2607.up.railway.app/" },
          ],
        },
        {
          id: "info-media",
          label: "미디어 & 엔터",
          links: [
            {
              title: "YT Insight Hub",
              url: "https://yt-insight-100m-2608.vercel.app/",
              desc: "유튜브 트렌드와 채널 인사이트 대시보드",
            },
            {
              title: "게임 허브",
              url: "https://ldjwj.github.io/GameMarket/index.html",
              desc: "쉬는 시간이나 보상 활동에 쓰는 게임 모음",
            },
          ],
        },
      ],
    },
  ];

  /* ------------------------------------------------------------------
     요소 참조
     ------------------------------------------------------------------ */
  var els = {
    topnav: document.getElementById("topnav"),
    subnav: document.getElementById("subnav"),
    subCat: document.getElementById("subCat"),
    sections: document.getElementById("sections"),
    heroEyebrow: document.getElementById("heroEyebrow"),
    heroTitle: document.getElementById("heroTitle"),
    heroDesc: document.getElementById("heroDesc"),
    themeToggle: document.getElementById("themeToggle"),
  };

  var activeId = null;
  var spy = null;

  /* ------------------------------------------------------------------
     라이트 / 다크 모드
     - 저장된 값이 있으면 그 값을 <html data-theme> 로 고정
     - 없으면 시스템 설정(prefers-color-scheme)에 맡김
     ------------------------------------------------------------------ */
  var THEME_KEY = "classhub-theme";
  var mql = window.matchMedia("(prefers-color-scheme: dark)");

  function storedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  function effectiveTheme() {
    return storedTheme() || (mql.matches ? "dark" : "light");
  }

  function renderToggle() {
    var dark = effectiveTheme() === "dark";
    els.themeToggle.textContent = dark ? "🌙" : "☀️";
    els.themeToggle.setAttribute(
      "aria-label",
      dark ? "밝은 모드로 전환" : "어두운 모드로 전환"
    );
  }

  function applyStoredTheme() {
    var t = storedTheme();
    if (t) {
      document.documentElement.setAttribute("data-theme", t);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    renderToggle();
  }

  els.themeToggle.addEventListener("click", function () {
    var next = effectiveTheme() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {
      /* 저장 불가 환경은 무시 */
    }
    applyStoredTheme();
  });

  // 저장된 수동 설정이 없을 때만 시스템 변경을 따라감
  mql.addEventListener("change", function () {
    if (!storedTheme()) renderToggle();
  });

  applyStoredTheme();

  /* ------------------------------------------------------------------
     헬퍼
     ------------------------------------------------------------------ */
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function findCategory(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return CATEGORIES[0];
  }

  /* ------------------------------------------------------------------
     렌더링
     ------------------------------------------------------------------ */
  function renderTopnav() {
    els.topnav.innerHTML = "";
    CATEGORIES.forEach(function (cat) {
      var li = el("li");
      var btn = el("button", "topnav__btn", cat.label);
      btn.type = "button";
      btn.dataset.id = cat.id;
      btn.addEventListener("click", function () {
        selectCategory(cat.id, true);
      });
      li.appendChild(btn);
      els.topnav.appendChild(li);
    });
  }

  function renderSubnav(cat) {
    els.subCat.textContent = cat.label;
    els.subnav.innerHTML = "";
    cat.sections.forEach(function (sec) {
      var li = el("li");
      var btn = el("button", "subbar__btn", sec.label);
      btn.type = "button";
      btn.dataset.target = sec.id;
      btn.addEventListener("click", function () {
        var target = document.getElementById(sec.id);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveSub(sec.id);
      });
      li.appendChild(btn);
      els.subnav.appendChild(li);
    });
  }

  function renderCard(link) {
    var disabled = !link.url;
    var node = el("a", "card");

    if (disabled) {
      node = el("div", "card card--disabled");
      node.setAttribute("aria-disabled", "true");
    } else {
      node.href = link.url;
      node.target = "_blank";
      node.rel = "noopener noreferrer";
    }

    node.appendChild(el("span", "card__title", link.title));
    if (link.desc) node.appendChild(el("span", "card__desc", link.desc));
    node.appendChild(el("span", "card__cta", disabled ? "링크 준비 중" : "바로가기"));
    return node;
  }

  function renderSections(cat) {
    els.sections.innerHTML = "";
    cat.sections.forEach(function (sec, i) {
      // Hero 타일이 light 이므로 첫 섹션은 parchment 로 시작해 면 전환(구분선) 효과
      var surface = i % 2 === 0 ? "tile--parchment" : "tile--light";
      var section = el("section", "tile section " + surface);
      section.id = sec.id;

      var wrap = el("div", "wrap");

      var head = el("div", "section__head");
      head.appendChild(el("h2", "section__title", sec.label));
      wrap.appendChild(head);

      var grid = el("div", "card-grid");
      sec.links.forEach(function (link) {
        grid.appendChild(renderCard(link));
      });
      wrap.appendChild(grid);

      section.appendChild(wrap);
      els.sections.appendChild(section);
    });
  }

  function renderHero(cat) {
    els.heroEyebrow.textContent = cat.label;
    els.heroTitle.textContent = cat.title;
    els.heroDesc.textContent = cat.desc;
  }

  /* ------------------------------------------------------------------
     스크롤 위치에 따라 하위 메뉴 활성 표시 (스크롤 스파이)
     ------------------------------------------------------------------ */
  function setActiveSub(id) {
    var buttons = els.subnav.querySelectorAll(".subbar__btn");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute(
        "aria-current",
        buttons[i].dataset.target === id ? "true" : "false"
      );
    }
  }

  function setupSpy(cat) {
    if (spy) spy.disconnect();

    spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActiveSub(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );

    cat.sections.forEach(function (sec) {
      var node = document.getElementById(sec.id);
      if (node) spy.observe(node);
    });

    setActiveSub(cat.sections[0].id);
  }

  /* ------------------------------------------------------------------
     상위 메뉴 선택
     ------------------------------------------------------------------ */
  function selectCategory(id, fromClick) {
    var cat = findCategory(id);

    // 이미 선택된 카테고리를 다시 클릭하면 맨 위로
    if (cat.id === activeId) {
      if (fromClick) window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    activeId = cat.id;
    document.body.dataset.category = cat.id;

    var buttons = els.topnav.querySelectorAll(".topnav__btn");
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].dataset.id === cat.id) {
        buttons[i].setAttribute("aria-current", "page");
      } else {
        buttons[i].removeAttribute("aria-current");
      }
    }

    renderHero(cat);
    renderSubnav(cat);
    renderSections(cat);
    setupSpy(cat);

    if (fromClick) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", "#" + cat.id);
      } else {
        window.location.hash = cat.id;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  /* ------------------------------------------------------------------
     초기화
     ------------------------------------------------------------------ */
  renderTopnav();

  var initialId = (window.location.hash || "").replace("#", "");
  selectCategory(findCategory(initialId).id, false);

  window.addEventListener("hashchange", function () {
    var id = (window.location.hash || "").replace("#", "");
    selectCategory(findCategory(id).id, false);
  });
})();
