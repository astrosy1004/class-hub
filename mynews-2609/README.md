# 나의 뉴스 모음 (mynews-2609)

RSS 17개를 6개 카테고리로 묶어 **2시간마다** 자동 수집해 한 화면에 보여주고,
**매일 오전 9시(KST)** 에 카테고리별 요약을 **디스코드**로 보냅니다.

🔗 https://astrosy1004.github.io/class-hub/mynews-2609/

## 수집 대상

| 카테고리 | 출처 |
|---|---|
| 🤖 인공지능 | 아주경제 AI · 아이뉴스24 IT |
| 🏛️ 공공지원사업 | 중소벤처기업부 사업공고 · 지원금가이드(신규/창업/취업) · Google 뉴스 지원사업 |
| 🤝 사회공헌 | 뉴시스 사회 · 행정안전부 보도자료 |
| 📈 경제 | 뉴시스 경제/금융/산업 · 경향신문 경제 · 아이뉴스24 경제 · 아주경제 경제 |
| 💵 수익화 / 크리에이터 이코노미 | Tubefilter |
| ☀️ 날씨 | 기상청 1시간 동네예보(서울) |

카테고리 안의 여러 출처를 최신순으로 합치고 중복 제목은 하나만 남깁니다.
출처별 상한(`perFeed`)이 있어 기사 수가 많은 곳이 카드를 독식하지 않습니다.

전체 정의는 `scripts/feeds.js` 한 곳에 있습니다. **여기만 고치면 화면과 디스코드 요약이 함께 바뀝니다.**

### 피드에 대한 메모

- 기상청 `plus/rss.jsp` 는 RSS가 아니라 RSS 목록 안내 HTML 페이지여서 실제 동작하는 동네예보 RSS로 대체했습니다.
  다른 지역을 보려면 `zone` 값을 법정동코드로 바꾸세요. (부산 `2600000000`, 대전 `3000000000`)
- 기업마당 API 연계는 서비스키 발급이 필요해 넣지 않았습니다. 키를 준비하시면 `scripts/lib.js` 에 JSON 수집기를 추가하면 됩니다.
- 언론사마다 형식이 달라 CDATA, 이중 인코딩된 엔티티(`&amp;apos;`),
  비표준 날짜(`20260904130656`, `FRI, 04 SEP 2026 18:00:00 KST`)를 모두 처리합니다.

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

## 디스코드 알림 설정

저장소 Secret `DISCORD_WEBHOOK_URL` 에 디스코드 웹후크 URL이 등록돼 있어야 합니다.
(디스코드 채널 편집 → 연동 → 웹후크 → URL 복사 → GitHub Settings → Secrets and variables → Actions)

즉시 테스트: **Actions 탭 → `뉴스 요약 디스코드 전송` → Run workflow**

## 구성

```
mynews-2609/
  index.html            화면
  assets/styles.css     CSS 변수 + 다크 모드
  assets/app.js         상단 CONFIG + 렌더링
  data/news.js          자동 생성되는 뉴스 데이터
  scripts/feeds.js      수집 대상 정의
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
- 한 출처가 실패해도 나머지는 그대로 수집되며, 카드 머리말과 디스코드 임베드 하단에 실패한 출처가 표시됩니다.
- 다크 모드 설정은 `localStorage` 의 `mynewsTheme` 키에 저장됩니다.
