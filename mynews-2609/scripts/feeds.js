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
    id: 'job',
    emoji: '💼',
    name: '코딩강사 구인',
    color: 0xff9f43,
    perFeed: 20,
    limit: 30,
    feeds: [
      // "강사 채용/구인/모집" 구를 정확히 포함하는 기사만, 최근 14일 이내(when:14d)로 제한.
      // 수강생·참가자·학생 모집(강사가 아닌 학생 대상) 관련 기사는 제외.
      { source: 'Google 뉴스 코딩강사 구인', url: 'https://news.google.com/rss/search?q=%28%22%EC%BD%94%EB%94%A9%EA%B0%95%EC%82%AC%22+OR+%22%EC%BD%94%EB%94%A9+%EA%B0%95%EC%82%AC%22%29+%28%22%EA%B0%95%EC%82%AC+%EC%B1%84%EC%9A%A9%22+OR+%22%EA%B0%95%EC%82%AC+%EA%B5%AC%EC%9D%B8%22+OR+%22%EA%B0%95%EC%82%AC+%EB%AA%A8%EC%A7%91%22%29+-%EC%88%98%EA%B0%95%EC%83%9D+-%EC%B0%B8%EA%B0%80%EC%9E%90+-%ED%95%99%EC%83%9D+when%3A14d&hl=ko&gl=KR&ceid=KR:ko' },
    ],
  },
  {
    id: 'training',
    emoji: '📚',
    name: '코딩강사 역량강화 수업',
    color: 0x2d7ff9,
    perFeed: 20,
    limit: 30,
    feeds: [
      { source: 'Google 뉴스 코딩강사 역량강화', url: 'https://news.google.com/rss/search?q=%22%EC%BD%94%EB%94%A9%EA%B0%95%EC%82%AC%22+%EC%97%AD%EB%9F%89%EA%B0%95%ED%99%94+OR+%EC%97%B0%EC%88%98+OR+%EA%B5%90%EC%9C%A1&hl=ko&gl=KR&ceid=KR:ko' },
    ],
  },
];

module.exports = { CATEGORIES };
