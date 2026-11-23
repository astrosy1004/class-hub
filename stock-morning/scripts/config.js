// 보고서 설정 — 여기만 고치면 수집 대상과 선정 기준이 바뀝니다.

const SITE_URL = 'https://astrosy1004.github.io/class-hub/stock-morning/';

// 30일 공부 전략 1일차가 되는 날짜 (이 날부터 평일마다 하루씩 진행)
const STUDY_START = '2026-11-24';

// 해외 시장 표 (Yahoo Finance 심볼). group: 표를 나누는 단위
const GLOBALS = [
  { symbol: '^IXIC', name: '나스닥', group: 'us' },
  { symbol: '^GSPC', name: 'S&P500', group: 'us' },
  { symbol: '^DJI', name: '다우', group: 'us' },
  { symbol: '^SOX', name: '필라델피아 반도체', group: 'us' },
  { symbol: '^VIX', name: 'VIX(공포지수)', group: 'us' },
  { symbol: 'NVDA', name: '엔비디아', group: 'stock', unit: '$' },
  { symbol: 'AMD', name: 'AMD', group: 'stock', unit: '$' },
  { symbol: 'MU', name: '마이크론', group: 'stock', unit: '$' },
  { symbol: 'TSM', name: 'TSMC ADR', group: 'stock', unit: '$' },
  { symbol: 'TSLA', name: '테슬라', group: 'stock', unit: '$' },
  { symbol: '^N225', name: '닛케이', group: 'asia' },
  { symbol: '^TWII', name: '대만 가권', group: 'asia' },
  { symbol: '000001.SS', name: '상하이종합', group: 'asia' },
  { symbol: 'KRW=X', name: '원/달러', group: 'etc', unit: '원' },
  { symbol: 'CL=F', name: 'WTI 유가', group: 'etc', unit: '$' },
  { symbol: 'GC=F', name: '금 선물', group: 'etc', unit: '$' },
  { symbol: 'BTC-USD', name: '비트코인', group: 'etc', unit: '$' },
  { symbol: '^TNX', name: '美 10년물 금리', group: 'etc', unit: '%', diff: true },
];

// 뉴스 검색어 — 섹터별 뉴스와 AI 해설의 재료가 됩니다.
const NEWS_TOPICS = [
  ['시장', '코스피 마감'], ['시장', '코스닥 마감'], ['시장', '특징주'], ['시장', '상한가'],
  ['시장', '외국인 순매도 OR 순매수 코스피'], ['시장', '환율 마감'], ['시장', '테마시황'],
  ['해외', '뉴욕증시 마감'], ['해외', '유럽증시 마감'], ['해외', '중국증시 마감'], ['해외', '닛케이 마감'],
  ['해외', '연준 금리'], ['해외', '국제유가'], ['해외', '비트코인 시세'],
  ['정책', '금융위원회 증시 OR 정부 증시 대책'], ['정책', '한국은행 기준금리'],
  ['섹터', '반도체 주가'], ['섹터', '전력기기 OR 원전 관련주'], ['섹터', '로봇주 OR AI 관련주'],
  ['섹터', '이차전지 주가'], ['섹터', '바이오 주가 OR 제약주'], ['섹터', '조선주 OR 방산주'],
  ['섹터', '자동차주 OR 현대차 주가'], ['섹터', '엔터주 OR 게임주 OR 화장품주'], ['섹터', '금융주 OR 은행주'],
  ['일정', '다음주 증시 일정 OR 주간 증시 전망'], ['일정', '공모청약 신규상장'], ['일정', '불성실공시 OR 투자경고 지정'],
  ['시간외', '애프터마켓 급등 OR 시간외 급등'],
];

// 종목 선정 기준
const SCREEN = {
  bigCandle: 5,        // 상승봉: +5% 이상 양봉
  bigTvKospi: 500,     // 상승봉 거래대금 기준 (억원) — 코스피
  bigTvKosdaq: 150,    //                              — 코스닥
  maBand: 0.03,        // 이동평균선 ±3% 안이면 "부근"
  perGroup: 8,         // 차트 관심주 그룹당 최대 종목 수
  afterMinTv: 20,      // 시간외 확인 대상 최소 거래대금 (억원)
  afterMinMove: 5,     // 시간외 변동 표시 기준 (%)
};

module.exports = { SITE_URL, STUDY_START, GLOBALS, NEWS_TOPICS, SCREEN };
