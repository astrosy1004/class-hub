// 지역 · 업종 표준화 표. 검색어를 "행정동 + 업종"으로 바꿀 때 쓰는 데이터 (내용 수정은 이 파일만).

// 연령 묶음 (생활인구 5세 구간을 합산) — 화면 표시 이름과 색 번호
export const AGE_GROUPS = [
  { key: "g10m", name: "10대 이하" },
  { key: "g20", name: "20대" },
  { key: "g30", name: "30대" },
  { key: "g40", name: "40대" },
  { key: "g50p", name: "50대 이상" },
];

// 서울 25개 자치구 코드 (생활인구 CSV · Kakao 행정동 코드 앞 5자리와 같음)
export const GU = {
  "11110": "종로구", "11140": "중구", "11170": "용산구", "11200": "성동구", "11215": "광진구",
  "11230": "동대문구", "11260": "중랑구", "11290": "성북구", "11305": "강북구", "11320": "도봉구",
  "11350": "노원구", "11380": "은평구", "11410": "서대문구", "11440": "마포구", "11470": "양천구",
  "11500": "강서구", "11530": "구로구", "11545": "금천구", "11560": "영등포구", "11590": "동작구",
  "11620": "관악구", "11650": "서초구", "11680": "강남구", "11710": "송파구", "11740": "강동구",
};

// 업종. target = 목표 고객 연령 비중(합 1), hours = 영업 시간대, bands = 반경 내 동종 점포 수 → 경쟁 점수 구간표 (초안)
// kakao.category = Kakao 카테고리 코드, kakao.keyword = 카테고리가 없는 업종은 키워드 검색
export const INDUSTRIES = [
  { key: "cafe", name: "카페", icon: "☕", alias: ["커피", "커피숍", "디저트"], kakao: { category: "CE7" },
    hours: range(8, 22), target: { g10m: 0.05, g20: 0.4, g30: 0.3, g40: 0.15, g50p: 0.1 },
    bands: [[20, 100], [50, 85], [100, 65], [150, 50], [200, 35], [300, 25], [Infinity, 15]], // 서울 번화가 10곳 표본(반경 500m 71~360곳) 기준 초안
    tips: { g20: "디저트 중심의 차별화된 메뉴", g30: "원두 · 스페셜티 메뉴와 좌석 편의", g40: "조용한 좌석과 브런치 메뉴", g50p: "편안한 좌석과 전통 차 메뉴", g10m: "소액 메뉴와 학생 할인" } },
  { key: "restaurant", name: "음식점", icon: "🍽", alias: ["식당", "맛집", "레스토랑"], kakao: { category: "FD6" },
    hours: range(11, 22), target: { g10m: 0.05, g20: 0.25, g30: 0.3, g40: 0.25, g50p: 0.15 },
    bands: [[40, 100], [110, 85], [220, 65], [330, 50], [440, 35], [660, 25], [Infinity, 15]], // 카페 표본에서 비율로 추정한 초안 (표본 조사 필요)
    tips: { g20: "SNS 인증 메뉴와 1~2인 세트", g30: "점심 직장인 세트와 예약 서비스", g40: "가족 단위 세트 메뉴", g50p: "정갈한 한상 차림", g10m: "분식형 소액 메뉴" } },
  { key: "bar", name: "술집", icon: "🍶", alias: ["주점", "호프", "이자카야", "포차"], kakao: { keyword: "술집" },
    hours: [17, 18, 19, 20, 21, 22, 23, 0, 1], target: { g10m: 0, g20: 0.4, g30: 0.4, g40: 0.15, g50p: 0.05 },
    bands: [[10, 100], [20, 80], [30, 60], [44, 35], [Infinity, 20]],
    tips: { g20: "안주 · 주류 페어링과 SNS 감성 인테리어", g30: "회식 단체석과 예약", g40: "조용한 룸 · 안주 품질", g50p: "전통 안주와 편안한 좌석", g10m: "" } },
  { key: "cvs", name: "편의점", icon: "🏪", alias: ["마트", "슈퍼"], kakao: { category: "CS2" },
    hours: range(0, 23), target: { g10m: 0.1, g20: 0.3, g30: 0.25, g40: 0.2, g50p: 0.15 },
    bands: [[5, 100], [10, 80], [15, 60], [25, 35], [Infinity, 20]],
    tips: { g20: "간편식 · 주류 구색 강화", g30: "도시락 · 즉석식품 구색", g40: "생활용품 · 택배 서비스", g50p: "생필품 · 택배 서비스", g10m: "과자 · 음료 구색" } },
  { key: "hospital", name: "병원", icon: "🏥", alias: ["의원", "치과", "한의원"], kakao: { category: "HP8" },
    hours: range(9, 18), target: { g10m: 0.1, g20: 0.1, g30: 0.2, g40: 0.25, g50p: 0.35 },
    bands: [[8, 100], [16, 80], [24, 60], [36, 35], [Infinity, 20]],
    tips: { g20: "야간 · 주말 진료와 온라인 예약", g30: "직장인 점심 · 야간 진료", g40: "건강검진 패키지", g50p: "만성질환 관리와 접근성", g10m: "소아 진료와 예방접종" } },
];

// 키 없이 시험할 수 있는 예시 행정동 (좌표는 대략 값). Kakao 키를 넣으면 이 표 없이 전국 검색.
export const DEMO_PLACES = [
  { name: "연남동", gu: "11440", lat: 37.5662, lng: 126.9250, alias: ["연트럴파크"] },
  { name: "서교동", gu: "11440", lat: 37.5563, lng: 126.9220, alias: ["홍대", "홍대입구"] },
  { name: "합정동", gu: "11440", lat: 37.5497, lng: 126.9140, alias: ["합정"] },
  { name: "망원1동", gu: "11440", lat: 37.5560, lng: 126.9030, alias: ["망원동", "망원"] },
  { name: "성수1가1동", gu: "11200", lat: 37.5446, lng: 127.0557, alias: ["성수동", "성수"] },
  { name: "화양동", gu: "11215", lat: 37.5404, lng: 127.0690, alias: ["건대", "건대입구"] },
  { name: "이태원1동", gu: "11170", lat: 37.5345, lng: 126.9946, alias: ["이태원"] },
  { name: "역삼1동", gu: "11680", lat: 37.5000, lng: 127.0364, alias: ["역삼", "강남역"] },
  { name: "잠실본동", gu: "11710", lat: 37.5133, lng: 127.1000, alias: ["잠실"] },
  { name: "청운효자동", gu: "11110", lat: 37.5840, lng: 126.9690, alias: ["서촌", "경복궁"] },
];

export const SUGGESTIONS = ["연남동 카페", "성수동 카페", "합정동 음식점", "망원동 편의점", "서촌 술집"];

function range(a, b) {
  const r = [];
  for (let h = a; h <= b; h++) r.push(h);
  return r;
}

// ── 세부 업종 ──────────────────────────────────────
// 기본 5개 업종 외의 세부 업종. 모든 숫자(목표 고객 · 영업 시간 · 경쟁 구간)는 초안이며 상담사 검수 전이다 (draft: true).
// kakao.category = Kakao 카테고리 코드(약국 PM9 · 학원 AC5 · 중개업소 AG2), 나머지는 키워드 검색이라 이름이 비슷한 다른 장소가 섞일 수 있다.
const RESTAURANT_BANDS = [[40, 100], [110, 85], [220, 65], [330, 50], [440, 35], [660, 25], [Infinity, 15]]; // 음식점 전체 기준(초안)
// 구간표를 점포가 더 적은 업종에 맞게 줄인다 (f = 음식점 대비 대략적인 점포 수 비율)
const scaleBands = (bands, f) => bands.map(([max, sc]) => [max === Infinity ? Infinity : Math.max(1, Math.round(max * f)), sc]);
const mk = (key, name, icon, alias, kakao, hours, t, f, tips = {}) => ({
  key, name, icon, alias, kakao, hours, draft: true,
  target: { g10m: t[0], g20: t[1], g30: t[2], g40: t[3], g50p: t[4] },
  bands: scaleBands(RESTAURANT_BANDS, f), tips,
});

export const EXTRA_INDUSTRIES = [
  // 음식
  mk("korean", "한식", "🍚", ["한식당", "백반"], { keyword: "한식" }, range(11, 21), [0.05, 0.15, 0.25, 0.25, 0.3], 0.6),
  mk("chinese", "중식", "🥟", ["중국집", "중화요리", "마라탕"], { keyword: "중식" }, range(11, 21), [0.05, 0.2, 0.3, 0.25, 0.2], 0.15),
  mk("japanese", "일식", "🍣", ["일식당", "초밥", "돈카츠"], { keyword: "일식" }, range(11, 22), [0, 0.25, 0.35, 0.25, 0.15], 0.2),
  mk("western", "양식", "🍝", ["파스타", "브런치"], { keyword: "양식" }, range(11, 22), [0.02, 0.3, 0.35, 0.2, 0.13], 0.2),
  mk("snack", "분식", "🍢", ["떡볶이", "김밥"], { keyword: "분식" }, range(10, 21), [0.15, 0.35, 0.25, 0.15, 0.1], 0.15),
  mk("chicken", "치킨", "🍗", ["치킨집"], { keyword: "치킨" }, range(16, 23), [0.1, 0.3, 0.3, 0.2, 0.1], 0.15),
  mk("bakery", "베이커리", "🥐", ["빵집", "제과점"], { keyword: "베이커리" }, range(8, 20), [0.1, 0.3, 0.25, 0.2, 0.15], 0.15),
  // 생활 · 서비스
  mk("salon", "미용실", "💇", ["헤어샵", "헤어"], { keyword: "미용실" }, range(10, 20), [0.05, 0.25, 0.3, 0.25, 0.15], 0.4),
  mk("gym", "헬스장", "🏋", ["피트니스", "헬스", "짐"], { keyword: "헬스장" }, range(6, 22), [0, 0.3, 0.35, 0.2, 0.15], 0.1),
  mk("pharmacy", "약국", "💊", [], { category: "PM9" }, range(9, 19), [0.1, 0.1, 0.2, 0.25, 0.35], 0.1),
  mk("laundry", "세탁소", "🧺", ["빨래방", "세탁"], { keyword: "세탁소" }, range(8, 20), [0.02, 0.1, 0.25, 0.3, 0.33], 0.1),
  mk("academy", "학원", "📚", ["교습소", "공부방"], { category: "AC5" }, range(14, 21), [0.45, 0.05, 0.15, 0.3, 0.05], 0.4),
  mk("realty", "부동산", "🏠", ["공인중개사", "중개업소"], { category: "AG2" }, range(9, 18), [0, 0.1, 0.25, 0.3, 0.35], 0.3),
  mk("karaoke", "노래방", "🎤", ["코인노래방"], { keyword: "노래방" }, [18, 19, 20, 21, 22, 23, 0], [0.05, 0.4, 0.3, 0.15, 0.1], 0.1),
  mk("pcroom", "PC방", "🖥", ["피씨방", "게임방"], { keyword: "PC방" }, [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0], [0.1, 0.5, 0.25, 0.1, 0.05], 0.1),
];

// 화면의 "세부 업종" 메뉴 묶음 (key 목록)
export const EXTRA_GROUPS = [
  { title: "음식", keys: ["korean", "chinese", "japanese", "western", "snack", "chicken", "bakery"] },
  { title: "생활 · 서비스", keys: ["salon", "gym", "pharmacy", "laundry", "academy", "realty", "karaoke", "pcroom"] },
];

// 직접 입력한 업종(예: "마라탕"): 이름만 알 수 있어 일반적인 고객 구성 · 영업 시간으로 계산한다 (키워드 검색)
export const CUSTOM_PROFILE = {
  baseKey: "custom", icon: "🔎", alias: [], hours: range(9, 21), draft: true, custom: true,
  target: { g10m: 0.08, g20: 0.22, g30: 0.25, g40: 0.22, g50p: 0.23 },
  bands: scaleBands(RESTAURANT_BANDS, 0.2), tips: {},
};
export const makeCustomIndustry = (keyword) => ({ ...CUSTOM_PROFILE, key: `custom:${encodeURIComponent(keyword)}`, name: keyword, kakao: { keyword } });

// 기준 분포(백분위 눈금)를 만들어 둘 프로필: 기본 + 세부 업종 + 직접 입력용 일반 프로필 ("custom")
export const BASELINE_PROFILES = [...INDUSTRIES, ...EXTRA_INDUSTRIES, { ...CUSTOM_PROFILE, key: "custom", name: "직접 입력" }];

export const allIndustries = () => [...INDUSTRIES, ...EXTRA_INDUSTRIES];
export function industryByKey(k) {
  if (typeof k === "string" && k.startsWith("custom:")) {
    let kw = k.slice(7);
    try { kw = decodeURIComponent(kw); } catch (e) { /* 그대로 */ }
    return makeCustomIndustry(kw || "직접 입력");
  }
  return allIndustries().find((i) => i.key === k) || INDUSTRIES[0];
}
