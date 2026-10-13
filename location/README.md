# 우리 동네 AI 입지 분석

지역 + 업종("연남동 카페")을 입력하면 생활인구 · 고객층 · 경쟁 점포를 지도와 그래프로 보여주고, 입지 적합도(0~100)와 AI 컨설턴트 의견을 제공하는 웹앱.
순수 HTML · CSS · 바닐라 JS(`<script type="module">`, 빌드 도구 없음) + Kakao 지도 SDK + Firebase(Hosting · Firestore · Auth) + GitHub Actions 수집기.
기획: `development-plan/plan.html` · 화면: `development-plan/mockup.html`

## 진행 상황

| 단계 | 내용 | 상태 |
|---|---|---|
| 1 | 자료 연결: Kakao 검색 · 경쟁 점포 ✅(실제 호출 확인), 생활인구 수집기(Actions → Firestore) | ✅ 코드 완료 · 수집기는 Firestore 설정 후 첫 실행 필요 |
| 2 | 검색어 표준화 (행정동 · 업종 · 별칭) | ✅ |
| 3 | 화면 뼈대 (#주소 전환, 하단 탭 4개) | ✅ |
| 4 | 지도 · 그래프 (분석 · 추이 · 비교) | ✅ (Kakao 지도는 키 필요, 키 없으면 예시 지도) |
| 5 | 점수 엔진 · AI 컨설턴트 문장 | ✅ 초안 (규칙 숫자는 상담사 검수 전) |
| 6 | 구글 로그인 · 후보지 계정 저장 | ⏳ 지금은 이 기기(localStorage)에만 저장 |
| 7 | Firebase 배포 · 보안 규칙 | ⏳ 프로젝트 생성 후 |

## 실행

ES 모듈을 쓰므로 로컬 서버로 엽니다.

```bash
py -m http.server 5530 --bind 127.0.0.1
```

- 앱: http://localhost:5530 · 엔진 검증: http://localhost:5530/check.html (34개 항목)
- **키가 없으면 "개발용 예시 모드"**: 생활인구는 자치구 단위 예시 표본(`data/sample-gu.json`), 지도와 점포는 예시입니다. 화면 위에 그 사실이 표시됩니다.

## API 연결 (키 받은 뒤)

### 1) Kakao 지도 · 검색 (브라우저)
1. Kakao Developers 에서 앱 만들고 **JavaScript 키** 발급, 플랫폼(웹)에 `http://localhost:5530` 과 배포 주소 등록
2. `js/config.js` 의 `KAKAO_JS_KEY` 에 입력 → 장소 검색 · 행정동 확인 · 반경 내 점포 검색 · 실제 지도 사용
   - 카테고리 검색은 한 번에 최대 45곳(15 × 3쪽)이라, 꽉 찬 칸은 반경을 4칸씩 나눠 다시 검색해 합칩니다(`js/split-search.js`, 최대 2단계 · 검색 30회). 한도에 닿으면 "N곳 이상"으로 표시하며, 번화가는 요청 수가 수십 회까지 늘 수 있어 Kakao 호출 한도를 확인하세요.
   - 경쟁 점수 구간표(`area-data.js` 의 `bands`)는 카페만 서울 번화가 10곳 표본으로 맞췄고, 나머지 업종은 표본 조사가 더 필요합니다.

### 2) 서울 생활인구 (GitHub Actions 수집기 → Firestore → 브라우저)
서비스: **[내국인] 행정동별 서울 생활인구(250m)** — `Spop250mLocalResdDong` (서울 열린데이터광장 인증키 필요).
서버(Cloud Functions · Blaze 요금제) 없이, 매일 GitHub Actions 가 서울 API 를 호출해 Firestore 에 동별 요약을 쌓고 브라우저가 그 문서 1건을 읽습니다.

확인된 규격(probe 결과)
- 요청: `/{키}/json/Spop250mLocalResdDong/{시작}/{끝}/{일자 YYYYMMDD}/{시간 00~23}`
- 응답 한 행 = 일자(`YMD`) · 시간(`TT`) · 행정동(`H_DNG_CD`) 한 곳, 합계 `SPOP`, 남 `M00~M70` · 여 `F00~F70`(14구간)
- **행정동 코드 필터는 최근 자료에서 동작하지 않습니다** (10월 자료의 코드에 공백이 붙어 있어 어떤 형태로도 안 걸림). 날짜 · 시간 필터만 동작하므로 `(일자, 시간)` 한 번에 전 행정동(약 427건)을 받아 직접 고릅니다.
- Kakao 행정동 코드(10자리)의 **앞 8자리**가 서울 자료의 `H_DNG_CD`입니다 (연남동 `11440710` 확인).
- API는 최근 약 2개월 자료만 제공 → 매일 수집해 두지 않으면 이전 자료를 잃습니다.

구조
| 위치 | 내용 |
|---|---|
| `collector/collect.js` | 수집기. 하루 24회 호출로 전 행정동을 받아 일별 요약을 합치고 동별 요약을 저장 (`--days N` 과거 채우기, `--dry` 쓰기 없이 시험) |
| `.github/workflows/location-collect.yml` (저장소 루트) | 매일 07:00(KST) 자동 실행, 수동 실행(`workflow_dispatch`)으로 일수 지정 가능 |
| Firestore `livingPopDays/{동8}` | 동별 일별 요약(최대 400일, 수집기 전용 — 클라이언트 접근 불가) |
| Firestore `livingPop/{동8}` | 화면용 요약. 보안 규칙으로 누구나 **1건 읽기만** 가능, 목록·쓰기는 불가 |
| Firestore `livingPopMeta/state` | 수집이 끝난 날짜 목록 |

설정 순서 (최초 1회)
1. **Firestore 만들기**: [콘솔](https://console.firebase.google.com/project/location-app-sykim/firestore) → 데이터베이스 만들기 → `asia-northeast3 (서울)` → 프로덕션 모드
2. **보안 규칙 배포**: `firebase deploy --only firestore:rules`
3. **서비스 계정 키 발급**: 콘솔 → 프로젝트 설정(톱니) → 서비스 계정 → **새 비공개 키 생성** → JSON 파일 다운로드 (이 파일은 저장소에 올리지 말고, 다음 단계 후 삭제)
4. **GitHub Secrets 등록**: 저장소 Settings → Secrets and variables → Actions
   - `SEOUL_API_KEY` = 서울 열린데이터광장 인증키
   - `FIREBASE_SERVICE_ACCOUNT` = 3번 JSON 파일의 **내용 전체**
5. **첫 수집**: GitHub → Actions → "생활인구 수집" → Run workflow → `days` 에 `60` 입력 (과거 채우기 겸 첫 실행)
6. `js/config.js` 의 `LIVE_POP` 을 `true` 로 바꾸면 동 단위 실제 자료를 씁니다. (요약이 없는 동은 오류 안내 — 예시로 몰래 바꾸지 않음)

이 PC 에서 시험하려면: `set SEOUL_API_KEY=키` 후 `node collector/collect.js --dry --days 2` (Firestore 에 쓰지 않고 요약만 출력).
키 · 규격 확인용: `node scripts/probe-seoul.js` (컬럼), `scan 날짜 시간 행정동` (인자 형태), `find 날짜 시간 구코드` (코드 목록).

## 파일 구성

```
location/
├─ index.html · css/style.css        화면 7개 뼈대 + 하단 탭, 블루 테마(라이트·다크)
├─ js/
│  ├─ main.js        #주소 전환 · 검색 · 이벤트
│  ├─ ui.js          화면 그리기 (HTML 문자열)
│  ├─ charts.js      SVG 그래프 (꺾은선 · 막대 · 누적막대 · 히트맵 · 도넛 · 레이더)
│  ├─ analysis.js    장소+업종 → 자료 조회 → 지표 → 점수 → 리포트
│  ├─ place.js       검색어 해석 · 행정동 확인
│  ├─ fetchers.js    조회 시점 호출 (생활인구 프록시 · Kakao 점포) + 예시 모드
│  ├─ kmap.js        Kakao SDK 로딩 · 검색 · 지도 · 예시 지도
│  ├─ metrics.js     지표 계산
│  ├─ score.js · score-rules.js   적합도 엔진 · 규칙표 (비중 · 등급 · 문구 기준)
│  ├─ report.js      AI 컨설턴트 문장 (규칙 템플릿, 문장마다 근거)
│  ├─ area-data.js   행정동 · 업종 · 별칭 · 업종별 목표 고객/경쟁 구간표
│  ├─ store.js       localStorage
│  ├─ config.js      키 · 주소 설정
│  └─ check.js       검증 페이지 (배포 제외)
├─ data/sample-gu.json              개발용 표본 (자치구 단위) + 점수 기준 분포
├─ collector/                       생활인구 수집기 (Node 20: collect · seoul · aggregate) — GitHub Actions 에서 실행
├─ scripts/build_sample.py · probe-seoul.js
├─ firebase.json · firestore.rules
└─ check.html
```

## 현재 위치 · 세부 업종

- **현재 위치로 찾기**: 앱을 열면(설정이 켜져 있을 때) 브라우저 위치 권한을 요청하고, 지금 있는 행정동을 바로 분석해 지도를 보여줍니다. 홈의 "📍 현재 위치에서 찾기" 버튼으로도 실행하고, "내 분석 → 시작할 때 현재 위치로 검색"에서 끌 수 있습니다. 위치는 이 기기에서만 쓰고 저장하지 않으며, 행정동 확인을 위해 **좌표가 Kakao 지도 서비스에 전달**됩니다. 권한을 거부했거나 위치를 못 얻으면 안내 후 지역 검색으로 넘어갑니다. (위치 기능은 https 또는 localhost 에서만 동작)
- **세부 업종**: 업종 칩 오른쪽 "＋ 세부 업종" 메뉴에서 한식 · 중식 · 일식 · 양식 · 분식 · 치킨 · 베이커리 · 미용실 · 헬스장 · 약국 · 세탁소 · 학원 · 부동산 · 노래방 · PC방을 고르거나, **직접 입력**(예: 마라탕)할 수 있습니다. 약국 · 학원 · 부동산은 Kakao 카테고리로, 나머지는 키워드로 검색해 이름이 비슷한 다른 장소가 섞일 수 있습니다. 직접 입력 업종은 일반 고객 구성으로 계산합니다. **세부 업종의 목표 고객 · 영업 시간 · 경쟁 구간표는 모두 초안**입니다 (`js/area-data.js`).
- 세부 업종 · 직접 입력의 동 단위 기준 분포는 수집기를 `--days 0` 으로 한 번 다시 실행해야 만들어집니다 (그 전에는 자치구 표본 분포로 계산하고 화면에 알려 줍니다).

## 점수

5항목 가중합(고객 일치 25 · 유동인구 20 · 경쟁 20 · 임대료 20 · 성장성 15). 자료가 없는 항목은 점수에서 빼고 나머지 비중을 다시 나눕니다 (임대료는 아직 자료가 없어 4개 항목 기준).
등급: 85↑ 추천 · 70~84 조건부 추천 · 55~69 신중 검토 · 55↓ 재검토. **규칙 숫자는 초안**이며 상담사 검수로 `score-rules.js` · `area-data.js` 를 보정해야 합니다.

## 알려진 한계

- 동 단위 생활인구 · 임대료 · Kakao 호출은 키 연결 후 실제 확인이 필요합니다 (아직 실제 호출로 검증하지 않았습니다).
- 점수의 규모(유동인구) 항목은 동 단위 기준 분포(`baseline.json`)가 준비되기 전까지 동 단위 응답에서는 제외됩니다.
- 로그인 · 계정 저장(6단계), 임대료, PDF 전용 서식(현재는 브라우저 인쇄)은 미구현입니다.
