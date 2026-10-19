"use strict";

/* =========================================================
   1. 데이터 — 내용 수정은 이 영역만 고치면 됩니다.
   (장소·가격·리뷰는 모두 예시 데이터입니다)
   ========================================================= */

// 지원 언어. 장소 설명 등 데이터에 해당 언어가 없으면 영어 → 한국어 순으로 대신 보여줍니다.
const LANGS = [
  { code: "ko", label: "한국어", locale: "ko-KR" },
  { code: "en", label: "English", locale: "en-US" },
  { code: "zh", label: "中文", locale: "zh-CN" },
  { code: "ja", label: "日本語", locale: "ja-JP" },
];

// 통화. rate = 1원당 환산값 (참고용 고정 환율)
const CURRENCIES = [
  { code: "KRW", rate: 1 },
  { code: "USD", rate: 1 / 1380 },
  { code: "CNY", rate: 1 / 192 },
  { code: "JPY", rate: 1 / 9.2 },
];

// 장소가 지원하는 외국어 표기 (언어 이름은 각 언어 그대로)
const SPEAKS = { en: "English", zh: "中文", ja: "日本語", th: "ไทย", vi: "Tiếng Việt", ar: "العربية" };

// glyph: 아이콘 이름(ICONS), tone: styles.css 의 --tone-* 색
const CATEGORIES = [
  { id: "derma", glyph: "plus", tone: "coral", name: { ko: "피부과", en: "Dermatology", zh: "皮肤科", ja: "皮膚科" } },
  { id: "pharmacy", glyph: "pill", tone: "green", name: { ko: "K약국", en: "Pharmacy", zh: "药店", ja: "薬局" } },
  { id: "spa", glyph: "lotus", tone: "violet", name: { ko: "스파", en: "Spa", zh: "水疗", ja: "スパ" } },
  { id: "store", glyph: "bag", tone: "pink", name: { ko: "뷰티숍", en: "Beauty Shop", zh: "美妆店", ja: "コスメ店" } },
  { id: "plastic", glyph: "sparkle", tone: "blue", name: { ko: "성형외과", en: "Plastic Surgery", zh: "整形外科", ja: "美容外科" } },
];

// 지역과 기준 위치(역·관광지·호텔). kind: station | spot | hotel | airport
const AREAS = [
  {
    id: "myeongdong",
    name: { ko: "명동", en: "Myeongdong", zh: "明洞", ja: "明洞" },
    landmarks: [
      { id: "my-st", kind: "station", lat: 37.5609, lng: 126.9863, name: { ko: "명동역", en: "Myeongdong Stn.", zh: "明洞站", ja: "明洞駅" } },
      { id: "my-eul", kind: "station", lat: 37.566, lng: 126.9822, name: { ko: "을지로입구역", en: "Euljiro 1-ga Stn.", zh: "乙支路入口站", ja: "乙支路入口駅" } },
      { id: "my-cath", kind: "spot", lat: 37.5633, lng: 126.9873, name: { ko: "명동성당", en: "Myeongdong Cathedral", zh: "明洞圣堂", ja: "明洞聖堂" } },
      { id: "my-bus", kind: "airport", lat: 37.5618, lng: 126.9837, name: { ko: "공항버스 정류장", en: "Airport Bus Stop", zh: "机场巴士站", ja: "空港バス乗り場" } },
    ],
  },
  {
    id: "gangnam",
    name: { ko: "강남·신사", en: "Gangnam · Sinsa", zh: "江南·新沙", ja: "江南・新沙" },
    landmarks: [
      { id: "gn-sinsa", kind: "station", lat: 37.5163, lng: 127.0203, name: { ko: "신사역", en: "Sinsa Stn.", zh: "新沙站", ja: "新沙駅" } },
      { id: "gn-apgu", kind: "station", lat: 37.527, lng: 127.0284, name: { ko: "압구정역", en: "Apgujeong Stn.", zh: "狎鸥亭站", ja: "狎鴎亭駅" } },
      { id: "gn-garosu", kind: "spot", lat: 37.5205, lng: 127.0229, name: { ko: "가로수길", en: "Garosu-gil", zh: "林荫道", ja: "カロスキル" } },
    ],
  },
  {
    id: "hongdae",
    name: { ko: "홍대·연남", en: "Hongdae · Yeonnam", zh: "弘大·延南", ja: "弘大・延南" },
    landmarks: [
      { id: "hd-st", kind: "station", lat: 37.5572, lng: 126.9245, name: { ko: "홍대입구역", en: "Hongik Univ. Stn.", zh: "弘大入口站", ja: "弘大入口駅" } },
      { id: "hd-sangsu", kind: "station", lat: 37.5477, lng: 126.9229, name: { ko: "상수역", en: "Sangsu Stn.", zh: "上水站", ja: "上水駅" } },
      { id: "hd-street", kind: "spot", lat: 37.5535, lng: 126.9226, name: { ko: "홍대 걷고싶은거리", en: "Hongdae Street", zh: "弘大步行街", ja: "弘大ストリート" } },
      { id: "hd-park", kind: "spot", lat: 37.5615, lng: 126.9233, name: { ko: "연트럴파크", en: "Yeontral Park", zh: "延南公园", ja: "ヨントラルパーク" } },
    ],
  },
  {
    id: "seongsu",
    name: { ko: "성수", en: "Seongsu", zh: "圣水", ja: "聖水" },
    landmarks: [
      { id: "ss-st", kind: "station", lat: 37.5446, lng: 127.0557, name: { ko: "성수역", en: "Seongsu Stn.", zh: "圣水站", ja: "聖水駅" } },
      { id: "ss-forest-st", kind: "station", lat: 37.5436, lng: 127.0446, name: { ko: "서울숲역", en: "Seoul Forest Stn.", zh: "首尔林站", ja: "ソウルの森駅" } },
      { id: "ss-forest", kind: "spot", lat: 37.5444, lng: 127.0374, name: { ko: "서울숲", en: "Seoul Forest", zh: "首尔林", ja: "ソウルの森" } },
    ],
  },
];

// 취소·환불 정책 종류
const POLICIES = {
  flexible: {
    ko: "방문 24시간 전까지 무료 취소",
    en: "Free cancellation up to 24 hours before your visit",
    zh: "到店前24小时可免费取消",
    ja: "来店24時間前まで無料キャンセル",
  },
  standard: {
    ko: "48시간 전까지 무료 취소, 이후에는 예약금 환불 불가",
    en: "Free cancellation up to 48 hours before; the deposit is non-refundable after that",
    zh: "提前48小时可免费取消，之后定金不予退还",
    ja: "48時間前まで無料キャンセル、それ以降は予約金の返金不可",
  },
  medical: {
    ko: "상담 72시간 전까지 무료 취소. 당일 의료진 판단으로 시술하지 않으면 전액 환불",
    en: "Free cancellation up to 72 hours before. Full refund if the doctor decides not to proceed on the day",
    zh: "面诊前72小时可免费取消。当天如医生判断不宜治疗，全额退款",
    ja: "相談72時間前まで無料キャンセル。当日医師の判断で施術しない場合は全額返金",
  },
  walkin: {
    ko: "예약 없이 방문하는 매장입니다",
    en: "Walk-in only — no reservation needed",
    zh: "无需预约，直接到店",
    ja: "予約不要、直接ご来店ください",
  },
};

// 장소 목록
// booking: instant(즉시 확정) | request(예약 요청 후 승인) | walkin(현장 방문)
// price: 1~3 가격대, sponsored: 유료 노출(광고 표시), verified: 인증 제휴, medical: 의료기관
// hours: 운영시간, closed: 휴무 요일(0=일요일)
const PLACES = [
  {
    id: "my-glowhouse", area: "myeongdong", category: "store", lat: 37.5628, lng: 126.9856,
    name: { ko: "글로우하우스 명동 본점", en: "Glow House Myeongdong" },
    desc: { ko: "스킨케어·색조 브랜드 300여 개를 모은 대형 편집숍. 즉시 택스리펀 키오스크와 무료 피부 타입 진단을 운영합니다.", en: "A large multi-brand shop with 300+ skincare and makeup brands, instant tax-refund kiosks and free skin-type checks." },
    rating: 4.7, reviewCount: 1284, price: 1, langs: ["en", "zh", "ja", "th"], interpreter: false,
    hours: ["10:00", "22:30"], closed: [], booking: "request", policy: "flexible", verified: true, sponsored: false, medical: false,
    services: [
      { name: { ko: "1:1 피부 타입 진단", en: "1:1 skin type check" }, price: 0, minutes: 20 },
      { name: { ko: "쿠션 파운데이션 맞춤 매칭", en: "Cushion foundation shade matching" }, price: 15000, minutes: 30 },
    ],
    reviews: [{ author: "Emma", from: "🇺🇸", rating: 5, langScore: 5, text: "Staff spoke great English and the tax refund took two minutes." }],
  },
  {
    id: "my-cosmelounge", area: "myeongdong", category: "store", lat: 37.5641, lng: 126.9842,
    name: { ko: "서울 코스메 라운지", en: "Seoul Cosme Lounge" },
    desc: { ko: "퍼스널 컬러 진단과 K-메이크업 클래스를 함께 하는 체험형 뷰티 라운지입니다.", en: "An experience-style lounge offering personal color analysis and K-makeup classes." },
    rating: 4.5, reviewCount: 642, price: 2, langs: ["en", "zh", "ja"], interpreter: false,
    hours: ["11:00", "21:00"], closed: [], booking: "instant", policy: "standard", verified: true, sponsored: true, medical: false,
    services: [
      { name: { ko: "퍼스널 컬러 진단", en: "Personal color analysis" }, price: 45000, minutes: 60 },
      { name: { ko: "K-메이크업 원데이 클래스", en: "K-makeup one-day class" }, price: 60000, minutes: 90 },
    ],
    reviews: [{ author: "美咲", from: "🇯🇵", rating: 4, langScore: 4, text: "パーソナルカラー診断がとても分かりやすかったです。" }],
  },
  {
    id: "my-medipot", area: "myeongdong", category: "pharmacy", lat: 37.5622, lng: 126.9849,
    name: { ko: "메디포트 약국 명동", en: "Medipot Pharmacy Myeongdong" },
    desc: { ko: "외국어 상담이 가능한 약국. 여행자 상비약 키트와 피부 진정 연고, 건강기능식품을 안내합니다.", en: "A pharmacy with multilingual pharmacists. Travel medicine kits, soothing creams and supplements." },
    rating: 4.6, reviewCount: 418, price: 1, langs: ["en", "zh", "ja"], interpreter: false,
    hours: ["09:00", "22:00"], closed: [], booking: "walkin", policy: "walkin", verified: true, sponsored: false, medical: false,
    services: [
      { name: { ko: "여행자 상비약 키트", en: "Traveler medicine kit" }, price: 25000, minutes: 10 },
      { name: { ko: "시술 후 진정 케어 세트", en: "Post-treatment soothing set" }, price: 32000, minutes: 10 },
    ],
    reviews: [{ author: "Li Wei", from: "🇨🇳", rating: 5, langScore: 5, text: "药剂师会说中文，推荐的药很有效。" }],
  },
  {
    id: "my-clearon", area: "myeongdong", category: "derma", lat: 37.5651, lng: 126.9868,
    name: { ko: "클리어온 피부과 명동", en: "ClearOn Dermatology Myeongdong" },
    desc: { ko: "피부 진단 후 레이저·스킨부스터를 진행하는 피부과. 영어·중국어 코디네이터가 상주합니다.", en: "Dermatology clinic offering skin diagnosis, lasers and skin boosters, with English and Chinese coordinators." },
    rating: 4.8, reviewCount: 512, price: 2, langs: ["en", "zh", "ja"], interpreter: true,
    hours: ["10:00", "20:00"], closed: [0], booking: "instant", policy: "medical", verified: true, sponsored: false, medical: true,
    services: [
      { name: { ko: "피부 진단 상담", en: "Skin consultation" }, price: 30000, minutes: 30 },
      { name: { ko: "레이저 토닝", en: "Laser toning" }, price: 120000, minutes: 40 },
      { name: { ko: "스킨부스터(물광)", en: "Skin booster (glass skin)" }, price: 250000, minutes: 60 },
      { name: { ko: "여드름 압출·진정 관리", en: "Acne extraction & calming care" }, price: 80000, minutes: 50 },
    ],
    reviews: [
      { author: "Sarah", from: "🇬🇧", rating: 5, langScore: 5, text: "Clear explanation of side effects before the laser. Very professional." },
      { author: "Nguyen", from: "🇻🇳", rating: 4, langScore: 3, text: "Good result, but I needed the English coordinator for everything." },
    ],
  },
  {
    id: "my-sodam", area: "myeongdong", category: "spa", lat: 37.5615, lng: 126.9878,
    name: { ko: "소담 한방 스파", en: "Sodam Hanbang Spa" },
    desc: { ko: "한방 아로마 오일과 두피 스파로 여행 피로를 푸는 웰니스 스파입니다.", en: "A wellness spa using Korean herbal aroma oils and scalp treatments to melt away travel fatigue." },
    rating: 4.6, reviewCount: 388, price: 2, langs: ["en", "ja"], interpreter: false,
    hours: ["11:00", "23:00"], closed: [], booking: "request", policy: "standard", verified: true, sponsored: false, medical: false,
    services: [
      { name: { ko: "한방 아로마 전신 마사지 90분", en: "Herbal aroma full-body massage 90 min" }, price: 140000, minutes: 90 },
      { name: { ko: "두피 스파 60분", en: "Scalp spa 60 min" }, price: 90000, minutes: 60 },
      { name: { ko: "찜질 & 각질 관리", en: "Sauna & body scrub" }, price: 70000, minutes: 70 },
    ],
    reviews: [{ author: "Hana", from: "🇯🇵", rating: 5, langScore: 4, text: "頭皮スパが最高でした。また来たいです。" }],
  },

  {
    id: "gn-linev", area: "gangnam", category: "plastic", lat: 37.5178, lng: 127.0204,
    name: { ko: "라인브이 성형외과", en: "LineV Plastic Surgery" },
    desc: { ko: "눈·코·리프팅 상담 중심의 성형외과. 전문 의료통역사가 상담부터 사후 관리까지 동행합니다.", en: "Plastic surgery clinic focused on eye, nose and lifting consultations. A medical interpreter accompanies you from consultation to aftercare." },
    rating: 4.6, reviewCount: 203, price: 3, langs: ["en", "zh", "ja", "th", "ar"], interpreter: true,
    hours: ["10:00", "19:00"], closed: [0], booking: "request", policy: "medical", verified: true, sponsored: false, medical: true,
    services: [
      { name: { ko: "눈·코 성형 상담", en: "Eye & nose consultation" }, price: 50000, minutes: 40 },
      { name: { ko: "실 리프팅", en: "Thread lift" }, price: 1500000, minutes: 90 },
      { name: { ko: "수술 후 경과 관리", en: "Post-surgery follow-up" }, price: 0, minutes: 30 },
    ],
    reviews: [{ author: "Aisha", from: "🇦🇪", rating: 5, langScore: 5, text: "Arabic interpreter was with me the whole time. I felt safe." }],
  },
  {
    id: "gn-misoline", area: "gangnam", category: "plastic", lat: 37.5247, lng: 127.0268,
    name: { ko: "미소라인 성형외과", en: "Misoline Plastic Surgery" },
    desc: { ko: "윤곽·쁘띠 시술 상담 성형외과. 중국어 상담 실장이 상주합니다.", en: "Clinic for contouring and petit procedures, with an in-house Chinese-speaking counselor." },
    rating: 4.4, reviewCount: 156, price: 3, langs: ["en", "zh"], interpreter: true,
    hours: ["10:00", "19:00"], closed: [0], booking: "request", policy: "medical", verified: true, sponsored: true, medical: true,
    services: [
      { name: { ko: "윤곽 상담", en: "Contouring consultation" }, price: 50000, minutes: 40 },
      { name: { ko: "사각턱 보톡스", en: "Jaw botox" }, price: 150000, minutes: 30 },
      { name: { ko: "필러", en: "Filler" }, price: 300000, minutes: 40 },
    ],
    reviews: [{ author: "Chen", from: "🇹🇼", rating: 4, langScore: 5, text: "咨询很详细，价格透明。" }],
  },
  {
    id: "gn-dermalab", area: "gangnam", category: "derma", lat: 37.5162, lng: 127.0242,
    name: { ko: "더마랩 신사", en: "Dermalab Sinsa" },
    desc: { ko: "리프팅·스킨부스터 전문 피부과. 시술 전 사진 진단과 다국어 동의서를 제공합니다.", en: "Lifting and skin-booster clinic. Photo-based skin analysis and multilingual consent forms before every treatment." },
    rating: 4.7, reviewCount: 689, price: 2, langs: ["en", "ja", "th"], interpreter: true,
    hours: ["10:00", "21:00"], closed: [], booking: "instant", policy: "medical", verified: true, sponsored: false, medical: true,
    services: [
      { name: { ko: "피부 진단 상담", en: "Skin consultation" }, price: 30000, minutes: 30 },
      { name: { ko: "PDRN 스킨부스터", en: "PDRN skin booster" }, price: 350000, minutes: 60 },
      { name: { ko: "HIFU 리프팅", en: "HIFU lifting" }, price: 450000, minutes: 60 },
    ],
    reviews: [{ author: "Ploy", from: "🇹🇭", rating: 5, langScore: 4, text: "Thai consent form was very helpful. Skin looks great." }],
  },
  {
    id: "gn-garosupharm", area: "gangnam", category: "pharmacy", lat: 37.5196, lng: 127.0218,
    name: { ko: "가로수 메디약국", en: "Garosu Medi Pharmacy" },
    desc: { ko: "피부과·성형외과 처방전 조제와 시술 후 관리 용품을 갖춘 약국입니다.", en: "Fills prescriptions from nearby clinics and stocks post-procedure care products." },
    rating: 4.5, reviewCount: 221, price: 1, langs: ["en", "zh"], interpreter: false,
    hours: ["09:00", "21:00"], closed: [0], booking: "walkin", policy: "walkin", verified: true, sponsored: false, medical: false,
    services: [
      { name: { ko: "처방전 조제", en: "Prescription filling" }, price: 10000, minutes: 15 },
      { name: { ko: "붓기·멍 관리 세트", en: "Swelling & bruise care set" }, price: 38000, minutes: 10 },
    ],
    reviews: [{ author: "Jessica", from: "🇦🇺", rating: 4, langScore: 4, text: "Right next to the clinics, handy after my appointment." }],
  },
  {
    id: "gn-wellness", area: "gangnam", category: "spa", lat: 37.5262, lng: 127.0296,
    name: { ko: "압구정 웰니스 스튜디오", en: "Apgujeong Wellness Studio" },
    desc: { ko: "시술 후 진정 관리와 림프 바디 마사지를 하는 프라이빗 스튜디오입니다.", en: "Private studio for post-treatment calming care and lymphatic body massage." },
    rating: 4.8, reviewCount: 271, price: 3, langs: ["en", "zh", "ja"], interpreter: false,
    hours: ["10:00", "22:00"], closed: [], booking: "instant", policy: "standard", verified: true, sponsored: false, medical: false,
    services: [
      { name: { ko: "시술 후 진정 관리", en: "Post-treatment calming facial" }, price: 120000, minutes: 60 },
      { name: { ko: "림프 바디 마사지", en: "Lymphatic body massage" }, price: 180000, minutes: 90 },
    ],
    reviews: [{ author: "Olivia", from: "🇨🇦", rating: 5, langScore: 5, text: "Perfect after my laser session. Calm and very clean." }],
  },
  {
    id: "gn-select", area: "gangnam", category: "store", lat: 37.5226, lng: 127.0244,
    name: { ko: "가로수 뷰티 셀렉트", en: "Garosu Beauty Select" },
    desc: { ko: "인디 K-뷰티 브랜드 편집숍. 피부 고민에 맞춘 루틴 상담을 예약할 수 있습니다.", en: "Indie K-beauty select shop. Book a routine consultation tailored to your skin concerns." },
    rating: 4.5, reviewCount: 334, price: 2, langs: ["en", "ja"], interpreter: false,
    hours: ["11:00", "21:00"], closed: [], booking: "request", policy: "flexible", verified: false, sponsored: false, medical: false,
    services: [{ name: { ko: "맞춤 스킨케어 루틴 상담", en: "Custom skincare routine consultation" }, price: 30000, minutes: 40 }],
    reviews: [{ author: "Yuki", from: "🇯🇵", rating: 4, langScore: 3, text: "おすすめされたセラムが肌に合いました。" }],
  },

  {
    id: "hd-market", area: "hongdae", category: "store", lat: 37.5558, lng: 126.9236,
    name: { ko: "홍대 코스메 마켓", en: "Hongdae Cosme Market" },
    desc: { ko: "늦게까지 여는 가성비 화장품 매장. 여행용 미니 사이즈가 많습니다.", en: "Budget-friendly cosmetics store open late, with lots of travel-size minis." },
    rating: 4.4, reviewCount: 905, price: 1, langs: ["en", "zh", "vi"], interpreter: false,
    hours: ["10:00", "23:30"], closed: [], booking: "walkin", policy: "walkin", verified: true, sponsored: false, medical: false,
    services: [{ name: { ko: "여행용 미니 세트", en: "Travel mini set" }, price: 19000, minutes: 10 }],
    reviews: [{ author: "Minh", from: "🇻🇳", rating: 4, langScore: 4, text: "Cheap and lots of choices. Busy at night." }],
  },
  {
    id: "hd-jjimjil", area: "hongdae", category: "spa", lat: 37.5598, lng: 126.9252,
    name: { ko: "연남 찜질 라운지", en: "Yeonnam Jjimjil Lounge" },
    desc: { ko: "외국인도 편하게 이용하는 모던 찜질방. 세신과 발 마사지를 예약할 수 있습니다.", en: "A modern, foreigner-friendly jjimjilbang. Book a Korean body scrub or foot massage." },
    rating: 4.5, reviewCount: 477, price: 1, langs: ["en", "zh", "ja"], interpreter: false,
    hours: ["08:00", "23:00"], closed: [], booking: "instant", policy: "flexible", verified: true, sponsored: false, medical: false,
    services: [
      { name: { ko: "찜질방 이용", en: "Jjimjilbang entry" }, price: 15000, minutes: 180 },
      { name: { ko: "세신(때밀이)", en: "Korean body scrub" }, price: 35000, minutes: 40 },
      { name: { ko: "발 마사지", en: "Foot massage" }, price: 45000, minutes: 50 },
    ],
    reviews: [{ author: "Tom", from: "🇩🇪", rating: 5, langScore: 4, text: "First jjimjilbang experience, the English guide card helped a lot." }],
  },
  {
    id: "hd-sangsu", area: "hongdae", category: "derma", lat: 37.5489, lng: 126.9221,
    name: { ko: "상수 스킨클리닉 피부과", en: "Sangsu Skin Clinic" },
    desc: { ko: "여드름·흉터 관리 피부과. 베트남어 상담이 가능합니다.", en: "Dermatology for acne and scar care. Vietnamese consultation available." },
    rating: 4.6, reviewCount: 198, price: 2, langs: ["en", "zh", "vi"], interpreter: true,
    hours: ["10:00", "19:30"], closed: [0, 6], booking: "request", policy: "medical", verified: true, sponsored: false, medical: true,
    services: [
      { name: { ko: "여드름·흉터 상담", en: "Acne & scar consultation" }, price: 30000, minutes: 30 },
      { name: { ko: "프락셀 레이저", en: "Fractional laser" }, price: 200000, minutes: 50 },
    ],
    reviews: [{ author: "Linh", from: "🇻🇳", rating: 5, langScore: 5, text: "Bác sĩ giải thích rất kỹ, có phiên dịch tiếng Việt." }],
  },
  {
    id: "hd-nightpharm", area: "hongdae", category: "pharmacy", lat: 37.5566, lng: 126.9228,
    name: { ko: "홍대 나이트약국", en: "Hongdae Night Pharmacy" },
    desc: { ko: "자정까지 여는 약국. 숙취·두통약과 기초 화장품을 판매합니다.", en: "Open until midnight. Hangover and headache relief plus basic skincare." },
    rating: 4.3, reviewCount: 263, price: 1, langs: ["en", "zh"], interpreter: false,
    hours: ["09:00", "24:00"], closed: [], booking: "walkin", policy: "walkin", verified: false, sponsored: false, medical: false,
    services: [{ name: { ko: "여행자 상비약 키트", en: "Traveler medicine kit" }, price: 22000, minutes: 10 }],
    reviews: [{ author: "Jake", from: "🇺🇸", rating: 4, langScore: 3, text: "Lifesaver at 11pm. Pointing at the phone translation worked fine." }],
  },

  {
    id: "ss-factory", area: "seongsu", category: "store", lat: 37.5443, lng: 127.0538,
    name: { ko: "성수 뷰티 팩토리", en: "Seongsu Beauty Factory" },
    desc: { ko: "나만의 립스틱·향수를 만드는 체험형 플래그십 매장입니다.", en: "Experience-style flagship where you make your own lipstick or perfume." },
    rating: 4.7, reviewCount: 552, price: 2, langs: ["en", "zh", "ja"], interpreter: false,
    hours: ["11:00", "21:00"], closed: [1], booking: "instant", policy: "standard", verified: true, sponsored: true, medical: false,
    services: [
      { name: { ko: "나만의 립스틱 만들기", en: "Make-your-own lipstick class" }, price: 55000, minutes: 60 },
      { name: { ko: "향수 블렌딩 클래스", en: "Perfume blending class" }, price: 65000, minutes: 70 },
    ],
    reviews: [{ author: "Chloé", from: "🇫🇷", rating: 5, langScore: 4, text: "Super fun class, and a great souvenir to bring home." }],
  },
  {
    id: "ss-forestderma", area: "seongsu", category: "derma", lat: 37.5451, lng: 127.0469,
    name: { ko: "서울숲 피부과", en: "Seoul Forest Dermatology" },
    desc: { ko: "자연스러운 물광 피부 관리를 하는 피부과. 일본어 상담이 가능합니다.", en: "Dermatology for natural glass-skin care, with Japanese consultation." },
    rating: 4.7, reviewCount: 241, price: 2, langs: ["en", "ja"], interpreter: true,
    hours: ["10:00", "20:00"], closed: [0], booking: "instant", policy: "medical", verified: true, sponsored: false, medical: true,
    services: [
      { name: { ko: "피부 진단 상담", en: "Skin consultation" }, price: 30000, minutes: 30 },
      { name: { ko: "물광 주사", en: "Hydrating skin injection" }, price: 200000, minutes: 50 },
    ],
    reviews: [{ author: "Aoi", from: "🇯🇵", rating: 5, langScore: 5, text: "日本語で丁寧に説明してもらえて安心でした。" }],
  },
  {
    id: "ss-forestspa", area: "seongsu", category: "spa", lat: 37.5432, lng: 127.0408,
    name: { ko: "숲 테라피 스파", en: "Forest Therapy Spa" },
    desc: { ko: "서울숲 옆 프라이빗 스파. 커플 룸과 아로마 전신 마사지가 인기입니다.", en: "Private spa next to Seoul Forest, popular for couple rooms and aroma massage." },
    rating: 4.8, reviewCount: 319, price: 3, langs: ["en", "zh", "ja"], interpreter: false,
    hours: ["11:00", "22:00"], closed: [], booking: "request", policy: "standard", verified: true, sponsored: false, medical: false,
    services: [
      { name: { ko: "아로마 전신 마사지", en: "Aroma full-body massage" }, price: 160000, minutes: 90 },
      { name: { ko: "커플 스파", en: "Couple spa" }, price: 280000, minutes: 120 },
    ],
    reviews: [{ author: "Daniel", from: "🇸🇬", rating: 5, langScore: 5, text: "Quiet and beautiful. Worth every won." }],
  },
  {
    id: "ss-medicare", area: "seongsu", category: "pharmacy", lat: 37.5449, lng: 127.0565,
    name: { ko: "성수 메디케어 약국", en: "Seongsu Medicare Pharmacy" },
    desc: { ko: "성수역 앞 약국. 건강기능식품과 더마 화장품을 함께 판매합니다.", en: "Pharmacy in front of Seongsu Station with supplements and derma cosmetics." },
    rating: 4.4, reviewCount: 142, price: 1, langs: ["en"], interpreter: false,
    hours: ["09:00", "21:00"], closed: [0], booking: "walkin", policy: "walkin", verified: true, sponsored: false, medical: false,
    services: [{ name: { ko: "더마 화장품 상담", en: "Derma cosmetics advice" }, price: 0, minutes: 10 }],
    reviews: [{ author: "Grace", from: "🇵🇭", rating: 4, langScore: 3, text: "Helpful pharmacist, good derma brand selection." }],
  },
];

// 추천 코스. steps 의 start 는 권장 시작 시각, service 는 PLACES 의 services 순번
const COURSES = [
  {
    id: "c-myeongdong", area: "myeongdong",
    title: { ko: "명동 화장품 쇼핑 → 피부과 → 스파", en: "Myeongdong shopping → Dermatology → Spa", zh: "明洞购物 → 皮肤科 → 水疗", ja: "明洞ショッピング → 皮膚科 → スパ" },
    steps: [
      { place: "my-cosmelounge", start: "11:00", service: 0 },
      { place: "my-clearon", start: "13:00", service: 1 },
      { place: "my-sodam", start: "15:00", service: 1 },
    ],
  },
  {
    id: "c-gangnam", area: "gangnam",
    title: { ko: "강남 성형외과 상담 → 약국 → 진정 관리", en: "Gangnam surgery consult → Pharmacy → Calming care", zh: "江南整形咨询 → 药店 → 镇静护理", ja: "江南美容外科相談 → 薬局 → 鎮静ケア" },
    steps: [
      { place: "gn-linev", start: "10:30", service: 0 },
      { place: "gn-garosupharm", start: "11:40", service: 1 },
      { place: "gn-wellness", start: "13:00", service: 0 },
    ],
  },
  {
    id: "c-seongsu", area: "seongsu",
    title: { ko: "성수 체험 클래스 → 피부과 → 숲 스파", en: "Seongsu beauty class → Dermatology → Forest spa", zh: "圣水体验课 → 皮肤科 → 森林水疗", ja: "聖水体験クラス → 皮膚科 → 森のスパ" },
    steps: [
      { place: "ss-factory", start: "11:00", service: 0 },
      { place: "ss-forestderma", start: "13:00", service: 0 },
      { place: "ss-forestspa", start: "15:00", service: 0 },
    ],
  },
  {
    id: "c-hongdae", area: "hongdae",
    title: { ko: "홍대 쇼핑 → 피부과 → 찜질방", en: "Hongdae shopping → Dermatology → Jjimjilbang", zh: "弘大购物 → 皮肤科 → 汗蒸房", ja: "弘大ショッピング → 皮膚科 → チムジルバン" },
    steps: [
      { place: "hd-market", start: "11:00", service: 0 },
      { place: "hd-sangsu", start: "13:00", service: 0 },
      { place: "hd-jjimjil", start: "15:00", service: 1 },
    ],
  },
];

// 화면 문구 (한국어 · 영어 · 중국어 · 일본어)
const I18N = {
  ko: {
    heroCta: "지도에서 찾아보기",
    tabHome: "홈", tabMap: "지도", tabExplore: "탐색", tabSaved: "찜", tabTrips: "내 여행",
    splashTagline: "한국의 아름다움을 여행하세요", start: "시작하기", chooseLang: "언어를 선택하세요",
    homeTitle: "한국의 뷰티를 탐색하세요", homeSub: "여행 중 만나는 클리닉 · 스킨케어 · 웰니스",
    popularNear: "내 주변 인기", curated: "여행자 추천 코스", seeAll: "전체 보기", bookNow: "예약하기",
    popularServices: "인기 서비스", moreInfo: "상세 정보", settings: "설정", language: "언어", currency: "통화", darkMode: "다크 모드",
    notifications: "알림", noNotifications: "새 알림이 없어요",
    notif_confirmed: "{place} 예약이 확정됐어요", notif_requested: "{place}에 예약 요청을 보냈어요. 승인을 기다리는 중이에요",
    notif_visited: "{place} 방문은 어떠셨나요? 리뷰를 남겨 주세요", notif_cancelled: "{place} 예약이 취소됐어요",
    mapSearchPh: "지도에서 검색", filters: "필터", showResults: "{n}곳 보기", locate: "기준 위치 바꾸기",
    share: "공유", linkCopied: "링크를 복사했어요", back: "뒤로",
    featLang: "{lang} 지원", featConsult: "상담 가능", featEasy: "간편 예약", featMedical: "의료기관",
    tripDay: "{area} 뷰티 데이", tripSub: "스킨케어, 쇼핑, 휴식까지 한국에서의 하루",
    upcoming: "다가오는 일정", past: "지난 · 취소된 예약", browseCourses: "추천 코스 보기", stepsN: "{n}곳",
    sampleNote: "사진 대신 예시 이미지입니다", exploreTitle: "모든 장소",
    docTitle: "K-뷰티 패스포트 · 외국인 여행객 K-뷰티 예약",
    brand: "K-뷰티 패스포트",
    navExplore: "탐색", navCourses: "추천 코스", navTrip: "내 예약", theme: "테마", close: "닫기",
    heroEyebrow: "SEOUL · K-BEAUTY",
    heroTitle: "여행지에서 믿을 수 있는 K-뷰티를 찾고 바로 예약하세요",
    heroSub: "스토어 · 약국 · 피부과 · 성형외과 · 스파를 한 지도에서",
    all: "전체", searchPh: "매장·시술 이름 검색",
    filterRating: "평점 4.5+", filterOpen: "영업 중", filterBookable: "예약 가능",
    filterLang: "외국어", anyOption: "전체", filterPrice: "가격대", nearby: "기준", areaCenter: "지역 중심",
    sort: "정렬", sortRecommended: "추천순", sortRating: "평점순", sortDistance: "가까운순", sortPrice: "낮은 가격순",
    results: "{n}곳", noResults: "조건에 맞는 장소가 없어요", reset: "필터 초기화",
    walk: "도보 {m}분", reviewsN: "리뷰 {n}", verified: "인증 제휴", ad: "광고", interpreter: "통역",
    instant: "즉시 예약", request: "예약 요청", walkin: "현장 방문", open: "영업 중", closedNow: "영업 종료",
    from: "{p}~", free: "무료", details: "상세 보기", book: "예약하기", save: "찜", saved: "찜함",
    directions: "길찾기", hours: "운영시간", closedDays: "휴무", noClosed: "연중무휴", languages: "외국어 지원",
    bookingType: "예약 방식", nearestFrom: "{place}에서 도보 {m}분", location: "위치",
    services: "메뉴·시술", minutes: "{m}분", policy: "취소·환불 정책",
    medicalNotice: "의료 안내",
    medicalText: "시술 효과와 부작용은 사람마다 다르며, 시술 여부는 의료진 상담 후 결정됩니다. 이 서비스는 예약만 중개하며 진료를 제공하지 않습니다.",
    adNote: "이 장소는 유료 광고로 상단에 노출됩니다.",
    about: "소개", reviewsTitle: "이용자 리뷰", langScore: "언어 만족도", visitVerified: "방문 인증",
    days: ["일", "월", "화", "수", "목", "금", "토"],
    mapNote: "개략도 · 지도 API 연동 전", ringLabel: "도보 {m}분",
    bookTitle: "예약 신청", service: "서비스", date: "날짜", time: "시간", people: "인원", peopleN: "{n}명",
    name: "이름", email: "이메일", note: "요청사항", notePh: "예: 통역 필요, 민감성 피부",
    consent: "예약 처리를 위해 이름·이메일을 이 브라우저에 저장하는 데 동의합니다",
    total: "예상 금액", deposit: "예약금(10%)", payOnSite: "현장 결제",
    depositNote: "결제 연동 전 단계라 실제 결제는 이루어지지 않습니다.",
    noSlots: "선택한 날짜에는 예약 가능한 시간이 없어요", closedDay: "휴무일입니다",
    cancel: "취소", submitInstant: "예약 확정하기", submitRequest: "예약 요청 보내기",
    required: "필수 항목(*)과 시간을 확인해 주세요",
    toastConfirmed: "예약이 확정됐어요 · {id}", toastRequested: "예약 요청을 보냈어요 · {id}",
    toastSaved: "찜 목록에 담았어요", toastUnsaved: "찜을 해제했어요", toastCancelled: "예약을 취소했어요",
    toastApproved: "제휴사가 예약을 승인했어요", toastVisited: "방문 완료로 바꿨어요. 리뷰를 남길 수 있어요",
    toastReview: "리뷰가 등록됐어요",
    tripTitle: "내 여행 · 예약", bookingsTitle: "예약 내역", favoritesTitle: "찜한 장소",
    noBookings: "아직 예약이 없어요. 지도에서 장소를 골라 예약해 보세요.", noFavorites: "찜한 장소가 없어요",
    status_confirmed: "예약 확정", status_requested: "승인 대기", status_cancelled: "취소됨", status_visited: "방문 완료",
    bookingNo: "예약번호 · 방문 시 보여주세요", cancelBooking: "예약 취소", cancelConfirm: "이 예약을 취소할까요?",
    approveDemo: "승인 처리(데모)", visitDemo: "방문 완료(데모)", writeReview: "리뷰 쓰기", reviewed: "리뷰 작성됨",
    reviewTitle: "리뷰 작성", ratingLabel: "서비스 만족도", reviewText: "후기", submitReview: "등록",
    reviewRequired: "별점과 후기를 입력해 주세요",
    coursesTitle: "추천 K-뷰티 코스", coursesSub: "이동시간과 운영시간을 고려한 반나절 코스",
    showOnMap: "지도에서 보기", hideRoute: "경로 숨기기", move: "도보 이동 {m}분", aboutHours: "약 {n}시간",
    courseClosed: "{day}요일은 휴무인 곳이 있어요",
    footer: "예시 데이터로 만든 MVP 프로토타입입니다. 장소·가격·리뷰는 실제와 다르며, 유료 노출은 '광고'로 표시합니다.",
    rateNote: "환율은 참고용 고정값입니다.", fallbackNote: "",
  },
  en: {
    heroCta: "Find on the map",
    tabHome: "Home", tabMap: "Map", tabExplore: "Explore", tabSaved: "Saved", tabTrips: "Trips",
    splashTagline: "Explore Korea's beauty", start: "Get started", chooseLang: "Choose your language",
    homeTitle: "Explore Korea's beauty", homeSub: "Clinics, skincare, wellness and more for your trip",
    popularNear: "Popular near you", curated: "Curated for travelers", seeAll: "See all", bookNow: "Book now",
    popularServices: "Popular services", moreInfo: "More info", settings: "Settings", language: "Language", currency: "Currency", darkMode: "Dark mode",
    notifications: "Notifications", noNotifications: "No new notifications",
    notif_confirmed: "Your booking at {place} is confirmed", notif_requested: "Request sent to {place}. Waiting for approval",
    notif_visited: "How was {place}? Leave a review", notif_cancelled: "Your booking at {place} was cancelled",
    mapSearchPh: "Search the map", filters: "Filters", showResults: "Show {n} places", locate: "Change reference point",
    share: "Share", linkCopied: "Link copied", back: "Back",
    featLang: "{lang} support", featConsult: "Consultation", featEasy: "Easy booking", featMedical: "Medical clinic",
    tripDay: "{area} Beauty Day", tripSub: "Skincare, shopping and relaxation in the heart of Seoul",
    upcoming: "Upcoming", past: "Past & cancelled", browseCourses: "Browse courses", stepsN: "{n} stops",
    sampleNote: "Illustrations shown instead of photos", exploreTitle: "All places",
    docTitle: "K-Beauty Passport · Book K-beauty in Seoul",
    brand: "K-Beauty Passport",
    navExplore: "Explore", navCourses: "Courses", navTrip: "My Trip", theme: "Theme", close: "Close",
    heroEyebrow: "SEOUL · K-BEAUTY",
    heroTitle: "Find trusted K-beauty spots and book in your language",
    heroSub: "Stores, pharmacies, dermatology, plastic surgery and spas on one map",
    all: "All", searchPh: "Search places or treatments",
    filterRating: "Rating 4.5+", filterOpen: "Open now", filterBookable: "Bookable",
    filterLang: "Language", anyOption: "Any", filterPrice: "Price", nearby: "Near", areaCenter: "Area center",
    sort: "Sort", sortRecommended: "Recommended", sortRating: "Top rated", sortDistance: "Nearest", sortPrice: "Lowest price",
    results: "{n} places", noResults: "No places match your filters", reset: "Reset filters",
    walk: "{m} min walk", reviewsN: "{n} reviews", verified: "Verified", ad: "Ad", interpreter: "Interpreter",
    instant: "Instant booking", request: "Request booking", walkin: "Walk-in", open: "Open", closedNow: "Closed",
    from: "from {p}", free: "Free", details: "Details", book: "Book", save: "Save", saved: "Saved",
    directions: "Directions", hours: "Hours", closedDays: "Closed on", noClosed: "Open daily", languages: "Languages",
    bookingType: "Booking", nearestFrom: "{m} min walk from {place}", location: "Location",
    services: "Services", minutes: "{m} min", policy: "Cancellation & refund",
    medicalNotice: "Medical notice",
    medicalText: "Results and side effects vary by person. Whether to proceed is decided after consulting the medical staff. This service only arranges bookings and does not provide medical care.",
    adNote: "This place appears at the top as a paid placement.",
    about: "About", reviewsTitle: "Reviews", langScore: "Language support", visitVerified: "Verified visit",
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    mapNote: "Schematic map · map API not connected yet", ringLabel: "{m} min walk",
    bookTitle: "Book a visit", service: "Service", date: "Date", time: "Time", people: "Guests", peopleN: "{n}",
    name: "Name", email: "Email", note: "Requests", notePh: "e.g. need interpreter, sensitive skin",
    consent: "I agree to store my name and email in this browser to process the booking",
    total: "Estimated total", deposit: "Deposit (10%)", payOnSite: "Pay on site",
    depositNote: "Payment is not connected yet. No real charge is made.",
    noSlots: "No times available on this date", closedDay: "Closed on this day",
    cancel: "Cancel", submitInstant: "Confirm booking", submitRequest: "Send request",
    required: "Please check the required fields (*) and time",
    toastConfirmed: "Booking confirmed · {id}", toastRequested: "Request sent · {id}",
    toastSaved: "Saved to your list", toastUnsaved: "Removed from your list", toastCancelled: "Booking cancelled",
    toastApproved: "The partner approved your booking", toastVisited: "Marked as visited. You can now leave a review",
    toastReview: "Review posted",
    tripTitle: "My trip & bookings", bookingsTitle: "Bookings", favoritesTitle: "Saved places",
    noBookings: "No bookings yet. Pick a place on the map to book.", noFavorites: "No saved places yet",
    status_confirmed: "Confirmed", status_requested: "Pending", status_cancelled: "Cancelled", status_visited: "Visited",
    bookingNo: "Booking no. · show this at check-in", cancelBooking: "Cancel booking", cancelConfirm: "Cancel this booking?",
    approveDemo: "Approve (demo)", visitDemo: "Mark visited (demo)", writeReview: "Write review", reviewed: "Reviewed",
    reviewTitle: "Write a review", ratingLabel: "Service rating", reviewText: "Review", submitReview: "Submit",
    reviewRequired: "Please add a rating and a review",
    coursesTitle: "Recommended K-beauty courses", coursesSub: "Half-day routes planned around walking time and opening hours",
    showOnMap: "Show on map", hideRoute: "Hide route", move: "{m} min walk", aboutHours: "about {n} h",
    courseClosed: "Some places are closed on {day}",
    footer: "MVP prototype with sample data. Places, prices and reviews are fictional. Paid placements are labeled 'Ad'.",
    rateNote: "Exchange rates are fixed reference values.", fallbackNote: "",
  },
  zh: {
    heroCta: "在地图上查找",
    tabHome: "首页", tabMap: "地图", tabExplore: "探索", tabSaved: "收藏", tabTrips: "行程",
    splashTagline: "探索韩国之美", start: "开始", chooseLang: "选择语言",
    homeTitle: "探索韩国美妆", homeSub: "旅途中的诊所、护肤、养生等",
    popularNear: "附近热门", curated: "旅行者精选路线", seeAll: "查看全部", bookNow: "立即预约",
    popularServices: "热门项目", moreInfo: "详细信息", settings: "设置", language: "语言", currency: "货币", darkMode: "深色模式",
    notifications: "通知", noNotifications: "暂无新通知",
    notif_confirmed: "{place}的预约已确认", notif_requested: "已向{place}发送预约申请，等待确认",
    notif_visited: "{place}体验如何？欢迎评价", notif_cancelled: "{place}的预约已取消",
    mapSearchPh: "在地图中搜索", filters: "筛选", showResults: "查看{n}家", locate: "切换基准位置",
    share: "分享", linkCopied: "链接已复制", back: "返回",
    featLang: "支持{lang}", featConsult: "可咨询", featEasy: "轻松预约", featMedical: "医疗机构",
    tripDay: "{area}美妆之日", tripSub: "在首尔中心享受护肤、购物与放松",
    upcoming: "即将到来", past: "过往与取消", browseCourses: "查看推荐路线", stepsN: "{n}站",
    sampleNote: "以示意图代替照片", exploreTitle: "全部地点",
    docTitle: "K-美妆护照 · 首尔韩国美妆预约",
    brand: "K-美妆护照",
    navExplore: "探索", navCourses: "推荐路线", navTrip: "我的行程", theme: "主题", close: "关闭",
    heroEyebrow: "SEOUL · K-BEAUTY",
    heroTitle: "寻找值得信赖的韩国美妆店铺，用母语轻松预约",
    heroSub: "美妆店、药店、皮肤科、整形外科、水疗，一张地图全搞定",
    all: "全部", searchPh: "搜索店铺或项目",
    filterRating: "评分4.5+", filterOpen: "营业中", filterBookable: "可预约",
    filterLang: "语言", anyOption: "不限", filterPrice: "价位", nearby: "附近", areaCenter: "地区中心",
    sort: "排序", sortRecommended: "推荐", sortRating: "评分最高", sortDistance: "距离最近", sortPrice: "价格最低",
    results: "{n}家", noResults: "没有符合条件的地点", reset: "重置筛选",
    walk: "步行{m}分钟", reviewsN: "{n}条评价", verified: "认证合作", ad: "广告", interpreter: "翻译",
    instant: "即时预约", request: "预约申请", walkin: "直接到店", open: "营业中", closedNow: "已打烊",
    from: "{p}起", free: "免费", details: "查看详情", book: "预约", save: "收藏", saved: "已收藏",
    directions: "导航", hours: "营业时间", closedDays: "休息日", noClosed: "全年无休", languages: "支持语言",
    bookingType: "预约方式", nearestFrom: "距{place}步行{m}分钟", location: "位置",
    services: "服务项目", minutes: "{m}分钟", policy: "取消与退款政策",
    medicalNotice: "医疗须知",
    medicalText: "效果和副作用因人而异，是否进行治疗需在医生面诊后决定。本服务仅提供预约中介，不提供医疗服务。",
    adNote: "该地点为付费推广，显示在靠前位置。",
    about: "简介", reviewsTitle: "用户评价", langScore: "语言满意度", visitVerified: "到店认证",
    days: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
    mapNote: "示意图 · 尚未接入地图API", ringLabel: "步行{m}分钟",
    bookTitle: "预约", service: "项目", date: "日期", time: "时间", people: "人数", peopleN: "{n}人",
    name: "姓名", email: "邮箱", note: "备注", notePh: "例如：需要翻译、敏感肌",
    consent: "我同意为处理预约将姓名和邮箱保存在此浏览器中",
    total: "预计金额", deposit: "定金(10%)", payOnSite: "到店付款",
    depositNote: "支付功能尚未接入，不会产生实际扣款。",
    noSlots: "该日期无可预约时间", closedDay: "当天休息",
    cancel: "取消", submitInstant: "确认预约", submitRequest: "发送预约申请",
    required: "请确认必填项(*)和时间",
    toastConfirmed: "预约成功 · {id}", toastRequested: "预约申请已发送 · {id}",
    toastSaved: "已加入收藏", toastUnsaved: "已取消收藏", toastCancelled: "预约已取消",
    toastApproved: "商家已确认您的预约", toastVisited: "已标记为到店，可以写评价了",
    toastReview: "评价已提交",
    tripTitle: "我的行程与预约", bookingsTitle: "预约记录", favoritesTitle: "收藏的地点",
    noBookings: "还没有预约。在地图上选择地点进行预约吧。", noFavorites: "还没有收藏",
    status_confirmed: "已确认", status_requested: "待确认", status_cancelled: "已取消", status_visited: "已到店",
    bookingNo: "预约编号 · 到店时出示", cancelBooking: "取消预约", cancelConfirm: "确定要取消此预约吗？",
    approveDemo: "确认预约（演示）", visitDemo: "标记到店（演示）", writeReview: "写评价", reviewed: "已评价",
    reviewTitle: "写评价", ratingLabel: "服务评分", reviewText: "评价内容", submitReview: "提交",
    reviewRequired: "请填写评分和评价内容",
    coursesTitle: "推荐韩国美妆路线", coursesSub: "结合步行时间与营业时间的半日路线",
    showOnMap: "在地图上查看", hideRoute: "隐藏路线", move: "步行{m}分钟", aboutHours: "约{n}小时",
    courseClosed: "{day}有店铺休息",
    footer: "这是使用示例数据制作的MVP原型。地点、价格和评价均为虚构，付费推广标注为“广告”。",
    rateNote: "汇率为固定参考值。", fallbackNote: " 部分详情以英文显示。",
  },
  ja: {
    heroCta: "地図で探す",
    tabHome: "ホーム", tabMap: "マップ", tabExplore: "探す", tabSaved: "保存", tabTrips: "旅行",
    splashTagline: "韓国の美を旅しよう", start: "はじめる", chooseLang: "言語を選択",
    homeTitle: "韓国のビューティーを探そう", homeSub: "旅行中のクリニック・スキンケア・ウェルネス",
    popularNear: "近くの人気スポット", curated: "旅行者向けおすすめコース", seeAll: "すべて見る", bookNow: "今すぐ予約",
    popularServices: "人気メニュー", moreInfo: "詳細情報", settings: "設定", language: "言語", currency: "通貨", darkMode: "ダークモード",
    notifications: "お知らせ", noNotifications: "新しいお知らせはありません",
    notif_confirmed: "{place}の予約が確定しました", notif_requested: "{place}にリクエストを送信しました。承認待ちです",
    notif_visited: "{place}はいかがでしたか？レビューをお願いします", notif_cancelled: "{place}の予約がキャンセルされました",
    mapSearchPh: "地図で検索", filters: "絞り込み", showResults: "{n}件を表示", locate: "基準地点を変更",
    share: "共有", linkCopied: "リンクをコピーしました", back: "戻る",
    featLang: "{lang}対応", featConsult: "相談可", featEasy: "かんたん予約", featMedical: "医療機関",
    tripDay: "{area}ビューティーデイ", tripSub: "ソウルの中心でスキンケア・ショッピング・リラックス",
    upcoming: "今後の予定", past: "過去・キャンセル", browseCourses: "コースを見る", stepsN: "{n}か所",
    sampleNote: "写真の代わりにイラストを表示しています", exploreTitle: "すべての場所",
    docTitle: "Kビューティーパスポート · ソウルのKビューティー予約",
    brand: "Kビューティーパスポート",
    navExplore: "探す", navCourses: "おすすめコース", navTrip: "マイ旅行", theme: "テーマ", close: "閉じる",
    heroEyebrow: "SEOUL · K-BEAUTY",
    heroTitle: "信頼できるKビューティーを探して、母国語で予約",
    heroSub: "コスメ店・薬局・皮膚科・美容外科・スパをひとつの地図で",
    all: "すべて", searchPh: "店舗・施術を検索",
    filterRating: "評価4.5以上", filterOpen: "営業中", filterBookable: "予約可",
    filterLang: "言語", anyOption: "指定なし", filterPrice: "価格帯", nearby: "基準", areaCenter: "エリア中心",
    sort: "並び替え", sortRecommended: "おすすめ順", sortRating: "評価順", sortDistance: "近い順", sortPrice: "安い順",
    results: "{n}件", noResults: "条件に合う場所がありません", reset: "条件をリセット",
    walk: "徒歩{m}分", reviewsN: "レビュー{n}件", verified: "認証提携", ad: "広告", interpreter: "通訳",
    instant: "即時予約", request: "予約リクエスト", walkin: "来店のみ", open: "営業中", closedNow: "営業時間外",
    from: "{p}〜", free: "無料", details: "詳細を見る", book: "予約する", save: "保存", saved: "保存済み",
    directions: "ルート", hours: "営業時間", closedDays: "定休日", noClosed: "年中無休", languages: "対応言語",
    bookingType: "予約方法", nearestFrom: "{place}から徒歩{m}分", location: "場所",
    services: "メニュー・施術", minutes: "{m}分", policy: "キャンセル・返金ポリシー",
    medicalNotice: "医療に関するご案内",
    medicalText: "効果や副作用には個人差があり、施術の可否は医師との相談後に決定されます。本サービスは予約の仲介のみを行い、診療は提供しません。",
    adNote: "この場所は有料掲載のため上位に表示されています。",
    about: "紹介", reviewsTitle: "レビュー", langScore: "言語対応", visitVerified: "来店認証",
    days: ["日", "月", "火", "水", "木", "金", "土"],
    mapNote: "概略図・地図API未連携", ringLabel: "徒歩{m}分",
    bookTitle: "予約", service: "メニュー", date: "日付", time: "時間", people: "人数", peopleN: "{n}名",
    name: "お名前", email: "メール", note: "ご要望", notePh: "例：通訳希望、敏感肌",
    consent: "予約処理のため、お名前とメールをこのブラウザに保存することに同意します",
    total: "予定金額", deposit: "予約金(10%)", payOnSite: "現地払い",
    depositNote: "決済は未連携のため、実際の請求は発生しません。",
    noSlots: "この日は予約可能な時間がありません", closedDay: "定休日です",
    cancel: "キャンセル", submitInstant: "予約を確定", submitRequest: "リクエストを送信",
    required: "必須項目(*)と時間をご確認ください",
    toastConfirmed: "予約が確定しました · {id}", toastRequested: "リクエストを送信しました · {id}",
    toastSaved: "保存しました", toastUnsaved: "保存を解除しました", toastCancelled: "予約をキャンセルしました",
    toastApproved: "店舗が予約を承認しました", toastVisited: "来店済みにしました。レビューを書けます",
    toastReview: "レビューを投稿しました",
    tripTitle: "マイ旅行・予約", bookingsTitle: "予約一覧", favoritesTitle: "保存した場所",
    noBookings: "まだ予約はありません。地図から場所を選んで予約しましょう。", noFavorites: "保存した場所はありません",
    status_confirmed: "確定", status_requested: "承認待ち", status_cancelled: "キャンセル済み", status_visited: "来店済み",
    bookingNo: "予約番号 · 来店時に提示してください", cancelBooking: "予約をキャンセル", cancelConfirm: "この予約をキャンセルしますか？",
    approveDemo: "承認する（デモ）", visitDemo: "来店済みにする（デモ）", writeReview: "レビューを書く", reviewed: "レビュー済み",
    reviewTitle: "レビューを書く", ratingLabel: "サービス評価", reviewText: "レビュー", submitReview: "投稿",
    reviewRequired: "評価とレビューを入力してください",
    coursesTitle: "おすすめKビューティーコース", coursesSub: "移動時間と営業時間を考慮した半日コース",
    showOnMap: "地図で見る", hideRoute: "ルートを隠す", move: "徒歩{m}分", aboutHours: "約{n}時間",
    courseClosed: "{day}曜日は定休日の場所があります",
    footer: "サンプルデータで作成したMVPプロトタイプです。場所・価格・レビューは架空のもので、有料掲載は「広告」と表示します。",
    rateNote: "為替レートは参考用の固定値です。", fallbackNote: " 一部の詳細は英語で表示されます。",
  },
};

/* =========================================================
   2. 상태와 저장소
   ========================================================= */

const KEYS = {
  lang: "kbeautyLang",
  currency: "kbeautyCurrency",
  theme: "kbeautyTheme",
  bookings: "kbeautyBookings",
  favorites: "kbeautyFavorites",
  reviews: "kbeautyReviews",
};

const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

const DEFAULT_FILTERS = { category: "all", query: "", rating: false, openNow: false, bookable: false, speak: "", price: 0, near: "", sort: "recommended" };

const state = {
  lang: pickLang(),
  currency: storage.get(KEYS.currency, "KRW"),
  area: AREAS[0].id,
  ...DEFAULT_FILTERS,
  selected: null,
  route: null, // 지도에 그릴 경로: { area, ids: [장소 id...] }
  notifSeen: storage.get("kbeautyNotifSeen", ""),
  bookings: storage.get(KEYS.bookings, []),
  favorites: storage.get(KEYS.favorites, []),
  userReviews: storage.get(KEYS.reviews, []),
};

function pickLang() {
  const saved = storage.get(KEYS.lang, "");
  if (LANGS.some((l) => l.code === saved)) return saved;
  const browser = (navigator.language || "ko").slice(0, 2);
  return LANGS.some((l) => l.code === browser) ? browser : "ko";
}

/* =========================================================
   3. 도우미
   ========================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function t(key, vars = {}) {
  const dict = I18N[state.lang] || I18N.ko;
  const text = dict[key] ?? I18N.ko[key] ?? key;
  if (typeof text !== "string") return text;
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

// 다국어 객체에서 현재 언어 → 영어 → 한국어 순으로 꺼냄
const L = (obj) => (obj ? obj[state.lang] ?? obj.en ?? obj.ko ?? "" : "");

const locale = () => (LANGS.find((l) => l.code === state.lang) || LANGS[0]).locale;
const placeById = (id) => PLACES.find((p) => p.id === id);
const categoryById = (id) => CATEGORIES.find((c) => c.id === id);
const currentArea = () => AREAS.find((a) => a.id === state.area);
const toneVar = (place) => `var(--tone-${categoryById(place.category).tone})`;

function money(krw) {
  if (!krw) return t("free");
  const cur = CURRENCIES.find((c) => c.code === state.currency) || CURRENCIES[0];
  const value = krw * cur.rate;
  const text = new Intl.NumberFormat(locale(), { style: "currency", currency: cur.code, maximumFractionDigits: 0 }).format(value);
  return cur.code === "KRW" ? text : `≈ ${text}`;
}

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

// 서울 현재 시각 (브라우저 시간대와 무관)
function seoulNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short",
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday")),
  };
}

const dayOfDate = (dateStr) => new Date(`${dateStr}T00:00:00Z`).getUTCDay();

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return new Intl.DateTimeFormat(locale(), { timeZone: "UTC", month: "short", day: "numeric", weekday: "short" }).format(d);
}

function isOpen(place, now = seoulNow()) {
  if (place.closed.includes(now.day)) return false;
  return now.minutes >= toMin(place.hours[0]) && now.minutes < toMin(place.hours[1]);
}

function distance(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const walkMinutes = (meters) => Math.max(1, Math.round((meters * 1.25) / 75)); // 직선거리 × 1.25, 분당 75m

function hash(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function ratingOf(place) {
  const mine = state.userReviews.filter((r) => r.placeId === place.id);
  const count = place.reviewCount + mine.length;
  const sum = place.rating * place.reviewCount + mine.reduce((s, r) => s + r.rating, 0);
  return { avg: sum / count, count };
}

const minPrice = (place) => Math.min(...place.services.map((s) => s.price));

function areaCenter(areaId) {
  const pts = PLACES.filter((p) => p.area === areaId);
  return { lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length, lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length };
}

function originPoint() {
  const landmark = currentArea().landmarks.find((l) => l.id === state.near);
  return landmark || { ...areaCenter(state.area), name: null };
}

function nearestLandmark(place) {
  const area = AREAS.find((a) => a.id === place.area);
  return area.landmarks
    .map((l) => ({ l, d: distance(l, place) }))
    .sort((a, b) => a.d - b.d)[0];
}

let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

/* =========================================================
   4. 검색 결과
   ========================================================= */

function visiblePlaces() {
  const now = seoulNow();
  const origin = originPoint();
  const query = state.query.trim().toLowerCase();

  const list = PLACES.filter((p) => p.area === state.area)
    .filter((p) => state.category === "all" || p.category === state.category)
    .filter((p) => {
      if (!query) return true;
      const hay = [...Object.values(p.name), ...p.services.flatMap((s) => Object.values(s.name)), ...Object.values(categoryById(p.category).name)]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    })
    .filter((p) => !state.rating || ratingOf(p).avg >= 4.5)
    .filter((p) => !state.openNow || isOpen(p, now))
    .filter((p) => !state.bookable || p.booking !== "walkin")
    .filter((p) => !state.speak || p.langs.includes(state.speak))
    .filter((p) => !state.price || p.price === state.price)
    .map((p) => ({ place: p, meters: distance(origin, p) }));

  const score = (p) => (p.sponsored ? 1000 : 0) + (p.verified ? 100 : 0) + ratingOf(p).avg * 10 + Math.log10(ratingOf(p).count);
  const sorters = {
    recommended: (a, b) => score(b.place) - score(a.place),
    rating: (a, b) => ratingOf(b.place).avg - ratingOf(a.place).avg,
    distance: (a, b) => a.meters - b.meters,
    price: (a, b) => minPrice(a.place) - minPrice(b.place),
  };
  return list.sort(sorters[state.sort] || sorters.recommended);
}

/* =========================================================
   5. 아이콘 · 일러스트 (사진 대신 쓰는 예시 이미지)
   ========================================================= */

const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  pill: '<g transform="rotate(-45 12 12)"><rect x="3" y="8.5" width="18" height="7" rx="3.5"/><path d="M12 8.5v7"/></g>',
  lotus: '<path d="M12 20c-4.5 0-8.5-2.6-8.5-6.2 2.7 0 5.6 1.2 8.5 4.2 2.9-3 5.8-4.2 8.5-4.2 0 3.6-4 6.2-8.5 6.2Z"/><path d="M12 18c-2.1-2.1-3.2-4.6-3.2-7.2S10 5.9 12 3.6c2 2.3 3.2 4.6 3.2 7.2S14.1 15.9 12 18Z"/>',
  bag: '<path d="M5 8h14l-1.1 12H6.1L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  sparkle: '<path d="M11 3.5l1.9 5.1 5.1 1.9-5.1 1.9L11 17.5l-1.9-5.1L4 10.5l5.1-1.9L11 3.5Z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z"/>',
  home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.5Z"/>',
  pin: '<path d="M12 21s-7-6.1-7-11.4a7 7 0 0 1 14 0C19 14.9 12 21 12 21Z"/><circle cx="12" cy="9.6" r="2.4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>',
  heart: '<path d="M12 20s-7.6-4.6-9-9.6C2.1 6.8 4.6 4 7.6 4c1.9 0 3.4 1 4.4 2.6C13 5 14.5 4 16.4 4c3 0 5.5 2.8 4.6 6.4C19.6 15.4 12 20 12 20Z"/>',
  calendar: '<rect x="4" y="5" width="16" height="16" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.6 3.6 5.4 3.6 8.5s-1.2 5.9-3.6 8.5c-2.4-2.6-3.6-5.4-3.6-8.5S9.6 6.1 12 3.5Z"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  locate: '<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  chat: '<path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-7l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01"/>',
  clipboard: '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 3.5h6v3H9zM8.5 12h7M8.5 16h5"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><path d="M16 4.8a3.2 3.2 0 0 1 0 6.4M18 14.8c1.6.7 2.7 2.4 3 5.2"/>',
};

const icon = (name, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;
const glyphOf = (place) => categoryById(place.category).glyph;

// 카테고리 색 그라데이션 위에 아이콘을 얹은 "사진 자리" 일러스트
function art(place, cls = "") {
  const seed = hash(place.id);
  const angle = 110 + (seed % 60);
  return `<div class="art ${cls}" style="--tone: ${toneVar(place)}; --angle: ${angle}deg" aria-hidden="true">
    <span class="art-bloom" style="left:${10 + (seed % 60)}%; top:${(seed >> 4) % 50}%"></span>
    <span class="art-bloom b2" style="left:${(seed >> 8) % 70}%; top:${40 + ((seed >> 12) % 40)}%"></span>
    <span class="art-glyph">${icon(glyphOf(place))}</span>
  </div>`;
}

// 스플래시 · 여행 일정 헤더용 서울 풍경 일러스트 (남산타워 · 빌딩 · 벚꽃)
function skylineArt(id) {
  const towers = [
    [190, 70], [210, 95], [232, 60], [252, 110], [276, 80], [298, 125], [318, 75], [342, 100], [366, 65], [384, 115],
    [8, 90], [30, 120], [52, 75], [74, 105],
  ];
  const blossoms = [
    [20, 262, 30], [58, 280, 26], [96, 270, 22], [8, 232, 18], [44, 240, 16], [360, 270, 30], [392, 250, 24], [330, 288, 22], [376, 226, 14],
  ];
  return `<svg class="skyline" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="sky-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ef7f78" /><stop offset="1" stop-color="#f8c3ad" /></linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#sky-${id})" />
    <circle cx="310" cy="120" r="36" fill="#fde2d2" opacity=".55" />
    <path d="M0 205 C60 150 120 150 175 190 S290 160 400 182 V300 H0Z" fill="#c75f63" opacity=".55" />
    <g fill="#8a3b49">
      <rect x="140" y="92" width="4" height="64" />
      <rect x="134" y="118" width="16" height="9" rx="3" />
      <path d="M131 196 L139 150 h6 L153 196Z" />
      ${towers.map(([x, h]) => `<rect x="${x}" y="${238 - h}" width="18" height="${h}" rx="1.5" opacity=".85" />`).join("")}
    </g>
    <rect y="238" width="400" height="62" fill="#e9877f" opacity=".65" />
    <path d="M90 246 h220" stroke="#8a3b49" stroke-width="3" opacity=".7" />
    ${blossoms.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f9c6cf" /><circle cx="${x + r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.55}" fill="#fde1e6" />`).join("")}
  </svg>`;
}

const landmarkIcon = (kind) => ({ station: "🚇", spot: "📍", hotel: "🏨", airport: "✈️" })[kind] || "📍";
const currentAreaOf = (place) => AREAS.find((a) => a.id === place.area);

function ratingHtml(place) {
  const r = ratingOf(place);
  return `<span class="rating"><i class="star">★</i> ${r.avg.toFixed(1)} <small>(${r.count.toLocaleString(locale())})</small></span>`;
}

const durationText = (minutes) => t("minutes", { m: minutes });

/* =========================================================
   6. 화면 이동 (해시 라우터)
   #/home · #/map · #/explore · #/saved · #/trips · #/place/<id> · #/course/<id>
   ========================================================= */

const SCREENS = ["home", "map", "explore", "saved", "trips", "place", "course"];
let navCount = 0;

function parseRoute() {
  const [, name = "home", id = ""] = (location.hash || "#/home").split("/");
  return { name: SCREENS.includes(name) ? name : "home", id: decodeURIComponent(id) };
}

const go = (path) => {
  if (location.hash === path) renderScreen();
  else location.hash = path;
};

function goBack() {
  if (navCount > 0) history.back();
  else go("#/home");
}

const RENDERERS = {
  home: renderHome,
  map: renderMapScreen,
  explore: renderExplore,
  saved: renderSaved,
  trips: renderTrips,
  place: renderPlace,
  course: renderCourse,
};

function renderScreen() {
  const route = parseRoute();
  if (route.name === "place" && !placeById(route.id)) return go("#/home");
  if (route.name === "course" && !COURSES.some((c) => c.id === route.id)) return go("#/home");
  document.body.dataset.screen = route.name;
  $$(".screen").forEach((s) => (s.hidden = s.dataset.screen !== route.name));
  const activeTab = { place: "", course: "trips" }[route.name] ?? route.name;
  $$(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === activeTab));
  $("#tabbar").hidden = route.name === "place";
  RENDERERS[route.name](route.id);
  renderTabbar();
}

function renderTabbar() {
  const active = state.bookings.filter((b) => b.status === "confirmed" || b.status === "requested").length;
  const badge = $("#tripBadge");
  badge.hidden = active === 0;
  badge.textContent = active;
}

/* =========================================================
   7. 공통 조각 — 카드 · 카테고리 · 지역 선택
   ========================================================= */

function areaPicker(id) {
  return `<label class="area-pill">
    ${icon("pin")}
    <select id="${id}" data-area-select aria-label="area">
      ${AREAS.map((a) => `<option value="${a.id}" ${a.id === state.area ? "selected" : ""}>${esc(L(a.name))}</option>`).join("")}
    </select>
    ${icon("down", "sm")}
  </label>`;
}

function categoryRow(style) {
  const all = `<button class="cat ${style} ${state.category === "all" ? "on" : ""}" type="button" data-cat="all"><span class="cat-all">${esc(t("all"))}</span></button>`;
  return (
    all +
    CATEGORIES.map(
      (c) => `<button class="cat ${style} ${state.category === c.id ? "on" : ""}" type="button" data-cat="${c.id}">
        <span class="cat-icon" style="--tone: var(--tone-${c.tone})">${icon(c.glyph)}</span>
        <span class="cat-name">${esc(L(c.name))}</span>
      </button>`
    ).join("")
  );
}

function heartButton(place, cls = "") {
  const fav = state.favorites.includes(place.id);
  return `<button class="fav-btn ${cls} ${fav ? "on" : ""}" type="button" data-fav="${place.id}" aria-pressed="${fav}" aria-label="${esc(t(fav ? "saved" : "save"))}">${icon("heart", fav ? "fill" : "")}</button>`;
}

// 세로형 카드 (홈 가로 스크롤)
function tileCard(place) {
  const cat = categoryById(place.category);
  const meters = distance(originPoint(), place);
  return `<article class="tile" data-go="#/place/${place.id}" tabindex="0">
    <div class="tile-cover">${art(place)}${heartButton(place, "float")}${place.sponsored ? `<span class="badge ad float-badge">${esc(t("ad"))}</span>` : ""}</div>
    <div class="tile-body">
      <div class="tile-top"><b>${esc(L(cat.name))}</b>${ratingHtml(place)}</div>
      <p class="tile-name">${esc(L(place.name))}</p>
      <p class="tile-meta">${icon("pin", "sm")} ${esc(L(currentAreaOf(place).name))} · ${esc(t("walk", { m: walkMinutes(meters) }))}</p>
    </div>
  </article>`;
}

// 가로형 카드 (탐색 · 찜 · 지도 하단)
function rowCard(place, meters = distance(originPoint(), place)) {
  const cat = categoryById(place.category);
  const open = isOpen(place);
  return `<article class="row-card" data-go="#/place/${place.id}" tabindex="0">
    ${art(place, "thumb")}
    <div class="row-body">
      <div class="row-top">
        <div>
          <p class="row-cat" style="--tone: ${toneVar(place)}">${esc(L(cat.name))}</p>
          <h3 class="row-name">${esc(L(place.name))}</h3>
        </div>
        ${heartButton(place)}
      </div>
      <p class="row-meta">${ratingHtml(place)} · ${esc(t("walk", { m: walkMinutes(meters) }))}</p>
      <div class="badges">
        ${place.sponsored ? `<span class="badge ad">${esc(t("ad"))}</span>` : ""}
        ${place.verified ? `<span class="badge verified">✓ ${esc(t("verified"))}</span>` : ""}
        <span class="badge ${place.booking === "walkin" ? "" : "accent"}">${esc(t(place.booking))}</span>
        <span class="badge ${open ? "open" : "closed"}">● ${esc(t(open ? "open" : "closedNow"))}</span>
      </div>
      <div class="row-foot">
        <span class="muted">${place.langs.map((c) => c.toUpperCase()).join(" · ")}</span>
        <b class="price">${esc(t("from", { p: money(minPrice(place)) }))}</b>
      </div>
    </div>
  </article>`;
}

function courseCard(course) {
  const first = placeById(course.steps[0].place);
  const area = AREAS.find((a) => a.id === course.area);
  return `<article class="tile course-tile" data-go="#/course/${course.id}" tabindex="0">
    <div class="tile-cover">${art(first)}<span class="course-stops">${course.steps
      .map((s) => `<span style="--tone: ${toneVar(placeById(s.place))}">${icon(glyphOf(placeById(s.place)))}</span>`)
      .join("")}</span></div>
    <div class="tile-body">
      <p class="tile-name">${esc(L(course.title))}</p>
      <p class="tile-meta">${icon("pin", "sm")} ${esc(L(area.name))} · ${esc(t("stepsN", { n: course.steps.length }))} · ${esc(t("aboutHours", { n: courseHours(course) }))}</p>
    </div>
  </article>`;
}

function courseHours(course) {
  const first = toMin(course.steps[0].start);
  const last = course.steps[course.steps.length - 1];
  const end = toMin(last.start) + placeById(last.place).services[last.service].minutes;
  return Math.round(((end - first) / 60) * 2) / 2;
}

/* =========================================================
   8. 홈
   ========================================================= */

function renderHome() {
  $("#homeAreaSlot").innerHTML = areaPicker("homeArea");
  $("#homeCats").innerHTML = categoryRow("pill");
  $("#bellDot").hidden = !hasUnseenNotifications();

  const score = (p) => ratingOf(p).avg * 10 + Math.log10(ratingOf(p).count);
  const popular = PLACES.filter((p) => p.area === state.area)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 6);
  $("#popularRow").innerHTML = popular.map(tileCard).join("");

  const courses = [...COURSES].sort((a, b) => (b.area === state.area) - (a.area === state.area));
  $("#curatedRow").innerHTML = courses.map(courseCard).join("");
}

/* =========================================================
   9. 지도 (API 없이 그리는 개략도) — 실제 지도 API 연동 전 단계
   ========================================================= */

// 지역별 배경 장식: 강(river: top | bottom), 공원 [x, y, 크기] (화면 비율)
const MAP_DECOR = {
  myeongdong: { river: null, parks: [[0.82, 0.78, 0.2]] },
  gangnam: { river: "top", parks: [[0.12, 0.55, 0.12]] },
  hongdae: { river: "bottom", parks: [[0.55, 0.2, 0.08]] },
  seongsu: { river: "bottom", parks: [[0.08, 0.5, 0.2]] },
};

let projector = null;
let currentResults = [];

function makeProjector(areaId, W, H) {
  const area = AREAS.find((a) => a.id === areaId);
  const pts = [...PLACES.filter((p) => p.area === areaId), ...area.landmarks];
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const cLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const cLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  const kx = Math.cos((cLat * Math.PI) / 180);
  const spanX = (Math.max(...lngs) - Math.min(...lngs)) * kx || 0.001;
  const spanY = Math.max(...lats) - Math.min(...lats) || 0.001;
  // 위쪽 검색창 · 아래쪽 카드와 탭바를 피해서 배치
  const box = { left: 56, right: W - 70, top: 170, bottom: H - 200 };
  const scale = Math.min((box.right - box.left) / spanX, Math.max(box.bottom - box.top, 140) / spanY);
  const cx = (box.left + box.right) / 2;
  const cy = (box.top + box.bottom) / 2;
  return {
    xy: (p) => [cx + (p.lng - cLng) * kx * scale, cy - (p.lat - cLat) * scale],
    metersToPx: (m) => (m / 111320) * scale,
  };
}

function mapDecor(W, H) {
  const decor = MAP_DECOR[state.area] || {};
  const seed = hash(state.area);
  let svg = `<rect class="m-land" width="${W}" height="${H}" />`;
  (decor.parks || []).forEach(([x, y, r]) => {
    svg += `<ellipse class="m-park" cx="${x * W}" cy="${y * H}" rx="${r * W + 30}" ry="${r * W * 0.7 + 24}" />`;
  });
  if (decor.river) {
    const y = decor.river === "top" ? H * 0.1 : H * 0.92;
    svg += `<path class="m-water" d="M-20 ${y + 30} C ${W * 0.3} ${y - 40}, ${W * 0.6} ${y + 50}, ${W + 20} ${y - 10}" />`;
  }
  svg += `<g class="m-minor" transform="rotate(${(seed % 16) - 8} ${W / 2} ${H / 2})">`;
  for (let x = -W; x < W * 2; x += 64) svg += `<line x1="${x}" y1="${-H}" x2="${x}" y2="${H * 2}" />`;
  for (let y = -H; y < H * 2; y += 64) svg += `<line x1="${-W}" y1="${y}" x2="${W * 2}" y2="${y}" />`;
  svg += `</g><g class="m-major">`;
  svg += `<line x1="-20" y1="${H * (0.3 + (seed % 20) / 100)}" x2="${W + 20}" y2="${H * (0.38 + ((seed >> 5) % 20) / 100)}" />`;
  svg += `<line x1="${W * (0.35 + ((seed >> 9) % 20) / 100)}" y1="-20" x2="${W * (0.45 + ((seed >> 13) % 20) / 100)}" y2="${H + 20}" />`;
  svg += `<line x1="-20" y1="${H * 0.75}" x2="${W + 20}" y2="${H * (0.62 + ((seed >> 17) % 15) / 100)}" />`;
  svg += `</g>`;
  return svg;
}

function renderMapScreen() {
  $("#mapAreaSlot").innerHTML = areaPicker("mapArea");
  $("#mapCats").innerHTML = categoryRow("chip");
  $("#mapQuery").value = state.query;
  drawMap();
}

function drawMap() {
  const box = $("#mapBox");
  const W = box.clientWidth || 400;
  const H = box.clientHeight || 700;
  currentResults = visiblePlaces();
  projector = makeProjector(state.area, W, H);
  const { xy, metersToPx } = projector;
  const area = currentArea();
  const visibleIds = new Set(currentResults.map((r) => r.place.id));
  const origin = originPoint();
  const [ox, oy] = xy(origin);

  let svg = mapDecor(W, H);

  [5, 10].forEach((m) => {
    const r = metersToPx((m * 75) / 1.25);
    svg += `<circle class="m-ring" cx="${ox}" cy="${oy}" r="${r}" />`;
    svg += `<text class="m-ring-label" x="${ox + r * 0.71 + 4}" y="${oy - r * 0.71 - 2}">${esc(t("ringLabel", { m }))}</text>`;
  });

  area.landmarks.forEach((l) => {
    const [x, y] = xy(l);
    svg += `<g class="m-landmark ${state.near === l.id ? "origin" : ""}" transform="translate(${x} ${y})">
      <circle r="5" /><text x="9" y="4">${landmarkIcon(l.kind)} ${esc(L(l.name))}</text>
    </g>`;
  });

  const route = state.route && state.route.area === state.area ? state.route.ids.map(placeById).filter(Boolean) : [];
  if (route.length > 1) svg += `<polyline class="m-route" points="${route.map((p) => xy(p).join(",")).join(" ")}" />`;

  svg += `<g class="m-me" transform="translate(${ox} ${oy})"><circle class="halo" r="16" /><circle r="7" /></g>`;

  PLACES.filter((p) => p.area === state.area)
    .sort((a, b) => (a.id === state.selected) - (b.id === state.selected))
    .forEach((p) => {
      const [x, y] = xy(p);
      const cls = ["pin", visibleIds.has(p.id) ? "" : "dim", state.selected === p.id ? "selected" : ""].join(" ");
      svg += `<g class="${cls}" data-marker="${p.id}" transform="translate(${x} ${y})" tabindex="0" role="button" aria-label="${esc(L(p.name))}">
        <g class="pin-inner">
          <path d="M0 0C-4 -7 -15 -14 -15 -27a15 15 0 1 1 30 0C15 -14 4 -7 0 0Z" fill="${toneVar(p)}" />
          <g class="pin-glyph" transform="translate(-9 -36) scale(.75)">${ICONS[glyphOf(p)]}</g>
        </g>
      </g>`;
    });

  route.forEach((p, i) => {
    const [x, y] = xy(p);
    svg += `<g class="m-step" transform="translate(${x + 15} ${y - 44})"><circle r="10" /><text>${i + 1}</text></g>`;
  });

  const svgEl = $("#mapSvg");
  svgEl.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svgEl.innerHTML = svg;

  const place = placeById(state.selected);
  const card = $("#mapCard");
  if (place && place.area === state.area) {
    card.innerHTML = `<button class="map-card-close" type="button" data-unselect aria-label="${esc(t("close"))}">${icon("close")}</button>${rowCard(place)}`;
    card.hidden = false;
  } else {
    card.hidden = true;
  }
  $("#mapCount").textContent = t("results", { n: currentResults.length });
}

function selectOnMap(id) {
  state.selected = state.selected === id ? null : id;
  drawMap();
}

function cycleOrigin() {
  const ids = ["", ...currentArea().landmarks.map((l) => l.id)];
  state.near = ids[(ids.indexOf(state.near) + 1) % ids.length];
  const l = currentArea().landmarks.find((x) => x.id === state.near);
  toast(l ? `${landmarkIcon(l.kind)} ${L(l.name)}` : t("areaCenter"));
  drawMap();
}

function showRoute(area, ids) {
  state.route = { area, ids };
  setArea(area);
  state.selected = null;
  state.category = "all";
  go("#/map");
}

/* =========================================================
   10. 탐색 · 찜
   ========================================================= */

function renderExplore() {
  $("#exploreAreaSlot").innerHTML = areaPicker("exploreArea");
  $("#exploreCats").innerHTML = categoryRow("chip");
  $("#exploreQuery").value = state.query;
  $$("[data-toggle]").forEach((btn) => btn.setAttribute("aria-pressed", String(state[btn.dataset.toggle])));
  const activeFilters = [state.speak, state.price, state.near].filter(Boolean).length + (state.sort !== "recommended" ? 1 : 0);
  $("#filterCount").hidden = activeFilters === 0;
  $("#filterCount").textContent = activeFilters;
  renderExploreList();
}

function renderExploreList() {
  currentResults = visiblePlaces();
  $("#exploreCount").textContent = t("results", { n: currentResults.length });
  $("#exploreList").innerHTML = currentResults.length
    ? currentResults.map(({ place, meters }) => rowCard(place, meters)).join("")
    : `<div class="blank"><p>${esc(t("noResults"))}</p><button class="btn-line" type="button" data-reset>${esc(t("reset"))}</button></div>`;
}

function renderSaved() {
  const favs = state.favorites.map(placeById).filter(Boolean);
  $("#savedList").innerHTML = favs.length
    ? favs.map((p) => rowCard(p)).join("")
    : `<div class="blank">${icon("heart", "big")}<p>${esc(t("noFavorites"))}</p></div>`;
}

function toggleFavorite(id) {
  const has = state.favorites.includes(id);
  state.favorites = has ? state.favorites.filter((f) => f !== id) : [...state.favorites, id];
  storage.set(KEYS.favorites, state.favorites);
  toast(t(has ? "toastUnsaved" : "toastSaved"));
  $$(`[data-fav="${id}"]`).forEach((btn) => {
    btn.classList.toggle("on", !has);
    btn.setAttribute("aria-pressed", String(!has));
    btn.innerHTML = icon("heart", has ? "" : "fill");
  });
  if (parseRoute().name === "saved") renderSaved();
}

/* =========================================================
   11. 장소 상세
   ========================================================= */

function renderPlace(id) {
  const place = placeById(id);
  state.selected = id;
  const cat = categoryById(place.category);
  const r = ratingOf(place);
  const near = nearestLandmark(place);
  const days = t("days");
  const canBook = place.booking !== "walkin";
  const open = isOpen(place);
  const foreign = place.langs.filter((c) => c !== "ko");
  const features = [
    ["chat", t("featLang", { lang: SPEAKS[foreign[0]] || "English" })],
    place.interpreter ? ["people", t("interpreter")] : ["clipboard", t("featConsult")],
    place.medical ? ["shield", t("featMedical")] : place.verified ? ["shield", t("verified")] : ["map", L(currentAreaOf(place).name)],
    ["calendar", canBook ? t(place.booking === "instant" ? "featEasy" : "request") : t("walkin")],
  ];
  const reviews = [
    ...state.userReviews.filter((rv) => rv.placeId === id).map((rv) => ({ ...rv, verifiedVisit: true })),
    ...place.reviews,
  ];
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;

  $("#placeView").innerHTML = `
    <div class="place-hero">
      ${art(place, "hero")}
      <div class="hero-bar">
        <button class="round-btn" type="button" data-back aria-label="${esc(t("back"))}">${icon("back")}</button>
        <span class="spacer"></span>
        ${heartButton(place, "round-btn")}
        <button class="round-btn" type="button" data-share="${place.id}" aria-label="${esc(t("share"))}">${icon("share")}</button>
      </div>
      <span class="hero-note">${esc(t("sampleNote"))}</span>
    </div>

    <div class="place-body">
      <p class="eyebrow" style="--tone: ${toneVar(place)}">${esc(L(cat.name))}</p>
      <h1 class="serif">${esc(L(place.name))}</h1>
      <p class="place-sub">
        <span class="rating"><i class="star">★</i> ${r.avg.toFixed(1)}</span> <span class="muted">(${esc(t("reviewsN", { n: r.count.toLocaleString(locale()) }))})</span>
        · ${esc(L(currentAreaOf(place).name))} · ${icon("clock", "sm")} ${esc(t("walk", { m: walkMinutes(near.d) }))}
      </p>
      <div class="badges">
        ${place.sponsored ? `<span class="badge ad">${esc(t("ad"))}</span>` : ""}
        ${place.verified ? `<span class="badge verified">✓ ${esc(t("verified"))}</span>` : ""}
        <span class="badge ${open ? "open" : "closed"}">● ${esc(t(open ? "open" : "closedNow"))}</span>
      </div>
      ${place.sponsored ? `<p class="ad-note">${esc(t("adNote"))}</p>` : ""}

      <div class="features">
        ${features.map(([ic, label]) => `<div class="feature">${icon(ic)}<span>${esc(label)}</span></div>`).join("")}
      </div>

      <p class="place-desc">${esc(L(place.desc))}</p>

      <h2 class="block-title">${esc(t("popularServices"))}</h2>
      <div class="service-list">
        ${place.services
          .map(
            (s, i) => `<button class="service" type="button" ${canBook ? `data-book="${place.id}" data-service="${i}"` : "disabled"}>
              <span class="service-thumb" style="--tone: ${toneVar(place)}">${icon(glyphOf(place))}</span>
              <span class="service-text"><b>${esc(L(s.name))}</b><small>${icon("clock", "sm")} ${esc(durationText(s.minutes))}</small></span>
              <span class="service-price">${esc(money(s.price))}</span>
              ${canBook ? icon("chevron", "sm muted") : ""}
            </button>`
          )
          .join("")}
      </div>

      <h2 class="block-title">${esc(t("moreInfo"))}</h2>
      <dl class="info-list">
        <div><dt>${esc(t("hours"))}</dt><dd>${place.hours[0]} – ${place.hours[1]}</dd></div>
        <div><dt>${esc(t("closedDays"))}</dt><dd>${place.closed.length ? place.closed.map((d) => days[d]).join(", ") : esc(t("noClosed"))}</dd></div>
        <div><dt>${esc(t("languages"))}</dt><dd>${place.langs.map((c) => SPEAKS[c]).join(", ")}</dd></div>
        <div><dt>${esc(t("location"))}</dt><dd>${landmarkIcon(near.l.kind)} ${esc(t("nearestFrom", { place: L(near.l.name), m: walkMinutes(near.d) }))}</dd></div>
        <div><dt>${esc(t("directions"))}</dt><dd class="links">
          <a href="${directionsUrl}" target="_blank" rel="noopener">Google Maps</a>
          <a href="https://map.kakao.com/link/to/${encodeURIComponent(L(place.name))},${place.lat},${place.lng}" target="_blank" rel="noopener">Kakao Map</a>
        </dd></div>
      </dl>

      <h2 class="block-title">${esc(t("policy"))}</h2>
      <p class="notice">${esc(L(POLICIES[place.policy]))}</p>
      ${place.medical ? `<h2 class="block-title">⚕️ ${esc(t("medicalNotice"))}</h2><p class="notice medical">${esc(t("medicalText"))}</p>` : ""}

      <h2 class="block-title">${esc(t("reviewsTitle"))} <span class="muted">${r.count.toLocaleString(locale())}</span></h2>
      ${reviews
        .map(
          (rv) => `<div class="review">
            <div class="review-head">
              <b>${esc(rv.author)}</b> ${esc(rv.from || "")}
              <span class="rating">${"★".repeat(rv.rating)}</span>
              <span>· ${esc(t("langScore"))} ${rv.langScore}/5</span>
              ${rv.verifiedVisit ? `<span class="badge verified">✓ ${esc(t("visitVerified"))}</span>` : ""}
            </div>
            <p>${esc(rv.text)}</p>
          </div>`
        )
        .join("")}
    </div>

    <div class="book-bar">
      <div class="book-price"><small>${esc(L(cat.name))}</small><b>${esc(t("from", { p: money(minPrice(place)) }))}</b></div>
      ${
        canBook
          ? `<button class="btn-accent big" type="button" data-book="${place.id}" data-service="0">${esc(t("bookNow"))}</button>`
          : `<a class="btn-accent big" href="${directionsUrl}" target="_blank" rel="noopener">${esc(t("directions"))}</a>`
      }
    </div>`;
}

async function sharePlace(id) {
  const place = placeById(id);
  const url = `${location.href.split("#")[0]}#/place/${id}`;
  try {
    if (navigator.share) return await navigator.share({ title: L(place.name), url });
    await navigator.clipboard.writeText(url);
    toast(t("linkCopied"));
  } catch {}
}

/* =========================================================
   12. 내 여행 (예약 일정) · 코스
   ========================================================= */

function timelineItem({ time, place, sub, minutes, extra = "" }) {
  return `<li class="tl-item">
    <span class="tl-time">${time}</span>
    <span class="tl-dot" style="--tone: ${toneVar(place)}">${icon(glyphOf(place))}</span>
    <div class="tl-main">
      <div class="tl-card" data-go="#/place/${place.id}">
        ${art(place, "tl-thumb")}
        <div class="tl-text">
          <b>${esc(L(place.name))}</b>
          <span>${esc(sub)}</span>
          <small>${icon("clock", "sm")} ${esc(durationText(minutes))}</small>
        </div>
        ${icon("chevron", "sm muted")}
      </div>
      ${extra}
    </div>
  </li>`;
}

function tripHero({ id, title, sub, date }) {
  return `<div class="trip-hero">
    ${skylineArt(id)}
    <div class="trip-hero-text">
      <h2 class="serif">${esc(title)}</h2>
      ${date ? `<p>${esc(date)}</p>` : ""}
    </div>
  </div>
  <p class="trip-sub">${esc(sub)}</p>`;
}

function bookingExtra(b) {
  const live = b.status === "confirmed" || b.status === "requested";
  return `<div class="tl-extra">
    <div class="tl-code">
      <span class="status ${b.status}">${esc(t("status_" + b.status))}</span>
      ${b.status !== "cancelled" ? `<span class="code" title="${esc(t("bookingNo"))}">${b.id}</span>` : ""}
      <span class="muted">${esc(t("peopleN", { n: b.people }))} · ${esc(money(b.total))}</span>
    </div>
    <div class="tl-actions">
      ${live ? `<button class="mini-btn" type="button" data-cancel="${b.id}">${esc(t("cancelBooking"))}</button>` : ""}
      ${b.status === "requested" ? `<button class="mini-btn demo" type="button" data-approve="${b.id}">${esc(t("approveDemo"))}</button>` : ""}
      ${b.status === "confirmed" ? `<button class="mini-btn demo" type="button" data-visit="${b.id}">${esc(t("visitDemo"))}</button>` : ""}
      ${b.status === "visited" && !b.reviewed ? `<button class="mini-btn accent" type="button" data-review="${b.id}">${esc(t("writeReview"))}</button>` : ""}
      ${b.status === "visited" && b.reviewed ? `<span class="badge verified">✓ ${esc(t("reviewed"))}</span>` : ""}
    </div>
  </div>`;
}

function bookingItem(b, time) {
  const place = placeById(b.placeId);
  const service = place.services[b.service];
  return timelineItem({ time, place, sub: L(service.name), minutes: service.minutes, extra: bookingExtra(b) });
}

function renderTrips() {
  const byTime = (a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
  const valid = state.bookings.filter((b) => placeById(b.placeId));
  const upcoming = valid.filter((b) => b.status === "confirmed" || b.status === "requested").sort(byTime);
  const past = valid.filter((b) => b.status === "visited" || b.status === "cancelled").sort((a, b) => byTime(b, a));
  const view = $("#tripsView");

  if (!valid.length) {
    view.innerHTML = `
      ${tripHero({ id: "trip-empty", title: t("tripDay", { area: L(currentArea().name) }), sub: t("tripSub") })}
      <div class="blank">${icon("calendar", "big")}<p>${esc(t("noBookings"))}</p></div>
      <h2 class="block-title">${esc(t("curated"))}</h2>
      <div class="h-scroll">${COURSES.map(courseCard).join("")}</div>`;
    return;
  }

  const groups = [];
  upcoming.forEach((b) => {
    const last = groups[groups.length - 1];
    if (last && last.date === b.date) last.items.push(b);
    else groups.push({ date: b.date, items: [b] });
  });

  const head = upcoming[0] || past[0];
  let html = tripHero({
    id: "trip",
    title: t("tripDay", { area: L(currentAreaOf(placeById(head.placeId)).name) }),
    sub: t("tripSub"),
    date: upcoming[0] ? formatDate(upcoming[0].date) : "",
  });

  if (groups.length) html += `<h2 class="block-title">${esc(t("upcoming"))}</h2>`;
  groups.forEach((g) => {
    const ids = g.items.map((b) => b.placeId);
    const area = placeById(ids[0]).area;
    html += `<section class="day">
      <h3 class="day-title">${icon("calendar", "sm")} ${esc(formatDate(g.date))}</h3>
      <ol class="timeline">${g.items.map((b) => bookingItem(b, b.time)).join("")}</ol>
      <button class="btn-soft wide" type="button" data-route="${area}|${ids.join(",")}">${icon("map")} ${esc(t("showOnMap"))}</button>
    </section>`;
  });

  if (past.length) {
    html += `<h2 class="block-title">${esc(t("past"))}</h2>
      <ol class="timeline past">${past.map((b) => bookingItem(b, `${esc(formatDate(b.date))}<br>${b.time}`)).join("")}</ol>`;
  }
  view.innerHTML = html;
}

function renderCourse(id) {
  const course = COURSES.find((c) => c.id === id);
  const area = AREAS.find((a) => a.id === course.area);
  const days = t("days");
  const closedDays = [...new Set(course.steps.flatMap((s) => placeById(s.place).closed))].sort();
  $("#courseView").innerHTML = `
    <div class="screen-head">
      <button class="icon-btn" type="button" data-back aria-label="${esc(t("back"))}">${icon("back")}</button>
      <h1>${esc(t("curated"))}</h1>
      <span class="icon-btn ghost"></span>
    </div>
    ${tripHero({ id: course.id, title: L(course.title), sub: `${L(area.name)} · ${t("aboutHours", { n: courseHours(course) })}` })}
    ${closedDays.length ? `<p class="notice small">${esc(t("courseClosed", { day: closedDays.map((d) => days[d]).join(", ") }))}</p>` : ""}
    <ol class="timeline">
      ${course.steps
        .map((s, i) => {
          const place = placeById(s.place);
          const service = place.services[s.service];
          const gap = i > 0 ? `<li class="tl-gap">${esc(t("move", { m: walkMinutes(distance(placeById(course.steps[i - 1].place), place)) }))}</li>` : "";
          const extra =
            place.booking !== "walkin"
              ? `<div class="tl-actions"><button class="mini-btn accent" type="button" data-book="${place.id}" data-service="${s.service}">${esc(t("book"))} · ${esc(money(service.price))}</button></div>`
              : `<div class="tl-actions"><span class="badge">${esc(t("walkin"))} · ${esc(money(service.price))}</span></div>`;
          return gap + timelineItem({ time: s.start, place, sub: L(service.name), minutes: service.minutes, extra });
        })
        .join("")}
    </ol>
    <button class="btn-accent wide big" type="button" data-route="${course.area}|${course.steps.map((s) => s.place).join(",")}">${icon("map")} ${esc(t("showOnMap"))}</button>`;
}

/* =========================================================
   13. 예약
   ========================================================= */

let bookingPlace = null;

function openBooking(placeId, serviceIndex = 0) {
  const place = placeById(placeId);
  if (!place || place.booking === "walkin") return;
  bookingPlace = place;
  const form = $("#bookingForm");
  form.reset();
  $("#bookingError").textContent = "";
  $("#bookingPlace").textContent = `${L(place.name)} · ${t(place.booking)}`;

  $("#bookingService").innerHTML = place.services
    .map((s, i) => `<option value="${i}">${esc(L(s.name))} · ${esc(money(s.price))} · ${esc(durationText(s.minutes))}</option>`)
    .join("");
  $("#bookingService").value = String(serviceIndex);
  $("#bookingPeople").innerHTML = [1, 2, 3, 4].map((n) => `<option value="${n}">${esc(t("peopleN", { n }))}</option>`).join("");

  const today = seoulNow().date;
  const dateInput = $("#bookingDate");
  dateInput.min = today;
  dateInput.max = addDays(today, 60);
  dateInput.value = firstOpenDate(place, today, serviceIndex);

  const last = state.bookings[state.bookings.length - 1];
  if (last) {
    $("#bookingName").value = last.name || "";
    form.email.value = last.email || "";
  }

  $("#bookingSubmit").textContent = t(place.booking === "instant" ? "submitInstant" : "submitRequest");
  renderSlots();
  renderBookingSummary();
  $("#bookingDialog").showModal();
}

function firstOpenDate(place, from, serviceIndex) {
  for (let i = 0; i < 14; i++) {
    const d = addDays(from, i);
    if (slotsFor(place, d, serviceIndex).some((s) => s.free)) return d;
  }
  return from;
}

function slotsFor(place, date, serviceIndex) {
  if (!date || place.closed.includes(dayOfDate(date))) return [];
  const now = seoulNow();
  const minutes = place.services[serviceIndex]?.minutes || 30;
  const start = toMin(place.hours[0]);
  const end = toMin(place.hours[1]) - Math.min(minutes, 90);
  const taken = new Set(state.bookings.filter((b) => b.placeId === place.id && b.date === date && b.status !== "cancelled").map((b) => b.time));
  const slots = [];
  for (let m = start; m <= end; m += 30) {
    const time = toHHMM(m);
    const past = date === now.date && m <= now.minutes + 60;
    const busy = hash(`${place.id}|${date}|${time}`) % 5 === 0; // 예시: 다른 손님 예약으로 찬 시간
    slots.push({ time, free: !past && !busy && !taken.has(time) });
  }
  return slots;
}

function renderSlots() {
  const form = $("#bookingForm");
  const date = form.date.value;
  const checked = form.querySelector('input[name="time"]:checked')?.value;
  const slots = slotsFor(bookingPlace, date, Number(form.service.value));
  const grid = $("#slotGrid");
  if (date && bookingPlace.closed.includes(dayOfDate(date))) {
    grid.innerHTML = `<p class="none">${esc(t("closedDay"))}</p>`;
    return;
  }
  if (!slots.some((s) => s.free)) {
    grid.innerHTML = `<p class="none">${esc(t("noSlots"))}</p>`;
    return;
  }
  grid.innerHTML = slots
    .map((s) => `<label><input type="radio" name="time" value="${s.time}" ${s.free ? "" : "disabled"} ${s.free && s.time === checked ? "checked" : ""} /><span>${s.time}</span></label>`)
    .join("");
}

function bookingTotal() {
  const form = $("#bookingForm");
  return bookingPlace.services[Number(form.service.value)].price * Number(form.people.value || 1);
}

function renderBookingSummary() {
  const total = bookingTotal();
  const deposit = Math.round((total * 0.1) / 100) * 100;
  $("#bookingSummary").innerHTML = `
    <div><span>${esc(t("total"))}</span><b>${esc(money(total))}</b></div>
    ${total ? `<div><span>${esc(t("deposit"))}</span><span>${esc(money(deposit))}</span></div>` : ""}
    <small>${esc(t("payOnSite"))} · ${esc(t("depositNote"))}</small>`;
}

function newBookingId(date) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `KB${date.slice(2).replace(/-/g, "")}-${code}`;
}

function submitBooking(event) {
  event.preventDefault();
  const form = $("#bookingForm");
  const time = form.querySelector('input[name="time"]:checked')?.value;
  const name = $("#bookingName").value.trim();
  if (!time || !name || !form.date.value || !form.consent.checked) {
    $("#bookingError").textContent = t("required");
    return;
  }
  const now = new Date().toISOString();
  const status = bookingPlace.booking === "instant" ? "confirmed" : "requested";
  const booking = {
    id: newBookingId(form.date.value),
    placeId: bookingPlace.id,
    service: Number(form.service.value),
    date: form.date.value,
    time,
    people: Number(form.people.value),
    name,
    email: form.email.value.trim(),
    note: form.note.value.trim(),
    total: bookingTotal(),
    status,
    reviewed: false,
    createdAt: now,
    updatedAt: now,
  };
  state.bookings.push(booking);
  storage.set(KEYS.bookings, state.bookings);
  $("#bookingDialog").close();
  toast(t(status === "confirmed" ? "toastConfirmed" : "toastRequested", { id: booking.id }));
  go("#/trips");
}

function updateBooking(id, patch) {
  const booking = state.bookings.find((b) => b.id === id);
  if (!booking) return;
  Object.assign(booking, patch, { updatedAt: new Date().toISOString() });
  storage.set(KEYS.bookings, state.bookings);
  renderScreen();
}

/* =========================================================
   14. 리뷰 · 알림 · 설정 · 필터 시트
   ========================================================= */

let reviewBooking = null;
const reviewScores = { rating: 0, langScore: 0 };

function renderStarInputs() {
  $$(".star-input").forEach((box) => {
    const key = box.dataset.name;
    box.innerHTML = [1, 2, 3, 4, 5]
      .map((n) => `<button type="button" data-star="${n}" class="${n <= reviewScores[key] ? "on" : ""}" aria-label="${n}/5">★</button>`)
      .join("");
  });
}

function openReview(bookingId) {
  reviewBooking = state.bookings.find((b) => b.id === bookingId);
  if (!reviewBooking) return;
  reviewScores.rating = 0;
  reviewScores.langScore = 0;
  $("#reviewForm").reset();
  $("#reviewError").textContent = "";
  $("#reviewPlace").textContent = L(placeById(reviewBooking.placeId).name);
  renderStarInputs();
  $("#reviewDialog").showModal();
}

function submitReview(event) {
  event.preventDefault();
  const text = $("#reviewForm").text.value.trim();
  if (!reviewScores.rating || !reviewScores.langScore || !text) {
    $("#reviewError").textContent = t("reviewRequired");
    return;
  }
  state.userReviews.unshift({
    id: `R-${reviewBooking.id}`,
    placeId: reviewBooking.placeId,
    bookingId: reviewBooking.id,
    author: reviewBooking.name,
    from: "",
    rating: reviewScores.rating,
    langScore: reviewScores.langScore,
    text,
    createdAt: new Date().toISOString(),
  });
  storage.set(KEYS.reviews, state.userReviews);
  $("#reviewDialog").close();
  toast(t("toastReview"));
  updateBooking(reviewBooking.id, { reviewed: true });
}

function notifications() {
  return state.bookings
    .map((b) => ({ b, at: b.updatedAt || b.createdAt, place: placeById(b.placeId) }))
    .filter((n) => n.place)
    .sort((a, b) => b.at.localeCompare(a.at));
}

const hasUnseenNotifications = () => notifications().some((n) => n.at > state.notifSeen);

function openNotifications() {
  const list = notifications();
  $("#notifList").innerHTML = list.length
    ? list
        .map(
          ({ b, at, place }) => `<button class="notif ${at > state.notifSeen ? "new" : ""}" type="button" data-go="#/trips">
            <span class="tl-dot" style="--tone: ${toneVar(place)}">${icon(glyphOf(place))}</span>
            <span><b>${esc(t("notif_" + b.status, { place: L(place.name) }))}</b>
            <small>${esc(formatDate(b.date))} ${b.time} · ${b.id}</small></span>
          </button>`
        )
        .join("")
    : `<p class="blank">${esc(t("noNotifications"))}</p>`;
  state.notifSeen = new Date().toISOString();
  storage.set("kbeautyNotifSeen", state.notifSeen);
  $("#bellDot").hidden = true;
  $("#notifDialog").showModal();
}

function openSettings() {
  $("#langOptions").innerHTML = LANGS.map(
    (l) => `<button class="seg ${l.code === state.lang ? "on" : ""}" type="button" data-lang="${l.code}">${l.label}</button>`
  ).join("");
  $("#currencyOptions").innerHTML = CURRENCIES.map(
    (c) => `<button class="seg ${c.code === state.currency ? "on" : ""}" type="button" data-currency="${c.code}">${c.code}</button>`
  ).join("");
  $("#darkToggle").checked = document.documentElement.dataset.theme === "dark";
  if (!$("#settingsDialog").open) $("#settingsDialog").showModal();
}

function openFilters() {
  $("#speakSelect").innerHTML =
    `<option value="">${esc(t("anyOption"))}</option>` + Object.entries(SPEAKS).map(([code, label]) => `<option value="${code}">${label}</option>`).join("");
  $("#speakSelect").value = state.speak;
  $("#priceSelect").innerHTML = [0, 1, 2, 3].map((n) => `<option value="${n}">${n ? "₩".repeat(n) : esc(t("anyOption"))}</option>`).join("");
  $("#priceSelect").value = String(state.price);
  $("#nearSelect").innerHTML =
    `<option value="">${esc(t("areaCenter"))}</option>` +
    currentArea().landmarks.map((l) => `<option value="${l.id}">${landmarkIcon(l.kind)} ${esc(L(l.name))}</option>`).join("");
  $("#nearSelect").value = state.near;
  $("#sortSelect").innerHTML = ["recommended", "rating", "distance", "price"]
    .map((s) => `<option value="${s}">${esc(t("sort" + s[0].toUpperCase() + s.slice(1)))}</option>`)
    .join("");
  $("#sortSelect").value = state.sort;
  $$("#filterDialog [data-toggle]").forEach((btn) => btn.setAttribute("aria-pressed", String(state[btn.dataset.toggle])));
  updateFilterButton();
  $("#filterDialog").showModal();
}

function updateFilterButton() {
  $("#filterApply").textContent = t("showResults", { n: visiblePlaces().length });
}

/* =========================================================
   15. 전체 다시 그리기와 이벤트
   ========================================================= */

function applyStaticText() {
  document.documentElement.lang = state.lang;
  document.title = t("docTitle");
  $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  $$("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  $$("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
  $$("[data-icon]").forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
  $("#fallbackNote").textContent = t("fallbackNote");
}

function renderAll() {
  applyStaticText();
  renderScreen();
}

function setArea(areaId) {
  if (state.area === areaId) return;
  state.area = areaId;
  state.near = "";
  state.selected = null;
}

function refreshResults() {
  const name = parseRoute().name;
  if (name === "map") drawMap();
  if (name === "explore") renderExplore();
  if ($("#filterDialog").open) updateFilterButton();
}

function setLang(code) {
  state.lang = code;
  storage.set(KEYS.lang, code);
  renderAll();
  $$("#splash [data-lang]").forEach((b) => b.classList.toggle("on", b.dataset.lang === code));
  if ($("#settingsDialog").open) openSettings();
}

function applyTheme(theme, save) {
  document.documentElement.dataset.theme = theme;
  if (save) storage.set(KEYS.theme, theme);
}

function setupEvents() {
  window.addEventListener("hashchange", () => {
    navCount++;
    renderScreen();
    window.scrollTo(0, 0);
  });

  let resizeFrame;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => parseRoute().name === "map" && drawMap());
  });

  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-area-select]")) {
      setArea(e.target.value);
      renderScreen();
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target.id === "mapQuery" || e.target.id === "exploreQuery") {
      state.query = e.target.value;
      if (e.target.id === "mapQuery") drawMap();
      else renderExploreList();
    }
  });

  document.addEventListener("click", (e) => {
    const el = e.target.closest(
      "[data-fav], [data-book], [data-cat], [data-route], [data-cancel], [data-approve], [data-visit], [data-review], [data-close], [data-back], [data-share], [data-marker], [data-unselect], [data-sheet], [data-lang], [data-currency], [data-toggle], [data-reset], [data-locate], [data-go]"
    );
    if (!el) return;
    const d = el.dataset;
    if (d.fav) return toggleFavorite(d.fav);
    if (d.book) return openBooking(d.book, Number(d.service || 0));
    if (d.close !== undefined) return el.closest("dialog").close();
    if (d.back !== undefined) return goBack();
    if (d.share) return sharePlace(d.share);
    if (d.marker) return selectOnMap(d.marker);
    if (d.unselect !== undefined) return selectOnMap(state.selected);
    if (d.locate !== undefined) return cycleOrigin();
    if (d.lang) return setLang(d.lang);
    if (d.currency) {
      state.currency = d.currency;
      storage.set(KEYS.currency, state.currency);
      openSettings();
      return renderScreen();
    }
    if (d.sheet) return { settings: openSettings, notifications: openNotifications, filters: openFilters }[d.sheet]();
    if (d.toggle) {
      state[d.toggle] = !state[d.toggle];
      $$(`[data-toggle="${d.toggle}"]`).forEach((b) => b.setAttribute("aria-pressed", String(state[d.toggle])));
      return refreshResults();
    }
    if (d.reset !== undefined) {
      Object.assign(state, DEFAULT_FILTERS);
      if ($("#filterDialog").open) $("#filterDialog").close();
      return renderScreen();
    }
    if (d.cat) {
      state.category = d.cat;
      if (parseRoute().name === "home") return go("#/explore");
      return renderScreen();
    }
    if (d.route) {
      const [area, ids] = d.route.split("|");
      return showRoute(area, ids.split(","));
    }
    if (d.cancel) {
      if (confirm(t("cancelConfirm"))) {
        updateBooking(d.cancel, { status: "cancelled" });
        toast(t("toastCancelled"));
      }
      return;
    }
    if (d.approve) {
      updateBooking(d.approve, { status: "confirmed" });
      return toast(t("toastApproved"));
    }
    if (d.visit) {
      updateBooking(d.visit, { status: "visited" });
      return toast(t("toastVisited"));
    }
    if (d.review) return openReview(d.review);
    if (d.go) {
      const dialog = el.closest("dialog");
      if (dialog) dialog.close();
      return go(d.go);
    }
  });

  // 키보드로 카드 · 마커 열기
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = e.target.closest(".tile, .row-card, [data-marker]");
    if (!el || e.target !== el) return;
    e.preventDefault();
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  // 대화상자 바깥(배경) 클릭 시 닫기
  $$("dialog").forEach((dialog) =>
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    })
  );

  // 필터 시트의 선택 상자
  [
    ["#speakSelect", "speak", String],
    ["#priceSelect", "price", Number],
    ["#nearSelect", "near", String],
    ["#sortSelect", "sort", String],
  ].forEach(([sel, key, cast]) =>
    $(sel).addEventListener("change", (e) => {
      state[key] = cast(e.target.value);
      if (key === "near" && state.near) {
        state.sort = "distance";
        $("#sortSelect").value = "distance";
      }
      refreshResults();
    })
  );
  $("#filterDialog").addEventListener("close", refreshResults);

  $("#darkToggle").addEventListener("change", (e) => applyTheme(e.target.checked ? "dark" : "light", true));

  // 예약 폼
  const bookingForm = $("#bookingForm");
  bookingForm.service.addEventListener("change", () => {
    renderSlots();
    renderBookingSummary();
  });
  bookingForm.date.addEventListener("change", renderSlots);
  bookingForm.people.addEventListener("change", renderBookingSummary);
  bookingForm.addEventListener("submit", submitBooking);

  // 리뷰 폼
  $("#reviewForm").addEventListener("click", (e) => {
    const star = e.target.closest("[data-star]");
    if (!star) return;
    reviewScores[star.closest(".star-input").dataset.name] = Number(star.dataset.star);
    renderStarInputs();
  });
  $("#reviewForm").addEventListener("submit", submitReview);

  // 스플래시
  $("#splashStart").addEventListener("click", () => {
    $("#splash").classList.add("leaving");
    try {
      sessionStorage.setItem("kbeautySplash", "1");
    } catch {}
    setTimeout(() => ($("#splash").hidden = true), 350);
  });
}

// 스플래시: 이 탭에서 처음 열 때 한 번 (언어 선택 + 시작하기)
function setupSplash() {
  let seen = false;
  try {
    seen = sessionStorage.getItem("kbeautySplash") === "1";
  } catch {}
  if (seen || (location.hash && location.hash !== "#/home")) {
    $("#splash").hidden = true;
    return;
  }
  $("#splashArt").innerHTML = skylineArt("splash");
  $("#splashLangs").innerHTML = LANGS.map(
    (l) => `<button class="seg light ${l.code === state.lang ? "on" : ""}" type="button" data-lang="${l.code}">${l.label}</button>`
  ).join("");
}

applyTheme(storage.get(KEYS.theme, "light"), false);
setupEvents();
setupSplash();
renderAll();
