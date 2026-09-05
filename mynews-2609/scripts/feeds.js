// 수집 대상 피드 정의 — 여기만 고치면 화면과 디스코드 요약이 함께 바뀝니다.
// type: 'rss'          → 일반 RSS/Atom (title/link/pubDate)
//       'kma-forecast' → 기상청 1시간 동네예보 (예보 데이터를 사람이 읽는 문장으로 변환)
// zone(기상청)을 다른 지역 법정동코드로 바꾸면 해당 지역 예보를 받습니다. (예: 부산 2600000000)

const FEEDS = [
  {
    id: 'creator',
    emoji: '💵',
    name: '수익화 / 크리에이터 이코노미',
    source: 'Tubefilter',
    url: 'https://www.tubefilter.com/feed/',
    type: 'rss',
    limit: 15,
    color: 0xe8563f,
  },
  {
    id: 'weather',
    emoji: '☀️',
    name: '날씨 (서울 · 1시간 동네예보)',
    source: '기상청',
    url: 'https://www.weather.go.kr/w/rss/dfs/hr1-forecast.do?zone=1100000000',
    type: 'kma-forecast',
    limit: 12,
    color: 0x3b9ae1,
  },
  {
    id: 'gov',
    emoji: '🏛️',
    name: '정부지원정책 (지원사업 공고·모집)',
    source: 'Google 뉴스',
    url: 'https://news.google.com/rss/search?q=%22%EC%A7%80%EC%9B%90%EC%82%AC%EC%97%85%22+%EA%B3%B5%EA%B3%A0+OR+%EB%AA%A8%EC%A7%91&hl=ko&gl=KR&ceid=KR:ko',
    type: 'rss',
    limit: 20,
    color: 0x3f9d58,
  },
];

module.exports = { FEEDS };
