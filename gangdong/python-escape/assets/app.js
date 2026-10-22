/* =========================================================
   파이썬 방탈출 — 메타버스(ZEP 스타일) 수업 복습 게임 + 시상식
   ▸ 캐릭터가 맵을 걸어 다니다가 ❗ 물건에 다가가면 문제가 나와요.
   ▸ 방·문제·맵·상 이름 등 "내용"은 아래 1~5번 데이터만 고치면 됩니다.
   ========================================================= */

// ── 1. 게임 기본 정보 ──
const GAME = {
  title: "파이썬 방탈출",
  subtitle: "바이브 코딩 탐험대의 마지막 미션",
  intro: "네온 불빛이 반짝이는 파이썬 시티에 갇혀 버렸어요! 캐릭터를 움직여 방을 돌아다니며 ❗ 표시가 있는 물건을 찾아 문제를 풀고 🔑 열쇠를 모으세요. 열쇠 5개가 모이면 SDGs 금고 문이 열려요!",
  className: "파이썬 바이브 코딩 교실", // 선생님 화면의 '수업 이름' 기본값
};

// 고를 수 있는 캐릭터
const AVATARS = ["🧒", "👧", "👦", "🧑‍🚀", "🦊", "🐱", "🐶", "🐼", "🐸", "🤖"];

// ── 2. 점수 규칙 ──
const SCORE = {
  solve: 100,           // 문제를 맞히면
  wrong: -5,            // 틀릴 때마다
  hint: -10,            // 힌트를 볼 때마다
  clearBonus: 300,      // 탈출 성공 보너스
  timeBonusMax: 300,    // 시간 보너스 최대 (빨리 탈출할수록 큼)
  timeBonusMinutes: 30, // 이 시간(분)이 지나면 시간 보너스 0
  revealAfter: 2,       // 몇 번 틀리면 '정답 보기' 버튼이 생기는지
};

// ── 3. 방과 문제 ──
// type: "choice"(객관식, answer = 정답 번호 0부터) / "input"(직접 입력, answers 중 하나면 정답)
//       "order"(순서 맞추기, lines 를 정답 순서대로 적기)
// obj = 맵에 놓일 물건 그림, x·y = 맵 위치(아래 WORLD_MAP 칸 번호), code 는 한 줄씩 배열로
// zone = WORLD_MAP 에서 이 방 바닥을 나타내는 글자, key = 방을 탈출하면 주는 열쇠 숫자
const ROOMS = [
  {
    id: "syntax", zone: "1", icon: "📜", name: "주문서의 방", topic: "기초 문법", sdg: "SDG 4 · 양질의 교육",
    color: "var(--room1)", key: 3,
    story: "파이썬 마법사의 주문서가 가득해요. 주문(코드)을 바르게 읽어 보세요!",
    puzzles: [
      {
        obj: "📜", x: 3, y: 2, type: "choice", q: "화면에 글자를 보여 주는 파이썬 명령어는?",
        options: ["print", "input", "if"], optionsCode: true, answer: 0,
        hint: "'출력하다(인쇄하다)'라는 영어 단어예요. 프린터도 이 단어에서 왔어요!",
        explain: "print( )는 괄호 안의 내용을 화면에 보여 줘요.",
      },
      {
        obj: "📖", x: 7, y: 2, type: "choice", q: "안녕 을 화면에 바르게 출력하는 코드는?",
        options: ['print("안녕")', "print(안녕)", 'Print("안녕")'], optionsCode: true, answer: 0,
        hint: "글자는 따옴표 \" \" 로 감싸고, print 는 모두 소문자로 써요!",
        explain: "글자는 꼭 따옴표로 감싸요. 파이썬은 대문자 P 와 소문자 p 를 다르게 봐요.",
      },
      {
        obj: "🔮", x: 5, y: 4, type: "choice", q: "이 코드를 실행하면 무엇이 나올까요?",
        code: ["print(2 + 3)"],
        options: ["5", "2 + 3", "23"], answer: 0,
        hint: "따옴표가 없으면 컴퓨터가 계산해 줘요!",
        explain: "숫자를 따옴표 없이 쓰면 계산돼요. 2 + 3 = 5!",
      },
    ],
  },
  {
    id: "variable", zone: "2", icon: "💧", name: "물탱크 창고", topic: "변수", sdg: "SDG 6 · 깨끗한 물과 위생",
    color: "var(--room2)", key: 1,
    story: "깨끗한 물을 모아 두는 창고예요. 변수는 값을 담는 '이름표 붙은 상자'!",
    puzzles: [
      {
        obj: "📦", x: 13, y: 2, type: "choice", q: "변수는 무엇과 가장 비슷할까요?",
        options: ["🏷️ 이름표가 붙은 상자", "🧽 지우개", "⏰ 시계"], answer: 0,
        hint: "값을 '담아 두는' 거예요.",
        explain: "변수는 이름표 붙은 상자! water = 5 는 water 상자에 5를 넣는다는 뜻이에요.",
      },
      {
        obj: "💧", x: 17, y: 2, type: "choice", q: "이 코드를 실행하면 무엇이 나올까요?",
        code: ["water = 5", "print(water)"],
        options: ["5", "water", "0"], answer: 0,
        hint: "print 괄호 안에 따옴표가 없어요. 그러면 상자 안에 든 값을 보여 줘요!",
        explain: "따옴표 없는 water 는 변수예요. water 상자 안에 든 5가 출력돼요.",
      },
      {
        obj: "🍎", x: 15, y: 4, type: "input", q: "사과가 몇 개 출력될까요? (숫자만 쓰세요)",
        code: ["apple = 3", "apple = apple + 1", "print(apple)"],
        answers: ["4", "4개"],
        hint: "상자에 사과 3개가 있어요. 거기에 1개를 더 넣으면?",
        explain: "apple = apple + 1 은 '지금 값에 1을 더해서 다시 담기'예요. 3 + 1 = 4!",
      },
    ],
  },
  {
    id: "nonsense", zone: "3", icon: "🤪", name: "넌센스 퀴즈방", topic: "넌센스 퀴즈", sdg: "SDG 3 · 건강과 웰빙 (웃음은 건강에 좋아요!)",
    color: "var(--room3)", key: 2,
    story: "머리를 말랑말랑하게! 코딩 실력 말고 재치로 푸는 방이에요. 크게 웃으면 문이 열려요 😆",
    puzzles: [
      {
        obj: "🐍", x: 23, y: 2, type: "choice", q: "파이썬처럼 생긴 뱀이 불에 타면?",
        options: ["뱀파이어", "구운 뱀", "불뱀"], answer: 0,
        hint: "뱀 + 불(영어로 fire)!",
        explain: "뱀 + 파이어(fire, 불) = 뱀파이어! 🧛",
      },
      {
        obj: "🍑", x: 27, y: 2, type: "choice", q: "세상에서 가장 뜨거운 과일은?",
        options: ["수박", "천도복숭아", "귤"], answer: 1,
        hint: "온도를 나타내는 '도'가 이름에 들어 있어요. 아주 많이!",
        explain: "천(1000) 도나 되니까 천도복숭아! 🔥",
      },
      {
        obj: "🔢", x: 25, y: 4, type: "choice", q: "세상에서 가장 쉬운 숫자는?",
        options: ["1", "100", "190,000"], answer: 2,
        hint: "숫자를 소리 내어 읽어 보세요. '십구만' → ?",
        explain: "190,000 = 십구만 → \"쉽구만!\" 😆",
      },
    ],
  },
  {
    id: "condition", zone: "4", icon: "♻️", name: "분리수거 로봇실", topic: "조건문", sdg: "SDG 12 · 책임감 있는 소비와 생산",
    color: "var(--room4)", key: 2,
    story: "분리수거 로봇이 고장 났어요! 조건문으로 로봇에게 판단하는 법을 가르쳐 주세요.",
    puzzles: [
      {
        obj: "🤖", x: 3, y: 15, type: "choice", q: "'만약 ~라면'을 파이썬으로 쓸 때 쓰는 말은?",
        options: ["if", "for", "print"], optionsCode: true, answer: 0,
        hint: "영어로 '만약'은 무엇일까요?",
        explain: "if 는 '만약 ~라면'. 조건이 맞을 때만 아래 코드를 실행해요.",
      },
      {
        obj: "🥫", x: 7, y: 15, type: "choice", q: "로봇에게 캔을 넣었어요. 로봇이 뭐라고 말할까요?",
        code: ['trash = "캔"', 'if trash == "캔":', '    print("캔 수거함으로!")', "else:", '    print("일반 쓰레기통으로!")'],
        options: ["캔 수거함으로!", "일반 쓰레기통으로!", "아무 말도 안 해요"], answer: 0,
        hint: "trash 상자에 무엇이 들어 있나요? 그게 \"캔\"과 같나요?",
        explain: "trash 가 \"캔\"과 같으니까 조건이 참! if 아래 문장이 실행돼요.",
      },
      {
        obj: "🌡️", x: 5, y: 17, type: "choice", q: "오늘 기온이 35도예요. 화면에 무엇이 나올까요?",
        code: ["temp = 35", "if temp > 30:", '    print("물을 마셔요 💧")'],
        options: ["물을 마셔요 💧", "아무것도 안 나와요", "35"], answer: 0,
        hint: "35 는 30 보다 큰가요?",
        explain: "35 > 30 은 참이라서 '물을 마셔요 💧'가 나와요. 더운 날엔 물을 꼭 마셔요!",
      },
    ],
  },
  {
    id: "thonny", zone: "5", icon: "🛠️", name: "Thonny 연구소", topic: "Thonny & 바이브 코딩", sdg: "SDG 9 · 산업, 혁신, 인프라",
    color: "var(--room5)", key: 1,
    story: "AI 로봇과 함께 코딩하는 연구소예요. Thonny 와 바이브 코딩 실력을 보여 주세요!",
    puzzles: [
      {
        obj: "💻", x: 23, y: 14, type: "choice", q: "Thonny에서 내가 만든 코드를 실행하는 버튼은?",
        options: ["▶ 초록색 실행 버튼 (F5)", "💾 저장 버튼", "⏹ 빨간 정지 버튼"], answer: 0,
        hint: "동영상을 재생할 때 누르는 모양이에요!",
        explain: "▶ 실행 버튼(F5)을 누르면 코드가 실행되고, 결과는 아래 셸(Shell) 창에 나와요.",
      },
      {
        obj: "🐞", x: 27, y: 14, type: "choice", q: "Thonny에 빨간 오류가 났어요! 어떻게 할까요?",
        code: ["NameError: name 'prnt' is not defined"], codePlain: true,
        options: ["prnt 를 print 로 고친다", "컴퓨터를 끈다", "그냥 포기한다"], answer: 0,
        hint: "'prnt' 는 무엇의 오타일까요?",
        explain: "오류 메시지는 고칠 곳을 알려 주는 힌트예요! prnt → print 로 고치면 돼요.",
      },
      {
        obj: "💬", x: 23, y: 17, type: "choice", q: "AI에게 하는 부탁(프롬프트)으로 가장 좋은 것은?",
        options: [
          "게임 만들어 줘",
          "초등학생이 Thonny에서 실행할 수 있게, 분리수거 방법을 알려 주는 파이썬 프로그램을 만들어 줘",
          "아무거나",
        ],
        answer: 1,
        hint: "무엇을, 어디서, 어떻게 — 자세하게 말할수록 AI가 잘 알아들어요.",
        explain: "좋은 프롬프트는 자세해요! 마음에 안 들면 '더 쉽게 바꿔 줘'처럼 다시 부탁하면 돼요.",
      },
      {
        obj: "🎤", x: 27, y: 17, type: "order", q: "SDGs 바이브 코딩 프로젝트 순서를 맞춰 보세요!",
        lines: ["💡 SDGs 주제 정하기", "🤖 AI와 함께 코드 만들고 Thonny로 실행하기", "🎤 친구들 앞에서 발표하기"], isCode: false,
        hint: "생각하기 → 만들기 → 발표하기!",
        explain: "주제를 정하고, AI와 함께 만들고, 발표까지! 이게 바로 바이브 코딩이에요.",
      },
    ],
  },
];

// 마지막 방 — {KEY_LINES}, {KEY_EXPR}, {KEY_SUM}, {KEY_DETAIL} 은 위 열쇠 숫자로 자동 계산돼요
const FINAL_ROOM = {
  id: "final", zone: "6", icon: "🌏", name: "SDGs 탈출 금고", topic: "총정리", sdg: "SDG 17 · 목표를 위한 파트너십",
  color: "var(--room6)",
  story: "드디어 마지막 금고! 모은 🔑 열쇠 숫자로 비밀번호를 알아내세요.",
  puzzles: [
    {
      obj: "🌏", x: 13, y: 15, type: "choice", q: "SDGs(지속가능발전목표)는 모두 몇 개일까요?",
      options: ["5개", "17개", "100개"], answer: 1,
      hint: "10보다 크고 20보다 작아요. 무지개 바퀴 로고의 조각 수예요!",
      explain: "SDGs는 지구를 지키기 위해 전 세계가 함께 약속한 17개의 목표예요.",
    },
    {
      obj: "🔐", x: 17, y: 15, type: "input", q: "🔐 금고 비밀번호! 이 코드를 실행하면 나오는 숫자를 입력하세요.",
      code: ["{KEY_LINES}", "print({KEY_EXPR})"],
      answers: ["{KEY_SUM}"],
      hint: "열쇠 숫자를 모두 더해요: {KEY_DETAIL}",
      explain: "{KEY_DETAIL} = {KEY_SUM}. 변수에 담은 열쇠를 모두 더했어요. 금고가 열렸어요! 🎉",
    },
  ],
};

// ── 4. 메타버스 맵 (한 글자 = 한 칸) ──
// # 벽 · . 중앙 광장 · 1~5 각 방 바닥 · 6 금고 바닥 · D 문 · L 금고 문(열쇠를 다 모으면 열림)
const WORLD_MAP = [
  "###############################",
  "#111111111#222222222#333333333#",
  "#111111111#222222222#333333333#",
  "#111111111#222222222#333333333#",
  "#111111111#222222222#333333333#",
  "#111111111#222222222#333333333#",
  "#111111111#222222222#333333333#",
  "#####D#########D#########D#####",
  "#.............................#",
  "#.............................#",
  "#.............................#",
  "#.............................#",
  "#####D#########L#########D#####",
  "#444444444#666666666#555555555#",
  "#444444444#666666666#555555555#",
  "#444444444#666666666#555555555#",
  "#444444444#666666666#555555555#",
  "#444444444#666666666#555555555#",
  "#444444444#666666666#555555555#",
  "###############################",
];
const SPAWN = { x: 15, y: 10 };
const LOBBY = { name: "네온 광장", story: "🛸 배달 드론 파이에게 말을 걸어 보세요! 위·아래 문으로 각 방에 갈 수 있어요." };

// 말을 걸 수 있는 캐릭터 (마지막 대사는 진행 상황에 맞춰 자동으로 붙어요)
const NPCS = [
  {
    id: "drone", icon: "🎁", drone: true, name: "배달 드론 파이", x: 10, y: 9, // drone: true → 캔버스에 드론 모양으로 그려요
    lines: [
      "삐빅! 나는 배달 드론 파이야 🛸 이 네온 시티에서 나가려면 🔑 열쇠 5개를 모아서 금고를 열어야 해.",
      "위쪽에는 📜 주문서의 방, 💧 물탱크 창고, 🤪 넌센스 퀴즈방이 있고, 아래쪽에는 ♻️ 분리수거 로봇실, 🛠️ Thonny 연구소가 있어.",
      "❗ 표시가 있는 물건에 다가가서 스페이스바(또는 💬 버튼)를 누르면 문제가 나와. 방의 문제를 모두 풀면 열쇠를 배달해 줄게! 🎁",
    ],
  },
];

// 꾸미기 물건 (지나갈 수 없어요)
const DECOR = [
  { icon: "🪴", x: 1, y: 8 }, { icon: "🪴", x: 29, y: 8 }, { icon: "🪴", x: 1, y: 11 }, { icon: "🪴", x: 29, y: 11 },
  { icon: "⛲", x: 20, y: 9 }, { icon: "🌼", x: 6, y: 10 }, { icon: "🌼", x: 24, y: 10 },
  { icon: "📚", x: 1, y: 1 }, { icon: "📚", x: 9, y: 1 }, { icon: "🕯️", x: 1, y: 6 }, { icon: "🕯️", x: 9, y: 6 },
  { icon: "🛢️", x: 11, y: 1 }, { icon: "🛢️", x: 19, y: 1 }, { icon: "💦", x: 11, y: 6 }, { icon: "💦", x: 19, y: 6 },
  { icon: "🎈", x: 21, y: 1 }, { icon: "🎈", x: 29, y: 1 }, { icon: "🃏", x: 21, y: 6 }, { icon: "🎲", x: 29, y: 6 },
  { icon: "🗑️", x: 1, y: 13 }, { icon: "🗑️", x: 9, y: 13 }, { icon: "📦", x: 1, y: 18 }, { icon: "📦", x: 9, y: 18 },
  { icon: "🖥️", x: 21, y: 18 }, { icon: "🖥️", x: 29, y: 18 }, { icon: "🔧", x: 29, y: 13 },
  { icon: "🌟", x: 11, y: 13 }, { icon: "🌟", x: 19, y: 13 }, { icon: "💰", x: 11, y: 18 }, { icon: "💰", x: 19, y: 18 }, { icon: "🏆", x: 15, y: 18 },
];

// ── 5. 상 ──
// 순위상(1~3등) → 특별상(한 사람에 하나씩) → 나머지 친구 모두에게 응원상. 아무도 빠지지 않아요!
const TOP_AWARDS = [
  { id: "gold", icon: "🥇", name: "탈출 마스터 금상", desc: "가장 높은 점수로 탈출했어요!", reason: "가장 높은 점수로 탈출하여 최고의 파이썬 실력을 보여 주었으므로" },
  { id: "silver", icon: "🥈", name: "탈출 마스터 은상", desc: "뛰어난 실력으로 탈출했어요!", reason: "뛰어난 파이썬 실력으로 문제를 척척 해결하였으므로" },
  { id: "bronze", icon: "🥉", name: "탈출 마스터 동상", desc: "멋진 실력으로 탈출했어요!", reason: "끈기와 실력으로 훌륭하게 문제를 해결하였으므로" },
];
// rule: fastest(빠른 탈출) / fewestHints(힌트 적게) / fewestWrong(오답 적게) / mostTries(많이 도전)
// 이미 1~3등 상을 받은 친구는 건너뛰고 다음 친구에게 가므로, 문구는 '가장 ~' 대신 칭찬형으로 씁니다.
const SPECIAL_AWARDS = [
  { id: "speed", icon: "⚡", name: "번개 탈출상", desc: "번개처럼 빠르게 금고를 열었어요!", rule: "fastest", reason: "번개처럼 빠르게 금고를 열어 멋진 실력을 보여 주었으므로" },
  { id: "self", icon: "🧠", name: "스스로 해결상", desc: "힌트를 아끼며 스스로 생각했어요!", rule: "fewestHints", reason: "힌트에 기대지 않고 스스로 생각하는 힘으로 문제를 해결하였으므로" },
  { id: "sharp", icon: "🎯", name: "백발백중상", desc: "침착하고 정확하게 문제를 풀었어요!", rule: "fewestWrong", reason: "침착하고 정확하게 문제를 풀어 백발백중의 실력을 보여 주었으므로" },
  { id: "grit", icon: "💪", name: "포기는 없다상", desc: "여러 번 틀려도 끝까지 도전했어요!", rule: "mostTries", reason: "여러 번 틀려도 포기하지 않고 끝까지 도전하였으므로" },
];
const CHEER_AWARDS = [
  { id: "sdgs", icon: "🌱", name: "SDGs 지킴이상", desc: "지구를 지키는 마음을 코드에 담았어요!", reason: "지구를 지키는 SDGs 아이디어를 파이썬 코드로 멋지게 표현하였으므로" },
  { id: "explorer", icon: "🐍", name: "파이썬 탐험가상", desc: "파이썬의 방을 즐겁게 탐험했어요!", reason: "파이썬의 여러 방을 즐겁게 탐험하며 열심히 배웠으므로" },
  { id: "vibe", icon: "🤖", name: "바이브 코딩 꿈나무상", desc: "AI와 함께 멋진 개발자의 꿈을 키웠어요!", reason: "AI와 함께 코딩하며 멋진 개발자의 꿈을 키웠으므로" },
  { id: "idea", icon: "🌟", name: "반짝 아이디어상", desc: "반짝이는 아이디어로 도전했어요!", reason: "반짝이는 아이디어로 문제 해결에 도전하였으므로" },
  { id: "team", icon: "🤝", name: "함께 성장상", desc: "친구들과 함께 즐겁게 배웠어요!", reason: "친구들과 서로 도우며 즐겁게 배우고 성장하였으므로" },
];
const CERT_TEXT = "위 어린이는 파이썬 바이브 코딩 수업에서 기초 문법, 변수, 반복문, 조건문을 열심히 배우고 Thonny로 SDGs 프로그램을 만들어 발표하였으며, 파이썬 방탈출 게임에서 {REASON} 이 상장을 주어 칭찬합니다.";

const CORRECT_MSGS = ["정답! 🎉", "훌륭해요! 👏", "파이썬 마법사 같아요! 🧙", "완벽해요! ✨", "역시 탐험대! 🚀"];
const WRONG_MSGS = ["앗, 아쉬워요! 다시 한번 생각해 볼까요? 🤔", "거의 다 왔어요! 코드를 천천히 읽어 보세요 👀", "괜찮아요, 틀리면서 배우는 거예요! 💪", "다시 도전! 💡 힌트를 봐도 좋아요"];

// ── 6. 실시간 결과 모으기 (Firebase) ──
// 학생이 '수업 코드'로 시작하면 결과가 선생님 화면에 자동으로 모여요. projectId 를 "" 로 비우면 이 기능이 꺼져요.
const ONLINE = { projectId: "python-escape-sykim", collection: "pyEscape", refreshSec: 4 };


/* =========================================================
   여기부터는 동작 코드입니다
   ========================================================= */
const STORE = {
  theme: "pyEscapeTheme",
  sound: "pyEscapeSound",
  records: "pyEscapeRecords",
  current: "pyEscapeCurrent",
  settings: "pyEscapeSettings",
  classCode: "pyEscapeClass",
};
const GAME_VERSION = 2; // 저장된 진행 상태 형식 (바뀌면 이전 진행 상태는 버림)

// ── 유틸 ──
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = (n) => String(n).padStart(2, "0");
const fmtTime = (sec) => `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fmtDateKo = (s) => { const [y, m, d] = (s || todayStr()).split("-").map(Number); return `${y}년 ${m}월 ${d}일`; };
const fmtNum = (n) => Number(n).toLocaleString("ko-KR");
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const normalize = (s) => String(s).toLowerCase().replace(/[\s"'`.!~]/g, "");

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 저장 불가 환경은 무시 */ }
}

// ── 마지막 방 템플릿 채우기 ──
const KEY_LIST = ROOMS.map((r) => r.key);
const TEMPLATE = {
  "{KEY_LINES}": ROOMS.map((r, i) => `key${i + 1} = ${r.key}    # ${r.icon} ${r.name}`).join("\n"),
  "{KEY_EXPR}": ROOMS.map((_, i) => `key${i + 1}`).join(" + "),
  "{KEY_SUM}": String(KEY_LIST.reduce((a, b) => a + b, 0)),
  "{KEY_DETAIL}": KEY_LIST.join(" + "),
};
const fillTemplate = (v) => Array.isArray(v) ? v.map(fillTemplate)
  : typeof v === "string" ? v.replace(/\{[A-Z_]+\}/g, (t) => TEMPLATE[t] ?? t) : v;
FINAL_ROOM.puzzles.forEach((p) => ["q", "code", "hint", "explain", "answers"].forEach((f) => { p[f] = fillTemplate(p[f]); }));

const ALL_ROOMS = [...ROOMS, FINAL_ROOM];
const roomById = (id) => ALL_ROOMS.find((r) => r.id === id);

/* =========================================================
   실시간 결과 모으기 — Firebase Firestore REST (SDK 없이 fetch 만 사용)
   학생: 수업 코드로 시작하면 진행 상황·결과를 pyEscape/{수업코드}/records/{기록ID} 에 저장
   선생님: 같은 수업 코드의 기록을 몇 초마다 읽어 와서 순위표에 합쳐요
   ========================================================= */
const ONLINE_ON = !!ONLINE.projectId;
const FS_URL = `https://firestore.googleapis.com/v1/projects/${ONLINE.projectId}/databases/(default)/documents/${ONLINE.collection}`;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 I·O·0·1 은 뺐어요
const normClass = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
const validClass = (s) => /^[A-Z0-9]{4,12}$/.test(s || "");
const newClassCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

function toFields(o) {
  const fields = {};
  for (const [k, v] of Object.entries(o)) {
    if (v == null) continue;
    if (typeof v === "boolean") fields[k] = { booleanValue: v };
    else if (typeof v === "number") fields[k] = { integerValue: String(Math.round(v)) };
    else fields[k] = { stringValue: String(v) };
  }
  return { fields };
}
function fromDoc(doc) {
  const o = { id: doc.name.split("/").pop() };
  for (const [k, v] of Object.entries(doc.fields || {})) {
    o[k] = "integerValue" in v ? Number(v.integerValue) : "booleanValue" in v ? v.booleanValue : v.stringValue ?? "";
  }
  return o;
}

// ── 학생 쪽: 진행 상황 보내기 ──
const sync = { busy: false, again: false, state: "idle" }; // idle · sending · ok · fail
async function pushProgress() {
  if (!ONLINE_ON || !game || !validClass(game.classCode)) return;
  if (sync.busy) { sync.again = true; return; }
  sync.busy = true;
  setSync("sending");
  const rec = { ...gameToRecord(game), avatar: game.avatar, status: game.finished ? "done" : "playing", updatedAt: Date.now() };
  delete rec.id;
  try {
    const res = await fetch(`${FS_URL}/${game.classCode}/records/${game.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toFields(rec)),
    });
    if (!res.ok) throw new Error(String(res.status));
    setSync("ok");
  } catch {
    setSync("fail");
  }
  sync.busy = false;
  if (sync.again) { sync.again = false; pushProgress(); }
}
function setSync(state) {
  sync.state = state;
  const el = $("#syncState");
  if (el) el.innerHTML = syncHTML();
  renderHud();
}
function syncHTML() {
  if (sync.state === "fail") return `⚠️ 전송하지 못했어요. 인터넷 연결을 확인하고 <button class="btn small warn" data-action="retry-sync">다시 보내기</button>`;
  if (sync.state === "sending") return "📡 선생님 화면으로 보내는 중…";
  return "✅ 선생님 화면에 결과가 전송됐어요!";
}

// ── 선생님 쪽: 같은 수업 코드의 기록 읽어 오기 ──
const online = { list: [], at: 0, error: false };
async function fetchOnline() {
  if (!ONLINE_ON || !validClass(settings.classCode)) return;
  try {
    const res = await fetch(`${FS_URL}/${settings.classCode}/records?pageSize=300`);
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    online.list = (json.documents || []).map(fromDoc);
    online.error = false;
  } catch {
    online.error = true;
  }
  online.at = Date.now();
  refreshLive();
}
setInterval(() => { if (ui.screen === "awards" && !document.hidden) fetchOnline(); }, ONLINE.refreshSec * 1000);

// 이 기기 기록 + 온라인 기록을 합쳐요 (같은 기록이면 온라인 쪽이 최신)
function allRecords() {
  const map = new Map();
  records.forEach((r) => map.set(r.id, { ...r, status: "done" }));
  online.list.forEach((r) => map.set(r.id, { ...map.get(r.id), ...r }));
  return [...map.values()]
    .filter((r) => !settings.hidden.includes(r.id))
    .map((r) => ({ ...r, awardOverride: settings.overrides[r.id] || r.awardOverride || "" }));
}
const doneRecords = () => allRecords().filter((r) => r.status !== "playing");
const playingRecords = () => allRecords().filter((r) => r.status === "playing");

function studentLink() {
  return `${location.href.split(/[?#]/)[0]}?class=${settings.classCode}`;
}

// ── 상태 ──
let game = load(STORE.current, null);
if (game && game.v !== GAME_VERSION) game = null;
let records = load(STORE.records, []);
let settings = Object.assign({ className: GAME.className, date: todayStr(), teacher: "", limitMin: 0, classCode: "", hidden: [], overrides: {} }, load(STORE.settings, {}));
if (!validClass(settings.classCode)) { settings.classCode = newClassCode(); save(STORE.settings, settings); }
let soundOn = load(STORE.sound, true);
let theme = load(STORE.theme, matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
const ui = {
  screen: null, avatar: AVATARS[0], active: null, dialog: null,
  selected: null, order: [], inputValue: "", feedback: null, justSolved: null, shuffles: {}, timeUp: false,
};
let cer = null; // 시상식 진행 상태

// ── 게임 진행 ──
function newGame(name, members, avatar, classCode) {
  game = {
    v: GAME_VERSION, id: uid(), name, members, avatar, classCode, startedAt: Date.now(), endedAt: null,
    pos: { ...SPAWN }, done: {}, puzzles: {}, solved: 0, wrong: 0, hints: 0, reveals: 0,
    finished: false, escaped: false, project: "",
  };
  saveGame();
}
const saveGame = () => save(STORE.current, game);
let saveTimer;
const saveGameSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveGame, 400); };
const elapsed = (g) => Math.max(0, Math.floor(((g.endedAt || Date.now()) - g.startedAt) / 1000));
const pkey = (roomId, idx) => `${roomId}-${idx}`;
const pstate = (k) => (game.puzzles[k] ||= { wrongs: 0, hint: false });
const solvedIn = (r, g = game) => r.puzzles.filter((_, i) => g.done[pkey(r.id, i)]).length;
const isRoomDone = (r, g = game) => solvedIn(r, g) === r.puzzles.length;
const keysCount = (g) => ROOMS.filter((r) => isRoomDone(r, g)).length;
const vaultOpen = () => !!game && keysCount(game) >= ROOMS.length;

function calcScore({ solved, wrong, hints, escaped, seconds }) {
  let s = solved * SCORE.solve + wrong * SCORE.wrong + hints * SCORE.hint;
  if (escaped) {
    s += SCORE.clearBonus + Math.round(SCORE.timeBonusMax * Math.max(0, 1 - seconds / (SCORE.timeBonusMinutes * 60)));
  }
  return Math.max(0, s);
}

function gameToRecord(g) {
  const seconds = elapsed(g);
  const d = new Date(g.startedAt);
  return {
    id: g.id, name: g.name, members: g.members, roomsCleared: keysCount(g), escaped: g.escaped,
    seconds, hints: g.hints, wrong: g.wrong, reveals: g.reveals, solved: g.solved,
    score: calcScore({ ...g, seconds }), project: g.project,
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
  };
}

function upsertRecord(rec) {
  const i = records.findIndex((r) => r.id === rec.id);
  if (i >= 0) records[i] = { ...records[i], ...rec, awardOverride: records[i].awardOverride };
  else records.push(rec);
  save(STORE.records, records);
  return i < 0;
}

function finishGame(escaped) {
  if (!game || game.finished) return;
  game.finished = true;
  game.escaped = escaped;
  game.endedAt = Date.now();
  saveGame();
  upsertRecord(gameToRecord(game));
  pushProgress();
}

function answerText(p) {
  if (p.type === "choice") return p.options[p.answer];
  if (p.type === "input") return p.answers[0];
  return p.lines.join("\n");
}

function resetPuzzleUI() {
  ui.selected = null; ui.order = []; ui.inputValue = ""; ui.feedback = null;
}

function currentPuzzle() {
  const room = roomById(ui.active.roomId);
  const idx = ui.active.idx;
  return { room, idx, p: room.puzzles[idx] };
}

function checkAnswer() {
  if (!ui.active || ui.justSolved) return;
  const { p } = currentPuzzle();
  let ok = false;
  if (p.type === "choice") {
    if (ui.selected == null) return toast("답을 골라 주세요! 👆");
    ok = ui.selected === p.answer;
  } else if (p.type === "input") {
    const v = ui.inputValue;
    if (!v.trim()) return toast("답을 입력해 주세요! ⌨️");
    ok = p.answers.some((a) => normalize(a) === normalize(v));
  } else {
    if (ui.order.length !== p.lines.length) return toast("조각을 모두 눌러 주세요! 🧩");
    ok = ui.order.every((li, i) => p.lines[li] === p.lines[i]);
  }
  if (ok) solvePuzzle(false);
  else wrongAnswer();
}

function wrongAnswer() {
  const { room, idx, p } = currentPuzzle();
  pstate(pkey(room.id, idx)).wrongs++;
  game.wrong++;
  saveGame();
  ui.feedback = pick(WRONG_MSGS);
  ui.selected = null;
  if (p.type === "order") ui.order = [];
  beep("bad");
  renderPuzzle();
  renderHud();
  const card = $("#puzzleCard");
  if (card) { card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake"); }
}

function solvePuzzle(revealed) {
  const { room, idx, p } = currentPuzzle();
  const k = pkey(room.id, idx);
  if (game.done[k]) return;
  const vaultBefore = vaultOpen();
  game.done[k] = revealed ? "r" : "s";
  if (revealed) game.reveals++;
  else game.solved++;
  const roomDone = isRoomDone(room);
  ui.justSolved = {
    puzzle: p, revealed, roomDone, msg: pick(CORRECT_MSGS),
    left: room.puzzles.length - solvedIn(room),
    vaultOpened: !vaultBefore && vaultOpen(),
  };
  resetPuzzleUI();
  if (room.id === FINAL_ROOM.id && roomDone) finishGame(true);
  else { saveGame(); pushProgress(); }
  beep(roomDone ? "key" : revealed ? "soft" : "ok");
  if (!revealed) confetti(roomDone ? 40 : 14);
  renderPuzzle();
  renderHud();
  updateQuest();
}

// ── 화면 그리기 ──
function render() {
  const app = $("#app");
  const s = ui.screen;
  stopEngine();
  app.classList.toggle("wide", s === "play");
  app.innerHTML =
    s === "play" ? playHTML()
    : s === "end" ? endHTML()
    : s === "awards" ? awardsHTML()
    : homeHTML();
  renderHud();
  if (s === "play") startEngine();
  if (s === "awards") { lastLiveHTML = ""; fetchOnline(); }
}

function go(screen) {
  ui.screen = screen;
  if (screen !== "play") { ui.active = null; ui.dialog = null; $("#pmodal").hidden = true; }
  render();
  window.scrollTo(0, 0);
}

function renderHud() {
  const hud = $("#hud");
  const show = game && !game.finished && ui.screen === "play";
  hud.hidden = !show;
  if (!show) return;
  const sec = elapsed(game);
  const limit = settings.limitMin * 60;
  const timeTxt = limit ? `⏳ ${fmtTime(Math.max(0, limit - sec))}` : `⏱ ${fmtTime(sec)}`;
  const live = calcScore({ ...game, escaped: false, seconds: sec });
  hud.innerHTML = `
    <span>${game.avatar} ${esc(game.name)}</span>
    <span class="${limit && limit - sec <= 60 ? "hud-warn" : ""}">${timeTxt}</span>
    <span>⭐ ${fmtNum(live)}점</span>
    <span>🔑 ${keysCount(game)}/${ROOMS.length}</span>
    ${game.classCode ? `<span title="선생님 화면과 연결됨">${sync.state === "fail" ? "⚠️" : "📡"} ${esc(game.classCode)}</span>` : ""}`;
}

function highlight(code) {
  const re = /(#.*$)|("[^"\n]*"|'[^'\n]*')|\b(for|in|if|elif|else|while|and|or|not|True|False)\b|\b(print|range|input|len|int|str)\b|\b(\d+)\b/gm;
  let out = "", last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    const cls = m[1] ? "c" : m[2] ? "s" : m[3] ? "k" : m[4] ? "f" : "n";
    out += `<span class="tk-${cls}">${esc(m[0])}</span>`;
    last = re.lastIndex;
  }
  return out + esc(code.slice(last));
}
const codeBlock = (lines, plain, extra = "") => {
  const text = Array.isArray(lines) ? lines.join("\n") : lines;
  return `<pre class="code ${extra}">${plain ? esc(text) : highlight(text)}</pre>`;
};

function homeHTML() {
  const active = game && !game.finished;
  const limit = settings.limitMin > 0 ? `<li>⏳ 제한 시간 <b>${settings.limitMin}분</b> — 시간이 끝나면 그때까지의 기록으로 마감!</li>` : "";
  return `
  <section class="card hero">
    <div>
      <span class="badge">🐍 Python · 🤖 Vibe Coding · 🌏 SDGs</span>
      <h1>${esc(GAME.title)}</h1>
      <p class="sub">${esc(GAME.subtitle)}</p>
      <p>${esc(GAME.intro)}</p>
    </div>
    <div class="hero-art" aria-hidden="true">🚪<span>🔑</span></div>
  </section>
  ${active ? `
  <section class="card resume">
    <div><b>${game.avatar} ${esc(game.name)}</b> 탐험대가 탈출 중이에요! · 🔑 ${keysCount(game)}/${ROOMS.length} · ⏱ ${fmtTime(elapsed(game))}</div>
    <button class="btn warn" data-action="resume">▶ 이어서 하기</button>
  </section>` : ""}
  <section class="card">
    <h2>🎫 탐험대 등록</h2>
    <label>내 캐릭터 고르기</label>
    <div class="avatar-pick">
      ${AVATARS.map((a) => `<button class="avatar ${a === ui.avatar ? "on" : ""}" data-action="pick-avatar" data-a="${a}" aria-label="캐릭터 ${a}">${a}</button>`).join("")}
    </div>
    <div class="form-row">
      <label>이름 또는 팀 이름<input id="playerName" maxlength="12" placeholder="예: 지구지킴이" autocomplete="off"></label>
      <label>함께한 친구들 (선택)<input id="playerMembers" maxlength="40" placeholder="예: 김민준, 이서연" autocomplete="off"></label>
    </div>
    ${ONLINE_ON ? `<label class="class-input">📡 수업 코드 <small class="muted">(선생님 화면에 나온 코드 · 모르면 비워 두세요)</small>
      <input id="classInput" maxlength="12" placeholder="예: GD27" value="${esc(initialClass())}" autocomplete="off" spellcheck="false"></label>` : ""}
    <button class="btn primary big" data-action="start">🚀 방탈출 시작!</button>
  </section>
  <section class="grid-2">
    <div class="card">
      <h3>🗺️ 연구소의 방</h3>
      <ol class="room-list">
        ${ALL_ROOMS.map((r) => `<li><span>${r.icon}</span><b>${esc(r.name)}</b><small>${esc(r.topic)}</small></li>`).join("")}
      </ol>
    </div>
    <div class="card">
      <h3>🎮 이렇게 놀아요</h3>
      <ul class="rules">
        <li>⬆⬇⬅➡ 또는 W·A·S·D 로 걸어 다녀요. 맵을 클릭(터치)하면 그곳까지 걸어가요.</li>
        <li><b>❗</b> 물건 앞에서 <b>스페이스바</b>(또는 💬 버튼)를 누르면 문제가 나와요.</li>
        <li>방의 문제를 다 풀면 <b>🔑 열쇠</b>! 열쇠 ${ROOMS.length}개면 금고 문이 열려요.</li>
        <li>맞히면 <b>+${SCORE.solve}점</b>, 틀리면 <b>${SCORE.wrong}점</b>, 💡 힌트 <b>${SCORE.hint}점</b>. ${SCORE.revealAfter}번 틀리면 정답을 볼 수 있어요.</li>
        <li>🎉 탈출하면 <b>+${SCORE.clearBonus}점</b>, 빨리 탈출할수록 시간 보너스 최대 <b>+${SCORE.timeBonusMax}점</b></li>
        ${limit}
      </ul>
    </div>
  </section>`;
}

// 주소에 ?class=코드 가 있으면 그 코드, 없으면 지난번에 쓴 코드
function initialClass() {
  const fromUrl = normClass(new URLSearchParams(location.search).get("class"));
  return validClass(fromUrl) ? fromUrl : load(STORE.classCode, "");
}

function playHTML() {
  return `
  <section class="play">
    <div class="world-wrap">
      <canvas id="world" aria-label="방탈출 맵. 방향키로 움직이고 스페이스바로 문제를 풀어요."></canvas>
      <div id="zoneBanner" class="zone-banner" hidden></div>
      <button id="actPrompt" class="act-prompt" data-action="interact" hidden></button>
      <div id="npcDialog" class="npc-dialog" hidden></div>
      <div class="dpad">
        <button data-dir="up" class="d-up" aria-label="위로">▲</button>
        <button data-dir="left" class="d-left" aria-label="왼쪽으로">◀</button>
        <button data-dir="right" class="d-right" aria-label="오른쪽으로">▶</button>
        <button data-dir="down" class="d-down" aria-label="아래로">▼</button>
      </div>
      <button class="act-btn" data-action="interact" aria-label="문제 풀기 / 말 걸기">💬</button>
    </div>
    <aside class="play-side">
      <div class="card">
        <h3>🗝️ 탈출 미션</h3>
        <ul id="questList" class="quest-list"></ul>
      </div>
      <div class="card">
        <h3>🎮 조작법</h3>
        <ul class="rules small-rules">
          <li>⬆⬇⬅➡ / W A S D : 이동</li>
          <li>스페이스바 : 문제 풀기 · 말 걸기</li>
          <li>맵 클릭(터치) : 그곳으로 걸어가기</li>
        </ul>
        <button class="btn ghost small" data-action="give-up" style="margin-top:12px">🏳 여기까지 하고 결과 보기</button>
      </div>
    </aside>
  </section>`;
}

function updateQuest() {
  const ul = $("#questList");
  if (!ul || !game) return;
  ul.innerHTML = ALL_ROOMS.map((r) => {
    const n = solvedIn(r);
    const done = n === r.puzzles.length;
    const locked = r.id === FINAL_ROOM.id && !vaultOpen();
    const state = done ? (r.key != null ? `🔑 ${r.key}` : "🎉") : `${n}/${r.puzzles.length}`;
    return `<li class="${done ? "done" : ""}"><span>${locked ? "🔒" : r.icon}</span><b>${esc(r.name)}</b><small>${state}</small></li>`;
  }).join("");
}

// ── 문제 팝업 ──
function openPuzzle(roomId, idx) {
  ui.active = { roomId, idx };
  ui.justSolved = null;
  resetPuzzleUI();
  eng.held = [];
  beep("soft");
  renderPuzzle();
}

function closePuzzle() {
  ui.active = null;
  ui.justSolved = null;
  $("#pmodal").hidden = true;
  if (game && game.finished) { go("end"); return; }
  updateQuest();
  renderPrompt(); // 방금 푼 물건이면 '이미 해결'로 바꿔요
}

function renderPuzzle() {
  const m = $("#pmodal");
  if (!ui.active) { m.hidden = true; return; }
  const room = roomById(ui.active.roomId);
  const dots = room.puzzles.map((_, i) =>
    `<span class="dot ${game.done[pkey(room.id, i)] ? "on" : ""} ${i === ui.active.idx && !ui.justSolved ? "now" : ""}"></span>`).join("");
  m.hidden = false;
  m.innerHTML = `
  <div class="pm-box" style="--door:${room.color}" role="dialog" aria-modal="true">
    <div class="pm-head">
      <span class="big-icon">${room.icon}</span>
      <div><b>${esc(room.name)}</b> <span class="tag room">${esc(room.topic)}</span></div>
      <button class="icon-btn pm-close" data-action="close-puzzle" title="닫기 (Esc)">✖</button>
    </div>
    <div class="steps">${dots}</div>
    ${ui.justSolved ? solvedHTML(room, ui.justSolved) : puzzleHTML(room, ui.active.idx)}
  </div>`;
  const input = $("#answerInput");
  if (input) { input.value = ui.inputValue; input.focus(); }
  else m.querySelector(".pm-box [data-action='close-puzzle'], .pm-box .btn.primary")?.focus({ preventScroll: true });
}

function puzzleHTML(room, idx) {
  const p = room.puzzles[idx];
  const k = pkey(room.id, idx);
  const ps = pstate(k);
  let answerUI = "";

  if (p.type === "choice") {
    answerUI = `<div class="options">${p.options.map((o, i) => `
      <button class="opt ${ui.selected === i ? "selected" : ""}" data-action="choose" data-i="${i}">
        <span class="opt-no">${i + 1}</span>
        <span class="${p.optionsCode ? "mono" : ""}">${esc(o)}</span>
      </button>`).join("")}</div>`;
  } else if (p.type === "input") {
    answerUI = `<input id="answerInput" class="answer-input" placeholder="정답을 입력하세요" autocomplete="off" spellcheck="false">`;
  } else {
    const order = (ui.shuffles[k] ||= shuffleIdx(p.lines.length));
    const line = (i) => p.isCode ? `<code>${highlight(p.lines[i])}</code>` : `<span>${esc(p.lines[i])}</span>`;
    const cls = p.isCode ? "is-code" : "";
    answerUI = `
    <div class="order-wrap">
      <div class="order-box">
        <h4>🧩 조각 (눌러서 옮기기)</h4>
        ${order.filter((i) => !ui.order.includes(i)).map((i) => `<button class="line-btn ${cls}" data-action="order-pick" data-i="${i}">${line(i)}</button>`).join("") || `<p class="muted">모두 옮겼어요! 확인을 눌러 보세요.</p>`}
      </div>
      <div class="order-box answer">
        <h4>📝 내가 만든 순서 (누르면 되돌리기)</h4>
        ${ui.order.map((i, n) => `<button class="line-btn ${cls}" data-action="order-back" data-i="${i}"><span class="ln">${n + 1}</span>${line(i)}</button>`).join("")}
      </div>
    </div>`;
  }

  return `
  <article class="puzzle-card" id="puzzleCard">
    <span class="q-label">${p.obj} 문제</span>
    <h3 class="q">${esc(p.q)}</h3>
    ${p.code ? codeBlock(p.code, p.codePlain) : ""}
    ${answerUI}
    ${ui.feedback ? `<div class="feedback bad">${esc(ui.feedback)}</div>` : ""}
    ${ps.hint ? `<div class="hint-box">💡 ${esc(p.hint)}</div>` : ""}
    <div class="puzzle-actions">
      <div class="btn-row">
        ${ps.hint ? "" : `<button class="btn ghost" data-action="hint">💡 힌트 (${SCORE.hint}점)</button>`}
        ${ps.wrongs >= SCORE.revealAfter ? `<button class="btn danger" data-action="reveal">📖 정답 보기</button>` : ""}
        ${p.type === "order" && ui.order.length ? `<button class="btn ghost" data-action="order-reset">↺ 다시 놓기</button>` : ""}
      </div>
      <button class="btn primary big" data-action="check">확인 ✔</button>
    </div>
  </article>`;
}

function solvedHTML(room, s) {
  const p = s.puzzle;
  const ans = p.type === "order"
    ? `<div class="answer-show">${codeBlock(p.lines, !p.isCode, "small")}</div>`
    : `<div class="answer-show">정답: <span class="tag">${esc(answerText(p))}</span></div>`;
  let next;
  if (room.id === FINAL_ROOM.id && s.roomDone) {
    next = `<div class="key-get"><span class="key-big">🗝️</span><b>금고가 열렸어요!</b></div>
      <button class="btn primary big" data-action="see-result">🎉 탈출! 결과 보기</button>`;
  } else if (s.roomDone) {
    next = `<div class="key-get"><span class="key-big">🔑</span><b>열쇠 「${room.key}」 획득!</b>
        <span class="muted">금고 비밀번호에 쓰이는 숫자예요. 잘 기억해 두세요!</span></div>
      ${s.vaultOpened ? `<p class="vault-open">🔓 열쇠를 모두 모았어요! 광장 아래쪽 <b>SDGs 탈출 금고</b> 문이 열렸어요!</p>` : ""}
      <button class="btn primary big" data-action="close-puzzle">🗺️ 계속 탐험하기</button>`;
  } else {
    next = `<p class="muted">이 방에 남은 ❗ 문제: <b>${s.left}개</b></p>
      <button class="btn primary big" data-action="close-puzzle">계속 탐험하기 →</button>`;
  }
  return `
  <article class="puzzle-card solved-card">
    <div class="solved-title">${s.revealed ? "📖 정답을 확인해요" : esc(s.msg)}</div>
    ${ans}
    <p class="explain">💬 ${esc(p.explain)}</p>
    ${next}
  </article>`;
}

// ── NPC 대화 ──
function progressLine() {
  const left = ROOMS.filter((r) => !isRoomDone(r));
  if (!left.length) return "삐빅! 열쇠를 모두 모았어! 광장 아래쪽 🔐 금고 문이 열렸어. 어서 탈출해! 🎉";
  return `지금 열쇠는 ${keysCount(game)}/${ROOMS.length}개야. 아직 ${left.map((r) => `${r.icon} ${r.name}`).join(", ")}의 문제가 남았어. 힘내! 💪`;
}
function openDialog(npc) {
  ui.dialog = { npc, lines: [...npc.lines, progressLine()], i: 0 };
  eng.held = [];
  renderDialog();
}
function dialogNext() {
  if (!ui.dialog) return;
  if (ui.dialog.i < ui.dialog.lines.length - 1) ui.dialog.i++;
  else ui.dialog = null;
  renderDialog();
}
function renderDialog() {
  const d = $("#npcDialog");
  if (!d) return;
  if (!ui.dialog) { d.hidden = true; return; }
  const { npc, lines, i } = ui.dialog;
  d.hidden = false;
  d.innerHTML = `
    <div class="dlg-icon">${npc.icon}</div>
    <div class="dlg-body"><b>${esc(npc.name)}</b><p>${esc(lines[i])}</p></div>
    <button class="btn primary small" data-action="dialog-next">${i < lines.length - 1 ? "다음 ▶" : "알겠어요!"}</button>`;
}

/* =========================================================
   메타버스 엔진 — 캔버스에 맵을 그리고 캐릭터를 움직여요
   ========================================================= */
const T = 48;          // 한 칸 크기(px)
const STEP_MS = 150;   // 한 칸 걷는 시간
const MAP_W = WORLD_MAP[0].length;
const MAP_H = WORLD_MAP.length;
const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const KEY_DIR = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };

const tileAt = (x, y) => (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W) ? WORLD_MAP[y][x] : "#";
const ZONE_ROOM = Object.fromEntries(ALL_ROOMS.map((r) => [r.zone, r]));
const zoneAt = (x, y) => ZONE_ROOM[tileAt(x, y)] || null;

// 방의 범위와 문 위치 계산
const ROOM_BOUNDS = {};
const DOORS = [];
for (let y = 0; y < MAP_H; y++) {
  for (let x = 0; x < MAP_W; x++) {
    const ch = WORLD_MAP[y][x];
    const r = ZONE_ROOM[ch];
    if (r) {
      const b = (ROOM_BOUNDS[r.id] ||= { x0: x, y0: y, x1: x, y1: y });
      b.x0 = Math.min(b.x0, x); b.y0 = Math.min(b.y0, y); b.x1 = Math.max(b.x1, x); b.y1 = Math.max(b.y1, y);
    }
    if (ch === "D" || ch === "L") {
      const near = Object.values(DIRS).map(([dx, dy]) => ({ x: x + dx, y: y + dy }));
      const roomSide = near.find((n) => zoneAt(n.x, n.y));
      const lobbySide = near.find((n) => tileAt(n.x, n.y) === ".");
      if (roomSide) DOORS.push({ x, y, room: zoneAt(roomSide.x, roomSide.y), lobby: lobbySide });
    }
  }
}

// 맵 위의 물건(문제·NPC·장식)
const THINGS = [
  ...ALL_ROOMS.flatMap((r) => r.puzzles.map((p, idx) => ({ kind: "puzzle", x: p.x, y: p.y, icon: p.obj, room: r, idx }))),
  ...NPCS.map((n) => ({ kind: "npc", ...n })),
  ...DECOR.map((d) => ({ kind: "decor", ...d })),
];
const thingAt = (x, y) => THINGS.find((t) => t.x === x && t.y === y);
const isAdjacent = (t) => Math.abs(t.x - eng.x) + Math.abs(t.y - eng.y) === 1;

function walkable(x, y) {
  const ch = tileAt(x, y);
  if (ch === "#") return false;
  if (ch === "L" && !vaultOpen()) return false;
  return !thingAt(x, y);
}

const eng = {
  on: false, raf: 0, canvas: null, ctx: null, P: null, w: 0, h: 0, dpr: 1, last: 0,
  x: 0, y: 0, fx: 0, fy: 0, t: 1, dir: "down", held: [], queued: null, path: [], pending: null, target: null,
  cam: { x: 0, y: 0 }, near: undefined, zone: undefined, bumpAt: 0, bannerTimer: 0, cache: null, rain: null,
};

const overlayOpen = () => !!ui.active || !!ui.dialog || !$("#modal").hidden || !!cer;

function startEngine() {
  eng.canvas = $("#world");
  eng.ctx = eng.canvas.getContext("2d");
  const pos = game.pos || SPAWN;
  Object.assign(eng, { x: pos.x, y: pos.y, fx: pos.x, fy: pos.y, t: 1, held: [], queued: null, path: [], pending: null, target: null, near: undefined, zone: undefined, last: 0 });
  readPalette();
  resizeCanvas();
  eng.canvas.addEventListener("pointerdown", onCanvasPointer);
  document.querySelectorAll(".dpad [data-dir]").forEach((b) => {
    const d = b.dataset.dir;
    const release = () => { eng.held = eng.held.filter((x) => x !== d); };
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); pressDir(d); });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, release));
  });
  eng.on = true;
  updateQuest();
  checkZone();
  renderDialog();
  renderPuzzle();
  eng.raf = requestAnimationFrame(loop);
}

function stopEngine() {
  eng.on = false;
  cancelAnimationFrame(eng.raf);
}

function resizeCanvas() {
  const c = eng.canvas;
  const r = c.getBoundingClientRect();
  eng.dpr = window.devicePixelRatio || 1;
  eng.w = r.width;
  eng.h = r.height;
  c.width = Math.round(r.width * eng.dpr);
  c.height = Math.round(r.height * eng.dpr);
}
window.addEventListener("resize", () => { if (eng.on) { resizeCanvas(); eng.cache = null; } });

function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  eng.P = {
    bg: v("--map-bg"), floorA: v("--map-floor-a"), floorB: v("--map-floor-b"),
    wall: v("--map-wall"), wallTop: v("--map-wall-top"), ink: v("--map-ink"),
    panel: v("--map-panel"), panelSolid: v("--map-panel-solid"), pink: v("--neon-pink"), cyan: v("--neon-cyan"),
    room: Object.fromEntries(ALL_ROOMS.map((r) => [r.zone, v(`--neon-${r.zone}`)])),
  };
  eng.cache = null;
}

function loop(ts) {
  if (!eng.on) return;
  const dt = eng.last ? Math.min(50, ts - eng.last) : 16;
  eng.last = ts;
  step(dt);
  draw(ts);
  eng.raf = requestAnimationFrame(loop);
}

function step(dt) {
  if (eng.t < 1) {
    eng.t = Math.min(1, eng.t + dt / STEP_MS);
    if (eng.t >= 1) arrive();
  }
  if (eng.t >= 1 && !overlayOpen()) {
    const held = eng.held[eng.held.length - 1] || eng.queued;
    eng.queued = null;
    if (held) {
      eng.path = []; eng.pending = null; eng.target = null;
      tryMove(held);
    } else if (eng.path.length) {
      const n = eng.path.shift();
      const d = Object.keys(DIRS).find((k) => DIRS[k][0] === n.x - eng.x && DIRS[k][1] === n.y - eng.y);
      if (!d || !tryMove(d)) { eng.path = []; eng.pending = null; eng.target = null; }
    }
  }
  updateNear();
}

// 방향키를 짧게 톡 눌러도 한 칸은 꼭 움직이도록, 서 있을 때는 바로 출발해요
function pressDir(d) {
  if (!eng.held.includes(d)) eng.held.push(d);
  eng.path = []; eng.pending = null; eng.target = null;
  if (overlayOpen()) return;
  if (eng.t >= 1) tryMove(d);
  else eng.queued = d; // 걷는 중에 누른 방향은 도착하자마자 한 칸 더
}

function tryMove(d) {
  eng.dir = d;
  const [dx, dy] = DIRS[d];
  const nx = eng.x + dx, ny = eng.y + dy;
  if (!walkable(nx, ny)) {
    if (tileAt(nx, ny) === "L") lockedBump();
    return false;
  }
  eng.fx = eng.x; eng.fy = eng.y;
  eng.x = nx; eng.y = ny;
  eng.t = 0;
  return true;
}

function lockedBump() {
  const now = performance.now();
  if (now - eng.bumpAt < 1500) return;
  eng.bumpAt = now;
  beep("bad");
  toast(`🔒 금고 문이 잠겨 있어요! 열쇠 ${ROOMS.length}개가 필요해요 (지금 ${keysCount(game)}개)`);
}

function arrive() {
  game.pos = { x: eng.x, y: eng.y };
  saveGameSoon();
  checkZone();
  if (!eng.path.length) {
    eng.target = null;
    if (eng.pending) {
      const th = eng.pending;
      eng.pending = null;
      if (isAdjacent(th)) { faceTo(th); interact(th); }
    }
  }
}

function faceTo(t) {
  const dx = t.x - eng.x, dy = t.y - eng.y;
  eng.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
}

function updateNear() {
  let best = null;
  if (eng.t >= 1) {
    const [dx, dy] = DIRS[eng.dir];
    const front = thingAt(eng.x + dx, eng.y + dy);
    best = front && front.kind !== "decor" ? front : THINGS.find((t) => t.kind !== "decor" && isAdjacent(t)) || null;
  }
  if (best !== eng.near) { eng.near = best; renderPrompt(); }
}

function renderPrompt() {
  const b = $("#actPrompt");
  if (!b) return;
  const t = eng.near;
  if (!t) { b.hidden = true; return; }
  const key = matchMedia("(pointer: coarse)").matches ? "💬 누르기" : "스페이스바";
  if (t.kind === "npc") b.innerHTML = `${t.icon} <b>${esc(t.name)}</b>와 이야기하기 <kbd>${key}</kbd>`;
  else if (game.done[pkey(t.room.id, t.idx)]) b.innerHTML = `✅ 이미 해결한 문제예요`;
  else b.innerHTML = `${t.icon} ❗ 문제 풀기 <kbd>${key}</kbd>`;
  b.hidden = false;
}

function interact(t) {
  if (!t || overlayOpen()) return;
  if (t.kind === "npc") { openDialog(t); return; }
  if (t.kind !== "puzzle") return;
  if (game.done[pkey(t.room.id, t.idx)]) { toast("✅ 이미 해결한 문제예요! 다른 ❗ 를 찾아보세요"); return; }
  openPuzzle(t.room.id, t.idx);
}

function checkZone() {
  const r = zoneAt(eng.x, eng.y);
  const id = r ? r.id : tileAt(eng.x, eng.y) === "." ? "lobby" : eng.zone; // 문 칸에서는 그대로
  if (id === eng.zone) return;
  eng.zone = id;
  const b = $("#zoneBanner");
  if (!b) return;
  b.innerHTML = r
    ? `${r.icon} <b>${esc(r.name)}</b> · ${esc(r.topic)}<small>${esc(r.story)}</small>`
    : `⛲ <b>${esc(LOBBY.name)}</b><small>${esc(LOBBY.story)}</small>`;
  b.hidden = false;
  b.classList.remove("show"); void b.offsetWidth; b.classList.add("show");
  clearTimeout(eng.bannerTimer);
  eng.bannerTimer = setTimeout(() => { b.hidden = true; }, 3500);
}

function findPath(goal) {
  const key = (x, y) => y * MAP_W + x;
  const start = key(eng.x, eng.y);
  if (goal(eng.x, eng.y)) return [];
  const prev = new Map([[start, -1]]);
  const queue = [[eng.x, eng.y]];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of Object.values(DIRS)) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (prev.has(k) || !walkable(nx, ny)) continue;
      prev.set(k, key(x, y));
      if (goal(nx, ny)) {
        const path = [];
        for (let c = k; c !== start; c = prev.get(c)) path.unshift({ x: c % MAP_W, y: Math.floor(c / MAP_W) });
        return path;
      }
      queue.push([nx, ny]);
    }
  }
  return null;
}

function onCanvasPointer(e) {
  if (overlayOpen()) return;
  const r = eng.canvas.getBoundingClientRect();
  const gx = Math.floor((e.clientX - r.left + eng.cam.x) / T);
  const gy = Math.floor((e.clientY - r.top + eng.cam.y) / T);
  const th = thingAt(gx, gy);
  eng.held = [];
  if (th && th.kind !== "decor") {
    if (isAdjacent(th) && eng.t >= 1) { faceTo(th); interact(th); return; }
    const path = findPath((x, y) => Math.abs(x - th.x) + Math.abs(y - th.y) === 1);
    if (path) { eng.path = path; eng.pending = th; eng.target = { x: th.x, y: th.y }; }
    return;
  }
  if (tileAt(gx, gy) === "L" && !vaultOpen()) { lockedBump(); return; }
  if (!walkable(gx, gy)) return;
  const path = findPath((x, y) => x === gx && y === gy);
  if (path) { eng.path = path; eng.pending = null; eng.target = { x: gx, y: gy }; }
}

// ── 그리기 (네온 시티) ──
// 바닥·벽·네온 테두리·간판처럼 움직이지 않는 부분은 한 번만 그려 두고(cache), 매 프레임에는
// 물건·캐릭터·드론·비만 새로 그려요.
const PUDDLES = [ // 젖은 바닥에 비친 네온 (칸 단위 위치)
  { x: 4.5, y: 9.6, c: "pink" }, { x: 8.2, y: 8.4, c: "cyan" }, { x: 12.5, y: 10.9, c: "cyan" },
  { x: 18.6, y: 8.6, c: "pink" }, { x: 23.4, y: 11.1, c: "pink" }, { x: 26.5, y: 9.4, c: "cyan" },
];

function emoji(c, ch, x, y, size) {
  c.font = `${size}px ${EMOJI_FONT}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(ch, x, y);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
}

function pill(c, text, x, y, fg, glow, size = 13) {
  c.font = `800 ${size}px "Pretendard","Malgun Gothic",sans-serif`;
  const w = c.measureText(text).width + 16, h = size + 10;
  roundRect(c, x - w / 2, y - h / 2, w, h, h / 2);
  c.fillStyle = eng.P.panel;
  c.fill();
  c.shadowColor = glow;
  c.shadowBlur = 10;
  c.strokeStyle = glow;
  c.lineWidth = 1.5;
  c.stroke();
  c.shadowBlur = 0;
  c.fillStyle = fg;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(text, x, y + 1);
}

function neonText(c, text, x, y, color, size) {
  c.font = `900 ${size}px "Pretendard","Malgun Gothic",sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.shadowColor = color;
  c.shadowBlur = 16;
  c.fillStyle = color;
  c.fillText(text, x, y);
  c.shadowBlur = 6;
  c.fillStyle = eng.P.ink;
  c.globalAlpha = 0.85;
  c.fillText(text, x, y);
  c.globalAlpha = 1;
  c.shadowBlur = 0;
}

// 칸의 네온 색: 방이면 방 색, 문이면 그 방 색, 광장이면 핑크
function neonAt(x, y) {
  const r = zoneAt(x, y);
  if (r) return eng.P.room[r.zone];
  const door = DOORS.find((d) => d.x === x && d.y === y);
  return door ? eng.P.room[door.room.zone] : eng.P.pink;
}
const isSolidTile = (x, y) => tileAt(x, y) === "#" || (tileAt(x, y) === "L" && !vaultOpen());

function buildCache() {
  const P = eng.P;
  const s = Math.min(2, eng.dpr || 1);
  const cv = document.createElement("canvas");
  cv.width = MAP_W * T * s;
  cv.height = MAP_H * T * s;
  const c = cv.getContext("2d");
  c.scale(s, s);
  c.fillStyle = P.bg;
  c.fillRect(0, 0, MAP_W * T, MAP_H * T);

  // 바닥 + 네온 격자
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (isSolidTile(x, y)) continue;
      const X = x * T, Y = y * T;
      c.fillStyle = (x + y) % 2 ? P.floorB : P.floorA;
      c.fillRect(X, Y, T, T);
      const neon = neonAt(x, y);
      c.globalAlpha = zoneAt(x, y) ? 0.09 : 0.04;
      c.fillStyle = neon;
      c.fillRect(X, Y, T, T);
      c.globalAlpha = 0.16;
      c.strokeStyle = neon;
      c.lineWidth = 1;
      c.strokeRect(X + 0.5, Y + 0.5, T - 1, T - 1);
      c.globalAlpha = 1;
      const ch = WORLD_MAP[y][x];
      if (ch === "D" || ch === "L") { // 열린 문: 빛나는 발판
        c.shadowColor = neon;
        c.shadowBlur = 18;
        c.globalAlpha = 0.45;
        c.fillStyle = neon;
        c.fillRect(X + 6, Y + 6, T - 12, T - 12);
        c.globalAlpha = 1;
        c.strokeStyle = neon;
        c.lineWidth = 2;
        c.strokeRect(X + 6, Y + 6, T - 12, T - 12);
        c.shadowBlur = 0;
      }
    }
  }

  // 젖은 바닥에 비친 네온
  PUDDLES.forEach((p) => {
    const cx = p.x * T, cy = p.y * T;
    const g = c.createRadialGradient(cx, cy, 4, cx, cy, T * 1.6);
    g.addColorStop(0, p.c === "pink" ? P.pink : P.cyan);
    g.addColorStop(1, "transparent");
    c.globalAlpha = 0.16;
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(cx, cy, T * 1.7, T * 0.55, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
  });

  // 벽 (위쪽 면을 조금 밝게)
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (!isSolidTile(x, y)) continue;
      const X = x * T, Y = y * T;
      c.fillStyle = P.wall;
      c.fillRect(X, Y, T, T);
      c.fillStyle = P.wallTop;
      c.fillRect(X, Y, T, T * 0.55);
    }
  }

  // 벽과 바닥이 만나는 곳에 네온 테두리
  c.lineWidth = 3;
  c.lineCap = "round";
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (!isSolidTile(x, y)) continue;
      const X = x * T, Y = y * T;
      const edges = [
        [x, y - 1, X, Y + 1.5, X + T, Y + 1.5],
        [x, y + 1, X, Y + T - 1.5, X + T, Y + T - 1.5],
        [x - 1, y, X + 1.5, Y, X + 1.5, Y + T],
        [x + 1, y, X + T - 1.5, Y, X + T - 1.5, Y + T],
      ];
      edges.forEach(([nx, ny, x1, y1, x2, y2]) => {
        if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H || isSolidTile(nx, ny)) return;
        const neon = neonAt(nx, ny);
        c.shadowColor = neon;
        c.shadowBlur = 14;
        c.strokeStyle = neon;
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.stroke();
      });
      if (tileAt(x, y) === "L") { // 잠긴 금고 문: 레이저 빗장
        c.shadowColor = P.pink;
        c.shadowBlur = 12;
        c.strokeStyle = P.pink;
        c.lineWidth = 2;
        [0.25, 0.5, 0.75].forEach((k) => { c.beginPath(); c.moveTo(X + 4, Y + T * k); c.lineTo(X + T - 4, Y + T * k); c.stroke(); });
        c.lineWidth = 3;
        c.shadowBlur = 0;
        emoji(c, "🔒", X + T / 2, Y + T / 2, 22);
      }
    }
  }
  c.shadowBlur = 0;

  // 네온 간판 (방 이름)과 문 앞 안내
  ALL_ROOMS.forEach((r) => {
    const b = ROOM_BOUNDS[r.id];
    if (b) neonText(c, `${r.icon} ${r.name}`, ((b.x0 + b.x1 + 1) / 2) * T, b.y0 * T + 18, P.room[r.zone], 17);
  });
  DOORS.forEach((d) => {
    if (!d.lobby) return;
    const below = d.lobby.y > d.y;
    const locked = d.room.id === FINAL_ROOM.id && !vaultOpen();
    pill(c, `${locked ? "🔒" : d.room.icon} ${d.room.name}`, d.x * T + T / 2, d.lobby.y * T + (below ? 12 : T - 12), P.ink, P.room[d.room.zone], 11);
  });

  eng.cache = { cv, vault: vaultOpen() };
}

function draw(ts) {
  const c = eng.ctx, P = eng.P, W = eng.w, H = eng.h;
  if (!eng.cache || eng.cache.vault !== vaultOpen()) buildCache();
  c.setTransform(eng.dpr, 0, 0, eng.dpr, 0, 0);
  c.fillStyle = P.bg;
  c.fillRect(0, 0, W, H);

  const px = (eng.fx + (eng.x - eng.fx) * eng.t) * T;
  const py = (eng.fy + (eng.y - eng.fy) * eng.t) * T;
  const mw = MAP_W * T, mh = MAP_H * T;
  eng.cam.x = mw <= W ? (mw - W) / 2 : clamp(px + T / 2 - W / 2, 0, mw - W);
  eng.cam.y = mh <= H ? (mh - H) / 2 : clamp(py + T / 2 - H / 2, 0, mh - H);

  c.save();
  c.translate(-Math.round(eng.cam.x), -Math.round(eng.cam.y));
  c.drawImage(eng.cache.cv, 0, 0, mw, mh);

  if (eng.target) {
    c.globalAlpha = 0.6 + Math.sin(ts / 150) * 0.25;
    c.shadowColor = P.cyan;
    c.shadowBlur = 12;
    c.strokeStyle = P.cyan;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(eng.target.x * T + T / 2, eng.target.y * T + T / 2, 14, 0, Math.PI * 2);
    c.stroke();
    c.shadowBlur = 0;
    c.globalAlpha = 1;
  }

  const x0 = Math.floor(eng.cam.x / T) - 1, x1 = Math.ceil((eng.cam.x + W) / T) + 1;
  const y0 = Math.floor(eng.cam.y / T) - 1, y1 = Math.ceil((eng.cam.y + H) / T) + 1;
  const items = THINGS
    .filter((t) => t.x >= x0 && t.x <= x1 && t.y >= y0 && t.y <= y1)
    .map((t) => ({ y: t.y, draw: () => drawThing(c, P, t, ts) }));
  items.push({ y: py / T + 0.01, draw: () => drawPlayer(c, P, px, py, ts) });
  items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

  // 광장 위를 날아다니는 배달 드론
  const loop = (ts / 14000) % 1;
  drawDrone(c, P, (-2 + loop * (MAP_W + 4)) * T, 8.3 * T + Math.sin(ts / 600) * 6, ts, 0.75);
  c.restore();

  drawRain(c, P, W, H, ts);
  // 캐릭터 주변만 밝게 (가장자리는 어둡게)
  const sx = px - eng.cam.x + T / 2, sy = py - eng.cam.y + T / 2;
  const g = c.createRadialGradient(sx, sy, 140, sx, sy, Math.max(W, H) * 0.8);
  g.addColorStop(0, "transparent");
  g.addColorStop(1, P.bg);
  c.globalAlpha = 0.6;
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.globalAlpha = 1;
}

function drawRain(c, P, W, H, ts) {
  if (!eng.rain) {
    eng.rain = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), len: 8 + Math.random() * 14, v: 0.35 + Math.random() * 0.4 }));
  }
  c.strokeStyle = P.cyan;
  c.lineWidth = 1;
  c.globalAlpha = 0.18;
  c.beginPath();
  eng.rain.forEach((d) => {
    const y = ((d.y + (ts / 1000) * d.v) % 1) * (H + 40) - 20;
    const x = d.x * W - (y / H) * 30;
    c.moveTo(x, y);
    c.lineTo(x - 3, y + d.len);
  });
  c.stroke();
  c.globalAlpha = 1;
}

// 사진 속 드론처럼: 네온 테두리 몸체 + 프로펠러 4개 + 아래에 매달린 선물 상자
function drawDrone(c, P, X, Y, ts, k = 1) {
  c.save();
  c.translate(X, Y);
  c.scale(k, k);
  c.lineCap = "round";
  // 팔
  c.strokeStyle = P.panelSolid;
  c.lineWidth = 4;
  [[-24, -12], [24, -12], [-18, -18], [18, -18]].forEach(([ax, ay]) => { c.beginPath(); c.moveTo(0, -6); c.lineTo(ax, ay); c.stroke(); });
  // 프로펠러 (빙글빙글)
  c.shadowColor = P.cyan;
  c.shadowBlur = 12;
  c.strokeStyle = P.cyan;
  c.lineWidth = 2;
  [[-24, -14], [24, -14], [-18, -20], [18, -20]].forEach(([ax, ay], i) => {
    c.beginPath();
    c.ellipse(ax, ay, 11 * Math.abs(Math.cos(ts / 45 + i)), 2.5, 0, 0, Math.PI * 2);
    c.stroke();
  });
  // 몸체
  roundRect(c, -15, -13, 30, 14, 5);
  c.fillStyle = P.panelSolid;
  c.fill();
  c.stroke();
  // 카메라 렌즈 + 깜빡이는 핑크 LED
  c.shadowColor = P.pink;
  c.fillStyle = P.pink;
  if (Math.floor(ts / 400) % 2) {
    [[-24, -9], [24, -9]].forEach(([lx, ly]) => { c.beginPath(); c.arc(lx, ly, 2.5, 0, Math.PI * 2); c.fill(); });
  }
  c.beginPath();
  c.arc(0, -6, 3, 0, Math.PI * 2);
  c.fill();
  // 줄 + 선물 상자
  c.shadowColor = P.cyan;
  c.strokeStyle = P.cyan;
  c.lineWidth = 1;
  c.beginPath(); c.moveTo(-6, 1); c.lineTo(-6, 7); c.moveTo(6, 1); c.lineTo(6, 7); c.stroke();
  c.shadowBlur = 0;
  emoji(c, "🎁", 0, 17, 22);
  c.restore();
}

function drawThing(c, P, t, ts) {
  const X = t.x * T + T / 2, Y = t.y * T + T / 2;
  if (t.kind === "decor") { emoji(c, t.icon, X, Y, 28); return; }
  const bob = Math.sin(ts / 260 + t.x) * 3;

  if (eng.near === t) {
    c.shadowColor = P.cyan;
    c.shadowBlur = 14;
    c.strokeStyle = P.cyan;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(X, Y, 24 + Math.sin(ts / 200) * 2, 0, Math.PI * 2);
    c.stroke();
    c.shadowBlur = 0;
  }

  if (t.kind === "npc") {
    if (t.drone) drawDrone(c, P, X, Y - 4 + Math.sin(ts / 500) * 4, ts);
    else emoji(c, t.icon, X, Y + Math.sin(ts / 500) * 1.5, 36);
    pill(c, t.name, X, Y - 40, P.ink, P.pink, 11);
    emoji(c, "💬", X + 30, Y - 56 + bob, 18);
    return;
  }

  // 문제 물건: 방 색으로 빛나는 받침
  const neon = P.room[t.room.zone];
  const done = !!game.done[pkey(t.room.id, t.idx)];
  c.shadowColor = neon;
  c.shadowBlur = done ? 6 : 18;
  c.globalAlpha = done ? 0.25 : 0.55;
  c.fillStyle = neon;
  c.beginPath();
  c.ellipse(X, Y + 15, 18, 6, 0, 0, Math.PI * 2);
  c.fill();
  c.shadowBlur = 0;
  c.globalAlpha = done ? 0.45 : 1;
  emoji(c, t.icon, X, Y, 32);
  c.globalAlpha = 1;
  if (done) emoji(c, "✅", X + 15, Y - 15, 16);
  else {
    c.shadowColor = P.pink;
    c.shadowBlur = 12;
    emoji(c, "❗", X, Y - 30 + bob, 20);
    c.shadowBlur = 0;
  }
}

function drawPlayer(c, P, px, py, ts) {
  const X = px + T / 2, Y = py + T / 2;
  const moving = eng.t < 1;
  const bob = moving ? -Math.abs(Math.sin(ts / 70)) * 5 : Math.sin(ts / 400) * 1.5;
  c.shadowColor = P.cyan;
  c.shadowBlur = 16;
  c.globalAlpha = 0.45;
  c.fillStyle = P.cyan;
  c.beginPath();
  c.ellipse(X, Y + 16, 15 - (moving ? 2 : 0), 5, 0, 0, Math.PI * 2);
  c.fill();
  c.shadowBlur = 0;
  c.globalAlpha = 1;
  c.save();
  if (eng.dir === "left") { c.translate(X, 0); c.scale(-1, 1); c.translate(-X, 0); }
  emoji(c, game.avatar, X, Y - 4 + bob, 36);
  c.restore();
  pill(c, game.name, X, Y - 34 + bob, P.ink, P.cyan, 12);
}

/* =========================================================
   결과 화면 · 결과 코드
   ========================================================= */
function endHTML() {
  const rec = gameToRecord(game);
  const code = encodeRecord(rec);
  const title = game.escaped ? "탈출 성공!" : ui.timeUp ? "시간이 다 됐어요!" : "도전 완료!";
  const emo = game.escaped ? "🎉" : ui.timeUp ? "⏰" : "🏳️";
  return `
  <section class="card end-hero">
    <div class="end-emoji">${emo}</div>
    <h1>${title}</h1>
    <p><b>${game.avatar} ${esc(rec.name)}</b>${rec.members ? ` (${esc(rec.members)})` : ""} 탐험대, 정말 멋졌어요!</p>
    <div class="stats">
      <div class="stat"><b>${rec.roomsCleared}/${ROOMS.length}</b><small>🔑 열쇠</small></div>
      <div class="stat"><b>${fmtTime(rec.seconds)}</b><small>⏱ 걸린 시간</small></div>
      <div class="stat"><b>${rec.hints}</b><small>💡 힌트</small></div>
      <div class="stat"><b>${rec.wrong}</b><small>❌ 틀린 횟수</small></div>
      <div class="stat score"><b>${fmtNum(rec.score)}</b><small>⭐ 점수</small></div>
    </div>
  </section>
  <section class="grid-2">
    <div class="card">
      <h3>🌏 우리가 만든 SDGs 프로그램</h3>
      <p class="muted">발표한 작품 이름을 적으면 결과 화면과 상장에 함께 나와요.</p>
      <input id="projectInput" maxlength="40" placeholder="예: 분리수거 도우미 로봇" value="${esc(game.project)}" autocomplete="off">
      <div class="btn-row" style="margin-top:12px"><button class="btn accent2" data-action="save-project">💾 저장</button></div>
    </div>
    ${game.classCode ? `
    <div class="card">
      <h3>📡 선생님 화면으로 전송 <span class="tag">수업 코드 ${esc(game.classCode)}</span></h3>
      <p class="sync-state" id="syncState">${syncHTML()}</p>
      <details class="manual">
        <summary>인터넷이 안 될 때만: 결과 코드</summary>
        <div class="code-box" style="margin-top:10px"><code id="resultCode">${esc(code)}</code><button class="btn primary" data-action="copy-code">📋 복사</button></div>
      </details>
    </div>` : `
    <div class="card">
      <h3>📮 결과 코드</h3>
      <p class="muted">수업 코드 없이 했어요. 이 컴퓨터에는 자동으로 저장됐고, 다른 컴퓨터라면 이 코드를 복사해서 선생님께 보내 주세요!</p>
      <div class="code-box"><code id="resultCode">${esc(code)}</code><button class="btn primary" data-action="copy-code">📋 복사</button></div>
    </div>`}
  </section>
  <div class="btn-row center">
    <button class="btn primary big" data-action="new-player">🔄 다음 탐험대 시작</button>
    <a class="btn ghost" href="#awards">🏆 시상·결과 화면 (선생님)</a>
  </div>`;
}

// 다른 기기 → 선생님 기기로 결과 모으기
function checksum(s) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 1296;
  return h.toString(36).padStart(2, "0");
}
function encodeRecord(r) {
  const o = { i: r.id, n: r.name, m: r.members, c: r.roomsCleared, e: r.escaped ? 1 : 0, t: r.seconds, h: r.hints, w: r.wrong, v: r.reveals, x: r.solved, s: r.score, p: r.project, d: r.date };
  const b = btoa(unescape(encodeURIComponent(JSON.stringify(o))));
  return `PY-${b}-${checksum(b)}`;
}
function decodeRecord(code) {
  const m = /^PY-([A-Za-z0-9+/=]+)-([0-9a-z]{2})$/.exec(code);
  if (!m || checksum(m[1]) !== m[2]) return null;
  try {
    const o = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
    if (!o.i || !o.n) return null;
    return {
      id: String(o.i), name: String(o.n).slice(0, 20), members: String(o.m || "").slice(0, 40),
      roomsCleared: +o.c || 0, escaped: !!o.e, seconds: +o.t || 0, hints: +o.h || 0, wrong: +o.w || 0,
      reveals: +o.v || 0, solved: +o.x || 0, score: +o.s || 0, project: String(o.p || "").slice(0, 40), date: o.d || "",
    };
  } catch { return null; }
}

/* =========================================================
   순위 · 시상 · 선생님 화면
   ========================================================= */
const SPECIAL_RULES = {
  fastest: { filter: (r) => r.escaped, sort: (a, b) => a.seconds - b.seconds },
  fewestHints: { filter: (r) => r.escaped, sort: (a, b) => a.hints - b.hints || b.score - a.score },
  fewestWrong: { filter: (r) => r.escaped, sort: (a, b) => a.wrong - b.wrong || b.score - a.score },
  mostTries: { filter: (r) => r.wrong > 0, sort: (a, b) => b.wrong - a.wrong || b.roomsCleared - a.roomsCleared },
};

function rankRecords(list) {
  return [...list].sort((a, b) =>
    (b.escaped - a.escaped) || (b.roomsCleared - a.roomsCleared) || (b.score - a.score) || (a.seconds - b.seconds));
}

function computeAwards(list) {
  const ranked = rankRecords(list);
  const awards = new Map();
  ranked.slice(0, TOP_AWARDS.length).forEach((r, i) => awards.set(r.id, { ...TOP_AWARDS[i], kind: "top", place: i + 1 }));
  for (const sp of SPECIAL_AWARDS) {
    const rule = SPECIAL_RULES[sp.rule];
    const winner = ranked.filter(rule.filter).sort(rule.sort).find((r) => !awards.has(r.id));
    if (winner) awards.set(winner.id, { ...sp, kind: "special" });
  }
  let c = 0;
  ranked.forEach((r) => { if (!awards.has(r.id)) awards.set(r.id, { ...CHEER_AWARDS[c++ % CHEER_AWARDS.length], kind: "cheer" }); });
  ranked.forEach((r) => { if (r.awardOverride) awards.set(r.id, { ...awards.get(r.id), name: r.awardOverride }); });
  return { ranked, awards };
}

const recordLine = (r) => [
  `🔑 열쇠 ${r.roomsCleared}/${ROOMS.length}`,
  r.escaped ? "🎉 탈출 성공" : "도전 완료",
  `⏱ ${fmtTime(r.seconds)}`,
  `⭐ ${fmtNum(r.score)}점`,
].join(" · ");

function awardsHTML() {
  const link = studentLink();
  return `
  <section class="card awards-head">
    <div>
      <span class="badge">👩‍🏫 선생님 화면</span>
      <h1>🏆 시상 & 결과 공유</h1>
      <p class="muted" id="countLine">${countLine()}</p>
    </div>
    <div class="btn-row">
      <button class="btn primary big" data-action="ceremony">🎬 시상식 시작</button>
      <button class="btn accent2 big" data-action="share-board">📺 결과 공유 화면</button>
    </div>
  </section>

  ${ONLINE_ON ? `
  <section class="card live-card">
    <div class="live-head">
      <div>
        <h3>📡 실시간 수업방</h3>
        <p class="muted">학생들이 아래 링크로 들어오거나 시작 화면에 수업 코드를 넣으면, 문제를 풀 때마다 여기에 바로 나타나요. 결과 코드를 복사할 필요가 없어요!</p>
      </div>
      <div class="class-code"><small>수업 코드</small><b>${esc(settings.classCode)}</b></div>
    </div>
    <div class="link-row">
      <input id="studentLink" readonly value="${esc(link)}" aria-label="학생용 링크">
      <button class="btn primary" data-action="copy-link">🔗 학생용 링크 복사</button>
      <button class="btn ghost" data-action="new-class">🔄 새 수업 코드</button>
    </div>
    <p class="live-status" id="liveStatus">${liveStatusHTML()}</p>
  </section>` : ""}

  <div id="liveArea">${liveAreaHTML()}</div>

  <section class="grid-2">
    <div class="card">
      <h3>⚙️ 수업 정보 (상장에 들어가요)</h3>
      <label>수업 이름<input data-setting="className" value="${esc(settings.className)}"></label>
      <label>날짜<input type="date" data-setting="date" value="${esc(settings.date)}"></label>
      <label>주는 사람 (선생님 / 기관)<input data-setting="teacher" value="${esc(settings.teacher)}" placeholder="예: 코딩 선생님 홍길동"></label>
      <label>게임 제한 시간 (분, 0 = 제한 없음)<input type="number" min="0" max="180" data-setting="limitMin" value="${settings.limitMin}"></label>
    </div>
    <div class="card">
      <h3>📥 인터넷 없이 모으기 (예비용)</h3>
      <p class="muted">이 컴퓨터에서 플레이한 기록은 자동으로 모여요. 수업 코드 없이 다른 기기에서 했다면 <b>결과 코드</b>를 붙여 넣으세요.</p>
      <textarea id="codeInput" rows="3" placeholder="PY-....-xx"></textarea>
      <div class="btn-row" style="margin-top:10px"><button class="btn primary" data-action="add-codes">➕ 결과 코드 추가</button></div>
      <details class="manual">
        <summary>✍️ 직접 입력하기 (종이로 푼 팀 등)</summary>
        <div class="manual-grid">
          <label>이름/팀<input id="mName" maxlength="20"></label>
          <label>함께한 친구<input id="mMembers" maxlength="40"></label>
          <label>열쇠 수 (0~${ROOMS.length})<input id="mKeys" type="number" min="0" max="${ROOMS.length}" value="${ROOMS.length}"></label>
          <label>걸린 시간 (분)<input id="mMin" type="number" min="0" step="0.5" value="20"></label>
          <label>힌트 횟수<input id="mHints" type="number" min="0" value="0"></label>
          <label>틀린 횟수<input id="mWrong" type="number" min="0" value="0"></label>
        </div>
        <label class="check"><input id="mEscaped" type="checkbox" checked> 탈출 성공</label>
        <button class="btn" data-action="add-manual">➕ 추가</button>
      </details>
    </div>
  </section>

  <details class="card answer-key">
    <summary>🔑 정답지 (선생님용)</summary>
    ${ALL_ROOMS.map((r) => `<h4>${r.icon} ${esc(r.name)} · ${esc(r.topic)}${r.key != null ? ` · 열쇠 ${r.key}` : ""}</h4>
      <ol>${r.puzzles.map((p) => `<li>${p.obj} ${esc(p.q)} → <b>${esc(answerText(p)).replace(/\n/g, " / ")}</b></li>`).join("")}</ol>`).join("")}
  </details>`;
}

function countLine() {
  const done = doneRecords();
  const playing = playingRecords().length;
  return `참가 ${done.length + playing}팀 · 탐험 중 ${playing}팀 · 탈출 성공 ${done.filter((r) => r.escaped).length}팀 · 모든 참가자가 상을 하나씩 받아요!`;
}

function liveStatusHTML() {
  if (!online.at) return "⏳ 연결하는 중…";
  const t = new Date(online.at);
  const time = `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
  return online.error
    ? `🔴 연결이 잠깐 끊겼어요 (${time}) — 인터넷을 확인해 주세요. 자동으로 다시 시도해요.`
    : `🟢 실시간 연결됨 · ${ONLINE.refreshSec}초마다 자동 새로고침 · 마지막 ${time}`;
}

// 진행 중인 팀 + 순위표 (몇 초마다 이 부분만 다시 그려요)
function liveAreaHTML() {
  const playing = playingRecords().sort((a, b) => b.roomsCleared - a.roomsCleared || b.score - a.score);
  const { ranked, awards } = computeAwards(doneRecords());
  const n = ranked.length;
  const dis = n ? "" : "disabled";
  const rows = ranked.map((r, i) => {
    const a = awards.get(r.id);
    return `<tr>
      <td><span class="rank-badge rank-${i + 1}">${i + 1}</span></td>
      <td><b>${r.avatar ? `${r.avatar} ` : ""}${esc(r.name)}</b>${r.members ? `<br><small class="muted">${esc(r.members)}</small>` : ""}</td>
      <td>${a.icon} <input class="award-edit" data-id="${esc(r.id)}" value="${esc(r.awardOverride || "")}" placeholder="${esc(a.name)}" title="비워 두면 자동으로 정해진 상이 들어가요"></td>
      <td class="num">${r.roomsCleared}/${ROOMS.length}</td>
      <td>${r.escaped ? "🎉" : "—"}</td>
      <td class="num">${fmtTime(r.seconds)}</td>
      <td class="num">${r.hints}</td>
      <td class="num">${r.wrong}</td>
      <td class="num"><b>${fmtNum(r.score)}</b></td>
      <td class="wrap">${esc(r.project || "")}</td>
      <td><div class="btn-row">
        <button class="btn small" data-action="cert" data-id="${esc(r.id)}" title="상장 보기">📜</button>
        <button class="btn small danger" data-action="del-record" data-id="${esc(r.id)}" title="목록에서 빼기">✖</button>
      </div></td>
    </tr>`;
  }).join("");

  return `
  ${playing.length ? `
  <section class="card">
    <h3>🎮 지금 탐험 중 (${playing.length}팀)</h3>
    <div class="playing-grid">
      ${playing.map((r) => `
      <div class="playing-card">
        <span class="pc-avatar">${r.avatar || "🧒"}</span>
        <div class="pc-body">
          <b>${esc(r.name)}</b>
          <div class="pc-bar"><span style="width:${Math.round((r.roomsCleared / ROOMS.length) * 100)}%"></span></div>
          <small>🔑 ${r.roomsCleared}/${ROOMS.length} · ✅ ${r.solved}문제 · ⭐ ${fmtNum(r.score)}</small>
        </div>
        <button class="btn small ghost" data-action="del-record" data-id="${esc(r.id)}" title="목록에서 빼기">✖</button>
      </div>`).join("")}
    </div>
  </section>` : ""}

  <section class="card">
    <div class="table-head">
      <h3>📊 순위표 (탐험을 마친 팀)</h3>
      <div class="btn-row">
        <button class="btn small" data-action="copy-text" ${dis}>📋 결과 텍스트 복사</button>
        <button class="btn small" data-action="csv" ${dis}>⬇️ CSV(엑셀)</button>
        <button class="btn small" data-action="print-table" ${dis}>🖨 결과표 인쇄</button>
        <button class="btn small" data-action="print-certs" ${dis}>🖨 상장 전체 인쇄</button>
        <button class="btn small danger" data-action="reset-all" ${dis}>🗑 전체 초기화</button>
      </div>
    </div>
    ${n ? `<div class="table-wrap"><table>
      <thead><tr><th>순위</th><th>이름/팀</th><th>상 (고쳐 쓸 수 있어요)</th><th>열쇠</th><th>탈출</th><th>시간</th><th>힌트</th><th>오답</th><th>점수</th><th>SDGs 프로젝트</th><th></th></tr></thead>
      <tbody>${rows}</tbody></table></div>`
    : `<div class="empty">아직 탐험을 마친 팀이 없어요. 학생들이 탈출하면 여기에 바로 나타나요! 🐍</div>`}
  </section>`;
}

let lastLiveHTML = "";
function refreshLive() {
  if (ui.screen !== "awards") return;
  const status = $("#liveStatus");
  if (status) status.innerHTML = liveStatusHTML();
  const count = $("#countLine");
  if (count) count.textContent = countLine();
  const area = $("#liveArea");
  if (!area) return;
  if (area.contains(document.activeElement) && document.activeElement.tagName === "INPUT") return; // 상 이름을 고치는 중이면 기다려요
  const html = liveAreaHTML();
  if (html === lastLiveHTML) return;
  lastLiveHTML = html;
  area.innerHTML = html;
}

function summaryText() {
  const { ranked, awards } = computeAwards(doneRecords());
  const lines = [
    `🐍 ${GAME.title} 결과`,
    `📚 ${settings.className} · ${fmtDateKo(settings.date)}`,
    `👥 참가 ${ranked.length}팀 · 🎉 탈출 성공 ${ranked.filter((r) => r.escaped).length}팀`,
    "",
    "🏆 순위",
    ...ranked.map((r, i) => `${i + 1}. ${r.name}${r.members ? ` (${r.members})` : ""} — ${fmtNum(r.score)}점 · ${r.escaped ? `탈출 ${fmtTime(r.seconds)}` : `열쇠 ${r.roomsCleared}/${ROOMS.length}`}`),
    "",
    "🎖️ 상장",
    ...ranked.map((r) => { const a = awards.get(r.id); return `${a.icon} ${a.name} — ${r.name}`; }),
  ];
  const projects = ranked.filter((r) => r.project);
  if (projects.length) lines.push("", "🌏 우리가 만든 SDGs 프로그램", ...projects.map((r) => `· ${r.name}: ${r.project}`));
  lines.push("", "모두 정말 멋졌어요! 👏 파이썬으로 지구를 지키는 개발자가 되어 볼까요? 🌏");
  return lines.join("\n");
}

function downloadCSV() {
  const { ranked, awards } = computeAwards(doneRecords());
  const head = ["순위", "이름/팀", "함께한 친구", "상", "열쇠", "탈출", "시간", "힌트", "오답", "점수", "SDGs 프로젝트", "날짜"];
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = ranked.map((r, i) => [i + 1, r.name, r.members, awards.get(r.id).name, `${r.roomsCleared}/${ROOMS.length}`,
    r.escaped ? "성공" : "", fmtTime(r.seconds), r.hints, r.wrong, r.score, r.project, r.date]);
  const csv = "﻿" + [head, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `파이썬방탈출_결과_${settings.date}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ── 상장 ──
function certHTML(r, a, no) {
  return `
  <div class="cert"><div class="cert-frame">
    <div class="cert-no">제 ${no} 호</div>
    <div class="cert-title">상장</div>
    <div class="cert-award">${a.icon} ${esc(a.name)}</div>
    <div class="cert-name">${esc(r.name)}${r.members ? `<small>${esc(r.members)}</small>` : ""}</div>
    <p class="cert-body">${esc(CERT_TEXT.replace("{REASON}", a.reason))}</p>
    <div class="cert-record">${esc(recordLine(r))}${r.project ? ` · 🌏 ${esc(r.project)}` : ""}</div>
    <div class="cert-date">${fmtDateKo(settings.date)}</div>
    <div class="cert-from">${esc(settings.className)}${settings.teacher ? `<br>${esc(settings.teacher)}` : ""}</div>
  </div></div>`;
}

function allCertsHTML(onlyId) {
  const { ranked, awards } = computeAwards(doneRecords());
  return ranked.map((r, i) => (!onlyId || r.id === onlyId) ? certHTML(r, awards.get(r.id), i + 1) : "").join("");
}

function printHTML(html, mode = "") {
  const area = $("#print-area");
  area.innerHTML = html;
  area.className = mode;
  document.body.classList.add("printing");
  setTimeout(() => window.print(), 80);
}
window.addEventListener("afterprint", () => {
  document.body.classList.remove("printing");
  $("#print-area").innerHTML = "";
});

function openCert(id) {
  const modal = $("#modal");
  modal.innerHTML = `
  <div class="modal-box">
    ${allCertsHTML(id)}
    <div class="btn-row center">
      <button class="btn primary" data-action="print-one" data-id="${esc(id)}">🖨 이 상장 인쇄</button>
      <button class="btn" data-action="close-modal">닫기</button>
    </div>
  </div>`;
  modal.hidden = false;
}

// ── 시상식 ──
function openCeremony(boardOnly) {
  const { ranked, awards } = computeAwards(doneRecords());
  const steps = [];
  if (!boardOnly) {
    steps.push({ type: "title" });
    SPECIAL_AWARDS.forEach((sp) => {
      const r = ranked.find((x) => awards.get(x.id).kind === "special" && awards.get(x.id).id === sp.id);
      if (r) steps.push({ type: "award", rec: r });
    });
    [3, 2, 1].forEach((place) => { const r = ranked[place - 1]; if (r) steps.push({ type: "award", rec: r, place }); });
  }
  steps.push({ type: "board" });
  cer = { steps, i: 0, revealed: false, ranked, awards };
  $("#ceremony").hidden = false;
  document.body.classList.add("no-scroll");
  document.documentElement.requestFullscreen?.().catch(() => {});
  renderCeremony();
  if (boardOnly) confetti(50);
}

function closeCeremony() {
  cer = null;
  $("#ceremony").hidden = true;
  document.body.classList.remove("no-scroll");
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
}

function ceremonyNext() {
  const step = cer.steps[cer.i];
  if (step.type === "award" && !cer.revealed) {
    cer.revealed = true;
    beep(step.place === 1 ? "win" : "key");
    confetti(step.place === 1 ? 90 : 45);
  } else if (cer.i < cer.steps.length - 1) {
    cer.i++;
    cer.revealed = false;
    if (cer.steps[cer.i].type === "board") confetti(60);
  }
  renderCeremony();
}

function ceremonyPrev() {
  if (cer.i > 0) { cer.i--; cer.revealed = true; renderCeremony(); }
}

function renderCeremony() {
  const step = cer.steps[cer.i];
  let stage;
  if (step.type === "title") {
    stage = `<div class="cer-stage" data-action="cer-next"><div>
      <div class="cer-emoji">🏆</div>
      <h1>${esc(GAME.title)} 시상식</h1>
      <p class="cer-desc">${esc(settings.className)} · ${fmtDateKo(settings.date)}</p>
      <p class="cer-tip">화면을 누르거나 → 키를 누르면 시작해요</p>
    </div></div>`;
  } else if (step.type === "award") {
    const r = step.rec;
    const a = cer.awards.get(r.id);
    const placeTxt = step.place ? `${step.place}등 · ` : "";
    stage = `<div class="cer-stage ${step.place ? `cer-place-${step.place}` : ""}" data-action="cer-next"><div>
      <div class="cer-emoji">${a.icon}</div>
      <h2>${placeTxt}${esc(a.name)}</h2>
      <p class="cer-desc">${esc(a.desc)}</p>
      ${cer.revealed
        ? `<div class="cer-name">${esc(r.name)}</div>
           <p class="cer-meta">${r.members ? `${esc(r.members)} · ` : ""}${esc(recordLine(r))}</p>`
        : `<div class="cer-drum">두구두구두구… 🥁</div>`}
    </div></div>`;
  } else {
    stage = boardHTML();
  }
  $("#ceremony").innerHTML = `${stage}
  <div class="cer-nav">
    <button class="btn small" data-action="cer-prev" ${cer.i === 0 ? "disabled" : ""}>◀ 이전</button>
    <span>${cer.i + 1} / ${cer.steps.length}</span>
    <button class="btn small" data-action="cer-next" ${step.type === "board" ? "disabled" : ""}>다음 ▶</button>
    <button class="btn small" data-action="cer-close">✖ 닫기</button>
  </div>`;
}

function boardHTML() {
  const { ranked, awards } = cer;
  const medals = ["🥇", "🥈", "🥉"];
  const podium = [2, 1, 3].map((place) => {
    const r = ranked[place - 1];
    if (!r) return `<div class="podium-col"></div>`;
    return `<div class="podium-col p${place}">
      <span class="medal">${medals[place - 1]}</span>
      <span class="podium-name">${esc(r.name)}</span>
      <span class="podium-score">${fmtNum(r.score)}점 · ${r.escaped ? fmtTime(r.seconds) : `🔑${r.roomsCleared}`}</span>
      <div class="podium-block">${place}</div>
    </div>`;
  }).join("");
  const cards = ranked.map((r, i) => {
    const a = awards.get(r.id);
    return `<div class="board-card kind-${a.kind}">
      <span class="bc-rank">#${i + 1}</span>
      <span class="bc-icon">${a.icon}</span>
      <b>${esc(r.name)}</b>
      <small>${esc(a.name)}</small>
      <span class="bc-meta">${r.escaped ? `🎉 ${fmtTime(r.seconds)}` : `🔑 ${r.roomsCleared}/${ROOMS.length}`} · ⭐ ${fmtNum(r.score)}</span>
      ${r.project ? `<span class="bc-project">🌏 ${esc(r.project)}</span>` : ""}
    </div>`;
  }).join("");
  const escaped = ranked.filter((r) => r.escaped).length;
  return `<div class="board">
    <h1>🏆 ${esc(GAME.title)} 최종 결과</h1>
    <p>${esc(settings.className)} · ${fmtDateKo(settings.date)} · 참가 ${ranked.length}팀 · 탈출 성공 ${escaped}팀</p>
    <div class="podium">${podium}</div>
    <div class="board-grid">${cards}</div>
    <div class="btn-row center">
      <button class="btn accent2" data-action="copy-text">📋 결과 텍스트 복사</button>
      <button class="btn warn" data-action="print-certs">🖨 상장 인쇄</button>
    </div>
  </div>`;
}

// ── 효과 ──
function shuffleIdx(n) {
  const a = [...Array(n).keys()];
  do {
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  } while (n > 1 && a.every((v, i) => v === i));
  return a;
}

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2400);
}

function confetti(n = 30) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const list = ["🎉", "⭐", "🔑", "🐍", "🌏", "✨", "🎊", "🌱"];
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    s.className = "confetti";
    s.textContent = list[i % list.length];
    s.style.left = `${Math.random() * 100}vw`;
    s.style.fontSize = `${16 + Math.random() * 20}px`;
    s.style.animationDelay = `${Math.random() * 0.7}s`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 3600);
  }
}

let audioCtx;
function beep(type) {
  if (!soundOn) return;
  const notes = { ok: [523, 659, 784], soft: [440, 523], bad: [233, 185], key: [523, 659, 784, 1047], win: [523, 659, 784, 1047, 784, 1047] }[type];
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    notes.forEach((f, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type === "bad" ? "sawtooth" : "triangle";
      o.frequency.value = f;
      const t = audioCtx.currentTime + i * 0.11;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(type === "bad" ? 0.06 : 0.14, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      o.connect(g).connect(audioCtx.destination);
      o.start(t);
      o.stop(t + 0.28);
    });
  } catch { /* 소리 미지원 */ }
}

async function copyText(text, okMsg) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  toast(okMsg);
}

function applyTheme() {
  document.documentElement.dataset.theme = theme;
  $("#themeBtn").textContent = theme === "dark" ? "☀️" : "🌙";
  if (eng.on) readPalette();
}
function applySound() {
  $("#soundBtn").textContent = soundOn ? "🔊" : "🔇";
}

/* =========================================================
   버튼 · 키보드
   ========================================================= */
const ACTIONS = {
  "go-home": () => { if (location.hash) history.replaceState(null, "", location.pathname + location.search); go("home"); },
  theme: () => { theme = theme === "dark" ? "light" : "dark"; save(STORE.theme, theme); applyTheme(); },
  sound: () => { soundOn = !soundOn; save(STORE.sound, soundOn); applySound(); if (soundOn) beep("ok"); },

  "pick-avatar": (el) => {
    ui.avatar = el.dataset.a;
    document.querySelectorAll(".avatar").forEach((b) => b.classList.toggle("on", b === el));
  },
  start: () => {
    const name = $("#playerName").value.trim();
    if (!name) { toast("이름이나 팀 이름을 적어 주세요! ✏️"); $("#playerName").focus(); return; }
    if (game && !game.finished && !confirm(`${game.name} 탐험대가 아직 탈출 중이에요. 새로 시작할까요?\n(지금 기록은 결과에 저장돼요)`)) return;
    const cls = ONLINE_ON ? normClass($("#classInput").value) : "";
    if (cls && !validClass(cls)) { toast("수업 코드는 영어·숫자 4글자 이상이에요. 모르면 비워 두세요!"); $("#classInput").focus(); return; }
    save(STORE.classCode, cls);
    if (game && !game.finished) finishGame(false);
    newGame(name, $("#playerMembers").value.trim(), ui.avatar, cls);
    pushProgress();
    ui.timeUp = false; ui.justSolved = null; ui.active = null; ui.shuffles = {}; resetPuzzleUI();
    beep("key");
    go("play");
    openDialog(NPCS[0]); // 시작할 때 드론이 안내해요
  },
  resume: () => go("play"),

  interact: () => interact(eng.near),
  "dialog-next": () => dialogNext(),
  "close-puzzle": () => closePuzzle(),
  "see-result": () => { ui.active = null; ui.justSolved = null; $("#pmodal").hidden = true; go("end"); },

  choose: (el) => { ui.selected = Number(el.dataset.i); renderPuzzle(); },
  "order-pick": (el) => { ui.order.push(Number(el.dataset.i)); renderPuzzle(); },
  "order-back": (el) => { ui.order = ui.order.filter((i) => i !== Number(el.dataset.i)); renderPuzzle(); },
  "order-reset": () => { ui.order = []; renderPuzzle(); },
  check: () => checkAnswer(),
  hint: () => {
    const { room, idx } = currentPuzzle();
    const ps = pstate(pkey(room.id, idx));
    if (!ps.hint) { ps.hint = true; game.hints++; saveGame(); }
    renderPuzzle();
    renderHud();
  },
  reveal: () => { if (confirm("정답을 볼까요? 이 문제는 점수를 받을 수 없어요.")) solvePuzzle(true); },
  "give-up": () => {
    if (!confirm("지금까지의 기록으로 결과를 볼까요?\n(이어서 할 수 없어요)")) return;
    finishGame(false);
    go("end");
  },

  "save-project": () => {
    game.project = $("#projectInput").value.trim();
    saveGame();
    upsertRecord(gameToRecord(game));
    pushProgress();
    render();
    toast("저장했어요! 🌏");
  },
  "retry-sync": () => pushProgress(),
  "copy-code": () => copyText($("#resultCode").textContent, "결과 코드를 복사했어요! 선생님께 보내 주세요 📮"),
  "new-player": () => {
    game = null;
    try { localStorage.removeItem(STORE.current); } catch { /* 무시 */ }
    ui.timeUp = false; ui.justSolved = null; ui.shuffles = {}; resetPuzzleUI();
    go("home");
    $("#playerName")?.focus();
  },

  // 선생님 화면
  "add-codes": () => {
    const text = $("#codeInput").value;
    const codes = text.match(/PY-[A-Za-z0-9+/=]+-[0-9a-z]{2}/g) || [];
    let added = 0, updated = 0, bad = 0;
    codes.forEach((c) => {
      const rec = decodeRecord(c);
      if (!rec) { bad++; return; }
      if (upsertRecord(rec)) added++; else updated++;
    });
    if (!codes.length) { toast("결과 코드를 찾지 못했어요. PY- 로 시작하는 코드를 붙여 넣어 주세요."); return; }
    render();
    toast(`추가 ${added}개 · 갱신 ${updated}개${bad ? ` · 잘못된 코드 ${bad}개` : ""}`);
  },
  "add-manual": () => {
    const name = $("#mName").value.trim();
    if (!name) { toast("이름/팀을 적어 주세요!"); return; }
    const escaped = $("#mEscaped").checked;
    const keys = escaped ? ROOMS.length : Math.min(ROOMS.length, Math.max(0, parseInt($("#mKeys").value, 10) || 0));
    const seconds = Math.round((parseFloat($("#mMin").value) || 0) * 60);
    const hints = Math.max(0, parseInt($("#mHints").value, 10) || 0);
    const wrong = Math.max(0, parseInt($("#mWrong").value, 10) || 0);
    const solved = ROOMS.slice(0, keys).reduce((s, r) => s + r.puzzles.length, 0) + (escaped ? FINAL_ROOM.puzzles.length : 0);
    upsertRecord({
      id: uid(), name, members: $("#mMembers").value.trim(), roomsCleared: keys, escaped, seconds, hints, wrong,
      reveals: 0, solved, score: calcScore({ solved, wrong, hints, escaped, seconds }), project: "", date: settings.date,
    });
    render();
    toast(`${name} 기록을 추가했어요!`);
  },
  "del-record": (el) => {
    const r = allRecords().find((x) => x.id === el.dataset.id);
    if (!r || !confirm(`${r.name} 기록을 목록에서 뺄까요?`)) return;
    records = records.filter((x) => x.id !== r.id);
    save(STORE.records, records);
    if (!settings.hidden.includes(r.id)) settings.hidden.push(r.id);
    save(STORE.settings, settings);
    render();
  },
  "reset-all": () => {
    if (!confirm("순위표를 모두 비울까요? 되돌릴 수 없어요.\n(이 기기 기록은 지우고, 온라인 기록은 화면에서 숨겨요. 먼저 CSV로 저장해 두면 안전해요)")) return;
    allRecords().forEach((r) => { if (!settings.hidden.includes(r.id)) settings.hidden.push(r.id); });
    records = [];
    save(STORE.records, records);
    save(STORE.settings, settings);
    render();
    toast("순위표를 비웠어요.");
  },
  "copy-link": () => copyText(studentLink(), "학생용 링크를 복사했어요! 단톡방·클래스룸에 붙여 넣으세요 🔗"),
  "new-class": () => {
    if (!confirm("새 수업 코드를 만들까요?\n지금 코드로 모인 기록은 이 화면에서 사라져요. (CSV로 먼저 저장해 두세요)")) return;
    settings.classCode = newClassCode();
    save(STORE.settings, settings);
    online.list = [];
    online.at = 0;
    render();
    toast(`새 수업 코드: ${settings.classCode}`);
  },
  cert: (el) => openCert(el.dataset.id),
  "close-modal": () => { $("#modal").hidden = true; },
  "print-one": (el) => printHTML(allCertsHTML(el.dataset.id)),
  "print-certs": () => printHTML(allCertsHTML()),
  "print-table": () => {
    const { ranked, awards } = computeAwards(doneRecords());
    printHTML(`
      <h2>🐍 ${esc(GAME.title)} 결과 — ${esc(settings.className)} (${fmtDateKo(settings.date)})</h2>
      <table><thead><tr><th>순위</th><th>이름/팀</th><th>상</th><th>열쇠</th><th>탈출</th><th>시간</th><th>힌트</th><th>오답</th><th>점수</th><th>SDGs 프로젝트</th></tr></thead>
      <tbody>${ranked.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.name)}${r.members ? ` (${esc(r.members)})` : ""}</td><td>${awards.get(r.id).icon} ${esc(awards.get(r.id).name)}</td>
        <td>${r.roomsCleared}/${ROOMS.length}</td><td>${r.escaped ? "성공" : ""}</td><td>${fmtTime(r.seconds)}</td><td>${r.hints}</td><td>${r.wrong}</td><td>${fmtNum(r.score)}</td><td>${esc(r.project || "")}</td></tr>`).join("")}</tbody></table>`,
    "table-print");
  },
  "copy-text": () => copyText(summaryText(), "결과를 복사했어요! 단톡방·클래스룸에 붙여 넣으세요 📋"),
  csv: () => downloadCSV(),
  ceremony: () => (doneRecords().length ? openCeremony(false) : toast("아직 탐험을 마친 팀이 없어요!")),
  "share-board": () => (doneRecords().length ? openCeremony(true) : toast("아직 탐험을 마친 팀이 없어요!")),
  "cer-next": () => ceremonyNext(),
  "cer-prev": () => ceremonyPrev(),
  "cer-close": () => closeCeremony(),
};

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (el && !el.disabled && ACTIONS[el.dataset.action]) {
    ACTIONS[el.dataset.action](el, e);
    // 맵 화면에서는 버튼 포커스를 풀어 스페이스바가 버튼을 다시 누르지 않게 해요
    if (ui.screen === "play" && !el.closest("#pmodal")) el.blur?.();
    return;
  }
  if (e.target.id === "modal") $("#modal").hidden = true;
  if (e.target.id === "pmodal" && ui.active) closePuzzle();
});

document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id === "answerInput") ui.inputValue = t.value;
  if (t.dataset.setting) {
    settings[t.dataset.setting] = t.type === "number" ? Math.max(0, Number(t.value) || 0) : t.value;
    save(STORE.settings, settings);
  }
});

document.addEventListener("change", (e) => {
  const t = e.target;
  if (!t.classList.contains("award-edit")) return;
  settings.overrides[t.dataset.id] = t.value.trim();
  save(STORE.settings, settings);
  setTimeout(() => { lastLiveHTML = ""; refreshLive(); }, 0);
});

const isTyping = (e) => ["INPUT", "TEXTAREA"].includes(e.target.tagName);

document.addEventListener("keydown", (e) => {
  if (cer) {
    if (["ArrowRight", " ", "Enter", "PageDown"].includes(e.key)) { e.preventDefault(); ceremonyNext(); }
    else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); ceremonyPrev(); }
    else if (e.key === "Escape") closeCeremony();
    return;
  }
  if (!$("#modal").hidden) { if (e.key === "Escape") $("#modal").hidden = true; return; }
  if (ui.active) {
    if (e.key === "Escape") closePuzzle();
    else if (e.key === "Enter" && !e.isComposing && e.target.id === "answerInput") ACTIONS.check();
    return;
  }
  if (ui.screen === "play" && eng.on) {
    if (ui.dialog) {
      if ([" ", "Enter", "Escape"].includes(e.key)) { e.preventDefault(); e.key === "Escape" ? (ui.dialog = null, renderDialog()) : dialogNext(); }
      return;
    }
    if (isTyping(e)) return;
    const d = KEY_DIR[e.code];
    if (d) { e.preventDefault(); pressDir(d); return; }
    if (e.code === "Space" || e.code === "Enter" || e.code === "KeyE") { e.preventDefault(); interact(eng.near); }
    return;
  }
  if (e.key !== "Enter" || e.isComposing) return;
  if (e.target.id === "playerName" || e.target.id === "playerMembers") ACTIONS.start();
});

document.addEventListener("keyup", (e) => {
  const d = KEY_DIR[e.code];
  if (d) eng.held = eng.held.filter((x) => x !== d);
});
window.addEventListener("blur", () => { eng.held = []; });

// ── 화면 전환 (#awards = 선생님 화면) ──
function route() {
  if (location.hash === "#awards") ui.screen = "awards";
  else if (!ui.screen || ui.screen === "awards") ui.screen = game ? (game.finished ? "end" : "play") : "home";
  if (ui.screen !== "play") { ui.active = null; ui.dialog = null; $("#pmodal").hidden = true; }
  render();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

// ── 타이머 (1초마다 상단 바 갱신, 제한 시간 확인) ──
setInterval(() => {
  if (!game || game.finished) return;
  if (settings.limitMin > 0 && elapsed(game) >= settings.limitMin * 60) {
    finishGame(false);
    ui.timeUp = true;
    beep("bad");
    if (ui.screen === "play") go("end");
    return;
  }
  renderHud();
}, 1000);

applyTheme();
applySound();
route();
