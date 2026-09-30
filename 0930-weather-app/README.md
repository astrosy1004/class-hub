# 날씨 검색 웹앱 (2단계)

도시 이름을 검색하면 현재 날씨와 5일 예보를 보여주고, 구글로 로그인할 수 있는 웹앱입니다.
전체 4단계(1. 날씨 웹앱 → 2. 구글 로그인 → 3. 즐겨찾기 저장 → 4. 배포) 중 2단계까지 진행했습니다.
Firestore 저장·배포는 아직 포함하지 않습니다.

## 실행 방법

반드시 로컬 서버로 실행해야 합니다 (2단계에서 구글 로그인이 `file://`에서 동작하지 않기 때문에,
이번 단계도 미리 로컬 서버 실행에 맞춰 만들었습니다).

```bash
# macOS/Linux
python3 -m http.server 5500 --bind 127.0.0.1

# Windows
py -m http.server 5500 --bind 127.0.0.1
# py가 없으면:
python -m http.server 5500 --bind 127.0.0.1
```

브라우저에서 `http://localhost:5500` 접속.
`--bind 127.0.0.1`은 같은 와이파이의 다른 사람이 이 폴더를 열어 보지 못하게 막습니다.

파일을 더블클릭해서(`file://`) 열지 마세요.

## 사용법

1. 검색창에 도시 이름을 입력하고 Enter 또는 검색 버튼을 누릅니다.
2. 검색창 아래 빠른 버튼(서울특별시·부산광역시·대구광역시·광주광역시·제주시)을 눌러도 됩니다.
3. 검색 결과가 여러 건이면 목록에서 `이름 · 도(admin1) · 국가`를 보고 원하는 도시를 고릅니다.
4. 현재 날씨(기온·체감 기온·상태·습도·바람)와 5일 예보(날짜·요일·상태·최고/최저 기온)가 표시됩니다.
5. 마지막으로 본 도시는 localStorage에 저장되어, 새로고침해도 다시 보여줍니다.

## 파일 구성

```
weather-app/
├─ index.html          화면 뼈대 (검색창, 빠른 버튼, 날씨 표시 영역, 로그인 자리)
├─ css/style.css        스타일 (:root CSS 변수, 375px 반응형)
├─ js/
│  ├─ main.js           화면 흐름 조율 (이벤트 바인딩, localStorage 저장/복원, 로그인 연결)
│  ├─ weather-api.js    Open-Meteo 호출 전담. 날씨 서비스를 바꾸면 이 파일만 고치면 됨
│  ├─ weather-codes.js  WMO 날씨 코드 → 한글 설명 + 이모지 매핑
│  ├─ ui.js             DOM 렌더링 전담
│  ├─ firebase.js       Firebase SDK(CDN) import + 설정값. SDK를 불러오는 유일한 파일
│  └─ auth.js           로그인 · 로그아웃 · 로그인 상태 구독
└─ README.md
```

3단계에서 `js/favorites.js`가 추가될 예정입니다. `<script type="module">`로 JS를 불러오며, 이 폴더는
이 저장소의 다른 사이트(`bookmark/` 등)가 쓰는 "단일 `assets/app.js` + `file://`" 패턴 대신 위 구조를 씁니다.

## Firebase 콘솔 설정

1. [Firebase 콘솔](https://console.firebase.google.com/) → 프로젝트(`weath-app-sykim`) → **Authentication** → "시작하기"
2. **로그인 방법** 탭 → **Google** 추가 → 사용 설정 → 프로젝트 지원 이메일 선택 → 저장
3. **Authentication → Settings → 승인된 도메인**에 `localhost`가 기본으로 있는지 확인하고,
   없으면 `127.0.0.1`도 추가 (이 앱은 `localhost`와 `127.0.0.1` 둘 다에서 열 수 있어야 함)

## 로그인 사용법

- 머리글 오른쪽 "Google로 로그인" 버튼을 누르면 구글 계정 선택 팝업이 뜹니다.
- 로그인하면 그 자리에 프로필 사진 · 이름 · 로그아웃 버튼이 나옵니다.
- 새로고침해도 로그인 상태가 유지됩니다 (Firebase가 자체적으로 세션을 기억합니다).
- Firebase를 못 불러온 경우(`gstatic.com` 차단 등) "로그인을 불러오지 못했습니다"가 표시되고,
  날씨 검색 기능은 그대로 동작합니다.

## 사용한 API (Open-Meteo, API 키 불필요)

- 지명 검색: `GET https://geocoding-api.open-meteo.com/v1/search?name={검색어}&language=ko&count=10`
  - 0건이면 응답에 `results` 키 자체가 없습니다. `data.results ?? []`로 처리합니다.
  - 0건이면 검색어 뒤에 `특별시` → `광역시` → `시`를 차례로 붙여 재검색합니다 (`서울` → `서울특별시`).
- 날씨: `GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`

## 알려진 한계

- Open-Meteo 지명 검색은 한국 도시의 줄인 이름(`부산` 등)을 엉뚱한 마을로 찾을 수 있습니다.
  이런 경우 자동으로 고치지 않고, 목록에 도(admin1)를 같이 보여줘 사용자가 직접 고르게 했습니다.
  정확한 결과를 원하면 전체 행정구역명(`부산광역시`)이나 영어(`Busan`)로 검색하세요.
- 오프라인 등 네트워크 오류 시 오류 문구만 보여주고 재시도 버튼은 없습니다 (검색을 다시 시도하면 됩니다).
- 다크 모드는 이번 단계 범위에 없어 구현하지 않았습니다.
- 로그인은 구글 팝업 방식만 지원합니다. 즐겨찾기 저장(Firestore)은 3단계에서 붙습니다.

## 완료 기준 체크리스트

### 1단계 (날씨)
- [ ] `http://localhost:5500`으로 열면 검색창이 보이고 콘솔에 빨간 오류가 없다
- [ ] `서울`을 검색해도 서울특별시 날씨가 나온다
- [ ] `Gwangju`를 검색하면 광주광역시와 경기도 광주시를 구분해 고를 수 있다
- [ ] 현재 기온·체감 기온·날씨 상태·습도·바람이 보인다
- [ ] 5일 예보가 날짜·요일과 함께 보이고 첫 줄은 "오늘"이다
- [ ] `asdfgh`를 검색하면 "찾을 수 없습니다" 안내가 나온다
- [ ] 개발자 도구 Network 탭을 Offline으로 바꾸고 검색하면 오류 문구가 나오고 화면이 깨지지 않는다
- [ ] 새로고침하면 마지막으로 본 도시 날씨가 바로 나온다
- [ ] 개발자 도구에서 375px 폭으로 줄여도 가로 스크롤이 생기지 않는다

### 2단계 (로그인)
- [ ] 로그인하지 않은 상태에서 1단계 완료 기준이 그대로 통과한다
- [ ] "Google로 로그인"을 누르면 구글 계정 선택 팝업이 뜨고, 고르면 머리글에 사진과 이름이 나온다
- [ ] 새로고침해도 로그인 상태가 유지된다
- [ ] 로그아웃하면 다시 "Google로 로그인" 버튼이 나온다
- [ ] 팝업을 그냥 닫으면 오류 안내 없이 원래 상태로 돌아간다
- [ ] Firebase 콘솔 → Authentication → 사용자 목록에 내 계정이 보인다
- [ ] `http://localhost:5500`과 `http://127.0.0.1:5500` 두 주소 모두에서 로그인이 된다
- [ ] 로그인·로그아웃하는 동안 콘솔에 빨간 오류가 없다 (`Cross-Origin-Opener-Policy` 경고는 제외)
- [ ] 개발자 도구 Network 탭에서 `gstatic.com`을 막고 새로고침해도 날씨 검색은 된다
