// 수집 대상 정의 — 여기만 고치면 화면과 디스코드 요약이 함께 바뀝니다.
//
// 카테고리 하나 = 화면의 카드 하나 = 디스코드 임베드 하나.
// 카테고리 안의 여러 출처를 모아 최신순으로 합치고, 중복 제목은 하나만 남깁니다.
//
// feeds[].type : 'rss'(기본) | 'kma-forecast'(기상청 동네예보 전용 변환)
// feeds[].take : 그 출처에서 가져올 최대 건수 (기본 perFeed)
// perFeed      : 카테고리 내 출처별 기본 상한 (한 출처가 카드를 독식하지 않게)
// limit        : 카테고리에 최종 표시할 최대 건수

const CATEGORIES = [
  {
    id: 'ai',
    emoji: '🤖',
    name: '인공지능',
    color: 0x7c5cff,
    perFeed: 12,
    limit: 20,
    feeds: [
      { source: '아주경제 AI', url: 'https://www.ajunews.com/rss/ai.xml' },
      { source: '아이뉴스24 IT', url: 'https://www.inews24.com/rss/news_it.xml' },
    ],
  },
  {
    id: 'gov',
    emoji: '🏛️',
    name: '공공지원사업',
    color: 0x3f9d58,
    perFeed: 8,
    limit: 24,
    feeds: [
      { source: '중소벤처기업부 사업공고', url: 'https://mss.go.kr/rss/smba/board/310.do' },
      { source: '지원금가이드 신규 정부지원금', url: 'https://awoo.or.kr/feed.xml' },
      { source: '지원금가이드 창업', url: 'https://awoo.or.kr/rss/startup.xml' },
      { source: '지원금가이드 취업', url: 'https://awoo.or.kr/rss/employment.xml' },
      { source: 'Google 뉴스 지원사업', take: 6, url: 'https://news.google.com/rss/search?q=%22%EC%A7%80%EC%9B%90%EC%82%AC%EC%97%85%22+%EA%B3%B5%EA%B3%A0+OR+%EB%AA%A8%EC%A7%91&hl=ko&gl=KR&ceid=KR:ko' },
    ],
  },
  {
    id: 'social',
    emoji: '🤝',
    name: '사회공헌',
    color: 0xe0803a,
    perFeed: 10,
    limit: 20,
    feeds: [
      { source: '뉴시스 사회', url: 'https://www.newsis.com/RSS/society.xml' },
      { source: '행정안전부 보도자료', url: 'https://www.mois.go.kr/gpms/view/jsp/rss/rss.jsp?ctxCd=1012' },
    ],
  },
  {
    id: 'economy',
    emoji: '📈',
    name: '경제',
    color: 0x2d7ff9,
    perFeed: 6,
    limit: 30,
    feeds: [
      { source: '뉴시스 경제', url: 'https://www.newsis.com/RSS/economy.xml' },
      { source: '뉴시스 금융', url: 'https://www.newsis.com/RSS/bank.xml' },
      { source: '뉴시스 산업', url: 'https://www.newsis.com/RSS/industry.xml' },
      { source: '경향신문 경제', url: 'https://www.khan.co.kr/rss/rssdata/economy_news.xml' },
      { source: '아이뉴스24 경제', url: 'https://www.inews24.com/rss/news_economy.xml' },
      { source: '아주경제 경제', url: 'https://www.ajunews.com/rss/economy.xml' },
    ],
  },
  {
    id: 'creator',
    emoji: '💵',
    name: '수익화 / 크리에이터 이코노미',
    color: 0xe8563f,
    perFeed: 12,
    limit: 12,
    feeds: [
      { source: 'Tubefilter', url: 'https://www.tubefilter.com/feed/' },
    ],
  },
  {
    id: 'weather',
    emoji: '☀️',
    name: '날씨 (서울 · 1시간 동네예보)',
    color: 0x3b9ae1,
    perFeed: 12,
    limit: 12,
    feeds: [
      // zone 을 다른 지역 법정동코드로 바꾸면 해당 지역 예보를 받습니다. (예: 부산 2600000000)
      { source: '기상청', type: 'kma-forecast', url: 'https://www.weather.go.kr/w/rss/dfs/hr1-forecast.do?zone=1100000000' },
    ],
  },
];

module.exports = { CATEGORIES };
