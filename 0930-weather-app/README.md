# 현장 날씨 안전도우미

지역 날씨를 조회하고, 날씨 상황에 맞는 **공사 현장 안전수칙**을 안내해 사고를 예방하는 웹앱입니다.
(이전 "세계 날씨 검색" 앱을 바탕으로 만들었고, 세계지도 기능은 뺐습니다.)

**배포 주소**: https://weath-app-sykim.web.app

## 화면 구성

주소 `#` 뒤로 화면을 바꿉니다. 휴대폰 뒤로가기 버튼이 그대로 동작합니다. 아래 탭바(홈·날씨·안전수칙·알림·공유)와 오른쪽 위 ≡ 메뉴로 이동합니다.

디자인은 원티드(wanted.co.kr) 모바일 화면 스타일을 참고했습니다: 흰 배경, 굵은 검정 제목, 블루 포인트(`#3366ff`),
Pretendard 글꼴(jsDelivr CDN), AI 질문 박스 모양의 검색창, 4칸 빠른 메뉴, 가로로 넘기는 카드, 하단 탭바.
아이콘은 이모지 대신 `js/icons.js`에 직접 그린 SVG(선 아이콘 + 그라디언트 일러스트)를 씁니다.

| 화면 | 주소 | 내용 |
|---|---|---|
| 1. 메인 | `#home` | 지역명 검색, 현재 위치로 조회, 빠른 메뉴, 즐겨찾기 현장, 최근 조회 지역, 지금 전국 현장 날씨(7개 도시 카드), 날씨별 안전수칙 가이드 배너 |
| 2. 날씨 정보 | `#weather` | 현재 날씨·기온·체감온도·미세먼지 등급, 습도·강수확률·풍속(m/s), 시간별 6시간, 주간 7일, 오늘 주의할 기상, ☆ 즐겨찾기 |
| 3. 안전수칙 | `#rules` | 오늘 날씨 요약, 분류 탭(전체·더위·추위·강수·강풍·미세먼지), 오늘의 주요 안전수칙 카드 |
| 4. 상세 안전수칙 | `#rule/heat` 등 | 분류별 설명, "이런 위험이 있어요", 번호 매긴 주요 안전수칙, 참고 기준 |
| 5. 알림 · 공유 | `#alerts` | 위험 기상 알림 켜기/분류 선택, 링크 복사, QR코드, 카카오톡 등 공유, 공유 미리보기 |

## 실행 방법

반드시 로컬 서버로 실행해야 합니다 (`<script type="module">`, 구글 로그인, 위치 확인이 `file://`에서 동작하지 않음).

```bash
# Windows
py -m http.server 5500 --bind 127.0.0.1
# py가 없으면:
python -m http.server 5500 --bind 127.0.0.1
```

브라우저에서 `http://localhost:5500` 접속. `--bind 127.0.0.1`은 같은 와이파이의 다른 사람이 이 폴더를 열어 보지 못하게 막습니다.

## 위험 판정 기준 (`js/safety-rules.js`)

오늘(현재값 + 오늘 하루 예보)으로 분류별 단계를 정합니다. 기준값과 수칙 문구는 모두 이 파일 위쪽 데이터에 있어서, 내용 수정이 코드 수정이 되지 않습니다.

| 분류 | 기준 | 단계 |
|---|---|---|
| 더위 | 체감온도 최고 | 31℃ 관심 · 33℃ 주의 · 35℃ 경고 · 38℃ 위험 (고용노동부 온열질환 예방 가이드) |
| 추위 | 최저기온 | 0℃ 관심(결빙) · -12℃ 주의 · -15℃ 경고 (기상청 한파특보) |
| 강수 | 강수량·강수확률·날씨코드 | 1mm↑ 또는 확률 60%↑ 관심 · 30mm 주의 · 70mm 경고, 뇌우는 최소 주의 |
| 강풍 | 순간풍속·평균풍속 최고 | 순간 10m/s↑ 주의(타워크레인 설치·해체 중지 기준) · 순간 20m/s↑ 또는 평균 14m/s↑ 경고 |
| 미세먼지 | 오늘 최고 PM10·PM2.5 | 나쁨(PM10 81↑·PM2.5 36↑) 주의 · 매우나쁨(151↑·76↑) 경고 (환경부 예보 등급) |

위험이 없으면 "기본 안전수칙(맑음/보통)"을 보여줍니다. 안전수칙은 참고용이며 현장 안전관리 책임자의 지시가 우선입니다.

## 파일 구성

```
0930-weather-app/
├─ index.html          화면 5개의 뼈대 (section data-view="...")
├─ css/style.css        스타일 (:root CSS 변수, 위험 단계 색 --lv1~--lv4, 375px 반응형)
├─ js/
│  ├─ main.js           화면 전환(#주소) · 조회 흐름 · 즐겨찾기 · 알림 · 공유 · 로그인 연결
│  ├─ safety-rules.js   안전수칙 데이터 + 위험 단계 판정 (문구·기준값은 여기만 고치면 됨)
│  ├─ weather-api.js    날씨·미세먼지·지역 검색·위치 이름 API 호출 전담
│  ├─ weather-codes.js  WMO 날씨 코드 → 한글 설명 + 이모지
│  ├─ ui.js             DOM 렌더링 전담
│  ├─ icons.js          SVG 아이콘 (선 아이콘 LINE + 그라디언트 일러스트 ART, 그라디언트는 index.html <defs>)
│  ├─ store.js          localStorage 저장 (마지막 지역·최근 조회·즐겨찾기·알림 설정)
│  ├─ share.js          공유 링크·복사·QR코드·휴대폰 공유 창
│  ├─ firebase.js       Firebase SDK(CDN) import + 설정값
│  ├─ auth.js           로그인 · 로그아웃 · 로그인 상태 구독
│  └─ history.js        로그인 사용자의 최근 조회 (Firestore users/{uid}/history)
├─ firestore.rules, firebase.json, .firebaserc
└─ README.md
```

## 저장되는 곳

- **이 기기(localStorage, 키 `siteSafety:*`)**: 마지막 지역, 최근 조회 5개, 즐겨찾기 현장 10개, 알림 설정
- **내 계정(Firestore)**: 로그인하면 최근 조회 지역이 `users/{uid}/history`에 5개까지 남아 다른 기기에서도 보입니다.

## 공유

- 공유 링크: `https://weath-app-sykim.web.app/?lat=..&lon=..&name=지역이름#rules` — 받는 사람이 열면 그 지역을 조회해 안전수칙 화면을 바로 보여줍니다.
- QR코드: 누를 때만 `qrcode-generator`(jsDelivr CDN)를 불러와 만듭니다. 현장 게시판에 붙여 두기 좋습니다.
- 카카오톡 공유: 휴대폰의 공유 창(Web Share API)을 열어 카카오톡·문자 등으로 보냅니다. 공유 창이 없는 PC에서는 메시지+링크를 복사합니다.

## 위험 기상 알림

- 알림을 켜면 브라우저 알림 권한을 요청합니다. 조회한 지역에 체크한 분류의 **주의 이상** 위험이 있으면 알립니다 (같은 날 같은 단계는 한 번만).
- 화면을 열어 둔 동안 30분마다 날씨를 다시 받아 판정합니다.
- 알림 권한이 없거나 안드로이드 크롬처럼 페이지에서 바로 알림을 못 띄우는 환경에서는 화면 아래 안내 메시지로 대신합니다.

## Firebase 콘솔 설정

1. [Firebase 콘솔](https://console.firebase.google.com/) → 프로젝트(`weath-app-sykim`) → **Authentication** → "시작하기"
2. **로그인 방법** 탭 → **Google** 추가 → 사용 설정 → 프로젝트 지원 이메일 선택 → 저장
3. **Authentication → Settings → 승인된 도메인**에 `localhost`가 기본으로 있는지 확인하고,
   없으면 `127.0.0.1`도 추가 (이 앱은 `localhost`와 `127.0.0.1` 둘 다에서 열 수 있어야 함)

## 로그인 사용법

- 오른쪽 위 ≡ 메뉴 맨 아래 "Google로 로그인" 버튼을 누르면 구글 계정 선택 팝업이 뜹니다.
- 로그인하면 그 자리에 프로필 사진 · 이름 · 로그아웃 버튼이 나오고, 메인 화면 제목이 "최근 조회 지역 (내 계정)"으로 바뀝니다.
- 새로고침해도 로그인 상태가 유지됩니다 (Firebase가 자체적으로 세션을 기억합니다).
- Firebase를 못 불러온 경우(`gstatic.com` 차단 등) "로그인을 불러오지 못했습니다"가 표시되고,
  날씨 검색 기능은 그대로 동작합니다.

## Firestore 최근 검색 기록

- 저장 위치: `users/{uid}/history/{placeId}`. 문서 ID는 Open-Meteo geocoding 결과의 `id`를 그대로
  써서, 같은 도시를 다시 검색해도 문서가 늘지 않고 `viewedAt`만 갱신됩니다 (중복 없이 최신순 정렬).
- 필드: `name`, `admin1`, `country`, `latitude`, `longitude`, `viewedAt`(서버 타임스탬프)
- 저장할 때마다 `viewedAt` 내림차순으로 다시 읽어서 5개를 넘는 만큼(가장 오래된 것부터) 지웁니다.

**보안 규칙** (`firestore.rules`):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

`{document=**}`는 재귀 와일드카드라서 `users/{userId}` 아래 모든 깊이의 문서를 다 매칭합니다.
`users/{userId}/history/{historyId}`도 `document`가 `history/{historyId}`로 묶여서 이 규칙 하나에
그대로 걸리므로, `users/{uid}` 밑에 서브컬렉션(`history` 등)을 추가해도 규칙 파일을 다시 고칠 필요가
없습니다. `request.auth.uid == userId` 조건 덕분에 다른 사람의 `users/{uid}` 경로는 애초에 열리지
않아 다른 계정에는 보이지 않습니다.

```bash
firebase deploy --only firestore:rules   # 규칙만 배포
```

## Firebase Hosting 배포

```bash
npm install -g firebase-tools   # 최초 1회
firebase login                  # 최초 1회, 브라우저에서 구글 계정으로 로그인
firebase deploy --only firestore:rules,hosting  # 이 폴더(weather-app/)에서 실행
```

- `firebase init hosting` 마법사(방향키 메뉴) 대신 `firebase.json`/`.firebaserc`를 직접 작성했습니다.
  기존 프로젝트(`weath-app-sykim`) 사용, 배포 폴더는 이 폴더 자체(`.`), SPA 아님(rewrite 없음),
  GitHub 자동배포 미설정으로 구성했습니다.
- 배포 후 주소: https://weath-app-sykim.web.app (`https://weath-app-sykim.firebaseapp.com`도 같은 사이트)
- 이 두 도메인은 Firebase 프로젝트 생성 시 Authentication 승인된 도메인에 기본 포함되어 있어
  배포된 사이트에서도 별도 설정 없이 구글 로그인이 됩니다.

## 사용한 API (모두 API 키 불필요)

- 날씨: Open-Meteo Forecast (`current`, `hourly`, `daily` 7일, `wind_speed_unit=ms`, `timezone=auto`).
  메인 화면 도시 카드 7개는 좌표를 쉼표로 이어 한 번에 요청합니다 (응답이 같은 순서의 배열).
- 미세먼지: Open-Meteo Air Quality (`pm10`, `pm2_5` 현재값 + 오늘 시간별 최고값)
- 국내 지역 검색: OpenStreetMap Nominatim (`countrycodes=kr`). Open-Meteo 지명 검색은 `강남구`·`분당구`·`해운대구` 같은
  구 단위를 못 찾거나 엉뚱한 곳(충남의 `강남구렁고개`)을 줘서 한글 검색어는 Nominatim을 먼저 씁니다. 실패하면 Open-Meteo로 재시도합니다.
- 해외·영어 지역 검색: Open-Meteo Geocoding
- 현재 위치 이름: BigDataCloud reverse-geocode-client (좌표 → "서울특별시 강남구")

## 알려진 한계

- 알림은 **앱 화면을 열어 둔 동안만** 동작합니다. 앱을 닫아도 오는 푸시 알림은 서버(Firebase Cloud Messaging 등)가 필요해 넣지 않았습니다.
- 카카오톡 공유는 카카오 SDK(앱 키 등록 필요) 대신 휴대폰 공유 창을 씁니다. 카카오톡 전용 말풍선 카드 모양은 나오지 않습니다.
- 기상청 공식 특보가 아니라 Open-Meteo 예보값으로 판정합니다. 실제 특보와 다를 수 있습니다.
- 미세먼지는 Open-Meteo 모델값이라 에어코리아 측정소 값과 다를 수 있습니다.
- 즐겨찾기 현장은 이 기기에만 저장됩니다 (로그인해도 다른 기기와 동기화되지 않음).
- 다크 모드는 구현하지 않았습니다.

## 완료 기준 체크리스트

- [ ] `서울시 강남구`, `성남시 분당구`, `해운대구`를 검색하면 해당 구의 날씨가 나온다
- [ ] "현재 위치로 조회하기"를 누르고 위치를 허용하면 내 구 이름으로 날씨가 나온다
- [ ] 날씨 화면에 현재 날씨·체감온도·미세먼지·습도·강수확률·풍속·시간별·주간 예보가 보인다
- [ ] ☆를 누르면 ★로 바뀌고 메인 화면 "즐겨찾기 현장"에 추가된다 (×로 삭제)
- [ ] 안전수칙 화면에서 탭을 바꾸면 분류별 수칙이 나오고, 카드를 누르면 상세 화면으로 간다
- [ ] 상세 화면에서 "← 목록으로"와 휴대폰 뒤로가기가 모두 동작한다
- [ ] 알림을 켜면 분류 체크박스가 활성화되고 설정이 새로고침 후에도 유지된다
- [ ] 링크 복사 → 새 창에 붙여넣으면 같은 지역의 안전수칙 화면이 열린다
- [ ] QR코드 생성 → 휴대폰 카메라로 찍으면 같은 화면이 열린다
- [ ] 375px 폭에서 가로 스크롤이 생기지 않는다
