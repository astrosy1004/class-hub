# 나의 뉴스 모음 (mynews-2609)

RSS 3종을 **2시간마다** 자동 수집해 한 화면에 보여주고, **매일 오전 9시(KST)** 에 요약을 **디스코드**로 보냅니다.

🔗 https://astrosy1004.github.io/class-hub/mynews-2609/

## 수집 대상

| | 분류 | 피드 |
|---|---|---|
| 💵 | 수익화 / 크리에이터 이코노미 | `https://www.tubefilter.com/feed/` |
| ☀️ | 날씨 (서울 1시간 동네예보) | `https://www.weather.go.kr/w/rss/dfs/hr1-forecast.do?zone=1100000000` |
| 🏛️ | 정부지원정책 (지원사업 공고·모집) | Google 뉴스 검색 RSS |

> 요청하신 `https://www.weather.go.kr/plus/rss.jsp` 는 RSS가 아니라 **RSS 목록을 안내하는 HTML 페이지**여서
> 실제 동작하는 기상청 동네예보 RSS로 대체했습니다. 다른 지역을 보려면 `scripts/feeds.js` 의 `zone` 값을
> 해당 지역 법정동코드로 바꾸세요. (예: 부산 `2600000000`, 대전 `3000000000`)

## 동작 구조

브라우저에서 외부 RSS를 직접 부르면 CORS로 막히므로, 수집은 GitHub Actions가 대신합니다.

```
GitHub Actions (2시간마다)          GitHub Actions (매일 09시 KST)
  scripts/collect.js                  scripts/digest.js
        ↓                                    ↓
  data/news.js 커밋                    디스코드 웹훅 전송
        ↓
  index.html + assets/app.js  ←  <script src="./data/news.js">
```

- `data/news.js` 는 자동 생성 파일입니다. 직접 수정하지 마세요.
- `fetch` 대신 `<script src>` 로 데이터를 읽으므로 `index.html` 을 **더블클릭해서 열어도** 동작합니다.

## 디스코드 알림 설정 (최초 1회 필요)

1. 디스코드에서 알림 받을 채널 → **채널 편집 → 연동 → 웹후크 → 새 웹후크 → 웹후크 URL 복사**
2. GitHub 저장소 → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `DISCORD_WEBHOOK_URL`
   - Secret: 복사한 웹후크 URL
3. **Actions** 탭 → `뉴스 요약 디스코드 전송` → **Run workflow** 로 즉시 테스트

시크릿을 넣기 전까지 09시 작업은 실패로 표시됩니다. (화면 수집은 시크릿 없이도 잘 동작합니다.)

## 구성

```
mynews-2609/
  index.html            화면
  assets/styles.css     CSS 변수 + 다크 모드
  assets/app.js         상단 CONFIG + 렌더링
  data/news.js          자동 생성되는 뉴스 데이터
  scripts/feeds.js      수집 대상 정의 (여기만 고치면 화면·요약 모두 반영)
  scripts/lib.js        RSS 수집·파싱 공통 로직 (외부 패키지 없음)
  scripts/collect.js    2시간 수집 → data/news.js
  scripts/digest.js     09시 요약 → 디스코드
.github/workflows/
  mynews-collect.yml    cron '0 */2 * * *'
  mynews-digest.yml     cron '0 0 * * *' (= 09:00 KST)
```

## 로컬 확인

```bash
node mynews-2609/scripts/collect.js       # 데이터 갱신 (Node 20+)
node mynews-2609/scripts/digest.js --dry  # 디스코드로 보낼 내용만 미리 출력
```

그 다음 `index.html` 을 브라우저로 엽니다.

## 알아둘 점

- GitHub Actions의 cron은 **UTC 기준**이며, 서버 혼잡 시 수 분~수십 분 지연될 수 있습니다.
- 공개 저장소는 60일간 커밋이 없으면 예약 워크플로가 자동 중지됩니다. (Actions 탭에서 다시 켜면 됩니다.)
- 다크 모드 설정은 `localStorage` 의 `mynewsTheme` 키에 저장됩니다.
