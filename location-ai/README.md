# location-ai — 자리잡소 AI 전문가 의견 중계 함수 (Vercel)

자리잡소 앱(`location/`, Firebase Hosting)의 **AI 의견 → 전문가 의견 받기** 버튼이 부르는 작은 서버입니다.
OpenRouter 키는 이 서버의 환경변수에만 두고, 앱(브라우저)에는 넣지 않습니다.

```
앱(분석 요약: 동 · 업종 · 점수 · 근거 수치 · 기준일) → POST /api/opinion → OpenRouter LLM → 숫자 검증 → 앱
```

## 구성

| 파일 | 내용 |
|---|---|
| `api/opinion.js` | Vercel 함수 (`/api/opinion`). `lib/core.js` 를 감싸기만 함 |
| `lib/core.js` | 순수 함수 `handle()`: 허용 출처(CORS) · 호출 제한 · 입력 정리 · 프롬프트 · OpenRouter 호출(시간 제한 20초 · 답변 길이 700토큰) |
| `lib/guard.js` | 안전장치: 답변 숫자가 모두 입력에 있던 숫자인지, 단정 표현이 없는지 확인. 앱의 `location/js/ai-guard.js` 와 같은 규칙 |
| `test.mjs` | 모의 응답으로 시험 (실제 키 · 호출 없음): `node test.mjs` |

## 환경변수 (Vercel 프로젝트 → Settings → Environment Variables)

| 이름 | 필수 | 값 |
|---|---|---|
| `OPENROUTER_API_KEY` | ✔ | OpenRouter 키 (채팅 · 코드에 쓰지 말고 이 칸에만) |
| `OPENROUTER_MODEL` | | 기본 `openai/gpt-4o-mini`. 예: `anthropic/claude-3.5-haiku` |
| `ALLOWED_ORIGINS` | | 기본 `https://location-app-sykim.web.app,https://location-app-sykim.firebaseapp.com,http://localhost:5530` |
| `RATE_LIMIT_PER_HOUR` | | 한 IP 당 시간당 호출 수. 기본 20 (서버 인스턴스마다 따로 세는 대략적인 제한) |

## 연결 순서

1. Vercel → Add New → Project → GitHub `class-hub` 저장소 가져오기 → **Root Directory 를 `location-ai`** 로 지정 (Framework: Other) → Deploy
2. Settings → Environment Variables 에 위 표의 값 입력 → Deployments 에서 Redeploy
3. 배포 주소 확인: `https://<프로젝트>.vercel.app/api/opinion`
4. `location/js/config.js` 의 `AI_URL` 에 3번 주소를 넣고 Firebase Hosting 배포 → AI 의견 화면에 버튼이 나타납니다
5. OpenRouter 대시보드에서 키의 월 사용 한도(Credit limit)를 걸어 두기를 권합니다

## 응답

- 200 `{ opinion: { strengths[], cautions[], strategies[], overall }, model, asOf }`
- 403 허용되지 않은 출처 · 429 호출 제한 · 503 키 미설정 · 504 시간 초과 · 502 OpenRouter 오류
- 422 답변에 입력에 없는 숫자나 단정 표현 → 앱은 AI 의견을 버리고 규칙 기반 의견만 보여 줍니다
